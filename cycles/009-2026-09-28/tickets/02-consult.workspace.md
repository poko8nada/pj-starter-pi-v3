# consult.workspace

Acceptance:

- worktree は `consult_worktree{action: new}` で作られ、**明示しない限り残る**。消えるのは `consult_worktree{action: remove}` だけ
- 置き場は `/tmp/pi-consult/<project>-<YYYYMMDD-HHMM>/<unit-id>/` で、親も子も read も bash もできる
- worktree のブランチは `consult/<unit-id>`、base は親の HEAD（`main` を仮定しない）
- 同じ worktree に同時に書けるのは 1 体（unit 内は直列）
- 子が動いている worktree への `remove` は拒否する
- 台帳ファイルを持たず、一覧は `git worktree list` と `consult/*` から作る
- worktree の作成・削除が `run/run.ts` から `run/worktree.ts` へ移り、`run/retry.ts` は落ちる

Owner: at the end

## Todo

- `.pi/extensions/consult/run/worktree.ts`（新規）
  - `worktreeRoot()` — `/tmp/pi-consult/<project>-<YYYYMMDD-HHMM>/` を決め、無ければ作る
  - `createWorktree(unit)` — `consult/<unit>` ブランチを親の HEAD から作り、`<root>/<unit>/wt` に worktree を置く。既にあれば同じ物を返す
  - `removeWorktree(unit, force)` — 子が動いていれば拒否。変更が残っていれば `force` を要求
  - `listWorktrees()` — `git worktree list` と `consult/*` から `id / branch / path / 変更ありか / 走っている子の数` を組む
  - `unitWindow(unit)` — 実行の記録を置く `<root>/<unit>/`（worktree の外）を返す
  - `run/run.ts` の `createWorktree` / `removeWorktree`（48・66 行目付近）をここへ移す
- `.pi/extensions/consult/run/run.ts`
  - `createWorktree` / `removeWorktree` を消し、`run/worktree.ts` を呼ぶ
  - `finally` で worktree を消す道を消す
- `.pi/extensions/consult/run/retry.ts`（削除）
  - `attemptAndCommit` と retry ループは、worktree が残る設計では要らない
- `.pi/extensions/consult/tool/worktree.ts`（新規）
  - `consult_worktree` の `new` / `list` / `remove`（既定 `list`）と、引数の検証、戻り値の組み立て
- `.pi/extensions/consult/index.ts`
  - `consult_worktree` を登録する
- テスト: `.pi/extensions/consult/run/worktree.test.ts`（新規）、`.pi/extensions/consult/tool/worktree.test.ts`（新規）、`.pi/extensions/consult/run/run.test.ts`（`createWorktree` / `removeWorktree` の import を外す）、`.pi/extensions/consult/run/retry.test.ts`（削除）

## Verify

### test

- `pnpm test:run consult/run/worktree consult/tool/worktree consult/run/run`（12 ケース）
  - `createWorktree('1-a')` → `<root>/1-a/wt` ができ、`git worktree list` に出て、ブランチが `consult/1-a`（happy）— 2・3 行目を決める
  - `createWorktree('1-a')` を 2 回 → 同じ物が返り、worktree は増えない（a second call）— 1・2 行目を決める
  - `removeWorktree('1-a')` → 消える（happy）— 1 行目を決める
  - 消えたあともう一度 `removeWorktree` → 「無い」を返し、エラーにしない（empty）— 1 行目を決める
  - 子が動いている worktree（実行中の記録あり）→ `removeWorktree` が拒否する（error）— 5 行目を決める
  - 変更が残っている worktree → `force` 無しで拒否（error）— 1 行目を決める
  - 変更が残っている worktree → `force` つきで消える（happy）— 1 行目を決める
  - `listWorktrees()` → 台帳ファイルが無くても id / branch / path を返す（happy）— 6 行目を決める
  - worktree が 1 つも無い → `listWorktrees()` が空の配列（empty）— 6 行目を決める
  - `{action: 'new'}`（id 無し）→ エラー（invalid input）— 1 行目を決める
  - `run/worktree.ts` が `createWorktree` / `removeWorktree` を持ち、`run/run.ts` から消え、`run/retry.ts` が無い（happy）— 7 行目を決める
  - 同じ unit を 2 回同時に作る → 片方だけが作り、他方は同じ物を受け取る（concurrency）— 4 行目を決める
  - 権限: 該当なし（理由: 親の権限で動く `/tmp` の中だけで完結する。実測は 008 の close で確認済み）

## Notes

### Findings

- なし

### Unplanned

- なし

Commit:
