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

- Findings: なし
- Unplanned: 検査のケースが 4 つを日本語で求めていたが、skill の本文は英語なので赤になった。ケースを英語の 4 語に直した（plan md を合わせて編集。owner の決定）。
- Commit: 067f908

### Slice 2: `## Refactor` のコメントを直す

- Findings: なし
- Unplanned: なし
- Commit: 274f3c4

### Slice 3: 統合: close が leftover を 4 つで裁く形になっていること

- Findings: なし
- Unplanned: なし
- Commit: なし（読み直しだけで、ファイルは動いていない）

## Review

### Round 1

- Stale: なし — `.pi/skills/close/SKILL.md:29,42,44` と `.pi/skills/close/references/format.md:41` に `criteria` 無し、`.pi/skills/close/scripts/collect.mjs:20,226` に `Refactor` 無し。`README.md:65` の close 行は汎用文言で古びず、他に古くした doc/comment/test はない。
- Unlisted: なし — 差分は `cycles/261019-024-dev/plan/close-words.md:5-14` の Files が名指す 3 件だけで、`.pi/skills/close/SKILL.md`・`.pi/skills/close/references/format.md`・`.pi/skills/close/scripts/collect.mjs` の現行内容と対応し、名指し外の変更はない。
- Gaps: なし — slice 1 の Steps（`cycles/261019-024-dev/plan/close-words.md:26-32`）各行に対応する case が Verify（`cycles/261019-024-dev/plan/close-words.md:36-44`）にあり、slice 2 も Steps（`cycles/261019-024-dev/plan/close-words.md:54-56`）に対応する case が Verify（`cycles/261019-024-dev/plan/close-words.md:60-64`）にある。slice 3 は `look`（`cycles/261019-024-dev/plan/close-words.md:80-85`）のため対象外とした。
- Unproven: なし — slice 1・2 の各 `read` は名指した振る舞いを戻すと赤になる読みであることを確かめた（例：`.pi/skills/close/SKILL.md:42` の 4 つを外すと happy が赤、`.pi/skills/close/SKILL.md:44`・`.pi/skills/close/references/format.md:41` に `criteria` を戻すと happy/error が赤、`.pi/skills/close/scripts/collect.mjs:20,226` に `Refactor` を戻すと happy が赤）。全スライス `Types: なし`（`cycles/261019-024-dev/plan/close-words.md:20,48,68`）のため自動テストなし。
- Doubts:
  - `.pi/skills/close/SKILL.md:29` 後段の追加句（`and the plan mds hold what they left`）は Steps の文言にないが Files が `update` と名指した内の詳述であり slice 3 の `look` が覆うため Unlisted/Gaps にしない。
  - `.pi/skills/close/SKILL.md:44` の `those four` は直前行の 4 つを指す読みで、文面の読みやすさは `_no case_`（`cycles/261019-024-dev/plan/close-words.md:44`）のため指摘にしない。

## Acceptance

- Ran: slice 1 の `read`（7 ケース、2 回。1 回目はケースの言葉の誤りで 2 件が赤、ケースを直して再実行）、slice 2 の `read`（3 ケース、1 回）、slice 3 の `look`（オーナー）、`pnpm typecheck`（root: ok、`.pi`: ok）、`pnpm test:run`（41 files、704 tests）である。壊して確かめたのは 2 つで、`SKILL.md:42` の 4 つの文を消すとケース 38 が赤、`collect.mjs:20` のコメントに `Refactor` を戻すとケースが赤になって戻した。
- Findings: なし。review の Round 1 は 4 観点とも なし で、そこでレビューは終わった。
- Doubts: 壊し確認の 1 回目で、4 つの文を消した時にケース 39（「4 つに当てはまる leftover は `ex-` を検討」）は緑のままだった。ケース 38 が同じ 4 語を見ているので、ケース 39 は単独では弱い。
