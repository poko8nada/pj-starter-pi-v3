# PLAN `ex-plan-outside`

- Place: worktree
- Boundary Plans: なし（サイクルの plan はすべて終わっている）

## Files

```text
.pi/skills/plan/references/
  format.md               update
```

## Slices

## 1. `Outside:` の項目の出どころを定める

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/plan/references/format.md`:
   - update: `## Shape` と `## Slices` の「the `Boundary.External` item」を、`affected.md` の `### External` の項目に直す。

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `! grep -n 'Boundary.External' .pi/skills/plan/references/format.md`
  - `grep -n '### External' .pi/skills/plan/references/format.md`
  - 変更した全ファイルを通読し、矛盾、循環、重複、不足、不自然な流れがないか確かめる。ダメなら直し、`Unplanned` に書く。
- Added: なし

## Notes

### Slice 1: `Outside:` の項目の出どころを定める

- Findings: なし
- Unplanned: なし
- Commit: ee3193ef1fbdb3dbd0d22173c5f527b24812820f
- Stopped:

## Work Review

### Round 1

- Stale: なし — `.pi/skills/plan/references/format.md:42` と `:130` の2か所が直り、同ファイルに `Boundary.External` の残存がゼロ件で他に古くなる文書がないため。
- Unlisted: なし — 差分の変更ファイルは `.pi/skills/plan/references/format.md` の1件のみで、`cycles/261103-053-dev/plan/ex-plan-outside.md:10` の `Files` と一致するため。
- Gaps: なし — `ex-plan-outside.md:26` の求めた2か所が差分の2行に対応し、`Added: なし` (`ex-plan-outside.md:38`) の文書変更に検査の抜けがないため。
- Unproven: なし — 差分 `ee3193e` が `.pi/skills/plan/references/format.md:42,130` のみで、振る舞いを断言する検査自体が存在しないため。
- Noise: なし — `cycles/261103-053-dev/close.md:85` の特定不能を解消する文書修正であり、型制約が決める内容でも無意味な書き換えでもないため。
- Doubts: なし — 文言が `cycles/261103-053-dev/close.md:87` の `Then` どおりで、close が読むべき残件が見当たらないため。

## Acceptance

- Ran: `pnpm test:run`（731テスト、マージ後）、`pnpm typecheck`（root と .pi）、`pnpm lint`、`pnpm format:check`、`! grep -n 'Boundary.External' .pi/skills/plan/references/format.md`、`grep -n '### External' .pi/skills/plan/references/format.md`、変更したファイルの通読。マージは `2d35643`。
- Findings: なし
- Doubts: なし
