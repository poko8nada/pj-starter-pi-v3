# readme

Acceptance:

- clone 直後に owner が `README.md` を開くと、何が入っているか分かる
- 最初に何をすればいいか分かる

## Todo

- `README.md` を書く
  - 「何が入っているか」 — ハーネス付きのスターターであること
    - 検査とゲート
    - エージェントの規則
    - consult
    - スキル 4 つ
  - 「最初に何をするか」 — clone した直後の手順
    - `pnpm install`
    - pi の起動
    - `.pi/extensions/consult/types.json` を例から作る
  - 「サイクルの回し方」 — スキル 4 つが読み込まれること
    - definition
    - stack
    - plan
    - tickets
  - 「検査」 — 何がいつ走るか
    - ターンごと
    - commit 時
    - push 時
    - 手で叩く

## Verify

- 実演: 書いたコマンドを書いたとおりに走らせる
  - `pnpm install`
  - `pnpm test:run` など

## Notes

### Findings

- 実演: 緑
- **プロダクト名は未決のまま**
  - 両方の README のタイトルが仮
    - 「ハーネス付きスターター」
    - 「Harness-included starter」

### Unplanned

- **`README.ja.md` を追加した**
  - `Todo` とプランの `Files` は `README.md` だけだった
  - owner の指示
    - 英語が本体
    - 日本語版を併置
    - 相互リンク
- 検査の一覧は実在するスクリプトだけにした
  - プランの step 12 にあった `pnpm check` は `package.json` に無い

Commit: 8a3262a
