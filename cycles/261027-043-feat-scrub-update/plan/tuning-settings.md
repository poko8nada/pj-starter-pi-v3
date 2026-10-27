# PLAN `tuning-settings`

- No: 01, 02

## Files

```text
.pi/
  extensions/
    thinking-scrub/
      settings/
        schema.ts            update
        schema.test.ts       update
        read.ts
        read.test.ts         update
      settings.json          update
      index.ts               update
      index.test.ts          update
      live/
        guard.ts             update
        guard.test.ts        update
      scrub/
        units.ts             update
        units.test.ts        update
        detect.ts            update
        detect.test.ts       update
        message.ts           update
        message.test.ts      update
      command/
        scrub.ts
        scrub.test.ts        update
      README.md              update
      README.ja.md           add
README.md                    update
README.ja.md                 update
```

## Slices

## 1.settings-shape

### Types

```ts
export interface LiveTuning {
  readonly minThinking: number;
  readonly scanEvery: number;
  readonly tail: number;
  readonly maxAborts: number;
  readonly sampleChars: number;
}

export interface SentenceTuning {
  readonly minCycles: number;
  readonly minRunChars: number;
  readonly maxPeriodUnits: number;
}

export interface CharTuning {
  readonly minPeriod: number;
  readonly maxPeriod: number;
  readonly minRepeats: number;
  readonly minLength: number;
}

export interface Tuning {
  readonly live: LiveTuning;
  readonly sentence: SentenceTuning;
  readonly char: CharTuning;
}

export interface Settings extends Tuning {
  readonly enabled: boolean;
  readonly show: boolean;
}

export type SettingsRead =
  | { readonly kind: 'ok'; readonly settings: Settings }
  | { readonly kind: 'broken'; readonly reason: string };

export function defaultSettings(): Settings;

export function parseSettings(text: string): SettingsRead;
```

### Steps

1. `.pi/extensions/thinking-scrub/settings/schema.ts`:
   - `LiveTuning`、`SentenceTuning`、`CharTuning`、`Tuning` を足し、`Settings` を `Tuning` の拡張にします。`defaultSettings` に 3 グループの既定値を入れ、`parseSettings` はグループを読み、キーが無ければ既定、型違い・範囲外・`scanEvery > tail`・`minPeriod > maxPeriod`・`minRepeats < 2` は `broken` にします。
2. `.pi/extensions/thinking-scrub/settings.json`:
   - `live`、`sentence`、`char` の 3 グループを、今の既定値で足します。
3. `.pi/extensions/thinking-scrub/settings/schema.test.ts`:
   - (happy) 3 グループとフラグを持つ JSON → `ok` で、その値が返る。
   - (empty) `{}` → `ok` で、`defaultSettings()` が返る。
   - (error) `enabled` が文字列 → `broken`。
   - (error) `live.minThinking` が文字列 → `broken`。
   - (error) `live.scanEvery` が `0` → `broken`。
   - (error) `live.scanEvery` が `live.tail` より大きい → `broken`。
   - (error) `sentence.minCycles` が `1` → `broken`。
   - (error) `char.minPeriod` が `5` で `char.maxPeriod` が `4` → `broken`。
   - (error) `char.minRepeats` が `1` → `broken`。
   - (boundary) `live.scanEvery` が `live.tail` と等しい → `ok`。
4. `.pi/extensions/thinking-scrub/settings/read.test.ts`:
   - (happy) 3 グループを持つファイル → `ok`。
   - (empty) ファイルが無い → `ok` で、既定が返る。
   - (error) 壊れた JSON → `broken`。
5. `.pi/extensions/thinking-scrub/index.ts`:
   - `writePatch` を、`defaultSettings()`、`readDoc` の内容、パッチの順に重ねる形にします。ファイルが無い、または壊れていても、3 グループを持つ完全なファイルを書きます。
     - Outside: `pi 本体の ExtensionAPI`。イベントとコマンドの形を保つ。
     - Outside: `node のファイル読み書き`。`readFileSync` と `writeFileSync` を保つ。
