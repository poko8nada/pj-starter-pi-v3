# PLAN `ex-precompact-display`

## Files

```text
.pi/extensions/context-precompact/
  index.ts                          update
  index.test.ts                     update
  README.md                         update
  test/
    session-entries.ts              add
  ui/
    status.ts                       update
    status.test.ts                  update
    count.ts
    count.test.ts
  command/
    precompact.ts                   update
    precompact.test.ts              update
  run/
    ports.ts                        update
    ports.test.ts                   update
    summarize.ts
    summarize.test.ts               update
  apply/
    draft.ts                        update
    draft.test.ts                   update
  prepare/
    prepare.ts
    prepare.test.ts                 update
    copied.ts
    copied.test.ts                  update
    compare.ts
    compare.test.ts
    guard.ts
    guard.test.ts
  gate/
    gate.ts
    gate.test.ts                    update
  settings/
    constants.ts                    update
    read.ts
    read.test.ts
    schema.ts
    schema.test.ts
cycles/261025-038-dev/
  adr.md                            update
  close.md                          update
```

## Slices

## 1.now-response

### Types

```ts
type StatusState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'preparing' }
  | { readonly kind: 'ready'; readonly before: number; readonly after: number }
  | { readonly kind: 'failed'; readonly reason: string }
  | { readonly kind: 'applied'; readonly before: number; readonly after: number }
  | { readonly kind: 'discarded' };

type NotifiableStatus = Extract<StatusState, { kind: 'preparing' | 'ready' | 'applied' }>;

type NoticeKind = 'on' | 'off' | 'nothing' | 'running';

function chatText(status: NotifiableStatus): string;
function noticeText(notice: NoticeKind): string;
function failureText(reason: string): string;
function brokenText(reason: string): string;
const FALLBACK_TEXT: string;
function statusLine(state: StatusState): string;

interface StatusInput {
  readonly settings: Settings;
  readonly prepared: boolean;
  readonly running: boolean;
  readonly lastAppliedTokens: number | undefined;
  readonly status: StatusState;
}

// run/ports.ts
const NO_MODEL_REASON: string;

// apply/draft.ts
function summaryTokens(summary: string): number;

// test/session-entries.ts
interface CompactionOptions {
  readonly fromHook?: boolean;
  readonly firstKeptEntryId?: string;
  readonly details?: unknown;
}

interface SessionFixture {
  readonly user: (text: string) => SessionEntry;
  readonly assistant: (text: string) => SessionEntry;
  readonly toolCall: (name: string, path: string) => SessionEntry;
  readonly compaction: (summary: string, options?: CompactionOptions) => SessionEntry;
  readonly project: (entries: readonly SessionEntry[]) => ProjectedEntry[];
  readonly turns: (count: number) => SessionEntry[];
}

function createSessionFixture(): SessionFixture;
function projectEntries(entries: readonly SessionEntry[]): ProjectedEntry[];
```

### Steps

1. `.pi/extensions/context-precompact/ui/status.ts`:
   - `StatusState`、`failed` の `reason`、`chatText`、`statusText`、`statusLine` は既にある。変えない。
   - `noticeText` を足す。`on` は `precompact: on`、`off` は `precompact: off`、`nothing` は `precompact: nothing to prepare`、`running` は `precompact: running` を返す。
   - `failureText(reason)` を足し、`precompact: failed (<reason>); default compaction will run` を返す。
   - `brokenText(reason)` を足し、`context-precompact: settings broken (<reason>)` を返す。
   - `FALLBACK_TEXT` を足し、`precompact: failed; default compaction will run` を持つ。
   - `notifyText` と `notifyType` は既に無い。変えない。
2. `.pi/extensions/context-precompact/index.ts`:
   - `notifyStatus` と、`beginPass` の `preparing`、`applyReady` の `applied`、`onSessionBeforeCompact` の `applied` は既にある。変えない。
   - `readSettingsOrNotify` の文面を `brokenText` にする。
   - `discardWithFallback` の文面を `FALLBACK_TEXT` にし、理由の引数を落とす。
   - `doPass` の off 枝で `ctx.ui.notify(noticeText('off'), 'info')` を出す。
   - `doPass` の `prepared === undefined` の枝で `ctx.ui.notify(noticeText('nothing'), 'info')` を出す。
   - `failPass` の通知を `failureText(reason)` にする。`status` の `failed` は既にある。
   - `onCommand` の `on` / `off` の文面を `noticeText` にし、`now` の実行中は `ctx.ui.notify(noticeText('running'), 'info')` を出す。
   - `onCommand` の `status` で `status: deps.state.status` を渡す。既にある。
   - `console` は使わない。
3. `.pi/extensions/context-precompact/command/precompact.ts`:
   - `StatusInput` の `status` と `statusLines` の `status:` 行は既にある。変えない。
4. `.pi/extensions/context-precompact/run/ports.ts`:
   - `NO_MODEL_REASON` を export し、`throw new Error(NO_MODEL_REASON)` にする。
5. `.pi/extensions/context-precompact/apply/draft.ts`:
   - `summaryTokens(summary)` を export し、`tokensAfter` の計算で使う。
6. `.pi/extensions/context-precompact/test/session-entries.ts`:
   - `createSessionFixture()` を足す。`user` / `assistant` / `toolCall` / `compaction` / `project` / `turns` を返し、id は呼び出しごとに連番、`turns(n)` は 1 辺 4000 字の対を n 組返す。
   - `projectEntries` を export し、`project` からも使う。
   - 実行時に外部へ出ない。ファイルを直接動かしても何も走らない。
7. `.pi/extensions/context-precompact/ui/status.test.ts`:
   - (happy) `chatText` の `ready` に前後の数 → `formatCount` の 2 値が文面に並ぶ。
   - (happy) `chatText` の `applied` に前後の数 → `formatCount` の 2 値が文面に並ぶ。
   - (error) `statusText` の `failed` に理由 → 文面は `undefined` でなく、理由は入らない。
   - (empty) `statusText` の `idle` / `discarded` → `undefined`。
   - (happy) `statusLine` の `ready` / `applied` に前後の数 → `formatCount` の 2 値が入る。
   - (error) `statusLine` の `failed` に理由 → 理由が入る。
   - (error) `failureText` に理由 → 理由が入る。
   - (error) `brokenText` に理由 → 理由が入る。
8. `.pi/extensions/context-precompact/command/precompact.test.ts`:
   - (happy) `statusLines` の `idle` / `preparing` / `ready` / `applied` / `discarded` → 最後の行が `status: ${statusLine(state)}`。
   - (error) `failed` → 最後の行に `statusLine` の理由が入る。
9. `.pi/extensions/context-precompact/index.test.ts`:
   - 工場 `createSessionFixture` を使い、`userEntry` / `assistantEntry` / `compactionEntry` / `projectedOf` を消す。
   - `fakeCtx` の `usage` は工場の `LEAD_TOKENS` / `THRESHOLD_TOKENS` から作る。`THRESHOLD_TOKENS` は `DEFAULT_THRESHOLD_RATIO` から、`LEAD_TOKENS` は `LEAD_RATIO` から導く。
   - (happy) `now` を呼ぶ → `chatText({ kind: 'preparing' })` が `type: 'info'` で入る。
   - (happy) deferred の `compactFn` を `now` の後に解決する → `chatText({ kind: 'ready', ... })` が `type: 'info'` で入り、`now` は解決前に返る。
   - (happy) 次の `turn_end` で適用する → `chatText({ kind: 'applied', ... })` が `type: 'info'` で入る。
   - (happy) `agent_before_settle` で適用する → `chatText({ kind: 'applied', ... })` が入り、`lastAppliedTokens` と footer の `applied` が進む。
   - (happy) `session_before_compact` の成功 → status が `applied` で、`lastAppliedTokens` と footer の `applied` が進み、`chatText({ kind: 'applied', ... })` が入る。
   - (boundary) pass 実行中に `now` を呼ぶ → `noticeText('running')` が `type: 'info'` で入り、`compactFn` は 1 回だけ呼ばれる。
   - (empty) `prepare` が `undefined` になる枝で `now` を呼ぶ → `chatText({ kind: 'preparing' })` と `noticeText('nothing')` が `type: 'info'` で入る。
   - (boundary) 拡張か Pi が off の状態で `now` を呼ぶ → `noticeText('off')` が `type: 'info'` で入り、pass は走らない。
   - (error) 要約が throw する → `chatText({ kind: 'preparing' })` と `failureText(reason)` が入り、後の種別が `warning`、status が `failed`。
   - (error) モデルが無い → `failureText(NO_MODEL_REASON)` が `warning` で入る。
   - (error) 設定が壊れている → `brokenText(reason)` が 1 度だけ `warning` で入る。理由は `readSettings` の戻りから取る。
   - (error) 照合の不一致（event の `firstKeptEntryId` が違う）→ draft 無しで `FALLBACK_TEXT` が `warning` で入る。
   - (boundary) stale の 4 分岐 → draft 無しで `FALLBACK_TEXT` が `warning` で入る。
   - (happy) `/precompact` → `status: ${statusLine({ kind: 'idle' })}` を含む。(error) 失敗の後の `/precompact` → `status: ${statusLine({ kind: 'failed', reason })}` を含む。
   - Pi のイベント名は外部 API の名前なので、そのまま書く。
10. `.pi/extensions/context-precompact/README.md`:

- `now` の説明を、即時の `preparing…`、背景の `ready` / `applied`、`precompact: running` / `precompact: off` / `precompact: nothing to prepare`、失敗の warning に直す。
- `info` は最新の 1 行に上書きされ、`warning` / `error` は残ると書く。`console` は使わないと書く。
- `/precompact` が `status` と失敗理由も出すと書く。

11. `cycles/261025-038-dev/adr.md`:
    - 表示の決定を、`now` と自動の `preparing` / `ready` / `applied` / `off` / `nothing` / `running` を `ctx.ui.notify` で出し、失敗は warning、footer も残す、に直す。
    - `info` は最新の 1 行、`warning` / `error` は残ると書く。`chat` が本体で、`/precompact` の `status` は保険と書く。
    - `session_before_compact` の成功は `applied` にする。ex-now-command の「通知なし」「applied は footer だけ」を撤回する。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/context-precompact/index.ts .pi/extensions/context-precompact/index.test.ts .pi/extensions/context-precompact/ui/status.ts .pi/extensions/context-precompact/ui/status.test.ts .pi/extensions/context-precompact/command/precompact.ts .pi/extensions/context-precompact/command/precompact.test.ts .pi/extensions/context-precompact/run/ports.ts .pi/extensions/context-precompact/apply/draft.ts`; 関連が無いときは `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -nE "'precompact: |context-precompact: settings broken" .pi/extensions/context-precompact/index.ts` がなし
  - `grep -n "function noticeText" .pi/extensions/context-precompact/ui/status.ts` と `grep -n "function failureText" .pi/extensions/context-precompact/ui/status.ts` と `grep -n "FALLBACK_TEXT" .pi/extensions/context-precompact/ui/status.ts` と `grep -n "function statusLine" .pi/extensions/context-precompact/ui/status.ts` がある
  - `grep -n "FALLBACK_TEXT" .pi/extensions/context-precompact/index.ts` と `grep -n "noticeText" .pi/extensions/context-precompact/index.ts` と `grep -n "notifyStatus" .pi/extensions/context-precompact/index.ts` がある
  - `grep -n "NO_MODEL_REASON" .pi/extensions/context-precompact/run/ports.ts` と `grep -n "NO_MODEL_REASON" .pi/extensions/context-precompact/index.test.ts` がそれぞれある
  - `grep -n "export function summaryTokens" .pi/extensions/context-precompact/apply/draft.ts` と `grep -n "summaryTokens(result.summary)" .pi/extensions/context-precompact/apply/draft.ts` がそれぞれある
  - `grep -rn "notifyText" .pi/extensions/context-precompact --include=*.ts` がなし
  - `grep -rn "console\." .pi/extensions/context-precompact --include=*.ts` がなし
  - `grep -n "precompact: running" .pi/extensions/context-precompact/README.md` と `grep -n "precompact: off" .pi/extensions/context-precompact/README.md` と `grep -n "precompact: nothing to prepare" .pi/extensions/context-precompact/README.md` と `grep -n "status:" .pi/extensions/context-precompact/README.md` と `grep -n "latest" .pi/extensions/context-precompact/README.md` がある
  - `grep -n "chat が本体" cycles/261025-038-dev/adr.md` と `grep -n "status は保険" cycles/261025-038-dev/adr.md` と `grep -n "info は最新" cycles/261025-038-dev/adr.md` がある
- Added:
  - base plan の look: オーナーが `/precompact now` と `/precompact` を実行し、chat の開始・結果の行と、`status` の行を読む。`ready` / `applied` は deferred の試験でも確認する。OK を出す。

## 2.test-fixtures

### Types

`なし`

### Steps

1. `.pi/extensions/context-precompact/prepare/prepare.test.ts`:
   - `session-entries` の工場に置き換え、`userEntry` / `assistantEntry` / `hookCompaction` / `plainCompaction` / `project` / `threeTurns` を消す。
   - (happy) 前回の `fromHook` の details → 工場で渡した読み取りと変更の path が `fileOps` に入る。
   - (happy) `fromHook` が無い前回 → 3 つの集合が空。
   - (error) details が配列でない → 投げずに空。
   - (boundary) `enabled` が false か `piEnabled` が false → `undefined`。
2. `.pi/extensions/context-precompact/prepare/copied.test.ts`:
   - 同じく工場に置き換え、`toolCallEntry` / `compactionEntry` / `project` / `threeTurns` を消す。
   - (happy) 3 ターンと小さい keep → `firstKeptEntryId` が工場の最後から 2 番目で、要約対象が空でない。
   - (empty) 最後が compaction、またはメッセージが空 → `undefined`。
   - (boundary) 1 つの user 区間が keep を超える → split で `turnPrefixMessages` が空でない。
   - (happy) 前回の compaction → `previousSummary` がその summary。
   - (happy) read / edit / write の tool call → それぞれの集合に path。
   - (happy) 前回の Pi 生成 compaction の `details.readFiles` → `read` に入る。
3. `.pi/extensions/context-precompact/run/ports.test.ts`:
   - `AbortSignal.timeout(1000)` を `new AbortController().signal` にし、時間の定数を消す。
   - (happy) 引数の断定を配列の `toEqual` にし、12 個の位置を並べる。
   - (error) 認証失敗 → throw。モデル無し → throw。
4. `.pi/extensions/context-precompact/run/summarize.test.ts`:
   - 時計の開始と経過を名前付きの工場の値にし、`latencyMs` を経過と比べる。
   - (error) throw → `failed` と理由。abort 済み → `failed` と `aborted` で `compact` は呼ばれない。
5. `.pi/extensions/context-precompact/apply/draft.test.ts`:
   - (happy) `tokensAfter` の期待値を `summaryTokens` で作る。
   - (boundary) oldTokens が `tokensBefore` を超える → 0。
6. `.pi/extensions/context-precompact/gate/gate.test.ts`:
   - 小さい `contextWindow` を名前付きの工場の値にする。
7. `.pi/extensions/context-precompact/ui/count.test.ts`、`.pi/extensions/context-precompact/prepare/compare.test.ts`、`.pi/extensions/context-precompact/prepare/guard.test.ts`、`.pi/extensions/context-precompact/settings/read.test.ts`、`.pi/extensions/context-precompact/settings/schema.test.ts`:
   - 工場と定数で書けており、断定に魔数も直書きの仕様文も無いことを確かめる。変更なし。

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -rln "function userEntry" .pi/extensions/context-precompact` が `test/session-entries.ts` だけ
  - `grep -rnE "repeat\\((4000|4_000)\\)" .pi/extensions/context-precompact --include=*.ts` が `test/session-entries.ts` だけ
  - `grep -rn "AbortSignal.timeout" .pi/extensions/context-precompact/run` がなし
  - `grep -rn "status: idle" .pi/extensions/context-precompact --include=*.test.ts` がなし
  - `grep -n "precompact: ready (" .pi/extensions/context-precompact/index.test.ts .pi/extensions/context-precompact/command/precompact.test.ts` がなし
- Added:
  - `pnpm test:run` の件数が減った分を Notes に書き、減った試験が前提の再現だけだったことを 1 行で書く。
  - なし

## 3.timeout-extend

### Types

`なし`

### Steps

1. `.pi/extensions/context-precompact/settings/constants.ts`:
   - `SUMMARY_TIMEOUT_MS` を `300_000` にし、コメントを「要約の打ち切り（5分）」に直す。
2. `.pi/extensions/context-precompact/README.md`:
   - `## How it moves` に「The summary is capped at 300,000 ms (5 minutes); when it fails, the draft is discarded and the default compaction runs.」を 1 文足す。
3. `cycles/261025-038-dev/adr.md`:
   - timeout の行に「`SUMMARY_TIMEOUT_MS` は 5 分（300,000 ms）にし、失敗時は既定のコンパクションへフォールバックする」を足す。
4. `cycles/261025-038-dev/close.md`:
   - Triage 15 を `ex-plan ex-precompact-display (ADR 01, Unit.context-precompact)` として足す。
   - コードの commit hash を `done <hash>` に入れ、`close.md` の更新は記録の commit で行う。
   - この後に `Verify` を回す。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/context-precompact/settings/constants.ts`; 関連が無いときは `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -n "SUMMARY_TIMEOUT_MS = 300_000" .pi/extensions/context-precompact/settings/constants.ts` があり、`grep -rn "120_000" .pi/extensions/context-precompact` がなし
  - `grep -n "要約の打ち切り（5分）" .pi/extensions/context-precompact/settings/constants.ts` がある
  - `grep -n "300,000 ms" .pi/extensions/context-precompact/README.md` と `grep -n "SUMMARY_TIMEOUT_MS" .pi/extensions/context-precompact/doc.test.ts` と `grep -n "draft is discarded" .pi/extensions/context-precompact/doc.test.ts` がある
  - `grep -n "5 分" cycles/261025-038-dev/adr.md` と `grep -n "300,000 ms" cycles/261025-038-dev/adr.md` と `grep -n "既定のコンパクションへフォールバック" cycles/261025-038-dev/adr.md` がある
  - `grep -nE "15: done [0-9a-f]{7,}" cycles/261025-038-dev/close.md` と `grep -n "ex-precompact-display" cycles/261025-038-dev/close.md` があり、`hash=$(grep -oE '15: done [0-9a-f]{7,}' cycles/261025-038-dev/close.md | cut -d' ' -f3); git cat-file -e "$hash^{commit}"` が成功する
- Added:
  - `pnpm test:related .pi/extensions/context-precompact/doc.test.ts` が緑
  - base plan の look: オーナーが `SUMMARY_TIMEOUT_MS` の差分と README / ADR の文面を読み、OK を出す。

## Notes

### Slice 1: now-response

- Findings: なし
- Unplanned: スライス 1 と 2 を 1 つの commit にまとめた（同じ検証を 1 回で通したため）。試験の工場をスライス 1 で入れ、スライス 2 は残りの試験の置き換えにした。
- Unplanned: オーナーが `doc.test.ts` を無意味な試験と判断したため削除し、`## Files` / Steps / Verify から外した。
- Commit: 1262755, 9f86dc5
- Stopped: なし

### Slice 2: test-fixtures

- Findings: なし
- Unplanned: `prepare/copied.test.ts` の read / edit / write の 3 例を 1 つの表にし、`gate/gate.test.ts` の小さい `contextWindow` を定数にした。
- Commit: 1262755
- Stopped: なし

### Slice 3: timeout-extend

- Findings: なし
- Unplanned: なし
- Commit: 1262755
- Stopped: なし

### Cleanup: 試験の工場化

- Findings: なし。15 ファイルを読み、残る 5 ファイルは工場と定数で書けていることを確かめた。
- Unplanned: 変更なしと確かめたのは `ui/count.test.ts`、`prepare/compare.test.ts`、`prepare/guard.test.ts`、`settings/read.test.ts`、`settings/schema.test.ts`。

## Review

### Round 1

- Stale: `.pi/extensions/context-precompact/ui/status.ts` の `chatText`・`statusText`・`statusLine`・`failed` の `reason`、`command/precompact.ts` の `status`、`index.ts` の `notifyStatus`・各 `notify` は既に実コードにあり、`notifyText`・`notifyType`・`console` は既に無いのに、Steps が「足す」「消す」と書いていた。
  - fixed: Steps 1〜3 を「既にある。変えない」と、残る追加（`noticeText`・`failureText`・`brokenText`・`FALLBACK_TEXT` と、その利用）に書き直した。
- Unlisted: `run/summarize.ts`、`gate/gate.ts`、`prepare/prepare.ts`、`prepare/copied.ts` など、試験を更新する本体が `## Files` に無かった。
  - fixed: 本体を `## Files` に関連ファイルとして（標記なしで）並べた。
- Gaps: `onSessionBeforeCompact` の照合不一致の破棄が `FALLBACK_TEXT` の `warning` になる事例が Steps に無かった。
  - fixed: 照合不一致の事例を Step 9 に足した。
- Unproven: `grep -n "summaryTokens"` は変更前の局所変数にも当たるため、export を外しても緑だった。
  - fixed: `grep -n "export function summaryTokens"` と `grep -n "summaryTokens(result.summary)"` の 2 本に分けた。
- Noise: `statusText` の `preparing` / `ready` / `applied` が `chatText` と同じという事例は委譲の再現で、壊れても気づけない。
  - fixed: その事例を消した。
- Doubts: `NO_MODEL_REASON` の grep が 2 ファイルまとめてで、片方だけでも緑になった。
  - fixed: 2 ファイルを別々の grep に分けた。

### Round 2

- Stale: `draft is discarded` の needle が `doc.test.ts` に無く、Verify の grep が空振りしていた。
  - fixed: `doc.test.ts` 自体を削除した。オーナーが文書文字列の試験を無意味と判断した。`## Files`、Steps、Verify からも外した。
- Unlisted: `test/session-entries.ts` の `TURN_TEXT` / `projectEntries` / `lastId` が `Types` に無く、`projectEntries` が fixture の `project` を迂回していた。
  - fixed: `projectEntries` を `Types` と Step 6 に足し、`TURN_TEXT` を外に出さず、未使用の `lastId` を落とした。
- Gaps: `/precompact` の `status:` 行が失敗の理由を含む経路を `onCommand` で確かめていなかった。
  - fixed: `index.test.ts` に失敗後の `/precompact` の事例を足した。
- Unproven: `run/ports.test.ts` のモデル無しが `toThrow()` だけで、理由の文言を見ていなかった。
  - fixed: `toThrow(NO_MODEL_REASON)` にした。
- Noise: `prepare が 4 つの getter の値を使う` は前提の再現だった。
  - fixed: その事例と、偽 ctx の呼び出し記録を消した。
- Doubts: `console\\.` の grep が macOS の bash で `console.` を拾わない恐れがあった。
  - fixed: `console\.` の 1 本のバックスラッシュに直した。

## Acceptance

- Ran: `pnpm test:run`（55 ファイル・808 件）、`pnpm test:related`、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`、Verify の grep 一式、`git cat-file -e 1262755^{commit}` と `git cat-file -e 9f86dc5^{commit}`。
- Findings:
  - Round 2 の Stale（doc.test の needle）→ fixed: `doc.test.ts` を削除した。
  - Round 2 の Unlisted（fixture の宣言）→ fixed: `Types` と Step 6 を直した。
  - Round 2 の Gaps（`/precompact` の失敗理由）→ fixed: `index.test.ts` に事例を足した。
  - Round 2 の Unproven（モデル無しの文言）→ fixed: `toThrow(NO_MODEL_REASON)` にした。
  - Round 2 の Noise（4 getter）→ fixed: 事例を消した。
  - Round 2 の Doubts（console grep）→ fixed: バックスラッシュを 1 本にした。
- Doubts: 実機の look は未実施。オーナーが Pi を reload し、`/precompact now` と `/precompact` を実行して、chat の `preparing…` → `ready (X → Y)` / `applied (X → Y)` / 失敗の warning と `status:` 行を読む必要がある。
