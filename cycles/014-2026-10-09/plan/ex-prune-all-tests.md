# PLAN `ex-prune-all-tests`

## Files

```text
scripts/product-ready/
  targets.mjs                  update
  targets.test.ts              update
  index.test.ts                update
  cli.mjs                      （触らない）
  index.mjs                    （触らない）
  prune-tests.mjs              update（コメントだけ）
  prune-cycles.mjs             （触らない）
```

```text
vitest.config.ts               update
test/README.md                 update
README.md                      update
README.ja.md                   update
```

対象は「ディレクトリか、テストのファイル」。`test/` をディレクトリで名指ししない（プロダクトのテストの置き場だから）。`findCycles` は今のまま（`cycles/` のフォルダごと）。`index.mjs` / `prune-tests.mjs` / `prune-cycles.mjs` / `cli.mjs` は `findTests` の呼び方だけなので触らない。

## Slices

1. 対象を名指しに変え、名指しの外を食わないことをテストで固定する
   - I/O:
     ```js
     // scripts/product-ready/targets.mjs — 型は JSDoc
     /** 消すテストの対象（root からの相対）。ディレクトリか、テストのファイルそのもの */
     export const TEST_TARGETS = ['.pi', 'scripts/product-ready', 'test/env.test.ts'];

     /** @returns {readonly string[]} 名指しの中のテスト（絶対パス、昇順）。無い対象は飛ばす */
     export function findTests(root) {}
     ```
   - Verify:
     - test: `pnpm run test:run scripts/product-ready/targets.test.ts`
       - `.pi/x.test.ts`、`.pi/dir/y.test.ts`、`scripts/product-ready/z.test.ts`、`test/env.test.ts` を置いた木 → 4本を返す（happy。名指しの3つ）
       - 同じ木に `test/keep.test.ts` と `src/keep.test.ts` を足す → 4本のまま（happy。名指しの外は食わない）
       - `node_modules/a.test.ts` と `.git/b.test.ts` を置く → 返らない（happy。名指しの外）
       - `test/env.test.ts` だけ無い木 → 残りを返す（empty。無い対象は飛ばす）
       - `scripts/product-ready/z.spec.ts` を置く → 拾う（boundary values。vitest の既定 include。base の木に置いて本数で見る）
       - `.pi/node_modules/a.test.ts` を置く → 返らない（boundary values。名指しの中の入れ子でも skip が効く）
       - `findTests(root, ['test/setup.ts'])` → `[]`（invalid input。名指しでもテストでない物は拾わない）
       - 無い root → 投げる（error。黙って成功しない）
       - `removeTests` を2回呼ぶ → 2回目は `[]`（boundary values。2回目）
       - 権限: 当てはまらない（一時ディレクトリだけ）
   - Steps:
     1. `scripts/product-ready/targets.mjs`: `TEST_TARGETS` と `findTests` を書く。対象ごとに `existsSync` し、ディレクトリなら今の walk、ファイルならそのまま取る。パターンは vitest の既定 include（`**/*.{test,spec}.?(c|m)[jt]s?(x)`）に合わせ、ずれると「0本」が言えないことをコメントに書く
     2. `scripts/product-ready/targets.test.ts`: 上のケースを書く。既存のケース（`.pi/` だけ、`test/` は対象外）を新しい対象に合わせて直す
2. 0本でも緑にする
   - I/O: なし（設定と文書）
   - Verify:
     - read: 子が `vitest.config.ts` と `test/README.md` を読み、(1) `test` に `passWithNoTests: true` とその理由（開始時はテストが0本）が書いてあるか、(2) `test/README.md` に番人の行が無く、`setup.ts` と `tmp.ts` の2つだけを説明し、テストはプロダクトがゼロから書くことが書いてあるかを報告する
   - Steps:
     1. `vitest.config.ts`: `test` に `passWithNoTests: true` を足す。コメントに理由を書く
     2. `test/README.md`: 番人の行を消し、テストはプロダクトがゼロから書くことを書く
3. README 2枚の Getting started を新しい意図に直す
   - I/O: なし（文書）
   - Verify:
     - read: 子が `README.md` と `README.ja.md` の Getting started を読み、(1) 外れる物が「ハーネス自身のテスト（`.pi/` の下）」ではなく「名指しした場所のテスト。開始時にテストがゼロになる」になっているか、(2) 一度きりで、自分のテストを書く前に走らせることが書いてあるかを報告する
   - Steps:
     1. `README.md`: 28行目の説明を直す
     2. `README.ja.md`: 同じ箇所を直す
4. 統合: 写しの上で0本になり、0本でも緑で、プロダクトのテストは食われない
   - I/O: なし
   - Verify:
     - cli: worktree で4つ走らせ、出力を読む。(1) `node scripts/product-ready/index.mjs`（引数なし）— 名指しの3つと本数が出て、`git status --short` が前後で変わらない／(2) `tmpDir()` に写しを作り（`.pi/`・`test/`・`scripts/`・`cycles/`・`vitest.config.ts`・`package.json`）、そこに `test/keep.test.ts` を置いて `node scripts/product-ready/index.mjs --root <写し> --run` → 名指しのテストが0本になり、`test/keep.test.ts` は残る／(3) 写しから `test/keep.test.ts` を外し、`node <worktree>/node_modules/vitest/vitest.mjs run --root <写し>` → 0本で exit 0（`No test files found`）。写しには `node_modules` の symlink を張る（`vitest/config` の解決のため）／(4) 2回目の `--run` → 静かに終わる（冪等）
     - test: `pnpm run test:run scripts/product-ready` — 既存21件と新しいケースが緑
   - Steps:
     1. 上の4つを走らせ、結果を記録する

## Notes

### Slice 1: 対象を名指しに変え、名指しの外を食わないことをテストで固定する

- Findings: なし
- Unplanned: なし
- Commit: 1ad7fbe

### Slice 2: 0本でも緑にする

- Findings: なし
- Unplanned: なし
- Commit: d661925

### Slice 3: README 2枚の Getting started を新しい意図に直す

- Findings: なし
- Unplanned: なし
- Commit: 09b6d0d

### Slice 4: 統合: 写しの上で0本になり、0本でも緑で、プロダクトのテストは食われない

- Findings:
  - 計画の Verify (3) は `test/keep.test.ts` が写しに残ったままでは 0 本にならない（vitest が 1 本を見つける）。keep を除いた写しでは exit 0 で `No test files found`（`passWithNoTests` の効果）。写しでの vitest 実行には `node_modules` の symlink が要る（`vitest/config` の解決のため）
    - `left: Verify (3) の文面は変えず、0 本確認は keep 除去後に行う手順として記録する（keep を消す側に倒すのは誤りのため。文面の直しは親・review に委ねる）`
  - keep を置いたまま写しで vitest を走らせると 1 passed になり、プロダクトのテストが食われずに動くことを確認した
- Unplanned:
  - `scripts/product-ready/index.test.ts` は Files で `update` だが、新しい名指しの下でも既存の検査（プロダクトのテストが残る）が緑のままなので触らなかった
- Commit: 1227f57

## Review

### Round 1

- Stale:
  - `Files: index.test.ts update` が偽（子は触らず、`Notes` の Unplanned が自認）
  - `prune-tests.mjs:5` の「ハーネスのテストを消す入口」が `.pi/` だけに読める
  - `index.test.ts:59` の「test/ は残る」と `:69` の「.pi/ のテストだけが消える」が偽（一般には `test/env.test.ts` が消える。`makeTree` がそれを置かないため緑だった）
  - `Slice 4 Verify (3)` の文面（親が `c264568` で「写しから `test/keep.test.ts` を外し」に直した）
- Unlisted: なし（子は `git diff` を child-guard で走らせられず、親 HEAD との目視比較だった。親が diff で確認した）
- Gaps:
  - 新しい削除範囲の統合カバーが無い（`index.test.ts` の木に `test/env.test.ts` と `scripts/product-ready/*.test.ts` が無い）
  - `targets.mjs` の `node_modules` / `.git` の skip を効かせる入れ子のケースが無い
  - 名指しのファイルが `isTestFile` を通らない（非テストを名指しすると消える）
- Unproven:
  - Slice 4 の Verify (1)(2)(4) と `test:run` の出力記録が無い（`## Acceptance` で記録する）
  - `.spec.ts` のケースが本数を見ない（名指しの中での既定 include の証明になっていない）

- fixed: `0b9b0c1` `index.test.ts` の木に名指しの3つを置き、`test/env.test.ts` と道具自身のテストが消え、名指しの外（`test/keep.test.ts`）が残ることを見た。偽の文面も直した
- fixed: `9b98573` 名指しのファイルも `isTestFile` で見るようにし、`findTests(root, targets = TEST_TARGETS)` にした（テストできる形）
- fixed: `874bd8a` 入れ子の skip・名指しの非テスト・`.spec.ts` の本数をテストに足した
- fixed: `734bce0` `prune-tests.mjs` のコメントを「名指しのテスト（`targets.mjs` の `TEST_TARGETS`）を消す入口」に直した

## Acceptance

- Ran:
  - `pnpm run test:run`（worktree）: 30ファイル454テスト緑
  - `pnpm typecheck` / `pnpm lint`: 緑
  - 引数なしの `node scripts/product-ready/index.mjs`: `tests (30)` と `cycles (14)` を出し、前後で `git status --short` は不変（何も消さない）
  - 写し（`.pi/`・`test/`・`scripts/`・`cycles/`・`vitest.config.ts`・`package.json`・`node_modules` の symlink）に `test/keep.test.ts` を置き、`--root <写し> --run`: 名指しのテストは0本、`test/env.test.ts` は消え、`test/keep.test.ts` は残る。2回目は `no tests to remove` / `no cycles to remove` で exit 0（冪等）
  - 写しから `test/keep.test.ts` を外して `vitest run --root <写し>`: `No test files found, exiting with code 0`
- 壊しテスト（3つとも赤）:
  - `TEST_TARGETS` から `test/env.test.ts` を外す → `targets.test.ts` の5件が赤（名指しの3つ・食わない・入れ子の skip・.spec）
  - `TEST_TARGETS` に `test` を足す → 「名指しの外は食わない」が赤（1 failed / 11 passed）
  - `vitest.config.ts` の `passWithNoTests: true` を外す → 0本の写しが `No test files found, exiting with code 1`（対照: フラグありは exit 0）
- Findings:
  - plan の Verify (3) は「写しから `test/keep.test.ts` を外し」に親が直した（`c264568`）。`Notes` Slice 4 の `left:` はこの直しで閉じた
  - 統合テスト（close 用の受け渡し）は close 側で書く。ここでは名指しの外の生存までを見た
