# PLAN `async-precompact`

- No: 01

## Files

```text
.pi/extensions/context-precompact/
  settings/
    constants.ts           add
    schema.ts              add
    schema.test.ts         add
    read.ts                add
    read.test.ts           add
  gate/
    gate.ts                add
    gate.test.ts           add
  prepare/
    types.ts               add
    copied.ts              add
    copied.test.ts         add
    prepare.ts             add
    prepare.test.ts        add
    compare.ts             add
    compare.test.ts        add
    guard.ts               add
    guard.test.ts          add
  run/
    ports.ts               add
    ports.test.ts          add
    summarize.ts           add
    summarize.test.ts      add
  apply/
    draft.ts               add
    draft.test.ts          add
  ui/
    count.ts               add
    count.test.ts          add
    status.ts              add
    status.test.ts         add
  command/
    precompact.ts          add
    precompact.test.ts     add
  index.ts                 add
  index.test.ts            add
  doc.test.ts              add
  settings.json            add
  README.md                add
.pi/extensions/context-prune/   drop
README.md                  update
README.ja.md               update
DEFINITION.md              update
definition/format.md        update
```

## Slices

## 1.settings-and-gate

### Types

```ts
export interface Settings {
  readonly enabled: boolean;
  readonly keepRecentTokens: number;
  readonly thresholdRatio: number;
}

export type SettingsRead =
  | { readonly kind: 'ok'; readonly settings: Settings }
  | { readonly kind: 'broken'; readonly reason: string };

export const RESERVE_TOKENS = 16_384;
export const LEAD_RATIO = 0.05;
export const MIN_OLD_RATIO = 0.1;
export const REARM_RATIO = 0.05;
export const SUMMARY_TIMEOUT_MS = 120_000;
export const MAX_IN_FLIGHT = 1;
export const DEFAULT_KEEP_RECENT_TOKENS = 20_000;
export const DEFAULT_THRESHOLD_RATIO = 0.8;
export const MIN_THRESHOLD_RATIO = 0.5;
export const MAX_THRESHOLD_RATIO = 0.95;
export const MIN_KEEP_RECENT_TOKENS = 1;

export function defaultSettings(): Settings;
export function parseSettings(text: string): SettingsRead;

export interface GateInput {
  readonly enabled: boolean;
  readonly piEnabled: boolean;
  readonly tokens: number | null;
  readonly contextWindow: number;
  readonly thresholdRatio: number;
  readonly keepRecentTokens: number;
  readonly running: boolean;
  readonly prepared: boolean;
  readonly lastAppliedTokens: number | undefined;
}

export type GateDecision =
  | { readonly kind: 'skip'; readonly reason: 'disabled' | 'unknown' | 'running' }
  | {
      readonly kind: 'wait';
      readonly reason:
        'below-lead' | 'old-region-too-small' | 'cooling' | 'prepared-below-threshold';
    }
  | { readonly kind: 'start' }
  | { readonly kind: 'apply' };

export function gate(input: GateInput): GateDecision;
```

### Steps

1. `.pi/extensions/context-precompact/settings/constants.ts`:
   - 上の定数をそのまま置く。`RESERVE_TOKENS` は `compact()` に渡す `reserveTokens`、`LEAD_RATIO` は準備を始める手前、`MIN_OLD_RATIO` は古い領域の最小、`REARM_RATIO` は再発動の幅、`SUMMARY_TIMEOUT_MS` は要約の打ち切り、`MAX_IN_FLIGHT` は同時実行の上限。
2. `.pi/extensions/context-precompact/settings/schema.ts`:
   - `defaultSettings()` を足す。`enabled: true`、`keepRecentTokens: DEFAULT_KEEP_RECENT_TOKENS`、`thresholdRatio: DEFAULT_THRESHOLD_RATIO`。
   - `parseSettings(text)` を足す。JSON として読めない、object でない、知らないキー、型違い、`keepRecentTokens` が 1 以上の整数でない、`thresholdRatio` が 0.5〜0.95 でないときは `broken`。
3. `.pi/extensions/context-precompact/settings/schema.test.ts`:
   - (happy) `{}` → 既定の 3 値。
   - (happy) `JSON.stringify({ keepRecentTokens: DEFAULT_KEEP_RECENT_TOKENS * 2, thresholdRatio: (MIN_THRESHOLD_RATIO + MAX_THRESHOLD_RATIO) / 2 })` → その 2 値と既定の `enabled`。
   - (error) 知らないキー → `broken`。
   - (error) `thresholdRatio` が `MIN_THRESHOLD_RATIO - 0.01` → `broken`。
   - (error) `keepRecentTokens` が `MIN_KEEP_RECENT_TOKENS - 1` → `broken`。
   - (error) JSON でない → `broken`。
4. `.pi/extensions/context-precompact/settings/read.ts`:
   - `SETTINGS_FILE` と `readSettings(dir)` を足す。ファイルが無ければ既定、あれば `parseSettings`。読めないときは `broken`。
   - `writeEnabled(dir, enabled)` を足す。ファイルが無ければ `{ enabled }` を作る。既存の JSON があれば `enabled` だけを変えて書く。壊れた JSON は `broken` を返し、書かない。
5. `.pi/extensions/context-precompact/settings/read.test.ts`:
   - 一時ディレクトリの工場を使う。
   - (happy) ファイル無し → 既定。
   - (happy) 有効な JSON → その値。
   - (error) 壊れた JSON → `broken`。
   - (happy) ファイル無しで `writeEnabled(false)` → `{ enabled: false }` ができ、次の `readSettings` が `enabled: false`。
   - (happy) リポジトリの `.pi/extensions/context-precompact/settings.json` を読む → 既定の 3 値。
6. `.pi/extensions/context-precompact/gate/gate.ts`:
   - `gate(input)` を足す。`enabled` と `piEnabled` のどちらかが false なら `skip: disabled`。`tokens` が null か `contextWindow <= 0` なら `skip: unknown`。`running` なら `skip: running`。
   - `ratio = tokens / contextWindow`。`prepared` なら、`ratio >= thresholdRatio` で `apply`、そうでなければ `wait: prepared-below-threshold`。
   - `lastAppliedTokens` があり、`tokens < lastAppliedTokens + REARM_RATIO * contextWindow` なら `wait: cooling`。
   - `ratio < thresholdRatio - LEAD_RATIO` なら `wait: below-lead`。
   - `thresholdRatio * contextWindow - keepRecentTokens < MIN_OLD_RATIO * contextWindow` なら `wait: old-region-too-small`。
   - それ以外は `start`。
7. `.pi/extensions/context-precompact/gate/gate.test.ts`:
   - 入力の工場を作り、定数は名前で使う。
   - (happy) 比率が `thresholdRatio`、prepared でない → `start`。
   - (happy) 比率が `thresholdRatio`、prepared → `apply`。
   - (happy) 比率が `thresholdRatio - LEAD_RATIO / 2`、prepared → `wait: prepared-below-threshold`。
   - (happy) 比率が `thresholdRatio - LEAD_RATIO` 未満 → `wait: below-lead`。
   - (error) `enabled: false` → `skip: disabled`。
   - (error) `piEnabled: false` → `skip: disabled`。
   - (error) `tokens: null` → `skip: unknown`。
   - (error) `running: true` → `skip: running`。
   - (boundary) 古い領域が `MIN_OLD_RATIO` 未満 → `wait: old-region-too-small`。
   - (happy) `lastAppliedTokens` から `REARM_RATIO` 未満 → `wait: cooling`。
   - (happy) `lastAppliedTokens` から `REARM_RATIO` 以上 → `start`。

8. `.pi/extensions/context-precompact/settings.json`:
   - 既定の `{ "enabled": true, "keepRecentTokens": 20000, "thresholdRatio": 0.8 }` を書く。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/context-precompact/settings/schema.ts .pi/extensions/context-precompact/settings/schema.test.ts .pi/extensions/context-precompact/settings/read.ts .pi/extensions/context-precompact/settings/read.test.ts .pi/extensions/context-precompact/gate/gate.ts .pi/extensions/context-precompact/gate/gate.test.ts`; 関連が無いときは `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -nE "RESERVE_TOKENS|LEAD_RATIO|MIN_OLD_RATIO|REARM_RATIO" .pi/extensions/context-precompact/settings/constants.ts .pi/extensions/context-precompact/gate/gate.ts` で内部定数がある
- Added: なし

## 2.prepare-copy

### Types

```ts
export interface CompactionSettings {
  readonly enabled: boolean;
  readonly reserveTokens: number;
  readonly keepRecentTokens: number;
}

export type PreparedMessage = Extract<SessionEntry, { type: 'message' }>['message'];

export interface PreparedCompaction {
  readonly firstKeptEntryId: string;
  readonly messagesToSummarize: readonly PreparedMessage[];
  readonly turnPrefixMessages: readonly PreparedMessage[];
  readonly isSplitTurn: boolean;
  readonly tokensBefore: number;
  readonly previousSummary: string | undefined;
  readonly fileOps: FileOperations;
  readonly settings: CompactionSettings;
}

export interface ProjectedEntry {
  readonly sourceEntry: SessionEntry;
  readonly messages: readonly PreparedMessage[];
}

export interface PrepareStamp {
  readonly sessionId: string;
  readonly leafId: string;
  readonly latestCompactionId: string | undefined;
}

export interface Prepared {
  readonly compaction: PreparedCompaction;
  readonly stamp: PrepareStamp;
}

export type CompareField =
  'firstKeptEntryId' | 'messagesToSummarize' | 'turnPrefixMessages' | 'previousSummary' | 'fileOps';

export type CompareResult =
  | { readonly kind: 'match' }
  | { readonly kind: 'mismatch'; readonly fields: readonly CompareField[] };

export interface GuardInput {
  readonly stamp: PrepareStamp;
  readonly currentSessionId: string;
  readonly branch: readonly SessionEntry[];
  readonly latestCompactionId: string | undefined;
  readonly firstKeptEntryId: string;
}

export type GuardReason =
  'session-changed' | 'leaf-not-on-branch' | 'first-kept-missing' | 'new-compaction';

export type GuardResult =
  { readonly kind: 'ok' } | { readonly kind: 'stale'; readonly reason: GuardReason };

export interface ProjectedPrepareInput {
  readonly projectedEntries: readonly ProjectedEntry[];
  readonly pathEntries: readonly SessionEntry[];
  readonly settings: CompactionSettings;
  readonly tokensBefore: number;
}

export interface PrepareInput {
  readonly projectedEntries: readonly ProjectedEntry[];
  readonly branch: readonly SessionEntry[];
  readonly tokensBefore: number;
  readonly settings: Settings;
  readonly piEnabled: boolean;
  readonly sessionId: string;
}

export function prepareFromProjection(input: ProjectedPrepareInput): PreparedCompaction | undefined;
export function prepare(input: PrepareInput): Prepared | undefined;
export function compare(ours: PreparedCompaction, theirs: PreparedCompaction): CompareResult;
export function guard(input: GuardInput): GuardResult;
```

`PreparedMessage` は `SessionEntry` の message 型です。`compact()` は `AgentMessage[]` を期待するので、`ports.ts` の 1 か所だけで構造を合わせ、他のファイルへ cast を広げない。

`FileOperations` と `SessionEntry` は Pi のルートから import する。`PreparedMessage` は `SessionEntry` から作る。

### Steps

1. `.pi/extensions/context-precompact/prepare/types.ts`:
   - 上の型を置く。`FileOperations` は Pi の型をそのまま使う。
2. `.pi/extensions/context-precompact/prepare/copied.ts`:
   - 先頭に「Pi 1.3.0 の `dist/core/compaction/compaction.js:606-659` と `dist/core/compaction/utils.js` からコピーした」と書く。
   - `prepareFromProjection` を足す。`prepareCompaction` の本体を、`buildSessionProjection(pathEntries)` を `projectedEntries` に、`estimateProjectedContextTokens` を `tokensBefore` に置き換えて写す。
   - `findProjectedCutPoint`、`isCutPointMessage`、`isTurnStartMessage`、`isProjectedTurnStart`、`findProjectedTurnStartIndex`、`getMessagesFromProjectedEntryForCompaction`、`extractFileOperations`、`extractFileOpsFromMessage` を同じファイルに写す。
   - 最後の entry が `compaction`、cut point が無い、要約対象が空、のときは `undefined`。
   - `previousSummary` は最新の `compaction` の `summary`。`fileOps` は前回の `!fromHook` の `details` と要約対象の tool call から作る。
3. `.pi/extensions/context-precompact/prepare/copied.test.ts`:
   - `ProjectedEntry` の工場を作る。user/assistant の `TURNS = 3` ターンと、`read` / `edit` / `write` の toolCall を必要に応じて作れるようにする。`estimateTokens` が読める形にする。
   - (happy) 工場の 3 ターンと小さい `keepRecentTokens` → `firstKeptEntryId` が期待の entry、`messagesToSummarize` が空でない。
   - (happy) 最後が compaction → `undefined`。
   - (empty) メッセージが 1 件も無い → `undefined`。
   - (boundary) 1 つの user 区間が `keepRecentTokens` を超える → `isSplitTurn` が true、`turnPrefixMessages` が空でない。
   - (happy) 前回の compaction がある → `previousSummary` がその summary。
   - (happy) `read` tool call → `fileOps.read` に path。
   - (happy) `edit` tool call → `fileOps.edited` に path。
   - (happy) `write` tool call → `fileOps.written` に path。
   - (happy) 前回の Pi 生成 compaction の `details.readFiles` → `fileOps.read` に path。
4. `.pi/extensions/context-precompact/prepare/prepare.ts`:
   - `PrepareInput` を受け取り、`settings.enabled` と `piEnabled` のどちらかが false なら `undefined`。
   - `prepareFromProjection` を呼ぶ。`settings` は `{ enabled: true, reserveTokens: RESERVE_TOKENS, keepRecentTokens: input.settings.keepRecentTokens }`。
   - `compaction` が `undefined` なら `undefined`。
   - 最新の `compaction` が `fromHook: true` で `details` が `readFiles` / `modifiedFiles` の配列なら、`read` に `readFiles`、`edited` に `modifiedFiles` を足した新しい `FileOperations` を作る。壊れた `details` は無視する。
   - `stamp` は `sessionId`、`leafId`（branch の最後の id）、`latestCompactionId`（最新の compaction の id）。
5. `.pi/extensions/context-precompact/prepare/prepare.test.ts`:
   - (happy) 前回の `fromHook: true` の `details` が `readFiles: ['a.ts']`、`modifiedFiles: ['b.ts']` → `fileOps.read` に `a.ts`、`fileOps.edited` に `b.ts`。
   - (happy) `fromHook` が無い前回 → 追加の merge は無い。
   - (error) `details` が配列でない → 投げずに無視する。
   - (happy) `enabled: false` → `undefined`。
   - (happy) `piEnabled: false` → `undefined`。
6. `.pi/extensions/context-precompact/prepare/compare.ts`:
   - `compare(ours, theirs)` を足す。`firstKeptEntryId`、`messagesToSummarize.length`、`turnPrefixMessages.length`、`previousSummary`、`fileOps` の `read` / `written` / `edited` の集合を比べる。
   - 集合は要素数と全要素の一致で比べる。不一致の field 名を返す。
7. `.pi/extensions/context-precompact/prepare/compare.test.ts`:
   - (happy) 5 項目が同じ → `match`。
   - (error) `firstKeptEntryId` が違う → `mismatch: ['firstKeptEntryId']`。
   - (error) メッセージ数が違う → `mismatch: ['messagesToSummarize']`。
   - (error) `previousSummary` が違う → `mismatch: ['previousSummary']`。
   - (error) `fileOps.read` だけ違う → `mismatch: ['fileOps']`。
8. `.pi/extensions/context-precompact/prepare/guard.ts`:
   - `guard(input)` を足す。session id が違えば `session-changed`。branch に `stamp.leafId` が無ければ `leaf-not-on-branch`。branch に `firstKeptEntryId` が無ければ `first-kept-missing`。`latestCompactionId` が `stamp.latestCompactionId` と違えば `new-compaction`。それ以外は `ok`。
9. `.pi/extensions/context-precompact/prepare/guard.test.ts`:
   - (happy) session、leaf、firstKept、latest が同じ → `ok`。
   - (error) session が違う → `session-changed`。
   - (error) leaf が branch に無い → `leaf-not-on-branch`。
   - (error) firstKept が branch に無い → `first-kept-missing`。
   - (error) 新しい compaction がある → `new-compaction`。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/context-precompact/prepare/copied.ts .pi/extensions/context-precompact/prepare/copied.test.ts .pi/extensions/context-precompact/prepare/prepare.ts .pi/extensions/context-precompact/prepare/prepare.test.ts .pi/extensions/context-precompact/prepare/compare.ts .pi/extensions/context-precompact/prepare/compare.test.ts .pi/extensions/context-precompact/prepare/guard.ts .pi/extensions/context-precompact/prepare/guard.test.ts`; 関連が無いときは `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -rnE "prepareFromProjection|compare\(|guard\(" .pi/extensions/context-precompact/prepare` で新しい関数がある
- Added: なし

## 3.summarize-and-draft

### Types

```ts
export interface CompactRequest {
  readonly preparation: PreparedCompaction;
  readonly signal: AbortSignal;
}

export interface SummaryPorts {
  readonly compact: (request: CompactRequest) => Promise<CompactionResult>;
}

export interface SummaryCtx {
  readonly model: Model | undefined;
  readonly modelRegistry: ExtensionContext['modelRegistry'];
  readonly thinkingLevel: ExtensionContext['thinkingLevel'];
  readonly sessionManager: ExtensionContext['sessionManager'];
  readonly compactFn: typeof compact;
}

export type SummaryOutcome =
  | { readonly kind: 'done'; readonly result: CompactionResult; readonly latencyMs: number }
  | { readonly kind: 'failed'; readonly reason: string };

export interface ReadyCompaction {
  readonly draft: CompactionEntryDraft;
  readonly result: CompactionResult;
  readonly prepared: PreparedCompaction;
  readonly stamp: PrepareStamp;
  readonly tokensBefore: number;
  readonly tokensAfter: number;
}

export function createSummaryPorts(ctx: SummaryCtx): SummaryPorts;
export async function summarize(
  ports: SummaryPorts,
  prepared: PreparedCompaction,
  signal: AbortSignal,
  now: () => number,
): Promise<SummaryOutcome>;
export function readyFrom(
  result: CompactionResult,
  prepared: PreparedCompaction,
  stamp: PrepareStamp,
  tokensBefore: number,
): ReadyCompaction;
```

### Steps

1. `.pi/extensions/context-precompact/run/ports.ts`:
   - `createSummaryPorts(ctx)` を足す。`ctx.model` が undefined なら throw する。`ctx.modelRegistry.getApiKeyAndHeaders(ctx.model)` で認証を取る。失敗は throw。
   - `ctx.compactFn(preparation, ctx.model, auth.apiKey, headersOf(auth.headers), undefined, signal, ctx.thinkingLevel, undefined, auth.env, undefined, undefined, ctx.sessionManager.getSessionId())` を呼ぶ。
   - `Outside: Pi の compact() 公開 API`。`Outside: モデルプロバイダの認証 / API`。
2. `.pi/extensions/context-precompact/run/ports.test.ts`:
   - fake の `modelRegistry`、`model`、`compactFn` を使う。`compactFn` は呼び出しの引数を記録する。
   - (happy) `compactFn` が結果を返す → その結果。
   - (happy) `compactFn` に `preparation`、`signal`、`model`、`apiKey`、`headers`、`customInstructions: undefined`、`thinkingLevel`、`streamFn: undefined`、`env`、`retry: undefined`、`callbacks: undefined`、`sessionId` が渡る。null の header は落ちる。
   - (error) `getApiKeyAndHeaders` が失敗 → throw。
   - (error) `model` が undefined → throw。
3. `.pi/extensions/context-precompact/run/summarize.ts`:
   - `summarize` を足す。`now()` で開始、`ports.compact({ preparation, signal })` を待ち、成功なら `done` と経過時間、失敗なら `failed` と理由。`signal.aborted` なら `failed: 'aborted'`。
4. `.pi/extensions/context-precompact/run/summarize.test.ts`:
   - (happy) fake port が結果を返す → `done`、`latencyMs` が経過。
   - (error) fake port が throw → `failed`。
   - (error) `signal` が abort 済み → `failed: 'aborted'`。
5. `.pi/extensions/context-precompact/apply/draft.ts`:
   - `readyFrom` を足す。`oldTokens` は `messagesToSummarize` と `turnPrefixMessages` の `estimateTokens` の合計、`summaryTokens` は `Math.ceil(result.summary.length / 4)`、`tokensAfter = Math.max(0, tokensBefore - oldTokens + summaryTokens)`。
   - `draft` は `{ type: 'compaction', summary: result.summary, firstKeptEntryId: result.firstKeptEntryId, details: result.details, usage: result.usage }`。
6. `.pi/extensions/context-precompact/apply/draft.test.ts`:
   - メッセージの工場を使う。
   - (happy) result と prepared → `draft` の `summary`、`firstKeptEntryId`、`details`、`usage` が同じ。
   - (happy) `tokensBefore`、`estimateTokens` の合計、summary の文字数 → `tokensAfter` が `tokensBefore - oldTokens + summaryTokens` と一致する。
   - (boundary) `oldTokens` が `tokensBefore` を超える → `tokensAfter` が 0。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/context-precompact/run/ports.ts .pi/extensions/context-precompact/run/ports.test.ts .pi/extensions/context-precompact/run/summarize.ts .pi/extensions/context-precompact/run/summarize.test.ts .pi/extensions/context-precompact/apply/draft.ts .pi/extensions/context-precompact/apply/draft.test.ts`; 関連が無いときは `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -rnE "createSummaryPorts|summarize\(|readyFrom\(" .pi/extensions/context-precompact/run .pi/extensions/context-precompact/apply` で新しい関数がある
- Added: なし

## 4.wiring-and-status

### Types

```ts
export type StatusState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'preparing' }
  | { readonly kind: 'ready'; readonly before: number; readonly after: number }
  | { readonly kind: 'failed' }
  | { readonly kind: 'applied'; readonly before: number; readonly after: number }
  | { readonly kind: 'discarded' };

export function formatCount(value: number): string;
export function statusText(state: StatusState): string | undefined;
export function notifyText(state: StatusState): string | undefined;
export function notifyType(state: StatusState): 'info' | 'warning' | 'error' | undefined;

export type Command =
  | { readonly kind: 'status' }
  | { readonly kind: 'on' }
  | { readonly kind: 'off' }
  | { readonly kind: 'now' }
  | { readonly kind: 'usage' };

export function parseCommand(args: string): Command;

export interface StatusInput {
  readonly settings: Settings;
  readonly prepared: boolean;
  readonly running: boolean;
  readonly lastAppliedTokens: number | undefined;
}

export function statusLines(input: StatusInput): readonly string[];

export interface PiPort {
  readonly on: ExtensionAPI['on'];
  readonly registerCommand: ExtensionAPI['registerCommand'];
  readonly getSettings: ExtensionAPI['getSettings'];
}

export interface WiringOptions {
  readonly settingsDir: string;
  readonly now: () => number;
  readonly compactFn?: SummaryCtx['compactFn'];
}

export interface PrecompactCtx {
  readonly sessionManager: ExtensionContext['sessionManager'];
  readonly model: ExtensionContext['model'];
  readonly modelRegistry: ExtensionContext['modelRegistry'];
  readonly thinkingLevel: ExtensionContext['thinkingLevel'];
  readonly getContextUsage: ExtensionContext['getContextUsage'];
  readonly signal: AbortSignal | undefined;
  readonly ui: {
    readonly notify: ExtensionContext['ui']['notify'];
    readonly setStatus: ExtensionContext['ui']['setStatus'];
  };
}

export interface PrecompactWiring {
  readonly onTurnEnd: (ctx: PrecompactCtx) => Promise<BoundaryResult | undefined>;
  readonly onBeforeSettle: (ctx: PrecompactCtx) => BoundaryResult | undefined;
  readonly onSessionBeforeCompact: (
    event: SessionBeforeCompactEvent,
    ctx: PrecompactCtx,
  ) => SessionBeforeCompactResult | undefined;
  readonly onSessionStart: (ctx: PrecompactCtx) => void;
  readonly onSessionShutdown: (ctx: PrecompactCtx) => void;
  readonly onCommand: (args: string, ctx: PrecompactCtx) => Promise<void>;
  readonly getState: () => WiringState;
  readonly flush: () => Promise<void>;
}

export interface WiringState {
  readonly running: boolean;
  readonly prepared: ReadyCompaction | undefined;
  readonly lastAppliedTokens: number | undefined;
  readonly status: StatusState;
  readonly brokenNotified: boolean;
}

export function createPrecompactWiring(port: PiPort, options: WiringOptions): PrecompactWiring;
export function registerPrecompact(pi: PiPort): void;
```

### Steps

1. `.pi/extensions/context-precompact/ui/count.ts`:
   - `formatCount(value)` を足す。3 桁ごとにカンマを入れる。負の値はそのまま符号を付ける。
2. `.pi/extensions/context-precompact/ui/count.test.ts`:
   - 出力の文字列は `formatCount` の仕様なので、固定の期待値で確かめる。`THOUSAND = 1_000`、`MILLION = 1_000_000` を名前で使う。
   - (happy) `formatCount(0)` → `'0'`、`formatCount(THOUSAND - 1)` → `'999'`、`formatCount(THOUSAND)` → `'1,000'`、`formatCount(MILLION)` → `'1,000,000'`。
   - (boundary) 負の値 → 符号が残る。
3. `.pi/extensions/context-precompact/ui/status.ts`:
   - `statusText` を足す。`preparing` → `precompact: preparing…`、`ready` → `precompact: ready (X → Y)`、`failed` → `precompact: failed`、`applied` と `discarded` と `idle` → `undefined`。
   - `notifyText` を足す。`applied` → `precompact: applied (X → Y)`、`failed` と `discarded` → `precompact: failed; default compaction will run`、それ以外 → `undefined`。
   - `notifyType` を足す。`applied` → `info`、`failed` と `discarded` → `warning`、それ以外 → `undefined`。
4. `.pi/extensions/context-precompact/ui/status.test.ts`:
   - 出力の文字列は status の仕様なので、固定の期待値で確かめる。`BEFORE = 1_000`、`AFTER = 500`、`MILLION = 1_000_000` を名前で使う。
   - (happy) `preparing` → `precompact: preparing…`。
   - (happy) `ready` の `BEFORE` → `AFTER` → `precompact: ready (1,000 → 500)`。
   - (happy) `failed` → `precompact: failed` とフォールバック通知。
   - (happy) `applied` → status は `undefined`、通知は `precompact: applied (1,000 → 500)`。
   - (happy) `idle` → status も通知も `undefined`。
   - (boundary) `0` と `MILLION` の組 → カンマが入る。
5. `.pi/extensions/context-precompact/command/precompact.ts`:
   - `parseCommand(args)` を足す。空は `status`、`on` / `off` / `now`、それ以外は `usage`。
6. `.pi/extensions/context-precompact/command/precompact.test.ts`:
   - (happy) 空 → `status`、`on` / `off` / `now` → それぞれ。
   - (error) `foo` → `usage`。
7. `.pi/extensions/context-precompact/index.ts`:
   - `createPrecompactWiring` を足す。`settings` を毎回読み、`port.getSettings()` の `compaction.enabled` と拡張の `enabled` の両方を見る。設定が壊れているときは `brokenNotified` を立てて 1 度だけ `notify` し、開始しない。
   - `onTurnEnd` は `gate` を呼ぶ。`apply` なら `guard` を通し、stale なら捨ててフォールバック通知を出す。通れば `ready.draft` を 1 件の `entries` で返し、`lastAppliedTokens` に `ready.tokensAfter` を入れ、status を `applied` にして通知し、status を clear する。`start` なら `running` を立てて `void runPass(ctx)` を呼び、status を `preparing` にする。
   - `onBeforeSettle` は `prepared` があり、現在の比率が `thresholdRatio` 以上なら `guard` を通して `ready.draft` を返す。stale なら捨てる。開始はしない。
   - `onSessionBeforeCompact` は `prepared` があり、`compare` が `match` で `guard` が `ok` なら、`ready.result` の `tokensBefore` をその時点の `getContextUsage()` で更新して `{ compaction }` を返す。`mismatch` か `stale` なら捨てて `console.warn` とフォールバック通知を出す。
   - `runPass` は `projection = ctx.sessionManager.buildSessionProjection()`、`branch = ctx.sessionManager.getBranch()`、`tokensBefore = ctx.getContextUsage()?.tokens`、`sessionId = ctx.sessionManager.getSessionId()` を集め、`prepare({ projectedEntries: projection.entries, branch, tokensBefore, settings, piEnabled, sessionId })` を呼ぶ。`undefined` なら status を `idle` に戻す。
   - `runPass` の signal は `ctx.signal ? AbortSignal.any([ctx.signal, AbortSignal.timeout(SUMMARY_TIMEOUT_MS)]) : AbortSignal.timeout(SUMMARY_TIMEOUT_MS)`。`summarize` が `done` なら `readyFrom` で `prepared` を作り、status を `ready` にする。`failed` なら status を `failed` にして通知し、`prepared` を捨てる。`finally` で `running` を戻す。
   - prepare と apply は `console.info`、fallback と mismatch は `console.warn` に出す。
   - `onSessionStart` と `onSessionShutdown` は status を clear し、`prepared` と `running` と `brokenNotified` を戻す。
   - `onCommand` は `parseCommand` で分ける。`status` は `statusLines({ settings, prepared: state.prepared !== undefined, running: state.running, lastAppliedTokens: state.lastAppliedTokens })` を `notify` で出す。`on` / `off` は `writeEnabled` で settings を書き、`notify` で知らせる。`now` は `runPass` を待ち、結果を `notify` で出す。`usage` は使い方を `notify` で出す。
   - `registerPrecompact` は `turn_end`、`agent_before_settle`、`session_before_compact`、`session_start`、`session_shutdown`、`registerCommand('precompact')` を登録する。
8. `.pi/extensions/context-precompact/index.test.ts`:
   - fake の `pi`（`on`、`registerCommand`、`getSettings`）と fake の `ctx`（`sessionManager`、`getContextUsage`、`model`、`modelRegistry`、`thinkingLevel`、`signal`、`ui`）を作る。`compactFn` は fake を注入する。
   - (happy) `turn_end` で比率が閾値の手前 → `running` が true、status が `preparing`。
   - (happy) 要約が返る → `prepared` が立ち、status が `ready`。
   - (happy) 次の `turn_end` で比率が閾値 → `entries` に compaction draft が 1 件、通知が applied、status が clear、`lastAppliedTokens` が `ready.tokensAfter`。
   - (happy) `agent_before_settle` で `prepared` があり比率が閾値 → compaction draft が 1 件。
   - (happy) `agent_before_settle` で比率が閾値未満 → `undefined`。
   - (error) `turn_end` の apply で session / leaf / firstKept / 新しい compaction が古い → draft を返さず、フォールバック通知。
   - (happy) `session_before_compact` で `preparation` が一致 → `compaction` を返し、`tokensBefore` が現在値。
   - (error) `session_before_compact` で `firstKeptEntryId` が違う → `undefined`、`console.warn`、フォールバック通知。
   - (error) 要約が失敗 → status が `failed`、フォールバック通知、`prepared` が無い。
   - (happy) `signal` が undefined → pass が始まり、status が `preparing`。
   - (happy) 拡張か Pi の `enabled` が false → 開始しない。
   - (error) 設定が壊れている → 1 度だけ `notify`、2 回目の `turn_end` では増えない。
   - (happy) `session_start` / `session_shutdown` → status が clear、`prepared` が無い。
   - (happy) `/precompact status` / `on` / `off` / `now` → それぞれの通知と settings の書き換え。
   - (happy) prepare が `buildSessionProjection()`、`getBranch()`、`getContextUsage()`、`getSessionId()` の値を使う。
   - (happy) apply と fallback が `console.info` / `console.warn` を呼ぶ。
   - (happy) `flush` が実行中の pass を待つ。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/context-precompact/ui/count.ts .pi/extensions/context-precompact/ui/count.test.ts .pi/extensions/context-precompact/ui/status.ts .pi/extensions/context-precompact/ui/status.test.ts .pi/extensions/context-precompact/command/precompact.ts .pi/extensions/context-precompact/command/precompact.test.ts .pi/extensions/context-precompact/index.ts .pi/extensions/context-precompact/index.test.ts`; 関連が無いときは `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -nE "setStatus|notify|session_before_compact|registerCommand" .pi/extensions/context-precompact/index.ts` で配線がある
- Added: なし

## 5.switch-and-docs

### Types

```ts
なし;
```

### Steps

1. `.pi/extensions/context-prune/`:
   - ディレクトリ全体を削除する。`prune`、`apply`、`entry`、`command`、`settings`、`format`、`doc.test.ts`、`README.md`、`settings.json` を含む。
2. `.pi/extensions/context-precompact/README.md`:
   - 新しい拡張の説明を書く。標準のコンパクションを置き換えず、閾値の手前で裏で準備し、`turn_end` / `session_before_compact` / `agent_before_settle` で差し込むこと。
   - 設定 `enabled`、`keepRecentTokens`、`thresholdRatio` と既定値を書く。
   - `/precompact status|on|off|now` と status line の preparing / ready / applied / failed を書く。
   - 失敗、stale、照合不一致、`firstKeptEntryId` 不在では Pi の既定に任せることを書く。
   - Jev とツール結果の削除には触れない。
3. `.pi/extensions/context-precompact/doc.test.ts`:
   - ルートの `README.md`、`README.ja.md`、`DEFINITION.md` と、同じディレクトリの `README.md` を読む。root は `join(import.meta.dirname, '../../../README.md')`、同じディレクトリは `join(import.meta.dirname, 'README.md')` で読む。
   - (happy) 新しい `README.md` に `turn_end`、`session_before_compact`、`agent_before_settle`、`keepRecentTokens`、`thresholdRatio`、`/precompact status|on|off|now`、`preparing`、`ready`、`applied`、`failed`、`default compaction` がある。
   - (happy) ルートの `README.md` に `context-precompact` と `/precompact` があり、`context-prune`、`/prune`、`Jev` が無い。
   - (happy) `README.ja.md` に同じ 4 つがある。
   - (happy) `DEFINITION.md` に `Unit.context-precompact` があり、`Unit.context-prune` と `Stack.Agent.Classifier` が無い。
4. `README.md`:
   - 拡張一覧の `context-prune` の行を、`context-precompact` の行に置き換える。標準コンパクションを待たず、`/precompact`、status line、設定を書く。Jev には触れない。
5. `README.ja.md`:
   - 同じ内容を日本語で書く。
6. `DEFINITION.md`:
   - `Unit.context-prune` の行を消し、`Unit.context-precompact` の行を足す。`context-precompact: エージェントが、コンパクションを待たずに、コンテキストを空けられる`。
   - `Stack` の `Agent | Classifier | Jev 1.13` の行を消す。
   - 他の `Who`、`What`、`Product`、`Stack` の行は変えない。
7. `definition/format.md`:
   - Defaults の `Stack` 表から `Agent | Classifier | Jev 1.13` の行を消す。他の行は変えない。

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -rnE "context-prune|/prune|Jev|Stack.Agent.Classifier" --exclude-dir=cycles --exclude-dir=node_modules --exclude-dir=.git .` が なし
  - `grep -n "context-precompact" README.md README.ja.md DEFINITION.md` がある
  - `grep -n "context-precompact" .pi/extensions/context-precompact/README.md` がある
- Added:
  - other — `test -d .pi/extensions/context-precompact && test ! -d .pi/extensions/context-prune` が通る。

## Notes

### Slice 1: settings-and-gate

- Findings: なし
- Unplanned: なし
- Commit: 53b4231 consult(async-precompact): add settings and gate
- Stopped: なし

### Slice 2: prepare-copy

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 3: summarize-and-draft

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 4: wiring-and-status

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 5: switch-and-docs

- Findings:
- Unplanned:
- Commit:
- Stopped:

## Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Unproven:
- Noise:
- Doubts:

## Acceptance

- Ran:
- Findings:
- Doubts:
