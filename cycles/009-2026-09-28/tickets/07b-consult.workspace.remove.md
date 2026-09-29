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

- `git branch -d` が「取り込み済みか」の判定そのものだったので、`branchMerged` を別に作らなかった
  - なぜ外か: チケットの Todo は `branchMerged(cwd, branch)`（`git merge-base --is-ancestor`）を上げていた
  - 観測: `git branch -d` は「HEAD（または upstream）に取り込まれていなければ断る」ので、同じ判定を 2 回書くことになる。ローカルのブランチ（upstream 無し）では「HEAD に取り込み済み」と同じ
  - 実装: `-d`（既定）/ `-D`（`force`）を撃ち、`status === 0` なら `removed`、そうでなければ `removed-branch-kept` を返す
- **検査の `runGit` は worktree の中で使えない** ことが分かった（この unit の検査で嵌まった）
  - なぜ外か: `runGit` は `GIT_DIR` / `GIT_WORK_TREE` / `GIT_INDEX_FILE` を **repo 用に固定**する。cwd を worktree にしても、repo の作業木を見てしまう
  - 観測: 「未マージのブランチは残す」の検査が出す `dirty` が取れなかった。worktree で `git add` / `git commit` をしても、実際には repo の側を見ていて何も起きていなかった
  - 実装: 両方の検査ファイルに `gitInWorktree(path, args)` を置いた（`gitEnv(process.env)` + `cwd: path`）。実物のコード（`worktreeGit(path)`）は元からこの形で、デモの `consult_commit` が実証している

### Unplanned

- `.pi/extensions/consult/run/worktree.test.ts`: 既存の「ブランチは消えるまで残る」を、3 つの検査（取り込み済み → 消える / 未マージ → 残る / `force` → 消える）に置き換えた
  - なぜ: 面が変わったため（古い検査は「ブランチを残す」を固定していた）
- `.pi/extensions/consult/tool/worktree.test.ts`: `remove` の文言（ブランチも消した / 未マージなので残した）の検査と、worktree 用の `gitInWorktree` を足した
  - なぜ: チケットの `Verify` が両方の検査ファイルを上げているため
- `.pi/extensions/consult/run/worktree.ts`: `removed-branch-kept` を `RemoveOutcome` に足した
  - なぜ: 「worktree は消えたがブランチは残した」を親に伝える必要があった

Commit: d8b1fb9
