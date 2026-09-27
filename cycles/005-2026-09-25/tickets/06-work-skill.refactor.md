# work-skill.refactor

Acceptance:

- `.pi/skills/work/SKILL.md` の step 4 が、誰をまとめるかを名指ししている
- `.pi/skills/stack/SKILL.md` に 100 字超の行が無い

## Todo

- `.pi/skills/work/SKILL.md`
  - step 4（何をまとめるか）の本文に、まとめる相手（子）は step 2 で決まることを書く
  - owner が残した判断（チケット 03 の `Findings` の 1 行目）。単位 5 の `Then` に触れる
- `.pi/skills/stack/SKILL.md`
  - 45 行（116 字）を分ける。oxfmt が 2 行を連結したもの。チケット 02 の `form` が落ちる
- テストファイル: なし（書類の書き換え。`Verify` は `read` と `form`）
- 出所: 005 の閉じのレビューの子と、統合の「`read` 型の旅」

## Verify

### read

- `review` の子に `.pi/skills/work/SKILL.md` を渡す（1 つの子に 1 つの入力）
  - `Acceptance` の 1 行目を判定させ、落ちた箇所を行番号で報告させる

### form

- `perl -CSD -ne 'print if length($_) > 100' .pi/skills/work/SKILL.md .pi/skills/stack/SKILL.md | wc -l` → 0 行（2 行）
- `grep -c 'step 2' .pi/skills/work/SKILL.md` → step 4 の本文が step 2 を指している（1 行）

## Notes

### Findings

- なし

### Unplanned

- なし

Commit:
