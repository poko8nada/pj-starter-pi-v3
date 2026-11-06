# DESIGN 051

## Affected

### 01: consult の `run` と `tool` のテストのうち、どれが不要か

- 読む:
  - `.pi/extensions/consult/README.md` — テスト一覧の表が、対象の担いを説明する
- 検査する:
  - `package.json` — `test:run` と `test:related` を定義し、対象を実行する。`lint`、`format:check`、`typecheck`、`typecheck:staged` の入口も持つ
  - `vitest.starter.config.ts` — 全テストを実行対象にする
  - `vitest.config.ts` — 実行設定の土台を作る
  - `lefthook.yaml` — pre-commit と pre-push でテストを走らせる
  - `.pi/tsconfig.json` — `.pi` 配下の `.ts` を `include` するため、対象を型検査する
  - `scripts/checks/scopes.json` — `.pi` を型検査範囲として指定する
  - `scripts/checks/typecheck.mjs` — `scopes.json` と各 `tsconfig.json` で `tsc` を実行する
  - `scripts/checks/typecheck-staged.mjs` — 変更対象ファイル群を対応する `tsconfig.json` で `tsc` を実行する
  - `.oxlintrc.json` — `**/*.{test,spec}.*` への上書きで、対象を lint する
  - `.oxfmtrc.json` — 除外は tsconfig 系のみで、対象を整形検査に含める
- 生成: なし

### 02: consult の `policy`、`sub`、`index` のテストのうち、どれが不要か

- 読む:
  - `.pi/extensions/consult/README.md` — 表が `policy/types.test.ts`、`sub/spec.test.ts`、`sub/guard.test.ts`、`sub/budget.test.ts` の担いを書く（実測）
- 検査する:
  - `package.json` — `test:run` と `test:related` を定義し、対象を実行する。`lint`、`format:check`、`typecheck`、`typecheck:staged` の入口も持つ
  - `vitest.starter.config.ts` — 起動時に使うテスト実行の設定である
  - `vitest.config.ts` — テスト実行の設定を作る
  - `lefthook.yaml` — commit 時と push 時にテストを実行する
  - `.pi/tsconfig.json` — `.pi` 配下の `.ts` を `include` するため、対象を型検査する
  - `scripts/checks/scopes.json` — `.pi` を型検査範囲として指定する
  - `scripts/checks/typecheck.mjs` — `scopes.json` と各 `tsconfig.json` で `tsc` を実行する
  - `scripts/checks/typecheck-staged.mjs` — 変更対象ファイル群を対応する `tsconfig.json` で `tsc` を実行する
  - `.oxlintrc.json` — `**/*.{test,spec}.*` への上書きで、対象を lint する
  - `.oxfmtrc.json` — 除外は tsconfig 系のみで、対象を整形検査に含める
- 生成: なし

### 03: context-precompact のテストのうち、どれが不要か

- 読む: なし
- 検査する:
  - `vitest.starter.config.ts` — 除外なしで全テストを実行するため、対象の実行合否を判定する
  - `lefthook.yaml` — staged の `.ts` に `test:related`、push 時に `test:run` を実行するため、対象の合否を判定する
  - `.pi/tsconfig.json` — `.pi` 配下の `.ts` を `include` するため、対象を型検査する
  - `scripts/checks/scopes.json` — `.pi` を型検査範囲として指定する
  - `scripts/checks/typecheck.mjs` — `scopes.json` と各 `tsconfig.json` で `tsc` を実行する
  - `scripts/checks/typecheck-staged.mjs` — 変更対象ファイル群を対応する `tsconfig.json` で `tsc` を実行する
  - `.oxlintrc.json` — `**/*.test.ts` への `overrides` を持つため、対象を lint する
  - `.oxfmtrc.json` — 除外は tsconfig 系のみで、対象を整形検査に含める
  - `package.json` — `lint`、`format:check`、`typecheck`、`typecheck:staged` の入口を持つ
- 生成: なし

### 04: thinking-scrub のテストのうち、どれが不要か

- 読む: なし
- 検査する:
  - `vitest.starter.config.ts` — 除外なしで全テストを実行する設定であり、この変更後のテスト本数を実行する
  - `vitest.config.ts` — 上の設定が使う `testConfig` を定義する
  - `lefthook.yaml` — pre-commit で `test:related`、pre-push で `test:run` を走らせる
  - `.pi/tsconfig.json` — `.pi` 配下を型検査の対象にする
  - `scripts/checks/scopes.json` — `.pi` を型検査範囲として指定する
  - `scripts/checks/typecheck.mjs` — `scopes.json` と各 `tsconfig.json` で `tsc` を実行する
  - `scripts/checks/typecheck-staged.mjs` — 変更対象ファイル群を対応する `tsconfig.json` で `tsc` を実行する
  - `.oxlintrc.json` — `**/*.test.*` と `.pi/**` への上書きを持つ
  - `.oxfmtrc.json` — 除外は tsconfig 系のみで、対象を整形検査に含める
  - `package.json` — `lint`、`format:check`、`typecheck`、`typecheck:staged` の入口を持つ
- 生成: なし

### 05: quality-gate と sound-notify のテストのうち、どれが不要か

- 読む:
  - `.pi/extensions/quality-gate/README.md` — `## Tests` のセクションが `targets.test.ts` の担いを書く（実測）
- 検査する:
  - `lefthook.yaml` — pre-commit で `pnpm test:related`、pre-push で `pnpm test:run` を走らせるため
  - `package.json` — `test`、`test:run`、`test:related` を `vitest.starter.config.ts` 指定で定義するため。`lint`、`format:check`、`typecheck`、`typecheck:staged` の入口も持つ
  - `vitest.starter.config.ts` — `testConfig(true)` で実行対象にするため
  - `vitest.config.ts` — `testConfig` を定義し実行するため
  - `.pi/tsconfig.json` — `.pi` 配下の `.ts` を `include` するため、対象を型検査する
  - `scripts/checks/scopes.json` — `.pi` を型検査範囲として指定する
  - `scripts/checks/typecheck.mjs` — `scopes.json` と各 `tsconfig.json` で `tsc` を実行する
  - `scripts/checks/typecheck-staged.mjs` — 変更対象ファイル群を対応する `tsconfig.json` で `tsc` を実行する
  - `.oxlintrc.json` — `**/*.{test,spec}.*` への上書きで、対象を lint する
  - `.oxfmtrc.json` — 除外は tsconfig 系のみで、対象を整形検査に含める
- 生成: なし

### 06: scripts と `.pi/skills` のテストのうち、どれが不要か

- 読む:
  - `vitest.config.ts` — 製品用設定としてテスト実行対象と除外を定め、実行時にテストを読む
  - `vitest.starter.config.ts` — 全件実行設定としてテストを読む
  - `package.json` — `test`、`test:run`、`test:related` で vitest を起動し、テストを実行する
- 検査する:
  - `lefthook.yaml` — pre-commit で `test:related`、pre-push で `test:run` と型検査を実行する
  - `package.json` — `lint`、`format:check`、`typecheck`、`typecheck:staged` の検査入口を持つ
  - `.oxlintrc.json` — `**/*.{test,spec}.*` 向けの上書き規則でテストを検査対象にする
  - `.oxfmtrc.json` — 除外が tsconfig 系のみで、テストを整形検査の対象に含める
  - `tsconfig.json` — `**/*.ts` などを含め、`scripts` 配下のテストを型検査の対象にする
  - `.pi/tsconfig.json` — `**/*.ts` などを含め、`.pi` 配下のテストを型検査の対象にする
  - `scripts/checks/scopes.json` — `.pi` を型検査範囲として指定する
  - `scripts/checks/typecheck.mjs` — `scopes.json` と各 `tsconfig.json` で `tsc` を実行する
  - `scripts/checks/typecheck-staged.mjs` — 変更対象ファイル群を対応する `tsconfig.json` で `tsc` を実行する
- 生成: なし

## External

### 01: consult の `run` と `tool` のテストのうち、どれが不要か

- なし

### 02: consult の `policy`、`sub`、`index` のテストのうち、どれが不要か

- なし

### 03: context-precompact のテストのうち、どれが不要か

- なし

### 04: thinking-scrub のテストのうち、どれが不要か

- なし

### 05: quality-gate と sound-notify のテストのうち、どれが不要か

- `@earendil-works/pi-coding-agent` の `DEFAULT_MAX_LINES` と `DEFAULT_MAX_BYTES` — 上限値として使い、切り詰めの有無を確かめる
- `@earendil-works/pi-coding-agent` の型とイベント（`ToolExecutionEndEvent`、`ExtensionAPI` の `on` と `exec`、`ExtensionContext` の `hasUI`）— 偽物を渡し、配線と `hasUI` が偽のとき鳴らないことを確かめる
- OS の一時領域 — `test/temp-dir.ts` の `tempDir()` で作り、実ファイルで指紋・読み込み・起動時読みを確かめ、`afterEach` で消す

### 06: scripts と `.pi/skills` のテストのうち、どれが不要か

- なし

## `consult-run-tool`

### ADR & Where

- No: 01
- Why: エントリー 01 の subject である 13 本のテストだけを変え、consult の他のテストとファイルが重ならないため。
- Where: worktree

### Goal

- 同じ分岐を確かめる組（`run/proc.test.ts:56` と `:123`、`:70` と `:136`、`run/place.test.ts:25` と `:73`、`run/log.test.ts:396` と `:556`）が、それぞれ1本に統合されている（`grep` で旧名が消え、新名が1つある）。
- 誰も読まない7件（`run/delivery.test.ts:133`、`run/place.test.ts:61`、`run/log.test.ts:211`、`run/log.test.ts:366`、`run/log.test.ts:433`、`tool/run.test.ts:52`、`tool/commit.test.ts:95`）が削除されている（`grep` で見つからない）。
- 型が保証する前提の3件（`tool/run.test.ts:36`、`:48`、`:59`）が削除されている（`grep` で見つからない）。
- 届かない分岐の4件（`run/log.test.ts:354`、`:171`、`:260`、`run/worktree.test.ts:352`）が削除されている（`grep` で見つからない）。
- 製品の出力文（`no change`、`committed: `、`lost`）を確かめる断言が残っている（`grep`）。
- 入力から取る値（`'consult-1'`、`123`、`2000`）をテストファイルに直書きしている箇所が、`consult.fixture.ts` のファクトリから来る形に直っている（テストファイルに `grep` して直書きが残らない）。
- 統合したテストが、残す振る舞いを表す名前を持つ（`grep` で旧名が消え、新名が1つある）。
- 統合したテストのケースが、`## Test cases` の形（型が保証する前提を再現しない、リテラルのダミーを書かない）に合っている（レビューが読む）。
- 削除と統合で意味が通らなくなる説明が直っている（`grep` で古い名前が見つからない）。
- `pnpm test:run .pi/extensions/consult/run .pi/extensions/consult/tool` が緑で、件数が 223 から減っている（実測を plan の記録に書く）。
- `pnpm typecheck`、`pnpm lint`、`pnpm format:check` が緑である。

### Non-goal

- 製品コードを変えない（`Scope` の `behaviour: out`、`refactor: out`）。
- 依存を足さない、減らさない（`Scope` の `dependency: out`）。
- 権限、互換性、エラーを変えない（`Scope` の `security: out`、`compatibility: out`、`errors: out`）。
- 案 A（統合と確認できた不要分だけを消す。減る数がおよそ25〜30件で、移行と旧形の互換性のテストが残るため）と案 C（3つの文書の字面で切る。製品の出力文を確かめる方法がなくなり、出力の退行に気づけないため）は採らない（`Options`）。

### Summary

- consult の run と tool のテストから、外から届かない分岐と誰も読まないテストを削除し、同じ分岐を確かめる組を統合する。
- 製品の出力文を確かめる断言は契約として残し、入力から取る値だけをファクトリに寄せる。

### Paths

- `.pi/extensions/consult/run/delivery.test.ts`
- `.pi/extensions/consult/run/log.test.ts`
- `.pi/extensions/consult/run/place.test.ts`
- `.pi/extensions/consult/run/proc.test.ts`
- `.pi/extensions/consult/run/worktree.test.ts`
- `.pi/extensions/consult/tool/commit.test.ts`
- `.pi/extensions/consult/tool/run.test.ts`

### Boundary

- Plans: なし
- External: なし

## `consult-policy-sub`

### ADR & Where

- No: 02
- Why: エントリー 02 の subject である 5 本のテストだけを変え、エントリー 01 の 13 本とファイルが重ならないため。
- Where: worktree

### Goal

- スキーマの前提を再現する4件（`policy/types.test.ts:34`、`:60`、`:64`、`:79`）が削除されている（`grep` で見つからない）。
- 誰も気づかない3件（`sub/budget.test.ts:34`、`:64`、`:74`）が削除されている（`grep` で見つからない）。
- 既知の抜けを記録する1件（`sub/guard.test.ts:108`）が削除されている（`grep` で見つからない）。
- `sub/guard.test.ts` の4組（`:36`/`:59`/`:74`、`:149`/`:174`、`:153`/`:160`/`:190`/`:219`/`:224`/`:233`/`:238`、`:178`/`:205`）が1本ずつに統合されている。
- `index.test.ts:74`、`:215` が、`run/delivery.test.ts` と `run/log.test.ts` と同じ分岐を確かめるため削除されている。`:155` は、音が off でも送ることを確かめるため残す。
- `sub/spec.test.ts:292` と `:303` が、`run/subagent.test.ts:81` と同じ argv を確かめるため削除されている。
- `sub/guard.test.ts` のフェイルクローズドの分岐（壊れた設定で書く道具と bash を止め、読むのは通す）を確かめるテストが残っている（`grep` で `broken` と `fail` の名前が残る）。
- 統合したテストが、残す振る舞いを表す名前を持つ（`grep` で旧名が消え、新名が1つある）。
- 統合したテストのケースが、`## Test cases` の形に合っている（レビューが読む）。
- 削除と統合で意味が通らなくなる説明が直っている（`grep` で古い名前が見つからない）。
- `pnpm test:run .pi/extensions/consult/policy .pi/extensions/consult/sub .pi/extensions/consult/index.test.ts` が緑で、件数が 105 から減っている（実測を plan の記録に書く）。
- `pnpm typecheck`、`pnpm lint`、`pnpm format:check` が緑である。

### Non-goal

- 製品コードを変えない（`Scope` の `behaviour: out`、`refactor: out`）。
- 依存を足さない、減らさない（`Scope` の `dependency: out`）。
- 権限の検査を弱めない（`Scope` の `security: in`）。`guard` の既知の抜けを記録するテストは削除するが、フェイルクローズドの分岐は残す。
- 互換性とエラーを変えない（`Scope` の `compatibility: out`、`errors: out`）。
- 案 B（`policy` の4件と `sub/guard.test.ts:108` を案内と記録として残す。同じ区画の中で基準を変えることになり、次のエントリーに一貫しない前例を残すため）は採らない（`Options`）。

### Summary

- consult の policy、sub、index のテストから、スキーマが保証する前提、誰も気づかない振る舞い、既知の抜けを記録するテストを削除する。
- 同じ分岐を確かめる組を統合し、権限のフェイルクローズドの分岐は残す。

### Paths

- `.pi/extensions/consult/policy/types.test.ts`
- `.pi/extensions/consult/sub/spec.test.ts`
- `.pi/extensions/consult/sub/guard.test.ts`
- `.pi/extensions/consult/sub/budget.test.ts`
- `.pi/extensions/consult/index.test.ts`

### Boundary

- Plans: なし
- External: なし

## `context-precompact`

### ADR & Where

- No: 03
- Why: エントリー 03 の subject である 14 本のテストだけを変え、他のエントリーのテストとファイルが重ならないため。
- Where: worktree

### Goal

- 定数の境界を確かめる3件（`settings/schema.test.ts:29`、`:35`、`:41`）が削除されている（`grep` で見つからない）。
- `prepare/compare.test.ts:69`、`:76`、`:82` の3本が1本に統合されている。
- `settings/read.test.ts:24` と `settings/schema.test.ts:47` が1本に統合されている。
- `prepare/prepare.test.ts:30` と `:41` が1本に統合されている。
- `command/precompact.test.ts:60` と `ui/status.test.ts` の `statusLine` の組が1本に統合されている。
- `gate/gate.test.ts:30` と `index.test.ts:269` の組が、`gate` の側を削除して `index` の側に1本化されている。`:26` は、ちょうどしきい値で prepared でない境界を確かめる唯一のテストのため残す。
- `index.test.ts:578` は分割されていない（2つの振る舞いを1本で持つ）。
- 統合したテストが、残す振る舞いを表す名前を持つ（`grep` で旧名が消え、新名が1つある）。
- 統合したテストのケースが、`## Test cases` の形に合っている（レビューが読む）。
- 削除と統合で意味が通らなくなる説明が直っている（`grep` で古い名前が見つからない）。
- `pnpm test:run .pi/extensions/context-precompact` が緑で、件数が 106 から減っている（実測を plan の記録に書く）。
- `pnpm typecheck`、`pnpm lint`、`pnpm format:check` が緑である。

### Non-goal

- 製品コードを変えない（`Scope` の `behaviour: out`、`refactor: out`）。
- 依存を足さない、減らさない（`Scope` の `dependency: out`）。
- 権限、互換性、エラーを変えない（`Scope` の `security: out`、`compatibility: out`、`errors: out`）。
- 案 B（レイヤーをまたぐ統合をしない。純計算の表と統合の経路を切り分けて残すため）は採らない（`Options`）。`gate` と `index` の重なりは統合する。

### Summary

- context-precompact のテストから、定数の境界を確かめるテストを削除し、同じ分岐を確かめる組を統合する。
- レイヤーをまたぐ `gate` と `index` の重なりも統合し、2つの振る舞いを持つ `index.test.ts:578` は分割しない。

### Paths

- `.pi/extensions/context-precompact/gate/gate.test.ts`
- `.pi/extensions/context-precompact/command/precompact.test.ts`
- `.pi/extensions/context-precompact/prepare/compare.test.ts`
- `.pi/extensions/context-precompact/prepare/prepare.test.ts`
- `.pi/extensions/context-precompact/settings/schema.test.ts`

### Boundary

- Plans: なし
- External: なし

## `thinking-scrub`

### ADR & Where

- No: 04
- Why: エントリー 04 の subject である 9 本のテストだけを変え、他のエントリーのテストとファイルが重ならないため。
- Where: worktree

### Goal

- 本当に気づかれない5件（`index.test.ts:274`、`live/guard.test.ts:113`、`live/guard.test.ts:142`、`detect.test.ts:219`、`state/cell.test.ts:16`）が削除されている（`grep` で見つからない）。
- `command/scrub.test.ts` の2組（`:55` と `:63`、`:71` と `:79`）が1本ずつに統合されている。
- `scrub/units.test.ts:217` と `:247` が1本に統合されている。
- `settings/schema.test.ts` の5本（`:41`、`:59`、`:70`、`:81`、`:92`）は統合されずに残っている（`grep` で5つの名前が残る）。
- `live/guard.test.ts:89` は残っている（`maxAborts` が 0 なら中断しない）。
- 統合したテストが、残す振る舞いを表す名前を持つ（`grep` で旧名が消え、新名が1つある）。
- 統合したテストのケースが、`## Test cases` の形に合っている（レビューが読む）。
- 削除と統合で意味が通らなくなる説明が直っている（`grep` で古い名前が見つからない）。
- `pnpm test:run .pi/extensions/thinking-scrub` が緑で、件数が 140 から減っている（実測を plan の記録に書く）。
- `pnpm typecheck`、`pnpm lint`、`pnpm format:check` が緑である。

### Non-goal

- 製品コードを変えない（`Scope` の `behaviour: out`、`refactor: out`）。
- 依存を足さない、減らさない（`Scope` の `dependency: out`）。
- 権限、互換性、エラーを変えない（`Scope` の `security: out`、`compatibility: out`、`errors: out`）。
- 案 A（`settings/schema.test.ts` の5本も統合する。既定値の補完と明示値の関係を1つの名前にまとめると、切り分けにくくなるため）は採らない（`Options`）。

### Summary

- thinking-scrub のテストから、本当に気づかれない5件を削除し、同じ分岐を確かめる組を統合する。
- `settings/schema.test.ts` の5本は、到達経路が違うため統合せずに残す。

### Paths

- `.pi/extensions/thinking-scrub/index.test.ts`
- `.pi/extensions/thinking-scrub/live/guard.test.ts`
- `.pi/extensions/thinking-scrub/scrub/detect.test.ts`
- `.pi/extensions/thinking-scrub/scrub/units.test.ts`
- `.pi/extensions/thinking-scrub/state/cell.test.ts`
- `.pi/extensions/thinking-scrub/command/scrub.test.ts`

### Boundary

- Plans: なし
- External: なし

## `quality-gate-sound`

### ADR & Where

- No: 05
- Why: エントリー 05 の subject である 6 本のテストだけを変え、他のエントリーのテストとファイルが重ならないため。
- Where: worktree

### Goal

- 3件（`sound-notify/index.test.ts:136`、`:312`、`settings/schema.test.ts:40`）が削除されている（`grep` で見つからない）。
- `quality-gate/report.test.ts` の4組（`:12`/`:13`/`:14`、`:15`/`:16`、`:19`/`:20`、`:21`/`:22`）が1本ずつに統合されている。
- `quality-gate/checks.test.ts` の2組（`:109`/`:116`、`:156`/`:176`）が1本ずつに統合されている。
- `quality-gate/targets.test.ts` の3本（`:75`、`:81`、`:87`）が1本に統合されている。
- `sound-notify` の2組（`settings/read.test.ts:9` と `index.test.ts:186`、`:24` と `:192`）が1本ずつに統合されている。
- `sound-notify/settings/schema.test.ts:68` と `:74` が1本に統合されている。
- 削除した `settings/schema.test.ts:40` の代わりに、出荷する `settings.json` が起動時の読み込み（`readSettings`）で `defaultSettings()` と一致することを、使い捨てのスクリプトで確かめる（CI では見張らない。ADR の案 B が受け入れた代償である）。
- 統合したテストが、残す振る舞いを表す名前を持つ（`grep` で旧名が消え、新名が1つある）。
- 統合したテストのケースが、`## Test cases` の形に合っている（レビューが読む）。
- 削除と統合で意味が通らなくなる説明が直っている（`grep` で古い名前が見つからない）。
- `pnpm test:run .pi/extensions/quality-gate .pi/extensions/sound-notify` が緑で、件数が 68 から減っている（実測を plan の記録に書く）。
- `pnpm typecheck`、`pnpm lint`、`pnpm format:check` が緑である。

### Non-goal

- 製品コードを変えない（`Scope` の `behaviour: out`、`refactor: out`）。
- 依存を足さない、減らさない（`Scope` の `dependency: out`）。
- `cmux` と `afplay` を実際に呼ぶテストは作らない（`Scope` の `security: out` の但し書き）。
- 互換性とエラーを変えない（`Scope` の `compatibility: out`、`errors: out`）。
- 案 A（`settings/schema.test.ts:40` を残す。実ファイルとコードの既定値の一致を CI で保つため）は採らない（`Options`）。

### Summary

- quality-gate と sound-notify のテストから、束ねた重複と気づかれないテスト、実ファイルを読むテストを削除する。
- 同じ分岐を確かめる組を統合し、`cmux` と `afplay` は引き続き偽物で確かめる。

### Paths

- `.pi/extensions/quality-gate/checks.test.ts`
- `.pi/extensions/quality-gate/report.test.ts`
- `.pi/extensions/quality-gate/targets.test.ts`
- `.pi/extensions/sound-notify/index.test.ts`
- `.pi/extensions/sound-notify/settings/schema.test.ts`

### Boundary

- Plans: なし
- External:
  - `@earendil-works/pi-coding-agent` の `DEFAULT_MAX_LINES` と `DEFAULT_MAX_BYTES`: 上限値として使い、切り詰めの有無を確かめる
    - Contract: `DEFAULT_MAX_LINES` と `DEFAULT_MAX_BYTES` の値が、切り詰めの境界になる
  - `@earendil-works/pi-coding-agent` の型とイベント: 偽物を渡し、配線と `hasUI` が偽のとき鳴らないことを確かめる
    - Contract: `ToolExecutionEndEvent`、`ExtensionAPI` の `on` と `exec`、`ExtensionContext` の `hasUI` の形
  - OS の一時領域: 実ファイルを作り、指紋・読み込み・起動時読みを確かめ、`afterEach` で消す
    - Contract: 一時ディレクトリを作れ、ファイルを書き、消せる

## `scripts-skills`

### ADR & Where

- No: 06
- Why: エントリー 06 の subject である 15 本のテストだけを変え、他のエントリーのテストとファイルが重ならないため。
- Where: worktree

### Goal

- CLI から届かない2件（`scripts/product-ready/targets.test.ts:58`、`:127`）が削除されている（`grep` で見つからない）。
- `scaffold.test.ts` の4組（`lastEntryNumber` の `:208`/`:213`、`appendEntry` の `:232`/`:242`、`createLeafDir` の `:112`/`:122`、`dirNames` の `:132`/`:144`）が1本ずつに統合されている。
- `scripts/checks/typecheck.test.ts:143` と `typecheck-staged.test.ts:128` が1本に統合されている。
- `.pi/skills/close/scripts/collect.test.ts:34` と `:38` が1本に統合されている。
- 統合したテストが、残す振る舞いを表す名前を持つ（`grep` で旧名が消え、新名が1つある）。
- 統合したテストのケースが、`## Test cases` の形に合っている（レビューが読む）。
- 削除と統合で意味が通らなくなる説明が直っている（`grep` で古い名前が見つからない）。
- `pnpm test:run scripts .pi/skills` が緑で、件数が 144 から減っている（実測を plan の記録に書く）。
- `pnpm typecheck`、`pnpm lint`、`pnpm format:check` が緑である。

### Non-goal

- 製品コードを変えない（`Scope` の `behaviour: out`、`refactor: out`）。
- 依存を足さない、減らさない（`Scope` の `dependency: out`）。
- 権限、互換性、エラーを変えない（`Scope` の `security: out`、`compatibility: out`、`errors: out`）。
- 案 B（`scaffold.test.ts` の4組を統合しない。ハーネスの道具の退行を入力ごとに見つけるため）は採らない（`Options`）。

### Summary

- scripts と `.pi/skills` のテストから、CLI から届かないテストを削除し、同じ分岐を確かめる組を統合する。
- テスト名が途中で切れている3件を、正式な名前に直す。

### Paths

- `scripts/checks/typecheck-staged.test.ts`
- `scripts/checks/typecheck.test.ts`
- `scripts/product-ready/targets.test.ts`
- `.pi/skills/adr/scripts/scaffold.test.ts`
- `.pi/skills/close/scripts/collect.test.ts`

### Boundary

- Plans: なし
- External: なし
