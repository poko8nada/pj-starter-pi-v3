import { rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { git } from '../../../../lib/git-env.mjs';
import { tempDir } from '../../../../test/temp-dir.ts';
import { orphanBranchesIn } from './worktree.ts';

const FILE = 'hello.txt';
const CONTENT = 'hello\n';
const WT = 'wt1';

function initRepo(): string {
  const dir = tempDir('git-contract-');
  git(dir, ['init'], process.env);
  writeFileSync(join(dir, FILE), CONTENT);
  git(dir, ['add', FILE], process.env);
  git(
    dir,
    ['-c', 'user.email=a@example.com', '-c', 'user.name=a', 'commit', '-m', 'init'],
    process.env,
  );
  return dir;
}

/** worktree を置く場所。リポジトリの中に置くと status に現れるので、別の一時ディレクトリにする */
function worktreeDir(): string {
  return tempDir('git-contract-wt-');
}

describe('git contract', () => {
  it('happy: worktree を追加した直後の worktree list --porcelain → worktree、HEAD、branch の3行と空行', () => {
    const dir = initRepo();
    const wt = join(worktreeDir(), WT);
    git(dir, ['worktree', 'add', '-b', WT, wt, 'HEAD'], process.env);
    const output = git(dir, ['worktree', 'list', '--porcelain'], process.env).stdout;
    const blocks = output.split('\n\n').filter((block) => block.trim() !== '');
    expect(blocks.length).toBeGreaterThanOrEqual(2);
    for (const block of blocks) {
      const lines = block.split('\n');
      expect(lines).toHaveLength(3);
      expect(lines[0]?.startsWith('worktree ')).toBe(true);
      expect(lines[1]?.startsWith('HEAD ')).toBe(true);
      expect(lines[2]?.startsWith('branch refs/heads/')).toBe(true);
    }
  });

  it('happy: 実体を消した worktree → prunable で始まる行が付く', () => {
    const dir = initRepo();
    const wt = join(worktreeDir(), WT);
    git(dir, ['worktree', 'add', '-b', WT, wt, 'HEAD'], process.env);
    rmSync(wt, { recursive: true, force: true });
    const output = git(dir, ['worktree', 'list', '--porcelain'], process.env).stdout;
    expect(output.split('\n').some((line) => line.startsWith('prunable'))).toBe(true);
  });

  it('happy: checkout 中のブランチと、checkout されていないブランチ → for-each-ref の各行が refs/heads/consult/<name> と2列目を持ち、orphanBranchesIn は checkout 中の行だけを捨てる', () => {
    const dir = initRepo();
    git(
      dir,
      ['worktree', 'add', '-b', 'consult/held', join(worktreeDir(), 'held'), 'HEAD'],
      process.env,
    );
    git(dir, ['branch', 'consult/free'], process.env);
    const raw = git(
      dir,
      ['for-each-ref', '--format=%(refname) %(worktreepath)', 'refs/heads/consult/*'],
      process.env,
    ).stdout;
    const lines = raw.split('\n').filter((line) => line !== '');
    const held = lines.find((line) => line.startsWith('refs/heads/consult/held'));
    const free = lines.find((line) => line.startsWith('refs/heads/consult/free'));
    expect(held?.startsWith('refs/heads/consult/held ')).toBe(true);
    expect(held?.slice('refs/heads/consult/held '.length).trim() !== '').toBe(true);
    expect(free).toBe('refs/heads/consult/free ');
    expect(orphanBranchesIn(raw)).toEqual(['consult/free']);
  });

  it('happy: 未マージのブランチ → branch -d の終了符号が 1、branch -D の終了符号が 0', () => {
    const dir = initRepo();
    const wt = join(worktreeDir(), 'unmerged');
    git(dir, ['worktree', 'add', '-b', 'consult/unmerged', wt, 'HEAD'], process.env);
    writeFileSync(join(wt, FILE), 'more\n');
    git(wt, ['add', FILE], process.env);
    git(
      wt,
      ['-c', 'user.email=a@example.com', '-c', 'user.name=a', 'commit', '-m', 'more'],
      process.env,
    );
    git(dir, ['worktree', 'remove', '--force', wt], process.env);
    expect(git(dir, ['branch', '-d', 'consult/unmerged'], process.env).status).toBe(1);
    expect(git(dir, ['branch', '-D', 'consult/unmerged'], process.env).status).toBe(0);
  });

  it('error: 使えない GIT_INDEX_FILE（ディレクトリ）を設定した状態 → git() はそれでも一時リポジトリを見る', () => {
    const dir = initRepo();
    const result = git(dir, ['status', '--porcelain'], {
      ...process.env,
      GIT_INDEX_FILE: tempDir('git-contract-index-'),
    });
    expect(result.status).toBe(0);
  });
});
