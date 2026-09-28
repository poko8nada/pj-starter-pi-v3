# work-skill.tests

Acceptance:

- テストが本体にファイルを書けてしまう（決まりが無い）。子のコミット（`git add -A`）がそれを巻き込む、が解ける: テストは共通の helper（`test/tmp.ts`）を通して一時ディレクトリに書き、本体には書かない
- その行が helper を名指ししていない、が解ける: 行が共通の helper（`test/tmp.ts`）を通すことを名指ししている（使わないテストは、書いてある規則の違反になる）
- レビューの観点にテストの隔離が 1 行入っている

Owner: at the end

## Todo

- `.pi/skills/work/SKILL.md`
  - `## Steps` のテストの行（いまは `mkdtempSync and the like` とだけ書いてある 46 行目）— 共通の helper `test/tmp.ts` を通すことを名指しする
  - `## Steps` のユニットのレビューの観点（99 行目付近の 2 つの観点の並び）— 「テストが本体に書いていないか（helper を通っているか）」を 1 行足す
- この step は文書だけ。テストファイルは書かない

## Verify

### read

- `review` の子に `.pi/skills/work/SKILL.md` だけを渡し、テストを書くときに何を通すか、ユニットのレビューで何を見るかを報告させる
- 合格: helper（`test/tmp.ts`）の名前があり、本体には書かないという文が残っていて、レビューの観点にテストの隔離がある（1・2・3 行）

## Notes

### Findings

- なし

### Unplanned

- なし

Commit:
