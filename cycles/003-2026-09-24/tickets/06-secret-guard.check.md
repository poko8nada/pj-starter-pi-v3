# secret-guard.check

Acceptance: 単位の `Then` を全部、1 回の実演で確かめる（子に `.env` を読ませ、拒否され、親の `.env` が変わらないこと）

## Todo

- 実演の手順を決める（3 型 × 経路）
  - `research`（リポジトリ直）: `read .env` / `read .envrc` / `grep`（`.env` 明示）/ `grep`（`.` で再帰）
  - `review`（リポジトリ直）: 同じ 4 つ
  - `trial`（worktree）: `cat <絶対パス>` / symlink / `cp`
  - **自前 guard の証明**: 親が `probe.pem` を一時的に作り、子に読ませる。**ホストの config に `*.pem` の規則は無い**ので、**私たちの guard が効いていなければ読めてしまう**。拒否されたら自前 guard が効いている。親が消す
  - 親の `.env` のハッシュを前後で取る（`shasum`）
- `Then` ごとの観測（`入力 → 結果`。結果は `Notes` に原文で書く）
  - `research` + `read .env`: 返答が「読めない」と報告し、値が出ない → 観測文を `Notes` に原文で書く (error)
  - `research` + `read .envrc` → 拒否 (error)
  - `research` + `grep`（`.env` 明示）→ 拒否 (error)
  - `research` + 再帰 `grep` → `.env` の行が混ざらない (error)
  - `review` + 同じ 4 つ → 同じ結果 (error)
  - `trial`（worktree）+ 絶対パス → `external_directory` で拒否 (error)
  - `trial`（worktree）+ symlink → 拒否 (error)
  - `research` + `probe.pem` → **私たちの guard で拒否**（ホストの規則には無い） (error)
  - 親の `.env` の `shasum` → 前後で同じ (happy)
  - `probe.pem` を消したあと `git status` → 綺麗（実演が何も残さない） (happy)
- 観点（null / 空 / 境界 / 不正 / 権限 / 2 回目 / 並行）→ この step は作るものが無く、実演そのものなので当たらない — ケース無し

## Verify

- 実演: 上記の手順を実行し、`Then` の 2 つ（子は読めない / 親の `.env` は変わらない）と、**自前 guard が `probe.pem` を止めたこと**を観測する。結果を `Notes` に書く

## Notes

### Findings

なし

### Unplanned

なし

Commit:
