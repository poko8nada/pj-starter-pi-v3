# ADR 018

## 01: ハーネスをプロダクトとスターターの間で運ぶ

### Context

- プロダクトはスターターのクローンである。ハーネス（`.pi`、`scripts`、`definition` など）はプロダクトの中に残り、プロダクトを育てながら直っていく
- スターターを直した分をプロダクトへ取り込みたい。プロダクトで直したハーネスをスターターへ戻したい
- いまは手でファイルをコピーしている。`product:ready` がテストを消す運用だと、コピーのたびに差分が出て面倒である
- 向きは 2 つだが、操作は 1 つである。実行はどちらもプロダクトのディレクトリで行う

### Decision

- Status: **accepted**
- Adopted:
  - 1 つのスクリプト `scripts/harness.mjs` にする。向きは引数（`pull` / `push`）で指す
  - 一覧の対象 dir とファイルを、差分で合わせる（相手にしか無い物は消す、両方にある物は上書き、元にしか無い物は足す）
  - 除外はログのみ（`.pi/extensions/**/logs/`）。`types.json` と `settings.json` はコピーする
  - 既定は表示だけで、`--run` で実行する（`product:ready` と同じ流儀）
  - 一覧は `scripts/harness.json`、スターターの場所は `scripts/harness.local.json`（`~/...` の形、gitignore 対象）
  - git の差分は見ない。commit と検査はそれぞれの側で行い、スクリプトはコピーまでとする
- Options:
  - 2 つのスクリプトに分ける（同じ差分の計算を 2 か所に置く）
  - `git` のブランチや cherry-pick で運ぶ（プロダクトの履歴とスターターの履歴が揃っている前提が要る。選ぶ手間も増える）
  - `rsync` を使う（macOS と Linux では楽だが、除外の規則がコマンド列へ漏れる）
  - 丸ごと消して丸ごとコピーする（結果は同じになるが、差分が見えず、除外を消す側とコピーする側の 2 か所で守る必要がある）

### Research & Trial

- 対象（案）: `.pi/`（テスト 29 本を含む）、`scripts/`（テスト 5 本を含む）、`definition/`、`lib/`、`test/setup.ts`、`test/tmp.ts`、`AGENTS.md`、`lefthook.yaml`、`vitest.config.ts`、`tsconfig.json`、`.oxlintrc.json`、`.oxfmtrc.json`、`.github/workflows/`
- 対象外（案）: `memo/`、`cycles/`（スターターの記録）、`README.md` と `README.ja.md`（プロダクトの物へ書き換わる）、`.env*`、`node_modules/`、`dist/`
- `package.json` は 1 つのファイルに両方の物が入る（`scripts` と `devDependencies` はハーネス、`name` と `dependencies` はプロダクト）。対象に入れない
- `.pi/extensions/consult/types.json` と `.pi/extensions/intent-router/settings.json` は git 管理にある。`.pi/extensions/intent-router/logs/` は管理外（`.gitignore` の `logs/` に当たる）
- `~` の展開は `os.homedir()` で足りる

### Definition Change

- `Unit.harness-copy`(added): owner が、スターターのハーネスをプロジェクトへ取り込み、プロジェクトのハーネスをスターターへ戻せる

## 02: ハーネスのテストをプロダクトでどう扱うか

### Context

- いまの `product:ready` はハーネスのテストを削除する。消した状態でハーネスを更新すると、消えたテストが差分として出て、コピーのたびに揉める
- テストのファイル自体は悪ではない。プロダクトを作る際にハーネスのテストが回らなければよい
- プロダクト側もスターター側も、普段打つコマンドは同じにしたい。どちらの状態にいるかを意識したくない

### Decision

- Status: **accepted**
- Adopted:
  - `product:ready` はテストを消さない
  - 状態は小さな 1 ファイル（`starter` / `product`）に持つ。`product:ready` はそのファイルだけを書き換える
  - `vitest.config.ts` はそのファイルとハーネスの一覧を読み、`product` のとき `include` に否定を足す。`exclude` は既定を置き換えるので触らない
  - そのファイルは 01 のコピー対象から外す。配ると、プロダクトがスターターの状態に戻る
  - スターターでは全テスト、プロダクトではプロダクトのテストだけが既定で回る
  - ハーネスの型チェックはプロダクトでも残す（`checks/scopes.json` を消さない）
  - `cycles/` はこれまでどおり `product:ready` が消す
- Options:
  - テストを削除する（いまの形。ハーネスを更新するたびに差分が出る）
  - `vitest.config.ts` 自体を書き換える（同期のたびに食い違い、コピーで揉める）
  - 環境変数やフラグで切り替える（フックと手打ちの両方で毎回意識する）
  - 別の config（`vitest.harness.config.ts`）を置く（config が 2 つ並び、どちらが既定か分かりにくい）

### Research & Trial

- テストは 35 本。`.pi/` 29、`scripts/` 5、`test/env.test.ts` 1。すべてハーネスのテストである
- フックは `package.json` の名前しか見ない。pre-commit が `test:related`、pre-push が `test:run`（`lefthook.yaml`）。`test:` の名前は変えない
- `vitest.config.ts` は `passWithNoTests: true` を持ち、`include` / `exclude` は未設定。動いている実装は 4.1.11（`node_modules/vitest/package.json`）、指定は `^4.0.18`（`package.json`）
- `test.exclude` は既定を置き換える（`https://vitest.dev/config/exclude` の TIP、`node_modules/vitest/dist/chunks/coverage.DM_a_rWm.js:162-164`）
- `include` の `!` は除外として効く（`node_modules/vitest/dist/chunks/cli-api.CnMVyzaz.js:10893-10902`、`node_modules/.pnpm/tinyglobby@0.2.17/node_modules/tinyglobby/dist/index.mjs:180-196`）。`exclude` 側の `!` は捨てられる
- `related` も候補の段階で同じ `include` / `exclude` に掛かる（`cli-api.CnMVyzaz.js:10831-10843`、`11551-11574`）
- `defineConfig` はコールバックを取れる（`node_modules/vitest/dist/config.d.ts:94-98`）ので、設定を読むときに他のファイルを読める
- `passWithNoTests` は「見つからなくても失敗しない」（`https://vitest.dev/config/passWithNoTests`、`cli-api.CnMVyzaz.js:1965-1970`）。0 本のときの終了コード 0 の全経路は未確認
- 未確認: `related` と終了コードの実測。plan のテストで見る

### Definition Change

- `Unit.product-ready`(updated): owner が、ハーネスのテストを外した状態に切り替え、プロダクト開発を始められる

## 03: `scripts/` の並べ方

### Context

- いまの `scripts/harness-scopes.json` の意味は「専用の tsconfig を持つディレクトリ」である（読むのは `typecheck.mjs` と `typecheck-staged.mjs`）
- 01 のコピー対象の一覧を同じファイルへ足すと、1 つの名前に 2 つの意味が入る
- `.opencode` はこのリポジトリに無い

### Decision

- Status: **accepted**
- Adopted:
  - 一覧を意味ごとに分ける。コピーの対象は `harness.json`、型チェックの対象は `checks/scopes.json`
  - 検査を `checks/` にまとめ、`product:ready` は今の場所のままにする

  ```
  scripts/
    harness.json         ハーネスの一覧（01 のコピー対象と、除外する logs）
    harness.local.json   スターターの場所（gitignore 対象）
    harness.mjs          pull / push
    checks/
      typecheck.mjs
      typecheck-staged.mjs
      scopes.json        型チェックの対象（いまの harness-scopes.json の中身）
    product-ready/
      index.mjs
      cli.mjs
      targets.mjs
  ```

  - `package.json` の名前（`typecheck` / `typecheck:staged` / `product:ready`）は変えず、指すパスだけ変える
  - テストは今のままスクリプトの隣に置く（`*.test.ts`）
  - `scopes.json` から `.opencode` を消す

- Options:
  - `harness-scopes.json` にコピー対象を足す（1 つのファイルに 2 つの意味が入る）
  - `scripts/` の直下にすべて置く（型チェックと product-ready が混ざる）

### Research & Trial

- `scripts/harness-scopes.json` は `[".pi", ".opencode"]`
- 読む側は `scripts/typecheck.mjs`（`tsconfig.json` がある物だけ回す）と `scripts/typecheck-staged.mjs`（パスの先頭で tsconfig を選ぶ）
- `lefthook.yaml` と quality-gate は `pnpm` の名前だけを見る

### Definition Change

- なし
