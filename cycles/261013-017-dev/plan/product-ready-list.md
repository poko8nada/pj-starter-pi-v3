# PLAN `product-ready-list`

## Files

```text
scripts/
  product-ready/
    targets.mjs                              update
    targets.test.ts                          update
    cli.mjs                                  update
    cli.test.ts                              update
    index.mjs                                update
    index.test.ts                            update
    prune-tests.mjs                          drop
    prune-cycles.mjs                         drop
  harness-scopes.json
package.json
README.md                                    update
README.ja.md                                 update
vitest.config.ts
test/tmp.ts
```

## Slices

## 1.一覧と芯

### Types

```js
// targets.mjs
/** 消す物の 1 行 */
export const STARTER_ONLY = [
  { label: 'harness', at: 'scripts/harness-scopes.json', pick: 'file' },
  { label: 'tests', at: '.pi', pick: 'tests' },
  { label: 'tests', at: 'scripts/product-ready', pick: 'tests' },
  { label: 'tests', at: 'test/env.test.ts', pick: 'file' },
  { label: 'tests', at: 'scripts/typecheck-staged.test.ts', pick: 'file' },
  { label: 'cycles', at: 'cycles', pick: 'dirs' },
];

/** 消す物 1 つ（解決済み） */
// { label: string, at: string, path: string }
// label は一覧の行のまま。at は root からの相対（表示用）、path は絶対（削除用）。
export function plan(root, only) {}
export function remove(root, plan) {}

/** 表示する label（一覧の順、重複なし）。only があればその 1 つ */
export function labels(only) {}
```

### Steps

1. `scripts/product-ready/targets.mjs`:
   - `TEST_TARGETS` をやめ、`STARTER_ONLY` を 1 本置く（上の 6 行。`pick` は `file` / `tests` / `dirs` の 3 つ）。
   - `isTestFile` は残す（`pick: 'tests'` の walk が使う）。
   - `plan(root, only)`（純）: `only` が undefined なら全行、あれば `label === only` の行だけを回す。`pick` ごとに拾う物が変わる。
     - `file`: その 1 つ。無ければ入れない。
     - `tests`: その所を walk し、`isTestFile` に合う物を集める（`node_modules` と `.git` は飛ばす）。
     - `dirs`: その所の直下のフォルダを集める。
     - 返りは `{ label, at, path }` を `at` の昇順で。`root` が無ければ投げる。
   - `remove(root, plan)`（副作用）: 各 `path` を消す（`dirs` は recursive、`file` と `tests` は force）。消した `at` を返し、無い物は飛ばす。
   - `labels(only)`（純）: 一覧の label を重複なく並びのまま返す（`only` があればその 1 つ）。
   - `findTests` / `findCycles` / `removeTests` / `removeCycles` は消す。
2. `scripts/product-ready/targets.test.ts`:
   - いまの `findTests` / `findCycles` / `removeTests` / `removeCycles` のテストを、同じツリーのまま `plan` / `remove` に移す。
   - `--only` の絞り込み（`plan(root, 'harness')` → `harness-scopes.json` の 1 つだけ）を足す。

### Verify:

- test: `pnpm vitest run scripts/product-ready/targets.test.ts`
  - (happy) 名指しの 4 か所（`.pi/x.test.ts`、`.pi/dir/y.test.ts`、`scripts/product-ready/z.test.ts`、`test/env.test.ts`、`scripts/typecheck-staged.test.ts`）があるツリー → `plan(root)` が 5 つ、`at` は root からの相対、`path` は絶対
  - (happy) `scripts/harness-scopes.json` があるツリー → `plan(root)` に `harness` の 1 つが入る
  - (happy) `cycles/001-a` と `cycles/002-b` と `cycles/README.md` があるツリー → `cycles` はフォルダの 2 つだけ
  - (happy) `plan(root, 'tests')` → `harness` と `cycles` の行が入らない
  - (boundary values) `plan(root, 'harness')` で `scripts/harness-scopes.json` が無い → `[]`
  - (empty) 何も無い root → `[]`
  - (error) 無い root → 投げる
  - (happy) `remove` を 2 回呼ぶ → 2 回目は `[]`
  - (happy) `.pi` の中の `node_modules` / `.git` は walk が飛ばす
  - (happy) `plan(root)` は `at` の昇順（作った順が逆でも）
  - (happy) 名指しの外（`test/keep.test.ts`、`src/keep.test.ts`）は入らない
  - (happy) `.spec.ts` も拾う。walk の中の非テスト（`test/setup.ts`）は拾わない
  - (happy) `labels(undefined)` → `['harness', 'tests', 'cycles']`、`labels('tests')` → `['tests']`
  - _no case_: `label` の綴り — 一覧の値で、動かす物ではない。`--only` が受け取る文字列は slice 2 の cli が決める

## 2.入口と引数

### Types

```js
// cli.mjs
// { root: string, run: boolean, only: string | undefined }
export function parseArgs(argv) {}

/** plan の配列 → label ごとの見出しと行 */
export function planLines(labels, plan) {}
```

### Steps

1. `scripts/product-ready/cli.mjs`:
   - `parseArgs` に `--only <label>` を足す（`--only=tests` の形も読む。値が無ければ投げる）。返りに `only` を足す。
   - `planLines(labels, plan)` を新しい形にする。`labels` は出す label（一覧の順）、`plan` は `{ label, at, path }` の配列。label ごとにまとめ、`${label} (${n}):` と `  <at>` の行を出す。1 つも無い label は `no ${label} to remove` の 1 行。並びは `labels` のまま。
2. `scripts/product-ready/index.mjs`:
   - `plan(root, args.only)` → `planLines(labels(args.only), plan)` → `--run` なら `remove(root, plan)`。エラーは 1 行で exit 1（いまの形のまま）。
3. `scripts/product-ready/prune-tests.mjs` と `scripts/product-ready/prune-cycles.mjs` を消す。
4. `scripts/product-ready/index.test.ts`:
   - 2 つの prune の定数と、その 4 つのテストを消す。
   - `index` のテストを主にする: 表示だけ / `--run` / `--only <label>` / 無い root / 未知の引数。
5. `scripts/product-ready/cli.test.ts`:
   - `parseArgs` に `--only tests`、`--only=tests`、値なしで投げる、を足す。
   - `planLines` のテストを新しい形にする（label ごとの見出し、空の label、並び）。

### Verify:

- test: `pnpm vitest run scripts/product-ready/`
  - (happy) `--only tests` → `tests (…)` の見出しが出て、`harness` と `cycles` の見出しが出ない
  - (happy) `--only=tests` の形も同じ（`tests (…)` の見出しだけ）
  - (happy) `--only` 無し → 見出しの並びは `harness` / `tests` / `cycles` の順
  - (happy) `--only` 無しの `--run` → 3 種とも消える
  - (happy) `--only harness --run` → `scripts/harness-scopes.json` が消え、`.pi` のテストは残る
  - (boundary values) `--only harness` で `scripts/harness-scopes.json` が無い → `no harness to remove` の 1 行、exit 0
  - (empty) 何も無い root で `--run` → 3 つの `no … to remove`、exit 0
  - (error) `--only` に値が無い → exit 1
  - (error) 無い root → `no such directory: <root>` の 1 行、exit 1
  - (error) 未知の引数 → exit 1
  - (happy) 2 回目の `--run` → exit 0（消える物が無い）
  - _no case_: `prune-tests.mjs` / `prune-cycles.mjs` が消えたこと — 無いファイルのテストは書かない。`## Files` の `drop` と `pnpm test:run` の緑が持つ

## 3.統合: 消える物の意味が 1 本になる

### Types

なし

### Steps

1. `README.md`:
   - `product:ready` の行を、消える物が 3 つ（`harness` / `tests` / `cycles`）であることと、`--only <label>` に合わせる。
2. `README.ja.md`:
   - 同じ行を同じ意味にする。
3. `package.json`:
   - `product:ready` は `node scripts/product-ready/index.mjs` のまま（触らない）。

### Verify:

- cli: `pnpm product:ready`（表示だけ）
  - (happy) `pnpm product:ready` → `harness (` / `tests (` / `cycles (` の 3 つの見出しが出る、exit 0
  - (happy) `pnpm product:ready --only cycles` → `cycles (` の見出しだけ、exit 0
  - (happy) `grep -n -e 'harness' -e 'tests' -e 'cycles' -e '\-\-only' README.md README.ja.md` → `product:ready` の行に 4 つとも出る
  - _no case_: `package.json` — 入口の名前は変わらないので、行そのものにケースは要らない。上の `pnpm product:ready` がその入口を回している

## Notes

### Slice 1: 一覧と芯

- Findings: なし
- Unplanned: `remove` の第2引数を `entries` にした（plan の `plan` は関数 `plan` を隠すため `oxlint --deny-warnings` の `no-shadow` で赤になる。意味は変わらない）。
- Commit: fc158fc

### Slice 2: 入口と引数

- Findings: なし
- Unplanned: なし
- Commit: 0268ca5

### Slice 3: 統合: 消える物の意味が 1 本になる

- Findings: なし
- Unplanned: なし
- Commit: 4331aec

## Review

### Round 1

- Stale: なし（旧名の live 残りなし。`prune-tests.mjs` / `prune-cycles.mjs` は消え、live の `findTests` / `findCycles` / `TEST_TARGETS` 参照は archive と ADR の記録だけ。`README.md:28` / `README.ja.md:28` / `DEFINITION.md:40` / `vitest.config.ts:10` は新3種と矛盾しない）
- Unlisted: なし（`1436572..HEAD` の10件は `## Files` の update/drop と一致。`harness-scopes.json` / `package.json` / `vitest.config.ts` / `test/tmp.ts` は bare のまま未変更で、余分な変更なし）
- Gaps: なし（slice 1 の file/tests/dirs・昇順・`labels`、slice 2 の `--only` 両形・`planLines` 分岐・`--run` 3種・空/欠落/未知引数、slice 3 の3見出し・`--only cycles`・README grep はいずれも対応する test/cli が持つ。未知 label は slice 1 の `_no case_` で対象外）
- Unproven: なし（各行為を戻せば対応する check が赤になる。`STARTER_ONLY` の1行欠落・`walk` の skip 撤去・`.spec` 狭め・`--only` 無視・見出し順崩しはいずれも `targets.test.ts` / `cli.test.ts` / `index.test.ts` の exact/length/contains のどれかが外れる）
- Doubts:
  - `scripts/product-ready/cli.mjs:2` の `PruneArgs` という型名が残る。prune-* 削除後の入口は product-ready だが、prune＝消す物の意味は変わらず、plan の Steps も改名を求めないため Stale とはしない。
  - `scripts/product-ready/index.test.ts:54` の表示テストは `001-a` だけを見て `002-b` と `harness-scopes.json` の行を見ない。`targets.test.ts:69` が plan の両フォルダを持ち、`cli.test.ts:20` が `planLines` の exact を持つため、suite では覆う。単体代表とみて Gaps/Unproven とはしない。
  - `scripts/product-ready/index.test.ts:165` の2回目 `--run` は `no tests` / `no cycles` だけを見て `no harness` を見ない。`index.test.ts:129` の空 root が3行を持ち、`index.test.ts:97` が harness 削除を持つため、suite では覆う。単体不足とみて finding とはしない。
  - `scripts/product-ready/targets.test.ts:144` の昇順テストは FS の `readdir` 順に依存する。順序が既に昇順の FS では sort 撤去でも緑になる可能性があるが、plan の要求は昇順であること自体で、テストは昇順をexact と `toSorted` の両方で見る。FS 依存の弱さとみて finding とはしない。

## Acceptance

- Ran: plan の検査 3 つ（slice 1: `vitest run scripts/product-ready/targets.test.ts` 17 passed / slice 2: `vitest run scripts/product-ready/` 40 passed / slice 3: `pnpm product:ready` が `harness (1)` / `tests (34)` / `cycles (4)` の 3 見出し、`--only cycles` が 1 見出し、`grep -n -e 'harness' -e 'tests' -e 'cycles' -e '\-\-only'` が README 2 つの `product:ready` の行に 4 語）と、全体の `pnpm test:run`（562 passed）と `pnpm lint`（緑）と `pnpm typecheck`（`root: ok` / `.pi: ok`）。壊して赤を見た 3 つ: `targets.mjs` の `only` の絞り込みを外す → 3 failed、`cli.mjs` の `--only` の 2 枝を外す → 2 failed、`index.mjs` の `remove` を空配列にする → 6 failed。3 ファイルは `git checkout` で戻し、上の検査を再び緑で確認
- Findings: なし
- Doubts:
  - `scripts/product-ready/targets.mjs:125` の `void root;` — `remove` の第 1 引数 `root` は使われていない。plan の `Types` が `remove(root, plan)` と書くため残した物で、`plan` と対にする意図は読めるが、`void` で黙らせている形は残る。
  - `scripts/product-ready/targets.mjs:39-51,73-77` の `walk` は `{ label: '', at: '', path }` を積んで呼び側で書き直す。動くが、`walk` がパスだけを返す形の方が短い。
