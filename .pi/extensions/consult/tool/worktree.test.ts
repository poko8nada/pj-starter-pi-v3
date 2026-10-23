import { existsSync, mkdirSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tempDir } from '../../../../test/temp-dir.ts';
import { appendRun, type CheckRecord } from '../run/log.ts';
import { placeFor } from '../run/place.ts';
import { consultRoot, findWorktree, topLevel } from '../run/worktree.ts';
import { createWorktreeTool, removeText, runningIn } from './worktree.ts';

const mockGit = vi.hoisted(() =>
  vi.fn((_cwd: string, _args: readonly string[]) => ({ status: 0, stdout: '', stderr: '' })),
);

vi.mock('../../../../lib/git-env.mjs', () => ({
  git: (cwd: string, args: readonly string[]) => mockGit(cwd, args),
  gitEnv: (env?: NodeJS.ProcessEnv) => ({ ...env }),
}));

type Entry = { readonly path: string; readonly ref: string };

let entries: Entry[] = [];
const orphans = new Map<string, boolean>();
const unmerged = new Set<string>();
const dirtyPaths = new Set<string>();
let listStatus = 0;
let addStatus = 0;
let removeStatus = 0;
let pruneStatus = 0;
let forEachRefStatus = 0;

function resetFake(): void {
  entries = [];
  orphans.clear();
  unmerged.clear();
  dirtyPaths.clear();
  listStatus = 0;
  addStatus = 0;
  removeStatus = 0;
  pruneStatus = 0;
  forEachRefStatus = 0;
}

function installFake(): void {
  mockGit.mockImplementation((cwd: string, args: readonly string[]) => {
    if (args[0] === 'rev-parse') {
      return { status: 0, stdout: `${cwd}\n`, stderr: '' };
    }
    if (args[0] === 'worktree' && args[1] === 'list') {
      if (listStatus !== 0) {
        return { status: listStatus, stdout: '', stderr: 'not a repository' };
      }
      const blocks = entries.map((entry) => {
        const prunable = !existsSync(entry.path);
        return prunable
          ? `worktree ${entry.path}\nbranch ${entry.ref}\nprunable`
          : `worktree ${entry.path}\nbranch ${entry.ref}`;
      });
      return {
        status: 0,
        stdout: blocks.length > 0 ? `${blocks.join('\n\n')}\n` : '',
        stderr: '',
      };
    }
    if (args[0] === 'status') {
      if (dirtyPaths.has(cwd)) {
        return { status: 0, stdout: '?? dirty\n', stderr: '' };
      }
      return { status: 0, stdout: '', stderr: '' };
    }
    if (args[0] === 'worktree' && args[1] === 'add') {
      const branch = args[3] ?? '';
      const path = args[4] ?? '';
      if (branch.includes(' ') || addStatus !== 0) {
        return { status: 1, stdout: '', stderr: 'fatal: bad branch' };
      }
      mkdirSync(path, { recursive: true });
      entries.push({ path, ref: `refs/heads/${branch}` });
      return { status: 0, stdout: '', stderr: '' };
    }
    if (args[0] === 'worktree' && args[1] === 'prune') {
      if (pruneStatus !== 0) {
        return { status: pruneStatus, stdout: '', stderr: 'prune failed' };
      }
      const removed = entries.filter((entry) => !existsSync(entry.path));
      for (const gone of removed) {
        const short = gone.ref.replace(/^refs\/heads\//, '');
        if (!orphans.has(short)) {
          orphans.set(short, !unmerged.has(short));
        }
      }
      entries = entries.filter((entry) => existsSync(entry.path));
      return { status: 0, stdout: '', stderr: '' };
    }
    if (args[0] === 'worktree' && args[1] === 'remove') {
      const path = args[3] ?? '';
      if (removeStatus !== 0) {
        return { status: removeStatus, stdout: '', stderr: 'remove failed' };
      }
      const at = entries.findIndex((entry) => entry.path === path);
      if (at >= 0) {
        const removed = entries.splice(at, 1)[0];
        if (removed !== undefined) {
          const short = removed.ref.replace(/^refs\/heads\//, '');
          if (!orphans.has(short)) {
            orphans.set(short, !unmerged.has(short));
          }
        }
      }
      return { status: 0, stdout: '', stderr: '' };
    }
    if (args[0] === 'for-each-ref') {
      if (forEachRefStatus !== 0) {
        return { status: forEachRefStatus, stdout: '', stderr: 'for-each-ref failed' };
      }
      const checkedOut = new Set(entries.map((entry) => entry.ref.replace(/^refs\/heads\//, '')));
      const lines = [...orphans.keys()]
        .filter((branch) => !checkedOut.has(branch))
        .map((branch) => `refs/heads/${branch} `);
      return { status: 0, stdout: lines.length > 0 ? `${lines.join('\n')}\n` : '', stderr: '' };
    }
    if (args[0] === 'branch' && (args[1] === '-d' || args[1] === '-D')) {
      const branch = args[2] ?? '';
      if (args[1] === '-D') {
        orphans.delete(branch);
        unmerged.delete(branch);
        return { status: 0, stdout: '', stderr: '' };
      }
      if (unmerged.has(branch)) {
        return { status: 1, stdout: '', stderr: 'not fully merged' };
      }
      orphans.delete(branch);
      return { status: 0, stdout: '', stderr: '' };
    }
    return { status: 0, stdout: '', stderr: '' };
  });
}

function makeDirty(path: string): void {
  dirtyPaths.add(path);
}

const ROOT_KEY = 'CONSULT_ROOT';

type Outcome = Awaited<ReturnType<ReturnType<typeof createWorktreeTool>>>;

/** 道具は位置で 5 つ受け取る。置き場は cwd から決め、ここで組み立てる */
function call(params: Record<string, unknown>, cwd: string, check?: CheckRecord): Promise<Outcome> {
  const place = placeFor(consultRoot(), topLevel(cwd));
  return createWorktreeTool(place, check)('call-1', params, undefined, undefined, { cwd });
}

function repo(): { readonly dir: string } {
  return { dir: tempDir() };
}

function text(outcome: { content: readonly { type: string; text?: string }[] }): string {
  return outcome.content.map((part) => part.text ?? '').join('\n');
}

beforeEach(() => {
  resetFake();
  installFake();
  vi.stubEnv(ROOT_KEY, tempDir());
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

  it('変更の残る worktree → list に changed、remove は dirty で断る', async () => {
    const { dir } = repo();
    await call({ action: 'new', id: '2-b' }, dir);
    const row = findWorktree(dir, '2-b');
    makeDirty(row?.path ?? '');

    expect(text(await call({ action: 'list' }, dir))).toContain('(changed)');
    const outcome = await call({ action: 'remove', id: '2-b' }, dir);
    expect(text(outcome)).toContain('変更が残っている');
    expect(outcome.details['outcome']).toBe('dirty');
  });

  it('worktree remove が失敗 → 投げる', async () => {
    const { dir } = repo();
    await call({ action: 'new', id: '2-b' }, dir);
    removeStatus = 1;
    await expect(call({ action: 'remove', id: '2-b' }, dir)).rejects.toThrow(
      /could not remove the worktree/,
    );
  });

  it('for-each-ref が失敗 → remove は投げる', async () => {
    const { dir } = repo();
    await call({ action: 'new', id: '2-b' }, dir);
    forEachRefStatus = 1;
    await expect(call({ action: 'remove', id: '2-b' }, dir)).rejects.toThrow(
      /could not list the orphan branches/,
    );
  });

  it('サブエージェントが走っている unit の remove は busy で断る（記録の pid が生きている）', async () => {
    const { dir } = repo();
    await call({ action: 'new', id: '2-b' }, dir);
    findWorktree(dir, '2-b');
    appendRun(placeFor(consultRoot(), topLevel(dir)), {
      session: 'session-a',
      subagent: 'consult-9',
      role: 'code',
      pid: process.pid,
      started: 1,
      worktree: '2-b',
    });

    const outcome = await call({ action: 'remove', id: '2-b' }, dir);
    expect(text(outcome)).toContain('サブエージェントが走っている');
    expect(outcome.details['outcome']).toBe('busy');
    expect(findWorktree(dir, '2-b')).toBeDefined();
  });

  it('記録の pid が死んでいれば、走っていない扱いで消える', async () => {
    const { dir } = repo();
    await call({ action: 'new', id: '2-b' }, dir);
    findWorktree(dir, '2-b');
    appendRun(placeFor(consultRoot(), topLevel(dir)), {
      session: 'session-a',
      subagent: 'consult-9',
      role: 'code',
      pid: 999_999,
      started: 1,
      worktree: '2-b',
    });

    const outcome = await call({ action: 'remove', id: '2-b' }, dir);
    expect(outcome.details['outcome']).toBe('removed');
  });

  it('終わったサブエージェントの記録だけなら、走っていない（消える）', async () => {
    const { dir } = repo();
    await call({ action: 'new', id: '2-b' }, dir);
    appendRun(placeFor(consultRoot(), topLevel(dir)), {
      session: 'session-a',
      subagent: 'consult-9',
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

  it('別の session の走っているサブエージェントでも busy（作業場を守る側なので session で絞らない）', async () => {
    const { dir } = repo();
    await call({ action: 'new', id: '2-b' }, dir);
    appendRun(placeFor(consultRoot(), topLevel(dir)), {
      session: 'session-elsewhere',
      subagent: 'consult-9',
      role: 'code',
      pid: process.pid,
      started: 1,
      worktree: '2-b',
    });

    const outcome = await call({ action: 'remove', id: '2-b' }, dir);
    expect(outcome.details['outcome']).toBe('busy');
  });

  it('list が、走っているサブエージェントの居る unit に印を付ける', async () => {
    const { dir } = repo();
    await call({ action: 'new', id: '2-b' }, dir);
    findWorktree(dir, '2-b');
    appendRun(placeFor(consultRoot(), topLevel(dir)), {
      session: 'session-a',
      subagent: 'consult-9',
      role: 'code',
      pid: process.pid,
      started: 1,
      worktree: '2-b',
    });

    expect(text(await call({ action: 'list' }, dir))).toContain('a subagent is running');
  });

  it('start と end のある unit → busy でない', async () => {
    const { dir } = repo();
    await call({ action: 'new', id: '2-b' }, dir);
    findWorktree(dir, '2-b');
    const place = placeFor(consultRoot(), topLevel(dir));
    appendRun(place, {
      session: 'session-a',
      subagent: 'consult-9',
      role: 'code',
      pid: process.pid,
      started: 1,
      token: 'token-9',
      worktree: '2-b',
    });
    appendRun(place, {
      session: 'session-a',
      subagent: 'consult-9',
      role: 'code',
      pid: process.pid,
      started: 1,
      ended: 2,
      state: 'done',
      worktree: '2-b',
    });
    expect(runningIn(place, '2-b', () => 'running')).toBe(false);
    const outcome = await call({ action: 'remove', id: '2-b' }, dir, () => 'running');
    expect(outcome.details['outcome']).toBe('removed');
  });

  it('開始行だけ（startToken 付き）+ check が running の worktree → busy', async () => {
    const { dir } = repo();
    await call({ action: 'new', id: '2-b' }, dir);
    findWorktree(dir, '2-b');
    const place = placeFor(consultRoot(), topLevel(dir));
    appendRun(place, {
      session: 'session-a',
      subagent: 'consult-9',
      role: 'code',
      pid: 11,
      started: 1,
      startToken: 'Wed Oct 21 12:41:12 2026',
      worktree: '2-b',
    });
    expect(runningIn(place, '2-b', () => 'running')).toBe(true);
    expect(text(await call({ action: 'remove', id: '2-b' }, dir, () => 'running'))).toContain(
      'サブエージェントが走っている',
    );
  });

  it('開始行だけ（startToken 付き）+ check が ended の worktree → busy でない', async () => {
    const { dir } = repo();
    await call({ action: 'new', id: '2-b' }, dir);
    findWorktree(dir, '2-b');
    const place = placeFor(consultRoot(), topLevel(dir));
    appendRun(place, {
      session: 'session-a',
      subagent: 'consult-9',
      role: 'code',
      pid: 11,
      started: 1,
      startToken: 'Wed Oct 21 12:41:12 2026',
      worktree: '2-b',
    });
    expect(runningIn(place, '2-b', () => 'ended')).toBe(false);
    const outcome = await call({ action: 'remove', id: '2-b' }, dir, () => 'ended');
    expect(outcome.details['outcome']).toBe('removed');
  });

  it('開始行だけ（startToken 付き）+ check が unknown の worktree → busy（走っている側）', async () => {
    const { dir } = repo();
    await call({ action: 'new', id: '2-b' }, dir);
    findWorktree(dir, '2-b');
    const place = placeFor(consultRoot(), topLevel(dir));
    appendRun(place, {
      session: 'session-a',
      subagent: 'consult-9',
      role: 'code',
      pid: 11,
      started: 1,
      startToken: 'Wed Oct 21 12:41:12 2026',
      worktree: '2-b',
    });
    expect(runningIn(place, '2-b', () => 'unknown')).toBe(true);
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
