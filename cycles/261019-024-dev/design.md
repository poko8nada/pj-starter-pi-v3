# DESIGN 024

## Possibly related files

### 01: plan を切る材料を、どこで集めるか

- `.pi/skills/design/SKILL.md`
- `.pi/skills/design/references/format.md`
- `.pi/skills/plan/SKILL.md`
- `.pi/skills/plan/references/format.md`
- `.pi/skills/adr/SKILL.md`
- `.pi/skills/adr/references/format.md`
- `.pi/skills/brief/references/tasks.md`
- `.pi/skills/close/SKILL.md`
- `.pi/skills/close/scripts/collect.mjs`
- `.pi/skills/work/SKILL.md`
- `README.md`
- `README.ja.md`
- `DEFINITION.md`
- `definition/rules.md`

### 02: plan の「the project's rules」の規則をどうするか

- `.pi/skills/plan/SKILL.md`
- `.pi/skills/plan/references/format.md`
- `.pi/skills/plan/references/tasks.md`
- `.pi/skills/design/SKILL.md`
- `.pi/skills/design/references/format.md`
- `.pi/skills/work/SKILL.md`
- `.pi/skills/work/references/tasks.md`
- `.pi/skills/close/SKILL.md`
- `.pi/skills/close/references/format.md`
- `.pi/skills/close/scripts/collect.mjs`
- `README.md`
- `README.ja.md`

### 03: テストの整理を、どのステージに置くか

- `.pi/skills/work/SKILL.md`
- `.pi/skills/work/references/tasks.md`
- `.pi/skills/plan/SKILL.md`
- `.pi/skills/plan/references/format.md`
- `.pi/skills/close/SKILL.md`
- `.pi/skills/close/references/format.md`
- `.pi/skills/close/scripts/collect.mjs`
- `package.json`
- `vitest.config.ts`
- `lefthook.yaml`
- `test/setup.ts`
- `test/tmp.ts`
- `test/README.md`
- `README.md`
- `README.ja.md`
- `DEFINITION.md`

### 04: スタックが動いた plan をマージした後、base の依存をどう揃えるか

- `.pi/skills/work/SKILL.md`
- `.pi/skills/work/references/tasks.md`
- `.pi/extensions/consult/run/run.ts`
- `.pi/extensions/consult/run/subagent.ts`
- `.pi/extensions/consult/README.md`
- `package.json`
- `pnpm-workspace.yaml`
- `pnpm-lock.yaml`
- `scripts/checks/typecheck.mjs`
- `scripts/checks/scopes.json`
- `lefthook.yaml`
- `README.md`
- `README.ja.md`
- `DEFINITION.md`

### 05: close の `ex-` の判定をどう書くか

- `.pi/skills/close/SKILL.md`
- `.pi/skills/close/references/format.md`
- `.pi/skills/close/scripts/collect.mjs`
- `.pi/skills/propose/SKILL.md`
- `.pi/skills/design/SKILL.md`
- `.pi/skills/design/references/format.md`
- `.pi/skills/plan/SKILL.md`
- `.pi/skills/plan/references/format.md`
- `.pi/skills/work/references/tasks.md`
- `scripts/harness.json`
- `README.md`
- `README.ja.md`
- `DEFINITION.md`

### 06: オーナーの確認を飛ばしてサイクルを走り切るスキル（yolo）を足すか

- `.pi/skills/*/SKILL.md`（既存の 7 つ）
- `README.md`
- `README.ja.md`
- `DEFINITION.md`
- `AGENTS.md`
- `definition/rules.md`
- `definition/format.md`
- `scripts/harness.json`
- `scripts/harness.mjs`
- `scripts/harness-state.mjs`
- `vitest.config.ts`
- `scripts/checks/scopes.json`
- `lefthook.yaml`

## `design-research`

### ADR & Where

- No: 01
- Why: design の 2 ファイルだけを読み、他の plan を待たないので、最初に置く。
- Where: base（オーナーが書かれた文面を読む）

### Scope

- `Unit.design-skill`:
  - 調査のステージを足す。ADR の accepted の entry ごとに並行でリサーチを走らせ、結果を design.md の `## Possibly related files` に書く。
  - `## Refactor` の文を、design の側から消す。

### Boundary

- Plans: なし
- External: なし

## `plan-rules`

### ADR & Where

- No: 02
- Why: 01 が design の側を消す `## Refactor` の、plan の側を消すので、`design-research` を待つ。
- Where: base（オーナーが書かれた文面を読む）

### Scope

- `Unit.plan-skill`:
  - 行は動かない。
  - `the project's rules` の規則を消す。
  - plan の側の `## Refactor` の記述と、design へ書き戻す段を消す。

### Boundary

- Plans:
  - `design-research`: design の側の `## Refactor` の文を消す。この plan は plan の側を消す。
- External: なし

## `work-steps`

### ADR & Where

- No: 03, 04
- Why: 03 と 04 はどちらも work の 2 ファイルを読み、plan md の `## Notes` の形を使うので、1 つにして `plan-rules` を待つ。
- Where: base（オーナーが書かれた文面を読む）

### Scope

- `Unit.work-skill`:
  - 行は動かない。
  - スライスの後にテストの整理のステージを足す。その記録は plan md の `## Notes` にスライス以外のセクションとして置く。
  - マージの後に base で依存を揃えてから、通しの typecheck と test を走らせる手順を足す。

### Boundary

- Plans:
  - `plan-rules`: plan md の `## Notes` の形を決める。この plan はその形で記録のセクションを置く。
- External: なし

## `close-words`

### ADR & Where

- No: 05
- Why: `design-research` が消す `## Refactor` を例にしていた close の script があるので、`design-research` を待つ。
- Where: base（オーナーが書かれた文面を読む）

### Scope

- `Unit.close-skill`: 行は動かない。`criteria` を 4 つ（矛盾・穴・壊れている・古いまま）に置き換える。

### Boundary

- Plans:
  - `design-research`: `## Refactor` を消す。この plan はそれを例にしていた close のコメントを直す。
- External: なし

## `yolo-skill`

### ADR & Where

- No: 06
- Why: 他の plan が決めた文面とオーナーの確認を名指すので、4 つを待つ。
- Where: base（オーナーが書かれた文面を読む）

### Scope

- `Unit.yolo-skill`:
  - 行が足される。
  - 新しいスキルを足す。frontmatter に `disable-model-invocation` を置き、エージェントの自動選択から外す。

### Boundary

- Plans:
  - `design-research`: `## Possibly related files` をオーナーに見せるステージを決める。この plan はそれを飛ばすと書く。
  - `plan-rules`、`work-steps`、`close-words`: それぞれオーナーの確認を決める。この plan はそれらを飛ばすと書く。
- External:
  - `@earendil-works/pi-coding-agent`: frontmatter の `disable-model-invocation` が効く host。
    - Version: ^1.3.0

## `common-docs`

### ADR & Where

- No: 01, 06
- Why: 01 と 06 が定義の行を動かし、01、03、04、05 が README の行を古くするので、5 つを待つ。
- Where: base（オーナーが書かれた文面を読む）

### Scope

- `Unit.design-skill`:
  - 行が動く。
  - `DEFINITION.md:38` を ADR 01 の `Definition Change` の行にする。
- `Unit.yolo-skill`:
  - 行が足される。
  - `DEFINITION.md` に ADR 06 の `Definition Change` の行を足す。
- `Unit.usage-readme`:
  - 行は動かない。
  - 一覧と、design、plan、work、close の各行を、このサイクルの変更に合わせる。

### Boundary

- Plans:
  - `design-research`、`plan-rules`、`work-steps`、`close-words`、`yolo-skill`: それぞれが振る舞いを決める。この plan はその振る舞いを定義の行と README の行に書く。
- External: なし
