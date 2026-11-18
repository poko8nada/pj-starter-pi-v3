# Close 075

## Collected

なし

## Triage

なし

## Verified

### subagent-consult

- Plans:
  - `fake-git`
  - `git-contract`
- Result: OK（オーナーは実行できないため、エージェントが代わりに確認した）。`consult_worktree` で `new check-075` を実行すると `branch: consult/check-075` と `/private/tmp/pi-consult/.../check-075/wt` を返し、`list` が `check-075 ... (clean)` を出し、`remove check-075` が「消した: check-075（ブランチも消した）」を返した。ワークツリーの作成・一覧・削除が動いている。
- Change: OK（オーナーが確認した）。
- Fixed: なし
