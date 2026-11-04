# PLAN `readme`

- No: 01, 02
- Place: worktree
- Boundary Plans: なし（`cycle-rules` と `close-names` は、このプランで書く README とテンプレートを読まない）

## Files

```text
README.md                     update
README.ja.md                  update
package.json                  update
rules/
  readme.format.md            update
scripts/product-ready/
  index.mjs                   update
  cli.mjs                     update
  index.test.ts               update
  cli.test.ts                 update
  readme-format.test.ts       drop
  blocks.mjs
  targets.mjs
  targets.test.ts
```

## Slices

## 1.スターターの README の書き直し

### Types

```ts
なし;
```

### Steps

1. `package.json`:
   - update: `private` の後ろに `"engines": { "node": ">=24" }` と `"packageManager": "pnpm@12.15.0"` を足す。
2. `README.md`:
   - update: 題名 `# Harness-included starter` とその下の説明の2文は継承し、バッジを TypeScript・Node 24・pnpm・pi の4つにして値は `package.json` の `devDependencies`・`engines`・`packageManager` から取り、`## What is in it` を `### Roadmap & Cycle`、`### Agent`、`### Checks`、`### Handover`、`### CI` の5つに組み直し、各見出しの直後の説明文1文（一覧を読まなくても通じる1文で、指示語と一覧に並ぶ名前を含めず、置かれた場所に依存しない）と `- <パス>: <説明>` の一覧（文書はリンク、一覧と入れ子は `adr.md:64-67` のとおり、`### CI` の説明文は `_Under construction_`）を置き、`## Getting started` は前提条件1文（`engines` の `>=24` と同じ数）のあとに `pnpm install`、`pnpm product:ready`、`pi` の起動を順に示し、`## Checks`・`## Harness`・`## Cycle`・`## Contributing` の内容は5つの一覧の項目の説明に集め（コマンドの表とコマンドブロックは残さない）、言語リンクは現行のままにする。
3. `README.ja.md`:
   - update: 題名を `# Harness-included starter（ハーネス付きスターター）` にし、説明の2文は継承し、見出しは英語にそろえて、英語の README と同じ5つの `###`・項目ごとの説明・入れ子・バッジ4つ・`### CI` の `_Under construction_`・前提条件1文・言語リンクにし、`ja-check` の禁止語を使わない。

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - grep ツールで `^### (Roadmap & Cycle|Agent|Checks|Handover|CI)$` を `README.md` と `README.ja.md` から検索し、各5件であることを確かめる
  - grep ツールで `^## (Checks|Harness|Cycle|Contributing)$` を `README.md` と `README.ja.md` から検索し、0件であることを確かめる
  - grep ツールで `^## [^A-Za-z]` を `README.md` と `README.ja.md` から検索し、0件であることを確かめる
  - grep ツールで `_Under construction_` を `README.md` と `README.ja.md` から検索し、各1件であることを確かめる
  - grep ツールで `Node-24` を `README.md` と `README.ja.md` から検索し、各1件であることを確かめる
  - `README.md` と `README.ja.md` の相対リンクの先を `test -e <path>` で1つずつ確かめ、すべて 0 で終わる
  - 変更した3ファイルを通読し、矛盾、循環、重複、不足、不自然な流れがないか確かめる
- Added: `other — node scripts/checks/ja-check.mjs README.ja.md` の集計が `error 0`、`warn 0` で終わる

## 2.テンプレートの組み直し

### Types

```ts
なし;
```

### Steps

1. `rules/readme.format.md`:
   - update: 英語と日本語の Skeleton の `## What is in it` の下に `### Product` と `### Default` を本文なしでこの順に置き、日本語の見出しを `## What is in it`、`## Getting started`、`## <the product's own sections>`、`## Contributing`、`## License` にそろえ、`## Writing` に説明文の規則（1文、指示語と一覧に並ぶ名前を含めない、置かれた場所に依存しない）とスターターの README に `### Product` を置かない理由を足し、プレースホルダの文言を `### Product` と `### Default` の形に合わせる。
2. `scripts/product-ready/readme-format.test.ts`:
   - drop: このファイルを削除する（固定値の写しは `rules/readme.format.md` との二重管理になる）。
3. `scripts/product-ready/index.test.ts`:
   - update: (happy) `--run` の後の `README.md` と `README.ja.md` → `## What is in it` の下に `### Product` と `### Default` がこの順で並ぶ。

### Verify

- Always:
  - `pnpm test:related rules/readme.format.md`（関連が無ければ `pnpm test:run scripts/product-ready`）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - grep ツールで `^### (Product|Default)$` を `rules/readme.format.md` から検索し、4件であることを確かめる
  - grep ツールで `^## (入っているもの|使い始める|ライセンス|コントリビュート|プロダクト固有)` を `rules/readme.format.md` から検索し、0件であることを確かめる
  - 変更した3ファイルを通読し、矛盾、循環、重複、不足、不自然な流れがないか確かめる
- Added: なし

## 3.生成の組み立て

### Types

```ts
/** 置き換える前の README の `###` 1つ分の行 */
type DefaultLine = { readonly heading: string; readonly paragraph: string };

/** テンプレートの `block` と置き換える前の README から、同じ `##` 見出しの各 `###` の段落を集める。見出しや段落がなければ例外を投げる（検証はこの関数の中で行う） */
export function defaultLines(block: string, source: string): readonly DefaultLine[];

/** `##` 見出しの下の `###` が2つ以上あるとき、後ろの `###` の本文を `- <見出しの名前>: <段落>` の箇条書きで置き換える。`###` が2つ未満なら `block` をそのまま返す */
export function fillDefaults(block: string, source: string): string;

/** 見出しを加えた表示用の行 */
export function planLines(
  labels: readonly Label[],
  plan: readonly FoundEntry[],
  headings: readonly string[],
): readonly string[];
```

### Steps

1. `scripts/product-ready/index.mjs`:
   - update: `whole` の block のうち `##` 見出しの下に `###` を2つ以上持つもの（README のテンプレートの `## What is in it`）を対象に、置き換える前の README の同じ `##` 見出しの各 `###` の段落を後ろの `###` の本文に置き（前の `###` はそのまま残す）、見出し名はテンプレートから読み、`##` 見出しが無い・`###` が2つ未満・段落が空のいずれかなら `remove` と書き込みの前に投げ、`--run` なしの表示にも同じ読みを使う。
2. `scripts/product-ready/cli.mjs`:
   - update: `planLines` に並べた見出しを渡し、`<at>` の行の下に `headings: <名前の並び>` を出す（`--only` と行の形は変えない）。
3. `scripts/product-ready/index.test.ts`:
   - update: (happy) README に5つの `###` と説明文がある一時ツリーで `--run` → `### Default` の下に `- <見出し名>: <説明>` の5行が並ぶ
   - update: (happy) 日本語の README でも `--run` → 同じ5行が並び、見出し名は英語で説明文は日本語
   - update: (error) `## What is in it` を持たない README で `--run` → 1行のエラーで exit 1、ツリーは変わらない
   - update: (error) `###` の直後に段落がない README で `--run` → 1行のエラーで exit 1、ツリーは変わらない
   - update: (happy) `--run` なしの表示 → `headings: <見出しの並び>` の行が出る
4. `scripts/product-ready/cli.test.ts`:
   - update: (happy) `planLines` に並べた見出しを渡す → `headings: <見出しの並び>` の行が出る

### Verify

- Always:
  - `pnpm test:related scripts/product-ready/index.mjs scripts/product-ready/cli.mjs`（関連が無ければ `pnpm test:run scripts/product-ready`）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - grep ツールで `headings:` を `scripts/product-ready` から検索し、1件以上であることを確かめる
  - grep ツールで `- Roadmap & Cycle:` を `scripts/product-ready/index.test.ts` から検索し、1件以上であることを確かめる
  - 変更した4ファイルを通読し、矛盾、循環、重複、不足、不自然な流れがないか確かめる
- Added: なし

## Notes

### Slice 1: スターターの README の書き直し

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 2: テンプレートの組み直し

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 3: 生成の組み立て

- Findings:
- Unplanned:
- Commit:
- Stopped:

## Work Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Unproven:
- Noise:
- Doubts:

## Acceptance

- Ran:
- Findings:
- Doubts:
