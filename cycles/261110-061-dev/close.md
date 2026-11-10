# Close 061

## Collected

### 01 running-widget (ADR 01, 02, 03)

1. 262 / Work Review Round 1 / `.pi/extensions/consult/index.ts:109` — `roleOrder()` が読み込みに失敗したときに `[]` を返すこと（Steps 2.2）を確かめるテストがなく、Added の look も正常系のみを対象とする。finding 化は見送り、放置するか使い捨ての確認で済ませるかをオーナーの判断に委ねたい。理由は、`types.json` の読み込み失敗はまれであり、影響も小さい（表示が初出順に退化するだけである）からである。
2. 287 / Work Review Round 2 / `.pi/extensions/consult/index.ts:259,277` — `showRunningOnce` のヘルパー自体のテストはあるが、`consult_run` の execute（`:259`）と `session_start` ハンドラ（`:277`）が呼び出し元で配線されていることを直接確かめるテストはない（`entry wiring` のテストはレンダラーのみを対象とする）。finding 化は見送り、ヘルパーのテスト止まりでよいか使い捨ての確認で足りるかをオーナーの判断に委ねたい。理由は、ヘルパーが正しくても配線が外れれば Goal の即時性と復元が失われるものの、配線の自動テストには既存方針（`entry` の偽物は使う入口のみを対象とする）を超える手間が掛かるからである。

## Triage

- 1: _ex-plan_ ex-role-order-fallback (ADR 01, `Unit.subagent-consult`): done 886d23f
  - Fact: `roleOrder()` が `types.json` を読み込めないときに `[]` を返すが、この退化動作を確かめるテストがない。`roleOrder()` は引数を持たないため、テストから壊れた config を指定して呼べない。
  - Why: 要件の一つ（読み込みに失敗しても表示を止めないこと）が、正常系の look だけでしか確かめられていない。このサイクルの関心事はウィジェットであるため、今のサイクルで解消する。
  - Then: プランでは、`roleOrder(dir = EXTENSION_DIR)` として、`types.json` のない一時ディレクトリで `[]` を返すテストを追加する。
- 2: dropped (ADR 01, `Unit.subagent-consult`)
  - Fact: `consult_run` の execute と `session_start` ハンドラが `showRunningOnce` を呼ぶ配線を直接確かめるテストがない。`showRunningOnce` 自体のテストはある。
  - Why: 配線のテストは偽の runner で呼び出しを確かめるだけになり、実際の表示を確認できない。配線が外れても tick が 5 秒後に表示されるため、影響は小さい。
  - Then: なし

## Verified

### subagent-consult

- Plans:
  - `running-widget`
  - `ex-role-order-fallback`
- Result: OK — このサイクルの観察で確認した。3 体の表示が `[res:2 pro:1]` から減って消えるのを見て、`ex-` のワークツリーがマージまで通った。
