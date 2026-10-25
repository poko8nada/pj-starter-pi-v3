# Close 038

## Collected

### slim-consult (ADR 01)

1. 446 / Review Round 1 / `Files` に `update` と記された `.pi/extensions/consult/run/place.test.ts` と `.pi/extensions/consult/tool/sound.test.ts` に差分がございません。既に痩せた状態のため変更不要とお見受けしますが、念のため申し添えます。
   - Doing: `Files` の `update` を、その 2 本も指針に合わせて書き換える印として扱っていた。
   - Left: ケースが既に指針の形で、書き換える所が無かった。
   - Cost: 設計の `Paths` が実態より広い。次の design が同じ 2 本を指す。
2. 447 / Review Round 1 / `branchFor` および `commitMessage` を期待値に用いる箇所は、計画書の `Steps` にて明示的に指示されておりますため、所見から除いております。
   - Doing: 期待値を製品の関数から組んでいた（`branchFor`、`commitMessage`）。
   - Left: `Steps` がその 2 つを名指しで指示していた。
   - Cost: その関数が壊れても、期待値が同じく壊れて緑のままになる。
3. 462 / Acceptance / `## Files` が `update` としている `run/place.test.ts` と `tool/sound.test.ts` に差分がありません。plan の `Steps` と照らすと既に痩せた状態で、変える所が無かったためです。
   - Doing: 1 と同じ。
   - Left: 1 と同じ。
   - Cost: 1 と同じ。

### slim-context-prune (ADR 01)

4. 325 / Review Round 2 / 根拠: `git diff cea8b9e..HEAD` に表題と断言の変更が現れております。製品 `.pi/extensions/context-prune/prune/run.ts:104〜106` は verdict ごとに `droppedTokens += Math.ceil(chars / 4)` を合計しており、201 文字×2 件は 51＋51＝102 となります。旧表題の「合計してから割った値」が示す `Math.ceil(402 / 4)`＝101 とは一致しないため、旧表題は製品と断言の双方と食い違うという Round 1 の指摘は正しく、新表題は製品の計算方法と一致しております。
   - Doing: 「合計してから割った値」と書いていたが、製品は件ごとに切り上げて合計する（102）。
   - Left: Round 1 の所見を受けて表題を「件ごとに切り上げて合計した値」に直し、Round 2 が根拠を書いた。
   - Cost: 無し。直っている。
5. 333 / Review Round 2 / 根拠: `git diff cea8b9e..HEAD` に `shownCounts` の導入と 900 前後の素数値からの置き換えが現れております。`test/prune-fixture.ts:44〜46` のとおり `chars` 1234 の `droppedTokens` は 309 となり、後は 12345−309＝12036 です。製品 `entry/render.ts:22〜30` は前後トークンと文字数に `formatCount` を使い、`format/count.ts:4〜6` は `toLocaleString('ja-JP')` です。`formatCount` を外して素の文字列にしますと 12345・12036・1234 は区切り無しになり、表の区切り有り文字列と一致しないため赤になります。旧来の 900 前後の値では区切りの有無が現れないという Round 1 の指摘は解消されております。
   - Doing: `chars` を小さい数にして `formatCount` を呼ばずに期待を組んでいた。
   - Left: Round 1 の所見を受けて 1234 などの表に変え、`formatCount` を外すと赤になる形にした。
   - Cost: 無し。直っている。
6. 336 / Review Round 2 / 根拠: `git diff cea8b9e..HEAD` に `textOf` の削除と `chars` 1234 への置き換えが現れております。製品 `apply/drafts.ts:10〜12` の `markerText` は `formatCount(chars)` を使います。`formatCount` を外しますと 1234 は「1234」となり表の「1,234」と一致しないため赤になります。旧来の 10〜123 の小さな値では区切りの有無が現れないという Round 1 の指摘は解消されております。
   - Doing: `String(chars)` で期待を組んでいた。
   - Left: 5 と同じ。
   - Cost: 無し。直っている。
7. 340 / Review Round 2 / 「`formatCount` を外すと赤になることを確かめて戻した」との赤確認自体は、本レビューでは再実行しておらず、差分と製品コードの静的な照合による判断でございます。コードを変更しない制約のため、ミューテーションの再実行は行っておりません。
   - Doing: 修正の赤確認は `code` が行った。
   - Left: レビューの役割は読み合わせで、ミューテーションを再実行していない。
   - Cost: 赤確認の記録は `code` の報告に依る。
8. 341 / Review Round 2 / `render.test.ts:59` の `droppedTokens`（309）は 3 桁のため単独では区切りを検証しませんが、同一ケースの前後トークンと文字数で検証されるため、所見とはしておりません。
   - Doing: 同じケースの前後トークンで区切りを確かめている。
   - Left: 所見に当たらない。
   - Cost: 無し。
9. 342 / Review Round 2 / `drafts.test.ts:42` の 2 パス目の `chars: 20` は 3 桁以下ですが、同一ファイルの 1234 のケースで区切りが検証されるため、所見とはしておりません。
   - Doing: 同じファイルの 1234 のケースで区切りを確かめている。
   - Left: 所見に当たらない。
   - Cost: 無し。
10. 357 / Acceptance / `format/count.test.ts` を削除したので、桁区切りを単体で試すテストはありません。桁区切りは `render.test.ts` と `drafts.test.ts` の表（1,234 など）が押さえています。
    - Doing: `toLocaleString('ja-JP')` の出力の写しを落とした。
    - Left: 桁区切りは Node の ICU が保証する。代わりに `render.test.ts` と `drafts.test.ts` の表が押さえる。
    - Cost: 桁区切りだけを試す単体のテストは無い。

### slim-scripts (ADR 01)

11. 217 / Plan review / `scripts/checks/typecheck.test.ts:78` の表示文の直書き。 / left: 印（`ok`、`failed`）と旗は `test/scripts-fixture.ts` に 1 度だけ置き、断言はそこから取ります。断言の行にリテラルを置かないのが規則 3 で、値の出どころを 1 か所にするのが規則 7 です。製品はこの印を公開していません。
    - Doing: 印（`ok`、`failed`）を `test/scripts-fixture.ts` に 1 度だけ置き、断言はそこから取った。
    - Left: 製品はこの印を公開していない。断言の行にリテラルを置かないのが規則 3 で、値の出どころを 1 か所にするのが規則 7。
    - Cost: 印を変える時は fixture も直す。
12. 240 / Review Round 1 / `scripts/product-ready/index.test.ts:129` の 2 回目の `--run` は scripts と config の表示だけを見て cycles の無い旨の行を見ていませんが、仕様の範囲が曖昧なため所見に留めます。
    - Doing: 「もう一度 `--run` → 無い旨の表示」を、scripts と config の表示だけで確かめた。
    - Left: 仕様の範囲が曖昧なため所見に留めた。
    - Cost: cycles の行が消えても緑のまま。
13. 241 / Review Round 1 / `scripts/harness/config.test.ts:9` は実リポジトリの一覧を読むため現状に依存しますが、Steps の指定どおりであり所見に留めます。
    - Doing: `readList(root)` で `scripts/harness/harness.json` を読んだ。
    - Left: `Steps` の指定どおり。
    - Cost: リポジトリの一覧を変えると、テストの入力も一緒に変わる。
14. 271 / Acceptance / `scripts/checks/typecheck-staged.test.ts:79` のケースは、1 回目の全量で 1 件だけ落ちて再現しなかった。スタブの `tsc` を書いてすぐ実行するため、負荷の高い時に `ETXTBSY` のような競合が出ている可能性がある。
    - Doing: スタブの `tsc` を書いてすぐ実行するケース。
    - Left: 再現しなかった。
    - Cost: 負荷の高い時に落ちる可能性が残る。

### slim-skills (ADR 01)

15. 84 / Cleanup: createLeafDir の重複断定の整理 / `.pi/skills/adr/scripts/scaffold.test.ts` の `createLeafDir` の成功確認から `statSync(leaf).isDirectory()` の断定を削り、`existsSync` と道の一致に寄せました（同じ作りの確認の重複であり、dir であることは Node の `mkdirSync` が決める前提のためです）。
    - Doing: 成功確認で、道の一致と `existsSync` に加えて `statSync().isDirectory()` も見ていた。
    - Left: 同じ作りの確認の重複で、dir であることは `mkdirSync` が決める。
    - Cost: 無し。
16. 85 / Cleanup: createLeafDir の重複断定の整理 / 消えた振る舞いを確かめる試験は残っておらず、削る対象はありませんでした（`80文字`・`///`・`=` 形・`EEXIST` の errno は slice で除去済みです）。
    - Doing: `80文字`・`///`・`=` 形・`EEXIST` の errno を slice で落とした。
    - Left: 残っていない。
    - Cost: 無し。
17. 86 / Cleanup: createLeafDir の重複断定の整理 / 本計画が止めた分岐を踏む試験はなく、削る対象はありませんでした（製品の分岐は変えず、試験だけを整えたためです）。
    - Doing: 製品の分岐は変えていない。
    - Left: 当たらない。
    - Cost: 無し。
18. 87 / Cleanup: createLeafDir の重複断定の整理 / 残りは型や schema が決める前提の再現ではなく、誰も気づかない振る舞いでもないため、保ちました。
    - Doing: 残した試験を指針に照らした。
    - Left: 当たらない。
    - Cost: 無し。
19. 88 / Cleanup: createLeafDir の重複断定の整理 / 削除後は `pnpm test:related`・`pnpm typecheck`・`pnpm lint`・`pnpm format:check` が緑です。
    - Doing: 既定の 5 つを通した。
    - Left: 当たらない。
    - Cost: 無し。
20. 114 / Review Round 1 / `scaffold.test.ts:167-170` は未知旗分岐（`scaffold.mjs:153-154`）を外しても位置引数検証で投げるため緑のままですが、メッセージ断言には hardcoded 文字列が必要で Test cases と衝突するため finding にしませんでした。
    - Doing: 「知らない旗の後に数が来ても投げる」をケースに置こうとした。
    - Left: acceptance で、旗の枝を外しても `--bogus` は数でない位置引数として同じく投げると分かり、ケースを落とした。
    - Cost: 旗の枝を確かめる手が無い。
21. 115 / Review Round 1 / `collect.test.ts:44-50` は `ex-missing` の `ADR 未特定` 見出し（`collect.mjs:265`）を断言しませんが、`noOf` の null 試験が経路を持ち描画の断言には `未特定` リテラルが必要で plan 方針と衝突するため finding にしませんでした。
    - Doing: `noOf` の null の試験で経路を持つ。
    - Left: 描画の断言には `未特定` のリテラルが要り、指針と衝突する。
    - Cost: 見出しの描画は試されない。
22. 116 / Review Round 1 / `test/close-fixture.ts:1-6` の外側振る舞いは注釈で満たされ自動検査がなく、`scaffold.test.ts:110,130` の `cycleDirName` による入力組み立ては製品結合でもありますが、いずれも plan 範囲内のため finding にしませんでした。
    - Doing: 純粋な文字列の組み立てだけにした。
    - Left: 読まれても何も起きないことを、注釈で書いた。
    - Cost: 自動では確かめていない。

### slim-sound-notify (ADR 01)

23. 84 / Plan review / `.pi/extensions/sound-notify/index.test.ts:227` `:244` の `--title` と `--body` が直書きで、cmux の口も `External` にありませんでした。 / left: `cmux` を `External` には入れません。このテストは cmux を起こさず、製品が自分の口（`pi.exec`）に渡す argv を読むだけです。外と話すのは製品で、テストは話しません。
    - Doing: コマンド名と旗をファイルの先頭の定数に置いた。
    - Left: `cmux` を `External` には入れない。テストは cmux を起こさず、製品が自分の口に渡す argv を読むだけ。
    - Cost: 外と話すのは製品で、テストは話さない、という読みを共有する必要がある。
24. 106 / Review Round 1 / `.pi/extensions/sound-notify/index.test.ts:285` の入口テストは実物の `config.json` を読むため、手元に置いた設定があると結果が揺れる可能性があります。
    - Doing: `extensionDefault(recordingPi)` で、拡張の入口を通した。
    - Left: 設定を直接渡す道（`registerSoundHandlers`）もあるが、入口そのものを試していた。
    - Cost: 手元に `config.json` を置くと結果が揺れる。
25. 107 / Review Round 1 / `.pi/extensions/sound-notify/index.test.ts:149` の `compact` と `question` は既定が共に `Ping` のため、単発の断言だけでは種類の取り違えを区別できませんが、別名の 2 件が押さえています。
    - Doing: 単発の断言では種類の取り違えを区別できない。
    - Left: 別名の 2 件が押さえている。
    - Cost: 無し。
26. 108 / Review Round 1 / `.pi/extensions/sound-notify/index.test.ts:252` の `notifications: false` は `done` でのみ確かめ、`permission` と `question` は代表で押さえています。
    - Doing: `permission` と `question` は代表で押さえた。
    - Left: 分岐は `dispatch` に 1 つ。
    - Cost: 無し。
27. 123 / Acceptance / `.pi/extensions/sound-notify/index.test.ts:285` の入口テストは、`extensionDefault` が読む実物の `config.json` に依ります。この repo には置いていませんが、手元に設定を置くと結果が揺れます。
    - Doing: 24 と同じ。
    - Left: 24 と同じ。
    - Cost: 24 と同じ。

### ex-entry-config-input (ADR 01)

28. 51 / Review Round 1 / `.pi/extensions/sound-notify/index.ts:32-36` では既定の `compact` と `question` が共に `Ping` のため、既定値のままでは種類の取り違えを音名だけでは区別できません。ただし既定で同音であれば利用者は気付けないため、`format.md` の `## Test cases` に照らして追加の事例は求めておりません。
    - Doing: 入口テストを `registerSoundHandlers` に寄せ、既定の音で確かめた。
    - Left: 既定で `compact` と `question` が同音なので、音名だけでは種類を区別できない。
    - Cost: 種類の取り違えは別名の 2 件で押さえる。
29. 52 / Review Round 1 / 本リポジトリには `config.json` がなく、`.pi/extensions/sound-notify/index.ts:86-96` の `loadConfig` は欠落時に既定値を返すため、仮に旧来の `extensionDefault` に戻しても清浄な環境では当該試験は緑のままです。不読み替えの保証は試験結果ではなく `.pi/extensions/sound-notify/index.test.ts:55-76` の `createEntry` が `registerSoundHandlers` のみを呼ぶ構成によります。
    - Doing: `extensionDefault` をやめて `registerSoundHandlers` に設定を渡した。
    - Left: `config.json` が無いこの repo では、旧来の形でも緑だった。
    - Cost: 区別は `createEntry` の構成が持つ。
30. 53 / Review Round 1 / `cycles/261025-038-feat-slim-test/plan/slim-sound-notify.md:106-107,123` の疑念は旧来の実 `config.json` 依存を述べたものであり、本差分により過去の記録となります。当該 `plan` の `Files` 外のため、本 `Review` では所見とせず疑念として残します。
    - Doing: 親 plan の `Doubts` が実 `config.json` への依存を挙げていた。
    - Left: この ex- の修正で、その依存は無くなった。
    - Cost: 無し。

### ex-harness-list-input (ADR 01)

31. 60 / Review Round 1 / scripts/harness/config.test.ts:6 の describe が testConfig のままなのは初回ケースも false の振る舞いを表すため所見に留めます。
    - Doing: 初回ケースを `testConfig(false)` の呼び出しに変えた。
    - Left: `describe` の名前は変えていない。
    - Cost: 無し。初回ケースも `testConfig(false)` の振る舞い。
32. 72 / Review Round 2 / 根拠: `git diff 2488a9d..HEAD` に `const exclude = testConfig(false).test?.exclude ?? [];`（現行 23 行目）と `expect(exclude.slice(configDefaults.exclude.length)).toEqual(expectedTail);`（現行 32 行目）が現れており、`harnessExcludes` の直呼びとその import は残っておりません。製品 `vitest.config.ts:36` は `exclude: [...configDefaults.exclude, ...harnessExcludes(readList(root))]` であり、検査が製品の `testConfig(false)` を通して除外を読むため、実一覧を除外へ載せる結合が運動されます。検査内の `copy` 14 件は `scripts/harness/harness.json:3〜16` の `copy` と順序まで一致していることを確認しました。
    - Doing: 結線の所見を受けて、`testConfig(false)` を呼ぶ形に直した。
    - Left: Round 2 が、その修正を差分で確かめた。
    - Cost: 無し。
33. 76 / Review Round 2 / 根拠: `git diff 2488a9d..HEAD` に `expect(exclude.slice(0, configDefaults.exclude.length)).toEqual([...configDefaults.exclude]);` の削除が現れており、現行 `scripts/harness/config.test.ts` に `slice(0,` は残っておりません。残る尾の断言（現行 32 行目）の期待は検査内の `copy` から自前で組み立てており、製品の `harnessExcludes` を呼んでおりません。
    - Doing: 自分自身との比較だった先頭一致の断言を落とした。
    - Left: Round 2 が、その削除を差分で確かめた。
    - Cost: 無し。
34. 80 / Review Round 2 / 根拠: `git diff 2488a9d..HEAD` に `expect(exclude).toContain(first);` と `expect(exclude).toContain(`${first}/**`);` の削除が現れており、現行 `scripts/harness/config.test.ts` に `toContain` は残っておりません。残る尾の全体一致（現行 32 行目）の期待先頭は `copy[0]` と `copy[0]/**` であり、全体一致が成り立てば包含は定まります。
    - Doing: 全体一致で決まる `toContain` の 2 件を落とした。
    - Left: Round 2 が、その削除を差分で確かめた。
    - Cost: 無し。
35. 82 / Review Round 2 / 先頭一致を落としたことで既定値の保持の明示的な断言は無くなりましたが、製品が既定値を壊せば尾の切り出し位置がずれて尾の全体一致が赤になるため、所見に留めます。
    - Doing: 先頭の既定値を確かめる断言を落とした。
    - Left: 製品が既定値を壊せば、尾の切り出し位置がずれて赤になる。
    - Cost: 無し。
36. 83 / Review Round 2 / 「壊せば赤になること」の再実行は、本レビューでは行っておりません。コードを変更しない制約のため、`git diff 2488a9d..HEAD` と製品コードの静的な照合による判断でございます。
    - Doing: 赤確認は `code` の acceptance が行った。
    - Left: レビューの役割は読み合わせで、ミューテーションを再実行しない。
    - Cost: 赤確認の記録は acceptance に依る。
37. 96 / Acceptance / `testConfig` は内側で実リポジトリの `harness.json` を読む。結線を試すと `harness.json` を変えた時にこのテストが赤くなる。完全に切り離すには `testConfig` に一覧を渡す口が要り、それは製品の変更なので、この plan ではやらない。
    - Doing: 結線を試すために `testConfig(false)` を呼ぶ形にした。
    - Left: `testConfig` が内側で実一覧を読むのは製品の形で、切り離すには口を足す。製品を変えるのでこの plan ではやらない。
    - Cost: `harness.json` を変えるとこのテストが赤くなる。

### ex-product-ready-rerun (ADR 01)

38. 55 / Review Round 1 / `scripts/product-ready/index.test.ts:137` は旧件数の `cycles (2):` の不在のみを見ており、`cycles (0):` のような誤表示の有無や `no cycles to remove` の存在までは見ていませんが、Steps の指定どおりであり所見に留めます。
    - Doing: 2 回目の `--run` に、旧件数の行と各 dir の行の不在の断言を足した。
    - Left: `cycles (0):` の誤表示までは見ていない。
    - Cost: 件数 0 の表示は試されない。

## Triage

- 1: dropped (ADR 01, Unit.test-run): 設計の `Paths` が広すぎただけで、コードに直す所は無い。次の design が同じ 2 本を指さないことは、次のサイクルの材料で見る。
- 2: dropped (ADR 01, Unit.test-run): `Steps` が名指しで指示した形で、直す所は無い。同じ型の誤りは、他の plan で 2 件見つかって直っている。
- 3: dropped (ADR 01, Unit.test-run): 1 と同じ。
- 4: dropped (ADR 01, Unit.test-run): Round 1 の所見を受けて直したあとの根拠で、直す所は無い。
- 5: dropped (ADR 01, Unit.test-run): 同上。
- 6: dropped (ADR 01, Unit.test-run): 同上。
- 7: dropped (ADR 01, Unit.test-run): レビューの役割がミューテーションを再実行しないのは役割の定めで、直す所は無い。
- 8: dropped (ADR 01, Unit.test-run): 同じケースが区切りを押さえている。直す所は無い。
- 9: dropped (ADR 01, Unit.test-run): 8 と同じ。
- 10: dropped (ADR 01, Unit.test-run): plan が決めて落とした。桁区切りは 2 本の表が押さえる。
- 11: dropped (ADR 01, Unit.test-run): plan が決めた形。製品が印を公開していない以上、fixture に 1 度だけ置くのが指針に合う。
- 12: done 3ca414c (ADR 01, Unit.product-ready): 2 回目の `--run` で cycles の行が消えたことを確かめておらず、消えても緑のまま。
- 13: done 6a306ea (ADR 01, Unit.harness-copy): `config.test.ts` が実リポジトリの一覧を読むので、一覧を変えるとテストの入力も変わる。入力をテストの中で組む。
- 14: dropped (ADR 01, Unit.test-run): 1 回だけ落ちて再現しない。原因は分かっておらず、直すには事実が足りない。
- 15: dropped (ADR 01, Unit.adr-skill): 片付けの記録で、直す所は無い。
- 16: dropped (ADR 01, Unit.adr-skill): 同上。
- 17: dropped (ADR 01, Unit.adr-skill): 同上。
- 18: dropped (ADR 01, Unit.adr-skill): 同上。
- 19: dropped (ADR 01, Unit.adr-skill): 同上。
- 20: dropped (ADR 01, Unit.adr-skill): 旗の枝を外しても `--bogus` は同じく投げるので、振る舞いとして確かめられない。理由の文を比べるには直書きが要る。
- 21: dropped (ADR 01, Unit.close-skill): `未特定` の見出しを断言するにはリテラルが要る。`noOf` の null のケースが経路を持つ。
- 22: dropped (ADR 01, Unit.close-skill): 純粋な文字列の組み立てで、テストの外でも何も起きない。自動で確かめる対象が無い。
- 23: dropped (ADR 01, Unit.sound-notify): plan が決めた形。テストは外と話さず、製品の argv を読むだけ。
- 24: done 1f35ec5 (ADR 01, Unit.sound-notify): 入口テストが実物の `config.json` を読むので、手元の設定で結果が揺れる。設定を直接渡す道に寄せる。
- 25: dropped (ADR 01, Unit.sound-notify): 別名の 2 件が種類の取り違えを押さえている。
- 26: dropped (ADR 01, Unit.sound-notify): 分岐は `dispatch` に 1 つで、代表で押さえている。
- 27: done 1f35ec5 (ADR 01, Unit.sound-notify): 24 と同じ所を直す。
- 28: dropped (ADR 01, Unit.sound-notify): 既定の `compact` と `question` が同じ音でも、既定で同音なら利用者は気付けない。用例は要さない。
- 29: dropped (ADR 01, Unit.sound-notify): `config.json` が無ければ `loadConfig` は既定値を返す。この repo に置いていないので、旧来の `extensionDefault` でも清浄な環境では緑だった。区別は `createEntry` の構成で付ける。
- 30: dropped (ADR 01, Unit.sound-notify): 親 plan の疑念は旧来の依存を述べたもので、この ex- の修正で過去の記録になった。
- 31: dropped (ADR 01, Unit.harness-copy): `describe` の名前は初回ケースも `testConfig(false)` の振る舞いを表す。変える所は無い。
- 32: dropped (ADR 01, Unit.harness-copy): Round 2 の根拠で、直す所は無い。
- 33: dropped (ADR 01, Unit.harness-copy): 同上。
- 34: dropped (ADR 01, Unit.harness-copy): 同上。
- 35: dropped (ADR 01, Unit.harness-copy): 先頭一致の断言を落としても、製品が既定を壊せば尾の切り出し位置がずれて赤になる。
- 36: dropped (ADR 01, Unit.harness-copy): レビューの役割がミューテーションを再実行しないのは役割の定め。
- 37: dropped (ADR 01, Unit.harness-copy): `testConfig` が内側で実一覧を読むのは製品の形で、切り離すには口を足す。製品を変えるのでこの plan ではやらない。
- 38: dropped (ADR 01, Unit.product-ready): `cycles (0):` の誤表示までは見ていないが、`Steps` の指定どおり。
