# ADR 059

## 01: references の format とタスクは、フラットな箇条書きの羅列ではなく、読者が迷わない形をどのように書くか

### Scope

- In:
  - refactor: 参照ファイルの形を、セクションの順序と役割が読み取れる形に変える。
  - naming: 新しい形のためにセクションや見出しの名前を付ける場合を含む。SKILL.md が名前で参照しているセクションは、名前を変えるなら参照側も直す。
  - format: 見出しの順序、表の形、フェンスの使い方を決める。
  - prose: 規則の文を新しい形に合わせて書き直す。意味は変えない。
  - compatibility: SKILL.md、他の参照ファイル、plan md を読む側がセクションの名前と形を参照しているため、整合を取る。
- Out:
  - behaviour: 規則の内容は変えない（01 は書き方だけを扱い、内容は 02 と 03 が扱う）。
  - dependency: パッケージ、ライブラリ、外部契約は扱わない。
  - speed: 作業時間や資源の上限は設定しない。
  - security: 秘密情報、権限、露出は扱わない。
  - errors: 検査、テスト、検証の追加や変更はしない（01 は書き方だけを扱う）。
  - deploy: 配布やリリースはない。
  - migration: 過去のサイクルの記録は移行しない（記録はその時点の形で残す）。
  - logs and monitoring: 記録や通知は変えない。

### Context

- C1: 参照ファイルは 11 個で、5 つのスキルが持つ。adr は `adr.format.md`・`affected.format.md`・`tasks.md`、close は `format.md`・`tasks.md`、plan は `format.md`・`cut.md`・`tasks.md`、upgrade は `report.md`・`tasks.md`、work は `tasks.md` である。yolo は持たない（`.pi/skills/adr/references/`、`.pi/skills/close/references/`、`.pi/skills/plan/references/`、`.pi/skills/upgrade/references/`、`.pi/skills/work/references/`）。
- C2: `## Shape` のフェンスに見本を置くのは 5 ファイルである（`.pi/skills/adr/references/adr.format.md:7-50`、`.pi/skills/adr/references/affected.format.md:7-25`、`.pi/skills/close/references/format.md:5-44`、`.pi/skills/plan/references/format.md:7-123`、`.pi/skills/upgrade/references/report.md:5-36`）。
- C3: tasks 系の 5 ファイルは、タスク本文のフェンスを置き、そのあとに補足の規則を 1 文 1 箇条書きで並べる（`.pi/skills/adr/references/tasks.md:5-59`、`.pi/skills/close/references/tasks.md:5-16`、`.pi/skills/plan/references/tasks.md:5-63`、`.pi/skills/upgrade/references/tasks.md:5-32`、`.pi/skills/work/references/tasks.md:5-81`）。
- C4: `cut.md` は `## Present` のフェンスに提示の形を置き、そのあとの平らな箇条書きで欄の意味を説明する（`.pi/skills/plan/references/cut.md:22-49`）。
- C5: `One bullet is one sentence.` は 9 か所にある。8 か所は `## Writing` の中で、`A file name is written from the project root.` を伴う（`close/references/format.md:120-121`、`close/references/tasks.md:20-21`、`plan/references/cut.md:64-65`、`plan/references/format.md:340-341`、`plan/references/tasks.md:67-68`、`upgrade/references/report.md:49-50`、`upgrade/references/tasks.md:36-37`、`work/references/tasks.md:85-86`）。9 か所目は `adr/references/adr.format.md:55` の `## Entries` である。`adr.format.md` の `## Writing` は別の内容で、`adr/references/tasks.md` と `affected.format.md` は `## Writing` を持たない（`.pi/skills/adr/references/adr.format.md:112-114`）。
- C6: 規則は 1 文 1 箇条書きなので、1 つの規則が複数文になると行が分かれ、どこまでが 1 つの規則かは文から読み取るしかない。`plan/references/format.md` の `## Files` と `## Verify` は、規則だけが平らに並ぶ（`.pi/skills/plan/references/format.md:149-165`、`:217-254`）。
- C7: 規則と、その説明・例・例外が同じ高さで並ぶ箇所がある。`## Verify` は `Always` と `Added` の入れ子のあとに例外の規則が続く（`.pi/skills/plan/references/format.md:231-254`）。
- C8: セクションの名前を名指しする参照がある。`adr/SKILL.md` は `Look it up`・`Look at the affected`・`Try it`・`Decision`・`Definition` を、`work/SKILL.md` は `Slices`・`Clean the tests`・`Review`・`Fixes`・`Acceptance's findings` を名指しする（`.pi/skills/adr/SKILL.md:120`、`:142`、`:176`、`:190`、`:214`、`.pi/skills/work/SKILL.md:83`、`:119`、`:151`、`:164`、`:211`）。
- C9: `plan/references/tasks.md:47` と `work/references/tasks.md:47` は、`plan/references/format.md` の `## Test cases` を名指しする（`.pi/skills/plan/references/tasks.md:47`、`.pi/skills/work/references/tasks.md:47`）。
- C10: 表は、対応を書く箇所にだけ使われている。13 kind の表（`.pi/skills/adr/references/adr.format.md:61-77`）と、Triage の束の規則（`.pi/skills/close/references/format.md:72-83`）である。
- C11: 参照ファイルを読むのは、エージェント自身と、`code`・`review`・`proofreader` のサブエージェントである。`code` は `plan/references/format.md` の形で記録を書き、`review` は `## Test cases` を読み、`proofreader` は `plan` と `close` の `format.md` を読む（`.pi/skills/work/references/tasks.md:11`、`:47`、`.pi/skills/plan/SKILL.md:220`、`.pi/skills/close/SKILL.md:209`）。
- C12: オーナーの要望は、references の format とタスクが、フラットな箇条書きの羅列で説明されており、分かりづらいということである（`ROADMAP.md` の 024 の ideas）。
- C13: 023 の決定は、内容の脱落を許可せず、重複と冗長は整理することである（`ROADMAP.md` の 023 の ideas）。
- C14: 01 の Scope は、規則の内容を変えず、書き方だけを変える。セクションの名前を変える場合は、名指ししている SKILL.md と他の参照ファイルも直す（`adr.md` の `## 01:` の `Scope`）。
- C15: 構造化の見本は SKILL.md の `Steps`・`View`・`Notes` である。手順は番号、判断材料は表、補足は箇条書きに分かれる（`.pi/skills/adr/SKILL.md:66-97`、`.pi/skills/plan/SKILL.md:74-141`）。
- C16: 01 の形は 2 つである。記録の形を決める文書を「欄の参照」にし、サブエージェントに渡す文書を「タスク」にする。どちらもセクションの名前は変えず、`## Shape` の見本フェンスは欄の参照のファイルに残す。

`````md
**Shape 1: a field reference** — `adr.format.md`, `affected.format.md`, `close/format.md`, `plan/format.md`, `upgrade/report.md`, `plan/cut.md`

- `## Shape` holds the whole record as a fence, above the field sections.
- A field section has the field's name, one line of what the field is, and the rules.
- The table appears only where a fixed set of values or forms exists.
- An exception is a bullet under the rule it limits.

```md
## <field>

<what the field is, one line>

| <value or form> | <what it means> |
| --------------- | --------------- |

- <rule>.
- When <condition>, <rule>.
  - Exception: <what the exception is>.
```

**Shape 2: a task** — `adr/tasks.md`, `close/tasks.md`, `plan/tasks.md`, `upgrade/tasks.md`, `work/tasks.md`

- The fence holds what the subagent reads: the job in one line, then numbered steps.
- A branch is `IF <condition> → <action>`, and the last one is the catch-all.
- The last step is the report.
- The agent's own rules stay outside the fence, as bullets.

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

**`## Writing`** — `One bullet is one sentence.` becomes `One bullet is one rule.` in the 9 places that carry it.
`````

### Research & Trial

- F1 (C2): Agent Skills の仕様は、`references/` を「必要になったときにエージェントが読む追加の文書」とし、読み込みを metadata、`SKILL.md`、resources の 3 段階に分ける。目安は `SKILL.md` を 500 行未満に保つこと、個々の参照ファイルを焦点の絞れたものに保つこと、参照を `SKILL.md` から 1 階層までに保つことである。出所: https://agentskills.io/specification の `## Optional directories`、`### references/`、`## Progressive disclosure`、`### Body content`、`## File references`。
- F2 (C6): 公開されている Agent Skills の `pdf` skill の `reference.md` は、`## Shape` の見本フェンスも「1 文 1 箇条書き」の宣言も持たず、見出しごとに概要の段落とコードフェンスを置き、例外は `## Troubleshooting Common Issues` に集める。出所: https://raw.githubusercontent.com/anthropics/skills/main/skills/pdf/reference.md の見出し列と `## Troubleshooting Common Issues`。
- F3 (C7): 同じ `pdf` skill の `forms.md` は、冒頭に `CRITICAL: You MUST complete these steps in order.` を置き、分岐をフェンス内のスクリプト（`check_fillable_fields`）の結果で分割し、`Approach A: Structure-Based Coordinates`、`Approach B: Visual Estimation`、`Hybrid Approach` の 3 つと `Step 1`〜`Step 4` を別のセクションにする。出所: https://raw.githubusercontent.com/anthropics/skills/main/skills/pdf/forms.md。
- F4 (C6): RFC 2119 は要件の強さを MUST・SHOULD・MAY の語で区別し、RFC 8174 は大文字で書かれたときだけにその意味を持たせる。RFC 2119 は MUST の使用を「相互運用に本当に必要か、害を制限する場合」に絞れと定める。出所: https://datatracker.ietf.org/doc/html/rfc2119 の §1〜§6、https://datatracker.ietf.org/doc/html/rfc8174.html の §2。
- F5 (C7): Python 言語リファレンスは、正例と誤例のコードを並べ、誤例の理由を括弧書きでその直後に置き、例外と変更を `Note`・`See also`・`Changed in version` のラベルで本文から分ける。記法は `## 1.2. Notation` の 1 セクションに集約する。出所: https://docs.python.org/3/reference/lexical_analysis.html の `## 2.1`〜`## 2.5`、`### 2.1.8`、https://docs.python.org/3/reference/introduction.html の `## 1.2. Notation`。
- F6 (C7): 運用手順書は、1 つの action を Condition・Mode・Command・Verify・Rollback-recovery・Escalate の 6 項目に分割し、条件と実行を別の項目にする。分岐は `IF <condition> → <action>` を並べ、`none of the above / unclear → Escalate` の受け皿を必ず置き、深さを 2〜3 階層に抑える。出所: https://handbook.reopt.ai/en/books/agentic-documentation/runbook の `## Action Format`、https://docs.company-gpt.com/en/tutorials/skills/operations/runbook-skill/ の `### Decision Point Structure`、`### Decision Tree Design Rules`。
- F7 (C2): セクションの分け方には 2 つの型がある。成果物の見本のセクション名に規則を対応させる型（このリポジトリの `## Shape`、`plan/references/format.md` の `## Goal` から `## Writing` まで）と、用途・熟達度・役割でセクションを分ける型（`pdf` skill の機能別と熟達度別、runbook の条件系と実行系）である。出所: 上の F2、F6、`.pi/skills/plan/references/format.md` の見出し列。
- F8 (C15): 手順の型には、1 step を Action・Expected・If unexpected・Verify・Caution・Rollback の 6 項目に分ける形がある。原則は 1 step 1 action、命令形、各 step の期待結果、明示的な検証、前提知識を仮定しないことである。出所: https://docs.company-gpt.com/en/tutorials/skills/operations/runbook-skill/ の `### Step-by-Step Procedure`、`### Writing Principles for Runbook Steps`。
- F9 (C12): 公開されている Agent Skills の `references` の網羅的な型の分類はできていない。一次資料で確認したのは `anthropics/skills` の `pdf` skill の 3 ファイルだけであり、横断検索は Exa の無料枠の制限（429）で止まり、他の skill の `references/` の配置まで広げられなかった。出所: 調査の報告。

### Decision

- Status: **accepted**
- Adopted: 参照ファイル 11 個が、記録の形を決める「欄の参照」と、サブエージェントに渡す「タスク」の 2 つの形になる（C16, F2, F6, F8）。
  - Add:
    - 欄ごとの「何か」の 1 行、値の組があるときの表、条件つきの規則、例外の入れ子（C16, F2）
    - タスクの番号の手順、`IF` の分岐、受け皿、報告の step（C16, F6, F8）
  - Update:
    - 平らな箇条書きのセクションを、2 つの形に書き直す（C6, C7, C16）
    - `One bullet is one sentence.` を、9 か所で `One bullet is one rule.` に変える（8 か所の `## Writing` と `adr.format.md:55` の `## Entries`）（C5, C16）
  - Drop:
    - 「1 文 1 箇条書き」の規則（C5, C16）
- Policy:
  - Allowed:
    - セクションの中を `###` の話題で分ける（C6）
    - 値の組があるセクションにだけ表を置く（C10）
    - フェンスの外に、エージェント自身の規則を残す（C11）
  - Forbidden:
    - 規則の内容を変えること - 01 は書き方だけを扱うため（C14）
    - セクションの名前を、名指ししている参照を直さずに変えること - SKILL.md と `tasks.md` が名前で参照しているため（C8）

### Definition

- `Unit.adr-skill`(kept): オーナーが決め、エージェントが記録できるという主な機能は変わらず、変わるのは参照ファイルの書き方である。
- `Unit.plan-skill`(kept): エージェントが、1 plan 分の作業の形と順序を決めて書けるという主な機能は変わらず、変わるのは参照ファイルの書き方である。
- `Unit.work-skill`(kept): エージェントが、plan を 1 つずつ片付けられるという主な機能は変わらず、変わるのは参照ファイルの書き方である。
- `Unit.close-skill`(kept): エージェントが、サイクル終了後に、クロージングできるという主な機能は変わらず、変わるのは参照ファイルの書き方である。
- `Unit.upgrade-skill`(kept): エージェントが、依存パッケージをアップグレードし、監査まで終えられるという主な機能は変わらず、変わるのは参照ファイルの書き方である。

## 02: plan のスライスは、閉じた変更として関心を 1 つにするために、どのような基準で切り、Verify をどこに置くか

### Scope

- In:
  - behaviour: スライスを切る手順と、plan md に書くスライスの意味を変える。エージェントが plan を書くときの行動が変わる。
  - refactor: `plan/SKILL.md` の手順と、`plan/references/format.md` の `## Slices` の形を変える。
  - naming: スライスの基準に名前を付ける場合を含む。
  - format: plan md の `## Slices` と `### Verify` のセクションの形を変える。
  - prose: 基準の文を書き直す。
  - compatibility: `work` の `### Slice N` の記録、`close/scripts/collect.mjs`、`yolo/SKILL.md`、plan を読む `review`・`code`・`proofreader` の参照と整合を取る。
  - errors: `Verify` は検査である。スライスを閉じる基準から外すことで、検査とスライスの関係が変わる。
- Out:
  - dependency: パッケージ、ライブラリ、外部契約は扱わない。
  - speed: 作業時間や資源の上限は設定しない。
  - security: 秘密情報、権限、露出は扱わない。
  - deploy: 配布やリリースはない。
  - migration: 過去のサイクルの plan md は移行しない（記録はその時点の形で残す）。
  - logs and monitoring: 新しい記録や通知は増やさない。

### Context

- C1: いまの `plan/SKILL.md` の `## Procedure` は 9 つのステップを持ち、ステップ 4 の `7.` が `Decide the slices by the check that closes them.`、`8.` が `Order the slices by dependency.`、`9.` が `Keep the same place together.`、`10.` が `Put a slice that reads another slice's output after it.`、`11.` が `Keep steps that touch the same place in one slice.` である（`.pi/skills/plan/SKILL.md:74-88`）。
- C2: いまの `Notes` は「One slice closes with one `Verify`.」「Different checks mean different slices.」「One check closes the parts together.」「A subagent may carry several slices in one run.」を持ち、レビューの `Slice` は `the slice that closes with its check` である（`.pi/skills/plan/SKILL.md:126-129`、`:199`）。
- C3: いまの plan md のスライスは `## 1.<スライス名>` の下に `### Types`、`### Steps`、`### Policy`、`### Verify` を置く（`.pi/skills/plan/references/format.md:41-82`）。
- C4: いまの `## Verify` は、`Verify` がスライスを閉じるものと定め、`Always` を全スライスで同じ、`Added` を変更が決めるものとし、`It is not what to test.` を持つ（`.pi/skills/plan/references/format.md:217-254`）。
- C5: `## Policy` は `### Policy` を `Steps` と `Verify` の間に置くと定める（`.pi/skills/plan/references/format.md:212-215`）。
- C6: いまの work は「For each slice: its `Steps` and its `Policy`, then its `Verify`, then commit」と定め、「A filled `Commit` means that slice's check passed.」「The agent closes no slice whose check the subagent did not run.」を持つ（`.pi/skills/work/references/tasks.md:11`、`:19`、`.pi/skills/work/SKILL.md:98-99`）。
- C7: いまの work は `## Notes` に `### Slice N: <name>` を書き、名前をスライスの見出し `## 1.<name>` から写す（`.pi/skills/plan/references/format.md:276-277`、`.pi/skills/work/references/tasks.md:11`）。
- C8: `close/scripts/collect.mjs` は `## Notes` の `### Slice N` を読み、出どころを `Slice N (名前)` として記録する（`.pi/skills/close/scripts/collect.mjs:33`、`:178-194`、`.pi/skills/close/references/format.md:53`）。
- C9: `yolo/SKILL.md` は plan の項目（goal、files、slices、types、steps、policy、verify、record）と、レビューの 5 観点（`Goal`、`Design`、`Files`、`Slice`、`Other`）を名指しする（`.pi/skills/yolo/SKILL.md:32`、`:34`）。
- C10: `close/SKILL.md` は `ex-` プランを「the plan skill, steps 4 to 9」で作らせ、work で走らせる（`.pi/skills/close/SKILL.md:182`、`:232`）。
- C11: plan のレビューは `Slice` の下の `Verify` を「a `Verify` that does not run as written, one that is red with the change in place, and a check that stays green with the behavior removed」で見る（`.pi/skills/plan/SKILL.md:203`、`.pi/skills/plan/references/tasks.md:19`）。
- C12: オーナーは、スライスを閉じた変更とし、関心を 1 つにし、`Verify` で切る今の基準を削除することを決めた（`ROADMAP.md` の 024 の ideas）。
- C13: plan のステップは、`affected` のファイル群に ADR の `Add`・`Update`・`Drop` を当てる形であり、1 つの変更を 1 行にし、ファイルごとに細分化する（`.pi/skills/plan/SKILL.md:86`、`cycles/261109-058-dev/adr.md` の 02 の `Decision`）。
- C14: 01 の決定により、`plan/references/format.md`、`plan/references/tasks.md`、`plan/references/cut.md` は「欄の参照」と「タスク」の 2 つの形に書き換えられる。02 はその形の上でスライスの内容を変える（`adr.md` の `## 01:` の `Decision`）。
- C15: 02 の Scope は behaviour、refactor、naming、format、prose、compatibility、errors を In とする（`adr.md` の `## 02:` の `Scope`）。
- C16: 02 の形は Option A である。スライスは「1 文で言える 1 つの関心」で切り、閉じているかはそのあとの検査で証す。`Verify` は各スライスに残り、閉じたことを証す。

```md
**A slice**

- One slice is one concern. Its heading names the concern, and its first line says what it is in one sentence.
- The sentence names one thing, not two joined by "and".
- A slice is closed: after its commit, `pnpm typecheck`, `pnpm lint`, `pnpm format:check` and the related tests pass.
- `Verify` proves the closure and stays in every slice. A slice carries every `Added` check it needs.
- The check does not decide the boundary: `Different checks mean different slices.` and `One check closes the parts together.` go.
- The cutting step reads `Decide the slices by the concern the change carries.`
- The note reads `One slice closes with the checks that prove it.`
```

### Research & Trial

- F1 (C12): Google の small CLs は、単位を `one self-contained change` とし、`addresses just one thing`、CL の後もシステムと開発者のために動き続けることを求める。関連するテストは同じ CL に置き、独立したテストの改修は先行する別の CL にできる。出所: https://google.github.io/eng-practices/review/developer/small-cls.html の `What is Small?`、`Keep related test code in the same CL`。
- F2 (C2): Google は、依存する CL が複数あるとき、各 CL を提出した後も全体が動き続けることを求める（`Don't Break the Build`）。出所: 同 `Don't Break the Build`。
- F3 (C12): Google と Chromium は、リファクタリングを振る舞いの変更や不具合の修正とは別の CL に分けることを勧め、Chromium は `CLs should only effect one type of change` と定める。出所: 同 `Separate Out Refactorings`、https://chromium.googlesource.com/chromium/src/+/main/docs/cl_tips.md の `Separate behavior changes from refactoring`。
- F4 (C12): リファクタリングは小さな振る舞い保存の変換の連続であり、各変換の後も系が動き、既存のテストが通ることを求める。出所: https://refactoring.com/、https://refactoring.guru/refactoring/how-to。
- F5 (C12): 2 つの帽子は、振る舞いの変更と構造の変更を同時に行わない型であり、機能はテストと一緒に足し、構造は振る舞いを変えずに整える。考案は Kent Beck である。出所: https://devlead.io/DevTips/TwoHats。
- F6 (C12): atomic commit は 1 つのコミットを 1 つの論理的な変更とし、無関係な編集を混ぜない。Conventional Commits は、1 つのコミットが複数の型に当たるときは複数に戻すことを求める。出所: https://guidebook.seedcase-project.org/workflows/commits、https://www.conventionalcommits.org/en/v1.0.0/ の FAQ。
- F7 (C6): 継続的インテグレーションは各コミットを参照環境で検証し、green になるまで統合の完了としない。コミットの前に置く検査（pre-commit）は、非ゼロの終了でコミット自体を作らせない。出所: https://martinfowler.com/articles/continuousIntegration.html、https://www.atlassian.com/git/tutorials/git-hooks、https://git-scm.com/docs/githooks。
- F8 (C12): 取得できなかった問い: Google の testing blog の small PR の記事、Gerrit の `dev-crafting-changes`、Google の `looking-for` は、`fetch_content` の抽出が `Not found in extracted page content` を返して原文を取れなかった。Exa の無料枠の制限（429）も一部の検索で止まった。出所: 調査の報告。

### Decision

