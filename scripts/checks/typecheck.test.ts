/**
 * `scripts/checks/typecheck.mjs` の振る舞いを、子プロセスとして実行して試す。
 *
 * fake root にツリーを作り、`node_modules/.bin/tsc` にスタブを置く。
 * スタブは渡された `-p` を出して、`STUB_FAIL` に含まれる所だけ exit 1 で落とす。
 * これで、回した所の名前・渡された `-p` の道・exit を stdout で見る。
 * 表示の行は `test/scripts.fixture.ts` から組み立てる。
 */

import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FAILED, INVALID_LIST_LINE, OK, statusLine } from '../../test/scripts.fixture.ts';
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
  it('一覧の全部に tsconfig がある → どの範囲も ok の行を出す', () => {
    const scope = '.pi';
    const rootName = 'root';
    const root = fakeRoot();
    stubTsc(root);
    writeTsconfig(root, 'tsconfig.json');
    writeTsconfig(root, join(scope, 'tsconfig.json'));
    writeScopes(root, [scope]);
    const out = run(root);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain(statusLine(rootName, OK));
    expect(out.stdout).toContain(statusLine(scope, OK));
    expect(out.stdout).toContain(join(root, 'tsconfig.json'));
    expect(out.stdout).toContain(join(root, scope, 'tsconfig.json'));
  });

  it('1 つの範囲が失敗する → その範囲だけ failed の行を出す', () => {
    const scope = '.pi';
    const rootName = 'root';
    const root = fakeRoot();
    stubTsc(root);
    writeTsconfig(root, 'tsconfig.json');
    writeTsconfig(root, join(scope, 'tsconfig.json'));
    writeScopes(root, [scope]);
    const out = run(root, { STUB_FAIL: scope });
    expect(out.status).toBe(1);
    expect(out.stdout).toContain(statusLine(rootName, OK));
    expect(out.stdout).toContain(statusLine(scope, FAILED));
  });

  it('一覧にある範囲でも tsconfig が無ければ、その行を出さない', () => {
    const scope = '.pi';
    const missing = '.opencode';
    const root = fakeRoot();
    stubTsc(root);
    writeTsconfig(root, 'tsconfig.json');
    writeTsconfig(root, join(scope, 'tsconfig.json'));
    writeScopes(root, [scope, missing]);
    const out = run(root);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain(statusLine(scope, OK));
    expect(out.stdout).not.toContain(missing);
  });

  it('一覧が空 → root の行だけを出す', () => {
    const scope = '.pi';
    const rootName = 'root';
    const root = fakeRoot();
    stubTsc(root);
    writeTsconfig(root, 'tsconfig.json');
    writeTsconfig(root, join(scope, 'tsconfig.json'));
    writeScopes(root, []);
    const out = run(root);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain(statusLine(rootName, OK));
    expect(out.stdout).not.toContain(scope);
  });

  it('一覧のファイルが無い → root の行だけを出し、exit 0', () => {
    const scope = '.pi';
    const rootName = 'root';
    const root = fakeRoot();
    stubTsc(root);
    writeTsconfig(root, 'tsconfig.json');
    writeTsconfig(root, join(scope, 'tsconfig.json'));
    const out = run(root);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain(statusLine(rootName, OK));
    expect(out.stdout).not.toContain(scope);
  });

  it('scopes.json が JSON でない → exit 1 と理由の行', () => {
    const root = fakeRoot();
    stubTsc(root);
    writeTsconfig(root, 'tsconfig.json');
    const dir = join(root, 'scripts', 'checks');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'scopes.json'), '{not json');
    const out = run(root);
    expect(out.status).toBe(1);
    expect(`${out.stdout}\n${out.stderr}`).toContain(INVALID_LIST_LINE);
  });
});
