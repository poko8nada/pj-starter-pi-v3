# PLAN `propose-skill`

## Files

```text
.pi/
  skills/
    propose/
      SKILL.md              add
DEFINITION.md               update
README.md                   update
README.ja.md                update
```

## Slices

## 1.スキルの本文

### Types

なし

### Steps

1. `.pi/skills/propose/SKILL.md`:
   - frontmatter に `name: propose` と description を書く。description は「次に何をするかを聞かれた時」で発火する形にし、2 文で書く。サイクル開始の宣言では発火させない。
   - 冒頭に、ADR の前段であり、決めたことを ADR が書くという位置づけを書く。
   - 3 つの問いを書く。積み残しが無いか、新しい Unit は何か、現行の Unit に不要なものや統合できるものは無いか。
   - 3 つを 1 回で回すことと、重さで分けないことを書く。
   - 手順の最初をコードベースの探索にし、リサーチをそこに並行させると書く。
   - リサーチは承認を取らないことを書く。探索で範囲が決まる。
   - リサーチの型を 3 つ書く。公式情報、ソースコード、実際に使われている形である。
   - 積み残しの出どころを書く。`close.md` の `Triage` の `proposed` と、`archive` の ADR の `rejected` である。
   - 新しい Unit の出どころを書く。`DEFINITION.md` の全行と `Who` の `Needs` である。
   - 棚卸しの仕方を書く。`DEFINITION.md` の全行を `definition/rules.md` の規則に照らす。
   - 収束点を 4 つ書く。`brief` と同じである。
   - 各候補に、なぜ今か、どの Unit が動くか、根拠を添えると書く。
   - 推奨を 1 つ添え、owner が選ぶか見送ると書く。
   - ファイルを作らないこと、`DEFINITION.md` も `cycles/` も書かないことを書く。
   - 使う名前をハーネスが配る物に限ることを書く。この repo の中身の名前は出さない。
   - 独立したスキルとして読めるように書く。`brief` から写したことを読む者に書かない。

### Verify:

- read: `review` サブエージェントが `.pi/skills/propose/SKILL.md` を読み、次の各ケースを報告する
  - (happy) 冒頭を読む → ADR の前段であり、決めたことを ADR が書くと書かれている
  - (happy) 3 つの問いの節を読む → 積み残し、新しい Unit、棚卸しの 3 つが並んでいる
  - (happy) 同じ節を読む → 3 つを 1 回で回し、重さで分けないと書かれている
  - (happy) 手順の最初を読む → コードベースの探索が最初で、リサーチが並行と書かれている
  - (happy) 手順を読む → リサーチは承認を取らないと書かれている
  - (happy) 出どころの節を読む → 積み残しの出どころが `proposed` と `rejected` と書かれている
  - (happy) 出どころの節を読む → 新しい Unit の出どころが `DEFINITION.md` と `Who` の `Needs` と書かれている
  - (happy) 出どころの節を読む → 棚卸しが `definition/rules.md` に照らすと書かれている
  - (happy) 収束点の節を読む → 4 つが並び、`brief` と同じだと書かれている
  - (happy) 候補の節を読む → なぜ今か、どの Unit が動くか、根拠を添えると書かれている
  - (happy) 候補の節を読む → 推奨を 1 つ添え、owner が選ぶか見送ると書かれている
  - (happy) 書かないことの節を読む → ファイルを作らず、`DEFINITION.md` も `cycles/` も書かないと書かれている
  - (happy) 名前の節を読む → ハーネスが配る名前に限ると書かれている
  - (happy) 本文を通して読む → `brief` から写したという記述が無く、独立して読める
  - (boundary values) description を読む → 2 文であり、サイクル開始の宣言では発火しないと読める
  - (error) 本文の名前に目を通す → repo 固有の名前（スキル、拡張、検査の道具）が出てこない
  - _no case_: 3 つの問いの順序 — 順序で結果が変わらない

## 2.統合: `propose` が ADR に渡せる状態で終わること

### Types

なし

### Steps

1. `DEFINITION.md`:
   - `Users can do` に `propose-skill` の 1 行を足す。ADR 022 の 02 の `Definition Change` の文をそのまま使う。

2. `README.md`:
   - `six skills` を `seven skills` にし、一覧に `propose` の 1 行を足す。既存の行と同じ形にする。

3. `README.ja.md`:
   - `6 つ` を `7 つ` にし、一覧に `propose` の 1 行を足す。既存の行と同じ形にする。

### Verify:

- look: owner が `.pi/skills/propose/SKILL.md` と `git diff DEFINITION.md README.md README.ja.md` を読み、答える
  - (happy) owner が本文を読む → `propose` の終わりが ADR の `Context` と `Options` と `Research & Trial` に収まる、と答える
  - (empty) `git diff DEFINITION.md` を見る → 増えた行は 1 行で、削除も変更も無い
  - (boundary values) `git diff README.md README.ja.md` を見る → 数が 7 になり、足した行が隣の行と同じ字下げと同じ区切りになっている
  - (error) 定義の行の書き方を `definition/rules.md` と照らす → `Who` の側から読め、2 語の名前になっている
  - _no case_: 実際のサイクルで提案が当たるか — 次のサイクルで分かる

## Notes

### Slice 1: スキルの本文

- Findings:
- Unplanned:
- Commit:

### Slice 2: 統合: `propose` が ADR に渡せる状態で終わること

- Findings:
- Unplanned:
- Commit:

## Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Unproven:
- Doubts:

## Acceptance

- Ran:
- Findings:
- Doubts:
