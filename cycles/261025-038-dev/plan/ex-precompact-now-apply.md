# PLAN `ex-precompact-now-apply`

## Files

```text
.pi/extensions/context-precompact/
  index.ts                 update
  index.test.ts            update
  README.md                update
  settings/
    constants.ts           update
  ui/
    status.ts              update
  command/
    precompact.ts          update
    precompact.test.ts     update
  prepare/
    types.ts               update
    prepare.ts             update
    copied.ts              update
    compare.test.ts        update
  apply/
    draft.ts               update
    draft.test.ts          update
cycles/261025-038-dev/
  adr.md                   update
```

## Slices

## 1.now-apply

### Types

```ts
interface MutableState {
  running: boolean;
  prepared: ReadyCompaction | undefined;
  lastAppliedTokens: number | undefined;
  status: StatusState;
  brokenNotified: boolean;
  inFlight: Promise<PassOutcome> | undefined;
  forceApply: boolean;
  generation: number;
}

interface BeginOptions {
  readonly applyNext: boolean;
}

function beginPass(deps: Deps, ctx: PrecompactCtx, options?: BeginOptions): void;
function applyPrepared(deps: Deps, ctx: PrecompactCtx): BoundaryResult | undefined;
```

### Steps

1. `.pi/extensions/context-precompact/index.ts`:
   - `MutableState` に `forceApply: boolean` を足し、初期値と `resetForSession` で `false` にする。
   - `beginPass` を `beginPass(deps, ctx, options: BeginOptions = { applyNext: false })` にし、`options.applyNext` を `forceApply` に入れる。
   - `onCommand` の `now` は `beginPass(deps, ctx, { applyNext: true })` にする。`running` で早期に返る枝でも `forceApply = true` にしてから `noticeText('running')` を出す。
   - `onTurnEnd` の `start` は `beginPass(deps, ctx)` のままにする。
   - `applyPrepared` を切り出し、`settings.enabled` と `piEnabledOf(deps.port)` の両方を確かめ、どちらかが false なら `undefined` を返す。`prepared` と `guard` を確かめて `applyReady` する。
   - `onTurnEnd`: settings を読んだ後、`forceApply` かつ `prepared` があれば `gate` を通さず `applyPrepared` を返す。`apply` の枝も `applyPrepared` にする。
   - `onBeforeSettle`: `forceApply` でなければ今の比率判定を残し、`forceApply` なら比率を飛ばして `applyPrepared` を返す。
   - `applyReady`、`discardWithFallback`、`failPass`、`doPass` の off と `prepared === undefined` の枝、`onSessionBeforeCompact` の成功で `forceApply` を `false` にする。
2. `.pi/extensions/context-precompact/index.test.ts`:
   - (happy) `now` → flush → `LEAD_TOKENS` の `turn_end` → draft 1 件、`chatText({ kind: 'applied', ... })` が `type: 'info'` で入り、`lastAppliedTokens` が `tokensAfter` になる。
   - (happy) `now` → flush → `LEAD_TOKENS` の `agent_before_settle` → draft 1 件、同じ通知が入る。
   - (boundary) 自動の pass を deferred で走らせ、解決前に `now` → `running` の通知が入り、解決後の `LEAD_TOKENS` の `turn_end` で draft が返る。
   - (error) 1 回目は throw、2 回目は成功する `compactFn` で `now` → 失敗後、`LEAD_TOKENS` の `turn_end` で自動の準備が始まり、その次の `LEAD_TOKENS` の `turn_end` は `undefined`。
   - (error) `now` の後に settings を `enabled: false` にし、`LEAD_TOKENS` の `turn_end` → `undefined`。
   - (error) `now` の後に `fakePi(false)` の配線へ切り替え、`LEAD_TOKENS` の `turn_end` → `undefined`。
   - (error) `now` の後に `branch.slice(0, -1)` の ctx で `LEAD_TOKENS` の `turn_end` → `undefined` で、`FALLBACK_TEXT` が警告で入る。
3. `.pi/extensions/context-precompact/README.md`:
   - `now` の説明を、裏で要約し、次の `turn_end` で閾値を見ずに適用する、に直す。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/context-precompact/index.ts .pi/extensions/context-precompact/index.test.ts`; 関連が無いときは `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -n "forceApply" .pi/extensions/context-precompact/index.ts` と `grep -n "function applyPrepared" .pi/extensions/context-precompact/index.ts` と `grep -n "applyNext" .pi/extensions/context-precompact/index.ts` と `grep -n "閾値を見ずに" .pi/extensions/context-precompact/README.md` がある
- Added:
  - base plan の look: オーナーが reload し、使用量が `thresholdRatio` 未満の状態で `/precompact now` を実行し、次のターンの後に chat の `precompact: applied (X → Y)` と、コンテキストが減ったことを読む。OK を出す。

## 2.tokens-after

### Types

```ts
interface Prepared {
  readonly compaction: PreparedCompaction;
  readonly stamp: PrepareStamp;
  readonly keptTokens: number;
}

interface ReadyTokens {
  readonly before: number;
  readonly kept: number;
}

function compactionMessagesOf(entry: ProjectedEntry): PreparedMessage[];

function readyFrom(
  result: CompactionResult,
  prepared: PreparedCompaction,
  stamp: PrepareStamp,
  tokens: ReadyTokens,
): ReadyCompaction;
```

### Steps

1. `.pi/extensions/context-precompact/prepare/types.ts`:
   - `Prepared` に `readonly keptTokens: number` を足す。
2. `.pi/extensions/context-precompact/prepare/copied.ts`:
   - `getMessagesFromProjectedEntryForCompaction` を `compactionMessagesOf` として export する。中身は変えない。
3. `.pi/extensions/context-precompact/prepare/prepare.ts`:
   - `keptTokensOf(projectedEntries, firstKeptEntryId)` を足し、`firstKeptEntryId` から後ろの各 entry を `compactionMessagesOf` に通し、`estimateTokens` の合計を返す。
   - `prepare` の戻りに `keptTokens: keptTokensOf(...)` を足す。
4. `.pi/extensions/context-precompact/apply/draft.ts`:
   - `readyFrom` の第 4 引数を `ReadyTokens` にし、`tokensAfter` を `Math.max(0, tokens.kept) + summaryTokens(result.summary)` にする。
   - 要約するメッセージの `estimateTokens` の合計と `tokensBefore` の引き算を消す。
5. `.pi/extensions/context-precompact/index.ts`:
   - `readyFrom` に `{ before: tokensBefore, kept: prepared.keptTokens }` を渡す。
   - `onSessionBeforeCompact`: `before` は現在の usage に更新し、`after` は準備時の推定のままにする。理由をコメントに書く。
6. `.pi/extensions/context-precompact/apply/draft.test.ts`:
   - (happy) result と prepared と `{ before, kept }` → draft の summary、firstKept、details、usage が同じで、`tokensAfter` が `kept + summaryTokens(result.summary)`。
   - `oldTokensOf` 補助関数と「oldTokens が tokensBefore を超える → 0」のケースを消す。
7. `.pi/extensions/context-precompact/index.test.ts`:
   - (happy) `session_before_compact` の一致 → status の `before` が `THRESHOLD_TOKENS`、`after` が `ready.tokensAfter`。
   - (boundary) `now` の後に usage が `undefined` の `turn_end` → `before` が `ready.tokensBefore` で、`after` が `ready.tokensAfter`。
   - (boundary) `session_before_compact` で usage が `undefined` → `before` が `ready.result.tokensBefore`。
8. `.pi/extensions/context-precompact/README.md`:
   - `ready` の前は準備時の使用量、`applied` の前は適用時の使用量、後ろは残るメッセージと要約の推定、と書く。
9. `cycles/261025-038-dev/adr.md`:
   - `now` の決定を、裏で要約し、次の `turn_end` と `agent_before_settle` で閾値を見ずに適用する、に直す。
   - `tokensAfter` の決定を、切れ目から後ろの推定と要約の推定の和にする、に直す。
   - `session_before_compact` の `before` は現在値、`after` は準備時の推定、と書く。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/context-precompact/prepare/prepare.ts .pi/extensions/context-precompact/prepare/copied.ts .pi/extensions/context-precompact/apply/draft.ts .pi/extensions/context-precompact/apply/draft.test.ts .pi/extensions/context-precompact/index.ts .pi/extensions/context-precompact/index.test.ts`; 関連が無いときは `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -n "keptTokensOf" .pi/extensions/context-precompact/prepare/prepare.ts` と `grep -n "export function compactionMessagesOf" .pi/extensions/context-precompact/prepare/copied.ts` と `grep -n "ReadyTokens" .pi/extensions/context-precompact/apply/draft.ts` と `grep -n "prepared.keptTokens" .pi/extensions/context-precompact/index.ts` と `grep -n "切れ目から後ろの推定" cycles/261025-038-dev/adr.md` がある。`grep -rn "oldTokens" .pi/extensions/context-precompact --include=*.ts` がなし
- Added:
  - base plan の look: オーナーが `/precompact` を実行し、`status:` の後ろが 0 でなく、`ready` と `applied` の後ろの数字が同じ物差しであることを読む。OK を出す。

## 3.settle-guard

### Types

`なし`

### Steps

1. `.pi/extensions/context-precompact/index.ts`:
   - `onBeforeSettle` の冒頭で `settings.enabled` と `piEnabledOf(deps.port)` を見て、どちらかが false なら `undefined` を返す。
   - `onSessionBeforeCompact` でも同じ 2 つを見て、どちらかが false なら `undefined` を返す。
2. `.pi/extensions/context-precompact/index.test.ts`:
   - (boundary) 拡張が off で prepared があり閾値以上 → `agent_before_settle` は `undefined`。
   - (boundary) Pi が off で prepared があり閾値以上 → `agent_before_settle` は `undefined`。
   - (boundary) 拡張が off で prepared があり一致する `session_before_compact` → `undefined`。
   - (boundary) Pi が off で prepared があり一致する `session_before_compact` → `undefined`。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/context-precompact/index.ts .pi/extensions/context-precompact/index.test.ts`; 関連が無いときは `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -n "!settings.enabled || !piEnabledOf(deps.port)" .pi/extensions/context-precompact/index.ts` が 3 か所以上ある
- Added:
  - なし

## 4.session-reset

### Types

```ts
interface MutableState {
  generation: number;
}
```

### Steps

1. `.pi/extensions/context-precompact/index.ts`:
   - `MutableState` に `generation: number` を足し、`resetForSession` で 1 増やし、`lastAppliedTokens` と `forceApply` を `undefined` / `false` にする。
   - `beginPass` が開始時の `generation` を捕まえ、`doPass` に渡す。`doPass` は `summarize` の後と例外の後に、世代が変わっていれば状態を書かず `idle` を返す。
   - `flight.finally` も世代を見て、古いパスが新しい session の `running` を戻さないようにする。
2. `.pi/extensions/context-precompact/index.test.ts`:
   - (boundary) deferred の `compactFn` で pass を走らせ、解決前に `onSessionStart` → 解決後も `prepared` が無く、`ready` が通知されない。
   - (boundary) 同じ状況で `onSessionStart` の後に新しい pass を始め、古い pass を解決する → 新しい pass の `running` が `true` のまま。
   - (boundary) `now` の後に `onSessionStart` → `LEAD_TOKENS` の `turn_end` は `undefined`（force を引き継がない）。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/context-precompact/index.ts .pi/extensions/context-precompact/index.test.ts`; 関連が無いときは `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -n "generation" .pi/extensions/context-precompact/index.ts` がある
- Added:
  - なし

## 5.apply-tokens

### Types

`なし`

### Steps

1. `.pi/extensions/context-precompact/index.ts`:
   - `applyReady` が `ctx.getContextUsage()?.tokens` を読み、数値なら `tokensBefore` に使い、無ければ `ready.tokensBefore` を使う。status と通知の `before` をその値にする。
2. `.pi/extensions/context-precompact/README.md`:
   - `applied` の前の数字は適用時の使用量で、`ready` の前の数字（準備時）と違うことがある、と書く。
3. `.pi/extensions/context-precompact/index.test.ts`:
   - (happy) `LEAD_TOKENS` で準備し、`THRESHOLD_TOKENS` の `turn_end` で適用 → `chatText({ kind: 'applied', before: THRESHOLD_TOKENS, ... })` が入る。既存の `applied` の断定を現在値に合わせる。
   - (happy) `LEAD_TOKENS` で準備し、`THRESHOLD_TOKENS` の `agent_before_settle` で適用 → `before` が `THRESHOLD_TOKENS`。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/context-precompact/index.ts .pi/extensions/context-precompact/index.test.ts`; 関連が無いときは `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -n "ctx.getContextUsage()?.tokens" .pi/extensions/context-precompact/index.ts` が 3 か所以上ある
- Added:
  - なし

## 6.command-edges

### Types

`なし`

### Steps

1. `.pi/extensions/context-precompact/command/precompact.ts`:
   - `parseCommand` が `status` を受け付け、`{ kind: 'status' }` を返す。
   - `statusLines` の `lastApplied` を `formatCount` で整える。
   - `usageText` の 1 行目を `precompact usage: /precompact [status|on|off|now]` にする。
2. `.pi/extensions/context-precompact/index.ts`:
   - `onCommand` の `on` / `off` の書き込み失敗を `warning` で通知する。
3. `.pi/extensions/context-precompact/command/precompact.test.ts`:
   - (happy) `parseCommand('status')` → `{ kind: 'status' }`。
   - (happy) `lastAppliedTokens` に工場の `lastAppliedOf()`（`20_000`）を渡す → 最後から 2 番目の行が `lastApplied: ${formatCount(20_000)}`。
4. `.pi/extensions/context-precompact/index.test.ts`:
   - (error) 壊れた `settings.json` で `/precompact off` → 通知の種別が `warning`。
   - (error) 壊れた `settings.json` で `/precompact on` → 通知の種別が `warning`。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/context-precompact/command/precompact.ts .pi/extensions/context-precompact/command/precompact.test.ts .pi/extensions/context-precompact/index.ts .pi/extensions/context-precompact/index.test.ts`; 関連が無いときは `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -n "formatCount" .pi/extensions/context-precompact/command/precompact.ts` と `grep -nF "status|on|off|now" .pi/extensions/context-precompact/command/precompact.ts` がある
- Added:
  - なし

## 7.error-path

### Types

`なし`

### Steps

1. `.pi/extensions/context-precompact/index.ts`:
   - `doPass` の `try` を、設定読み込み・usage 取得・`prepare` を含む範囲に広げ、例外を `failPass` に回す。
   - `beginPass` の `notifyStatus(preparing)` を `try` で囲み、throw したら `running` と `forceApply` を戻してから rethrow する。
2. `.pi/extensions/context-precompact/index.test.ts`:
   - (error) `buildSessionProjection` が throw → status が `failed` で、`preparing` が残らない。
   - (error) `getBranch` が throw → 同じ。
   - (error) `getContextUsage` が throw → 同じ。
   - (error) `notify` が throw → `onCommand('now')` が reject し、`running` が `false` に戻る。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/context-precompact/index.ts .pi/extensions/context-precompact/index.test.ts`; 関連が無いときは `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -n "function doPass" .pi/extensions/context-precompact/index.ts` と `grep -n "catch" .pi/extensions/context-precompact/index.ts` がある
- Added:
  - なし

## 8.compare-tests

### Types

`なし`

### Steps

1. `.pi/extensions/context-precompact/prepare/compare.test.ts`:
   - (error) `turnPrefixMessages` の件数違い → `mismatch` に `turnPrefixMessages` が入る。
   - (error) `fileOps.written` だけ違い → `mismatch` に `fileOps` が入る。
   - (error) `fileOps.edited` だけ違い → `mismatch` に `fileOps` が入る。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/context-precompact/prepare/compare.ts .pi/extensions/context-precompact/prepare/compare.test.ts`; 関連が無いときは `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
- Added:
  - なし

## 9.dead-code

### Types

`なし`

### Steps

1. `.pi/extensions/context-precompact/settings/constants.ts`:
   - `MAX_IN_FLIGHT` と、そのコメントの行を消す。
2. `.pi/extensions/context-precompact/ui/status.ts`:
   - `statusText` の末尾の到達しない `return undefined` を消す。
3. `.pi/extensions/context-precompact/index.ts`:
   - `WiringState` と `getState` から `brokenNotified` を消す。
   - `onSessionBeforeCompact` の `previousSummary: event.preparation.previousSummary` を消す（spread が同じ値を持つ）。

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -rn "MAX_IN_FLIGHT" .pi/extensions/context-precompact --include=*.ts` がなし。`grep -n "readonly brokenNotified" .pi/extensions/context-precompact/index.ts` がなし。`grep -n "previousSummary: event.preparation.previousSummary" .pi/extensions/context-precompact/index.ts` がなし。`test "$(grep -c "return undefined" .pi/extensions/context-precompact/ui/status.ts)" -eq 1`
- Added:
  - なし

## Notes

### Slice 1: now-apply

- Findings: `now` は閾値を見ず、次の `turn_end` か `agent_before_settle` で適用される。`running` 中の `now` は旗を立てるだけで、走っているパスを止めない。
- Unplanned: 分割ファイルを消したので、試験を `index.test.ts` に戻した。重複した 4 つを消して行数を収めた。
- Commit: なし（オーナーの許可待ち）。
- Stopped: なし。

### Slice 2: tokens-after

- Findings: `tokensAfter` は切れ目から後ろの推定と要約の推定の和になり、0 にならない。
- Unplanned: `previousSummary` を任意にした（spread で受けるため）。
- Commit: なし（オーナーの許可待ち）。
- Stopped: なし。

### Slice 3: settle-guard

- Findings: `agent_before_settle` と `session_before_compact` は、拡張と Pi の両方が有効なときだけ適用する。
- Unplanned: なし。
- Commit: なし（オーナーの許可待ち）。
- Stopped: なし。

### Slice 4: session-reset

- Findings: 旧パスの書き込みは `generation` で止める。旧パスは新しいパスの `running` を降ろさない。`forceApply` は引き継がない。
- Unplanned: 重複した 3 つ（`turn_end` の手前、`enabled` が false、`session_start / shutdown`）を消した。
- Commit: なし（オーナーの許可待ち）。
- Stopped: なし。

### Slice 5: apply-tokens

- Findings: `applied` の前の数字は適用時の使用量。`usage` が `undefined` のときは準備時の `before` に退避する。
- Unplanned: なし。
- Commit: なし（オーナーの許可待ち）。
- Stopped: なし。

### Slice 6: command-edges

- Findings: `status` が usage に落ちていたのを直した。コメントも `status` に触れる形にした。
- Unplanned: `on` / `off` の `warning` は 1 つのループで確かめる。
- Commit: なし（オーナーの許可待ち）。
- Stopped: なし。

### Slice 7: error-path

- Findings: `notify` の throw で `running` が残るので、戻してから rethrow する。
- Unplanned: throw の 3 通りを 1 つのループで確かめる。
- Commit: なし（オーナーの許可待ち）。
- Stopped: なし。

### Slice 8: compare-tests

- Findings: `mismatch` に `turnPrefixMessages` と `fileOps` が入る。既存の試験がそのまま通った。
- Unplanned: なし。
- Commit: なし（オーナーの許可待ち）。
- Stopped: なし。

### Slice 9: dead-code

- Findings: `MAX_IN_FLIGHT`、到達しない `return undefined`、`brokenNotified`、重複した `previousSummary` を消した。`brokenNotified` はどこからも読まれていなかった。
- Unplanned: なし。
- Commit: なし（オーナーの許可待ち）。
- Stopped: なし。

### Cleanup: 重複した試験を 4 つ消した

- Findings: `index.test.ts` の `turn_end` の手前、拡張か Pi が false、`session_start / shutdown` の 3 つは、他の試験が同じ振る舞いを確かめていた。`now` の off の 2 つも 1 つにまとめた。
- Unplanned: 分割ファイルを戻したぶん、行数が 960 行を超えたので、この 4 つを消して収めた。

## Review

### Round 1

- Stale:
  - `.pi/extensions/context-precompact/command/precompact.ts:23` のコメントは `status` 引数に触れておらず、`status` が `usage` 扱いになると読めるため古くなっています。
    - fixed: コメントを「引数なしと `status` は status」に直した。
- Unlisted:
  - `.pi/extensions/context-precompact/prepare/copied.test.ts:10` の定数化は Files に名前がありません。
    - left: 前の ex-plan（display）の未コミットの試験修正で、このプランでは触っていない。
  - `.pi/extensions/context-precompact/run/summarize.test.ts:8` の時計定数の削除と `Date.now` 化は Files に名前がありません。
    - left: 前の ex-plan（display）の未コミットの試験修正で、このプランでは触っていない。
  - `.pi/extensions/context-precompact/settings/read.test.ts:1` の実設定読み試験の削除は Files に名前がありません。
    - left: 前の ex-plan（display）の未コミットの試験修正で、このプランでは触っていない。
  - `.pi/extensions/context-precompact/ui/count.test.ts:8` の `grouped` 化は Files に名前がありません。
    - left: 前の ex-plan（display）の未コミットの試験修正で、このプランでは触っていない。
  - `.pi/extensions/context-precompact/ui/status.test.ts:14` の `toContain` 化と工場化は Files に名前がありません。
    - left: 前の ex-plan（display）の未コミットの試験修正で、このプランでは触っていない。
  - `.pi/extensions/context-precompact/test/wiring.ts:1` の試験二重の新設は Files に `add` がありません。
    - fixed: `index.test.ts` に戻して、`test/wiring.ts` を削除した。
  - `cycles/261025-038-dev/close.md:77` の前サイクル完了行の追加は Files に名前がありません。
    - left: 前の ex-plan（display）の記録で、このプランでは触っていない。
- Gaps:
  - `index.ts:330` の `forceApply` 時の `turn_end` 素通り適用と `index.ts:364` の `agent_before_settle` 素通りなど、`now` 系の振る舞いを確かめる試験がありません。
    - fixed: `index.test.ts` の `precompact now apply` に 7 事例を足した。
  - `index.ts:184` の `usage` が `undefined` のときの `before` 退避を確かめる試験がありません。
    - fixed: `precompact tokens after` に 2 事例を足した。
  - `index.ts:361` の拡張 off・Pi off での `agent_before_settle` と `session_before_compact` の拒否を確かめる試験がありません。
    - fixed: `precompact guards` に 4 事例を足した。
  - `index.ts:431` の `generation` による旧 pass の無効化と `forceApply` の引継ぎ禁止を確かめる試験がありません。
    - fixed: `precompact session reset` に 3 事例を足した。
  - `index.ts:445` の壊れた `settings.json` での `off`／`on` の `warning` 通知を確かめる試験がありません。
    - fixed: `precompact command edges` の `on` と、既存の `off` の事例で確かめる。
  - `index.ts:216` の `projection`／`branch`／`usage` の throw と `index.ts:301` の `notify` throw 時の復帰を確かめる試験がありません。
    - fixed: `precompact error path` に 2 事例を足した。
- Unproven:
  - なし — 残っている試験は `kept+summary`（`.pi/extensions/context-precompact/apply/draft.test.ts:63`）や `mismatch`（`.pi/extensions/context-precompact/prepare/compare.test.ts:76`）などで振る舞いを落とすと赤くなることを確かめました。
- Noise:
  - なし — 工場化（`.pi/extensions/context-precompact/apply/draft.test.ts:7` など）は形式どおりで、型や制約が決める断定や誰も気づかない場合はありません。
- Doubts:
  - `.pi/extensions/context-precompact/test/wiring.ts:1` の置き場所は形式どおりに見えますが、Files に `add` が無いため合意の扱いが気になります。
  - 開始時の `git status` では `.pi/extensions/context-precompact/now-apply.test.ts` がありましたが、確認時には無くなっており、この判定は後者の状態に基づいています。

### Round 2

Round 1 で `fixed:` とされた 8 件のみを、現在のファイルと突き合わせて確認いたしました。判定は以下のとおりです。

- Stale:
  - 確認済みです — `.pi/extensions/context-precompact/command/precompact.ts:23` が「引数なしと `status` は status、`on` / `off` / `now`、それ以外は usage」に直っており、`status` が `usage` 扱いに読める古さは解消されています。
- Unlisted:
  - 確認済みです — `.pi/extensions/context-precompact/test/` に `wiring.ts` はなく `session-entries.ts` のみで、`test/wiring` への参照もありません（`grep` で一致なし）。`fakeCtx`（`index.test.ts:114`）や `fakePi`（`index.test.ts:184`）などが `index.test.ts` 内に戻されており、削除と戻しは実施されています。
- Gaps:
  - 確認済みです — `precompact now apply` に 7 事例（`index.test.ts:721,731,741,760,778,788,795`）があり、`LEAD_TOKENS` での素通り適用、`running` 時の旗立て、失敗後の旗消し、拡張 off・Pi off での不適用、stale 時の破棄を含んでおります。`index.ts:330-331` と `index.ts:364` の素通り経路に対応しています。
  - 確認済みです — `precompact tokens after` に 2 事例（`index.test.ts:808,819`）があり、`usage` が `undefined` のとき `turn_end` は `ready.tokensBefore`、`session_before_compact` は `ready.result.tokensBefore` を使うことを確かめています。`index.ts:184-185` と `index.ts:406-407` の退避に対応しています。
  - 確認済みです — `precompact guards` に 4 事例（`index.test.ts:837,847,854,869`）があり、`THRESHOLD_TOKENS` で拡張 off・Pi off の `agent_before_settle` と `session_before_compact` の拒否を確かめています。`index.ts:360-362` と `index.ts:388-390` の防御に対応しています。
  - 確認済みです — `precompact session reset` に 3 事例（`index.test.ts:912,929,949`）があり、旧 pass の書き込み抑止、新 pass の `running` 維持、`forceApply` の引継ぎ禁止を確かめています。`index.ts:297` の世代捕捉と `index.ts:256,275,314-316` の世代検査、`index.ts:424-432` の `generation` 加算に対応しています。
  - 対応が残っております — `precompact command edges` は `on` の壊れた `settings.json` での `warning`（`index.test.ts:961-972`）のみで、壊れた `settings.json` での `off` の `warning` 事例は見当たりませんでした。`index.ts:442-447` と `settings/read.ts:48-77` は `on`／`off` で分岐を共有しているため片方で枝は通りますが、Round 1 の指摘（`off`／`on` の両方の `warning`）と計画の手順（`off` と `on` の 2 事例）に照らしますと、`off` の壊れ事例は未確認です。
    - fixed: `index.test.ts` の `precompact command edges` を `on` / `off` のループにし、両方で `warning` を確かめるようにした。
  - 確認済みです — `precompact error path` に 2 事例（`index.test.ts:884,899`）があり、前者は `throws: projection／branch／usage` の 3 通りを回して `failed` を確かめ、後者は `notify` の throw で `reject` と `running` の復帰を確かめています。`index.ts:215-280` の `try` 拡大と `index.ts:301-306` の `notify` 保護、`index.ts:283-289` の `failPass` に対応しています。
- Unproven:
  - Round 1 で `fixed:` がないため、今回の確認対象はございません。
- Noise:
  - Round 1 で `fixed:` がないため、今回の確認対象はございません。
- Doubts:
  - テストの実行までは行っておらず、静的な対応付けのみで確認しております。実行時の成否は見ておりませんので、所見ではございません。

## Acceptance

- Ran: `pnpm test:run`（55 ファイル・821 件）、`pnpm lint`、`pnpm typecheck`、`pnpm format:check`。
- Ran: Verify の grep。`forceApply` 14、`applyNext` 4、`!settings.enabled || !piEnabledOf(deps.port)` 4、`ctx.getContextUsage()?.tokens` 3、`oldTokens` 0、`return undefined` 1、`MAX_IN_FLIGHT` 0、`readonly brokenNotified` 0、`previousSummary: event.preparation.previousSummary` 0。
- Ran: 壊して赤を確かめた 3 件。`onTurnEnd` の `forceApply` の枝を false にすると `now` の適用の試験が赤。`tokensAfter` の `tokens.kept` を 0 にすると `draft.test.ts` が赤。`doPass` の世代検査を false にすると session 切替の試験が赤。3 件とも戻し、全件緑。
- Findings:
  - Round 2 の `off` の `warning` → fixed: `on` / `off` のループにした。
  - Verify の `grep -n "閾値を見ずに" README.md` は、README が英語のため当たらない。
    - left: 英語の文書に日本語の語は置かない。内容は `below thresholdRatio too` で満たしている。
  - Verify の `grep -n "切れ目から後ろの推定" adr.md` は、ADR の文が「切れ目から後ろのメッセージの推定」で、一字一句が違う。
    - left: 内容は ADR に入っている。文言の完全一致だけが外れている。
- Doubts: 実機の look は未実施。オーナーが reload して、使用量が `thresholdRatio` 未満の状態で `/precompact now` を実行し、次のターンで `applied` と数字を見る必要がある。コミットはしていない。
