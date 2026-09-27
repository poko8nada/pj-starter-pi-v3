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

- 親の確認: `cli` は 181 件・`types.json` が追跡・実演の ref（`bf8f501`）は子が書いたファイルだけ・README と `types.json` の `review` は 40 / 60,000 で一致
- 親の確認（`look`）: 3 体を起こして全部確かめた。(1) `start` はすぐ `started: consult-1` を返し、結果は `[consult]` 行つきのメッセージで届いた（親は待っていない）(2) 子の報告に worktree の `types.json` から読んだ 4 type（research / review / trial / code）が入っていた (3) `-` で始まる `work/SKILL.md` を `input` にしても子は起動して返った (4) 長い文書（`plan.md`）で `review` を 1 回走らせ、出力 24,394 トークンで上限 60,000 以内（上限は出力トークン、`child/spec.ts:210`）

Commit: なし（consult ユニットの `Then` 4 行を `cli` と `look` で確かめた。コードを変えていない）
