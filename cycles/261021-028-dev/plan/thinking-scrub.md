# PLAN `thinking-scrub`

## Files

```text
.pi/
  extensions/
    thinking-scrub/
      index.ts                     add
      index.test.ts                add
      scrub/
        detect.ts                  add
        detect.test.ts             add
        message.ts                 add
        message.test.ts            add
      settings/
        schema.ts                  add
        schema.test.ts             add
        read.ts                    add
        read.test.ts               add
      state/
        cell.ts                    add
        cell.test.ts               add
      command/
        scrub.ts                   add
        scrub.test.ts              add
      settings.json                add
      README.md                    add
DEFINITION.md                      update
README.md                          update
README.ja.md                       update
```

- `.pi/tsconfig.json` と `scripts/checks/scopes.json` は `.pi` 配下を既に型検査の対象にしている（変更なし）。
- `vitest.starter.config.ts` は全件を走らせるので、新しいテストは自動で入る（変更なし）。

## 1.検出と除去

### Types

```ts
/** 周期が続いた区間。開始位置と長さ */
export interface Run {
  readonly at: number;
  readonly length: number;
}

/** 取り除いた結果。`removed` は区間の数 */
export interface Scrub {
  readonly text: string;
  readonly removed: number;
}

export const MIN_PERIOD = 4;
export const MAX_PERIOD = 120;
export const MIN_REPEATS = 6;
export const MIN_LENGTH = 60;

/** 周期が続く区間を、重なりをまとめて昇順で返す */
export function detectRuns(text: string): readonly Run[];

/** 区間を取り除いた本文を返す。区間が無ければ同じ文字列を返す */
export function scrubThinking(text: string): Scrub;
```

### Steps

1. `.pi/extensions/thinking-scrub/scrub/detect.ts`:
   - 周期 `p` を `MIN_PERIOD` から `MAX_PERIOD` まで走査し、`MIN_REPEATS` 回以上かつ `MIN_LENGTH` 文字以上続く極大区間を集め、重なりをまとめて昇順で返す。
   - `scrubThinking` は区間を消し、消した境目の前後がどちらも空白でないときだけ空白 1 個を挟む。
   - 区間が無ければ本文をそのまま返し、`removed` を 0 にする。
2. `.pi/extensions/thinking-scrub/scrub/detect.test.ts`:
   - 既存の純関数テスト（`.pi/extensions/quality-gate/report.test.ts`）の形に合わせ、fixture は関数の中で組み立てる。

### Verify:

- test: `pnpm test:related .pi/extensions/thinking-scrub/scrub/detect.test.ts` → `.pi/extensions/thinking-scrub/scrub/detect.test.ts`
  - (happy) `"the *"` を 12 回並べた本文 → `detectRuns` が 1 区間を返し、`scrubThinking` の `removed` が 1、本文から並びが消える
  - (boundary values) 同じ並びが 5 回 → `removed` が 0、本文が同一
  - (boundary values) 同じ並びが 6 回で区間 59 文字 → `removed` が 0、区間 60 文字 → `removed` が 1
  - (boundary values) 周期 3 文字の連続 → `removed` が 0、周期 4 文字 → 1
  - (boundary values) 周期 120 文字の連続 → `removed` が 1
  - (boundary values) 周期 121 文字の連続 → `removed` が 0
  - (empty) 空文字と、反復の無い文章 → どちらも `removed` が 0、本文が同一
  - (happy) 離れた 2 か所に区間 → `removed` が 2、区間が昇順
  - (boundary values) 同じ並びが複数の周期で当たる区間 → 1 区間にまとまる
  - (happy) 境目の前後がどちらも非空白 → 空白 1 個が入る
  - (boundary values) 境目の前後どちらかが空白 → 空白を足さない
  - (second call) `scrubThinking` の結果にもう一度かける → `removed` が 0、本文が同一
  - _no case_: 引数が文字列以外 — 型で閉じる。

## 2.メッセージの書き換え

### Types

```ts
/** replay 先のフィールド名。この 3 つだけ本文が次のリクエストに届く */
export const REPLAY_FIELDS: readonly ['reasoning_content', 'reasoning', 'reasoning_text'];

/** この拡張が読む thinking ブロックの形 */
export interface ThinkingBlock {
  readonly type: 'thinking';
  readonly thinking: string;
  readonly thinkingSignature?: string;
  readonly redacted?: boolean;
}

/** 差し替えの結果。`removed` は取り除いた区間の数 */
export interface Scrubbed {
  readonly message: AgentMessage;
  readonly removed: number;
}

/** 本文が次のリクエストに届くブロックか */
export function isReplayable(block: ThinkingBlock): boolean;

/** assistant の thinking を書き換える。変わらなければ undefined */
export function scrubMessage(message: AgentMessage): Scrubbed | undefined;
```

### Steps

1. `.pi/extensions/thinking-scrub/scrub/message.ts`:
   - `isReplayable` は `redacted` が真なら偽、`thinkingSignature` が `REPLAY_FIELDS` のいずれかなら真、それ以外は偽を返す。
   - `scrubMessage` は role が assistant でない、content が配列でない、対象ブロックが無い、`removed` が 0 のいずれかなら `undefined` を返す。
   - 対象ブロックの `thinking` だけを差し替え、`thinkingSignature` と他のフィールドはそのまま写す。
2. `.pi/extensions/thinking-scrub/scrub/message.test.ts`:
   - `.pi/extensions/consult/sub/spec.test.ts` の形に合わせ、assistant メッセージの組み立ては関数の中で行う。

### Verify:

- test: `pnpm test:related .pi/extensions/thinking-scrub/scrub/message.test.ts` → `.pi/extensions/thinking-scrub/scrub/message.test.ts`
  - (happy) `thinkingSignature` が `reasoning_content` で退化した本文 → 差し替えが返り、そのブロックの `thinking` が `scrubThinking` の結果と一致して区間を含まない
  - (boundary values) `thinkingSignature` が `reasoning` → 対象になる
  - (boundary values) `thinkingSignature` が `reasoning_text` → 対象になる
  - (empty) `thinkingSignature` が無い → `undefined`
  - (empty) `thinkingSignature` が JSON 文字列（`reasoning_details`）→ `undefined`
  - (empty) 対象ブロックが無い配列 → `undefined`
  - (error) `redacted` が真 → `undefined`
  - (error) role が assistant 以外 → `undefined`
  - (error) content が配列でない assistant → `undefined`
  - (happy) 2 ブロックのうち 1 つだけ退化 → その 1 つだけ書き換わり、もう 1 つは同じ値
  - (happy) 差し替え後も `thinkingSignature` と `usage` と `stopReason` と `timestamp` が同じ値
  - _no case_: a second call — 除去後の本文は「退化の無い本文」と同じ入力になり、その case が覆う。

## 3.設定と状態

### Types

```ts
/** 拡張の設定。`settings.json` と 1 対 1 */
export interface Settings {
  readonly enabled: boolean;
}

/** 設定を読んだ結果 */
export type SettingsRead =
  | { readonly kind: 'ok'; readonly settings: Settings }
  | { readonly kind: 'broken'; readonly reason: string };

/** この拡張の状態。セッションの間だけ持つ */
export interface Status {
  readonly removed: number;
  readonly lastAt: number | null;
  readonly failures: number;
}

export const SETTINGS_FILE = 'settings.json';

/** 既定の設定 */
export function defaultSettings(): Settings;

/** 読んだ文字列を設定にする。型が違えば broken */
export function parseSettings(text: string): SettingsRead;

/** `<dir>/settings.json` を読む。無ければ既定 */
export function readSettings(dir: string): SettingsRead;

/** 何も無い状態 */
export function emptyStatus(): Status;

/** 畳んだ結果を足した状態 */
export function addScrub(status: Status, removed: number, at: number): Status;

/** 失敗を足した状態 */
export function addFailure(status: Status): Status;
```

### Steps

1. `.pi/extensions/thinking-scrub/settings/schema.ts`:
   - `defaultSettings` は `enabled` を真で返す。
   - `parseSettings` は JSON として読めない、オブジェクトでない、`enabled` が真偽値でないとき `broken` を返す。
   - `enabled` が無いオブジェクトは既定の真として `ok` を返す。
2. `.pi/extensions/thinking-scrub/settings/read.ts`:
   - `.pi/extensions/intent-router/settings/read.ts` と同じ形で、ENOENT だけ既定に落とし、他の読み込み失敗は `broken` にする。
3. `.pi/extensions/thinking-scrub/state/cell.ts`:
   - `emptyStatus`、`addScrub`、`addFailure` はどれも新しい `Status` を返し、渡された状態を書き換えない。
4. `.pi/extensions/thinking-scrub/settings/schema.test.ts`、`settings/read.test.ts`、`state/cell.test.ts`:
   - ファイルを読むテストは `test/tmp.ts` を使う。

### Verify:

- test: `pnpm test:related .pi/extensions/thinking-scrub/settings/schema.test.ts .pi/extensions/thinking-scrub/settings/read.test.ts .pi/extensions/thinking-scrub/state/cell.test.ts` → 上の 3 ファイル
  - (happy) `{"enabled":false}` → `ok` で `enabled` が偽
  - (happy) `{"enabled":true}` → `ok` で `enabled` が真
  - (happy) `{}` → `ok` で `enabled` が真
  - (error) `{"enabled":` → `broken`
  - (boundary values) `{"enabled":"no"}` → `broken`
  - (boundary values) `null` と `[]` → どちらも `broken`
  - (empty) ファイルが無い → `ok` で既定
  - (error) ファイルがディレクトリ → `broken`
  - (error) `{"enabled":` を書いたファイル → `broken`
  - (happy) 既に使われた状態に `addScrub(status, 3, 100)` → `removed` が元の値に 3 を足した値、`lastAt` が 100
  - (second call) `addScrub` を 3 と 2 で 2 回 → `removed` が 5、`lastAt` が後の値
  - (error) `addFailure` → `failures` が 1 増え、他が変わらない
  - (empty) `emptyStatus()` → `removed` が 0、`lastAt` が null、`failures` が 0
  - (happy) 3 つのどれを呼んでも、渡した状態の値が変わらない

## 4.コマンド

### Types

```ts
/** `/thinking-scrub` の引数 */
export type ScrubCommand =
  | { readonly kind: 'set'; readonly enabled: boolean }
  | { readonly kind: 'status' }
  | { readonly kind: 'invalid'; readonly raw: string };

/** 引数無しは status。前後の空白を落として小文字に直し、`on` / `off` だけを受け、他の語は invalid */
export function parseCommand(raw: string): ScrubCommand;

/** コマンドが読む口 */
export interface CommandPort {
  readonly settings: () => SettingsRead;
  readonly status: () => Status;
  readonly writeEnabled: (enabled: boolean) => void;
}

/** 引数を実行し、表示する行を返す */
export function runCommand(port: CommandPort, command: ScrubCommand, at: number): readonly string[];
```

### Steps

1. `.pi/extensions/thinking-scrub/command/scrub.ts`:
   - `parseCommand` は前後の空白を落として小文字に直し、`on` / `off` / 空文字だけを解釈する。
   - `runCommand` は `set` のとき `writeEnabled` を呼び、`on` / `off` の行を返す。
   - `status` のとき有効か、畳んだ回数、直近の時刻（無ければ「まだ無い」）を返す。
   - `settings` が `broken` のときは、その旨と既定で動いている旨を返す。
   - `invalid` のときは使い方の 1 行を返す。
2. `.pi/extensions/thinking-scrub/command/scrub.test.ts`:
   - `.pi/extensions/intent-router/command/intent.test.ts` の形に合わせ、`CommandPort` は記録する偽物で渡す。

### Verify:

- test: `pnpm test:related .pi/extensions/thinking-scrub/command/scrub.test.ts` → `.pi/extensions/thinking-scrub/command/scrub.test.ts`
  - (happy) `off` → `writeEnabled(false)` が 1 回呼ばれ、off の行が返る
  - (happy) `on` → `writeEnabled(true)` が 1 回呼ばれ、on の行が返る
  - (empty) 空文字と、空白だけの `"   "` → どちらも `writeEnabled` が呼ばれず、状態の行が返る
  - (error) `foo` → `writeEnabled` が呼ばれず、使い方の行が返る
  - (boundary values) `" off "` → `set` で偽
  - (boundary values) `ON` → `set` で真
  - (empty) `lastAt` が null の状態 → 「まだ無い」の行
  - (happy) `lastAt` が数値の状態 → その時刻の行
  - (error) `settings` が `broken` のときの `status` → 壊れている旨と既定で動いている旨の行
  - (error) `settings` が `broken` のときの `off` → `writeEnabled(false)` が呼ばれ、off の行が返る
  - _no case_: a second call — `runCommand` は状態を持たず、2 回目は 1 回目と同じ枝を通る（状態の持ち越しは slice 5 が見る）。

