## Notes

### Findings

- この step は 004 の step 7 なので、ここで作る `close` は 004 自身の閉じには間に合わない（`close` は全チケットが閉じた後に読む skill で、それを書いているのがこの step にあたる）。`Verify` の実演が玩具のサイクルを使うのはそのため。004 の閉じは、この skill が入った後（次サイクルの頭、または owner の判断）でこの skill を読むことになる
- 外の穴（前の step へ）: `definition` の Step 10 が「前のサイクルを閉じる」と書き、この `close` の Step 5 が「`Retro` を書いて閉じる」と書く — 閉じが 2 箇所にある。004 の plan step 6 は `definition` の Step 10 を触っておらず、step 6 のチケットはまだ閉じていない。どちらが閉じるのかは決まっていない。この step では直さず（`Todo` の外）、次の 1 枚が拾う
- 自分で走らせた検査: `pnpm format:check` → All matched files use the correct format（91 files）/ `pnpm lint` → エラーなし / `pnpm typecheck` → エラーなし
- 本文に skill 名は無い（`grep -nE '`(definition|stack|plan|tickets|work|close)`' .pi/skills/close/SKILL.md` が 0 件）。`description` は入口を名乗る（`Use when every ticket of a cycle is closed.`）
- 観点（null / 空 / 境界 / 不正 / 権限 / 2 回目 / 並行）→ この step は skill 本文の新規作成で、作るものが無い — ケース無し（チケットの `Todo` のとおり）。失敗の入力は `Verify` の観察項目が持つ
- `Verify` のうち実演（玩具のサイクル / 1 本の統合 / `review` の子 / findings の振り分け / 玩具の 1 枚とプランが変わらない）は親の担当。この子は `consult` を起こさないので、ここではまだ観察していない

### Unplanned

- 同じチケットの 2 つ目の bullet（本文が次のスキルを名指ししない）を Step 4 にも通した。`Todo` の Step 4 は `work` と名指しするが、本文では skill 名を書かず「the stage that carries a step」とした（他の skill と同じく、本文に skill 名を置かない形に揃えた）
- Step 2 に「実演は何も残さない（書く子には本文を返させ、書き先はリポジトリの外）」を足した。`Todo` には無いが、repo の他の skill（`work` / `stack`）と同じ規則で、Step 3 のチェック項目（残ったもの）と噛み合う
- `Commit:` は空のまま。ハッシュは子では作れない（親が ref を取り込んだ後に書く）

Commit:
