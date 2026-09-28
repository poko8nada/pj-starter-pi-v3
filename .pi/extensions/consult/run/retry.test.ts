/**
 * 拒否されたコミットと、同じ worktree での 1 回だけの再走。
 *
 * 子は走らせない（`runOnce` は引数なので、記録するだけの関数を渡す）。git は本物を使い、フック
 * （`.git/hooks/pre-commit`）で拒否を作る。
 */
import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { tmpDir } from '../../../../test/tmp.ts';
import { gitEnv, type RunResult, type Worktree } from './run.ts';
import { attemptAndCommit, continuation } from './retry.ts';
import { stoppedPath } from './stopped.ts';

const result = (text: string): RunResult => ({ stdout: text, stderr: '', code: 0, aborted: false });

describe('attemptAndCommit', () => {
  let parent: string;
  let worktree: Worktree;

  beforeEach(() => {
    parent = tmpDir();
    const dir = join(parent, 'wt');
    mkdirSync(dir, { recursive: true });
    execFileSync('git', ['init', '--quiet', dir], { env: gitEnv() });
    execFileSync('git', ['config', 'user.email', 'consult@example.com'], {
      cwd: dir,
      env: gitEnv(),
    });
    execFileSync('git', ['config', 'user.name', 'consult'], { cwd: dir, env: gitEnv() });
    writeFileSync(join(dir, 'work.txt'), 'one\n', 'utf8');
    execFileSync('git', ['add', '-A'], { cwd: dir, env: gitEnv() });
    execFileSync('git', ['commit', '--quiet', '-m', 'base'], { cwd: dir, env: gitEnv() });
    worktree = { parent, dir, cwd: dir };
  });

  const hook = (body: string): void => {
    const path = join(worktree.dir, '.git', 'hooks', 'pre-commit');
    writeFileSync(path, `#!/bin/sh\n${body}\n`, 'utf8');
    chmodSync(path, 0o755);
  };

  it('拒否されても 2 回目で通れば ref になり、worktree も記録も残らない', async () => {
    // 1 回目だけ落ちるフック。`reject` が在る間は拒否する。
    hook('if [ -f reject ]; then echo "the hook said no" >&2; exit 1; fi');
    writeFileSync(join(worktree.dir, 'reject'), '', 'utf8');
    const notes: (string | undefined)[] = [];
    const outcome = await attemptAndCommit({
      label: 'code-1',
      worktree,
      runOnce: (note) => {
        notes.push(note);
        // 子の作業。2 回目（続きの指示が来たとき）に、フックが嫌がった物を片付ける。
        writeFileSync(join(worktree.dir, 'work.txt'), 'two\n', 'utf8');
        if (note !== undefined) {
          rmSync(join(worktree.dir, 'reject'), { force: true });
        }
        return Promise.resolve(result('fixed'));
      },
    });
    expect(outcome.attempts).toBe(2);
    expect(outcome.work.kind).toBe('committed');
    expect(outcome.run.stdout).toBe('fixed');
    expect(notes[0]).toBeUndefined();
    expect(notes[1]).toContain('the hook said no');
    expect(outcome.kept).toBeUndefined();
    expect(existsSync(stoppedPath(worktree))).toBe(false);
    // ref はリポジトリ側に作られる。親が取り込める形になっている
    const refs = execFileSync('git', ['branch', '--list', 'consult/code-1'], {
      cwd: worktree.dir,
      env: gitEnv(),
      encoding: 'utf8',
    });
    expect(refs).toContain('consult/code-1');
  });

  it('2 回とも拒否されたら worktree を残し、記録を worktree の外に置く', async () => {
    hook('echo "always no" >&2; exit 1');
    const outcome = await attemptAndCommit({
      label: 'code-1',
      worktree,
      runOnce: () => {
        writeFileSync(join(worktree.dir, 'work.txt'), 'two\n', 'utf8');
        return Promise.resolve(result('tried'));
      },
    });
    expect(outcome.attempts).toBe(2);
    expect(outcome.work.kind).toBe('failed');
    expect(outcome.kept).toBe(worktree.dir);
    expect(outcome.run.stdout).toBe('tried');
    expect(outcome.stoppedAt).toBeDefined();
    expect(existsSync(worktree.dir)).toBe(true);
    expect(existsSync(join(worktree.parent, 'stopped.json'))).toBe(true);
    const record = readFileSync(stoppedPath(worktree), 'utf8');
    expect(record).toContain('always no');
    expect(record).toContain('work.txt');
  });

  it('中断されていれば、拒否されても 2 回目は走らない', async () => {
    hook('echo "no" >&2; exit 1');
    const controller = new AbortController();
    controller.abort();
    let calls = 0;
    const outcome = await attemptAndCommit({
      label: 'code-1',
      worktree,
      signal: controller.signal,
      runOnce: () => {
        calls += 1;
        writeFileSync(join(worktree.dir, 'work.txt'), 'two\n', 'utf8');
        return Promise.resolve(result('aborted child'));
      },
    });
    expect(calls).toBe(1);
    expect(outcome.attempts).toBe(1);
    expect(outcome.work.kind).toBe('failed');
    expect(outcome.kept).toBe(worktree.dir);
  });

  it('変えた物が無ければ 1 回で終わる', async () => {
    const notes: (string | undefined)[] = [];
    const outcome = await attemptAndCommit({
      label: 'code-1',
      worktree,
      runOnce: (note) => {
        notes.push(note);
        return Promise.resolve(result('nothing to do'));
      },
    });
    expect(outcome.attempts).toBe(1);
    expect(outcome.work).toEqual({ kind: 'no-change' });
    expect(notes).toHaveLength(1);
  });

  it('続きの指示は、フックの出力をそのまま見せる', () => {
    const note = continuation('these lines are the hooks');
    expect(note).toContain('these lines are the hooks');
    expect(note).toContain('Fix what they report');
  });
});
