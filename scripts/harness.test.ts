/**
 * `scripts/harness.mjs` の振る舞いを、子プロセスとして実行して試す。
 *
 * fake の 2 つのツリー（元と先）を `tmpDir()` で作り、
 * `node scripts/harness.mjs` を子プロセスで呼ぶ（`product-ready/index.test.ts` と同じ道）。
 * 向き、`--root`、表示の行、exit を見る。
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

  it('skip に logs を書かなくても logs/ の中身は両塊に出ない（常時除外）', () => {
    const origin = fakeRoot();
    const local = fakeRoot();
    writeJson(join(local, 'scripts', 'harness.json'), {
      copy: ['.pi'],
      skip: ['harness.local.json'],
    });
    writeLocal(local, origin);
    writeFile(join(origin, '.pi', 'logs', 'a.ts'), 'B\n');
    writeFile(join(local, '.pi', 'logs', 'a.ts'), 'A\n');
    writeFile(join(origin, '.pi', 'keep.ts'), 'same\n');
    writeFile(join(local, '.pi', 'keep.ts'), 'same\n');
    const out = run(['pull', '--root', local]);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain('no files to copy');
    expect(out.stdout).toContain('no files to remove');
    expect(out.stdout).not.toContain('logs/a.ts');
  });

  it('.pi の中の node_modules / .git は集めない → どちらの塊にも出ない', () => {
    const { origin, local } = pair();
    writeFile(join(origin, '.pi', 'node_modules', 'a.ts'), 'B\n');
    writeFile(join(local, '.pi', 'node_modules', 'a.ts'), 'A\n');
    writeFile(join(origin, '.pi', '.git', 'b.ts'), 'B\n');
    writeFile(join(local, '.pi', '.git', 'b.ts'), 'A\n');
    const out = run(['pull', '--root', local]);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain('no files to copy');
    expect(out.stdout).toContain('no files to remove');
    expect(out.stdout).not.toContain('node_modules');
    expect(out.stdout).not.toContain('.git');
  });

  it('一覧の外（memo/a.md、scripts/harness.local.json、src/x.ts）→ どちらの塊にも出ない', () => {
    const { origin, local } = pair();
    // 除外が壊れたら赤になるよう、中身違いと片側だけにする（両側同内容だと copy / remove 共に空で緑のままになるため）
    writeFile(join(origin, 'memo', 'a.md'), 'origin-memo\n');
    writeFile(join(local, 'memo', 'a.md'), 'local-memo\n');
    writeFile(join(local, 'src', 'x.ts'), 'x\n');
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

describe('harness apply (--run)', () => {
  it('pull --run → 先の同じ道のファイルが元の中身になり、元にだけある物が足され、先にだけある物が消える', () => {
    const { origin, local } = pair();
    writeFile(join(origin, '.pi', 'a.ts'), 'B\n');
    writeFile(join(origin, '.pi', 'extra.ts'), 'extra\n');
    writeFile(join(local, '.pi', 'a.ts'), 'A\n');
    writeFile(join(local, '.pi', 'old.ts'), 'old\n');
    const out = run(['pull', '--root', local, '--run']);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain('copy (2):');
    expect(out.stdout).toContain('remove (1):');
    expect(readFileSync(join(local, '.pi', 'a.ts'), 'utf8')).toBe('B\n');
    expect(readFileSync(join(local, '.pi', 'extra.ts'), 'utf8')).toBe('extra\n');
    expect(existsSync(join(local, '.pi', 'old.ts'))).toBe(false);
    expect(readFileSync(join(origin, '.pi', 'a.ts'), 'utf8')).toBe('B\n');
  });

  it('push --run → 向きが逆で同じ結果（元が先）', () => {
    const { origin, local } = pair();
    writeFile(join(local, '.pi', 'a.ts'), 'A\n');
    writeFile(join(local, '.pi', 'extra.ts'), 'extra\n');
    writeFile(join(origin, '.pi', 'a.ts'), 'B\n');
    writeFile(join(origin, '.pi', 'old.ts'), 'old\n');
    const out = run(['push', '--root', local, '--run']);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain(`push: ${local} → ${origin}`);
    expect(readFileSync(join(origin, '.pi', 'a.ts'), 'utf8')).toBe('A\n');
    expect(readFileSync(join(origin, '.pi', 'extra.ts'), 'utf8')).toBe('extra\n');
    expect(existsSync(join(origin, '.pi', 'old.ts'))).toBe(false);
    expect(readFileSync(join(local, '.pi', 'a.ts'), 'utf8')).toBe('A\n');
  });

  it('先にだけ old/ がある → その中のファイルが消え、空になった old/ も消える', () => {
    const { origin, local } = pair();
    writeFile(join(origin, '.pi', 'keep.ts'), 'keep\n');
    writeFile(join(local, '.pi', 'keep.ts'), 'keep\n');
    writeFile(join(local, '.pi', 'old', 'x.ts'), 'x\n');
    writeFile(join(local, '.pi', 'old', 'y.ts'), 'y\n');
    const out = run(['pull', '--root', local, '--run']);
    expect(out.status).toBe(0);
    expect(existsSync(join(local, '.pi', 'old', 'x.ts'))).toBe(false);
    expect(existsSync(join(local, '.pi', 'old'))).toBe(false);
    expect(readFileSync(join(local, '.pi', 'keep.ts'), 'utf8')).toBe('keep\n');
  });

  it('元に空の dir だけがある → --run の後、先にその dir は作られない', () => {
    const { origin, local } = pair();
    mkdirSync(join(origin, '.pi', 'empty'), { recursive: true });
    writeFile(join(origin, '.pi', 'a.ts'), 'same\n');
    writeFile(join(local, '.pi', 'a.ts'), 'same\n');
    const out = run(['pull', '--root', local, '--run']);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain('no files to copy');
    expect(existsSync(join(local, '.pi', 'empty'))).toBe(false);
  });

  it('logs の中と一覧の外のファイル → 両方向で残る', () => {
    {
      const { origin, local } = pair();
      writeFile(join(origin, '.pi', 'a.ts'), 'same\n');
      writeFile(join(local, '.pi', 'a.ts'), 'same\n');
      writeFile(join(origin, '.pi', 'logs', 's.ts'), 'origin-logs\n');
      writeFile(join(local, '.pi', 'logs', 's.ts'), 'local-logs\n');
      writeFile(join(origin, 'memo', 'a.md'), 'origin-memo\n');
      writeFile(join(local, 'memo', 'a.md'), 'local-memo\n');
      const out = run(['pull', '--root', local, '--run']);
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
      const out = run(['push', '--root', local, '--run']);
      expect(out.status).toBe(0);
      expect(readFileSync(join(origin, '.pi', 'logs', 's.ts'), 'utf8')).toBe('origin-logs\n');
      expect(readFileSync(join(origin, 'src', 'x.ts'), 'utf8')).toBe('origin-src\n');
      expect(readFileSync(join(local, '.pi', 'logs', 's.ts'), 'utf8')).toBe('local-logs\n');
    }
  });

  it('2回目の --run → no files to copy と no files to remove、exit 0、ツリーは同じ', () => {
    const { origin, local } = pair();
    writeFile(join(origin, '.pi', 'a.ts'), 'B\n');
    writeFile(join(local, '.pi', 'a.ts'), 'A\n');
    writeFile(join(local, '.pi', 'old.ts'), 'old\n');
    const first = run(['pull', '--root', local, '--run']);
    expect(first.status).toBe(0);
    const before = snapTree(local);
    const second = run(['pull', '--root', local, '--run']);
    expect(second.status).toBe(0);
    expect(second.stdout).toContain('no files to copy');
    expect(second.stdout).toContain('no files to remove');
    expect(snapTree(local)).toEqual(before);
    expect(readFileSync(join(local, '.pi', 'a.ts'), 'utf8')).toBe('B\n');
  });

  it('相手側の道が無いツリーでの --run → 何も書かず exit 1', () => {
    const local = fakeRoot();
    writeList(local);
    writeJson(join(local, 'scripts', 'harness.local.json'), {
      starter: join(local, 'no-such-starter'),
    });
    writeFile(join(local, '.pi', 'a.ts'), 'A\n');
    const before = snapTree(local);
    const out = run(['pull', '--root', local, '--run']);
    expect(out.status).toBe(1);
    expect(out.stdout).toBe('');
    expect(errorLines(out)).toHaveLength(1);
    expect(snapTree(local)).toEqual(before);
  });

  it('一覧が JSON として読めないツリーでの --run → 何も書かず exit 1', () => {
    const { origin, local } = pair();
    writeFile(join(origin, '.pi', 'a.ts'), 'B\n');
    writeFile(join(local, '.pi', 'a.ts'), 'A\n');
    writeFile(join(local, 'scripts', 'harness.json'), '{not json');
    const before = snapTree(local);
    const beforeOrigin = snapTree(origin);
    const out = run(['pull', '--root', local, '--run']);
    expect(out.status).toBe(1);
    expect(out.stdout).toBe('');
    expect(errorLines(out)).toHaveLength(1);
    expect(snapTree(local)).toEqual(before);
    expect(snapTree(origin)).toEqual(beforeOrigin);
  });

  it('混ざったツリー（copy に 5、remove に 2）→ 表示の後、先が元の 5 つと同じ中身になる', () => {
    const { origin, local } = pair();
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
    writeFile(join(local, '.pi', 'old1.ts'), 'old1\n');
    writeFile(join(local, '.pi', 'old2.ts'), 'old2\n');
    const out = run(['pull', '--root', local, '--run']);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain('copy (5):');
    expect(out.stdout).toContain('remove (2):');
    for (const [name, content] of Object.entries(contents)) {
      expect(readFileSync(join(local, '.pi', name), 'utf8')).toBe(content);
    }
    expect(existsSync(join(local, '.pi', 'old1.ts'))).toBe(false);
    expect(existsSync(join(local, '.pi', 'old2.ts'))).toBe(false);
  });
});
