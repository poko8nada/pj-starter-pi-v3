import { describe, expect, it } from 'vitest';
import { tempDir } from '../../../../test/temp-dir.ts';
import { createWorktreeGit, type WorktreeGit } from '../run/worktree.fixture.ts';
import { aRunRecord, aToolCall, START_TOKEN } from '../consult.fixture.ts';
import { appendRun, type CheckRecord } from '../run/log.ts';
import { placeFor } from '../run/place.ts';
import { branchFor, findWorktree, topLevel, type WorktreeDeps } from '../run/worktree.ts';
import { createWorktreeTool, removeText, runningIn } from './worktree.ts';

function depsFor(fake: WorktreeGit): WorktreeDeps {
  return { git: fake.git, root: tempDir() };
}

type Outcome = Awaited<ReturnType<ReturnType<typeof createWorktreeTool>>>;

/** 固定の時刻。記録の読み書きと worktree の作成はこの日で行う */
const NOW = new Date('2024-05-06T07:08:09Z');

/** 道具は位置で 5 つ受け取る。保存場所は cwd から決め、ここで組み立てる */
function call(
  params: Record<string, unknown>,
  cwd: string,
  deps: WorktreeDeps,
  check?: CheckRecord,
): Promise<Outcome> {
  const place = placeFor(deps.root, topLevel(cwd, deps));
  return createWorktreeTool({ place, deps, now: () => NOW, check })(
    ...aToolCall(params, { cwd }, 'call-1'),
  );
}

function aNewWorktree(dir: string, deps: WorktreeDeps, id = '2-b') {
  return call({ action: 'new', id }, dir, deps);
}

function repo(): { readonly dir: string } {
  return { dir: tempDir() };
}

function text(outcome: { content: readonly { type: string; text?: string }[] }): string {
  return outcome.content.map((part) => part.text ?? '').join('\n');
}

/** unit の記録を 1 本書く。開始行が要る検査の重複をここに集める */
function seedUnit(
  dir: string,
  deps: WorktreeDeps,
  id: string,
  extra: Record<string, unknown> = {},
): void {
  appendRun(
    placeFor(deps.root, topLevel(dir, deps)),
    aRunRecord({
      session: 'session-a',
      subagent: 'consult-9',
      role: 'code',
      pid: process.pid,
      started: 1,
      worktree: id,
      ...extra,
    }),
    NOW,
  );
}

describe('consult_worktree', () => {
  it('new → id / branch / path / base を返す', async () => {
    const { dir } = repo();
    const fake = createWorktreeGit();
    const deps = depsFor(fake);
    const id = '2-b';
    const outcome = await aNewWorktree(dir, deps, id);
    const body = text(outcome);

    expect(body).toContain(`id: ${id}`);
    expect(body).toContain(`branch: ${branchFor(id)}`);
    expect(body).toContain('base: HEAD');
    expect(body).toMatch(/path: .*2-b\/wt/);
  });

  it('new で id がない → エラー', async () => {
    const { dir } = repo();
    const fake = createWorktreeGit();
    const deps = depsFor(fake);
    await expect(call({ action: 'new' }, dir, deps)).rejects.toThrow(/needs an id/);
  });

  it('list → 作ったものを出す。1 つもなければそう言う', async () => {
    const { dir } = repo();
    const fake = createWorktreeGit();
    const deps = depsFor(fake);
    expect(text(await call({ action: 'list' }, dir, deps))).toContain('ワークツリーは無い');

    await aNewWorktree(dir, deps);
    expect(text(await call({}, dir, deps))).toContain(branchFor('2-b'));
  });

  it('変更の残る worktree → list に changed、remove は dirty で断る', async () => {
    const { dir } = repo();
    const fake = createWorktreeGit();
    const deps = depsFor(fake);
    await aNewWorktree(dir, deps);
    const row = findWorktree(dir, deps, '2-b');
    fake.makeDirty(row?.path ?? '');

    expect(text(await call({ action: 'list' }, dir, deps))).toContain('(changed)');
    const outcome = await call({ action: 'remove', id: '2-b' }, dir, deps);
    expect(text(outcome)).toContain('変更が残っている');
    expect(outcome.details['outcome']).toBe('dirty');
  });

  it('worktree remove が失敗 → 投げる', async () => {
    const { dir } = repo();
    const fake = createWorktreeGit();
    const deps = depsFor(fake);
    await aNewWorktree(dir, deps);
    fake.fail('worktree remove');
    await expect(call({ action: 'remove', id: '2-b' }, dir, deps)).rejects.toThrow(
      /could not remove the worktree/,
    );
  });

  it('for-each-ref が失敗 → remove は投げる', async () => {
    const { dir } = repo();
    const fake = createWorktreeGit();
    const deps = depsFor(fake);
    await aNewWorktree(dir, deps);
    fake.fail('for-each-ref');
    await expect(call({ action: 'remove', id: '2-b' }, dir, deps)).rejects.toThrow(
      /could not list the orphan branches/,
    );
  });

  it('サブエージェントが走っている unit の remove は busy で断る（記録の pid が生きている）', async () => {
    const { dir } = repo();
    const fake = createWorktreeGit();
    const deps = depsFor(fake);
    const id = '2-b';
    await aNewWorktree(dir, deps);
    findWorktree(dir, deps, id);
    seedUnit(dir, deps, id, { pid: process.pid });

    const outcome = await call({ action: 'remove', id }, dir, deps);
    expect(text(outcome)).toContain('サブエージェントが走っている');
    expect(outcome.details['outcome']).toBe('busy');
    expect(findWorktree(dir, deps, id)).toBeDefined();
  });

  it('記録の pid が死んでいれば、走っていない扱いで消える', async () => {
    const { dir } = repo();
    const fake = createWorktreeGit();
    const deps = depsFor(fake);
    const id = '2-b';
    await aNewWorktree(dir, deps);
    findWorktree(dir, deps, id);
    seedUnit(dir, deps, id, { pid: 999_999 });

    const outcome = await call({ action: 'remove', id }, dir, deps);
    expect(outcome.details['outcome']).toBe('removed');
  });

  it('別の session の走っているサブエージェントでも busy（ワークツリーを守る側なので session で絞らない）', async () => {
    const { dir } = repo();
    const fake = createWorktreeGit();
    const deps = depsFor(fake);
    const id = '2-b';
    await aNewWorktree(dir, deps);
    seedUnit(dir, deps, id, { pid: process.pid, session: 'session-elsewhere' });

    const outcome = await call({ action: 'remove', id }, dir, deps);
    expect(outcome.details['outcome']).toBe('busy');
  });

  it('list が、走っているサブエージェントの居る unit に印を付ける', async () => {
    const { dir } = repo();
    const fake = createWorktreeGit();
    const deps = depsFor(fake);
    const id = '2-b';
    await aNewWorktree(dir, deps);
    findWorktree(dir, deps, id);
    seedUnit(dir, deps, id, { pid: process.pid });

    expect(text(await call({ action: 'list' }, dir, deps))).toContain('a subagent is running');
  });

  it('start と end のある unit → busy でない', async () => {
    const { dir } = repo();
    const fake = createWorktreeGit();
    const deps = depsFor(fake);
    const id = '2-b';
    const token = 'token-9';
    await aNewWorktree(dir, deps);
    findWorktree(dir, deps, id);
    const place = placeFor(deps.root, topLevel(dir, deps));
    seedUnit(dir, deps, id, { token });
    seedUnit(dir, deps, id, { ended: 2, state: 'done' });
    expect(runningIn(place, id, NOW, () => 'running')).toBe(false);
    const outcome = await call({ action: 'remove', id }, dir, deps, () => 'running');
    expect(outcome.details['outcome']).toBe('removed');
  });

  it('開始行だけ（startToken 付き）+ check が running の worktree → busy', async () => {
    const { dir } = repo();
    const fake = createWorktreeGit();
    const deps = depsFor(fake);
    const id = '2-b';
    const startToken = START_TOKEN;
    await aNewWorktree(dir, deps);
    findWorktree(dir, deps, id);
    const place = placeFor(deps.root, topLevel(dir, deps));
    seedUnit(dir, deps, id, { pid: 11, startToken });
    expect(runningIn(place, id, NOW, () => 'running')).toBe(true);
    expect(text(await call({ action: 'remove', id }, dir, deps, () => 'running'))).toContain(
      'サブエージェントが走っている',
    );
  });

  it('開始行だけ（startToken 付き）+ check が ended の worktree → busy でない', async () => {
    const { dir } = repo();
    const fake = createWorktreeGit();
    const deps = depsFor(fake);
    const id = '2-b';
    const startToken = START_TOKEN;
    await aNewWorktree(dir, deps);
    findWorktree(dir, deps, id);
    const place = placeFor(deps.root, topLevel(dir, deps));
    seedUnit(dir, deps, id, { pid: 11, startToken });
    expect(runningIn(place, id, NOW, () => 'ended')).toBe(false);
    const outcome = await call({ action: 'remove', id }, dir, deps, () => 'ended');
    expect(outcome.details['outcome']).toBe('removed');
  });

  it('知らない action → エラー', async () => {
    const { dir } = repo();
    const fake = createWorktreeGit();
    const deps = depsFor(fake);
    await expect(call({ action: 'drop', id: '2-b' }, dir, deps)).rejects.toThrow(/unknown action/);
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
