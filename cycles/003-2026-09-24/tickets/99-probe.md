# probe

Acceptance: `PROBE.txt` がリポジトリの根にあり、中身が `probe` の 1 行である

## Todo

- `PROBE.txt`
  - `probe` の 1 行を書く
  - ケース: ファイルの中身が `probe` であること (happy)
- 想定エラー経路 → この探りには無い — ケース無し
- null / 空 / 境界 / 不正 / 権限 / 2 回目 / 並行 → ファイル 1 枚を書くだけ — ケース無し

## Verify

- `cat PROBE.txt` が `probe` を返す

## Notes

### Findings

- 実演の結果（`Verify`）: リポジトリの根に `PROBE.txt` を作り、`cat PROBE.txt` → `probe`（終了コード 0）。求めた 1 行がそのまま出た
- 値も見た: `wc -l` = 1、`od -c` = `p r o b e \n` の 6 バイト。余分な行も空白も無い
- この worktree に残した変更は `PROBE.txt`（新規）とこのチケットの `Notes` の 2 つだけ。実演の後片付けが要るものは残していない
- `Commit:` は空のままにした。書くのは ref を取る側（親）で、ハッシュは `consult` がコミットしたあとにしか無い

### Unplanned

- なし

Commit: 75d5206
