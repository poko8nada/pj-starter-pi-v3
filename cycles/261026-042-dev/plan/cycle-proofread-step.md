# PLAN `cycle-proofread-step`

- No: 01

## Files

```text
.pi/skills/
  adr/
    SKILL.md                        update
  design/
    SKILL.md                        update
  plan/
    SKILL.md                        update
  close/
    SKILL.md                        update
  yolo/
    SKILL.md                        update
README.md                           update
README.ja.md                        update
```

## Slices

## 1.4 つの手順

### Types

なし

### Steps

1. `.pi/skills/adr/SKILL.md`:
   - `## Entries, together` の後に、`## Proofread` を足します。文面は次のとおりです。

     ```md
     ## Proofread

     Before the owner reads `adr.md`, it goes through one proofread.

     - the document: `cycles/<YYMMDD>-<NNN>-<slug>/adr.md`
     - run one `proofreader` subagent, and name that file in the task
     - read its report and `git diff` of the file
     - if a decision, a reason, a number, a name or a `Scope` line changed meaning, or a section or field name moved, put the file back to `references/format.md`'s shape, in your own words
     - say in your report to the owner what you repaired: `fixed: <what>`, or `left: <why>`
     - one round: the repaired file does not go through the subagent again
     ```

2. `.pi/skills/design/SKILL.md`:
   - `### 8. Show the owner` の前に、`### 8. Proofread` を足し、`Show the owner` を `### 9.` に繰り下げます。手順 7 の「it runs before step 8」も「step 9」に直します（`:76`）。文面は次のとおりです。

     ```md
     ### 8. Proofread

     Before the owner reads design.md, it goes through one proofread.

     - the document: `cycles/<YYMMDD>-<NNN>-<slug>/design.md`
     - run one `proofreader` subagent, and name that file in the task
     - read its report and `git diff` of the file
     - if a plan's `Goal`, `Non-goal` or `Why` changed meaning, or a section or field name moved, put the file back to `references/format.md`'s shape, in your own words
     - say in your report to the owner what you repaired: `fixed: <what>`, or `left: <why>`
     - one round: the repaired file does not go through the subagent again
     ```

3. `.pi/skills/plan/SKILL.md`:
   - `### 11. Show the owner` の前に、`### 11. Proofread` を足し、`Show the owner` を `### 12.` に繰り下げます。文面は次のとおりで、対象は 2 つです。オーナーに見せる前に、サイクルのプランの md を 1 本ずつ通します。

     ```md
     ### 11. Proofread

     Before the owner reads the plan mds, each one goes through one proofread.

     - the documents: `cycles/<YYMMDD>-<NNN>-<slug>/plan/<plan id>.md`, one run per file
     - run one `proofreader` subagent per file, and name that file in the task
     - read its report and `git diff` of the file
     - if a slice's `Steps`, a `Verify` line, a test case or a field name changed meaning, or a section or field name moved, put the file back to `references/format.md`'s shape, in your own words
     - say in your report to the owner what you repaired: `fixed: <what>`, or `left: <why>`
     - one round: a repaired file does not go through the subagent again
     ```

4. `.pi/skills/close/SKILL.md`:
   - `### 6. Owner` の前に、`### 6. Proofread` を足し、`Owner` を `### 7.` に繰り下げます。文面は次のとおりです。

     ```md
     ### 6. Proofread

     Before the owner reads close.md, it goes through one proofread.

     - the document: `cycles/<YYMMDD>-<NNN>-<slug>/close.md`
     - run one `proofreader` subagent, and name that file in the task
     - read its report and `git diff` of the file
     - if a `Triage` line, a `Verified` line or a destination changed meaning, or a section or field name moved, put the file back to `references/format.md`'s shape, in your own words
     - say in your report to the owner what you repaired: `fixed: <what>`, or `left: <why>`
     - one round: the repaired file does not go through the subagent again
     ```

### Verify

- Always:
  - 既定の 5 つ
- Added:
  - base の目 — オーナーが 4 つの手順の文面を読み、OK を返すこと。

## 2.飛ばす所と説明

### Types

なし

### Steps

1. `.pi/skills/yolo/SKILL.md`:
   - `skips:` に、校正を飛ばす行を足します。design と plan は、`yolo` がオーナーの読みを飛ばすので、校正も飛ばし、後で走らせません。close は `yolo` の中で飛ばし、`yolo` が止まった後、オーナーがトリアージを判断する前（クローズ手順 6）に走らせると書きます。
2. `README.md`:
   - サイクルの 4 つのステージの説明に、校正を足します（`:61-68`）。`adr`、`design`、`plan`、`close` の各行です。
3. `README.ja.md`:
   - 同じ 4 行を日本語で追随させます（`:61-68`）。

### Verify

- Always:
  - 既定の 5 つ
- Added:
  - base の目 — オーナーが `yolo` と 2 つの README の文面を読み、OK を返すこと。

## Notes

### Slice 1: 4 つの手順

- Findings: なし
- Unplanned: クローズの `Owner` の後に続く手順（`Leftovers`、`Commit`、`Clean the workspace`）の番号を 8、9、10 に直した。計画のステップ 4 は `Owner` だけを繰り下げる書き方で、`### 7.` が 2 つになっていた。
- Commit: 103832d
- Stopped: なし

### Slice 2: 飛ばす所と説明

- Findings:
- Unplanned:
- Commit:
- Stopped:

## Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Unproven:
- Noise:
- Doubts:

## Acceptance

- Ran:
- Findings:
- Doubts:
