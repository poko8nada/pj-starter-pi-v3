/**
 * `scripts/harness/index.mjs` の振る舞いを、子プロセスとして実行して試す。
 *
 * fake の 2 つのツリー（元と先）を `tempDir()` で作り、
 * `node scripts/harness/index.mjs` を子プロセスで呼ぶ（`product-ready/index.test.ts` と同じ道）。
 * 向き、表示の行、exit を見る。
 * 塊の行は `test/scripts-fixture.ts` から組み立てる。
 */

import { spawnSync } from 'node:child_process';
import {
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
  LEGACY,
  REMOVE,
  RUN_FLAG,
  countLine,
  indented,
  pullLine,
  pushLine,
  sameLine,
} from '../../test/scripts-fixture.ts';
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
  copy: readonly string[] = ['.pi'],
  legacy: readonly string[] = [],
): void {
  writeJson(join(root, 'scripts', 'harness', 'harness.json'), {
    copy,
    skip: ['logs', 'starter.json'],
    legacy,
  });
}

function writeStarter(root: string, starter: string): void {
  writeJson(join(root, 'scripts', 'harness', 'starter.json'), { starter });
}

/** 元と先の 2 つを作り、先に一覧と相手の道を置く */
function pair(): { readonly origin: string; readonly local: string } {
  const origin = fakeRoot();
  const local = fakeRoot();
  writeList(local);
  writeStarter(local, origin);
  return { origin, local };
}

function errorLines(out: RunOut): string[] {
  return out.stderr.trim().split('\n');
}

/** ツリー全体の写し（道の相対 → 中身）。エラー時に何も書いていないことの照合に使う */
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

/** 5 対 2 の混ざりの元側の中身を工場で作る */
function mixedContents(): Record<string, string> {
  return {
    '1.ts': 'one\n',
    '2.ts': 'two\n',
    '3.ts': 'three\n',
    '4.ts': 'four\n',
    '5.ts': 'five\n',
  };
}

/** 5 対 2 の混ざりの先側だけの名を工場で作る */
function mixedOldNames(): readonly string[] {
  return ['old1.ts', 'old2.ts'];
}

describe('harness diff', () => {
  it('中身違いの同じ道 → copy の 1 行', () => {
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
    expect(out.stdout).toContain('no files to remove');
  });

  it('元にだけある → copy に出る', () => {
    const { origin, local } = pair();
    const sameRel = '.pi/a.ts';
    const extraRel = '.pi/extra.ts';
    writeFile(join(origin, '.pi', 'a.ts'), 'same\n');
    writeFile(join(local, '.pi', 'a.ts'), 'same\n');
    writeFile(join(origin, '.pi', 'extra.ts'), 'extra\n');
    const out = run(['pull'], local);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain(countLine(COPY, [extraRel].length));
    expect(out.stdout).toContain(indented(extraRel));
    expect(out.stdout).not.toContain(indented(sameRel));
  });

  it('先にだけある → remove に出て、copy は 0', () => {
    const { origin, local } = pair();
    const sameRel = '.pi/a.ts';
    const oldRel = '.pi/old.ts';
    writeFile(join(origin, '.pi', 'a.ts'), 'same\n');
    writeFile(join(local, '.pi', 'a.ts'), 'same\n');
    writeFile(join(local, '.pi', 'old.ts'), 'old\n');
    const out = run(['pull'], local);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain('no files to copy');
    expect(out.stdout).toContain(countLine(REMOVE, [oldRel].length));
    expect(out.stdout).toContain(indented(oldRel));
    expect(out.stdout).not.toContain(indented(sameRel));
  });

  it('両側とも空 → どちらの行も出さない', () => {
    const { local } = pair();
    const out = run(['pull'], local);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain('no files to copy');
    expect(out.stdout).toContain('no files to remove');
  });

  it('skip に書かなくても logs の中身は両塊に出ない', () => {
    const origin = fakeRoot();
    const local = fakeRoot();
    const copy = ['.pi'];
    writeJson(join(local, 'scripts', 'harness', 'harness.json'), {
      copy,
      skip: ['starter.json'],
      legacy: [],
    });
    writeStarter(local, origin);
    const skipRel = '.pi/logs/a.ts';
    const keepRel = '.pi/keep.ts';
    writeFile(join(origin, '.pi', 'logs', 'a.ts'), 'B\n');
    writeFile(join(local, '.pi', 'logs', 'a.ts'), 'A\n');
    writeFile(join(origin, '.pi', 'keep.ts'), 'same\n');
    writeFile(join(local, '.pi', 'keep.ts'), 'same\n');
    const out = run(['pull'], local);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain('no files to copy');
    expect(out.stdout).toContain('no files to remove');
    expect(out.stdout).not.toContain(skipRel);
    expect(out.stdout).not.toContain(indented(keepRel));
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
    expect(out.stdout).toContain('no files to remove');
    expect(out.stdout).not.toContain('node_modules');
    expect(out.stdout).not.toContain('.git');
  });

  it('一覧の外はどちらの塊にも出ない', () => {
    const { origin, local } = pair();
    const outsideMemo = 'memo/a.md';
    const outsideSrc = 'src/x.ts';
    writeFile(join(origin, 'memo', 'a.md'), 'origin-memo\n');
    writeFile(join(local, 'memo', 'a.md'), 'local-memo\n');
    writeFile(join(local, 'src', 'x.ts'), 'x\n');
    const out = run(['pull'], local);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain('no files to copy');
    expect(out.stdout).toContain('no files to remove');
    expect(out.stdout).not.toContain(outsideMemo);
    expect(out.stdout).not.toContain(outsideSrc);
  });

  it('先に dir が無い → その下の物が全部 copy に出る', () => {
    const { origin, local } = pair();
    const firstRel = '.pi/a.ts';
    const secondRel = '.pi/sub/b.ts';
    writeFile(join(origin, '.pi', 'a.ts'), 'a\n');
    writeFile(join(origin, '.pi', 'sub', 'b.ts'), 'b\n');
    const expected = [firstRel, secondRel];
    const out = run(['pull'], local);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain(countLine(COPY, expected.length));
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

  it('~ の道 → HOME の下を読む', () => {
    const home = fakeRoot();
    const origin = join(home, 'starter');
    const rel = '.pi/a.ts';
    writeFile(join(origin, '.pi', 'a.ts'), 'B\n');
    const local = fakeRoot();
    writeList(local);
    writeStarter(local, '~/starter');
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
  it('harness.json が無い → 1 行で exit 1', () => {
    const fresh = fakeRoot();
    writeStarter(fresh, fakeRoot());
    const out = run(['pull'], fresh);
    expect(out.status).toBe(1);
    expect(out.stdout).toBe('');
    expect(errorLines(out)).toHaveLength(1);
  });

  it('copy が配列でない → 1 行で exit 1', () => {
    const { local } = pair();
    writeJson(join(local, 'scripts', 'harness', 'harness.json'), { copy: 'x' });
    const out = run(['pull'], local);
    expect(out.status).toBe(1);
    expect(out.stdout).toBe('');
    expect(errorLines(out)).toHaveLength(1);
  });

  it('starter.json が無い → 1 行で exit 1', () => {
    const origin = fakeRoot();
    const local = fakeRoot();
    writeList(local);
    writeFile(join(origin, '.pi', 'a.ts'), 'B\n');
    writeFile(join(local, '.pi', 'a.ts'), 'A\n');
    const out = run(['pull'], local);
    expect(out.status).toBe(1);
    expect(out.stdout).toBe('');
    expect(errorLines(out)).toHaveLength(1);
    expect(errorLines(out)[0]).toBe(
      `no such file: ${join(local, 'scripts', 'harness', 'starter.json')}`,
    );
  });

  it('starter.json が JSON でない → 1 行で exit 1', () => {
    const { local } = pair();
    writeFile(join(local, 'scripts', 'harness', 'starter.json'), '{not json');
    const out = run(['pull'], local);
    expect(out.status).toBe(1);
    expect(out.stdout).toBe('');
    expect(errorLines(out)).toHaveLength(1);
  });

  it('starter が空文字 → 1 行で exit 1', () => {
    const { local } = pair();
    writeJson(join(local, 'scripts', 'harness', 'starter.json'), { starter: '' });
    const out = run(['pull'], local);
    expect(out.status).toBe(1);
    expect(out.stdout).toBe('');
    expect(errorLines(out)).toHaveLength(1);
  });

  it('starter が空の物 → 1 行で exit 1', () => {
    const { local } = pair();
    writeJson(join(local, 'scripts', 'harness', 'starter.json'), {});
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

  it('旧 harness.json → 1 行で exit 1', () => {
    const origin = fakeRoot();
    const local = fakeRoot();
    writeJson(join(local, 'scripts', 'harness.json'), { copy: ['.pi'], skip: [] });
    writeStarter(local, origin);
    writeFile(join(origin, '.pi', 'a.ts'), 'B\n');
    writeFile(join(local, '.pi', 'a.ts'), 'A\n');
    const out = run(['pull'], local);
    expect(out.status).toBe(1);
    expect(out.stdout).toBe('');
    expect(errorLines(out)).toHaveLength(1);
  });

  it('legacy が配列でない → 1 行で exit 1', () => {
    const { local } = pair();
    writeJson(join(local, 'scripts', 'harness', 'harness.json'), {
      copy: ['.pi'],
      skip: [],
      legacy: 'x',
    });
    const out = run(['pull'], local);
    expect(out.status).toBe(1);
    expect(out.stdout).toBe('');
    expect(errorLines(out)).toHaveLength(1);
  });
});

describe('harness apply (--run)', () => {
  it('pull --run → 写して消す', () => {
    const { origin, local } = pair();
    const copyRels = ['.pi/a.ts', '.pi/extra.ts'];
    const removeRel = '.pi/old.ts';
    writeFile(join(origin, '.pi', 'a.ts'), 'B\n');
    writeFile(join(origin, '.pi', 'extra.ts'), 'extra\n');
    writeFile(join(local, '.pi', 'a.ts'), 'A\n');
    writeFile(join(local, '.pi', 'old.ts'), 'old\n');
    const out = run(['pull', RUN_FLAG], local);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain(countLine(COPY, copyRels.length));
    expect(out.stdout).toContain(countLine(REMOVE, [removeRel].length));
    expect(readFileSync(join(local, '.pi', 'a.ts'), 'utf8')).toBe('B\n');
    expect(readFileSync(join(local, '.pi', 'extra.ts'), 'utf8')).toBe('extra\n');
    expect(existsSync(join(local, '.pi', 'old.ts'))).toBe(false);
    expect(readFileSync(join(origin, '.pi', 'a.ts'), 'utf8')).toBe('B\n');
  });

  it('push --run → 逆の向きで同じ結果になる', () => {
    const { origin, local } = pair();
    writeFile(join(local, '.pi', 'a.ts'), 'A\n');
    writeFile(join(local, '.pi', 'extra.ts'), 'extra\n');
    writeFile(join(origin, '.pi', 'a.ts'), 'B\n');
    writeFile(join(origin, '.pi', 'old.ts'), 'old\n');
    const out = run(['push', RUN_FLAG], local);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain(pushLine(local, origin));
    expect(readFileSync(join(origin, '.pi', 'a.ts'), 'utf8')).toBe('A\n');
    expect(readFileSync(join(origin, '.pi', 'extra.ts'), 'utf8')).toBe('extra\n');
    expect(existsSync(join(origin, '.pi', 'old.ts'))).toBe(false);
    expect(readFileSync(join(local, '.pi', 'a.ts'), 'utf8')).toBe('A\n');
  });

  it('先だけの古い物 → 消え、空になった dir も消える', () => {
    const { origin, local } = pair();
    const keepRel = '.pi/keep.ts';
    const oldDir = join(local, '.pi', 'old');
    writeFile(join(origin, '.pi', 'keep.ts'), 'keep\n');
    writeFile(join(local, '.pi', 'keep.ts'), 'keep\n');
    writeFile(join(local, '.pi', 'old', 'x.ts'), 'x\n');
    writeFile(join(local, '.pi', 'old', 'y.ts'), 'y\n');
    const out = run(['pull', RUN_FLAG], local);
    expect(out.status).toBe(0);
    expect(existsSync(join(local, '.pi', 'old', 'x.ts'))).toBe(false);
    expect(existsSync(oldDir)).toBe(false);
    expect(readFileSync(join(local, '.pi', 'keep.ts'), 'utf8')).toBe('keep\n');
    expect(out.stdout).not.toContain(indented(keepRel));
  });

  it('logs と一覧の外 → 両方向とも残る', () => {
    {
      const { origin, local } = pair();
      writeFile(join(origin, '.pi', 'a.ts'), 'same\n');
      writeFile(join(local, '.pi', 'a.ts'), 'same\n');
      writeFile(join(origin, '.pi', 'logs', 's.ts'), 'origin-logs\n');
      writeFile(join(local, '.pi', 'logs', 's.ts'), 'local-logs\n');
      writeFile(join(origin, 'memo', 'a.md'), 'origin-memo\n');
      writeFile(join(local, 'memo', 'a.md'), 'local-memo\n');
      const out = run(['pull', RUN_FLAG], local);
      expect(out.status).toBe(0);
      expect(readFileSync(join(local, '.pi', 'logs', 's.ts'), 'utf8')).toBe('local-logs\n');
      expect(readFileSync(join(local, 'memo', 'a.md'), 'utf8')).toBe('local-memo\n');
      expect(readFileSync(join(origin, '.pi', 'logs', 's.ts'), 'utf8')).toBe('origin-logs\n');
    }
    {
      const { origin, local } = pair();
      writeFile(join(origin, '.pi', 'a.ts'), 'same\n');
      writeFile(join(local, '.pi', 'a.ts'), 'same\n');
      writeFile(join(origin, '.pi', 'logs', 's.ts'), 'origin-logs\n');
      writeFile(join(local, '.pi', 'logs', 's.ts'), 'local-logs\n');
      writeFile(join(origin, 'src', 'x.ts'), 'origin-src\n');
      writeFile(join(local, 'src', 'x.ts'), 'local-src\n');
      const out = run(['push', RUN_FLAG], local);
      expect(out.status).toBe(0);
      expect(readFileSync(join(origin, '.pi', 'logs', 's.ts'), 'utf8')).toBe('origin-logs\n');
      expect(readFileSync(join(origin, 'src', 'x.ts'), 'utf8')).toBe('origin-src\n');
      expect(readFileSync(join(local, '.pi', 'logs', 's.ts'), 'utf8')).toBe('local-logs\n');
    }
  });

  it('2 回目の --run → 何も写さず、木は同じ', () => {
    const { origin, local } = pair();
    writeFile(join(origin, '.pi', 'a.ts'), 'B\n');
    writeFile(join(local, '.pi', 'a.ts'), 'A\n');
    writeFile(join(local, '.pi', 'old.ts'), 'old\n');
    const first = run(['pull', RUN_FLAG], local);
    expect(first.status).toBe(0);
    const before = snapTree(local);
    const second = run(['pull', RUN_FLAG], local);
    expect(second.status).toBe(0);
    expect(second.stdout).toContain('no files to copy');
    expect(second.stdout).toContain('no files to remove');
    expect(snapTree(local)).toEqual(before);
    expect(readFileSync(join(local, '.pi', 'a.ts'), 'utf8')).toBe('B\n');
  });

  it('相手の道が無い --run → 何も書かずに exit 1', () => {
    const local = fakeRoot();
    writeList(local);
    writeJson(join(local, 'scripts', 'harness', 'starter.json'), {
      starter: join(local, 'no-such-starter'),
    });
    writeFile(join(local, '.pi', 'a.ts'), 'A\n');
    const before = snapTree(local);
    const out = run(['pull', RUN_FLAG], local);
    expect(out.status).toBe(1);
    expect(out.stdout).toBe('');
    expect(errorLines(out)).toHaveLength(1);
    expect(snapTree(local)).toEqual(before);
  });

  it('一覧が壊れた --run → 何も書かずに exit 1', () => {
    const { origin, local } = pair();
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

  it('5 対 2 の混ざり → 先が元の 5 つと同じ中身になる', () => {
    const { origin, local } = pair();
    const contents = mixedContents();
    const olds = mixedOldNames();
    const copyRels = Object.keys(contents).map((name) => `.pi/${name}`);
    for (const [name, content] of Object.entries(contents)) {
      writeFile(join(origin, '.pi', name), content);
    }
    writeFile(join(local, '.pi', '1.ts'), 'DIFFERENT-1\n');
    writeFile(join(local, '.pi', '2.ts'), 'DIFFERENT-2\n');
    for (const name of olds) {
      writeFile(join(local, '.pi', name), 'old\n');
    }
    const out = run(['pull', RUN_FLAG], local);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain(countLine(COPY, copyRels.length));
    expect(out.stdout).toContain(countLine(REMOVE, olds.length));
    for (const [name, content] of Object.entries(contents)) {
      expect(readFileSync(join(local, '.pi', name), 'utf8')).toBe(content);
    }
    for (const name of olds) {
      expect(existsSync(join(local, '.pi', name))).toBe(false);
    }
  });
});

describe('harness legacy', () => {
  it('legacy の道は消え、--run なしでは残る', () => {
    const legacyRel = join('scripts', 'harness.mjs');
    const origin = fakeRoot();
    const local = fakeRoot();
    writeList(local, ['.pi'], [legacyRel]);
    writeStarter(local, origin);
    writeFile(join(origin, '.pi', 'a.ts'), 'same\n');
    writeFile(join(local, '.pi', 'a.ts'), 'same\n');
    writeFile(join(local, 'scripts', 'harness.mjs'), 'old\n');
    const beforeOrigin = snapTree(origin);
    const out = run(['pull', RUN_FLAG], local);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain(countLine(LEGACY, [legacyRel].length));
    expect(out.stdout).toContain(indented(legacyRel));
    expect(existsSync(join(local, 'scripts', 'harness.mjs'))).toBe(false);
    expect(snapTree(origin)).toEqual(beforeOrigin);
    const dryOrigin = fakeRoot();
    const dryLocal = fakeRoot();
    writeList(dryLocal, ['.pi'], [legacyRel]);
    writeStarter(dryLocal, dryOrigin);
    writeFile(join(dryOrigin, '.pi', 'a.ts'), 'same\n');
    writeFile(join(dryLocal, '.pi', 'a.ts'), 'same\n');
    writeFile(join(dryLocal, 'scripts', 'harness.mjs'), 'old\n');
    const dry = run(['pull'], dryLocal);
    expect(dry.status).toBe(0);
    expect(dry.stdout).toContain(countLine(LEGACY, [legacyRel].length));
    expect(existsSync(join(dryLocal, 'scripts', 'harness.mjs'))).toBe(true);
  });

  it('legacy の道が先に無い → 何も消さず、表示も出さない', () => {
    const legacyRel = join('scripts', 'harness.mjs');
    const origin = fakeRoot();
    const local = fakeRoot();
    writeList(local, ['.pi'], [legacyRel]);
    writeStarter(local, origin);
    writeFile(join(origin, '.pi', 'a.ts'), 'same\n');
    writeFile(join(local, '.pi', 'a.ts'), 'same\n');
    const before = snapTree(local);
    const out = run(['pull'], local);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain('no legacy to remove');
    expect(out.stdout).not.toContain(legacyRel);
    expect(snapTree(local)).toEqual(before);
  });
});

describe('harness starter', () => {
  it('starter.json は copy にも remove にも出ない', () => {
    const origin = fakeRoot();
    const local = fakeRoot();
    writeList(local, ['scripts/harness'], []);
    writeList(origin, ['scripts/harness'], []);
    writeStarter(local, origin);
    writeJson(join(origin, 'scripts', 'harness', 'starter.json'), { starter: local });
    writeFile(join(origin, 'scripts', 'harness', 'other.txt'), 'same\n');
    writeFile(join(local, 'scripts', 'harness', 'other.txt'), 'same\n');
    const before = snapTree(local);
    const out = run(['pull'], local);
    expect(out.status).toBe(0);
    expect(out.stdout).not.toContain('starter.json');
    expect(out.stdout).toContain('no files to copy');
    expect(out.stdout).toContain('no files to remove');
    expect(snapTree(local)).toEqual(before);
  });

  it('starter 自身は same の 1 行', () => {
    const local = fakeRoot();
    const origin = fakeRoot();
    writeStarter(local, local);
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

  it('相対の道は root から解決して copy する', () => {
    const parent = fakeRoot();
    const origin = join(parent, 'starter');
    const local = join(parent, 'local');
    const rel = '.pi/a.ts';
    mkdirSync(origin, { recursive: true });
    mkdirSync(join(local, 'scripts', 'harness'), { recursive: true });
    writeJson(join(local, 'scripts', 'harness', 'harness.json'), {
      copy: ['.pi'],
      skip: ['starter.json'],
      legacy: [],
    });
    writeJson(join(local, 'scripts', 'harness', 'starter.json'), { starter: '../starter' });
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
    writeList(local);
    writeStarter(local, '~foo');
    writeFile(join(local, '.pi', 'a.ts'), 'A\n');
    const out = run(['pull'], local, { HOME: home });
    expect(out.status).toBe(0);
    expect(out.stdout).toContain(countLine(COPY, [rel].length));
    expect(out.stdout).toContain(indented(rel));
  });
});
