# PLAN `readme-format`

- No: 02
- Place: worktree
- Boundary Plans: なし

## Goal

`rules/readme.format.md` が 1 つの Skeleton と 4 つの見出しの `## Writing` になり、`product:ready` がその 1 つのブロックから両方の README を作れる。

## Refactor

- Inside:
  - Modules: `rules/readme.format.md` の `## Skeleton` と `## Skeleton (ja)` を 1 つのセクションに統合し、`## Writing` の 9 本を 4 つの見出しに組み直す。答えは、ファイルを分割せずに 1 つのフェンスにし、`## Writing` の中を `Pair`、`Badges`、`Sections`、`Starter` の 4 つに区切ること。理由は、1 つのブロックを両方の README に使い、9 本の規則を関心事ごとに読むため。
  - Dirs: なし。`rules/` と `scripts/product-ready/` の構成は変えない。
- Outside:
  - Extract: なし。テンプレートの読み出しは今の `targets.mjs` の表に残す。
  - Colocate: なし。

## Files

```text
rules/
  readme.format.md          update
scripts/
  product-ready/
    index.mjs
    blocks.mjs
    targets.mjs             update
    index.test.ts           update
    targets.test.ts
README.md
README.ja.md
package.json
```

## Slices

## 1.Skeleton を 1 つにし、Writing を 4 つの見出しにする

`readme.format.md` の 2 つの Skeleton を 1 つにまとめ、`## Writing` を 4 つの見出しに組み直し、`product:ready` の対応表とテスト名を追随させる。

### Types

なし

### Steps

1. `rules/readme.format.md`
   1. update: `## Skeleton` の説明文を、両方の README を 1 つのブロックで置き換えると書く。フェンスのプレースホルダは英語に揃え、冠詞を外す。

      ````md
      ## Skeleton

      `product:ready` replaces both `README.md` and `README.ja.md` with the first fenced block after this heading. A line in `<...>` is a place to fill. Write each language in its own file.

      ```md
      # <name>

      <badges>

      <what it is and does, in one sentence>

      ## What is in it

      ### Product

      ### Default

      ## Getting started

      ## <product's own sections>

      ## Contributing

      ## License
      ```
      ````

   2. drop: `## Skeleton (ja)` のセクション（見出し、説明文、フェンス）。

   3. update: `## Writing` の 9 本を 4 つの見出しに組み直す。

      ```md
      ## Writing

      ### Pair

      - The pair stays a pair: a heading added to one is added to the other, in the same order.
      - A section the product does not need is left out.
      - Do not write what the reader can look up.

      ### Badges

      - Keep only related badges, each with a value from a source.
      - The badges line sits right after the title with no heading.

      ### Sections

      - `## Getting started` covers install and usage. There is no `## Usage`.
      - A description placed right under a heading is one sentence, holds without reading the list, holds no demonstrative and no name from the list, and holds wherever it is placed.
      - A line in `<...>` is a place to fill; under `## What is in it`, `### Product` keeps the product's own lines and `### Default` takes one line per starter heading.

      ### Starter

      - The starter README holds no `### Product`: the starter itself is not a product, and `### Product` with `### Default` appear only in the template `product:ready` writes.
      ```

2. `scripts/product-ready/targets.mjs`
   1. update: `README.ja.md` の対応を `skeleton('rules/readme.format.md', '## Skeleton', { kind: 'whole' })` に変える。`README.md` の行と `SKELETONS` の他の行は変えない。

3. `scripts/product-ready/index.test.ts`
   1. update: テスト名 `--run → README.md と README.ja.md がそれぞれのテンプレートに置き換わる` の 1 件だけを、次の名前に直す。既存の断言と他のテストは変えない。

      ```ts
      it('--run → README.md と README.ja.md が 1 つのテンプレートに置き換わる', () => {
      ```

   2. add: 1 つのブロックから両方の README ができることを確かめる断言を、同じテストに足す（case: `readme: (happy) 1 つの Skeleton から 2 つの README を作る → 1 行目が同じ`）。分離した 2 つの Skeleton では、1 行目が `# <the product's name>` と `# <プロダクトの名前>` で異なるため赤になる。

      ```ts
      expect(readmeJa.split('\n')[0]).toBe(readme.split('\n')[0]);
      ```

### Policy

- Allowed:
  - セクションの統合と見出しの追加（C3, C4）
  - 1 つのブロックを両方の README に使うこと（C4）
- Forbidden:
  - `## Writing` の規則の条件を変えること - 意味を変えないと決めたため（C5）
  - `README.md` と `README.ja.md` の中身を変えること - このサイクルではテンプレートの置き場所と規則の書き方だけを変えるため（C6）

### Verify

- Always:
  - `pnpm test:related rules/readme.format.md scripts/product-ready/targets.mjs scripts/product-ready/index.test.ts`（関連がなければ `pnpm test:run`）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、それが指す `scripts/product-ready/index.mjs`、`blocks.mjs`、`targets.test.ts`、`README.md`、`README.ja.md`、`package.json` を読み、読む者の順にたどり、番号、パス、名前、形を当て、不整合を直す
- Added:
  - other: `index.test.ts` の新しい断言が、分離した 2 つの Skeleton では赤になり、1 つの Skeleton では緑になることを、`pnpm test:related scripts/product-ready/index.test.ts` で確かめる

## Notes

### Slice 1: Skeleton を 1 つにし、Writing を 4 つの見出しにする

- Findings: なし
- Unplanned: なし
- Commit: 5cb37639
- Stopped:

### Cleanup: 統一テンプレート置換テストの stale な断言 1 行を落とした

- Findings: なし
- Unplanned: なし

## Work Review

### Round 1

- Stale: なし — `## Skeleton (ja)` への参照は残らず（`targets.mjs:72-73` はともに `## Skeleton`）、`readme.format.md:3` の導入文と `Write each language in its own file.` は2ファイル構成のまま真であり、削除された `not.toContain('## 入っているもの')` はどの fixture・テンプレートにも現れない空振りの断言の除去で、残る文書・コメント・テストを stale にしない。
- Unlisted: なし — 差分は `rules/readme.format.md`・`scripts/product-ready/targets.mjs`・`scripts/product-ready/index.test.ts` のみで、いずれも `## Files` の `update` 指定どおり。`index.mjs`・`blocks.mjs`・`targets.test.ts`・`README.md`・`README.ja.md`・`package.json` に変更なし。
- Gaps: なし — `Goal` の動作面（1つのブロックから両 README を作る）は `index.test.ts:294` の1行目一致で exercised し、既存の `not.toContain('old')` と `## What is in it`／`### Product`・`### Default` 順序の断言と合わせ、置き換えの発生と同一テンプレート由来をともに確かめる。`## Writing` の4見出し化とプレースホルダの英語化は文書の書き方であり、振る舞いの穴ではない。
- Policy: なし — `Allowed` の統合・見出し追加と1ブロック両用を守り、`Forbidden` の `## Writing` 条件変更（9文は順序のみ組み替えで意味同一）と `README.md`・`README.ja.md` 内容変更（差分なし）を犯さない。`Steps` の冠詞除去・説明文も ADR Details どおり。
- Unproven: なし — 分離した2つの Skeleton（1行目が `# <the product's name>` と `# <プロダクトの名前>` で異なる）では `index.test.ts:294` が赤になり、1つの Skeleton では緑になる。置き換え自体が壊れた場合（`# old` のまま）は既存の `not.toContain('old')` が赤にするため、単独で green のまま壊れを逃がさない。
- Noise: なし — 新断言は導出値同士の比較で magic number・hardcoded string を持たず、両 README 同一テンプレート由来は利用者が気づく振る舞いで、型・スキーマ・DB 制約が保証する前提の再現でもない。落とした1行こそ hardcoded string（`## 入っているもの`）で前提を一通りに build できない側であり、残した `'## What is in it'`・`'old'` は仕様（英語見出し・置き換え発生）を言う断言である。
- Doubts: なし

### Round 2

- Stale:
- Unlisted:
- Gaps:
- Policy:
- Unproven:
- Noise:
- Doubts:

## Acceptance

- Goal: `rules/readme.format.md` が 1 つの Skeleton と 4 つの見出しの `## Writing` になり、`product:ready` がその 1 つのブロックから両方の README を作れる。達成している。`## Skeleton (ja)` は消え、`targets.mjs` の 2 行が同じ `## Skeleton` を指し、`index.test.ts` の 1 行目一致の断言が両 README の同一由来を確かめる。
- Ran: `pnpm test:run`（66 ファイル、全件合格）、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`。壊して確かめた: `targets.mjs` の `README.ja.md` を `## Skeleton (ja)` に戻すと `pnpm test:related scripts/product-ready/index.test.ts` で 13 件が赤になり、戻すと 26 件が緑になった。
- Findings: なし
- Doubts: なし
