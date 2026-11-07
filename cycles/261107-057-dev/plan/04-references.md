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
   - update: 形を持つファイルだけに `## Shape` を置くため、見出し、1 行の説明、`## <section>`、`## Writing` の並びに揃えて `## Shape` を外し、1 つの箇条書きに 1 つの規則を置き、重複した文は意味を変えずに短くする。セクション名は変えない。
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

- Findings: なし
- Unplanned: なし
- Commit: 0a488690f8f8400c4cf74950cfcb4bc6ed9a8069

### Cleanup: テスト掃除

- Findings: この plan の `Files` が `update` する 8 件は英語の参照資料のみで、テストファイルを `Files` に持たない。よって掃除対象のテストは存在しない。`pnpm test:run` は緑（63 files / 782 tests passed）であることを確かめた。
- Unplanned: なし

## Work Review

### Round 1

- Stale:
  - `.pi/skills/plan/references/format.md:91` — `## Shape` の中の `## Work Review` が `### Round 1` のみを示し、本文の `### Round 2`（`.pi/skills/plan/references/format.md:300-302`）を含まない。理由：`## Shape` は計画 md の形を示すものであり、到着時点で形と本文が食い違っているため、読み手は Round 2 の記録場所を形から読み取れない。計画の Verify（番号・名前・形の照合）が見逃した不一致である。なお計画が名指した削除文（`close/references/format.md` の 3 文、`plan/references/format.md` の 2 文、`upgrade/references/tasks.md:26`、`work/references/tasks.md:55`、`upgrade/references/report.md:44`、`close/references/format.md:72-75` の集約、`## Slices`／`## Test cases` の集約）はいずれも除去済みであることを確認した。
    - fixed: `## Shape` の `## Work Review` に `### Round 2` を足し、本文の `### Round 1`／`### Round 2` と一致させた。
- Unlisted:
  - なし — 差分の 8 件は `Files` の `update` 8 件と一致し、`SKILL.md`・`collect.mjs`・`ROADMAP.md`（無印＝関連ファイル）への変更はない。
- Gaps:
  - なし — `Added` はなしで振る舞いがなく、`Always` の読み合わせ対象は 8 ファイルの役割順読みと `SKILL.md` 4 件が名指すセクション名（`Slices`／`Clean the tests`／`Review`／`Fixes`／`Acceptance's findings`、`Look it up`、`Look one package up`、`Collected`／`Triage`／`Verified`、`Design`／`Test cases` 等）であり、いずれも残存を確認した。
- Unproven:
  - なし — テストファイルの追加・更新がなくテストステップ自体がないため、`## Test cases` で照合すべき cases が存在しない。
- Noise:
  - なし — 同上。テストステップがないため、型・スキーマ・DB 制約が決めることや誰も気づかないケースの有無を論じる対象がない。
- Doubts:
  - `.pi/skills/plan/references/cut.md:5-13` ほか `tasks.md` 4 件の `## Shape` は、ADR の `Shape`（別成果物 `adr.md`／`affected.md` の形を示す）とは異なり、自身の見出しの再掲になっている。理由：直下の見出しと同一の情報を繰り返すだけで、セクション改名時の二重更新を強いる。計画が 8 件の並びを `## Shape` 含みで揃えると決めたため指摘にはしないが、残す価値があったかはオーナーの判断を求める。
    - fixed: オーナーの判断により、記録の形を定めない 5 件（plan `cut.md`・plan `tasks.md`・work `tasks.md`・upgrade `tasks.md`・close `tasks.md`）から `## Shape` を外し、`## Shape` を残すのは記録の形を定める 3 件（plan `format.md`・upgrade `report.md`・close `format.md`）だけにした。

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
