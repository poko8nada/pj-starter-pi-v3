# PLAN `ex-roadmap-cycles-wording`

- Place: base
- Boundary Plans: なし（`cycle-rules` のマージ後に `rules/roadmap.md` の 1 行だけ直す）

## Files

```text
rules/roadmap.md              update
```

## Slices

## 1.cycles の行にある重複した句

### Types

```ts
なし;
```

### Steps

1. `rules/roadmap.md`:
   - update: `cycles` の行に足した句「and separated by `,` when more than one is present」を「and separated by `,`」に戻し、もとからある「More than one is allowed.」を残す。行を「区切り方は `,`」と「複数あってよい」の2文に分け、`NNN-m`・`NNN-d`・`NNN-f` の形と接尾辞の頭文字の規則はその後ろに続ける。この形と規則は変えない。

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `git diff` を読み、`when more than one is present` を消したことと、`More than one is allowed.`・`NNN-m`・`NNN-d`・`NNN-f` と接尾辞の頭文字の規則を残したことを確かめる。
  - 変更したファイルを変更前と見比べて読み、矛盾、循環、重複、不足、不自然な流れがないか確かめる。
- Added: base — オーナーが差分を読んで OK する。

## Notes

### Slice 1: cycles の行にある重複した句

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
