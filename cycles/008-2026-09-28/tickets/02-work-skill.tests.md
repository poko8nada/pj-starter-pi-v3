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
- （影響読み `consult-34` の指摘。すべて非 blocking、未対応）
  - 一番大きい穴: helper を名指しする規則は `work/SKILL.md` にしか無く、テストを実際に書くのは子。子に届く `tickets/SKILL.md` の test ケースを書く段には helper の名指しが無い（`work/SKILL.md:41`、`tickets/SKILL.md:26`）
  - 守らせる口が無い: 強制は step 01 の 1 回きりの `git grep` だけで、hook にも check にもなっていない
  - `work/SKILL.md:46` と `:100` の非対称（46 は `test/tmp.ts`, `tmpDir()`、100 は `test/tmp.ts` のみ）
  - 生の `mkdtempSync` が非テストに 2 か所残る（`vitest.setup.ts:11,28`、`consult/run/run.ts:8,49`）。規則の唯一の抜け道
  - `vitest.setup.test.ts:13` は `pi-test-home-` の prefix を固定しており、setup を helper に寄せると落ちる

### Unplanned

- なし

Commit:
