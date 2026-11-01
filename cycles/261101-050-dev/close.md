# Close 050

## Collected

### comments-consult (ADR 02)

1. 223 / Cleanup: 重複と自明なテストの削除 / `tool/subagents.test.ts` の `latest` の空入力テストを削除した。`rowsOf([])` のテストが同じ経路（`latest([])`）を検証しているため。
2. 224 / Cleanup: 重複と自明なテストの削除 / `run/log.test.ts` の `deliveredKeys([])` の空テストを削除した。対象に分岐がなく、影響も小さいため。
3. 225 / Cleanup: 重複と自明なテストの削除 / `tool/sound.test.ts` の基本呼び出しテストを削除した。差し替えテストが呼び出し回数も確かめているため。
4. 226 / Cleanup: 重複と自明なテストの削除 / `run/log.test.ts` の `startToken` なし行のパーステストを削除した。`token` なし行のテストと同じ形で同じ構成であり、欠落時の振る舞いは `isRunning` と `closeOrphans` のテストが検証しているため。
5. 242 / Work Review Round 1 / `## Files` で `update` としている `.pi/extensions/consult/tool/run.ts:1` に差分がなく、すでに基準に合っていると判断したため指摘とせず残す。 / left: 基準に合う行は残すと計画で定めており、変える理由がないため。
6. 249 / Work Review Round 2 / `.pi/extensions/consult/run/log.test.ts:354-364` の「`token` と `startToken` のない行（古い形）→ どちらも `undefined` で読める」が、同じ入力行について `token` と `startToken` の両方が `undefined` であることを断言していることを確かめたため。

### comments-extensions (ADR 02)

7. 377 / Work Review Round 1 / `.pi/extensions/thinking-scrub/index.test.ts:233` の `設定が enabled が false` は助詞『が』の重なりがあり不自然である。基準違反とまでは言えないため指摘とせず残す。 / left: 規則違反と断定できる根拠がなく、直すと意味を変えるおそれがあるため残す。

### comments-scripts (ADR 02)

8. 209 / Slice 1 (コメントとテスト名) / plan の Verify にある `grep -rniE '作業場|置き場|目録|畳む|雛形|骨|番人|水位|残り物|工場|採る|木|穴'` が `骨組み` に含まれる `骨` に当たり、結果が 0 件にならない。 / left: 対応表が `骨` → `骨組み` を定めているため。部分一致を除けば対象ファイルにおける単独の `骨` の件数は 0 件であり、`pnpm test:run`、`pnpm typecheck`、`pnpm lint`、`pnpm format:check` はいずれも緑である。
9. 229 / Work Review Round 1 / `scripts/harness/list/index.test.ts:5` の `純粋に` は対応表の `純→副作用なし` に合っていない。実装の `scripts/harness/list/index.mjs:11` は `副作用なし` に直されており、同じ意味に同じ語を使う規則9に反するため残っている。 / left: ADR 01 は「純関数」を「純粋関数」と明記しており、純粋自体は適合語である。実装の（副作用なし）はJSDoc の注記であり、テストの純粋には副詞による修飾であり、無理にそろえると不自然になるため残す。
10. 231 / Work Review Round 1 / `scripts/harness/path/index.test.ts:4` の `純粋に` は対応表の `純→副作用なし` に合っていない。実装の `scripts/harness/path/index.mjs:12` は `副作用なし` に直されており、同じ意味に同じ語を使う規則9に反するため残っている。 / left: 9 の left と同じ理由である。純粋は適合語であり、副詞『純粋に』を『副作用なし』に置き換えると不自然になるため残す。
11. 233 / Work Review Round 1 / `scripts/harness/display/index.test.ts:4` の `純粋に` は対応表の `純→副作用なし` に合っていない。実装の `scripts/harness/display/index.mjs:8` は `副作用なし` に直されており、同じ意味に同じ語を使う規則9に反するため残っている。 / left: 9 の left と同じ理由である。純粋は適合語であり、副詞『純粋に』を『副作用なし』に置き換えると不自然になるため残す。
12. 244 / Work Review Round 1 / Verify の grep が `骨組み` の `骨` に当たる件は Notes の Findings に記録されており、対応表で `骨` を `骨組み` に直すと定めているため指摘としない。

### docs (ADR 05)

13. 158 / Work Review Round 1 / `ROADMAP.md:29` の「見るに堪えない」→「見るに耐えない」は、どちらも常用漢字であり、読みも同じであるため規則 1,2,6,7,8,9 のどれにも当たらず、規則からは変えた根拠を読み取れない。
14. 159 / Work Review Round 1 / `.pi/skills/design/references/format.md:22,52` の `<外の物>` は残っている一方で、`DEFINITION.md:31` の「作った物」は「作ったもの」になったため、物→ものの適用がそろっているか判断できない。

### readme (ADR 04)

15. 68 / Work Review Round 1 / レビューでは検証コマンドを実行せず、コミットの記録と差分の確認に頼っている (`cycles/261101-050-dev/plan/readme.md:50`)。

### ex-delete-meaningless-test (ADR 03, Stack)

16. 59 / Work Review Round 1 / Steps では「import は変えない」と定めたものの、Notes の Unplanned にある dirname と fileURLToPath の削除とは矛盾する。lint と format を緑に保つために必要であり、記録されているため指摘としない（cycles/261101-050-dev/plan/ex-delete-meaningless-test.md:38）。
17. the stored types.json test is meaningless; delete it at the close / `policy/types.test.ts` / the owner's instruction

## Triage

- 1: dropped (ADR 02, Stack)
  - Fact: `tool/subagents.test.ts` の `latest` の空入力テストは、同じ経路を検証している `rowsOf([])` のテストと重複するため、整理で削除した。
  - Why: 削除した後もその振る舞いを `rowsOf([])` のテストが確かめており、スイートは緑である。
  - Then: なし
- 2: dropped (ADR 02, Stack)
  - Fact: `run/log.test.ts` の `deliveredKeys([])` の空テストは、対象に分岐がなく影響も小さいため、整理で削除した。
  - Why: 残したテストが同じ振る舞いをより強い形で確かめており、スイートは緑である。
  - Then: なし
- 3: dropped (ADR 02, Stack)
  - Fact: `tool/sound.test.ts` の基本呼び出しテストは、差し替えテストが呼び出し回数も確かめているため、整理で削除した。
  - Why: 差し替えテストが同じ呼び出しをより詳細に確かめており、スイートは緑である。
  - Then: なし
- 4: dropped (ADR 02, Stack)
  - Fact: `run/log.test.ts` の `startToken` なし行のパーステストは、`token` なし行のテストと同じ形で同じ構成であり、整理で削除した。
  - Why: Round 2 で、残した `token` なし行のテストを `token` と `startToken` の両方の欠落を断言する形に広げたため、欠落を既定値に変えてしまう回帰をこのテストで検出できるようになった。
  - Then: なし
- 5: dropped (ADR 02, Stack)
  - Fact: `## Files` で `update` としている `.pi/extensions/consult/tool/run.ts:1` には差分がない。
  - Why: すでに基準に合っていると判断した行であり、変える理由がない。
  - Then: なし
- 6: dropped (ADR 02, Stack)
  - Fact: Round 2 で、`run/log.test.ts:354-364` のテストを `token` と `startToken` の両方の欠落を断言する形に広げたことを確認した。
  - Why: 欠落時に既定値を設けてしまう回帰をこのテストで検出でき、Round 1 の Gaps は解消した。
  - Then: なし
- 7: dropped (ADR 02, Stack)
  - Fact: `.pi/extensions/thinking-scrub/index.test.ts:233` の `設定が enabled が false` は助詞『が』の重なりがある。
  - Why: 規則違反と断定できる根拠がなく、直すと意味を変えるおそれがあるため、`left:` として残した。
  - Then: なし
- 8: dropped (ADR 02, Stack)
  - Fact: plan の Verify にある grep は `骨組み` に含まれる `骨` に当たり、結果が 0 件にならない。
  - Why: 対応表が `骨` → `骨組み` を定めているためであり、部分一致を除けば単独の `骨` の件数は 0 件であり、4 つの検査はいずれも緑である。
  - Then: なし
- 9: dropped (ADR 02, Stack)
  - Fact: `scripts/harness/list/index.test.ts:5` の `純粋に` は、実装の `副作用なし` と表現がそろっていない。
  - Why: ADR 01 は「純関数」を「純粋関数」と明記しており、`純粋` を適合語としており、テストの `純粋に` は副詞による修飾であるため、無理にそろえると不自然になる。
  - Then: なし
- 10: dropped (ADR 02, Stack)
  - Fact: `scripts/harness/path/index.test.ts:4` の `純粋に` は、実装の `副作用なし` と表現がそろっていない。
  - Why: 9 と同じ理由であり、`純粋` は適合語であり、副詞『純粋に』を `副作用なし` に置き換えると不自然になる。
  - Then: なし
- 11: dropped (ADR 02, Stack)
  - Fact: `scripts/harness/display/index.test.ts:4` の `純粋に` は、実装の `副作用なし` と表現がそろっていない。
  - Why: 9 と同じ理由である。
  - Then: なし
- 12: dropped (ADR 02, Stack)
  - Fact: Verify の grep が `骨組み` の `骨` に当たる件は、Notes の Findings に記録されている。
  - Why: 対応表が `骨` → `骨組み` を定めているためであり、指摘としない。
  - Then: なし
- 13: dropped (ADR 05, Stack)
  - Fact: `ROADMAP.md:29` の「見るに堪えない」を「見るに耐えない」に変えたものの、どちらも常用漢字であり、読みも同じであり、規則 1,2,6,7,8,9 のどれにも当たらない。
  - Why: 規則からは変えた根拠を読み取れないため、元の表記を残すと判断した。慣用句の表記はこのサイクルの対象外である。
  - Then: なし
- 14: ex-plan ex-open-kanji-mono (ADR 05, Stack): done fd9d8b2
  - Fact: `.pi/skills/design/references/format.md:22,52` の `<外の物>` は残っている一方で、`DEFINITION.md:31` の「作った物」は「作ったもの」になったため、物→ものの適用がそろっていない。
  - Why: オーナーは、漢字を開く方向（物→もの）が基本であり、直すなら今直すと判断した。
  - Then: `ex-open-kanji-mono` では、残る `物` を `もの` に直す。`本物`、`偽物`、`物差し` などの語は変えない。
- 15: dropped (ADR 04, Stack)
  - Fact: readme のレビューでは、検証コマンドを実行せず、コミットの記録と差分の確認に頼った。
  - Why: readme は文書だけの変更であり、plan の `Added` が差分の確認を定めており、検証コマンドの実行は必須ではない。
  - Then: なし
- 16: dropped (ADR 03, Stack)
  - Fact: `ex-delete-meaningless-test` の Steps では「import は変えない」と定めたものの、テストの削除によって `dirname` と `fileURLToPath` が未使用になり、lint と format を緑に保つため両者を削除した。
  - Why: 計画の意図（意味のないテストの削除）を保ち、スイートを緑に保つために必要な不整合の修正であり、`Unplanned` に記録されている。
  - Then: なし
- 17: ex-plan ex-delete-meaningless-test (ADR 03, Stack): done 1b93b6d
  - Fact: `policy/types.test.ts` の `describe('stored types.json')` は、`types.json` の `review` ロールの文字列をそのまま書き写しており、製品の振る舞いを確かめていない。オーナーは、テストとして意味がないと判断した。
  - Why: このテストは文字列の写しを固定するだけで、振る舞いに関する回帰を検出しない。オーナーの指示により、close 時の `ex-` plan で削除する。
  - Then: `ex-delete-meaningless-test` では、`policy/types.test.ts` からこの `describe` を削除し、スイートを緑に保つ。

## Verified

### adr-skill

- Plans:
  - `comments-scripts`
  - `strings`
  - `docs`
- Result: しない — 振る舞いを変えていないため

### design-skill

- Plans:
  - `docs`
- Result: しない — 振る舞いを変えていないため

### plan-skill

- Plans:
  - `docs`
- Result: しない — 振る舞いを変えていないため

### work-skill

- Plans:
  - `docs`
- Result: しない — 振る舞いを変えていないため

### close-skill

- Plans:
  - `comments-scripts`
  - `docs`
- Result: しない — 振る舞いを変えていないため

### upgrade-skill

- Plans:
  - `docs`
- Result: しない — 振る舞いを変えていないため

### yolo-skill

- Plans:
  - `docs`
- Result: しない — 振る舞いを変えていないため

### quality-gate

- Plans:
  - `comments-extensions`
- Result: しない — 振る舞いを変えていないため

### format-check

- Plans:
  - `comments-extensions`
  - `comments-scripts`
- Result: しない — 振る舞いを変えていないため

### lint-check

- Plans:
  - `comments-extensions`
  - `comments-scripts`
- Result: しない — 振る舞いを変えていないため

### type-check

- Plans:
  - `comments-extensions`
  - `comments-scripts`
- Result: しない — 振る舞いを変えていないため

### test-run

- Plans:
  - `comments-extensions`
  - `comments-scripts`
- Result: しない — 振る舞いを変えていないため

### definition-file

- Plans:
  - `docs`
- Result: しない — 振る舞いを変えていないため

### definition-rules

- Plans:
  - `docs`
- Result: しない — 振る舞いを変えていないため

### agent-rules

- Plans:
  - `docs`
- Result: しない — 振る舞いを変えていないため

### usage-readme

- Plans:
  - `readme`
- Result: しない — 振る舞いを変えていないため

### subagent-consult

- Plans:
  - `comments-consult`
  - `strings`
- Result: しない — 振る舞いを変えていないため

### thinking-scrub

- Plans:
  - `comments-extensions`
  - `strings`
  - `readme`
- Result: しない — 振る舞いを変えていないため

### context-precompact

- Plans:
  - `comments-extensions`
- Result: しない — 振る舞いを変えていないため

### sound-notify

- Plans:
  - `comments-extensions`
- Result: しない — 振る舞いを変えていないため

### product-ready

- Plans:
  - `comments-scripts`
  - `docs`
- Result: しない — 振る舞いを変えていないため
