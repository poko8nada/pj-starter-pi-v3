# sound-notify.commit

Acceptance:

- 鳴るのは許可・質問・ターン終了の 3 つでコミットの音が無い、が解ける: `bash` の `git commit` で `Pop` が鳴る
- テストが無く、鳴らす所が差し替えられない、が解ける: 差し替えられる形で、テストでは鳴らない
- 音の一覧が 3 つのまま、が解ける: `config.json` の `sounds` で 4 つ目（無ければ `Pop`）として差し替えられる
- `sound-notify/README.md` が追随している

Owner: in the loop

止まり方: コミットを 1 回作って、`Pop` が鳴るのを owner が聞く。`config.json` の音を変えて、変わることも聞く。何をもって終わりか: owner が「残す」と言う（直すなら、その場で直して、また聞く）

## Todo

- `.pi/extensions/sound-notify/index.ts`
  - `NotifyKind` — `commit` を足す
  - `DEFAULT_CONFIG.sounds` — `commit: 'Pop'` を足す
  - `parseConfig` — `commit` の読み取りを今の形（`readString(sounds.commit, …)`）で足す
  - `pi.on('tool_execution_end', …)` — `toolName === 'bash'` かつ結果にコミットの形（`[main <hash>] …`）が出ていれば `dispatch(pi, ctx, 'commit', config)` を呼ぶ
  - 音を鳴らす所（`afplay` の起動）— テストから差し替えられる形にする（`playSound` を分けて引数で受ける、またはモジュールの関数にする）
- `.pi/extensions/sound-notify/index.test.ts`（add）
  - 差し替えた鳴らす関数で、鳴る・鳴らないを確かめる
- `.pi/extensions/sound-notify/README.md`
  - 音の一覧に `commit` を足し、コミットで鳴ることと `config.json` の書き方を書く

## Verify

### test

- `pnpm test sound-notify`（5 ケース）
  - `bash` の結果に `[main abc1234] …` → `commit` が 1 回鳴る（happy）
  - `bash` の結果が普通の出力 → 鳴らない（error 相当）
  - `toolName` が `bash` 以外 → 鳴らない（error 相当）
  - `isError` が真 → 鳴らない（error）
  - `config.json` の `sounds.commit` を別名にする → その名前で鳴る（happy）

### look

- owner が実際に聞く（1・4 行）
  - コミットを 1 回作って、`Pop` が鳴ること
  - `config.json` の `sounds.commit` を変えて、その音に変わること

### read

- `review` の子に `.pi/extensions/sound-notify/README.md` を渡す
- 合格: 4 つ目の音（`commit` / `Pop`）と `config.json` の書き方が書いてある（4 行）

## Notes

### Findings

- なし
- （owner の `look`）: 2026-09-28、コミット `0a4348f` で `Pop` が鳴るのを owner が確認した（鳴るのは `tool_execution_end` の `bash` 出力が `[main abc1234] …` の形のとき）。owner の判断は「残す」

### Unplanned

- テストの差し替え口として `handleToolExecutionEnd` / `isCommitResult` / `PiPort` / `CtxPort` / `parseConfig` / `setPlayer` を export した（Todo は「差し替えられる形にする」までだった）

Commit: cea0a3b（子の実装）
