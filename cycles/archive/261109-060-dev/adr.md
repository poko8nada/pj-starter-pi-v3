# ADR 060

## 01: エントリが複数の関心事を持つとき、Decision とスキャフォールドはどの形にするか

### Scope

- In:
  - refactor: `adr.format.md` の Decision の形と、`adr.mjs` のテンプレートを、複数の関心事を並べられる形に変える。
  - naming: `Concern` をはじめ、Decision の欄の名前を決める。`Status`、`Policy`、`Add`、`Update`、`Drop` を残すか変えるかを含む。
  - format: Decision の欄の順序と入れ子、`--check` が期待する形を決める。
  - prose: `adr.format.md` の Decision の説明と規則を、新しい形に合わせて書き直す。
  - compatibility: `plan` が読む `Adopted` と `Policy`、`affected` の研究が読む `Adopted`・`Policy`・`Definition` との整合を取る。
  - errors: `--check`（`checkEntry`）と `index.test.ts` を、新しい形を検査するように変える。
- Out:
  - behaviour: 記録を書く手順は変えない（02〜04 が扱う）。
  - dependency: パッケージ、ライブラリ、外部契約は扱わない。
  - speed: 作業時間や資源の上限は設定しない。
  - security: 秘密情報、権限、露出は扱わない。
  - deploy: 配布やリリースはない。
  - migration: 過去の cycle の ADR は移行しない（記録はその時点の形で残す）。
  - logs and monitoring: 新しい記録や通知は増やさない。

### Context

- C1: いまの `Decision` は、`Status`、`Adopted`（エントリ全体として何がどうなるかの 1 行）、`Add`・`Update`・`Drop`、`Policy`（`Allowed`・`Forbidden`）を持つ（`.pi/skills/adr/references/adr.format.md:30-44`、`:100-109`）。
- C2: いまのテンプレート `entrySkeleton` は、`Status:`、`Adopted:`、`Add`・`Update`・`Drop`、`Policy` をこの順で作り、冒頭のコメントで `adr.format.md` のエントリの形に合わせるよう求めている（`.pi/skills/adr/scripts/adr.mjs:2`、`:27-41`）。
- C3: `checkEntry` は `Decision` セクションの全角括弧から C と F を集め、すべての C が参照され、すべての F がどこかで参照されることを検査するが、欄の名前と `Adopted` の有無は検査しない（`.pi/skills/adr/scripts/adr.mjs:92-146`）。
- C4: `index.test.ts` は、テンプレートが `Add`・`Update`・`Drop`・`Policy`・`Allowed`・`Forbidden` を含むこと、見出しが `Scope`・`Context`・`Research & Trial`・`Decision`・`Definition` であること、`checkEntry` の参照検査を確認すること（`.pi/skills/adr/scripts/index.test.ts:213-336`）。
- C5: `plan` は、通常の plan の `Goal` を ADR の `Adopted` の 1 行から取り、`Policy` を ADR の `Policy` から写し、レビューでは ADR の `Adopted`・`Policy`・`Scope`・`Definition` を読む（`.pi/skills/plan/SKILL.md:34`、`:87`、`:187`、`:200`）。
- C6: `affected` の研究は、エントリの `Scope` の In、`Adopted`、`Policy`、`Definition` を読む（`.pi/skills/adr/references/tasks.md:32`）。
- C7: 025 の要望は、エントリが複数の関心事を持てることを前提に、`Decision` を主たる関心事（`Main`）と追加の関心事（`Sub`）に分割し、`Status` と `Policy` をエントリに 1 つにすることである（`ROADMAP.md` の 025 の ideas、オーナーの指示）。
- C8: 025 の要望の形は、`Main` の下に `Add`・`Update`・`Drop` を置き、`Sub` を必要な数だけ増やせる形にし、最後に `Policy` を 1 つ置く。`Status` をその前に 1 つ置く（`ROADMAP.md` の 025 の ideas、オーナーの指示）。
- C9: 023 の決定は、内容の脱落を許可せず、重複と冗長を整理することである（`ROADMAP.md` の 023 の ideas）。
- C10: 059 の決定は、参照ファイルを「欄の参照」と「タスク」の 2 つの形にし、`One bullet is one rule.` を使うことである（`cycles/261109-059-dev/adr.md` の 01 の `Decision`）。
- C11: `adr/SKILL.md` の Decision のステップは、`Adopted` をエントリ全体として何がどうなるかの 1 行として書くよう定めている。この手順は 04 が扱う（`.pi/skills/adr/SKILL.md:181`）。
- C12: 01 の Scope は、Decision の形とテンプレート、欄の名前、`--check` の期待、説明文、`plan` と `affected` との整合、`--check` とテストを In とする（`adr.md` の `## 01:` の `Scope`）。
- C13: 025 は、軸に伴う変更をすべて行い、やりかけを残さないことを求める（`ROADMAP.md` の 025 とオーナーの指示）。
- C14: plan は ADR を分解せず、複数の ADR を束ねることがある。plan では、対象のエントリの `Main` を統合した 1 行を `Goal` にする（オーナーの指示）。
- C15: `plan` の cut は `ADR` 欄で複数のエントリ番号を許すが、plan md の `No` は 1 つの番号だけを定める（`.pi/skills/plan/references/cut.md:36`、`:51`、`.pi/skills/plan/references/format.md:149-151`）。
- C16: 01 の Decision の形は、`Main` を 1 つ、`Sub` を 0 個以上置き、`Status` と `Policy` をエントリに 1 つ持つ。

```md
- Status:
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

- C17: 01 の plan 側と検査の形は、次のフェンスのとおりである。

```md
**adr.format.md の Decision の規則**

- `Main` はエントリに 1 つ。`Sub` は 0 個以上。
- `Status` と `Policy` はエントリに 1 つ。
- `Adopted` はない。
- `Add` は増えるもの、`Update` は変わるもの、`Drop` は消えるもの。
- `（C1, F2）` は、`Add`・`Update`・`Drop`・`Policy` の行に置く。その関心事自体が C/F を確定するときは、`Main` や `Sub` の行にも置く。
- `Policy` は `Allowed` と `Forbidden` を持ち、`Forbidden` は理由を続ける。

**adr.mjs の entrySkeleton**

- `Status:`、`Main:`、`Sub:`、`Policy:` を置く。
- `Main` と `Sub` を 1 つずつ置き、`Sub` を増やせることを示す。
- `Adopted:` を置かない。
- 冒頭のコメントは「`references/adr.format.md` のエントリの形と合わせること」。

**checkEntry**

- `Decision` セクション全体の C と F を読む。
- コメントの「`Adopted` と `Policy` を合わせて」を「`Decision` セクション全体で」に直す。

**index.test.ts**

- `Main` と `Sub` があり、`Adopted` がないことを確かめる。
- `entry()` の `Adopted` 行を `Main` と `Sub` に変える。
- `--check` の CLI テストの ADR 文字列を新しい形に変える。

**plan/SKILL.md**

- `No` は複数のエントリ番号をカンマで並べる。
- `A normal plan's `Goal`comes from the`Main` lines of the entries it carries, composed into one line.`
- `Write one plan md, and send it to Round 1 at once: the plan md, every file it names, and the ADR's `Main`, `Sub`, `Policy`, `Scope`and`Definition`.`
- `Goal` — `the plan's `Goal`against the`Main` lines of the entries it carries; can the plan achieve it?`
- `:101` の表の見出しは `Main` / `Sub`。

**plan/references/format.md**

- `- No: <NN>[, <NN>...]`
- `A normal plan's `Goal`comes from the`Main` lines of the entries it carries, composed into one line.`
- `No` は複数の番号を持つ。

**plan/references/tasks.md**

- `Read the plan md, the files it names, and the ADR's `Main`, `Sub`, `Policy`, `Scope`and`Definition`.`
- `Goal` — `the plan's `Goal`against the`Main` lines of the entries it carries; can the plan achieve it?`
- `The task names the line, the ADR's `Main`and`Sub`and`Scope`, and what the plan holds so far.`

**adr/references/tasks.md**

- `Read the entry in full: `Scope`'s `In`, `Main`, `Sub`, `Policy`, `Definition`.`
- `for each sentence of `Main`and`Sub``
```

### Research & Trial

- F1 (C2): `entrySkeleton` の出力は `Scope`・`Context`・`Research & Trial`・`Decision`・`Definition` の 5 セクションをこの順で作り、`Decision` には `Status:`、`Adopted:`、`Add`・`Update`・`Drop`、`Policy` をこの順で置く。`adrSkeleton` と `--add` の両方がこの関数を使う。出所: `.pi/skills/adr/scripts/adr.mjs:7-60`、`.pi/skills/adr/scripts/index.mjs:93-95`。
- F2 (C3): `checkEntry` は `Decision` セクションの全角括弧から C と F を集めるだけなので、`Concern` の入れ子を足しても検査は通るが、`Concern` の数、`Status` の値、`Adopted` の有無は検査しない。出所: `.pi/skills/adr/scripts/adr.mjs:115-147`。
- F3 (C4): `index.test.ts` は、テンプレートの文言（`Add:`、`Update:`、`Drop:`、`Policy:`、`Allowed:`、`Forbidden:`）と、`entry()` ヘルパーの `Adopted` 行、`--check` の CLI テストの ADR 文字列に依存する。59 のテストが通る。出所: `.pi/skills/adr/scripts/index.test.ts:213-250`、`:283-286`、`:574`、実行結果。
- F4 (C5): `Adopted` を読む箇所は `plan` に 8 つある。`Goal` の出どころ（`plan/SKILL.md:34`、`plan/references/format.md:130`）、plan から ADR への写しの表（`plan/SKILL.md:101`）、レビューに渡すもの（`plan/SKILL.md:187`、`:194`、`plan/references/tasks.md:12`、`:14`、`:49`）である。出所: `grep Adopted` の結果。
- F5 (C6): `affected` の研究タスクは、エントリの `Adopted` を、対象の動詞と目的語を取り出す元として読む（`.pi/skills/adr/references/tasks.md:31-32`）。
- F6 (C13): `affected` のテンプレートと `--check` は Decision の形に依存しない。`affectedEntrySkeleton` は `## NN:` の見出しだけを `adr.md` と共有し、`--check` は `adr.md` だけを検査する。出所: `.pi/skills/adr/scripts/affected.mjs:7-23`、`.pi/skills/adr/scripts/index.mjs:48-54`。
- F7 (C2): `adr.mjs` の `checkEntry` のコメントは「`Adopted` と `Policy` を合わせて」と書くが、実装は `Decision` セクション全体を読む。欄の名前を変えると、このコメントも実装と食い違う。出所: `.pi/skills/adr/scripts/adr.mjs:107-114`。

### Decision

- Status: **accepted**
- Main: エントリの Decision が `Main` と `Sub` に分かれ、`Adopted` がなくなり、テンプレート・検査・テストがその形に揃う（C1, C2, C3, C4, C7, C8, C16, F1, F2, F3, F7）。
  - Add:
    - `Main` と `Sub` の欄（C7, C8, C16）
    - 複数の `Sub` を増やせるテンプレート（C2, C8, F1）
  - Update:
    - `adr.format.md` の Decision の形と説明（C1, C7, C8, C10）
    - `adr.mjs` のテンプレート（C2, F1）
    - `adr.mjs` の `checkEntry` のコメント（C3, F2, F7）
    - `index.test.ts` のテンプレート・`entry()`・CLI テスト（C4, F3）
    - `adr/references/tasks.md` の affected の研究（`Adopted` を `Main`・`Sub` に変える）（C6, F5）
  - Drop:
    - `Adopted`（C1, C5, C6, C11, C14）
- Sub: plan が `Main` を統合して `Goal` を作り、複数の ADR を束ねるときは `No` に複数の番号を持つ（C5, C6, C11, C14, C15, F4, F5）。
  - Add:
    - plan md の `No` の複数番号（C14, C15）
    - plan の `Goal` を `Main` の統合にする規則（C14）
  - Update:
    - `plan` の `Goal`・`No`・レビュー・写しの表（C5, C14, C15, F4）
  - Drop:
    - なし（C9）
- Policy:
  - Allowed:
    - その関心事自体が C/F を確定するとき、`Main` や `Sub` の行に参照を置く（C7, C8, C16）
    - 内容の脱落を避けるため、重複と冗長を整理する（C9）
    - 025 の軸に伴う変更をすべて行う（C12, C13）
    - 01 の形式は次のフェンスのとおりである（C17）
    - `affected` のテンプレートと `--check` の対象はそのままにする（F6）
  - Forbidden:
    - `Adopted` を残すこと - plan と affected が読む欄が二重になるため（C5, C6, C11, C14）
    - `Concern` という欄を残すこと - `Main` と `Sub` に置き換えるため（C7, C8）
    - plan の `Goal` を 1 つの `Main` に固定すること - 複数の ADR を束ねる場合に Goal が作れないため（C14）
    - `Sub` を必須にすること - 追加の関心事がないエントリがあるため（C8）

### Definition

- `Unit.adr-skill`(kept): オーナーが決め、エージェントが記録できるという主な機能は変わらず、変わるのは Decision の形とスキャフォールドである。
- `Unit.plan-skill`(kept): エージェントが、1 plan 分の作業の形と順序を決めて書けるという主な機能は変わらず、変わるのは `Goal` の出どころと `No` の持ち方である。

## 02: エントリは、どの条件で分けるか

### Scope

- In:
  - behaviour: エージェントがサイクルをエントリに分ける判断が変わる。主な関心事を 1 つにし、一意に決まる変更だけを `Sub` として同じエントリに含める。
  - format: `adr/SKILL.md` の Cycle 3 Entries に、条件の `View` を置く。セクションの形が変わる。
  - prose: 条件の文を書く。
- Out:
  - refactor: セクションの形は `format` が扱う。
  - dependency: パッケージ、ライブラリ、外部契約は扱わない。
  - naming: `Main` と `Sub` の名前は 01 が決める。
  - speed: 作業時間や資源の上限は設定しない。
  - security: 秘密情報、権限、露出は扱わない。
  - compatibility: 分割の条件を名指しする他の部分はない。用語は 01 の `Main`・`Sub` に従う。
  - errors: 検査、テスト、検証は足さない。
  - deploy: 配布やリリースはない。
  - migration: 過去の cycle の ADR は移行しない。
  - logs and monitoring: 記録や通知は変えない。

### Context

- C1: いまの `adr/SKILL.md` の Cycle 3 Entries は、5 つのステップと 1 つの Note を持ち、ステップ 1 が「Split the cycle into entries. One entry is one question.」、Note が「write what the chat settled at once. Do not keep an agreement only in the chat.」である（`.pi/skills/adr/SKILL.md:47-60`）。
- C2: いまのステップ 4 は、agreed なエントリをまとめて、スキャフォールドで追加する（`.pi/skills/adr/SKILL.md:54-57`）。
- C3: 025 の要望は、エントリの分け方を条件化し、基本は主な関心事を 1 つにし（SoC）、その主題の変更や追加に伴い、議論を伴わずに一意に決まる変更がある場合は、他の関心事も同じエントリに含めてよいとすることである（`ROADMAP.md` の 025 の ideas）。
- C4: 01 の決定で、エントリの Decision は `Main`（主たる関心事）と `Sub`（追加の関心事）を持ち、`Main` は 1 つ、`Sub` は 0 個以上、`Status` と `Policy` はエントリに 1 つになる（`adr.md` の `## 01:` の `Decision`）。
- C5: 02 の Scope は behaviour、format、prose を In とする（`adr.md` の `## 02:` の `Scope`）。
- C6: 023 の決定は、内容の脱落を許可せず、重複と冗長を整理することである（`ROADMAP.md` の 023 の ideas）。
- C7: 059 の決定は、規則を 1 文 1 箇条書きにし、`One bullet is one rule.` を使うことである（`cycles/261109-059-dev/adr.md` の 01 の `Decision`）。
- C8: いまのステップ 1 の「One entry is one question.」が、エントリを分ける唯一の規則である（`.pi/skills/adr/SKILL.md:51`）。
- C9: 01 の決定により、plan は ADR を分解せず、複数の ADR を束ね、`Main` を統合して `Goal` を作る（`adr.md` の `## 01:` の `Decision` と C14）。

- C10: 02 の形は、次のフェンスのとおりである。

```md
**Step 1**

1. Split the cycle into entries. One entry has one `Main`.

**View**

| case                                                                               | the entry     |
| ---------------------------------------------------------------------------------- | ------------- |
| the main concern                                                                   | one `Main`    |
| a change that follows the `Main`'s change or addition uniquely, without discussion | one `Sub`     |
| a change that needs discussion, or does not follow uniquely                        | another entry |

**Notes**

- An entry has one `Main` and may have `Sub`s.
- A `Sub` is allowed only when its change follows uniquely from the `Main`'s change or addition, without discussion.
- A change that needs discussion, or does not follow uniquely, is another entry.
- The owner's answer decides the split.
- Steps 2 to 5 and the current Note stay.
```

### Research & Trial

- なし（外部の調査は行わない。判断材料は Context とリポジトリにある）

### Decision

- Status: **accepted**
- Main: エントリの分割が、主たる関心事を 1 つにし、一意に決まる変更だけを `Sub` として同じエントリに含める条件で行われる（C3, C4, C8）。
  - Add:
    - Cycle 3 Entries の条件の `View`（C1, C3, C4）
  - Update:
    - ステップ 1 の「One entry is one question.」を「One entry has one `Main`.」に変える（C8）
    - Cycle 3 Entries の Note に、`Sub` を許す条件と、別のエントリにする条件を書く（C3, C4）
  - Drop:
    - なし（C6）
- Policy:
  - Allowed:
    - 一意に決まる変更を `Sub` として同じエントリに含める（C3, C4）
    - 内容の脱落を避けるため、重複と冗長を整理する（C6）
    - 既存のステップ 2〜5 と Note を残す（C1, C2）
    - 02 の Scope の In の範囲で行う（C5）
    - 規則は 1 文 1 箇条書きにする（C7）
    - 02 の形は次のフェンスのとおりである（C10）
    - plan が複数のエントリを束ねられる単位で分ける（C9）
  - Forbidden:
    - 議論を伴う変更を `Sub` として同じエントリに含めること - オーナーの判断が必要なため（C3）
    - 主たる関心事を 2 つ以上持つエントリを作ること - SoC に反するため（C3, C4）

### Definition

- `Unit.adr-skill`(kept): オーナーが決め、エージェントが記録できるという主な機能は変わらず、変わるのはエントリを分ける条件である。

## 03: 全エントリのプレリサーチは、どの単位で提案し、どう並列に走らせ、いつ各エントリへ転記するか

### Scope

- In:
  - behaviour: プレリサーチの提案と実行の流れが変わる。全エントリのスキャフォールド後にまとめて提案し、承認後に並列で走らせ、全部が返ってから対応するエントリへ転記する。`### 3. The opening proposal` は、その事実と `adr.format.md` の `Decision` を読み、section 4 の冒頭案を `Decision` に書く。Scope は adr.md に書いてから合意を確認する。Discussion Loop は Scope・Context・Research & Trial・Decision を随時更新し、Decision のステップは Status と F/C を確認する。
  - format: `adr/SKILL.md` の Cycle 3 Entries にまとめ提案と並列実行の形を置き、`### 1. Scope`、`### 3. Pre-research`、`### 4. Discussion Loop`、`### 5. Decision` のセクションの形を変える。
  - prose: 手順と Note の文を書き直す。
  - speed: プレリサーチを並列に走らせ、待ち時間を変える。
  - errors: Decision のステップの C/F の確認を、明示的な検査にする。
  - compatibility: `adr/SKILL.md` の中の `section 4` と `references/adr.format.md` の `Decision` への参照を、新しいステップの名前と番号に合わせる。`Look it up` と `Try it` の見出しは変えない。
- Out:
  - refactor: セクションの形は `format` が扱う。
  - dependency: パッケージ、ライブラリ、外部契約は扱わない。
  - naming: 新しい名前は付けない。`Scope`、`Discussion Loop`、`Decision` はすでにある。
  - security: 秘密情報、権限、露出は扱わない。
  - deploy: 配布やリリースはない。
  - migration: 過去の cycle の ADR は移行しない。
  - logs and monitoring: 記録や通知は変えない。

### Context

- C1: いまの Cycle 3 Entries のステップ 4 は、agreed なエントリをまとめてスキャフォールドで追加する（`.pi/skills/adr/SKILL.md:54-57`）。
- C2: いまの entry 3 Pre-research は、`Look it up` を読む、type と question を提案する、承認後に research を 1 つ走らせる、facts を `Research & Trial` に書く、の 4 ステップを持つ（`.pi/skills/adr/SKILL.md:116-124`）。
- C3: いまの Pre-research の View は 3 つの type と 3 つの question を持ち、Note は出所、答えられない問い、足りない事実がエントリを止めること、trial の条件、facts が section 4 の提示に使われることを定める（`.pi/skills/adr/SKILL.md:125-143`）。
- C4: 025 の要望は、分割合意と全エントリのスキャフォールドの後に、各エントリのプレリサーチをまとめて提案し、承認後に並列で research または trial を走らせ、同じ調査はまとめてよいとすることである（`ROADMAP.md` の 025 の ideas）。
- C5: 025 の要望は、すべてが返るのを待ち、対応する調査結果を転記してから、各エントリの作業に進むことである（`ROADMAP.md` の 025 の ideas）。
- C6: いまの entry stage は、エントリごとに Scope、Context、Pre-research、Discussion Loop、Decision、Definition、Affected の順で進む（`.pi/skills/adr/SKILL.md:62-228`）。
- C7: 01 の決定で、エントリの Decision は `Main` と `Sub` を持つ（`adr.md` の `## 01:` の `Decision`）。
- C8: 02 の決定で、エントリは `Main` を 1 つ持ち、一意に決まる変更だけを `Sub` として持つ（`adr.md` の `## 02:` の `Decision`）。
- C9: 03 の Scope は behaviour、format、prose、speed、errors、compatibility を In とする（`adr.md` の `## 03:` の `Scope`）。
- C10: 023 の決定は、内容の脱落を許可せず、重複と冗長を整理することである（`ROADMAP.md` の 023 の ideas）。
- C11: 059 の決定は、規則を 1 文 1 箇条書きにすることである（`cycles/261109-059-dev/adr.md` の 01 の `Decision`）。
- C12: `research` のタスク本文は `Look it up` にあり、質問と type をタスクに載せ、出所付きの事実を返す。`trial` のタスク本文は `Try it` にあり、worktree で試し、衝突、バージョン、最小の形を返す（`.pi/skills/adr/references/tasks.md:5-65`）。
- C13: いまの `Affected` の研究は、エントリの決定後に走り、次のエントリと並行する（`.pi/skills/adr/SKILL.md:210-228`）。
- C14: 03 では、既存の Pre-research の手順と注意を残す（`adr.md` の `## 03:` の `Scope` とオーナーの指示）。
- C15: 03 の entry 3 Pre-research は、項目自体を不要とし、pre-research の内容を確認しつつ、section 4 の冒頭案を adr.md に書くステップに置き換えられる（オーナーの指示）。
- C16: いまの `### 1. Scope` は、オーナーとチャットで kind ごとに In/Out を合意してから、`Scope` に書く（`.pi/skills/adr/SKILL.md:66-97`）。
- C17: 025 の要望は、Scope の In/Out を adr.md に直接書いてから合意を確認することである（`ROADMAP.md` の 025 の ideas）。
- C18: いまの `### 4. Discussion Loop` は、アプローチの提示、議論、追加の Context の記入、決まったことのフェンス、を繰り返し、Context と Research & Trial を更新する。Scope と Decision は更新の対象にない（`.pi/skills/adr/SKILL.md:145-170`）。
- C19: 025 の要望は、議論中に Scope も Decision も Research & Trial も随時変更することである（`ROADMAP.md` の 025 の ideas）。
- C20: いまの `### 5. Decision` は、Decision の書き方を読み、すべての C と F が載っているかを確認し、Status を書き、Adopted と Policy を書き、Context の項目を追加する（`.pi/skills/adr/SKILL.md:172-184`）。
- C21: 025 の要望は、Decision のステップが Status と F/C のチェックを担当し、loop の開始時に Decision の書き方を読んで冒頭案を書くことである（`ROADMAP.md` の 025 の ideas）。
- C22: `adr/SKILL.md` の `### 3. Pre-research` の Note は `section 4` を名指し、`### 5. Decision` のステップ 1 は `references/adr.format.md` の `Decision` を読む。ステップの名前と番号を変えると、これらの参照も直す必要がある（`.pi/skills/adr/SKILL.md:143`、`:176`）。

- C23: 03 の形は、次のフェンスのとおりである。

```md
**Cycle 3 Entries, step 5**

5. Read the `Look it up` section of `references/tasks.md`. Propose the pre-research of every entry together: for each entry, the type, the question, and what the answer would decide. Group the entries whose question is the same. After the owner's approval, run one `research` or `trial` subagent per group in parallel. Wait for all of them, and write each result in its entry's `Research & Trial`.

**Cycle 3 Entries, step 6**

6. Show the owner a new entry found while an entry runs, and add it after the answer.

**Cycle 3 Entries, View**

| entry | type | question | what the answer decides |
| ----- | ---- | -------- | ----------------------- |

The 3 types and 3 questions from the old `Pre-research` View move here.

**`1. Scope`**

1. Write the `Scope` to adr.md, every kind, `In` or `Out`.
2. Let the owner correct the list.
3. Write the result to the entry's `Scope` as `In:` and `Out:`.

**`3. The opening proposal`** (replaces `3. Pre-research`)

Steps:

1. Read the entry's pre-research facts in `Research & Trial`, and what they decide.
2. Read the `Decision` section of `references/adr.format.md`.
3. Write the opening proposal of the Discussion Loop in the entry's `Decision`, with `Status` empty.
4. Say what the facts decide and what the proposal is, and go to the Discussion Loop.

Notes:

- The proposal is in adr.md, not only in the chat.
- The facts serve the opening proposal.
- A fact that is still missing stops the entry. It is looked up here, not in the decision.
- When the holding point is a fact nobody has, a `trial` subagent may try it in a worktree, with the owner's agreement. Read the `Try it` section of `references/tasks.md` before running.

**`4. Discussion Loop`**

1. Start from the opening proposal in `Decision`.
2. Discuss, and investigate where a fact is missing.
3. Write an added `Context` item as `C<n>`, after the existing numbers, at the moment it is settled.
4. Write what is settled in a fence under `Context`, at the moment it is settled.
5. Update `Scope`, `Context`, `Research & Trial` and `Decision` as the discussion settles them.
6. Repeat until the owner moves the entry to the decision.

The `View` table gains:

| where the finding goes | the rule                      |
| ---------------------- | ----------------------------- |
| `Decision`             | a change the decision settles |
| `Scope`                | a change the scope settles    |

**`5. Decision`**

1. Check that every `C` and every `F` is carried.
2. When one is missing, explain it to the owner, and return to section 4.
3. Wait for the owner's judgement: `accepted` or `rejected`.
4. Write `Status`.

**`7. Affected`** stays.
```

### Research & Trial

- なし（外部の調査は行わない。判断材料は Context とリポジトリにある）

### Decision

- Status: **accepted**
- Main: 全エントリのプレリサーチが、スキャフォールド後にまとめて提案され、承認後に並列で走り、すべてが返ってから各エントリへ転記される。`### 3. The opening proposal` では、プレリサーチの事実と `Decision` の書き方を読み、section 4 の冒頭案を `Decision` に書く（C4, C5, C6, C14, C15, C21）。
  - Add:
    - Cycle 3 Entries のまとめ提案と並列実行のステップ（C1, C4, C5）
    - まとめ提案の `View`（C3, C4）
    - `### 3. The opening proposal` のステップ（C15, C21）
  - Update:
    - Cycle 3 Entries のステップ 5 と 6（C1, C4, C5）
    - entry 3 Pre-research を `The opening proposal` に置き換える（C2, C3, C15）
    - `Research & Trial` の事実を冒頭案の材料にする（C15）
  - Drop:
    - なし（C10）
- Sub: Scope を先に adr.md に書いてから合意を確認する（C16, C17）。
  - Add:
    - `Scope` に書いてから合意を確認する手順（C17）
  - Update:
    - `### 1. Scope` のステップ（C16, C17）
  - Drop:
    - なし（C10）
- Sub: Discussion Loop が Scope・Context・Research & Trial・Decision を随時更新し、Decision のステップが Status と F/C を確認する（C18, C19, C20, C21, C22）。
  - Add:
    - Loop の更新の対象に Scope と Decision を足す（C18, C19）
    - Decision のステップの Status と F/C の確認（C20, C21）
  - Update:
    - `### 4. Discussion Loop` のステップと Note（C18, C19）
    - `### 5. Decision` のステップ（C20, C21）
    - `section 4` と `Decision` への参照（C22）
  - Drop:
    - なし（C10）
- Policy:
  - Allowed:
    - 同じ質問のエントリを 1 つの調査にまとめる（C4）
    - 既存のステップ 1〜4 と、新しいエントリを見つけたときのステップを残す（C1, C2, C14）
    - 既存の `View`（type と question）をまとめ提案に移す（C3）
    - エントリの `Main` と `Sub` を、まとめ提案の単位にする（C7, C8）
    - 025 の軸に伴う変更をすべて行う（C9, C13）
    - 規則は 1 文 1 箇条書きにする（C11）
    - 03 の形は次のフェンスのとおりである（C23）
    - `Look it up` と `Try it` のタスク本文は変えない（C12）
    - `### 7. Affected` の研究はそのままにする（C13）
  - Forbidden:
    - 1 エントリに 1 件ずつ調査を置くこと - 同じ質問はまとめてよいため（C4）
    - すべてが返る前にエントリの作業を始めること - 転記してから進むため（C5）
    - `Pre-research` のセクションを残すこと - 研究を行わないため、冒頭案のステップに置き換えるため（C15）

### Definition

- `Unit.adr-skill`(kept): オーナーが決め、エージェントが記録できるという主な機能は変わらず、変わるのはプレリサーチの提案・実行・転記、Scope の先行書き込み、冒頭案、Loop の更新、Decision のチェックである。

## 04: work のレビューは、Policy が守られているかをどう確かめるか

### Scope

- In:
  - behaviour: レビューが、Policy が守られているかを見る。
  - naming: `Policy` という観点の名前を足す場合を含む。
  - format: `## Work Review` の観点と、`Review` タスクの形を変える。
  - prose: 観点の文を書き直す。
  - compatibility: work の `Review` タスク、plan の `## Work Review`、work の `Gaps` の Note、plan の `### Policy`、close の `collect.mjs` の `LABELS` を合わせる。
  - errors: close の `LABELS` に `Policy` を足し、`collect.test.ts` に `Policy` の case を足す。
- Out:
  - refactor: セクションの形は `format` が扱う。
  - dependency: パッケージ、ライブラリ、外部契約は扱わない。
  - speed: 作業時間や資源の上限は設定しない。
  - security: 秘密情報、権限、露出は扱わない。
  - deploy: 配布やリリースはない。
  - migration: 過去の cycle の plan md は移行しない。
  - logs and monitoring: 記録や通知は変えない。

### Context

- C1: いまの work の `## Work Review` は 5 つの観点（`Stale`、`Unlisted`、`Gaps`、`Unproven`、`Noise`）を持ち、`Gaps` は「a hole the slices passed over, a behavior the checks do not exercise; a decided value is not a gap」である（`.pi/skills/work/SKILL.md:161`、`.pi/skills/plan/references/format.md:342-360`）。
- C2: いまの work の `Gaps` の Note は「`Gaps` reads the plan's `Policy` and `Goal`: a `Forbidden` the steps break, and a hole that misses the `Goal`.」である（`.pi/skills/work/SKILL.md:164`）。
- C3: いまの work の `Review` タスクの `Gaps` は「a behavior the checks do not exercise, a step against the plan's `Policy`, and a hole that misses the plan's `Goal`」である（`.pi/skills/work/references/tasks.md:64`）。
- C4: いまの plan の `## Work Review` の `Gaps` は「a hole the slices passed over, a behavior the checks do not exercise; a decided value is not a gap」で、Policy を名指さない（`.pi/skills/plan/references/format.md:350`）。
- C5: いまの plan の `### Policy` は、ADR の `Policy` をスライスに必要な分だけ写し、繰り返しを許す（`.pi/skills/plan/references/format.md:230-237`）。
- C6: いまの plan のレビューでは、`Policy` が ADR の `Policy` を落とさずに写しているかを見る（`.pi/skills/plan/SKILL.md:200`）。
- C7: 025 の要望は、work のレビューに、Policy が守られているかを見ることを足すことである（`ROADMAP.md` の 025 の ideas）。
- C8: 04 の Scope は behaviour、naming、format、prose、compatibility、errors を In とする（`adr.md` の `## 04:` の `Scope`）。
- C9: 023 の決定は、内容の脱落を許可せず、重複と冗長を整理することである（`ROADMAP.md` の 023 の ideas）。
- C10: 059 の決定は、規則を 1 文 1 箇条書きにすることである（`cycles/261109-059-dev/adr.md` の 01 の `Decision`）。
- C11: work のレビューは 2 ラウンドで、Round 1 は diff と plan 全体、Round 2 は `fixed:` の行だけを見る（`.pi/skills/work/SKILL.md:142-152`）。
- C12: work のレビューは plan md の `## Work Review` に `### Round 1` と `### Round 2` を書き、観点ごとに findings を並べる（`.pi/skills/work/SKILL.md:159-161`、`.pi/skills/work/references/tasks.md:67-71`）。
- C13: plan の `## Work Review` は work の記録で、観点は 5 つ、`Doubts` は finding でない注記である（`.pi/skills/plan/references/format.md:342-364`）。
- C14: 04 では、`Review` タスクと plan の `## Work Review` を合わせ、`Gaps` から Policy を分けるか、`Gaps` の中で明示するかを決める（`adr.md` の `## 04:` の `Scope`）。
- C15: 01 の決定で、ADR の `Policy` はエントリに 1 つで、`Allowed` と `Forbidden` を持つ（`adr.md` の `## 01:` の `Decision`）。
- C17: close の `collect.mjs` の `LABELS` は 5 つの観点語彙を持ち、`Policy` がない。`Policy` の行は `readRound` で finding として誤集計される（`.pi/skills/close/scripts/collect.mjs:24`、`:145-172`）。

- C16: 04 の形は、次のフェンスのとおりである。

```md
**plan/references/format.md の `## Work Review`**

- `Policy` — a `Policy` line the diff does not keep: an `Allowed` it forbids, or a `Forbidden` it does

**work/references/tasks.md の `Review`**

- `Policy` — a `Policy` line the diff does not keep: an `Allowed` it forbids, or a `Forbidden` it does
- `Gaps` — a behavior the checks do not exercise, and a hole that misses the plan's `Goal`

**work/SKILL.md**

- The reviewer writes it under the six viewpoints and `Doubts`.
- `Policy` reads the plan's `Policy`: an `Allowed` it forbids, and a `Forbidden` it does.
- `Gaps` reads the plan's `Goal`: a hole that misses it.

**close/scripts/collect.mjs**

- `LABELS` に `Policy` を足す。
- `collect.test.ts` に `Policy` の case を足す。
```

### Research & Trial

- なし（外部の調査は行わない。判断材料は Context とリポジトリにある）

### Decision

- Status: **accepted**
- Main: work のレビューが、plan の `Policy` を守っているかを見る `Policy` の観点を `Gaps` から分けて持つ（C2, C3, C4, C5, C7, C14, C15）。
  - Add:
    - `## Work Review` の `Policy` の観点（C1, C4, C13）
    - `Review` タスクの `Policy` の観点（C3）
    - close の `LABELS` に `Policy` を足し、`collect.test.ts` に `Policy` の case を足す（C17）
  - Update:
    - work の `Gaps` の Note を、`Policy` と `Gaps` に分ける（C2）
    - 「five viewpoints」を「six viewpoints」に変える（C2, C11）
    - `Review` タスクの `Gaps` から Policy の部分を外す（C3）
  - Drop:
    - なし（C9）
- Policy:
  - Allowed:
    - `Policy` では plan の `Policy` を見る（C5, C6, C15）
    - 内容の脱落を避けるため、重複と冗長を整理する（C9）
    - 04 の Scope の In の範囲で行う（C8）
    - 規則は 1 文 1 箇条書きにする（C10）
    - 04 の形は次のフェンスのとおりである（C16）
    - `Doubts` と 2 ラウンドの形は変えない（C11, C12）
  - Forbidden:
    - `Gaps` に Policy の確認を残すこと - `Policy` の観点に分けるため（C2, C3）
    - `Policy` を ADR から直接読むこと - レビューは plan md を読むため（C5, C6）

### Definition

- `Unit.work-skill`(kept): エージェントが、plan を 1 つずつ片付けられるという主な機能は変わらず、変わるのはレビューの観点である。
- `Unit.plan-skill`(kept): エージェントが、1 plan 分の作業の形と順序を決めて書けるという主な機能は変わらず、変わるのは `## Work Review` の観点である。
- `Unit.close-skill`(kept): エージェントが、サイクル終了後に、クロージングできるという主な機能は変わらず、変わるのは `LABELS` の語彙である。

## 05: work の acceptance は、実装が goal を達成しているかをどう確かめるか

### Scope

- In:
  - behaviour: acceptance が、実装が plan の `Goal` を達成しているかを見る。
  - naming: `Goal` という欄の名前を足す場合を含む。
  - format: `## Acceptance` の欄と、acceptance の手順を変える。
  - prose: 確認の文を書く。
  - compatibility: work の Acceptance の steps と Notes、plan の `## Acceptance` を合わせる。`Acceptance's findings` タスクは `Findings` を読むため、変えない。
  - errors: acceptance の goal の確認を、明示的な検査にする。
- Out:
  - refactor: セクションの形は `format` が扱う。
  - dependency: パッケージ、ライブラリ、外部契約は扱わない。
  - speed: 作業時間や資源の上限は設定しない。
  - security: 秘密情報、権限、露出は扱わない。
  - deploy: 配布やリリースはない。
  - migration: 過去の cycle の plan md は移行しない。
  - logs and monitoring: 記録や通知は変えない。

### Context

- C1: いまの plan の `## Acceptance` は `Ran`、`Findings`、`Doubts` の 3 つの欄を持ち、`Ran` は実行した検査、`Findings` は finding、`Doubts` は finding でない注記である（`.pi/skills/plan/references/format.md:370-382`）。
- C2: いまの work の `### 7. Acceptance` は 6 つのステップを持ち、ステップ 1 が plan の検査を走らせ、ステップ 2 が振る舞いを壊して検査が赤になることを確かめ、ステップ 3 が振る舞いを足さない plan の変更を読み、ステップ 4 が `## Acceptance` を `Ran`・`Findings`・`Doubts` で書き、ステップ 5 が commit し、ステップ 6 が finding の修正で繰り返す（`.pi/skills/work/SKILL.md:181-190`）。
- C3: いまの work の Acceptance の `View` は、`Always` と実行可能な `Added`、全体の typecheck と test、壊して戻す確認、front の cmux-browser、base plan の各スライス後の確認を並べる（`.pi/skills/work/SKILL.md:192-200`）。
- C4: いまの work の Acceptance の Note は、`Ran`、`Findings`、`Doubts` の意味と、finding の `fixed:`/`left:`、yolo の確認、merge の commit を書かないことを定める（`.pi/skills/work/SKILL.md:202-223`）。
- C5: いまの plan の `## Acceptance` の `Ran` は「the checks that were run」、`Findings` は finding ごとの行、`Doubts` は review と同じ注記である（`.pi/skills/plan/references/format.md:370-382`）。
- C6: 025 の要望は、acceptance に、既存の確認に加え、この実装は goal を達成できていると言えるかを足すことである（`ROADMAP.md` の 025 の ideas）。
- C7: 01 の決定で、plan の `Goal` は対象のエントリの `Main` を統合した 1 行になる（`adr.md` の `## 01:` の `Decision`）。
- C8: 04 の決定で、work のレビューは `Policy` の観点を持つ（`adr.md` の `## 04:` の `Decision`）。
- C9: 05 の Scope は behaviour、naming、format、prose、compatibility、errors を In とする（`adr.md` の `## 05:` の `Scope`）。
- C10: 023 の決定は、内容の脱落を許可せず、重複と冗長を整理することである（`ROADMAP.md` の 023 の ideas）。
- C11: 059 の決定は、規則を 1 文 1 箇条書きにすることである（`cycles/261109-059-dev/adr.md` の 01 の `Decision`）。
- C12: `Acceptance's findings` のタスクでは、`## Acceptance` の `Findings` を読み、修正する（`.pi/skills/work/references/tasks.md:95-108`）。
- C13: `## Acceptance` は work が書き、merge の前に commit される（`.pi/skills/work/SKILL.md:214-215`）。
- C14: 05 では、`Goal` の確認を `Ran` とは別の欄にするか、`Ran` の中に置くかを決める（`adr.md` の `## 05:` の `Scope`）。
- C15: plan の `## Goal` は 1 行で、plan のレビューは `Goal` を ADR の `Main` の統合に照らして見る（`.pi/skills/plan/SKILL.md:34`、`:194`）。

- C16: 05 の形は、次のフェンスのとおりである。

```md
**plan/references/format.md の `## Acceptance`**

- Goal: <plan の `Goal` と、実装がそれを達成しているか>
- Ran: <走らせた検査>
- Findings: <finding>
- Doubts: <finding でない注記>

**Rules**

- `Goal` holds the plan's `Goal` and whether the implementation achieves it.
- A gap between the `Goal` and the implementation is a `Findings` line.

**work/SKILL.md の `7. Acceptance`**

- Add after step 3: `Say whether the implementation achieves the plan's `Goal`.`
- Step 4 writes `Goal` before `Ran`.
- The `View` gains `| the plan's `Goal` | the agent |`.
- `Goal` is the plan's `Goal`.
- A gap between the `Goal` and the implementation is a `Findings` line.
- `### 8. The owner's confirmation` shows `Goal`, `Ran`, `Findings` and `Doubts`.
```

### Research & Trial

- なし（外部の調査は行わない。判断材料は Context とリポジトリにある）

### Decision

- Status: **accepted**
- Main: work の acceptance が、実装が plan の `Goal` を達成しているかを `Goal` の欄で確かめる（C1, C2, C5, C6, C7, C15）。
  - Add:
    - `## Acceptance` の `Goal` の欄（C1, C5, C14）
    - work の Acceptance の `Goal` のステップと `View` の行（C2, C3, C14）
  - Update:
    - work の Acceptance のステップ 4 と Notes（C2, C4）
    - `### 8. The owner's confirmation` に `Goal` を足す（C2, C4）
    - plan の `## Acceptance` の欄（C1, C5）
  - Drop:
    - なし（C10）
- Policy:
  - Allowed:
    - `Goal` には plan の `Goal` と、実装がそれを達成しているかを書く（C7, C15）
    - `Goal` と実装の差を `Findings` の 1 行にする（C4, C12）
    - 既存の `Ran`、`Findings`、`Doubts` と検査を残す（C2, C3, C13）
    - `Acceptance's findings` タスクは変えない（C12）
    - 04 の `Policy` の観点とは別に、acceptance は `Goal` を見る（C8）
    - 内容の脱落を避けるため、重複と冗長を整理する（C10）
    - 05 の Scope の In の範囲で行う（C9）
    - 規則は 1 文 1 箇条書きにする（C11）
    - 05 の形は次のフェンスのとおりである（C16）
  - Forbidden:
    - `Goal` の確認を `Ran` の中に置くこと - `Ran` は走らせた検査であり、`Goal` は判断であるため（C14）
    - `Goal` を書かずに acceptance を終えること - 025 の要望が goal の達成を求めているため（C6）

### Definition

- `Unit.work-skill`(kept): エージェントが、plan を 1 つずつ片付けられるという主な機能は変わらず、変わるのは acceptance の `Goal` の確認である。
- `Unit.plan-skill`(kept): エージェントが、1 plan 分の作業の形と順序を決めて書けるという主な機能は変わらず、変わるのは `## Acceptance` の欄である。
