# tickets-skill

Acceptance:

- `definition` と `plan` の新しい形に沿った手順になっている
- 手順は本文に、形は `format.md` にある
- 説明が短い
- 製品に無い節を前提にしていない
- 読んだ者がその通りに動ける（何を、どの順で、どこで owner が入るか）
- 手順が 1 行 1 つに割れている
- 同じ手順は 1 つの skill にある
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
  - `Acceptance` の 5・6・7 行（その通りに動ける / 1 行 1 つ / 同じ手順は 1 つの skill）を判定させる

### form

- `awk 'length > 100' .pi/skills/tickets/SKILL.md .pi/skills/tickets/references/format.md` → 0 行（3 行）
- 形の規則が `format.md` にだけあることを突き合わせる（2 行）
- `grep -o '\*\*' .pi/skills/tickets/SKILL.md | wc -l` → 手順の頭だけ（9 行）

## Notes

### Findings

- なし

### Unplanned

- なし

Commit:
