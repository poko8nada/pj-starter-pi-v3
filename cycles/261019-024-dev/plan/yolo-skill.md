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
   - 4 つの段の名前と、各段で名指す確認の名前を、他のスキルの手順のセクションの名前と突き合わせて揃える。
   - 段の順番を、`AGENTS.md` の cycle の順序と揃える。

### Verify:

- look: owner が `git status --short .pi/skills/yolo/` と `git diff <base hash> .pi/skills/yolo/` と `.pi/skills/yolo/SKILL.md` を読み、答える
  - (happy) owner が本文を読む → design、plan、work、close の 4 つの段があり、飛ばす確認が 4 つ名指され、止まる所が書かれている
  - (happy) owner が段の名前を他のスキルの `SKILL.md` と照らす → 4 つの段の名前が、それぞれのスキルの手順のセクションの名前と一致している
  - (happy) owner が段の順番を `AGENTS.md` と照らす → design、plan、work、close の順で一致している
  - (happy) owner が各段を読む → 飛ばす確認の名前が、他のスキルの手順のセクションと一致している
  - (empty) `git status .pi/skills/yolo/` を見る → 足したのは 1 ファイルだけ
  - (error) frontmatter を pi の skills の資料（`disable-model-invocation`）と照らす → エージェントからは起こせず、オーナーの明示でだけ発火する書き方になっている
  - _no case_: 次のサイクルで使いやすいか — 次のサイクルで分かる

## Notes

### Slice 1: yolo のスキルを書く

- Findings: なし
- Unplanned: 本文を owner の指摘で何度か書き直した。close の段がオーナー判断の後まで含んでいた、`## When it runs` が ADR を検査して accepted にするように読めた、description が「任意のタイミング」と「済んだ段」を写していなかった、`## When it stops early` が抽象的で `Unplanned` との違いが無かった。最後は owner が書き直した。検査のケースも本文に合わせて 15 個にした。
- Commit: caa6106

### Slice 2: 統合: yolo が 1 サイクルを 1 つで走り切れるスキルになっていること

- Findings: なし
- Unplanned: なし
- Commit: なし（読み直しだけで、ファイルは動いていない）

## Review

### Round 1

- Stale: なし — 差分は `.pi/skills/yolo/SKILL.md:1-65` の add 1 件だけで `cycles/261019-024-dev/plan/yolo-skill.md:5-10` の Files と一致する。`README.md:12` の seven skills と `DEFINITION.md:35-41` の yolo 無しは古くなるが `cycles/261019-024-dev/plan/common-docs.md:23,26` が 8 つ・yolo 行を直す前提のため本 change の stale に数えない。他に古くした doc/comment/test はない。
- Unlisted: なし — 差分は `cycles/261019-024-dev/plan/yolo-skill.md:5-10` が名指す `.pi/skills/yolo/SKILL.md` の add だけで、名指し外の変更はない。
- Gaps: なし — slice 1 の Steps（`cycles/261019-024-dev/plan/yolo-skill.md:22-31`）各行に対応する case が Verify（`cycles/261019-024-dev/plan/yolo-skill.md:35-51`）にある（frontmatter→:36、description→:37、冒頭→:38、any time→:39、walks from→:40、invalid→:41、ADR 不干渉→:42、4 段→:43、skips 位置→:44、4 名→:45、close 終わり→:46、停止 3→:47、Unplanned→:48、他スキル参照無し→:49、harness 名無し→:50）。slice 2 は `look`（`cycles/261019-024-dev/plan/yolo-skill.md:67-73`）のため指示通り対象外とした。
- Unproven: なし — slice 1 の各 `read` は名指した振る舞いを外すと赤になる読みであることを確かめた（例：`.pi/skills/yolo/SKILL.md:2` の name 外し・`:4` の disable 外し→:36 が赤、`:26` の `## Possibly related files` 外し・`:33` の plan mds 外し・`:40` の acceptance 外し・`:47` の triage judgement 外し→:45 が赤、`vitest` 戻し→:50 が赤）。全スライス `Types: なし`（`cycles/261019-024-dev/plan/yolo-skill.md:16,55`）のため自動テストなし。slice 2 は `look` のため対象外とした。
- Doubts:
  - `.pi/skills/yolo/SKILL.md:9` の冒頭に ADR accepted 後発動が無いが、`description:3` と `:13` が持つため finding にしない。Steps（`cycles/261019-024-dev/plan/yolo-skill.md:25`）の位置指定だが意味は覆われる。
  - `.pi/skills/yolo/SKILL.md:14` の `and it says so` は case（`cycles/261019-024-dev/plan/yolo-skill.md:41`）文言に明示が無いが、product は持ち、case は bullet 全体を読むため Gaps/Unproven にしない。
  - `.pi/skills/yolo/SKILL.md:40` の `their OK after each slice of a plan that runs in the base` は Steps（`cycles/261019-024-dev/plan/yolo-skill.md:28`）の 4 名に無いが、`.pi/skills/work/SKILL.md:46` の詳述であり Files が `add` と名指した内の詳述＋`look`（`cycles/261019-024-dev/plan/yolo-skill.md:71`）が覆うため Unlisted/Gaps にしない。
  - `.pi/skills/yolo/SKILL.md:46` の destinations は `DEFINITION.md` 1 行→`proposed`（`.pi/skills/close/SKILL.md:47`）と research（`.pi/skills/close/SKILL.md:48`）を省くが、plan が求めず close 決定値のため指摘にしない。
  - `.pi/skills/yolo/SKILL.md:20` の `Each keeps its work, and loses only its look` と `:24-25,31-32,38-39,45-46` の作業詳述に単独 read case は無いが、yolo 概念自体（ADR 06 決定値）＋`look`（`cycles/261019-024-dev/plan/yolo-skill.md:68`）が本文を読むため対象外とした。

## Acceptance

- Ran: slice 1 の `read`（15 ケース、1 回）、slice 2 の `look`（オーナー）、`pnpm typecheck`（root: ok、`.pi`: ok）、`pnpm test:run`（41 files、704 tests）である。壊して確かめたのは 2 つで、`disable-model-invocation: true` を落とすと赤、close の「it ends here」の箇条と段落の両方を落とすと赤になって戻した。
- Findings: なし。review の Round 1 は 4 観点とも なし で、そこでレビューは終わった。
- Doubts: close の「そこで終わる」は、箇条だけ落としても段落が意味を担ってケースは緑のままだった。両方落とすと赤になる。同じ意味の文が 2 つ並んでいる。
