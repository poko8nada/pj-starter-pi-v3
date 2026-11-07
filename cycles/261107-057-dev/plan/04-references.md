# PLAN `references`

- No: 04
- Place: worktree
- Boundary Plans: `procedure-skills`、`flow-skill`、`judgment-skill`（この計画は3 つがマージされた後に走る。書き直した `SKILL.md` と参照資料の文を突き合わせて重複を削るため）

## Design

- Inside:
  - Modules: なし。この計画では、8 つの参照資料はいずれも 1 ファイルで完結しており、統合も分割もしない。形を `adr` の参照資料に揃える。
  - Dirs: なし。この計画では、`.pi/skills/<name>/references/` の位置を動かさない。
- Outside:
  - Extract: なし。形は `adr` の参照資料 3 ファイルが基準であり、新しく作るものはない。
  - Colocate: なし。共通化をやめるモジュールはない。

## Files

```text
.pi/
  skills/
    plan/
      SKILL.md
      references/
        cut.md              update
        format.md           update
        tasks.md            update
    work/
      SKILL.md
      references/
        tasks.md            update
    upgrade/
      SKILL.md
      references/
        report.md           update
        tasks.md            update
    close/
      SKILL.md
      references/
        format.md           update
        tasks.md            update
      scripts/
        collect.mjs
ROADMAP.md
```

## Slices

## 1.参照資料の形を揃える

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/plan/references/cut.md`:
   - update: 見出し、1 行の説明、`## Shape`、`## <section>`、`## Writing` の並びに揃え、1 つの箇条書きに 1 つの規則を置き、重複した文は意味を変えずに短くする。セクション名は変えない。
2. `.pi/skills/plan/references/format.md`:
   - update: 同じ並びに揃え、1 つの箇条書きに 1 つの規則を置き、「Round 1 is a new conversation; Round 2 continues the reviewer's own, ...」と「Written after the review's fixes: ...」を削り、テストの書き方は `## Test cases` に寄せて `## Slices` の重複を削り、`## Writing` を置き、重複した文は意味を変えずに短くする。セクション名は変えない。
3. `.pi/skills/plan/references/tasks.md`:
   - update: 同じ並びに揃え、1 つの箇条書きに 1 つの規則を置き、`## Writing` を置き、重複した文は意味を変えずに短くする。セクション名は変えない。
4. `.pi/skills/work/references/tasks.md`:
   - update: 同じ並びに揃え、1 つの箇条書きに 1 つの規則を置き、「Round 1 runs in a new conversation (`continue: false`); Round 2 continues the reviewer's own, ...」を削り、`## Writing` を置き、重複した文は意味を変えずに短くする。セクション名は変えない。
5. `.pi/skills/upgrade/references/report.md`:
   - update: 同じ並びに揃え、1 つの箇条書きに 1 つの規則を置き、「`pnpm outdated` exits 1 when it finds something. That is not a failure.」を削り、`## Writing` を置き、重複した文は意味を変えずに短くする。セクション名は変えない。
6. `.pi/skills/upgrade/references/tasks.md`:
   - update: 同じ並びに揃え、1 つの箇条書きに 1 つの規則を置き、「One subagent per package. Two packages are never bundled into one task.」を削り、`## Writing` を置き、重複した文は意味を変えずに短くする。セクション名は変えない。
7. `.pi/skills/close/references/format.md`:
   - update: 同じ並びに揃え、1 つの箇条書きに 1 つの規則を置き、「The collect step writes this section.」「The proposal step writes it, and the owner's word closes it.」「The verification step writes it, and the owner's word closes it.」を削り、`## Triage` の `done <commit>` にある4 行の重複を1 つにまとめ、`## Writing` を置き、重複した文は意味を変えずに短くする。セクション名は変えない。
     ```md
     before:

     - `done <commit>` — the `ex-` plan has merged, and this is its merge commit.
     - `done <commit>` sits at the end of that line: `- <N>: _ex-plan_ <plan id> (ADR <NN>, <定義の部分>): done <commit>`.
     - `dropped <reason>` sits there instead when the work drops the `ex-` plan.

     after:

     - `done <commit>` sits at the end of the line: `- <N>: _ex-plan_ <plan id> (ADR <NN>, <定義の部分>): done <commit>`. It means the `ex-` plan has merged, and this is its merge commit. `dropped <reason>` sits there instead when the work drops the plan.
     ```
8. `.pi/skills/close/references/tasks.md`:
   - update: 同じ並びに揃え、1 つの箇条書きに 1 つの規則を置き、`## Writing` を置き、重複した文は意味を変えずに短くする。セクション名は変えない。

### Verify

- Always:
  - `pnpm test:related .pi/skills/plan/references/cut.md .pi/skills/plan/references/format.md .pi/skills/plan/references/tasks.md .pi/skills/work/references/tasks.md .pi/skills/upgrade/references/report.md .pi/skills/upgrade/references/tasks.md .pi/skills/close/references/format.md .pi/skills/close/references/tasks.md`（関連がなければ `pnpm test:run`）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 作業者は変えた 8 ファイルを役割ごとに読む。`plan` の起案者が読む `cut.md`、`format.md`、`tasks.md` の順、`work` の実行役が読む `work/references/tasks.md`、`upgrade` の調査役が読む `report.md`、`tasks.md` の順、`close` の実行役が読む `format.md`、`tasks.md` の順にたどり、番号、パス、名前、形を確かめる。
  - 作業者は `.pi/skills/plan/SKILL.md`、`.pi/skills/work/SKILL.md`、`.pi/skills/upgrade/SKILL.md`、`.pi/skills/close/SKILL.md` が名指すセクション名が、変えた 8 ファイルに残っていることを確かめる。
  - 作業者は不整合を変えた 8 ファイルの中で直す。その8 ファイルの外は変えない。
- Added:
  - なし

## Notes

### Slice 1: 参照資料の形を揃える

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
