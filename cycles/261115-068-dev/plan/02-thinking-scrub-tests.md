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
    index.test.ts            update
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
10. `scripts/product-ready/index.test.ts`
    1. update: `TEST_EXCLUDE_ENTRIES` の `test/pi.fixture.ts` を `test/settings.fixture.ts` に置き換える。
    2. add: 実物の `test-exclude.json` が `test/settings.fixture.ts` を含み `test/pi.fixture.ts` を含まないことを断言するテストを足す。

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

### Cleanup: 空振りと重複の断言を削る

- Findings: `.pi/extensions/thinking-scrub/index.test.ts` の「aborted が false なら何も送らない」を削除した。`scrubWiring()` の `followUp` は noop のため `sent` 断言が空振りで、中断の断言は `onMessageUpdate` の「差分が scanEvery 以上なら 1 回読みランがあれば止まる」が担う。送信経路は `registerScrub` の陽性テストが担う。
- Findings: `.pi/extensions/thinking-scrub/index.test.ts` の「aborted が true でも pending がなければ何も送らない」を削除した。観測できる振る舞いがなく、有無の確認はプリンシプルに反する。送信しない分岐は陽性テストの裏返しで、欠けた理由はそれである。
- Findings: `.pi/extensions/thinking-scrub/index.test.ts` の integration「短い繰り返し 2 回なら message_end が undefined になり agent_end でも notify が呼ばれない」を削除した。配線の 2 分岐は「退化のない assistant なら undefined になる」と「何も消していない状態で agent_end なら notify が呼ばれない」が担い、短い繰り返しの単位は `scrub/message.test.ts` の「本文が 1 つの区間だけなら undefined になる」が担う。
- Findings: `.pi/extensions/thinking-scrub/index.test.ts` の「コマンドが引数なしなら通知が 1 回呼ばれる」（旧名「〜 runCommand の行が渡る」）から内容の 2 断言を削り、通知 1 回の経路だけ残した。内容は `command/scrub.test.ts` の使い方テストが担う。名前に合わせて題名を直し、不要になった `SCRUB_PREFIX` と `SCRUB_REMOVED_LABEL` の import を外した。
- Findings: `.pi/extensions/thinking-scrub/index.test.ts` の `registerScrub` テストを順序に依存しない集合比較に直し、題名の「順序で」を「で」に直した。登録順に振る舞いはなく、5 件の存在と `thinking-scrub` 登録が経路である。
- Findings: `.pi/extensions/thinking-scrub/live/guard.test.ts` の `resetOnUser` テストから `expect(reset).toEqual(emptyGuard())` を削った。実装の写しであり、振る舞いは直後の「また止まる」断言が担う。
- Unplanned: なし

### Slice 2: 重複と前提の削除

- Findings: なし
- Unplanned: `.pi/extensions/thinking-scrub/scrub/units.test.ts` の「表の行と diff --git の行は不透明になる」テスト全体を削除した。指示の 89-92 行削除では両方の for 文が壊れて空のテストと未使用変数が残り lint が通らないため、断言が全て前提だった当該テストを落とした。表と diff の不透明分岐は柵のテストと同一経路で担保される。
- Unplanned: `.pi/extensions/thinking-scrub/live/guard.test.ts` の入力長前提は 5 番号のうち現ファイルに存在する 3 件（`minThinking`、`tail * 2`、`longSample`）を削除した。残り番号は旧リビジョンのもので該当行がなく、内容基準で満たした。
- Unplanned: `.pi/extensions/thinking-scrub/scrub/units.test.ts` のモジュール先頭 `sentence` を `baseSentence` に改名した。loop 変数と `minRunChars` テストのローカル `sentence` が衝突し `no-shadow` で lint が落ちるため。参照 19 件を付け替え、ローカル 2 件は残した。
- Commit: 3af53c4a7723edd23f8d6e97bf03e473fdc0532f
- Stopped:

### Slice 1: 前提を fixture に集める

- Findings: なし
- Unplanned: Round 1 の Stale と Gaps（実物断言なし）のため、`scripts/product-ready/index.test.ts` が `Files` にないファイルとして必要になった。`Files` とスライス 1 の手順 10 に追加し、定数の置き換えと実物断言テストを実施した。レビュー対応のため待てなかった。
- Commit: 887e226136db7ce4d2dafa36d52f874b228cca53
- Stopped:

## Work Review

### Round 1

- Stale:
  - `scripts/product-ready/index.test.ts:29` — `TEST_EXCLUDE_ENTRIES` が削除済みの `test/pi.fixture.ts` を名指し続けている。実物の `scripts/product-ready/test-exclude.json:7` は `test/settings.fixture.ts` に置き換え済みで、この定数は実物とずれたまま自己完結するため緑のまま古くなる。
    - fixed: 定数を `test/settings.fixture.ts` に直し、実物の有無を断言するテストを足した。`Files` とスライス 1 の手順 10 に追加し、Unplanned に記した。
- Unlisted:
  - なし（`9864f60..HEAD` の変更ファイルはすべて `## Files` に名指しあり。plan md 自体の Notes 追記は記録のため対象外）
- Gaps:
  - `.pi/extensions/thinking-scrub/scrub/units.ts:53` — `isTableRow` / `isDiffLine` 分岐（`units.ts:38-48`）を通る行を残るテストが一つも与えない。代替とされた柵のテスト（`units.test.ts:58`）は `isFenceLine` 分岐だけを通るため、Notes の「同一経路で担保」は成り立たず、表・diff 行の不透明化が無検証になっている。
    - fixed: 表と diff の行を含む繰り返しはランがないテストを `units.test.ts` に足し、振る舞い（ランなし）で両分岐を通した。
  - `.pi/extensions/thinking-scrub/scrub.fixture.ts:120` — `observeIn` の既定引数 `tuning = defaultSettings()` を使う呼び出しがない（`guard.test.ts` の全呼び出しが `tuning` を明示）。既定分岐は検証されていない。
    - fixed: 閾値テストの 1 呼び出しを `observeIn(thinking)` にし、既定引数で同じ振る舞いになることを検証した。
  - `.pi/extensions/thinking-scrub/scrub.fixture.ts:115` — `settingsDir` だけを渡して `readSettings` を既定（`readSettings(dir)`）に落とす呼び出しがない（`index.test.ts` の `settingsDir` 渡しはすべて `readSettings` を併記）。フォールバック分岐は検証されていない。
    - fixed: enabled-false テストを `scrubWiring({ settingsDir: dir })` にし、既定の `readSettings` で同じ振る舞いになることを検証した。
  - `scripts/product-ready/test-exclude.json:7` — 置き換え後の `test/settings.fixture.ts` 行をリポジトリ実物で断言するテストがない。`Verify` の `scripts/product-ready/index.test.ts` は独自定数（上記 Stale）で一時ツリーを作るだけで実物を読みに行かない。
    - fixed: 実物を読み、有無を断言するテストを `scripts/product-ready/index.test.ts` に足した（Stale 対応と同一ファイル）。
- Policy:
  - なし
- Unproven:
  - `.pi/extensions/thinking-scrub/index.test.ts:180` — `registerScrub` の断言を `new Set(...)` 比較に変えたため、同じイベントの二重登録があっても集合が一致して緑になる（順序の除去は正当だが重複の検出まで落としている。順序だけ外すならソート済み配列の比較で足りる）。
    - fixed: ソート済み配列の比較に直し、順序を無視し重複を検出する形にした。
- Noise:
  - `.pi/extensions/thinking-scrub/scrub/units.test.ts:179` — `expect(text.length).toBeGreaterThanOrEqual(240)` の `240` がマジックナンバーで、前提（`:176` の `minRunChars: 200` との関係）が読み取れない。構成が保証する長さの再確認であり、名前のある値から導く形にしていない。
    - fixed: `sentence.minRunChars` との比較に直し、題名の `240 文字` を `200 文字超` に直した。
  - `.pi/extensions/thinking-scrub/scrub/message.test.ts:57` — 題名の `66 文字` がハードコードのまま、根拠の `expect(degenerate().length).toBe(66)` が削除されて裏付けがどこにもない（`degenerate` の長さを断言する箇所は残存ゼロ）。
    - fixed: 題名から `66 文字` を外し、入力が閾値を下回る関係を `degenerate().length < strict.char.minLength` の前提としてテスト内に置いた。
- Doubts:
  - `scripts/product-ready/index.test.ts:29` — Stale の定数をこの plan で直すか。直すなら `## Files` に名指しがなく `Unlisted` の扱いになるため所有者判断が要る（02 で `Files` を足して直すか、別エントリに回すか）。

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
