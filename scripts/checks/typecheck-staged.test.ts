/**
 * `scripts/checks/typecheck-staged.mjs` の振る舞いを、子プロセスとして実行して試す。
 *
 * fake root の `node_modules/.bin/tsc` にスタブを置く（渡された `-p` を出す）。
 * これで、どの `tsconfig` が使われたかを見る。スタブに渡るのは一時 tsconfig
 * （`.typecheck-staged-*.json`）で、元の `tsconfig.json` と同じ所に置かれる。
 * だから `-p` の道に `.pi` が入るかで、`.pi` の group か root の group かが分かる。
 * tsc そのものが成功するかは pre-commit の時系列で担保されているので、ここでは見ない。
 * 印と旗は `test/scripts-fixture.ts` から取る。
 */

import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { INVALID_LIST_LINE } from '../../test/scripts-fixture.ts';
import { tempDir } from '../../test/temp-dir.ts';

const SCRIPT = join(process.cwd(), 'scripts', 'checks', 'typecheck-staged.mjs');
const STUB_MARK = 'stub -p';

interface RunOut {
  readonly status: number;
  readonly stdout: string;
  readonly stderr: string;
}

function run(root: string, args: readonly string[]): RunOut {
  const result = spawnSync('node', [SCRIPT, ...args], { encoding: 'utf8', cwd: root });
  return { status: result.status ?? -1, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

/** node_modules を持たない代わりにスタブを置けるツリー */
function fakeRoot(): string {
  // macOS では /var が /private/var への symlink。process.cwd() は実体に解けるので、
  // 据えないと path.relative(root, abs) が狂う（ハーネス判定が .pi に当たらなくなる）
  return realpathSync(tempDir());
}

/** `node_modules/.bin/tsc` にスタブを置く（渡された `-p` を出すだけ。常に exit 0） */
function stubTsc(root: string): void {
  const bin = join(root, 'node_modules', '.bin');
  mkdirSync(bin, { recursive: true });
  const stub = join(bin, 'tsc');
  writeFileSync(
    stub,
    '#!/usr/bin/env node\n' +
      "const at = process.argv.indexOf('-p');\n" +
      'const got = at >= 0 ? (process.argv[at + 1] ?? "") : "";\n' +
      `console.log(\`${STUB_MARK} \${got}\`);\n` +
      'process.exit(0);\n',
  );
  chmodSync(stub, 0o755);
}

function writeFile(root: string, rel: string, content = 'x\n'): string {
  const file = join(root, rel);
  mkdirSync(join(file, '..'), { recursive: true });
  writeFileSync(file, content);
  return file;
}

function writeScopes(root: string, scopes: readonly string[]): void {
  writeFile(root, join('scripts', 'checks', 'scopes.json'), JSON.stringify(scopes));
}

/** 対象の 8 つの拡張子（製品の `CODE_EXTENSIONS` と同じ顔つき） */
function codeExtensions(): readonly string[] {
  return ['ts', 'tsx', 'mts', 'cts', 'js', 'jsx', 'mjs', 'cjs'];
}

describe('typecheck-staged', () => {
  it('対象が無い → exit 0', () => {
    const root = fakeRoot();
    stubTsc(root);
    expect(run(root, []).status).toBe(0);
  });

  it('対象は 8 つの拡張子で、md は外れる', () => {
    const extensions = codeExtensions();
    for (const extension of extensions) {
      const root = fakeRoot();
      stubTsc(root);
      writeFile(root, 'tsconfig.json', '{}');
      const file = writeFile(root, `a.${extension}`);
      const out = run(root, [file]);
      expect(out.status).toBe(0);
      expect(out.stdout).toContain(STUB_MARK);
    }
    const root = fakeRoot();
    stubTsc(root);
    const md = writeFile(root, 'a.md', '# hi\n');
    const out = run(root, [md]);
    expect(out.status).toBe(0);
    expect(out.stdout).not.toContain(STUB_MARK);
  });

  it('大文字の拡張子も対象になる', () => {
    const root = fakeRoot();
    stubTsc(root);
    writeFile(root, 'tsconfig.json', '{}');
    const file = writeFile(root, 'a.TS');
    const out = run(root, [file]);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain(STUB_MARK);
  });

  it('一覧に .pi があるツリー → .pi の下は .pi の範囲で回る', () => {
    const scope = '.pi';
    const root = fakeRoot();
    stubTsc(root);
    // ルートの tsconfig は置かない。.pi の tsconfig だけがある
    writeFile(root, join(scope, 'tsconfig.json'), '{}');
    const target = writeFile(root, join(scope, 'extensions', 'a.ts'));
    writeScopes(root, [scope]);
    const out = run(root, [target]);
    expect(out.status).toBe(0);
    // 一時 tsconfig は .pi の下に置かれる（`-p` の道に .pi が入る）
    expect(out.stdout).toContain(join(root, scope));
  });

  it('一覧に .pi が無ければ root の範囲で回る', () => {
    const scope = '.pi';
    const other = '.opencode';
    const root = fakeRoot();
    stubTsc(root);
    writeFile(root, 'tsconfig.json', '{}');
    writeFile(root, join(scope, 'tsconfig.json'), '{}');
    const target = writeFile(root, join(scope, 'a.ts'));
    writeScopes(root, [other]);
    const out = run(root, [target]);
    expect(out.status).toBe(0);
    // 一時 tsconfig は root の下に置かれる（`-p` の道に .pi が入らない）
    expect(out.stdout).toContain(STUB_MARK);
    expect(out.stdout).not.toContain(join(root, scope));
  });

  it('scopes.json が JSON でない → exit 1 と理由の行', () => {
    const root = fakeRoot();
    stubTsc(root);
    writeFile(root, 'tsconfig.json', '{}');
    const target = writeFile(root, 'a.ts');
    writeFile(root, join('scripts', 'checks', 'scopes.json'), '{not json');
    const out = run(root, [target]);
    expect(out.status).toBe(1);
    expect(`${out.stdout}\n${out.stderr}`).toContain(INVALID_LIST_LINE);
  });
});
