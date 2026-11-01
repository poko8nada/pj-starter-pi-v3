# DESIGN 050

## Affected

### 01: 用語と表記の基準を、どこまで決めるか

- なし

### 02: コードのコメントとテスト名を、どこまで直すか

- なし

### 03: 利用者に見える文字列と、エージェントへの指示文を、どう直すか

- `.pi/extensions/consult/policy/types.ts`
- `.pi/extensions/consult/tool/consult.ts`
- `.pi/extensions/consult/sub/spec.ts`
- `.pi/extensions/consult/policy/types.test.ts`
- `.pi/extensions/consult/tool/worktree.test.ts`
- `.pi/extensions/consult/sub/guard.test.ts`
- `.pi/extensions/thinking-scrub/scrub.fixture.ts`
- `.pi/extensions/thinking-scrub/command/scrub.test.ts`
- `.pi/skills/adr/scripts/scaffold.test.ts`
- `.pi/skills/close/scripts/collect.test.ts`
- `.pi/skills/adr/references/format.md`
- `.pi/skills/close/references/format.md`
- `.pi/skills/adr/SKILL.md`
- `.pi/skills/close/SKILL.md`

### 04: 利用者向け文書を、どこまで直すか

- なし

### 05: エージェント向け文書を、意味を変えずにどう直すか

- `scripts/product-ready/targets.mjs`
- `scripts/product-ready/index.mjs`
- `scripts/product-ready/blocks.mjs`
- `scripts/product-ready/cli.mjs`
- `scripts/product-ready/readme-format.test.ts`
- `scripts/product-ready/index.test.ts`
- `scripts/product-ready/targets.test.ts`
- `README.md`
- `README.ja.md`

## External

### 01: 用語と表記の基準を、どこまで決めるか

- なし

### 02: コードのコメントとテスト名を、どこまで直すか

- なし

### 03: 利用者に見える文字列と、エージェントへの指示文を、どう直すか

- なし

### 04: 利用者向け文書を、どこまで直すか

- なし

### 05: エージェント向け文書を、意味を変えずにどう直すか

- なし

## `comments-consult`

### ADR & Where

- No: 02
- Why: `.pi/extensions/consult/` のコメントとテスト名は、同じ基準と同じファイル群を読む。この plan の変更では branch の型検査、lint、整形、関連テストは緑のままで、待つ plan はない。
- Where: worktree

### Goal

- この plan のファイルで、`pnpm test:related`、`pnpm typecheck`、`pnpm lint`、`pnpm format:check` が通る。
- この plan のファイルのコメントとテスト名から、`作業場`、`置き場`、`目録`、`畳む`、`穴`（比喩）、`採る`、`純`（略記）、`工場`、`口`、`手`、`木`、`骨`、`番人`、`水位`、`残り物`、`雛形` が消え、対応表の語になっている (grep で 0 件)。
- この plan のファイルの各コメントを、1 行ずつ基準に照らして判断している (diff の読みで、直した行と残した行の理由が言える)。
- 危険なコメント（不変条件、契約、振る舞い、引用、意図）は、コードを読んだ上で意味が保たれている (diff の読み)。
- テスト名は直り、テストのデータは変わっていない (diff)。
- JSDoc の `@param`、`@returns`、`@typedef` の欄の構造は変わっていない (diff)。
- コメントの行の折り返しと句点は、文を読みやすくするために変わってよい (diff の読み)。
- 文字列リテラルとテストのデータは変わっていない (diff)。
- 一覧にない語は、規則に照らして判断している (diff の読み)。
- `format:in` と `prose:in` の範囲（コメント、JSDoc、テスト名、テストの説明）だけが変わっている (diff)。

### Non-goal

- 実行時の振る舞いを変えない (behaviour.out)。
- コードの構造、関数の分割、名前を変えない (refactor.out、naming.out)。
- 依存を足さない (dependency.out)。
- 速度、セキュリティ、互換性、エラー、配布、移行、ログを扱わない (speed/security/compatibility/errors/deploy/migration/logs.out)。
- 文字列リテラルとテストのデータは直さない (エントリー 03。案 B は採らなかった)。
- コメントを直さずに残さない (案 C は採らなかった)。
- 基準に合う行を書き換えない (案 B は採らなかった)。
- Markdown の文書と `cycles/` は直さない。

### Summary

- `.pi/extensions/consult/` のコメントとテスト名を、基準に合わないものだけ直す。振る舞いとテストのデータは変えない。

### Paths

- `.pi/extensions/consult/consult.fixture.ts`
- `.pi/extensions/consult/index.test.ts`
- `.pi/extensions/consult/index.ts`
- `.pi/extensions/consult/policy/types.test.ts`
- `.pi/extensions/consult/policy/types.ts`
- `.pi/extensions/consult/run/delivery.test.ts`
- `.pi/extensions/consult/run/delivery.ts`
- `.pi/extensions/consult/run/log.test.ts`
- `.pi/extensions/consult/run/log.ts`
- `.pi/extensions/consult/run/place.test.ts`
- `.pi/extensions/consult/run/place.ts`
- `.pi/extensions/consult/run/proc.test.ts`
- `.pi/extensions/consult/run/proc.ts`
- `.pi/extensions/consult/run/run.ts`
- `.pi/extensions/consult/run/subagent.test.ts`
- `.pi/extensions/consult/run/subagent.ts`
- `.pi/extensions/consult/run/worktree.test.ts`
- `.pi/extensions/consult/run/worktree.ts`
- `.pi/extensions/consult/sub/budget.test.ts`
- `.pi/extensions/consult/sub/budget.ts`
- `.pi/extensions/consult/sub/guard.test.ts`
- `.pi/extensions/consult/sub/guard.ts`
- `.pi/extensions/consult/sub/spec.test.ts`
- `.pi/extensions/consult/sub/spec.ts`
- `.pi/extensions/consult/tool/commit.test.ts`
- `.pi/extensions/consult/tool/commit.ts`
- `.pi/extensions/consult/tool/consult.test.ts`
- `.pi/extensions/consult/tool/consult.ts`
- `.pi/extensions/consult/tool/render.test.ts`
- `.pi/extensions/consult/tool/render.ts`
- `.pi/extensions/consult/tool/run.test.ts`
- `.pi/extensions/consult/tool/run.ts`
- `.pi/extensions/consult/tool/sound.test.ts`
- `.pi/extensions/consult/tool/sound.ts`
- `.pi/extensions/consult/tool/subagents.test.ts`
- `.pi/extensions/consult/tool/subagents.ts`
- `.pi/extensions/consult/tool/worktree.test.ts`
- `.pi/extensions/consult/tool/worktree.ts`

### Boundary

- Plans: なし
- External: なし

## `comments-extensions`

### ADR & Where

- No: 02
- Why: `context-precompact`、`quality-gate`、`sound-notify`、`thinking-scrub` のコメントとテスト名は、consult と別のファイル群を読む。この plan の変更では branch の型検査、lint、整形、関連テストは緑のままで、待つ plan はない。
- Where: worktree

### Goal

- この plan のファイルで、`pnpm test:related`、`pnpm typecheck`、`pnpm lint`、`pnpm format:check` が通る。
- この plan のファイルのコメントとテスト名から、`作業場`、`置き場`、`目録`、`畳む`、`穴`（比喩）、`採る`、`純`（略記）、`工場`、`口`、`手`、`木`、`骨`、`番人`、`水位`、`残り物`、`雛形` が消え、対応表の語になっている (grep で 0 件)。
- この plan のファイルの各コメントを、1 行ずつ基準に照らして判断している (diff の読みで、直した行と残した行の理由が言える)。
- 危険なコメント（不変条件、契約、振る舞い、引用、意図）は、コードを読んだ上で意味が保たれている (diff の読み)。
- テスト名は直り、テストのデータは変わっていない (diff)。
- JSDoc の `@param`、`@returns`、`@typedef` の欄の構造は変わっていない (diff)。
- コメントの行の折り返しと句点は、文を読みやすくするために変わってよい (diff の読み)。
- 文字列リテラルとテストのデータは変わっていない (diff)。
- 一覧にない語は、規則に照らして判断している (diff の読み)。
- `format:in` と `prose:in` の範囲（コメント、JSDoc、テスト名、テストの説明）だけが変わっている (diff)。

### Non-goal

- 実行時の振る舞いを変えない (behaviour.out)。
- コードの構造、関数の分割、名前を変えない (refactor.out、naming.out)。
- 依存を足さない (dependency.out)。
- 速度、セキュリティ、互換性、エラー、配布、移行、ログを扱わない (speed/security/compatibility/errors/deploy/migration/logs.out)。
- 文字列リテラルとテストのデータは直さない (エントリー 03。案 B は採らなかった)。
- コメントを直さずに残さない (案 C は採らなかった)。
- 基準に合う行を書き換えない (案 B は採らなかった)。
- Markdown の文書と `cycles/` は直さない。

### Summary

- 4 つの拡張のコメントとテスト名を、基準に合わないものだけ直す。振る舞いとテストのデータは変えない。

### Paths

- `.pi/extensions/context-precompact/apply/draft.test.ts`
- `.pi/extensions/context-precompact/apply/draft.ts`
- `.pi/extensions/context-precompact/command/precompact.test.ts`
- `.pi/extensions/context-precompact/command/precompact.ts`
- `.pi/extensions/context-precompact/gate/gate.test.ts`
- `.pi/extensions/context-precompact/gate/gate.ts`
- `.pi/extensions/context-precompact/index.test.ts`
- `.pi/extensions/context-precompact/index.ts`
- `.pi/extensions/context-precompact/prepare/compare.test.ts`
- `.pi/extensions/context-precompact/prepare/compare.ts`
- `.pi/extensions/context-precompact/prepare/copied.test.ts`
- `.pi/extensions/context-precompact/prepare/copied.ts`
- `.pi/extensions/context-precompact/prepare/guard.test.ts`
- `.pi/extensions/context-precompact/prepare/guard.ts`
- `.pi/extensions/context-precompact/prepare/prepare.test.ts`
- `.pi/extensions/context-precompact/prepare/prepare.ts`
- `.pi/extensions/context-precompact/prepare/types.ts`
- `.pi/extensions/context-precompact/run/ports.test.ts`
- `.pi/extensions/context-precompact/run/ports.ts`
- `.pi/extensions/context-precompact/run/summarize.test.ts`
- `.pi/extensions/context-precompact/run/summarize.ts`
- `.pi/extensions/context-precompact/settings/constants.ts`
- `.pi/extensions/context-precompact/settings/read.test.ts`
- `.pi/extensions/context-precompact/settings/read.ts`
- `.pi/extensions/context-precompact/settings/schema.test.ts`
- `.pi/extensions/context-precompact/settings/schema.ts`
- `.pi/extensions/context-precompact/test/session-entries.ts`
- `.pi/extensions/context-precompact/ui/count.test.ts`
- `.pi/extensions/context-precompact/ui/count.ts`
- `.pi/extensions/context-precompact/ui/status.test.ts`
- `.pi/extensions/context-precompact/ui/status.ts`
- `.pi/extensions/quality-gate/checks.test.ts`
- `.pi/extensions/quality-gate/checks.ts`
- `.pi/extensions/quality-gate/index.ts`
- `.pi/extensions/quality-gate/report.test.ts`
- `.pi/extensions/quality-gate/report.ts`
- `.pi/extensions/quality-gate/targets.test.ts`
- `.pi/extensions/quality-gate/targets.ts`
- `.pi/extensions/sound-notify/index.test.ts`
- `.pi/extensions/sound-notify/index.ts`
- `.pi/extensions/sound-notify/settings/read.test.ts`
- `.pi/extensions/sound-notify/settings/read.ts`
- `.pi/extensions/sound-notify/settings/schema.test.ts`
- `.pi/extensions/sound-notify/settings/schema.ts`
- `.pi/extensions/thinking-scrub/command/scrub.test.ts`
- `.pi/extensions/thinking-scrub/command/scrub.ts`
- `.pi/extensions/thinking-scrub/index.test.ts`
- `.pi/extensions/thinking-scrub/index.ts`
- `.pi/extensions/thinking-scrub/live/guard.test.ts`
- `.pi/extensions/thinking-scrub/live/guard.ts`
- `.pi/extensions/thinking-scrub/scrub.fixture.ts`
- `.pi/extensions/thinking-scrub/scrub/detect.test.ts`
- `.pi/extensions/thinking-scrub/scrub/detect.ts`
- `.pi/extensions/thinking-scrub/scrub/message.test.ts`
- `.pi/extensions/thinking-scrub/scrub/message.ts`
- `.pi/extensions/thinking-scrub/scrub/units.test.ts`
- `.pi/extensions/thinking-scrub/scrub/units.ts`
- `.pi/extensions/thinking-scrub/settings/read.test.ts`
- `.pi/extensions/thinking-scrub/settings/read.ts`
- `.pi/extensions/thinking-scrub/settings/schema.test.ts`
- `.pi/extensions/thinking-scrub/settings/schema.ts`
- `.pi/extensions/thinking-scrub/state/cell.test.ts`
- `.pi/extensions/thinking-scrub/state/cell.ts`

### Boundary

- Plans: なし
- External: なし

## `comments-scripts`

### ADR & Where

- No: 02
- Why: `scripts/`、`lib/`、`test/`、`vitest.config.ts`、`.pi/skills/*/scripts/` のコメントとテスト名は、拡張と別のファイル群を読む。この plan の変更では branch の型検査、lint、整形、関連テストは緑のままで、待つ plan はない。
- Where: worktree

### Goal

- この plan のファイルで、`pnpm test:related`、`pnpm typecheck`、`pnpm lint`、`pnpm format:check` が通る。
- この plan のファイルのコメントとテスト名から、`作業場`、`置き場`、`目録`、`畳む`、`穴`（比喩）、`採る`、`純`（略記）、`工場`、`口`、`手`、`木`、`骨`、`番人`、`水位`、`残り物`、`雛形` が消え、対応表の語になっている (grep で 0 件)。
- この plan のファイルの各コメントを、1 行ずつ基準に照らして判断している (diff の読みで、直した行と残した行の理由が言える)。
- 危険なコメント（不変条件、契約、振る舞い、引用、意図）は、コードを読んだ上で意味が保たれている (diff の読み)。
- テスト名は直り、テストのデータは変わっていない (diff)。
- JSDoc の `@param`、`@returns`、`@typedef` の欄の構造は変わっていない (diff)。
- コメントの行の折り返しと句点は、文を読みやすくするために変わってよい (diff の読み)。
- 文字列リテラルとテストのデータは変わっていない (diff)。
- 一覧にない語は、規則に照らして判断している (diff の読み)。
- `format:in` と `prose:in` の範囲（コメント、JSDoc、テスト名、テストの説明）だけが変わっている (diff)。

### Non-goal

- 実行時の振る舞いを変えない (behaviour.out)。
- コードの構造、関数の分割、名前を変えない (refactor.out、naming.out)。
- 依存を足さない (dependency.out)。
- 速度、セキュリティ、互換性、エラー、配布、移行、ログを扱わない (speed/security/compatibility/errors/deploy/migration/logs.out)。
- 文字列リテラルとテストのデータは直さない (エントリー 03。案 B は採らなかった)。
- コメントを直さずに残さない (案 C は採らなかった)。
- 基準に合う行を書き換えない (案 B は採らなかった)。
- Markdown の文書と `cycles/` は直さない。

### Summary

- `scripts/`、`lib/`、`test/`、`vitest.config.ts`、`.pi/skills/*/scripts/` のコメントとテスト名を、基準に合わないものだけ直す。振る舞いとテストのデータは変えない。

### Paths

- `.pi/skills/adr/scripts/scaffold.mjs`
- `.pi/skills/adr/scripts/scaffold.test.ts`
- `.pi/skills/close/scripts/collect.fixture.ts`
- `.pi/skills/close/scripts/collect.mjs`
- `.pi/skills/close/scripts/collect.test.ts`
- `lib/git-env.mjs`
- `scripts/checks/typecheck-staged.mjs`
- `scripts/checks/typecheck-staged.test.ts`
- `scripts/checks/typecheck.mjs`
- `scripts/checks/typecheck.test.ts`
- `scripts/harness/collect/index.mjs`
- `scripts/harness/collect/index.test.ts`
- `scripts/harness/config.test.ts`
- `scripts/harness/diff/index.mjs`
- `scripts/harness/diff/index.test.ts`
- `scripts/harness/display/index.mjs`
- `scripts/harness/display/index.test.ts`
- `scripts/harness/index.mjs`
- `scripts/harness/index.test.ts`
- `scripts/harness/list/index.mjs`
- `scripts/harness/list/index.test.ts`
- `scripts/harness/path/index.mjs`
- `scripts/harness/path/index.test.ts`
- `scripts/product-ready/blocks.mjs`
- `scripts/product-ready/cli.mjs`
- `scripts/product-ready/cli.test.ts`
- `scripts/product-ready/index.mjs`
- `scripts/product-ready/index.test.ts`
- `scripts/product-ready/readme-format.test.ts`
- `scripts/product-ready/targets.mjs`
- `scripts/product-ready/targets.test.ts`
- `test/pi.fixture.ts`
- `test/scripts.fixture.ts`
- `test/temp-dir.ts`
- `vitest.config.ts`

### Boundary

- Plans: なし
- External: なし

## `strings`

### ADR & Where

- No: 03
- Why: `comments-consult`、`comments-extensions`、`comments-scripts` と同じファイルの文字列を変える。この plan は 3 つの plan の後に置き、それらが終わるまで待つ。
- Where: worktree

### Goal

- `worktree.ts` の出力が `作業場` ではなく `ワークツリー` を使う (grep で `作業場は無い` が 0 件)。
- `scrub.ts` の出力が `無い` ではなく `ない` を使う (grep で `last: まだ無い` が 0 件)。
- `scaffold.mjs` の雛形が `採用した形` と `採用しなかった理由` を使う (grep)。
- `types.json` の `review` のロールが `根拠をつけてください` を使う (grep)。
- `なし` と `未特定` は残る (diff)。
- テストの字面が追随し、`pnpm test:related`、`pnpm typecheck`、`pnpm lint`、`pnpm format:check` が通る。
- ロール指示の意味と条件は変わらない (diff の読み)。
- `proofreader` ロールの `root→根、version→版、tree→木` は残る (diff)。
- 判定、終了コード、出力の構造、指示の意味は変わらない (diff の読み)。
- 文言の句点、括弧、記号だけが変わる (diff)。
- テストのデータは、実行時の文字列を写している場合だけ変わる (diff)。
- 保存済みの記録の文言と、記録の形式は変わらない (diff)。

### Non-goal

- 振る舞いの判定、終了コード、出力の構造を変えない (`behaviour.in` の条件)。
- コードの構造、依存、キー名、ロール名、コマンド名、ファイル名、保存する項目名を変えない (refactor/dependency/naming.out)。
- 速度、セキュリティ、互換性、配布、ログを扱わない (speed/security/compatibility/deploy/logs.out)。
- `なし` と `未特定` の書式の値は変えない (案 B は採らなかった)。
- 利用者に見える文字列だけを直して、ロール指示と雛形を残さない (案 C は採らなかった)。
- 保存済みの記録の文言と、記録の形式は変えない (migration.in の条件)。
- `collect.mjs` の判定の動作、`isNone` の読み戻しは変えない。
- Markdown の文書は直さない (エントリー 04、05)。

### Summary

- 実行時の文字列、エラーメッセージ、ロール指示、雛形を、基準に合わないものだけ直す。`なし` と `未特定` は残し、テストの字面を追随させる。

### Paths

- `.pi/extensions/consult/types.json`
- `.pi/extensions/consult/index.test.ts`
- `.pi/extensions/consult/sub/budget.ts`
- `.pi/extensions/consult/sub/guard.test.ts`
- `.pi/extensions/consult/sub/guard.ts`
- `.pi/extensions/consult/sub/spec.test.ts`
- `.pi/extensions/consult/tool/consult.test.ts`
- `.pi/extensions/consult/tool/worktree.test.ts`
- `.pi/extensions/consult/tool/worktree.ts`
- `.pi/extensions/thinking-scrub/command/scrub.test.ts`
- `.pi/extensions/thinking-scrub/command/scrub.ts`
- `.pi/extensions/thinking-scrub/scrub.fixture.ts`
- `.pi/skills/adr/scripts/scaffold.mjs`
- `.pi/skills/adr/scripts/scaffold.test.ts`
- `.pi/skills/close/scripts/collect.mjs`
- `.pi/skills/close/scripts/collect.test.ts`
- `scripts/product-ready/readme-format.test.ts`
- `scripts/product-ready/index.test.ts`

### Boundary

- Plans: `comments-consult`、`comments-extensions`、`comments-scripts` (同じファイルのコメントとテスト名。この plan はその後に置く)
- External: なし

## `readme`

### ADR & Where

- No: 04
- Why: 3 つの利用者向け文書は、他の plan とファイルが重ならず、単独で読める。この plan の変更では branch の型検査、lint、整形、関連テストは緑のままで、待つ plan はない。
- Where: worktree

### Goal

- `README.ja.md` と `.pi/extensions/thinking-scrub/README.ja.md` から、`雛形`、`置き場`、`worktree`（日本語文中）、`畳む` が消え、対応表の語になっている (grep で 0 件)。
- 基準に合わない行だけを直し、合う行は残している (diff の読み)。
- `README.md` の対応する英文が、日本語の表現の変更に追随している (diff)。
- 見出しの名前、リンク先、引用が残っている (diff)。
- `.pi/extensions/thinking-scrub/README.ja.md` も同じ基準で直り、英語の `README.md` は日本語が変わった場合だけ追随している (diff)。
- 見出しの階層、表、コードブロック、リンクの構造が変わっていない (diff)。
- 本文、見出し、表の説明、箇条書きが、基準に合わない行だけ変わっている (diff)。
- `pnpm format:check`、`pnpm lint`、`pnpm typecheck`、`pnpm test:related` が通る。

### Non-goal

- 実行時の振る舞い、構造、依存、速度、セキュリティ、互換性、エラー、配布、移行、ログを扱わない (Scope.out)。
- 見出しの名前、リンク先、コマンド名、ファイル名を変えない (naming.out)。
- `rules/readme.format.md` の雛形と `readme-format.test.ts` は変えない (エントリー 05 が持つ)。
- 英語の本文を、日本語の変更と関係なく書き換えない (owner の指示。案 B は採らなかった)。
- 対応表の語だけを直して、体言止めと長い文を残さない (案 C は採らなかった)。
- `README.md` の英語の見出しを変えない。
- `cycles/` は直さない。

### Summary

- 2 枚の日本語 README を、基準に合わない行だけ直す。見出しとリンクを保ち、英語の `README.md` を追随させる。

### Paths

- `README.ja.md`
- `README.md`
- `.pi/extensions/thinking-scrub/README.ja.md`

### Boundary

- Plans: なし
- External: なし

## `docs`

### ADR & Where

- No: 05
- Why: `strings` が変える `scaffold.mjs` の雛形に、`adr/references/format.md` と `adr/SKILL.md` が追随する。この plan は `strings` の後に置き、それが終わるまで待つ。
- Where: worktree

### Goal

- `DEFINITION.md` の `definition-file` と `definition-rules` の行が `全体像` を使い、`subagent-consult` の行が `ワークツリー` を使う (grep)。
- `基準に合わない行だけを直し、合う行は残している (diff の読み)。
- `close/references/format.md` と `close/SKILL.md:37` が `出どころ` を使う (grep で `<穴>` が 0 件)。
- `adr/references/format.md` と `adr/SKILL.md:112` が `採用した形` と `採用しなかった` を使う (grep)。
- `ROADMAP.md:31,32` の引用と、`0.x.x` の 11 件、`cycles` の列は変わっていない (diff)。
- `rules/readme.format.md` の英語と日本語の雛形の対が保たれている (diff)。
- `scripts/product-ready/readme-format.test.ts`、`scripts/product-ready/index.test.ts`、`scripts/product-ready/targets.test.ts` が通り、`pnpm test:related`、`pnpm typecheck`、`pnpm lint`、`pnpm format:check` が通る。
- 規則 1、2、6、7、8、9 に照らして、1 行ずつ直している (diff の読み)。
- Unit の名前を変えていない (diff)。
- 書式の名前と placeholders が、エントリー 03 の変更に合っている (diff)。
- 書式の構造（見出し、欄）が変わっていない (diff)。
- `SKILL.md` の日本語の引用が追随し、英語の本文が変わっていない (diff)。
- 引用と列挙が残っている (diff)。

### Non-goal

- 振る舞い、構造、依存、速度、セキュリティ、エラー、配布、ログを扱わない (Scope.out)。
- コメントとテスト名 (エントリー 02) と、文字列 (エントリー 03) は変えない。
- `README.md`、`README.ja.md`、`.pi/extensions/thinking-scrub/README.ja.md` (エントリー 04) は変えない。
- 英語の `SKILL.md` の本文は変えない (Scope.out)。
- `cycles/` と `ROADMAP.md` の完了した項目は変えない (migration.out)。
- 書式の構造（見出し、欄）を変えない (Scope.out)。
- 規則の意味を変える全文の書き直しをしない (案 B は採らなかった)。
- 対応表の語だけを直して、規則 7、8、9 を残さない (案 C は採らなかった)。

### Summary

- エージェント向け文書の、基準に合わない行だけを直す。書式の名前と雛形を `strings` に合わせ、`product:ready` と `readme-format.test.ts` を壊さない。

### Paths

- `DEFINITION.md`
- `ROADMAP.md`
- `rules/definition.format.md`
- `rules/definition.rules.md`
- `rules/readme.format.md`
- `rules/roadmap.md`
- `.pi/skills/adr/references/format.md`
- `.pi/skills/adr/references/tasks.md`
- `.pi/skills/close/references/format.md`
- `.pi/skills/close/references/tasks.md`
- `.pi/skills/design/references/format.md`
- `.pi/skills/design/references/tasks.md`
- `.pi/skills/plan/references/format.md`
- `.pi/skills/plan/references/tasks.md`
- `.pi/skills/work/references/tasks.md`
- `.pi/skills/upgrade/references/report.md`
- `.pi/skills/upgrade/references/tasks.md`
- `.pi/skills/adr/SKILL.md`
- `.pi/skills/close/SKILL.md`
- `.pi/skills/design/SKILL.md`
- `.pi/skills/plan/SKILL.md`
- `.pi/skills/work/SKILL.md`
- `.pi/skills/upgrade/SKILL.md`
- `.pi/skills/yolo/SKILL.md`
- `scripts/product-ready/readme-format.test.ts`
- `scripts/product-ready/index.test.ts`
- `scripts/product-ready/targets.test.ts`

### Boundary

- Plans: `strings` (the scaffold's template and the strings; this plan follows it)
- External: なし
