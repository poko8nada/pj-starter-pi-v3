# secret-guard.check

Acceptance:

- 単位の `Then` を全部、1 回の実演で確かめる
- 子の `read` は拒否される
- 子は「読めない」と報告する
- 親の `.env` の中身は変わらない

## Todo

- 実演の手順を決める（3 型 × 経路）
  - `research`（リポジトリ直）
    - `read .env`
    - `read .envrc`
    - `grep`（`.env` 明示）
    - `grep`（`.` で再帰）
  - `review`（リポジトリ直）
    - `research` と同じ 4 つ
  - `trial`（worktree）
    - `cat <絶対パス>`
    - symlink
    - `cp`
  - **自前 guard の証明**
    - 親が `probe.pem` を一時的に作り、子に読ませる
    - ホストの config に `*.pem` の規則は無い
      - 私たちの guard が効いていなければ読めてしまう
    - 拒否されたら自前 guard が効いている
    - 親が消す
  - 親の `.env` のハッシュを前後で取る（`shasum`）
- `Then` ごとの観測（`入力 → 結果`）
  - 結果は `Notes` に原文で書く
  - `research` + `read .env`: 返答が「読めない」と報告し、値が出ない (error)
  - `research` + `read .envrc` → 拒否 (error)
  - `research` + `grep`（`.env` 明示）→ 拒否 (error)
  - `research` + 再帰 `grep` → `.env` の行が混ざらない (error)
  - `review` + 同じ 4 つ → 同じ結果 (error)
  - `trial`（worktree）+ 絶対パス → `external_directory` で拒否 (error)
  - `trial`（worktree）+ symlink → 拒否 (error)
  - `research` + `probe.pem` → 私たちの guard で拒否（ホストの規則には無い） (error)
  - 親の `.env` の `shasum` → 前後で同じ (happy)
  - `probe.pem` を消したあと `git status` → 綺麗（実演が何も残さない） (happy)
- 観点
  - この step は作るものが無く、実演そのものなので当たらない — ケース無し

## Verify

- 実演: 上記の手順を実行し、次を観測する
  - 子は読めない（`Then` 1）
  - 親の `.env` は変わらない（`Then` 2）
  - 自前 guard が `probe.pem` を止める
- 結果は `Notes` に書く

## Notes

### Findings

- 子は秘密を読めない
  - `.env` は 3 型すべてで拒否された
  - `.envrc` は 3 型すべてで拒否された
  - `probe.pem` は 3 型すべてで拒否された
  - 拒否の文は「読めない: … は秘密として扱う（child-guard）」
- 再帰 `grep` にも `.env` の行は混ざらない
- `README.md` は通る（止めすぎていない）
- **自前 guard の証明**
  - `probe.pem` にホストの config の規則は無い
    - ホストの規則があるのは `.env`
    - ホストの規則があるのは `.envrc`
  - それでも拒否された。あなたの設定が無いクローンでも子は秘密に届かない
- 親の `.env` は前後で変わらない
  - mtime は `Sep 20 14:33`
  - `shasum` は方針で拒否される（argv に `.env` を含むと弾かれる）
  - そのため mtime と `git status` で見た
- `.envrc` も変わらない
  - mtime は `Sep 16 09:17`
- 実演のあと、親が `probe.pem` を消した
  - `git status` は綺麗

### Unplanned

- **実演が実バグを捕まえた。** 1 回目の `trial` で、拒否の文が「読めない: `cat` は秘密として扱う」になった
  - 04 で入れた「解決できないパスは `true`」が bash のトークンを全部止め、子が凍っていた

Commit: 064c820
