# DESIGN 018

## `harness-copy`

### ADR & Where

- No: 01, 03
- Why: コピーの口を作る変更（01）は、その一覧に検査の一覧の新しいパスを書くので、`scripts/` の整理（03）と同じ worktree にする。README も 1 回で書ける。
- Where: worktree

### Scope

- `Unit.harness-copy`(added): 1 つのスクリプトで `pull` と `push` を回し、一覧のパスを差分で合わせる（相手にしか無い物は消し、両方にある物は上書きし、元にしか無い物は足す）

### Boundary

- Plans: なし
- External:
  - ローカルのスターター: コピー元であり、`push` ではコピー先になる作業ツリー
    - Path: `scripts/harness.local.json` に `~/...` の形で書く
    - Env: `~` を `os.homedir()` で開く。その側の git の状態は見ない

## `harness-tests`

### ADR & Where

- No: 02
- Why: テストの扱いを変える変更で、外す対象を `harness-copy` が作る `scripts/harness.json` から読むので、その merge を待つ。
- Where: worktree

### Scope

- `Unit.product-ready`: ハーネスのテストを消す道をやめ、状態の 1 ファイルを書き換える道にする。`cycles/` を消す道は残す

### Boundary

- Plans:
  - `harness-copy`: それが作る `scripts/harness.mjs` の `readList`（一覧の形と読み）と `scripts/harness.json` を使う（同じ物を 2 つ作らない）
- External:
  - `vitest`: テストの候補を `include` と `exclude` で決める
    - Version: `^4.0.18`
    - Contract: `include` の `!` は除外として効き、`exclude` は既定を置き換える。`related` も候補の段階で同じ規則に掛かる
