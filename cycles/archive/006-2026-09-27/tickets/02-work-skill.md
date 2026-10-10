# work-skill

Acceptance:

- `work/SKILL.md` step 7 に、`read` / `use` は `consult` の子を 1 体走らせる、と書いてある
- チケットが名指しした type に文書を `input` で渡し、返ってきたテキストを証拠にする、と書いてある

## Todo

- `.pi/skills/work/SKILL.md`
  - step 7（Run the `Verify`）— `read` / `use` の走らせ方を足す
    - `read` / `use` は `consult` の子を 1 体走らせる（type はチケットが名指しする）
    - 文書は `input` で渡す（子は読みだけの type で、書かせない）
    - 証拠は子が返したテキスト。親が読んで判定する
  - step 7 の既存の 1 行（子に求めるのは拒否の文であって、ファイルではない）と矛盾しない形にする

## Verify

### read

- `review` の子に `.pi/skills/work/SKILL.md` だけを渡す
  - `read` / `use` の型をどう走らせるかを報告させる（どの子を、何を渡し、何を証拠にするか）
  - それが step 7 の 1 か所に書いてあるか報告させる

### use

- `review` の子に `.pi/skills/work/SKILL.md` だけを渡す
  - 「`review` の子に `cycles/006-2026-09-27/plan.md` だけを渡し、`What` の行数と `Depends` の一覧を報告させる」という 1 行のチケットを渡す
  - 手順書どおりに走らせるなら、何をどうするかを書かせる（どの子を、何を渡し、何を証拠にするか）
  - スキルだけで決められたか、足りなかった所を報告させる

## Notes

### Findings

- `consult`（`child/spec.ts`）: `input` に置く文書の先頭が `@` のとき、`--` の後ろでも pi がそれをファイル引数として読む。今日の検証では踏んでいない。閉じるには: 子の起こし方（argv をやめて stdin に渡すなど）を決める
- `work/SKILL.md`（step 7）: チケットの `Verify` ブロックの字面と `Acceptance` の行の注記は `tickets/references/format.md` の持ち物で、実行の段からそこを指していない。閉じるには: step 7 から参照を足すか、走らせ方に形を含めるかを決める
- `work/SKILL.md`（step 7）: `read` の合否基準（期待値）がチケットに書かれないので、親の知識が基準になる（`test` には `<入力> → <結果>` がある）。閉じるには: `read` にも期待値の置き場を決める

### Unplanned

- `.pi/extensions/consult/child/spec.ts`: `read` の `Verify` が「Unknown option: ---」で走らなかった（YAML frontmatter で始まる文書を payload にすると、pi がオプションとして読む）ので、指示の前に `--` を置いた（`f29e17b`）
- `.pi/skills/work/SKILL.md`（step 7）: `consult` のコードを変えた step は、走っているセッションが古いコードを持つので、`Verify` の前に owner に reload を頼む、を足した（`008d43c`）
- `.pi/skills/work/SKILL.md`（step 7）: 「チケットが名指しした type」が Verify の型（`read`）と子の型（`review`）で衝突していたので「ブロックが名指しする子」に直し、報告は `task` に置く 1 行を足した（`c53b750`、`6238e24`）
- チケットの `use` の見方: ブロックの字面を書かせる形になっていたので、owner の同意で「走らせ方を書かせる」に変えた
- 2 体の子が同じ 2 枚を実装していた（`input` に 2 パス渡すと 1 パス 1 体になる）。ref 2（`c2e1e0b`）を取り、ref 1（`cc554aa`）を落とした。そのため 01 と 02 の `Commit:` が分かれた（計画では同じハッシュ）

Commit: 6238e24
