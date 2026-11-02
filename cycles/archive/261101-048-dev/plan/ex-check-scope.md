# PLAN `ex-check-scope`

## Files

```text
.pi/
  skills/
    plan/
      SKILL.md                    update
      references/
        format.md                 update
        tasks.md                  update
    work/
      SKILL.md                    update
```

## Slices

## 1.検査の規則を 1 組で揃える

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/plan/references/format.md`:
   - `## Verify` の末尾に「件数を数える検査は、比べる相手を書く。変更前から在る文字列は、全体の件数ではなく `git diff` の追加行で見る」を足し、「走らせられない `Verify` は穴」を「走らせられない、または変更を入れたままでは赤にしかならない `Verify` は穴」に直す。
2. `.pi/skills/plan/SKILL.md`:
   - `:66` の同じ文を同じ形に直し、`:80` の `Checks` の観点に「赤にしかならない `Verify`」を足す。
3. `.pi/skills/plan/references/tasks.md`:
   - `:14` の `Checks` の観点を、`plan/SKILL.md:80` と同じ文にそろえる。
4. `.pi/skills/work/SKILL.md`:
   - `### 7. Acceptance` の 10 行を、4 つの組（`**What the agent runs**`、`**What the owner closes**`、`**What counts as red**`、`**What is written**`）に組み直し、走らせる → 待つ → 判定する → 書くの順にする。

### Verify

- Always:
  - 関連するテスト: 変えるのは md の 4 本で、どのテストもこの 4 本を取り込まないため関連は無い。`pnpm test:run` を走らせる
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - このスライスが消した文言（`cannot be run is a hole`、`does not run as written, and a check that stays green`）が、この 4 ファイルに残っていないことを `grep -in` が 0 件であることで見る
- Added:
  - other — `grep -c "cannot be run, or that is red with the change in place"` が `plan/references/format.md` と `plan/SKILL.md` で各 1、`grep -c "one that is red with the change in place"` が `plan/SKILL.md` と `plan/references/tasks.md` で各 1、`grep -ci "a check that is red with the change in place"` が `work/SKILL.md` で 1、`grep -c "A check that counts a string says what it compares"` が `plan/references/format.md` で 1、`grep -c "^\*\*What"` が `work/SKILL.md` で 4 であることを見る

## Notes

### Slice 1: 検査の規則を 1 組で揃える

- Findings: なし
- Unplanned: なし
- Commit: なし（base の plan。オーナーの確認の後にコミットする）
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

- Ran: 変えた 4 ファイルの diff を読んだ（文書の plan なので、読むことが検査である）。`pnpm test:run`（58 ファイル、796 テスト）、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`、いずれも緑。`Verify` の `Always`: 消した文言（`cannot be run is a hole`、`does not run as written, and a check that stays green`）が 4 ファイルで 0 件。`Verify` の `Added`: `cannot be run, or that is red with the change in place` が `plan/references/format.md` と `plan/SKILL.md` で各 1、`one that is red with the change in place` が `plan/SKILL.md` と `plan/references/tasks.md` で各 1、`a check that is red with the change in place` が `work/SKILL.md` で 1、`A check that counts a string says what it compares` が 1、`**What` の組見出しが `work/SKILL.md` で 4。
- Findings: なし
- Doubts: なし
