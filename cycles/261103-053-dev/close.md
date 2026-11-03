# Close 053

## Collected

### adr-affected (ADR 02, 06)

1. 214 / Work Review Round 1 / `lib/git-env.mjs` は `Files` に行だけあり、動詞も `Steps` も差分もない。`left:` 関係ファイルはマーカーを持たず、`Steps` の1ファイル1ステップの対象外である。
2. 217 / Work Review Round 1 / plan md 自身の変更が `Files` にない。`left:` plan md は記録であり、`Files` は作業の対象ファイルを並べる。
3. 221 / Work Review Round 1 / `Verify` の実行記録が差分にない。`left:` 38テスト、typecheck、lint、format、4つの grep は通した。出力はチャットにあり、差分には残らない。
4. 222 / Work Review Round 1 / `affected.md` の検索件数と `ADR` の一致主張は、読者は差分だけでは確かめられない。`left:` `affected.md` は research の記録であり、件数はその証拠である。
5. 226 / Work Review Round 1 / `SKILL.md` 12行目の手順一覧への「the affected」追加が `Steps` にない。`left:` `Notes` の Unplanned に記録した。
6. `.pi/skills/adr/scripts/affected.mjs:48` / 通読 / `affectedSkeleton(nnn)`は`affectedEntrySkeleton(1)`を返すため、開いたサイクルで`affected.md`を作るとエントリーの見出しが常に`## 01:`になる。実測: エントリー2まで進んだ開いたサイクルで`## 01: <問い>`が書かれた（正しくは`## 03:`）。

### consult-research-write (ADR 03)

7. 107 / Work Review Round 1 / cycles/261103-053-dev/plan/consult-research-write.md:40 — `test "$(grep -c '"paths": \["cycles/\*/affected.md"\]' ...)" = 1`は`paths`だけを見て`tools`を見ないため、`tools`の4件（`edit`・`quick_edit`・`target_edit`・`write`）を消して`paths`だけ残しても緑のまま。理由: `Steps`は`tools`追加を求めるが、自動検査は`paths`の存在のみ断言し、`pnpm test:run`も実物の`types.json`を読まない（`policy/types.test.ts`はフィクスチャ、`guard.test.ts`は直書きの`limits`）ため`tools`の回帰を検出できず、`Added`の目視だけが頼り。
8. 108 / Work Review Round 1 / cycles/261103-053-dev/plan/consult-research-write.md:70 — `! grep -n 'design.md' .pi/extensions/consult/sub/guard.test.ts`は不在だけを見て存在を見ないため、`design.md`行を消すだけで`affected.md`への置換や2件の追加（`pathAllowed`と`judgeToolCall`）を足さなくても緑のまま。理由: `Steps`は置換と追加を求めるが、自動検査は`design.md`の不在のみ断言し、`pnpm test:related`も件数が減っても通るため追加の回帰を検出できず、`Added`の目視だけが頼り。
9. 110 / Work Review Round 1 / .pi/extensions/consult/types.json:40 — `review`の`role`文の語の「理由」への変更は、`Steps`にもADR `## 03`の`Adopted`・`Scope`にもない。理由: 計画が決めたのは`types.json`の`research`の`tools`・`paths`とREADME表の`types.json`合わせであり、`review`の`role`文の言い換えは含まれず、`Notes`のja-check報告があっても計画外の変更である。
10. 111 / Work Review Round 1 / .pi/extensions/consult/types.json:55 — `proofreader`の`role`文の例示のカタカナ化（`root`などの漢字の削除とカタカナ併記化）は、`Steps`にもADR `## 03`の`Adopted`・`Scope`にもない。理由: 同上、計画が決めたのはREADME表の上限合わせであり、`proofreader`の`role`文の書き換えは含まれず、`Notes`のja-check報告があっても計画外の変更である。

### design-removal (ADR 01)

11. `.pi/skills/close/SKILL.md:31` / 通読 / 「no plan's `Files`or`Paths` carries」と書くが、plan md に`Paths`の欄はない。design の`Paths` を消したときにこの行が残った。
12. `.pi/skills/adr/SKILL.md:12` / 通読 / エントリー段階の一覧が「scope、research、options、decision、write、affected」の6つで、手順は7つ（Discussion を含む）。一覧と手順が食い違う。

### plan-cut (ADR 04, 05)

13. 126 / Work Review Round 1 / `format.md` の `Outside` と `Boundary.External` は変更前からの残存で本 plan の範囲外だが、読者が出どころを特定できない。
14. `.pi/skills/work/SKILL.md:52` / 通読 / 「a `Goal` line with no case」と書くが、plan md の欄は`Adopted`である。plan-cut が`Goal`を`Adopted` に直したとき、この行が残った。
15. `.pi/skills/work/references/tasks.md:25` / 通読 / 同じく「a `Goal` line with no case」と書く。`Adopted`が正しい。
16. `.pi/skills/yolo/SKILL.md:26` / 通読 / 同ファイルはplanのレビューを5観点（`Goal`、`Files`、`Types`、`Cases`、`Checks`）とするが、plan-cutが`Integration`と`Flow`を足して7観点になった。
17. `README.md:61`・`README.ja.md:61` / 通読 / plan の説明が「分割が合意され…分割が定まり」と同じことを二度言い、`skill`の`description`（ADR が定まり、カットを提示して合意した後）と合わない。

### ex-affected-entry-number (ADR 06)

18. 76 / Work Review Round 1 / `.pi/skills/adr/scripts/index.mjs:51` の `cycle === null` の throw は `.pi/skills/adr/scripts/cycle.mjs:199` の `openCycleDir` が null を弾くため現行経路では到達不能であり、境界防御として残すか到達不能番として削るかは判断が要るため所見にせず残す。
19. 82 / Acceptance / 新規作成の検査は `nnn=1` のみで、`nnn≠1` の新規作成を区別できない。同じ分岐のため実害はない。

### ex-doc-lists (ADR 04)

20. 84 / Work Review Round 1 / `cycles/261103-053-dev/plan/ex-doc-lists.md:58-61` — `Verify`の`grep`は`Integration`の存在と旧文言の不在だけを見て、`the discussion`（`.pi/skills/adr/SKILL.md:12`）・`Adopted`の存在（`.pi/skills/work/SKILL.md:52`）・`Flow`（`.pi/skills/yolo/SKILL.md:26`）・`README.ja.md`の旧文言を確かめないため、今回は差分通読で閉じるが将来の回帰はすり抜ける。
21. 85 / Work Review Round 1 / `README.md:65`・`README.ja.md:65` — planの`Steps`（`cycles/261103-053-dev/plan/ex-doc-lists.md:46-49`）と`close.md:32,101`は61行目と書くが実ファイルのplan行は65行目であり、作業は正しい行に届いたため所見に留める。

## Triage

- 1: dropped (ADR 02, `Unit.adr-skill`)
  - Fact: `adr-affected` の `Files` は `lib/git-env.mjs` をマーカーなしで並べ、`Steps` と差分に変更がない。`left:` で「関係ファイルはマーカーを持たず、`Steps` の対象外」と答えた。
  - Why: `plan/references/format.md` の `## Files` が、変わるファイルはマーカー付き、関係するファイルはマーカーなしと定める。`Steps` は1ファイル1ステップで、関係ファイルはその対象ではない。指摘は書式の取り違えである。
  - Then: なし
- 2: dropped (ADR 02, `Unit.adr-skill`)
  - Fact: plan md 自身の変更が `Files` にない、と指摘された。`left:` で「plan md は記録であり、`Files` は作業の対象ファイルを並べる」と答えた。
  - Why: `Files` は作業が変えるファイルの一覧であり、plan md はその作業の記録である。記録を `Files` に入れると、作業の対象と記録が混ざる。
  - Then: なし
- 3: dropped (ADR 02, `Unit.adr-skill`)
  - Fact: `Verify` の実行記録が差分にない、と指摘された。`left:` で実行したことと、出力がチャットにあることを答えた。
  - Why: `Verify` は実行して閉じるものであり、実行の出力はチャットに残る。差分に残すものではない。
  - Then: なし
- 4: dropped (ADR 02, `Unit.adr-skill`)
  - Fact: `affected.md` の検索件数と `ADR` の一致主張は差分だけでは確かめられない、と指摘された。`left:` で `affected.md` は research の記録だと答えた。
  - Why: `affected.md` は research が調べて書いた記録であり、件数はその証拠である。コードの検査で確かめる対象ではない。
  - Then: なし
- 5: dropped (ADR 02, `Unit.adr-skill`)
  - Fact: `SKILL.md` の12行目の手順一覧への「the affected」の追加が `Steps` にない、と指摘された。`Notes` の `Unplanned` に記録した。
  - Why: 追加はエントリー02の `Adopted` が求める手順の一部であり、`Steps` の文に現れなかった記録漏れである。作業は正しく、記録で閉じている。
  - Then: なし
- 6: ex-plan ex-affected-entry-number (ADR 06, `Unit.adr-skill`): done 2147505
  - Fact: `affectedSkeleton(nnn)` が `affectedEntrySkeleton(1)` を返し、`index.mjs` の「開いたサイクルで `affected.md` がない」分岐が `affectedSkeleton(next)` を書いていた。実測で、エントリー2まで進んだ開いたサイクルで `affected.md` の見出しが `## 01:` になった。
  - Why: ADR のエントリー番号と `affected.md` の見出しが食い違い、記録が読めなくなる。検査は `affectedSkeleton(15)` の先頭だけを見ており、この分岐を確かめていなかった。
  - Then: 骨組みにエントリーの番号を渡す形にし、この分岐の検査を足した。
- 7: ex-plan ex-consult-policy-check (ADR 03, `Unit.subagent-consult`): done 8b0bc86
  - Fact: `consult-research-write` の `Verify` は `paths` の値だけを数え、`tools` の4件を見なかった。`types.test.ts` はフィクスチャを読み、`guard.test.ts` は `limits` を直書きしていた。
  - Why: エントリー03が決めた変更は `tools` と `paths` の両方であり、片方だけの検査では回帰を止められない。
  - Then: 実物の `types.json` を読み、`tools` の4件と `paths` の値を断言する検査を足した。
- 8: ex-plan ex-consult-policy-check (ADR 03, `Unit.subagent-consult`): done 8b0bc86
  - Fact: `consult-research-write` の `Verify` は `design.md` の不在だけを見て、`affected.md` への置換と2件の追加（`pathAllowed` と `judgeToolCall`）を見なかった。
  - Why: エントリー03が決めたのは置換と追加であり、不在だけの検査では置換漏れと追加漏れを止められない。
  - Then: `affected.md` のフィクスチャの存在と、`pathAllowed`・`judgeToolCall` の2件を断言する形にした。
- 9: dropped (ADR 03, `Unit.subagent-consult`)
  - Fact: `types.json:40` の `review` の `role` 文の「理由」への変更は、plan の `Steps` にもエントリー03の `Adopted`・`Scope` にもない。
  - Why: ja-check のエラーを消すための語の置換であり、振る舞いを変えない。置換の記録は`Notes`に残っている。
  - Then: なし
- 10: dropped (ADR 03, `Unit.subagent-consult`)
  - Fact: `types.json:55` の `proofreader` の `role` 文の例示のカタカナ化は、plan の `Steps` にもエントリー03の `Adopted`・`Scope` にもない。
  - Why: No.9と同じく、ja-check のエラーを消すための語の置換であり、振る舞いを変えない。置換の記録は`Notes`に残っている。
  - Then: なし
- 11: ex-plan ex-doc-lists (ADR 01, `Unit.close-skill`): done 846dd77
  - Fact: `close/SKILL.md:31` が「no plan's `Files` or `Paths` carries」と書くが、plan md に `Paths` の欄はない。
  - Why: design の `Paths` を消したときにこの行が残った。読者は plan md のどの欄を見るか決められない。
  - Then: `Files` だけに直した。
- 12: ex-plan ex-doc-lists (ADR 01, `Unit.adr-skill`): done 846dd77
  - Fact: `adr/SKILL.md:12` のエントリー段階の一覧が「scope、research、options、decision、write、affected」の6つで、手順は7つ（Discussion を含む）。
  - Why: 一覧と手順が食い違うと、読者は Discussion を飛ばす。
  - Then: 一覧に「the discussion」を足した。
- 13: ex-plan ex-plan-outside (ADR 04, `Unit.plan-skill`): done 2d35643
  - Fact: `plan/references/format.md` の `## Shape` と `## Slices` が `Outside: <the Boundary.External item>` と書くが、plan md に `Boundary` の欄はなく、`affected.md` の見出しは `### External` である。読者は項目の出どころを特定できない。
  - Why: エントリー04は design の欄への参照を消して `Boundary Plans` に直したが、`Boundary.External` は design の欄ではなく、plan md にも `affected.md` にも同じ名前がない。plan を書く者が `Outside:` の項目をどこから取るか決まらないままである。
  - Then: `Outside:` の項目の出どころを `affected.md` の `### External` に定めた。
- 14: ex-plan ex-doc-lists (ADR 05, `Unit.work-skill`): done 846dd77
  - Fact: `work/SKILL.md:52` が「a `Goal` line with no case」と書くが、plan md の欄は `Adopted` である。
  - Why: plan-cut が `Goal` を `Adopted` に直したとき、この行が残った。affected のエントリー05はこのファイルを `Role change: Not change` と判定したため、plan の `Files` に入らなかった。
  - Then: `Adopted` に直した。
- 15: ex-plan ex-doc-lists (ADR 05, `Unit.work-skill`): done 846dd77
  - Fact: `work/references/tasks.md:25` も「a `Goal` line with no case」と書く。
  - Why: No.14と同じ理由で残った。
  - Then: `Adopted` に直した。
- 16: ex-plan ex-doc-lists (ADR 04, `Unit.yolo-skill`): done 846dd77
  - Fact: `yolo/SKILL.md:26` が plan のレビューを5観点（`Goal`、`Files`、`Types`、`Cases`、`Checks`）とするが、plan-cut が `Integration` と `Flow` を足して7観点になった。
  - Why: yolo は plan のレビューを歩くので、2観点が抜けると yolo のレビューが浅くなる。
  - Then: 7観点に直した。
- 17: ex-plan ex-doc-lists (ADR 04, `Unit.usage-readme`): done 846dd77
  - Fact: `README.md:61` と `README.ja.md:61` の plan の説明が「分割が合意され…分割が定まり」と同じことを二度言い、`skill` の `description`（ADR が定まり、カットを提示して合意した後）と合わない。
  - Why: 読者は plan をいつ呼ぶか決められない。
  - Then: `skill` の `description` に合わせた。
- 18: dropped (ADR 06, `Unit.adr-skill`)
  - Fact: `index.mjs:51` の `cycle === null` の throw は、`openCycleDir` が番号のないディレクトリを返さないため、現行の経路では届かない。
  - Why: 境界の防御であり、将来 `openCycleDir` の選別が変わったときに落ちる方が安全である。
  - Then: なし
- 19: dropped (ADR 06, `Unit.adr-skill`)
  - Fact: 新規作成の検査は `nnn=1` のみで、`nnn≠1` の新規作成を区別できない。
  - Why: 同じ分岐であり、`nnn=1` でも `affectedSkeleton(nnn, 1)` の見出しとエントリーの番号は確かめている。実害はない。
  - Then: なし
- 20: dropped (ADR 04, `Unit.yolo-skill`)
  - Fact: `ex-doc-lists` の `Verify` の `grep` は、`Integration` の存在と旧文言の不在だけを見る。`the discussion`、`Adopted`、`Flow`、`README.ja.md` の旧文言は見ない。
  - Why: `grep` は古い語の検査であり、文書の意味はレビューと通読が受ける。4つの `grep` を足すと、検査が文書の一覧になる。
  - Then: なし
- 21: dropped (ADR 04, `Unit.usage-readme`)
  - Fact: `README.md:65` と `README.ja.md:65` が plan の行であるのに、plan と `close.md` は61行目と書く。
  - Why: 作業は正しい行に届いており、行番号は記録のずれである。
  - Then: なし

## Verified

### adr-skill

- Plans:
  - `design-removal`
  - `adr-affected`
  - `ex-affected-entry-number`
- Result: OK — 新しいサイクルで `# ADR 001` と `# Affected 001` の `## 01:` ができ、開いたサイクルで両方に `## 02:` が増え、`affected.md` がない開いたサイクルで `# Affected 015` の `## 03:` ができた（実測）。

### plan-skill

- Plans:
  - `design-removal`
  - `plan-cut`
  - `ex-plan-outside`
- Result: OK — 手順は ADR、affected、カットと提示、plan md、research、レビュー、校正、見せるの8つで、`Outside:` の項目の出どころは `affected.md` の `### External` である。

### work-skill

- Plans:
  - `design-removal`
  - `plan-cut`
  - `ex-doc-lists`
- Result: OK — plan md の `Place` で実行場所を、`Boundary Plans` でマージ順序を読む。

### close-skill

- Plans:
  - `design-removal`
  - `plan-cut`
  - `ex-doc-lists`
- Result: OK — `collect.mjs` が `close.md` を作り、plan md の `No` と `Boundary Plans` を読んだ。

### yolo-skill

- Plans:
  - `design-removal`
  - `ex-doc-lists`
- Result: OK — 3ステージを歩き、plan のレビューを7観点で見る。

### agent-rules

- Plans:
  - `design-removal`
- Result: OK — `AGENTS.md` のサイクルの文は `plan→work→close` である。

### usage-readme

- Plans:
  - `design-removal`
  - `ex-doc-lists`
- Result: OK — 5スキル、ADR → plan → plan execution → close、記録の一覧は `adr.md` / `affected.md` / `plan/<plan id>.md` / `close.md` である。

### subagent-consult

- Plans:
  - `consult-research-write`
  - `ex-consult-policy-check`
- Result: OK — `research` の `tools` は書き込みの4件を持ち、`paths` は `cycles/*/affected.md` だけで、`guard.test.ts` と `types.test.ts` の33テストが通る。
