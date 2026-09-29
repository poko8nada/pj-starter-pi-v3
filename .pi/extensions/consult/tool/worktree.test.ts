import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tmpDir } from '../../../../test/tmp.ts';
import { runGit } from '../run/git-env.ts';
import { execute } from './worktree.ts';

// 置き場は本物の /tmp/pi-consult ではなく、テストごとの一時ディレクトリに逃がす。
const ROOT_KEY = 'CONSULT_ROOT';

type Outcome = Awaited<ReturnType<typeof execute>>;

/** 道具は位置で 5 つ受け取る。ここで組み立てる（ctx が使うのは cwd だけ） */
function call(params: Record<string, unknown>, cwd: string): Promise<Outcome> {
  return execute('call-1', params, undefined, undefined, { cwd });
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

function text(outcome: { content: readonly { type: string; text?: string }[] }): string {
  return outcome.content.map((part) => part.text ?? '').join('\n');
}

beforeEach(() => {
  vi.stubEnv(ROOT_KEY, tmpDir());
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

  it('remove → 消す。force 無しで変更が残っていれば断る', async () => {
    const { dir } = repo();
    await call({ action: 'new', id: '2-b' }, dir);
    const made = text(await call({ action: 'new', id: '2-b' }, dir));
    const path = /^path: (\S+)$/m.exec(made)?.[1];
    expect(path).toBeDefined();
    writeFileSync(join(path ?? dir, 'note.md'), 'left\n');

    expect(text(await call({ action: 'remove', id: '2-b' }, dir))).toContain('変更が残っている');
    expect(text(await call({ action: 'remove', id: '2-b', force: true }, dir))).toContain('消した');
    expect(text(await call({ action: 'remove', id: '2-b' }, dir))).toContain('無い');
  });

  it('知らない action → エラー', async () => {
    const { dir } = repo();
    await expect(call({ action: 'drop', id: '2-b' }, dir)).rejects.toThrow(/unknown action/);
  });
});
