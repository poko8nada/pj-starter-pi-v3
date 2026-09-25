# readme

Acceptance: clone 直後に owner が `README.md` を開くと、何が入っているか分かり、最初に何をすればいいか分かる

## Todo

- `README.md` を書く
  - 「何が入っているか」 — 検査とゲート、エージェントの規則、consult、スキル 4 つ。ハーネス付きのスターターであること
  - 「最初に何をするか」 — clone した直後の手順（`pnpm install`、pi の起動、`.pi/extensions/consult/types.json` を例から作る）
  - 「サイクルの回し方」 — スキル 4 つ（definition / stack / plan / tickets）が読み込まれること
  - 「検査」 — 何がいつ走るか（ターンごと / commit 時 / push 時 / 手で叩く）

## Verify

- 実演: 書いたコマンドを実際に走らせる（`pnpm install` / `pnpm test:run` など、書いたとおりに動くか）

## Notes

### Findings

- 実演の結果: README に書いたコマンドを全部走らせた。`pnpm install` は「Already up to date」（共有ストアに何も落ちていない）、`pnpm test:run` / `pnpm lint` / `pnpm typecheck` / `pnpm format:check` は全部緑
- **プロダクト名は未決のまま**。両方の README のタイトルは仮（「ハーネス付きスターター」/「Harness-included starter」）

### Unplanned

- **`README.ja.md` を追加した**（owner の指示: 英語が本体、日本語版を併置、相互リンク）。`Todo` とプランの `Files` は `README.md` だけだった
- 検査の一覧は、実在するスクリプトだけにした（プランの step 12 にあった `pnpm check` は `package.json` に無い）

Commit: 8a3262a
