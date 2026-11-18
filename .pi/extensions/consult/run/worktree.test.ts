/* eslint-disable typescript/no-non-null-assertion -- plan が mockGit.current! の遅延参照を決め、テスト全体で使うため */
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tempDir } from '../../../../test/temp-dir.ts';
import {
  branchFor,
  cleanWorktrees,
  createWorktree,
  ensureRoot,
  findWorktree,
  listWorktrees,
  removeWorktree,
  rootFor,
} from './worktree.ts';

const mockGit = vi.hoisted(() => ({ current: undefined as FakeGit | undefined }));

vi.mock('../../../../lib/git-env.mjs', () => ({
  git: (cwd: string, args: readonly string[]) => mockGit.current!.git(cwd, args),
  gitEnv: (env?: NodeJS.ProcessEnv) => ({ ...env }),
}));
import { createFakeGit, type FakeGit } from '../../../../test/fake-git.fixture.ts';

const ROOT_KEY = 'CONSULT_ROOT';

beforeEach(() => {
  mockGit.current = createFakeGit();
  vi.stubEnv(ROOT_KEY, tempDir());
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe('rootFor', () => {
  it('worktree を作った後でも、同じ root を返す', () => {
    const dir = tempDir();
    createWorktree(dir, '1-a');
    const made = rootFor(dir);
    const root = process.env[ROOT_KEY] ?? '';
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2030-01-01T00:00:00Z'));
      const before = readdirSync(root).length;
      expect(rootFor(dir)).toBe(made);
      expect(readdirSync(root)).toHaveLength(before);
    } finally {
      vi.useRealTimers();
    }
  });

  it('worktree がなければ undefined → 作らない', () => {
    const dir = tempDir();
    const root = process.env[ROOT_KEY] ?? '';
    const before = readdirSync(root);
    expect(rootFor(dir)).toBeUndefined();
    expect(readdirSync(root)).toEqual(before);
  });

  it('worktree があればそれを使う', () => {
    const dir = tempDir();
    const made = createWorktree(dir, '1-a');
    expect(rootFor(dir)).toBe(dirname(made.unitDir));
  });
});

describe('ensureRoot', () => {
  it('2 回呼ぶと、同じルートを返し、作るのは 1 回だけ', () => {
    const dir = tempDir();
    const root = process.env[ROOT_KEY] ?? '';
    createWorktree(dir, '1-a');
    const first = ensureRoot(dir);
    const before = readdirSync(root).length;
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2030-01-01T00:00:00Z'));
      expect(ensureRoot(dir)).toBe(first);
      expect(readdirSync(root)).toHaveLength(before);
    } finally {
      vi.useRealTimers();
    }
  });

  it('worktree がなければ新しく 1 つ作る', () => {
    const dir = tempDir();
    expect(readdirSync(process.env[ROOT_KEY] ?? '')).toHaveLength(0);
    ensureRoot(dir);
    expect(readdirSync(process.env[ROOT_KEY] ?? '')).toHaveLength(1);
  });
});

describe('createWorktree', () => {
  it('unit の worktree を作る → ブランチと保存場所が決まる', () => {
    const dir = tempDir();
    const id = '1-a';
    const made = createWorktree(dir, id);

    expect(made.id).toBe(id);
    expect(made.branch).toBe(branchFor(id));
    expect(made.path.startsWith(ensureRoot(dir))).toBe(true);
    expect(made.path.endsWith(join(id, 'wt'))).toBe(true);
    expect(listWorktrees(dir).map((row) => row.id)).toEqual([id]);
  });

  it('2 回呼んでも増えない → 同じものが返る', () => {
    const dir = tempDir();
    const first = createWorktree(dir, '1-a');
    const second = createWorktree(dir, '1-a');

    expect(second.path).toBe(first.path);
    expect(listWorktrees(dir)).toHaveLength(1);
  });

  it('base を指定できる → そのまま git に渡る', () => {
    const dir = tempDir();
    const id = '2-b';
    const base = 'abc123';
    createWorktree(dir, id, base);
    expect(mockGit.current!.state.lastAdd).toEqual(
      expect.objectContaining({ branch: branchFor(id), base }),
    );
  });

  it('base の既定は HEAD', () => {
    const dir = tempDir();
    createWorktree(dir, '1-a');
    expect(mockGit.current!.state.lastAdd?.base).toBe('HEAD');
  });

  it('worktree add が status 1 → 例外、unit ディレクトリが残らない', () => {
    const dir = tempDir();
    mockGit.current!.state.addStatus = 1;
    expect(() => createWorktree(dir, '1-a')).toThrow(/could not create the worktree/);
    expect(listWorktrees(dir)).toHaveLength(0);
    expect(existsSync(join(ensureRoot(dir), '1-a'))).toBe(false);
  });
});

describe('listWorktrees のゴースト', () => {
  it('実体がある登録 → 一覧に出る', () => {
    const dir = tempDir();
    const id = '1-a';
    createWorktree(dir, id);

    expect(listWorktrees(dir).map((row) => row.id)).toEqual([id]);
    expect(findWorktree(dir, id)).toBeDefined();
  });

  it('実体のない path の登録 → 一覧に出ない', () => {
    const dir = tempDir();
    const id = '1-a';
    const made = createWorktree(dir, id);
    rmSync(made.path, { recursive: true, force: true });

    expect(listWorktrees(dir)).toEqual([]);
    expect(findWorktree(dir, id)).toBeUndefined();
  });

  it('porcelain に consult 以外と prunable の囮 → consult の実体あるものだけ', () => {
    const dir = tempDir();
    const id = '1-a';
    const realPath = join(tempDir(), 'wt');
    mkdirSync(realPath, { recursive: true });
    mockGit.current!.state.listOverride = [
      `worktree ${realPath}\nbranch refs/heads/${branchFor(id)}`,
      'worktree /other/main\nbranch refs/heads/main',
      `worktree ${realPath}\nbranch refs/heads/${branchFor(id)}\nprunable something went away`,
      'worktree /ghost/wt\nbranch refs/heads/consult/9-ghost\nprunable',
    ].join('\n\n');

    expect(listWorktrees(dir).map((row) => row.id)).toEqual([id]);
  });

  it('git が断る（status 128）→ 空の一覧', () => {
    mockGit.current!.state.listStatus = 128;
    expect(listWorktrees(tempDir())).toEqual([]);
  });
});

describe('listWorktrees / findWorktree', () => {
  it('変更が残っている worktree → dirty', () => {
    const dir = tempDir();
    const made = createWorktree(dir, '1-a');
    expect(findWorktree(dir, '1-a')?.dirty).toBe(false);

    writeFileSync(join(made.path, 'note.md'), 'the subagent wrote this\n');
    mockGit.current!.makeDirty(made.path);
    expect(findWorktree(dir, '1-a')?.dirty).toBe(true);
  });
});

describe('removeWorktree', () => {
  it('作って消す → 登録と実体が消え、removed。2 回目は missing', () => {
    const dir = tempDir();
    const made = createWorktree(dir, '1-a');

    const first = removeWorktree(dir, '1-a');
    expect(first.outcome).toBe('removed');
    expect(first.cleanup.pruned).toEqual([]);
    expect(first.cleanup.branches).toEqual([{ state: 'removed', branch: branchFor('1-a') }]);
    expect(existsSync(made.path)).toBe(false);
    expect(existsSync(made.unitDir)).toBe(false);
    expect(listWorktrees(dir)).toEqual([]);

    const second = removeWorktree(dir, '1-a');
    expect(second.outcome).toBe('missing');
    expect(second.cleanup).toEqual({ pruned: [], branches: [] });
  });

  it('サブエージェントが動いている → busy で断り、掃除もしない', () => {
    const dir = tempDir();
    const id = '1-a';
    createWorktree(dir, id);
    const ghost = createWorktree(dir, '1-b');
    rmSync(ghost.path, { recursive: true, force: true });

    const refused = removeWorktree(dir, id, { busy: true });
    expect(refused.outcome).toBe('busy');
    expect(refused.cleanup).toEqual({ pruned: [], branches: [] });
    expect(listWorktrees(dir).map((row) => row.id)).toEqual([id]);
    const after = removeWorktree(dir, '1-b');
    expect(after.outcome).toBe('missing');
    expect(after.cleanup.pruned).toContain(ghost.path);
  });

  it('変更が残っている → force なしでは断る', () => {
    const dir = tempDir();
    const made = createWorktree(dir, '1-a');
    writeFileSync(join(made.path, 'note.md'), 'the subagent wrote this\n');
    mockGit.current!.makeDirty(made.path);

    expect(removeWorktree(dir, '1-a').outcome).toBe('dirty');
    expect(listWorktrees(dir)).toHaveLength(1);
  });

  it('変更が残っていても、孤児のブランチは掃除される（ワークツリーは残す）', () => {
    const dir = tempDir();
    const made = createWorktree(dir, '1-a');
    writeFileSync(join(made.path, 'note.md'), 'the subagent wrote this\n');
    mockGit.current!.makeDirty(made.path);
    mockGit.current!.addOrphan('consult/9-merged', true);

    const result = removeWorktree(dir, '1-a');
    expect(result.outcome).toBe('dirty');
    expect(result.cleanup.pruned).toEqual([]);
    expect(result.cleanup.branches).toEqual([{ state: 'removed', branch: 'consult/9-merged' }]);
    expect(findWorktree(dir, '1-a')).toBeDefined();
  });

  it('変更が残っていても force なら消える', () => {
    const dir = tempDir();
    const made = createWorktree(dir, '1-a');
    writeFileSync(join(made.path, 'note.md'), 'the subagent wrote this\n');
    mockGit.current!.makeDirty(made.path);

    const result = removeWorktree(dir, '1-a', { force: true });
    expect(result.outcome).toBe('removed');
    expect(listWorktrees(dir)).toEqual([]);
  });

  it('未マージのブランチは残す（仕事を消さない）', () => {
    const dir = tempDir();
    const made = createWorktree(dir, '1-a');
    writeFileSync(join(made.path, 'note.md'), 'the subagent wrote this\n');
    mockGit.current!.markUnmerged(branchFor('1-a'));

    const result = removeWorktree(dir, '1-a');
    expect(result.outcome).toBe('removed');
    expect(result.cleanup.branches).toEqual([
      { state: 'kept', branch: branchFor('1-a'), reason: 'unmerged' },
    ]);
  });

  it('実体のない登録（ゴースト）→ prune で消え、missing と pruned にそのパス', () => {
    const dir = tempDir();
    const made = createWorktree(dir, '1-a');
    rmSync(made.path, { recursive: true, force: true });

    const result = removeWorktree(dir, '1-a');
    expect(result.outcome).toBe('missing');
    expect(result.cleanup.pruned).toContain(made.path);
    expect(result.cleanup.branches).toEqual([{ state: 'removed', branch: branchFor('1-a') }]);
    expect(listWorktrees(dir)).toEqual([]);
  });

  it('実体のない登録でも、force なら未マージのブランチを捨てる', () => {
    const dir = tempDir();
    const made = createWorktree(dir, '1-a');
    writeFileSync(join(made.path, 'note.md'), 'the subagent wrote this\n');
    mockGit.current!.markUnmerged(branchFor('1-a'));
    rmSync(made.path, { recursive: true, force: true });

    const kept = removeWorktree(dir, '1-a');
    expect(kept.outcome).toBe('missing');
    expect(kept.cleanup.pruned).toContain(made.path);
    expect(kept.cleanup.branches).toEqual([
      { state: 'kept', branch: branchFor('1-a'), reason: 'unmerged' },
    ]);

    const discarded = removeWorktree(dir, '1-a', { force: true });
    expect(discarded.outcome).toBe('missing');
    expect(discarded.cleanup.branches).toEqual([{ state: 'removed', branch: branchFor('1-a') }]);
  });

  it('remove が消すのは unit のディレクトリだけ（同じ実行の別 unit は残る）', () => {
    const dir = tempDir();
    const first = createWorktree(dir, '1-a');
    const second = createWorktree(dir, '1-b');
    expect(dirname(second.unitDir)).toBe(dirname(first.unitDir));

    const result = removeWorktree(dir, '1-a');
    expect(result.outcome).toBe('removed');
    expect(result.cleanup.branches).toEqual([{ state: 'removed', branch: branchFor('1-a') }]);

    expect(existsSync(first.unitDir)).toBe(false);
    expect(existsSync(dirname(second.unitDir))).toBe(true);
    expect(existsSync(second.unitDir)).toBe(true);
    expect(findWorktree(dir, '1-b')).toBeDefined();
  });

  it('未マージでも force ならブランチも消える（捨てる）', () => {
    const dir = tempDir();
    const made = createWorktree(dir, '1-a');
    writeFileSync(join(made.path, 'note.md'), 'the subagent wrote this\n');
    mockGit.current!.markUnmerged(branchFor('1-a'));

    const result = removeWorktree(dir, '1-a', { force: true });
    expect(result.outcome).toBe('removed');
    expect(result.cleanup.branches).toEqual([{ state: 'removed', branch: branchFor('1-a') }]);
  });

  it('consult/ のような id → missing', () => {
    const dir = tempDir();
    expect(removeWorktree(dir, 'consult/').outcome).toBe('missing');
  });

  it('worktree remove が status 1 → 例外（登録は残る）', () => {
    const dir = tempDir();
    createWorktree(dir, '1-a');
    mockGit.current!.state.removeStatus = 1;
    expect(() => removeWorktree(dir, '1-a')).toThrow(/could not remove the worktree/);
    expect(findWorktree(dir, '1-a')).toBeDefined();
  });
});

describe('removeWorktree の統合', () => {
  it('ゴーストと取り込み済み・未マージのブランチがある状態から remove が片付ける', () => {
    const dir = tempDir();
    const target = createWorktree(dir, '1-t');
    mockGit.current!.addOrphan('consult/9-merged', true);
    const unmergedWorktree = createWorktree(dir, '1-u');
    writeFileSync(join(unmergedWorktree.path, 'note.md'), 'the subagent wrote this\n');
    mockGit.current!.markUnmerged('consult/1-u');
    rmSync(unmergedWorktree.path, { recursive: true, force: true });
    const ghost = createWorktree(dir, '1-g');
    rmSync(ghost.path, { recursive: true, force: true });

    const result = removeWorktree(dir, '1-t');
    expect(result.outcome).toBe('removed');
    expect(result.cleanup.pruned).toContain(ghost.path);
    const byBranch = new Map(result.cleanup.branches.map((entry) => [entry.branch, entry]));
    expect(byBranch.get(branchFor('1-t'))).toEqual({ state: 'removed', branch: branchFor('1-t') });
    expect(byBranch.get(branchFor('1-g'))).toEqual({ state: 'removed', branch: branchFor('1-g') });
    expect(byBranch.get('consult/9-merged')).toEqual({
      state: 'removed',
      branch: 'consult/9-merged',
    });
    expect(byBranch.get(branchFor('1-u'))).toEqual({
      state: 'kept',
      branch: branchFor('1-u'),
      reason: 'unmerged',
    });
    expect(listWorktrees(dir)).toEqual([]);
    expect(existsSync(target.path)).toBe(false);
    expect(removeWorktree(dir, '1-t')).toEqual({
      outcome: 'missing',
      cleanup: {
        pruned: [],
        branches: [{ state: 'kept', branch: branchFor('1-u'), reason: 'unmerged' }],
      },
    });
  });
});

describe('cleanWorktrees', () => {
  it('掃除してから 2 回目を呼ぶ → 何も消さない', () => {
    const dir = tempDir();
    const made = createWorktree(dir, '1-a');
    rmSync(made.path, { recursive: true, force: true });

    const first = cleanWorktrees(dir);
    expect(first.pruned).toContain(made.path);
    expect(first.branches).toEqual([{ state: 'removed', branch: branchFor('1-a') }]);
    expect(listWorktrees(dir)).toEqual([]);

    expect(cleanWorktrees(dir)).toEqual({ pruned: [], branches: [] });
  });

  it('走っているサブエージェントのワークツリー → 消さず、そのブランチも消さない', () => {
    const dir = tempDir();
    const made = createWorktree(dir, '1-a');

    expect(cleanWorktrees(dir)).toEqual({ pruned: [], branches: [] });
    expect(findWorktree(dir, '1-a')).toBeDefined();
    expect(existsSync(made.path)).toBe(true);
  });

  it('git が断る → 例外', () => {
    const dir = tempDir();
    mockGit.current!.state.pruneStatus = 1;
    expect(() => cleanWorktrees(dir)).toThrow();
  });

  it('for-each-ref が status 1 → 掃除が例外', () => {
    const dir = tempDir();
    createWorktree(dir, '1-a');
    mockGit.current!.state.forEachRefStatus = 1;
    expect(() => cleanWorktrees(dir)).toThrow(/could not list the orphan branches/);
  });
});

describe('unit の保存場所', () => {
  it('unit の保存場所 → worktree の実体は unit の下の wt', () => {
    const dir = tempDir();
    const made = createWorktree(dir, '1-a');

    expect(made.unitDir).not.toBe(made.path);
    expect(made.path.startsWith(made.unitDir)).toBe(true);
    expect(made.path).toBe(join(made.unitDir, 'wt'));
    expect(dirname(made.unitDir)).toBe(ensureRoot(dir));
  });
});
