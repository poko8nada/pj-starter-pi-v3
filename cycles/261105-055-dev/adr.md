# ADR 055

## 01: ja-check の除外を、パス一致の設定に置き換えられるか

### Context

- `scripts/checks/ja-check.mjs` は、除外を 2 つコードに固定している。対象は設定ファイル自身と、`ROADMAP.md` の `## 0.x.x` の範囲である（`ja-check.mjs:135-141`、`151-176`）。
- `cycles/<サイクル>/affected.md` はエージェントが書く長い記録で校正の機会が少なく、検査のたびに修正作業が増える。
- `ROADMAP.md` の `## 0.x.x` の範囲は、いま error 6 件と warn 8 件を含み、いずれもこの範囲の中にある。
- オーナーは、パスが一致したファイルは中身を読まずにファイル全体を除外する形で、除外対象を設定で増やせることを求めている。

### Scope

- 変更:
  - behavior: in — `ja-check.json` の除外の一覧に載るパスと一致したファイルは中身を読まずにスルーし、`ROADMAP.md` はファイル全体、`affected.md` はどのサイクルのものも除外する。
  - refactor: in — コードに固定した `ROADMAP.md` の `## 0.x.x` の範囲判定（`isZeroHeading`、`isHeading`、`inZero`）を削除して除外の判定を 1 か所にまとめ、除外はスクリプトの中で判定し、`lefthook.yaml` の呼び出し方は変えない。
  - dependency: out — パッケージは増やさない（理由: `node:path` と `node:fs` で足り、パターンの一致は `node:path` の `matchesGlob` で行える。依存を増やすとハーネスの同期と監査の対象が増える）。
  - naming: in — 設定の欄名と除外の一覧の呼び方を決め、欄の名前は `exclude` とする。
  - format: in — `scripts/checks/ja-check.json` の欄の並びを決め、`oxfmt` の整形結果に従う。
  - prose: in — `README.md` と `README.ja.md` の japanese-check の説明 1 行に、設定に書いたパスを除外する旨を加える。
- 品質:
  - speed: out — 速さは目標にしない（理由: 除外の判定は読み込み前の 1 回で対象は数十ファイルのため、計測する意味がない）。
  - security: out — 安全は目標にしない（理由: 扱うのはリポジトリ内のパスだけで、外からの入力は増えない）。
  - compatibility: out — いまの 3 つの欄だけの形は受け付けない（理由: 設定ファイルはこのリポジトリに 1 つしかなくコードと同じコミットで書き換えるため、互換の分岐を持つと検証が二重になる）。
  - errors: in — 除外の一覧が配列でないときや要素が文字列でないときはこれまでどおり設定エラーとして止め、「キーが 3 つでなければ設定エラー」という検証も新しい形に合わせる。
- 運用:
  - deploy: out — 配布先がない（理由: このリポジトリ内のスクリプト）。
  - migration: in — このリポジトリの `scripts/checks/ja-check.json` を新しい形に書き換え、`ROADMAP.md` と `**/affected.md` を除外の一覧に置く。
  - logs: out — 出力の形と件数の数え方は変えない（理由: 除外は静かにスルーし、`ja-check: N files` の N は引数の数のままとしていまの挙動と同じにする）。
  - monitoring: out — 監視の仕組みを持たない（理由: このリポジトリに監視がない）。

### Research & Trial

- Lefthook は staged の一覧を `git diff --name-only --cached --diff-filter=ACMR` で取る（`lefthook.yaml:24-27`、Lefthook の実装 `internal/git/repository.go`）。
- `node:path` の `matchesGlob` は v22.5.0 で追加されて v24.8.0 で stable になったもので、この環境は v24.22.1 である（Node の公式ドキュメント）。
- Windows ではネイティブの実装がパスの `\` を `/` に直してから照合し、Node のテストは `path.win32.matchesGlob('foo\\bar\\baz', 'foo/**')` が true であることを確かめている。
- 大文字と小文字は Windows と macOS では区別されず、Linux では区別される（`src/glob/node_glob.cc` の `kFlagNocase`）。
- `.` で始まるセグメントは、既定（`dot` が false）では `*` に一致しない（`src/glob/glob_matcher.cc`）。
- `**/` が 0 階層にも一致することは公式ドキュメントになく、手元の確認では `affected.md` に `**/affected.md` が一致した。
- Lefthook が渡すパスがルートからの相対か `./` が付くかは公式ドキュメントに明記がないため（Windows では引用符が付く不具合の報告 #747 がある）、突き合わせの前にルートからの相対パスに直す。

### Decision

- Status: **accepted**
- Adopted:
  - 設定の欄 `exclude` に `"ROADMAP.md"` と `"**/affected.md"` を置き、一致の判定は `node:path` の `matchesGlob` に委ね、突き合わせの前に引数をリポジトリのルートからの相対パスに直し、設定ファイル自身の除外はコードに残す。
- Options:
  - B: 自前の小さな一致関数を書く（パターンの意味を Node の実装から切り離せるものの、コードとテストが増え、いまの 2 つのパターンには要らない）
  - C: 名前（ベース名）の一覧にする（パターンを書かずに済むが、場所を絞れない）

### Definition

- `Unit.japanese-check`(kept): 日本語に対する指摘をエージェントが受け取れることは変わらず、除外の与え方が変わるだけで指摘の中身は変わらない。
- `Unit.lefthook-gate`(kept): コミットを止める条件は変わらず、検査から外れるファイルが 2 種類増えるだけである。
