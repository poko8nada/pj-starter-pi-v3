#!/usr/bin/env node
/**
 * squash — ひとつのユニットの step コミットを 1 つにまとめ、チケットの `Commit:` を書き換える。
 *
 * 使い方:
 *   node squash.mjs <cycle-dir> <base-hash> <hash>... [--tickets <name>...] [run]
 *
 * `run` を最後に置いたときだけ実行する。無ければ乾燥（何も変えず、予定だけ出す）。
 * 実行の直前に、退避のタグ `squash-backup` を「書き換える前の先頭」へ向け直す（上書き）。
 * 戻すときは `git reset --hard squash-backup`。ユニットごとに上書きするので、1 本しか残らない。
 *
 * 実行しない条件（どれも投げる）:
 *   - 作業ツリーが汚れている（未コミットの物があると reset が事故になる）
 *   - 引数の一覧が `base..HEAD` と一致しない
 *   - `HEAD` が一覧の最後でない
 *   - 潰す対象が 0 件
 *
 * 実行後、`<cycle-dir>/tickets/*.md` の `Commit:` の行のハッシュを、古い→新しいで書き換える
 * （`Commit: abc1234（注記）` の注記はそのまま残す）。
 * `--tickets` で名指したチケットは、空の `Commit:` も新しいハッシュで埋める。step の時点では空で、
 * ユニットの終わりに閉じる（`../tickets/references/format.md`）——その閉じる手を 1 つにするのがこの口。
 * 名指さないチケットの空行は触らない（まだ書いていない step を巻き込まないため）。
 */

import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const USAGE =
  'usage: squash.mjs <cycle-dir> <base-hash> <hash>... [--tickets <name>...] [run]';

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
  const flag = rest.indexOf('--tickets');
  const positional = flag === -1 ? rest : rest.slice(0, flag);
  const tickets = flag === -1 ? [] : rest.slice(flag + 1);
  if (flag !== -1 && tickets.length === 0) {
    throw new Error(`--tickets の後ろにチケットの名前が要る\n${USAGE}`);
  }
  if (positional.length < 3) {
    throw new Error(USAGE);
  }
  const [cycleDir, base, first, ...others] = positional;
  return {
    cycleDir,
    base,
    hashes: [first, ...others],
    tickets,
    run: argv.at(-1) === 'run',
  };
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

/**
 * 渡されたハッシュを、git が一覧に使う形（短縮）へ揃える。
 * 短い形もフルの形も受ける（`rev-parse` がどちらも解決する）。
 */
function abbreviateHashes(run, hashes) {
  return hashes.map((hash) =>
    must(run, ['rev-parse', '--short', hash], `ハッシュが引けない（${hash}）`).trim(),
  );
}

/**
 * 予定を組む。何も変えない
 *
 * @param {(args: string[]) => { status: number, stdout: string, stderr: string }} run
 * @param {{ cycleDir: string, base: string, hashes: string[], tickets?: string[] }} options
 */
export function planSquash(run, { base, hashes, cycleDir, tickets = [] }) {
  const head = must(run, ['rev-parse', '--short', 'HEAD'], 'HEAD が引けない').trim();
  const range = commitsInRange(run, base);
  if (range.length === 0) {
    throw new Error(`潰す対象が 0 件（${base}..HEAD が空）`);
  }
  // 渡されたハッシュは短い形もフルの形もありうる。1 回だけ git の形（短縮）に揃え、
  // 一覧との照合と HEAD との照合の両方で同じ物を使う。
  const abbreviated = abbreviateHashes(run, hashes);
  if (range.join(' ') !== abbreviated.join(' ')) {
    throw new Error(
      `一覧が base..HEAD と違う\n  base..HEAD: ${range.join(' ')}\n  引数:       ${abbreviated.join(' ')}`,
    );
  }
  if (head !== abbreviated.at(-1)) {
    throw new Error(`HEAD（${head}）が一覧の最後（${abbreviated.at(-1)}）と違う`);
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
  return { range, subjects, message, tickets: planTickets(cycleDir, abbreviated, tickets) };
}

/**
 * どのチケットの `Commit:` を書き換えるか・埋めるか（まだ書き換えない）。
 * `from: ''` は空の行の印。
 */
export function planTickets(cycleDir, hashes, tickets = []) {
  const dir = join(cycleDir, 'tickets');
  const wanted = new Set(hashes);
  const named = new Set(tickets.map(ticketName));
  const targets = [];
  for (const file of readdirSync(dir).filter((name) => name.endsWith('.md'))) {
    const text = readFileSync(join(dir, file), 'utf8');
    for (const [index, line] of text.split('\n').entries()) {
      const match = /^Commit: ([0-9a-f]{7,40})(.*)$/.exec(line);
      if (match !== null && wanted.has(match[1])) {
        targets.push({ file, line: index + 1, from: match[1] });
      } else if (named.has(file) && isEmptyCommit(line)) {
        targets.push({ file, line: index + 1, from: '' });
      }
    }
  }
  return targets;
}

/** チケットの名前。拡張子の有無をどちらでも受ける */
function ticketName(name) {
  return name.endsWith('.md') ? name : `${name}.md`;
}

/** 空の `Commit:` の行か（`なし（理由）` は違う） */
function isEmptyCommit(line) {
  return /^Commit:\s*$/.test(line);
}

/**
 * チケットの `Commit:` のハッシュを、古い→新しいで書き換える。
 * `tickets` で名指されたファイルの空の `Commit:` は `squash` で埋める。
 */
export function rewriteTickets(cycleDir, mapping, { squash, tickets }) {
  const dir = join(cycleDir, 'tickets');
  const named = new Set(tickets.map(ticketName));
  const changes = [];
  for (const file of readdirSync(dir).filter((name) => name.endsWith('.md'))) {
    const path = join(dir, file);
    const text = readFileSync(path, 'utf8');
    const out = text
      .split('\n')
      .map((line) => {
        const match = /^Commit: ([0-9a-f]{7,40})(.*)$/.exec(line);
        if (match !== null && mapping.has(match[1])) {
          changes.push({ file, from: match[1], to: mapping.get(match[1]) });
          return `Commit: ${mapping.get(match[1])}${match[2]}`;
        }
        if (named.has(file) && isEmptyCommit(line)) {
          changes.push({ file, from: '', to: squash });
          return `Commit: ${squash}`;
        }
        return line;
      })
      .join('\n');
    if (out !== text) {
      writeFileSync(path, out);
    }
  }
  return changes;
}

/** 退避タグの名前。ユニットごとに上書きするので 1 本しか残らない */
export const BACKUP_TAG = 'squash-backup';

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
  // 書き換える前の先頭に退避タグを向け直す。上書きなので、常に直近の 1 本だけが残る。
  const tag = BACKUP_TAG;
  must(run, ['tag', '-f', tag, options.hashes.at(-1)], '退避タグが打てない');
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
    { squash, tickets: options.tickets ?? [] },
  );
  return { tag, squash, changes, plan };
}

/** 予定を人が読む形にする */
export function formatPlan(plan) {
  const lines = [];
  lines.push(`潰す: ${plan.range.join(' ')}（${plan.range.length} 件）`);
  lines.push(
    `退避: ${BACKUP_TAG} → ${plan.range.at(-1)}（戻すときは git reset --hard ${BACKUP_TAG}）`,
  );
  lines.push(`新しいメッセージ: ${plan.message.subject}`);
  if (plan.message.body !== '') {
    lines.push(plan.message.body);
  }
  if (plan.tickets.length === 0) {
    lines.push('書き換えるチケット: なし（空も、古いハッシュも無い）');
  } else {
    lines.push('書き換えるチケット:');
    for (const target of plan.tickets) {
      const from = target.from === '' ? '（空）' : target.from;
      lines.push(`  ${target.file}:${target.line}: ${from} → <新しいハッシュ>`);
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
    console.log(
      `1 コミットにまとめた: ${done.squash}（退避タグ ${done.tag} → ${done.plan.range.at(-1)}）`,
    );
    for (const change of done.changes) {
      const from = change.from === '' ? '（空）' : change.from;
      console.log(`  ${change.file}: ${from} → ${change.to}`);
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
