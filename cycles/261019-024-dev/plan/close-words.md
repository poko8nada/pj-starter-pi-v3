# PLAN `close-words`

## Files

```text
.pi/
  skills/
    close/
      SKILL.md                update
      references/
        format.md             update
      scripts/
        collect.mjs           update
```

## Slices

## 1.`criteria` を 4 つに置き換える

### Types

なし

### Steps

1. `.pi/skills/close/SKILL.md`:
   - `criteria` の語を消す。leftover が close に来た時点で、それが criteria かどうかを判定する必要は無くする。
   - 代わりに、4 つに当てはまる leftover は `ex-` を検討すると書く。矛盾、穴、壊れている、古いまま。
   - 既存の規則は残す。`DEFINITION.md` の 1 行を動かす leftover は `ex-` にできず `proposed` に行く。`dropped` は稀で、直す方が重い時。

2. `.pi/skills/close/references/format.md`:
   - `criteria` の語を消し、同じ 4 つを書く。

### Verify:

- read: `review` サブエージェントが `.pi/skills/close/SKILL.md` と `.pi/skills/close/references/format.md` を読み、次の各ケースを報告する
  - (happy) `SKILL.md` の Close の手順を読む → `criteria` の語が無い
  - (happy) `SKILL.md` を読む → a contradiction、a hole、something broken、something left stale の 4 つが並んでいる
  - (happy) `SKILL.md` を読む → 4 つに当てはまる leftover は `ex-` を検討すると書かれている
  - (happy) `SKILL.md` を読む → `DEFINITION.md` の 1 行を動かす leftover は `proposed` に行くと残っている
  - (happy) `SKILL.md` を読む → `dropped` の条件が残っている
  - (happy) `references/format.md` を読む → `criteria` の語が無く、同じ 4 つ（a contradiction、a hole、something broken、something left stale）が書かれている
  - (error) 2 つを読む → 4 つのどれにも当てはまらない leftover を `ex-` にすると書いていない
  - _no case_: 文面の読みやすさ — 読む者の判断であり、機械では決まらない

## 2.`## Refactor` のコメントを直す

### Types

なし

### Steps

1. `.pi/skills/close/scripts/collect.mjs`:
   - plan の節のコメントの例から `## Refactor` を外す。
   - backtick の無い `##` は plan ではない、という説明は残す。

### Verify:

- read: `review` サブエージェントが `.pi/skills/close/scripts/collect.mjs` を読み、次の各ケースを報告する
  - (happy) 2 つのコメントを読む → `Refactor` の語が無い
  - (happy) 2 つのコメントを読む → backtick の無い `##` は plan ではない、という説明が残っている
  - (empty) コメントとコードを照らす → `PLAN_HEAD` は backtick 付きの `##` だけを拾い、判定の行がコメントの前後で変わっていない
  - _no case_: 実行そのもの — このスライスはコメントだけを変え、判定の行に触らない

## 3.統合: close が leftover を 4 つで裁く形になっていること

### Types

なし

### Steps

1. `.pi/skills/close/SKILL.md`:
   - 手順の全体を通して読み、`references/format.md` と `scripts/collect.mjs` の 2 つを名指していることを確かめる。
   - 節の番号と、本文からの参照を揃える。

### Verify:

- look: owner が `git diff <base hash> .pi/skills/close/` と `.pi/skills/close/SKILL.md` を読み、答える
  - (happy) owner が手順を読む → leftover を 4 つで見て `ex-` を検討すると読める
  - (empty) `git diff .pi/skills/close/scripts/collect.mjs` を見る → コメントだけが動いている
  - (happy) 節の番号を照らす → 番号が続いていて、飛びが無い
  - (error) 本文からの参照を照らす → `references/` と `scripts/` の名前が実在し、参照が指す番号が実在する
  - _no case_: 次のサイクルで使いやすいか — 次のサイクルで分かる

## Notes

### Slice 1: `criteria` を 4 つに置き換える

- Findings:
- Unplanned:
- Commit:

### Slice 2: `## Refactor` のコメントを直す

- Findings:
- Unplanned:
- Commit:

### Slice 3: 統合: close が leftover を 4 つで裁く形になっていること

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
