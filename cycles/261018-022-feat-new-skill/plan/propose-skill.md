# PLAN `propose-skill`

## Files

```text
.pi/
  skills/
    propose/
      SKILL.md              add
      references/
        tasks.md            add
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
   - `references/tasks.md` にサブエージェントへ渡す文があると 1 行書く。
   - 3 つの問いを書く。積み残しが無いか、新しい Unit は何か、現行の Unit に不要なものや統合できるものは無いか。
   - 3 つを 1 回で回すことと、重さで分けないことを書く。
   - 手順の最初をコードベースの探索にし、リサーチをそこに並行させると書く。
   - リサーチは承認を取らないことを書く。探索で範囲が決まる。
   - リサーチの型を 3 つ書く。公式情報、ソースコード、実際に使われている形である。
   - ソースは探索でエージェント自身が読むので、`research` サブエージェントに渡すのは公式情報と実際に使われている形であると書く。
   - 研究の問いを 2 つ書く。発見（`compare`）と確認（`mechanism`、`triage`）である。
   - 発見の問いは、この製品で何ができるかをまだ見えていない時に走らせると書く。
   - 積み残しの出どころを書く。`close.md` の `Triage` の `proposed` と、`archive` の ADR の `rejected` である。
   - 新しい Unit の出どころを書く。`DEFINITION.md` の全行と `Who` の `Needs` である。
   - 棚卸しの仕方を書く。`DEFINITION.md` の全行を `definition/rules.md` の規則に照らす。
   - 収束点を 4 つ書く。吟味された候補が揃う、`Context` が埋まる、`Options` が埋まる、決定が乗る事実が `Research & Trial` に書ける。
   - 候補を出すだけで、決めないことを書く。決めるのは ADR である。
   - 各候補に、なぜ今か、どの Unit が動くか、根拠を添えると書く。
   - 推奨を 1 つ添えると書く。どの候補でサイクルを起こすかは owner が決めると書く。
   - `DEFINITION.md` も `cycles/` も書かないこと、決めないことを「そうしない」の節に書く。
   - 独立したスキルとして読めるように書く。`brief` から写したことを読む者に書かない。

2. `.pi/skills/propose/references/tasks.md`:
   - `research` サブエージェントへ渡す文を書く。問い、型ごとに何に答えるか、各事実の出所を残すこと、答えられなかった問いは何を止めているかを添えることを含める。
   - 他のスキルの `references/tasks.md` と同じ形にする。前書きと、節ごとの囲みと、その下の箇条。

### Verify:

- read: `review` サブエージェントが `.pi/skills/propose/SKILL.md` と `.pi/skills/propose/references/tasks.md` を読み、次の各ケースを報告する
  - (happy) frontmatter を読む → `name: propose` である
  - (happy) description を読む → 次に何をするかを聞かれた時で発火する形になっている
  - (boundary values) description を読む → 2 文であり、サイクル開始の宣言では発火しないと読める
  - (happy) 冒頭を読む → ADR の前段であり、決めたことを ADR が書くと書かれている
  - (happy) 本文を読む → `references/tasks.md` にサブエージェントへ渡す文があると書かれている
  - (happy) 3 つの問いの節を読む → 積み残し、新しい Unit、棚卸しの 3 つが並んでいる
  - (happy) 同じ節を読む → 3 つを 1 回で回し、重さで分けないと書かれている
  - (happy) 研究の問いを読む → 発見（`compare`）と確認（`mechanism`、`triage`）の 2 つが書かれている
  - (happy) 研究の問いを読む → 発見は、何ができるかがまだ見えていない時だけと書かれている
  - (happy) 手順の最初を読む → コードベースの探索が最初で、リサーチが並行と書かれている
  - (happy) リサーチの型を読む → 3 つの型が並び、ソースは探索で読み、サブエージェントには公式情報と実際に使われている形を渡すと書かれている
  - (happy) 手順を読む → リサーチは承認を取らず、探索で範囲が決まると書かれている
  - (happy) 出どころの節を読む → 新しい Unit の出どころが `DEFINITION.md` と `Who` の `Needs` と書かれている
  - (happy) 出どころの節を読む → 棚卸しが `definition/rules.md` に照らすと書かれている
  - (happy) 出どころの節を読む → 積み残しの出どころが `proposed` と `rejected` と書かれている
  - (happy) 収束点の節を読む → 吟味された候補が揃う、`Context` が埋まる、`Options` が埋まる、決定が乗る事実が `Research & Trial` に書けるの 4 つが並び、決めないと書かれている
  - (happy) 候補の節を読む → 候補を出すだけで、決めるのは ADR であると書かれている
  - (happy) 候補の節を読む → なぜ今か、どの Unit が動くか、根拠を添えると書かれている
  - (happy) 候補の節を読む → 推奨を 1 つ添え、どの候補でサイクルを起こすかを owner が決めると書かれている
  - (happy) そうしないの節を読む → `DEFINITION.md` も `cycles/` も書かず、決めないと書かれている
  - (happy) 本文を 1 枚で読む → どの規則も `brief` を参照せず、それだけで意味が通る
  - (error) 本文に目を通す → このハーネスの開発にだけある名前（`intent-router`、`quality-gate`、`consult`、`sound-notify`、`lefthook`、`oxlint`、`oxfmt`、`tsc`、`vitest` など、このリポジトリの開発用の道具や拡張の名前）が出てこない
  - (happy) `tasks.md` の `research` の節を読む → 型ごとに何に答えるか、出所を残すこと、答えられなかった問いは何を止めているかを添えると書かれている
  - (happy) `tasks.md` の形を読む → 前書きと、節ごとの囲みと、その下の箇条になっている
  - (error) `tasks.md` に目を通す → このハーネスの開発にだけある名前が出てこない
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
  - (empty) `git diff DEFINITION.md` を見る → 増えた 1 行が ADR 022 の 02 の `Definition Change` と同じ文で、削除も変更も無い
  - (boundary values) `git diff README.md` を見る → 数が 7 になり、`propose` の 1 行が増え、既存の行と同じ形になっている
  - (boundary values) `git diff README.ja.md` を見る → 数が 7 になり、`propose` の 1 行が増え、既存の行と同じ形になっている
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
