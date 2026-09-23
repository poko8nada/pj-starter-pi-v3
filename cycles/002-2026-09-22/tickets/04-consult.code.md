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

なし

### Unplanned

なし

Commit:
