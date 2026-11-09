# PLAN `plan-work`

- No: 02, 03, 04
- Place: worktree
- Boundary Plans: なし

## Goal

plan が ADR の `Add`/`Update`/`Drop` を affected のファイル群に当てる手順とスライスごとの `Policy` を持ち、work がその `Goal`/`Policy` に従い、受入とマージの間にオーナー確認を持つようになる。

## Design

- Inside:
  - Modules: なし。plan/work/close/yolo の 8 ファイルは 1 つずつで、統合も分割もしない。
  - Dirs: なし。
- Outside:
  - Extract: なし。
  - Colocate: なし。

## Files

```text
.pi/
  skills/
    plan/
      SKILL.md    update
      references/
        format.md    update
        tasks.md    update
        cut.md    update
    work/
      SKILL.md    update
      references/
        tasks.md    update
    close/
      SKILL.md    update
      scripts/
        collect.mjs
        collect.test.ts
        collect.fixture.ts
    yolo/
      SKILL.md    update
```

## Slices

## 1.plan-work

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/plan/SKILL.md`
   1. update: ステップ 1 の `Goal` の出所（通常の plan は ADR の `Adopted` の一言、`ex-` plan は `close` の Triage の行）を足す。
   2. update: ステップ 3 の cut の提示に `Goal` を足す。
   3. update: ステップ 4 の plan md の書き方に、`## Goal`、サブステップ、`### Policy` を足す。
   4. update: 新しいステップ 5（オーナー確認）を置き、ステップ 6（research）、7（review）、8（proofread）、9（show）に繰り下げる。
   5. update: ステップ 7 のレビューを 2 回にし、観点を `Goal`・`Design`・`Files`・`Slice`・`Other` にする。
   6. update: ステップ 9 の提示に `goal`/`policy` を足し、`How not to write this` に plan の手順の規則を足す。
   7. drop: `Adopted`→mark 表の `Keep` の行。
2. `.pi/skills/plan/references/format.md`
   1. update: `Shape` に `## Goal`、サブステップ、`### Policy` を入れる。

      ````md
      ## Goal

      <何が> が <どうなる>、1 行。

      ## Design

      - Inside:
        - Modules: ...
        - Dirs: ...
      - Outside:
        - Extract: ...
        - Colocate: ...

      ## Files

      ```text
      <dir>/
        <file>                update
      ```

      ## Slices

      ## 1.<スライス名>

      ### Types

      ```ts
      ...
      ```

      ### Steps

      1. `<ファイル>`
         1. update: <1 つの変更>
         2. update: <1 つの変更>
         ```ts
         <ADR かチャットが決めた中身>
         ```
         3. drop: <1 つの変更>
      2. Outside: `<affected.md の ### External の項目>`
         1. update: <1 つの変更>

      ### Policy

      - Allowed:
        - <して良いこと>
      - Forbidden:
        - <してはいけないこと> - <しない理由>

      ### Verify

      - Always:
        ...
      - Added:
        ...
      ````

   2. drop: ファイルごとの 1 行の `Steps` と、1 回だけの plan レビュー。
   3. update: `## Goal`、`## Slices`、`## Policy`、`## Verify` の規則を新しい形にし、`Verify` の `Denied` を `Policy` の `Forbidden` にする。
3. `.pi/skills/plan/references/tasks.md`
   1. update: レビューを Round 1/Round 2 にし、観点と入力を新しい形にする。

      ```md
      Round 1:
      Read the plan md, the files it names, and the ADR's Adopted, Policy, Scope and Definition.
      Answer one question: can this plan achieve its Goal, and do the Steps and the Policy carry the ADR?

      - Goal — the plan's Goal against the ADR's Adopted; can the plan achieve it?
      - Design — the four questions.
      - Files — the files the affected names, and a file it does not name.
      - Slice:
        - Types — a declaration the code uses but Types does not name, and one against the type rules.
        - Steps — the target files from the affected or External; the ADR's Add/Update/Drop without omission.
        - Policy — the ADR's Policy without omission.
        - Verify — one that does not run as written, one red with the change, and one green with the behavior removed.
        - Cases — the test steps' cases against ## Test cases.
      - Other — a contradiction, a circular flow, a duplication, an omission.

      Round 2:
      Read the fixed plan and the Round 1 findings. Check each finding: fixed, or left with the reason. Do not re-review the whole plan.
      ```
4. `.pi/skills/plan/references/cut.md`
   1. update: 提示のブロックに `Goal` を足す。

      ```md
      ## <plan id>

      - ADR: <NN>
      - Place: <worktree|base>
      - Goal: <何が> が <どうなる>、1 行。
      - Summary: <この plan が何をするか、1 文。>
      - Why: ...

      ## Order:

      1. <plan-a>
      ```
5. `.pi/skills/work/SKILL.md`
   1. update: ステップ 1 の読み取りに `Goal`/`Policy` を足す。
   2. update: ステップ 5 の `Adopted` の行を `Add`/`Update`/`Drop` の行にする。
   3. update: ステップ 6 の `Notes` に、`Gaps` が plan の `Policy`/`Goal` を読むことを足す。
   4. update: ステップ 8（オーナー確認）を置き、ステップ 9（merge）、10（report）に繰り下げる。
   5. update: `How not to write this` に、plan の `Policy`/`Goal` を落とさないことを足す。
6. `.pi/skills/work/references/tasks.md`
   1. update: `Slices` に `Goal`/`Policy` の追随を足す。
   2. update: `Clean the tests` の `Adopted` を `Add`/`Update`/`Drop` にする。
   3. update: `Review` の `Gaps` に `Policy`/`Goal` を足す。
7. `.pi/skills/close/SKILL.md`
   1. update: `steps 4 to 8` を `steps 4 to 9` にする（2 か所）。
   2. update: `work step 8` を `work step 9` にする。
8. `.pi/skills/yolo/SKILL.md`
   1. update: `### 1. plan` の項目と 7 観点を新しい形にし、ステップ 5 をエージェントの確認に置き換える。
   2. update: `### 2. work` のステップ 2 と `Note` に、マージ前のオーナー確認の飛ばし方を足す。

### Policy

- Allowed:
  - `Goal` は 1 行、cut の `Goal` と `Summary` は両方。
  - サブステップは 1 つの変更を 1 行。
  - `Policy` はスライスごとに、ADR の `Policy` を写す。`C`/`F` は写さない。
  - ステップ 5 で、ADR で決まっていないことと `affected` にないファイルを報告し、なければ「なし」と報告する。
  - レビューの Round 2 は Round 1 の修正を確かめる。
  - work は plan の `Goal` と `Policy` を読む。
  - `Gaps` は `Policy` の違反と `Goal` に届かない抜けを足す。
  - `Policy` の違反は `Gaps` の所見として扱い、`left` は `close` が読む。
  - ステップ 8 は `Ran`・`Findings`・`Doubts` を見せる。
  - マージの前にオーナーの OK を待つ。
  - `yolo` はステップ 8 を飛ばす。
  - `close` と `yolo` の追随。
- Forbidden:
  - ファイルごとの 1 行の要約で済ませること。
  - スライスに ADR の `Policy` を写さないこと。
  - `affected` にないファイルを、オーナーへ報告せずに触ること。
  - レビューの Round 2 で plan 全体を見直すこと。
  - plan の `Policy` に `C`/`F` の参照を入れること。
  - `close/scripts/collect.mjs` を変えること。
  - `Gaps` の外に新しい `Policy` 観点を置くこと。
  - `format.md` の `Gaps` の定義を変えること。
  - `code` が ADR を読むこと。
  - オーナーの OK の前にマージすること。
  - `yolo` がオーナーを待つこと。
  - `close` の「work step 8」を残すこと。
  - `yolo` の `Note` から飛ばすことを落とすこと。
  - ステップ 8 で plan の全体を見せること。

### Verify

- Always:
  - `pnpm test:related .pi/skills/plan/SKILL.md .pi/skills/plan/references/format.md .pi/skills/plan/references/tasks.md .pi/skills/plan/references/cut.md .pi/skills/work/SKILL.md .pi/skills/work/references/tasks.md .pi/skills/close/SKILL.md .pi/skills/yolo/SKILL.md`（関連がなければ `pnpm test:run`）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えた 8 ファイルと、`affected.md` が名指す `.pi/skills/close/scripts/collect.mjs`、`.pi/skills/close/scripts/collect.test.ts`、`.pi/skills/close/scripts/collect.fixture.ts` を読み、使う者の順に手順をたどり、番号、パス、名前、形を確かめ、不整合を直す。
- Added:
  - なし

## Notes

### Slice 1: plan-work

- Findings:
  - `pnpm test:run` は `.pi/extensions/consult/index.test.ts` の 4 件（`startTick`/`stopTick` のタイマー）を赤のまま残し、このスライスはそのファイルに触らない。
    - left: 対象は plan の `Files` と `Outside` の外であり、このスライスの作業ではない。
- Unplanned:
  - なし
- Commit:
  - 13aea210ef0e8c6be983bcc8b7903cc615237317
- Stopped:

### Cleanup: 文書のみのため掃除なし

- Findings:
- Unplanned:

## Work Review

### Round 1

- Stale: なし — 変えた8ファイルとcollect 3ファイルを読み、手順番号・パス・名前・形を確かめたが、古くした文書・コメント・テストはなかった。
- Unlisted: なし — 差分（7d5fb00..HEAD）はFilesがupdateと名指す8ファイルだけであり、collect.mjs等への変更はなかった。
- Gaps: なし — StepsはADRのAdd/Update/Dropを漏れなく当て、PolicyはC/Fなしで写し、Forbidden違反とGoalに届かない抜けはなかった。
- Unproven: なし — テストファイルに触れずAddedもなしのため、壊しても緑のまま残るテストはなかった。
- Noise: なし — 追加・変更したテストがなく、型や制約が決める前提の重複ケースもなかった。
- Doubts:
  - 同一ブランチ上の7d5fb00がROADMAP.mdに77行を足しているが、スライスのコミット（13aea21）外であり、マージ前に整理が必要か判断が要る。
  - Notesの赤4件（.pi/extensions/consult/index.test.tsのstartTick/stopTick）はFilesとOutsideの外としてleftされており、このスライスで扱わないことが妥当か確認が要る。
  - レビューはスライスのコミット差分（7d5fb00..HEAD）で見ており、8d32faaを基点に含めるとROADMAP差分が混ざるため、基点の扱いの確認が要る。

### Round 2

- Stale: なし — Round 1の所見がなく、確かめる修正がなかった。
- Unlisted: なし — Round 1の所見がなく、確かめる修正がなかった。
- Gaps: なし — Round 1の所見がなく、確かめる修正がなかった。
- Unproven: なし — Round 1の所見がなく、確かめる修正がなかった。
- Noise: なし — Round 1の所見がなく、確かめる修正がなかった。
- Doubts:
  - なし。

## Acceptance

- Ran:
  - `pnpm test:related`（8 ファイル）: 関連なし、exit 0。
  - `pnpm typecheck`: 通過。
  - `pnpm lint`: 通過。
  - `pnpm format:check`: 通過。
  - 変えた 8 ファイルと `collect.mjs`・`collect.test.ts`・`collect.fixture.ts` の読み通し: 番号、パス、名前、形に不整合なし。
- Findings:
  - `pnpm test:run` の `.pi/extensions/consult/index.test.ts` の 4 件（`startTick`/`stopTick` のタイマー）は赤のまま。対象は plan の `Files` と `Outside` の外であり、このスライスの作業ではない（left）。
- Doubts:
  - 同一ブランチ上の `7d5fb00` が `ROADMAP.md` に 77 行を足している。スライスのコミット（`13aea21`）の外であり、マージ前の整理が必要か。
  - `Notes` の赤 4 件（`.pi/extensions/consult/index.test.ts` の `startTick`/`stopTick`）を `Files` と `Outside` の外として `left` にしたことが妥当か。
  - レビューの基点を `8d32faa` にすると `ROADMAP` の差分が混ざる。基点の扱いをどうするか。
