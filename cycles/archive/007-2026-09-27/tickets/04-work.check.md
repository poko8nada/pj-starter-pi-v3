# work.check

Acceptance:

- 単位の `Then` を全部、1 回で確かめる

## Todo

- なし（確かめるだけ。実演で使う子は 1 体）

## Verify

### cli

- 作業用のコピーで、`squash.mjs` の乾燥 → `run` を通す（1 コミットにまとまり、チケットの `Commit:` が揃う）
- `pnpm test:run .pi/skills/work` → 緑

### read

- `review` の子に `.pi/skills/work/SKILL.md` だけを渡し、次を報告させる
  - 作業の単位（サイクル）と、最後に 1 回止まって報告すること
  - ユニットの終わりの段（検証 → レビュー → 乾燥 → `run`）と、チケットの `Commit:` をそのときに書くこと
  - step 7 が `../tickets/references/format.md` を指していること

## Notes

### Findings

- なし

### Unplanned

- なし

Commit: なし（単位の `Then` 4 行を実演と `read` で確かめた。コードを変えていない）
