# PLAN `plan-rules`

## Files

```text
.pi/
  skills/
    plan/
      SKILL.md                update
      references/
        format.md             update
```

## Slices

## 1.規則と書き戻しを消す

### Types

なし

### Steps

1. `.pi/skills/plan/SKILL.md`:
   - 手順 2 の「the project's rules に合わないファイルは、その plan で直す」の 1 文を消す。
   - 書き戻しの段を消す。
   - 手順の番号を詰め、本文からの参照を合わせる。

2. `.pi/skills/plan/references/format.md`:
   - `Files` のセクションの「the project's rules に合わないファイルは、同じ plan で直す」の 1 文を消す。
   - 同じ規則を持つ `verify` の行が他に無いか見て、あれば同じく消す。

### Verify:

- read: `review` サブエージェントが `.pi/skills/plan/SKILL.md` と `.pi/skills/plan/references/format.md` を読み、次の各ケースを報告する
  - (happy) `.pi/skills/plan/SKILL.md` の手順 2 を読む → the project's rules の話が無い
  - (happy) `.pi/skills/plan/SKILL.md` の手順を読む → 番号が 1 から続いていて、本文からの参照もその番号を指している
  - (happy) `.pi/skills/plan/SKILL.md` の手順を読む → design へ書き戻す段が無い
  - (happy) `.pi/skills/plan/references/format.md` に目を通す → the project's rules の話が、`Files` のセクションにも他のセクションにも無い
  - (error) `.pi/skills/plan/SKILL.md` に目を通す → `Refactor` の語が無い
  - (empty) `.pi/skills/plan/references/format.md` の `Files` を読む → file に marker を付ける話と、関係を歩く話と、double と fixture の行が残っている
  - _no case_: 読みやすさ — 読む者の判断であり、機械では決まらない
  - _no case_: walk の各行（分岐、optional、状態、境界値、不正な入力、権限、2 回目、同時実行）— `Types` が なし なので、ケースの出所は `Steps` の規則である

## 2.統合: plan が自分の plan だけを見る手順になっていること

### Types

なし

### Steps

1. `.pi/skills/plan/SKILL.md`:
   - 手順の全体を通して読み、`references/format.md` と `references/tasks.md` の 2 つを名指していることを確かめる。
   - セクションの番号と、本文からの参照を揃える。

### Verify:

- look: owner が `git diff <base hash> .pi/skills/plan/` を読み、答える
  - (happy) owner が手順を読む → 構造を決める話が無く、自分の plan の file を決めると読める
  - (happy) owner が `.pi/skills/plan/SKILL.md` を読む → `references/format.md` と `references/tasks.md` を名指し、番号と参照が揃っている
  - (boundary values) `git diff <base hash> .pi/skills/plan/` を見る → 消えた行（規則と書き戻し）と、番号と参照の付け替えの行だけで、他のセクションが動いていない
  - (error) 手順の参照を照らす → 番号が続き、参照が指す番号が実在し、`references/` の 2 つの名前が実在する
  - _no case_: 次のサイクルで使いやすいか — 次のサイクルで分かる

## Notes

### Slice 1: 規則と書き戻しを消す

- Findings: なし
- Unplanned: 手順 8 の「組が見つかった時」に、新しい行き先を 1 文だけ書いた。書き戻しの 3 手順を消すと、そこで何をするかが宙に浮くため。番号の付け替えは要らなかった（手順 8 は残る）。
- Commit: 39dcb44

### Slice 2: 統合: plan が自分の plan だけを見る手順になっていること

- Findings: なし
- Unplanned: なし
- Commit: なし（読み直しだけで、ファイルは動いていない）

## Review

### Round 1

- Stale: なし — `.pi/skills/plan/SKILL.md:23-25` と `.pi/skills/plan/references/format.md:76-80` に `project's rules` 無し、`.pi/skills/design/SKILL.md:18-51` に書き戻し・`Refactor` 無し、`README.md:63` の plan 行に規則の話無し。`.pi/skills/close/scripts/collect.mjs:20,226` の `Refactor` 残存は `cycles/261019-024-dev/plan/close-words.md:46-64` が直す前提のため指摘にしなかった。
- Unlisted: なし — `cycles/261019-024-dev/plan/plan-rules.md:5-12` の Files 2 件と `.pi/skills/plan/SKILL.md` ・ `.pi/skills/plan/references/format.md` の現行内容が対応し、`.pi/skills/plan/references/tasks.md:1-8` に `Refactor` ・ `project's rules` 無く変更の痕跡が無い。
- Gaps: なし — slice 1 の Steps（`cycles/261019-024-dev/plan/plan-rules.md:24-31`）各行に対応する case が Verify（`cycles/261019-024-dev/plan/plan-rules.md:35-43`）にあり、slice 2 も Steps（`cycles/261019-024-dev/plan/plan-rules.md:53-55`）に対応する case が Verify（`cycles/261019-024-dev/plan/plan-rules.md:59-64`）にある。slice 2 は `look` のため対象外とした。
- Unproven: なし — slice 1 の各 `read` は named した振る舞いを戻すと赤になる読みであることを確かめた（例：`.pi/skills/plan/SKILL.md:23-25` に規則文を戻すと happy が赤、`.pi/skills/plan/SKILL.md:54-57` に書き戻しを戻すと happy が赤、`.pi/skills/plan/references/format.md:76-80` に規則文を戻すと happy が赤、`Refactor` を戻すと error が赤）。
- Doubts:
  - `cycles/261019-024-dev/plan/plan-rules.md:71` の Unplanned 1 文（`.pi/skills/plan/SKILL.md:57` の `Boundary.Plans` に命名の行）に対応する Verify の case が無いが Notes に記録のため Gaps にしなかった。
  - `git diff a340e03..HEAD -- .pi/skills/plan cycles/261019-024-dev/plan/plan-rules.md` は subagent-guard で bash が不許可のため実行できず、boundary-values ・ Unlisted は現行ファイルの読み（`.pi/skills/plan/SKILL.md:1-69` ・ `.pi/skills/plan/references/format.md:1-80` ・ `.pi/skills/plan/references/tasks.md:1-8`）で代替した。

## Acceptance

- Ran: slice 1 の `read`（6 ケース、1 回）、slice 2 の `look`（オーナー）、`pnpm typecheck`（root: ok、`.pi`: ok）、`pnpm test:run`（41 files、704 tests）である。壊して確かめたのは 2 つで、規則の 1 文と手順 8 の書き戻しを戻すと、どちらも赤になって戻した。
- Findings: なし。review の Round 1 は 4 つの観点とも なし で、そこでレビューは終わった。
- Doubts: review のサブエージェントは bash を許されておらず、`git diff <base hash>..HEAD` を自分で走らせられない。手順 5 の「plan md と diff を渡す」は、diff の中身をタスクに載せることを指すと読むべきである。
