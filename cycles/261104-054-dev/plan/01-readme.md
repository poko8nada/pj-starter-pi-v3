# PLAN `readme`

- No: 01, 02
- Place: worktree
- Boundary Plans: なし（`cycle-rules` と `close-names` は、このプランで書く README とテンプレートを読まない）

## Files

```text
.github/
  workflows/
    pullfrog.yml              drop
README.md                     update
README.ja.md                  update
package.json                  update
pnpm-lock.yaml              update
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
   - update: 題名 `# Harness-included starter` とその下の説明の2文は継承し、バッジを TypeScript・Node 24・pnpm・pi の4つにして値は `package.json` の `devDependencies`・`engines`・`packageManager` から取り、`## What is in it` を `### Roadmap & Cycle`、`### Agent`、`### Checks`、`### Handover`、`### CI` の5つに組み直し、各見出しの直後の説明文1文（一覧を読まなくても通じる1文で、指示語と一覧に並ぶ名前を含めず、置かれた場所に依存しない）と `- <パス>: <説明>` の一覧（文書はリンク、一覧と入れ子は `adr.md:64-67` のとおり、`### CI` の説明文は `_Under construction_`）を置き、`## Getting started` は前提条件1文（`engines` の `>=24` と同じ数）のあとに `pnpm install`、`pnpm product:ready`、`pi` の起動を順に示し、`## Checks`・`## Harness`・`## Cycle`・`## Contributing` の内容は5つの一覧の項目の説明に集め（コマンドの表とコマンドブロックは残さない）、言語リンクは現行のままにし、`### CI` は `_Under construction_` の1文だけにして一覧を置かず、`.github/workflows/pullfrog.yml` を削除する。
3. `README.ja.md`:
   - update: 題名を `# Harness-included starter（ハーネス付きスターター）` にし、説明の2文は継承し、見出しは英語にそろえて、英語の README と同じ5つの `###`・項目ごとの説明・入れ子・バッジ4つ・`### CI` の `_Under construction_`・前提条件1文・言語リンクにし、`ja-check` の禁止語を使わず、用語を `サイクル`、`プロダクト`、`オーナー`、`エントリー`、`トリアージ`、`ノート`、`項目`、`ステージ`、`バックグラウンド`、`ターン`、`ユーザー`、`クローン`、`フック` にそろえる。

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
  - `README.md` と `README.ja.md` の4バッジの値が、`package.json` の `typescript`・`engines.node`・`packageManager`・`@earendil-works/pi-coding-agent` の値と一致することを確かめる
  - grep ツールで `pullfrog` を `README.md` と `README.ja.md` から検索し、0件であることを確かめる
  - `test -e .github/workflows/pullfrog.yml` が失敗する（ファイルが消えている）ことを確かめる
  - `README.md` と `README.ja.md` の相対リンクの先を `test -e <path>` で1つずつ確かめ、すべて 0 で終わる
  - 変更した3ファイルと削除した `.github/workflows/pullfrog.yml` を通読し、矛盾、循環、重複、不足、不自然な流れがないか確かめる
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

- Findings: なし
- Unplanned: pnpm-lock.yaml が packageManager の宣言で書き換わった（pnpm が自分のバージョンを記録するため）。同じコミットに含めた。オーナー指示で .github/workflows/pullfrog.yml を削除し、両 README の ### CI から一覧を外して _Under construction_ の1文だけにし、README.ja.md の用語を他文書にそろえた（循環→サイクル、製品→プロダクト、所有者→オーナー、細目→エントリー、選別→トリアージ、覚書→ノート、課題→項目、工程→ステージ、裏で→バックグラウンドで、各回→ターン、利用者→ユーザー、複製→クローン、連動→フック）。
- Commit: fd2f97e consult(readme): rewrite starter readmes into five sections
- Stopped: なし

### Slice 2: テンプレートの組み直し

- Findings: なし
- Unplanned: なし
- Commit: 040b2c0 consult(readme): reshape readme template into product and default
- Stopped: なし

### Slice 3: 生成の組み立て

- Findings: なし
- Unplanned: なし
- Commit: 6b6f890 consult(readme): build default bullets from starter headings
- Stopped: なし

## Work Review

### Round 1

- Stale:
  - なし — pullfrogは現行のREADMEとコードから消え旧日本語見出しは否定断言に置き換わったため、現行の文書・コメント・テストを古くする変更は残っていない。
- Unlisted:
  - pnpm-lock.yaml:8がFilesに名前がなく差分でpackageManagerDependenciesを追加しているため、package.json:40の追加に伴う生成物であってもFilesから追跡できずcloseできない。
    - fixed: `## Files` に `pnpm-lock.yaml update` を足した。`packageManager` の宣言で pnpm が自分のバージョンを記録するためである。
- Gaps:
  - scripts/product-ready/index.mjs:129のnot enough headingsの投げに対応するテストがなくscripts/product-ready/index.test.ts:422とscripts/product-ready/index.test.ts:439は残り2条件だけを確かめるため、Stepsの3条件の1つは検査が実行されない。
    - fixed: `###` が1つだけの README で `--run` → 1行エラー・exit 1・ツリー不変のテストを足し、3条件をすべて検査する形にした。
  - README.md:3の4バッジの値がpackage.json:29らの値と一致することへの検査がなくVerifyはNode-24の1件だけを数えるため、TypeScript・pnpm・piの値の取り違えは検査が実行されない。
    - fixed: スライス1の `Verify` に4バッジと `package.json` の突き合わせ行を足し、両 README の値が対応値と一致することを確かめた。
- Unproven:
  - scripts/product-ready/index.test.ts:404のtoContainによる5行確認は順序も重複も配置の排他も断言しないため、箇条書きを逆順や重複に壊しても緑のままになる。
    - fixed: `### Default` 配下の箇条書き行だけを抜き出して期待の5行と `toEqual` で突き合わせ、順序・件数・排他を断言する形に直した。
- Noise:
  - scripts/product-ready/index.test.ts:406の'- Roadmap & Cycle:'の断言は直前の繰り返しが共通の定数で同じ5行を確かめているため、重複でありハードコード文字列を持ち誰も気づかない1行だけの確認になる。
    - fixed: ハードコードの1行を外し、共通の定数による5行の突き合わせだけを残した。
- Doubts:
  - scripts/product-ready/index.mjs:220とscripts/product-ready/index.mjs:281の同形の省略判定が二重に書かれているため、将来の変更でずれる恐れが残るが現状の差分では挙動は一致する。
    - left: 現状の挙動は一致しており、共通化はこの差分の責務を超えるため見送る。
  - cycles/261104-054-dev/adr.md:118らの旧見出しの記述は変更前の実測であり歴史的記録であるため、staleとは扱わない。
    - left: 記録は当時の事実であり、書き換えない。

### Round 2

- Stale: なし — Round 1 の `fixed:` は Unlisted・Gaps・Unproven・Noise にあり、`Stale` には `fixed:` がないため対象外である（:173-:174）。
- Unlisted: なし — fixed 1件を確認。`## Files` に `pnpm-lock.yaml update` があり（:16）、差分の生成物が追跡できるため、指摘の追跡不能は閉じている。
- Gaps: なし — fixed 2件を確認。`scripts/product-ready/index.test.ts:478-498` が `###` が1つだけの README で `--run` → 1行エラー・exit 1・ツリー不変を断言し実装 `scripts/product-ready/index.mjs:128-129` の `not enough headings` に対応するため、3条件目の穴は閉じている。`## Verify` に4バッジと `package.json` の突き合わせ行があり（:61）、`README.md:3` と `package.json:29-40` の値の取り違えを確かめるため、バッジの穴は閉じている。
- Unproven: なし — fixed 1件を確認。`scripts/product-ready/index.test.ts:400-407` が `### Default` 配下の `- ` 行だけを抜き出して期待の5行と `toEqual` で突き合わせ、実装の箇条書きに対応するため、逆順・重複で赤になる。
- Noise: なし — fixed 1件を確認。`scripts/product-ready/index.test.ts:405-406` が共通の定数による5行の突き合わせだけを残し、ハードコードの1行が残らないため、重複の穴は閉じている。
- Doubts: なし — `left:` の2件（:190-:193）は対象外であり、新たに所見に至る疑義もない。

## Acceptance

- Ran: `pnpm test:run`（63ファイル、746テスト）、`pnpm typecheck`（root と .pi が ok）、`pnpm lint`、`pnpm format:check`、grep ツールで `^### (Roadmap & Cycle|Agent|Checks|Handover|CI)$` が各5件・`^## (Checks|Harness|Cycle|Contributing)$` が0件・`^## [^A-Za-z]` が0件・`_Under construction_` が各1件・`Node-24` が各1件・`pullfrog` が0件、`test -e .github/workflows/pullfrog.yml` が失敗、相対リンクの `test -e` がすべて 0、`node scripts/checks/ja-check.mjs README.ja.md` が `error 0` `warn 0`、`fillDefaults` の呼び出しを外すと Product/Default の 2 件が赤、`planLines` の見出し行を外すと表示と cli の 2 件が赤（いずれも戻して緑）、レビュー consult-36（Round 1 の指摘はすべて `fixed:` か `left:`、Round 2 は五点とも `なし`）。
- Findings: なし
- Doubts: なし
