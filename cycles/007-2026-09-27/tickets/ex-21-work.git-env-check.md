# work.git-env-check

Acceptance:

- git を起動するコードが `GIT_*` を落としていなければ、コミットが通らない
- テストが本体のリポジトリを汚す経路があれば、コミットが通らない（毒環境でテストを走らせ、前後で本体の状態が変われば落とす）

## Todo

- `scripts/test-guarded.mjs`（新規）— フックの `test` を包む
  - 空の decoy リポジトリ（`git init` を一時ディレクトリで）を作る
  - `GIT_DIR` / `GIT_WORK_TREE` / `GIT_INDEX_FILE` を decoy に向けて `vitest related --run <渡されたファイル>` を走らせる
  - 走らせる前後で本体の状態（`HEAD`・`for-each-ref`・`git tag`・`config --local --list`・`git status --porcelain`・未到達オブジェクト数）を取り、変わっていれば非 0 で終わる
    - 作業ツリーも見る（テストが `cwd` を本体にしてファイルを書く形を捕まえるため。これは `Carry over` の 2 番を閉じる物でもある）
  - 子プロセスの終了コードはそのまま返す（テストの失敗を握らない）
- `scripts/check-git-env.mjs`（新規）— 追跡下の `.ts` / `.mjs` を走査し、git を起動している（`spawnSync('git'` / `execFile('git'` / `spawn('git'`）のに `GIT_` か `gitEnv` が出てこないファイルがあれば非 0 で終わる
- `lefthook.yaml` — `test` の実行を `scripts/test-guarded.mjs` に変え、`git-env` の検査を足す

## Verify

### test

- `node scripts/check-git-env.mjs` → 0（いまの 6 ファイルは通る）
- わざと 1 ファイルから `gitEnv` の使用を消した作業用コピーで `node scripts/check-git-env.mjs` → 非 0（忘れたら落ちる）
- 作業用コピーで `scripts/test-guarded.mjs` を走らせ、本体の状態が変わらないこと、テストの結果がそのまま返ること

### read

- `review` の子に `scripts/test-guarded.mjs` を渡す
  - 報告させる: この検査が捕まえる物と、捕まえない物（対象はフックが走らせるテスト、手で走らすスクリプトは範囲外、など）

## Notes

### Findings

- なし

### Unplanned

- このチケットの作業（`scripts/` の 2 つと `lefthook.yaml` の変更）は 2026-09-27 に取り消された（owner の指示で未コミットの変更を戻した）。穴（git を起動するコードが `GIT_*` を落とす保証）は**開いたまま**で、`Commit:` も空のまま。作業を戻すなら、書いた物はこの日の会話に残っている

Commit:
