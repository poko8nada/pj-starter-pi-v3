# ADR 057

## 01: 手順スキルの手順・観点・注意点は、どの形に置くか

### Context

- C1: `.pi/skills/plan/SKILL.md` は、`## Procedure` の下に `### 1.` から `### 8.` までのセクションを置き、各セクションの行動・観点・注意点を同じ並列の箇条書きで書いている（`.pi/skills/plan/SKILL.md:12-94`）。
- C2: `.pi/skills/plan/SKILL.md` は、手順ではない `### Changes after this` と、箇条書きの外にある 2 つの段落を持つ（`.pi/skills/plan/SKILL.md:53`、`.pi/skills/plan/SKILL.md:55`、`.pi/skills/plan/SKILL.md:96-98`）。
- C3: `.pi/skills/work/SKILL.md` は、`### 1.` から `### 9.` までのセクションを持ち、セクション 7 の中に 4 つの太字の小見出し（`What the agent runs`、`What the owner closes`、`What counts as red`、`What is written`）を置いている（`.pi/skills/work/SKILL.md:14-101`）。
- C4: `.pi/skills/upgrade/SKILL.md` は、手順の前に `## Not a cycle` と `## Files` を、後に `## Out of scope` を置いている（`.pi/skills/upgrade/SKILL.md:12-78`）。
- C5: `.pi/skills/adr/SKILL.md` は、各セクションを `Steps:`（番号付き）、`View:`（表）、`Note:` または `Notes:` に分け、末尾に `## How not to write this` を置く。この形がこのサイクルの基準である（`.pi/skills/adr/SKILL.md:16-59`）。
- C6: 3 つの `SKILL.md` の見出しと項目名は英語で、内容は日本語である。
- C7: オーナーは、`adr` を基準とし、対象から外し、`plan`・`work`・`upgrade`・`yolo`・`close` と参照資料を対象とすることを決めた（`ROADMAP.md` 023）。
- C8: オーナーは、内容の脱落を認めないこと、重複と冗長だけを削ることを決めた。
- C9: オーナーは、手順の意味（何を、どの順で、何を条件に進むか）を変えないことを決めた。
- C10: セクション番号とステップ番号を名指しする文がある。`.pi/skills/plan/SKILL.md:94` は「step 3」と「step 4」、`.pi/skills/plan/SKILL.md:98` は「step 4」、`.pi/skills/close/SKILL.md:45` は「work step 8」、`.pi/skills/close/SKILL.md:151` は「the plan skill, steps 4 to 8」、`.pi/skills/close/SKILL.md:179` は「`work` step 2」を名指しする。
- C11: `pre-commit` は、ステージしたすべてのファイルに対して `node scripts/checks/ja-check.mjs` を実行する（`lefthook.yaml:24-27`）。除外は `ROADMAP.md` と `**/affected.md` だけである（`scripts/checks/ja-check.json:71`）。3 つの `SKILL.md` は現在、error 0 件、warn 0 件である。
- C12: `pre-commit` は、`.md` を含むステージしたファイルに対して `pnpm format` を実行し、直した結果をステージし直す（`lefthook.yaml:7-11`）。
- C13: スキルは `.pi` の一部として `harness:pull` でプロジェクトへ配られる（`scripts/harness/harness.json:4`）。このサイクルでは配布の操作をしない。
- C14: pi は Agent Skills 仕様に従い、`SKILL.md` の内部のセクション構成を定めていない。frontmatter の `name` と `description` は要る（`@earendil-works/pi-coding-agent` の `docs/skills.md`）。
- C15: 三案に共通の補足は三つである。表は 2 列で短く書けるものだけに使い、長い説明は `View:` の箇条書きにする。番号付きの `Steps:` は調査でも推奨されており、手順を飛ばせない形にする目的に合う。`upgrade` の `Not a cycle` と `Files` は、`adr` の導入文に当たる内容である。
- C16: 案 C で気をつける点は、末尾のセクションが何でも入る場所にならないことである。末尾に残すのは、二つ以上のステージにまたがり、かつ特定のステージに収まらない禁止だけである。一つのステージに収まる禁止は、そのステージの `Notes` に置く。ステージの `Notes` と重複する項目は、末尾に置かない。この基準はレビューでも確かめられる。
- C17: オーナーは、3 ファイルの冒頭文を、内容も文も残し、追加だけ行うことを決めた。
- C18: オーナーは、末尾の禁止のセクションの名前を、`## How not to write this` に揃えることを決めた。
- C19: ステージの形の例として、`plan` のセクション 6 の書き直しは次のとおりである。

```md
### 6. Review, one plan at a time

Steps:

1. Write one plan md, and send it to its review at once: the plan md, every file it names, and the ADR's `Adopted`, `Denied`, `Scope` and `Definition`.
2. Read the report, and fix the plan from the findings.
3. Report to the owner what was done with each finding.

View:

- `Goal` — the steps and the checks that do not carry each line of the ADR's `Adopted`, and the `Scope`. A step or a check that does what `Denied` says not to do. A `Definition` line whose target `Files` does not name.
- `Integration` — how the update is built into the existing, and how the whole is redesigned
- `Files` — a file the change needs but `Files` does not name, and a document, a comment or a test the change makes stale
- `Types` — a declaration the code uses but `Types` does not name, and a declaration against the type rules
- `Cases` — the test steps' cases against `## Test cases`
- `Checks` — a `Verify` that does not run as written, one that is red with the change in place, and a check that stays green with the behavior removed
- `Flow` — a contradiction, a circular flow, a duplication, an omission, an unnatural flow inside a file the change made

Notes:

- The task is in `references/tasks.md`.
- One subagent per plan.
- When a fix changes another plan's boundary, `Files` or order, update that plan before its review. A plan already reviewed goes through review again.
- With two or more plans, while that review runs, write the next plan file. A plan that is fixed from its review does not wait for the others.
```

### Scope

- Change:
  - format: in — 3 つの `SKILL.md` のセクションと項目の並びを、`adr` と同じ `Steps`・`View`・`Notes` の形に組み直す。
  - prose: in — 手順と注意点の文を `adr` の文体に揃える。1 文に 1 つの事実を置き、行動の主語を明示し、現在形で書き、列挙は表にする。冒頭文は書き換えず、追加だけ行う。
  - **behaviour**: out — 手順そのものは変えない（理由: このエントリが決めるのは書き方であり、スキルが行う仕事ではない）。
  - refactor: out — コードは変えない（理由: 対象は Markdown だけである）。
  - dependency: out — パッケージは変えない（理由: 対象は Markdown だけである）。
  - naming: out — 記録の項目名（`Commit`、`Stopped`、`Ran` など）は変えない（理由: 記録の形はエントリ 04 が扱う）。
- Quality:
  - **errors**: in — 手順を飛ばせない形にする。注意点は、それを守る手順のそばに置く。
  - compatibility: in — セクション番号とステップ番号を名指しする文を壊さない。番号を動かす場合は、名指しする側（`close`）がエントリ 03 で追随する。
  - speed: out — 読み込みの速さやトークン数は目標にしない（理由: 判断の材料がない）。
  - security: out — 秘密情報を扱わない（理由: 対象はリポジトリ内の文書である）。
- Operation:
  - deploy: out — 配布は `harness:pull` の既存の経路で行い、このサイクルでは何もしない。
  - migration: out — 過去のサイクルの記録と `adr` の文書は書き直さない。
  - logs and monitoring: out — 監視は設けない（理由: 変更は文書だけである）。

### Research & Trial

- F1 (C14): Agent Skills 仕様は本文に書式の制限を設けておらず、推奨するセクションとして「手順」「入出力の例」「よくある境界事例」を挙げる。出所: https://agentskills.io/specification
- F2 (C1): 仕様と作り方の文書は、`SKILL.md` を 500 行未満、5,000 トークン未満に保ち、詳細は `references/` へ移すことを推奨する。対象の 3 ファイルは 86 行から 112 行である。出所: https://agentskills.io/specification 、https://agentskills.io/skill.md 、https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
- F3 (C14): 参照へ移す境界の表は、コアの指示を `SKILL.md` に残し、詳細な API リファレンス、スキーマ、包括的な文書を `references/` へ置くと定める。出所: https://agentskills.io/skill.md
- F4 (C14): 参照は `SKILL.md` から 1 階層に保つ。100 行を超える参照ファイルには目次を付ける（`skill-creator` は 300 行超と書く）。出所: https://agentskills.io/specification 、https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices 、https://raw.githubusercontent.com/anthropics/skills/main/skills/skill-creator/SKILL.md
- F5 (C14): 既存のスキル集には、長い手順を `SKILL.md` の本体に置く例（`xlsx`、`algorithmic-art`、`browser-tools`、`gmcli`）と、`REFERENCE.md` と `FORMS.md` へ分ける例（`pdf`）がある。出所: https://raw.githubusercontent.com/anthropics/skills/main/skills/xlsx/SKILL.md 、https://raw.githubusercontent.com/anthropics/skills/main/skills/pdf/SKILL.md 、https://raw.githubusercontent.com/badlogic/pi-skills/main/browser-tools/SKILL.md
- F6 (C14): 推奨されるセクションの並びは、仕様にも pi の文書にも作り方の文書にも規定がない。出所: https://agentskills.io/specification 、`docs/skills.md` 、https://raw.githubusercontent.com/anthropics/skills/main/skills/skill-creator/SKILL.md
- F7 (C5): 番号付きの手順は推奨例として文書化されており、複数のステップを持つ手順にはチェックリストが文書化されたパターンである。出所: https://agentskills.io/skill-creation/best-practices 、https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
- F8 (C5): `Steps:`・`View:`・`Notes:` というラベルの分け方と、末尾の `## How not to write this` は、仕様、pi の文書、作り方の文書、調べたスキルのいずれにも規定も用例もない。出所: 上と同じ 4 つ。
- F9 (C5): 自明でない注意は `SKILL.md` の本体に置き、その状況に出会う前に読ませることが推奨される。別のファイルは読む時機を伝えないと働かない。出所: https://agentskills.io/skill-creation/best-practices 、https://agentskills.io/skill.md
- F10 (C5): 禁止や注意を末尾の独立したセクションにまとめることを、必須または推奨とする規定はない。出所: https://agentskills.io/specification 、https://agentskills.io/skill.md 、https://agentskills.io/skill-creation/best-practices
- F11 (C5): 実例は、注意を該当する手順のそばに置く。`pdf` は `**IMPORTANT**` をコード例の直下に、`algorithmic-art` は `STEP 0` を手順の直前に、`xlsx` は gotchas を該当するセクションに置く。出所: https://raw.githubusercontent.com/anthropics/skills/main/skills/pdf/SKILL.md 、https://raw.githubusercontent.com/anthropics/skills/main/skills/algorithmic-art/SKILL.md 、https://raw.githubusercontent.com/anthropics/skills/main/skills/xlsx/SKILL.md
- F12 (C5): 表の使用に制約はなく、推奨も禁止もない。仕様と pi の文書は frontmatter の説明に表を使い、スキルの本体でも実例がある（`pdf` の Quick Reference、`xlsx` の Task / Approach）。出所: https://agentskills.io/specification 、`docs/skills.md` 、https://raw.githubusercontent.com/anthropics/skills/main/skills/pdf/SKILL.md

### Decision

- Status: **accepted**
- Adopted: 3 つの `SKILL.md` を、案 C の形に組み直す。形は、導入文、`## Procedure`、`## How not to write this` の三部分である。推奨されるセクションの並びはないため、この三部分はこのサイクルが選ぶ（F6）。仕様が推奨する「手順」「例」「境界事例」は、`Steps:`、`View:`、`## How not to write this` が担う（F1, F7, F10）。`Steps:`・`View:`・`Notes:` のラベルは、仕様にも既存のスキルにも用例がないが、`adr` がすでに使っている（C5, F8）。
  - Add:
    - 番号付きの `Steps:` を各ステージに置く（C1, C5, C19, F7）
    - `View:` を各ステージに置き、観点の列挙を集める（C1, C3, C5, C19）
    - `Notes:` を各ステージに置き、そのステージに属する注意を集める（C1, C5, F9, F11）
    - `upgrade` の `Not a cycle` と `Files` の内容を、導入文に入れる（C4, C15）
    - `plan` のセクション 6 を、`C19` の形にする（C19）
    - `work` と `upgrade` の `## How not to do this` を `## How not to write this` に改める（C18）
  - Update:
    - `plan` の `### Changes after this` を、セクション 8 の `Notes` に移す（C2）
    - `plan` の箇条書きの外の 2 つの段落を、各段落が該当するステージの `Notes` に移す（C2）
    - `work` のセクション 7 の 4 つの太字の小見出しを、`View:` と `Notes:` に整理する（C3）
    - `upgrade` の `## Out of scope` を、各項目が該当するステージの `Notes` と `## How not to write this` に分ける（C4）
    - `## How not to write this` を、二つ以上のステージにまたがり、一つのステージに収まらない禁止だけに絞る（C16）
  - Drop:
    - ステージの `Notes` と重複する `## How not to write this` の項目（C8, C16）
    - `plan` の `## How not to write this` にある work の規則（C8）
    - 意味を変えずに短くできる重複した文（C8）
  - Keep:
    - 3 ファイルのセクション番号とステップ番号（C10）
    - 見出しと項目名の英語、内容の日本語（C6）
    - 手順の意味（C9）
    - frontmatter の `name` と `description`（C14）
    - 本体に手順を置くこと - 3 ファイルは 86 行から 112 行で、500 行の推奨を下回る（F2, F3, F5）
    - `pre-commit` の `ja-check` が 0 件であること（C11）
    - `pnpm format` が `.md` を整形すること（C12）
    - 配布の経路（C13）
    - 表は短いものだけに使うこと（C15, F12）
    - 3 ファイルの冒頭文（内容と文）（C17）
