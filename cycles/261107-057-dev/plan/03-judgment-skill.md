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

- Findings: なし
- Unplanned: なし
- Commit: 0ba9589cf4a56e421c1f256739d57cdbeccf0acb
- Stopped:

### Cleanup: テスト掃除

- Findings: なし — 計画の Files は文書のみで、テストファイルを含まない
- Unplanned: なし

## Work Review

### Round 1

- Stale: なし — 名指し（the collect step・work step 8 green・references/format.md・collect.mjs・.pi/extensions/consult/types.json・rules/roadmap.md・ROADMAP.md・tasks.mdの見出し・consult_worktree list・work step 2・plan skill steps 4〜8）は指し先の現状と合い、takes/gives→View・禁止/条件→Notesへの移動と14手順の内容保存に脱落や陳腐化はなかった（`.pi/skills/close/SKILL.md:46`）。
- Unlisted: なし — 差分はFilesがupdateと名指すSKILL.mdの1件のみで、Filesの名指さない変更はなかった（`cycles/261107-057-dev/plan/03-judgment-skill.md:22`）。
- Gaps: なし — Alwaysの読み通し（14手順の実行順追跡と名指し先の解決確認）とAddedの件数確認がこの文書変更の振る舞いを覆い、checksがexerciseしない振る舞いは残らなかった（`cycles/261107-057-dev/plan/03-judgment-skill.md:141`）。
- Unproven: なし — 計画のFilesは文書のみでテストを含まないため、振る舞いを壊しても緑のまま残るテストはない（`cycles/261107-057-dev/plan/03-judgment-skill.md:152`）。
- Noise: なし — テスト手順がなく、型・スキーマ・DB制約が決着済みの断定やマジックナンバー・ハードコード文字列を持つcasesもない（`cycles/261107-057-dev/plan/03-judgment-skill.md:152`）。
- Doubts: なし

### Round 2

- Stale:
- Unlisted:
- Gaps:
- Unproven:
- Noise:
- Doubts:

## Acceptance

- Ran: ワークツリーで `pnpm test:run`（63 ファイル、782 試験が合格）、`pnpm typecheck`（root と `.pi` が ok）、`pnpm lint`、`pnpm format:check` を走らせた。変えた `close/SKILL.md` を読み、`Steps:`・`View:`・`Notes:` の分け方、門の表、状態の表、各ステップの `takes` と `gives`、ステップ 8 の戻り、末尾の 4 項目、冒頭文、frontmatter、名指しの解決を確かめた。`git diff` で、`###` の見出しが 14 件、門の表が 3 行、状態の表が 6 行であることを確かめた。
- Findings: なし
- Doubts: オーナーが受入の前に確認した。直す点の指摘はなかった。
