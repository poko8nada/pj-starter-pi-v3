# DESIGN 043

## Affected

### 01: thinking-scrub の定数を settings.json に出し、README ペアで説明する形をどうするか

- 読むもの:
  - `.pi/extensions/thinking-scrub/command/scrub.ts` — `SettingsRead` 型を `settings/schema.ts` から読み、`CommandPort` に使う（`:5`、`:42-47`）。
  - `.pi/extensions/thinking-scrub/settings/read.ts` — `Settings` を返し、`settings.json` を読む（`:20-35`）。
  - `.pi/extensions/thinking-scrub/index.ts` — `readSettings` を呼び、設定を `writePatch` で書き戻す（`:75-95`、`:151`、`:215`、`:236`）。
  - `.pi/extensions/thinking-scrub/live/guard.ts` — `MIN_THINKING`、`SCAN_EVERY`、`TAIL`、`MAX_ABORTS` を読む（`:20-23`、`:53-83`）。
  - `.pi/extensions/thinking-scrub/scrub/units.ts` — `MIN_CYCLES`、`MIN_RUN_CHARS`、`MAX_PERIOD_UNITS`、`SAMPLE_CHARS` を読む（`:21-24`、`:206-230`）。
  - `.pi/extensions/thinking-scrub/scrub/detect.ts` — `MIN_PERIOD`、`MAX_PERIOD`、`MIN_REPEATS`、`MIN_LENGTH` を読む（`:22-25`、`:110-128`、`:215-219`）。
  - `.pi/extensions/thinking-scrub/scrub/message.ts` — `scrubThinking` を呼ぶ（`:9`、`:68`）。
- 検査するもの:
  - `.pi/extensions/thinking-scrub/index.test.ts` — `readSettings` の呼び出しと書き戻しを数える（`:300-341`、`:670-750`）。
  - `.pi/extensions/thinking-scrub/settings/schema.test.ts` — `parseSettings` の `ok` と `broken` の扱いを見る（`:4-10`、`:23`）。
  - `.pi/extensions/thinking-scrub/settings/read.test.ts` — `readSettings` の既定値と `broken` の扱いを見る。
  - `.pi/extensions/thinking-scrub/live/guard.test.ts` — 定数の境界値を見る（`:46-112`）。
  - `.pi/extensions/thinking-scrub/scrub/units.test.ts` — 定数の境界値を見る（`:120-161`）。
  - `.pi/extensions/thinking-scrub/scrub/detect.test.ts` — 定数の境界値を見る（`:66-111`）。
  - `.pi/extensions/thinking-scrub/scrub/message.test.ts` — 署名の扱いと畳み込みを見る。
  - `.pi/extensions/thinking-scrub/command/scrub.test.ts` — `SettingsRead` とコマンドを見る（`:2`、`:34-37`）。
- 生成するもの:
  - `.pi/extensions/thinking-scrub/settings.json` — 3 グループの既定値を追加する。
  - `.pi/extensions/thinking-scrub/README.ja.md` — 新規作成し、`proofreader` の校正を通す。

### 02: 生成中の設定の読み込みを、スキャン時だけにする形をどうするか

- 読むもの:
  - `.pi/extensions/thinking-scrub/index.ts` — `MIN_THINKING`、`readSettings`、`observe` の順での処理と、コマンドの書き戻しを確認する（`:167-189`、`:227-249`）。
  - `.pi/extensions/thinking-scrub/live/guard.ts` — `MAX_ABORTS` と `SCAN_EVERY` の判定を確認する（`:61-66`）。
  - `.pi/extensions/thinking-scrub/settings/read.ts` — `readFileSync` と `parseSettings` を確認する（`:20-35`）。
  - `.pi/extensions/thinking-scrub/command/scrub.ts` — `SettingsRead` を `CommandPort` に使う（`:5`、`:42-47`）。
- 検査するもの:
  - `.pi/extensions/thinking-scrub/index.test.ts` — `readSettings` の呼び出し回数を数える（`:316-341`）。
  - `.pi/extensions/thinking-scrub/command/scrub.test.ts` — `runCommand` を見る（`:2`）。
  - `.pi/extensions/thinking-scrub/settings/schema.test.ts` — `parseSettings` の扱いを見る（`:2`）。
- 生成するもの:
  - `.pi/extensions/thinking-scrub/settings.json` — `writePatch` が書き込む先である（`:90-95`）。

## External

### 01: thinking-scrub の定数を settings.json に出し、README ペアで説明する形をどうするか

- `proofreader` — 新規 `README.ja.md` の作成後に校正する。
  - Contract: `**/*.md` と `**/.*/**/*.md` を書ける非隔離の役割であり、`edit`、`quick_edit`、`target_edit`、`write` を持つ。
- `pi 本体の ExtensionAPI` — イベント名、コマンド名、`sendMessage` の形を保つ。
  - Contract: `message_update`、`message_end`、`agent_settled`、`agent_end`、`before_agent_start`、`registerCommand`、`sendMessage` を受け取る。
- `node のファイル読み書き` — `settings.json` を読み書きする。
  - Contract: `readFileSync`、`writeFileSync`、`join`、`dirname`、`fileURLToPath` を使う。
- `モデルの提供元の thinking の署名` — 再送の対象を保つ。
  - Contract: `reasoning_content`、`reasoning`、`reasoning_text` を対象とし、署名なし、JSON 署名、`redacted` には触らない。

### 02: 生成中の設定の読み込みを、スキャン時だけにする形をどうするか

- `pi 本体の ExtensionAPI` — イベント名、コマンド名、`ctx.abort`、`ctx.ui.notify`、`sendMessage` の形を保つ。
  - Contract: `message_update`、`message_end`、`agent_settled`、`agent_end`、`before_agent_start`、`registerCommand`、`sendMessage`、`ctx.abort`、`ctx.ui.notify`。
- `node のファイル読み書き` — `settings.json` を読む。
  - Contract: `readFileSync`、`join`、`fileURLToPath`。

## `tuning-settings`

### ADR & Where

- No: 01, 02
- Why: 01 と 02 は `index.ts`、`live/guard.ts`、`settings/schema.ts`、`settings/read.ts`、`settings.json`、テスト、README を共有し、02 は 01 が作る `Tuning` 型（`live`、`sentence`、`char`）を読むため、1 つの worktree にまとめ、同じ worktree で 01 の `Tuning` の形を先に決め、02 はその型を使って読み込み位置を移します。
- Where: worktree

### Goal

- 3 グループの `settings.json`（`live` の `minThinking`、`scanEvery`、`tail`、`maxAborts`、`sampleChars`、`sentence` の `minCycles`、`minRunChars`、`maxPeriodUnits`、`char` の `minPeriod`、`maxPeriod`、`minRepeats`、`minLength`、トップレベルの `enabled`、`show`）を `Tuning` として注入すると、テストで 3 グループのパースと既定値の扱い、`Tuning` の `observe`、`detectUnitRuns`、`detectRuns`、`scrubThinking` への反映、書き戻し後も定数が残ること、README の表とキーが一致すること、スキャン間隔に達していない更新では `readSettings` が呼ばれないこと、`MAX_ABORTS` 到達後と無効時にも `scanned` が進むことが確かめられ、`README.ja.md` は `proofreader` の報告により校正済みであることが確かめられ、同ファイルが root の README ペアから参照される。

### Non-goal

- `8000` / `1000` / `350` は変えません（`Scope` の `values` が `out`。抽出後の最初の調整です）。
- `char` の値は既定のままです（`Scope` の `char-layer` は出すだけで、値は変更しません）。
- 正規化と近似一致は追加しません（`Scope` の `detection` が `out`）。
- 設定を編集する UI と、複数プロファイルは追加しません（`Scope` の `ui` と `profiles` が `out`）。
- スキャンの回数と 1 回のコストは変えません（`Scope` の `speed` は読み込み回数に限ります）。
- `settings.json` 以外のデータを移しません（`01` の `migration` は、`settings.json` に 3 グループの既定値を追加するだけです。`02` の `migration` は `out` です）。
- 配布、ログ、監視は変えません（`Scope` の `deploy` と `logs and monitoring` が `out`）。
- 新しい依存を追加しません（`Scope` の `dependency` が `out`）。
- 読み取り権限と秘密情報の扱いを変えません（`Scope` の `security` が `out`）。
- 新しい名前を追加しません（`02` の `naming` が `out` です）。
- フラットな `settings.json` にしません（`Options` の A を採りません。オーナーが 3 グループを選びました）。
- JSONC とコメントを追加しません（`Options` の D を採りません。書き戻しがコメントと定数を消すためです）。
- 別の `SETTINGS.md` を作りません（`Options` の E を採りません。README に書くためです）。
- root の README ペアだけに書きません（`Options` の C を採りません。拡張の README ペアを作るためです）。
- 境界キャッシュにしません（`02` の `Options` B を採りません。オーナーがスキャン時の読み込みを選びました）。
- 現状維持（更新ごとの読み込み）にしません（`02` の `Options` C を採りません。スキャンが不要な更新でも読み込むことが、今回削減する対象です）。

### Summary

- 定数を `live`、`sentence`、`char` の 3 グループに分けて `settings.json` に移し、トップレベルの `enabled` と `show` は残します。`Tuning` 型として `observe`、`detectUnitRuns`、`detectRuns`、`scrubThinking` に注入します。
- `README.md` と `README.ja.md` をペアとして整備し、全キーの説明と値の上げ下げの例を書きます。`README.ja.md` は、作成後に `proofreader` で校正し、root の README ペアから参照できるようにします。
- 生成中の設定の読み込みを、スキャン間隔と `MAX_ABORTS` の判定の後へ移します。無効時にも `scanned` を進め、手編集の反映は最大 `SCAN_EVERY` 文字分遅らせ、コマンドはメモリ上の設定を更新して即時反映とし、`message_end` のフォールド処理は即時のままにします。型違い・範囲外・`scanEvery <= tail`・`minPeriod < maxPeriod`・`minRepeats >= 2` は既定値か `broken` として扱い、キーがない場合は既定値を使います。

### Paths

- `.pi/extensions/thinking-scrub/settings/schema.ts`
- `.pi/extensions/thinking-scrub/settings/read.ts`
- `.pi/extensions/thinking-scrub/settings.json`
- `.pi/extensions/thinking-scrub/index.ts`
- `.pi/extensions/thinking-scrub/live/guard.ts`
- `.pi/extensions/thinking-scrub/scrub/units.ts`
- `.pi/extensions/thinking-scrub/scrub/detect.ts`
- `.pi/extensions/thinking-scrub/scrub/message.ts`
- `.pi/extensions/thinking-scrub/command/scrub.ts`
- `.pi/extensions/thinking-scrub/index.test.ts`
- `.pi/extensions/thinking-scrub/settings/schema.test.ts`
- `.pi/extensions/thinking-scrub/settings/read.test.ts`
- `.pi/extensions/thinking-scrub/live/guard.test.ts`
- `.pi/extensions/thinking-scrub/scrub/units.test.ts`
- `.pi/extensions/thinking-scrub/scrub/detect.test.ts`
- `.pi/extensions/thinking-scrub/scrub/message.test.ts`
- `.pi/extensions/thinking-scrub/command/scrub.test.ts`
- `.pi/extensions/thinking-scrub/README.md`
- `.pi/extensions/thinking-scrub/README.ja.md`
- `README.md`
- `README.ja.md`

### Boundary

- Plans: なし
- External:
  - `proofreader`: 新規 `README.ja.md` の作成後に校正する。
    - Contract: `**/*.md` と `**/.*/**/*.md` を書ける非隔離の役割であり、`edit`、`quick_edit`、`target_edit`、`write` を持つ。
  - `pi 本体の ExtensionAPI`: イベント名、コマンド名、`ctx.abort`、`ctx.ui.notify`、`sendMessage` の形を保つ。
    - Contract: `message_update`、`message_end`、`agent_settled`、`agent_end`、`before_agent_start`、`registerCommand`、`sendMessage`、`ctx.abort`、`ctx.ui.notify`。
  - `node のファイル読み書き`: `settings.json` を読み書きする。
    - Contract: `readFileSync`、`writeFileSync`、`join`、`dirname`、`fileURLToPath`。
  - `モデルの提供元の thinking の署名`: 再送の対象を保つ。
    - Contract: `reasoning_content`、`reasoning`、`reasoning_text` を対象とし、署名なし、JSON 署名、`redacted` には触らない。
