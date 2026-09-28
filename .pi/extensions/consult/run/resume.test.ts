/**
 * 止まった子の worktree の一覧と消去。
 *
 * git は本物を使い、worktree も本物を作る（`<tmp>/consult-XXXX/wt`。`run/run.ts` の `createWorktree` と同じ形）。
 * 記録（`stopped.json`）は手で置く。
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { tmpDir } from '../../../../test/tmp.ts';
import { gitEnv } from './run.ts';
import { parseWorktreeList, removeStopped, stoppedWorktrees } from './resume.ts';

const git = (cwd: string, args: readonly string[]): void => {
  execFileSync('git', [...args], { cwd, env: gitEnv() });
};

describe('parseWorktreeList', () => {
  it('worktree ごとに分けて読む', () => {
    const text = [
      'worktree /a/wt',
      'HEAD abc',
      'detached',
      '',
      'worktree /b/wt',
      'HEAD def',
      'branch refs/heads/main',
      '',
    ].join('\n');
    expect(parseWorktreeList(text)).toEqual([
      { dir: '/a/wt', detached: true },
      { dir: '/b/wt', detached: false },
    ]);
  });
});

describe('stoppedWorktrees', () => {
  let repo: string;
  let parent: string;

  const record = {
    reason: 'lint failed\nthe second line',
    files: ['a.ts'],
    attempts: 2,
    stoppedAt: '2026-09-28T00:00:00.000Z',
  };

  beforeEach(() => {
    repo = tmpDir();
    git(repo, ['init', '--quiet']);
    git(repo, ['config', 'user.email', 'consult@example.com']);
    git(repo, ['config', 'user.name', 'consult']);
    writeFileSync(join(repo, 'a.txt'), 'one\n', 'utf8');
    git(repo, ['add', '-A']);
    git(repo, ['commit', '--quiet', '-m', 'base']);
    // consult が残した物と同じ形: `<親>/consult-XXXX/wt`
    parent = join(repo, 'consult-abc123');
    mkdirSync(parent, { recursive: true });
    git(repo, ['worktree', 'add', '--detach', join(parent, 'wt')]);
  });

  it('consult が作った worktree を、記録と一緒に返す', () => {
    writeFileSync(join(parent, 'stopped.json'), JSON.stringify(record), 'utf8');
    const found = stoppedWorktrees(repo);
    expect(found).toHaveLength(1);
    expect(found[0]?.id).toBe('consult-abc123');
    // macOS の /var は /private/var への symlink なので、git が返す実パスと比べる
    expect(found[0]?.parent).toBe(realpathSync(parent));
    expect(found[0]?.record?.reason).toContain('lint failed');
    expect(found[0]?.record?.files).toEqual(['a.ts']);
  });

  it('記録が無くても返す（record は付かない）', () => {
    const found = stoppedWorktrees(repo);
    expect(found).toHaveLength(1);
    expect(found[0]?.record).toBeUndefined();
  });

  it('消すと、worktree も親ごと消える', () => {
    const removed = removeStopped(repo, 'consult-abc123');
    expect(removed?.id).toBe('consult-abc123');
    expect(existsSync(parent)).toBe(false);
    const list = execFileSync('git', ['worktree', 'list'], {
      cwd: repo,
      env: gitEnv(),
      encoding: 'utf8',
    });
    expect(list).not.toContain('consult-abc123');
  });

  it('知らない id では何も消さない', () => {
    expect(removeStopped(repo, 'consult-zzz')).toBeUndefined();
    expect(existsSync(parent)).toBe(true);
  });
});
