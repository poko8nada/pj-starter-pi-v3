# PLAN `sentence-loop-stop`

- No: 01, 02, 03

## Files

```text
.pi/extensions/thinking-scrub/
  live/
    guard.ts             add
    guard.test.ts        add
  scrub/
    detect.ts            update
    detect.test.ts       update
    message.ts
    message.test.ts
    units.ts             add
    units.test.ts        add
  index.ts               update
  index.test.ts          update
  README.md              update
README.md                update
README.ja.md             update
```

## Slices

## 1.unit-runs

### Types

```ts
export interface Unit {
  readonly start: number;
  readonly end: number;
  readonly text: string;
  readonly opaque: boolean;
}

export interface UnitRun {
  readonly at: number;
  readonly length: number;
  readonly period: number;
}

export const MAX_PERIOD_UNITS = 64;
export const MIN_CYCLES = 3;
export const MIN_RUN_CHARS = 400;
export const SAMPLE_CHARS = 200;

export function splitUnits(text: string): readonly Unit[];
export function detectUnitRuns(units: readonly Unit[]): readonly UnitRun[];
export function sampleOf(units: readonly Unit[], run: UnitRun): string;
```

### Steps

1. `.pi/extensions/thinking-scrub/scrub/units.ts`:
   - Add `splitUnits`: lines, then sentences. English ends at `.` `!` `?` followed by whitespace or the line end; Japanese ends at `。` `！` `？`.
   - Add the guards: a fence line and what is inside a fence, a table row, and a diff line are opaque units.
   - Add `detectUnitRuns`: the maximal period scan over the unit texts, period 1..`MAX_PERIOD_UNITS`, run length `MIN_CYCLES`×period or more, run chars `MIN_RUN_CHARS` or more, no opaque unit, and overlapping runs deduped by the smallest period.
   - Add `sampleOf`: the most frequent 3-unit window in the run; when the period is 3 or less, the cycle itself; truncated to `SAMPLE_CHARS`.
2. `.pi/extensions/thinking-scrub/scrub/units.test.ts`:
   - Build the texts from a factory (`sentenceUnit()`), not from literals at each case.
   - (happy) `splitUnits` on a two-line English text from the factory → four units with the original offsets.
   - (happy) a Japanese line with `。` and `！` from the factory → the units split at those marks, with the offsets kept.
   - (happy) a fenced block → the fence line and its contents are opaque.
   - (happy) a table row and a `diff --git` line → opaque.
   - (boundary) a line whose abbreviation ends with `.` → the abbreviation is its own unit, and the neighbours keep their offsets.
   - (happy) `detectUnitRuns` on `MIN_CYCLES` cycles of three sentences → one run with period 3.
   - (happy) overlapping periods 6 and 12 from the factory → one run with period 6.
   - (boundary) `MIN_CYCLES - 1` cycles → no run.
   - (boundary) a `MIN_CYCLES`-cycle run under `MIN_RUN_CHARS` → no run.
   - (boundary) a run that contains a fence unit → no run.
   - (empty) normal prose → no run.
   - (happy) `sampleOf` on a 12-unit run → the most frequent 3-unit window, `SAMPLE_CHARS` or less.
   - (happy) a 3-unit window over `SAMPLE_CHARS` → the sample is cut to `SAMPLE_CHARS`.
   - (boundary) `sampleOf` on a 2-unit cycle → the two units.

### Verify

- Always:
  - `pnpm test:related .pi/extensions/thinking-scrub/scrub/units.ts .pi/extensions/thinking-scrub/scrub/units.test.ts`; `pnpm test:run` if nothing is related
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -n "splitUnits\\|detectUnitRuns\\|sampleOf" .pi/extensions/thinking-scrub/scrub/units.ts` has the new exports
- Added: なし

## 2.sentence-fold

### Types

なし

### Steps

1. `.pi/extensions/thinking-scrub/scrub/detect.ts`:
   - Keep `detectRuns` and `separatorFor` as they are.
   - `scrubThinking` first calls `splitUnits` and `detectUnitRuns`, and removes each sentence run from its second cycle onward, so the first cycle stays.
   - Then it runs the existing char `detectRuns` on the result and removes those runs entirely.
   - `removed` is the sentence runs plus the char runs.
   - Add one removal helper that takes spans and applies `separatorFor` to each joint.
2. `.pi/extensions/thinking-scrub/scrub/detect.test.ts`:
   - Build the texts from the existing `unit()` and `repeated()` factories.
   - (happy) a sentence loop of `MIN_CYCLES` cycles → the first cycle is kept, and the rest is removed.
   - (happy) a char loop from `repeated()` → removed as before.
   - (happy) a sentence loop whose every cycle carries a char loop → the sentence pass runs first; `removed` is 2, while a char-first order would remove more.
   - (boundary) a sentence run that contains a fence → not removed.
   - (boundary) a `MIN_CYCLES`-cycle sentence run under `MIN_RUN_CHARS` → not removed.
   - (empty) normal prose → unchanged, `removed` 0.
   - (boundary) a sentence run whose removed cycles contain `\n\n` → the joint keeps `\n\n`.
   - (boundary) a sentence run whose removed cycles contain `\n` but not `\n\n` → the joint keeps `\n`.
   - (boundary) a sentence run whose removed text has no newline and non-space neighbours → the joint is one space.

### Verify

- Always:
  - `pnpm test:related .pi/extensions/thinking-scrub/scrub/detect.ts .pi/extensions/thinking-scrub/scrub/detect.test.ts`; `pnpm test:run` if nothing is related
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -n "splitUnits\\|detectUnitRuns" .pi/extensions/thinking-scrub/scrub/detect.ts` has the sentence pass
- Added: なし

## 3.live-guard

### Types

```ts
export interface Guard {
  readonly aborts: number;
  readonly scanned: number;
  readonly pending: string | null;
}

export type GuardStep =
  | { readonly kind: 'idle'; readonly guard: Guard }
  | { readonly kind: 'stop'; readonly guard: Guard; readonly sample: string };

export const MIN_THINKING = 20_000;
export const SCAN_EVERY = 2_000;
export const TAIL = 20_000;
export const MAX_ABORTS = 2;

export function emptyGuard(): Guard;
export function observe(guard: Guard, thinking: string): GuardStep;
export function resetOnUser(guard: Guard): Guard;
export function takeFollowUp(
  guard: Guard,
): { readonly guard: Guard; readonly sample: string } | undefined;
export function followUpText(sample: string): string;
```

### Steps

1. `.pi/extensions/thinking-scrub/live/guard.ts`:
   - Add `emptyGuard`, `resetOnUser`, and `takeFollowUp`; `resetOnUser` returns `emptyGuard()`, so a new user prompt starts a new logical run.
   - `observe` returns `idle` below `MIN_THINKING` chars, or when the thinking grew by less than `SCAN_EVERY` chars since `scanned`, or when `aborts` is `MAX_ABORTS` or more.
   - A thinking shorter than `scanned` is a new assistant message: reset `scanned` to 0 before the throttle check, and keep `aborts`.
   - Otherwise it runs `splitUnits` and `detectUnitRuns` on the last `TAIL` chars; a run returns `stop`, with the sample and `aborts + 1`.
   - `followUpText` puts the sample after one instruction: the thinking is repeating, do not repeat it, continue the task; the sample is cut to `SAMPLE_CHARS`, imported from `../scrub/units.ts`.
2. `.pi/extensions/thinking-scrub/live/guard.test.ts`:
   - Build the texts from a factory, and use `MIN_THINKING`, `SCAN_EVERY`, `TAIL`, `MAX_ABORTS` and `SAMPLE_CHARS` by name.
   - (happy) `MIN_THINKING` chars with a `MIN_CYCLES`-cycle run → `stop` with a sample.
   - (boundary) `MIN_THINKING - 1` chars with a run → `idle`.
   - (happy) the same thinking again with less than `SCAN_EVERY` new chars → `idle`.
   - (happy) a run outside the last `TAIL` chars of a 2×`TAIL` thinking → `idle`.
   - (happy) a thinking shorter than `scanned` after a 2×`MIN_THINKING` thinking → `scanned` resets and a `MIN_THINKING` run stops.
   - (boundary) after `MAX_ABORTS` aborts → `idle` at 2×`MIN_THINKING`.
   - (happy) `resetOnUser` returns `emptyGuard`, and `observe` can stop again at `MIN_THINKING`.
   - (happy) a second `stop` before `takeFollowUp` → the pending sample is the latest, and `takeFollowUp` returns it once.
   - (happy) `takeFollowUp` returns the sample once, then `undefined`.
   - (happy) `followUpText` contains the instruction and the sample; a sample over `SAMPLE_CHARS` is cut.

### Verify

- Always:
  - `pnpm test:related .pi/extensions/thinking-scrub/live/guard.ts .pi/extensions/thinking-scrub/live/guard.test.ts`; `pnpm test:run` if nothing is related
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -n "MIN_THINKING\\|SCAN_EVERY\\|MAX_ABORTS" .pi/extensions/thinking-scrub/live/guard.ts` has the limits
- Added: なし

## 4.wiring

### Types

```ts
export interface PiPort {
  readonly on: ExtensionAPI['on'];
  readonly registerCommand: ExtensionAPI['registerCommand'];
  readonly sendMessage: ExtensionAPI['sendMessage'];
}

export interface AbortCtx {
  readonly abort: () => void;
}

export interface WiringOptions {
  readonly settingsDir: string;
  readonly now: () => number;
  readonly followUp: (content: string) => void;
}

