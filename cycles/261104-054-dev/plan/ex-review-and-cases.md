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

- Findings:
- Unplanned:
- Commit:
- Stopped:

## Work Review

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
