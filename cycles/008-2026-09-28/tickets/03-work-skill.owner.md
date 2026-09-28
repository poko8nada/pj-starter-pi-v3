# work-skill.owner

Acceptance:

- ユニットごとの `owner` の値を見る段が無い、が解ける: `work/SKILL.md` の段が値に従う（`in the loop` は step で止まって見せ、軽微な修正はそのチケットの中で繰り返す。コミットとレビューはループの後）
- 「最後に 1 回報告する」と step 13 がそのまま、が解ける: それは `at the end` のユニットの動きになる
- チケットの `read` に止まる場所が無い、が解ける: どこで止まるか・何を見せるか・何をもって終わりかが書いてある

Owner: at the end

## Todo

- `.pi/skills/work/SKILL.md`
  - 冒頭（10 行目の「report once, at the end」）— `at the end` のユニットの動きだと分かる書き方にする
  - `## Steps` の step 1 付近（チケットを読む段）— チケットの `owner:` を読み、`in the loop` なら止まる道に入る、という段を足す
  - `## Steps` に新しい段 — `in the loop` の進め方: step の区切りで止まる、チケットの「見せる物」を見せる、owner の判断（残す / 直す / 捨てる）を聞く、軽微な修正はそのチケットの中で繰り返す、終わりの基準を満たしたらコミットしてからレビューへ
  - `## Steps` の最後の報告の段（13）— `at the end` のユニットの動きとして残す
- この step は文書だけ。テストファイルは書かない

## Verify

### read

- `review` の子に `.pi/skills/work/SKILL.md` と `.pi/skills/tickets/references/format.md` を渡し、`in the loop` と `at the end` の 2 つの進め方を報告させる
- 合格: 止まる場所・見せる物・終わりの基準があり、軽微な修正をそのチケットの中で繰り返すと書いてあり、コミットとレビューがループの後にある（1・3 行）。「最後に 1 回報告する」と step 13 が `at the end` のユニットの動きとして書いてある（2 行）

## Notes

### Findings

- なし
- （影響読み `consult-39` の指摘と、親の修正）
  - 直した物（すべて 1 行ずつ）: `at the end` の説明が「step 13 は `at the end` の物」に読めた → サイクルは値によらず 1 回報告する、と直した。`直す` のループに出口が無かった → 収束しなければ owner が決める（捨てる / 切り直す）。`only after it ends` の it が step か unit か読めなかった → unit と明記。step 10 の done の定義が `in the loop` と合わなかった → `in the loop` は owner の 残す が先、と足した。step 11 の必須観点「owner が見て同意した」が `at the end` で成立しない → 対象を「何を答えなければならないか（プランの step とチケット）」にし、`in the loop` では結果も見る、と足した。レビューの修正が owner 未見のままコミットされ得た → `in the loop` ではコミット前に見せる、と足した
  - 未対応（この step の外）: チケットの `止まり方` 欄そのもの（`tickets/references/format.md`）は step 04 が作る。Acceptance 3 行目が「チケットの `read` に書いてある」としているので、成果物が 03 と 04 に分かれる（plan の段で見えたはずの穴）。`README.md:49` の work 行は step 18。owner の step ごとの判断をチケットに書く場所も step 04。

### Unplanned

- なし

Commit:
