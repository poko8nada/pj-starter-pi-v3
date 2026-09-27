#!/usr/bin/env node
/**
 * squash — ひとつのユニットの step コミットを 1 つにまとめ、チケットの `Commit:` を書き換える。
 *
 * 使い方:
 *   node squash.mjs <cycle-dir> <base-hash> <hash>... [run]
 *
 * `run` を最後に置いたときだけ実行する。無ければ乾燥（何も変えず、予定だけ出す）。
 * 実行前に退避のタグを打つので、`git reset --hard squash-backup-…` で戻せる。
 *
 * 実行しない条件（どれも投げる）:
 *   - 作業ツリーが汚れている（未コミットの物があると reset が事故になる）
 *   - 引数の一覧が `base..HEAD` と一致しない
 *   - `HEAD` が一覧の最後でない
 *   - 潰す対象が 0 件
 *
 * 実行後、`<cycle-dir>/tickets/*.md` の `Commit:` の行のハッシュを、古い→新しいで書き換える
 * （`Commit: abc1234（注記）` の注記はそのまま残す）。
 */

import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const USAGE = 'usage: squash.mjs <cycle-dir> <base-hash> <hash>... [run]';

/**
 * git を打つときの環境。`GIT_*` を落とす。
 *
 * フック（lefthook）の中で走ると `GIT_INDEX_FILE` などが載っており、そのまま渡すと
 * `cwd` で指定したリポジトリではなくフックのリポジトリを見てしまう（2026-09-27 に踏んだ）。
 * git は `cwd` と自分の探索で解決させる。`consult/run/run.ts` の `gitEnv` と同じ理由。
 */
export function gitEnv(env = process.env) {
  const cleaned = {};
  for (const [key, value] of Object.entries(env)) {
    if (!key.startsWith('GIT_')) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/** git を打つ。返すのは終了コードと出力だけ（投げない） */
export function makeGit(cwd) {
  return (args) => {
    const result = spawnSync('git', [...args], { cwd, encoding: 'utf8', env: gitEnv() });
    return {
      status: result.status ?? 1,
      stdout: result.stdout ?? '',
      stderr: result.stderr ?? result.error?.message ?? '',
    };
  };
}

/** 終了コード非 0 なら投げる */
function must(run, args, what) {
  const result = run(args);
  if (result.status !== 0) {
    throw new Error(`${what}: ${(result.stderr || result.stdout).trim()}`);
  }
  return result.stdout;
}

/** 引数を読む。知らない形・足りない引数は投げる */
export function parseArgs(argv) {
  if (argv.includes('run') && argv.at(-1) !== 'run') {
    throw new Error(`run は最後に置く\n${USAGE}`);
  }
  const rest = argv.filter((arg) => arg !== 'run');
  if (rest.length < 3) {
    throw new Error(USAGE);
  }
  const [cycleDir, base, first, ...others] = rest;
  return { cycleDir, base, hashes: [first, ...others], run: argv.at(-1) === 'run' };
}

/** `base..HEAD` を古い順に返す */
export function commitsInRange(run, base) {
  const out = must(run, ['log', '--format=%h', `${base}..HEAD`], '一覧が引けない');
  return out
    .trim()
    .split('\n')
    .filter((line) => line !== '')
    .toReversed();
}

/** 予定を組む。何も変えない */
export function planSquash(run, { base, hashes, cycleDir }) {
  const head = must(run, ['rev-parse', '--short', 'HEAD'], 'HEAD が引けない').trim();
  const range = commitsInRange(run, base);
  if (range.length === 0) {
    throw new Error(`潰す対象が 0 件（${base}..HEAD が空）`);
  }
  if (range.join(' ') !== hashes.join(' ')) {
    throw new Error(
      `一覧が base..HEAD と違う\n  base..HEAD: ${range.join(' ')}\n  引数:       ${hashes.join(' ')}`,
    );
  }
  if (head !== hashes.at(-1)) {
    throw new Error(`HEAD（${head}）が一覧の最後（${hashes.at(-1)}）と違う`);
  }
  const subjects = must(run, ['log', '--format=%s', `${base}..HEAD`], '題名が引けない')
    .trim()
    .split('\n')
    .filter((line) => line !== '')
    .toReversed();
  const [first, ...rest] = subjects;
  const message = {
    subject: first,
    body: rest.map((subject) => `- ${subject}`).join('\n'),
  };
  return { range, subjects, message, tickets: planTickets(cycleDir, hashes) };
}

/** どのチケットの `Commit:` を書き換えるか（まだ書き換えない） */
export function planTickets(cycleDir, hashes) {
  const dir = join(cycleDir, 'tickets');
  const wanted = new Set(hashes);
  const targets = [];
  for (const file of readdirSync(dir).filter((name) => name.endsWith('.md'))) {
    const text = readFileSync(join(dir, file), 'utf8');
    for (const [index, line] of text.split('\n').entries()) {
      const match = /^Commit: ([0-9a-f]{7,40})(.*)$/.exec(line);
      if (match !== null && wanted.has(match[1])) {
        targets.push({ file, line: index + 1, from: match[1] });
      }
    }
  }
  return targets;
}

/** チケットの `Commit:` のハッシュを、古い→新しいで書き換える */
export function rewriteTickets(cycleDir, mapping) {
  const dir = join(cycleDir, 'tickets');
  const changes = [];
  for (const file of readdirSync(dir).filter((name) => name.endsWith('.md'))) {
    const path = join(dir, file);
    const text = readFileSync(path, 'utf8');
    const out = text
      .split('\n')
      .map((line) => {
        const match = /^Commit: ([0-9a-f]{7,40})(.*)$/.exec(line);
        if (match === null || !mapping.has(match[1])) {
          return line;
        }
        changes.push({ file, from: match[1], to: mapping.get(match[1]) });
        return `Commit: ${mapping.get(match[1])}${match[2]}`;
      })
      .join('\n');
    if (out !== text) {
      writeFileSync(path, out);
    }
  }
  return changes;
}

/** 退避タグの名前。同じ秒に 2 回走っても衝突しないよう、最後のハッシュを混ぜる */
export function backupTag(hashes, now = new Date()) {
  const stamp = now
    .toISOString()
    .replaceAll(/[-:]/g, '')
    .replace(/\.\d+Z$/, 'Z');
  return `squash-backup-${stamp}-${hashes.at(-1)}`;
}

/**
 * 実行する。予定を組み直し、安全を確かめてから、タグ → reset → 1 コミット → チケットの書き換え。
 * チケットの書き換えはコミットに入れない（記録は次のコミットで入れる）。
 */
export function execute(run, options) {
  const plan = planSquash(run, options);
  const dirty = must(run, ['status', '--porcelain'], '状態が引けない').trim();
  if (dirty !== '') {
    throw new Error(`作業ツリーが汚れている（コミットするか戻してから）\n${dirty}`);
  }
  const tag = backupTag(options.hashes);
  must(run, ['tag', tag], '退避タグが打てない');
  must(run, ['reset', '--soft', options.base], 'reset できない');
  const commit = run(
    plan.message.body === ''
      ? ['commit', '-m', plan.message.subject]
      : ['commit', '-m', plan.message.subject, '-m', plan.message.body],
  );
  if (commit.status !== 0) {
    throw new Error(`コミットできない: ${(commit.stderr || commit.stdout).trim()}`);
  }
  const squash = must(run, ['rev-parse', '--short', 'HEAD'], 'HEAD が引けない').trim();
  const changes = rewriteTickets(
    options.cycleDir,
    new Map(plan.range.map((hash) => [hash, squash])),
  );
  return { tag, squash, changes, plan };
}

/** 予定を人が読む形にする */
export function formatPlan(plan) {
  const lines = [];
  lines.push(`潰す: ${plan.range.join(' ')}（${plan.range.length} 件）`);
  lines.push(`新しいメッセージ: ${plan.message.subject}`);
  if (plan.message.body !== '') {
    lines.push(plan.message.body);
  }
  if (plan.tickets.length === 0) {
    lines.push('書き換えるチケット: なし（まだ空か、古いハッシュが無い）');
  } else {
    lines.push('書き換えるチケット:');
    for (const target of plan.tickets) {
      lines.push(`  ${target.file}:${target.line}: ${target.from} → <新しいハッシュ>`);
    }
  }
  return lines.join('\n');
}

/** 入口。0 は成功、2 は引数の誤り、1 は実行できない */
export function main(argv, cwd = process.cwd()) {
  let options;
  try {
    options = parseArgs(argv);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 2;
  }
  const run = makeGit(cwd);
  try {
    if (!options.run) {
      const plan = planSquash(run, options);
      console.log(formatPlan(plan));
      console.log('(乾燥。実行するなら最後に run を付ける)');
      return 0;
    }
    const done = execute(run, options);
    console.log(`1 コミットにまとめた: ${done.squash}（退避タグ ${done.tag}）`);
    for (const change of done.changes) {
      console.log(`  ${change.file}: ${change.from} → ${change.to}`);
    }
    return 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exitCode = main(process.argv.slice(2));
}
