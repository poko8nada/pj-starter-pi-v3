# Close 043

## Collected

### tuning-settings (ADR 01, 02)

1. 368 / Review Round 1 / `.pi/extensions/thinking-scrub/settings/read.ts:4` — 「入口は毎回読み直す」が関数自体（呼ぶたびに読む）の説明とも、配線の旧動作とも読めて、紛らわしいです。
   - Doing: `readSettings` は呼ぶたびにファイルを読み、配線ではスキャン時と `message_end` で読む形に変わりました。
   - Left: Slice 3 では `index.ts:5` のコメントを直しましたが、`settings/read.ts:4` のコメントは本計画の範囲外として残しました。
   - Cost: 読み位置の説明が古いまま残り、次の変更者が読み位置を誤解します。
2. 369 / Review Round 1 / `.pi/extensions/thinking-scrub/index.ts:91` — `writePatch` が既存の独自キーを残す振る舞いに対する test がなく、本計画の範囲外のため所見にとどめます。
   - Doing: `writePatch` は既定・既存の文書・パッチをグループごとに重ね、独自キーも残します。
   - Left: 本計画の `Files` には、独自キーを残す test がありませんでした。
   - Cost: 完全なファイル化に戻っても、test では検出できません。
3. 370 / Review Round 1 / `.pi/extensions/thinking-scrub/settings/schema.ts:122` — 部分群での `scanEvery` と既定 `tail` の衝突など、本計画の範囲外の分岐に対する test がなく、所見にとどめます。
   - Doing: `parseSettings` は部分群を既定値で補い、`scanEvery > tail`、`minPeriod > maxPeriod`、`minRepeats < 2` を `broken` にします。
   - Left: 部分群の `scanEvery` と既定 `tail` の衝突など、本計画の列挙外の分岐に対する test がありませんでした。
   - Cost: 部分群の設定で判定が意図に反して `broken` や `ok` になり、利用者が原因を特定できません。
4. 375 / Review Round 2 / `.pi/extensions/thinking-scrub/live/guard.test.ts:142` の `fixed:`（テスト名の `MAX_ABORTS` から `live.maxAborts` への変更）が直っていることを確認済みです。
   - Doing: Review Round 2 ではテスト名の修正を確認しました。
   - Left: なし（fixed）です。
   - Cost: なしです。
5. 376 / Review Round 2 / `.pi/extensions/thinking-scrub/index.test.ts:405` の `fixed:`（同上）が直っていることを確認済みです。
   - Doing: Review Round 2 ではテスト名の修正を確認しました。
   - Left: なし（fixed）です。
   - Cost: なしです。
6. 382 / Review Round 2 / `.pi/extensions/thinking-scrub/scrub/detect.test.ts:45` の `fixed:`（繰り返し境界の固定）が直っていることを確認済みです。
   - Doing: Review Round 2 では 10 文字周期の `minRepeats` 境界を確認しました。
   - Left: なし（fixed）です。
   - Cost: なしです。
7. 383 / Review Round 2 / `.pi/extensions/thinking-scrub/index.test.ts:483` の `fixed:`（`handleCommand` の保持の更新の固定）が直っていることを確認済みです。
   - Doing: Review Round 2 では読み取り回数 `1`、`2`、`3`、`4` の固定を確認しました。
   - Left: なし（fixed）です。
   - Cost: なしです。
8. 393 / Acceptance / `settings/read.ts:4` の文言、`index.ts:91` の独自キーの保持、`settings/schema.ts:122` の部分群の衝突を残しました。
   - Doing: Acceptance では 1 から 3 までと同様の `Doubts` を残しました。
   - Left: 1 から 3 の各 Left と同じです。
   - Cost: 1 から 3 の各 Cost と同じです。

### ex-writepatch-custom-values (ADR 01)

9. 55 / Review Round 1 / `.pi/extensions/thinking-scrub/settings/read.ts:4` の注釈 1 行は Files が名指す `index.test.ts` でも `index.ts` でもなく、別計画 `ex-settings-read-comment` の変更です。
   - Doing: Review が差分の起点を `16ef38c` にしたため、merge 済みの別計画の変更を含めて数えました。
   - Left: `5389c41` から `HEAD` の差分には現れない確定済みの別計画の変更であり、本計画の範囲外のため直しません。
   - Cost: 直さなくても本計画の動作には影響しません。plan の記録に別計画の行が残ります。
10. 57 / Review Round 1 / `cycles/261027-043-feat-scrub-update/plan/ex-settings-read-comment.md:44` の Slice 記録と Review と Acceptance の追記は Files が名指す範囲外であり、本計画の Slice と無関係です。
    - Doing: Review が差分の起点を `16ef38c` にしたため、merge 済みの別計画の記録を含めて数えました。
    - Left: `5389c41` から `HEAD` の差分には現れない確定済みの別計画の記録であり、本計画の範囲外のため直しません。
    - Cost: 直さなくても本計画の動作には影響しません。plan の記録に別計画の行が残ります。
11. 66 / Review Round 1 / `.pi/extensions/thinking-scrub/index.ts:102-103` の `sentence` や `char` 内の独自キーや、`show` や `hide` の経路での独自キー保持には本計画の test が触れておらず、本計画の範囲外のため所見にとどめます。
    - Doing: 本計画の test はトップレベルや `live` 内の独自キーを `off` や `on` の経路で確認しました。`sentence` や `char` 内の独自キーや、`show` や `hide` の経路には触れていません。
    - Left: 同じ `mergeGroup` と `writePatch` を通るため、本計画の test で代表させ、他は範囲外として残します。
    - Cost: 将来 `sentence` や `char` だけを特別扱いする変更が入ると、test では検出できません。`show` や `hide` の経路だけが独自キーを落とす変更にも気づけません。
12. 67 / Review Round 1 / `cycles/261027-043-feat-scrub-update/plan/ex-settings-read-comment.md:56` の「1行のみ」の記述は `git diff 16ef38c..HEAD` では 3 件になりますが、当該別計画は確定済み（`5389c41`）のため本計画では直しません。
    - Doing: Review の数え方が古い起点によるものであることを記録しました。
    - Left: 確定済みの別計画の記録であり、本計画の範囲外のため直しません。
    - Cost: 直さなくても本計画の動作には影響しません。記録上の数え方の違いが残ります。
13. 73 / Acceptance / `.pi/extensions/thinking-scrub/index.ts:102-103` の `sentence` や `char` 内の独自キーや、`show` や `hide` の経路での独自キー保持については本計画の範囲外のため残します。
    - Doing: Acceptance では 11 と同じ `Doubts` を残しました。
    - Left: 11 の Left と同じです。
    - Cost: 11 の Cost と同じです。

## Triage

- 1: ex-plan ex-settings-read-comment (ADR 02, Unit.thinking-scrub): `settings/read.ts:4` の「入口は毎回読み直す」が、関数の説明とも、配線の旧動作とも読めます。コメント 1 文を修正します。done `5389c41`.
- 2: ex-plan ex-writepatch-custom-values (ADR 01, Unit.thinking-scrub): `writePatch` が既存の独自キーを残す振る舞いに対する test がありません。完全なファイル化の戻りを防ぐ test を追加します。done `f731c1c`.
- 3: ex-plan ex-partial-group-validation (ADR 01, Unit.thinking-scrub): 部分群の `scanEvery` と既定 `tail` の衝突など、本計画の範囲外の分岐に対する test がありません。部分群の検証 test を追加します。done `1953dd4`.
- 8: 1 から 3 までと同様です（Acceptance の `Doubts` は Review Round 1 の 3 件と同じ内容です）。
- 9: dropped (ADR 01, Unit.thinking-scrub): merge 済みの別計画の変更であり、直す対象がありません。記録は残します。
- 10: dropped (ADR 01, Unit.thinking-scrub): merge 済みの別計画の記録であり、直す対象がありません。記録は残します。
- 11: dropped (ADR 01, Unit.thinking-scrub): 同じ `mergeGroup` と `writePatch` を通るため、本計画の test で代表させます。残りの経路の test を書くコストの方が大きく、戻りの可能性は低いため、書かないこととします。13 も同様です。
- 12: dropped (ADR 01, Unit.thinking-scrub): 確定済みの別計画の記録の数え違いであり、直す対象がありません。記録は残します。
- 13: dropped (ADR 01, Unit.thinking-scrub): 11 と同様です。

## Verified

### Unit.thinking-scrub

- Plans:
  - `tuning-settings`
  - `ex-settings-read-comment`
  - `ex-writepatch-custom-values`
  - `ex-partial-group-validation`
- Result: しない — 手で動かす確認は行いません。生成中の停止と `message_end` の畳み込みを手で確かめるには、ループした thinking を出す実行を回す必要があり、モデルの出力に左右されて同じ条件を再現できません。変わった動作は 748 件の test で固定し、読み込み回数と検証境界は外して赤になることまで確かめ、review と acceptance を通しました。手で回しても自動の検査を超える知見は得られないため、行わないこととします。

### Unit.usage-readme

- Plans:
  - `tuning-settings`
- Result: しない — 目で読む確認は行いません。表のキーと既定値が `settings.json` と一致することは plan の検査で突き合わせ、英語の README と日本語の README は format の検査を通し、日本語の README は proofreader の校正を通し、ルートからのリンクも確かめました。書式の見え方は今回の変更で変わらないため、目で読んでも自動の検査を超える知見は得られないため、行わないこととします。
