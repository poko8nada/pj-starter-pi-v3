# consult.code

Acceptance: `code` の子のコミットは ref で返り、agent が取り込むかを決める

## Todo

- `run.ts`
  - `installCommand` を書く — lockfile を見て初手のコマンドを決める（pnpm / npm / どちらも無ければ何もしない）
  - worktree を作った直後に install を走らせる。失敗は環境の失敗として扱う（設定の誤りとは区別する）
  - `commitWorktree` を書く — 変更をコミットしてブランチ `consult/<type>-<yyyymmdd-hhmmss>` を作る。変更が無ければ作らない。フックが落ちたら作らない
  - git の起動を引数で受け取る（テストで差し替えられるように）
- `index.ts`
  - worktree の type の結果に、ref と短い stat を載せる（親は取り込まない）
- `run.test.ts`
  - `pnpm-lock.yaml` がある → `pnpm install --frozen-lockfile` (happy)
  - `package-lock.json` がある → `npm ci` (happy)
  - どちらも無い → 何もしない (happy)
  - 変更あり → コミットされ、ブランチが返る (happy)
  - 変更なし → ブランチを作らない (happy)
  - フックが落ちたらブランチを作らない（子の出力は結果に残る） (error)
  - worktree を消してもブランチは残る (happy)

## Verify

- 実演: `code` でファイルを 1 つ作らせ、ref が返り、worktree が消え、親のツリーに変更が残らない（`git status` が空、`git branch` に ref）

## Notes

### Findings

- 実演の結果: `install: ok pnpm install --frozen-lockfile`（worktree に依存が入った）。子は `consult-demo-note.md` を作り、`{"kind":"committed","ref":"consult/demo"}` が返った。worktree は消え、親のツリーは汚れず、`git branch` に `consult/demo` が残った（`bfd00f8`）
- **コミットのフックで落ちた。** `createWorktree` が `.git/index: index file open failed: Not a directory` で失敗。lefthook が `GIT_INDEX_FILE` などの変数を環境に載せており、それを git にそのまま渡していたので、`cwd` の（一時）リポジトリではなくフックのリポジトリを見ていた。素の実行では再現しない（環境の差）。ローカルのテストが緑でも、フックの中では落ち得る
- フックが実際に走ることは、この実演では確かめられない。lefthook は非コードのファイルを飛ばすので、markdown 1 つの変更では検査が動かない。`.ts` を触らせれば動くが、子が落とす可能性もある（その場合は ref ができない = 決めたとおり）
- 親の取り込みは実装していない（チケットどおり）。ref を cherry-pick するか、一部を取るか、捨てるかは親の判断で、必要になったら次の 1 枚

### Unplanned

- `gitEnv` を足し、git を起動する 4 箇所（`isGitRepo` / `createWorktree` / `removeWorktree` / `worktreeGit`）と子の起動で `GIT_*` を落とすようにした。テストを 1 つ足した（`Todo` には無い）
- `runForInputs` を一般化した（`InputResult` → `InputOutcome<R>`、`{ok, run}` → `{ok, value}`）。子ごとの結果にコミットの結果を載せるため。step 3 のテスト 3 つが機械的に追随した（ケースの意味は変えていない）
- `consult` が 1 関数 80 行を超えたので、子 1 体分を `runOneChild` に切り出した（lint の指摘に合わせて引数は `ChildJob` にまとめた）
- ブランチ名に子の番号を足した（`<type>-<日時>-<番号>`）。同じ秒に複数の子が終わっても衝突しないため。チケットには `<type>-<yyyymmdd-hhmmss>` と書いた

Commit: 2af12e4
