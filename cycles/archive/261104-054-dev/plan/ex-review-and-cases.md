# PLAN `ex-review-and-cases`

- Place: base
- Boundary Plans: なし（`close-names` のマージ後に、レビューの任務文とプランの書き方への修正で閉じる）

## Files

```text
.pi/skills/work/references/tasks.md       update
.pi/skills/plan/references/format.md      update
```

## Slices

## 1.レビュー・通読・事例の書き方

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/work/references/tasks.md`:
   - update: レビューの任務文における `- Doubts:` の行を `A doubt you resolved yourself is not written: write only a doubt that needs a fix or the owner's judgement` にする。
   - update: レビューの任務文における `Stale` を `a document, a comment, a test, or a sentence the change makes redundant` にする。
   - update: 修正役の任務文に、`left:` は finding にだけ付けるという1文を英語で足す。
2. `.pi/skills/plan/references/format.md`:
   - update: `Verify` の例の「変更した全ファイルを通読し」を「変更した全ファイルを、変える前と並べて読み」に変える。
   - update: `Verify` の説明の `every changed file is read through` を `every changed file is read against the file before the change` に変える。
   - update: `Verify` の例の「`grep` する」を「grep ツールで（大小文字を問わず）検索する」に変える。
   - update: `Verify` の説明の `a case-insensitive` と `grep` の並びを `a case-insensitive grep tool search` に変える。
   - update: `## Test cases` に「A `<given>` names a premise that can be built one way, and keeps the ADR's subject when the ADR names one.」を足す。

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `git diff` を読み、`Stale` の行が `or a sentence the change makes redundant` を含み、`Doubts` の行が `A doubt you resolved yourself is not written` に変わり、`a case-insensitive \`grep\`` と「変更した全ファイルを通読し」が消え、`a case-insensitive grep tool search`、「変える前と並べて読み」、「grep ツールで（大小文字を問わず）」が入っていることを確かめる
  - grep ツールで `.pi/skills/work/references/tasks.md` から `goes on a finding, not on a doubt` を検索し、1件であることを確かめる
  - grep ツールで `.pi/skills/plan/references/format.md` から `names a premise that can be built one way` を検索し、1件であることを確かめる
  - 変更した2ファイルを変える前と並べて読み、矛盾、循環、重複、不足、不自然な流れがないか確かめる
- Added: base — オーナーが差分を読み、OKを出す

## Notes

### Slice 1: レビュー・通読・事例の書き方

- Findings: なし
- Unplanned: なし
- Commit: `89e447c`
- Stopped: なし

## Work Review

### Round 1

- Stale: `.pi/skills/plan/references/format.md:210` の Work Review の `Stale` 説明が `a doc, a comment, a test` のままで、今回 `.pi/skills/work/references/tasks.md:38` に足した `or a sentence the change makes redundant` を含んでいない。理由：任務文の定義を広げたのに、同じ五視点を説明する文書側を Steps が名指ししておらず、読む人が古い狭い定義のまま残ると判断したため。
  - fixed: `.pi/skills/plan/references/format.md:210` の `Stale` の説明を `a doc, a comment, a test, or a sentence the change makes redundant` に変えた。
- Unlisted: `.pi/skills/plan/references/cut.md:11,24` の cut 規則 3 番と Present の `Why` の変更、および `cycles/261104-054-dev/plan/ex-plan-cut.md` と `cycles/261104-054-dev/plan/ex-review-and-cases.md` の Notes（`Findings: なし` 等）の変更は、このプランのどの Step も名指ししていない。理由：Files は tasks.md と format.md の 2 件だけを挙げ、Steps もそのセクションだけを書くため、差分（`97ed552..HEAD`）に含まれる別プランの変更と記録用の書き込みが Steps の外に残ると判断したため。
  - left: `cut.md` の 2 行は `ex-plan-cut` のプランの変更で、このプランの `Files` の外である。`97ed552..HEAD` に別のプランのコミットが並ぶのは、6 つの `ex-` を下から順に実装しているためで、このプランのコミットは `89e447c` だけである。
- Gaps: `cycles/261104-054-dev/close.md:92` の残り 15 の `Then`（`format.md` の 56 行を「grep ツールで（大小文字を問わず）…を検索する」に）が運ばれていない。`.pi/skills/plan/references/format.md:56` は `大小文字を問わず grep ツールで検索する` で、括弧付きの `grep ツールで（大小文字を問わず）` を持たない。理由：重複を避けて語順を入れ替えた結果、Then と Steps（`cycles/261104-054-dev/plan/ex-review-and-cases.md:32`）が求めた形のままではなく、Verify が求める部分文字列も差分に現れないため。
  - fixed: `.pi/skills/plan/references/format.md:56` を `grep ツールで（大小文字を問わず）検索する` に直した。
- Unproven: `cycles/261104-054-dev/plan/ex-review-and-cases.md:43-45` の Verify のうち、自動で件数を数えるのは `goes on a finding, not on a doubt` と `names a premise that can be built one way` の 2 件だけで、`.pi/skills/work/references/tasks.md:38` の `or a sentence the change makes redundant` を消しても `pnpm test:run`・`typecheck`・`lint`・`format:check` と 2 件の grep 数えは緑のままである。理由：文書だけの変更でコードのテストが触れず、残りの文言は人の目による `git diff` 読みだけが頼りのため、外しても自動確認が赤にならないと判断したため。
  - left: 文書だけの変更で、コードのテストが触れない。`git diff` を読み、変えた行を変える前と並べて確かめている。
- Noise: なし。理由：`grep ツールで検索する` と `grep tool search` は日英の対応で重複ではなく、名前は道具と操作を示し、今回の差分が分岐をなくす箇所もないことを `git diff 97ed552..HEAD` で確かめたため。
- Doubts: `.pi/skills/plan/references/format.md:56` を残り 15 の Then・Steps 通りの `grep ツールで（大小文字を問わず）検索する` に直すか、現行の `大小文字を問わず grep ツールで検索する` を保って Verify（`cycles/261104-054-dev/plan/ex-review-and-cases.md:43` の期待文字列）を直すかは、オーナーの判断が要る。理由：Steps 通りに置換すると `大小文字を問わず` が二重になり、現行は重複を避けた代わりに Then・Verify と字面がずれており、自力ではどちらを正とするか決められないため。
  - fixed: 残り 15 の `Then` と Steps の形に合わせ、`grep ツールで（大小文字を問わず）検索する` に直した。二重にならない。

### Round 2

- Stale: なし（`fixed:` 1 件を確認済み）。理由：`.pi/skills/plan/references/format.md:210` が `a doc, a comment, a test, or a sentence the change makes redundant` となり、Round 1 の `fixed:` 申告どおりに直っているため。
- Unlisted: なし。理由：`fixed:` がなく、`left:` は回答済みとして再開しないため。
- Gaps: なし（`fixed:` 1 件を確認済み）。理由：`.pi/skills/plan/references/format.md:56` が `grep ツールで（大小文字を問わず）検索する` となり、Round 1 の `fixed:` 申告どおり括弧付きの形を持つため。
- Unproven: なし。理由：`fixed:` がなく、`left:` は回答済みとして再開しないため。
- Noise: なし。理由：`fixed:` がなく、Round 1 が `なし` のままのため。
- Doubts: なし（`fixed:` 1 件を確認済み）。理由：`.pi/skills/plan/references/format.md:56` が残り 15 の `Then`・Steps 通りの `grep ツールで（大小文字を問わず）検索する` となり、`大小文字を問わず` の二重もないため。Round 1 の選択肢のうち採用された形で決着している。

## Acceptance

- Ran: `pnpm test:run`（63 ファイル、756 件）、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`、grep で `goes on a finding, not on a doubt` を `tasks.md` から 1 件、`names a premise that can be built one way` を `format.md` から 1 件、2 ファイルの読み、`git diff 97ed552..HEAD` の通読。
- Findings: なし
- Doubts: なし
