/**
 * `scripts/typecheck-staged.mjs` の振る舞いを、子プロセスとして実行して試す。
 *
 * 対象ファイルの抽出・tsconfig の選び分け・対象が無いときの早期 exit を見る。
 * tsc そのものが成功するかは pre-commit の時系列で担保されているので、ここでは見ない。
 */

import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tmpDir } from '../test/tmp.ts';

const SCRIPT = join(process.cwd(), 'scripts', 'typecheck-staged.mjs');

interface RunOut {
  readonly status: number;
  readonly stdout: string;
  readonly stderr: string;
}

/**
 * cwd を `root` に移して実行する。
 *
 * `root` は `node_modules` を持たない一時ディレクトリ。スクリプトは `process.cwd()` をリポジトリ根と見なして `node_modules/.bin/tsc` を絶対パスで組み立てる。
 * cwd をそこに移すと「tsc が未インストール」の状態が作れる。これで tsc の成否ではなく、対象の抽出と tsconfig の有無だけを試せる。
 */
function run(root: string, args: readonly string[]): RunOut {
  const result = spawnSync('node', [SCRIPT, ...args], { encoding: 'utf8', cwd: root });
  return { status: result.status ?? -1, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

/** node_modules を持たない、tsconfig を置ける木 */
function fakeRoot(): string {
  // macOS では /var が /private/var への symlink。process.cwd() は実体に解けるので、
  // 据えないと path.relative(root, abs) が狂う（ハーネス判定が .pi に当たらなくなる）
  return realpathSync(tmpDir());
}

describe('typecheck-staged', () => {
  it('対象が 1 つも無い → exit 0', () => {
    expect(run(fakeRoot(), []).status).toBe(0);
  });

  it('存在しないファイルだけ → exit 0', () => {
    const root = fakeRoot();
    expect(run(root, [join(root, 'nope.ts')]).status).toBe(0);
  });

  it('型チェックの対象外の拡張子（.md）は除外する → exit 0', () => {
    const root = fakeRoot();
    const md = join(root, 'a.md');
    writeFileSync(md, '# hi\n');
    expect(run(root, [md]).status).toBe(0);
  });

  it('tsconfig が無い → tsc を探しに行かない', () => {
    const root = fakeRoot();
    const ts = join(root, 'a.ts');
    writeFileSync(ts, 'x\n');
    // 対象は抽出できるが、tsconfig が無いので group が空になる
    const out = run(root, [ts]);
    expect(out.status).toBe(0);
    expect(out.stderr).not.toContain('Failed to run tsc');
  });

  it('対象の拡張子があり tsconfig がある → tsc を探しに行く（未インストールなので落ちる）', () => {
    const root = fakeRoot();
    const ts = join(root, 'a.ts');
    writeFileSync(ts, 'x\n');
    writeFileSync(join(root, 'tsconfig.json'), '{}');
    const out = run(root, [ts]);
    expect(out.stderr).toContain('Failed to run tsc');
    expect(out.status).toBe(1);
  });

  it('.tsx / .mts / .js / .mjs も型チェックの対象に入る', () => {
    for (const ext of ['.tsx', '.mts', '.js', '.mjs']) {
      const root = fakeRoot();
      const file = join(root, `a${ext}`);
      writeFileSync(file, 'x\n');
      writeFileSync(join(root, 'tsconfig.json'), '{}');
      const out = run(root, [file]);
      expect(out.stderr).toContain('Failed to run tsc');
    }
  });

  it('.pi の下は .pi の tsconfig を拾う（ハーネスごとの検査）', () => {
    const root = fakeRoot();
    const pi = join(root, '.pi', 'extensions');
    mkdirSync(pi, { recursive: true });
    const ts = join(pi, 'a.ts');
    writeFileSync(ts, 'x\n');
    // ルートの tsconfig は置かない。.pi の tsconfig だけがある
    writeFileSync(join(root, '.pi', 'tsconfig.json'), '{}');
    const out = run(root, [ts]);
    // tsc は未インストールなので落ちる。group が組まれたということ
    expect(out.stderr).toContain('Failed to run tsc');
    expect(out.status).toBe(1);
  });
});

describe('前提（このリポジトリ）', () => {
  it('tsc は入っている', () => {
    // 上の「未インストール」の解釈が成り立つ前提。無いなら上のテストは別の意味になる
    expect(() =>
      execFileSync(join(process.cwd(), 'node_modules', '.bin', 'tsc'), ['--version']),
    ).not.toThrow();
  });
});
