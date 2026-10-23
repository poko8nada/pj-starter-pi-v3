/**
 * `scripts/checks/typecheck-staged.mjs` の振る舞いを、子プロセスとして実行して試す。
 *
 * fake root の `node_modules/.bin/tsc` にスタブを置く（渡された `-p` を出す）。
 * これで、どの `tsconfig` が使われたかを見る。スタブに渡るのは一時 tsconfig
 * （`.typecheck-staged-*.json`）で、元の `tsconfig.json` と同じ所に置かれる。
 * だから `-p` の道に `.pi` が入るかで、`.pi` の group か root の group かが分かる。
 * tsc そのものが成功するかは pre-commit の時系列で担保されているので、ここでは見ない。
 */

import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tempDir } from '../../test/temp-dir.ts';

const SCRIPT = join(process.cwd(), 'scripts', 'checks', 'typecheck-staged.mjs');

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
      'console.log(`stub -p ${got}`);\n' +
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

describe('typecheck-staged', () => {
  it('対象が 1 つも無い → exit 0', () => {
    const root = fakeRoot();
    stubTsc(root);
    expect(run(root, []).status).toBe(0);
  });

  it('存在しないファイルだけ → exit 0', () => {
    const root = fakeRoot();
    stubTsc(root);
    expect(run(root, [join(root, 'nope.ts')]).status).toBe(0);
  });

  it('型チェックの対象外の拡張子（.md）は除外する → exit 0', () => {
    const root = fakeRoot();
    stubTsc(root);
    const md = writeFile(root, 'a.md', '# hi\n');
    const out = run(root, [md]);
    expect(out.status).toBe(0);
    expect(out.stdout).not.toContain('stub -p');
  });

  it('.tsx / .mts / .js / .mjs も型チェックの対象に入る', () => {
    for (const ext of ['.tsx', '.mts', '.js', '.mjs']) {
      const root = fakeRoot();
      stubTsc(root);
      writeFile(root, 'tsconfig.json', '{}');
      const file = writeFile(root, `a${ext}`);
      const out = run(root, [file]);
      expect(out.status).toBe(0);
      expect(out.stdout).toContain('stub -p');
    }
  });

  it('一覧に .pi があるツリー → .pi の下は .pi の group で回る', () => {
    const root = fakeRoot();
    stubTsc(root);
    // ルートの tsconfig は置かない。.pi の tsconfig だけがある
    writeFile(root, join('.pi', 'tsconfig.json'), '{}');
    const ts = writeFile(root, join('.pi', 'extensions', 'a.ts'));
    writeScopes(root, ['.pi']);
    const out = run(root, [ts]);
    expect(out.status).toBe(0);
    // 一時 tsconfig は .pi の下に置かれる（`-p` の道に .pi が入る）
    expect(out.stdout).toContain(join(root, '.pi'));
  });

  it('一覧に .pi が無いツリー → .pi の下は root の group に落ちる', () => {
    const root = fakeRoot();
    stubTsc(root);
    writeFile(root, 'tsconfig.json', '{}');
    writeFile(root, join('.pi', 'tsconfig.json'), '{}');
    const ts = writeFile(root, join('.pi', 'a.ts'));
    writeScopes(root, ['.opencode']);
    const out = run(root, [ts]);
    expect(out.status).toBe(0);
    // 一時 tsconfig は root の下に置かれる（`-p` の道に .pi が入らない）
    expect(out.stdout).toContain('stub -p');
    expect(out.stdout).not.toContain(join(root, '.pi'));
  });

  it('一覧が無いツリー → root の group で回る', () => {
    const root = fakeRoot();
    stubTsc(root);
    writeFile(root, 'tsconfig.json', '{}');
    const ts = writeFile(root, 'a.ts');
    const out = run(root, [ts]);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain('stub -p');
    expect(out.stdout).not.toContain(join(root, '.pi'));
  });

  it('一覧が無く root の tsconfig も無い → group が空、exit 0（tsc を探しに行かない）', () => {
    const root = fakeRoot();
    stubTsc(root);
    const ts = writeFile(root, 'a.ts');
    const out = run(root, [ts]);
    expect(out.status).toBe(0);
    expect(out.stdout).not.toContain('stub -p');
    expect(out.stderr).not.toContain('Failed to run tsc');
  });

  it('一覧に .opencode があるが .opencode/tsconfig.json が無い → skip、exit 0', () => {
    const root = fakeRoot();
    stubTsc(root);
    const ts = writeFile(root, join('.opencode', 'a.ts'));
    writeScopes(root, ['.pi', '.opencode']);
    const out = run(root, [ts]);
    expect(out.status).toBe(0);
    expect(out.stdout).not.toContain('stub -p');
  });

  it('一覧が JSON として読めない → exit 1（the list is not valid JSON の行）', () => {
    const root = fakeRoot();
    stubTsc(root);
    writeFile(root, 'tsconfig.json', '{}');
    const ts = writeFile(root, 'a.ts');
    writeFile(root, join('scripts', 'checks', 'scopes.json'), '{not json');
    const out = run(root, [ts]);
    expect(out.status).toBe(1);
    expect(`${out.stdout}\n${out.stderr}`).toContain('the list is not valid JSON');
  });
});
