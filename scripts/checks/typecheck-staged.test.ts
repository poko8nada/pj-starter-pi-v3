/**
 * `scripts/checks/typecheck-staged.mjs` の振る舞いを、子プロセスとして実行して試す。
 *
 * fake root は共有の `fakeRoot()`、ファイルは共有の `writeFile`、スタブは `checks.fixture.ts` の `stubTsc()` で作る。
 * staged は `STUB_FAIL` を空にして走らせるので、スタブは常に exit 0 である。
 * これで、どの `tsconfig` が使われたかを見る。スタブに渡るのは一時 tsconfig
 * （`.typecheck-staged-*.json`）で、元の `tsconfig.json` と同じ所に置かれる。
 * だから `-p` のパスに `.pi` が入るかで、`.pi` の group か root の group かが分かる。
 * tsc そのものが成功するかは pre-commit の時系列で担保されているので、ここでは見ない。
 * `stub -p` は下のスタブが出す目印で、断言はそこから取る。
 */

import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { fakeRoot, writeFile } from '../../test/scripts.fixture.ts';
import { stubTsc, writeScopes } from './checks.fixture.ts';

const SCRIPT = join(process.cwd(), 'scripts', 'checks', 'typecheck-staged.mjs');
const STUB_MARK = 'stub -p';

interface RunOut {
  readonly status: number;
  readonly stdout: string;
  readonly stderr: string;
}

function run(root: string, args: readonly string[]): RunOut {
  const result = spawnSync('node', [SCRIPT, ...args], {
    encoding: 'utf8',
    cwd: root,
    env: { ...process.env, STUB_FAIL: '' },
  });
  return { status: result.status ?? -1, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

describe('typecheck-staged', () => {
  it('対象が無い → exit 0', () => {
    const root = fakeRoot();
    stubTsc(root);
    expect(run(root, []).status).toBe(0);
  });

  it('a.ts は対象で、a.md は対象外', () => {
    const root = fakeRoot();
    stubTsc(root);
    writeFile(root, 'tsconfig.json', '{}');
    const ts = writeFile(root, 'a.ts');
    const tsOut = run(root, [ts]);
    expect(tsOut.status).toBe(0);
    expect(tsOut.stdout).toContain(STUB_MARK);
    const mdRoot = fakeRoot();
    stubTsc(mdRoot);
    const md = writeFile(mdRoot, 'a.md', '# hi\n');
    const mdOut = run(mdRoot, [md]);
    expect(mdOut.status).toBe(0);
    expect(mdOut.stdout).not.toContain(STUB_MARK);
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
    // 一時 tsconfig は .pi の下に置かれる（`-p` のパスに .pi が入る）
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
    // 一時 tsconfig は root の下に置かれる（`-p` のパスに .pi が入らない）
    expect(out.stdout).toContain(STUB_MARK);
    expect(out.stdout).not.toContain(join(root, scope));
  });
});
