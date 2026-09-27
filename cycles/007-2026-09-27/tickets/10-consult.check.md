# consult.check

Acceptance:

- 単位の `Then` を全部、1 回で確かめる

## Todo

- なし（確かめるだけ）

## Verify

### cli

- `pnpm test:run .pi/extensions/consult` → 緑
- `git ls-files .pi/extensions/consult` に `types.json` があり、`types.example.json` が無い
- 実演の ref を `git show --stat` → 子が書いたファイルだけ

### look

- `consult` を 1 回呼び、次を読む
  - 呼び出しがすぐ戻り、子の結果はメッセージで届く（親は待っていない）
  - 子の報告に、worktree の `types.json` から読んだ type 名が入っている
  - `-` で始まる文書（`work/SKILL.md`）を `input` にしても、子が起動して返る
  - `review` の結果が 60k を超えない（長い文書で 1 回）
- `consult/README.md` の `review` の上限と、`types.json` の値が一致する

## Notes

### Findings

- なし

### Unplanned

- なし

Commit:
