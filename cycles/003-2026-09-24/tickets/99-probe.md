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

なし

### Unplanned

なし

Commit:
