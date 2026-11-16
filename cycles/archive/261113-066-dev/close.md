# Close 066

## Collected

### 01 fallback-notify (ADR 01, 02)

1. 566 / Work Review Round 2 / `consult.ts:246` の `maxAttempts` は初期値 0 のまま残る。`retry-start` が型不正で捨てられ、続く `retry-end` だけが通ると `retry N/0` を出す。Round 1 は「start なしは起きない」として削除を許したが、型不正の start は新しいケースとして作れるため、`/0` を許すかは owner の判断。

### 02 consult-status (ADR 03)

2. 272 / Work Review Round 1 / `.pi/extensions/consult/index.test.ts:350` はコマンドの説明文を literal で固定している。ADR が決めた値なので指摘していないが、文言を変える予定があるなら、テストを落とすか、説明文を 1 か所から取る形にするかを owner に決めてほしい。
3. 291 / Work Review Round 2 / `.pi/extensions/consult/tool/consult.test.ts:708-718` の「終わった記録だけ」は、Round 1 が挙げた「開始行＋終わりの行の 2 行の組」ではなく、1 行に `ended` を足した形のまま。順序は `listText` 側の新しいテストが担保するので finding にはしていないが、コマンド経由で 2 行の組を通る経路は、誰も確かめていない。

## Triage

- 3: _ex-change_ (ADR 03, `Unit.subagent-consult`): done 0816168
  - Fact: `consult.test.ts` の「終わった記録だけ」は、1 行に `ended` を足した形でテストを作っている。同じ subagent の開始行と終わりの行の組は、`subagents.test.ts` の `listText` のテストだけが持つ。コマンドの `status` が `readRuns` の記録をそのまま `listText` に渡す経路は、2 行の組を通っていない。
  - Why: `latest` の後に絞る順序は `listText` 側で固定された。しかし `status` の配線が記録をそのまま渡すことは、2 行の組では確かめられていない。抜けは 1 つのテストで埋まり、直す範囲は `consult.test.ts` の 1 か所である。
  - Then: `consult.test.ts` に、同じ subagent の開始行と `ended` の行を `place` に置き、`status` が `no subagents running in this session` を出すケースを足す。
- 1: _ex-change_ (ADR 02, `Unit.subagent-consult`): done 2d89f2d
  - Fact: `modelNotifier` は `retry-start` の `maxAttempts` を覚え、`retry-end` の行に使う。`retry-start` が型不正で捨てられると `maxAttempts` は 0 のままになり、続く `retry-end` は `retry 2/0` を出す。実運用では start が先に来るが、型不正の start はテストで作れる。
  - Why: 通知はモデルの調子を見るための診断である。分母が 0 の行は誤解を招く。`modelNotifier` の 1 か所で、start を見ていない end は出さないようにできる。直す範囲は 1 つの関数と 1 つのテストである。
  - Then: `modelNotifier` で、`retry-end` のとき `maxAttempts` が 0 なら通知しない。`consult.test.ts` に、型不正の `retry-start` の後に `retry-end` が来て何も出ないケースを足す。
- 2: dropped (ADR 03, `Unit.subagent-consult`)
  - Fact: `index.test.ts:350` が `/consult-status` の説明文を literal で固定している。値は ADR が決めた `List the running consult subagents of this session` で、実装の `index.ts` と同じである。
  - Why: 決定値の確認であり、不整合ではない。文言を変える予定があるときだけ、テストも直せばよい。いま直す必要はない。
  - Then: なし

## Verified

### subagent-consult

- Plans:
  - `fallback-notify`
  - `consult-status`
- Result: OK
- Change: OK
- Fixed: なし
