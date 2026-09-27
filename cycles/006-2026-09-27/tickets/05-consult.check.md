# consult.check

Acceptance:

- 単位の `Then` を全部、1 回で確かめる

## Todo

- なし（確かめるだけ。実演で使う子は 1 体）

## Verify

### cli

- `pnpm test:run .pi/extensions` → 緑
- `git ls-files .pi/extensions/consult` → `types.json` があり、`types.example.json` が無い
- 実演の ref を `git show --stat` → 子が書いたファイルだけがある

### look

- `consult` の子を 1 体（`trial`）走らせ、次を読む
  - 子の報告に、worktree の `.pi/extensions/consult/types.json` から読んだ type の名前（4 つ）が入っている（`HEAD` から作った worktree でも同じ定義が読める）
  - 子が書いた物だけが ref に入っている
- `.pi/extensions/consult/README.md` の `types.json` の説明を読み、実物（コミット済みで、clone はそのまま走る）と合っていることを確かめる

## Notes

### Findings

- なし

### Unplanned

- なし

Commit:
