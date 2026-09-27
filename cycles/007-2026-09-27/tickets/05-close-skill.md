# close-skill

Acceptance:

- `close/SKILL.md` の `The review's checklist` が 2〜4 個で、渡すファイルが名指しされ、観点に「owner が見て同意したか」「直しが owner の指摘に答えているか」が入っている
- 手順が owner → レビュー → コミット の順で、レビューは 3 回までのループで収束する
- close で切ったチケットは `ex-` で名指しする

## Todo

- `.pi/skills/close/SKILL.md`
  - `## Steps` — owner に見せる段とレビューの段の順序を直し、3 回までのループと書く
  - `## The review's checklist` — 2〜4 個に絞り、渡すファイル（定義とチケットとこのチェックリスト）を名指しする
  - 穴を振り分ける段（4）— close で切るチケットの名前は `ex-<NN>-<step-name>`（`tickets/references/format.md` の `Names` を指す）と足す

## Verify

### read

- `review` の子に `.pi/skills/close/SKILL.md` だけを渡す
  - 報告させる: レビューの観点の数と渡すファイル、owner に見せる順序、close で切るチケットの名前

## Notes

### Findings

- なし

### Unplanned

- なし

Commit:
