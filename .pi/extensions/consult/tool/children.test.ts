import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tmpDir } from '../../../test/tmp.ts';
import { runGit } from '../run/git-env.ts';
import { PARENT_UNIT, appendRun, logPath, type RunRecord } from '../run/log.ts';
import { createWorktree, rootFor } from '../run/worktree.ts';
import {
  PARAMETERS,
  USAGE,
  createChildrenTool,
  elapsed,
  latest,
  listText,
  rowOf,
  rowsOf,
  type ChildrenArgs,
} from './children.ts';

// 置き場は `CONSULT_ROOT` で一時ディレクトリに逃がす。子は起こさない（記録と、runtime の偽物だけで試す）。
// 一覧は `rootFor(cwd)` の root を読むので、テストは本物のリポジトリと worktree を 1 つ作る。

const ROOT_KEY = 'CONSULT_ROOT';
const here = fileURLToPath(new URL('.', import.meta.url));

beforeEach(() => {
  vi.stubEnv(ROOT_KEY, tmpDir());
});

afterEach(() => {
  vi.unstubAllEnvs();
});

/** base のコミットを 1 つ持つリポジトリ */
function repo(): string {
  const dir = tmpDir();
  const home = tmpDir();
  const run = (args: readonly string[]) => runGit(dir, home, args);
  run(['init', '--quiet']);
  run(['config', 'user.email', 'consult@example.com']);
  run(['config', 'user.name', 'consult']);
  writeFileSync(join(dir, 'README.md'), 'base\n');
  run(['add', '-A']);
  run(['commit', '--quiet', '-m', 'base']);
  return dir;
}

function record(extra: Partial<RunRecord> = {}): RunRecord {
  return { child: 'consult-1', role: 'review', pid: 999_999, started: 1000, ...extra };
}

/** worktree を 1 つ作り、その root に記録を書く。返るのは（リポジトリ, root, 書いた記録） */
function withLog(extra: Partial<RunRecord> = {}): {
  readonly dir: string;
  readonly root: string;
  readonly run: RunRecord;
} {
  const dir = repo();
  createWorktree(dir, '2-a');
  const root = rootFor(dir);
  const run = record({ worktree: '2-a', ...extra });
  appendRun(root, run);
  return { dir, root, run };
}

/** 一覧に出す口。`children` と `control` だけを持つ偽の runtime */
function fakeHost(live: string[] = []) {
  const cancelled: string[] = [];
  return {
    host: {
      children: new Map(live.map((id) => [id, {}])),
      control: (
        action: { readonly action: 'list' } | { readonly action: 'cancel'; readonly id: string },
      ) => {
        if (action.action === 'cancel') {
          cancelled.push(action.id);
          return { text: `stopped: ${action.id}`, details: { id: action.id } };
        }
        return { text: 'list', details: {} };
      },
    },
    cancelled,
  };
}

function textOf(result: { readonly content: readonly unknown[] }): string {
  const first = result.content[0];
  return typeof first === 'object' && first !== null && 'text' in first ? String(first.text) : '';
}

const alive = () => true;
const dead = () => false;

describe('PARAMETERS', () => {
  it('項目が action / id だけ', () => {
    expect(Object.keys(PARAMETERS.properties)).toEqual(['action', 'id']);
  });
});

describe('elapsed', () => {
  it('秒で出し、60 秒を超えたら分と秒にする', () => {
    expect(elapsed(record({ started: 1000 }), 1000 + 12_000)).toBe('12s');
    expect(elapsed(record({ started: 0, ended: 125_000 }), 0)).toBe('2m05s');
  });

  it('終わった子は終わりまでの時間（今ではない）', () => {
    expect(elapsed(record({ started: 0, ended: 5000 }), 10 ** 9)).toBe('5s');
  });
});

describe('rowOf / rowsOf', () => {
  it('id / role / 場所 / 状態 / 経過 / ターン / 費用 を 1 行に並べる', () => {
    const row = rowOf(record({ worktree: '2-a', turns: 12, spend: '0.01 usd' }), false, 0);
    expect(row).toContain('consult-1');
    expect(row).toContain('review');
    expect(row).toContain('worktree 2-a');
    expect(row).toContain('12 turns');
    expect(row).toContain('0.01 usd');
  });

  it('worktree が無い子は親の木と出す', () => {
    expect(rowOf(record(), false, 0)).toContain('parent');
  });

  it('終わった子は state と reason を出す。走っている子は出さない', () => {
    const done = rowOf(
      record({ ended: 2, state: 'turn-limit', reason: 'turn limit reached (40)' }),
      false,
      0,
    );
    expect(done).toContain('turn-limit');
    expect(done).toContain('reason: turn limit reached (40)');
    const running = rowOf(record(), true, 0);
    expect(running).toContain('running');
    expect(running).not.toContain('reason:');
  });

  it('走っている子（pid が生きていて終了行が無い）は running になる', () => {
    expect(rowsOf([record()], new Set(), alive, 0)[0]).toContain('running');
    expect(rowsOf([record()], new Set(), dead, 0)[0]).not.toContain('running');
  });

  it('いまのセッションが持っている子は、pid を見なくても running とする', () => {
    expect(rowsOf([record()], new Set(['consult-1']), dead, 0)[0]).toContain('running');
  });

  it('終了の行がある子は、いまのセッションに居ても running にしない', () => {
    const ended = record({ ended: 5, state: 'done' });
    expect(rowsOf([ended], new Set(['consult-1']), alive, 0)[0]).not.toContain('running');
  });
});

describe('latest', () => {
  it('子ごとに最後の行を取る（走っている行 → 終わった行）', () => {
    const running = record({ child: 'consult-1', pid: 5 });
    const done = record({ child: 'consult-1', pid: 5, ended: 2000, state: 'done' });
    const other = record({ child: 'consult-2', started: 3000 });
    expect(latest([running, other, done]).map((row) => [row.child, row.state])).toEqual([
      ['consult-1', 'done'],
      ['consult-2', undefined],
    ]);
  });

  it('記録が空 → 空のまま', () => {
    expect(latest([])).toEqual([]);
  });
});

describe('listText', () => {
  it('記録が無ければそう言う（空行を返さない）', () => {
    expect(listText([], new Set(), 0)).toBe('no children in this project yet');
  });
});

describe('createChildrenTool', () => {
  it('{action: list} → 記録の行が出る', async () => {
    const { dir, run } = withLog({ ended: 2000, state: 'done', turns: 3, spend: '0.002 usd' });
    const { host } = fakeHost();
    const args: ChildrenArgs = ['call', { action: 'list' }, undefined, undefined, { cwd: dir }];
    const out = await createChildrenTool(host)(...args);
    const text = textOf(out);
    expect(text).toContain(run.child);
    expect(text).toContain('worktree 2-a');
    expect(text).toContain('done');
  });

  it('action を省くと list（既定）', async () => {
    const { dir, run } = withLog({ ended: 2000, state: 'done' });
    const { host } = fakeHost();
    const args: ChildrenArgs = ['call', {}, undefined, undefined, { cwd: dir }];
    const out = await createChildrenTool(host)(...args);
    expect(textOf(out)).toContain(run.child);
  });

  it('{action: cancel, id} → 止めた結果が返る', async () => {
    const { dir } = withLog();
    const { host, cancelled } = fakeHost(['consult-1']);
    const args: ChildrenArgs = [
      'call',
      { action: 'cancel', id: 'consult-1' },
      undefined,
      undefined,
      { cwd: dir },
    ];
    const out = await createChildrenTool(host)(...args);
    expect(textOf(out)).toContain('stopped: consult-1');
    expect(cancelled).toEqual(['consult-1']);
  });

  it('{action: cancel}（id 無し）→ 使い方つきで投げる', async () => {
    const { dir } = withLog();
    const { host } = fakeHost();
    const args: ChildrenArgs = ['call', { action: 'cancel' }, undefined, undefined, { cwd: dir }];
    await expect(createChildrenTool(host)(...args)).rejects.toThrow(/cancel needs id/);
    expect(USAGE).toContain('cancel needs id');
  });

  it('知らない action → 投げる', async () => {
    const { dir } = withLog();
    const { host } = fakeHost();
    const args: ChildrenArgs = ['call', { action: 'stop' }, undefined, undefined, { cwd: dir }];
    await expect(createChildrenTool(host)(...args)).rejects.toThrow(/action is list or cancel/);
  });
});

describe('消えた面', () => {
  it('consult_resume と、resume / stopped の実装が消えている', () => {
    const source = readFileSync(`${here}../index.ts`, 'utf8');
    expect(source).not.toContain('consult_resume');
    expect(existsSync(`${here}resume.ts`)).toBe(false);
    expect(existsSync(`${here}../run/resume.ts`)).toBe(false);
    expect(existsSync(`${here}../run/stopped.ts`)).toBe(false);
  });

  it('記録は <root>/<unit>/log.jsonl に置く（stopped.json ではない）', () => {
    const { root } = withLog();
    expect(existsSync(logPath(root, '2-a'))).toBe(true);
    expect(existsSync(join(root, 'stopped.json'))).toBe(false);
    // 親の木で走った子（worktree 無し）の分も、同じ root の _parent に置ける
    mkdirSync(join(root, PARENT_UNIT), { recursive: true });
    writeFileSync(logPath(root, PARENT_UNIT), '', { flag: 'a' });
    expect(existsSync(logPath(root, PARENT_UNIT))).toBe(true);
  });
});
