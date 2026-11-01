# Close 050

## Collected

### comments-consult (ADR 02)

1. 223 / Cleanup: 重複と自明なテストの削除 / `tool/subagents.test.ts` の `latest` の空入力テストを落とした。`rowsOf([])` のテストが同じ経路（`latest([])`）を通るため。
2. 224 / Cleanup: 重複と自明なテストの削除 / `run/log.test.ts` の `deliveredKeys([])` の空テストを落とした。分岐がなく、影響がわずかなため。
3. 225 / Cleanup: 重複と自明なテストの削除 / `tool/sound.test.ts` の基本呼び出しテストを落とした。差し替えテストが呼び出し回数まで確かめるため。
4. 226 / Cleanup: 重複と自明なテストの削除 / `run/log.test.ts` の `startToken` なし行の parse テストを落とした。`token` なし行のテストと同形・同装置で、欠落時の振る舞いは `isRunning` と `closeOrphans` のテストが担うため。
5. 242 / Work Review Round 1 / `## Files` が `update` とする `.pi/extensions/consult/tool/run.ts:1` に差分がなく、既に基準に合うと判断された形であるため所見にせず残す。 / left: 基準に合う行は残すと決めており、変える理由がないため。
6. 249 / Work Review Round 2 / 修正を確認した — `.pi/extensions/consult/run/log.test.ts:354-364` の「`token` と `startToken` のない行（古い形）→ どちらも `undefined` で読める」が、同じ入力行について `token` が `undefined` であることと `startToken` が `undefined` であることの両方を断言しているため、修正済みである。

### comments-extensions (ADR 02)

7. 377 / Work Review Round 1 / `.pi/extensions/thinking-scrub/index.test.ts:233` の `設定が enabled が false` は助詞の `が` が重なり不自然である。基準違反とまでは言えないため所見にせず残す。 / left: 規則違反と断定できる根拠がなく、直すと意味を変える危険があるため残す。

### comments-scripts (ADR 02)

8. 209 / Slice 1 (コメントとテスト名) / plan の Verify の `grep -rniE '作業場|置き場|目録|畳む|雛形|骨|番人|水位|残り物|工場|採る|木|穴'` が `骨組み` に含まれる `骨` に当たり、0 件にならない。 / left: 対応表が `骨` → `骨組み` を求めるため。部分一致を除けば対象ファイルの単独の `骨` は 0 件で、`pnpm test:run`、`pnpm typecheck`、`pnpm lint`、`pnpm format:check` は緑。
9. 229 / Work Review Round 1 / `scripts/harness/list/index.test.ts:5` の `純粋に` は対応表の `純→副作用なし` に合っていない。実装の `scripts/harness/list/index.mjs:11` は `副作用なし` に直されており、同じ意味に同じ語を使う規則9に反するため残存である。 / left: ADR 01は「純関数」を「純粋関数」と明記し純粋自体は適合語である。実装の（副作用なし）はJSDoc注記、テストの純粋には副詞修飾であり、無理に揃えると不自然になるため残す。
10. 231 / Work Review Round 1 / `scripts/harness/path/index.test.ts:4` の `純粋に` は対応表の `純→副作用なし` に合っていない。実装の `scripts/harness/path/index.mjs:12` は `副作用なし` に直されており、同じ意味に同じ語を使う規則9に反するため残存である。 / left: 同上。純粋は適合語であり、副詞修飾を副作用なしに置き換えると不自然になるため残す。
11. 233 / Work Review Round 1 / `scripts/harness/display/index.test.ts:4` の `純粋に` は対応表の `純→副作用なし` に合っていない。実装の `scripts/harness/display/index.mjs:8` は `副作用なし` に直されており、同じ意味に同じ語を使う規則9に反するため残存である。 / left: 同上。純粋は適合語であり、副詞修飾を副作用なしに置き換えると不自然になるため残す。
12. 244 / Work Review Round 1 / Verifyのgrepが `骨組み` の `骨` に当たる件はNotesのFindingsに記録済みであり、対応表の `骨→骨組み` のためfindingにしない。

### docs (ADR 05)

13. 158 / Work Review Round 1 / `ROADMAP.md:29` の「見るに堪えない」→「見るに耐えない」は、どちらも常用漢字で読みも同じため規則 1,2,6,7,8,9 のどれにも当たらず、元の慣用句を変えた根拠が読み取れない。
14. 159 / Work Review Round 1 / `.pi/skills/design/references/format.md:22,52` の `<外の物>` は残り、`DEFINITION.md:31` の「作った物」は「作ったもの」になったため、物→ものの適用が揃っているか読み取れない。

### readme (ADR 04)

15. 68 / Work Review Round 1 / 検証コマンドを自走せずCommitの記録と差分の読みに頼っている (`cycles/261101-050-dev/plan/readme.md:50`)。

### ex-delete-meaningless-test (ADR 03, Stack)

16. the stored types.json test is meaningless; delete it at the close / `policy/types.test.ts` / the owner's instruction

## Triage

- 1: dropped (ADR 02, Stack)
  - Fact: `tool/subagents.test.ts` の `latest` の空入力テストは、同じ経路を通る `rowsOf([])` のテストに重複するため、整理で落とした。
  - Why: 落とした後も同じ振る舞いを `rowsOf([])` のテストが確かめており、スイートは緑である。
  - Then: なし
- 2: dropped (ADR 02, Stack)
  - Fact: `run/log.test.ts` の `deliveredKeys([])` の空テストは、分岐がなく影響がわずかなため、整理で落とした。
  - Why: 残すテストが同じ意味をより強い形で確かめており、スイートは緑である。
  - Then: なし
- 3: dropped (ADR 02, Stack)
  - Fact: `tool/sound.test.ts` の基本呼び出しテストは、差し替えテストが呼び出し回数まで確かめるため、整理で落とした。
  - Why: 差し替えテストが同じ呼び出しをより詳細に確かめており、スイートは緑である。
  - Then: なし
- 4: dropped (ADR 02, Stack)
  - Fact: `run/log.test.ts` の `startToken` なし行の parse テストは、`token` なし行のテストと同形・同装置であり、整理で落とした。
  - Why: Round 2 で、残した `token` なし行のテストが `token` と `startToken` の両方の欠落を断言する形に広がり、欠落を既定値に変える回帰を検出できるようになった。
  - Then: なし
- 5: dropped (ADR 02, Stack)
  - Fact: `## Files` が `update` とする `.pi/extensions/consult/tool/run.ts:1` には差分がない。
  - Why: 既に基準に合うと判断された行であり、変える理由がない。
  - Then: なし
- 6: dropped (ADR 02, Stack)
  - Fact: Round 2 で、`run/log.test.ts:354-364` のテストが `token` と `startToken` の両方の欠落を断言する形に広がったことを確認した。
  - Why: 欠落時に既定値を設ける回帰をこの断言が検出でき、Round 1 の Gaps は閉じた。
  - Then: なし
- 7: dropped (ADR 02, Stack)
  - Fact: `.pi/extensions/thinking-scrub/index.test.ts:233` の `設定が enabled が false` は助詞の `が` が重なる。
  - Why: 規則違反と断定できる根拠がなく、直すと意味を変える危険があるため、`left:` として残した。
  - Then: なし
- 8: dropped (ADR 02, Stack)
  - Fact: plan の Verify の grep は `骨組み` に含まれる `骨` に当たり、0 件にならない。
  - Why: 対応表が `骨` → `骨組み` を求めるためであり、部分一致を除けば単独の `骨` は 0 件で、4 つの検査は緑である。
  - Then: なし
- 9: dropped (ADR 02, Stack)
  - Fact: `scripts/harness/list/index.test.ts:5` の `純粋に` は、実装の `副作用なし` と語が揃っていない。
  - Why: ADR 01 は「純関数」を「純粋関数」と明記して `純粋` を適合語としており、テストの `純粋に` は副詞修飾であるため、無理に揃えると不自然になる。
  - Then: なし
- 10: dropped (ADR 02, Stack)
  - Fact: `scripts/harness/path/index.test.ts:4` の `純粋に` は、実装の `副作用なし` と語が揃っていない。
  - Why: 9 と同じ理由で、`純粋` は適合語であり、副詞修飾を `副作用なし` に置き換えると不自然になる。
  - Then: なし
- 11: dropped (ADR 02, Stack)
  - Fact: `scripts/harness/display/index.test.ts:4` の `純粋に` は、実装の `副作用なし` と語が揃っていない。
  - Why: 9 と同じ理由である。
  - Then: なし
- 12: dropped (ADR 02, Stack)
  - Fact: Verify の grep が `骨組み` の `骨` に当たる件は、Notes の Findings に記録済みである。
  - Why: 対応表が `骨` → `骨組み` を求めるためであり、finding にしない。
  - Then: なし
- 13: dropped (ADR 05, Stack)
  - Fact: `ROADMAP.md:29` の「見るに堪えない」を「見るに耐えない」に変えたが、どちらも常用漢字で読みも同じであり、規則 1,2,6,7,8,9 のどれにも当たらない。
  - Why: 変えた根拠が規則から読み取れず、残すと判断した。慣用句の表記はこのサイクルの対象外である。
  - Then: なし
- 14: ex-plan ex-open-kanji-mono (ADR 05, Stack)
  - Fact: `.pi/skills/design/references/format.md:22,52` の `<外の物>` は残り、`DEFINITION.md:31` の「作った物」は「作ったもの」になったため、物→ものの適用が揃っていない。
  - Why: オーナーは、漢字を開く方向（物→もの）が基本であり、やるなら今やると判断した。
  - Then: `ex-open-kanji-mono` が残る `物` を `もの` に直す。`本物`、`偽物`、`物差し` などの語は変えない。
- 15: dropped (ADR 04, Stack)
  - Fact: readme のレビューは、検証コマンドを自走せず、Commit の記録と差分の読みに頼った。
  - Why: readme は文書だけで、plan の `Added` が差分読みを定めており、検証コマンドの自走は必須ではない。
  - Then: なし
- 16: ex-plan ex-delete-meaningless-test (ADR 03, Stack)
  - Fact: `policy/types.test.ts` の `describe('stored types.json')` のテストは、`types.json` の `review` ロールの文字列を写しており、製品の振る舞いを確かめていない。オーナーは、テストとして意味がないと判断した。
  - Why: このテストは文字列の写しを固定するだけで、振る舞いの回帰を検出しない。オーナーの指示により、close の `ex-` plan で削除する。
  - Then: `ex-delete-meaningless-test` が `policy/types.test.ts` からこの `describe` を削除し、スイートを緑に保つ。

## Verified
