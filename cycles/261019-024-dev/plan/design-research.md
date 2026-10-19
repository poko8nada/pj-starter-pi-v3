# PLAN `design-research`

## Files

```text
.pi/
  skills/
    design/
      SKILL.md                update
      references/
        format.md             update
        tasks.md              add
```

## Slices

## 1.調査のステージを足す

### Types

なし

### Steps

1. `.pi/skills/design/references/tasks.md`:
   - `research` サブエージェントへ渡す文を書く。問いは entry ごとで、accepted の entry が触る Unit について、Unit を跨いで関連する path を挙げさせる。
   - 挙げる組を 5 つ書く。この変更が読む物、この変更の結果を読む物、これを検査する物、生成物、文書。
   - 今存在する path だけを、path と短い理由の組で返させる。重複は消させない。
   - 事実だけを返させ、決定を書かせない。
   - 他のスキルの `references/tasks.md` と同じ形にする。前書きと、節ごとの囲みと、その下の箇条。

2. `.pi/skills/design/SKILL.md`:
   - 手順に調査のステージを足す。ADR の accepted の entry ごとに並行で `research` を走らせ、結果を design.md の `## Possibly related files` に書く。
   - 切る段に、`## Possibly related files` の重なりを材料として書く。同じ path を持つ entry は同じ plan の候補、他の plan の path を読む entry は後ろ、多くの entry から読まれる path を持つ plan は先。
   - `references/tasks.md` にサブエージェントへ渡す文があると 1 行書く。
   - frontmatter の description と冒頭を、調べることを含む形にする。

3. `.pi/skills/design/references/format.md`:
   - 冒頭に `## Possibly related files` の節を足す。entry ごとに `### NN: <entry の問い>` を置き、その下に path の一覧を書く。
   - 重複を消さないことと、path は事実であって決定ではないことを書く。
   - ファイルの話を plan へ送っている 1 行を書き換える。path はここが持ち、file の存在と形は plan が決める。

### Verify:

- read: `review` サブエージェントが `.pi/skills/design/SKILL.md`、`.pi/skills/design/references/format.md`、`.pi/skills/design/references/tasks.md` を読み、次の各ケースを報告する
  - (happy) `SKILL.md` の手順を読む → 調査のステージがあり、accepted の entry ごとに並行で `research` を走らせると書かれている
  - (happy) `SKILL.md` の手順を読む → 結果を design.md の冒頭の `## Possibly related files` に書くと書かれている
  - (happy) `SKILL.md` の切る段を読む → 同じ path を持つ entry は同じ plan の候補、他の plan の path を読む entry は後ろ、多くの entry から読まれる path を持つ plan は先、と書かれている
  - (happy) `SKILL.md` を読む → `references/tasks.md` に渡す文があると書かれている
  - (happy) `SKILL.md` の description と冒頭を読む → どちらも調べることを含む
  - (happy) `tasks.md` を読む → 問いは accepted の entry ごとで、Unit を跨いで関連する path を挙げさせると書かれている
  - (happy) `tasks.md` を読む → 読む物、結果を読む物、検査する物、生成物、文書の 5 つの組が書かれている
  - (happy) `tasks.md` を読む → 今存在する path だけを、path と理由の組で返させると書かれている
  - (happy) `tasks.md` を読む → 重複を消させないと書かれている
  - (happy) `tasks.md` を読む → 事実だけを返させ、決定を書かせないと書かれている
  - (happy) `tasks.md` の形を読む → 前書きと、節ごとの囲みと、その下の箇条になっている
  - (happy) `format.md` の冒頭の `## Possibly related files` を読む → entry ごとに `### NN: <entry の問い>` と path の一覧を書くと書かれている
  - (happy) `format.md` を読む → 重複を消さないことと、path は事実であって決定ではないことが書かれている
  - (empty) `format.md` の他の節を読む → 既存の節（`## Cut`、`## No`、`## Scope`、`## Boundary`、`## Writing`）が消えずに残っている
  - (error) `format.md` のファイルの話を読む → ファイルはここでは分からないと書いておらず、path はここが持ち、file の存在と形は plan が決めると書かれている
  - _no case_: 文面の読みやすさ — 読む者の判断であり、機械では決まらない

## 2.`## Refactor` の文を消す

### Types

なし

### Steps

1. `.pi/skills/design/SKILL.md`:
   - plan から戻る段を消す。plan を書く中で見つかった共有物を design へ戻す道が、無くなる。

2. `.pi/skills/design/references/format.md`:
   - 設計書の先頭に置く `## Refactor` の定義を消す。

### Verify:

- read: `review` サブエージェントが `.pi/skills/design/SKILL.md` と `.pi/skills/design/references/format.md` を読み、次の各ケースを報告する
  - (happy) 2 ファイルを読む → `## Refactor` の語が無い
  - (happy) `SKILL.md` の手順を読む → plan から design へ戻る段が無い
  - (empty) `format.md` の設計書の形を読む → 先頭が `## Possibly related files` で、節の並びが変わっていない
  - _no case_: `.pi/skills/plan/SKILL.md` の書き戻しの段 — `plan-rules` が消す
  - _no case_: `.pi/skills/close/scripts/collect.mjs` のコメント — `close-words` が直す

## 3.統合: design が調べて切る手順になっていること

### Types

なし

### Steps

1. `.pi/skills/design/SKILL.md`:
   - 手順の全体を通して読み、`references/format.md` と `references/tasks.md` の 2 つを名指していることを確かめる。
   - 節の番号と、本文からの参照を揃える。

### Verify:

- look: owner が `.pi/skills/design/` と `git status --short .pi/skills/design/` と `git diff <base hash> .pi/skills/design/` を読み、答える
  - (happy) owner が手順を読む → accepted の entry ごとにリサーチを走らせ、`## Possibly related files` から plan を切る、と読める
  - (happy) owner が `SKILL.md` を読む → plan から戻る話が無い
  - (empty) `git status` と `git diff` を見る → 新しい `references/tasks.md` と、`SKILL.md` と `references/format.md` の変更だけで、他のファイルが動いていない
  - (error) 手順の参照を照らす → `references/` の 2 つの名前が実在し、番号が続いている
  - _no case_: 次のサイクルで使いやすいか — 次のサイクルで分かる

## Notes

### Slice 1: 調査のステージを足す

- Findings: なし
- Unplanned: `## What is not here` の行を「files the plan changes」に直した。path を design が持つようになり、plan が決める file と同じ物に読めたため。
- Commit: f70c123

### Slice 2: `## Refactor` の文を消す

- Findings: なし
- Unplanned: なし
- Commit: d77f47d

### Slice 3: 統合: design が調べて切る手順になっていること

- Findings: なし
- Unplanned: なし
- Commit: なし（読み直しだけで、ファイルは動いていない）

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