- Denied:
  - 内容を落とすこと - 内容の脱落は認めない（C8）
  - 手順の意味を変えること - このエントリは書き方を決める（C9）
  - 詳細を `references/` へ移すこと - 3 ファイルは 500 行の推奨を下回り、移すと目次の規則も要る（F2, F3, F4）
  - 長い説明を表にすること - 表が壊れる（C15, F12）
  - ステージの `Notes` と重複する項目を末尾に置くこと（C16）
  - `adr`・`yolo`・`close`・参照資料を、このエントリで変えること - それぞれ基準、エントリ 02、エントリ 03、エントリ 04 が扱う（C7）
  - 冒頭文を書き換えること - 冒頭文は残し、追加だけを行う（C17）

### Definition

- `Unit.plan-skill`(kept): エージェントが、1 plan 分の作業の形と順序を決めて書けるという主な機能は変わらず、変わるのは 3 つの `SKILL.md` の書き方である。
- `Unit.work-skill`(kept): エージェントが、plan を 1 つずつ片付けられるという主な機能は変わらず、変わるのは 3 つの `SKILL.md` の書き方である。
- `Unit.upgrade-skill`(kept): エージェントが、依存パッケージをアップグレードし、監査まで終えられるという主な機能は変わらず、変わるのは 3 つの `SKILL.md` の書き方である。

## 02: 流れスキルの流れ・条件・注意点は、どの形に置くか

### Context

- C1: `.pi/skills/yolo/SKILL.md` は 62 行で、`## When it runs`、`## The flow`、`## When it stops early`、`## What it does not do` の四つのセクションを持つ（`.pi/skills/yolo/SKILL.md:11-62`）。
- C2: `## The flow` は `### plan`、`### work`、`### close` の三つに分かれ、各セクションが行動の箇条書き、`skips:` の箇条書き、`go on to` の行を持つ（`.pi/skills/yolo/SKILL.md:18-45`）。
- C3: `## When it stops early` は、三つの条件の箇条書きと、条件でない例の段落を持つ（`.pi/skills/yolo/SKILL.md:49-57`）。
- C4: `## What it does not do` は、二つの制限を持つ（`.pi/skills/yolo/SKILL.md:59-62`）。
- C5: このスキルは、オーナーが起動し、エージェントは選べない。frontmatter の `disable-model-invocation: true` がその根拠である（`.pi/skills/yolo/SKILL.md:4`、`.pi/skills/yolo/SKILL.md:9`、`@earendil-works/pi-coding-agent` の `docs/skills.md:53`）。
- C6: `yolo` は、他のスキルの手順を名指しする。`plan` の 7 つの観点（`.pi/skills/yolo/SKILL.md:26`）、`work` の手順（`.pi/skills/yolo/SKILL.md:33`）、`close` の手順（`.pi/skills/yolo/SKILL.md:40-44`）である。
- C7: エントリ 01 は、手順スキルの形を、導入文、`## Procedure`、`## How not to write this` の三部分とし、各ステージを `Steps:`、`View:`、`Notes:` に分けると決定した（`adr.md` の `## 01:` の `Decision`）。
- C8: オーナーは、`yolo` をこのサイクルの対象に含めた（`ROADMAP.md` 023）。
- C9: オーナーは、内容の脱落を認めず、重複と冗長だけを削ることを決めた。
- C10: オーナーは、手順の意味（何を、どの順で、何を条件に進むか）を変えないことを決めた。
- C11: `pre-commit` は、ステージしたすべてのファイルに対して `node scripts/checks/ja-check.mjs` を実行する（`lefthook.yaml:24-27`）。`yolo` は現在、error 0 件、warn 0 件である。
- C12: `pre-commit` は、`.md` を含むステージしたファイルに対して `pnpm format` を実行し、直した結果をステージし直す（`lefthook.yaml:7-11`）。
- C13: pi は Agent Skills 仕様に従い、`SKILL.md` の内部のセクション構成を定めていない。frontmatter の `name` と `description` は要る（`@earendil-works/pi-coding-agent` の `docs/skills.md`）。
- C14: オーナーは、`yolo` を、全エントリが accepted になった後なら、どの時機でも起動できることを求める。`close` の `ex-` プランの作業中でも起動できる。
- C15: オーナーは、`base` の plan やオーナーの確認で閉じる手順に当たったとき、エージェントがその確認を実行可能な別の verify に置き換えることを求める。
- C16: オーナーは、手順や確認が plan の想定と違うとき、エージェントがその場で調整し、トリアージの手前まで走り切ることを求める。
- C17: オーナーは、エージェントが想定外の事態では止まってよいことを求める。
- C18: `close` は、`ex-` プランのマージで、その plan md の残りを `collected` に戻し、残りをもう一度たどると定める（`.pi/skills/close/SKILL.md:35`）。オーナーは、`yolo` が `ex-` プランの中で起動したときも、エージェントがそのやり直しを走らせ、オーナーの判断の手前で止まることを求める。
- C19: `yolo` の新しいセクションの形は、次のとおりである。

```md
## When it runs

View:

| case                                                          | does it run                                                     |
| ------------------------------------------------------------- | --------------------------------------------------------------- |
| the owner starts it, after every entry of the ADR is accepted | it runs                                                         |
| started before that                                           | it does not run: nothing runs, and it says so                   |
| a stage the cycle has passed                                  | that stage is not walked again                                  |
| the ADR                                                       | not this skill's business: no entry is accepted or checked here |

Note: when the cycle stands inside a close's `ex-` plan, the run walks that plan to its merge, then runs the close's collect and the proposal again, and stops before the owner's judgement on the new triage.
```

```md
## When a step cannot run

Steps:

1. Replace the step or the check with a check the agent can run.
2. Write the replacement in the plan md.

View:

| cannot run as written                | what replaces it                   |
| ------------------------------------ | ---------------------------------- |
| a `base` plan's owner look           | a check the agent runs in the base |
| a step that closes by the owner's OK | a check the agent runs             |

Note: the stage and the stop point do not move.
```

```md
## When it stops early

View:

| case                                                                         | what to do                                |
| ---------------------------------------------------------------------------- | ----------------------------------------- |
| a plan's premise turns out false, and what closes it sits outside the plan   | stop, and ask the owner                   |
| a merge leaves the base red, and the plan's fix does not bring it back green | stop, and ask the owner                   |
| a pair of plans would make the same thing                                    | stop, and ask the owner to decide the cut |
| no check the agent can run replaces the step                                 | stop, and ask the owner                   |

Note: a hole the run finds and fixes in the plan's own files is not one of these: the slice's `Unplanned` holds it, and the run goes on.
```

```md
## How not to write this

- Do not decide a change the ADR did not accept
- Do not call the other skills: each stage keeps its own rules, and the flow above is the order it walks them
- Do not change a stage or the stop point
```

### Scope

- Change:
  - format: in — `.pi/skills/yolo/SKILL.md` のセクションの並びを、`adr` の形に組み直す。
  - prose: in — 手順と注意点の文を `adr` の文体に揃える。1 文に 1 つの事実を置き、行動の主語を明示し、現在形で書き、列挙は表にする。冒頭文は書き換えず、追加だけ行う。
  - **behaviour**: in — 起動の時機、確認の置き換え、調整の規則を足す。既存の流れと段階は変えない。
  - refactor: out — コードは変えない（理由: 対象は Markdown だけである）。
  - dependency: out — パッケージは変えない（理由: 対象は Markdown だけである）。
  - naming: out — 記録の項目名（`Commit`、`Stopped`、`Ran` など）は変えない（理由: 記録の形はエントリ 04 が扱う）。
- Quality:
  - **errors**: in — 早期に止まる条件を、見落とさない形にする。
  - **compatibility**: in — 他のスキルの手順を名指しする文を壊さない。番号が動く場合は、名指す側が追随する。
  - speed: out — 読み込みの速さやトークン数は目標にしない（理由: 判断の材料がない）。
  - security: out — 秘密情報を扱わない（理由: 対象はリポジトリ内の文書である）。
- Operation:
  - deploy: out — 配布は `harness:pull` の既存の経路で行い、このサイクルでは何もしない。
  - migration: out — 過去のサイクルの記録は書き直さない。
  - logs and monitoring: out — 監視は設けない（理由: 変更は文書だけである）。

### Research & Trial

- F1 (C6): 他のスキルの進め方を変えるスキルは、調べた範囲で四つ見つかった。`agent-flow` の `implement-feature` と `sprint-plan`（フラグで承認の門を変える）、`superpowers` の `using-superpowers`（他のスキルの呼び出し方を変える）、`executing-plans`（中断しない実行を定める）。出所: https://github.com/asysta-act/agent-flow/blob/main/skills/implement-feature/SKILL.md 、https://github.com/asysta-act/agent-flow/blob/main/skills/sprint-plan/SKILL.md 、https://github.com/obra/superpowers/blob/main/skills/using-superpowers/SKILL.md 、https://github.com/obra/superpowers/blob/main/skills/executing-plans/SKILL.md
- F2 (C13): `anthropics/skills` の 19 件と `badlogic/pi-skills` の 8 件には、モード、ポリシー、手順の省略を指定するスキルはない。出所: https://github.com/anthropics/skills/tree/main/skills 、https://github.com/badlogic/pi-skills
- F3 (C13): Agent Skills 仕様、`best-practices`、Playbook、pi の `docs/skills.md` には、他のスキルの進め方を変えるスキルの規定も用例もない。出所: https://agentskills.io/specification 、https://agentskills.io/skill-creation/best-practices 、https://agentskills.io/skill.md 、`@earendil-works/pi-coding-agent` の `docs/skills.md`
- F4 (C3): 実例は、冒頭に宣言を置き、その後に手順を置く。`executing-plans` は「中断しない」と「止まるのは四つだけ」を冒頭に置き、タスクのループを番号付きで続ける。`using-superpowers` は手順を持たず、条件と優先順位だけを書く。出所: https://github.com/obra/superpowers/blob/main/skills/executing-plans/SKILL.md 、https://github.com/obra/superpowers/blob/main/skills/using-superpowers/SKILL.md
- F5 (C4): 調べたどの例も `Steps:`・`View:`・`Notes:` のラベルと `## How not to write this` を持たない。禁止は `Red Flags`、`Common Rationalizations`、`Gotchas` という別の名前のセクションで書く。出所: 上と同じ四つの `SKILL.md` 、https://agentskills.io/skill-creation/best-practices
- F6 (C2): 省略は、各段階のそば（`Behavior: --yolo: ...`、`This gate BLOCKS even in --yolo mode`）と、冒頭のまとめ（`Flag Parsing`、`Mode semantics`）と、末尾の `Rules` に書く例がある。出所: https://github.com/asysta-act/agent-flow/blob/main/skills/sprint-plan/SKILL.md 、https://github.com/asysta-act/agent-flow/blob/main/skills/implement-feature/SKILL.md
- F7 (C2): 省略そのものを表にした例はない。表は工程の順序、フラグ、止めるコマンド、反論と事実の対に使われる。出所: 上と同じ四つの `SKILL.md`
- F8 (C1): `skips:` というラベルは、調べたどのスキルにもない。使われる語は `skip`、`auto-approve`、`BLOCKS even in --yolo`、`Do not pause`、`Four things stop you` である。出所: 上と同じ四つの `SKILL.md`

### Decision

- Status: **accepted**
- Adopted: `yolo` を、`adr` の形に組み直す。骨格は、導入文、`## When it runs`、`## Procedure`（`### 1. plan`、`### 2. work`、`### 3. close`）、`## When a step cannot run`、`## When it stops early`、`## How not to write this` である。他のスキルの進め方を変えるスキルは四つあるが、いずれも `Steps:`・`View:`・`Notes:` のラベルを持たない（F1, F5）。二つのスキル集と仕様には、この種のスキルがない（F2, F3）。実例は冒頭に宣言を置き、後に手順を置く（F4）。推奨されるセクションの並びはないため、この骨格はこのサイクルが選ぶ（C7, C13）。
  - Add:
    - `yolo` を `C19` の形にする（C19）
    - `## Procedure` に三つのステージを置く（C1, C2, C7）
    - 各ステージに `Steps:` を置き、`go on to` の行を最後のステップにする（C2）
    - 各ステージの `Notes:` に `skips:` の行を置く（C2, F6）
    - `## When it runs` を `View:` の表にし、`ex-` プランの場合を `Note:` に置く（C14, C18）
    - `## When a step cannot run` を置き、置き換えの規則と表を入れる（C15, C16）
    - `## When it stops early` に四つ目の条件を足す（C17）
    - `## How not to write this` を置く（C4, F5）
    - `## Procedure` の後に、判定より後の仕事はこのスキルの対象外であるという `Note:` を置く（C9）
  - Update:
    - `## When it stops early` の三つの条件を `View:` の表にする（C3）
    - `## What it does not do` を `## How not to write this` に改め、`Do not` の形にする（C4, F5）
  - Drop:
    - 意味を変えずに短くできる重複した文（C9）
  - Keep:
    - 冒頭文（内容と文）（C9）
    - frontmatter の `name`、`description`、`disable-model-invocation`（C5）
    - 他のスキルの手順を名指しする文（C6）
    - 手順の意味と段階の順序（C10）
    - `skips:` の語（F8）
    - `pre-commit` の `ja-check` が 0 件であること、`pnpm format` が `.md` を整形すること（C11, C12）
- Denied:
  - 内容を落とすこと（C9）
  - 既存の流れと段階の順序を変えること（C10）
  - 省略を表にすること - 省略を表にした例がない（F7）
  - 段階と停止点を置き換えること - 置き換えるのは手順の中身だけである（C16）
  - `plan`・`work`・`upgrade`・`close`・`adr`・参照資料を、このエントリで変えること - 対象は `yolo` である（C8）

### Definition

- `Unit.yolo-skill`(kept): エージェントが、オーナーの確認を挟まずにクローズのトリアージまで進めることができるという主な機能は変わらず、変わるのは起動の時機、確認の置き換え、調整の規則と、書き方である。

## 03: 判定スキルの門・状態・手順は、どの形に置くか

### Context

- C1: `.pi/skills/close/SKILL.md` は 197 行で、`## Who decides`、`## The leftover's states`、`## Procedure`（`### 1.` から `### 14.`）、`## How not to do this` を持つ（`.pi/skills/close/SKILL.md:12-197`）。
- C2: `Who decides` は、三つの門（the agent's reading、the owner's word、the merge）を表にし、ステップは門を名指しするだけで言い直さないと定める（`.pi/skills/close/SKILL.md:12-20`）。
- C3: `The leftover's states` は、六つの状態を表にし、状態はこの表だけに書くと定める（`.pi/skills/close/SKILL.md:22-35`）。
- C4: `## Procedure` の各ステップは、`takes:`、`does:`、`gives:` の三行と、`does:` の下の箇条書きで書く（`.pi/skills/close/SKILL.md:41-190`）。
- C5: 14 のステップには、`close.md` を書くもの、オーナーの言葉で閉じるもの、`ex-` プランを走らせるものが含まれる（`.pi/skills/close/SKILL.md:80-129`）。
- C6: `## How not to do this` は四つの禁止を持つ（`.pi/skills/close/SKILL.md:192-197`）。
- C7: ステップの番号ではなく名前を名指す文が close の中にある（`the collect step`、`the roadmap step`、`the worktree step`）（`.pi/skills/close/SKILL.md:106`、`.pi/skills/close/SKILL.md:111`、`.pi/skills/close/SKILL.md:177`、`.pi/skills/close/SKILL.md:178`）。
- C8: `work` のステップ番号を名指す文がある（`work step 8 green`）（`.pi/skills/close/SKILL.md:45`）。
- C9: エントリ 01 は、手順のスキルの骨格を、導入文、`## Procedure`、`## How not to write this` と決定した（`adr.md` の `## 01:` の `Decision`）。
- C10: エントリ 02 は、`yolo` の骨格を、導入文、`## When it runs`、`## Procedure`、`## When a step cannot run`、`## When it stops early`、`## How not to write this` と決定した（`adr.md` の `## 02:` の `Decision`）。
- C11: オーナーは、`close` をこのサイクルの対象に含めた（`ROADMAP.md` 023）。
- C12: オーナーは、内容の脱落を認めず、重複と冗長だけを削ることを決めた。
- C13: オーナーは、手順の意味（何を、どの順で、何を条件に進むか）を変えないことを決めた。
- C14: `pre-commit` は、ステージしたすべてのファイルに対して `node scripts/checks/ja-check.mjs` を実行する（`lefthook.yaml:24-27`）。`close` は現在、error 0 件、warn 0 件である。
- C15: `pre-commit` は、`.md` を含むステージしたファイルに対して `pnpm format` を実行し、直した結果をステージし直す（`lefthook.yaml:7-11`）。
- C16: pi は Agent Skills 仕様に従い、`SKILL.md` の内部のセクション構成を定めていない。frontmatter の `name` と `description` は要る（`@earendil-works/pi-coding-agent` の `docs/skills.md`）。
- C17: オーナーは、`Who decides` と `The leftover's states` を、`View:` の表として残すことを決めた。二つは定義であり、落とすと内容が欠けるためである。
- C18: オーナーは、`takes` と `gives` を `View:` の表として残すことを決めた。`Notes:` には混ぜない。
- C19: オーナーは、`ex-` プランのあとに戻る先を、ステップの番号で名指すことを決めた。遠い定義を参照しなくて済むためである。
- C20: オーナーは、末尾の禁止のセクションの名前を、`## How not to write this` に揃えることを決めた。
- C21: 形の例は、次のとおりである。

```md
## Who decides

View:

| gate                | what it decides                                     | where      |
| ------------------- | --------------------------------------------------- | ---------- |
| the agent's reading | a leftover already closed                           | the chat   |
| the owner's word    | a destination, a grouping, a verification, a status | the chat   |
| the merge           | an `ex-` plan's work                                | the commit |

Note: a step that says "the gate is ..." names one of the three, and does not restate it.

## The leftover's states

View:

| state     | what it means           | what moves it on              |
| --------- | ----------------------- | ----------------------------- |
| collected | put in `## Collected`   | the agent: exclude or propose |
| excluded  | the line is deleted     | nothing: the end              |
| proposed  | `## Triage` holds it    | the owner                     |
| judged    | the owner said yes      | the agent: the plan, or close |
| merged    | the plan's work is in   | nothing: the end              |
| closed    | `dropped`, `_proposed_` | nothing: the end              |

Note: a leftover is in one state at a time. This table is the only place the states are written. Each step names the state it takes and the state it gives.

## Procedure

### 3. Collect

Steps:

1. Run `node .pi/skills/close/scripts/collect.mjs cycles/<YYMMDD>-<NNN>-<slug>`; it writes `close.md` and its `## Collected`, and creates the file.
2. Read the heading, the plan id and the line's shape in `references/format.md`.
3. Fill every `未特定` as `references/format.md` says; an `ex-` plan's `No` comes from the Triage.
4. Add the holes from the read as lines by hand, under a heading naming the ADR entry, as `references/format.md` says.
5. Do not copy by hand what the script collects: a line left out is a hole nobody finds again.

View:

| takes        | gives                      |
| ------------ | -------------------------- |
| the plan mds | every leftover `collected` |

Note: do not show `## Collected` to the owner here: the proposal comes first, and they read it at the owner's judgement.

### 8. Run the `ex-` plans

Steps:

1. When one is merged, its plan md's leftovers go back to `collected`.
2. Go back to step 3 and run the collect, the exclusion, the proposal and the owner's judgement again for them, one leftover at a time.
3. Then come back to this step for the next `ex-` plan.
```

### Scope

- Change:
  - format: in — `.pi/skills/close/SKILL.md` のセクションの並びを、`adr` の形に組み直す。
  - prose: in — 手順と注意点の文を `adr` の文体に揃える。1 文に 1 つの事実を置き、行動の主語を明示し、現在形で書き、列挙は表にする。冒頭文は書き換えず、追加だけ行う。
  - **behaviour**: out — 14 の手順、三つの門、六つの状態を変えない（理由: このエントリは書き方を決める）。
  - refactor: out — コードは変えない（理由: 対象は Markdown だけである）。
  - dependency: out — パッケージは変えない（理由: 対象は Markdown だけである）。
  - naming: out — 記録の項目名（`Commit:`、`Stopped`、`done <commit>` など）は変えない（理由: エントリ 04 が扱う）。
- Quality:
  - **errors**: in — 二つの表が唯一の場所であることを保ち、手順の見落としを防ぐ。
  - **compatibility**: in — ステップ名の名指し（`the collect step` など）と `work step 8 green` を壊さない。番号が動く場合は、名指しする側が追随する。
  - speed: out — 読み込みの速さやトークン数は目標にしない（理由: 判断の材料がない）。
  - security: out — 秘密情報を扱わない（理由: 対象はリポジトリ内の文書である）。
- Operation:
  - deploy: out — 配布は `harness:pull` の既存の経路で行い、このサイクルでは何もしない。
  - migration: out — 過去のサイクルの記録は書き直さない。
  - logs and monitoring: out — 監視は設けない（理由: 変更は文書だけである）。

### Research & Trial

- F1 (C4): `takes:` / `gives:` をステップのラベルにする例は、調べた範囲で見つからなかった。仕様、作り方の文書、pi の文書、Claude Code の文書、スキル集の代表例のいずれにもない。出所: https://agentskills.io/specification 、https://github.com/anthropics/skills 、https://github.com/badlogic/pi-skills
- F2 (C4): ステップごとの入力と出力を表で持つ例がある。`functional-skill-creator` は、各関数のファイルに `## Input` と `## Output` の表を置き、`SKILL.md` の冒頭に `## External Inputs` と `## Execution Pipeline`（Step / Function / Purpose / Input / Output）を置く。出所: https://raw.githubusercontent.com/AGI-comming/functional-skill-creator/main/docs/function-contract.md 、https://raw.githubusercontent.com/AGI-comming/functional-skill-creator/main/examples/meeting-notes-to-actions/SKILL.md
- F3 (C4): `mcp-builder` は、ツールごとに `Input Schema` と `Output Schema` を箇条書きで置く。出所: https://raw.githubusercontent.com/anthropics/skills/main/skills/mcp-builder/SKILL.md
- F4 (C4): 仕様は推奨するセクションに入出力の例を挙げるが、ステップの書式は定めない。作り方の文書は、集める材料として入出力の形を挙げるだけである。出所: https://agentskills.io/specification 、https://agentskills.io/skill-creation/best-practices
- F5 (C4): ステップの書き方として最も多いのは、番号付きの箇条書きと散文である。出所: https://agentskills.io/skill-creation/best-practices 、https://www.mdskills.io/docs/skill-examples
- F6 (C4): 前提は、文書の冒頭か frontmatter に置く例がある（`runsheets` の `prerequisites`）。出所: https://madbomber.github.io/runsheets/concepts/runbooks/
- F7 (C2): 状態や門の表を「この表だけに書く」「ステップは言い直さない」と定める例は、スキルにも手順書にも見つからなかった。最も近いのは `functional-skill-creator` の「編成は `SKILL.md`、振る舞いは関数のファイル」という分担規則である。出所: https://raw.githubusercontent.com/AGI-comming/functional-skill-creator/main/examples/meeting-notes-to-actions/SKILL.md
- F8 (C3): スキルの外には、状態と遷移を表にする例がある。ONES の `Status map` と `Transition map`、Formaloo の状態の定義、Syntaqx の遷移表である。Syntaqx は「描かれていないものは拒む」と定め、図と表を仕様とする。出所: https://ones.com/blog/task-workflow-status-and-transition-owner-template-a-guide/ 、https://www.formaloo.com/blog/workflow-states-and-transitions 、https://www.syntaqx.com/docs/building-blocks/workflows

### Decision

- Status: **accepted**
- Adopted: `close` を、`adr` の形に組み直す。骨格は、導入文、`## Who decides`、`## The leftover's states`、`## Procedure`（`### 1.` から `### 14.`）、`## How not to write this` である。二つの表は定義なので残す（C17）。各ステップは `Steps:` と、`takes` と `gives` の `View:` を持つ（C18）。仕様はステップの書式を定めず、最も多い形は番号付きの箇条書きである（F4, F5）。前提を冒頭に置く例があり、二つの表の位置に合う（F6）。`takes` と `gives` というラベルの例はないが、ステップの入出力を表にする例はある（F1, F2, F3）。エントリ 01 と 02 の骨格を引き継ぐ（C9, C10）。
  - Add:
    - `## Who decides` を `View:` の表にする（C2, C17）
    - `## The leftover's states` を `View:` の表にする（C3, C17）
    - 各ステップの `does:` の箇条書きを `Steps:` の番号付きにする（C4, C5, F5）
    - 各ステップに `View:` を置き、`takes` と `gives` を表にする（C4, C18, F2）
    - 各ステップの注意を `Notes:` に置く（C4）
    - ステップ 8 に、ステップ 3 へ戻るステップを置く（C19）
    - `close` の四つのセクションを、`C21` の骨格に組み直す（C1, C21）
    - `## How not to do this` を `## How not to write this` に改める（C20）
  - Update:
    - `The leftover's states` の「この表だけに書く」規則を `Note:` に移す（C3）
    - `Who decides` の「門を言い直さない」規則を `Note:` に移す（C2）
    - `## Procedure` の冒頭にある残りの進め方の定義を、ステップ 8 の戻りに置き換える（C19）
  - Drop:
    - `takes:`・`does:`・`gives:` のラベル - 中身は `Steps:` と `View:` に移る（C4, C18）
    - 意味を変えずに短くできる重複した文（C12）
  - Keep:
    - 14 のステップの意味と順序（C5, C13）
    - ステップを名前で名指す文（`the collect step` など）（C7）
    - `work step 8 green`（C8）
    - 冒頭文（C12）
    - 四つの禁止（C6）
    - 二つの表の内容（C2, C3, C17）
    - frontmatter（C16）
    - `pre-commit` の `ja-check` が 0 件であること、`pnpm format` が `.md` を整形すること（C14, C15）
- Denied:
  - 内容を落とすこと - 二つの表は定義である（C12, C17）
  - 二つの表を消してステップに組み入れること - 定義が欠ける（C17, F7, F8）
  - `takes` と `gives` を `Notes:` に混ぜること（C18）
  - 戻り先を遠い定義で参照させること - 戻り先は番号で名指す（C19）
  - 手順の意味と順序を変えること（C13）
  - 他のスキルをこのエントリで変えること - 対象は `close` である（C11）

### Definition

- `Unit.close-skill`(kept): エージェントが、サイクル終了後に、クロージングできるという主な機能は変わらず、変わるのは書き方である。

## 04: 参照資料のフェンス・規則・記録の形は、どこまで揃えるか

### Context

- C1: 参照資料は 8 ファイルある。`plan/references/cut.md`（45 行）、`plan/references/format.md`（240 行）、`plan/references/tasks.md`（51 行）、`work/references/tasks.md`（74 行）、`upgrade/references/report.md`（44 行）、`upgrade/references/tasks.md`（28 行）、`close/references/format.md`（93 行）、`close/references/tasks.md`（14 行）である。
- C2: 記録の形を定める `format.md` と `report.md` は、`# <name> format` の見出し、一行の説明、`## Shape` のフェンス、セクションごとの `##` と箇条書きを持つ。
- C3: サブエージェントに渡す文を定める `tasks.md` は、`# Texts handed to subagents` の見出し、一行の説明、`## <task> (a <role> subagent)` の見出し、フェンス、箇条書きを持つ。
- C4: `adr` の参照資料 3 ファイル（`adr.format.md`、`affected.format.md`、`tasks.md`）が、このサイクルの基準である。`adr` の `SKILL.md` と同じ改訂で書き直されている。
- C5: スキルの `SKILL.md` は、参照資料のセクション名を名指しする（例: `the Slices section of references/tasks.md`、`the Look it up section of references/tasks.md`、`the shape references/report.md gives`）。
- C6: エントリ 01 から 03 は、5 つの `SKILL.md` の骨格を決めた。参照資料は、その骨格に名指される側である。
- C7: `pre-commit` は、ステージしたすべてのファイルに対して `node scripts/checks/ja-check.mjs` を実行する（`lefthook.yaml:24-27`）。8 ファイルは現在、error 0 件、warn 0 件である。
- C8: `pre-commit` は、`.md` を含むステージしたファイルに対して `pnpm format` を実行し、直した結果をステージし直す（`lefthook.yaml:7-11`）。
- C9: エントリ 01 の調査では、参照ファイルは焦点を絞って小さく保ち、100 行を超える参照ファイルには目次を付けるという推奨が見つかった（`adr.md` の `## 01:` の `F4`）。`plan/references/format.md` は 240 行で、目次を持たない。
- C10: オーナーは、参照資料をこのサイクルの対象に含めた（`ROADMAP.md` 023）。
- C11: オーナーは、内容の脱落を認めず、重複と冗長だけを削ることを決めた。
- C12: オーナーは、手順の意味（何を、どの順で、何を条件に進むか）を変えないことを決めた。
- C13: オーナーは、参照資料に、スキル本文に書くべきことを重複して置かないことを求める。この規則を、`adr` のスキル本文と参照資料の責務分離に使う。
- C14: オーナーは、「重複」を、スキル本文との比較で見つかる重複と、参照資料の中の重複の両方とすることを決めた。
- C15: 参照資料には、スキル本文にあった方がよい文が残っている。その内訳は「誰が、いつ、このセクションを書くか」の文と、「発注の仕方」の文である（`close/references/format.md:48`、`close/references/format.md:61`、`close/references/format.md:80`、`plan/references/format.md:228`、`plan/references/format.md:232`、`upgrade/references/tasks.md:26`、`work/references/tasks.md:55`、`upgrade/references/report.md:44`）。
- C16: 参照資料の中にも重複がある（`close/references/format.md:72-75` の `done <commit>`、`plan/references/format.md` の `## Slices` と `## Test cases` のテストの書き方）。

### Scope

- Change:
  - format: in — 8 ファイルのセクションと並びを、`adr` の参照資料の形に揃える。
  - prose: in — 1 文に 1 つの規則を置き、1 つの箇条書きに 1 つの事実を入れる。
  - **behaviour**: out — 参照資料が定めている形（plan md、`close.md`、サブエージェントへの文）と、スキルの手順を変えない。
  - refactor: out — コードは変えない（理由: 対象は Markdown だけである）。
  - dependency: out — パッケージは変えない（理由: 対象は Markdown だけである）。
  - naming: out — `SKILL.md` が名指しするセクション名は変えない（理由: 名指す側が壊れる）。
- Quality:
  - **errors**: in — `Shape` のフェンスと、その下の規則が矛盾しないようにする。
  - **compatibility**: in — 名指しされるセクション名を保つ。
  - speed: out — 読み込みの速さやトークン数は目標にしない（理由: 判断の材料がない）。
  - security: out — 秘密情報を扱わない（理由: 対象はリポジトリ内の文書である）。
- Operation:
  - deploy: out — 配布は `harness:pull` の既存の経路で行い、このサイクルでは何もしない。
  - migration: out — 過去のサイクルの記録は書き直さない。
  - logs and monitoring: out — 監視は設けない（理由: 変更は文書だけである）。

### Research & Trial

- F1 (C4): `adr` の `SKILL.md` にだけあるのは、順序、合意、発注、確認である。手順、注意点、エージェントが自分で実行するコマンドがここにある。出所: `.pi/skills/adr/SKILL.md:20-24`、`.pi/skills/adr/SKILL.md:107-112`、`.pi/skills/adr/SKILL.md:229-236`、`.pi/skills/adr/SKILL.md:55-57`
- F2 (C4): `adr` の参照資料にだけあるのは、テンプレート、項目の定義、分類、サブエージェントへの原文、検索方法である。出所: `.pi/skills/adr/references/adr.format.md:9-55`、`.pi/skills/adr/references/tasks.md:18-42`、`.pi/skills/adr/references/affected.format.md:35-40`
- F3 (C4): 両方にあるものがある。`out` の理由、却下の扱い、`C` の番号、`Adopted` の内訳、操作の値、行末の括弧、置き場所である。書き分けは、`SKILL.md` が「いつ、何を書くか」の指示、参照資料が「その項目の値の規則」である。出所: `.pi/skills/adr/SKILL.md:101` と `.pi/skills/adr/references/adr.format.md:72`、`.pi/skills/adr/SKILL.md:173` と `.pi/skills/adr/references/adr.format.md:82`、`.pi/skills/adr/SKILL.md:187-190` と `.pi/skills/adr/references/adr.format.md:95-96`
- F4 (C13): 厳密な無重複の規則は取り出せない。傾向は、`SKILL.md` が順序・合意・発注・確認、参照資料がテンプレート・定義・方法・原文である。出所: `F1` から `F3` の三つ。
- F5 (C2): 8 ファイルは、すでに参照資料の形を持つ。見出し、一行の説明、`## Shape` と `##` の規則である。出所: `.pi/skills/plan/references/format.md:1-5`、`.pi/skills/close/references/format.md:1-5`、`.pi/skills/upgrade/references/report.md:1-5`、`.pi/skills/plan/references/tasks.md:1-3`
- F6 (C15): 記録の形を定める `format.md` に、「誰が、いつ、このセクションを書くか」の文がある。`close/references/format.md:48`、`:61`、`:80`、`plan/references/format.md:228`、`:232`。これらは、`close/SKILL.md` のステップ 3・5・7・10 と、`work/SKILL.md` のステップ 6・7 が、すでに言っている。出所: 上のパスと行、`.pi/skills/close/SKILL.md:60`、`.pi/skills/close/SKILL.md:80`、`.pi/skills/close/SKILL.md:102`、`.pi/skills/close/SKILL.md:144`、`.pi/skills/work/SKILL.md:59-65`、`.pi/skills/work/SKILL.md:67-91`。行番号は、書き直しの前のものである。
- F7 (C15): 「発注の仕方」の文が、`SKILL.md` と重なる。`upgrade/references/tasks.md:26` は `upgrade/SKILL.md` のステップ 3 と同じ。`work/references/tasks.md:55` は `work/SKILL.md` のステップ 6 と同じ。`upgrade/references/report.md:44` は `upgrade/SKILL.md` のステップ 2 と同じ。出所: `upgrade/references/tasks.md:26`、`.pi/skills/upgrade/SKILL.md:41`、`work/references/tasks.md:55`、`.pi/skills/work/SKILL.md:59-65`、`upgrade/references/report.md:44`、`.pi/skills/upgrade/SKILL.md:32`。行番号は、書き直しの前のものである。
- F8 (C16): 参照資料の中の重複。`close/references/format.md:72-75` は、`done <commit>` の説明を四行に分けて繰り返す。`plan/references/format.md` の `## Slices`（146 行）と `## Test cases`（190 行）は、テストの書き方を一部重ねる。出所: 上のパスと行。

### Decision

- Status: **accepted**
- Adopted: 8 ファイル（C1）を、`adr` の参照資料の形に揃え、スキル本文と重なる文と、参照資料の中の重複を削る。`adr` の `SKILL.md` は順序・合意・発注・確認を持ち、参照資料はテンプレート・項目の定義・分類・原文・検索方法を持つ（F1, F2, F4）。両方にある文もあり、書き分けは、`SKILL.md` が「いつ、何を書くか」の指示、参照資料が「その項目の値の規則」である（F3）。8 ファイルは、すでに参照資料の形を持つ（F5）。
  - Add:
    - 各ファイルに、一行の説明と `## Writing` を置く（C2, C3, F2）
    - 1 つの箇条書きに 1 つの規則を置く（F2）
  - Update:
    - 各ファイルのセクションを、`adr` の参照資料の並び（見出し、一行の説明、`## Shape`、`## <section>`、`## Writing`）に揃える（C2, C3, C4, F5）
  - Drop:
    - スキル本文がすでに言っている「誰が、いつ、書くか」の文: `close/references/format.md:48`、`:61`、`:80`、`plan/references/format.md:228`、`:232`（C13, C15, F6）
    - スキル本文がすでに言っている発注の仕方の文: `upgrade/references/tasks.md:26`、`work/references/tasks.md:55`、`upgrade/references/report.md:44`（C13, C15, F7）
    - 参照資料の中の重複: `close/references/format.md:72-75` の `done <commit>`、`plan/references/format.md` の `## Slices` と `## Test cases` のテストの書き方（C14, C16, F8）
    - 意味を変えずに短くできる重複した文（C11）
  - Keep:
    - セクション名（C5）
    - `Shape` のフェンスと、項目の定義（C2, C3, F2）
    - サブエージェントへの原文（C3, F2）
    - 参照資料が定めている形（plan md、`close.md`、レポート）と、スキルの手順（C12）
    - `pre-commit` の `ja-check` が 0 件であること、`pnpm format` が `.md` を整形すること（C7, C8）
- Denied:
  - 参照資料からスキル本文へ内容を移すこと - エントリ 01 から 03 は確定済みである（C6, C10）
  - セクション名を変えること - `SKILL.md` の名指しが壊れる（C5）
  - 目次を付けること - `adr` の参照資料は目次を持たない（C4, C9）
  - 内容を落とすこと（C11）
  - 8 ファイルの外を変えること - 対象は参照資料である（C10）

### Definition

- `Unit.plan-skill`(kept): エージェントが、1 plan 分の作業の形と順序を決めて書けるという主な機能は変わらず、変わるのは参照資料の書き方である。
- `Unit.work-skill`(kept): エージェントが、plan を 1 つずつ片付けられるという主な機能は変わらず、変わるのは参照資料の書き方である。
- `Unit.upgrade-skill`(kept): エージェントが、依存パッケージをアップグレードし、監査まで終えられるという主な機能は変わらず、変わるのは参照資料の書き方である。
- `Unit.close-skill`(kept): エージェントが、サイクル終了後に、クロージングできるという主な機能は変わらず、変わるのは参照資料の書き方である。
