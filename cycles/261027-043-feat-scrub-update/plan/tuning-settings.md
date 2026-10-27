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

- Findings: なし
- Unplanned: なし
- Commit: efb7589 consult(tuning-settings): add live sentence char tuning to settings
- Stopped:

### Slice 2: tuning-injection

- Findings: なし
- Unplanned: `observe` が `sentence` を受けず live 経路で既定文設定に落ちていた穴を修正。`observe(guard, thinking, live, sentence)` にして `detectUnitRuns` に渡し、配線と試しを更新。以降は 5 引数系（`live, sentence, enabled`）で続ける。
- Commit: 0f48108 consult(tuning-settings): inject tuning into guard scrub and wiring
- Stopped:

### Slice 3: scan-read

- Findings: なし
- Unplanned: `observe` の 5 引数が `max-params` に触れたため `Tuning` 受け（`observe(guard, thinking, tuning, enabled)`）に集約。`index.test.ts` が `max-lines` に触れたため重複の writePatch 試しを統合。
- Commit: 24b59cc consult(tuning-settings): cache settings and read on scan
- Stopped:

### Slice 4: readme-pair

- Findings:
  - `proofreader` による `README.ja.md` の校正は、主担当が実行した（`13b1079`）。
    - fixed: `memo-readme-ja.md` に写して校正し、直した内容を worktree に戻した。
- Unplanned: なし
- Commit: 7e59f3d consult(tuning-settings): document tuning groups in readme pair
- Stopped:

### Cleanup: 重複と誰も気づかない試しの整理

- Findings: なし
- Unplanned: なし
- Dropped (7 件、Suite は 748 → 741 件で全緑):
  - `scrub/message.test.ts`「thinkingSignature が無い」 — 計画の「署名の無いループ」と入力・断定が同一のため落とし、計画側を残した。
  - `index.test.ts`「退化した thinking を持つ assistant」 — 計画の「okSettings と message_end」と同一のため落とし、計画側を残した。
  - `command/scrub.test.ts`「lastAt が null」 — 計画の 4 行完全一致が `SCRUB_LAST_NONE` を含むため落とした。
  - `command/scrub.test.ts`「空文字と空白だけ」 — 既定出力は計画の完全一致と同一で、`'   '` 分岐は trim の前提のため落とした（未使用の `SCRUB_PREFIX` 輸入も除去）。
  - `live/guard.test.ts`「scanEvery 未満だけ足す」 — Slice 3 の「間隔が来ていないとき」（idle＋不呼び出し）が包含するため落とした。
  - `live/guard.test.ts`「maxAborts 回のあと」 — Slice 3 の「MAX_ABORTS に達したら」（idle＋scanned＋不呼び出し）が包含するため落とした。
  - `scrub/detect.test.ts`「空文字」 — 空文字専用の分岐は無く長さ門を通るだけで誰も気づかないため落とした（通常文の否定は残した）。
- Kept: `read.test.ts` のディレクトリ件（読み失敗分岐の唯一の被覆）、`followUpText` の印字件と幅件、`onAgentEnd` の書式件と集計リセット件、閾値の二層件（合成の釘）。

## Review

### Round 1

- Stale:
  - `.pi/extensions/thinking-scrub/live/guard.test.ts:142` — 題名の `MAX_ABORTS` は `live/guard.ts` で消えた定数であり、`live.maxAborts` に直さないと Slice 2・3 の Verify の grep に残る。
    - fixed: 題名を `live.maxAborts に達したら…` に直し、両ファイルの grep が空になることを確認した。
  - `.pi/extensions/thinking-scrub/index.test.ts:405` — 題名の `MAX_ABORTS` は同じく消えた定数であり、`live.maxAborts` に直さないと Slice 3 の Verify の grep に残る。
    - fixed: 題名を `live.maxAborts に達したら読まず…` に直し、両ファイルの grep が空になることを確認した。
- Unlisted:
  - なし — `git diff d41efd5..HEAD --name-only` の製品 19 件は Files の印付きと一致し、残りは plan md 自身である。
- Gaps:
  - なし — Slices の試しは全件が対応する test にあり、Added の表突き合わせ（`settings.json` と README の既定値一致）と校正（`memo-readme-ja.md` 消去済み）を確認した。
- Unproven:
  - `.pi/extensions/thinking-scrub/scrub/detect.test.ts:45` — `abcd`×4 は 16 文字で `minLength`（20）未満のため `minRepeats` の判定を壊しても緑のままであり、繰り返し境界の釘は `scrubThinking` の二層件（`detect.test.ts:115`）だけになる。
    - fixed: 10 文字周期で `minRepeats - 1` 回（20 文字、長さ門は通過）→ 0 区間・`minRepeats` 回 → 1 区間の件を足し、`detectRuns` 層で繰り返し境界を釘付けした。
  - `.pi/extensions/thinking-scrub/index.test.ts:483` — 読回数を数えないため `handleCommand` のキャッシュ更新（`index.ts:281`）を消しても緑のままであり、走査が来れば再読で `enabled:false` を拾って同じく止まらない。
    - fixed: 「command off の後」件に読回数の断定（作成 1・走査 2・命令更新 3・次走査 4）を足し、更新行を消すと落ちることを確認した。
- Noise:
  - なし — 計画が決めた値（`20000`・`5000`・`10`・`66` など）は対象外とし、新規の断定は変数か入力の反復で魔法数を使わないことを確認した。
- Doubts:
  - `.pi/extensions/thinking-scrub/settings/read.ts:4` — 「入口は毎回読み直す」が関数自体（呼ぶたび読む）の説明か配線の旧動作かに読め、紛らわしい。
  - `.pi/extensions/thinking-scrub/index.ts:91` — 既存の独自調整値を `writePatch` が残す振る舞いに test が無く、計画の範囲外のため所見に留める。
  - `.pi/extensions/thinking-scrub/settings/schema.ts:122` — 部分群での `scanEvery` と既定 `tail` の衝突など計画の列挙外の分岐に test が無く、範囲外のため所見に留める。

### Round 2

- Stale:
  - 修正を確認いたしました — `.pi/extensions/thinking-scrub/live/guard.test.ts:142` の `fixed:`（題名の `MAX_ABORTS` → `live.maxAborts`）は直っております。現行題名は `live.maxAborts に達したら、scanned が進み、enabled が呼ばれない` であり、当該ファイルに `MAX_ABORTS`・`MIN_THINKING`・`SCAN_EVERY` の残存はなく（大小無視の grep で 0 件）、参照先の `live/guard.ts:64` も `live.maxAborts` であります。
  - 修正を確認いたしました — `.pi/extensions/thinking-scrub/index.test.ts:405` の `fixed:`（同上）は直っております。現行題名は `live.maxAborts に達したら読まず、scanned が進む` であり、当該ファイルに旧定数名の残存はなく（同 grep で 0 件）、Slice 2・3 の Verify の grep に残りません。
- Unlisted:
  - なし — 今回は `### Round 1` の `fixed:` 4 件のみを確認対象とするため、`Unlisted` には `fixed:` がございません。
- Gaps:
  - なし — 同上の理由により、`Gaps` には `fixed:` がございません。
- Unproven:
  - 修正を確認いたしました — `.pi/extensions/thinking-scrub/scrub/detect.test.ts:45` の `fixed:`（繰り返し境界の釘）は直っております。現行 `detect.test.ts:52-61` に `minRepeats 未満の繰り返し → 0 区間、minRepeats 回 → 1 区間` があり、10 文字周期（`'a'×9＋'b'`）で `minRepeats-1` 回＝20 文字（`minLength` 20 と同値で長さ門を通過）→ 0 区間、`minRepeats` 回 → 1 区間を見ており、`minLength` 不足（旧 `abcd`×4＝16 文字）と切り分けて `minRepeats` だけを `detectRuns` 層で釘付けしております。既定値は `settings/schema.ts:52` の `minRepeats: 3, minLength: 20` と整合しております。
  - 修正を確認いたしました — `.pi/extensions/thinking-scrub/index.test.ts:483` の `fixed:`（`handleCommand` のキャッシュ更新の釘）は直っております。現行 `index.test.ts:483-518` の「command off の後」件は読回数を `1`（作成時）・`2`（走査）・`3`（命令更新）・`4`（次走査）と数えており、更新行の `index.ts:281`（`state.settings = settingsOf(options.readSettings())`）があればこそ `3` と `4` が進みます。行を消せば `3` 以降が進まず落ちる構造であり、釘付けになっております。
- Noise:
  - なし — 同上の理由により、`Noise` には `fixed:` がございません。
- Doubts:
  - Doubts: なし — 上記 4 件のほか、所見に至らない疑義はございません。

## Acceptance

- Ran: `pnpm test:run`（55 ファイル 742 件）、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`。`README.ja.md` の `proofreader`（`13b1079`）。`settings/schema.ts` の `scanEvery > tail` を外すと `schema.test.ts` の 1 件が赤になり、`index.ts` の `handleCommand` のキャッシュ更新を外すと `index.test.ts` の 1 件が赤になり、`live/guard.ts` の無効時の `scanned` 前進を外すと `guard.test.ts` の 1 件が赤になることを確かめ、戻した。
- Findings: なし
- Doubts: `settings/read.ts:4` の文言、`index.ts:91` の独自値の保持、`settings/schema.ts:122` の部分群の衝突。
