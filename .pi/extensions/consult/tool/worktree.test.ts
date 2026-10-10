import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tmpDir } from '../../../../test/tmp.ts';
import { runGit } from '../run/git-env.ts';
import { appendRun } from '../run/log.ts';
import { placeFor } from '../run/place.ts';
import { consultRoot, findWorktree, topLevel } from '../run/worktree.ts';
import { createWorktreeTool, removeText } from './worktree.ts';

// 置き場は本物の /tmp/pi-consult ではなく、テストごとの一時ディレクトリに逃がす。
const ROOT_KEY = 'CONSULT_ROOT';

type Outcome = Awaited<ReturnType<ReturnType<typeof createWorktreeTool>>>;

/** 道具は位置で 5 つ受け取る。置き場は cwd から決め、ここで組み立てる */
function call(params: Record<string, unknown>, cwd: string): Promise<Outcome> {
  const place = placeFor(consultRoot(), topLevel(cwd));
  return createWorktreeTool(place)('call-1', params, undefined, undefined, { cwd });
}

/** base のコミットを 1 つ持つリポジトリ */
function repo(): { readonly dir: string; readonly home: string } {
  const dir = tmpDir();
  const home = tmpDir();
  const run = (args: readonly string[]) => runGit(dir, home, args);
  run(['init', '--quiet']);
  run(['config', 'user.email', 'consult@example.com']);
  run(['config', 'user.name', 'consult']);
  writeFileSync(join(dir, 'README.md'), 'base\n');
  run(['add', '-A']);
  run(['commit', '--quiet', '-m', 'base']);
  return { dir, home };
}

function text(outcome: { content: readonly { type: string; text?: string }[] }): string {
  return outcome.content.map((part) => part.text ?? '').join('\n');
}

beforeEach(() => {
  vi.stubEnv(ROOT_KEY, tmpDir());
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('consult_worktree', () => {
  it('new → id / branch / path / base を返す', async () => {
    const { dir } = repo();
    const outcome = await call({ action: 'new', id: '2-b' }, dir);
    const body = text(outcome);

    expect(body).toContain('id: 2-b');
    expect(body).toContain('branch: consult/2-b');
    expect(body).toContain('base: HEAD');
    expect(body).toMatch(/path: .*2-b\/wt/);
  });

  it('new で id が無い → エラー', async () => {
    const { dir } = repo();
    await expect(call({ action: 'new' }, dir)).rejects.toThrow(/needs an id/);
  });

  it('list → 作った物を出す。1 つも無ければそう言う', async () => {
    const { dir } = repo();
    expect(text(await call({ action: 'list' }, dir))).toContain('作業場は無い');

    await call({ action: 'new', id: '2-b' }, dir);
    expect(text(await call({}, dir))).toContain('consult/2-b');
  });

  it('子が走っている unit の remove は busy で断る（記録の pid が生きている）', async () => {
    const { dir } = repo();
    await call({ action: 'new', id: '2-b' }, dir);
    findWorktree(dir, '2-b');
    // 走っている記録を書く（終わりの行が無く、pid は自分 = 生きている）
    appendRun(placeFor(consultRoot(), topLevel(dir)), {
      session: 'session-a',
      child: 'consult-9',
      role: 'code',
      pid: process.pid,
      started: 1,
      worktree: '2-b',
    });

    const outcome = await call({ action: 'remove', id: '2-b' }, dir);
    expect(text(outcome)).toContain('子が走っている');
    expect(outcome.details['outcome']).toBe('busy');
    expect(findWorktree(dir, '2-b')).toBeDefined();
  });

  it('記録の pid が死んでいれば、走っていない扱いで消える', async () => {
    const { dir } = repo();
    await call({ action: 'new', id: '2-b' }, dir);
    findWorktree(dir, '2-b');
    appendRun(placeFor(consultRoot(), topLevel(dir)), {
      session: 'session-a',
      child: 'consult-9',
      role: 'code',
      pid: 999_999,
      started: 1,
      worktree: '2-b',
    });

    const outcome = await call({ action: 'remove', id: '2-b' }, dir);
    expect(outcome.details['outcome']).toBe('removed');
  });

  it('終わった子の記録だけなら、走っていない（消える）', async () => {
    const { dir } = repo();
    await call({ action: 'new', id: '2-b' }, dir);
    appendRun(placeFor(consultRoot(), topLevel(dir)), {
      session: 'session-a',
      child: 'consult-9',
      role: 'code',
      pid: process.pid,
      started: 1,
      ended: 2,
      state: 'done',
      worktree: '2-b',
    });

    const outcome = await call({ action: 'remove', id: '2-b' }, dir);
    expect(outcome.details['outcome']).toBe('removed');
  });

  it('別の session の走っている子でも busy（作業場を守る側なので session で絞らない）', async () => {
    const { dir } = repo();
    await call({ action: 'new', id: '2-b' }, dir);
    appendRun(placeFor(consultRoot(), topLevel(dir)), {
      session: 'session-elsewhere',
      child: 'consult-9',
      role: 'code',
      pid: process.pid,
      started: 1,
      worktree: '2-b',
    });

    const outcome = await call({ action: 'remove', id: '2-b' }, dir);
    expect(outcome.details['outcome']).toBe('busy');
  });

  it('list が、走っている子の居る unit に印を付ける', async () => {
    const { dir } = repo();
    await call({ action: 'new', id: '2-b' }, dir);
    findWorktree(dir, '2-b');
    appendRun(placeFor(consultRoot(), topLevel(dir)), {
      session: 'session-a',
      child: 'consult-9',
      role: 'code',
      pid: process.pid,
      started: 1,
      worktree: '2-b',
    });

    expect(text(await call({ action: 'list' }, dir))).toContain('a child is running');
  });

  it('知らない action → エラー', async () => {
    const { dir } = repo();
    await expect(call({ action: 'drop', id: '2-b' }, dir)).rejects.toThrow(/unknown action/);
  });
});

describe('removeText', () => {
  it('消した物（枝）・掃除した登録を言う', () => {
    expect(
      removeText('2-b', {
        outcome: 'removed',
        cleanup: { pruned: [], branches: [{ state: 'removed', branch: 'consult/2-b' }] },
      }),
    ).toContain('ブランチも消した');
  });

  it('残した物（未マージは残す）を言う', () => {
    expect(
      removeText('2-b', {
        outcome: 'removed',
        cleanup: {
          pruned: [],
          branches: [{ state: 'kept', branch: 'consult/2-b', reason: 'unmerged' }],
        },
      }),
    ).toContain('ブランチは未マージなので残した');
  });

  it('無い登録でも掃除した物があれば言う', () => {
    expect(
      removeText('2-b', {
        outcome: 'missing',
        cleanup: { pruned: ['/tmp/pi-consult/proj/2-b/wt'], branches: [] },
      }),
    ).toContain('登録を掃除した');
  });

  it('無い登録でも、残した枝（未マージ）を言う', () => {
    expect(
      removeText('2-b', {
        outcome: 'missing',
        cleanup: {
          pruned: [],
          branches: [{ state: 'kept', branch: 'consult/2-b', reason: 'unmerged' }],
        },
      }),
    ).toContain('残した枝（未マージ）: consult/2-b');
  });

  it('変更が残る断りでも、掃除した物を言う', () => {
    expect(
      removeText('2-b', {
        outcome: 'dirty',
        cleanup: { pruned: [], branches: [{ state: 'removed', branch: 'consult/9-merged' }] },
      }),
    ).toContain('消した枝: consult/9-merged');
  });
});
