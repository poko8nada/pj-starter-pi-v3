/* eslint-disable typescript/no-non-null-assertion -- plan が mockGit.current! の遅延参照を決め、テスト全体で使うため */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tempDir } from '../../../../test/temp-dir.ts';
import { aRunRecord, aToolCall, START_TOKEN } from '../consult.fixture.ts';
import { appendRun, type CheckRecord } from '../run/log.ts';
import { placeFor } from '../run/place.ts';
import { branchFor, consultRoot, findWorktree, topLevel } from '../run/worktree.ts';
import { createWorktreeTool, removeText, runningIn } from './worktree.ts';

const mockGit = vi.hoisted(() => ({ current: undefined as FakeGit | undefined }));

vi.mock('../../../../lib/git-env.mjs', () => ({
  git: (cwd: string, args: readonly string[]) => mockGit.current!.git(cwd, args),
  gitEnv: (env?: NodeJS.ProcessEnv) => ({ ...env }),
}));
import { createFakeGit, type FakeGit } from '../../../../test/fake-git.fixture.ts';

const ROOT_KEY = 'CONSULT_ROOT';

type Outcome = Awaited<ReturnType<ReturnType<typeof createWorktreeTool>>>;

/** 道具は位置で 5 つ受け取る。保存場所は cwd から決め、ここで組み立てる */
function call(params: Record<string, unknown>, cwd: string, check?: CheckRecord): Promise<Outcome> {
  const place = placeFor(consultRoot(), topLevel(cwd));
  return createWorktreeTool(place, check)(...aToolCall(params, { cwd }, 'call-1'));
}

function aNewWorktree(dir: string, id = '2-b') {
  return call({ action: 'new', id }, dir);
}

function repo(): { readonly dir: string } {
  return { dir: tempDir() };
}

function text(outcome: { content: readonly { type: string; text?: string }[] }): string {
  return outcome.content.map((part) => part.text ?? '').join('\n');
}

/** unit の記録を 1 本書く。開始行が要る検査の重複をここに集める */
function seedUnit(dir: string, id: string, extra: Record<string, unknown> = {}): void {
  appendRun(
    placeFor(consultRoot(), topLevel(dir)),
    aRunRecord({
      session: 'session-a',
      subagent: 'consult-9',
      role: 'code',
      pid: process.pid,
      started: 1,
      worktree: id,
      ...extra,
    }),
  );
}

beforeEach(() => {
  mockGit.current = createFakeGit();
  vi.stubEnv(ROOT_KEY, tempDir());
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('consult_worktree', () => {
  it('new → id / branch / path / base を返す', async () => {
    const { dir } = repo();
    const id = '2-b';
    const outcome = await aNewWorktree(dir, id);
    const body = text(outcome);

    expect(body).toContain(`id: ${id}`);
    expect(body).toContain(`branch: ${branchFor(id)}`);
    expect(body).toContain('base: HEAD');
    expect(body).toMatch(/path: .*2-b\/wt/);
  });

  it('new で id がない → エラー', async () => {
    const { dir } = repo();
    await expect(call({ action: 'new' }, dir)).rejects.toThrow(/needs an id/);
  });

  it('list → 作ったものを出す。1 つもなければそう言う', async () => {
    const { dir } = repo();
    expect(text(await call({ action: 'list' }, dir))).toContain('ワークツリーは無い');

    await aNewWorktree(dir);
    expect(text(await call({}, dir))).toContain(branchFor('2-b'));
  });

  it('変更の残る worktree → list に changed、remove は dirty で断る', async () => {
    const { dir } = repo();
    await aNewWorktree(dir);
    const row = findWorktree(dir, '2-b');
    mockGit.current!.makeDirty(row?.path ?? '');

    expect(text(await call({ action: 'list' }, dir))).toContain('(changed)');
    const outcome = await call({ action: 'remove', id: '2-b' }, dir);
    expect(text(outcome)).toContain('変更が残っている');
    expect(outcome.details['outcome']).toBe('dirty');
  });

  it('worktree remove が失敗 → 投げる', async () => {
    const { dir } = repo();
    await aNewWorktree(dir);
    mockGit.current!.state.removeStatus = 1;
    await expect(call({ action: 'remove', id: '2-b' }, dir)).rejects.toThrow(
      /could not remove the worktree/,
    );
  });

  it('for-each-ref が失敗 → remove は投げる', async () => {
    const { dir } = repo();
    await aNewWorktree(dir);
    mockGit.current!.state.forEachRefStatus = 1;
    await expect(call({ action: 'remove', id: '2-b' }, dir)).rejects.toThrow(
      /could not list the orphan branches/,
    );
  });

  it('サブエージェントが走っている unit の remove は busy で断る（記録の pid が生きている）', async () => {
    const { dir } = repo();
    const id = '2-b';
    await aNewWorktree(dir);
    findWorktree(dir, id);
    seedUnit(dir, id);

    const outcome = await call({ action: 'remove', id }, dir);
    expect(text(outcome)).toContain('サブエージェントが走っている');
    expect(outcome.details['outcome']).toBe('busy');
    expect(findWorktree(dir, id)).toBeDefined();
  });

  it('記録の pid が死んでいれば、走っていない扱いで消える', async () => {
    const { dir } = repo();
    const id = '2-b';
    await aNewWorktree(dir);
    findWorktree(dir, id);
    seedUnit(dir, id, { pid: 999_999 });

    const outcome = await call({ action: 'remove', id }, dir);
    expect(outcome.details['outcome']).toBe('removed');
  });

  it('終わったサブエージェントの記録だけなら、走っていない（消える）', async () => {
    const { dir } = repo();
    const id = '2-b';
    await aNewWorktree(dir);
    seedUnit(dir, id, { ended: 2, state: 'done' });

    const outcome = await call({ action: 'remove', id }, dir);
    expect(outcome.details['outcome']).toBe('removed');
  });

  it('別の session の走っているサブエージェントでも busy（ワークツリーを守る側なので session で絞らない）', async () => {
    const { dir } = repo();
    const id = '2-b';
    await aNewWorktree(dir);
    seedUnit(dir, id, { session: 'session-elsewhere' });

    const outcome = await call({ action: 'remove', id }, dir);
    expect(outcome.details['outcome']).toBe('busy');
  });

  it('list が、走っているサブエージェントの居る unit に印を付ける', async () => {
    const { dir } = repo();
    const id = '2-b';
    await aNewWorktree(dir);
    findWorktree(dir, id);
    seedUnit(dir, id);

    expect(text(await call({ action: 'list' }, dir))).toContain('a subagent is running');
  });

  it('start と end のある unit → busy でない', async () => {
    const { dir } = repo();
    const id = '2-b';
    const token = 'token-9';
    await aNewWorktree(dir);
    findWorktree(dir, id);
    const place = placeFor(consultRoot(), topLevel(dir));
    seedUnit(dir, id, { token });
    seedUnit(dir, id, { ended: 2, state: 'done' });
    expect(runningIn(place, id, () => 'running')).toBe(false);
    const outcome = await call({ action: 'remove', id }, dir, () => 'running');
    expect(outcome.details['outcome']).toBe('removed');
  });

  it('開始行だけ（startToken 付き）+ check が running の worktree → busy', async () => {
    const { dir } = repo();
    const id = '2-b';
    const startToken = START_TOKEN;
    await aNewWorktree(dir);
    findWorktree(dir, id);
    const place = placeFor(consultRoot(), topLevel(dir));
    seedUnit(dir, id, { pid: 11, startToken });
    expect(runningIn(place, id, () => 'running')).toBe(true);
    expect(text(await call({ action: 'remove', id }, dir, () => 'running'))).toContain(
      'サブエージェントが走っている',
    );
  });

  it('開始行だけ（startToken 付き）+ check が ended の worktree → busy でない', async () => {
    const { dir } = repo();
    const id = '2-b';
    const startToken = START_TOKEN;
    await aNewWorktree(dir);
    findWorktree(dir, id);
    const place = placeFor(consultRoot(), topLevel(dir));
    seedUnit(dir, id, { pid: 11, startToken });
    expect(runningIn(place, id, () => 'ended')).toBe(false);
    const outcome = await call({ action: 'remove', id }, dir, () => 'ended');
    expect(outcome.details['outcome']).toBe('removed');
  });

  it('開始行だけ（startToken 付き）+ check が unknown の worktree → busy（走っている側）', async () => {
    const { dir } = repo();
    const id = '2-b';
    const startToken = START_TOKEN;
    await aNewWorktree(dir);
    findWorktree(dir, id);
    const place = placeFor(consultRoot(), topLevel(dir));
    seedUnit(dir, id, { pid: 11, startToken });
    expect(runningIn(place, id, () => 'unknown')).toBe(true);
  });

  it('知らない action → エラー', async () => {
    const { dir } = repo();
    await expect(call({ action: 'drop', id: '2-b' }, dir)).rejects.toThrow(/unknown action/);
  });
});

describe('removeText', () => {
  it('消したもの（ブランチ）・掃除した登録を言う', () => {
    const id = '2-b';
    expect(
      removeText(id, {
        outcome: 'removed',
        cleanup: { pruned: [], branches: [{ state: 'removed', branch: branchFor(id) }] },
      }),
    ).toContain('ブランチも消した');
  });

  it('残したもの（未マージは残す）を言う', () => {
    const id = '2-b';
    expect(
      removeText(id, {
        outcome: 'removed',
        cleanup: {
          pruned: [],
          branches: [{ state: 'kept', branch: branchFor(id), reason: 'unmerged' }],
        },
      }),
    ).toContain('ブランチは未マージなので残した');
  });

  it('ない登録でも掃除したものがあれば言う', () => {
    expect(
      removeText('2-b', {
        outcome: 'missing',
        cleanup: { pruned: ['/tmp/pi-consult/proj/2-b/wt'], branches: [] },
      }),
    ).toContain('登録を掃除した');
  });

  it('ない登録でも、残したブランチ（未マージ）を言う', () => {
    const id = '2-b';
    const branch = branchFor(id);
    expect(
      removeText(id, {
        outcome: 'missing',
        cleanup: { pruned: [], branches: [{ state: 'kept', branch, reason: 'unmerged' }] },
      }),
    ).toContain(`残したブランチ（未マージ）: ${branch}`);
  });

  it('変更が残る断りでも、掃除したものを言う', () => {
    expect(
      removeText('2-b', {
        outcome: 'dirty',
        cleanup: { pruned: [], branches: [{ state: 'removed', branch: 'consult/9-merged' }] },
      }),
    ).toContain('消したブランチ: consult/9-merged');
  });
});
