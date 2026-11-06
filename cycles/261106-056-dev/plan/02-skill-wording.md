# PLAN `skill-wording`

- No: 02
- Place: worktree
- Boundary Plans: なし

## Design

- Inside:
  - Modules: 見出し3つを `Japanese Proofread` にそろえ、手順3つを `the Japanese proofread of <対象>` にして `for the shape` を削る。形の指定はロールの文にあるため、手順では対象・読む文書・方針・範囲の順に読める。戻す規則3つの直後に引用文の例外をそれぞれ1文ずつ足す。`yolo` の2行と `close` の完了条件の1行を同じ呼び名にそろえる。全体では4つのスキルと1つの参照で同じ呼び名になり、名指す文はそのファイルの見出しを指す。ファイルの統合も分割もしない。
  - Dirs: なし。`references/` のツリーは変えない。
- Outside:
  - Extract: なし。共通化するモジュールはない。
  - Colocate: なし。共通化をやめるモジュールはない。

## Files

```text
.pi/
  skills/
    adr/
      SKILL.md                update
      references/
        adr.format.md
    plan/
      SKILL.md                update
      references/
        format.md
    close/
      SKILL.md                update
      references/
        format.md             update
    yolo/
      SKILL.md                update
```

## Slices

## 1.校正の呼び名を整える

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/adr/SKILL.md`:
   - update: `## Proofread` を `## Japanese Proofread` にし、手順を `the Japanese proofread of adr.md` にして `for the shape` を削り、案内文を `the Japanese proofread is in `## Japanese Proofread`` にし、戻す規則の直後に引用文の例外を足す。
     ```md
     - the Japanese proofread is in `## Japanese Proofread`; the affected is the entry's, in `references/affected.format.md`'s shape, and the `research` subagent writes it to `affected.md`
     ```
     ```md
     ## Japanese Proofread

     After the confirmation of an entry, run one `proofreader` subagent with the cycle's `adr.md` for the Japanese proofread of `adr.md`; have it read `.pi/skills/adr/references/adr.format.md`; the role's policy applies; edit only `adr.md`, and only this entry's lines.
     ```
     ```md
     - the wording of a quoted passage is not a change of meaning: keep that correction
     ```
2. `.pi/skills/plan/SKILL.md`:
   - update: `### 7. Proofread` を `### 7. Japanese Proofread` にし、手順を `the Japanese proofread of the plan md` にして `for the shape` を削り、戻す規則の直後に引用文の例外を足す。
     ```md
     ### 7. Japanese Proofread

     After every review is done, run one `proofreader` subagent per file in parallel with `cycles/<YYMMDD>-<NNN>-<slug>/plan/<NN>-<plan id>.md` for the Japanese proofread of the plan md; have it read `.pi/skills/plan/references/format.md`; the role's policy applies; edit only the plan md.
     ```
     ```md
     - the wording of a quoted passage is not a change of meaning: keep that correction
     ```
3. `.pi/skills/close/SKILL.md`:
   - update: `### 7. Proofread` を `### 7. Japanese Proofread` にし、手順を `the Japanese proofread of close.md` にして `for the shape` を削り、戻す規則の直後に引用文の例外を足す。
     ```md
     ### 7. Japanese Proofread

     - run one `proofreader` subagent with `cycles/<YYMMDD>-<NNN>-<slug>/close.md` for the Japanese proofread of `close.md`; have it read `.pi/skills/close/references/format.md`; the role's policy applies; edit only `close.md`
     ```
     ```md
     - the wording of a quoted passage is not a change of meaning: keep that correction
     ```
4. `.pi/skills/yolo/SKILL.md`:
   - update: `plan` の省略と `close` の校正を `the Japanese proofread` にする。
     ```md
     - skips: the Japanese proofread (the owner does not read the plan mds under `yolo`, so it does not run later either), and the owner's look at the plan mds
     ```
     ```md
     - run the Japanese proofread here, so the `close.md` at the stop is what the owner can read
     ```
5. `.pi/skills/close/references/format.md`:
   - update: `the proofread` を `the Japanese proofread` にする。
     ```md
     - Then the Japanese proofread runs, and the owner reads the whole `close.md` and judges the triage.
     ```

### Verify

- Always:
  - `pnpm test:related .pi/skills/adr/SKILL.md .pi/skills/plan/SKILL.md .pi/skills/close/SKILL.md .pi/skills/yolo/SKILL.md .pi/skills/close/references/format.md`（関連がなければ `pnpm test:run`）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えた5つのファイル全体と、各ファイルが名指す `format.md` を読み、利用者が使う順に手順をたどり、番号、パス、名前、形を確かめ、不整合を直す。
- Added:
  - other: 差分に `the wording of a quoted passage is not a change of meaning` が3件あることを `git diff` で確かめる。

## Notes

### Slice 1: 校正の呼び名を整える

- Findings: なし
- Unplanned: なし
- Commit: 586f1c2
- Stopped:

### Cleanup: テスト掃除

- Findings: なし — 計画の `Files` が更新する5件は文書のみでテストファイルを含まない。隣接の `adr/scripts/index.test.ts` と `close/scripts/collect.test.ts` は変更文言に触れず、重複・消滅した振る舞い・消滅した分岐のいずれにも当たらないため削除なし。`pnpm test:run` は63ファイル771テスト合格で緑を保つ
- Unplanned: なし

## Work Review

### Round 1

- Stale: なし — 旧見出し `## Proofread` / `### 7. Proofread` は `.pi/skills/adr/SKILL.md:161`、`.pi/skills/plan/SKILL.md:82`、`.pi/skills/close/SKILL.md:108` の新見出しに置き換わり、削るはずの `for the shape` の残存も対象3手順になく、名指す文が新見出しを指すため陳腐化・冗長化なし
- Unlisted: なし — 差分の5件は `Files` の `update` 5件 (`.pi/skills/adr/SKILL.md`、`.pi/skills/plan/SKILL.md`、`.pi/skills/close/SKILL.md`、`.pi/skills/close/references/format.md`、`.pi/skills/yolo/SKILL.md`) と一致し、無印の関連2件 (`.pi/skills/adr/references/adr.format.md`、`.pi/skills/plan/references/format.md`) に変更なし
- Gaps: なし — 例外文3件の `Added` の計数は差分で3件 (`.pi/skills/adr/SKILL.md:167`、`.pi/skills/plan/SKILL.md:88`、`.pi/skills/close/SKILL.md:116`) を確認でき、残る `yolo` 2行と完了条件1行は `Always` の読み通しが担い、型・テストの移動がないため追加の振る舞いなし
- Unproven: なし — 計画はテストファイルを持たず (`Types` なし・テスト手順なし)、既存テストに変更がないため壊れても緑のままになる命名テストなし
- Noise: なし — 新規テストがなく、既存テストも変更文言に触れないため、型・スキーマで済む主張やマジックナンバー・ハードコード文字列の判定対象なし
- Doubts: 対象外に残る素の `proofread` (例: `.pi/skills/adr/SKILL.md:150` の `### 11. Proofread and Affected`、同 `:152` の `run the proofread`、`.pi/skills/close/SKILL.md:75` の `after the proofread`、`.pi/skills/yolo/SKILL.md:45` の `complete and proofread`) も `the Japanese proofread` にそろえるかは所有者の判断が必要 — 計画の `Design` は見出し3つと名指す文のみを対象と決めており、拡大は本計画の外になるため所見にせず残す

## Acceptance

- Ran: 型検査と試験の全体をワークツリーで走らせた（`pnpm typecheck` は合格、63ファイル771試験が合格）。文書だけの変更のため、差分を読み、5件の文言が計画どおりであることを確かめた。
- Findings: なし
- Doubts: `Round 1` の `Doubts` にある残る素の `proofread` の扱いは、所有者の判断を待ち、終了処理が引き継ぐ。