export interface ScrubWiring {
  readonly onMessageEnd: (event: MessageEndEvent) => MessageEndEventResult | undefined;
  readonly onMessageUpdate: (event: MessageUpdateEvent, ctx: AbortCtx) => void;
  readonly onAgentSettled: (event: AgentSettledEvent) => void;
  readonly onBeforeAgentStart: (event: BeforeAgentStartEvent) => void;
  readonly onAgentEnd: (ctx: CommandCtx) => void;
  readonly onCommand: (args: string, ctx: CommandCtx) => void;
  readonly getStatus: () => Status;
}
```

### Steps

1. `.pi/extensions/thinking-scrub/index.ts`:
   - Add `PiPort.sendMessage` and `WiringOptions.followUp`.
   - Add `onMessageUpdate`: wrap it in `try`/`catch`; a throw increments `status.failures` and returns without aborting.
   - Return below `MIN_THINKING` chars before reading the settings; read the settings, return when disabled; add a local `thinkingOf(message)` that joins the thinking blocks without requiring `thinkingSignature`; call `observe`; on `stop` set the guard and call `ctx.abort()`.
   - Add `onAgentSettled`: when `event.aborted`, take the pending sample and call `options.followUp(followUpText(sample))`.
   - Add `onBeforeAgentStart`: reset the guard when `event.messageType` is `user`; a custom follow-up does not reset it.
   - Register `message_update`, `message_end`, `agent_settled`, `agent_end`, `before_agent_start` in that order, and pass `followUp` as `pi.sendMessage({ customType: 'thinking-scrub', content, display: true }, { triggerTurn: true })`.
   - Keep the command and the report as they are.
2. `.pi/extensions/thinking-scrub/index.test.ts`:
   - Extend `fakePi` with `sendMessage` (it records the message and the options), add the four handlers to its map, and update the `registerScrub` event list.
   - Extend `fakeCmdCtx` with an `abort` recorder; add `followUp: () => undefined` to every existing `createScrubWiring` and `registerScrub` call.
   - (happy) `onMessageUpdate` at `MIN_THINKING` with a run → `abort` called once.
   - (happy) `onAgentSettled` with `aborted: true` after that → one custom message with the sample; the fake records `customType: 'thinking-scrub'`, `display: true` and `{ triggerTurn: true }`.
   - (happy) `onAgentSettled` with `aborted: false` → no message.
   - (happy) `onBeforeAgentStart` with a user message → the abort count resets; with a custom message → it does not.
   - (boundary) `onMessageUpdate` below `MIN_THINKING` → no abort.
   - (happy) `enabled: false` → `onMessageUpdate` at `MIN_THINKING` with a run → no abort.
   - (happy) a thinking block without `thinkingSignature` at `MIN_THINKING` with a run → abort.
   - (error) a message whose thinking getter throws → `onMessageUpdate` does not throw, and `failures` increments.
   - (happy) the existing `message_end` tests still pass.

### Verify

- Always:
  - `pnpm test:related .pi/extensions/thinking-scrub/index.ts .pi/extensions/thinking-scrub/index.test.ts`; `pnpm test:run` if nothing is related
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -n "onMessageUpdate\\|onAgentSettled\\|onBeforeAgentStart" .pi/extensions/thinking-scrub/index.ts` has the handlers
- Added: なし

## 5.readme

### Types

なし

### Steps

1. `.pi/extensions/thinking-scrub/README.md`:
   - Replace the opening's "accepted as it happened and rewritten after the message is finalized" with the two stages: the live stop at 20,000 chars with a sentence run, and the fold at `message_end`.
   - Replace the char-only threshold sentence with the two thresholds: the sentence's 3 cycles, 400 chars and period 1〜64 units, and the char's existing 4〜120 chars, 3 repeats, 20 chars.
   - The target blocks: the live detection reads the streaming thinking without requiring a signature; the fold keeps the existing signature rule.
   - Add the follow-up: `agent_settled` sends a custom message with the most frequent 3-sentence sample, then the next run starts.
   - Keep the commands, the settings, and the report as they are.
2. `README.md`:
   - The extension list's thinking-scrub line says it stops looped thinking while it is generated and removes it, so it is not carried into the next turn.
3. `README.ja.md`:
   - The extension list's thinking-scrub line says the same in Japanese.

### Verify

- Always:
  - `pnpm test:related .pi/extensions/thinking-scrub/README.md`; `pnpm test:run` if nothing is related
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -n "accepted as it happened" .pi/extensions/thinking-scrub` returns なし
  - `grep -n "20,000" .pi/extensions/thinking-scrub/README.md` has the live stage
  - `grep -n "400" .pi/extensions/thinking-scrub/README.md` has the sentence threshold
  - `grep -n "4〜120" .pi/extensions/thinking-scrub/README.md` has the char threshold
  - `grep -n "stops looped thinking" README.md` has the new line
  - `grep -n "生成中に止め" README.ja.md` has the new line
- Added:
  - other — the agent reads the three READMEs' changed lines: the two stages, the two thresholds, and the signature split are present.

## Notes

### Slice 1: unit-runs

- Findings:
  - なし
- Unplanned:
  - なし
- Commit:
  - 81e9bfd consult(sentence-loop-stop): add sentence unit split and run detection
- Stopped:

### Slice 2: sentence-fold

- Findings:
  - なし
- Unplanned:
  - なし
- Commit:
  - 5d5596d consult(sentence-loop-stop): fold sentence runs before char runs
- Stopped:

### Slice 3: live-guard

- Findings:
  - Verify で 3 件の失敗を確認しました。`SAMPLE_CHARS` を `guard.ts` から読み込んでいたため `undefined` となり、2 件の assertion が型エラーを起こしていました。`../scrub/units.ts` からの読み込みに修正しました。
  - `plainThinking` の工場が `total` 基準で組み立てていたため、結合後の長さが期待より 1 文字短くなり、`scanned` の期待値と一致しませんでした。結合後文字列の長さ基準に修正し、正確な長さを保証しました。
  - `format:check` で `takeFollowUp` の折り返し指摘が 1 件ありました。`pnpm format` で修正し、再確認で通過しました。
- Unplanned:
  - なし
- Commit:
  - 94623b5 consult(sentence-loop-stop): add live thinking guard
- Stopped:

### Slice 4: wiring

- Findings:
  - `lint` で `createScrubWiring` が 101 行となり、上限 80 行を超えていました。状態を `WiringState` にまとめ、`handleMessageEnd`、`handleMessageUpdate`、`handleAgentSettled`、`handleBeforeAgentStart`、`handleAgentEnd`、`handleCommand` に分けて解消しました。
  - `thinkingOf` の `any` 由来の assertion と `for...of` の注釈、`index.test.ts` の複数行にまたがる assertion 位置と不要な `as unknown` を修正しました。`isRecord` による判定と `toMatchObject` による確認に置き換えています。
  - `typecheck` で `message['role']` の比較が意図しない型と判定されました。`unknown` の局所変数に受けて比較する形に修正し、通過しました。
  - Verify は `test:related` 32 件、`typecheck`、`lint`、`format:check`、`grep` のすべてが通過しました。
- Unplanned:
  - なし
- Commit:
  - 2a1a8e9 consult(sentence-loop-stop): wire live stop and follow-up
- Stopped:

### Slice 5: readme

- Findings:
  - 3 件の README を更新しました。拡張 README の冒頭を 2 段階（20,000 文字での生成中停止と `message_end` での畳み込み）に置き換え、文単位としきい値（3 周期、400 文字、1〜64 単位）と文字単位のしきい値（4〜120 文字、3 回、20 文字）を併記しました。
  - 対象ブロックの説明を署名の分け方に更新しました。生成中の検出は署名を求めず、畳み込みは既存の署名規則を保ちます。`agent_settled` での最頻 3 文見本の送付と次 run の開始も追記しました。
  - ルート README と README.ja.md の拡張一覧を更新しました。Verify は `test:run` 889 件、`typecheck`、`lint`、`format:check`、6 件の `grep` のすべてが通過しました。
- Unplanned:
  - なし
- Commit:
  - 6e8ee30 consult(sentence-loop-stop): describe live stop and fold in readmes
- Stopped:

### Cleanup: テストの重複整理

- Findings:
  - `scrub/detect.test.ts` から 5 件を削りました。改行 2 つの周辺空白違い 3 件は同じ振る舞いのため代表 1 件を残し、畳み込み後の再適用 1 件は汎用の再適用試験と重なるため削り、`separatorFor` の空文字 1 件は改行なしの試験と重なるため削りました。
  - `scrub/message.test.ts` から 3 件を削りました。`reasoning_text` の許可署名試験は `reasoning` と同じ振る舞いのため削り、空白付きの全区間試験は単一区間試験と同じ枝のため削り、2 ブロック畳み込みの `chars` 合計試験は単一ブロックの計算式試験と多ブロック試験に覆われるため削りました。
  - `live/guard.test.ts` から 1 件を削りました。`takeFollowUp` の単独 1 回試験は、2 回停止で最新見本と 1 回切りを確かめる試験に含まれるため削りました。
  - `index.test.ts` から 1 件を削りました。`onAgentSettled` の直接 `followUp` 記録試験は、`fakePi.sendMessage` 経由で `customType`・`display`・`triggerTurn` と見本入り内容を確かめる試験と同じ振る舞いのため、後者を残して削りました。
  - 削除後は `pnpm test:run` 879 件、`typecheck`、`lint`、`format:check` がすべて通過しました。
- Unplanned:
  - なし

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
