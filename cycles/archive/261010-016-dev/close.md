# Close 016

## Integration

なし（design の `Boundary.Plans` が名指す受け渡しは、`consult-readme` の「`record-and-delivery` が作った振る舞いを README に書く」1 つだけで、機械で検査できる物ではない。README と実装の突き合わせは plan の `read`（子に読ませる）と `look`（人が読む）で行った。close で README を対象にしたテストを 1 本書いたが、owner の判断で取り下げた）

## Collected

### consult-readme (ADR 01-1, 01-2 / Scope consult.docs)

1. Slice 4 (統合: README が実装と一致する) / Tests 節が `run/run.test.ts` に言及しているが、そのファイルは実装に無い（`run/` には `child.test.ts` がいる）。
2. Slice 4 (統合: README が実装と一致する) / `left: この plan の I/O（slice 1–3 の 8 本）の範囲外で、正しい置き換え（記述の振り分け直し）の判断が付かないため直さない。親の read の判断に任せる`
3. Slice 4 (統合: README が実装と一致する) / `fixed: README の run/run.test.ts を run/child.test.ts に直した`
4. Slice 4 (統合: README が実装と一致する) / `fixed: Tests 節を実態に合わせた（run/child と tool/children の説明を現物通りに書き直し、child/guard・tool/render・tool/run の 1 文を追加）。名指し 16 本と実在 16 本が一致することを両方向で確認`
5. Slice 4 (統合: README が実装と一致する) / `fixed: 完了メッセージの順序（1 行目 consult <id> (<type>) finished→塊→--- と子の本文→[consult] 行）と tool/consult.test.ts の説明（塊でなく子のテキスト・ref・[consult] 行を断言）を現物に合わせた`
6. Slice 4 (統合: README が実装と一致する) / `fixed: ルート README.md:15 と README.ja.md:15 を this session 絞りに合わせ、## Files に 2 つを足した`
7. Slice 4 (統合: README が実装と一致する) / `fixed: 壊し 2 を新 check に合わせて書き直した（赤になることを実証・復元済み）`
8. Slice 4 (統合: README が実装と一致する) / `fixed: 残りの read 3 件を直した（record 行の作業場・会話の場所を path 行の書き方に揃えて正確化／Tests 節の model attempt order を削除（参照するテスト無しを grep 確認）／tool/consult.test.ts の説明から ref を外し子の本文と [consult] 行のみに）`
9. Review Round 1 / ルートの `README.md:15` は `consult_children` を「このプロジェクトの子の一覧」と書いたままなので、新しい「このセッションの子だけ」と食い違っている。
10. Review Round 1 / ルートの `README.ja.md:15` は「このプロジェクトの子を一覧し」と書いたままなので、新しい「このセッションの子だけ」と食い違っている。
11. Review Round 1 / slice 1 の `grep -n "30 days"` は `session_start` の掃除の文のほか Tests 節の `run/place.test.ts` の説明にも当たるため、掃除の文を消しても緑のままになる。
12. Review Round 1 / slice 2 の `grep -c "lost"` は一覧の行のほか配達の none is lost・止め方の stays lost・Tests 節にも当たるため、行の `lost` の文を消しても緑のままになる。
13. Acceptance / plan の check の空振り 2 件（親の壊しで発覚）: slice 1 の `grep -c "unit-id/log.jsonl"` は直す前から 0 件（旧い文は `<root>/<unit-id>/log.jsonl` で間に `>` が挟まる）、slice 4 の壊し 2 は `lost` が他に 3 か所あるため赤にならない
14. Acceptance / `fixed: `log.jsonl`と`deletes record files older than 30 days`に締め直し、壊し 2 を「一覧の行の`lost` の説明そのものを消す」に直した（`01587d7`）`
15. Acceptance / 3 回目の `read` の 3 件の修正は、`read` を再実行して確かめていない（打ち切り宣言のため）。現物の読み合わせだけで確かめた
16. Acceptance / `left: その 3 件は `## Notes`の Slice 4 の`fixed:` に記録した。食い違いが残っていないかは close の残り物で裁く`

### record-and-delivery (ADR 01-1, 01-2, 01-3 / Scope consult, consult.children, consult.reload, consult.report, consult.worktree)

17. Slice 5 (統合: reload をまたいでも報告が届き、テストが本物に書かない) / 本物の TUI で子を走らせながらの `/reload` 目視（報告が届く・一覧と cancel・音が止まる）はここではやっていない
18. Slice 5 (統合: reload をまたいでも報告が届き、テストが本物に書かない) / `left: 子を起こして reload を打つ実演環境が無いため。配達の結線（session_start で未読を渡し、渡し終えてから目録を 1 回進める）は捨てテストで確かめた（1 回だけ渡り、2 回目は渡らない）が、そのテストは commit していない`
19. Review Round 1 / `.pi/extensions/consult/tool/worktree.ts:91-96` の旧コメント（`log.jsonl`・この unit のもの）が新コメントと重複して残っている
20. Review Round 1 / `fixed: 旧い方のコメントブロックを消し、新しい方（置き場の日ごとのファイル・session で絞らない）だけを残した`
21. Review Round 1 / `.pi/extensions/consult/tool/children.ts:4-5` の「前のセッションが走らせた子まで出る」が 01-4 の session 絞り（7-8）と矛盾している
22. Review Round 1 / `fixed: 4-5 行目を「子は親のプロセスに従属しないので、reload で親が差し替わっても、同じ session の子は出る」に直した`
23. Review Round 1 / `.pi/extensions/consult/index.ts:175,179` の consult_children 説明（previous session を表示・停止不可）が session 絞りと kill による停止（`controlChild`）と矛盾している
24. Review Round 1 / `fixed: description を this session の表示＋前インスタンスの子も pid で止める旨に、guidelines を this session の一覧＋別 session は止めない旨に直した`
25. Review Round 1 / `.pi/extensions/consult/README.md:68,87,178,189` が旧置き場（`<root>/<unit>/log.jsonl`）と旧振る舞い（他 session 表示・Abort のみ）のままである（plan は consult-readme が書くとしている）
26. Review Round 1 / `left: README は consult-readme の plan が書く。この plan の Files は「README.md は変更しない」と明記している`
27. Review Round 1 / `session_start` の配達結線（未読を 1 つずつ送り終えてから目録を 1 回進め、2 回目は送らない）に commit された check が無い（捨てテスト未 commit・slice5 look 未実施で、tmp place＋fake pi の二重が作れるため look の代替にならない）
28. Review Round 1 / `left: plan の slice 5 が look（owner が子を走らせて /reload）でこの振る舞いを覆っている。index.ts は import すると拡張を登録してしまうので、配線を単体で読む二重物が作れない（plan の slice 3 は cli の grep で順序を見る）`
29. Review Round 1 / `index.ts` の `placeOf` の落とし（`topLevel` が投げたら cwd に落とす）に check が無い（非 repo の tmpDir で二重が作れる）
30. Review Round 1 / `left: これも index.ts の読み込み時の分岐で、テストから届かない。落ちれば起動そのものが失敗して見える（plan の slice 1 は「読み込みで投げない」と書いているだけ）`
31. Review Round 1 / `run/delivery.test.ts` の壊れ目録テストの `unreadNotices` 断言が空の置き場の 0 件を見ているため、壊れ→全部返すが無くても緑のままになる
32. Review Round 1 / `fixed: 通知行を 1 本書いた置き場で目録を壊し、unreadNotices がその 1 本を返す形に直した`
33. Review Round 1 / `run/delivery.test.ts` の遅延置き場テストが `CURSOR_FILE` の不在だけを見て dir の有無を見ないため、`mkdir` が足されても緑のままになる
34. Review Round 1 / `fixed: existsSync(found.dir) が false である断言を足した`
35. Acceptance / plan の slice 5 の look（親が子を 1 体走らせ、その間に owner が `/reload` を打つ）は**未実施**。この look は新しいコードが読み込まれた pi でしか成立せず、それは merge の後になるため / left: merge の後に owner の `/reload` で見る（報告が届く・一覧に出て止められる・音が止まるの 3 つ）

### ex-child-identity (ADR 01-2 / Scope consult.children)

36. Slice 1 (番号を記録から決める) / レビューの Gaps 3 件（`## Review` を見る）。全部採った
37. Slice 1 (番号を記録から決める) / 1 と 3 はテストを足した
38. Slice 1 (番号を記録から決める) / 2 はコードも直した。記録に書かれるのは子が起きた時なので、同じ runtime で続けて起こすと 2 体目が 1 体目の行を見ない。決めた番号を「床」として覚え、session が変われば記録から取り直す
39. Review Round 1 / 別セッションの記録を番号に数えないことは検査されておらず、別セッションに consult-9 があっても同セッションの次が consult-1 になる確認が consult.test.ts の2件になく、session 絞りを外しても緑のままです（consult.ts:358-359）。
40. Review Round 1 / `fixed: 別 session の consult-9 を置いても、この session の次が consult-1 になるテストを足した（絞りを外すと赤）`
41. Review Round 1 / 同じランタイムで続けて2体起こしたときに番号が被らないことは検査されておらず、2回目の beginRun が1回目の onStarted の追記より先に記録を読むと同じ id になり得ますが、その経路の確認がありません（consult.ts:382-408）。
42. Review Round 1 / `fixed: 同じ runtime で続けて 2 体起こすテストを足し、コードも直した（記録に書かれる前に 2 体目の番号を決めるので、決めた番号を覚えて続きから振る。session が変われば記録から取り直す）。床を外すと赤`
43. Review Round 1 / 終わった子（ended のある行）の番号も最大に含めることは検査されておらず、seed が走っている行だけで終わった consult-5 を混ぜた確認がなく、running だけを読んでも現状の検査は緑のままです（consult.ts:358-362、consult.test.ts:143-152）。
44. Review Round 1 / `fixed: 終わった行（ended あり）の consult-5 を置いて、次が consult-6 になるテストを足した`
45. Acceptance / レビューの Gaps 3 件は全部直した（`fixed:` を `## Review` に書いた）
46. Acceptance / `test/` は触っていない。worktree は作っていない（owner の指示）
47. Acceptance / commit: `b36a842`（`consult(ex-child-identity): number children from the record`）

## Triage

owner 確認済み。

- 1–8: dropped (definition `.docs` / ADR 01-1, 01-2): README と実装の食い違いは、その場で全部直した（`311827f`〜`98f60ba`）
- 9–12: dropped (definition `.docs` / ADR 01-1, 01-2): レビューの指摘は `01587d7` で直した
- 13, 14: dropped (definition `.docs`): plan の check の空振りは `d3da289` で直した
- 15, 16: dropped (definition `.docs`): 3 回目の `read` の 3 件は現物の読み合わせで確かめた。owner の判断で次のサイクルへ送らない
- 17, 18, 35: dropped (definition `.report` / ADR 01-1): **実演で確かめた**（reload をまたいで報告が届き、音は戻って止まった）
- 19–24: dropped (definition `.children` / ADR 01-2): レビューの指摘は `cc4883c` で直した
- 25, 26: dropped (definition `.docs`): README は `consult-readme` が書いた（`c43a066`）
- 27, 28: dropped (definition `.report` / ADR 01-1): 配達の結線のテストは owner の判断で送らない（実演で確かめた）
- 29, 30: dropped (definition `.run` / ADR 01-2): 読み込み時の分岐で、落ちれば起動が失敗して見える
- 31–34: dropped (definition `.report` / ADR 01-1): レビューの指摘は `cc4883c` で直した
- 36–47: **done** (definition `.children` / ADR 01-2): `ex-child-identity` として直した（`b36a842`・`646792a`）。要望「リストに無いのに走っている」の残りを閉じた。ADR の新しいエントリは owner の判断で書いていない（決定は plan md にある）
- 実演で見つけた残り物（この `Collected` には無い物）も owner の判断で送らない: 子の会話ファイルが `continue: true` の時しか残らない／`consult-17` の報告が届かなかった件／015 の design の記述違い／definition に音とコマンドの項目が無い
