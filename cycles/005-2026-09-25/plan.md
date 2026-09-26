# PLAN 005

## Steps

### step 0: prepare

- Install: なし
- Cleanup: なし

### step 1: stack-skill

- What:
  - サイクルの上流工程の変更を受けて、適切な手順になっていない → `definition` の新しい形に合わせる
  - `Stack` 節の形が skill の中にある → `definition` の `format.md` に移す
  - 手順が具体的でなく、雰囲気で読むことになる → 軸と判定と例を書く
  - 本文がダラダラしていて、構造が無い → 1 行 1 つに割る
  - 同じ手順が 2 つの skill にある → 1 つに寄せる
  - 規則だけで、判断の基準と例が無い（読み違えられる） → 軸と判定と例を書く
  - 太字が多すぎて、本当に大事なものがどれかわからない → 大事なものだけ太字にする
- Depends: なし
- Action: build
- Files: `.pi/skills/stack/SKILL.md`, `.pi/skills/definition/references/format.md`
- Verify:
  - Run: `oxfmt --check` が通る。100 字超の行が 0 であること
  - Look: `review` の子に `.pi/skills/stack/SKILL.md` だけを渡し、手順どおりに `Stack` が書けるか報告させる

### step 2: tickets-skill

- What:
  - サイクルの上流工程の変更を受けて、適切な手順になっていない → `definition` と `plan` の新しい形に合わせる
  - 本文と `format` が責務分離されていない → 手順を本文、形を `format.md` に分ける
  - `format` の説明が長い → 短くする
  - `Remarks` の節を前提にしている → 前提をやめる
  - 手順が具体的でなく、雰囲気で読むことになる → 軸と判定と例を書く
  - 本文がダラダラしていて、構造が無い → 1 行 1 つに割る
  - 同じ手順が 2 つの skill にある → 1 つに寄せる
  - 規則だけで、判断の基準と例が無い（読み違えられる） → 軸と判定と例を書く
  - 同じ規則が `format` と本文の両方にある → 1 つに寄せる
  - 太字が多すぎて、本当に大事なものがどれかわからない → 大事なものだけ太字にする
- Depends: なし
- Action: build
- Files: `.pi/skills/tickets/SKILL.md`, `.pi/skills/tickets/references/format.md`
- Verify:
  - Run: `oxfmt --check` が通る。100 字超の行が 0 であること
  - Look: `Acceptance` の規則が、単位を持たない step（`check`、`refactor`）も扱えること

### step 3: work-skill

- What:
  - サイクルの上流工程の変更を受けて、適切な手順になっていない → `plan` と `tickets` の新しい形に合わせる
  - 同じ手順を、本文と失敗の一覧の 2 箇所に書いている → 1 つに寄せる
  - 手順が具体的でなく、雰囲気で読むことになる → 軸と判定と例を書く
  - 本文がダラダラしていて、構造が無い → 1 行 1 つに割る
  - 同じ手順が 2 つの skill にある → 1 つに寄せる
  - 規則だけで、判断の基準と例が無い（読み違えられる） → 軸と判定と例を書く
  - 太字が多すぎて、本当に大事なものがどれかわからない → 大事なものだけ太字にする
- Depends: なし
- Action: build
- Files: `.pi/skills/work/SKILL.md`
- Verify:
  - Run: `oxfmt --check` が通る。100 字超の行が 0 であること
  - Look: `review` の子に `.pi/skills/work/SKILL.md` だけを渡し、1 つの step を最後まで運べるか報告させる

### step 4: close-skill

- What:
  - サイクルの上流工程の変更を受けて、適切な手順になっていない → `definition` の `Carry over` と `Retro` の新しい形に合わせる
  - 閉じる基準を `Goal` に置いている（この製品に `Goal` の節は無い） → 単位の `Then` にする
  - `Remarks` の節を前提にしている → 前提をやめる
  - 手順が具体的でなく、雰囲気で読むことになる → 軸と判定と例を書く
  - 本文がダラダラしていて、構造が無い → 1 行 1 つに割る
  - 規則だけで、判断の基準と例が無い（読み違えられる） → 軸と判定と例を書く
  - 太字が多すぎて、本当に大事なものがどれかわからない → 大事なものだけ太字にする
- Depends: なし
- Action: build
- Files: `.pi/skills/close/SKILL.md`
- Verify:
  - Run: `grep -n "Goal\|Remarks" .pi/skills/close/SKILL.md` が 0 行。`oxfmt --check` が通る
  - Look: `review` の子に `.pi/skills/close/SKILL.md` だけを渡し、サイクルを閉じられるか報告させる

### step 5: readme

- What:
  - skill 6 つを書き換えたので、README の中身が実物と食い違っている → 実物どおりにする
  - `work` の行にレビューが無い → 実物に合わせる
- Depends: step 4
- Action: build
- Files: `README.md`, `README.ja.md`
- Verify:
  - Run: なし（文書）
  - Look: README の 1 行ずつが実物と一致すること（skill の数、`work` の行）

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

- `.pi/skills/definition/`: このサイクルで書き終えて、コミット済み
- `.pi/skills/plan/`: 同じく書き終えている
