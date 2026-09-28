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

### Unplanned

- なし

Commit: なし（何も変えない step）
