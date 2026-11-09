# PLAN `readable-rules`

- No: 01, 02, 03, 04
- Place: base
- Boundary Plans: なし

## Goal

5 つのスキルの参照、plan のスライス、work の clean test、6 つのスキルの助言が、読者が規則と状況を形から読み取れるものになる。

## Design

- Inside:
  - Modules: なし — 参照ファイルの中のセクションを統合も分割もしない。01 はセクションの内部を `###` の話題ごとに分けるが、セクションの名前と数は変えない。
  - Dirs: なし — このプランではディレクトリを作らず、動かさない。
- Outside:
  - Extract: なし — `## How not to write this` の項目の形は 6 つの SKILL.md で同じだが、各スキルが独立した文書として読まれるため、共通の文書にまとめない。
  - Colocate: なし — 共通化をやめる文書はない。

## Files

```text
.pi/skills/
  adr/
    SKILL.md                update
    references/
      adr.format.md         update
      affected.format.md    update
      tasks.md              update
  close/
    SKILL.md                update
    references/
      format.md             update
      tasks.md              update
  plan/
    SKILL.md                update
    references/
      format.md             update
      cut.md                update
      tasks.md              update
  upgrade/
    SKILL.md                update
    references/
      report.md             update
      tasks.md              update
  work/
    SKILL.md                update
    references/
      tasks.md              update
  yolo/
    SKILL.md                update
```

## Slices

## 1.field-reference

### Types

なし

### Steps

1. `.pi/skills/adr/references/adr.format.md`
   1. update: `## Shape` の見本の下の `## Entries`、`## Scope`、`## Context`、`## Research & Trial`、`## Decision`、`## Definition` を、下の欄の参照の形にする。
   2. update: `## Entries` の `One bullet is one sentence.` を `One bullet is one rule.` に変える。

   ```md
   ## <field>

   <what the field is, one line>

   | <value or form> | <what it means> |
   | --------------- | --------------- |

   - <rule>.
   - When <condition>, <rule>.
     - Exception: <what the exception is>.
   ```

   形の規則:
   - 表は、決まった値の組があるセクションにだけ置く。
   - 値だけを言う箇条書きは、表の行に移し、箇条書きには残さない。
   - 1 つの規則は、1 つの箇条書きにする。説明、例、理由は、その規則の中か、その下の入れ子に置き、別の箇条書きにしない。
   - 「何か」の 1 行は、その欄が何かを言う。最初の規則を言い換えない。
   - `## Shape` の見本は残す。
   - セクションの中の見本のフェンス（tree、`ts`、提示のフェンス）は、そのままの内容で残す。動かすのは、その周りの書き方だけにする。

2. `.pi/skills/adr/references/affected.format.md`
   1. update: `## Entries` と `## The block` を、手順 1 の形にする。

3. `.pi/skills/close/references/format.md`
   1. update: `## Collected`、`## Triage`、`## Verified` を、手順 1 の形にする。
   2. update: `## Writing` の `One bullet is one sentence.` を `One bullet is one rule.` に変える。

4. `.pi/skills/plan/references/format.md`
   1. update: `## Goal` から `## Notes` までの各セクションを、手順 1 の形にする。
   2. update: `## Writing` の `One bullet is one sentence.` を `One bullet is one rule.` に変える。

5. `.pi/skills/upgrade/references/report.md`
   1. update: `## Rules` を、手順 1 の形にする。
   2. update: `## Writing` の `One bullet is one sentence.` を `One bullet is one rule.` に変える。

6. `.pi/skills/plan/references/cut.md`
   1. update: `## Cut`、`## Present`、`## Where` を、手順 1 の形にする。
   2. update: `## Writing` の `One bullet is one sentence.` を `One bullet is one rule.` に変える。

### Policy

- Allowed:
  - セクションの中を `###` の話題で分ける
  - 値の組があるセクションにだけ表を置く
  - フェンスの外に、エージェント自身の規則を残す
- Forbidden:
  - 規則の内容を変えること - 01 は書き方だけを扱うため
  - セクションの名前を、その名前を指す参照を直さずに変えること - SKILL.md と `tasks.md` が名前で参照しているため

### Verify

- Always:
  - the tests related to this slice (`pnpm test:related .pi/skills/adr/references/adr.format.md .pi/skills/adr/references/affected.format.md .pi/skills/close/references/format.md .pi/skills/plan/references/format.md .pi/skills/upgrade/references/report.md .pi/skills/plan/references/cut.md`; `pnpm test:run` when nothing is related)
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - the read-through: read every changed file whole, and every file it names whole.
  - Follow the procedure in the order the file gives, as the one who acts on it.
  - Check the number, the path, the name and the shape at each place against what it points to.
  - Fix any inconsistency, and write the fix in `Unplanned`.
- Added: なし

## 2.task-shape

### Types

なし

### Steps

1. `.pi/skills/adr/references/tasks.md`
   1. update: `## Look it up`、`## Look at the affected`、`## Try it` のフェンスの中を、下のタスクの形にする。
   2. update: フェンスの外にある補足は、フェンスの外の箇条書きとして残す。このファイルは `## Writing` を持たない。

   ````md
   ## <task> (a `<role>` subagent)

   <when the agent hands it, one line>

   ```text
   <the job, one line>

   1. <action>.
      - IF <condition> → <action>.
      - IF none of the above → <action>.
   2. <action>.
   3. Report <what>, in <the shape>.
   ```

   - <the agent's own rule>
   ````

   形の規則:
   - 「いつ渡すか」の 1 行は、文にする。
   - 仕事の 1 行は、そのタスクが何をするかだけを言う。step 1 で言い換えない。
   - 分岐は `IF <condition> → <action>` とし、最後に受け皿を置く。受け皿は、どの条件にも当てはまらないときの動作である。
   - 続きの文は、その step か `IF` の下の入れ子に置き、別の step にしない。
   - 最後の step は報告にする。

2. `.pi/skills/close/references/tasks.md`
   1. update: `## Look it up` のフェンスの中を、手順 1 の形にする。
   2. update: `## Writing` の `One bullet is one sentence.` を `One bullet is one rule.` に変える。

3. `.pi/skills/plan/references/tasks.md`
   1. update: `## Review of a plan` と `## Research the unwritable lines` のフェンスの中を、手順 1 の形にする。
   2. update: `## Writing` の `One bullet is one sentence.` を `One bullet is one rule.` に変える。

4. `.pi/skills/upgrade/references/tasks.md`
   1. update: `## Look one package up` のフェンスの中を、手順 1 の形にする。
   2. update: `## Writing` の `One bullet is one sentence.` を `One bullet is one rule.` に変える。

5. `.pi/skills/work/references/tasks.md`
   1. update: `## Slices`、`## Clean the tests`、`## Review`、`## Fixes`、`## Acceptance's findings` のフェンスの中を、手順 1 の形にする。
   2. update: `## Writing` の `One bullet is one sentence.` を `One bullet is one rule.` に変える。

### Policy

- Allowed:
  - セクションの中を `###` の話題で分ける
  - 値の組があるセクションにだけ表を置く
  - フェンスの外に、エージェント自身の規則を残す
- Forbidden:
  - 規則の内容を変えること - 01 は書き方だけを扱うため
  - セクションの名前を、その名前を指す参照を直さずに変えること - SKILL.md と `tasks.md` が名前で参照しているため

### Verify

- Always:
  - the tests related to this slice (`pnpm test:related .pi/skills/adr/references/tasks.md .pi/skills/close/references/tasks.md .pi/skills/plan/references/tasks.md .pi/skills/upgrade/references/tasks.md .pi/skills/work/references/tasks.md`; `pnpm test:run` when nothing is related)
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - the read-through: read every changed file whole, and every file it names whole.
  - Follow the procedure in the order the file gives, as the one who acts on it.
  - Check the number, the path, the name and the shape at each place against what it points to.
  - Fix any inconsistency, and write the fix in `Unplanned`.
- Added: なし

## 3.slice-concern

### Types

なし

### Steps

1. `.pi/skills/plan/SKILL.md`
   1. update: ステップ 4 の `7.` を `Decide the slices by the concern the change carries.` に変える。
   2. add: ステップ 4 に、スライスの見出しが関心を名指し、その最初の行が関心を 1 文で述べることを足す。
   3. drop: `Notes` の `Different checks mean different slices.` と `One check closes the parts together.`。
   4. update: `Notes` の「One slice closes with one `Verify`.」を「One slice closes with the checks that prove it.」に変える。
   5. update: レビューの `Slice` の観点「the slice that closes with its check」を「the slice whose concern its heading names, and whose closure its `Verify` proves」に変える。
   6. drop: ステップ 4 の `9.` 「Keep the same place together.」。場所をスライスの境界にしない。
   7. update: ステップ 4 の `11.` を「Write `Steps` as a file and its substeps, one change per line, carrying the ADR's `Add`, `Update` and `Drop` without omission.」だけにし、「Keep steps that touch the same place in one slice.」を落とす。
   8. update: 残るステップの番号を 1 つずつ繰り上げる（`10.` から `14.` までが `9.` から `13.` になる）。

2. `.pi/skills/plan/references/format.md`
   1. update: `## Slices` に、見出しが関心を名指し、最初の行がその関心を 1 文で述べることを足す。
   2. update: `## Verify` の「`Verify` is what closes the slice.」を「`Verify` proves that the slice is closed.」に変える。

3. `.pi/skills/work/SKILL.md`
   1. update: 「The reviewer reads each `Verify` by what closes its slice.」を「The reviewer reads each `Verify` by what it proves.」に変える。

### Policy

- Allowed:
  - 1 つのスライスが複数の `Added` の検査を持つ
  - スライスの関心に沿って、触る場所を分ける
- Forbidden:
  - `Verify` をスライスの境界の基準に戻すこと - 024 は check の基準を削除したため
  - 閉じていないスライスを plan に書くこと - コミットの後も全体が動く必要があるため

### Verify

- Always:
  - the tests related to this slice (`pnpm test:related .pi/skills/plan/SKILL.md .pi/skills/plan/references/format.md .pi/skills/work/SKILL.md`; `pnpm test:run` when nothing is related)
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - the read-through: read every changed file whole, and every file it names whole.
  - Follow the procedure in the order the file gives, as the one who acts on it.
  - Check the number, the path, the name and the shape at each place against what it points to.
  - Fix any inconsistency, and write the fix in `Unplanned`.
- Added: なし

## 4.premise

### Types

なし

### Steps

1. `.pi/skills/work/SKILL.md`
   1. update: `### 5. Clean the tests` の `View` を `Drop`（4 つ）と `Fix`（2 つ）に分ける。
   2. update: ステップ 2 を `Drop the tests it finds, fix the premises it finds, and keep the suite green.` に変える。
   3. add: `## Notes` の `Unplanned` の説明に、直した前提を書くことを足す。

   ```md
   View:

   Drop:

   - two or more tests that check the same behavior
   - a test for a behavior that is gone
   - a test for a branch this plan's change stops making
   - a test the plan's `## Test cases` would not write

   Fix:

   - a test that hides the premise the behavior needs: move the premise into the test, and leave only the values that do not affect the behavior in the setup.
   - a test that builds a premise another test already shares: share it when nobody changes it, and keep a mutable premise in each test.
   ```

2. `.pi/skills/work/references/tasks.md`
   1. update: `## Clean the tests` のフェンスの中を、4 つの `IF`（落とす）と 2 つの `IF`（直す）と報告の step にする。直す 2 つは、次の文を `IF` の形にする。最後に、どの条件にも当てはまらないときの受け皿（`IF none of the above` → そのテストを残す）を置く。

      ```text
      a test that hides the premise the behavior needs: move the premise into the test, and leave only the values that do not affect the behavior in the setup.
      a test that builds a premise another test already shares: share it when nobody changes it, and keep a mutable premise in each test.
      ```

3. `.pi/skills/plan/references/format.md`
   1. update: `## Test cases` の「A step writes one, the reviewer reads one, and the work's cleanup drops one.」を「A step writes one, the reviewer reads one, and the work's cleanup drops one or fixes its premise.」に変える。

### Policy

- Allowed:
  - 共有するのは、誰も変更しない前提だけ
  - 変更される前提は、各テストが持つ
- Forbidden:
  - 前提を隠すテストを落とすこと - 前提をテスト本体に移せば済むため、テスト自体は正しい
  - 変更される前提を共有すること - 他のテストが落ちるため

### Verify

- Always:
  - the tests related to this slice (`pnpm test:related .pi/skills/work/SKILL.md .pi/skills/work/references/tasks.md .pi/skills/plan/references/format.md`; `pnpm test:run` when nothing is related)
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - the read-through: read every changed file whole, and every file it names whole.
  - Follow the procedure in the order the file gives, as the one who acts on it.
  - Check the number, the path, the name and the shape at each place against what it points to.
  - Fix any inconsistency, and write the fix in `Unplanned`.
- Added: なし

## 5.advice

### Types

なし

### Steps

1. `.pi/skills/adr/SKILL.md`
   1. update: `## How not to write this` の各項目を、下の形にする。続きの文は、その項目の入れ子にする。句点を揃える。
   2. drop: `Do not write an adopted change as a line of `DEFINITION.md`. That is the plan's work.`（`Do not write `DEFINITION.md` itself.` と同じことを言っているため）。

   ```md
   ## How not to write this

   - <the situation>: do not <what>. <the reason>.
   - <the situation>: do not <what>. <the reason>.
     - <the continuation of this item>
   ```

2. `.pi/skills/plan/SKILL.md`
   1. update: `## How not to write this` の各項目を、手順 1 の形にする。
   2. add: スライスの見出しと最初の 1 文を指す項目を足す。

      ```text
      - When you write a slice: do not leave its concern to the name alone. The heading names it, and the first line says it in one sentence.
      ```

3. `.pi/skills/work/SKILL.md`
   1. update: `## How not to write this` の各項目を、手順 1 の形にする。続きの 4 文（`The subagents write their own records there.`、`The agent writes the Acceptance section.`、`A dropped plan's plan md is copied, not authored.`、`It goes in the record.`）を、それぞれの項目の入れ子にする。
   2. add: clean test の `Fix` の観点を指す項目を足す。

      ```text
      - When you clean the tests: do not drop a test that hides its premise. Move the premise into the test; the test itself is right.
      ```

4. `.pi/skills/close/SKILL.md`
   1. update: `## How not to write this` の各項目を、手順 1 の形にする。

5. `.pi/skills/upgrade/SKILL.md`
   1. update: `## How not to write this` の各項目を、手順 1 の形にする。`Both are read from the project.` を、前の項目の入れ子にする。

6. `.pi/skills/yolo/SKILL.md`
   1. update: `## How not to write this` の各項目を、手順 1 の形にする。

### Policy

- Allowed:
  - 自明な項目を削除する
  - 想定に名前を付ける
- Forbidden:
  - 想定のない項目を残すこと - 読者が、どのようなときに効く規則か判断できないため
  - 禁止でない文を、項目と同じ高さに置くこと - どの項目の補足か分からないため

### Verify

- Always:
  - the tests related to this slice (`pnpm test:related .pi/skills/adr/SKILL.md .pi/skills/plan/SKILL.md .pi/skills/work/SKILL.md .pi/skills/close/SKILL.md .pi/skills/upgrade/SKILL.md .pi/skills/yolo/SKILL.md`; `pnpm test:run` when nothing is related)
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - the read-through: read every changed file whole, and every file it names whole.
  - Follow the procedure in the order the file gives, as the one who acts on it.
  - Check the number, the path, the name and the shape at each place against what it points to.
  - Fix any inconsistency, and write the fix in `Unplanned`.
- Added: なし

## Notes

### Slice 1: field-reference

- Findings: なし
- Unplanned: なし
- Commit: 9a913fe base(readable-rules): shape field references as field, table, rules
- Stopped: なし

### Slice 2: task-shape

- Findings: なし
- Unplanned: なし
- Commit: acae805 base(readable-rules): shape subagent tasks as job, steps, report
- Stopped: なし

### Slice 3: slice-concern

- Findings: なし
- Unplanned: ステップの追加で、plan の 1.8 の例（`10.` から `14.` までが `9.` から `13.` になる）と番号が 1 つずれた。名前の規則を `8.` に入れ、`9.` を落としたので、残りは `10.` から `14.` のままである。
- Commit: a2e49cd base(readable-rules): cut slices by concern, prove closure with Verify
- Stopped: なし

### Slice 4: premise

- Findings: なし
- Unplanned: なし
- Commit: 5615f7f base(readable-rules): split clean-test view into drop and fix
- Stopped: なし

### Slice 5: advice

- Findings: なし
- Unplanned: `adr` の「Do not leave `Keep`/`Denied` in the new shape.」を落とした。058 で `Keep`/`Denied` は `Adopted` と `Policy` に置き換わり、いまの形にその欄はないため、自明な項目になった。
- Commit: e9068b4 base(readable-rules): start each advice item with its situation
- Stopped: なし

### Cleanup: 文書のみのため掃除なし

- Findings: なし
- Unplanned: なし
