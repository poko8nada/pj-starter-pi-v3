# PLAN `ex-prune-all-tests`

## Files

```text
scripts/product-ready/
  targets.mjs                  update
  targets.test.ts              update
  index.test.ts                update
  cli.mjs                      （触らない）
  index.mjs                    （触らない）
  prune-tests.mjs              （触らない）
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
       - `scripts/product-ready/z.spec.ts` を置く → 拾う（boundary values。vitest の既定 include）
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
     - cli: worktree で4つ走らせ、出力を読む。(1) `node scripts/product-ready/index.mjs`（引数なし）— 名指しの3つと本数が出て、`git status --short` が前後で変わらない／(2) `tmpDir()` に写しを作り（`.pi/`・`test/`・`scripts/`・`cycles/`・`vitest.config.ts`・`package.json`）、そこに `test/keep.test.ts` を置いて `node scripts/product-ready/index.mjs --root <写し> --run` → 名指しのテストが0本になり、`test/keep.test.ts` は残る／(3) 写しで `node <worktree>/node_modules/vitest/vitest.mjs run --root <写し>` → 0本で exit 0（`No test files found`）／(4) 2回目の `--run` → 静かに終わる（冪等）
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
- Commit:

## Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Unproven:

## Acceptance

- Ran:
- Findings:
