import { existsSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { basename, dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tmpDir } from '../../../../test/tmp.ts';
import { runGit } from './git-env.ts';
import { gitEnv } from './run.ts';
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

/**
 * worktree に git を打つ。だめなときは投げる。
 *
 * `runGit` は `GIT_DIR` / `GIT_WORK_TREE` を repo 用に固定するので worktree の中では使えない
 * （cwd を worktree にしても、repo の作業木を見てしまう。実際にこの検査で嵌まった）。
 */
function gitInWorktree(path: string, args: readonly string[]): void {
  const result = spawnSync('git', [...args], {
    cwd: path,
    encoding: 'utf8',
    env: gitEnv(process.env),
  });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${(result.stderr || '').trim()}`);
  }
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

beforeEach(() => {
  vi.stubEnv(ROOT_KEY, tmpDir());
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('rootFor', () => {
  it('worktree を作った後でも、同じ root を返す（実体のパスで比べる）', () => {
    const { dir } = repo();
    createWorktree(dir, '1-a');
    const made = rootFor(dir);
    const root = process.env[ROOT_KEY] ?? '';

    // 時刻を飛ばして 2 回目を呼ぶ。実体のパスで比べていないと、既存の置き場を見つけられず、
    // ここで別の名前の置き場ができてしまう（記録を読む側が迷子になる）
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

  it('worktree が無ければ新しく 1 つ作る', () => {
    const { dir } = repo();
    expect(readdirSync(process.env[ROOT_KEY] ?? '')).toHaveLength(0);
    expect(rootFor(dir).endsWith('/')).toBe(false);
    expect(readdirSync(process.env[ROOT_KEY] ?? '')).toHaveLength(1);
  });
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

describe('listWorktrees のゴースト', () => {
  it('実体がある登録 → 一覧に出る', () => {
    const { dir } = repo();
    createWorktree(dir, '1-a');

    expect(listWorktrees(dir).map((row) => row.id)).toEqual(['1-a']);
    expect(findWorktree(dir, '1-a')).toBeDefined();
  });

  it('実体の無い path の登録 → 一覧に出ない', () => {
    const { dir } = repo();
    const made = createWorktree(dir, '1-a');
    rmSync(made.path, { recursive: true, force: true });

    expect(listWorktrees(dir)).toEqual([]);
    expect(findWorktree(dir, '1-a')).toBeUndefined();
  });

  it('git が断る（リポジトリでない）→ 空の一覧', () => {
    expect(listWorktrees(tmpDir())).toEqual([]);
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
    // root の中は unit の入れ物だけ（unitDir）。実行の根は runRootで、 その親
    expect([...new Set(listWorktrees(dir).map((row) => row.runRoot))]).toEqual([root]);
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

  it('ブランチは、取り込み済みなら一緒に消える（親のツリーは汚れない）', () => {
    const { dir, home } = repo();
    createWorktree(dir, '1-a');
    // 子が何も書いていない（ブランチは base のまま = 親に取り込み済み）
    expect(removeWorktree(dir, '1-a')).toBe('removed');

    expect(runGit(dir, home, ['branch', '--list', 'consult/*']).stdout.trim()).toBe('');
    expect(runGit(dir, home, ['status', '--porcelain']).stdout.trim()).toBe('');
  });

  it('未マージのブランチは残す（仕事を消さない）', () => {
    const { dir, home } = repo();
    const made = createWorktree(dir, '1-a');
    writeFileSync(join(made.path, 'note.md'), 'the child wrote this\n');
    // worktree で 1 つコミットする = 親に取り込まれていない仕事。
    // `runGit` は repo 用に GIT_DIR を固定するので、worktree は `-C` で指す
    gitInWorktree(made.path, ['add', '-A']);
    gitInWorktree(made.path, ['commit', '--no-verify', '--quiet', '-m', "the child's work"]);

    expect(removeWorktree(dir, '1-a')).toBe('removed-branch-kept');
    expect(runGit(dir, home, ['branch', '--list', 'consult/*']).stdout).toContain(branchFor('1-a'));
    // 仕事はブランチに残っている
    expect(runGit(dir, home, ['log', '--oneline', branchFor('1-a')]).stdout).toContain(
      "the child's work",
    );
  });

  it('remove が消すのは unit のディレクトリだけ（同じ実行の別 unit は残る）', () => {
    const { dir } = repo();
    const first = createWorktree(dir, '1-a');
    const second = createWorktree(dir, '1-b');
    // 同じ実行の根に同居している
    expect(dirname(second.unitDir)).toBe(dirname(first.unitDir));

    expect(removeWorktree(dir, '1-a')).toBe('removed');

    // 1-a の unit は消え、実行の根と 1-b の unit は残る
    expect(existsSync(first.unitDir)).toBe(false);
    expect(existsSync(dirname(second.unitDir))).toBe(true);
    expect(existsSync(second.unitDir)).toBe(true);
    expect(findWorktree(dir, '1-b')).toBeDefined();
  });

  it('未マージでも force ならブランチも消える（捨てる）', () => {
    const { dir, home } = repo();
    const made = createWorktree(dir, '1-a');
    writeFileSync(join(made.path, 'note.md'), 'the child wrote this\n');
    gitInWorktree(made.path, ['add', '-A']);
    gitInWorktree(made.path, ['commit', '--no-verify', '--quiet', '-m', "the child's work"]);

    expect(removeWorktree(dir, '1-a', { force: true })).toBe('removed');
    expect(runGit(dir, home, ['branch', '--list', 'consult/*']).stdout.trim()).toBe('');
  });
});

describe('unitRoot', () => {
  it('worktree の外を指す → 記録を置いてもリポジトリは汚れない', () => {
    const { dir } = repo();
    const made = createWorktree(dir, '1-a');

    expect(unitRoot(dir, '1-a')).toBe(made.unitDir);
    expect(made.unitDir).not.toBe(made.path);
    expect(made.path.startsWith(made.unitDir)).toBe(true);
    // path は unitDir の下（<unitDir>/wt）、runRoot は unitDir の親
    expect(made.path).toBe(join(made.unitDir, 'wt'));
    expect(dirname(made.unitDir)).toBe(rootFor(dir));
  });
});
