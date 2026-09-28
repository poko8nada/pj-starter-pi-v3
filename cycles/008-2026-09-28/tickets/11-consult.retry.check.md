# consult.retry.check

Acceptance:

- 単位の `Then` を全部、1 回で確かめる

Owner: at the end

## Todo

- なし（`consult.retry` の step 9・10 が作った物を、1 回の実行で確かめるだけ）

## Verify

### test

- `pnpm test consult` と、実際のリポジトリでの 1 回の実行
  - 1 回目だけ落ちる pre-commit フック → 拒否 → 同じ worktree で `--continue` → 2 回目で `ref` ができる（happy）
  - 2 回とも落ちるフック → worktree が残り、親に理由（落ちた検査の出力、変えたファイル、子の最後の本文、走った回数、時刻、worktree の id）が届く（error）
  - 上限で打ち切られる → 同じループが 1 回走り、それでも止まれば打ち切りと回数が本文に明示される（error）
  - 上限は 1 回ごとに数えられ、使用量は合算して 1 回分として報告される（happy）
  - 2 回目にも同じ `AbortController` が渡る（中断で 2 回目も止まる）（error）

## Notes

### Findings

- なし
- 親が `.check` を実行した（2026-09-28 14:59）
  - `pnpm test:run consult` → 8 files / 205 tests passed。`Verify` の 5 行は `run/retry.test.ts` が覆えている: 「1 回目だけ拒否→2 回目で ref」「2 回とも拒否→worktree が残り理由が返る」「中断されていれば 2 回目は走らない」「上限で止まったら続きが 1 回走る」「2 回とも打ち切り→回数が本文に出る」「2 回の使用量が合算される」。git と pre-commit フックは本物を使っている
  - 未対応: `Verify` の「実際のリポジトリでの 1 回の実行」は、本物の子を 1 体走らせる形では実施していない（この repo のフックを一時的に落とす変更が必要になる）。覆えている範囲は同じ（本物の git とフックを使うテスト）

### Unplanned

- なし

Commit: なし（何も変えない step）
