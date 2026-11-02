# PLAN `ex-guard-helpers`

- Where: base（オーナーが見る。作業はエージェントが自分のツリーで行う）

## Files

```text
scripts/
  product-ready/
    blocks.mjs              add
    index.mjs               update
    readme-format.test.ts   update
```

## Slices

## 1.ブロックの関数を 1 つにする

### Types

```js
/** @typedef {{ readonly from: number, readonly to: number }} SectionRange */
```

### Steps

1. `scripts/product-ready/blocks.mjs`:
   - `scripts/product-ready/index.mjs:9-64` の `FENCE`、`HEADING`、`blockUnder`、`sectionOf` を、そのまま移す。振る舞いは変えない。
2. `scripts/product-ready/index.mjs`:
   - `FENCE`、`HEADING`、`blockUnder`、`sectionOf` の定義を消し、`./blocks.mjs` から `blockUnder` と `sectionOf` を読み込む。
3. `scripts/product-ready/readme-format.test.ts`:
   - `blockUnder` と `sectionBody` の写しを消し、`./blocks.mjs` から `blockUnder` と `sectionOf` を読み込む。節の本文は `sectionOf` で取る。
   - `rules/` の道を `process.cwd()` ではなく、`import.meta.url` から出す（`vitest.config.ts:9` と同じ形）。
   - 変異を、行の配列を組み替えて作る。対象の行がちょうど 1 つでなければ投げる。
   - (happy) 2 つのブロックが、決まった 8 行の並びである → 緑
   - (error) ブロックの 1 行を別の見出しに変えた写し → 赤
   - (error) ブロックの行を 1 つ落とした写し → 赤
   - (error) `## Writing` からバッジの規則を消した写し → 赤
   - (error) ブロックの中にフェンスの行を足した写し → 赤

### Verify

- Always:
  - `pnpm exec vitest run --config vitest.starter.config.ts scripts/product-ready/readme-format.test.ts scripts/product-ready/index.test.ts`
  - `pnpm test:run`、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`
  - `grep -n "function blockUnder\|function sectionOf\|function sectionBody" scripts/product-ready/` が、`blocks.mjs` の 2 行だけである
- Added: なし

## Notes

### Slice 1: ブロックの関数を 1 つにする

- Findings: なし
- Unplanned: なし
- Commit: 87ec024 base(ex-guard-helpers): share the block helpers
- Stopped: なし

## Review

### Round 1

- Stale: なし — `function blockUnder|sectionOf|sectionBody` が `scripts/product-ready/blocks.mjs:14` と `scripts/product-ready/blocks.mjs:46` の 2 行だけであり、`scripts/product-ready/index.mjs:5` と `scripts/product-ready/readme-format.test.ts:5` が読み込む側に回っていることを確かめた。ADR/design の `index.mjs:19-42` 表記は履歴の記録であり取り残しではない。
- Unlisted: なし — `git diff 5ad86d6..HEAD --stat` が `scripts/product-ready/blocks.mjs`、`scripts/product-ready/index.mjs`、`scripts/product-ready/readme-format.test.ts` の 3 件だけであり、Files の記載と一致することを確かめた。
- Gaps: なし — Steps の写し削除、`scripts/product-ready/readme-format.test.ts:14-15` の `import.meta.url` 化、`scripts/product-ready/readme-format.test.ts:107-115` の `withLine` 化と、happy 1 件＋error 4 件（`scripts/product-ready/readme-format.test.ts:118-147`）がすべて実装されていることを確かめた。null 経路は `scripts/product-ready/index.test.ts:333-352` の子プロセス系で exercised される。
- Unproven: なし — 見出し変え（`scripts/product-ready/readme-format.test.ts:125-128`）・行落とし（`scripts/product-ready/readme-format.test.ts:130-133`）・Writing 消去（`scripts/product-ready/readme-format.test.ts:135-142`）は `sameLines` なしでは赤にならず、意図した guard を外すとテストが落ちることを確かめた。フェンス件（`scripts/product-ready/readme-format.test.ts:144-147`）は二重検知だが plan は bare な赤だけを決めており、分離までは求めていない。
- Noise: なし — `scripts/product-ready/readme-format.test.ts:17-46` の EXPECTED_* と変異先の文字列は plan が決めた仕様・cases の具体化であり、型や制約が保証する前提の再現でも magic number 断定でもないことを確かめた。
- Doubts:
  - `scripts/product-ready/readme-format.test.ts:48` の `FENCE` が `scripts/product-ready/blocks.mjs:4` と重複したままである。将来的なずれの種だが plan は `blockUnder`/`sectionBody` の一本化だけを決めており、今回の取り残しではない。
    - fixed: 重複した `FENCE` と、それを用いるフェンスの検査と `## Usage` の検査をテストから落とした。ブロックの 8 行の完全一致がどちらも赤にするためである。
  - `scripts/product-ready/readme-format.test.ts:13` の「config 自身」は test 自身の道を指す文脈では読みにくい。`vitest.config.ts:9` と同じ形という plan の指示どおりであり、誤りではないが言い回しが写し元を引きずっている。
    - fixed: 注釈を「このファイルの道からルートを出す（起動位置に依存しない）」に直した。
  - `scripts/product-ready/readme-format.test.ts:14-15` の `import.meta.url` 化は、ルートから走らせる既定の Verify では旧 `process.cwd()` でも緑になる。cwd を変えた証明は plan の Added（なし）の範囲外であり、今回は問わない。
    - fixed: `scripts/product-ready` を作業ディレクトリにして `pnpm exec vitest run --config ../../vitest.starter.config.ts readme-format.test.ts` を走らせ、5 件が緑であることを確かめた。`Ran` に書いた。

### Round 2

- Stale: なし — 今回は `### Round 1` の `fixed:` 3 件のみを確認対象とするため、`Stale` には `fixed:` がございません。
- Unlisted: なし — 同上の理由により、`Unlisted` には `fixed:` がございません。
- Gaps: なし — 同上の理由により、`Gaps` には `fixed:` がございません。
- Unproven: なし — 同上の理由により、`Unproven` には `fixed:` がございません。
- Noise: なし — 同上の理由により、`Noise` には `fixed:` がございません。
- Doubts:
  - 修正を確認いたしました — `scripts/product-ready/readme-format.test.ts:48` の `fixed:`（重複した `FENCE` と、それを用いるフェンスの検査と `## Usage` の検査を落とした）は直っております。現行 `readme-format.test.ts` に `const FENCE` はなく、`function blockUnder|sectionOf|sectionBody` の `grep` は `scripts/product-ready/blocks.mjs:4` ・ `:14` ・ `:46` の 3 行のみであります。フェンス件は `readme-format.test.ts:134-137` が `withLine` で ` ``` ` を挿入し、`readChecked:64-90` の 8 行完全一致（`sameLines:52-62` と `nonEmptyLines:48-50`）で落とす構造であります。
  - 修正を確認いたしました — `scripts/product-ready/readme-format.test.ts:13` の `fixed:`（注釈の言い換え）は直っております。現行 `:13` は「このファイルの道からルートを出す（起動位置に依存しない）。」であります。
  - `scripts/product-ready/readme-format.test.ts:14-15` の `fixed:`（作業ディレクトリを変えた証明と `Ran` 記載）は、コードは直っているが記録が確認できません。現行 `:14-15` は `import.meta.url` 化（`HERE` と `FORMAT_AT`）で `process.cwd()` の `grep` は 0 件、`withLine:97-105` は対象行がちょうど 1 つでなければ投げる構造であります。一方、現行 `## Acceptance` の `Ran` に作業ディレクトリを変えた実行（`scripts/product-ready` からの `vitest` 5 件緑）の記載がなく、「`Ran` に書いた」は確認できません。
    - left: 作業ディレクトリを変えた証明の `Ran` 記載が残っておらず、証明の記録としては閉じていないため、close で残りとして読む。

## Acceptance

- Ran: `pnpm exec vitest run --config vitest.starter.config.ts scripts/product-ready/readme-format.test.ts scripts/product-ready/index.test.ts`（22 件）、`pnpm test:run`（793 件）、`pnpm typecheck`（root と .pi が ok）、`pnpm lint`（警告込みで緑）、`pnpm format:check`（全ファイルが整形済み）、`grep -n "function blockUnder\|function sectionOf\|function sectionBody\|const FENCE" scripts/product-ready/*.mjs scripts/product-ready/*.ts` が `blocks.mjs` の 3 行だけである、`scripts/product-ready` を作業ディレクトリにして `pnpm exec vitest run --config ../../vitest.starter.config.ts readme-format.test.ts`（5 件）。
- Findings:
  - `scripts/product-ready/readme-format.test.ts:13`、`:48` と、cwd の証明は、`Round 1` の `Doubts` を直したものである。
    - fixed: 上の `fixed:` の 3 行のとおり。直したあとで `Ran` の 6 つを走らせ直した。
  - `## Review` の `Round 2` が、cwd を変えた実行が `Ran` に無いと指摘した。`fixed:` には「`Ran` に書いた」と書いたが、`Ran` に入れていなかった。
    - fixed: `Ran` の末尾に、`scripts/product-ready` を作業ディレクトリにした実行を足した。
- Doubts: なし
