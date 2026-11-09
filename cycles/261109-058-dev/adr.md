# ADR 058

## 01: ADR のエントリは、Scope から始まり、In/Out の Scope と、Adopted の一言と、Allowed/Forbidden の Policy を、どの順に置くか

### Context

- C1: いまの `adr/SKILL.md` の `One entry` は、`Context`、`Scope`、`Pre-research`、`Discussion Loop`、`Decision`、`Definition`、`Affected`、`Next entry` の順であり、`adr.format.md` の `Shape` も同じ順である（`.pi/skills/adr/SKILL.md:62-217`、`.pi/skills/adr/references/adr.format.md:7-55`）。
- C2: いまの `Scope` の `View` は `Change`・`Quality`・`Operation` の 3 軸の表であり、出力は軸の下に kind ごとの `in`/`out` を置く（`.pi/skills/adr/SKILL.md:91-103`、`.pi/skills/adr/references/adr.format.md:68-72`）。
- C3: いまの `Decision` は `Adopted` の下に `Add`・`Update`・`Drop`・`Keep` を置き、`Denied` を別に持つ。`Keep` は「触らないものとその理由」、`Denied` は「明示的にしないこと」である（`.pi/skills/adr/SKILL.md:161-173`、`.pi/skills/adr/references/adr.format.md:79-85`）。
- C4: ADR 057 では `Keep` と `Denied` が重なった。`Keep` の「表は短いものだけに使うこと（C15, F12）」と `Denied` の「長い説明を表にすること - 表が壊れる（C15, F12）」、`Keep` の「frontmatter の name と description（C14）」がその例である（`cycles/261107-057-dev/adr.md:109-127`）。
- C5: 057 の plan のレビューは `Adopted`・`Denied`・`Scope`・`Definition` だけを受け取り、`Keep` を受け取っていない。`Keep` の「frontmatter を変えない」はレビューから見えず、8 件の抜けの 1 つになった（`.pi/skills/plan/SKILL.md:171`、`.pi/skills/plan/references/tasks.md:8`）。
- C6: オーナーは、エントリを `Scope` から始め、`Scope` の合意後に `Scope` と `Context` を埋めることを決めた。最初の `Scope` は推量でよく、`Discussion Loop` で `Context` と `Research & Trial` と一緒に書き換えてよい（024 の ideas、オーナーの回答 2）。
- C7: オーナーは、`Scope` の `View` を `Axis` で分割せず、kind と説明の 2 列の表にし、`Scope` の出力を `In:` と `Out:` の 2 つに分割することを決めた（024 の ideas）。
- C8: オーナーは、`Adopted` をエントリ全体の「何がどうなるか」の一言にし、その下に `Add`・`Update`・`Drop` を置くこと、`Keep` と `Denied` を `Policy` にまとめ、`Allowed:` と `Forbidden:` に分けることを決めた（024 の ideas、オーナーの回答 1）。
- C9: `adr.mjs` の `entrySkeleton` は、いまの順序と `Keep`/`Denied` を出力する。`index.test.ts` は skeleton に `Keep:` と `Denied:` があることと、現在の `Decision` の形を前提にしている（`.pi/skills/adr/scripts/adr.mjs:7-52`、`.pi/skills/adr/scripts/index.test.ts:213-248`、`:286-324`、`:572`）。
- C10: `adr/references/tasks.md` の affected の調査は、`Context`・`Scope`・`Adopted`・`Definition` を読み、`Denied` の行を飛ばし、`Scope` の各 kind の `in` を使う（`.pi/skills/adr/references/tasks.md:22-23`、`:35`）。
- C11: 現在の ADR のエントリ 02 と 03 は、いまの骨組みで作られた。新しい形式を使うのは次のサイクルからとし、現在のエントリは書き換えない（分割の合意）。
- C12: いまの `Scope` の手順は「Every kind, one by one, in or out」と定める。`Axis` を消しても、すべての kind をたどる手順は残す必要がある（`.pi/skills/adr/SKILL.md:83-103`）。
- C13: いまの `Decision` の手順は「`Adopted` に `Add`・`Update`・`Drop`・`Keep` を書き、明示的にしないことを `Denied` に書く」と定める（`.pi/skills/adr/SKILL.md:161-173`）。
- C14: `adr.format.md` は `Definition` をエントリの最後のセクションとし、`Research & Trial` を `Scope` と `Decision` の間に置く。`Shape` は上から順に書ける形である（`.pi/skills/adr/references/adr.format.md:31-61`）。
- C15: 057 の `Keep` は「変えないという事実」と「変えてはいけない制約」を混ぜていた。`Policy` は `Allowed` と `Forbidden` を分割し、`C`/`F` の参照を保つ必要がある（`cycles/261107-057-dev/adr.md:109-127`）。
- C16: `adr.mjs` の `checkEntry` は `Decision` の `C`/`F` の参照だけを読み、`Keep`/`Denied` のセクション名は読まない。`Policy` に変えても、参照が `Decision` にあれば検査は通る（`.pi/skills/adr/scripts/adr.mjs:119-151`）。
- C17: `Scope` の `In`/`Out` と `Policy` の名前は、plan の `Steps` と `Policy`、work の `Policy` の追随が読むため、三つのエントリで同じ名前にする必要がある（分割の設計）。
- C18: エントリの新しい形は、`Scope`、`Context`、`Research & Trial`、`Decision`、`Definition` の順である。`Scope` と `Decision` の形は次のとおりである。

```md
**Scope**

- In:
  - <kind>: <何をするか>
- Out:
  - <kind>: <何をしないか>（理由）

**Context**

- C<n>: <前提。いまの振る舞い>
- C<n>: <制約。Who の要望、上限、変えないと決めたこと>

**Research & Trial**

- F<n> (C<n>): <事実>。出所。

**Decision**

- Status: <決定の前は空。**accepted** | **rejected**（理由）>
- Adopted: <エントリ全体として何がどうなるか>
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

**Definition**

- `Unit.<name>`(updated): <新しい行>
- `Unit.<name>`(kept): <その行が動かない理由>
```

`Scope` の `View` は次の 13 kind の表である。

| kind                | what it is                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| behaviour           | what the product does; the actions a user takes, and what the product returns                     |
| refactor            | the shape of the code or the document, without changing what the product does                     |
| dependency          | a package, a library, or an external contract the product relies on                               |
| naming              | the name of a section, field, file, or identifier in the product                                  |
| format              | the section order, headings, table shape, and fences of a product document                        |
| prose               | the wording, sentence structure, and voice of a product document                                  |
| speed               | the time or the resources the work takes                                                          |
| security            | secrets, permissions, or exposure in the product                                                  |
| compatibility       | an existing reference, a past record, or another part of the product that names the changed thing |
| errors              | a check, a test, a validation, or a failure the product must keep                                 |
| deploy              | the distribution or release of the product                                                        |
| migration           | an existing record or an installed version of the product that must be moved                      |
| logs and monitoring | the records or signals the product leaves                                                         |

### Scope

- Change:
  - **behaviour**: in — エントリを `Scope` から始め、`Scope` の合意後に `Scope` と `Context` を埋める。最初の `Scope` は推量でよく、`Discussion Loop` で書き換えてよい。`Decision` は `Keep`/`Denied` ではなく `Policy` を使う。
  - refactor: in — `adr.mjs` の `entrySkeleton` と `index.test.ts` を新しい形に追随させる。
  - dependency: out — パッケージは変えない（理由: 対象はスキルとスクリプトだけである）。
  - naming: in — `Scope` の出力を `In`/`Out` にし、`Policy` の下を `Allowed`/`Forbidden` にする。`Keep` と `Denied` は新しい形から消す。
  - format: in — `adr/SKILL.md`、`adr/references/adr.format.md`、`adr/references/tasks.md` を新しい順序と形に組み替える。
  - prose: in — 新しい順序と形に合わせて、手順と説明の文を書き直す。
- Quality:
  - speed: out — 読み込みの速さやトークン数は目標にしない（理由: 判断の材料がない）。
  - security: out — 秘密情報を扱わない（理由: 対象はリポジトリ内の文書とスクリプトである）。
  - compatibility: in — plan のレビューが読む `Denied`/`Keep` の名指しは、エントリ 02 で `Policy` に追随させる。現在の ADR のエントリ 02 と 03 は、いまの骨組みのままにする。`checkEntry` は `Decision` の `C`/`F` を読むので、その形を保つ。
  - **errors**: in — `--check` が通り、`index.test.ts` が通る。affected の調査タスクが `Scope` の `In` と `Policy` を読む。
- Operation:
  - deploy: out — スキルは `harness:pull` の既存の経路で配られ、このサイクルでは配布の操作をしない。
  - migration: out — 過去のサイクルの ADR と、現在の ADR のエントリ 02・03 は書き換えない。
  - logs and monitoring: out — 監視は設けない（理由: 変更は文書とスクリプトである）。

### Research & Trial

- F1 (C4): MADR の full/minimal には `Policy`・`Allowed:`・`Forbidden:` がなく、セクションは `Context and Problem Statement`・`Decision Drivers`・`Considered Options`・`Decision Outcome`・`Consequences`（`Good`/`Bad`）・`Confirmation`・`Pros and Cons`・`More Information` である。`Consequences` の `Good`/`Bad` は帰結の肯定と否定を分けるが、許可と禁止の分割ではない。出所: https://raw.githubusercontent.com/adr/madr/main/template/adr-template.md 、https://raw.githubusercontent.com/adr/madr/main/template/adr-template-minimal.md
- F2 (C3): Nygard の ADR には `Policy`・`Allowed:`・`Forbidden:` がなく、セクションは `Title`・`Status`・`Context`・`Decision`・`Consequences` である。`Consequences` は肯定・否定・中立の帰結を書くが、許可と禁止の分割ではない。出所: https://raw.githubusercontent.com/architecture-decision-record/architecture-decision-record/main/locales/en-001/templates/decision-record-template-by-michael-nygard/index.md 、https://www.cognitect.com/blog/2011/11/15/documenting-architecture-decisions
- F3 (C3): Y-statement には `Policy`・`Allowed:`・`Forbidden:` がなく、決定を 1 文に圧縮する（短形は `In the context of <>, facing <> we decided for <> to achieve <>, accepting <>`）。出所: https://adr.github.io/adr-templates/
- F4 (C3): adr-tools のテンプレート（`src/template.md`、`src/init.md`）には `Policy`・`Allowed:`・`Forbidden:` がなく、セクションは `Status`・`Context`・`Decision`・`Consequences` である。出所: https://raw.githubusercontent.com/npryce/adr-tools/master/src/template.md 、https://raw.githubusercontent.com/npryce/adr-tools/master/src/init.md
- F5 (C8): `Allowed`/`Forbidden` に近い形は、MADR の `Consequences` の `Good`/`Bad`、決定記録の規範表現の `must`/`should`/`may`/`must not`、AI エージェントのスコープ固定テンプレートの `Allowed Files Or Surfaces`/`Do Not Touch` と `Allowed Commands`/`Forbidden Commands` にある。ただし、いずれも `Policy` セクションの下の `Allowed:`/`Forbidden:` ではない。出所: https://raw.githubusercontent.com/adr/madr/main/template/adr-template.md 、https://github.com/tooppoo/installerer/blob/main/docs/adr/README.md 、https://ivelly42.github.io/agent-ops-command-center/ai-agent-scope-freeze-template.md
- F6 (C15): このプロジェクトの `.pi/skills/adr` と `cycles/261107-057-dev` には、`Policy`・`Allowed`・`Forbidden` の文字列が 0 件である。現在の形は `Adopted` の下の `Add`/`Update`/`Drop`/`Keep` と、別の `Denied` である。出所: `.pi/skills/adr/references/adr.format.md:36-49`、`.pi/skills/adr/references/adr.format.md:79-85`
- F7 (C3): `Adopted` の一言と `Add`/`Update`/`Drop`/`Keep` の組み合わせは、このプロジェクトの現在の形である。外部の形式では、MADR の `Decision Outcome` の `Chosen option: ..., because ...` が一言の結論に近いが、`Add`/`Update`/`Drop` の内訳を持たない。Nygard の `Decision` は `We will ...` の全文、Y-statement は 1 文、adr-tools は決定の散文である。出所: `.pi/skills/adr/references/adr.format.md:79-85`、`cycles/261107-057-dev/adr.md:91-119`、https://raw.githubusercontent.com/adr/madr/main/template/adr-template.md
- F8 (C6): `Scope` を `Context` より先に置く順序は、MADR・Nygard・Y-statement・adr-tools のいずれにもない。MADR は `Context and Problem Statement` が先で、`Scope` セクションを持たず、`Context` の中で「決定のスコープを明示する」と述べる。このプロジェクトの現在も `Context` が先で `Scope` が後である。出所: https://raw.githubusercontent.com/adr/madr/main/template/adr-template.md 、`.pi/skills/adr/references/adr.format.md:9-30`、`.pi/skills/adr/SKILL.md:66-103`
- F9 (C7): `Scope` の出力を `In:` と `Out:` の 2 つに分ける形は、MADR・Nygard・Y-statement・adr-tools のいずれにもない。MADR の `Good`/`Bad` は帰結の分割であり、`Scope` の `In`/`Out` ではない。このプロジェクトの現在は 3 軸の下に kind ごとの `in`/`out` を置く。出所: https://raw.githubusercontent.com/adr/madr/main/template/adr-template.md 、`.pi/skills/adr/references/adr.format.md:68-73`、`.pi/skills/adr/SKILL.md:91-103`

### Decision

- Status: **accepted**
- Adopted: ADR のエントリを、`Scope` を先に置き、`In`/`Out` の `Scope`、`Adopted` の一言、`Allowed`/`Forbidden` の `Policy` を持つ形に組み替える。この形は既存の ADR の標準になく、このプロジェクトが選ぶ（C5, C18, F1, F2, F3, F4, F5, F6, F7, F8, F9）。
  - Add:
    - `Scope` を `Context` の前に置く（C1, C6, C18）
    - `Scope` の `View` を kind と説明の 2 列の表にし、出力を `In:`/`Out:` にする（C2, C7, C17, C18）
    - `Adopted` をエントリ全体の一言にし、`Policy` の `Allowed`/`Forbidden` を置く（C3, C8, C15, C17, C18）
    - `adr.mjs` の `entrySkeleton` に新しい形を入れ、`index.test.ts` を追随させる（C9, C16）
  - Update:
    - `adr/SKILL.md` の `One entry` の順序を `Scope` → `Context` → `Pre-research` → `Discussion Loop` → `Decision` → `Definition` → `Affected` → `Next entry` にする（C1, C6, C12, C13）
    - `adr.format.md` の `Shape` と `Scope`/`Decision` の規則を新しい形にする（C2, C3, C14）
    - `adr/references/tasks.md` の affected の調査を、`Scope` の `In`、`Adopted`、`Policy`（`Forbidden` を飛ばす）、`Definition` を読む形にする（C10）
    - `Context` の書き方を、`Scope` の合意後に埋める形にする（C6）
    - `Scope` の手順を、最初の推量と `Discussion Loop` での書き換えを許す形にする（C6, C12）
    - `Decision` の手順を、`Adopted` の一言と `Policy` の `Allowed`/`Forbidden` にする（C8, C13）
  - Drop:
    - `Keep` と `Denied` を新しい形から消す（C3, C4, C8, C15）
    - `Axis` の 3 軸の表を `Scope` の `View` から消す（C2, C7, C12）
- Policy:
  - Allowed:
    - `Scope` の最初の提案は推量でよい（C6, C18）
    - `Discussion Loop` で `Scope` を書き換えてよい（C6, C18）
    - `Scope` の `In`/`Out` の kind は、表の 13 kind から選ぶ（C7, C18）
    - `Adopted` の一言は、エントリ全体の「何がどうなるか」を 1 文で書く（C8, C18）
    - `Policy` の `Allowed`/`Forbidden` の各行に `C`/`F` を付ける（C8, C16）
  - Forbidden:
    - `Keep` と `Denied` を新しい形に残すこと - 二つの意味が重なる（C3, C4, C15）
    - `Axis` の 3 軸を `Scope` の `View` に残すこと - kind と説明の 2 列にする（C7, C12）
    - `Scope` を `Context` の後に置くこと - `Scope` を先に決める（C6, C18）
    - 現在の ADR のエントリ 02・03 を新しい形に書き換えること - 新しい形は次のサイクルから使う（C11）
    - `checkEntry` の `Decision` の `C`/`F` の読み方を変えること - その形を保つ（C16）

### Definition

- `Unit.adr-skill`(kept): オーナーが決め、エージェントが記録できるという主な機能は変わらず、変わるのはエントリの順序と、`Scope`・`Adopted`・`Policy` の形である。

## 02: plan は、Goal と、ADR の Add/Update/Drop を affected のファイル群に当てる手順と、スライスごとの Policy を、どの形で持ち、レビューでどう確かめるか

### Context

- C1: いまの `plan/SKILL.md` は、`## Procedure` を 1. `Read the ADR's entries`、2. `Read the affected`、3. `Cut, and present`、4. `Write the plan md from the affected`、5. `Research the lines the plan cannot write`、6. `Review, one plan at a time`、7. `Japanese Proofread`、8. `Show the owner` の順に持つ（`.pi/skills/plan/SKILL.md:14-227`）。
- C2: いまの plan md の形は、`No`、`Place`、`Boundary Plans`、`## Design`（四つの問い）、`## Files`、`## Slices`（`## 1.<name>`、`### Types`、`### Steps`、`### Verify`）、`## Notes`、`## Work Review`、`## Acceptance` である（`.pi/skills/plan/references/format.md:7-114`）。
- C3: いまの `Steps` の規則は、1 ステップを 1 つのもの（ファイル、ファイル内のモジュール、ディレクトリ）とし、行は「何がどうなるか」を書き、ADR かチャットが決めた中身はステップの下のフェンスに置き、ステップは作業の順に番号を振る（`.pi/skills/plan/references/format.md:160-182`）。
- C4: いまの cut の提示は、plan ごとに `ADR`、`Place`、`Summary`、`Why` を書き、最後に `## Order:` を置く。`Goal` はない（`.pi/skills/plan/references/cut.md:27-47`）。
- C5: いまの plan のレビューは 1 回で、plan md、名指すファイル、ADR の `Adopted`・`Denied`・`Scope`・`Definition` を受け取り、`Goal`・`Integration`・`Files`・`Types`・`Cases`・`Checks`・`Flow` の 7 観点で見る（`.pi/skills/plan/SKILL.md:167-190`、`.pi/skills/plan/references/tasks.md:5-34`）。
- C6: 057 の plan のステージでは、4 つの plan md を書き、レビューが 29 件（6+5+9+9）の所見を出し、オーナーの 17:08 の確認で 8 件の抜けが見つかり、17:11 の「初見の `code` は書けるか」という指摘で 3 件の不足が見つかった（`cycles/261107-057-dev`）。
- C7: 057 の plan 01 のステップ 1 は、3 ファイルの全体を 1 つの長い `update:` 行で書き、plan 02 と 03 も同じ形である。例のフェンスは一部のステージだけであり、残りは「同じ形」で済ませる形になっている（`cycles/261107-057-dev/plan/01-procedure-skills.md:41-89`、`02-flow-skill.md:43-96`、`03-judgment-skill.md:48-113`）。
- C8: オーナーは、`Goal` を cut の提示時に一緒に出し、plan md では `## Design` の上に `## Goal` として書くことを決めた。`Goal` は `<何が>` が `<どうなる>` という 1 行である（024 の ideas）。
- C9: オーナーは、`Steps` を、`affected` のファイル群に ADR の `Add`・`Update`・`Drop` を当てる手順にし、1 つの変更を 1 行にし、ファイルの下に細分化することを決めた。フェンスの位置は 024 の例のとおりである（024 の ideas）。
- C10: オーナーは、`Policy` を各スライスの `Steps` と `Verify` の間に置き、ADR の `Policy` のうちそのスライスに関係するものを漏れなく複製することを決めた。繰り返しは許し、1 つのスライスにしか当たらない policy はそのスライスだけに書く（024 の ideas、オーナーの回答 4）。
- C11: オーナーは、`slice` または `step` を作る過程で、ADR で決まっていないこと、または `affected` にないファイルを触ることが出たら、レビューと校正の前にオーナーへ報告することを決めた。なければ「なし」と報告し、ここで全体を一度オーナーに確認する（024 の ideas）。
- C12: オーナーは、plan のレビューの観点を plan md の項目に合わせ、2 回回すことを決めた。2 回目は、1 回目の修正が入ったかを見る（024 の ideas、オーナーの回答 3）。
- C13: `close/SKILL.md:182` と `:232` は「plan skill, steps 4 to 8」を名指しする。plan のステップ番号が動くと、この 2 か所が追随する（`.pi/skills/close/SKILL.md:182`、`:232`）。
- C14: `yolo/SKILL.md:32` は plan md の項目（files、slices、types、steps、verify、record）を列挙し、`:34` は 7 観点（`Goal`・`Integration`・`Files`・`Types`・`Cases`・`Checks`・`Flow`）を名指しする。plan md の項目と観点が動くと、この 2 か所が追随する（`.pi/skills/yolo/SKILL.md:32`、`:34`）。
- C15: `close/scripts/collect.mjs` は plan md を `##` と `###` で分割し、`Findings`・`Unplanned`・`Commit`・`Stopped`・`Ran`・`Stale`・`Unlisted`・`Gaps`・`Unproven`・`Noise`・`Doubts` を読む。`## Goal` と `### Policy` は読まない。読むセクションは `## Notes`、`## Work Review`、`## Acceptance` である（`.pi/skills/close/scripts/collect.mjs:22-34`、`:48-84`）。
- C16: `work/SKILL.md:122` と `work/references/tasks.md:27` は `Adopted` の行を名指しする。`Adopted` の形が変わると、この 2 か所が追随する（`.pi/skills/work/SKILL.md:122`、`.pi/skills/work/references/tasks.md:27`）。
- C17: いまの plan のレビューの `Goal` は、ADR の `Adopted` と `Scope` を運んでいるか、`Denied` の禁止をしていないかを見る。`Policy` と plan 自身の `Goal` は見ない（`.pi/skills/plan/references/tasks.md:10`）。
- C18: 057 の plan は `Added` の proofread に英語の `SKILL.md` を入れ、オーナーが訂正した。`format.md:238` は「proofread は、そのスライスが直す日本語の文書であり、本文が日本語でないファイルではない」と定める（`.pi/skills/plan/references/format.md:238`）。
- C19: いまの `Design` の四つの問いは、モジュールの統合・分割に関するもので、ADR の規則を受ける欄ではない（`.pi/skills/plan/references/format.md:116-123`）。
- C20: いまの `cut.md` は、作業が読むもので plan を切り、場所で切らない。1 plan は 1 worktree で、書く前にオーナーが合意する（`.pi/skills/plan/references/cut.md:3-20`、`.pi/skills/plan/SKILL.md:53-67`）。
- C21: いまの plan の `Steps` はファイルごとに 1 行で、`Slices` はチェックで切る。新しいサブステップは、ステップの単位を「ファイル」から「ファイルと変更」に変える。`format.md` の「1 ステップは 1 つのもの」は、ファイルの下のサブステップを許す形に変わる（`.pi/skills/plan/references/format.md:160-182`）。
- C22: エントリ 02 は、エントリ 01 が決めた `Policy` の `Allowed`/`Forbidden` と、`Scope` の `In`/`Out` を読む。ADR の `Policy` が、plan の `Policy` の写し元になる（`adr.md` の `## 01:` の `Decision`）。
- C23: 057 の 8 件は、オーナーが ADR と plan を一行ずつ突き合わせて見つけた。レビューの `Goal` は判断で見るだけであり、列挙する形になっていない。新しいレビューの `Steps` と `Policy` は、ADR の `Add`・`Update`・`Drop` と `Policy` を漏れなく列挙して確かめる（`cycles/261107-057-dev`、`.pi/skills/plan/references/tasks.md:10`）。
- C24: いまの plan のレビューは `Cases`（テストケース）、`Checks`（検証）、`Flow`（矛盾・重複・抜け）を持つ。新しいレビューが `Slice` と `Other` にまとめても、この 3 つを落とさない（`.pi/skills/plan/references/tasks.md:14-16`）。
- C25: plan の新しい形と手順は次のとおりである。`Goal` は `## Design` の上に置き、`Steps` はファイルとサブステップに分割し、`Policy` は `Steps` と `Verify` の間に置く。手順は 1 から 9 で、5 がオーナー確認、7 がレビュー（2 回）である。

````md
**Goal**

<何が> が <どうなる>、1 行。

**Design**

- Inside:
  - Modules: ...
  - Dirs: ...
- Outside:
  - Extract: ...
  - Colocate: ...

**Files**

```text
<dir>/
  <file>                update
```

**Slices**

**1.<スライス名>**

**Types**

```ts
...
```

**Steps**

1. `<ファイル>`
   1. update: <1 つの変更>
   2. update: <1 つの変更>
   ```ts
   <ADR かチャットが決めた中身>
   ```
   3. drop: <1 つの変更>
2. Outside: `<affected.md の ### External の項目>`
   1. update: <1 つの変更>

**Policy**

- Allowed:
  - <して良いこと>
- Forbidden:
  - <してはいけないこと> - <しない理由>

**Verify**

- Always:
  ...
- Added:
  ...
````

### Scope

- Change:
  - **behaviour**: in — `Goal` を cut の提示時に出し、plan md の `## Design` の上に `## Goal` を置く。`Steps` を、`affected` のファイル群に ADR の `Add`/`Update`/`Drop` を当てる手順にし、1 つの変更を 1 行にする。`Policy` を各スライスに置く。レビューと校正の前に、ADR で決まっていないことと `affected` にないファイルをオーナーへ報告する。レビューを 2 回回す。
  - refactor: out — コードは変えない（理由: 対象はスキルと参照資料だけである）。
  - dependency: out — パッケージは変えない（理由: 同上）。
  - naming: in — `Goal`、`Policy`、`Allowed`、`Forbidden`、`Slice`、`Other` を新しい名前にする。レビューの観点を `Goal`・`Design`・`Files`・`Slice`（`Types`・`Steps`・`Policy`・`Verify`・`Cases`）・`Other` にする。`Steps` のサブステップを `<file>.<n>` で番号を振る。
  - format: in — `plan/SKILL.md`、`plan/references/format.md`、`plan/references/tasks.md`、`plan/references/cut.md` に、`## Goal`、`### Policy`、サブステップ、レビューの新しい形を入れる。
  - prose: in — 新しい手順とレビューの観点に合わせて、文を書き直す。
- Quality:
  - speed: out — 時間やトークン数は目標にしない（理由: 判断の材料がない）。
  - security: out — 秘密情報を扱わない（理由: 対象はリポジトリ内の文書である）。
  - compatibility: in — `close/SKILL.md:182` と `:232` の「plan skill, steps 4 to 8」、`yolo/SKILL.md:32` と `:34` の plan md の項目と 7 観点、`close/scripts/collect.mjs` の plan md の読み取り、`work/SKILL.md:122` と `work/references/tasks.md:27` の `Adopted` の名指しを追随させる。過去の plan md は書き換えない。
  - **errors**: in — レビューの 2 回（2 回目は 1 回目の修正の確認）、`Cases` と `Goal` の観点、`collect.mjs` の読み取り、`close`/`yolo` の名指しを確かめる。`pnpm test:related` と `pnpm typecheck` を `Verify` に置く。
- Operation:
  - deploy: out — スキルは `harness:pull` の既存の経路で配られ、このサイクルでは配布の操作をしない。
  - migration: out — 過去の plan md は書き換えない。現在のサイクルの plan md と、`ex-` plan は新しい形で書く。
  - logs and monitoring: out — 監視は設けない（理由: 変更は文書である）。

### Research & Trial

- F1 (C8): `Goal` を `<何が>` が `<どうなる>` の 1 行で書き、作業の提示と plan の両方に置く形は、既存の形式に完全一致がない。近い形は Implementation Plan の `Goal: [One sentence — what this builds]`、`Goal: {Brief goal statement from spec}`、Design Doc の `Goals`/`Non-goals`、RFC の `Abstract`/`Goals and non-goals` である。違いは、定型の 1 行ではなく、作業の提示と plan の両方に置く定めがないことである。出所: https://github.com/heliohq/ship/blob/main/skills/design/write-plan.md 、https://github.com/voxmedia/open-agent-toolkit/blob/main/.oat/templates/plan.md 、https://briansigafoos.com/design-docs/ 、https://newsletter.pragmaticengineer.com/p/software-engineering-rfc-and-design
- F2 (C10): `Policy` をスライスごとに置き、決定記録の `Allowed`/`Forbidden` を複製する形は、既存の形式に完全一致がない。近い形は Implementation Plan の `Global Constraints`、Design Doc の `Degree of constraint`・`Cross-cutting concerns` である。スライスごとの `Policy` 欄と `Allowed`/`Forbidden` の複製は確認できない。出所: https://github.com/heliohq/ship/blob/main/skills/design/write-plan.md 、https://microsoft.github.io/golazo/design-docs/ 、https://briansigafoos.com/design-docs/
- F3 (C9): `Steps` を、影響のあるファイル群に決定記録の `Add`/`Update`/`Drop` を当てる手順にし、1 つの変更を 1 行のサブステップにする形は、既存の形式に完全一致がない。近い形は `Affected paths`、`Decompose ADR into staged tasks`、`Each step is one action (2-5 minutes)` である。違いは、`Add`/`Update`/`Drop` の付番と 1 変更 1 行のサブステップの定めがないことである。出所: https://github.com/vercel/ai/blob/08cdf6ae/skills/adr-skill/assets/templates/adr-madr.md 、https://skills.rest/skill/implement-adr 、https://github.com/CoyoteLeo/superspec/blob/main/skills/ss-writing-plans/SKILL.md
- F4 (C12): レビューを 2 回回し、2 回目で 1 回目の修正を確かめる形は、既存の形式に完全一致がない。Design Doc と RFC は `Signoffs`、`Status: Draft|In Review|Approved`、`required and optional reviewers` を持つが、2 回のレビューと 2 回目の修正確認は確認できない。このプロジェクトの plan のレビューは 1 回、作業後の `Work Review` は 2 回で、2 回目は修正の確認である。出所: https://microsoft.github.io/golazo/design-docs/ 、https://www.lambrospetrou.com/articles/rfc-template/ 、`.pi/skills/plan/references/tasks.md:30-39`、`.pi/skills/plan/references/format.md:287-289`

### Decision

- Status: **accepted**
- Adopted: plan の md とレビューを、`Goal`、ADR の `Add`/`Update`/`Drop` を affected のファイル群に当てるサブステップ、スライスごとの `Policy`、オーナー確認のステップ 5、2 回のレビューを持つ形に組み替える。057 の 29 件・8 件・3 件の失敗を、この形で直す（C6, C16, C25, F1, F2, F3, F4）。
  - Add:
    - `## Goal` を `## Design` の上に置き、cut の `Goal` と `Summary` を両方残す（C4, C8, C25）
    - `Steps` をファイルとサブステップに分割し、1 つの変更を 1 行にする（C3, C9, C21, C25）
    - `### Policy` を `Steps` と `Verify` の間に置き、ADR の `Policy` を写す。`C`/`F` の参照は写さない（C10, C22, C25）
    - オーナー確認のステップ 5 を置く（C11, C25）
    - レビューを 2 回にし、観点を `Goal`・`Design`・`Files`・`Slice`・`Other` にする（C5, C12, C17, C19, C23, C24, C25）
  - Update:
    - `plan/SKILL.md` の手順を 1 から 9 にする。ステップ 1 の `Goal` の出所、ステップ 3 の cut、ステップ 4 の `Goal`/サブステップ/`Policy`、ステップ 5 のオーナー確認、ステップ 7 のレビュー、ステップ 9 の提示（C1, C8, C9, C10, C11, C12, C25）
    - `plan/references/format.md` の `Shape`、`Goal`、`Steps`、`Policy`、`Verify` を新しい形にする（C2, C3, C5, C18, C25）
    - `plan/references/tasks.md` のレビューを 2 回にし、観点と入力を新しい形にする（C5, C12, C17, C19, C23, C24）
    - `plan/references/cut.md` の提示に `Goal` を足す（C4, C8, C20）
    - `yolo/SKILL.md` の plan md の項目と観点を新しい形にし、ステップ 5 をエージェントの確認に置き換える（C14, C25）
    - `close/SKILL.md:182` と `:232` の「steps 4 to 8」を「steps 4 to 9」にする（C13, C25）
  - Drop:
    - ファイルごとの 1 行の `Steps`（C3, C7, C9, C21）
    - 1 回だけの plan レビュー（C5, C12）
    - `plan/SKILL.md` の `Adopted`→mark 表の `Keep` の行（C3, C5）
    - `plan/references/format.md:214` の `Denied` の名指し（C5, C17）
- Policy:
  - Allowed:
    - `Goal` は 1 行、cut の `Goal` と `Summary` は両方（C4, C8）
    - サブステップは 1 つの変更を 1 行（C9, C21）
    - `Policy` はスライスごとに、ADR の `Policy` を写す。`C`/`F` は写さない（C10, C22）
    - ステップ 5 で、ADR で決まっていないことと `affected` にないファイルを報告し、なければ「なし」と報告する（C11）
    - レビューの Round 2 は Round 1 の修正を確かめる（C12）
  - Forbidden:
    - ファイルごとの 1 行の要約で済ませること（C3, C9, C21）
    - スライスに ADR の `Policy` を写さないこと（C10, C22）
    - `affected` にないファイルを、オーナーへ報告せずに触ること（C11）
    - レビューの Round 2 で plan 全体を見直すこと（Round 2 は修正の確認である）（C12）
    - plan の `Policy` に `C`/`F` の参照を入れること（C22）
    - `close/scripts/collect.mjs` を変えること（C15）

### Definition

- `Unit.plan-skill`(kept): エージェントが、1 plan 分の作業の形と順序を決めて書けるという主な機能は変わらず、変わるのは plan の手順、md の形、レビューの観点である。

## 03: work は、plan の Goal と Policy にどう従い、work のレビューでどう確かめるか

### Context

- C1: `work/SKILL.md` の手順は 1. `Read the plan and its record`、2. `Commit the documents`、3. `Set the place`、4. `Run the slices`、5. `Clean the tests`、6. `Review`、7. `Acceptance`、8. `Merge`、9. `Report` である。ステップ 1 は plan md の `Files`、各スライスの `Types`・`Steps`・`Verify`、`## Notes`、`Place` を読むが、`Goal` と `Policy` は読まない（`.pi/skills/work/SKILL.md:14-247`）。
- C2: ステップ 4 は、plan md を 1 つの `code` サブエージェントに渡し、そのタスクは `work/references/tasks.md` の `Slices` にある。タスクは「スライスを順に、`Steps`、`Verify`、コミット、記録」と定める（`.pi/skills/work/SKILL.md:63-99`、`.pi/skills/work/references/tasks.md:5-18`）。
- C3: ステップ 6 のレビューは、`Stale`・`Unlisted`・`Gaps`・`Unproven`・`Noise` の 5 観点と `Doubts` を持ち、`Gaps` は「スライスが飛ばした抜け、チェックが動かさない振る舞い」である（`.pi/skills/work/SKILL.md:131-171`、`.pi/skills/plan/references/format.md:287-307`、`.pi/skills/work/references/tasks.md:35-63`）。
- C4: `work/SKILL.md:122` と `work/references/tasks.md:27` は「`Adopted` の行にケースがない」と書く。`Adopted` はエントリ全体の一言と `Add`/`Update`/`Drop` を持つため、「ケースがない」は `Add`/`Update`/`Drop` の行を指す（`.pi/skills/work/SKILL.md:122`、`.pi/skills/work/references/tasks.md:27`）。
- C5: オーナーは、work のスキルとタスクが plan の `Policy` に従うことを決めた（024 の ideas）。
- C6: エントリ 02 は、plan の `Policy` を各スライスの `Steps` と `Verify` の間に置き、ADR の `Policy` を写し、`C`/`F` の参照は写さないこと、`Goal` を `## Design` の上に置くことを決めた（`adr.md` の `## 02:` の `Decision`）。
- C7: plan の `Policy` は、`code` サブエージェントが読む唯一の指示であり、`code` は ADR を読まない。タスクは `Policy` の追随を運ぶ必要がある（`.pi/skills/work/references/tasks.md:3`）。
- C8: work のレビューの `Gaps` では、plan の `Policy` の `Forbidden` が禁じたことをする手順、または `Policy` を守らなかった作業を、抜けとして見ることができる。`format.md` の `Gaps` の定義は「スライスが飛ばした抜け」であり、`Policy` の違反を含められる（`.pi/skills/plan/references/format.md:293`）。
- C9: `Adopted` の行の「ケースがない」は、`Add`/`Update`/`Drop` の行を指す。`Adopted` の一言にはケースがない（`.pi/skills/work/SKILL.md:122`、`.pi/skills/work/references/tasks.md:27`）。
- C10: work の `## Notes`、`## Work Review`、`## Acceptance` が記録である。`Gaps` の所見は `fixed` か `left` を持ち、`close` は `left` を残りとして読む（`.pi/skills/work/SKILL.md:131-171`、`.pi/skills/plan/references/format.md:301-307`）。
- C11: `work/SKILL.md` の `## How not to write this` は「抜けを黙って直さない。記録に残す」と定める（`.pi/skills/work/SKILL.md:248-255`）。
- C12: ステップ 9 は、オーナーへ 1 回だけ、plan が届けたもの、記録の抜け、次の plan が待つものを報告する（`.pi/skills/work/SKILL.md:242-247`）。
- C13: `work/references/tasks.md` の `Slices` は、`code` サブエージェントに plan md を読ませ、スライスを順に実行させる。`Goal` と `Policy` の追随を足す位置は、このタスクの冒頭である（`.pi/skills/work/references/tasks.md:5-18`）。
- C14: `work/references/tasks.md` の `Review` の `Gaps` は「チェックが動かさない振る舞い」であり、`Policy` の違反を足す位置は、この行である（`.pi/skills/work/references/tasks.md:43`）。
- C15: `work/references/tasks.md` の `Clean the tests` は `Adopted` の行を名指しする。`Adopted` の形が変わると、この行が追随する（`.pi/skills/work/references/tasks.md:27`）。
- C16: work の `## Acceptance` の `Findings`/`Doubts` は、plan のチェックの所見と注記である。`Policy` の違反は、レビューの `Gaps` の所見として扱う（`.pi/skills/work/SKILL.md:173-215`）。
- C17: work の新しい追随は次のとおりである。
  1. `work/SKILL.md` のステップ 1 の読み取りに `Goal` と `Policy` を足す。
  2. `work/SKILL.md` のステップ 5 の `Adopted` の行を `Add`/`Update`/`Drop` の行にする。
  3. `work/SKILL.md` のステップ 6 の `Notes` に、`Gaps` が plan の `Policy` と `Goal` を読むことを足す。
  4. `work/SKILL.md` の `## How not to write this` に、plan の `Policy` と `Goal` をタスクから落とさないことを足す。
  5. `work/references/tasks.md` の `Slices` タスクの冒頭に、plan の `Goal` と各スライスの `Policy` を読み、従うことを足す。
  6. `work/references/tasks.md` の `Clean the tests` の `Adopted` の行を `Add`/`Update`/`Drop` の行にする。
  7. `work/references/tasks.md` の `Review` の `Gaps` に、plan の `Policy` の `Forbidden` に反する手順と、plan の `Goal` に届かない抜けを足す。

### Scope

- Change:
  - **behaviour**: in — work のステップ 1 が plan の `Goal` と `Policy` を読み、`Slices` タスクが `Goal` と `Policy` に従い、work のレビューの `Gaps` に `Policy` と `Goal` の抜けを足す。
  - refactor: out — コードは変えない（理由: 対象はスキルと参照資料だけである）。
  - dependency: out — パッケージは変えない（理由: 同上）。
  - naming: in — `Adopted` の行を `Add`/`Update`/`Drop` の行にする。`Gaps` の説明に `Policy` と `Goal` を足す。
  - format: in — `work/SKILL.md` のステップ 1、5、6 と、`work/references/tasks.md` の `Slices`、`Clean the tests`、`Review`。
  - prose: in — 新しい追随に合わせて文を書き直す。
- Quality:
  - speed: out — 時間やトークン数は目標にしない（理由: 判断の材料がない）。
  - security: out — 秘密情報を扱わない（理由: 対象はリポジトリ内の文書である）。
  - compatibility: in — plan の `Policy`/`Goal`（エントリ 02）、`close` の `left` の読み、`plan/references/format.md` の `Gaps` の定義（変えない）。
  - **errors**: in — `Gaps` の `Policy`/`Goal` の所見、`Adopted` の行の追随、work の記録。
- Operation:
  - deploy: out — スキルは `harness:pull` の既存の経路で配られ、このサイクルでは配布の操作をしない。
  - migration: out — 過去の plan md は書き換えない。
  - logs and monitoring: out — 監視は設けない（理由: 変更は文書である）。

### Research & Trial

なし

### Decision

- Status: **accepted**
- Adopted: work のエージェントとタスクが plan の `Goal` と `Policy` を読み、`Slices` タスクが `Policy` に従い、work のレビューの `Gaps` が `Policy` の違反と `Goal` に届かない抜けを見る形に組み替える。ステップ 9 の報告と `Acceptance` の `Findings`/`Doubts` は変えない（C5, C6, C7, C12, C16, C17）。
  - Add:
    - ステップ 1 の読み取りに `Goal` と `Policy` を足す（C1, C6, C17）
    - `Slices` タスクの冒頭に、plan の `Goal` と各スライスの `Policy` を読み、従うことを足す（C2, C7, C13, C17）
    - `Gaps` に、plan の `Policy` の `Forbidden` に反する手順と、plan の `Goal` に届かない抜けを足す（C3, C8, C14, C17）
  - Update:
    - `work/SKILL.md` のステップ 1、5、6 と `## How not to write this` を新しい追随にする（C1, C4, C9, C11, C17）
    - `work/references/tasks.md` の `Slices`、`Clean the tests`、`Review` を新しい追随にする（C2, C4, C13, C14, C15, C17）
    - `Gaps` が plan の `Policy` と `Goal` を読むことを、`work/SKILL.md` の `Notes` と `work/references/tasks.md` の `Review` に書く（C3, C8, C14）
  - Drop:
    - `Adopted` の行の言い方を work に残すこと（C4, C9, C15）
- Policy:
  - Allowed:
    - work は plan の `Goal` と `Policy` を読む（C6, C7）
    - `Slices` タスクは `Goal` と `Policy` に従う（C7, C13）
    - `Gaps` は `Policy` の違反と `Goal` に届かない抜けを足す（C3, C8, C14）
    - `Policy` の違反は `Gaps` の所見として扱い、`left` は `close` が読む（C10, C16）
  - Forbidden:
    - `Gaps` の外に新しい `Policy` 観点を置くこと（C3, C8）
    - `format.md` の `Gaps` の定義を変えること（C8）
    - `code` が ADR を読むこと（C7）
    - `Adopted` の行の言い方を work に残すこと（C4, C9, C15）
    - plan の `Policy` に `C`/`F` の参照を入れること（C6）

### Definition

- `Unit.work-skill`(kept): エージェントが、plan を 1 つずつ片付けられるという主な機能は変わらず、変わるのは work の読み取り、タスク、レビューの `Gaps` である。

## 04: work は、受入とマージの間に、オーナー確認をどう置き、yolo でどう飛ばすか

### Context

- C1: `work/SKILL.md` のステップ 7 は `Acceptance`、8 は `Merge`、9 は `Report` である。ステップ 7 の `## Acceptance` は `Ran`・`Findings`・`Doubts` を持ち、ステップ 8 のマージ、ステップ 9 の報告へ続く（`.pi/skills/work/SKILL.md:173-247`）。
- C2: `## Acceptance` の `View` は、オーナーの目（`the front in cmux-browser`、`a base plan's look after each slice`）を持つ（`.pi/skills/work/SKILL.md:184-201`）。
- C3: `## Acceptance` の `Notes` は「A `yolo` plan passes that look」と定める（`.pi/skills/work/SKILL.md:201`）。
- C4: `close/SKILL.md:45` は「work step 8 green」と書き、マージのステップを指す（`.pi/skills/close/SKILL.md:45`）。
- C5: `yolo/SKILL.md` の `### 2. work` のステップ 2 は「the acceptance, and the merge」と書き、`Note` は「skips: the report to the owner」と定める（`.pi/skills/yolo/SKILL.md:41-52`）。
- C6: オーナーは、受入とマージの間にオーナー確認を置き、`yolo` でそれを飛ばすことを決めた（オーナーのメッセージ）。
- C7: 新しいステップ 8 は、マージを 9、報告を 10 に動かす。`close/SKILL.md:45` の「work step 8」と、`yolo/SKILL.md` の `### 2. work` の `Note` が追随する。
- C8: ステップ 7 の `Acceptance` はエージェントのチェックであり、新しいステップ 8 はオーナーの OK である。ステップ 9 のマージ、ステップ 10 の報告へ続く。
- C9: `## Acceptance` の `View` のオーナーの目は `front` と `base` に限られる。新しいステップ 8 は受入の全体を見せ、`yolo` は C3 の前例に倣って飛ばす。
- C10: `close/SKILL.md:45` の「work step 8 green」は `does` の行であり、新しいマージはステップ 9 である。したがって、この行は「work step 9 green」に追随する。
- C17: work の新しいステップ 8 と手順は次のとおりである。受入の後にオーナー確認を置き、マージを 9、報告を 10 にする。`yolo` はステップ 8 を飛ばす。

```md
### 8. The owner's confirmation

Steps:

1. Show the owner the `## Acceptance`'s `Ran`, `Findings` and `Doubts`.
2. Wait for their OK before the merge.
3. A `yolo` plan passes this confirmation: the agent's acceptance check is the confirmation.

View:

| case           | who closes it |
| -------------- | ------------- |
| the owner's OK | the owner     |
| a `yolo` plan  | the agent     |

Notes:

- The owner's word closes it.
- The merge does not start before it.
- A `yolo` plan passes this confirmation.
```

`close/SKILL.md:45` の「work step 8」は「work step 9」にする。`yolo/SKILL.md` の `### 2. work` のステップ 2 は「the acceptance, the owner confirmation is passed, and the merge」にし、`Note` は「skips: the report to the owner, and the owner confirmation before the merge」にする。

### Scope

- Change:
  - **behaviour**: in — 受入の後に、マージの前のオーナー確認をステップ 8 に置く。マージを 9、報告を 10 に動かす。`yolo` はステップ 8 を飛ばす。
  - refactor: out — コードは変えない（理由: 対象はスキルだけである）。
  - dependency: out — パッケージは変えない（理由: 同上）。
  - naming: in — ステップの番号を 8・9・10 にする。`close/SKILL.md:45` の「work step 8」を「work step 9」にする。
  - format: in — `work/SKILL.md` のステップ 8・9・10、`close/SKILL.md:45`、`yolo/SKILL.md` の `### 2. work` の `Note`。
  - prose: in — 新しいステップと `yolo` の飛ばし方に合わせて文を書き直す。
- Quality:
  - speed: out — 時間やトークン数は目標にしない（理由: 判断の材料がない）。
  - security: out — 秘密情報を扱わない（理由: 対象はリポジトリ内の文書である）。
  - compatibility: in — `close/SKILL.md:45` の「work step 8」、`yolo/SKILL.md` の `### 2. work` の `Note`、`work/SKILL.md` の受入とマージ。
  - **errors**: in — `close` と `yolo` の名指し、ステップの番号、`yolo` の飛ばし方。
- Operation:
  - deploy: out — スキルは `harness:pull` の既存の経路で配られ、このサイクルでは配布の操作をしない。
  - migration: out — 過去の plan md は書き換えない。
  - logs and monitoring: out — 監視は設けない（理由: 変更は文書である）。

### Research & Trial

なし

### Decision

- Status: **accepted**
- Adopted: work の受入とマージの間にオーナー確認のステップ 8 を置き、マージをステップ 9、報告をステップ 10 にする。`yolo` はステップ 8 を飛ばす（C6, C7, C8, C17）。
  - Add:
    - ステップ 8 のオーナー確認を置く（C2, C3, C6, C7, C8, C9, C17）
    - マージをステップ 9、報告をステップ 10 にする（C1, C7, C8, C17）
    - `yolo` はステップ 8 を飛ばす（C3, C5, C7, C9, C17）
  - Update:
    - `work/SKILL.md` のステップ 8・9・10 を新しい形にする（C1, C2, C3, C7, C8, C9, C17）
    - `close/SKILL.md:45` の「work step 8」を「work step 9」にする（C4, C7, C10, C17）
    - `yolo/SKILL.md` の `### 2. work` のステップ 2 と `Note` を新しい形にする（C5, C7, C9, C17）
  - Drop:
    - 旧ステップ 8・9 の番号（C1, C7, C8）
    - `close` の「work step 8」（C4, C10）
- Policy:
  - Allowed:
    - ステップ 8 は `Ran`・`Findings`・`Doubts` を見せる（C2, C6, C8）
    - マージの前にオーナーの OK を待つ（C6, C8）
    - `yolo` はステップ 8 を飛ばす（C3, C5, C9）
    - `close` と `yolo` の追随（C4, C5, C7, C10）
  - Forbidden:
    - オーナーの OK の前にマージすること（C6, C8）
    - `yolo` がオーナーを待つこと（C3, C5, C9）
    - `close` の「work step 8」を残すこと（C4, C10）
    - `yolo` の `Note` から飛ばすことを落とすこと（C5, C9）
    - ステップ 8 で plan の全体を見せること（C2, C6）

### Definition

- `Unit.work-skill`(kept): エージェントが、plan を 1 つずつ片付けられるという主な機能は変わらず、変わるのは受入の後のオーナー確認と、マージ・報告のステップ番号である。
