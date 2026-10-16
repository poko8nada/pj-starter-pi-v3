/**
 * `scripts/harness.mjs` の振る舞いを、子プロセスとして実行して試す。
 *
 * fake の 2 つのツリー（元と先）を `tmpDir()` で作り、
 * `node scripts/harness.mjs` を子プロセスで呼ぶ（`product-ready/index.test.ts` と同じ道）。
 * 向き、`--root`、表示の行、exit を見る。
 */

import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tmpDir } from '../test/tmp.ts';

const SCRIPT = join(process.cwd(), 'scripts', 'harness.mjs');

interface RunOut {
  readonly status: number;
  readonly stdout: string;
  readonly stderr: string;
}

function run(args: readonly string[], cwd?: string, env?: Record<string, string>): RunOut {
  const result = spawnSync('node', [SCRIPT, ...args], {
    encoding: 'utf8',
    cwd: cwd ?? process.cwd(),
    env: { ...process.env, ...env },
  });
  return { status: result.status ?? -1, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

/** symlink の据え（`typecheck.test.ts` と同じ理由） */
function fakeRoot(): string {
  return realpathSync(tmpDir());
}

function writeFile(abs: string, content = 'x\n'): void {
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content);
}

function writeJson(abs: string, data: unknown): void {
  writeFile(abs, `${JSON.stringify(data, null, 2)}\n`);
}

function writeList(root: string, copy: readonly string[] = ['.pi']): void {
  writeJson(join(root, 'scripts', 'harness.json'), {
    copy,
    skip: ['logs', 'harness.local.json'],
  });
}

function writeLocal(root: string, starter: string): void {
  writeJson(join(root, 'scripts', 'harness.local.json'), { starter });
}

/** 元と先の 2 つを作り、先に一覧と相手の道を置く */
function pair(): { readonly origin: string; readonly local: string } {
  const origin = fakeRoot();
  const local = fakeRoot();
  writeList(local);
  writeLocal(local, origin);
  return { origin, local };
}

function errorLines(out: RunOut): string[] {
  return out.stderr.trim().split('\n');
}

describe('harness diff', () => {
  it('元と先に同じ道の1ファイル（中身違い） → copy (1) に1行、no files to remove', () => {
    const { origin, local } = pair();
    writeFile(join(origin, '.pi', 'a.ts'), 'B\n');
    writeFile(join(local, '.pi', 'a.ts'), 'A\n');
    const out = run(['pull', '--root', local]);
    expect(out.status).toBe(0);
    expect(out.stderr).toBe('');
    expect(out.stdout).toContain(`pull: ${origin} → ${local}`);
    expect(out.stdout).toContain('copy (1):');
    expect(out.stdout).toContain('.pi/a.ts');
    expect(out.stdout).toContain('no files to remove');
  });

  it('元にだけあるファイル → copy に出る', () => {
    const { origin, local } = pair();
    writeFile(join(origin, '.pi', 'a.ts'), 'same\n');
    writeFile(join(local, '.pi', 'a.ts'), 'same\n');
    writeFile(join(origin, '.pi', 'extra.ts'), 'extra\n');
    const out = run(['pull', '--root', local]);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain('copy (1):');
    expect(out.stdout).toContain('.pi/extra.ts');
  });

  it('先にだけあるファイル → remove に出て、copy は 0', () => {
    const { origin, local } = pair();
    writeFile(join(origin, '.pi', 'a.ts'), 'same\n');
    writeFile(join(local, '.pi', 'a.ts'), 'same\n');
    writeFile(join(local, '.pi', 'old.ts'), 'old\n');
    const out = run(['pull', '--root', local]);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain('no files to copy');
    expect(out.stdout).toContain('remove (1):');
    expect(out.stdout).toContain('.pi/old.ts');
  });

  it('両側とも空 → no files to copy と no files to remove、exit 0', () => {
    const { local } = pair();
    const out = run(['pull', '--root', local]);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain('no files to copy');
    expect(out.stdout).toContain('no files to remove');
  });

  it('logs の中のファイルが両側にある → どちらの塊にも出ない', () => {
    const { origin, local } = pair();
    writeFile(join(origin, '.pi', 'logs', 'a.ts'), 'B\n');
    writeFile(join(local, '.pi', 'logs', 'a.ts'), 'A\n');
    const out = run(['pull', '--root', local]);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain('no files to copy');
    expect(out.stdout).toContain('no files to remove');
    expect(out.stdout).not.toContain('logs/a.ts');
  });

  it('一覧の外（memo/a.md、scripts/harness.local.json、src/x.ts）→ どちらの塊にも出ない', () => {
    const { origin, local } = pair();
    for (const root of [origin, local]) {
      writeFile(join(root, 'memo', 'a.md'), 'memo\n');
      writeFile(join(root, 'src', 'x.ts'), 'x\n');
    }
    const out = run(['pull', '--root', local]);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain('no files to copy');
    expect(out.stdout).toContain('no files to remove');
    expect(out.stdout).not.toContain('memo/a.md');
    expect(out.stdout).not.toContain('src/x.ts');
  });

  it('元の dir を丸ごと持たない先 → その下のファイルが全部 copy に出る', () => {
    const { origin, local } = pair();
    writeFile(join(origin, '.pi', 'a.ts'), 'a\n');
    writeFile(join(origin, '.pi', 'sub', 'b.ts'), 'b\n');
    const out = run(['pull', '--root', local]);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain('copy (2):');
    expect(out.stdout).toContain('.pi/a.ts');
    expect(out.stdout).toContain('.pi/sub/b.ts');
  });

  it('push の表示 → push: <root> → <相手> の行が出る（向きが逆）', () => {
    const { origin, local } = pair();
    writeFile(join(origin, '.pi', 'a.ts'), 'same\n');
    writeFile(join(local, '.pi', 'a.ts'), 'same\n');
    const out = run(['push', '--root', local]);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain(`push: ${local} → ${origin}`);
  });

  it('--root を省く → cwd のツリーを root として読む', () => {
    const { origin, local } = pair();
    writeFile(join(origin, '.pi', 'a.ts'), 'B\n');
    writeFile(join(local, '.pi', 'a.ts'), 'A\n');
    const out = run(['pull'], local);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain('copy (1):');
    expect(out.stdout).toContain('.pi/a.ts');
  });

  it('~/... の道 → HOME を fake に向けて、その下を読む', () => {
    const home = fakeRoot();
    const origin = join(home, 'starter');
    writeFile(join(origin, '.pi', 'a.ts'), 'B\n');
    const local = fakeRoot();
    writeList(local);
    writeLocal(local, '~/starter');
    writeFile(join(local, '.pi', 'a.ts'), 'A\n');
    const out = run(['pull', '--root', local], undefined, { HOME: home });
    expect(out.status).toBe(0);
    expect(out.stdout).toContain('copy (1):');
    expect(out.stdout).toContain('.pi/a.ts');
  });

  it('--run なし → 2つのツリーが1つも変わらない', () => {
    const { origin, local } = pair();
    writeFile(join(origin, '.pi', 'a.ts'), 'B\n');
    writeFile(join(local, '.pi', 'a.ts'), 'A\n');
    const out = run(['pull', '--root', local]);
    expect(out.status).toBe(0);
    expect(readFileSync(join(origin, '.pi', 'a.ts'), 'utf8')).toBe('B\n');
    expect(readFileSync(join(local, '.pi', 'a.ts'), 'utf8')).toBe('A\n');
  });
});

describe('harness errors', () => {
  it('scripts/harness.json が無い → 1行、exit 1', () => {
    const { local } = pair();
    writeFile(join(local, '.pi', 'a.ts'), 'A\n');
    const out = run(['pull', '--root', local]);
    // 一覧を消してから回す
    const fresh = fakeRoot();
    writeLocal(fresh, local);
    const missing = run(['pull', '--root', fresh]);
    expect(missing.status).toBe(1);
    expect(missing.stdout).toBe('');
    expect(errorLines(missing)).toHaveLength(1);
    expect(out.status).toBe(0);
  });

  it('一覧が JSON として読めない → 1行、exit 1', () => {
    const { local } = pair();
    writeFile(join(local, 'scripts', 'harness.json'), '{not json');
    const out = run(['pull', '--root', local]);
    expect(out.status).toBe(1);
    expect(out.stdout).toBe('');
    expect(errorLines(out)).toHaveLength(1);
  });

  it('一覧の copy が配列でない（{"copy":"x"}）→ 1行、exit 1', () => {
    const { local } = pair();
    writeJson(join(local, 'scripts', 'harness.json'), { copy: 'x' });
    const out = run(['pull', '--root', local]);
    expect(out.status).toBe(1);
    expect(out.stdout).toBe('');
    expect(errorLines(out)).toHaveLength(1);
  });

  it('scripts/harness.local.json が無い → 1行、exit 1', () => {
    const origin = fakeRoot();
    const local = fakeRoot();
    writeList(local);
    writeFile(join(origin, '.pi', 'a.ts'), 'B\n');
    writeFile(join(local, '.pi', 'a.ts'), 'A\n');
    const out = run(['pull', '--root', local]);
    expect(out.status).toBe(1);
    expect(out.stdout).toBe('');
    expect(errorLines(out)).toHaveLength(1);
  });

  it('harness.local.json の道が無い → 1行、exit 1', () => {
    const { local } = pair();
    writeJson(join(local, 'scripts', 'harness.local.json'), {});
    const out = run(['pull', '--root', local]);
    expect(out.status).toBe(1);
    expect(out.stdout).toBe('');
    expect(errorLines(out)).toHaveLength(1);
  });

  it('向きが無い → 1行、exit 1', () => {
    const { local } = pair();
    const out = run(['--root', local]);
    expect(out.status).toBe(1);
    expect(out.stdout).toBe('');
    expect(errorLines(out)).toHaveLength(1);
  });

  it('知らない向き → 1行、exit 1', () => {
    const { local } = pair();
    const out = run(['fetch', '--root', local]);
    expect(out.status).toBe(1);
    expect(out.stdout).toBe('');
    expect(errorLines(out)).toHaveLength(1);
  });

  it('未知の引数 → 1行、exit 1', () => {
    const { local } = pair();
    const out = run(['pull', '--root', local, '--bogus']);
    expect(out.status).toBe(1);
    expect(out.stdout).toBe('');
    expect(errorLines(out)).toHaveLength(1);
  });

  it('--root に値が無い → 1行、exit 1', () => {
    const { local } = pair();
    const out = run(['pull', '--root'], local);
    expect(out.status).toBe(1);
    expect(out.stdout).toBe('');
    expect(errorLines(out)).toHaveLength(1);
  });
});
