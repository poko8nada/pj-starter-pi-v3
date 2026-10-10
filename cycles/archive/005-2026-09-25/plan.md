# PLAN 005

## Steps

### step 0: prepare

- Install: なし
- Cleanup: なし

### step 1: tickets-skill

- What:
  - サイクルの上流工程の変更を受けて、適切な手順になっていない → `definition` と `plan` の新しい形に沿った手順になっている
  - 本文と `format` が責務分離されていない → 手順は本文に、形は `format.md` にある
  - `format` の説明が長い → 説明が短い
  - `Remarks` の節を前提にしている → 製品に無い節を前提にしていない
  - 手順が具体的でなく、雰囲気で読むことになる → 読んだ者がその通りに動ける（何を、どの順で、どこで owner が入るか）
  - 本文がダラダラしていて、構造が無い → 手順が 1 行 1 つに割れている
  - 規則だけで、判断の基準と例が無い（読み違えられる） → 規則が軸・判定・例を持っている
  - 同じ規則が `format` と本文の両方にある → 同じ規則は 1 か所にある
  - 太字が多すぎて、本当に大事なものがどれかわからない → 太字が本当に大事なものだけになっている
- Depends: なし
- Action: build
- Files: `.pi/skills/tickets/SKILL.md`, `.pi/skills/tickets/references/format.md`
- Verify: read, use, form

### step 2: stack-skill

- What:
  - サイクルの上流工程の変更を受けて、適切な手順になっていない → `definition` の新しい形に沿った手順になっている
  - `Stack` 節の形が skill の中にある → `Stack` 節の形は `definition` の `format.md` にある
  - 手順が具体的でなく、雰囲気で読むことになる → 読んだ者がその通りに動ける（何を、どの順で、どこで owner が入るか）
  - 本文がダラダラしていて、構造が無い → 手順が 1 行 1 つに割れている
  - 規則だけで、判断の基準と例が無い（読み違えられる） → 規則が軸・判定・例を持っている
  - 太字が多すぎて、本当に大事なものがどれかわからない → 太字が本当に大事なものだけになっている
- Depends: なし
- Action: build
- Files: `.pi/skills/stack/SKILL.md`, `.pi/skills/definition/references/format.md`
- Verify: read, use, form

### step 3: work-skill

- What:
  - サイクルの上流工程の変更を受けて、適切な手順になっていない → `plan` と `tickets` の新しい形に沿った手順になっている
  - 同じ手順を、本文と失敗の一覧の 2 箇所に書いている → 手順は 1 箇所にある
  - 手順が具体的でなく、雰囲気で読むことになる → 読んだ者がその通りに動ける（何を、どの順で、どこで owner が入るか）
  - 本文がダラダラしていて、構造が無い → 手順が 1 行 1 つに割れている
  - 規則だけで、判断の基準と例が無い（読み違えられる） → 規則が軸・判定・例を持っている
  - 太字が多すぎて、本当に大事なものがどれかわからない → 太字が本当に大事なものだけになっている
- Depends: なし
- Action: build
- Files: `.pi/skills/work/SKILL.md`
- Verify: read, use, form

### step 4: close-skill

- What:
  - サイクルの上流工程の変更を受けて、適切な手順になっていない → `definition` の `Carry over` と `Retro` の新しい形に沿った手順になっている
  - 閉じる基準を `Goal` に置いている（この製品に `Goal` の節は無い） → 閉じる基準は単位の `Then` にある
  - `Remarks` の節を前提にしている → 製品に無い節を前提にしていない
  - 手順が具体的でなく、雰囲気で読むことになる → 読んだ者がその通りに動ける（何を、どの順で、どこで owner が入るか）
  - 本文がダラダラしていて、構造が無い → 手順が 1 行 1 つに割れている
  - 規則だけで、判断の基準と例が無い（読み違えられる） → 規則が軸・判定・例を持っている
  - 太字が多すぎて、本当に大事なものがどれかわからない → 太字が本当に大事なものだけになっている
- Depends: なし
- Action: build
- Files: `.pi/skills/close/SKILL.md`
- Verify: read, use, form

### step 5: readme

- What:
  - skill 6 つを書き換えたので、README の中身が実物と食い違っている → README の中身が実物どおりになっている
  - `work` の行にレビューが無い → `work` の行が実物と合っている
- Depends: step 1, step 2, step 3, step 4
- Action: build
- Files: `README.md`, `README.ja.md`
- Verify: read, look

## Structure

```text
.pi/
  skills/
    definition/
      references/
        format.md        update
    stack/
      SKILL.md           update
    tickets/
      SKILL.md           update
      references/
        format.md        update
    work/
      SKILL.md           update
    close/
      SKILL.md           update
README.md                    update
README.ja.md                 update
```

## What to keep

- なし