- Status: **accepted**
- Adopted: plan のスライスが、check ではなく「1 文で言える 1 つの関心」で切られ、`Verify` が閉じたことを証す形になる（C16, F1）。
  - Add:
    - スライスの見出しが関心を名指し、最初の行がその関心を 1 文で言う（C16）
  - Update:
    - `Decide the slices by the check that closes them.` を `Decide the slices by the concern the change carries.` に変える（C16, F1）
    - 「One slice closes with one `Verify`.」を「One slice closes with the checks that prove it.」に変える（C16, F7）
    - `plan/SKILL.md:199` の `Slice` の観点「the slice that closes with its check」を、関心と閉じたことで読む形に変える（C16）
    - `plan/references/format.md:219` の「Verify is what closes the slice.」を、閉じたことを証す形に変える（C16）
    - `work/SKILL.md:156` の「The reviewer reads each `Verify` by what closes its slice.」を、証すものとして読む形に変える（C16）
  - Drop:
    - `Different checks mean different slices.` と `One check closes the parts together.`（C12, C16）
    - `plan/SKILL.md` のステップ 4 の `9.` 「Keep the same place together.」と、`11.` の「Keep steps that touch the same place in one slice.」 - 場所をスライスの境界にしないため（C16, C12）
- Policy:
  - Allowed:
    - 1 つのスライスが複数の `Added` の検査を持つ（C16, F1）
    - スライスの関心に沿って、触る場所を分ける（C16）
  - Forbidden:
    - `Verify` をスライスの境界の基準に戻すこと - 024 は check の基準を削除したため（C12）
    - 閉じていないスライスを plan に書くこと - コミットの後も全体が動く必要があるため（C6, F1）

### Definition

- `Unit.plan-skill`(kept): エージェントが、1 plan 分の作業の形と順序を決めて書けるという主な機能は変わらず、変わるのはスライスの切り方と `Verify` の役割である。
- `Unit.work-skill`(kept): エージェントが、plan を 1 つずつ片付けられるという主な機能は変わらず、変わるのはスライスを閉じる検査の位置づけである。
- `Unit.close-skill`(kept): エージェントが、サイクル終了後に、クロージングできるという主な機能は変わらず、`close` が読むのは `### Slice N` という名前だけで、その名前は変わらない。
- `Unit.yolo-skill`(kept): エージェントが、オーナーの確認を挟まずにクローズのトリアージまで進めることができるという主な機能は変わらず、plan の項目の名前（slices、verify）は変わらない。

## 03: work の clean test は、追加されたテストの前提と共有すべき前提を、どの観点で見るか

### Scope

- In:
  - behaviour: clean test が落とすテストと、その結果が変わる。
  - refactor: `View` の観点の並びと、`tasks.md` のタスク本文の形を変える。
  - format: `View` とタスク本文の箇条書きの形を変える。
  - prose: 観点の文を書き加える。
  - compatibility: `plan/references/format.md` の `## Test cases` の前提の規則、work のレビューの `Noise`、plan のレビューの `Cases` と整合を取る。
  - errors: 観点はテストへの検査である。落とすテストの判断が変わる。
- Out:
  - dependency: パッケージ、ライブラリ、外部契約は扱わない。
  - naming: 新しい名前は付けない（`premise` は `## Test cases` にすでにある）。
  - speed: 作業時間や資源の上限は設定しない。
  - security: 秘密情報、権限、露出は扱わない。
  - deploy: 配布やリリースはない。
  - migration: 過去のサイクルの plan md は移行しない。
  - logs and monitoring: 記録の欄（`Findings`、`Unplanned`）は変えない。

### Context

- C1: いまの `work/SKILL.md` の `### 5. Clean the tests` は、ステップ 2 つ（「Continue the `code` subagent that ran the slices.」「Drop what it finds, and keep the suite green.」）と、4 つの観点から成る `View` を持つ（`.pi/skills/work/SKILL.md:101-114`）。
- C2: その 4 つの観点は、重複するテスト、消えた振る舞いのテスト、作られなくなった分岐のテスト、plan の `## Test cases` に書かれていないテストである（`.pi/skills/work/SKILL.md:110-113`）。
- C3: `work/references/tasks.md` の `## Clean the tests` は、同じ 4 つをフェンスのタスク本文に書き、4 つ目だけを「a premise the types, the schema or the DB already settle, one nobody would notice, or an `Add`, `Update` or `Drop` line with no case」として具体化する（`.pi/skills/work/references/tasks.md:21-31`）。
- C4: clean test はスライスではなく、`## Notes` の `### Cleanup: <what it cleaned>` に `Findings` と `Unplanned` を書く（`.pi/skills/work/SKILL.md:123-129`、`.pi/skills/plan/references/format.md:278-279`）。
- C5: いまの `## Test cases` は、「A `<given>` names a premise that can be built one way.」「A premise the types, the spec, the schema or a DB constraint already guarantees is not reproduced in a test.」「Dummy data comes from a factory function, not from a literal written at each test.」を持つ（`.pi/skills/plan/references/format.md:256-272`）。
- C6: work のレビューの `Noise` は `a test the types, the schema or a DB constraint already settle, or one nobody would notice; a case written with a magic number or a hardcoded string` を見る（`.pi/skills/work/references/tasks.md:46`）。
- C7: plan のレビューの `Cases` は「the test steps' cases against `## Test cases`」を見る（`.pi/skills/plan/SKILL.md:204`、`.pi/skills/plan/references/tasks.md:20`）。
- C8: いまの clean test の観点には、前提の置き方を見るものがなく、前提の共有を見るものもない（`.pi/skills/work/SKILL.md:110-113`、`.pi/skills/work/references/tasks.md:25-28`）。
- C9: オーナーの要望は、追加されたテストについて、テスト自体の可否ではなく、振る舞いを確かめるための前提が正しく置かれているかを見ることであり、前提を共有すべきテストが同じ前提を使っているかを見ることである（`ROADMAP.md` の 024 の ideas）。
- C10: 023 の決定は、内容の脱落を許可せず、重複と冗長は整理することである（`ROADMAP.md` の 023 の ideas）。
- C11: 03 の Scope は behaviour、refactor、format、prose、compatibility、errors を In とする（`adr.md` の `## 03:` の `Scope`）。
- C12: 01 の決定により、`work/references/tasks.md` は「タスク」の形（フェンスの中の番号の手順と `IF` の分岐）に書き換えられる。03 はその形の上で観点を足す（`adr.md` の `## 01:` の `Decision`）。
- C13: 02 の決定により、スライスは関心で切り、`Verify` が閉じたことを証す。clean test はスライスではないので、その変化の外にある（`adr.md` の `## 02:` の `Decision`）。
- C14: 03 の形は Option A である。clean test の `View` を `Drop` と `Fix` に分ける。落とす 4 つはそのままにし、前提を隠すテストと、共有すべき前提を作り直すテストの 2 つを `Fix` に置く。直した前提は `Unplanned` に書く。

```md
**Clean the tests**

- `View` has two parts, `Drop` and `Fix`.
- `Drop` is the four kinds the step already has.
- `Fix` is two kinds, and neither of them drops the test.
  - a test that hides the premise the behavior needs: move the premise into the test, and leave only the values that do not affect the behavior in the setup.
  - a test that builds a premise another test already shares: share it when nobody changes it, and keep a mutable premise in each test.
- The step reads `Drop the tests it finds, fix the premises it finds, and keep the suite green.`
- A fixed premise goes in `## Notes`'s `### Cleanup` under `Unplanned`.
```

### Research & Trial

- F1 (C9): xUnit Test Patterns は、各テストが自分のための新しい fixture を作る Fresh Fixture を既定とし、複数のテストで同じ fixture を使い回す Shared Fixture は、テストが遅い場合と Incremental Tests（前段階に依存する長い連鎖）の場合に限って正当とする。出所: http://xunitpatterns.com/Fresh%20Fixture.html の `When To Use It`、http://xunitpatterns.com/Shared%20Fixture.html の `When To Use It`。
- F2 (C9): Shared Fixture には、run の間だけ共有する Per-Run Fixture、誰も変更しない部分だけを共有する Immutable Shared Fixture、他が作ったものを再利用する Prebuilt Fixture がある。変更と削除の対象は各テストが持つ。他のテストがしたことを変更と見るものは共有してはならない。出所: http://xunitpatterns.com/Shared%20Fixture.html の `Implementation Notes`、`Variation: Immutable Shared Fixture`。
- F3 (C9): 前提の置き方には、テスト本体に書く Inline Setup、テストから Creation Method を呼ぶ Delegated Setup、`setUp` に置く Implicit Setup がある。Implicit Setup は同じクラスのすべてのテストが同じ fixture で足りるときだけ全体を `setUp` に置き、足りないときは結果に影響しない部分だけを置く。出所: http://xunitpatterns.com/Inline%20Setup.html、http://xunitpatterns.com/Delegated%20Setup.html、http://xunitpatterns.com/Implicit%20Setup.html の `When To Use It`。
- F4 (C9): 前提を作る型には、Creation Method、Object Mother、Test Data Builder がある。Object Mother はテストが Mother の正確な値に依存して強く結合する。Test Data Builder は既定値と `with...` の上書きで、各テストが結果に影響する値だけを知る形にする。出所: https://martinfowler.com/bliki/ObjectMother.html の最終段落、http://www.natpryce.com/articles/000714.html。
- F5 (C9): テストが前提を隠すと、Mystery Guest（原因と結果がテストの外にある）、General Fixture（必要より大きい fixture を作る）、Fragile Fixture（標準 fixture を 1 つのテストのために変えると他のテストが落ちる）になる。出所: http://xunitpatterns.com/Obscure%20Test.html、http://xunitpatterns.com/Fragile%20Test.html。
- F6 (C6): Google は、テストは complete（読者が必要とする情報を本体に全部持つ）かつ concise（無関係な情報を持たない）であることを求め、明確さのためなら DRY に反してよいとし、given / when / then を空白やコメントで区切る。出所: https://abseil.io/resources/swe-book/html/ch12.html の `Make Your Tests Complete and Concise`、`Structure tests to emphasize behaviors`。
- F7 (C6): Google は、すべてのテストが hermetic であること、共有のデータベースや実行順に依存しないことを求める。出所: https://abseil.io/resources/swe-book/html/ch11.html の `Properties common to all test sizes`。
- F8 (C9): BDD は、`Given` でシステムを既知の状態に置き、`When` で出来事を起こし、`Then` で結果を確かめる。繰り返す `Given` だけを `Background` に移し、`Background` は短く保ち、複雑な状態の準備には使わない。出所: https://cucumber.io/docs/gherkin/reference/ の `Given`、`Background`、`Tips for using Background`。
- F9 (C9): RSpec は `let` を example の間で共有しない遅延のメモ化とし、`before(:example)` を各 example の前に、`before(:context)` をグループに 1 回実行する。`before(:context)` は example の間で状態を共有する。出所: https://rspec.info/features/3-13/rspec-core/helper-methods/let/、https://rspec.info/features/3-13/rspec-core/hooks/before-and-after-hooks/。
- F10 (C9): thoughtbot は、ファイルの頂上に置いた General Fixture が Mystery Guest、Fragile、Slow を起こすとし、`shared examples` が必要になるまでは `let` と `before` などの DSL による共有を避け、変数・メソッド・クラスを使うとする。出所: https://thoughtbot.com/blog/lets-not。
- F11 (C5): いまの `plan/references/format.md` は、fixture を機能の root の `<name>.fixture.ts`、機能が持たない形は `test/` に置き、テストファイルを対象の隣に置き、ダミーの値はファクトリ関数から取ると定める。出所: `.pi/skills/plan/references/format.md:156-170`、`:272`。
- F12 (C9): 答えられなかった問い: RSpec の `let` と `before` の公式の選択基準は見つからず、動作の定義だけが確認できた。Google の `Cleanly Create Test Data`、Dan North の BDD 論文は本文を取得できなかった。出所: 調査の報告。

### Decision

- Status: **accepted**
- Adopted: clean test が、落とすテストと直す前提の 2 つを見る形になる。前提を隠すテストは落とさず、前提をテスト本体に移す形になる（C14, F5, F6）。
  - Add:
    - `Fix` の 2 つの観点（C14）
    - 直した前提を `Unplanned` に書く（C4）
  - Update:
    - ステップ 2 を `Drop the tests it finds, fix the premises it finds, and keep the suite green.` に変える（C14）
    - `plan/references/format.md:261` の「the work's cleanup drops one」を、前提を直すことも含む形にする（C11）
  - Drop:
    - なし（C10）
- Policy:
  - Allowed:
    - 共有するのは、誰も変更しない前提だけ（C14, F1, F2）
    - 変更される前提は、各テストが持つ（C14, F2）
  - Forbidden:
    - 前提を隠すテストを落とすこと - 前提をテスト本体に移せばよいため、テスト自体は正しい（C14, F5, F6）
    - 変更される前提を共有すること - 他のテストが落ちるため（C14, F2）

### Definition

- `Unit.work-skill`(kept): エージェントが、plan を 1 つずつ片付けられるという主な機能は変わらず、変わるのは clean test の観点である。
- `Unit.plan-skill`(kept): エージェントが、1 plan 分の作業の形と順序を決めて書けるという主な機能は変わらず、変わるのは `## Test cases` と `## Notes` が clean test を名指す 1 行である。

## 04: 各スキルの How not to write this は、どの項目の想定でも読者が迷わないようにし、自明な項目を残さない形にするにはどうするか

### Scope

- In:
  - behaviour: 項目を直し、自明な項目を削除すると、エージェントが従う規則が変わる。
  - refactor: 6 つの `How not to write this` の形を、項目と補足の区別が付く形に変える。
  - naming: 想定に名前を付ける場合を含む（例: worktree の plan、Round 2）。
  - format: 項目と、その補足の入れ子の形を決める。
  - prose: 項目の文を書き直す。
  - compatibility: 01・02・03 が決めた形と食い違う項目を直し、不足する項目を足す。
- Out:
  - dependency: パッケージ、ライブラリ、外部契約は扱わない。
  - speed: 作業時間や資源の上限は設定しない。
  - security: 秘密情報、権限、露出は扱わない。
  - errors: 検査は足さない。
  - deploy: 配布やリリースはない。
  - migration: 過去のサイクルの記録は移行しない。
  - logs and monitoring: 記録や通知は変えない。

### Context

- C1: 6 つのスキルが `## How not to write this` を持ち、項目数は `adr` 9、`close` 4、`plan` 8、`work` 7、`upgrade` 5、`yolo` 3 である（`.pi/skills/adr/SKILL.md:260-270`、`.pi/skills/close/SKILL.md:324-329`、`.pi/skills/plan/SKILL.md:266-275`、`.pi/skills/work/SKILL.md:270-278`、`.pi/skills/upgrade/SKILL.md:161-167`、`.pi/skills/yolo/SKILL.md:99-103`）。
- C2: `work` の 7 項目のうち 4 つは、禁止ではなく、前の項目の補足である（`The subagents write their own records there.`、`The agent writes the Acceptance section.`、`A dropped plan's plan md is copied, not authored.`、`It goes in the record.`）（`.pi/skills/work/SKILL.md:270-278`）。
- C3: `upgrade` の `Both are read from the project.` は、前の項目の補足である（`.pi/skills/upgrade/SKILL.md:163-165`）。
- C4: 文末の句点がそろっていない。`upgrade:164` は句点を持ち、`upgrade:163` は持たない（`.pi/skills/upgrade/SKILL.md:163-167`、`.pi/skills/adr/SKILL.md:262-270`）。
- C5: 各項目は `Do not ...` の形で、理由や条件は同じ項目の中にコロンで続く。例: 「- Do not leave a leftover without a line in the `Triage`: the cycle closes only when every one of them has a destination and every `ex-` plan has merged or is dropped」（`.pi/skills/close/SKILL.md:326-329`）。
- C6: 02 と 03 の決定により、plan は「スライスの見出しが関心を名指し、最初の行がその 1 文を言う」という形を持ち、work は clean test に `Fix` の観点 2 つを持つ。`How not to write this` に、この 2 つを指す項目はない（`.pi/skills/plan/SKILL.md:266-275`、`.pi/skills/work/SKILL.md:270-278`、`adr.md` の `## 02:` と `## 03:` の `Decision`）。
- C7: 6 つのセクションは同じ `## How not to write this` という見出しで、SKILL.md の末尾に置かれる（`.pi/skills/adr/SKILL.md:260`、`.pi/skills/yolo/SKILL.md:99`）。
- C8: `plan` の項目は `Round 2`、`affected`、`step 5` を名指しする（`.pi/skills/plan/SKILL.md:274`）。
- C9: オーナーの要望は、すべてのスキルの `How not to write this` が想定で読者が迷わないこと、書かなくても自明なことがあれば削除することである（`ROADMAP.md` の 024 の ideas）。
- C10: 023 の決定は内容の脱落を許可しない。024 は自明な項目の削除を求める（`ROADMAP.md` の 023 と 024 の ideas）。
- C11: 04 の Scope は behaviour、refactor、naming、format、prose、compatibility を In とする（`adr.md` の `## 04:` の `Scope`）。
- C12: 04 の形は Option A である。各項目を「想定 → 禁止 → 理由」の 1 文にし、続きの文はその項目の入れ子にする。句点を揃える。

```md
**An item**

- <the situation>: do not <what>. <the reason>.
- A continuation stays under its item, as a nested bullet.
- Every item ends with a period.

**An example — `plan`, the situation added**

before:

- Do not invent a check: `Always` holds the checks `references/format.md` lists, and `Added` holds the ones the change decides

after:

- When you write a slice's `Verify`: do not invent a check. `Always` holds the checks `references/format.md` lists, and `Added` holds the ones the change decides.

**An example — `work`, the continuation folded in**

before:

- Do not author the plan from the agent's side while a worktree is live.
- The subagents write their own records there.

after:

- While a worktree is live: do not author the plan from the agent's side. The subagents write their own records there.

**The duplicate**

- `adr` has two items about `DEFINITION.md`: the one that forbids writing the file itself, and the one that forbids writing an adopted change as a line of it. The second goes.
```

### Research & Trial

- F1 (C9): ESLint の rule の文書は、`Rule Details` に適用範囲を書き、条件を `Options` で分割し、禁止例を `Examples of incorrect code`、正例を `Examples of correct code`、適用外を `When Not To Use It` に分ける。出所: https://eslint.org/docs/latest/rules/no-cond-assign の `Rule Details`、`Options`、`Examples of incorrect code`、`Examples of correct code`、https://eslint.org/docs/latest/rules/eqeqeq の `When Not To Use It`。
- F2 (C9): CompanyGPT の `Anti-Patterns` は 3 列の表（`Anti-Pattern`、`Problem`、`Better Approach`）で、7 行の反パターンと、その問題と代替案を並べる。出所: https://docs.company-gpt.com/en/tutorials/skills/operations/runbook-skill/ の `## Runbook Anti-Patterns`。
- F3 (C9): xUnit Test Patterns のにおいのページは、「Do not」ではなく、`Symptoms`、`Causes`、各 `Cause` の下の `Root Cause` と `Possible Solution`、ページ全体の `Impact` と `Trouble-Shooting Advice` で書く。出所: http://xunitpatterns.com/Erratic%20Test.html、http://xunitpatterns.com/Fragile%20Test.html。
- F4 (C9): Google のレビュー文書は、`Bad:` と `Good:` の例を対で示し、別のセクション `Explain Why` で理由を添える理由を説明し、重大度を `Nit:`、`Optional (or Consider):`、`FYI:` で示す。出所: https://google.github.io/eng-practices/review/reviewer/comments.html の `Courtesy`、`Explain Why`、`Giving Guidance`。
- F5 (C9): AOSP のスタイルガイドは、`### Don't ...` の見出しに想定（`It can be tempting to ... such as:`）と悪い例を置き、理由を続け、`Acceptable alternatives` に正例を置く。出所: https://source.android.com/docs/setup/contribute/code-style の `### Don't ignore exceptions`、`### Don't catch generic exceptions`、`### Don't use finalizers`。
- F6 (C9): Google Java Style Guide は規則文で書き、条件と例外を `Exception:` または `Tip:` で分離する。出所: https://google.github.io/styleguide/javaguide.html の `§3.3.1 No wildcard imports`、`§6.4 Finalizers: not used`。
- F7 (C9): 答えられなかった問い: xUnit の `Faults` という見出しは確認できず、実際の見出しは `Symptoms`、`Causes`、`Possible Solution` である。Google eng-practices に anti-patterns の章は確認できず、構成は `review/reviewer/` と `review/developer/` だけである。Airbnb などのスタイルガイドは、検索の制限（429）で一次出所に届かなかった。出所: 調査の報告。

### Decision

- Status: **accepted**
- Adopted: 6 つの `How not to write this` の項目が、想定を先頭に置く 1 文になる（C12, F1, F5, F6）。
  - Add:
    - 各項目の想定の文（C12）
    - 続きの文を、その項目の入れ子にする（C2, C3）
    - 02 のスライスの 1 文と、03 の `Fix` の観点を指す項目（C6）
  - Update:
    - 6 つのセクションの全項目の文（C12, F1, F5, F6）
    - 句点を揃える（C4）
  - Drop:
    - `adr` の重複する 1 項目（C12）
- Policy:
  - Allowed:
    - 自明な項目を削除する（C9）
    - 想定に名前を付ける（C11）
  - Forbidden:
    - 想定のない項目を残すこと - 読者が、どのときに効く規則か判断できないため（C9, C12）
    - 禁止でない文を、項目と同じ高さに置くこと - どの項目の補足か分からないため（C2, C3）

### Definition

- `Unit.adr-skill`(kept): オーナーが決め、エージェントが記録できるという主な機能は変わらず、変わるのは末尾の助言の書き方である。
- `Unit.plan-skill`(kept): エージェントが、1 plan 分の作業の形と順序を決めて書けるという主な機能は変わらず、変わるのは末尾の助言の書き方である。
- `Unit.work-skill`(kept): エージェントが、plan を 1 つずつ片付けられるという主な機能は変わらず、変わるのは末尾の助言の書き方である。
- `Unit.close-skill`(kept): エージェントが、サイクル終了後に、クロージングできるという主な機能は変わらず、変わるのは末尾の助言の書き方である。
- `Unit.upgrade-skill`(kept): エージェントが、依存パッケージをアップグレードし、監査まで終えられるという主な機能は変わらず、変わるのは末尾の助言の書き方である。
- `Unit.yolo-skill`(kept): エージェントが、オーナーの確認を挟まずにクローズのトリアージまで進めることができるという主な機能は変わらず、変わるのは末尾の助言の書き方である。
