# check-suite.tmp

Acceptance:

- 相対パスでリポジトリに書くテストが混ざっても、何も止めない、が解ける: テストは共通の helper（`test/tmp.ts`）を通し、一時ディレクトリに書く
- 既存のテストが本体に書ける形のまま、が解ける: 既存テストが helper を通す形に書き換わっている

Owner: at the end

## Todo

- `test/tmp.ts`（add）
  - `withTmpDir`（または `tmpDir`）— `mkdtempSync(join(tmpdir(), 'pi-test-'))` で作り、テストの終わりに消す。doc に使い方を書く（何をする物か、どう呼ぶか、後始末は誰がするか）
- `vitest.config.ts`
  - 触らない。各テストは helper を相対パスで読む（`import { tmpDir } from '../../../../test/tmp.ts'`）。`test/` は root の下なので、vite も tsc も通常の解決で届く。`alias` にすると `tsconfig.json` の `paths` も要り、計画の `Files` に無いファイルが増える。`include` の調整も要らない（helper はテストではないので収集の対象外）
- `.pi/extensions/consult/child/guard.test.ts`
  - 一時ファイルを helper に寄せる（本体に書かない）
- `.pi/extensions/consult/policy/types.test.ts` / `.pi/extensions/consult/run/run.test.ts` / `.pi/extensions/consult/tool/consult.test.ts`
  - 同上。テストが本体を見ている所は、その理由を書く
- `.pi/skills/work/scripts/squash.test.ts`
  - 同上
- `vitest.setup.test.ts`
  - このファイルはファイルを作らない（`process.env` を読むだけ）ので、helper に寄せる物が無ければそのままでよい

## Verify

### test

- `pnpm test:run`（全件。1 行）
  - 全件が緑（happy）
  - 失敗するテストを 1 つ混ぜる → 赤くなる（error。走らせ方が効いていること）
  - テストを 0 件にする → 赤くなる（error）

### form

- `git grep` で、テスト側に一時ディレクトリの直書きが残っていないことを見る（2 行）
  - `git grep -n "mkdtempSync\|tmpdir()" -- '*.test.ts'` → helper（`test/tmp.ts`）自身以外は 0 件（happy）
  - `git grep -n "test/tmp" -- '*.test.ts'` → 書き換えた各ファイルにある（happy）
- テストを走らせたあとに、リポジトリに一時物が残っていない（1 行）
  - `pnpm test:run` の直後の `git status --porcelain` が空（happy）
  - 追跡外ファイルの数が、走らせる前と同じ（happy）

## Notes

### Findings

- なし

### Unplanned

- なし

Commit:
