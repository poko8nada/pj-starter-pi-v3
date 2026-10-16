# DESIGN 015

## `scaffold-script`

フォルダ名の rule を機械にする仕事と、その使い方（SKILL の手順1と path）を書く仕事は、同じ入力（ADR 01-1 の rule と `scaffold.mjs`）を読むので1つの worktree。もう一方の plan と触るファイルが重ならないので同時に走れる。

- ADR: 01-1
- Where: worktree
- Scope:
  - definition-skill: `scaffold.mjs` をサイクルの素起こし（フォルダ名の決定・作成、前回 definition の探索と持ち越し、使った src の印字）に拡張し、テストを隣に置く。SKILL.md の手順1と format.md の path を新形に直す
- Boundary:
  - Plans: なし
  - External:
    - `node`: 拡張した `scaffold.mjs` を素の ESM として走らせる
      - Contract: `.mjs` だけ。型注釈や変換に依存しない
    - `git`: 開始時ブランチの取得に使う（`lib/git-env.mjs` 経由で `GIT_*` を落とす）
      - Env: detached HEAD では `show-current` が空になるので `no-branch` に落とす
    - `vitest`: 新しいテストを拾って走らせる
      - Contract: 既定 include が `.pi/skills/definition/scripts/*.test.ts` を拾う。`.pi/` は tsconfig の外なので typecheck は見ない

## `path-and-archive`

path 表記の sweep と旧フォルダの archive 移動は、同じ入力（ADR 01-1 の pattern と `cycles/` の現状）を読む機械的な仕事なので1つの worktree。もう一方の plan と触るファイルが重ならないので同時に走れる。

- ADR: 01-1
- Where: worktree
- Scope:
  - adr-skill: path 表記を新形 `cycles/<YYMMDD-NNN-<branch>>` に揃える
  - design-skill: 同上
  - plan-skill: 同上
  - work-skill: 同上
  - close-skill: 同上
  - readme: `README.md` / `README.ja.md` の path 表記を新形に揃える
  - consult: README の例と `policy/types.ts` の paths 説明の例を新形に直す
- Boundary:
  - Plans: なし
  - External: なし
