# Close 014

## Integration

- Test: scripts/product-ready/index.test.ts (updated)
- Handoff: `second-opinion-drop`（design の plan 2 の `Boundary.Plans` が名指しした、plan 2 が plan 1 の後に走る受け渡し。その上に ex-plan が「名指しの対象」を載せた）
- Cases:
  - index の --run → 名指しのテストと cycles が消え、名指しの外は残る: pass
  - index の表示だけ → 消える物が出て、木は変わらない: pass

## Collected

### second-opinion-drop (ADR 01-1 / Scope second-opinion, adr-skill, readme)

1. Slice 2 (`adr` スキルの手順6を、consult の `review` の子に差し替える) / child read of step 6 not run; checked the 5 points by direct read instead (review role, `cycles/<NNN>/adr.md` proposal, 3 views once, holes plus own answers to owner before `Highlight`, later arrival)
2. Slice 2 (`adr` スキルの手順6を、consult の `review` の子に差し替える) / `left: this worktree has no child runner (consult_run), so a review-role read could not be executed here`

### ex-prune-all-tests (ADR 02-2 / Scope product-ready.tests)

3. Slice 4 (統合: 写しの上で0本になり、0本でも緑で、プロダクトのテストは食われない) / 計画の Verify (3) は `test/keep.test.ts` が写しに残ったままでは 0 本にならない（vitest が 1 本を見つける）。keep を除いた写しでは exit 0 で `No test files found`（`passWithNoTests` の効果）。写しでの vitest 実行には `node_modules` の symlink が要る（`vitest/config` の解決のため）
4. Slice 4 (統合: 写しの上で0本になり、0本でも緑で、プロダクトのテストは食われない) / `left: Verify (3) の文面は変えず、0 本確認は keep 除去後に行う手順として記録する（keep を消す側に倒すのは誤りのため。文面の直しは親・review に委ねる）`
5. Slice 4 (統合: 写しの上で0本になり、0本でも緑で、プロダクトのテストは食われない) / 親が `c264568` で Verify (3) を「写しから `test/keep.test.ts` を外し」に直した。この `left:` はそこで閉じた
6. Slice 4 (統合: 写しの上で0本になり、0本でも緑で、プロダクトのテストは食われない) / keep を置いたまま写しで vitest を走らせると 1 passed になり、プロダクトのテストが食われずに動くことを確認した
7. Review Round 1 / `Files: index.test.ts update` が偽（子は触らず、`Notes` の Unplanned が自認）
8. Review Round 1 / `prune-tests.mjs:5` の「ハーネスのテストを消す入口」が `.pi/` だけに読める
9. Review Round 1 / `index.test.ts:59` の「test/ は残る」と `:69` の「.pi/ のテストだけが消える」が偽（一般には `test/env.test.ts` が消える。`makeTree` がそれを置かないため緑だった）
10. Review Round 1 / `Slice 4 Verify (3)` の文面（親が `c264568` で「写しから `test/keep.test.ts` を外し」に直した）
11. Review Round 1 / 新しい削除範囲の統合カバーが無い（`index.test.ts` の木に `test/env.test.ts` と `scripts/product-ready/*.test.ts` が無い）
12. Review Round 1 / `targets.mjs` の `node_modules` / `.git` の skip を効かせる入れ子のケースが無い
13. Review Round 1 / 名指しのファイルが `isTestFile` を通らない（非テストを名指しすると消える）
14. Review Round 1 / Slice 4 の Verify (1)(2)(4) と `test:run` の出力記録が無い（`## Acceptance` で記録する）
15. Review Round 2 / L23 の「`index.mjs` / `prune-tests.mjs` / `prune-cycles.mjs` / `cli.mjs` は…触らない」が偽（`prune-tests.mjs` はコメントだけ直した）
16. Review Round 2 / Slice 1 の I/O `findTests(root)` が偽（最終形は `findTests(root, targets = TEST_TARGETS)`）
17. Review Round 2 / Slice 1 Steps の「ファイルならそのまま取る」が偽（`isTestFile` で見てから取る）
18. Review Round 2 / `Notes` Slice 4 の Unplanned「`index.test.ts` は触らなかった」が、Round 1 の `0b9b0c1` の後で偽になった
19. Review Round 2 / 入れ子の `.git` skip が未検査（`.pi/node_modules` だけ。root の `.git` は名指しの外なので skip 行を通らない）
20. Review Round 3 / Slice 1 の Verify が入れ子の `.git` のケースを載せていない（`b5664ad` で足した）
21. Review Round 3 / Round 2 の `fixed: b5664ad` のパスが `.pi/sub/.git/c.test.ts`（実際は `.pi/.git/a.test.ts`）
22. Review Round 3 / `Notes` Slice 4 の `left:`（Verify (3) の文面）が、親の `c264568` の後で古い
23. Review Round 3 / `## Acceptance` の壊しテストの数字が `b5664ad` の前の物（A は5件ではなく6件、B は総数が 13）
24. Acceptance / plan の Verify (3) は「写しから `test/keep.test.ts` を外し」に親が直した（`c264568`）。`Notes` Slice 4 の `left:` はこの直しで閉じた
25. Acceptance / 統合テスト（close 用の受け渡し）は close 側で書く。ここでは名指しの外の生存までを見た

## Triage

owner 確認済み。

- 1, 2: dropped (definition `adr-skill`): acceptance で親が手順6を読み、5点（`review` の子に1回・`cycles/<NNN>/adr.md` を渡す・3観点・穴と自分の答えを owner に見せてから `Highlight`・到着は後続メッセージでよい）を確認して閉じた。実行主体の一行は plan 2 が plan スキルに入れたので、次からは子が自分で読める
- 3: ex-plan ex-prune-all-tests (definition `product-ready.tests`): done（`9b9d714` でマージ）。正しい意図は「プロダクトとしてスタートした時点でテストがゼロ」で、ADR 02-2 が対象を名指し（`.pi` / `scripts/product-ready` / `test/env.test.ts`）に変え、`passWithNoTests: true` を足した
- 4, 5, 6: dropped (ex-plan `Notes` Slice 4): plan の Verify (3) の文面は親が `c264568` で直し、`left:` はそこで閉じた。keep の生存と動作の記録は穴ではない
- 7, 8, 9, 10, 11, 12, 13, 14: dropped (ex-plan Review Round 1): 8件とも直した（`0b9b0c1` / `9b98573` / `874bd8a` / `734bce0` / `c264568`）
- 15, 16, 17, 18, 19: dropped (ex-plan Review Round 2): 5件とも直した（`83f1fb5` / `b5664ad`）
- 20, 21, 22, 23: dropped (ex-plan Review Round 3): 4件とも直した（plan の記録を最終形に同期）
- 24, 25: dropped (ex-plan `Acceptance`): 記録であって穴ではない（Verify (3) の閉じと、統合テストを close 側で書く旨）
- Round 4 の1件（Collected には未採番。`c0982de` で修正）: dropped。`昇順` の主張にテストを足した
- 013 の `proposed` 2件（definition `plan-skill`。014 の Collected には未採番）: done。plan 2 の slice 3 が plan スキルの `read` に実行主体の一行を足した（`21e41a2`）。013 の close が「次のサイクルの定義が運ぶ」とした物は、これで閉じた
