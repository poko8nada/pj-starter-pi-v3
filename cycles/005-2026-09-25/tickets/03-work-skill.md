# work-skill

Acceptance:

- `plan` と `tickets` の新しい形に沿った手順になっている
- 手順は 1 箇所にある
- 読んだ者がその通りに動ける（何を、どの順で、どこで owner が入るか）
- 手順が 1 行 1 つに割れている
- 規則が軸・判定・例を持っている
- 太字が本当に大事なものだけになっている

## Todo

- `.pi/skills/work/SKILL.md`
  - 冒頭: 何をするスキルか（1 枚のチケットを、閉じた状態まで運ぶ）
  - `## Steps`: 1 行 1 つ。行為だけを並べる
  - 失敗の一覧: 穴の行き先を新しい意味にする
    - `Findings` = 完遂できなかったこと（判断を保留した、実装できなかった）+ なぜ。閉じが `Carry over` に写す
    - `Unplanned` = チケットに無い変更 + なぜチケットに無いのに変えたか。写さない
    - いまの `:80`・`:84`・`:94-96` が古い。穴をこの step で直したら `Unplanned`、外なら `Findings`
  - 本文・失敗の一覧・`## The review's checklist` に散っている同じ規則を 1 箇所に寄せる
  - 消す: `plan` と `tickets` の新しい形に無いものへの言及
  - 太字は手順の頭だけにする
- テストファイル: なし（書類の書き換え。`Verify` に `test` は無い）
- 材料: `tickets/references/format.md` の `## Notes` と `## Verify`、`plan/references/format.md` の `## The Verify types`

## Verify

### read

- `review` の子に `.pi/skills/work/SKILL.md` を渡す（1 つの子に 1 つの入力）
  - `plan` と `tickets` の `format.md` は子が自分で読む
  - `Acceptance` の 1・2・5 行を 1 行ずつ判定させ、落ちた行と箇所を報告させる

### use

- `review` の子に `.pi/skills/work/SKILL.md` だけを渡し、手順を歩かせる
  - 題材: このチケット 03 自身と、`cycles/005-2026-09-25/` の定義書とプラン
  - 書き込みはさせず、何を、どの順で、どこで owner が入るかを書き出させる
  - 止まった箇所を行番号で報告させ、`Acceptance` の 3・4 行を判定させる

### form

- `perl -CSD -ne 'length > 100' .pi/skills/work/SKILL.md` → 0 行（1 行）
- `grep -o '\*\*' .pi/skills/work/SKILL.md | wc -l` → 24（手順 12 の 2 倍）（6 行）

## Notes

### Findings

- なし

### Unplanned

- なし

Commit: 84191ca
