# PLAN `yolo-start`

- No: 04
- Place: worktree
- Boundary Plans: `adr-context-first`（この計画は `adr-context-first` がマージされた後に走る。`### 1. adr` の手順が `adr` の段階の並びを書き写すため）

## Goal

yolo が、エントリのスキャフォールドの後から発動でき、プリリサーチとエントリ段階も歩ける

## Design

- Inside:
  - Modules: なし。`yolo/SKILL.md` は 1 ファイルで完結しており、統合も分割もしない。
  - Dirs: なし。`.pi/skills/yolo/` の位置は動かさない。
- Outside:
  - Extract: なし。`adr` の段階の規則は `adr/SKILL.md` にあり、この計画はその段階の並びを `### 1. adr` に書き写す。書き写す先の中身が `adr-context-first` によって変わるため、この計画はその後に走る。共有する新しい文書は作らない。
  - Colocate: なし。共通化をやめる文書はない。

## Files

```text
.pi/
  skills/
    yolo/
      SKILL.md                      update
```

## Slices

## 1.発動点をスキャフォールドの直後にする

yolo を、エントリ分割のスキャフォールドができた後（プリリサーチより前）から発動できるようにする。

### Types

なし

### Steps

1. `.pi/skills/yolo/SKILL.md`
   1. update: frontmatter の `description` を、スキャフォールドの後から発動できる形にする。`# yolo` の直後の説明は文言を変えない（新しい発動点でも説明が成り立つ）。

      ```text
      Use when the owner says to run the cycle through without their confirmations, at any time after the entries' scaffold is made.
      ```

   2. update: `## When it runs` の表の 1 行目を、スキャフォールドの後から動く形にする。2 行目の `started before that` は文言を変えない（`that` が指す先が 1 行目の変更によってスキャフォールドになる）。

      ```md
      | the owner starts it, after the entries' scaffold is made | it runs |
      ```

   3. update: その表の 4 行目（ADR の行）を、エントリ段階もこのスキルが歩く形にする。

      ```md
      | the ADR's entry stage | walked here: the agent settles each entry by the checks `When a step cannot run` gives |
      ```

### Policy

- Forbidden:
  - エージェントが yolo を選ばない - 発動点はオーナーが決めるため
  - `close` の `### 9. Proposed` を変えない - 次のセッションが `Scope` から始まる規則は、yolo 以外の経路のため

### Verify

- Always:
  - `pnpm test:run`（このスライスは `yolo/SKILL.md` だけを変えるため、関連するテストがない）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `.pi/skills/yolo/SKILL.md` の全体と、それが名指す `.pi/skills/adr/SKILL.md`、`.pi/skills/close/SKILL.md`、`DEFINITION.md`、`README.md`、`README.ja.md` を読み、使う者の立場でファイルに書かれた順に手順をたどり、番号、パス、名前、形を確かめ、不整合を直す。
- Added: なし

## 2.エントリ段階を歩く

`## Procedure` の先頭に `adr` の段階を足し、オーナーの確認をエージェントの確認に置き換える。

### Types

なし

### Steps

1. `.pi/skills/yolo/SKILL.md`
   1. add: `## Procedure` の `### 1. plan` の前に、`### 1. adr` の段階を足し、`plan`、`work`、`close` の番号を 1 つずつ繰り下げる（1→2、2→3、3→4）。

      ```md
      ### 1. adr

      Steps:

      1. Walk the adr skill's cycle stage and entry stage, in its order, from where the cycle stands: the pre-research, every entry's `Context`, its `Scope`, the opening proposal, the discussion, the decision, and its `Definition`. A stage the cycle has passed is not walked again.
      2. Give each entry's affected to a `research` subagent, and go on without waiting for it.
      3. Go on to the plan.

      Notes:

      - The agent takes the owner's place for the entry: it proposes, settles, and moves the entry to the decision.
      - skips: the Japanese proofread, and the owner's look at every step of the entry stage.
      ```

   2. update: `## Procedure` の直後の Note の `three stages` を `four stages` にする（`### 1. adr` を足した後に行う）。

      ```text
      The cycle's four stages run in their order. Each keeps its work. Each loses only its look at the owner.
      ```

   3. add: `## How not to write this` の既存の 3 つの項目の末尾に、エントリ段階を飛ばさないことを足す。

      ```text
      - When you walk the entry stage: do not skip a step of it. The steps are walked, and only their look at the owner is lost.
      ```

### Policy

- Allowed:
  - エージェントがエントリを判断に移してよい
- Forbidden:
  - 通った段階を歩き直さない - `close` の `### 9. Proposed` が先に埋めた `Context` と `Research & Trial` をやり直さないため
  - トリアージの前で止まる - 停止点は `close` のものであり、このスキルはそれを動かさないため
  - `adr.md` の日本語校正を走らせない - plan の校正をスキップするのと同じ扱いにするため
  - 過去の yolo の記録を移行しない - yolo を使った記録がないため

### Verify

- Always:
  - `pnpm test:run`（このスライスは `yolo/SKILL.md` だけを変えるため、関連するテストがない）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `.pi/skills/yolo/SKILL.md` の全体と、それが名指す `.pi/skills/adr/SKILL.md`、`.pi/skills/close/SKILL.md` を読み、使う者の立場でファイルに書かれた順に手順をたどり、番号、パス、名前、形を確かめ、不整合を直す。
- Added: なし

## Notes

### Slice 1: 発動点をスキャフォールドの直後にする

- Findings: なし
- Unplanned: なし
- Commit: afcc0dd8da36d4f0512a1d5fe8fb140e1bc6155d
- Stopped:

### Slice 2: エントリ段階を歩く

- Findings: なし
- Unplanned: なし
- Commit: 85e4c633c89899532862fe0bdeeea48e5bb533c1
- Stopped:

### Cleanup: 掃除なし

- Findings: なし
- Unplanned: なし

## Work Review

### Round 1

- Stale:
  - なし — `.pi/skills/yolo/SKILL.md:3,17-20,24,26-37,115` が計画どおりで、`DEFINITION.md:28`・`README.md:29` の停止点（トリアージまで）と矛盾せず、古くなった文書・コメント・冗長文はない。`SKILL.md:19` と `:30` の「通った段階は歩き直さない」の重なりは計画が決めた文言のため指摘にしない。
- Unlisted:
  - なし — 差分は `Files` の1件（`.pi/skills/yolo/SKILL.md`）と本計画mdの `## Notes` 記録のみ。`cycles/261112-063-dev/plan/04-yolo-start.md:137-156` の差分は `Commit` hashの追記だけで、計画外の変更はない。
- Gaps:
  - なし — `Goal` の2点（スキャフォールド直後からの発動は `SKILL.md:3,17-18`、プリリサーチとエントリ段階の歩行は `SKILL.md:26-37`）に対応し、各 `Verify` の読通し（番号 `SKILL.md:26,39,52,65`、パス・名前・形）で手順をたどる形になっている。文書のみの変更で `Added: なし` は `design.md` の `## Test cases`（検査ファイルなし→検査手順なし）と整合し、動かして確かめるべき振る舞いの欠けはない。
- Policy:
  - なし — スライス1の `Forbidden`（エージェントが選ばない `SKILL.md:9`、`close` の `### 9. Proposed` 不変は `git diff` で `close` 無変更）が守られ、スライス2の `Allowed`（エントリの判断移行 `SKILL.md:36`）を妨げず、`Forbidden`（歩き直さない `SKILL.md:19,30`、トリアージ前で止まる `SKILL.md:73`、日本語校正なし `SKILL.md:37`、過去記録の移行なし）が守られているため。
- Unproven:
  - なし — 全スライス `Added: なし` で振る舞いを名乗る新規テストがなく、既存の `pnpm test:run` 等も今回の文書挙動を名指ししていないため、壊れても緑のまま残るテストはないため。
- Noise:
  - なし — 同上。`Added` のテスト自体がなく、型・スキーマ・DB制約がすでに保証する前提を再現したテストも、マジックナンバーやハードコード文字列を持つケースも存在しないため。`design.md` の `## Test cases` に照らすべき対象がないため。
- Doubts:
  - なし

### Round 2

- Stale:
- Unlisted:
- Gaps:
- Policy:
- Unproven:
- Noise:
- Doubts:

## Acceptance

- Goal: 「yolo が、エントリのスキャフォールドの後から発動でき、プリリサーチとエントリ段階も歩ける」を達成している。`description` と `## When it runs` がスキャフォールドの後からの発動を示し、`## Procedure` の `### 1. adr` がプリリサーチとエントリ段階を歩く。
- Ran: `pnpm test:run`（65 files / 813 tests passed）、`pnpm typecheck`（root: ok、.pi: ok）、`pnpm lint`（指摘なし）、`pnpm format:check`（整形済み。plan md の整形崩れを 1 件直した）。変更の適用後に `git diff 4fb2af3..HEAD -- .pi/skills/yolo` を読み、`description`、`## When it runs` の 4 行、`## Procedure` の 4 段階と Note、`## How not to write this` が揃っていることを確かめた。
- Findings: なし
- Doubts: なし
