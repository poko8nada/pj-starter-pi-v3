# PLAN `readers-simple`

- No: 03
- Place: worktree
- Boundary Plans: adr-type

## Goal

plan・close・yolo が Simple のエントリを正しく読む

## Design

- Inside:
  - Modules: なし
  - Dirs: なし
- Outside:
  - Extract: なし
  - Colocate: なし

## Files

```text
.pi/
  skills/
    close/
      references/
        format.md         update
      SKILL.md            update
    plan/
      references/
        tasks.md          update
    yolo/
      SKILL.md            update
```

## Slices

## 1.plan のレビューが omission を読む

レビュワーに渡すタスク文に、Simple の omission の読み方を足す。

### Types

なし

### Steps

1. `.pi/skills/plan/references/tasks.md`
   1. update: `## Review of a plan against the ADR` の手順1に、Simple の omission の読み方を足す。

      ```md
      1. Read the plan md, the files it names, the ADR's `Main`, `Sub`, `Policy`, `Scope` and `Definition`, and `.pi/skills/plan/references/design.md`.
         - When the entry is Simple, its `Scope` and `#### Details` are `_omission_`. Read the omission as the entry not recording them, not as an empty scope. The plan's range is held by `Definition`.
      ```

### Policy

- Allowed:
  - Simple の `_omission_` を省略として読む
- Forbidden:
  - Simple の `Scope` を、範囲を決めていないものとして扱うこと - `_omission_` は省略である
  - 3つのスキルのスクリプトを変えること - 読み方の文書だけを変える

### Verify

- Always:
  - `pnpm test:related <changed files>`（関連がなければ `pnpm test:run`）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added: other — タスク文を、ADR の 03 と `affected/03.md` の `mentions` の辺と読み合わせる

## 2.close が Type から始める

close の次のサイクルの開始位置を Type にし、Scope は scaffold のままにする。

### Types

なし

### Steps

1. `.pi/skills/close/SKILL.md`
   1. update: `### 9. Proposed` の手順1、2、View、Notes を直す。

      ```md
      ### 9. Proposed

      Steps:

      1. Take the `**proposed**` lines to the next cycle's ADR: omit the intent; first update `ROADMAP.md`; then split the entries, proposing each entry's `Type`; then run the pre-research; then fill each entry's `Context` and `Research & Trial`.
      2. Leave the `Scope` as the scaffold wrote it. Do not commit the next cycle's files.
      3. Stop there: another session starts from the next cycle's ADR.

      View:

      | the next cycle          | what is filled                           |
      | ----------------------- | ---------------------------------------- |
      | `ROADMAP.md`            | the proposed items                       |
      | each entry              | `Type`, `Context` and `Research & Trial` |
      | each `affected/<NN>.md` | the scaffold                             |
      | `Scope`                 | the scaffold's                           |

      Notes:

      - The intent is omitted; this is not the normal ADR.
      - The next cycle's `adr.md` and `affected/*.md` are written by the adr skill's scaffold and the pre-research.
      - The next session starts at the entry's `Type`.
      - The files are not committed.
      ```

2. `.pi/skills/close/references/format.md`
   1. update: `### **proposed**` の手順を直す。

      ```md
      ### `**proposed**`

      - The next cycle's ADR takes it.
      - The close updates the roadmap, splits the next cycle's entries, proposes each entry's `Type`, runs the pre-research, and fills each entry's `Context` and `Research & Trial`.
      - The close leaves the `Scope` as the scaffold wrote it and commits nothing of the next cycle.
      - `Then:` is what the next cycle should discuss.
      ```

### Policy

- Allowed:
  - Simple の `_omission_` を省略として読む
- Forbidden:
  - Simple の `Scope` を、範囲を決めていないものとして扱うこと - `_omission_` は省略である
  - 3つのスキルのスクリプトを変えること - 読み方の文書だけを変える

### Verify

- Always:
  - `pnpm test:related <changed files>`（関連がなければ `pnpm test:run`）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added: other — `close/SKILL.md` と `close/references/format.md` を、ADR の 03 と読み合わせる

## 3.yolo が Simple を歩く

yolo の adr 段階に、Simple が Scope と discussion を歩かない例外を足す。

### Types

なし

### Steps

1. `.pi/skills/yolo/SKILL.md`
   1. update: `### 1. adr` の手順1に、Simple の例外を足す。

      ```md
      1. Walk the adr skill's cycle stage and entry stage, in its order, from where the cycle stands: the pre-research, every entry's `Context`, its `Scope`, the opening proposal, the discussion, the decision, and its `Definition`. A `_Simple_` entry skips its `Scope` and the discussion. A stage the cycle has passed is not walked again.
      ```

   2. update: `## How not to write this` の `When you walk the entry stage:` の行に、Simple の例外を足す。

      ```md
      - When you walk the entry stage: do not skip a step of it, except the steps a `_Simple_` entry skips by its `Type`. The steps are walked, and only their look at the owner is lost.
      ```

### Policy

- Allowed:
  - Simple の `_omission_` を省略として読む
- Forbidden:
  - Simple の `Scope` を、範囲を決めていないものとして扱うこと - `_omission_` は省略である
  - 3つのスキルのスクリプトを変えること - 読み方の文書だけを変える

### Verify

- Always:
  - `pnpm test:related <changed files>`（関連がなければ `pnpm test:run`）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added: other — `yolo/SKILL.md` の adr 段階を、ADR の 03 と `yolo/SKILL.md` の `mentions` の辺と読み合わせる

## Notes

### Slice 1: plan のレビューが omission を読む

- Findings: なし
- Unplanned: なし
- Commit: a7f6f59
- Stopped:

### Slice 2: close が Type から始める

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 3: yolo が Simple を歩く

- Findings:
- Unplanned:
- Commit:
- Stopped:

## Work Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Policy:
- Unproven:
- Noise:
- Doubts:

### Round 2

- Stale:
- Unlisted:
- Gaps:
- Policy:
- Unproven:
- Noise:
- Doubts:

## Acceptance

- Goal:
- Ran:
- Findings:
- Doubts:
