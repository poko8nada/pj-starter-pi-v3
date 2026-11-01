# PLAN `design-research-merge`

- No: 02

## Files

```text
.pi/
  skills/
    design/
      SKILL.md                    update
      references/
        format.md
        tasks.md                  update
    yolo/
      SKILL.md
scripts/
  harness/
    harness.json
lefthook.yaml
package.json
.oxfmtrc.json
```

## Slices

## 1.リサーチを 1 人に

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/design/SKILL.md`:
   - step 2 の「Run two `research` subagents per `accepted` entry, at once: one walks the paths the change affects, the other finds what the change talks to outside the repository. Hand both the entry and the files the entry rewrites — the subject. The tasks are in `references/tasks.md`.」を、`accepted` エントリごとに 1 つの `research` サブエージェントを走らせ、変更が触れるパスと、リポジトリの外で話すものを同じ 1 人に答えさせ、エントリと subject を渡し、タスクは `references/tasks.md` に 1 つあると書き直す。
2. `.pi/skills/design/references/tasks.md`:
   - `## Walk the paths the change affects (a research subagent)` と `## Find what the change talks to outside (a research subagent)` を `## Walk the change (a research subagent)` の 1 つにまとめ、2 つの観点（結果を読むもの・検査するもの・生成されるもの の 3 組と、外で話すもの）を 1 つのタスクの中に置き、`:37` の「It runs beside the paths' walk, one per entry.」を消して 1 人で答えるタスクに合う文にし、`## Review the design` のタスクは変えず、限界・打ち切りを求める行は足さない。

### Verify

- Always:
  - 関連するテスト（`pnpm test:related <changed files>`。関連が無ければ `pnpm test:run`）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - このスライスが変えた文書に古い文言が残っていないことを、`grep -rin "two \`research\` subagents" .pi/skills/design` が 0 件であることで見る
- Added:
  - other — `grep -c "^## " .pi/skills/design/references/tasks.md` が 2 で、見出しが `## Walk the change (a research subagent)` と `## Review the design (a review subagent)` であることを見る（`research` のタスクが 1 つであることの数え方）
  - other — `grep -c "runs beside the paths' walk" .pi/skills/design/references/tasks.md` が 0 であることを見る（`:37` の文が消えたこと）
  - other — `## Walk the change` の節に、`reads the result`、`checks it`、`generated from it`、`outside the repository` の 4 つがそれぞれ 1 回以上あることを `grep -c` で見る（2 つの観点が残ったこと）
  - other — `git diff .pi/skills/design/references/tasks.md` を読み、`## Review the design` の節に差分が無いことを見る
  - other — `grep -in "limit\|打ち切り\|stopped" .pi/skills/design/references/tasks.md` が 0 件であることを見る（限界・打ち切りを求める行が無いこと、打ち切りの扱いを新しく定める行が無いこと）
  - other — `git diff --stat` で `.pi/skills/design/references/format.md` と `.pi/skills/yolo/SKILL.md` に差分が無いことを見る

## Notes

### Slice 1: リサーチを 1 人に

- Findings:
  - Verify の `grep -in "limit\|打ち切り\|stopped"` が 0 件にならず 1 件残る。`## Walk the change` 内の外側の例示 `a service, a contract, an environment, data, a limit` の `a limit` がヒットする（変更前からある文言の継承）。
    - left: 外で話すものの観点を残すためと `SKILL.md` の `the outside` 列挙との整合のため `a limit` を残した。削って件数合わせをすると観点・整合を壊す。Verify の意図（限界・打ち切りを求める行・打ち切りの新規定が無いこと）は満たすが、文字通りの 0 件は満たさない。
- Unplanned: なし
- Commit: f0d9ade
- Stopped:

### Cleanup: test files

- 対象: plan の `Files` で `update` 指定の `.pi/skills/design/SKILL.md` と `.pi/skills/design/references/tasks.md` に対応するテストファイル。`design/` 配下にテストは無く、全テスト中にも当該文書を参照するテストは無い（`test:related` は該当なし）。plan に `## Test cases` は無い。
- 結果: 削除なし（重複・消滅行為・分岐消滅・書かないはずのケースのいずれも該当なし）。
- Suite: `pnpm test:run` 796 件合格（本掃除後に再実行して確認。変更は無い）。

## Work Review

### Round 1

- Stale: なし — 旧文言（`two `research` subagents`、旧2見出し、`runs beside the paths' walk`）は `.pi/skills/design` に残っていないことを `grep` で確認し、`.pi/skills/design/references/format.md` と `.pi/skills/yolo/SKILL.md` に件数言及の残骸は無い。
- Unlisted: なし — `git diff --stat` の変更は `.pi/skills/design/SKILL.md` と `.pi/skills/design/references/tasks.md` の2件のみで、いずれも `## Files` の `update` 指定と一致する。
- Gaps: なし — `Steps` の書換え（単数化・タスク統合・`:37`文削除・`Review`不変・打切り行なし・関連外無差分）は `Verify` の `Added` 6件と `Always` の残存文言 `grep` に対応し、`git diff` を読んで内容の一致を確認した。
- Unproven: なし — 計画にテストファイルの `Steps` が無く（`### Test cleanup` も対応テストなしを記録）、`Added` の各 `grep` は対象の文言・件数が壊れれば赤になる。
- Noise: なし — 計画にテストファイルの `Steps` が無く、`Added` は型・スキーマ・DB制約が保証する前提の再現でも、誰も気づかない行為の検査でも無い。
- Doubts:
  - `Verify` の `grep -in "limit\|打ち切り\|stopped"` が文字通り0件にならず、`.pi/skills/design/references/tasks.md:18` の例示 `a limit`（および `.pi/skills/design/SKILL.md:32` の同例示）が1件残るが、`## Notes` の `Slice 1: Findings` に継承文言として `left` 理由付きで記録済みのため所見としない。

## Acceptance

- Ran: 変えた 2 ファイルの diff を読んだ（文書の plan なので、読むことが検査である）。`pnpm test:run`（58 ファイル、796 テスト）、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`、いずれも緑。`Verify` の `Always`: `grep -rin "two `research` subagents" .pi/skills/design` が 0 件。`Verify` の `Added`: `grep -c "^## " .pi/skills/design/references/tasks.md` が 2、`grep -c "runs beside the paths' walk"` が 0、`reads the result`、`checks it`、`generated from it`、`outside the repository` が `## Walk the change` の節に各 1 件以上、`## Review the design` の節に差分なし、`git diff --stat` で `design/references/format.md` と `yolo/SKILL.md` に差分なし。`grep -in "limit\|打ち切り\|stopped"` は 1 件で、それは変更前から在る例示 `a limit` であり、限界・打ち切りを求める行が増えていないことは diff で確かめた。
- Findings: なし
- Doubts: なし
