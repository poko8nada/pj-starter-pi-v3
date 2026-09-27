# readme

Acceptance:

- README の中身が実物どおりになっている
- `work` の行が実物と合っている

## Todo

- `README.md`
  - `The cycle` の節: スキル 6 つの説明を実物に合わせる
  - `What is in it` の節: 定義書の節の一覧から `Goal` / `Non-goal` / `Remarks` を外す（`definition/references/format.md` に無い）
  - プランの説明から「テスト」を外す（テストはチケットのもの）
  - `Remarks` を前提にした文を直す（この製品に無い節）
  - `work` の行: 実物と合っているか確かめ、違えば直す（レビューは既に入っている）
  - 数を実物に合わせる（スキルは 6 つ）
- `README.ja.md`
  - 同じ内容を日本語で。`README.md` と食い違わせない
- テストファイル: なし（書類の書き換え。`Verify` に `test` は無い）

## Verify

### read

- `review` の子に `README.md` を渡す（1 つの子に 1 つの入力）
  - `.pi/skills/*/SKILL.md` と `cycles/005-2026-09-25/plan.md` の `Structure` は子が自分で読む
  - `Acceptance` の 1・2 行を 1 行ずつ判定させ、落ちた行と箇所を報告させる

### look

- 私（親）が `README.md` と `README.ja.md` を読み、実物どおりか、2 つの言語で食い違っていないかを見る（`Acceptance` の 1・2 行）
  - 読む値: スキルの数（実物は 6）、定義書の節の一覧、`work` の行の中身
  - 見た結果を owner に出す（この step の `Verify` は `look` なので、子は使わない）

## Notes

### Findings

- なし

### Unplanned

- なし

Commit:
