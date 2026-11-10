# PLAN `skill-updates`

- No: 01, 02, 03, 04, 05
- Place: base
- Boundary Plans: なし

## Goal

5 つのエントリの決定が、adr・plan・work・close のスキル、テンプレート、検査、記録に反映される。

## Design

- Inside:
  - Modules: `なし`。`adr.mjs` の `entrySkeleton` と `checkEntry`、`collect.mjs` の `LABELS` は、それぞれ同じファイルに留める。`adr.format.md`、`adr/SKILL.md`、`plan/references/format.md`、`work/SKILL.md` は、セクションを足すが、ファイルを分割しない。`adr/SKILL.md` は 01 の affected が名指すが、01 の変更は形式とテンプレートであり、`### 5. Decision` の `Adopted` の手順は 03 のスライス 6 が担う。`.pi/skills/close/scripts/collect.test.ts` は 04 の affected が名指さないが、04 の Decision の `Add` が `Policy` の case を求めるため、`Files` に加える（オーナーは step 5 で承認した）。
  - Dirs: `なし`。既存のディレクトリに留め、統合・分割・移動をしないため。
- Outside:
  - Extract: `なし`。複数のスキルが共有する新しいモジュールを作らないため。
  - Colocate: `なし`。共有をやめて利用者の隣に置くモジュールがないため。

## Files

```text
.pi/
  skills/
    adr/
      SKILL.md              update
      references/
        adr.format.md       update
        tasks.md            update
      scripts/
        adr.mjs             update
        index.test.ts       update
    plan/
      SKILL.md              update
      references/
        format.md           update
        tasks.md            update
    work/
      SKILL.md              update
      references/
        tasks.md            update
    close/
      scripts/
        collect.mjs         update
        collect.test.ts     update
```

## Slices

## 1.adr-decision

ADR の Decision が `Main` と `Sub` に分かれ、`Adopted` がなくなり、テンプレート・検査・テストがその形に揃う。

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/adr/references/adr.format.md`
   1. update: `## Shape` の Decision を、`Status`、`Main`、`Sub`、`Policy` の形にする。

      ```md
      - Status: <empty before the decision; **accepted** | **rejected**（理由）>
      - Main: <この関心事は、何がどうなるか>
        - Add:
          - <増えるもの>（C1, F2）
        - Update:
          - <変わるもの（何がどうなるか）>（C1）
        - Drop:
          - <消えるもの>（F1）
      - Sub: <この関心事は、何がどうなるか>
        - Add:
          - <増えるもの>（C1, F2）
        - Update:
          - <変わるもの（何がどうなるか）>（C1）
        - Drop:
          - <消えるもの>（F1）
      - Policy:
        - Allowed:
          - <して良いこと>（C2, F2）
        - Forbidden:
          - <明示的にしてはいけないこと> - <しない理由>（C2, F2）
      ```

   2. update: `## Decision` の規則を、`Main` は 1 つ、`Sub` は 0 個以上、`Status` と `Policy` はエントリに 1 つ、`Adopted` はない形にする。`（C1, F2）` は `Add`・`Update`・`Drop`・`Policy` の行に置き、その関心事自体が C/F を確定するときは `Main` や `Sub` の行にも置く。
2. `.pi/skills/adr/scripts/adr.mjs`
   1. update: `entrySkeleton` の `Decision` を、`Status:`、`Main:`、`Sub:`、`Policy:` の形に変え、`Adopted:` を置かない。`Main` と `Sub` を 1 つずつ置き、`Sub` を増やせることを示す。冒頭のコメントは「`references/adr.format.md` のエントリの形と合わせること」。
   2. update: `checkEntry` のコメントの「`Adopted` と `Policy` を合わせて」を「`Decision` セクション全体で」に変える。
3. `.pi/skills/adr/scripts/index.test.ts`
   1. update: `entrySkeleton` のテストに、`Main` と `Sub` があることを足す。`Adopted`、`Cost`、`Options` の不在を確かめる assertion は置かない。
      - `3.1: (happy) entrySkeleton(1) → Main と Sub がある`
   2. update: `entry()` の `Adopted` 行を、`Main` と `Sub` に変える。
      - `3.2: (happy) entry(decision) → Decision が Main と Sub の C/F を運ぶ`
   3. update: `--check` の CLI テストの ADR 文字列を、`Main` と `Sub` の形に変える。
      - `3.3: (happy) Main と Sub の ADR → --check が通る`
4. `.pi/skills/adr/references/tasks.md`
   1. update: `Look at the affected` のステップ 1 を「`Scope` の `In`、`Main`、`Sub`、`Policy`、`Definition` を読む」に変える。
   2. update: ステップ 2 の「`Adopted` の文ごとに」を「`Main` と `Sub` の文ごとに」に変える。

### Policy

- Allowed:
  - その関心事自体が C/F を確定するとき、`Main` や `Sub` の行に参照を置く。
  - 内容の脱落を避けるため、重複と冗長を整理する。
  - 025 の軸に伴う変更をすべて行う。
  - 01 の形式はフェンスのとおりにする。
  - `affected` のテンプレートと `--check` の対象はそのままにする。
- Forbidden:
  - `Adopted` を残すこと - plan と affected が読む欄が二重になるため。
  - `Concern` という欄を残すこと - `Main` と `Sub` に置き換えるため。
  - plan の `Goal` を 1 つの `Main` に固定すること - 複数の ADR を束ねる場合に Goal が作れないため。
  - `Sub` を必須にすること - 追加の関心事がないエントリがあるため。

### Verify

- Always:
  - `pnpm test:related .pi/skills/adr/scripts/adr.mjs .pi/skills/adr/scripts/index.test.ts`（関連がなければ `pnpm test:run`）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、変えたファイルが名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added:
  - other: `node .pi/skills/adr/scripts/index.mjs --check`
  - other: `node scripts/checks/ja-check.mjs .pi/skills/adr/references/adr.format.md .pi/skills/adr/scripts/adr.mjs .pi/skills/adr/scripts/index.test.ts`

## 2.plan-goal-no

plan が、複数の ADR を束ね、`Main` を統合した `Goal` と複数の `No` を持つ。

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/plan/SKILL.md`
   1. update: `No` を、複数のエントリ番号をカンマで並べる形にする。
   2. update: `Goal` を、対象のエントリの `Main` を統合した 1 行にする。
   3. update: レビューに渡すものを、plan md、plan が名指すファイル、ADR の `Main`・`Sub`・`Policy`・`Scope`・`Definition` にする。
   4. update: レビューの `Goal` の観点を、`Main` の統合に変える。
   5. update: `:101` の表の見出しを `Main` / `Sub` にする。

      ```md
      | `Main` / `Sub` | mark     |
      | -------------- | -------- |
      | `Add`          | `add`    |
      | `Update`       | `update` |
      | `Drop`         | `drop`   |
      ```
2. `.pi/skills/plan/references/format.md`
   1. update: `## Shape` の `No` を `- No: <NN>[, <NN>...]` に変える。
   2. update: `## Goal` の出どころを、対象のエントリの `Main` の統合に変える。
   3. update: `## No` の規則を、複数の番号を持つ形に変える。
3. `.pi/skills/plan/references/tasks.md`
   1. update: レビューの読み取りを、`Main`・`Sub`・`Policy`・`Scope`・`Definition` にする。
   2. update: `Goal` の行を、`Main` の統合に変える。
   3. update: `:49` の行を、`Main` と `Sub` に変える。

### Policy

- Allowed:
  - その関心事自体が C/F を確定するとき、`Main` や `Sub` の行に参照を置く。
  - 内容の脱落を避けるため、重複と冗長を整理する。
  - 025 の軸に伴う変更をすべて行う。
  - 01 の形式はフェンスのとおりにする。
  - `affected` のテンプレートと `--check` の対象はそのままにする。
- Forbidden:
  - `Adopted` を残すこと - plan と affected が読む欄が二重になるため。
  - `Concern` という欄を残すこと - `Main` と `Sub` に置き換えるため。
  - plan の `Goal` を 1 つの `Main` に固定すること - 複数の ADR を束ねる場合に Goal が作れないため。
  - `Sub` を必須にすること - 追加の関心事がないエントリがあるため。

### Verify

- Always:
  - `pnpm test:related .pi/skills/plan/SKILL.md .pi/skills/plan/references/format.md .pi/skills/plan/references/tasks.md`（関連がなければ `pnpm test:run`）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、変えたファイルが名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added:
  - other: `node scripts/checks/ja-check.mjs .pi/skills/plan/references/format.md`

## 3.entry-split

エントリの分割が、主たる関心事を 1 つにし、一意に決まる変更だけを `Sub` として同じエントリに含める条件で行われる。

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/adr/SKILL.md`
   1. update: Cycle 3 Entries のステップ 1 を「Split the cycle into entries. One entry has one `Main`.」に変える。
   2. add: Cycle 3 Entries に、条件の `View` を足す。

      ```md
      | case                                                                               | the entry     |
      | ---------------------------------------------------------------------------------- | ------------- |
      | the main concern                                                                   | one `Main`    |
      | a change that follows the `Main`'s change or addition uniquely, without discussion | one `Sub`     |
      | a change that needs discussion, or does not follow uniquely                        | another entry |
      ```

   3. update: Cycle 3 Entries の Note に、`Sub` を許す条件と、別のエントリにする条件を足す。既存のステップ 2〜5 と Note は残す。

      ```md
      - An entry has one `Main` and may have `Sub`s.
      - A `Sub` is allowed only when its change follows uniquely from the `Main`'s change or addition, without discussion.
      - A change that needs discussion, or does not follow uniquely, is another entry.
      - The owner's answer decides the split.
      ```

### Policy

- Allowed:
  - 一意に決まる変更を `Sub` として同じエントリに含める。
  - 内容の脱落を避けるため、重複と冗長を整理する。
  - 既存のステップ 2〜5 と Note を残す。
  - 02 の Scope の In の範囲で行う。
  - 02 の形はフェンスのとおりにする。
  - 規則は 1 文 1 箇条書きにする。
  - plan が複数のエントリを束ねられる単位で分ける。
- Forbidden:
  - 議論を伴う変更を `Sub` として同じエントリに含めること - オーナーの判断が必要なため。
  - 主たる関心事を 2 つ以上持つエントリを作ること - SoC に反するため。

### Verify

- Always:
  - `pnpm test:related .pi/skills/adr/SKILL.md`（関連がなければ `pnpm test:run`）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、変えたファイルが名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added:
  - なし

## 4.pre-research

全エントリのプレリサーチが、スキャフォールド後にまとめて提案され、承認後に並列で走り、全部が返ってから各エントリへ転記される。`### 3. The opening proposal` で `Decision` に冒頭案を書く。

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/adr/SKILL.md`
   1. add: Cycle 3 Entries のステップ 5〜7 を足す。

      ```md
      5. Read the `Look it up` section of `references/tasks.md`.
      6. Propose the pre-research of every entry together, and run the approved ones in parallel.
      7. Wait for all of them, and write each result in its entry's `Research & Trial`.
      ```

   2. update: 現在のステップ 5 をステップ 8 に繰り下げる。

      ```md
      8. Show the owner a new entry found while an entry runs, and add it after the answer.
      ```

   3. add: Cycle 3 Entries に、まとめ提案の `View` を足す。

      ```md
      | entry | type | question | what the answer decides |
      | ----- | ---- | -------- | ----------------------- |
      ```

      `Pre-research` の `View` にあった 3 つの type と 3 つの question は、このまとめ提案の `View` に移す。

   4. add: Cycle 3 Entries の `Notes` に、pre-research の決まりを足す。

      ```md
      - The proposal names the type, the question, and what the answer would decide.
      - Group the entries whose question is the same.
      - Run one `research` or `trial` subagent per group after the owner approves.
      ```

   5. update: `### 3. Pre-research` を `### 3. The opening proposal` に置き換える。

      ```md
      1. Read the entry's pre-research facts in `Research & Trial`, and what they decide.
      2. Read the `Decision` section of `references/adr.format.md`.
      3. Write the opening proposal of the Discussion Loop in the entry's `Decision`, with `Status` empty.
      4. Say what the facts decide and what the proposal is, and go to the Discussion Loop.
      ```

      ```md
      - The proposal is in adr.md, not only in the chat.
      - The facts serve the opening proposal.
      - A fact that is still missing stops the entry. It is looked up here, not in the decision.
      - When the holding point is a fact nobody has, a `trial` subagent may try it in a worktree, with the owner's agreement. Read the `Try it` section of `references/tasks.md` before running.
      ```

### Policy

- Allowed:
  - 同じ質問のエントリを 1 つの調査にまとめる。
  - 既存のステップ 1〜4 と、新しいエントリを見つけたときのステップを残す。
  - 既存の `View`（type と question）をまとめ提案に移す。
  - エントリの `Main` と `Sub` を、まとめ提案の単位にする。
  - 025 の軸に伴う変更をすべて行う。
  - 規則は 1 文 1 箇条書きにする。
  - `Look it up` と `Try it` のタスク本文は変えない。
  - `### 7. Affected` の研究はそのままにする。
  - 03 の形はフェンスのとおりにする。
- Forbidden:
  - 1 エントリに 1 件ずつ調査を置くこと - 同じ質問はまとめてよいため。
  - 全部が返る前にエントリの作業を始めること - 転記してから進むため。
  - `Pre-research` のセクションを残すこと - 研究を行わないため、冒頭案のステップに置き換えるため。

### Verify

- Always:
  - `pnpm test:related .pi/skills/adr/SKILL.md`（関連がなければ `pnpm test:run`）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、変えたファイルが名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added:
  - なし

## 5.scope-first

Scope を adr.md に先に書き、書いた上でオーナーの合意を確認する。

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/adr/SKILL.md`
   1. update: `### 1. Scope` のステップを、書いてから確認する形に変える。

      ```md
      1. Write the `Scope` to adr.md, every kind, `In` or `Out`.
      2. Let the owner correct the list.
      3. Write the result to the entry's `Scope` as `In:` and `Out:`.
      ```

### Policy

- Allowed:
  - 025 の軸に伴う変更をすべて行う。
  - 規則は 1 文 1 箇条書きにする。
  - `### 7. Affected` の研究はそのままにする。
  - 03 の形はフェンスのとおりにする。
- Forbidden:
  - なし

### Verify

- Always:
  - `pnpm test:related .pi/skills/adr/SKILL.md`（関連がなければ `pnpm test:run`）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、変えたファイルが名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added:
  - なし

## 6.loop-decision

Discussion Loop で Scope・Context・Research & Trial・Decision を随時更新し、Decision のステップで Status と F/C を確認する。

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/adr/SKILL.md`
   1. update: `### 4. Discussion Loop` のステップを、冒頭案から始め、Scope・Context・Research & Trial・Decision を更新する形に変える。

      ```md
      1. Start from the opening proposal in `Decision`.
      2. Discuss, and investigate where a fact is missing.
      3. Write an added `Context` item as `C<n>`, after the existing numbers, at the moment it is settled.
      4. Write what is settled in a fence under `Context`, at the moment it is settled.
      5. Update `Scope`, `Context`, `Research & Trial` and `Decision` as the discussion settles them.
      6. Repeat until the owner moves the entry to the decision.
      ```

   2. add: `### 4. Discussion Loop` の `View` に、`Decision` と `Scope` の行を足す。

      ```md
      | where the finding goes | the rule                      |
      | ---------------------- | ----------------------------- |
      | `Decision`             | a change the decision settles |
      | `Scope`                | a change the scope settles    |
      ```

   3. update: `### 5. Decision` のステップを、Status と F/C のチェックにする。

      ```md
      1. Check that every `C` and every `F` is carried.
      2. When one is missing, explain it to the owner, and return to section 4.
      3. Wait for the owner's judgement: `accepted` or `rejected`.
      4. Write `Status`.
      ```

   4. update: `### 5. Decision` から `Decision` の書き方を読むステップを外す（`### 3. The opening proposal` が持つ）。`### 4. Discussion Loop` の `section 3` の参照は、`### 3. The opening proposal` を指したままにする。

### Policy

- Allowed:
  - 025 の軸に伴う変更をすべて行う。
  - 規則は 1 文 1 箇条書きにする。
  - `### 7. Affected` の研究はそのままにする。
  - 03 の形はフェンスのとおりにする。
- Forbidden:
  - なし

### Verify

- Always:
  - `pnpm test:related .pi/skills/adr/SKILL.md`（関連がなければ `pnpm test:run`）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、変えたファイルが名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added:
  - なし

## 7.review-policy

work のレビューが、plan の `Policy` を守っているかを見る `Policy` の観点を `Gaps` から分けて持つ。

### Types

```ts
const LABELS =
  /^(Findings|Unplanned|Commit|Stopped|Ran|Stale|Unlisted|Gaps|Policy|Unproven|Noise|Doubts):\s*(.*)$/;
```

### Steps

1. `.pi/skills/work/SKILL.md`
   1. update: `### 6. Review` の「five viewpoints」を「six viewpoints」に変える。
   2. update: `Gaps` の Note を、`Policy` と `Gaps` に分ける。

      ```md
      - `Policy` reads the plan's `Policy`: an `Allowed` it forbids, and a `Forbidden` it does.
      - `Gaps` reads the plan's `Goal`: a hole that misses it.
      ```
2. `.pi/skills/work/references/tasks.md`
   1. add: `Review` タスクに `Policy` の観点を足す。

      ```md
      - `Policy` — a `Policy` line the diff does not keep: an `Allowed` it forbids, or a `Forbidden` it does
      ```

   2. update: `Gaps` から Policy の部分を外す。

      ```md
      - `Gaps` — a behavior the checks do not exercise, and a hole that misses the plan's `Goal`
      ```
3. `.pi/skills/plan/references/format.md`
   1. add: `## Work Review` に `Policy` の観点を足す。

      ```md
      - `Policy` — a `Policy` line the diff does not keep: an `Allowed` it forbids, or a `Forbidden` it does
      ```
4. `.pi/skills/close/scripts/collect.mjs`
   1. update: `LABELS` に `Policy` を足す。
5. `.pi/skills/close/scripts/collect.test.ts`
   1. add: `Policy` の観点の行を読む case を足す。
      - `5.1: (happy) a Work Review with a - Policy: line → the Policy finding is read, not a leftover`

### Policy

- Allowed:
  - `Policy` は plan の `Policy` を見る。
  - 内容の脱落を避けるため、重複と冗長を整理する。
  - 04 の Scope の In の範囲で行う。
  - 規則は 1 文 1 箇条書きにする。
  - 04 の形はフェンスのとおりにする。
  - `Doubts` と 2 ラウンドの形は変えない。
- Forbidden:
  - `Gaps` に Policy の確認を残すこと - `Policy` の観点に分けるため。
  - `Policy` を ADR から直接読むこと - レビューは plan md を読むため。

### Verify

- Always:
  - `pnpm test:related .pi/skills/close/scripts/collect.mjs .pi/skills/close/scripts/collect.test.ts`（関連がなければ `pnpm test:run`）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、変えたファイルが名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added:
  - other: `node scripts/checks/ja-check.mjs .pi/skills/plan/references/format.md .pi/skills/close/scripts/collect.mjs .pi/skills/close/scripts/collect.test.ts`

## 8.acceptance-goal

work の acceptance が、実装が plan の `Goal` を達成しているかを `Goal` の欄で確かめる。

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/work/SKILL.md`
   1. add: `### 7. Acceptance` のステップ 3 のあとに、`Goal` を確かめるステップを足す。

      ```md
      Say whether the implementation achieves the plan's `Goal`.
      ```

   2. update: ステップ 4 を、`Goal` を `Ran` の前に書く形に変える。
   3. add: `View` に `Goal` の行を足す。

      ```md
      | the plan's `Goal` | the agent |
      ```

   4. add: `Notes` に `Goal` の意味を足す。

      ```md
      - `Goal` is the plan's `Goal`.
      - A gap between the `Goal` and the implementation is a `Findings` line.
      ```

   5. update: `### 8. The owner's confirmation` のステップ 1 を、`Goal`、`Ran`、`Findings`、`Doubts` を見せる形に変える。
2. `.pi/skills/plan/references/format.md`
   1. add: `## Shape` の `## Acceptance` に `Goal` を足す。

      ```md
      - Goal: <plan の `Goal` と、実装がそれを達成しているか>
      - Ran: <走らせた検査>
      - Findings: <finding>
      - Doubts: <finding でない注記>
      ```

   2. add: `## Acceptance` の規則に、`Goal` の意味と、差を `Findings` にすることを足す。

      ```md
      - `Goal` holds the plan's `Goal` and whether the implementation achieves it.
      - A gap between the `Goal` and the implementation is a `Findings` line.
      ```

### Policy

- Allowed:
  - `Goal` には、plan の `Goal` と、実装がそれを達成しているかを書く。
  - `Goal` と実装の差は `Findings` の 1 行にする。
  - 既存の `Ran`、`Findings`、`Doubts` と検査を残す。
  - `Acceptance's findings` タスクは変えない。
  - 04 の `Policy` の観点とは別に、acceptance は `Goal` を見る。
  - 内容の脱落を避けるため、重複と冗長を整理する。
  - 05 の Scope の In の範囲で行う。
  - 規則は 1 文 1 箇条書きにする。
  - 05 の形はフェンスのとおりにする。
- Forbidden:
  - `Goal` の確認を `Ran` の中に置くこと - `Ran` は走らせた検査であり、`Goal` は判断であるため。
  - `Goal` を書かずに acceptance を終えること - 025 の要望が goal の達成を求めているため。

### Verify

- Always:
  - `pnpm test:related .pi/skills/work/SKILL.md .pi/skills/plan/references/format.md`（関連がなければ `pnpm test:run`）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、変えたファイルが名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added:
  - other: `node scripts/checks/ja-check.mjs .pi/skills/plan/references/format.md`

## Notes

### Slice 1: adr-decision

- Findings:
- Unplanned: テストの不在 assertion（`Adopted`、`Cost`、`Options`）は置かない（オーナーの指示）。
- Commit: 9785bce5dd30759bd9708fc6a5dd7e68378c324c
- Stopped:

### Slice 2: plan-goal-no

- Findings:
- Unplanned:
- Commit: 0dedef9c4e09a036dfa08e0b77662c0c1486ec0a
- Stopped:

### Slice 3: entry-split

- Findings:
- Unplanned:
- Commit: f2b058c26095a7018c1b0166faf502d571f979ad
- Stopped:

### Slice 4: pre-research

- Findings:
- Unplanned: ステップ 5 の長い一文を、短いステップ 5〜7 と `Notes` に分割した（オーナーの指示）。
- Commit: 33c1ba77c6f194d13c9a8eabbc3590dbd3eb5595
- Stopped:

### Slice 5: scope-first

- Findings:
- Unplanned:
- Commit: b2d4c66319d7b52b630cda7b925dcf9b29740c72
- Stopped:

### Slice 6: loop-decision

- Findings:
- Unplanned: Decision のステップ 5 と 6 を削除した。`Main`、`Sub`、`Policy` は Loop が、`Context` の項目とフェンスは Loop のステップ 3 と 4 が書く（オーナーの指示）。
- Commit: 1d1bca1fb99309687037699b41f402fcc7ab8304
- Stopped:

### Slice 7: review-policy

- Findings:
- Unplanned: ja-check が `collect.mjs` の既存コメントの語を誤検出したため、「識別」に直した。
- Commit: 3f0cf52343725f98c7e4b06369ca7ce8652992ab
- Stopped:

### Slice 8: acceptance-goal

- Findings:
- Unplanned:
- Commit: 41702a5341abf2d19aa7e96785ca94cf65a6a1ad
- Stopped:

### Cleanup: なし

- Findings: なし
- Unplanned: なし

## Work Review

### Round 1

- Stale:
  - `.pi/skills/plan/references/format.md:104` — `## Shape` の `### Round 1`（`### Round 2` の `:113` も同じ）が `Policy` の行を持たず、本文の観点一覧が6観点になった後も5観点のままである。Slice 7 の「`## Work Review` に `Policy` の観点を足す」は本文だけに足され、型（`Shape`）に足されていない。
    - fixed: `## Shape` の `### Round 1` と `### Round 2` に `- Policy:` を足した。
- Unlisted:
  - なし — `Files` の12件はすべて更新されている。`cycles/` 配下の差分（plan md の `Notes`・`Steps` 整備と `adr.md` の2行削除）は所有者承認の記録整備であり、実装の変更ではない。
- Gaps:
  - `.pi/skills/adr/scripts/index.test.ts:289` — `Sub` が C/F を運ぶ振る舞いを動かす検査がない。`checkEntry` の各テストも CLI の `--check`（`:574` の ADR 文字列に `Sub` がない）も `Sub` 行を作らず、Slice 1 の case `3.2` が名指す「`Main` と `Sub` の C/F」のうち `Sub` 側がどの検査にも現れない。
    - fixed: `index.test.ts` に、`Sub` が C を運ぶ `checkEntry` のテストを足した。
- Policy:
  - `.pi/skills/work/SKILL.md:288` — 「`Gaps` holds their holes（`Policy` and `Goal`）」が残り、Slice 7 の `Forbidden`（`Gaps` に Policy の確認を残すこと）が守られていない。`### 6. Review`（`:161`〜`:165`）では分割したが、`How not to write this` では分割していない。
    - fixed: `work/SKILL.md` の `How not to write this` を、`Policy` と `Gaps` がそれぞれの穴を持つ形に直した。
- Unproven:
  - なし — 各テストは名指す振る舞いが壊れると赤になる（`Sub` の不在は `Gaps` に書いたとおり、名指すテスト自体がない）。
- Noise:
  - なし — `collect.test.ts` の `Policy` の case（`5.1`）は `LABELS` の変更を赤で示せる意味のある検査で、既存の `review` の case と同じ書き方である。
- Doubts:
  - 作業ツリーに `base..HEAD` の外の `M ROADMAP.md` がある。今回の差分ではなく読んでいない。扱いは所有者の判断に任せる。

### Round 2

- Stale:
  - `.pi/skills/plan/references/format.md:104` — 直った。理由：`## Shape` の `### Round 1`（現行102〜108行）と `### Round 2`（現行112〜118行）に `- Policy:` があり、本文の6観点と一致することを確かめた。
- Unlisted:
  - なし — Round 1がなしでfixed対象がないため、新たに確かめる差分はない。
- Gaps:
  - `.pi/skills/adr/scripts/index.test.ts:336` — 直った。理由：`Sub` が `C2` を運ぶ `checkEntry` のテストがあり、`Sub` を無視すれば `C2` の抜けで赤になる構成（`:298〜300` の欠けテストと対になる）のため、`Sub` 側が検査に現れることを確かめた。
- Policy:
  - `.pi/skills/work/SKILL.md:288` — 直った。理由：現行288行が「`Policy` holds the `Policy`'s holes, and `Gaps` the `Goal`'s.」で、`Policy` と `Gaps` を分割し、Slice 7の `Forbidden` に合うことを確かめた。
- Unproven:
  - なし — Round 1がなしでfixed対象がないため、新たに確かめる検査はない。
- Noise:
  - なし — 同上。fixed対象がなく、Round 1の判断（`collect.test.ts` の `5.1` は意味のある検査）が崩れる変更はない。
- Doubts:
  - なし — Round 2で新たに見つけた疑いはない。Round 1の `M ROADMAP.md` は今回の差分の外でfixed対象がなく、扱いはcloseに任せる。

## Acceptance

- Goal: 5 つのエントリの決定が、adr・plan・work・close のスキル、テンプレート、検査、記録に反映された。
- Ran: `pnpm test:run`（63 ファイル、784 件）、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`、`node .pi/skills/adr/scripts/index.mjs --check`、ja-check。壊して戻す確認: `collect.mjs` の `LABELS` から `Policy` を外すと `collect.test.ts` の `Policy` が赤（15 件中 1 件）、戻すと緑。`adr.mjs` の `entrySkeleton` から `Sub` を外すと `index.test.ts` の `Sub` が赤（60 件中 1 件）、戻すと緑。
- Findings: なし
- Doubts: なし
