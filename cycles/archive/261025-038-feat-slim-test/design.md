# DESIGN 038

## Affected

### 01: 既存の 881 ケースを `## Test cases` に合わせるか

- `scripts/harness/index.mjs` — `.pi` の下を走査して写すので、テストファイルを読む。
- `scripts/checks/typecheck-staged.mjs` — lefthook が渡した staged のファイルを型検査するので、テストファイルを読む。
- `lefthook.yaml` — staged のファイルに `test:related` を走らせる。
- `package.json` — `test:run`、`test:related`、`typecheck`、`lint`、`format:check` の命令を定める。
- `vitest.starter.config.ts` — starter では全ファイルを走らせる。
- `vitest.config.ts` — harness の除外一覧から、product の実行範囲を定める。
- `scripts/harness/list.mjs` — `harness.json` から除外 glob を作る。
- `scripts/harness/harness.json` — `copy` の 14 項目が写す範囲を定める（`.pi`、`test/temp-dir.ts` ほか）。
- `tsconfig.json` — 8 つの拡張子を含め、`node_modules`、`dist`、`.pi`、`.opencode` を除く。`test/` の新しいファイルも拾う。
- `.pi/tsconfig.json` — `.pi` の下を含める。
- `scripts/checks/scopes.json` — `.pi` を型検査の範囲に挙げる。
- `scripts/checks/typecheck.mjs` — 範囲の `tsconfig` で型検査を走らせる。
- `.oxlintrc.json` — `test` と `spec` の全拡張子だけを緩め、`test/` の工場関数のファイルには 1 ファイル 480 行と 1 関数 80 行を課す。
- `.oxfmtrc.json` — 対象ファイルを含めて整形を検査する。
- 生成されるもの: なし。

## External

### 01: 既存の 881 ケースを `## Test cases` に合わせるか

- `vitest` — 全 55 本がこの上で走る。
  - Contract: `describe`、`it`、`expect`、`afterEach`。
- `node` 実行ファイル — 4 本が子プロセスで `.mjs` を起こす（`scripts/checks/typecheck.test.ts:24`、`scripts/checks/typecheck-staged.test.ts:26`、`scripts/harness/index.test.ts:31`、`scripts/product-ready/index.test.ts:58`）。
  - Contract: 終了符号と stdout と stderr。
- `HOME` — harness の 3 本が `~` の解決先として偽のディレクトリを子プロセスに渡す（`scripts/harness/index.test.ts:235`、`:646`、`:660`）。
  - Env: `HOME`。
- `CONSULT_ROOT` — worktree のテストが一時ディレクトリに逃がす（`.pi/extensions/consult/run/worktree.test.ts:183`）。
  - Env: `CONSULT_ROOT`。
- システム時刻 — 2 本が fake timers で固定し、1 本が `Date.now()` で開始時刻を記録する（`.pi/extensions/consult/index.test.ts:68`、`.pi/extensions/consult/run/worktree.test.ts:197`、`:230`、`.pi/extensions/consult/tool/consult.test.ts:134`）。
  - Env: fake timers。
- ローカルタイムゾーン — 記録時刻を `new Date(2026, 9, 10, 12, 0)` で作る（`.pi/extensions/consult/index.test.ts:85`）。
  - Env: `TZ`。
- OS のプロセス番号 — consult のテストが自分の pid の生存を見る（`.pi/extensions/consult/run/log.test.ts:146`）。
  - Env: pid。
- 実行ディレクトリ — typecheck のテストが `process.cwd()` から脚本の道を作る（`scripts/checks/typecheck.test.ts:15`）。
  - Env: cwd。
- ファイルシステムの実体 — typecheck のテストが `realpathSync` で macOS の `/var` を解く（`scripts/checks/typecheck.test.ts:36`）。
  - Env: シンボリックリンク。
- 実行権限 — typecheck のテストが `chmodSync(stub, 0o755)` で tsc の偽物を実行可能にする（`scripts/checks/typecheck.test.ts:54`）。
  - Env: POSIX の実行権限。
- OS の一時領域 — 26 本が `tempDir()` で書く（`test/temp-dir.ts:37`）。
  - Env: `tmpdir()`。
- Node の ICU ロケールデータ — context-prune のテストの期待値 `'1,234'` を作る（`.pi/extensions/context-prune/format/count.test.ts:5`）。
  - Env: ICU。

## `slim-consult`

### ADR & Where

- No: 01
- Why: consult と consult/tool の 18 本が同じ拡張のソースを試し、他の plan とファイルが重ならないので待たない。
- Where: worktree

### Summary

- consult の 18 本・376 ケースを指針に合わせる。
- 同じ仕様を 2 本で試している組を 1 本にし、断言から直書きを外し、形を推測した偽物を外から形が与えられている口に置き換える。
- 落とすケースは、`consult` のソースを読んで、同じ振る舞いを他のケースが押さえているかを確かめてから落とす。

### Paths

- `.pi/extensions/consult/index.test.ts`
- `.pi/extensions/consult/policy/types.test.ts`
- `.pi/extensions/consult/run/delivery.test.ts`
- `.pi/extensions/consult/run/log.test.ts`
- `.pi/extensions/consult/run/place.test.ts`
- `.pi/extensions/consult/run/proc.test.ts`
- `.pi/extensions/consult/run/subagent.test.ts`
- `.pi/extensions/consult/run/worktree.test.ts`
- `.pi/extensions/consult/sub/budget.test.ts`
- `.pi/extensions/consult/sub/guard.test.ts`
- `.pi/extensions/consult/sub/spec.test.ts`
- `.pi/extensions/consult/tool/commit.test.ts`
- `.pi/extensions/consult/tool/consult.test.ts`
- `.pi/extensions/consult/tool/render.test.ts`
- `.pi/extensions/consult/tool/run.test.ts`
- `.pi/extensions/consult/tool/sound.test.ts`
- `.pi/extensions/consult/tool/subagents.test.ts`
- `.pi/extensions/consult/tool/worktree.test.ts`

### Boundary

- Plans: なし
- External:
  - `vitest`: 18 本がこの上で走る。
    - Contract: `describe`、`it`、`expect`。
  - `CONSULT_ROOT`: worktree のテストが一時ディレクトリに逃がす。
    - Env: `CONSULT_ROOT`。
  - システム時刻: 2 本が fake timers で固定し、1 本が `Date.now()` で開始時刻を記録する。
    - Env: `vi.setSystemTime`。
  - ローカルタイムゾーン: 記録時刻を `new Date(2026, 9, 10, 12, 0)` で作る。
    - Env: `TZ`。
  - OS のプロセス番号: 自分の pid の生存を見る。
    - Env: pid。
  - OS の一時領域: `tempDir()` で書く。
    - Env: `tmpdir()`。

## `slim-context-prune`

### ADR & Where

- No: 01
- Why: 14 本が同じ拡張のソースを試し、他の plan とファイルが重ならない。`slim-thinking-scrub` の `test/pi-fixture.ts` を待つ。
- Where: worktree

### Summary

- context-prune の 14 本・167 ケースを指針に合わせる。
- 拡張の実在の `settings.json` を読むケースを落とし、既定は `defaultSettings()` から導き、断言から直書きを外す。
- 落とすケースは、`context-prune` のソースを読んで、同じ振る舞いを他のケースが押さえているかを確かめてから落とす。

### Paths

- `.pi/extensions/context-prune/apply/drafts.test.ts`
- `.pi/extensions/context-prune/command/prune.test.ts`
- `.pi/extensions/context-prune/doc.test.ts`
- `.pi/extensions/context-prune/entry/data.test.ts`
- `.pi/extensions/context-prune/entry/render.test.ts`
- `.pi/extensions/context-prune/format/count.test.ts`
- `.pi/extensions/context-prune/index.test.ts`
- `.pi/extensions/context-prune/prune/collect.test.ts`
- `.pi/extensions/context-prune/prune/judge.test.ts`
- `.pi/extensions/context-prune/prune/plan.test.ts`
- `.pi/extensions/context-prune/prune/ports.test.ts`
- `.pi/extensions/context-prune/prune/run.test.ts`
- `.pi/extensions/context-prune/settings/read.test.ts`
- `.pi/extensions/context-prune/settings/schema.test.ts`

### Boundary

- Plans:
  - `test/pi-fixture.ts`: `slim-thinking-scrub` が作る。この plan はそれを使う。
- External:
  - `vitest`: 14 本がこの上で走る。
    - Contract: `describe`、`it`、`expect`。
  - Node の ICU ロケールデータ: `formatCount` の期待値 `'1,234'` を作る。
    - Env: ICU。
  - OS の一時領域: `tempDir()` で書く。
    - Env: `tmpdir()`。

## `slim-thinking-scrub`

### ADR & Where

- No: 01
- Why: 9 本が同じ拡張のソースを試し、他の plan とファイルが重ならないので待たない。`test/pi-fixture.ts` を `slim-context-prune` に渡す。
- Where: worktree

### Summary

- thinking-scrub の 9 本・137 ケースを指針に合わせる。
- 通知文と指示文の直書きを製品の文から導き、工場関数を `test/` に置く。
- 落とすケースは、`thinking-scrub` のソースを読んで、同じ振る舞いを他のケースが押さえているかを確かめてから落とす。

### Paths

- `.pi/extensions/thinking-scrub/command/scrub.test.ts`
- `.pi/extensions/thinking-scrub/index.test.ts`
- `.pi/extensions/thinking-scrub/live/guard.test.ts`
- `.pi/extensions/thinking-scrub/scrub/detect.test.ts`
- `.pi/extensions/thinking-scrub/scrub/message.test.ts`
- `.pi/extensions/thinking-scrub/scrub/units.test.ts`
- `.pi/extensions/thinking-scrub/settings/read.test.ts`
- `.pi/extensions/thinking-scrub/settings/schema.test.ts`
- `.pi/extensions/thinking-scrub/state/cell.test.ts`

### Boundary

- Plans:
  - `test/pi-fixture.ts`: この plan が作り、`slim-context-prune` が使う。
- External:
  - `vitest`: 9 本がこの上で走る。
    - Contract: `describe`、`it`、`expect`。
  - OS の一時領域: `tempDir()` で書く。
    - Env: `tmpdir()`。

## `slim-quality-gate`

### ADR & Where

- No: 01
- Why: 3 本が同じ拡張のソースを試し、他の plan とファイルが重ならないので待たない。
- Where: worktree

### Summary

- quality-gate の 3 本・46 ケースを指針に合わせる。
- porcelain の解析の期待値を入力から導き、断言から直書きを外す。
- 落とすケースは、`quality-gate` のソースを読んで、同じ振る舞いを他のケースが押さえているかを確かめてから落とす。

### Paths

- `.pi/extensions/quality-gate/checks.test.ts`
- `.pi/extensions/quality-gate/report.test.ts`
- `.pi/extensions/quality-gate/targets.test.ts`

### Boundary

- Plans: なし
- External:
  - `vitest`: 3 本がこの上で走る。
    - Contract: `describe`、`it`、`expect`。
  - OS の一時領域: `tempDir()` で書く。
    - Env: `tmpdir()`。

## `slim-sound-notify`

### ADR & Where

- No: 01
- Why: 1 本がその拡張のソースを試し、他の plan とファイルが重ならないので待たない。
- Where: worktree

### Summary

- sound-notify の 1 本・24 ケースを指針に合わせる。
- 事件の中身を推測した偽物 3 つを、外から形が与えられている口に置き換える。
- 落とすケースは、`sound-notify` のソースを読んで、同じ振る舞いを他のケースが押さえているかを確かめてから落とす。

### Paths

- `.pi/extensions/sound-notify/index.test.ts`

### Boundary

- Plans: なし
- External:
  - `vitest`: 1 本がこの上で走る。
    - Contract: `describe`、`it`、`expect`。

## `slim-skills`

### ADR & Where

- No: 01
- Why: adr と close の 2 本が同じ `tempDir()` を使い、他の plan とファイルが重ならないので待たない。
- Where: worktree

### Summary

- adr scaffold と close collect の 2 本・24 ケースを指針に合わせる。
- 日付と見出しの期待値を製品の書式から導き、雛形を工場関数に寄せる。
- 落とすケースは、2 つのスクリプトのソースを読んで、同じ振る舞いを他のケースが押さえているかを確かめてから落とす。

### Paths

- `.pi/skills/adr/scripts/scaffold.test.ts`
- `.pi/skills/close/scripts/collect.test.ts`

### Boundary

- Plans: なし
- External:
  - `vitest`: 2 本がこの上で走る。
    - Contract: `describe`、`it`、`expect`。
  - OS の一時領域: `tempDir()` で書く。
    - Env: `tmpdir()`。

## `slim-scripts`

### ADR & Where

- No: 01
- Why: `scripts/` の 8 本が同じハーネスのスクリプトを試し、他の plan とファイルが重ならないので待たない。
- Where: worktree

### Summary

- typecheck、harness、product-ready の 8 本・107 ケースを指針に合わせる。
- 表示文の直書きを製品の文から導き、工場関数を `test/` に置く。
- 落とすケースは、`scripts/` のソースを読んで、同じ振る舞いを他のケースが押さえているかを確かめてから落とす。

### Paths

- `scripts/checks/typecheck.test.ts`
- `scripts/checks/typecheck-staged.test.ts`
- `scripts/harness/config.test.ts`
- `scripts/harness/index.test.ts`
- `scripts/harness/list.test.ts`
- `scripts/product-ready/cli.test.ts`
- `scripts/product-ready/index.test.ts`
- `scripts/product-ready/targets.test.ts`

### Boundary

- Plans: なし
- External:
  - `vitest`: 8 本がこの上で走る。
    - Contract: `describe`、`it`、`expect`。
  - `node` 実行ファイル: 4 本が子プロセスで `.mjs` を起こす。
    - Contract: 終了符号と stdout と stderr。
  - `HOME`: harness の 3 本が `~` の解決先として偽のディレクトリを渡す。
    - Env: `HOME`。
  - 実行ディレクトリ: typecheck のテストが `process.cwd()` から脚本の道を作る。
    - Env: cwd。
  - ファイルシステムの実体: typecheck のテストが `realpathSync` で `/var` を解く。
    - Env: シンボリックリンク。
  - 実行権限: typecheck のテストが `chmodSync` で tsc の偽物を実行可能にする。
    - Env: POSIX の実行権限。
  - OS の一時領域: `tempDir()` で書く。
    - Env: `tmpdir()`。
