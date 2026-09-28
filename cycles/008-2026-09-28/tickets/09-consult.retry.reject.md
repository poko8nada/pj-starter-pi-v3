# consult.retry.reject

Acceptance:

- フックに拒否されると `ref` が作られず、`finally` が worktree を消すので子の作業が消える、が解ける: 拒否されたら同じ worktree で `--continue` の子がもう 1 回走る（フックの出力が渡る）。通れば `ref` ができる
- 2 回目も通ったとき以外の道が無い、が解ける: 通らなければ worktree が残り、親に理由（落ちた検査の出力、変えたファイル、子の最後の本文、走った回数、時刻、worktree の id）が届く
- 2 回目にも中断の口が渡らない、が解ける: 同じ `AbortController` が渡る

Owner: at the end

## Todo

- `.pi/extensions/consult/tool/consult.ts`
  - `runOneChild` — 拒否されたときの分岐（同じ worktree で `--continue` の子をもう 1 回、上限 1 回）と、2 回目も通らなかったときに `removeWorktree` を呼ばない条件
  - 結果の組み立て — 拒否の理由、`git status --porcelain` から作る変えたファイルの一覧、子の最後の本文、走った回数、時刻、worktree の id
- `.pi/extensions/consult/run/run.ts`
  - `runPi` — 追加の引数（`--continue`）を渡せるようにする
- `.pi/extensions/consult/run/stopped.ts`（add）
  - `writeStopped(worktree, record)` / `readStopped(worktree)` — 記録（理由、変えたファイル、回数、時刻）を worktree の**外**（親ディレクトリ）に置く。子には書かせない
- `.pi/extensions/consult/tool/consult.ts`
  - `commitWorktree` の `failed` を、親への結果（本文）に組み込む
- `.pi/extensions/consult/README.md`
  - 拒否されたときの説明（いまは「worktree は消される」と書いてある）を、残る形に直す

## Verify

### test

- `pnpm test consult`（5 ケース。1・2 行）
  - 1 回目だけ拒否する pre-commit フック → 2 回目が走り、`ref` ができる（happy）
  - 2 回とも拒否するフック → worktree が残り、結果に理由（落ちた検査の出力）・変えたファイル・子の最後の本文・回数・時刻・id が入る（error）
  - 中断（`cancel`）→ 2 回目も止まる（error）
  - worktree が残ったあと → `git worktree list` にその 1 行がある（error のあと）
  - 子が 0 体のまま `--continue` が失敗する → 新しい会話で走る（error からの回復）

### read

- `review` の子に `.pi/extensions/consult/README.md` を渡す
- 合格: 拒否されたときの流れ（同じ worktree でもう 1 回、通らなければ残る）が書いてある（1・2 行）

## Notes

### Findings

- なし

### Unplanned

- なし

Commit:
