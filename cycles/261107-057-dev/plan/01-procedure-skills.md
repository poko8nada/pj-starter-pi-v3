# PLAN `procedure-skills`

- No: 01
- Place: worktree
- Boundary Plans: なし（本計画は `flow-skill`、`judgment-skill` と並行して進む）

## Design

- Inside:
  - Modules: なし。3 つの `SKILL.md` はいずれも 1 ファイルで完結しており、統合も分割もしない。本計画では形を 3 ファイルでそろえる。
  - Dirs: なし。本計画では `.pi/skills/<name>/` の位置を動かさない。
- Outside:
  - Extract: なし。形はエントリ 01 の `C19` が決めており、本計画では 3 ファイルに同じ形を書く。共通の参照資料を新設することは、エントリ 01 の `Denied`（`references/` へ移さない）に反する。
  - Colocate: なし。共通化をやめるモジュールはない。

## Files

```text
.pi/
  skills/
    plan/
      SKILL.md    update
    work/
      SKILL.md    update
    upgrade/
      SKILL.md    update
```

## Slices

## 1.手順スキルの形を揃える

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/plan/SKILL.md`:
   - update: 冒頭文は変えず、追加のみする。`## Procedure` の 8 つのステージを下のフェンスの形に分け、`### Changes after this` をステップ 8 の `Notes` に移し、箇条書きの外にある 2 つの段落（53 行、55 行）をステップ 4 の `Notes` に移し、末尾は `## How not to write this` とする。観点の列挙（ステップ 6 の 7 つ）は `View:` に置く。行動（オーナーを待つことを含む）は `Steps:` に置き、判断の規則、禁止、条件は `Notes:` に置く。注意点は、守るべきステップの `Notes:` に置く。文は `adr` の文体にそろえ、1 文に 1 つの事実を置き、行動の主語を明示し、現在形で書き、列挙は表にする。セクション名と、セクション番号と、ステップ番号は変えない。変えるのは、末尾を `## How not to write this` にすることだけである。frontmatter（`name`、`description`）は変えない。`View:` の表は 2 列で短く書けるものだけに使い、長い説明は箇条書きにする。末尾の `## How not to write this` には、二つ以上のステージにまたがり、一つのステージに収まらない禁止だけを残す。意味を変えず、内容は落とさない。削るのは、ステージの `Notes:` と重なる末尾の項目、末尾の `## How not to write this` にある work の規則、意味を変えずに短くできる重なった文だけである。
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
     ```md
     ### 3. Cut, and present

     Steps:

     1. Read `references/cut.md` before cutting.
     2. Cut the work into plans by what it reads, not by where it lives.
     3. Decide the split, the place of each plan, the order, and the boundary. Propose the place with the reason. When unsure of the place, propose worktree.
     4. Present them to the owner in the fence `references/cut.md` gives: one block per plan (`ADR`, `Place`, `Summary`, `Why`), then the `Order` last, numbered, for all plans.
     5. Wait for the owner's agreement. On disagreement, revise and present again until they agree.

     Notes:

     - The owner's answer decides the place.
     - The `Why` reads the `Kind` and the `Edge`. It says what those mean and why the entries make one plan. The field names alone are not enough.
     - The owner agrees before any plan md is written.
     ```
2. `.pi/skills/work/SKILL.md`:
   - update: 冒頭文は変えず、`## Procedure` の 9 つのステージを、本計画のステップ 1 と同じ形に分ける。ステップ 7 の 4 つの太字の小見出しは、`What the agent runs` と `What the owner closes` を `View:` の表（何を、誰が閉じるか）にし、`What counts as red` と `What is written` を `Notes:` にする。末尾の `## How not to do this` を `## How not to write this` に改める。ステージの `Notes:` と重なる末尾の項目は削る。意味を変えず、内容は落とさない。
3. `.pi/skills/upgrade/SKILL.md`:
   - update: 冒頭文は変えず、`## Not a cycle` と `## Files` の内容を導入文にまとめ、`## Procedure` の 7 つのステージを、本計画のステップ 1 と同じ形に分け、`## Out of scope` を各項目に該当するステージの `Notes:` と `## How not to write this` に分ける。末尾の `## How not to do this` を `## How not to write this` に改める。意味を変えず、内容は落とさない。ステージの `Notes:` と重なる末尾の項目と、意味を変えずに短くできる重なった文は削る。

### Verify

- Always:
  - `pnpm test:related .pi/skills/plan/SKILL.md .pi/skills/work/SKILL.md .pi/skills/upgrade/SKILL.md`（関連がなければ `pnpm test:run`）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えた 3 ファイルの全体と、各ファイルが名指す参照資料（`plan/references/cut.md`、`plan/references/format.md`、`plan/references/tasks.md`、`work/references/tasks.md`、`upgrade/references/report.md`、`upgrade/references/tasks.md`、`.pi/skills/adr/references/affected.format.md`、`.pi/extensions/consult/types.json`）を読み、使う者の立場でファイルに書かれた順に手順をたどり、番号、パス、名前、形を確かめ、不整合を直す。
- Added:
  - なし

## Notes

### Slice 1: 手順スキルの形を揃える

- Findings: なし
- Unplanned:
  - `.pi/skills/plan/SKILL.md:135` — `Steps` の「止まる」と `Notes` の「止まり、形を決める」が重なっていたため、`Notes` から「止まる」を削り、決める文だけを残した。読み通しで直す不整合のため、ここで直した。
  - `.pi/skills/work/SKILL.md:77` — `View` の 1 行目の条件に「作業が健全」が落ちていたため、`Steps` に合わせて足した。読み通しで直す不整合のため、ここで直した。
  - `.pi/skills/upgrade/SKILL.md:90-114` — ステップ 5 に 3 つの行動が 1 文に入り、`Notes` が `Steps` と重なっていたため、1 行動ずつに分け、重なった `Notes` の 2 行を削った。読み通しで直す不整合のため、ここで直した。
  - `.pi/skills/upgrade/SKILL.md:137-143` — ステップ 7 に 3 つの行動が 1 文に入っていたため、1 行動ずつに分けた。読み通しで直す不整合のため、ここで直した。
- Commit: `0888f6f3c1497cc32b3910a70a70ca29ff24c4ed`
- Stopped:

### Cleanup: 文書のみのため掃除なし

- Findings: なし — 計画の `Files` は 3 つの `SKILL.md`（文書）の `update` のみで、テストファイルを含まないため、削る対象がない。`pnpm test:run` は緑（63 files / 782 tests passed）であることを確かめた。
- Unplanned: なし

## Work Review

### Round 1

- Stale: なし — close の名指し（work step 8、plan steps 4 to 8、work step 2）が相手の現状と合うこと、参照資料のパス、frontmatter、セクション番号が変わっていないことを確かめた。
- Unlisted: なし — 差分は Files の 3 ファイルのみで、Unplanned の 4 件はいずれも同ファイル内の読み通し修正であることを確かめた。
- Gaps: なし — Added なし・文書のみの変更であり、Always の読み通し（番号・パス・名前・形の照合）が Unplanned の修正として残っていることを確かめた。
- Unproven: なし — 追加・更新するテストがなく、緑のまま残るテストがないことを確かめた。
- Noise: なし — 書くべきテスト事例がなく、型や制約が決める値の重複もないことを確かめた。
- Doubts: なし

### Round 2

- Stale:
- Unlisted:
- Gaps:
- Unproven:
- Noise:
- Doubts:

## Acceptance

- Ran: ワークツリーで `pnpm test:run`（63 ファイル、782 試験が合格）、`pnpm typecheck`（root と `.pi` が ok）、`pnpm lint`、`pnpm format:check` を走らせた。変えた 3 ファイルを読み、`Steps:`・`View:`・`Notes:` の分け方、末尾の 4 項目、冒頭文、frontmatter、名指しの解決を確かめた。
- Findings: なし
- Doubts: オーナーが受入の前に確認した。直す点の指摘はなかった。
