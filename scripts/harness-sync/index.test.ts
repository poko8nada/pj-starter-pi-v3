/**
 * `scripts/harness-sync/index.mjs` の振る舞いを、子プロセスとして実行して試す。
 *
 * fake の 2 つのツリー（元と先）を `tempDir()` で作り、
 * `node scripts/harness-sync/index.mjs` を子プロセスで呼ぶ。
 * 通し（copy、missing、終了コード、3 種のエラー、same、`--run`）だけを見る。
 * 細かい分岐は `path`、`collect`、`diff`、`display` の単体で見る。
 */

import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, realpathSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  COPY,
  MISSING,
  RUN_FLAG,
  countLine,
  indented,
  pullLine,
  pushLine,
  sameLine,
} from '../../test/scripts.fixture.ts';
import { tempDir } from '../../test/temp-dir.ts';

const SCRIPT = join(process.cwd(), 'scripts', 'harness-sync', 'index.mjs');

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
  return realpathSync(tempDir());
}

function writeFile(abs: string, content = 'x\n'): void {
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content);
}

function writeJson(abs: string, data: unknown): void {
  writeFile(abs, `${JSON.stringify(data, null, 2)}\n`);
}

function writeList(
  root: string,
  starter: string,
  copy: readonly string[] = ['.pi'],
  push: readonly string[] = ['.pi'],
): void {
  writeJson(join(root, 'scripts', 'harness-sync', 'setting.json'), { starter, copy, push });
}

/** 元と先の 2 つを作り、先に一覧と相手のパスを置く */
function pair(): { readonly origin: string; readonly local: string } {
  const origin = fakeRoot();
  const local = fakeRoot();
  writeList(local, origin);
  return { origin, local };
}

function errorLines(out: RunOut): string[] {
  return out.stderr.trim().split('\n');
}

/** ツリー全体の写し（パスの相対 → 中身）。エラー時に何も書いていないことの照合に使う */
function snapTree(root: string): Readonly<Record<string, string>> {
  const out: Record<string, string> = {};
  const walk = (dir: string): void => {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git') {
        continue;
      }
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile()) {
        out[relative(root, full).split(sep).join('/')] = readFileSync(full, 'utf8');
      }
    }
  };
  walk(root);
  return out;
}

describe('harness main', () => {
  it('中身違いの同じパス → copy に出て exit 0', () => {
    const { origin, local } = pair();
    const rel = '.pi/a.ts';
    writeFile(join(origin, '.pi', 'a.ts'), 'B\n');
    writeFile(join(local, '.pi', 'a.ts'), 'A\n');
    const out = run(['pull'], local);
    expect(out.status).toBe(0);
    expect(out.stderr).toBe('');
    expect(out.stdout).toContain(pullLine(origin, local));
    expect(out.stdout).toContain(countLine(COPY, [rel].length));
    expect(out.stdout).toContain(indented(rel));
    expect(out.stdout).toContain('no files missing');
  });

  it('元に無いパス → missing に出て exit 1', () => {
    const origin = fakeRoot();
    const local = fakeRoot();
    const rel = '.pi/a.ts';
    writeList(local, origin, [rel], [rel]);
    const out = run(['pull'], local);
    expect(out.status).toBe(1);
    expect(out.stdout).toContain(countLine(MISSING, [rel].length));
    expect(out.stdout).toContain(indented(rel));
    expect(out.stdout).toContain('no files to copy');
  });

  it('両側のパスが空 → copy は 0 行で exit 0', () => {
    const origin = fakeRoot();
    const local = fakeRoot();
    writeList(local, origin, ['.pi'], ['.pi']);
    mkdirSync(join(origin, '.pi'), { recursive: true });
    mkdirSync(join(local, '.pi'), { recursive: true });
    const out = run(['pull'], local);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain('no files to copy');
    expect(out.stdout).toContain('no files missing');
  });

  it('pull は copy を読み、push は push を読む', () => {
    const origin = fakeRoot();
    const local = fakeRoot();
    writeList(local, origin, ['.pi/a.ts'], ['.pi/b.ts']);
    writeFile(join(origin, '.pi', 'a.ts'), 'a\n');
    writeFile(join(origin, '.pi', 'b.ts'), 'b\n');
    const pullOut = run(['pull'], local);
    expect(pullOut.status).toBe(0);
    expect(pullOut.stdout).toContain(indented('.pi/a.ts'));
    expect(pullOut.stdout).not.toContain(indented('.pi/b.ts'));
    const pushLocal = fakeRoot();
    const pushOrigin = fakeRoot();
    writeList(pushLocal, pushOrigin, ['.pi/a.ts'], ['.pi/b.ts']);
    writeFile(join(pushLocal, '.pi', 'a.ts'), 'a\n');
    writeFile(join(pushLocal, '.pi', 'b.ts'), 'b\n');
    const pushOut = run(['push'], pushLocal);
    expect(pushOut.status).toBe(0);
    expect(pushOut.stdout).toContain(indented('.pi/b.ts'));
    expect(pushOut.stdout).not.toContain(indented('.pi/a.ts'));
  });
});

describe('harness errors', () => {
  it('copy が配列でない → 1 行で exit 1', () => {
    const origin = fakeRoot();
    const local = fakeRoot();
    writeJson(join(local, 'scripts', 'harness-sync', 'setting.json'), {
      starter: origin,
      copy: 'x',
      push: [],
    });
    const out = run(['pull'], local);
    expect(out.status).toBe(1);
    expect(out.stdout).toBe('');
    expect(errorLines(out)).toHaveLength(1);
  });

  it('starter の指すパスが無い → 1 行で exit 1', () => {
    const local = fakeRoot();
    writeList(local, join(local, 'no-such-starter'));
    writeFile(join(local, '.pi', 'a.ts'), 'A\n');
    const out = run(['pull'], local);
    expect(out.status).toBe(1);
    expect(out.stdout).toBe('');
    expect(errorLines(out)).toHaveLength(1);
  });

  it('向きが無い → 1 行で exit 1', () => {
    const { local } = pair();
    const out = run([], local);
    expect(out.status).toBe(1);
    expect(out.stdout).toBe('');
    expect(errorLines(out)).toHaveLength(1);
  });
});

describe('harness starter', () => {
  it('starter 自身は same の 1 行', () => {
    const local = fakeRoot();
    const origin = fakeRoot();
    writeList(local, local);
    writeFile(join(local, '.pi', 'a.ts'), 'A\n');
    writeFile(join(origin, '.pi', 'a.ts'), 'B\n');
    const beforeLocal = snapTree(local);
    const beforeOrigin = snapTree(origin);
    const out = run(['pull'], local);
    expect(out.status).toBe(0);
    expect(out.stdout.trim().split('\n')).toHaveLength(1);
    expect(out.stdout).toContain(sameLine(local));
    expect(snapTree(local)).toEqual(beforeLocal);
    expect(snapTree(origin)).toEqual(beforeOrigin);
  });
});

describe('harness apply (--run)', () => {
  it('pull --run → 写す', () => {
    const origin = fakeRoot();
    const local = fakeRoot();
    const rels = ['.pi/a.ts', '.pi/extra.ts'];
    writeList(local, origin, rels, rels);
    writeFile(join(origin, '.pi', 'a.ts'), 'B\n');
    writeFile(join(origin, '.pi', 'extra.ts'), 'extra\n');
    writeFile(join(local, '.pi', 'a.ts'), 'A\n');
    const out = run(['pull', RUN_FLAG], local);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain(countLine(COPY, rels.length));
    expect(readFileSync(join(local, '.pi', 'a.ts'), 'utf8')).toBe('B\n');
    expect(readFileSync(join(local, '.pi', 'extra.ts'), 'utf8')).toBe('extra\n');
    expect(readFileSync(join(origin, '.pi', 'a.ts'), 'utf8')).toBe('B\n');
  });

  it('push --run → 逆の向きで同じ結果になる', () => {
    const origin = fakeRoot();
    const local = fakeRoot();
    writeList(local, origin, ['.pi/a.ts'], ['.pi/a.ts', '.pi/extra.ts']);
    writeFile(join(local, '.pi', 'a.ts'), 'A\n');
    writeFile(join(local, '.pi', 'extra.ts'), 'extra\n');
    writeFile(join(origin, '.pi', 'a.ts'), 'B\n');
    const out = run(['push', RUN_FLAG], local);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain(pushLine(local, origin));
    expect(readFileSync(join(origin, '.pi', 'a.ts'), 'utf8')).toBe('A\n');
    expect(readFileSync(join(origin, '.pi', 'extra.ts'), 'utf8')).toBe('extra\n');
    expect(readFileSync(join(local, '.pi', 'a.ts'), 'utf8')).toBe('A\n');
  });
});
