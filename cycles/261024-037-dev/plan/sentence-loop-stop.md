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
    message.test.ts      update
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
   - `splitUnits` を足す。行に分けてから文に分ける。英語は `.` `!` `?` の後に空白か行末が来たら切り、日本語は `。` `！` `？` で切る。
   - ガードを足す。フェンスの行とフェンスの中、表の行、diff の行を不透明な単位にする。
   - `detectUnitRuns` を足す。単位の本文の極大周期走査で、周期 1..`MAX_PERIOD_UNITS`、長さ `MIN_CYCLES`×周期以上、区間 `MIN_RUN_CHARS` 文字以上、不透明な単位を含まず、重なりは最小の周期でまとめる。
   - `sampleOf` を足す。run の中で最も多い 3 単位の窓。周期が 3 以下なら周期そのもの。`SAMPLE_CHARS` で切る。
2. `.pi/extensions/thinking-scrub/scrub/units.test.ts`:
   - 本文は工場（`sentenceUnit()`）で組み立て、各ケースで直書きしない。
   - (happy) 工場の 2 行の英語 → 4 単位で元の offset を保つ。
   - (happy) 工場の `。` と `！` の日本語 1 行 → その印で分かれ、offset を保つ。
   - (happy) フェンス囲み → 柵の行と中身が不透明。
   - (happy) 表の行と `diff --git` の行 → 不透明。
   - (boundary) 略語で終わる行 → 略語が 1 単位になり、前後がずれない。
   - (happy) `MIN_CYCLES` 周期ぶんの 3 文 → 周期 3 の run が 1 つ。
   - (happy) 工場の周期 6 と 12 が重なる並び → 周期 6 の run が 1 つ。
   - (boundary) `MIN_CYCLES - 1` 周期 → run が無い。
   - (boundary) `MIN_CYCLES` 周期でも `MIN_RUN_CHARS` 文字未満 → run が無い。
   - (boundary) 柵を含む繰り返し → run が無い。
   - (empty) 普通の文章 → run が無い。
   - (happy) 12 単位の run の `sampleOf` → 最頻の 3 単位の窓で、`SAMPLE_CHARS` 以下。
   - (happy) 3 単位の窓が `SAMPLE_CHARS` を超える → `SAMPLE_CHARS` で切れる。
   - (boundary) 2 単位の周期の `sampleOf` → その 2 単位。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/thinking-scrub/scrub/units.ts .pi/extensions/thinking-scrub/scrub/units.test.ts`; 関連が無いときは `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -n "splitUnits\\|detectUnitRuns\\|sampleOf" .pi/extensions/thinking-scrub/scrub/units.ts` で新しいエクスポートがある
- Added: なし

## 2.sentence-fold

### Types

なし

### Steps

1. `.pi/extensions/thinking-scrub/scrub/detect.ts`:
   - `detectRuns` と `separatorFor` はそのまま残す。
   - `scrubThinking` は、まず `splitUnits` と `detectUnitRuns` を呼び、文の run を 2 周期目から消して 1 周期目を残す。
   - そのあと、結果に既存の文字の `detectRuns` を当て、その run を全部消す。
   - `removed` は文の run と文字の run の合計。
   - 区間をまとめて `separatorFor` を各継ぎ目に当てる除去の helper を 1 つ足す。
2. `.pi/extensions/thinking-scrub/scrub/detect.test.ts`:
   - 本文は既存の `unit()` と `repeated()` の工場で組み立てる。
   - (happy) `MIN_CYCLES` 周期の文ループ → 最初の 1 周期が残り、残りが消える。
   - (happy) `repeated()` の文字ループ → 従来通り消える。
   - (happy) すべての周期が文字ループを運ぶ文ループ → 文のパスが先に走り、`removed` は 2。文字が先ならもっと消える。
   - (boundary) 柵を含む文の run → 消えない。
   - (boundary) `MIN_CYCLES` 周期でも `MIN_RUN_CHARS` 文字未満の文の run → 消えない。
   - (empty) 普通の文章 → 変わらず、`removed` は 0。
   - (boundary) 消した周期に `\n\n` を含む文の run → 継ぎ目は `\n\n`。
   - (boundary) 消した周期に `\n` を含み `\n\n` を含まない文の run → 継ぎ目は `\n`。
   - (boundary) 消した本文に改行がなく、両側が空白でない文の run → 継ぎ目は空白 1 つ。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/thinking-scrub/scrub/detect.ts .pi/extensions/thinking-scrub/scrub/detect.test.ts`; 関連が無いときは `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -n "splitUnits\\|detectUnitRuns" .pi/extensions/thinking-scrub/scrub/detect.ts` で文のパスがある
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
   - `emptyGuard`、`resetOnUser`、`takeFollowUp` を足す。`resetOnUser` は `emptyGuard()` を返し、新しい user の合図で論理 run をやり直す。
   - `observe` は `MIN_THINKING` 文字未満、`scanned` からの増分が `SCAN_EVERY` 文字未満、`aborts` が `MAX_ABORTS` 以上のとき `idle` を返す。
   - `scanned` より短い thinking は新しい assistant メッセージ。throttle の前に `scanned` を 0 に戻し、`aborts` は保つ。
   - それ以外は末尾 `TAIL` 文字に `splitUnits` と `detectUnitRuns` を当てる。run があれば `stop` を返し、見本と `aborts + 1` を返す。
   - `followUpText` は、見本の前に 1 つの指示を置く。thinking が繰り返している、繰り返すな、作業を続けろ。見本は `../scrub/units.ts` の `SAMPLE_CHARS` で切る。
2. `.pi/extensions/thinking-scrub/live/guard.test.ts`:
   - 本文は工場で組み立て、`MIN_THINKING`、`SCAN_EVERY`、`TAIL`、`MAX_ABORTS`、`SAMPLE_CHARS` を名前で使う。
   - (happy) `MIN_THINKING` 文字に `MIN_CYCLES` 周期の run → `stop` と見本。
   - (boundary) `MIN_THINKING - 1` 文字に run → `idle`。
   - (happy) 同じ thinking をもう一度、`SCAN_EVERY` 文字未満の増分 → `idle`。
   - (happy) 2×`TAIL` の thinking の最後の `TAIL` 文字の外にある run → `idle`。
   - (happy) 2×`MIN_THINKING` のあとの短い thinking → `scanned` が戻り、`MIN_THINKING` の run で止まる。
   - (boundary) `MAX_ABORTS` 回のあと → 2×`MIN_THINKING` でも `idle`。
   - (happy) `resetOnUser` は `emptyGuard` を返し、`MIN_THINKING` でまた止まれる。
   - (happy) `takeFollowUp` の前に 2 回止まる → 最新の見本が残り、`takeFollowUp` は 1 回だけ返す。
   - (happy) `takeFollowUp` は見本を 1 回返し、次は `undefined`。
   - (happy) `followUpText` は指示と見本を含み、`SAMPLE_CHARS` を超える見本は切れる。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/thinking-scrub/live/guard.ts .pi/extensions/thinking-scrub/live/guard.test.ts`; 関連が無いときは `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -n "MIN_THINKING\\|SCAN_EVERY\\|MAX_ABORTS" .pi/extensions/thinking-scrub/live/guard.ts` で上限がある
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
   - `PiPort.sendMessage` と `WiringOptions.followUp` を足す。
   - `onMessageUpdate` を足す。`try`/`catch` で囲み、投げたら `status.failures` を増やして abort せずに返す。
   - `MIN_THINKING` 文字未満は設定を読む前に返す。設定を読み、無効なら返す。`thinkingSignature` を求めずに thinking ブロックをつなげる `thinkingOf(message)` を足す。`observe` を呼び、`stop` なら guard を入れて `ctx.abort()` を呼ぶ。
   - `onAgentSettled` を足す。`event.aborted` のとき、たまった見本を `takeFollowUp` で取り、`options.followUp(followUpText(sample))` を呼ぶ。
   - `onBeforeAgentStart` を足す。`event.messageType` が `user` のとき guard を戻す。custom のフォローアップでは戻さない。
   - `message_update`、`message_end`、`agent_settled`、`agent_end`、`before_agent_start` の順に登録し、`followUp` に `pi.sendMessage({ customType: 'thinking-scrub', content, display: true }, { triggerTurn: true })` を渡す。
   - コマンドと報告はそのまま残す。
2. `.pi/extensions/thinking-scrub/index.test.ts`:
   - `fakePi` に `sendMessage` を足す（メッセージとオプションを記録する）。4 つのハンドラを map に足し、`registerScrub` のイベント一覧を更新する。
   - `fakeCmdCtx` に `abort` の記録を足す。既存の `createScrubWiring` と `registerScrub` の呼び出しすべてに `followUp: () => undefined` を足す。
   - (happy) `MIN_THINKING` 文字の run で `onMessageUpdate` → `abort` が 1 回。
   - (happy) そのあと `aborted: true` の `onAgentSettled` → 見本入りの custom message が 1 つ。fake は `customType: 'thinking-scrub'`、`display: true`、`{ triggerTurn: true }` を記録する。
   - (happy) `aborted: false` の `onAgentSettled` → メッセージ無し。
   - (happy) user の `onBeforeAgentStart` → abort の回数が戻る。custom では戻らない。
   - (boundary) `MIN_THINKING` 未満の `onMessageUpdate` → abort 無し。
   - (happy) `enabled: false` → `MIN_THINKING` の run で `onMessageUpdate` → abort 無し。
   - (happy) `thinkingSignature` の無い thinking ブロックで `MIN_THINKING` の run → abort。
   - (error) thinking の getter が投げるメッセージ → `onMessageUpdate` は投げず、`failures` が増える。
   - (happy) 既存の `message_end` の試験はそのまま通る。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/thinking-scrub/index.ts .pi/extensions/thinking-scrub/index.test.ts`; 関連が無いときは `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -n "onMessageUpdate\\|onAgentSettled\\|onBeforeAgentStart" .pi/extensions/thinking-scrub/index.ts` でハンドラがある
- Added: なし

## 5.readme

### Types

なし

### Steps

1. `.pi/extensions/thinking-scrub/README.md`:
   - 冒頭の「accepted as it happened and rewritten after the message is finalized」を、2 段階（20,000 文字での生成中停止と `message_end` での畳み込み）に置き換える。
   - 文字だけのしきい値の文を、2 つのしきい値に置き換える。文は 3 周期、400 文字、周期 1〜64 単位。文字は既存の 4〜120 文字、3 回、20 文字。
   - 対象ブロック: 生成中の検出は署名を求めず、畳み込みは既存の署名規則を保つ。
   - フォローアップを足す。`agent_settled` で最頻の 3 文の見本入りの custom message を送り、次の run が始まる。
   - コマンド、設定、報告はそのまま残す。
2. `README.md`:
   - 拡張一覧の thinking-scrub の行を、生成中に止めて取り除き、次のターンに持ち越さない、とする。
3. `README.ja.md`:
   - 同じ内容を日本語で書く。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/thinking-scrub/README.md`; 関連が無いときは `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -n "accepted as it happened" .pi/extensions/thinking-scrub` が なし
  - `grep -n "20,000" .pi/extensions/thinking-scrub/README.md` で生成中の段階がある
  - `grep -n "400" .pi/extensions/thinking-scrub/README.md` で文のしきい値がある
  - `grep -n "4〜120" .pi/extensions/thinking-scrub/README.md` で文字のしきい値がある
  - `grep -n "stops looped thinking" README.md` で新しい行がある
  - `grep -n "生成中に止め" README.ja.md` で新しい行がある
- Added:
  - other — agent が 3 件の README の変更行を読む。2 段階、2 つのしきい値、署名の分け方が揃っている。

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
  - なし — `.pi/extensions/thinking-scrub/README.md:1` の二段階の説明と `.pi/extensions/thinking-scrub/scrub/detect.ts:4` の文周期の注記を確認し、古い文言の残存は見当たりませんでした。
    - left: 古い文言の残存がなく、直す対象がないため手を付けない。
- Unlisted:
  - `.pi/extensions/thinking-scrub/scrub/message.test.ts:69` の前後で 3 件の削除が行われていますが、Files では `scrub/message.test.ts` に `update` の記載がなく、変更が名指しされていません。
    - fixed: Files の `scrub/message.test.ts` に `update` を追記した。
- Gaps:
  - `.pi/extensions/thinking-scrub/index.ts:201` の `aborted: true` かつ `pending` が無い場合に何も送らない分岐を確かめる検査がありません。
    - fixed: `index.test.ts` の `onAgentSettled` に `aborted: true でも pending が無い → 何も送らない` を足した。
  - `.pi/extensions/thinking-scrub/scrub/units.ts:210` の `MAX_PERIOD_UNITS` を超える周期を無視する振る舞いを確かめる検査がありません。
    - fixed: `units.test.ts` の `detectUnitRuns` に周期 `MAX_PERIOD_UNITS + 1` の繰り返しは run 無しの試験を足した。
- Unproven:
  - `.pi/extensions/thinking-scrub/scrub/units.test.ts:178` の周期 3 の見本試験は、最頻 3 文窓でも同じ結果になるため、`run.period <= 3` の分岐を外しても緑のままです。
    - fixed: `units.test.ts` の `sampleOf` に周期 1 は 1 文だけの試験を足し、3 文窓との違いで分岐を運動させた。
  - `.pi/extensions/thinking-scrub/index.test.ts:318` の `MIN_THINKING` 未満の試験は abort しないことのみを見ており、設定読みより先に戻る順序を壊しても緑のままです。
    - left: 順序は性能のための早期 return で振る舞いに差が出ず、順序を観測する試験は実装に結合して脆くなるため足さない。
- Noise:
  - `.pi/extensions/thinking-scrub/live/guard.test.ts:86` の `SCAN_EVERY - 1000` における `1000` は根拠の示されない魔数です。
    - fixed: `SCAN_EVERY - 1` で 1 文字足りない境界に直し、差が `SCAN_EVERY - 1` であることを断定させた。
  - `.pi/extensions/thinking-scrub/live/guard.test.ts:171` の `thinkingWithRun(500).slice(0, 60)` における `500` と `60` は根拠の示されない魔数です。
    - fixed: 短い見本を `loopSentence(0)` の 1 文に直し、魔数を消した。
- Doubts:
  - `.pi/extensions/thinking-scrub/scrub/units.ts:248` の窓照合キーに NUL 文字が含まれ、git が binary 扱いになる点が気になりましたが、振る舞いには影響しないため所見としません。
    - left: NUL 区切りは衝突避けの意図で、振る舞いに影響がなく git の扱いも実害がないため直さない。

### Round 2

- Stale: なし — Round 1 に `fixed:` の行はなく、確認対象は無い。
- Unlisted: なし — `## Files` の `scrub/message.test.ts update` を確認した。
- Gaps: なし — `aborted: true` で pending 無しの試験と、`MAX_PERIOD_UNITS + 1` の試験を確認した。
- Unproven: なし — 周期 1 の見本試験を確認した。
- Noise: なし — `SCAN_EVERY - 1` の境界と、`loopSentence(0)` の見本を確認した。
- Doubts:
  - テストの実行による緑の確認は行っておらず、読み合わせでの確認にとどまる。最終の緑は別途の実行記録に任せる。

## Acceptance

- Ran:
  - `pnpm test:related` をスライスごとに実施: `units` 103、`detect` 78、`guard` 41、`index` 32。README は `pnpm test:run` で代替。
  - `pnpm typecheck`、`pnpm lint`、`pnpm format:check`、計画の `grep` を実施。
  - 全体の `pnpm typecheck` と `pnpm test:run`（55 ファイル、882 件）を実施。
  - 3 件の README の変更行を読んだ。
  - 壊して戻す 3 件: `sentenceSpans` は 5 件、`handleMessageUpdate` は 5 件、`sampleOf` は 6 件が赤。いずれも復旧して緑に戻した。
- Findings:
  - なし。
- Doubts:
  - なし。
