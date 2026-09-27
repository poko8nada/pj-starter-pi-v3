# consult.ref-content

Acceptance:

- ref のコミットに、子の成果だけが入る（子を起こした側の道具が残したファイルは入らない）

## Todo

- 観測（この step の最初にやる）
  - `trial` の子を 1 体走らせ、worktree に残る道具の作業ファイルの名前を、ref の `git show --stat` で確かめる
  - 分かった名前を、このチケットの `Notes` に書く
  - 外し方が `Files` の外のファイル（リポジトリの `.gitignore` など）に要るなら、owner に見せてから進める
- `.pi/extensions/consult/run/run.ts`
  - `commitWorktree` — 子の成果だけをコミットする（観測で分かった作業ファイルを外す）
  - `run/run.test.ts`
    - 作業ファイルがある worktree → コミットに入らない（新規 1 ケース）

## Verify

### test

- `pnpm test:run .pi/extensions/consult/run`
  - 作業ファイル（観測で分かった名前）と成果 → コミットに入るのは成果だけ（happy、新規）
  - 成果だけ → コミットに入り、ブランチが返る（happy、既存）
  - 何も残っていない → ブランチを作らない（boundary、既存）
  - フックが落ちる → ブランチを作らない（error、既存）
  - 権限 / 2 回目 / 並行 → 見ない（worktree に git を打つだけで、状態を持たない）

### look

- 実演の ref を `git show --stat` で読み、子が書いたファイルだけがあることを確かめる

## Notes

### Findings

- `consult/run/run.ts`（`commitWorktree`）: 004 が記録した「子の作業ファイル（`.flat` など）が成果と一緒に ref に入る」は、観測 2 回（小さい仕事 1 回、大きい grep と大きい read を踏む仕事 1 回）では再現しなかった（ref は子の `notes.md` だけ）。閉じるには: 再現したときに、そのファイル名をここに記録して、外し方を決める

### Unplanned

- なし（コードを変えていない。観測だけで、残る作業ファイルが出なかったため）

Commit: なし（観測 2 回で残る作業ファイルが出なかった。子の成果だけが ref に入っている）
