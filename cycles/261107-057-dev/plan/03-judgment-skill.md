# PLAN `judgment-skill`

- No: 03
- Place: worktree
- Boundary Plans: なし（`procedure-skills`、`flow-skill` と並行して走る）

## Design

- Inside:
  - Modules: なし。`SKILL.md` は 1 ファイルで閉じており、統合も分割もしない。全体を、冒頭文、`## Who decides`、`## The leftover's states`、`## Procedure`（14 のステップ）、`## How not to write this` の五部分に作り直す。二つの表を `View:` にまとめ、各ステップを `Steps:`・`View:`・`Notes:` に分ける。
  - Dirs: なし。この計画では `.pi/skills/close/` の位置を動かさない。
- Outside:
  - Extract: なし。門の表と状態の表は、このスキルだけが持つ定義である。共通化するモジュールはない。
  - Colocate: なし。共通化をやめるモジュールはない。

## Files

```text
.pi/
  skills/
    close/
      SKILL.md          update
      references/
        format.md
        tasks.md
      scripts/
        collect.mjs
  extensions/
    consult/
      types.json
rules/
  roadmap.md
ROADMAP.md
```

## Slices

## 1.判定スキルの形を揃える

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/close/SKILL.md`:
   - update: 冒頭文は変えず、`## Who decides` と `## The leftover's states` を下の二つのフェンスの `View:` の表にし（「この表だけに書く」「門を言い直さない」の規則は `Note:` に移す）、`## Procedure` の 14 のステップを、`does:` の箇条書きを `Steps:` の番号付き手順にし、`takes` と `gives` の文を `View:` の表の `takes` と `gives` の列に入れ、`does:` の箇条書きのうち、命令形は `Steps:` に置き、禁止と条件は `Notes:` に置き、`takes`・`gives` にある注意も `Notes:` に置く形に分ける。ステップ 8 にステップ 3 へ戻るステップを置き、`## The leftover's states` の直下の戻りの文と `## Procedure` 冒頭の残りの進め方の定義は、ステップ 8 へ移して残さない。末尾の `## How not to do this` を `## How not to write this` に改める。文は `adr` の文体に揃え、1 文に 1 つの事実を置き、行動の主語を明示し、現在形で書き、列挙は表にする。14 のステップの意味と順序を変えず、内容を省かない。意味を変えずに短くできる重複した文は短くする。
     ```md
     ## Who decides

     View:

     | gate                | what it decides                                     | where      |
     | ------------------- | --------------------------------------------------- | ---------- |
     | the agent's reading | a leftover already closed                           | the chat   |
     | the owner's word    | a destination, a grouping, a verification, a status | the chat   |
     | the merge           | an `ex-` plan's work                                | the commit |

     Note: a step that says "the gate is ..." names one of the three, and does not restate it.
     ```
     ```md
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
     ```
     ```md
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
     ```
     ```md
     ### 8. Run the `ex-` plans

     Steps:

     1. When one is merged, its plan md's leftovers go back to `collected`.
     2. Go back to step 3 and run the collect, the exclusion, the proposal and the owner's judgement again for them, one leftover at a time.
     3. Then come back to this step for the next `ex-` plan.
     ```
     ```md
     ### 7. The owner's judgement

     Steps:

     1. Explain one leftover at a time in the chat: what it is, which stage it came from and why, what is wrong now, how to fix it, and how wide the fix is; in words that hold without the reference files.
     2. Wait for their answer on that one before the next.
     3. When the last one is answered, let them read the whole `close.md` as the final check. The final check is on the first pass only (a pass after an `ex-` plan's merge needs the one-at-a-time answers, not the whole read again).

     View:

     | takes              | gives                       |
     | ------------------ | --------------------------- |
     | proposed leftovers | `judged` for every leftover |

     Notes:

     - The destinations are all in `## Triage` already. Do not show `## Collected` to the owner before this point.
     - A missing line comes back.
     - A rejection sends the agent back to the step it came from: the collect for a collected line, the exclusion for a resolved one, the proposal for a destination, the verification for a Unit.
     - The gate is the owner's word.
     ```

### Verify

- Always:
  - `pnpm test:related .pi/skills/close/SKILL.md`（関連がなければ `pnpm test:run`）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えた `.pi/skills/close/SKILL.md` 全体を読み、14 のステップを実行の順にたどり、番号、パス、名前、形を確かめる。
  - その `SKILL.md` が名指す `.pi/skills/close/references/format.md`、`.pi/skills/close/references/tasks.md`、`.pi/skills/close/scripts/collect.mjs`、`.pi/extensions/consult/types.json`、`rules/roadmap.md`、`ROADMAP.md` を読み、名指しが指し先のファイルで解決することを確かめる。
  - 不整合は `.pi/skills/close/SKILL.md` の中で直す。
- Added:
  - other: `## Procedure` の `### ` の見出しが 14 件、`## Who decides` の表が 3 行、`## The leftover's states` の表が 6 行であることを `git diff` で確かめる。

## Notes

### Slice 1: 判定スキルの形を揃える

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Cleanup: テスト掃除

- Findings:
- Unplanned:

## Work Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Unproven:
- Noise:
- Doubts:

### Round 2

- Stale:
- Unlisted:
- Gaps:
- Unproven:
- Noise:
- Doubts:

## Acceptance

- Ran:
- Findings:
- Doubts: このサイクルだけ、オーナーが受入の前に自分で確かめる。
