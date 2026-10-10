# tests.git-isolation

Acceptance:

- vitest が走らせるテストは、フックが渡す `GIT_*` や利用者の git 設定を引き継がない。テストが git を起動しても本体を汚せない

## Todo

- `vitest.setup.ts`（新規）
  - `process.env` から `GIT_*` を全部消す（`GIT_DIR`・`GIT_WORK_TREE`・`GIT_INDEX_FILE`・`GIT_CONFIG_COUNT`・`GIT_CONFIG_PARAMETERS` などを名前で選ばず一括で）
  - `GIT_CONFIG_GLOBAL` / `GIT_CONFIG_SYSTEM` を `os.devNull` へ
  - `HOME` / `XDG_CONFIG_HOME` を一時ディレクトリへ
  - 冒頭に理由を書く: フック（lefthook）の中で走ると環境がテストに漏れ、テストが本体に書く。004 と 007 で同じ事故が起きた。1 か所で丸ごと切る
- `vitest.config.ts` — `setupFiles` に `vitest.setup.ts` を足す
- テスト（`vitest.setup.ts` の隣、または `scripts/` の既存の形に合わせる）
  - テストの中では `process.env.GIT_DIR` などが無く、`HOME` が一時ディレクトリを指す（happy）
  - `squash.mjs` の `gitEnv` が `GIT_*` を落とす（happy、道具側の保証）

## Verify

### test

- `pnpm test:run`
  - 全件が緑（設定を入れて壊れていない）
- `GIT_DIR` / `GIT_WORK_TREE` / `GIT_INDEX_FILE` を注入して `pnpm test:run .pi/skills/work` を走らせ、この repo の状態（`HEAD`・ref・タグ・`config`・未到達オブジェクト数）が前後で変わらない

### read

- `review` の子に `vitest.setup.ts` を渡し、`.pi/../vitest.config.ts` も読ませる
  - 報告させる: テストに何が保証され、何が保証されないか（対象は vitest が走らせるテストだけ、本体の作業ツリーへの書き込みは対象外、など）

## Notes

### Findings

- `read`（consult-10）が見つけた残る穴: env を切っても、テストが `cwd` を本リポジトリ内にして git を起動すれば `.git` は親ディレクトリ走査で見つかる（本体は依然汚れ得る）。「テストが本体の作業ツリーに書く」クラスは未対策
- 一時ディレクトリ（`pi-test-home-…`）はテストファイルごとに 1 つ作り、消していない（OS の temp に残る）

### Unplanned

- 子供に渡す前に親が実装した（理由: 同じく、フックで子の作業が消える罠が未修正だったため。work の手順 2 の外れとして記録する）

Commit: ed840de（ex-17 の作業コミット。全件 208 件・毒（`GIT_DIR`/`GIT_WORK_TREE`/`GIT_INDEX_FILE`）を注入して走らせ、本体の状態が前後で同一・`read` 通過）
