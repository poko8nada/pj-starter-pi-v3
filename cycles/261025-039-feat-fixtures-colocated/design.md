# DESIGN 039

## Affected

### 01: テストのダブルとフィクスチャを、どこに置くか

- `scripts/harness/list.mjs` — `readList` が `scripts/harness/harness.json` を読む。`copy` が増えると、読む項目が増える。
- `vitest.config.ts` — `testConfig(false)` が `readList` の `copy` から除外を作る。`copy` の 2 行が、そのまま除外の 4 行になる。
- `scripts/harness/index.mjs` — `main` が `readList` の `copy` を歩いて、写す範囲を決める。
- `.pi/skills/plan/SKILL.md` — テストファイルのケースは `references/format.md` の `## Test cases` に従うと書いている。
- `.pi/skills/plan/references/tasks.md` — 形とテストのケースを `## Test cases` で読むと書いている。
- `.pi/skills/work/references/tasks.md` — テストの手順のケースを `## Test cases` で読むと書いている。
- 検査するもの: なし。振る舞いの側は、既存のテストと型検査と、この変更が足す検査が持つ。文書の側は、下の plan の `Verify` が `grep` で持つ。
- 生成されるもの: なし。

## External

### 01: テストのダブルとフィクスチャを、どこに置くか

- なし。この変更は、リポジトリの外と何も話さない。`vitest`、`oxlint`、`tsconfig` は、どれもリポジトリの中の設定。

## `test-fixtures-colocate`

### ADR & Where

- No: 01
- Why: フィクスチャの配置、`copy` の 2 行、検査が、`test/` の一覧という同じ入力を読む。分けると、`copy` と検査だけを先に入れた枝は、まだ `test/` にある 4 本が `copy` に無いので検査が赤になる（分割の 1 問目に当たる）。だから 1 つの worktree に置く。待つ相手は無い。
- Where: worktree

### Summary

- 機能が持つ 4 本を、その機能の隣へ移す。
- 6 本を `*.fixture.ts` に改名する（`test/temp-dir.ts` は補助なので、名前を変えない）。
- 31 本の import を直す。
- `harness.json` の `copy` に、`test/` に残る 2 本を名指しで足す。
- `test/` のファイルが `copy` にあることを見る検査を 1 つ足す。

### Paths

- `.pi/extensions/consult/consult.fixture.ts`
- `.pi/extensions/context-prune/prune.fixture.ts`
- `.pi/extensions/thinking-scrub/scrub.fixture.ts`
- `.pi/skills/close/scripts/collect.fixture.ts`
- `test/pi.fixture.ts`
- `test/scripts.fixture.ts`
- `test/consult-fixture.ts`
- `test/prune-fixture.ts`
- `test/scrub-fixture.ts`
- `test/close-fixture.ts`
- `test/pi-fixture.ts`
- `test/scripts-fixture.ts`
- `scripts/harness/harness.json`
- `scripts/harness/config.test.ts`
- `.pi/extensions/consult/index.test.ts`
- `.pi/extensions/consult/policy/types.test.ts`
- `.pi/extensions/consult/run/delivery.test.ts`
- `.pi/extensions/consult/run/log.test.ts`
- `.pi/extensions/consult/run/subagent.test.ts`
- `.pi/extensions/consult/sub/spec.test.ts`
- `.pi/extensions/consult/tool/consult.test.ts`
- `.pi/extensions/consult/tool/run.test.ts`
- `.pi/extensions/consult/tool/subagents.test.ts`
- `.pi/extensions/consult/tool/worktree.test.ts`
- `.pi/extensions/context-prune/apply/drafts.test.ts`
- `.pi/extensions/context-prune/command/prune.test.ts`
- `.pi/extensions/context-prune/entry/data.test.ts`
- `.pi/extensions/context-prune/entry/render.test.ts`
- `.pi/extensions/context-prune/index.test.ts`
- `.pi/extensions/context-prune/prune/collect.test.ts`
- `.pi/extensions/context-prune/prune/ports.test.ts`
- `.pi/extensions/context-prune/settings/read.test.ts`
- `.pi/extensions/context-prune/settings/schema.test.ts`
- `.pi/extensions/thinking-scrub/command/scrub.test.ts`
- `.pi/extensions/thinking-scrub/index.test.ts`
- `.pi/extensions/thinking-scrub/live/guard.test.ts`
- `.pi/extensions/thinking-scrub/scrub/detect.test.ts`
- `.pi/extensions/thinking-scrub/scrub/message.test.ts`
- `.pi/extensions/thinking-scrub/scrub/units.test.ts`
- `.pi/skills/close/scripts/collect.test.ts`
- `scripts/checks/typecheck.test.ts`
- `scripts/checks/typecheck-staged.test.ts`
- `scripts/harness/index.test.ts`
- `scripts/product-ready/cli.test.ts`
- `scripts/product-ready/index.test.ts`

### Boundary

- Plans: なし
- External: なし

## `plan-format-colocation`

### ADR & Where

- No: 01
- Why: `format.md` 1 本だけを書き換える。`test-fixtures-colocate` の 31 本とは重ならないが、記述は振る舞いより先にマージしない（`.pi/skills/design/references/format.md:81`）。だから `test-fixtures-colocate` を待つ。
- Where: worktree

### Summary

- `format.md` の `## Files` の `test/` を名指しする 1 行を、置き場所と名前と写し方の 7 つの規則に置き換える。
- 機能が持つ形は機能の隣、機能が持たない形は `test/`、名前は `*.fixture.ts`、`test/` は共有の場所。
- `test/temp-dir.ts` のような補助は偽物ではないので、名前を変えない。
- `test/` のファイルが写るテストから import されるなら、`copy` に名指しで入れる。

### Paths

- `.pi/skills/plan/references/format.md`

### Boundary

- Plans: なし
- External: なし
