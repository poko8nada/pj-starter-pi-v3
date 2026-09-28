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
- （`read` の検証 `consult-9` の指摘。合格条件 4 つは満たしていた）
  - 未対応: `:113` の `Commit: なし（理由）` を、あとから (a)〜(c) で片付いたときに誰が hash に書き換えるかがどこにも無い（`format.md:146` は書き換わると言う）
  - 未対応: `:108` の「止まった子の `Notes` は残った worktree に残る」を読む段が無い。`close` の `list` も理由と変えたファイルしか見ないので、子の `Findings` は宙に浮く
  - 未対応: `:113` の「止まった」の定義が無い（`Verify` が落ちただけの step と、子が死んだ step の関係）
  - （影響読み `consult-10` の指摘と、親の修正）
    - blocking（直した）: step 6（`:72`）の「no ref / failure / timeout → 親がやる」が新しい step 10 の 4 択と二重だった → 「4 択が決める。親がやるのは (a) のとき」に直した
    - blocking（直した）: `:108` の「書いた物は worktree に残る」は反例あり（step 12 の停止では worktree が消えた）→ 「worktree が残ったとき。消えていれば本文が理由を持つだけ（(b)(c) に続ける物が無い）」に直した
    - blocking（直した）: `Commit: なし（理由）` を unit の hash に戻す手が無かった → step 11 に「(a)〜(c) で片付いたら hash を書いて `Stopped` 節を落とす」と、(d) の帰結（unit が終わらない・兄弟の `Commit:` も空のまま・close が unit ごと開いていると読む）を足した
    - 未対応: 止まった unit の兄弟チケットが close に穴として渡る筋の是非。`in the loop` の owner の 捨てる と (d) の関係。`Todo` の行番号（`:107` と書いたが、足した行は `:108`）

### Unplanned

- `.pi/skills/work/SKILL.md:107`: 止まった子の `Notes` は ref ではなく、残った worktree に残る、と足した
  - なぜ: チケットの `Todo` には無いが、step 09 の `Findings` が「107 行は ref 無し・worktree 残りで返る道を知らない（step 14 の担当）」と送っていた。step 14 はこのチケット

Commit: e1ca9fe（子が worktree で作ったコミットを親が取り込んだ物）
