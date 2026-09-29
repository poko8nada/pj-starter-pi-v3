# consult.children

Acceptance:

- `consult_children{action: list|cancel, id?}` が、子ごとに `id / role / worktree / 経過 / ターン / 費用` を返す
- reload をまたいでも出る（記録を読む）。動いている子の行には pid がある
- 実行の記録は `<root>/<unit-id>/log.jsonl` に移る（`stopped.json` を消す）
- `consult_resume` と、`run/stopped.ts` / `run/resume.ts` / `tool/resume.ts` が消える（続きは `consult_run{continue: true}`、一覧と削除は `consult_worktree` が担う）

Owner: at the end

## Todo

- `.pi/extensions/consult/tool/children.ts`（新規）
  - `consult_children` の `list` / `cancel`（既定 `list`）と、戻り値の組み立て
- `.pi/extensions/consult/run/log.ts`（新規）
  - `appendRun(run)` — `<root>/<unit-id>/log.jsonl` に 1 行足す（`child id / role / pid / 開始 / 終了 / state / reason / files / turns / spend`）
  - `readRuns()` — 全部を読み、走っている物（pid が生きていて終了の行が無い物）を含めて返す
  - `pidAlive(pid)` — 生存確認
- `.pi/extensions/consult/run/stopped.ts`（削除）、`.pi/extensions/consult/run/resume.ts`（削除）、`.pi/extensions/consult/tool/resume.ts`（削除）
- `.pi/extensions/consult/tool/consult.ts`
  - `action: list` / `cancel` と `USAGE` を消す（`consult_children` へ移る）
- `.pi/extensions/consult/index.ts`
  - `consult_children` を登録し、`consult_resume` の登録を消す
- テスト: `.pi/extensions/consult/run/log.test.ts`（新規）、`.pi/extensions/consult/tool/children.test.ts`（新規）、`.pi/extensions/consult/run/resume.test.ts`（削除）、`.pi/extensions/consult/tool/resume.test.ts`（削除）、`.pi/extensions/consult/tool/consult.test.ts`（`list` / `cancel` を外す）

## Verify

### test

- `pnpm test:run consult/run/log consult/tool/children consult/tool/consult`（10 ケース）
  - 1 行足して読む → その 1 行がそのまま返る（happy）— 3 行目を決める
  - 走っている子（pid が生きていて終了行が無い）→ 一覧に含まれる（happy）— 2 行目を決める
  - 終わった子 → 一覧に含まれ、state と reason を持つ（happy）— 2 行目を決める
  - 壊れた行（JSON でない）→ その行だけ飛ばし、他は読める（error）— 3 行目を決める
  - 記録が無い unit → 空の配列（empty）— 2 行目を決める
  - 同じ run を 2 回足す → 2 行になる（a second call）— 3 行目を決める
  - `{action: 'list'}` → 走っている子の行（happy）— 1・2 行目を決める
  - `{action: 'cancel', id}` → 止めた結果が返る（happy）— 1 行目を決める
  - `{action: 'cancel'}`（id 無し）→ エラー（error）— 1 行目を決める
  - `consult_resume` と 3 ファイルが消えている（happy）— 4 行目を決める
  - 権限: 該当なし（理由: `/tmp` の中の自分の記録だけ）
  - 同時実行: 該当なし（理由: 追記は 1 行単位で、unit 内は直列）

## Notes

### Findings

- なし

### Unplanned

- なし

Commit:
