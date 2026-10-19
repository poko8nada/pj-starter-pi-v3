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

- Findings:
- Unplanned:
- Commit:

### Slice 2: 統合: 定義と README が、8 つのスキルとこのサイクルの変更を写していること

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