## 5.配線と説明

### Types

```ts
/** この拡張が pi に求める口だけ。テストは on と registerCommand を記録する偽物を渡す */
export interface PiPort {
  readonly on: ExtensionAPI['on'];
  readonly registerCommand: ExtensionAPI['registerCommand'];
}

export interface WiringOptions {
  readonly settingsDir: string;
  readonly now: () => number;
}

/** 拡張の配線。既定の export は自分のディレクトリと時計でこれを呼ぶ */
export function registerScrub(pi: PiPort, options: WiringOptions): void;
```

### Steps

1. `.pi/extensions/thinking-scrub/index.ts`:
   - `registerScrub` は `message_end` を 1 つ登録し、毎回 `readSettings` で設定を読み直す。
   - 有効かつ差し替えがあるときだけ `{ message }` を返し、状態に区間の数を足す。
   - 例外は握りつぶさず、`addFailure` で数えて `undefined` を返す。
   - `/thinking-scrub` を登録し、`runCommand` の行を通知する。
   - 設定の書き換えは `settings.json` を読み直して `enabled` だけ変えて書き戻す。
   - 既定の export は `dirname(fileURLToPath(import.meta.url))` を設定の場所にし、`Date.now` を渡す。
2. `.pi/extensions/thinking-scrub/settings.json`:
   - `{"enabled": true}` を置く。
3. `.pi/extensions/thinking-scrub/index.test.ts`:
   - `.pi/extensions/sound-notify/index.test.ts` の形に合わせ、`PiPort` は `on` と `registerCommand` を記録する偽物で渡す。
4. `.pi/extensions/thinking-scrub/README.md`:
   - 何をするか、`/thinking-scrub` の引数、`settings.json`、対象ブロックの条件を書く。
5. `README.md`、`README.ja.md`:
   - 拡張の一覧に `thinking-scrub` を 1 文で足す。
6. `DEFINITION.md`:
   - `Users can do` に `thinking-scrub` の行を足す。

### Verify:

- test: `pnpm test:related .pi/extensions/thinking-scrub/index.test.ts` → `.pi/extensions/thinking-scrub/index.test.ts`
  - (happy) `registerScrub` → `on('message_end')` が 1 回、`registerCommand('thinking-scrub')` が 1 回
  - (happy) 退化した thinking を持つ assistant を handler に渡す → `{ message }` が返り、thinking から区間が消えている
  - (empty) 退化の無い assistant → `undefined`
  - (empty) role が assistant 以外、対象でない署名の assistant → どちらも `undefined`
  - (error) 設定が `enabled: false` → `undefined`
  - (happy) 設定が壊れている → 既定で差し替えが返り、状態の `failures` は増えない
  - (error) handler の中で例外が起きる（差し替えの途中で投げる偽物）→ `undefined` が返り、`failures` が 1 増える
  - (happy) コマンド `off` → `settings.json` の `enabled` が偽になり、次の `message_end` は `undefined`
  - (happy) コマンド `on` → その後の `message_end` が差し替えを返す
  - (happy) コマンドが引数無し → 通知が 1 回呼ばれ、`runCommand` の行が渡る
  - (second call) 2 回畳む → 状態の `removed` が 2 回分の合計
  - (happy) 置いた `settings.json` を `readSettings` で読む → `enabled` が真
  - _no case_: README と DEFINITION の行 — 文書は型でも検査でも決まらず、review と acceptance の look が読む。

## 6.統合: thinking-scrub の全体

### Types

なし

### Steps

1. `.pi/extensions/thinking-scrub/index.ts`:
   - 4 つの検査が通る形に整える（この段で挙動は変えない）。

### Verify:

- cli: `pnpm test:run .pi/extensions/thinking-scrub && pnpm typecheck && pnpm lint && pnpm format:check`
  - (happy) 全部 exit 0 → 拡張の全テストと、型・lint・整形の検査に落ちた行が無い

## Notes

### Slice 1: 検出と除去

- Findings:
  - なし
- Unplanned:
  - 3 文字周期の繰り返しが 6 文字周期としても当たり下限が抜ける穴を、1〜3 文字周期でも当たる区間は数えない形で塞いだ
- Commit: 4ebc976 consult(thinking-scrub): detect and scrub periodic runs

### Slice 2: メッセージの書き換え

- Findings:
  - なし
- Unplanned:
  - なし
- Commit: bd63093 consult(thinking-scrub): rewrite replayable thinking blocks

### Slice 3: 設定と状態

- Findings:
  - なし
- Unplanned:
  - なし
- Commit: 31bd9f5 consult(thinking-scrub): add settings and session state

### Slice 4: コマンド

- Findings:
  - なし
- Unplanned:
  - なし
- Commit: bccc601 consult(thinking-scrub): add thinking-scrub command

### Slice 5: 配線と説明

- Findings:
  - なし
- Unplanned:
  - registerScrub の void 戻りでは removed の合計と failures を検査できない穴を、配線の中身を持つ createScrubWiring（handlers と getStatus）を足して塞いだ
- Commit: 2844a21 consult(thinking-scrub): wire message_end and command

### Slice 6: 統合: thinking-scrub の全体

- Findings:
  - なし
- Unplanned:
  - なし
- Commit: 74ebe11 consult(thinking-scrub): pass full checks for thinking-scrub

### Test cleanup

- Dropped `detectRuns` の 12 回 test (`scrubThinking` の 12 回 test と同じ fixture・同じ区間の主張): 後者に `detectRuns` の形の assert を移し、plan の 1 bullet に 1 test に戻した
- Dropped `同じ並びが複数の周期で当たる区間` の test (`'abcd'`×15 は周期 4 の test と同じ fixture・同じ 1 区間の主張): 重なりのまとめは 12 回 test が周期 5 と 10 の両当たりで覆う
- 他の 6 ファイルに同じ振る舞いの重なり・消えた振る舞いの test・取らなくなった枝の test は無かった
- Suite: 63 → 61 tests, `test:run` と `typecheck` と `lint` と `format:check` は緑

## Review

### Round 1

- Stale:
  - なし
- Unlisted:
  - なし
- Gaps:
  - status が `enabled: false` のときの表示がどの check でも exercised されていない — `.pi/extensions/thinking-scrub/command/scrub.ts:62` の enabled 行は `true`(既定) と `broken`(既定 true) の status しか test が無く、plan slice 4 Verify に disabled-status の bullet が無い。`.pi/extensions/thinking-scrub/command/scrub.test.ts:15` は既定 `enabled: true`、`.pi/extensions/thinking-scrub/command/scrub.test.ts:47,74,80,87` はいずれも `true`/broken のみで `enabled: false` + status が無い
    fixed: `enabled:false` + status の test を `command/scrub.test.ts` に足し、off/回数/時刻の 3 行を `toEqual` で固めた
- Unproven:
  - `同じ並びが 5 回` の test は `MIN_REPEATS` を証明しない — `.pi/extensions/thinking-scrub/scrub/detect.test.ts:35` の text は `unit()` 5 回で 25 文字 (`MIN_LENGTH` 60 未満) のため、`MIN_REPEATS` を 5 以下に壊しても `removed` は 0 のままで緑。`.pi/extensions/thinking-scrub/scrub/detect.ts:65` の `length >= period * MIN_REPEATS` の後者が exercised されていない
    fixed: fixture を 12 文字パターン×5 回 (60 文字) に変え、`MIN_LENGTH` を通して `MIN_REPEATS` だけが落とす形にした
  - `role が assistant 以外` の test は role guard を証明しない — `.pi/extensions/thinking-scrub/scrub/message.test.ts:115` は `user` + `text` block (thinking が無い) のため、`.pi/extensions/thinking-scrub/scrub/message.ts:56` の role 判定を外しても `removed` が 0 で `undefined` のまま緑。role を分離するには `user` + replayable thinking が要る
    fixed: fixture を `user` + 退化 thinking (assistant なら `defined`) に変え、role guard が無ければ落ちる形にした
  - `content が配列でない` の test は array guard を証明しない — `.pi/extensions/thinking-scrub/scrub/message.test.ts:124` の `'oops'` は string として iterate でき各 char は thinking でないため、`.pi/extensions/thinking-scrub/scrub/message.ts:59` の `Array.isArray` を外しても `removed` が 0 で `undefined` のまま緑
    fixed: fixture を thinking 入りの `Set` に変え、`Array.isArray` が無ければ拾って `defined` になる形にした

- Doubts:
  - `onCommand` の set で 2 回書き込む (`index.ts` の直接 + `runCommand` 経由) は最終状態が同じで plan Verify が書き込み回数を数えないため finding にしない — `.pi/extensions/thinking-scrub/index.ts:93` と `.pi/extensions/thinking-scrub/index.ts:100`
    left: 最終状態が同じで書き込み回数は Verify の対象外のため拾わない
  - 既定 export の `dirname(fileURLToPath(import.meta.url))` + `Date.now` に専用 check が無いのは配線の定型で Verify の bullet が無いため finding にしない — `.pi/extensions/thinking-scrub/index.ts:128`
    left: 配線の定型で Verify の bullet が無いため拾わない
  - 純粋 block (`"the *"` x12 単体) が `""` か `" "` かは plan Steps が端の空白を定めず Verify が `not.toContain` のみのため finding にしない — `.pi/extensions/thinking-scrub/scrub/detect.test.ts:26`
    left: plan が端の空白を定めず Verify が `not.toContain` のみのため拾わない
  - `周期 4` の fixture (`'abcd'` x15) が周期 8 でも当たる高調波の点は `MIN_PERIOD` が decided value で small-guard (`1〜3` 文字除外) は周期 3 の test で覆うため finding にしない — `.pi/extensions/thinking-scrub/scrub/detect.ts:19`
    left: `MIN_PERIOD` は decided value で small-guard は周期 3 の test が覆うため拾わない
  - `settings.json` の他キー保持 (`{...readDoc, enabled}`) に保持確認の test が無い点は Verify が `enabled` の値のみを bullet にするため finding にしない — `.pi/extensions/thinking-scrub/index.ts:54`
    left: Verify が `enabled` の値のみを bullet にするため拾わない

### Round 2

- Stale: なし（Round 1 に fixed 行なし。確認対象なし）
- Unlisted: なし（Round 1 に fixed 行なし。確認対象なし）
- Gaps: なし（Round 1 の1件は直っている。`.pi/extensions/thinking-scrub/command/scrub.test.ts:87` が `enabled:false` + status で `toEqual` 3 行を固め、`.pi/extensions/thinking-scrub/command/scrub.ts:62-64` の enabled 行・回数・時刻と一致する）
- Unproven: なし（Round 1 の3件は直っている。`scrub/detect.test.ts:35` は 12 文字×5 回・60 文字で `MIN_LENGTH` を通し `MIN_REPEATS` だけが落とす形で `.pi/extensions/thinking-scrub/scrub/detect.ts:65` と一致する。`scrub/message.test.ts:115` は `user` + 退化 thinking で role 判定が無ければ `defined` になる形で `.pi/extensions/thinking-scrub/scrub/message.ts:56` と一致する。`scrub/message.test.ts:121` は thinking 入り `Set` で `Array.isArray` が無ければ拾って `defined` になる形で `.pi/extensions/thinking-scrub/scrub/message.ts:59` と一致する）
- Doubts: なし

## Acceptance

- Ran:
  - `pnpm test:run .pi/extensions/thinking-scrub` → exit 0（7 ファイル 62 件）
  - `pnpm test:run` → exit 0（50 ファイル 835 件）
  - `pnpm typecheck` → exit 0（root: ok、.pi: ok）
  - `pnpm lint` → exit 0
  - `pnpm format:check` → exit 0
  - 3 つの振る舞いを壊して、plan の検査が赤になることを確かめて戻した。
    - `scrub/message.ts` の `Array.isArray` を外す → `content が配列でない assistant → undefined` が赤。
    - `scrub/detect.ts` の `MIN_REPEATS` を 5 にする → `同じ並びが 5 回 → removed が 0` が赤。
    - `index.ts` の `enabled: false` の early return を外す → `設定が enabled: false → undefined` が赤。
- Findings:
  - なし
- Doubts:
  - `onCommand` は `enabled` を 2 回書き込む（直接と `runCommand` 経由）。最終状態は同じで、書き込み回数は検査していない。
  - 既定 export の `dirname(fileURLToPath(import.meta.url))` と `Date.now` は検査していない。
  - `settings.json` の他のキーを保つことは検査していない（`enabled` の値だけを見ている）。
  - 純粋な繰り返しだけの本文は `""` か `" "` になる。plan の Steps は端の空白を定めていない。
