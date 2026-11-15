# PLAN `thinking-scrub-tests`

- No: 02
- Place: worktree
- Boundary Plans: 01-arg-cleanup (order 1)

## Goal

thinking-scrub のテストが、同じ事実を 1 箇所で確認し、前提を fixture に集めた形になる。

## Design

- Inside:
  - Modules: `scrub.fixture.ts` に、テストの前提を組み立てる `scrubWiring`、`observeIn`、`removedLine` を集める。`test/pi.fixture.ts` の `PiAssistantMessage` と `piUsage()` は `scrub.fixture.ts` に移す。`test/settings.fixture.ts` に、一時ディレクトリと `settings.json` を作る `settingsDirWith` を置く。`PiAssistantMessage` と `piUsage()` はホストの型だが、いまは thinking-scrub だけが使うため、ADR の決定どおり `scrub.fixture.ts` に移す。C5 の `SCRUB_*`、`defaultSettings()`、`state/cell` の値は振る舞いの期待値か入力であり、値だけの確認ではない。削除する純粋な定数確認はない。前提の境界は `cycleText(pattern, tuning.char.minRepeats - 1)` のように名前のある値で組み立て直す。
  - Dirs: `test/` に `settings.fixture.ts` を足し、`test/pi.fixture.ts` を削除する。ディレクトリの分割や移動はない。
- Outside:
  - Extract: `settingsDirWith` は 03 の context-precompact も使うため、`test/settings.fixture.ts` に置く。
  - Colocate: なし。

## Files

```text
.pi/
  extensions/
    thinking-scrub/
      command/
        scrub.test.ts
        scrub.ts
      live/
        guard.test.ts        update
        guard.ts
      scrub/
        detect.test.ts       update
        detect.ts
        message.test.ts      update
        message.ts
        units.test.ts        update
        units.ts
      settings/
        read.test.ts         update
        read.ts
        schema.test.ts
        schema.ts
      state/
        cell.test.ts
        cell.ts
      index.test.ts          update
      index.ts
      scrub.fixture.ts       update
scripts/
  harness-sync/
    setting.json             update
  product-ready/
    test-exclude.json        update
test/
  pi.fixture.ts              drop
  settings.fixture.ts        add
  temp-dir.ts
package.json
```

## Slices

## 1.前提を fixture に集める

テストが作り直している前提を `scrub.fixture.ts` と `test/settings.fixture.ts` に集め、テストの import を合わせる。

### Types

```ts
export function scrubWiring(options?: {
  readonly settingsDir?: string;
  readonly readSettings?: () => SettingsRead;
}): ScrubWiring;

export function settingsDirWith(document: unknown): string;
export function observeIn(thinking: string, tuning?: Tuning): GuardStep;
export function removedLine(runs: number, chars: number): string;
```

### Steps

1. `test/settings.fixture.ts`
   1. add: `settingsDirWith(document)` を置く。`writeFileSync` を `node:fs` から、`join` を `node:path` から、`tempDir` を `./temp-dir.ts` からインポートし、`tempDir()` でディレクトリを作り、`settings.json` に `typeof document === 'string' ? document : JSON.stringify(document)` を書いて、そのディレクトリを返す。

      ```ts
      export function settingsDirWith(document: unknown): string {
        const dir = tempDir();
        const body = typeof document === 'string' ? document : JSON.stringify(document);
        writeFileSync(join(dir, 'settings.json'), body);
        return dir;
      }
      ```
2. `.pi/extensions/thinking-scrub/scrub.fixture.ts`
   1. update: `settingsDirWith` を `../../../test/settings.fixture.ts` からインポートする。
   2. update: `readSettings` を `./settings/read.ts` から、`createScrubWiring` と `ScrubWiring` を `./index.ts` から、`emptyGuard`、`observe`、`GuardStep` を `./live/guard.ts` から、`defaultSettings`、`Tuning`、`SettingsRead` を `./settings/schema.ts` からインポートする。
   3. update: `PiAssistantMessage` 型と `piUsage()` を `test/pi.fixture.ts` からこのファイルに移し、`MessageEndEvent` 型を `@earendil-works/pi-coding-agent` からインポートする。
   4. drop: `test/pi.fixture.ts` からのインポート。
   5. add: `scrubWiring(options = {})` を置く。`settingsDir` の既定は `settingsDirWith({})`、`now` は `() => 7`、`followUp` は `() => undefined`、`readSettings` の既定は `() => readSettings(dir)` とし、`createScrubWiring` に渡す。

      ```ts
      export function scrubWiring(
        options: {
          readonly settingsDir?: string;
          readonly readSettings?: () => SettingsRead;
        } = {},
      ): ScrubWiring {
        const dir = options.settingsDir ?? settingsDirWith({});
        return createScrubWiring({
          settingsDir: dir,
          now: () => 7,
          followUp: () => undefined,
          readSettings: options.readSettings ?? (() => readSettings(dir)),
        });
      }
      ```

   6. add: `observeIn(thinking, tuning = defaultSettings())` を置く。`observe(emptyGuard(), thinking, tuning, () => true)` を返す。
   7. add: `removedLine(runs, chars)` を置く。`SCRUB_REMOVED_MARK` と `runs` と `chars` から行を組み立てる。

      ```ts
      export function removedLine(runs: number, chars: number): string {
        return `${SCRUB_REMOVED_MARK} ${runs} (${chars} chars)`;
      }
      ```

   8. drop: `SCRUB_USAGE_MARK` と `FOLLOWUP_SAMPLE_HEADING`。
   9. update: ファイルのヘッダから「FS も開かない」を外し、`scrubWiring` が `settingsDirWith` で一時ファイルを書くと記す。66 行目のコメントを「テストが期待する文言を 1 箇所に集める。製品の文言は実装側にもあるため、変えるときは両方を修正する。」に直す。
3. `test/pi.fixture.ts`
   1. drop: ファイルを削除する。
4. `scripts/harness-sync/setting.json`
   1. update: `copy` と `push` の `test/pi.fixture.ts` を `test/settings.fixture.ts` に置き換える。
5. `scripts/product-ready/test-exclude.json`
   1. update: `test/pi.fixture.ts` を `test/settings.fixture.ts` に置き換える。
6. `.pi/extensions/thinking-scrub/index.test.ts`
   1. update: `createScrubWiring` の呼び出しを `scrubWiring` に置き換える。`readSettings: () => okSettings()` は `scrubWiring()`、`readSettings: () => readSettings(dir)` は `scrubWiring({ settingsDir: dir, readSettings: () => readSettings(dir) })` にする。ほかの `readSettings`/`settingsDir` を渡す呼び出しは、その値を `scrubWiring` の options に写す。`registerScrub` の呼び出しは変えず、`okSettings` は `registerScrub` のために残す。`scrubWiring` を `scrub.fixture.ts` からインポートする。
   2. update: `tempDir()` と `writeFileSync(join(dir, 'settings.json'), ...)` の組を `settingsDirWith(document)` に置き換える。`JSON.stringify(X)` は `X` を渡し、`'{'` などの生の壊れた JSON は文字列のまま渡す。`tempDir`、`join`、`writeFileSync` の不要なインポートを整理する。
   3. update: ローカルの `removedLine` を削除し、`scrub.fixture.ts` からインポートする。
7. `.pi/extensions/thinking-scrub/scrub/message.test.ts`
   1. update: `piUsage` と `PiAssistantMessage` を `scrub.fixture.ts` からインポートする。
8. `.pi/extensions/thinking-scrub/live/guard.test.ts`
   1. update: `emptyGuard()` と `() => true` を渡す `observe` の呼び出しだけを `observeIn(thinking, tuning)` に置き換える。`first.guard` を渡す呼び出しと、カスタムの `enabled` を渡す呼び出しはそのままにする。`observeIn` を `scrub.fixture.ts` からインポートする。
9. `.pi/extensions/thinking-scrub/settings/read.test.ts`
   1. update: `writeFileSync(join(dir, 'settings.json'), ...)` の 2 箇所を `settingsDirWith(document)` に置き換える。`mkdirSync` でディレクトリを作る箇所と、ファイルを作らない箇所はそのままにする。`settingsDirWith` を `test/settings.fixture.ts` からインポートする。

### Policy

- Allowed:
  - 判断と変換は単体に残し、配線は経路だけを確認する。
  - fixture は、その Unit だけで使うものは Unit 内の `*.fixture.ts` に置き、複数 Unit で使うものは `test/` に置く。
  - 削除ごとに、残す側のテストか「存在しない理由」を対応付ける。
  - 既存の `pnpm test:run`、`pnpm typecheck`、`pnpm lint` で確認する。
- Forbidden:
  - 振る舞いを変える - テストの整理だけを行う。
  - 振る舞いやロジックを持たない primitive、bool、順序、有無をテストする - プリンシプルに反する。
  - 実装の値を写すだけの定数確認を残す - 振る舞いを確認しない。
  - `rules/` を変更する - このサイクルの範囲外。
  - 実装が読まない引数をこのエントリで削除する - 01 で扱う。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/thinking-scrub/scrub.fixture.ts .pi/extensions/thinking-scrub/index.test.ts .pi/extensions/thinking-scrub/scrub/message.test.ts .pi/extensions/thinking-scrub/live/guard.test.ts .pi/extensions/thinking-scrub/settings/read.test.ts test/settings.fixture.ts scripts/product-ready/index.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added: なし

## 2.重複と前提の削除

単体と重複する配線のテストと、プリンシプルの外にある前提の断言を削除する。

### Types

なし

### Steps

1. `.pi/extensions/thinking-scrub/index.test.ts`
   1. drop: 274 行目の「okSettings と message_end なら 3 グループの既定値で差し替える」を削除する。既定の置換は `scrub/message.test.ts:26-46` が確認する。
   2. drop: 293 行目の「char.minLength を 100 にした設定と message_end なら 66 文字の退化を差し替えない」を削除する。境界は `scrub/message.test.ts:56-62` が確認する。
   3. update: 762 行目のテストのうち、773-774 行目の 1 回目の通知の断言（`toHaveLength(1)` と `removedLine(2, ...)`）を削除し、777-778 行目の 2 回目の通知の断言だけを残す。前提の 769-772 行目は残す。
      - case: 1.3: boundary: 1 回通知した後に `message_end` と `agent_end` → 2 回目だけ通知し、その実行の分だけになる
2. `.pi/extensions/thinking-scrub/scrub/detect.test.ts`
   1. update: 6 行目のコメントを「検出と除去を行う。fixture は scrub.fixture.ts から読む。」に直す。
   2. update: `const tuning = defaultSettings();` をモジュールの先頭に置き、各 `it` の先頭の `const tuning = defaultSettings();` を削除する。カスタムの派生は `{ ...tuning, ... }` で作る。
   3. drop: 40 行目の `expect(tuning.char.minPeriod).toBe(4)` を削除する。
   4. drop: 48 行目の入力長の確認を削除する。
   5. drop: 57、66、74、79、88、97 行目の境界値の前提確認を削除する。行番号は目安とし、`expect(...length...)` などの前提確認だけを削除し、振る舞いの断言は残す。
   6. drop: 130-131、134、145、155-156 行目の境界値の前提確認を削除する。行番号は目安とし、`expect(...length...)` などの前提確認だけを削除し、振る舞いの断言は残す。
   7. drop: 126 行目の「周期の長さと繰り返しの数は別々に効くことを確かめる」を削除する。境界は `detectRuns` の 52-61 と 63-82 が確認する。
   8. drop: 151 行目の「周期の下限より短い周期は消さず上限を超える周期は消さない」を削除する。境界は `detectRuns` の 63-82 と 174 が確認する。
3. `.pi/extensions/thinking-scrub/scrub/message.test.ts`
   1. update: `const tuning = defaultSettings();` をモジュールの先頭に置き、各 `it` の先頭の `const tuning = defaultSettings();` を削除する。カスタムの派生は `{ ...tuning, ... }` で作る。
   2. drop: 58 行目の `expect(degenerate().length).toBe(66)` を削除する。
4. `.pi/extensions/thinking-scrub/scrub/units.test.ts`
   1. update: `const tuning = defaultSettings();` と `const sentence = tuning.sentence;` をモジュールの先頭に置き、各 `it` の先頭の `defaultSettings()` の呼び出しを削除する。`sentence` レベルの派生は `{ ...tuning.sentence, ... }` に直し、対照用の `defaultSettings().sentence` は `tuning.sentence` にする。
   2. drop: 43-44、55-57、75-77、89-92 行目の分割位置と `opaque` の前提確認を削除する。行番号は目安とし、`start`、`end`、`opaque`、`slice` の前提確認だけを削除し、振る舞いの断言は残す。
5. `.pi/extensions/thinking-scrub/live/guard.test.ts`
   1. update: `const tuning = defaultSettings();` をモジュールの先頭に置き、各 `it` の先頭の呼び出しを削除する。カスタムの `live`/`sentence` は `{ ...tuning, live }` で作る。
   2. drop: 39、54、64、74、83-84 行目の入力長の確認を削除する。`83-84` は変数定義と `expect` の行なので、`expect(...toHaveLength...)` だけを削除し、変数定義は残す。

### Policy

- Allowed:
  - 判断と変換は単体に残し、配線は経路だけを確認する。
  - fixture は、その Unit だけで使うものは Unit 内の `*.fixture.ts` に置き、複数 Unit で使うものは `test/` に置く。
  - 削除ごとに、残す側のテストか「存在しない理由」を対応付ける。
  - 既存の `pnpm test:run`、`pnpm typecheck`、`pnpm lint` で確認する。
- Forbidden:
  - 振る舞いを変える - テストの整理だけを行う。
  - 振る舞いやロジックを持たない primitive、bool、順序、有無をテストする - プリンシプルに反する。
  - 実装の値を写すだけの定数確認を残す - 振る舞いを確認しない。
  - `rules/` を変更する - このサイクルの範囲外。
  - 実装が読まない引数をこのエントリで削除する - 01 で扱う。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/thinking-scrub/index.test.ts .pi/extensions/thinking-scrub/scrub/detect.test.ts .pi/extensions/thinking-scrub/scrub/message.test.ts .pi/extensions/thinking-scrub/scrub/units.test.ts .pi/extensions/thinking-scrub/live/guard.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added: なし

## Notes

## Work Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Policy:
- Unproven:
- Noise:
- Doubts:

### Round 2

- Stale:
- Unlisted:
- Gaps:
- Policy:
- Unproven:
- Noise:
- Doubts:

## Acceptance

- Goal:
- Ran:
- Findings:
- Doubts:
