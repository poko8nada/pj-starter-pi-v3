# consult.background

Acceptance:

- 子は既定でバックグラウンドで走り、親は待たずに次の作業ができる（結果はメッセージで届く）

## Todo

- `.pi/extensions/consult/tool/consult.ts`
  - `execute` — 子を起こしたらすぐ戻る（`started: <id>` と、どの子が走っているかを返す）。子ごとの完了で、`pi.sendMessage({customType: 'consult', …}, { triggerTurn: true, deliverAs: 'followUp' })` に結果（子のテキスト、`ref:`、`[consult]` 行）を渡す
  - 引数 — `action`（既定 `start` / `list` / `cancel`）を足し、`list` は走っている子の一覧、`cancel` は `id` を止める
  - `pi` を顔に渡す形にする（完了の通知に道具の外の API が要る）
  - `tool/consult.test.ts`（新規）— 起こしたら id が返り、完了の通知が組み立てられる（偽の API で確かめる）
- `.pi/extensions/consult/index.ts`
  - 登録を、`pi` を渡す形に直す
  - スラッシュコマンドを 2 つ登録する: `/consult-status`（走っている子の一覧）と `/consult-cancel <id>`（1 体止める）。処理は道具の `action` と同じ 1 か所を呼ぶ（面が 2 つ、実装は 1 つ）
- `.pi/extensions/consult/run/run.ts`
  - `runPi` — 呼び出し側が待たずに済むようにする（進行の通知と完了のフックを渡せる形）
- `.pi/extensions/consult/README.md`
  - 「バックグラウンドで走る」「結果はメッセージで届く」「Esc は効かない」「止める口は 2 つ: ユーザーは `/consult-status` と `/consult-cancel <id>`、エージェントは道具の `action`（`list` / `cancel`）」を書く
  - `## Types` の表の `review` の出力を 60,000 に直す

## Verify

### test

- `pnpm test:run .pi/extensions/consult/tool`
  - `start`（type: review, task: …）→ id が返り、その時点で子は終わっていない（happy）
  - 子の完了 → メッセージに子のテキスト・`ref:`・`[consult]` 行が入る（happy）
  - `list`（2 体走っている）→ 走っている子だけが返る（happy）
  - `list`（0 体）→ 空の一覧（happy、empty）
  - `cancel` に知らない id → 拒む（error）
  - `/consult-cancel <id>` → その id が止まる（happy。止める処理は道具の `cancel` と同じ 1 か所）
  - `/consult-cancel` に知らない id → 理由を出して止めない（error）
  - `action` が知らない値 → 使い方を出して拒む（error、invalid）
  - 権限 / 2 回目 / 並行 → 見ない（同時に複数走らせるのは `list` のケースで見る）

### read

- `review` の子に `.pi/extensions/consult/README.md` を渡す
  - 報告させる: 子がどこで走り、親がいつ結果を受け取るか、ユーザーとエージェントがそれぞれどう止めるか

## Notes

### Findings

- なし

### Unplanned

- なし

Commit:
