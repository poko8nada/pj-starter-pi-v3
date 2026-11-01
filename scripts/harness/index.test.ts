/**
 * `scripts/harness/index.mjs` の振る舞いを、子プロセスとして実行して試す。
 *
 * fake の 2 つのツリー（元と先）を `tempDir()` で作り、
 * `node scripts/harness/index.mjs` を子プロセスで呼ぶ（`product-ready/index.test.ts` と同じやり方）。
 * 向き、表示の行、exit を見る。
 * 塊の行は `test/scripts.fixture.ts` から組み立てる。
 */

import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
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

const SCRIPT = join(process.cwd(), 'scripts', 'harness', 'index.mjs');

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
  writeJson(join(root, 'scripts', 'harness', 'harness.json'), { starter, copy, push });
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

describe('harness diff', () => {
  it('中身違いの同じパス → copy の 1 行', () => {
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

  it('元にだけある → copy に出る', () => {
    const origin = fakeRoot();
    const local = fakeRoot();
    const rel = '.pi/a.ts';
    writeList(local, origin, [rel], [rel]);
    writeFile(join(origin, '.pi', 'a.ts'), 'extra\n');
    const out = run(['pull'], local);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain(countLine(COPY, [rel].length));
    expect(out.stdout).toContain(indented(rel));
  });

  it('両側のパスが空 → copy は 0 行', () => {
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

  it('同じ一覧に --run を付ける → 写せるパスは写り、exit 1', () => {
    const origin = fakeRoot();
    const local = fakeRoot();
    const goodRel = '.pi/a.ts';
    const badRel = '.pi/b.ts';
    writeList(local, origin, [goodRel, badRel], [goodRel, badRel]);
    writeFile(join(origin, '.pi', 'a.ts'), 'B\n');
    const out = run(['pull', RUN_FLAG], local);
    expect(out.status).toBe(1);
    expect(out.stdout).toContain(indented(goodRel));
    expect(out.stdout).toContain(indented(badRel));
    expect(readFileSync(join(local, '.pi', 'a.ts'), 'utf8')).toBe('B\n');
  });

  it('読み取りの権限が無いパス → missing の行が出ない', () => {
    const origin = fakeRoot();
    const local = fakeRoot();
    const rel = '.pi/a.ts';
    writeList(local, origin, [rel], [rel]);
    writeFile(join(origin, '.pi', 'a.ts'), 'B\n');
    try {
      chmodSync(join(origin, '.pi', 'a.ts'), 0o000);
    } catch (_unused) {
      // 権限を変えられなくても、missing が出ないことは確かめる
    }
    const out = run(['pull'], local);
    expect(out.stdout).not.toContain(`${MISSING} (`);
    try {
      chmodSync(join(origin, '.pi', 'a.ts'), 0o644);
    } catch (_unused) {
      // 戻せなくても temp のためそのままにする
    }
  });

  it('copy に glob を書く → 一致したパスが copy に出る', () => {
    const origin = fakeRoot();
    const local = fakeRoot();
    writeList(local, origin, ['.pi/*.ts'], ['.pi/*.ts']);
    writeFile(join(origin, '.pi', 'a.ts'), 'a\n');
    writeFile(join(origin, '.pi', 'b.ts'), 'b\n');
    const out = run(['pull'], local);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain(countLine(COPY, 2));
    expect(out.stdout).toContain(indented('.pi/a.ts'));
    expect(out.stdout).toContain(indented('.pi/b.ts'));
  });

  it('copy に scripts/harness の glob を書く → harness.json の行が出ない', () => {
    const origin = fakeRoot();
    const local = fakeRoot();
    const copy = ['scripts/harness/*.mjs', 'scripts/harness/*.test.ts'];
    writeList(local, origin, copy, copy);
    writeFile(join(origin, 'scripts', 'harness', 'index.mjs'), 'x\n');
    writeFile(join(origin, 'scripts', 'harness', 'list.mjs'), 'x\n');
    writeFile(join(origin, 'scripts', 'harness', 'index.test.ts'), 'x\n');
    writeFile(join(origin, 'scripts', 'harness', 'list.test.ts'), 'x\n');
    writeFile(join(origin, 'scripts', 'harness', 'config.test.ts'), 'x\n');
    writeFile(join(origin, 'scripts', 'harness', 'harness.json'), '{}\n');
    writeFile(join(origin, 'scripts', 'harness', 'starter.json'), '{}\n');
    const out = run(['pull'], local);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain(
      indented(join('scripts', 'harness', 'index.mjs').split(sep).join('/')),
    );
    expect(out.stdout).not.toContain('harness.json');
    expect(out.stdout).not.toContain('starter.json');
  });

  it('copy に一致 0 件の glob を書く → missing の行が出る', () => {
    const origin = fakeRoot();
    const local = fakeRoot();
    const pattern = '.pi/*.nomatch';
    writeList(local, origin, [pattern], [pattern]);
    mkdirSync(join(origin, '.pi'), { recursive: true });
    mkdirSync(join(local, '.pi'), { recursive: true });
    const out = run(['pull'], local);
    expect(out.status).toBe(1);
    expect(out.stdout).toContain(countLine(MISSING, [pattern].length));
    expect(out.stdout).toContain(indented(pattern));
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

  it('先にだけあるパスがある一覧に --run を付ける → そのパスは消えずに残る', () => {
    const { origin, local } = pair();
    writeFile(join(origin, '.pi', 'a.ts'), 'same\n');
    writeFile(join(local, '.pi', 'a.ts'), 'same\n');
    writeFile(join(local, '.pi', 'old.ts'), 'old\n');
    const out = run(['pull', RUN_FLAG], local);
    expect(out.status).toBe(0);
    expect(existsSync(join(local, '.pi', 'old.ts'))).toBe(true);
    expect(readFileSync(join(local, '.pi', 'old.ts'), 'utf8')).toBe('old\n');
  });

  it('.pi の中の node_modules と .git は集めない', () => {
    const { origin, local } = pair();
    writeFile(join(origin, '.pi', 'node_modules', 'a.ts'), 'B\n');
    writeFile(join(local, '.pi', 'node_modules', 'a.ts'), 'A\n');
    writeFile(join(origin, '.pi', '.git', 'b.ts'), 'B\n');
    writeFile(join(local, '.pi', '.git', 'b.ts'), 'A\n');
    const out = run(['pull'], local);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain('no files to copy');
    expect(out.stdout).toContain('no files missing');
    expect(out.stdout).not.toContain('node_modules');
    expect(out.stdout).not.toContain('.git');
  });

  it('一覧の外はどちらの塊にも出ない', () => {
    const { origin, local } = pair();
    const outsideMemo = 'memo/a.md';
    const outsideSrc = 'src/x.ts';
    writeFile(join(origin, '.pi', 'a.ts'), 'same\n');
    writeFile(join(local, '.pi', 'a.ts'), 'same\n');
    writeFile(join(origin, 'memo', 'a.md'), 'origin-memo\n');
    writeFile(join(local, 'memo', 'a.md'), 'local-memo\n');
    writeFile(join(local, 'src', 'x.ts'), 'x\n');
    const out = run(['pull'], local);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain('no files to copy');
    expect(out.stdout).not.toContain(outsideMemo);
    expect(out.stdout).not.toContain(outsideSrc);
  });

  it('先に dir が無い → その下の物が全部 copy に出る', () => {
    const { origin, local } = pair();
    const firstRel = '.pi/a.ts';
    const secondRel = '.pi/sub/b.ts';
    writeFile(join(origin, '.pi', 'a.ts'), 'a\n');
    writeFile(join(origin, '.pi', 'sub', 'b.ts'), 'b\n');
    const out = run(['pull'], local);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain(countLine(COPY, 2));
    expect(out.stdout).toContain(indented(firstRel));
    expect(out.stdout).toContain(indented(secondRel));
  });

  it('push の表示 → 向きが逆の行が出る', () => {
    const { origin, local } = pair();
    writeFile(join(origin, '.pi', 'a.ts'), 'same\n');
    writeFile(join(local, '.pi', 'a.ts'), 'same\n');
    const out = run(['push'], local);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain(pushLine(local, origin));
  });

  it('~ のパス → HOME の下を読む', () => {
    const home = fakeRoot();
    const origin = join(home, 'starter');
    const rel = '.pi/a.ts';
    writeFile(join(origin, '.pi', 'a.ts'), 'B\n');
    const local = fakeRoot();
    writeList(local, '~/starter', [rel], [rel]);
    writeFile(join(local, '.pi', 'a.ts'), 'A\n');
    const out = run(['pull'], local, { HOME: home });
    expect(out.status).toBe(0);
    expect(out.stdout).toContain(countLine(COPY, [rel].length));
    expect(out.stdout).toContain(indented(rel));
  });

  it('--run なし → 2 つのツリーが 1 つも変わらない', () => {
    const { origin, local } = pair();
    writeFile(join(origin, '.pi', 'a.ts'), 'B\n');
    writeFile(join(local, '.pi', 'a.ts'), 'A\n');
    const out = run(['pull'], local);
    expect(out.status).toBe(0);
    expect(readFileSync(join(origin, '.pi', 'a.ts'), 'utf8')).toBe('B\n');
    expect(readFileSync(join(local, '.pi', 'a.ts'), 'utf8')).toBe('A\n');
  });
});

describe('harness errors', () => {
  it('copy が配列でない → 1 行で exit 1', () => {
    const origin = fakeRoot();
    const local = fakeRoot();
    writeJson(join(local, 'scripts', 'harness', 'harness.json'), {
      starter: origin,
      copy: 'x',
      push: [],
    });
    const out = run(['pull'], local);
    expect(out.status).toBe(1);
    expect(out.stdout).toBe('');
    expect(errorLines(out)).toHaveLength(1);
  });

  it('push が配列でない → 1 行で exit 1', () => {
    const origin = fakeRoot();
    const local = fakeRoot();
    writeJson(join(local, 'scripts', 'harness', 'harness.json'), {
      starter: origin,
      copy: [],
      push: 'x',
    });
    const out = run(['pull'], local);
    expect(out.status).toBe(1);
    expect(out.stdout).toBe('');
    expect(errorLines(out)).toHaveLength(1);
  });

  it('starter が無い → 1 行で exit 1', () => {
    const local = fakeRoot();
    writeJson(join(local, 'scripts', 'harness', 'harness.json'), { copy: [], push: [] });
    const out = run(['pull'], local);
    expect(out.status).toBe(1);
    expect(out.stdout).toBe('');
    expect(errorLines(out)).toHaveLength(1);
  });

  it('harness.json が JSON でない → 1 行で exit 1', () => {
    const { local } = pair();
    writeFile(join(local, 'scripts', 'harness', 'harness.json'), '{not json');
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

  it('知らない向き → 1 行で exit 1', () => {
    const { local } = pair();
    const out = run(['fetch'], local);
    expect(out.status).toBe(1);
    expect(out.stdout).toBe('');
    expect(errorLines(out)).toHaveLength(1);
  });

  it('未知の引数 → 1 行で exit 1', () => {
    const { local } = pair();
    const out = run(['pull', '--bogus'], local);
    expect(out.status).toBe(1);
    expect(out.stdout).toBe('');
    expect(errorLines(out)).toHaveLength(1);
  });
});

describe('harness apply (--run)', () => {
  it('pull --run → 写す', () => {
    const origin = fakeRoot();
    const local = fakeRoot();
    writeList(local, origin, ['.pi/a.ts', '.pi/extra.ts'], ['.pi/a.ts', '.pi/extra.ts']);
    writeFile(join(origin, '.pi', 'a.ts'), 'B\n');
    writeFile(join(origin, '.pi', 'extra.ts'), 'extra\n');
    writeFile(join(local, '.pi', 'a.ts'), 'A\n');
    const out = run(['pull', RUN_FLAG], local);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain(countLine(COPY, 2));
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

  it('2 回目の --run → 何も写さず、木は同じ', () => {
    const origin = fakeRoot();
    const local = fakeRoot();
    writeList(local, origin, ['.pi/a.ts'], ['.pi/a.ts']);
    writeFile(join(origin, '.pi', 'a.ts'), 'B\n');
    writeFile(join(local, '.pi', 'a.ts'), 'A\n');
    const first = run(['pull', RUN_FLAG], local);
    expect(first.status).toBe(0);
    const before = snapTree(local);
    const second = run(['pull', RUN_FLAG], local);
    expect(second.status).toBe(0);
    expect(second.stdout).toContain('no files to copy');
    expect(snapTree(local)).toEqual(before);
    expect(readFileSync(join(local, '.pi', 'a.ts'), 'utf8')).toBe('B\n');
  });

  it('相手のパスが無い --run → 何も書かずに exit 1', () => {
    const local = fakeRoot();
    writeList(local, join(local, 'no-such-starter'));
    writeFile(join(local, '.pi', 'a.ts'), 'A\n');
    const before = snapTree(local);
    const out = run(['pull', RUN_FLAG], local);
    expect(out.status).toBe(1);
    expect(out.stdout).toBe('');
    expect(errorLines(out)).toHaveLength(1);
    expect(snapTree(local)).toEqual(before);
  });

  it('一覧が壊れた --run → 何も書かずに exit 1', () => {
    const origin = fakeRoot();
    const local = fakeRoot();
    writeList(local, origin);
    writeFile(join(origin, '.pi', 'a.ts'), 'B\n');
    writeFile(join(local, '.pi', 'a.ts'), 'A\n');
    writeFile(join(local, 'scripts', 'harness', 'harness.json'), '{not json');
    const before = snapTree(local);
    const beforeOrigin = snapTree(origin);
    const out = run(['pull', RUN_FLAG], local);
    expect(out.status).toBe(1);
    expect(out.stdout).toBe('');
    expect(errorLines(out)).toHaveLength(1);
    expect(snapTree(local)).toEqual(before);
    expect(snapTree(origin)).toEqual(beforeOrigin);
  });

  it('5 対 0 の混ざり → 先が元の 5 つと同じ中身になる', () => {
    const origin = fakeRoot();
    const local = fakeRoot();
    writeList(local, origin, ['.pi/*.ts'], ['.pi/*.ts']);
    const contents: Record<string, string> = {
      '1.ts': 'one\n',
      '2.ts': 'two\n',
      '3.ts': 'three\n',
      '4.ts': 'four\n',
      '5.ts': 'five\n',
    };
    for (const [name, content] of Object.entries(contents)) {
      writeFile(join(origin, '.pi', name), content);
    }
    writeFile(join(local, '.pi', '1.ts'), 'DIFFERENT-1\n');
    writeFile(join(local, '.pi', '2.ts'), 'DIFFERENT-2\n');
    const out = run(['pull', RUN_FLAG], local);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain(countLine(COPY, 5));
    for (const [name, content] of Object.entries(contents)) {
      expect(readFileSync(join(local, '.pi', name), 'utf8')).toBe(content);
    }
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

  it('相対のパスは root から解決して copy する', () => {
    const parent = fakeRoot();
    const origin = join(parent, 'starter');
    const local = join(parent, 'local');
    const rel = '.pi/a.ts';
    mkdirSync(origin, { recursive: true });
    mkdirSync(join(local, 'scripts', 'harness'), { recursive: true });
    writeJson(join(local, 'scripts', 'harness', 'harness.json'), {
      starter: '../starter',
      copy: ['.pi'],
      push: ['.pi'],
    });
    writeFile(join(origin, '.pi', 'a.ts'), 'B\n');
    writeFile(join(local, '.pi', 'a.ts'), 'A\n');
    const out = run(['pull'], local);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain(countLine(COPY, [rel].length));
    expect(out.stdout).toContain(indented(rel));
  });

  it('~foo → HOME/foo を starter として copy する', () => {
    const home = fakeRoot();
    const origin = join(home, 'foo');
    const rel = '.pi/a.ts';
    writeFile(join(origin, '.pi', 'a.ts'), 'B\n');
    const local = fakeRoot();
    writeList(local, '~foo');
    writeFile(join(local, '.pi', 'a.ts'), 'A\n');
    const out = run(['pull'], local, { HOME: home });
    expect(out.status).toBe(0);
    expect(out.stdout).toContain(countLine(COPY, [rel].length));
    expect(out.stdout).toContain(indented(rel));
  });
});
