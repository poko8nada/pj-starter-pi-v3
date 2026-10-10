# work.squash-backup

Acceptance:

- `squash.mjs` は、書き換える前に決まった 1 本のタグ（`squash-backup`）を上書きする。ユニットごとに増えないので、手順に「あとで消す」段が無くても残骸にならない

## Todo

- `.pi/skills/work/scripts/squash.mjs`
  - `backupTag(hashes, now)` をやめる。タグ名は固定の `squash-backup`
  - `run` の最初（`reset --soft` の前）に `git tag -f squash-backup <書き換える前の先頭>` で上書きする。今の `backupTag` の時刻とハッシュは要らなくなる
  - 乾燥の出力にも、どのタグをどこへ向けるかを出す
- `.pi/skills/work/scripts/squash.test.ts`
  - 2 回続けて走らせてもタグは 1 本で、常に直近の「書き換える前の先頭」を指す（happy）
  - 乾燥は何も変えない（今のケースを保つ。happy、boundary）
- `.pi/skills/work/SKILL.md` の step 11 — タグは `squash-backup` の 1 本で、squash のたびに上書きされる（消す段は無い）と直す
- `.pi/skills/close/SKILL.md` の step 2 — 残骸チェックの言い方を「`squash-backup` 以外のタグがあれば残骸」に直す

## Verify

### test

- `pnpm test:run .pi/skills/work`
  - 2 回続けて `run` → タグは 1 本、直近の書き換え前を指す（happy）
  - 乾燥は何も変えない（happy、boundary）

### cli

- 作業用のコピーで 2 つの範囲を続けて squash し、`git tag --list` が `squash-backup` 1 本で、`git rev-parse squash-backup` が直近の書き換え前を指すのを読む

### read

- `review` の子に `.pi/skills/work/SKILL.md` だけを渡す
  - 報告させる: 退避のタグはいつ、どう書かれ、ユニットを閉じた後に何が残るか

## Notes

### Findings

- 子供に渡す前に親が実装した（理由: 直しているのが「子の作業がフックで消える」罠で、その修正が入る前に子へ渡すと作業が失われうる。work の手順 2 の外れとして記録する）

### Unplanned

- 実演で親が 2 回引数を間違えた（範囲のハッシュを全部ではなく先頭だけ渡した）。どちらの回も `base..HEAD` の不一致でスクリプトが拒否した。安全網が効いた実例

Commit: 2577248（ex-16 の作業コミット。`test` 15 件・`cli`（コピーで 2 ユニット続けて、タグは 1 本）・`read` 通過）
