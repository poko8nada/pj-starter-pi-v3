# Close 040

## Collected

### upgrade-run (ADR 01, 02, 03)

1. 221 / Slice 7 (監査) / `@earendil-works/pi-coding-agent@1.4.0` が `undici` を `8.10.2` に固定しているため、`pnpm audit --fix=update` は 0 件しか直さなかった。owner の OK を得て `overrides: undici: ^8.12.3` を入れ、8.12.3 にした。
   - Doing: `pnpm audit --fix=update` を 1 回試し、0 件しか直らないことを確かめた。
   - Left: pi が `undici` を 8.10.2 に固定していて、範囲の中で 8.12.x に上げられない。override は pi の固定を上書きするので、pi が上げた時に外す判断が要る。
   - Cost: override が残る間、`undici` 8.12.3 と pi 1.4.0 の組み合わせが試されないまま動く。
2. 257 / Review Round 1 / `cycles/261026-040-dev/plan/upgrade-run.md:54` の推移 25.9.9 の文は実際は 1 本にまとまったが計画が決めた見込みなので所見にせず読み違え注意として残す。
   - Doing: `@types/node` を 26.6.5 にし、`pnpm ls @types/node` を読んだ。
   - Left: 計画は推移の 25.9.9 が並ぶと見ていたが、実際は 1 本にまとまった。計画の文面はそのまま。
   - Cost: 計画だけを読む者が「25.9.9 が並ぶ」を現状と思う。
3. 258 / Review Round 1 / `vitest.config.ts:13` と `tsconfig.json:2` は Files に update とあるが差分がなく条件付きの段の結果なので書きすぎとして残す。
   - Doing: 5 つの検査を通し、`vitest.config.ts` と `tsconfig.json` に差分が無いことを確かめた。
   - Left: `## Files` は「型が合わない時」「tsc が求めた時」の条件付きで並べたが、実際はどちらも変わらなかった。
   - Cost: 差分に無いファイルが `Files` に並び、`Unlisted` の判定が緩む。
4. 259 / Review Round 1 / `cycles/261026-040-dev/plan/upgrade-run.md:14` の `**/*.mjs` は差分がなく tsc が指さなかったため触らない結論なので書きすぎとして残す。
   - Doing: `tsc` 7.0.2 を走らせ、`.mjs` に指摘が出ないことを確かめた。
   - Left: `## Files` の `**/*.mjs` は触らなかった。
   - Cost: 3 と同じく、`Files` が実際の差分より広い。
5. 260 / Review Round 1 / Slice 7 の直後の Always の再実行の記録が Notes になく commit は lock と workspace だけなので緑の証拠の置き場所として残す (`cycles/261026-040-dev/plan/upgrade-run.md:149`)。
   - Doing: audit の後に 5 つの検査を走らせ、`## Acceptance` の `Ran` に記録した。
   - Left: slice 7 の `## Notes` には検査の記録が無く、`Commit` は lock と workspace の 2 ファイルだけ。
   - Cost: slice の記録だけを読む者は、その commit が緑だったことを確かめられない。
6. 261 / Review Round 1 / `cycles/261026-040-dev/plan/upgrade-skill.md:1` は同じ差分に入る別計画の新規でこの計画の仕事ではないので判断は相手の close に任せる。
   - Doing: `upgrade-skill` の plan md を別の plan として書いた。
   - Left: 同じ差分に入るため、`upgrade-run` の diff には別 plan の新規ファイルが出る。
   - Cost: なし（`upgrade-skill` の close が読む）。
7. 262 / Review Round 1 / lock の差分は 700 行を超え行読みが難しく Verify の `ls` と `why` の命令を信じるしかないことを残す (`pnpm-lock.yaml:1`)。
   - Doing: `pnpm why`、`pnpm ls`、`pnpm audit` の結果で版を確かめた。
   - Left: `pnpm-lock.yaml` の差分は 700 行を超え、行読みはしていない。
   - Cost: lock の中の想定外の解決を、`why` と `ls` に出ない形では見落としうる。
8. 277 / Review Round 2 / 今回は紙の上だけの確認である。テストや `audit` を自分で走らせていない。緑の証拠は `## Acceptance` の `Ran` の記録に頼っている。
   - Doing: 各 slice で 5 つの検査と `grep` を走らせ、`## Acceptance` に記録した。
   - Left: review は文面だけを読み、テスト・audit・`grep` を自分では走らせていない。
   - Cost: 緑の証拠が Acceptance の記録だけにあり、記録が誤れば review は気づけない。
9. 278 / Review Round 2 / lock の差分 700 行超は全部読んでいない。`pnpm why` と `ls` の記録を信じている。
   - Doing: 7 と同じく、`why` と `ls` で版を確かめた。
   - Left: lock の全行は読んでいない。
   - Cost: 7 と同じ。
10. 293 / Acceptance / `undici` 8.12.3 と `@earendil-works/pi-coding-agent` 1.4.0 の実行時の組み合わせは、このリポジトリのテストでは確かめられない（pi の HTTP の経路を走らせるテストが無く、このセッションの pi はグローバルの 1.3.0）。
    - Doing: pi の HTTP の経路を通すテストが無いことを確かめた。
    - Left: 実行時の組み合わせは、このリポジトリの検査では確かめられない。
    - Cost: pi の HTTP が 8.12.3 で壊れても、ここの検査は緑のまま。
11. 294 / Acceptance / `pnpm-workspace.yaml` の `overrides: undici` は、pi が固定を上げたら外して確かめ直す。
    - Doing: `pnpm-workspace.yaml` に `overrides: undici: ^8.12.3` を入れた。
    - Left: 外す条件（pi が固定を上げた時）を監視する仕掛けが無い。
    - Cost: override が残ると、pi が上げた版をこちらの指定が握りつぶす。
12. 295 / Acceptance / slice 2 の計画は推移の `@types/node` 25.9.9 が並ぶと見ていたが、実際は 1 本にまとまった。
    - Doing: 2 と同じ。
    - Left: 2 と同じ。
    - Cost: 2 と同じ。

### upgrade-skill (ADR 01, 02, 03)

13. 139 / Review Round 1 / `cycles/261026-040-dev/plan/upgrade-skill.md:30`の日本語5節と`.pi/skills/upgrade/references/report.md:10,18,22,32`の英語4見出しの対応は読み替えが要るが、ownerのbaseがupgrade-runと合うことを認めるため所見にせず残す。
    - Doing: `references/report.md` に 4 つの見出し（Ground / List / Each package / What to decide）で書いた。
    - Left: plan の slice 1 の `Steps` は日本語で 5 つの節を並べており、見出しの対応は読み替えが要る。
    - Cost: 計画と実物の対応を、読む者が毎回読み替える。
14. 140 / Review Round 1 / `cycles/261026-040-dev/adr.md:23,61`の8→9と実際の8つのまま+別行のずれはNotesのowner判断で吸収されADRは変更前記録のため所見にせず残す。
    - Doing: README のサイクルの一覧を 8 つのままにし、`upgrade` を `Packages` の行に分けた。
    - Left: ADR 040 の `## 01` の Scope と Context は「スキル一覧（8→9）」のままで、決定時の記録として直していない。
    - Cost: ADR だけを読む者は、サイクルが 9 つになったと読む。
15. 141 / Review Round 1 / `.pi/skills/upgrade/SKILL.md:80-86`のHow not to do thisはStepsに名指しがなくAddedも見ないが、Procedureの言い換えでownerが読むため所見にせず残す。
    - Doing: `SKILL.md` に `## How not to do this` を 5 行で書いた。
    - Left: slice 2 の `Steps` はそこを名指ししておらず、`Added` も見ていない。
    - Cost: その 5 行は、消しても緑のまま。
16. 156 / Review Round 2 / 今回は紙の上だけの確認である。`grep` を自分で走らせていない。文の存在は読みで確かめた。
    - Doing: slice ごとに `grep` を走らせ、`## Acceptance` に記録した。
    - Left: review は `grep` を自分では走らせていない。
    - Cost: 8 と同じく、緑の証拠が Acceptance の記録だけにある。
17. 171 / Acceptance / `report.md` の英語の 4 見出しと、plan の日本語 5 節の対応は読み替えが要る。
    - Doing: 13 と同じ。
    - Left: 13 と同じ。
    - Cost: 13 と同じ。
18. 172 / Acceptance / ADR 040 の `## 01` の Scope は「スキル一覧（8→9）」のままで、実際は 8 つのまま + 別行。ADR は決定時の記録なので直していない。
    - Doing: 14 と同じ。
    - Left: 14 と同じ。
    - Cost: 14 と同じ。
19. 173 / Acceptance / `SKILL.md` の `## How not to do this` は slice 2 の `Steps` に名指しが無い。
    - Doing: 15 と同じ。
    - Left: 15 と同じ。
    - Cost: 15 と同じ。

## Triage

- 1: dropped (ADR 01, 02, 03, Unit.upgrade-skill): override を入れて監査を 0 件にした。pi が固定を上げた時に外すかどうかは、その時に pi を上げる側が決める。実行時の組み合わせは `## Acceptance` の疑いに残した。
- 2: dropped (ADR 01, 02, 03, Unit.upgrade-skill): 計画の見込みが実物と違うが、閉じたサイクルの記録は直さない。実際の版は `## Notes` の `Unplanned` にある。
- 3: dropped (ADR 01, 02, 03, Unit.upgrade-skill): `## Files` が実際の差分より広いが、閉じたサイクルの plan md は直さない。実際は commit と `## Acceptance` が担う。
- 4: dropped (ADR 01, 02, 03, Unit.upgrade-skill): 3 と同じ。
- 5: dropped (ADR 01, 02, 03, Unit.upgrade-skill): slice 7 の検査の記録は `## Acceptance` の `Ran` にあり、slice の `## Notes` には無い。閉じた記録は直さない。
- 6: dropped (ADR 01, Unit.upgrade-skill): `upgrade-skill.md` は `upgrade-skill` の plan で、`upgrade-run` の穴ではない。
- 7: dropped (ADR 01, 02, 03, Unit.upgrade-skill): `why`・`ls`・`audit` の記録で版を確かめた。lock の全行を読む重さに見合う穴が無い。
- 8: dropped (ADR 01, 02, 03, Unit.upgrade-skill): review の役が検査を再実行する重みが利得を超える。緑の証拠は `## Acceptance` の `Ran` に残した。
- 9: dropped (ADR 01, 02, 03, Unit.upgrade-skill): 7 と同じ。
- 10: dropped (ADR 01, 02, 03, Unit.upgrade-skill): 1 と同じ。組み合わせの未確認は `## Acceptance` の疑いに残した。
- 11: dropped (ADR 01, 02, 03, Unit.upgrade-skill): 1 と同じ。
- 12: dropped (ADR 01, 02, 03, Unit.upgrade-skill): 2 と同じ。
- 13: dropped (ADR 01, 02, 03, Unit.upgrade-skill): 計画の日本語の節と `references/report.md` の英語の見出しは、読む時に読み替えれば足りる。
- 14: dropped (ADR 01, 02, 03, Unit.upgrade-skill): ADR は決定時の記録。実際の判断（サイクルの一覧は 8 つのまま、`upgrade` は別の行）は `## Notes` の `Unplanned` にある。
- 15: dropped (ADR 01, 02, 03, Unit.upgrade-skill): `## How not to do this` は owner が読み、`## Acceptance` に残した。Steps に名指しが無いことで壊れる物が無い。
- 16: dropped (ADR 01, 02, 03, Unit.upgrade-skill): 8 と同じ。
- 17: dropped (ADR 01, 02, 03, Unit.upgrade-skill): 13 と同じ。
- 18: dropped (ADR 01, 02, 03, Unit.upgrade-skill): 14 と同じ。
- 19: dropped (ADR 01, 02, 03, Unit.upgrade-skill): 15 と同じ。

## Verified

### Unit.upgrade-skill

- Plans:
  - `upgrade-run`
  - `upgrade-skill`
- Result: しない — owner の指示で、機能の確かめはせずに close した。
