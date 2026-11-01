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
- Unplanned:
- Commit:
- Stopped:

## Work Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Unproven:
- Noise:
- Doubts:

## Acceptance

- Ran:
- Findings:
- Doubts:
