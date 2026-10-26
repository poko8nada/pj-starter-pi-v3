# Close 030

## Collected

### scrub-threshold-and-report (ADR 01, 02 / Scope 未特定)

1. 332 / Review Round 1 / `.pi/extensions/thinking-scrub/index.ts:2` header comment omits `agent_end` report but states no falsehood, so left as note, not a finding. / left: 虚偽はなく finding ではないため、手を付けない。
   - Doing: `message_end` で thinking を畳み、`/thinking-scrub` で on/off を切り替える配線を書いていた。
   - Left: レビューは「嘘は書いていない」として所感にとどめ、直していない。
   - Cost: ヘッダを読むと、`agent_end` の 1 行の報告があることが分からない。動きは正しい。
2. 334 / Review Round 1 / Slice1 positives use 5 repeats only with no 3-repeat success case; value 3 itself is plan-decided, so left as note, not a finding. / left: 値 3 は plan 決定事項で finding ではないため、手を付けない。
   - Doing: 周期の区間を拾う下限を 3 回・20 文字に下げていた。
   - Left: 「3 回ちょうど」の成功ケースは足さず、5 回のケースで代表させた。
   - Cost: 下限の値を動かしたときに落ちるかは、受入の「壊して赤」（`MIN_REPEATS` を 6 に戻して 6 件赤）で確かめた。
3. 340 / Review Round 2 / `.pi/extensions/thinking-scrub/command/scrub.ts:4` header -- fixed confirmed: header now reads `on` / `off` と `show` / `hide` を受ける (lines 2-5).
   - Doing: `/thinking-scrub` の引数を `on` / `off` から `show` / `hide` へ広げていた。
   - Left: なし（直した）。
   - Cost: なし。
4. 341 / Review Round 2 / `.pi/extensions/thinking-scrub/command/scrub.ts:38` usageLine -- fixed confirmed: `usageLine()` returns `[on|off|show|hide]` (line 38).
   - Doing: 使い方の行を 1 か所で組み立てていた。
   - Left: なし（直した）。
   - Cost: なし。
5. 342 / Review Round 2 / `.pi/extensions/thinking-scrub/index.ts:158` registerCommand description -- fixed confirmed: description is `(on/off/show/hide/status)` (line 158).
   - Doing: コマンドの説明文を登録していた。
   - Left: なし（直した）。
   - Cost: なし。
6. 346 / Review Round 2 / `scrub/detect.ts:150` right-space joint -- fixed confirmed: `detect.test.ts:141-146` asserts `foo` + run + ` bar` to `foo\n\nbar`; impl trims both sides (`detect.ts:149-156`).
   - Doing: 区間を消したあと、繋ぎ目の両側の空白を落として改行を戻していた。
   - Left: なし（右端の空白のケースを足した）。
   - Cost: なし。
7. 347 / Review Round 2 / `scrub/message.ts:71` chars sum -- fixed confirmed: `message.test.ts:233` asserts `chars` 120, and `message.test.ts:252-266` adds two-block sum 118 (59+59) test.
   - Doing: 消した文字数をブロックごとに足していた。
   - Left: なし（2 ブロックの合計のケースを足した）。
   - Cost: なし。
8. 348 / Review Round 2 / `index.ts:67` write preserve -- fixed confirmed: `index.test.ts:375-395` adds `off`/`on` preserve `show: false` tests; impl merges via `writePatch` (`index.ts:60-65`).
   - Doing: `settings.json` の 1 つのキーだけを書き換えていた。
   - Left: なし（`on` / `off` が `show` を保つケースを足した）。
   - Cost: なし。
9. 350 / Review Round 2 / `command/scrub.test.ts:85` usage test -- fixed confirmed: test now asserts `show`/`hide` contained (`scrub.test.ts:91-93`), fails against old `[on|off]` line.
   - Doing: `foo` のときに使い方の行が返ることを試していた。
   - Left: なし（`show` / `hide` まで断定するように強めた）。
   - Cost: なし。
10. 351 / Review Round 2 / `index.test.ts:336` overwrite guard -- fixed confirmed: new `show: false` preservation tests start from existing file, overwrite-and-drop would fail.
    - Doing: `off` のときに `settings.json` の `enabled` が偽になることを試していた。
    - Left: なし（`show: false` を保つケースを足した）。
    - Cost: なし。
11. 352 / Review Round 2 / `scrub/message.test.ts:218` single-block sum guard -- fixed confirmed: 118 sum test would be 59 on single-block sum, plus 120 assertion on existing 2-block test.
    - Doing: 2 ブロックのうち片方だけを畳むケースを試していた。
    - Left: なし（両ブロックの合計のケースを足した）。
    - Cost: なし。
12. 354 / Review Round 2 / `message.test.ts:218` の `chars` 120 は全区間ブロックが trim-empty で除外されるため実質片ブロック分だが、118 テストが真の両ブロック合計を担うため finding としない。
    - Doing: 畳んだ結果が空になるブロックは置き換えず、そのまま残していた。
    - Left: 120 のケースは片方のブロックの分だけになる。両ブロックの合計は 118 のケースが担う。
    - Cost: 120 のケースだけを読むと、片ブロック分に見える。
13. 355 / Review Round 2 / `bafa80e` の commit 差分は未照合（作業ツリー現物のみ確認）。作業ツリーが fix 後の状態であることは上記の通り。
    - Doing: Round 1 の修正を `bafa80e` として commit していた。
    - Left: レビューは作業ツリーの現物だけを見て、commit の差分は見ていない。
    - Cost: なし（受入で `git diff b9bea37..HEAD` を確認した）。
14. 370 / Acceptance / `scrub/message.test.ts` の `chars` 120 は、1 つ目のブロックが畳むと空になるため置き換えの対象から外れ、実質は 2 つ目のブロックの分だけ。両ブロックの合計は 118 のケースが担う。
    - Doing: 12 と同じ。
    - Left: 12 と同じ。
    - Cost: 12 と同じ。
15. 371 / Acceptance / Review Round 2 の「`bafa80e` の差分は未照合」は、`git diff b9bea37..HEAD` で私が確認した。
    - Doing: 13 と同じ。
    - Left: 13 と同じ（受入で確認した）。
    - Cost: 13 と同じ。

### ex-scrub-join (ADR 01, 02 / Scope なし)

16. 123 / Review Round 1 / Slice 2/3 の `read`/`cli` チェックの実行証跡は diff からは読めないが、Notes の記載を疑う根拠は無いため finding にしない。`look`/`use` 系は対象外とした — `cycles/261022-030-dev/plan/ex-scrub-join.md:59` / `cycles/261022-030-dev/plan/ex-scrub-join.md:80`
    - Doing: ヘッダの `read` と `oxlint --fix` の `cli` という、検査の形がコードの差分に残らないチェックを書いていた。
    - Left: レビューからは実行証跡が読めないので、finding にしないと判断した。
    - Cost: なし（受入で `oxlint --fix` を実行した）。
17. 132 / Review Round 2 / Round 1 Doubtsのfixed1件（右が空）は直っている。`detect.test.ts:184-189`が`foo`への詰めを断定し`detect.ts:163`の`right.length===0`を通る形で、枝が無ければ`foo\n\n`になり赤になる形だった。Notes Slice 1のUnplanned記載もある
    - Doing: 繋ぎ目の両側が空のときに、改行を足さずに詰める枝を書いていた。
    - Left: なし（右が空のケースを足した）。
    - Cost: なし。
18. 133 / Review Round 2 / 実行による緑は確かめていない。読み合わせでの確認にとどまるため、最終の緑は別途の実行記録に任せたい
    - Doing: レビューは差分とテストの読み合わせだけを行っていた。
    - Left: レビューはテストを実行しない。緑は受入の担当。
    - Cost: なし（受入で実行した）。
19. 147 / Acceptance / Review Round 2 はテストを実行せず読み合わせだけだったので、緑はこの受入の実行で確かめた。
    - Doing: 18 と同じ。
    - Left: 18 と同じ（受入で確かめた）。
    - Cost: 18 と同じ。
20. 148 / Acceptance / `indexOf` から `includes` に戻したことで、将来の oxlint の版が引数も見るようになると警告が戻る。コードは正しいので、そのときは抑止コメント 1 行で足りる。
    - Doing: 繋ぎ目の判定を `includes` に戻していた。
    - Left: 「引数なら発火しない」は、いまの oxlint の見方に依存している。
    - Cost: 版が上がって引数も見るようになると警告が戻る。コードは正しいので、そのとき抑止コメント 1 行で済む。
21. — / 受入 / oxlint の `unicorn/prefer-set-has` が `string.includes` に誤発火し、`--fix` が `new Set(...).has` に書き換えて壊す。
    - Doing: 繋ぎ目の改行を `removedText` の `.includes` で 2 回判定していた。
    - Left: 1 行の回避では済まないので、受け手を引数にした `separatorFor` へ切り出して塞いだ。
    - Cost: なし（ex-scrub-join で塞いだ）。

## Triage

- 1: ex-plan `ex-scrub-join` (ADR 02 / `Unit.thinking-scrub`): ヘッダを実際の配線に合わせた。— done a8b618f
- 2: dropped (ADR 01 / `Unit.thinking-scrub`): 3 回の値は受入の「壊して赤」で担保されており、5 回のケースが代表している。
- 3: dropped (ADR 02 / `Unit.thinking-scrub`): Round 1 で直し、Round 2 で確認済み。残っていない。
- 4: dropped (ADR 02 / `Unit.thinking-scrub`): 3 と同じ。
- 5: dropped (ADR 02 / `Unit.thinking-scrub`): 3 と同じ。
- 6: dropped (ADR 01 / `Unit.thinking-scrub`): 3 と同じ。
- 7: dropped (ADR 01 / `Unit.thinking-scrub`): 3 と同じ。
- 8: dropped (ADR 02 / `Unit.thinking-scrub`): 3 と同じ。
- 9: dropped (ADR 02 / `Unit.thinking-scrub`): 3 と同じ。
- 10: dropped (ADR 02 / `Unit.thinking-scrub`): 3 と同じ。
- 11: dropped (ADR 01 / `Unit.thinking-scrub`): 3 と同じ。
- 12: dropped (ADR 01 / `Unit.thinking-scrub`): 118 のケースが両ブロックの合計を担う。受入の Doubts にも残した。
- 13: dropped (ADR 02 / `Unit.thinking-scrub`): 受入で `git diff b9bea37..HEAD` を確認した。
- 14: dropped (ADR 01 / `Unit.thinking-scrub`): 12 と同じ。
- 15: dropped (ADR 02 / `Unit.thinking-scrub`): 13 と同じ。
- 16: dropped (ADR 02 / `Unit.thinking-scrub`): 受入で `oxlint --fix` を実行した。ソースの書き換えは無い。
- 17: dropped (ADR 01 / `Unit.thinking-scrub`): fixed の 1 件（右が空）を Round 2 で確認済み。残っていない。
- 18: dropped (ADR 02 / `Unit.thinking-scrub`): レビューは実行しない。緑は受入で確かめた。
- 19: dropped (ADR 02 / `Unit.thinking-scrub`): 18 と同じ。
- 20: dropped (ADR 01 / `Unit.thinking-scrub`): いまコードは正しい。版が上がったときに初めて動く話なので、いま置き場を作らない。
- 21: done a8b618f (ADR 01 / `Unit.thinking-scrub`): `separatorFor` への切り出しで塞いだ。
