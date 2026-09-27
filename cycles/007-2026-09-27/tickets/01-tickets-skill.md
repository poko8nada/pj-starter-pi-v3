# tickets-skill

Acceptance:

- `tickets/SKILL.md` の `The review's checklist` が 2〜4 個で、渡すファイルが名指しされ、観点に「owner が見て同意したか」「直しが owner の指摘に答えているか」が入っている
- 手順が owner → レビュー → コミット の順で、レビューは 3 回までのループで収束する
- `Commit:` は同じユニットの 1 コミットを名指し、step の時点では空のまま
- close で切ったチケットは `ex-<NN>-<step-name>`
- `### read` に「何が返れば合格か」の欄がある

## Todo

- `.pi/skills/tickets/SKILL.md`
  - `## Steps` — owner に見せる段とレビューの段を「owner → レビュー → コミット」の順に直し、ループは 3 回までと書く
  - `## The review's checklist` — 2〜4 個に絞り、渡すファイル（チケットとプラン）を名指しする
- `.pi/skills/tickets/references/format.md`
  - `## Notes` の `Commit:` — 「同じユニットの 1 コミット。step の時点では空」に変える
  - `## Names` — close で切ったチケットは `ex-<NN>-<step-name>` を足す
  - `## Verify` — `### read` に「何が返れば合格か」を書く、を足す

## Verify

### read

- `review` の子に `.pi/skills/tickets/SKILL.md` と `.pi/skills/tickets/references/format.md` だけを渡す
  - 報告させる: レビューの観点の数と渡すファイル、誰が先に見るか、`Commit:` をいつ何を書くか、close 由来のチケットの名前、`read` の期待値の欄

## Notes

### Findings

- なし

### Unplanned

- なし

Commit:
