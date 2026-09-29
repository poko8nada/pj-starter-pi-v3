# consult.workspace.remove

Acceptance:

- `consult_worktree{action: remove, id}` が worktree を消したあと、**HEAD に取り込み済みのブランチも消す**
- 未マージのブランチは消さず、その理由を返す（未マージの仕事を消さない）
- `force: true` のときだけ未マージでも消す（捨てると決めたとき）
- 子が動いている worktree の `remove` は今まで通り拒む
- 変更が残っている worktree は `force` 無しでは拒む
- 「worktree は明示しない限り残る」は変わらない（消す口は `consult_worktree{action: remove}` のまま）

Owner: at the end

## Todo

- `.pi/extensions/consult/run/worktree.ts`
  - `branchMerged(cwd, branch)` — `git merge-base --is-ancestor <branch> HEAD` で取り込み済みかを判定する
  - `removeWorktree`: worktree を消したあと、取り込み済み（または `force`）ならブランチも消す。戻り値を `removed` / `removed-branch-kept` / `missing` / `busy` / `dirty` に広げる
- `.pi/extensions/consult/tool/worktree.ts`
  - `remove` の結果を本文に出す（ブランチも消した / 未マージなので残した）
- テスト: `.pi/extensions/consult/run/worktree.test.ts`, `.pi/extensions/consult/tool/worktree.test.ts`

## Verify

### test

- `pnpm test:run consult/run/worktree consult/tool/worktree`（6 ケース）
  - マージ済み → `removed` で、ブランチが消える（happy）— 1 行目を決める
  - 未マージ → `removed-branch-kept` で、ブランチが残る（happy）— 2 行目を決める
  - 未マージ + `force` → `removed` で、ブランチが消える（happy）— 3 行目を決める
  - 子が動いている → `busy`（worktree もブランチも消さない）（error）— 4 行目を決める
  - 変更が残っている + `force` 無し → `dirty`（error）— 5 行目を決める
  - 無い id → `missing`（error）— 5 行目を決める
  - 権限: 該当なし（理由: 親のディレクトリから `git worktree` と `git branch` を打つだけ）
  - 同時実行: 該当なし（理由: unit 内は直列で、同じ worktree に同時に書かない）

## Notes

### Findings

- なし

### Unplanned

- なし

Commit:
