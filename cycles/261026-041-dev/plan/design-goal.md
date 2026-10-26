# PLAN `design-goal`

- No: 01

## Files

```text
.pi/
  skills/
    design/
      SKILL.md                update
      references/
        format.md             update
        tasks.md              update
    plan/
      SKILL.md
lefthook.yaml
.oxfmtrc.json
package.json
```

## Slices

## 1.goal-nongoal

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/design/references/format.md`:
   - プランのセクションに `### Goal` と `### Non-goal` を足し、`Goal` を、`Adopted` を内容、`Scope` の `in` を範囲、`Research & Trial` を観測方法とする一文にし、その一文は検査を落とせるものとし、`Non-goal` は関連する `Scope` の `out` と作業者が誤って選びそうな `Options` を理由付きで書くと定めます。
2. `.pi/skills/design/SKILL.md`:
   - 手順 5 に、entry の項目（`Adopted`、`Scope` の `in`、`Research & Trial`、`Scope` の `out`、`Options`、`Definition`、`Context`）から `Goal` と `Non-goal` を合成する手順を足し、手順 7 のレビューに、`Adopted` の各行が `Goal` を満たすこと、`out` が `Non-goal` に含まれること、`Goal` が `Non-goal` に踏み込まないこと、`Goal` を検査できることを足します。
3. `.pi/skills/design/references/tasks.md`:
   - レビューのタスクの 1 点目に、`Adopted` の各行が `Goal` を満たすこと、`out` が `Non-goal` に含まれること、`Goal` が `Non-goal` に踏み込まないこと、`Goal` を検査できることを足します。

### Verify

- Always:
  - `pnpm test:related <changed files>`（関連が無ければ `pnpm test:run`）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えた名前と説明の `grep`（古い文言が無いこと）
- Added: base — オーナーが、`Goal` の一文、`Non-goal` の理由、`Adopted` の各行の `Goal` の充足、`out` の `Non-goal` の包含、`Goal` の `Non-goal` への不踏み込み、`Goal` の検査可能性を読みます。

## Notes

### Slice 1: goal-nongoal

- Findings:
- Unplanned:
- Commit:
- Stopped:

## Review

## Acceptance
