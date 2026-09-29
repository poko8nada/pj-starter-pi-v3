import { writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tmpDir } from '../../../../test/tmp.ts';
import { runGit } from './git-env.ts';
import {
  branchFor,
  createWorktree,
  findWorktree,
  listWorktrees,
  removeWorktree,
  rootFor,
  unitRoot,
} from './worktree.ts';

// 置き場は本物の /tmp/pi-consult ではなく、テストごとの一時ディレクトリに逃がす（後始末も helper がする）。
const ROOT_KEY = 'CONSULT_ROOT';

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

beforeEach(() => {
  vi.stubEnv(ROOT_KEY, tmpDir());
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('createWorktree', () => {
  it('unit の worktree を作る → ブランチと置き場が決まる', () => {
    const { dir } = repo();
    const made = createWorktree(dir, '1-a');

    expect(made.id).toBe('1-a');
    expect(made.branch).toBe('consult/1-a');
    expect(made.path.startsWith(rootFor(dir))).toBe(true);
    expect(basename(made.path)).toBe('wt');
    expect(made.path.endsWith(join('1-a', 'wt'))).toBe(true);
    expect(listWorktrees(dir).map((row) => row.id)).toEqual(['1-a']);
  });

  it('2 回呼んでも増えない → 同じ物が返る', () => {
    const { dir } = repo();
    const first = createWorktree(dir, '1-a');
    const second = createWorktree(dir, '1-a');

    expect(second.path).toBe(first.path);
    expect(listWorktrees(dir)).toHaveLength(1);
  });

  it('base を指定できる → そのコミットから切る', () => {
    const { dir, home } = repo();
    const before = runGit(dir, home, ['rev-parse', 'HEAD']).stdout.trim();
    writeFileSync(join(dir, 'next.md'), 'next\n');
    runGit(dir, home, ['add', '-A']);
    runGit(dir, home, ['commit', '--quiet', '-m', 'next']);

    const made = createWorktree(dir, '2-b', before);
    expect(runGit(made.path, home, ['rev-parse', 'HEAD']).stdout.trim()).toBe(before);
  });

  it('変な id は git が断る → 置き場を残さない', () => {
    const { dir } = repo();
    expect(() => createWorktree(dir, 'a b')).toThrow(/could not create the worktree/);
    expect(listWorktrees(dir)).toHaveLength(0);
  });
});

describe('listWorktrees / findWorktree', () => {
  it('作業場が 1 つも無い → 空', () => {
    const { dir } = repo();
    expect(listWorktrees(dir)).toEqual([]);
    expect(findWorktree(dir, '1-a')).toBeUndefined();
  });

  it('変更が残っている worktree → dirty', () => {
    const { dir } = repo();
    const made = createWorktree(dir, '1-a');
    expect(findWorktree(dir, '1-a')?.dirty).toBe(false);

    writeFileSync(join(made.path, 'note.md'), 'the child wrote this\n');
    expect(findWorktree(dir, '1-a')?.dirty).toBe(true);
  });

  it('台帳ファイルを持たない → 一覧は git から作る', () => {
    const { dir } = repo();
    createWorktree(dir, '1-a');
    const root = rootFor(dir);
    // root の中は unit の入れ物と worktree だけ。台帳は無い
    expect([...new Set(listWorktrees(dir).map((row) => row.root))]).toEqual([join(root, '1-a')]);
  });
});

describe('removeWorktree', () => {
  it('作って消す → 消える。もう一度は missing', () => {
    const { dir } = repo();
    createWorktree(dir, '1-a');

    expect(removeWorktree(dir, '1-a')).toBe('removed');
    expect(listWorktrees(dir)).toEqual([]);
    expect(removeWorktree(dir, '1-a')).toBe('missing');
  });

  it('子が動いている → busy で断る', () => {
    const { dir } = repo();
    createWorktree(dir, '1-a');

    expect(removeWorktree(dir, '1-a', { busy: true })).toBe('busy');
    expect(listWorktrees(dir)).toHaveLength(1);
  });

  it('変更が残っている → force 無しでは断る', () => {
    const { dir } = repo();
    const made = createWorktree(dir, '1-a');
    writeFileSync(join(made.path, 'note.md'), 'the child wrote this\n');

    expect(removeWorktree(dir, '1-a')).toBe('dirty');
    expect(listWorktrees(dir)).toHaveLength(1);
  });

  it('変更が残っていても force なら消える', () => {
    const { dir } = repo();
    const made = createWorktree(dir, '1-a');
    writeFileSync(join(made.path, 'note.md'), 'the child wrote this\n');

    expect(removeWorktree(dir, '1-a', { force: true })).toBe('removed');
    expect(listWorktrees(dir)).toEqual([]);
  });

  it('ブランチは消えるまで残る（親のツリーは汚れない）', () => {
    const { dir, home } = repo();
    createWorktree(dir, '1-a');
    removeWorktree(dir, '1-a');

    expect(runGit(dir, home, ['branch', '--list', 'consult/*']).stdout).toContain(branchFor('1-a'));
    expect(runGit(dir, home, ['status', '--porcelain']).stdout.trim()).toBe('');
  });
});

describe('unitRoot', () => {
  it('worktree の外を指す → 記録を置いてもリポジトリは汚れない', () => {
    const { dir } = repo();
    const made = createWorktree(dir, '1-a');

    expect(unitRoot(dir, '1-a')).toBe(made.root);
    expect(made.root).not.toBe(made.path);
    expect(made.path.startsWith(made.root)).toBe(true);
  });
});
