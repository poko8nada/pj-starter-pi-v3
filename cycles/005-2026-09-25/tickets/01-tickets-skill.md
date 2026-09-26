# tickets-skill

Acceptance:

- `definition` と `plan` の新しい形に沿った手順になっている
- 手順は本文に、形は `format.md` にある
- 説明が短い
- 製品に無い節を前提にしていない
- 読んだ者がその通りに動ける（何を、どの順で、どこで owner が入るか）
- 手順が 1 行 1 つに割れている
- 規則が軸・判定・例を持っている
- 同じ規則は 1 か所にある
- 太字が本当に大事なものだけになっている

## Todo

- `.pi/skills/tickets/SKILL.md`
  - 冒頭: unit と ticket の定義
  - `## Steps`: 9 つ
    - プランを読む / `Acceptance` / `Todo` / `Verify` / ケース
    - `format` 突き合わせ / `review` / owner / commit
  - `## The files` / `## The review's checklist`: 1 か所ずつに寄せる
- `.pi/skills/tickets/references/format.md`
  - `## The shape`: `# <unit-id>` / `Acceptance:` / `## Todo` / `## Verify` / `## Notes` / `Commit:`
  - `## Names` / `## Acceptance` / `## Todo` / `## Verify` / `## Notes` / `## Writing`
  - `## Notes`: `Findings` と `Unplanned` の形と意味（完遂できなかったこと + なぜ / チケットに無い変更 + なぜ。閉じに写されるのは `Findings` だけ）
- テストファイル: なし（書類の書き換え。`Verify` は `read`）

## Verify

### read

- `review` の子に `.pi/skills/tickets/SKILL.md` を渡す（1 つの子に 1 つの入力）
  - `format.md` と `plan.md` は子が自分で読む
  - `Acceptance` の 1・4・7 行を 1 行ずつ判定させ、落ちた行と箇所を報告させる

### use

- `review` の子に `SKILL.md` だけを渡し、005 のプランの step 1 のチケットを切らせる
  - `Acceptance` の 5・6 行（その通りに動ける / 1 行 1 つ）を判定させる

### form

- `awk 'length > 100' .pi/skills/tickets/SKILL.md .pi/skills/tickets/references/format.md` → 0 行（3 行）
- `grep -n '## The shape\|^Acceptance:' .pi/skills/tickets/SKILL.md` → 0 行（2 行）
- `grep -o '\*\*' .pi/skills/tickets/SKILL.md | wc -l` → 18（手順の頭 9 つ）（9 行）

## Notes

### Findings

- なし

### Unplanned

- `cycles/005-2026-09-25/definition.md`（unit 1・3・4）: 「同じ手順が 2 つの skill にある」→「同じ手順が、本文と `format` の両方にある」に書き換えた
  - なぜ: そのままでは、`stack` と `work` に `format.md` が無く成り立たなかった（unit 2・5 からは消した）。owner の指示
- `.pi/skills/tickets/SKILL.md` / `references/format.md`: `.refactor` の step の所属と、`Acceptance` の行の例を足した
  - なぜ: 検証の指摘。どちらもチケットの `Todo` に無かったが、切り方と書き方が決まらない穴だった

Commit: cc5346b
