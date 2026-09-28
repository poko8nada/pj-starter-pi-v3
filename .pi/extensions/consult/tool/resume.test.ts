/**
 * `consult_resume` の口。
 *
 * git は本物（`run/resume.test.ts` と同じ形の worktree を作る）。`run` は本物の `pi` を起こすので、ここでは
 *  `list` と `remove` と、断る道、`run` が渡す argv（`resumeArgs`）を確かめる。本物の `pi` を起こす所
 * （`runPi`）は検査しない。
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it } from 'vitest';
import { tmpDir } from '../../../../test/tmp.ts';
import { gitEnv } from '../run/run.ts';
import { loadTypes, resolveType } from '../policy/types.ts';
import { execute, resumeArgs, type Params } from './resume.ts';

/** この拡張の根（`tool/` の 1 つ上）。型は `types.json` から読む */
const EXTENSION_DIR = dirname(dirname(fileURLToPath(import.meta.url)));

const git = (cwd: string, args: readonly string[]): void => {
  execFileSync('git', [...args], { cwd, env: gitEnv() });
};

const call = (cwd: string, params: Params): Promise<{ content: readonly unknown[] }> =>
  execute('call', params, undefined, undefined, { cwd });

const body = (result: { content: readonly unknown[] }): string =>
  result.content
    .map((part) =>
      typeof part === 'object' && part !== null && 'text' in part && typeof part.text === 'string'
        ? part.text
        : '',
    )
    .join('');

describe('consult_resume', () => {
  let repo: string;
  let parent: string;

  beforeEach(() => {
    repo = tmpDir();
    git(repo, ['init', '--quiet']);
    git(repo, ['config', 'user.email', 'consult@example.com']);
    git(repo, ['config', 'user.name', 'consult']);
    writeFileSync(join(repo, 'a.txt'), 'one\n', 'utf8');
    git(repo, ['add', '-A']);
    git(repo, ['commit', '--quiet', '-m', 'base']);
    parent = join(repo, 'consult-abc123');
    mkdirSync(parent, { recursive: true });
    git(repo, ['worktree', 'add', '--detach', join(parent, 'wt')]);
    writeFileSync(
      join(parent, 'stopped.json'),
      JSON.stringify({
        reason: 'the hook said no',
        files: ['a.ts'],
        attempts: 2,
        stoppedAt: '2026-09-28T00:00:00.000Z',
      }),
      'utf8',
    );
  });

  it('list は id・居場所・理由を返す', async () => {
    const text = body(await call(repo, { action: 'list' }));
    expect(text).toContain('consult-abc123');
    expect(text).toContain(parent);
    expect(text).toContain('the hook said no');
    expect(text).toContain('2 run(s)');
  });

  it('run は既定で --continue を渡す（子は --no-session なので会話は引き継がない）', () => {
    const policy = resolveType(loadTypes(EXTENSION_DIR), 'code');
    const args = resumeArgs({ type: policy.name, task: 'continue', policy });
    expect(args).toContain('--continue');
    expect(args).toContain('--no-session');
  });

  it('止まった物が無ければそう言う', async () => {
    const empty = tmpDir();
    git(empty, ['init', '--quiet']);
    expect(body(await call(empty, { action: 'list' }))).toBe('No stopped worktree.');
  });

  it('id の無い run と remove は断る', async () => {
    expect(body(await call(repo, { action: 'run' }))).toContain('needs an id');
    expect(body(await call(repo, { action: 'remove' }))).toContain('needs an id');
  });

  it('知らない id は断る', async () => {
    expect(body(await call(repo, { action: 'run', id: 'consult-zzz', type: 'code' }))).toContain(
      'No stopped worktree',
    );
  });

  it('type の無い run は断る', async () => {
    expect(body(await call(repo, { action: 'run', id: 'consult-abc123' }))).toContain(
      'needs a type',
    );
  });

  it('知らない action は断る', async () => {
    expect(body(await call(repo, { action: 'delete', id: 'consult-abc123' }))).toContain(
      'Unknown action',
    );
  });

  it('remove は worktree と記録を消す', async () => {
    const text = body(await call(repo, { action: 'remove', id: 'consult-abc123' }));
    expect(text).toContain('Removed');
    expect(body(await call(repo, { action: 'list' }))).toBe('No stopped worktree.');
  });
});
