/**
 * `scripts/checks/typecheck.mjs` の振る舞いを、子プロセスとして実行して試す。
 *
 * fake root にツリーを作り、`node_modules/.bin/tsc` にスタブを置く。
 * スタブは渡された `-p` を出して、`STUB_FAIL` に含まれる所だけ exit 1 で落とす。
 * これで、回した所の名前・渡された `-p` の道・exit を stdout で見る。
 */

import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tempDir } from '../../test/temp-dir.ts';

const SCRIPT = join(process.cwd(), 'scripts', 'checks', 'typecheck.mjs');

interface RunOut {
  readonly status: number;
  readonly stdout: string;
  readonly stderr: string;
}

function run(root: string, env: Record<string, string> = {}): RunOut {
  const result = spawnSync('node', [SCRIPT], {
    encoding: 'utf8',
    cwd: root,
    env: { ...process.env, ...env },
  });
  return { status: result.status ?? -1, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

/** node_modules を持たない代わりにスタブを置けるツリー */
function fakeRoot(): string {
  // macOS では /var が /private/var への symlink。process.cwd() は実体に解けるので、
  // 据えないと path.relative ではなく -p の道の比較が狂う
  return realpathSync(tempDir());
}

/** `node_modules/.bin/tsc` にスタブを置く（`-p` を出して、決めた所だけ exit 1） */
function stubTsc(root: string): void {
  const bin = join(root, 'node_modules', '.bin');
  mkdirSync(bin, { recursive: true });
  const stub = join(bin, 'tsc');
  writeFileSync(
    stub,
    '#!/usr/bin/env node\n' +
      "const at = process.argv.indexOf('-p');\n" +
      'const got = at >= 0 ? (process.argv[at + 1] ?? "") : "";\n' +
      'console.log(`stub -p ${got}`);\n' +
      'const fail = process.env.STUB_FAIL ?? "";\n' +
      'if (fail !== "" && got.includes(fail)) process.exit(1);\n' +
      'process.exit(0);\n',
  );
  chmodSync(stub, 0o755);
}

function writeTsconfig(root: string, rel: string): void {
  const file = join(root, rel);
  mkdirSync(join(file, '..'), { recursive: true });
  writeFileSync(file, '{}');
}

function writeScopes(root: string, scopes: readonly string[]): void {
  const dir = join(root, 'scripts', 'checks');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'scopes.json'), JSON.stringify(scopes));
}

describe('typecheck', () => {
  it('一覧が [".pi"] で両方つながる → root と .pi を回す（exit 0）', () => {
    const root = fakeRoot();
    stubTsc(root);
    writeTsconfig(root, 'tsconfig.json');
    writeTsconfig(root, join('.pi', 'tsconfig.json'));
    writeScopes(root, ['.pi']);
    const out = run(root);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain('root: ok');
    expect(out.stdout).toContain('.pi: ok');
    expect(out.stdout).toContain(join(root, 'tsconfig.json'));
    expect(out.stdout).toContain(join(root, '.pi', 'tsconfig.json'));
  });

  it('.pi の時だけスタブが落とす → .pi: failed（exit 1）', () => {
    const root = fakeRoot();
    stubTsc(root);
    writeTsconfig(root, 'tsconfig.json');
    writeTsconfig(root, join('.pi', 'tsconfig.json'));
    writeScopes(root, ['.pi']);
    const out = run(root, { STUB_FAIL: '.pi' });
    expect(out.status).toBe(1);
    expect(out.stdout).toContain('root: ok');
    expect(out.stdout).toContain('.pi: failed');
  });

  it('一覧に .opencode があるが tsconfig が無い → .opencode の行が出ない', () => {
    const root = fakeRoot();
    stubTsc(root);
    writeTsconfig(root, 'tsconfig.json');
    writeTsconfig(root, join('.pi', 'tsconfig.json'));
    writeScopes(root, ['.pi', '.opencode']);
    const out = run(root);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain('.pi: ok');
    expect(out.stdout).not.toContain('.opencode');
  });

  it('一覧が無い → root だけ（.pi の tsconfig があっても回さない）', () => {
    const root = fakeRoot();
    stubTsc(root);
    writeTsconfig(root, 'tsconfig.json');
    writeTsconfig(root, join('.pi', 'tsconfig.json'));
    const out = run(root);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain('root: ok');
    expect(out.stdout).not.toContain('.pi');
  });

  it('一覧が [] → root だけ', () => {
    const root = fakeRoot();
    stubTsc(root);
    writeTsconfig(root, 'tsconfig.json');
    writeTsconfig(root, join('.pi', 'tsconfig.json'));
    writeScopes(root, []);
    const out = run(root);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain('root: ok');
    expect(out.stdout).not.toContain('.pi');
  });

  it('一覧が JSON として読めない → exit 1（the list is not valid JSON の行）', () => {
    const root = fakeRoot();
    stubTsc(root);
    writeTsconfig(root, 'tsconfig.json');
    const dir = join(root, 'scripts', 'checks');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'scopes.json'), '{not json');
    const out = run(root);
    expect(out.status).toBe(1);
    expect(`${out.stdout}\n${out.stderr}`).toContain('the list is not valid JSON');
  });
});

describe('前提（このリポジトリ）', () => {
  it('scripts/checks/scopes.json は [".pi"]', () => {
    const scopes = JSON.parse(
      readFileSync(join(process.cwd(), 'scripts', 'checks', 'scopes.json'), 'utf8'),
    );
    expect(scopes).toEqual(['.pi']);
  });

  it('package.json の scripts.typecheck は node scripts/checks/typecheck.mjs', () => {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'));
    expect(pkg.scripts.typecheck).toBe('node scripts/checks/typecheck.mjs');
  });

  it('package.json の scripts.typecheck:staged は node scripts/checks/typecheck-staged.mjs', () => {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'));
    expect(pkg.scripts['typecheck:staged']).toBe('node scripts/checks/typecheck-staged.mjs');
  });
});
