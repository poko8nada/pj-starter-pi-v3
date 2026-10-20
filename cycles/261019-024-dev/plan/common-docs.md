# PLAN `common-docs`

## Files

```text
DEFINITION.md               update
README.md                   update
README.ja.md                update
```

## Slices

## 1.定義の行と一覧を、このサイクルの変更に合わせる

### Types

なし

### Steps

1. `DEFINITION.md`:
   - `design-skill` の行を、ADR 024 の 01 の `Definition Change` の文にする。
   - `yolo-skill` の行を、ADR 024 の 06 の `Definition Change` の文で足す。並びは既存の行に合わせる。

2. `README.md`:
   - skill の一覧を 8 つにし、`yolo` の 1 行を足す。既存の行と同じ形にする。
   - `design` の行を、サイクルを切る材料を調べる形に直す。
   - `plan` の行から、規則の話を外す。`work` の行に、テストの整理と、マージの後の依存揃えを足す。
   - `close` の行を、4 つで裁く形に直す。サイクルの節の close の記述も合わせる。

3. `README.ja.md`:
   - 同じ 3 つを、日本語側で行う。数と並びを `README.md` と揃える。

### Verify:

- read: `review` サブエージェントが `DEFINITION.md`、`README.md`、`README.ja.md` を読み、次の各ケースを報告する
  - (happy) `DEFINITION.md` の `design-skill` の行を読む → ADR 024 の 01 の `Definition Change` の「`Unit.design-skill`(updated):」の後ろの文が、そのまま行の本文になっている
  - (happy) `DEFINITION.md` の `yolo-skill` の行を読む → ADR 024 の 06 の `Definition Change` の後ろの文が、そのまま行の本文になっている
  - (happy) `DEFINITION.md` を読む → `yolo-skill` の行が、既存の行と同じ形（`- <名前>: <Who>が…`）で並んでいる
  - (happy) `README.md` の一覧を読む → 8 つで、`yolo` の行が既存の行と同じ形である
  - (happy) `README.md` の design の行を読む → 材料を調べ、切り方と、どこで走らせるかを決めると書かれている
  - (happy) `README.md` の plan の行を読む → 規則（the project's rules）の話が無い
  - (happy) `README.md` の work の行を読む → テストの整理と、マージの後の依存揃えが書かれている
  - (happy) `README.md` の close の行とサイクルの節を読む → leftover を 4 つで見て `ex-` を検討すると書かれている
  - (happy) `README.ja.md` の各行を読む → `README.md` の同じ行と同じ内容である
  - (boundary values) `README.md:12` と `README.ja.md:12` を照らす → 数が 8 で、並びが `DEFINITION.md` の行の並びと同じである
  - (error) `yolo-skill` の行を `definition/rules.md` と照らす → `Who` の側から読め、2 語の名前の行になっている
  - _no case_: 文面の読みやすさ — 読む者の判断であり、機械では決まらない

## 2.統合: 定義と README が、8 つのスキルとこのサイクルの変更を写していること

### Types

なし

### Steps

1. `README.md`:
   - 一覧の並びを `DEFINITION.md` の行の並びと同じにし、名前を揃える。

2. `README.ja.md`:
   - 一覧の並びと名前を、`README.md` と揃える。

### Verify:

- look: owner が `git diff <base hash> DEFINITION.md README.md README.ja.md` を読み、答える
  - (happy) owner が一覧を読む → 8 つの名前が `.pi/skills/` の 8 つと一致し、並びが `DEFINITION.md` の行の並びと同じである
  - (empty) `git diff DEFINITION.md` を見る → 増えた 1 行と、書き換わった 1 行だけで、他が動いていない
  - (boundary values) `git diff README.md` を見る → 数が 8 になり、`yolo` の行が増え、design、plan、work、close の行が動いている
  - (boundary values) `git diff README.ja.md` を見る → 同じ数と並びで、`README.md` と同じ行が動いている
  - (error) `git diff` と `.pi/skills/` を照らす → このサイクルで動いた 5 つ（design、plan、work、close、yolo）の行が漏れていない
  - _no case_: 次のサイクルで読めるか — 次のサイクルで分かる

## Notes

### Slice 1: 定義の行と一覧を、このサイクルの変更に合わせる

- Findings: なし
- Unplanned: 検査で 2 件赤になった。(1) `DEFINITION.md` の `yolo-skill` の行が ADR の文と 1 字違い（ADR 側にだけ文末の `。`）だったので、`DEFINITION.md` の他の行に `。` が無いことに合わせて ADR の `。` を取った。(2) `README.md` の close の行に `ex-` の語が無かったので入れた（日本語側も）。
- Commit: 58f21c7

### Slice 2: 統合: 定義と README が、8 つのスキルとこのサイクルの変更を写していること

- Findings: なし
- Unplanned: なし
- Commit: なし（読み直しだけで、ファイルは動いていない）

## Review

### Round 1

- Stale: なし — 現行に古く残る物はない。7/7つ・旧 design/work/close 文言・`the project's rules`・`Refactor`・`criteria` は live に無く、archive と `cycles/261019-024-dev/adr.md:31,187` の引用は記録である。`README.md:12`・`README.ja.md:12` の 8 つは `.pi/skills/yolo/SKILL.md:1-5` を含む 8 つと一致し、`DEFINITION.md:38,42` は `cycles/261019-024-dev/adr.md:39,193` と一致する。`work/SKILL.md:3` の description 省略は `cycles/261019-024-dev/plan/work-steps.md:127` の決定値、`README.md:65` の旧汎用文言は `cycles/261019-024-dev/plan/close-words.md:111` の決定値、`AGENTS.md:3` の段列挙は yolo を段にしない決定値のため数えない。
- Unlisted: なし — 差分は `cycles/261019-024-dev/plan/common-docs.md:5-9` の Files が名指す 3 件だけである。`DEFINITION.md:38` の書き換え 1 行と `:42` の増え 1 行、`README.md:12,62,64-66` と `README.ja.md:12,62,64-66` の数・yolo 増・design/work/close の書き換えだけで、他が動いていない。`README.md:63`・`README.ja.md:63` の plan 行が静かなのは base が既に規則無し（`cycles/261019-024-dev/plan/plan-rules.md:84`）のためで、名指し外の変更はない。
- Gaps: なし — slice 1 の Steps（`cycles/261019-024-dev/plan/common-docs.md:21-32`）各行に対応する case が Verify（`:36-47`）にある（design 行→:37、yolo 行→:38、形→:39、一覧 8→:40、design→:41、plan 規則無し→:42、work→:43、close 4 と `ex-`→:44、日英一致→:45、数と並び→:46、`Who` と 2 語→:47）。slice 2 は `look`（`:66-71`）のため指示通り対象外とした。
- Unproven: なし — slice 1 の各 `read` は名指した振る舞いを外すと赤になる読みである。`DEFINITION.md:38` を旧文言に戻すと `:37` が赤、`DEFINITION.md:42` の形崩し→`:38-39` が赤、`README.md:65` から `ex-` を落とすと `:44` が赤になることは `cycles/261019-024-dev/plan/common-docs.md:79` が記録する。`README.md:63` に規則を戻すと `:42` が赤、`README.md:12` を 7 に戻すと `:40,46` が赤になる。全スライス `Types: なし` のため自動テストなし。slice 2 は `look` のため対象外とした。
- Doubts:
  - `cycles/261019-024-dev/adr.md:193` の文末`。`を `DEFINITION.md:42` に合わせて取ったことは `cycles/261019-024-dev/plan/common-docs.md:79` に記録済みで、意味は変わらず現行の両者は一致するため finding にしない。
  - `README.md:63`・`README.ja.md:63` が差分で動かないのは base が既に規則の話無しで Steps の「規則を外す」が空振りになったため。`cycles/261019-024-dev/plan/plan-rules.md:84` が同行の規則無しを確認し、Verify の `:42` は現行を読むため緑になる。finding にしない。

## Acceptance

- Ran: slice 1 の `read`（11 ケース、2 回。1 回目は 2 件が赤、直して再実行）、slice 2 の `look`（オーナー）、`pnpm typecheck`（root: ok、`.pi`: ok）、`pnpm test:run`（41 files、704 tests）である。壊して確かめたのは 2 つで、`README.md:12` を 7 に戻すと赤、`DEFINITION.md` から `yolo-skill` の行を落とすと赤になって戻した。
- Findings: なし。review の Round 1 は 4 観点とも なし で、そこでレビューは終わった。
- Doubts: なし。