6. `.pi/extensions/thinking-scrub/index.test.ts`:
   - `okSettings()` を `defaultSettings()` にし、`onCommand` の既存の完全一致の期待を、3 グループを持つ完全なファイルに更新します。
   - (happy) `writePatch` を、ファイルが無い所に当てる → 3 グループとパッチを持つ完全なファイルができる。
   - (happy) `writePatch` を、壊れたファイルに当てる → 既定の 3 グループとパッチを持つ完全なファイルができる。
   - (happy) `command off` の後 → 3 グループが残り、`enabled` が `false` になる。
   - (happy) 既存の `command on` と `hide` → 3 グループが残り、`enabled` と `show` が変わる。
7. `.pi/extensions/thinking-scrub/command/scrub.test.ts`:
   - (happy) `runCommand` に 3 グループの `SettingsRead` と `status` を渡す → `thinking-scrub: on`、`show: on`、`removed: 0`、`last: まだ無い` が返る。
   - (happy) `runCommand` に `off` を渡す → `writeEnabled(false)` が記録され、`thinking-scrub: off` が返る。
   - (error) `runCommand` に壊れた `SettingsRead` と `status` を渡す → `broken` と `defaults` を含む行と、既定の行が返る。
8. `.pi/extensions/thinking-scrub/README.md`:
   - 設定の節の `{ "enabled": true, "show": true }` と `re-read on every message_end` を、3 グループとスキャン時の読みの形に更新します。

### Verify

- Always:
  - `pnpm test:related <このスライスで変えたファイル>`。関連が無ければ `pnpm test:run`。
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `{ "enabled": true, "show": true }`、`re-read on every message_end`、旧キー名を、変えたファイルで大小無視して探し、残っていないこと。
- Added: なし

## 2.tuning-injection

### Types

```ts
export function observe(guard: Guard, thinking: string, live: LiveTuning): GuardStep;

export function followUpText(sample: string, sampleChars: number): string;

export function detectUnitRuns(
  units: readonly Unit[],
  sentence: SentenceTuning,
): readonly UnitRun[];

export function sampleOf(units: readonly Unit[], run: UnitRun, sampleChars: number): string;

export function detectRuns(text: string, char: CharTuning): readonly Run[];

export function scrubThinking(text: string, tuning: Tuning): Scrub;

export function scrubMessage(message: AgentMessage, tuning: Tuning): Scrubbed | undefined;
```

### Steps

1. `.pi/extensions/thinking-scrub/live/guard.ts`:
   - `observe` の引数に `live` を足し、`MIN_THINKING`、`SCAN_EVERY`、`TAIL`、`MAX_ABORTS` の参照を `live.*` に置き換えます。`sampleOf(units, first, live.sampleChars)` を呼び、`followUpText` は `sampleChars` を受け取ります。
2. `.pi/extensions/thinking-scrub/live/guard.test.ts`:
   - (happy) `defaultSettings().live` と `thinkingWithRun(20000)` → `stop`。
   - (boundary) `19999` 文字 → `idle`。
   - (boundary) `SCAN_EVERY - 1` 文字だけ足す → `idle`。
   - (boundary) `TAIL * 2` 文字でランが窓の外 → `idle`。
   - (boundary) `MAX_ABORTS` に達する → `idle`。
   - (happy) `live.minThinking` を `5000` にした設定で、5,000 文字のラン → `stop`。
   - (boundary) `live.maxAborts` を `0` にした設定 → `idle`。
   - (happy) `followUpText(sample, 10)` → 見本が 10 文字に切られる。
3. `.pi/extensions/thinking-scrub/scrub/units.ts`:
   - `detectUnitRuns` の引数に `sentence` を足し、`MIN_CYCLES`、`MIN_RUN_CHARS`、`MAX_PERIOD_UNITS` の参照を `sentence.*` に置き換えます。`sampleOf` は `sampleChars` を受け取ります。
4. `.pi/extensions/thinking-scrub/scrub/units.test.ts`:
   - (happy) `defaultSettings().sentence` と 3 周期の並び → 1 つのラン。
   - (boundary) `MIN_CYCLES - 1` 周期 → 0 個。
   - (boundary) `MIN_RUN_CHARS - 1` 文字 → 0 個。
   - (boundary) 周期 6 と 12 が重なる並び → 周期 6 の 1 つ。
   - (happy) `sentence.minRunChars` を `200` にした設定で、240 文字のラン → 1 つ。
5. `.pi/extensions/thinking-scrub/scrub/detect.ts`:
   - `detectRuns` に `char`、`sentenceSpans` に `sentence`、`scrubThinking` に `tuning` を足し、`MIN_PERIOD`、`MAX_PERIOD`、`MIN_REPEATS`、`MIN_LENGTH` の参照を `char.*` に置き換えます。
6. `.pi/extensions/thinking-scrub/scrub/detect.test.ts`:
   - (happy) `defaultSettings().char` と `abcd` × 5 回 → 1 区間。
   - (boundary) `abcd` × 4 回 → 0 区間。
   - (boundary) 周期 `MIN_PERIOD - 1` 文字 → 0 区間。
   - (boundary) 周期 `MAX_PERIOD` 文字 → 1 区間、`MAX_PERIOD + 1` 文字 → 0 区間。
   - (happy) `char.minRepeats` を `2` にした設定で、20 文字の周期 → 1 区間。
   - (boundary) `char.maxPeriod` を `20` にした設定で、周期 `21` 文字 → 0 区間。
7. `.pi/extensions/thinking-scrub/scrub/message.ts`:
   - `scrubMessage` に `tuning` を足し、`scrubThinking(block.thinking, tuning)` を呼びます。
     - Outside: `モデルの提供元の thinking の署名`。`REPLAY_FIELDS` を保つ。
8. `.pi/extensions/thinking-scrub/scrub/message.test.ts`:
   - (happy) `defaultSettings()` と署名付きのループ → 差し替える。
   - (happy) `char.minLength` を `100` にした設定で、66 文字の退化 → 差し替えない。
   - (error) 署名の無いループ → 差し替えない。
9. `.pi/extensions/thinking-scrub/index.ts`:
   - `readSettings` の `Settings` を、`observe`、`scrubMessage`、`followUpText` に渡します。`readEnabled` と `readShow` は `Settings` を受ける形にします。
     - Outside: `pi 本体の ExtensionAPI`。イベントとコマンドの形を保つ。
10. `.pi/extensions/thinking-scrub/index.test.ts`:
    - (happy) `okSettings` と `message_end` → 3 グループの既定値で差し替える。
    - (happy) `char.minLength` を `100` にした設定と `message_end` → 66 文字の退化を差し替えない。
    - (happy) `command off` と `command on` の既存の完全一致の期待 → 3 グループを持つ完全なファイルのまま。

### Verify

- Always:
  - `pnpm test:related <このスライスで変えたファイル>`。関連が無ければ `pnpm test:run`。
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `MIN_THINKING`、`SCAN_EVERY`、`TAIL`、`MAX_ABORTS`、`MIN_CYCLES`、`MIN_RUN_CHARS`、`MAX_PERIOD_UNITS`、`MIN_PERIOD`、`MAX_PERIOD`、`MIN_REPEATS`、`MIN_LENGTH`、`SAMPLE_CHARS` を、変えたファイルで大小無視して探し、残っていないこと。
- Added:
  - other — `guard.test.ts`、`units.test.ts`、`detect.test.ts`、`message.test.ts` の custom 値のケースで、`Tuning` の注入を確かめる。

## 3.scan-read

### Types

```ts
interface WiringState {
  status: Status;
  tally: Tally;
  guard: Guard;
  settings: Settings;
}

export function observe(
  guard: Guard,
  thinking: string,
  live: LiveTuning,
  enabled: () => boolean,
): GuardStep;
```

### Steps

1. `.pi/extensions/thinking-scrub/live/guard.ts`:
   - `observe` に `enabled` を足します。`MIN_THINKING`、`MAX_ABORTS`、`SCAN_EVERY` の判定の後、`enabled()` が偽なら、`scanned` を今の長さに進めて `idle` を返します。`MAX_ABORTS` に達したときも、`scanned` を今の長さに進めます。
2. `.pi/extensions/thinking-scrub/live/guard.test.ts`:
   - (happy) 無効のとき、間隔が来たスキャンで `scanned` が進む。
   - (happy) 間隔が来ていないとき、`enabled` が呼ばれない。
   - (boundary) `MAX_ABORTS` に達したら、`scanned` が進み、`enabled` が呼ばれない。
3. `.pi/extensions/thinking-scrub/index.ts`:
   - `WiringState` に `settings` を足し、`createScrubWiring` で `readSettings` を 1 回呼んで入れます。壊れていれば `defaultSettings()` にします。
   - `handleMessageUpdate` は、キャッシュの `minThinking`、`maxAborts`、`scanEvery` で門を作り、`MAX_ABORTS` に達していたら `scanned` を今の長さに進めて返します。スキャンが来たときだけ `readSettings` を 1 回呼んでキャッシュを更新し、`observe` に新しい `live` と `enabled` を渡します。
   - `handleMessageEnd` と `handleAgentEnd` は、`readSettings` でキャッシュを更新してから使います。
   - `handleCommand` は、`runCommand` の後に `readSettings` でキャッシュを更新します。
   - `index.ts:5` の「設定は毎回読み直す」を、スキャン時と `message_end` の読みに更新します。
     - Outside: `pi 本体の ExtensionAPI`。イベントとコマンドの形を保つ。
     - Outside: `node のファイル読み書き`。`readFileSync` を保つ。
4. `.pi/extensions/thinking-scrub/index.test.ts`:
   - (happy) 作成時に 1 回読み、`minThinking` 未満では読まない。
   - (happy) 差分が `scanEvery` 未満なら読まない。
   - (happy) 差分が `scanEvery` 以上なら 1 回読み、ランがあれば止まる。
   - (boundary) `MAX_ABORTS` に達したら読まず、`scanned` が進む。
   - (happy) 無効のとき、間隔ごとに 1 回だけ読み、`scanned` が進む。
   - (happy) `command off` の後、次の更新でキャッシュが効いて止まらない。
   - (happy) `message_end` の後、キャッシュが新しい設定になる。
   - (happy) 既存の `1 回の message_end → readSettings を 1 回呼ぶ` を、作成時の 1 回と `message_end` の 1 回の 2 回に更新する。
5. `.pi/extensions/thinking-scrub/README.md`:
   - 設定の節の読みの1文を、手編集は次のスキャンまで、`message_end` とコマンドは即時、に更新します。

### Verify

- Always:
  - `pnpm test:related <このスライスで変えたファイル>`。関連が無ければ `pnpm test:run`。
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `設定は毎回読み直す` と `re-read on every message_end` を、変えたファイルで大小無視して探し、残っていないこと。
- Added: なし

## 4.readme-pair

### Types

なし

### Steps

1. `.pi/extensions/thinking-scrub/README.md`:
   - 言語リンクを先頭に置き、設定の節を `live`、`sentence`、`char` の 3 グループの表にします。各キーに説明、既定、上げたとき、下げたとき、注意を書きます。組み合わせの節と、`8000`/`1000`/`350` の調整例を書きます。
2. `.pi/extensions/thinking-scrub/README.ja.md`:
   - 新規作成し、英語版と同じ表と節を日本語で書きます。作成後に base の一時ファイルへ写し、`proofreader` に通し、直した内容を worktree に戻します。
     - Outside: `proofreader`。作成後に校正する。
3. `README.md`:
   - 拡張の `thinking-scrub` の行に、`.pi/extensions/thinking-scrub/README.md` へのリンクを足します。
4. `README.ja.md`:
   - 拡張の `thinking-scrub` の行に、`.pi/extensions/thinking-scrub/README.ja.md` へのリンクを足します。

### Verify

- Always:
  - `pnpm test:related <このスライスで変えたファイル>`。関連が無ければ `pnpm test:run`。
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `{ "enabled": true, "show": true }`、`re-read on every message_end`、旧キー名を、変えたファイルで大小無視して探し、残っていないこと。
- Added:
  - other — `.pi/extensions/thinking-scrub/README.md` と `README.ja.md` の表のキーを `settings.json` のキーと突き合わせ、欠落と既定値違いが無いことを確かめる。
  - other — worktree の `.pi/extensions/thinking-scrub/README.ja.md` を base の `memo-readme-ja.md` に写し、`proofreader` に渡し、`fixed` と `kept` を読み、直した内容を worktree に戻して `memo-readme-ja.md` を消す。

## Notes

### Slice 1: settings-shape

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 2: tuning-injection

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 3: scan-read

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 4: readme-pair

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
