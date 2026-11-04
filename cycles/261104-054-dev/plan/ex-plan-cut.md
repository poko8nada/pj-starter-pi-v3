# PLAN `ex-plan-cut`

- Place: base
- Boundary Plans: なし（`close-names` のマージ後に `cut.md` の 2 行だけを直す）

## Files

```text
.pi/skills/plan/references/cut.md         update
```

## Slices

## 1.Cut と Present の Why

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/plan/references/cut.md`:
   - update: 3 番目の項目を「do the two touch the same path? then they are one plan — the paths are in the affected's `### Code`. Order the two only when one reads the output of the other; whether a file exists, and its shape, is the plan's」に変える（同じパスなら 1 つのプランとし、順番は片方がもう片方の出力を読むときだけ付け、ファイルの有無と形は計画が決めるという 3 文にし、うしろの 2 文は今の文面のままとする）。
   - update: Present の `- Why:` を「read the `Role change` and the `Adjustment` in the affected, and write what those say and why they make these entries one plan; do not list the field names alone」に変える。

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - grep ツールで `.pi/skills/plan/references/cut.md` 内の `then keep them together — the paths are in the affected's` を検索し、0 件なのを確かめる
  - grep ツールで `.pi/skills/plan/references/cut.md` 内の `then they are one plan` を検索し、1 件なのを確かめる
  - grep ツールで `.pi/skills/plan/references/cut.md` 内の「which `Role change` and which `Adjustment`」を検索し、0 件なのを確かめる
  - 変更した 1 ファイルを変更前と並べて読み、矛盾、循環、重複、不足、不自然な流れがないか確かめる
- Added: base — オーナーが差分を読んで承認したら閉じる

## Notes

### Slice 1: Cut と Present の Why

- Findings: なし
- Unplanned: なし
- Commit:
- Stopped: なし

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
