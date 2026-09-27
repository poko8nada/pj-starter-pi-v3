# work.cycle-run

Acceptance:

- 作業はサイクル単位で進み、最後に止まって報告する
- ユニットの検証のあと、コミットの前にレビューが 1 回入る（観点は 2〜4 個、渡すファイルは名指し）
- `work/SKILL.md` step 7 が `../tickets/references/format.md` を指している
- 報告はサイクルの最後に 1 回で、そこで止まる

## Todo

- `.pi/skills/work/SKILL.md`
  - `# work` の前書き — 作業の単位はサイクル（owner が別に言わない限り）で、最後に 1 回報告して止まる、と書く
  - `## Steps` — ユニットの検証のあと・コミットの前に、レビューの子を 1 回入れる段を足す（観点 2〜4 個、渡すファイルを名指し、3 回までのループ）
  - step 7 — `../tickets/references/format.md` を指す 1 行を足す（`Verify` ブロックの形）
  - 最後の段（Report）— step ごとではなく、サイクルの最後に 1 回で、止まる形に直す

## Verify

### read

- `review` の子に `.pi/skills/work/SKILL.md` だけを渡す
  - 報告させる: 作業の単位（サイクル / チケット / step）、ユニットのレビューの位置と観点、step 7 が指すファイル、報告の回数と止まり方

## Notes

### Findings

- なし

### Unplanned

- なし

Commit: ad53d60（02 と同じコミット。`read` 通過）
