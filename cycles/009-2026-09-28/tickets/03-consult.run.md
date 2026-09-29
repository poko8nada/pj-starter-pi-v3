# consult.run

Acceptance:

- `consult_run{role, task, worktree?, continue?}` が子を 1 体起こし、`started: <id>` をすぐ返す（親は待たない）
- **`input` を引数に持たない**（読ませたいファイルは `task` にパスを書く）
- 1 呼び出しで走るのは必ず 1 体。複数欲しいときは道具を複数回呼ぶ
- `readOnly: false` のロールで `worktree` を省くとエラー。存在しない worktree の id もエラー（暗黙に作らない）
- 子のセッションは worktree ごとに 1 つ。`continue` を省くとロールの `continueByDefault` が使われ、`true` なら同じ会話の続きから走る

Owner: at the end

## Todo

- `.pi/extensions/consult/tool/run.ts`（新規）
  - `consult_run` の引数検証（`role` / `task` 必須、`worktree` はロール次第、`continue` は任意）
  - 1 体を起こす道だけを持ち、`consult_new` の `action: start` の分岐は持たない
- `.pi/extensions/consult/run/child.ts`
  - 子を 1 体だけ起こす形にする（今は入力の配列が spawn の単位になっている）
  - 行き先の worktree とセッションのパスを `RunOptions` に足す
- `.pi/extensions/consult/child/spec.ts`
  - `--no-session` をやめ、`--session <root>/<unit-id>/session` を組む
  - `continue` が `true` のときは `--continue` を足す
- `.pi/extensions/consult/tool/consult.ts`
  - `consult_new` の `action: start` の道を消す（`consult_run` に移る）
  - `action: list` / `cancel` は `consult_children` に移るまで残す
- `.pi/extensions/consult/index.ts`
  - `consult_run` を登録する
- テスト: `.pi/extensions/consult/tool/run.test.ts`（新規）、`.pi/extensions/consult/run/child.test.ts`、`.pi/extensions/consult/child/spec.test.ts`（`--no-session` を `--session` に）、`.pi/extensions/consult/tool/consult.test.ts`（`action: start` の道を外す）

## Verify

### test

- `pnpm test:run consult/tool/run consult/run/child consult/child/spec consult/tool/consult`（12 ケース）
  - `{role: 'review', task: 'x'}` → `started: <id>` がすぐ返る（happy）— 1 行目を決める
  - `{role: 'code', task: 'x'}`（worktree 無し）→ エラー（error）— 4 行目を決める
  - `{role: 'code', task: 'x', worktree: '1-a'}`（無い id）→ エラー（error）— 4 行目を決める
  - `{role: 'review', task: 'x', worktree: '1-a'}` → その worktree で走る（happy）— 1 行目を決める
  - `input` を渡す → 引数として受け付けない（error）— 2 行目を決める
  - `{role: 'trial', task: 'x', worktree: '1-a', continue: true}` → `--continue` が付く（happy）— 5 行目を決める
  - `task` が空 → エラー（empty）— 1 行目を決める
  - `role` が 4 つ以外 → エラー（invalid input）— 1 行目を決める
  - `consult_run` を 2 回続けて呼ぶ → 子が 2 体になる（a second call）— 3 行目を決める
  - worktree を指して 1 回走らせる → 子は 1 体だけ（happy）— 3 行目を決める
  - セッションのパス → `<root>/<unit-id>/session` になる（happy）— 5 行目を決める
  - `continue: true` で 2 回目 → 同じセッションを指す（a second call）— 5 行目を決める
  - 権限: 該当なし（理由: 親の worktree を指すだけで、権限の分岐を持たない）
  - 同時実行: 該当なし（理由: unit 内は直列。2 体を同時に同じ worktree へ送る道は `consult_worktree` が拒む）

## Notes

### Findings

- なし

### Unplanned

- なし

Commit:
