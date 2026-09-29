# consult.reload

Acceptance:

- 完了通知はセッションごとの delivery を通り、reload で差し替わる。古い delivery は no-op になり、記録に書く
- 新しいインスタンスを作ってから（reload 相当）古い完了ハンドラを呼んでも**落ちない**
- `session_shutdown` で資源（タイマー・子の登録）を手放す。子は detach されていて殺さない
- 新しいインスタンスは起動時に `log.jsonl` を読み、前のセッションで走っていた子を `consult_children` に出す
- 子のプロセスが pi のプロセスに従属しない（pi が落ちても子の作業は worktree に残る）

Owner: in the loop

止まり方: この step の終わりで止まる。worktree を 1 つ作り、子を 1 体走らせ、`Verify` の代わりに `consult_commit` を呼び、親のブランチへ merge する所までを 1 回で実演する。何をもって終わりか: 実演を見て owner が 残す / 直す / 捨てる を決める

## Todo

- `.pi/extensions/consult/run/delivery.ts`（新規）
  - セッションごとの delivery を持つ。`send(text)` は今のセッションの `pi` にだけ渡す
  - `detach()` — `session_shutdown` で古い delivery を no-op にし、以後は `log.jsonl` に書く
  - 新しいインスタンスは `attach(pi)` で差し替える（古い物は呼ばれない）
- `.pi/extensions/consult/run/child.ts`
  - 子を `detached: true` で起こす（pi が落ちても子は走り続ける）
  - 完了ハンドラが `delivery` を通す（`pi` を直接掴まない）
- `.pi/extensions/consult/tool/sound.ts`
  - 走っている子の数え方を、新しい記録（`run/log.ts`）から取る
  - `session_shutdown` でタイマーを止める道はそのまま
- `.pi/extensions/consult/index.ts`
  - `delivery` を組み、`session_shutdown` で `detach()` を呼ぶ
  - 起動時に `readRuns()` を読み、前のセッションの子を一覧に出す
- テスト: `.pi/extensions/consult/run/delivery.test.ts`（新規）、`.pi/extensions/consult/tool/sound.test.ts`（数え方の書き換え）

## Verify

### test

- `pnpm test:run consult/run/delivery consult/tool/sound`（6 ケース）
  - `attach(pi)` して `send('x')` → `pi.sendMessage` が 1 回呼ばれる（happy）— 1 行目を決める
  - `detach()` のあと `send('x')` → `pi.sendMessage` が呼ばれず、記録に 1 行足される（happy）— 1 行目を決める
  - `detach()` のあとに新しいインスタンスを `attach` → 古い方の `send` で落ちない（error）— 2 行目を決める
  - `detach()` → タイマーが止まる（happy）— 3 行目を決める
  - 走っている子の記録がある状態で起動 → `consult_children` の一覧に出る（happy）— 4 行目を決める
  - 子の起動時の引数 → `detached: true`（happy）— 5 行目を決める
  - 権限: 該当なし（理由: 親のプロセス内の配線と、`/tmp` の記録だけ）
  - 同時実行: 該当なし（理由: delivery は 1 セッションに 1 つで、unit 内は直列）

## Notes

### Findings

- 受け入れ条件の「完了ハンドラが delivery を通す」は、実装では `tool/consult.ts` の `deliver` / `runInBackground` にあった（チケットは `run/child.ts` を指していた）
  - なぜ外か: 完了のハンドラ（`pi.sendMessage`）を握っているのは runtime で、`child.ts` は子プロセスを起こすだけ
  - 実装: `deliver(state, child, outcome, record)` が `state.delivery.send(...)` を通す。delivery が無い場合（テストの runtime）は今まで通り直接渡す
- `detached: true` を入れるのに、`stdio` の型を文字列の組で持つ必要があった（`PiSpawnOptions`）
  - なぜ: `SpawnOptions` を通すと `child.stdout` が `Readable | null` になり、既存の 3 か所（`child.stdout.on` 等）が型で落ちる
  - 観測: `pnpm typecheck:staged` が `TS18047: 'child.stdout' is possibly 'null'` を 3 つ出した
- delivery の root は**必要になったとき**に引く（`() => rootFor(process.cwd())`）
  - なぜ: `rootFor` は置き場のディレクトリを作る。拡張を読み込んだだけで `/tmp/pi-consult/...` を作らないため
- 人が使う口（`/consult-status` / `/consult-cancel` / `/consult-sound`）は残した
  - なぜ: 設計の 4 道具はエージェント向け。コマンドは人が見る口で、`ConsultRuntime.commands` が既に担っている（チケットは触るなと言っていない）
- 起動時の読み込みは拡張の読み込み時ではなく `session_start` で行う
  - なぜ: 置き場（root）はセッションの cwd から決まる。拡張の読み込み時には cwd を渡す口が無い

### Unplanned

- `.pi/extensions/consult/index.ts`: `registerCommands` と `announceRunningChildren` を切り出し、6 つの import を足した
  - なぜ: `max-lines-per-function`（80 行）に当たったため（読み込み時の配線が増えた）
- `.pi/extensions/consult/run/run.ts`: `PiSpawnOptions` を足した
  - なぜ: 上記のとおり、stdio の型を保つため
- `.pi/extensions/consult/run/log.ts`: `RunRecord.notice` を足した（届け先が無かった完了の知らせ）
  - なぜ: `log.jsonl` に回した知らせを、次のセッションが読めるように
- `.pi/extensions/consult/tool/sound.ts`: `runningChildren(records, alive)` を足した。`sound.test.ts` にその検査（4 ケース）
  - なぜ: 走っている子の判定を、親の記憶ではなく記録（と pid）から取るため
- `.pi/extensions/consult/run/run.test.ts`: `spawnOptions` の検査（`detached: true`）を足した
  - なぜ: 子を起こさずに確かめられる形が要った

Commit: d0a9927
