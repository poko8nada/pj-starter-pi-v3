# PLAN `yolo-skill`

## Files

```text
.pi/
  skills/
    yolo/
      SKILL.md                add
```

## Slices

## 1.yolo のスキルを書く

### Types

なし

### Steps

1. `.pi/skills/yolo/SKILL.md`:
   - frontmatter に `name: yolo` と description を書き、`disable-model-invocation: true` を置く。
   - description を、owner が自分で起こすと書いた形にする。
   - 冒頭に、オーナーの確認を飛ばして 1 サイクルを走り切るスキルであることと、ADR が全部 accepted になった後でだけ発動すると書く。
   - accepted の前に起こされた時は無効であること、何もせず止まってそう言うことを書く。
   - 1 サイクルの流れを、design、plan、work、close の 4 つの段で書く。各段で何をするかを、その段の手順をたどれる形で書く。
   - 各段で飛ばす確認を名指す。design の `## Possibly related files` をオーナーに見せる段、plan の plan md をオーナーに見せる段、work の acceptance、close のトリアージのオーナー判断。
   - オーナーの判断が要る所（不測の事態、4 つのどれにも当てはまらない leftover）では、止まって報告し、指示を仰ぐと書く。
   - 他のスキルを参照しないと書く。飛ばす確認を知っているのはこのスキルだけである。
   - このハーネスの開発にだけある名前（`intent-router`、`quality-gate`、`consult`、`sound-notify`、`lefthook`、`oxlint`、`oxfmt`、`tsc`、`vitest` など）を書かない。

### Verify:

- read: `review` サブエージェントが `.pi/skills/yolo/SKILL.md` を読み、次の各ケースを報告する
  - (happy) frontmatter を読む → `name: yolo` で、`disable-model-invocation: true` がある
  - (happy) description を読む → オーナーが起こす形で、任意のタイミングであることと、close のトリアージで止まることが書かれている
  - (happy) 冒頭を読む → 確認を飛ばして 1 サイクルを走り切ると書かれている
  - (happy) `## When it runs` を読む → 任意のタイミング（any time after every entry of the ADR is accepted）と書かれている
  - (happy) `## When it runs` を読む → 済んだ段は歩き直さない（walks from where the cycle stands）と書かれている
  - (empty) `## When it runs` を読む → ADR の前は無効で、何も走らないと書かれている
  - (happy) `## When it runs` を読む → ADR の entry を accepted にも検査にもしないと書かれている
  - (happy) 手順を読む → design、plan、work、close の 4 つの段が並んでいる
  - (happy) 各段を読む → その段が飛ばす確認が、その段の下に書かれている（design の段に design の確認がある）
  - (happy) 飛ばす確認を読む → 4 つの名前（`## Possibly related files` を見せる段、plan md を見せる段、acceptance、トリアージのオーナー判断）が並んでいる
  - (happy) close の段を読む → そこで終わると書かれ、判断の後の仕事はこのスキルの仕事ではないと書かれている
  - (happy) `## When it stops early` を読む → 止まるのは agent の仕事と書かれ、3 つの条件が並んでいる
  - (happy) `## When it stops early` を読む → `Unplanned` は止まる条件ではないと書かれている
  - (happy) 読む → 他のスキルを参照していない
  - (error) 本文に目を通す → このハーネスの開発にだけある名前が出てこない
  - _no case_: 実際に走らせた時の止まり方 — 次に使うサイクルで分かる

## 2.統合: yolo が 1 サイクルを 1 つで走り切れるスキルになっていること

### Types

なし

### Steps

1. `.pi/skills/yolo/SKILL.md`:
   - 4 つの段の名前と、各段で名指す確認の名前を、他のスキルの手順の節の名前と突き合わせて揃える。
   - 段の順番を、`AGENTS.md` の cycle の順序と揃える。

### Verify:

- look: owner が `git status --short .pi/skills/yolo/` と `git diff <base hash> .pi/skills/yolo/` と `.pi/skills/yolo/SKILL.md` を読み、答える
  - (happy) owner が本文を読む → design、plan、work、close の 4 つの段があり、飛ばす確認が 4 つ名指され、止まる所が書かれている
  - (happy) owner が段の名前を他のスキルの `SKILL.md` と照らす → 4 つの段の名前が、それぞれのスキルの手順の節の名前と一致している
  - (happy) owner が段の順番を `AGENTS.md` と照らす → design、plan、work、close の順で一致している
  - (happy) owner が各段を読む → 飛ばす確認の名前が、他のスキルの手順の節と一致している
  - (empty) `git status .pi/skills/yolo/` を見る → 足したのは 1 ファイルだけ
  - (error) frontmatter を pi の skills の資料（`disable-model-invocation`）と照らす → エージェントからは起こせず、オーナーの明示でだけ発火する書き方になっている
  - _no case_: 次のサイクルで使いやすいか — 次のサイクルで分かる

## Notes

### Slice 1: yolo のスキルを書く

- Findings:
- Unplanned:
- Commit:

### Slice 2: 統合: yolo が 1 サイクルを 1 つで走り切れるスキルになっていること

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
