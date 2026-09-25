# consult.code

Acceptance:

- `code` の子のコミットは ref で返る
- agent が取り込むかを決める

## Todo

- `run.ts`
  - `installCommand` を書く — lockfile を見て初手のコマンドを決める
    - `pnpm-lock.yaml` があれば `pnpm install --frozen-lockfile`
    - `package-lock.json` があれば `npm ci`
    - どちらも無ければ何もしない
  - worktree を作った直後に install を走らせる
    - 失敗は環境の失敗として扱う（設定の誤りとは区別する）
  - `commitWorktree` を書く — 変更をコミットしてブランチ `consult/<type>-<yyyymmdd-hhmmss>` を作る
    - 変更が無ければ作らない
    - フックが落ちたら作らない
  - git の起動を引数で受け取る（テストで差し替えられるように）
- `index.ts`
  - worktree の type の結果に、ref と短い stat を載せる
    - 親は取り込まない
- `run.test.ts`
  - `pnpm-lock.yaml` がある → `pnpm install --frozen-lockfile` (happy)
  - `package-lock.json` がある → `npm ci` (happy)
  - どちらも無い → 何もしない (happy)
  - 変更あり → コミットされ、ブランチが返る (happy)
  - 変更なし → ブランチを作らない (happy)
  - フックが落ちたらブランチを作らない (error)
    - 子の出力は結果に残る
  - worktree を消してもブランチは残る (happy)

## Verify

- 実演: `code` でファイルを 1 つ作らせる
  - ref が返る（`git branch` に ref）
  - worktree が消える
  - 親のツリーに変更が残らない（`git status` が空）

## Notes

### Findings

- 実演の結果
  - worktree に依存が入った
  - 子は `consult-demo-note.md` を作った
  - `{"kind":"committed","ref":"consult/demo"}` が返った
  - worktree は消えた
  - 親のツリーは汚れていない
  - `git branch` に `consult/demo` が残った（`bfd00f8`）
- **コミットのフックで落ちた**
  - `createWorktree` が `.git/index: index file open failed: Not a directory` で失敗した
  - lefthook が `GIT_INDEX_FILE` などの変数を環境に載せていた
  - それを git にそのまま渡していた
    - git は `cwd` の一時リポジトリではなくフックのリポジトリを見ていた
  - 素の実行では再現しない（環境の差）
  - ローカルのテストが緑でも、フックの中では落ち得る
- フックが実際に走ることは、この実演では確かめられない
  - lefthook は非コードのファイルを飛ばす
  - markdown 1 つの変更では検査が動かない
  - `.ts` を触らせれば動くが、子が落とす可能性もある
    - その場合は ref ができない（決めたとおり）
- 親の取り込みは実装していない（チケットどおり）
  - ref の扱いは親の判断
    - cherry-pick する
    - 一部を取る
    - 捨てる
  - 必要になったら次の 1 枚

### Unplanned

- `gitEnv` を足した
  - git を起動する 4 箇所と子の起動で `GIT_*` を落とす
  - テストを 1 つ足した（`Todo` には無い）
- `runForInputs` を一般化した（子ごとの結果にコミットの結果を載せるため）
  - step 3 のテスト 3 つが機械的に追随した（ケースの意味は変えていない）
- 子 1 体分を `runOneChild` に切り出した（`consult` が lint の 80 行を超えたため）
- ブランチ名に子の番号を足した（`<type>-<日時>-<番号>`）
  - 同じ秒に複数の子が終わっても衝突しないため
- チケットには `<type>-<yyyymmdd-hhmmss>` と書いた

Commit: 2af12e4
