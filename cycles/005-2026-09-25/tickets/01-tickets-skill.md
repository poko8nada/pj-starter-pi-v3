# tickets-skill

Acceptance:

- `definition` と `plan` の新しい形に沿った手順になっている
- 手順は本文に、形は `format.md` にある
- 説明が短い
- 製品に無い節を前提にしていない
- 読んだ者がその通りに動ける（何を、どの順で、どこで owner が入るか）
- 手順が 1 行 1 つに割れている
- 手順は本文にだけある
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
- テストファイル: なし（書類の書き換え。`Verify` は `read`）

## Verify

### read

- `review` の子に `SKILL.md` と `format.md`、`cycles/005-2026-09-25/plan.md` を渡す
  - `Acceptance` の 1・4・8 行を 1 行ずつ判定させ、落ちた行と箇所を報告させる

### use

- `review` の子に `SKILL.md` だけを渡し、005 のプランの step 1 のチケットを切らせる
  - `Acceptance` の 5・6・7 行（その通りに動ける / 1 行 1 つ / 手順は本文にだけある）を判定させる

### form

- `awk 'length > 100' .pi/skills/tickets/SKILL.md .pi/skills/tickets/references/format.md` → 0 行（3 行）
- `grep -n '## The shape\|^Acceptance:' .pi/skills/tickets/SKILL.md` → 0 行（2 行）
- `grep -o '\*\*' .pi/skills/tickets/SKILL.md | wc -l` → 手順の頭だけ（9 行）

## Notes

### Findings

- 定義書の「同じ手順が 2 つの skill にある」の行を直した（owner の合意済み）
  - unit 1・3・4: 「同じ手順が、本文と `format` の両方にある」に直した。この 3 つは `references/format.md` を持つ
  - unit 2・5: 消した。`stack` と `work` に `format.md` が無く、成り立たない
  - unit 5 には「同じ手順を、本文と失敗の一覧の 2 箇所に書いている」が別にあり、そちらが本当の行

### Unplanned

- なし

Commit:
