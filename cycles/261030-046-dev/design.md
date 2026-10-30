# DESIGN 046

## Affected

### 01: README の形式は、どの見出しをどの順に持つか

- `scripts/product-ready/targets.mjs` — `## Skeleton` と `## Skeleton (ja)` の出所として `rules/readme.format.md` を指定する
- `scripts/product-ready/index.mjs` — `jobsFor` が雛形のファイルを読み、`blockUnder` がブロックを抜く
- `scripts/product-ready/index.test.ts` — 実物の `rules/readme.format.md` を写し、差し替えた後の見出しを固定する
- `README.md` — `kind: 'whole'` で `## Skeleton` のブロックに置き換わる
- `README.ja.md` — `kind: 'whole'` で `## Skeleton (ja)` のブロックに置き換わる

### 02: スターター自身の `README.md` と `README.ja.md` を、その形式でどう埋めるか

- `scripts/product-ready/targets.mjs` — `README.md` と `README.ja.md` を、差し替えの対象として並べる。クローンでは雛形で上書きされる
- `scripts/product-ready/index.test.ts` — 一時木に `README.md` と `README.ja.md` を書いて読み返す

### 03: `product:ready` が差し込む雛形は、その形式で何を置くか

- `scripts/product-ready/index.mjs` — `blockUnder` が、ブロックの閉じの行を探す
- `scripts/product-ready/targets.mjs` — 2 つのブロックを 2 枚の README に結び付ける
- `scripts/product-ready/index.test.ts` — 差し替えた後の `## What is in it` と `## 入っているもの` を固定する
- `README.md` — `kind: 'whole'` で `## Skeleton` のブロックに置き換わる
- `README.ja.md` — `kind: 'whole'` で `## Skeleton (ja)` のブロックに置き換わる

## External

### 01: README の形式は、どの見出しをどの順に持つか

- なし

### 02: スターター自身の `README.md` と `README.ja.md` を、その形式でどう埋めるか

- `GitHub Actions` — タイトル直後に、状態のバッジを置く。`origin` は `git@github.com:poko8nada/pj-starter-pi-v3.git` である。
- `TypeScript` — タイトル直後に、バージョンのバッジを置く。版は `package.json:29` の `^7.0.2` である。

### 03: `product:ready` が差し込む雛形は、その形式で何を置くか

- なし

## `readme-format`

### ADR & Where

- No: 01, 03
- Why: 入力が `rules/readme.format.md` 1 つで、01 の見出しと 03 の雛形が同じファイルの同じブロックを書く。何も待たない。
- Where: worktree

### Goal

- `rules/readme.format.md` の `## Skeleton` のブロックが 8 行になり、`# <the product's name>`、`<badges>`、`<what it is, in one sentence>`、`## What is in it`、`## Getting started`、`## <the product's own sections>`、`## Contributing`、`## License` が順に並ぶ。
- `rules/readme.format.md` の `## Skeleton (ja)` のブロックが 8 行になり、`# <プロダクトの名前>`、`<バッジ>`、`<何であるか、何をするか。1 文>`、`## 入っているもの`、`## 使い始める`、`## <プロダクト固有のセクション>`、`## コントリビュート`、`## ライセンス` が順に並ぶ。
- 2 つのブロックの `<...>` が、それぞれの言語で書かれている。
- バッジの行が `# <the product's name>` の直後、見出しを持たない行にあり、`## Usage` の見出しがどのブロックにも無く、`## Getting started` がインストールと使用方法を兼ねる。
- `## Writing` に、バッジを関連するものだけに絞り、出所のある値だけを置く規則がある。
- 2 つのブロックの前に、「`<...>` は埋める場所である」と「言語ごとに書く」を保つ説明文がある。
- 2 つのブロックの中にフェンスの行が無く、言語のリンクの行も無い。
- `pnpm test:run -- scripts/product-ready` が緑で、`scripts/product-ready/index.test.ts:187` と `:189` の 2 つの見出しの検査が通る。
- 2 つのブロックの 8 行の並びが、上の 2 行のとおりである（エージェントがファイルを読んで確かめる）。

### Non-goal

- `## Usage` を独立した見出しとして置かない（01 の案 B で `## Getting started` が兼ねるため）。
- `## <the product's own sections>` を外さない（03 の案 B を採らなかったため）。
- 3 つ目の行として言語のリンクを雛形に置かない（03 の案 C を採らなかったため）。
- ブロックの中にフェンスを置かない（`blockUnder` が同じ記号の閉じの行で切れるため）。
- `scripts/product-ready/` のコードを変えない（03 の `behaviour: out`）。
- `README.md` と `README.ja.md` を変えない（`starter-readme` が持つ）。
- ほかの `rules/` のファイルを変えない（`## Writing` の追加は `readme.format.md` の中だけである）。
- `rules/readme.format.md` の置き場所と名前を変えない（01 の `refactor: out`）。
- `rules/readme.format.md` とハーネスの説明を別ファイルに分けない（01 の案 D を採らなかった）。
- 見出しを 8 つより多くしない（01 の案 C を採らなかった）。

### Summary

- `rules/readme.format.md` の見出しをプロダクトの構成の 8 行に置き換え、バッジの行と `## Writing` の規則を足し、英語と日本語の雛形をその 8 行にする。

### Paths

- `rules/readme.format.md`

### Boundary

- Plans: なし
- External: なし

## `starter-readme`

### ADR & Where

- No: 02
- Why: 入力が `README.md` と `README.ja.md` の 2 枚で、`readme-format` が決める `rules/readme.format.md` の新しい見出しを読むため、`readme-format` を待つ。
- Where: worktree

### Goal

- `README.md` の見出しが、`# Harness-included starter`、バッジの行、短い説明、`## What is in it`、`## Getting started`、`## Checks`、`## Harness`、`## Cycle`、`## Contributing`、`## License` の順に並ぶ。
- `README.ja.md` の見出しが、`# ハーネス付きスターター`、バッジの行、短い説明、`## 入っているもの`、`## 使い始める`、`## 検査`、`## ハーネス`、`## サイクル`、`## コントリビュート`、`## ライセンス` の順に並ぶ。
- バッジの行が、GitHub Actions の状態と TypeScript のバージョンの 2 つを持つ。
- `## What is in it` が、このスターターが提供するものの列になる。検査、ゲート、エージェントの規則、サイクルの仕組み、パッケージ、拡張、CI、サイクルの記録である。
- `## Getting started` が、インストールと、そこから最初に動かすところまでを書く。
- `## Cycle` の 6 つのステージの説明が、`.pi/skills/*/SKILL.md:3` の `description` と行ごとに一致する（エージェントの読み合わせで確かめる）。
- `## Contributing` が、commit と push の検査と、commit の前の 3 つのコマンドを書き、PR を受け付けるかどうかを書かない。
- `## License` が `UNLICENSED` の 1 語だけを持つ。
- `pnpm test:run -- scripts/product-ready` が緑のままである（02 の `compatibility: in`）。
- 言語のリンクの行が、両方のファイルで短い説明の次の行にある。

### Non-goal

- `## Usage` を独立して置かない（01 の案 B）。
- 目次を置かない（100 行を超えないため）。
- `## Contributing` に PR の受け付けの可否を書かない（記録が無いため）。
- `LICENSE` と `CONTRIBUTING.md` を作らない（02 の `refactor: out`）。
- `## <the product's own sections>` の見出しを、そのままの形で残さない（このスターターでは `## Checks`、`## Harness`、`## Cycle` がここに入る）。
- Node と pnpm のバッジを置かない（版の出所がリポジトリに無いため）。
- 本文を今のまま残さない（02 の案 A を採らなかった）。
- `## Cycle` の各ステージの説明を、`description` を指す 1 行にしない（02 の案 C を採らなかった）。
- `rules/readme.format.md` を変えない（`readme-format` が持つ）。

### Summary

- 2 枚の README を、ハーネスをプロダクトとして書き直し、見出しを `rules/readme.format.md` の 8 行に揃え、バッジと `## Contributing` と `## License` を足す。

### Paths

- `README.md`
- `README.ja.md`

### Boundary

- Plans:
  - `readme-format`: 決めるのは `rules/readme.format.md` の見出しの並びである。この plan はそれを使う。
- External:
  - `GitHub Actions`: タイトル直後に、状態のバッジを置く
    - Contract: `origin` は `git@github.com:poko8nada/pj-starter-pi-v3.git` である
  - `TypeScript`: タイトル直後に、バージョンのバッジを置く
    - Contract: 版は `package.json:29` の `^7.0.2` と一致する
