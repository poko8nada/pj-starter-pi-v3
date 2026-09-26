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
  - Run: `oxfmt --check .pi/skills/stack/SKILL.md .pi/skills/definition/references/format.md; awk 'length > 100' .pi/skills/stack/SKILL.md .pi/skills/definition/references/format.md`
  - Look: `review` の子に `.pi/skills/stack/SKILL.md` だけを渡し、手順どおりに `Stack` が書けるか報告させる
  - エラーパス: なし（文書の書き換え）

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
  - Run: `oxfmt --check .pi/skills/tickets/SKILL.md .pi/skills/tickets/references/format.md; awk 'length > 100' .pi/skills/tickets/SKILL.md .pi/skills/tickets/references/format.md`
  - Look: `review` の子に `.pi/skills/tickets/SKILL.md` と `references/format.md` だけを渡し、チケットが切れるか報告させる
  - エラーパス: なし（文書の書き換え）

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
  - Run: `oxfmt --check .pi/skills/work/SKILL.md; awk 'length > 100' .pi/skills/work/SKILL.md`
  - Look: `review` の子に `.pi/skills/work/SKILL.md` だけを渡し、1 つの step を最後まで運べるか報告させる
  - エラーパス: なし（文書の書き換え）

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
  - Run: `grep -n "Goal\|Remarks" .pi/skills/close/SKILL.md; oxfmt --check .pi/skills/close/SKILL.md`
  - Look: `review` の子に `.pi/skills/close/SKILL.md` だけを渡し、サイクルを閉じられるか報告させる
  - エラーパス: なし（文書の書き換え）

### step 5: readme

- What:
  - README が実物と食い違っている → 実物どおりにする
    - `README.md:44` と `README.ja.md:44` に `Goal` / `Non-goal` / `Remarks` が残っている（この製品にその節は無い）
    - `README.md:52` に、`Remarks` は書き続けられる、とある
  - `work` の行にレビューが無い → 実物に合わせる
    - `README.md:48` と `README.ja.md:48` を、`.pi/skills/` の実物と比べる
- Depends: step 1, step 2, step 3, step 4
- Action: build
- Files: `README.md`, `README.ja.md`
- Verify:
  - Run: `grep -n "Goal\|Non-goal\|Remarks" README.md README.ja.md`
  - Look: `review` の子に `.pi/skills/` の一覧と `README.md` を渡し、両者が一致するか報告させる
  - エラーパス: なし（文書の書き換え）

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
