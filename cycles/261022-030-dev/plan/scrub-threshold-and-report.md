# PLAN `scrub-threshold-and-report`

## Files

```text
.pi/
  extensions/
    thinking-scrub/
      index.ts                      update
      index.test.ts                 update
      README.md                     update
      settings.json                 update
      command/
        scrub.ts                    update
        scrub.test.ts               update
      scrub/
        detect.ts                   update
        detect.test.ts              update
        message.ts                  update
        message.test.ts             update
      settings/
        schema.ts                   update
        schema.test.ts              update
        read.ts
        read.test.ts
      state/
        cell.ts                     update
        cell.test.ts                update
```

## Slices

## 1.検出の下限を下げ、繋ぎ目に改行を戻す

### Types

```ts
なし;
```

### Steps

1. `.pi/extensions/thinking-scrub/scrub/detect.ts`:
   - `MIN_REPEATS` を 3 に、`MIN_LENGTH` を 20 にする。
   - `scrubThinking` の繋ぎ目で、取り除いた区間が `\n\n` を含むなら `\n\n` を、`\n` だけを含むなら `\n` を入れ、そのときは繋ぎ目の両側の空白を先に落とす。
   - 区間が改行を含まないときだけ、今までどおり両側が非空白なら空白 1 つを入れる。
2. `.pi/extensions/thinking-scrub/scrub/detect.test.ts`:
   - 下限に依存している既存のケースを新しい下限に合わせ、下のケースを足す。

### Verify:

- test: `pnpm vitest run --config vitest.starter.config.ts .pi/extensions/thinking-scrub/scrub/detect.test.ts`
  - (happy) `foo` + `the *` × 5 + `bar`（25 文字、旧下限の 60 文字に届かない）→ 区間 1、`foo bar`
  - (boundary values) 周期 12 文字の 5 回（60 文字）→ 区間 1、消える（旧下限の 6 回に届かない）
  - (boundary values) 周期 30 文字の 2 回（60 文字）→ 区間 0、本文そのまま
  - (boundary values) 周期 4 文字の 5 回（20 文字）→ 区間 1、消える
  - (boundary values) 周期 4 文字の 4 回（16 文字）→ 区間 0、本文そのまま
  - (boundary values) 周期 3 文字の連続 → 区間 0、本文そのまま
  - (happy) `foo` + `\n\nThe **` × 5 + `bar`（区間が `\n\n` を含む）→ `foo\n\nbar`
  - (happy) `foo ` + `\n\nThe **` × 5 + `bar`（区間が `\n\n` を含み、左の端が空白）→ `foo\n\nbar`（空白は残らない）
  - (happy) `foo` + `\nabcd` × 12 + `bar`（区間が `\n` だけを含む）→ `foo\nbar`
  - (empty) 空文字 → 区間 0、本文そのまま
  - (boundary values) 畳んだ結果 `foo\n\nbar` をもう一度かける → 区間 0、本文そのまま
  - _no case_: `MAX_PERIOD` の 121 文字 — 既存のケースがそのまま通る
  - _no case_: 反復の無い文章 — 既存のケースがそのまま通る

## 2.設定に show を持たせる

### Types

```ts
export interface Settings {
  readonly enabled: boolean;
  readonly show: boolean;
}

export function defaultSettings(): Settings;
```

### Steps

1. `.pi/extensions/thinking-scrub/settings/schema.ts`:
   - `Settings` に `show` を足し、`defaultSettings` は `show: true` を返す。
   - `parseSettings` が `show` も読む。無ければ真、真偽値でなければ `broken`。
   - `enabled` と `show` の欠落は、それぞれ独立に既定で埋める。
2. `.pi/extensions/thinking-scrub/settings.json`:
   - `{ "enabled": true, "show": true }` にそろえる。
3. `.pi/extensions/thinking-scrub/settings/schema.test.ts`:
   - 既存の期待を `show` 込みに直し、下のケースを足す。
4. `.pi/extensions/thinking-scrub/index.test.ts`:
   - 実ファイルを読む既存のケースを、`enabled` と `show` の両方を見るように直す。

### Verify:

- test: `pnpm vitest run --config vitest.starter.config.ts .pi/extensions/thinking-scrub/settings/schema.test.ts .pi/extensions/thinking-scrub/index.test.ts`
  - (happy) `{"enabled":true,"show":false}` → ok、`{ enabled: true, show: false }`
  - (empty) `{}` → ok、`{ enabled: true, show: true }`（既定を値で書く）
  - (boundary values) `{"enabled":false}` → ok、`{ enabled: false, show: true }`
  - (boundary values) `{"show":false}` → ok、`{ enabled: true, show: false }`
  - (error) `{"show":"yes"}` → broken
  - (error) `{"enabled":"no"}` → broken
  - (error) `null` と `[]` → どちらも broken
  - (error) `{"enabled":` → broken
  - (happy) リポジトリの `settings.json` を `readSettings` で読む → `{ enabled: true, show: true }`

## 3.show と hide をコマンドに足す

### Types

```ts
export type ScrubCommand =
  | { readonly kind: 'set'; readonly enabled: boolean }
  | { readonly kind: 'display'; readonly show: boolean }
  | { readonly kind: 'status' }
  | { readonly kind: 'invalid'; readonly raw: string };

export interface CommandPort {
  readonly settings: () => SettingsRead;
  readonly status: () => Status;
  readonly writeEnabled: (enabled: boolean) => void;
  readonly writeShow: (show: boolean) => void;
}
```

### Steps

1. `.pi/extensions/thinking-scrub/command/scrub.ts`:
   - `parseCommand` が `show` を `display` 真、`hide` を `display` 偽として受ける。
   - `runCommand` が `display` で `writeShow` を呼び、`thinking-scrub: show` / `thinking-scrub: hide` を返す。
   - status の行に `show: on` / `show: off` を足す。`status` は `settings.show` を読む。
2. `.pi/extensions/thinking-scrub/command/scrub.test.ts`:
   - `fakePort` の既定の settings を `{ enabled: true, show: true }` に直し、`writeShow` の記録を足し、下のケースを足す。
3. `.pi/extensions/thinking-scrub/index.ts`:
   - `writeEnabled` と `writeShow` が同じ読み書きを通るようにし、`onCommand` から `writeShow` を渡す。

### Verify:

- test: `pnpm vitest run --config vitest.starter.config.ts .pi/extensions/thinking-scrub/command/scrub.test.ts .pi/extensions/thinking-scrub/index.test.ts`
  - (happy) `show` → `writeShow(true)` が 1 回、`writeEnabled` が 0 回、`thinking-scrub: show`
  - (happy) `hide` → `writeShow(false)` が 1 回、`writeEnabled` が 0 回、`thinking-scrub: hide`
  - (boundary values) `SHOW` → `display` 真
  - (boundary values) `on` / `off` → `set` で、`writeEnabled` が 1 回、`writeShow` が 0 回
  - (boundary values) settings が `show: false` のときの status → 行に `show: off` が入る
  - (empty) `` → どちらも呼ばれず、status の行が返る
  - (error) `foo` → 1 行だけで `usage` を含み、どちらも呼ばれない
  - (happy) `onCommand('hide')` → `settings.json` の `show` が偽になり、`enabled` はそのまま

## 4.消した量を持ち、実行の終わりに 1 行で出す

### Types

```ts
// scrub/message.ts
export interface Scrubbed {
  readonly message: AgentMessage;
  readonly removed: number;
  readonly chars: number;
}

// state/cell.ts
export interface Tally {
  readonly runs: number;
  readonly chars: number;
}

export function emptyTally(): Tally;

export function addTally(tally: Tally, runs: number, chars: number): Tally;

// index.ts
export interface ScrubWiring {
  readonly onMessageEnd: (event: MessageEndEvent) => MessageEndEventResult | undefined;
  readonly onAgentEnd: (ctx: CommandCtx) => void;
  readonly onCommand: (args: string, ctx: CommandCtx) => void;
  readonly getStatus: () => Status;
}
```

### Steps

1. `.pi/extensions/thinking-scrub/scrub/message.ts`:
   - `Scrubbed` に `chars` を足す。値はブロックごとの「元の長さ − 畳んだあとの長さ」の合計。
2. `.pi/extensions/thinking-scrub/state/cell.ts`:
   - `Tally`、`emptyTally`、`addTally` を足す。どれも渡された値を書き換えない。
3. `.pi/extensions/thinking-scrub/index.ts`:
   - `message_end` で `chars` を実行の中の合計に足す。
   - `onAgentEnd` を足す。設定の `show` が真で、合計が 0 でなければ `ctx.ui.notify('thinking-scrub: removed <runs> (<chars> chars)', 'info')` を 1 回呼び、合計を戻す。`show` が偽なら何も出さずに合計を戻す。
   - `registerScrub` が `agent_end` を `onAgentEnd` につなぐ。
4. `.pi/extensions/thinking-scrub/scrub/message.test.ts`:
   - `chars` のケースを足す。
5. `.pi/extensions/thinking-scrub/state/cell.test.ts`:
   - `emptyTally` と `addTally` のケースを足す。
6. `.pi/extensions/thinking-scrub/index.test.ts`:
   - `registerScrub` のイベント期待を `message_end` と `agent_end` に直し、偽の `ctx` が `notify` の第 2 引数も記録するようにして、下のケースを足す。

### Verify:

- test: `pnpm vitest run --config vitest.starter.config.ts .pi/extensions/thinking-scrub`
  - (happy) 退化 thinking（長さ 51 → 畳んで 25）の `message_end` が 2 回、そのあと `agent_end` → `notify` が 1 回、文が `thinking-scrub: removed 2 (52 chars)` と一致する
  - (happy) `notify` の第 2 引数が `info`
  - (empty) 何も消していない状態で `agent_end` → `notify` が呼ばれない
  - (boundary values) `settings.json` が `show: false` のとき、`message_end` のあと `agent_end` → `notify` が呼ばれない
  - (boundary values) `notify` のあと再度 `agent_end` → 2 回目は呼ばれない
  - (boundary values) `notify` のあとに `message_end` → `agent_end` → もう一度 1 回呼ばれ、文の数がその実行の分だけになる
  - (happy) `emptyTally()` → `{ runs: 0, chars: 0 }`、`addTally` を 2 回 → 合計、渡した値は変わらない
  - (happy) `scrubMessage` の `chars` が「元の長さ − 畳んだ長さ」に一致する（長さの分かる本文で）
  - (happy) `registerScrub` → `message_end` と `agent_end` の 2 つを登録する
  - (error) `message_end` で例外 → `failures` が 1 増え、そのあとの `agent_end` は `notify` を呼ばない

## 5.README を新しい下限と表示に合わせる

### Types

```ts
なし;
```

### Steps

1. `.pi/extensions/thinking-scrub/README.md`:
   - しきい値を「周期 4〜120 文字、3 回以上、20 文字以上」に直す。
   - 繋ぎ目で改行を戻すことを書く。
   - `/thinking-scrub show` / `hide` と、既定が表示であることを書く。
   - 1 回の実行の終わりに、消した回数と文字数が 1 行で出ることを書く。

### Verify:

- read: `code` サブエージェントが `.pi/extensions/thinking-scrub/README.md` を読み、次の 4 点が書かれているかを報告する。書き手と同じ会話でなく、スライスを終えたあとに読む。
  - (happy) 周期 4〜120 文字・3 回以上・20 文字以上 → 報告に 4 つの数が挙がる
  - (happy) 繋ぎ目に改行を戻す → 報告にその記述が挙がる
  - (happy) `/thinking-scrub show` と `hide`、既定は表示 → 報告にその記述が挙がる
  - (happy) 実行の終わりに 1 行、回数と文字数 → 報告にその記述が挙がる
  - (error) 4 点のどれかが README に無い → 報告でその点が「書かれていない」と挙がる

## 6.統合: しきい値を下げたスクラブと、実行の終わりの 1 行

### Types

```ts
なし;
```

### Steps

1. `.pi/extensions/thinking-scrub/index.test.ts`:
   - 下の統合のケースを足す。

### Verify:

- test: `pnpm vitest run --config vitest.starter.config.ts .pi/extensions/thinking-scrub && pnpm typecheck`
  - (happy) thinking が `foo` + `\n\nThe **` × 5 + `bar`（旧下限の 60 文字に届かない細切れの退化で、区間が `\n\n` を含む）→ `message_end` の返り値の thinking が `foo\n\nbar`、そのあとの `agent_end` で `notify` が 1 回、文に `removed 1` が入る
  - (empty) thinking が `The **` × 2（12 文字で下限に届かない）→ `message_end` が `undefined`、`agent_end` でも `notify` が呼ばれない
  - (happy) `hide` を書いた設定で `foo` + `\n\nThe **` × 5 + `bar` を通す → `message_end` は差し替えを返し、`agent_end` で 1 行も出ない

## Notes

### Slice 1: 検出の下限を下げ、繋ぎ目に改行を戻す

- Findings: なし
- Unplanned: なし
- Commit: b7f5c35

### Slice 2: 設定に show を持たせる

- Findings: なし
- Unplanned: なし
- Commit: 6e6163c

### Slice 3: show と hide をコマンドに足す

- Findings: なし
- Unplanned: なし
- Commit: 210bc02

### Slice 4: 消した量を持ち、実行の終わりに 1 行で出す

- Findings: なし
- Unplanned: なし
- Commit: 6b59fd4

### Slice 5: README を新しい下限と表示に合わせる

- Findings: なし
- Unplanned: なし
- Commit: 86c6d01

### Slice 6: 統合: しきい値を下げたスクラブと、実行の終わりの 1 行

- Findings: なし
- Unplanned: なし
- Commit: c0abfcf

### Test cleanup

- Dropped (5):
  - `settings/schema.test.ts` の `{"enabled":false}` 重複ケース（入力と期待が同一の 2 件のうち 1 件。残りが Verify の `{"enabled":false}` を担う）
  - `index.test.ts` の `onMessageEnd` 例外ケース（`failures` +1 と `undefined` の断定が `onAgentEnd` の例外ケースに包含されるため）
  - `command/scrub.test.ts` の `on / off → writeShow は呼ばれない`（`on`/`off` の各ケースが既に `shown` 空を断定しているため）
  - `scrub/detect.test.ts` の `周期 4 文字の連続（abcd×15、60 文字）`（周期 4 の検出は `周期 4 文字を 5 回（20 文字）` の境界ケースが担い、長尺は他が担うため）
  - `scrub/detect.test.ts` の `同じ並びが 6 回で区間 60 文字`（旧下限の 6 回・60 文字の境界で、3 回・20 文字への変更後は内側になるため）
- Counts: before 95 → after 90（detect 21→19、schema 10→9、command 16→15、index 22→21、message 16、cell 7、read 3 は不変）
- Suite: `pnpm vitest run --config vitest.starter.config.ts .pi/extensions/thinking-scrub` 90 passed、`pnpm typecheck` ok

## Review

### Round 1

- Stale:
  - `.pi/extensions/thinking-scrub/command/scrub.ts:4` -- header comment still says only `on`/`off`, false after `show`/`hide` added in parseCommand (.pi/extensions/thinking-scrub/command/scrub.ts:28-33).
    - fixed: header を `on`/`off` と `show`/`hide` を受ける旨に直した。
  - `.pi/extensions/thinking-scrub/command/scrub.ts:38` -- `usageLine()` still `[on|off]`, omits `show`/`hide`; change made usage text stale.
    - fixed: `usageLine()` を `[on|off|show|hide]` に直し、`foo` → usage テストを `show`/`hide` を含むことまで断定するよう強めた。
  - `.pi/extensions/thinking-scrub/index.ts:158` -- `registerCommand` description still `(on/off/status)`, omits `show`/`hide` after display commands added.
    - fixed: description を `(on/off/show/hide/status)` に直した。
- Unlisted:
  - なし
- Gaps:
  - `.pi/extensions/thinking-scrub/scrub/detect.ts:150` -- Steps says trim both sides of joint when removed run contains newlines, but Verify/tests only cover left trailing space; right leading space case (e.g. run + ` bar` -> `foo\n\nbar`) is not asserted.
    - fixed: 右端空白のケース（`foo` + run + ` bar` → `foo\n\nbar`）を detect.test.ts に足した。
  - `.pi/extensions/thinking-scrub/scrub/message.ts:71` -- Steps says `chars` is sum over blocks, Verify only names single-block; `.pi/extensions/thinking-scrub/scrub/message.test.ts:218` 2-block test asserts `removed` only, never `chars` sum.
    - fixed: 2-block テストに `chars` 120 の断定を足し、両ブロック寄与の合計テスト（118）を message.test.ts に足した。
  - `.pi/extensions/thinking-scrub/index.ts:67` -- Steps says `writeEnabled`/`writeShow` share read-modify-write (preserve the other key); Verify only shows `hide` preserves `enabled`, no test that `on`/`off` preserves existing `show: false`.
    - fixed: `off`/`on` が既存 `show: false` を保つテスト2件を index.test.ts に足した。
- Unproven:
  - `.pi/extensions/thinking-scrub/command/scrub.test.ts:85` -- `foo -> usage` test only checks length 1 + contains `usage`, so it stays green with the current stale `[on|off]` line that omits `show`/`hide`.
    - fixed: usage 修正とテスト強化（`show`/`hide` を含むことを断定）で担保。
  - `.pi/extensions/thinking-scrub/index.test.ts:336` -- `off -> settings.json` test starts from empty dir, so it stays green even if `writeEnabled` overwrote the file and dropped `show`.
    - fixed: `show: false` 保持テストの追加で担保（上書きすれば落ちる）。
  - `.pi/extensions/thinking-scrub/scrub/message.test.ts:218` -- 2-block test asserts `removed: 2` only, so it stays green even if `chars` summed only one block.
    - fixed: 両ブロック寄与の合計テスト（118）の追加で担保。
- Doubts:
  - `.pi/extensions/thinking-scrub/index.ts:2` header comment omits `agent_end` report but states no falsehood, so left as note, not a finding.
    - left: 虚偽はなく finding ではないため、手を付けない。
  - Slice1 positives use 5 repeats only with no 3-repeat success case; value 3 itself is plan-decided, so left as note, not a finding.
    - left: 値 3 は plan 決定事項で finding ではないため、手を付けない。

### Round 2

- Stale:
  - `.pi/extensions/thinking-scrub/command/scrub.ts:4` header -- fixed confirmed: header now reads `on` / `off` と `show` / `hide` を受ける (lines 2-5).
  - `.pi/extensions/thinking-scrub/command/scrub.ts:38` usageLine -- fixed confirmed: `usageLine()` returns `[on|off|show|hide]` (line 38).
  - `.pi/extensions/thinking-scrub/index.ts:158` registerCommand description -- fixed confirmed: description is `(on/off/show/hide/status)` (line 158).
- Unlisted:
  - なし（fixed: 指定のため範囲外、未探索）。
- Gaps:
  - `scrub/detect.ts:150` right-space joint -- fixed confirmed: `detect.test.ts:141-146` asserts `foo` + run + ` bar` to `foo\n\nbar`; impl trims both sides (`detect.ts:149-156`).
  - `scrub/message.ts:71` chars sum -- fixed confirmed: `message.test.ts:233` asserts `chars` 120, and `message.test.ts:252-266` adds two-block sum 118 (59+59) test.
  - `index.ts:67` write preserve -- fixed confirmed: `index.test.ts:375-395` adds `off`/`on` preserve `show: false` tests; impl merges via `writePatch` (`index.ts:60-65`).
- Unproven:
  - `command/scrub.test.ts:85` usage test -- fixed confirmed: test now asserts `show`/`hide` contained (`scrub.test.ts:91-93`), fails against old `[on|off]` line.
  - `index.test.ts:336` overwrite guard -- fixed confirmed: new `show: false` preservation tests start from existing file, overwrite-and-drop would fail.
  - `scrub/message.test.ts:218` single-block sum guard -- fixed confirmed: 118 sum test would be 59 on single-block sum, plus 120 assertion on existing 2-block test.
- Doubts:
  - `message.test.ts:218` の `chars` 120 は全区間ブロックが trim-empty で除外されるため実質片ブロック分だが、118 テストが真の両ブロック合計を担うため finding としない。
  - `bafa80e` の commit 差分は未照合（作業ツリー現物のみ確認）。作業ツリーが fix 後の状態であることは上記の通り。

## Acceptance

- Ran:
  - worktree で `pnpm typecheck` → root: ok / .pi: ok
  - worktree で `pnpm vitest run --config vitest.starter.config.ts` → 64 files / 1000 tests passed（うち thinking-scrub は 90 件）
  - 統合スライスの Verify（拡張の全テスト + typecheck）も同じコマンドで通した
  - 振る舞いを壊して赤を確かめた 3 点（すべて元に戻し、`git status` は plan md だけ）
    1. `MIN_REPEATS` を 3 から 6 に戻す → `detect.test.ts` が 6 件赤
    2. 繋ぎ目の `\n\n` の判定を `\n ` に変える → `detect.test.ts` が 3 件赤
    3. `onAgentEnd` の「合計が 0 なら出さない」を潰す → `index.test.ts` が 4 件赤
- Findings:
  - なし
- Doubts:
  - `scrub/message.test.ts` の `chars` 120 は、1 つ目のブロックが畳むと空になるため置き換えの対象から外れ、実質は 2 つ目のブロックの分だけ。両ブロックの合計は 118 のケースが担う。
  - Review Round 2 の「`bafa80e` の差分は未照合」は、`git diff b9bea37..HEAD` で私が確認した。
