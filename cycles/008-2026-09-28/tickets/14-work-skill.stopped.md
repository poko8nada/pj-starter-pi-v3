# work-skill.stopped

Acceptance:

- 止まった step の扱いが無く、親がやり直すのが唯一の道、が解ける: 止まった step のチケットは閉じない。親は理由を読んで、(a) 指示を直してやり直す、(b) `consult_resume` に `research` を送る、(c) `code` を送る、(d) 開いたまま close に渡す、から選ぶ
- 止まったことが owner に報告される

Owner: at the end

## Todo

- `.pi/skills/work/SKILL.md`
  - `## Steps` の step の閉じ方（`Commit:` と step の終わりの段）— 止まったときの道を足す: チケットを閉じず、理由（落ちた検査の出力、変えたファイル、子の最後の本文、走った回数、時刻、worktree の id）をチケットに書き、(a)〜(d) から選ぶ
  - `## Steps` の最後の報告の段 — 止まった step があれば owner に報告する、と足す
- この step は文書だけ。テストファイルは書かない

## Verify

### read

- `review` の子に `.pi/skills/work/SKILL.md`（と、あれば `.pi/skills/tickets/references/format.md`）を渡し、step が止まったときの道を報告させる
- 合格: チケットを閉じないこと、理由の 6 つ、4 つの選択肢（やり直す / `research` / `code` / close へ）、owner への報告がある（1・2 行）

## Notes

### Findings

- なし

### Unplanned

- なし

Commit:
