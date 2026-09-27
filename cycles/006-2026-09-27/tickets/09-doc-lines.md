# doc-lines

Acceptance:

- `consult/README.md` の `## Settings` に `types.json` のパスがある
- `README.md` / `README.ja.md` の「使い始める」に `types.json` のパスがある
- 「エージェントのターンごと」の行が実物どおり（変えた物があるときだけ走り、修正の段は `lint:fix` → `format`、検証の段は `lint` → `typecheck`）
- 「入っているもの」に `.github/workflows/pullfrog.yml` がある

## Todo

- `.pi/extensions/consult/README.md`
  - `## Settings` — 「このファイルの隣」にパス（`.pi/extensions/consult/types.json`）を添える
- `README.md` / `README.ja.md`
  - `## Getting started` の 2 番目 — `types.json` のパスを書く
  - `## Checks` の「On every agent turn」— 変えた物があるときだけ走ること、修正の段が `lint:fix` → `format`、検証の段が `lint` → `typecheck:staged` であることを書く
  - `## What is in it` — `.github/workflows/pullfrog.yml`（dispatch で agent を走らせる）を足す

## Verify

### form

- `grep -c "lint:fix" README.md README.ja.md` が 1 以上（順序の記述がある）
- `grep -c "pullfrog" README.md README.ja.md` が 1 以上
- `grep -c "consult/types.json" README.md README.ja.md .pi/extensions/consult/README.md` が 1 以上
- 「runs first」が README 2 枚に無い

### look

- `README.md` / `README.ja.md` の「エージェントのターンごと」の行が、`.pi/extensions/quality-gate/checks.ts` の `CHECK_SPECS`（fix: `lint:fix` → `format`、verify: `lint` → `typecheck:staged`）と一致する
- 「入っているもの」の並びが、`.pi/` / `.github/` / `lefthook.yaml` の実物と食い違わない

## Notes

### Findings

- なし

### Unplanned

- なし

Commit:
