# ADR 068

## 01: thinking-scrub の読まれない引数

Type: _Simple_

### Context

- C1: 前提: thinking-scrub の実装に、読まれない引数が 2 つある。`runCommand` の第 3 引数 `at` は `void at;` で捨てられる。`resetOnUser` は引数を読まず、常に `emptyGuard()` を返す。`cycleText` の `sep` は外側の `.join(sep)` で読まれるが、すべての呼び出しで省略されている。
- C2: 制約: 振る舞いを変えない。型を満たすためだけの引数は残す。実装が読まない引数だけを削除する。
- C3: 意図: オーナーは、実装が読まない引数を実装から削除することを望んでおり、この削除をサイクルの意図に含めている。
- C4: 問い: 読まれない 2 つの引数を削除したときに型が通り、振る舞いが変わらないか。呼び出し側のどこを直すか。`cycleText` の `sep` は、すべての呼び出しで省略されているため削除するか、残すか。

### Research & Trial

- F1: `runCommand` の第 3 引数 `at` は `void at;` で捨てられ、本体で読まれない。出所: `.pi/extensions/thinking-scrub/command/scrub.ts:50-55`
- F2: `runCommand` の呼び出しは 12 箇所ある。テスト 11 件が `100` を渡し、`index.ts:267` が `options.now()` を渡す。出所: `.pi/extensions/thinking-scrub/command/scrub.test.ts:57,61,68,72,79,95,105,121,137,146,159`、`.pi/extensions/thinking-scrub/index.ts:267-280`
- F3: `resetOnUser` の引数 `guard` は `void guard;` で捨てられ、常に `emptyGuard()` を返す。出所: `.pi/extensions/thinking-scrub/live/guard.ts:27-30`
- F4: `resetOnUser` の呼び出しは 2 箇所ある。`index.ts:242` と `live/guard.test.ts:144` である。出所: `.pi/extensions/thinking-scrub/index.ts:242`、`.pi/extensions/thinking-scrub/live/guard.test.ts:144`
- F5: `cycleText` の `sep` は外側の `.join(sep)` で読まれる。内側の `pattern.join(' ')` は固定の空白である。呼び出し 15 箇所はすべて `sep` を省略する。出所: `.pi/extensions/thinking-scrub/scrub.fixture.ts:35-37`、`.pi/extensions/thinking-scrub/scrub/units.test.ts:115,132,144,154,165-167,196,206,221,229,240`、`.pi/extensions/thinking-scrub/scrub/detect.test.ts:224,234,256`
- 引数の個数を検査するテスト、`arguments`、`vi.fn`、`vi.mock` による当該 3 関数の呼び出し検査はない。出所: リポジトリの `*.ts` 検索
- F7: `at` を除いた `runCommand` は `(port: CommandPort, command: ScrubCommand) => readonly string[]` になり、3 引数の呼び出しは型で拒否される。出所: `.pi/extensions/thinking-scrub/command/scrub.ts:50`
- F8: `resetOnUser` の引数を除くと `() => Guard` になり、引数付きの呼び出しは型で拒否される。出所: `.pi/extensions/thinking-scrub/live/guard.ts:27`
- F9: `cycleText` から `sep` を除いても、現行の 15 件の呼び出しはすべて 2 引数であるため呼び出しの記述の変更は必要ない。出所: `.pi/extensions/thinking-scrub/scrub.fixture.ts:35`
- `at` と同名の別の値（`Status.lastAt`、`addScrub` の `at`、`UnitRun.at`）があるが、当該 3 関数の仮引数とは別である。出所: `.pi/extensions/thinking-scrub/state/cell.ts:9,19`、`.pi/extensions/thinking-scrub/scrub/units.ts:16`
- 調査では `tsc` と `vitest` を実行していないため、削除後の型の合否は未確定である。出所: 調査の制約

### Scope

_omission_

### Decision

- Status: **accepted**
- Main: thinking-scrub の実装から、読まれない引数を 2 つ削除する。振る舞いは変えない。
  - Add:
    - なし
  - Update:
    - `runCommand` の呼び出し 12 箇所から第 3 引数を削除する（`index.ts:267` と `scrub.test.ts` の 11 件）（F2, F7）
    - `resetOnUser` の呼び出し 2 箇所から引数を削除する（`index.ts:242`、`live/guard.test.ts:144`）（F4, F8）
  - Drop:
    - `runCommand` の第 3 引数 `at`（F1）
    - `resetOnUser` の引数 `guard`（F3）
- Policy:
  - Allowed:
    - 振る舞いを変えない範囲で、引数の宣言と呼び出しを直す（C2）
    - `cycleText` の `sep` を残す（C2, F5）
  - Forbidden:
    - 型を満たすためだけの引数を削除する - 型が壊れる（C2）
    - `cycleText` の `sep` を削除する - 実装が外側の `.join(sep)` で読んでおり、C2 の「読まれない引数」に当たらない（C2, F5, F9）

#### Details

_omission_

### Definition

- `Unit.thinking-scrub`(kept): 引数の削除は経路の変更であり、ループした thinking を取り除く主機能は変わらない。

## 02: thinking-scrub のテストの整理

Type: _Full_

### Context

- C1: 前提: thinking-scrub のテストは、単体のファイルと `index.test.ts`（配線）に分かれている。同じ事実を単体と配線の両方で確認している箇所、同じ前提を各テストで作り直している箇所、事実と合わない文言、参照されない補助がある。
- C2: 制約: 振る舞いを変えない。`rules/` は変更しない。振る舞いやロジックを持たない primitive、bool、順序、有無はテストしない。
- C3: 意図: オーナーは、プリンシプルの外にあるテストを削除し、残すテストの意図が読める状態にすることを望んでいる。このサイクルでは、単体と配線の重複を整理し、同じ前提を fixture に集め、古い文言と参照されていない補助を削除する。
- C4: 制約: 単体と配線が同じ事実を確認する場合、判断と変換は単体に残し、配線は経路だけを確認する。
- C5: 制約: 実装の値を写すだけの定数確認は削除する。
- C6: 制約: fixture は、その Unit だけで使うものは Unit 内の `*.fixture.ts`、複数 Unit で使うものは `test/` に置く。テストの前提を組み立てる helper も fixture に置く。
- C7: 制約: 型を満たすためだけの引数は残す。実装が読まない引数の削除は 01 で扱う。
- C8: 制約: 削除ごとに、残す側のテストか「存在しない理由」を対応付ける。
- C9: 問い: どのテストを削除し、どれを統合し、どの前提を fixture に移し、どの文言と補助を直すか。

### Research & Trial

- F1: thinking-scrub のテストは 9 ファイル、132 件である。内訳は command/scrub 10、index 35、live/guard 11、scrub/detect 21、scrub/message 14、scrub/units 15、settings/read 4、settings/schema 16、state/cell 6。出所: `**/*.test.ts` の `describe` と `it` の数え上げ
- F2: `SCRUB_USAGE_MARK` と `FOLLOWUP_SAMPLE_HEADING` は定義だけで、参照がない。出所: `.pi/extensions/thinking-scrub/scrub.fixture.ts:73,84`
- F3: `scrub.fixture.ts:66` は「製品の文言が変わればここだけ直す」と書くが、`index.test.ts:170-172` の `removedLine` が同じ行を再合成し、`command/scrub.ts:37-39` の `usageLine()` も `SCRUB_USAGE_LINE` を使わず自前の文字列を持つ。出所: 各ファイル
- F4: `scrub/detect.test.ts:6` は「fixture は関数の中で組み立てる」と書くが、同ファイルは 2 行目で `cycleText` を fixture から読み込んで、`224,234,256` で使う。出所: `.pi/extensions/thinking-scrub/scrub/detect.test.ts:2,6,224,234,256`
- F5: 既定の thinking の置換後が `degenerateExpected()` である事実を、`scrub/message.test.ts:41` と `index.test.ts:290` が同じ入力・同じ設定で確認する。出所: `.pi/extensions/thinking-scrub/scrub/message.test.ts:41`、`.pi/extensions/thinking-scrub/index.test.ts:290`
- F6: 66 文字を `char.minLength:100` で置換しない事実を、`scrub/message.test.ts:56-61` と `index.test.ts:293-309` が同じ入力・同じ設定で確認する。配線側は `removed=0` を加える。出所: `.pi/extensions/thinking-scrub/scrub/message.test.ts:56-61`、`.pi/extensions/thinking-scrub/index.test.ts:293-309`
- F7: `detectRuns` の `minRepeats-1/minRepeats` と `minPeriod-1/maxPeriod/maxPeriod+1` を、`scrubThinking` が同じ境界として再確認する。出所: `.pi/extensions/thinking-scrub/scrub/detect.test.ts:52-82,126-172`
- F8: 2 回の `message_end` の後の `agent_end` 通知を `index.test.ts:702-717` と `762-779` が確認し、前半 4 行の呼び出しの並びは同一である。出所: `.pi/extensions/thinking-scrub/index.test.ts:702-717,762-779`
- F9: `createScrubWiring` を同じ引数で呼んでいる箇所が 33 ある。出所: `.pi/extensions/thinking-scrub/index.test.ts:196-201,215-220,262-267,275-280,302-307` ほか
- F10: `index.test.ts` と `settings/read.test.ts` では、各 `it` で一時ディレクトリと `settings.json` を作り直している。出所: `.pi/extensions/thinking-scrub/index.test.ts:233-241,246-254,467-478,505-520,732-740,863-878,880-893,896-907,924-938,941-960,963-986`、`.pi/extensions/thinking-scrub/settings/read.test.ts:13-17,24-26,30-33`
- F11: `live/guard.test.ts` の 14 箇所で `observe(emptyGuard(), ..., () => true)` を繰り返している。出所: `.pi/extensions/thinking-scrub/live/guard.test.ts:40,55,65,72,76,85,92,104,116,135,139,146,155,160`
- F12: 各テストが `defaultSettings()` を各 `it` の先頭で呼んでいる。`scrub/detect.test.ts` 21 件、`scrub/units.test.ts` 15 件、`scrub/message.test.ts` 14 件、`live/guard.test.ts` 11 件。出所: 各ファイル
- F13: `test/pi.fixture.ts` は `PiAssistantMessage` 型と `piUsage()` を持ち、これをインポートしているのは `scrub.fixture.ts:11` と `scrub/message.test.ts:3` の 2 つである。`context-prune` はリポジトリに存在しない。出所: `test/pi.fixture.ts:3,11,14-23`、`.pi/extensions` の一覧
- F14: テストが実装から写した値で断言する箇所がある。`command/scrub.test.ts` の `SCRUB_*` 定数、`scrub/detect.test.ts:40` の `minPeriod=4`、`settings/schema.test.ts` と `settings/read.test.ts` の `defaultSettings()`、`state/cell.test.ts` の初期値と加算式、`index.test.ts:170-172` の `removedLine` の再合成である。出所: 各ファイル
- F15: 入力の前提だけを確認する断言がある。`degenerate().length=66`、`text.length<minLength`、分割位置と `opaque` の真偽などである。出所: `.pi/extensions/thinking-scrub/scrub/message.test.ts:58`、`.pi/extensions/thinking-scrub/scrub/detect.test.ts:48`、`.pi/extensions/thinking-scrub/scrub/units.test.ts:43-44,55-57,75-77,89-92`
- F16: 「無いこと」を確認する断言の多くは、別の断言と対になって分岐を確認する。出所: `.pi/extensions/thinking-scrub` の各テスト

### Scope

- In:
  - result: テストの集合と断言を変える（テスト名、断言、件数）。
  - logic: どの事実を単体と配線のどちらで確認するか、どの前提を共有するかを変える。
  - structure: テストファイルの統合と削除、fixture と helper の移動（`test/pi.fixture.ts` から `scrub.fixture.ts` へ）を行う。
  - expression: テスト名、コメント、文言を直す。
  - downstream: fixture のインポート元と、テストが参照する実装の名前を合わせる。
  - existing: 既存のテストと `test/pi.fixture.ts` を移動し、修正する。
  - failure: 残す検査と失敗経路を保つ。
- Out:
  - upstream: 外部のパッケージ、契約、データ源を追加・更新・削除しない（対象がない）。
  - cost: テストの実行時間の短縮は目的ではない（件数の削減は結果であり、費用は対象外）。
  - safety: 秘密、権限、公開、個人データに触れない（対象がない）。
  - verification: 確認の方法は変えない（既存の `pnpm test:run`、`pnpm typecheck`、`pnpm lint` を使う。新しい検査を足さない）。
  - observability: プロダクトが残すログ、メトリクス、監査記録は変えない（テストのみを扱う）。
  - release: 公開、配布、適用、切り戻しの方法を変えない（テストのみを扱う）。
  - other: 14 種で扱えない関心はない。

### Decision

- Status: **accepted**
- Main: thinking-scrub のテストを 132 件から 128 件にし、同じ事実を 1 箇所で確認する形にし、前提を fixture に集める。
  - Add:
    - `scrub.fixture.ts` に、テストの前提を組み立てる helper を集める（C4, C6, F9, F10, F11）
    - `test/pi.fixture.ts` の内容を `scrub.fixture.ts` に移す（C6, F13）
  - Update:
    - 単体と配線で同じ事実を確認しているテストについて、単体に判断を残し、配線では経路だけを確認する形にする（C4, F5, F6, F7, F8）
    - 同じ前提を各テストで作り直している箇所を、fixture と helper に置き換える（C6, F9, F10, F11, F12）
    - 事実と合わない文言を修正する（F3, F4）
    - 実装から写した値の確認を、振る舞いの確認に置き換えるか削除する（C5, F14, F15）
  - Drop:
    - プリンシプルの外にあるテスト（C2, F15, F16）
    - `SCRUB_USAGE_MARK` と `FOLLOWUP_SAMPLE_HEADING`（F2）
    - `test/pi.fixture.ts`（F13）
    - 単体と重複する配線の断言（C4, F5, F6, F7, F8）
- Policy:
  - Allowed:
    - 判断と変換は単体に残し、配線は経路だけを確認する（C4）
    - fixture は、その Unit だけで使うものは Unit 内の `*.fixture.ts` に置き、複数 Unit で使うものは `test/` に置く（C6）
    - 削除ごとに、残す側のテストか「存在しない理由」を対応付ける（C8）
    - 既存の `pnpm test:run`、`pnpm typecheck`、`pnpm lint` で確認する（C2）
  - Forbidden:
    - 振る舞いを変える - テストの整理だけを行う（C2）
    - 振る舞いやロジックを持たない primitive、bool、順序、有無をテストする - プリンシプルに反する（C2）
    - 実装の値を写すだけの定数確認を残す - 振る舞いを確認しない（C5）
    - `rules/` を変更する - このサイクルの範囲外（C2）
    - 実装が読まない引数をこのエントリで削除する - 01 で扱う（C7）

#### Details

- プリンシプルの外にある断言の削除
  ```text
  - .pi/extensions/thinking-scrub/scrub/detect.test.ts:40: `expect(tuning.char.minPeriod).toBe(4)`
  - .pi/extensions/thinking-scrub/scrub/detect.test.ts:48: 入力長の確認
  - .pi/extensions/thinking-scrub/scrub/detect.test.ts:57,66,74,79,88,97: 境界値の前提確認
  - .pi/extensions/thinking-scrub/scrub/detect.test.ts:130-131,134,145,155-156: 境界値の前提確認
  - .pi/extensions/thinking-scrub/scrub/message.test.ts:58: `expect(degenerate().length).toBe(66)`
  - .pi/extensions/thinking-scrub/live/guard.test.ts:39,54,64,74,83-84: 入力長の確認
  ```
- 単体と重複する配線のテストの統合
  ```text
  - .pi/extensions/thinking-scrub/index.test.ts:274: 削除（既定の置換は scrub/message.test.ts:26-46 で確認する）
  - .pi/extensions/thinking-scrub/index.test.ts:293: 削除（66 文字の境界は scrub/message.test.ts:56-62 で確認する）
  - .pi/extensions/thinking-scrub/scrub/detect.test.ts:126: 削除（境界は detectRuns の 52-61 と 63-82 で確認する）
  - .pi/extensions/thinking-scrub/scrub/detect.test.ts:151: 削除（同じ境界。ランなしの本文不変は 174 で確認する）
  - .pi/extensions/thinking-scrub/index.test.ts:762: 前半の 1 回目の通知断言を削除し、2 回目の通知だけを残す
  ```
- fixture と helper の置き場所
  ```text
  - .pi/extensions/thinking-scrub/scrub.fixture.ts に置く:
    - scrubWiring: 製品の createScrubWiring をラップし、settingsDir、now: () => 7、followUp: () => undefined、readSettings の既定値を持つ
    - observeIn: observe(emptyGuard(), thinking, tuning, () => true) をラップする
    - removedLine: index.test.ts:170-172 から移したもので、SCRUB_REMOVED_MARK を使う
    - PiAssistantMessage と piUsage: test/pi.fixture.ts から移す
  - test/pi.fixture.ts: 削除
  - defaultSettings(): detect.test.ts、units.test.ts、message.test.ts、guard.test.ts の各ファイルの先頭で 1 回呼ぶ
  - 前提の境界は cycleText(pattern, minRepeats - 1) のように名前のある値で組み立てる
  ```
- 文言の修正
  ```text
  - .pi/extensions/thinking-scrub/scrub.fixture.ts:66: 「テストが期待する文言を 1 箇所に集める。製品の文言は実装側にもあるため、変えるときは両方を修正する。」に直す
  - .pi/extensions/thinking-scrub/scrub/detect.test.ts:6: 「検出と除去を行う。fixture は scrub.fixture.ts から読む。」に直す
  ```
- インポート元の更新
  ```text
  - .pi/extensions/thinking-scrub/scrub.fixture.ts: test/pi.fixture.ts からのインポートをやめ、test/temp-dir.ts の tempDir と test/settings.fixture.ts の settingsDirWith をインポートする
  - .pi/extensions/thinking-scrub/scrub/message.test.ts: piUsage と PiAssistantMessage を scrub.fixture.ts からインポートする
  - .pi/extensions/thinking-scrub/index.test.ts、command/scrub.test.ts、live/guard.test.ts、scrub/detect.test.ts、scrub/units.test.ts、settings/read.test.ts: 使う helper を scrub.fixture.ts からインポートする
  - test/pi.fixture.ts: 削除し、インポートする箇所を残さない
  ```
- 既存のファイルの移動
  ```text
  - test/pi.fixture.ts: 削除し、内容を scrub.fixture.ts に移す
  - .pi/extensions/thinking-scrub/index.test.ts:170-172: removedLine を scrub.fixture.ts に移す
  - テストファイルの名前と、残るテストのテスト名は変えない
  - 保存データ、インストール済みのバージョン、配布済みの文書は移動しない
  - test/temp-dir.ts: 移動しない（context-precompact も使う）
  - defaultSettings(): 呼び出し位置だけを各ファイルの先頭に移動する
  ```
- 残す検査
  ```text
  - index.test.ts:274 の事実: scrub/message.test.ts:26-46、index.test.ts:261、index.test.ts:805 が保つ
  - index.test.ts:293 の事実: scrub/message.test.ts:56-62 が保つ
  - scrub/detect.test.ts:126 の事実: detectRuns の 52-61 と 63-82 が保つ
  - scrub/detect.test.ts:151 の事実: detectRuns の 63-82 と 174 が保つ
  - 前提の確認の断言を削っても、振る舞いの断言は残る
  - 残す検査: detectRuns の境界（52-82）、scrub/message.test.ts の境界（26-62）、index.test.ts:702、index.test.ts:261、index.test.ts:805、settings/read.test.ts、state/cell.test.ts
  - 新しい失敗経路は足さない
  ```

### Definition

- `Unit.thinking-scrub`(kept): テストの整理は検査の変更であり、ループした thinking を取り除く主機能は変わらない。

## 03: context-precompact のテストの整理

Type: _Full_

### Context

- C1: 前提: context-precompact のテストは、単体のファイルと `index.test.ts`（配線）に分かれている。同じ事実を単体と配線の両方で確認している箇所、同じ前提を各テストで作り直している箇所、事実と合わない文言、参照されない補助がある。
- C2: 制約: 振る舞いを変えない。`rules/` は変更しない。振る舞いやロジックを持たない primitive、bool、順序、有無はテストしない。
- C3: 意図: オーナーは、プリンシプルの外にあるテストを削除し、残すテストの意図が読める状態にすることを望んでいる。このサイクルでは、単体と配線の重複を整理し、同じ前提を fixture に集め、古い文言と参照されていない補助を削除する。
- C4: 制約: 単体と配線が同じ事実を確認する場合、判断と変換は単体に残し、配線は経路だけを確認する。
- C5: 制約: 実装の値を写すだけの定数確認は削除する。
- C6: 制約: fixture は、その Unit だけで使うものは Unit 内の `*.fixture.ts`、複数 Unit で使うものは `test/` に置く。テストの前提を組み立てる helper も fixture に置く。
- C7: 制約: 型を満たすためだけの引数は残す。
- C8: 制約: 削除ごとに、残す側のテストか「存在しない理由」を対応付ける。
- C9: 問い: どのテストを削除し、どれを統合し、どの前提を fixture に移し、どの文言と補助を直すか。

### Research & Trial

- F1: context-precompact のテストは 14 ファイル、95 件である。内訳は run/ports 4、run/summarize 3、command/precompact 4、gate/gate 9、index 36、apply/draft 1、ui/count 2、settings/schema 3、ui/status 8、settings/read 4、prepare/prepare 3、prepare/copied 7、prepare/compare 6、prepare/guard 5。出所: `**/*.test.ts` の `^\s*it\(` の数え上げ
- F2: `ui/count.test.ts:7` は「区切りの仕様はプラットフォームの書式から取る」と書くが、`ui/count.ts:1-5` は固定のカンマ正規表現であり、テストは `toLocaleString('en-US')` を期待値にしている。出所: 各ファイル
- F3: `test/session-entries.ts` の `assistant` は `turns` の中だけで使われ、テストから直接呼ばれていない。`project` は欄として定義されているが、テストは `projectEntries` を直接使う。出所: `.pi/extensions/context-precompact/test/session-entries.ts:20,23,148-154`
- F4: `stale` の 4 分岐は `prepare/guard.test.ts:32-60` が単体で確認し、`index.test.ts:337-386` が同じ 4 分岐を配線で確認する。候補の `gate/guard.test.ts` は現行に存在せず、`gate/gate.test.ts` に `stale` はない。出所: 各ファイル
- F5: `firstKeptEntryId` の一致と不一致は `prepare/compare.test.ts:37-46` が単体で確認し、`index.test.ts:389-434` が配線で確認する。出所: 各ファイル
- F6: 同形の `PreparedCompaction` を `apply/draft.test.ts:26-37`、`run/ports.test.ts:18-29`、`run/summarize.test.ts:10-21`、`prepare/compare.test.ts:23-34` で組み立てている。出所: 各ファイル
- F7: モデルとレジストリの偽物を `index.test.ts:72-84` と `run/ports.test.ts:41-51` で組み立てている。出所: 各ファイル
- F8: `llmUsage` を `index.test.ts:43-52`、`test/session-entries.ts:32-41`、`apply/draft.test.ts:15-24` で同形に持っている。出所: 各ファイル
- F9: compact 結果の組み立てを `index.test.ts:86-94` と `692-700` で二重に持っている。出所: `.pi/extensions/context-precompact/index.test.ts:86-94,692-700`
- F10: `createSessionFixture()` と `turns(3)` を `index.test.ts` の 16 箇所、`prepare/copied.test.ts` の 6 箇所、`prepare/prepare.test.ts` の 6 箇所で繰り返している。出所: 各ファイル
- F11: `nowSetup()` と `preparedNow()` を `index.test.ts` の 18 箇所で使っている。出所: `.pi/extensions/context-precompact/index.test.ts:721,731,741,760,778,788,795,808,819,837,847,854,869,884,899,912,929,949`
- F12: `settings/read.test.ts` と `index.test.ts` では、一時ディレクトリと `settings.json` を各 `it` で作り直している。出所: `.pi/extensions/context-precompact/settings/read.test.ts:10,14-15,25-26,31-33`、`.pi/extensions/context-precompact/index.test.ts:58-62,439-440,781-784,840-843,857-860,963-964`
- F13: 同一ファイル内で 2 経路から同じ事実に至る組がある。`index.test.ts:269` と `290`、`721` と `731`、`837` と `847`、`854` と `869`、`808` と `819` の組である。出所: `.pi/extensions/context-precompact/index.test.ts`
- F14: `ui/status.test.ts:14` と `44`、`21` と `44` が `chatText` と `statusLine` の両方で同じ `formatCount` の 2 値を確認する。出所: `.pi/extensions/context-precompact/ui/status.test.ts:14,21,44`
- F15: `prepare/prepare.test.ts:76-87` の 1 件が `enabled:false` と `piEnabled:false` の 2 経路を同じ `it` で確認する。出所: `.pi/extensions/context-precompact/prepare/prepare.test.ts:76-87`
- F16: テストが実装から写した値で断言する箇所がある。`ui/count.test.ts` の `toLocaleString('en-US')`、`gate/gate.test.ts` の `LEAD_RATIO`/`REARM_RATIO`/`THRESHOLD_RATIO` の計算、`settings/schema.test.ts` と `settings/read.test.ts` の `defaultSettings()`、`prepare/copied.test.ts` などの `RESERVE_TOKENS`、`index.test.ts` の `statusLine`/`chatText`/`failureText`/`usageText` である。出所: 各ファイル
- F17: 入力の前提だけを確認する断言がある。`toBeDefined`、`toHaveLength(0)`、`kind` の一致などである。出所: `.pi/extensions/context-precompact` の各テスト
- F18: 不在のままを断言するテストがある。`prepare/copied.test.ts:30-54`、`prepare/prepare.test.ts:76-87`、`ui/status.test.ts:37-40`、`index.test.ts` の `toBeUndefined` 群である。出所: 各ファイル
- F19: `test/session-entries.ts` をインポートしているのは `prepare/copied.test.ts:5`、`prepare/prepare.test.ts:6-9`、`index.test.ts:19` の 3 つで、`index.ts` 本体はインポートしていない。出所: 各ファイル
- F20: `test/temp-dir.ts` を拡張内でインポートしているのは `settings/read.test.ts:4` と `index.test.ts:10` である。出所: 各ファイル

### Scope

- In:
  - result: テストの集合と断言を変える（テスト名、断言、件数）。
  - logic: どの事実を単体と配線のどちらで確認するか、どの前提を共有するかを変える。
  - structure: テストファイルの統合と削除、fixture と helper の移動（`test/session-entries.ts` と各テストファイル）を行う。
  - expression: テスト名、コメント、文言を直す。
  - downstream: fixture のインポート元と、テストが参照する実装の名前を合わせる。
  - existing: 既存のテストと `test/session-entries.ts` を移動し、修正する。
  - failure: 残す検査と失敗経路を保つ。
- Out:
  - upstream: 外部のパッケージ、契約、データ源を追加・更新・削除しない（対象がない）。
  - cost: テストの実行時間の短縮は目的ではない（件数の削減は結果であり、費用は対象外）。
  - safety: 秘密、権限、公開、個人データに触れない（対象がない）。
  - verification: 確認の方法は変えない（既存の `pnpm test:run`、`pnpm typecheck`、`pnpm lint` を使う。新しい検査を足さない）。
  - observability: プロダクトが残すログ、メトリクス、監査記録は変えない（テストのみを扱う）。
  - release: 公開、配布、適用、切り戻しの方法を変えない（テストのみを扱う）。
  - other: 14 種で扱えない関心はない。

### Decision

- Status: **accepted**
- Main: context-precompact のテストを 95 件のまま、同じ事実を 1 箇所で確認する形にし、前提を fixture に集める。
  - Add:
    - `test/` の fixture に、前提を組み立てる helper を集める（`test/session-entries.ts` の `sessionWithTurns`、`test/prepared.fixture.ts` の `llmUsage`、`preparedCompaction`、`modelFake`、`registryFake`）（C4, C6, F6, F7, F8, F9, F10）
    - `settingsDirWith` を `test/settings.fixture.ts` に置く（C6, F12）
  - Update:
    - 単体と配線で同じ事実を確認しているテストについて、単体に判断を残し、配線では経路だけを確認する形にする（C4, F4, F5）
    - 同じ前提を各テストで作り直している箇所を、fixture と helper に置き換える（C6, F6, F7, F8, F9, F10, F11, F12）
    - 事実と合わない文言を修正する（F2）
    - 実装から写した値の確認を、振る舞いの確認に置き換えるか削除する（C5, F16, F17）
  - Drop:
    - プリンシプルの外にあるテスト（C2, F17, F18）
    - `test/session-entries.ts` の `assistant` と `project`（F3）
    - 単体と重複する配線の断言（C4, F4, F5）
- Policy:
  - Allowed:
    - 判断と変換は単体に残し、配線は経路だけを確認する（C4）
    - fixture は、その Unit だけで使うものは Unit 内の `*.fixture.ts` に置き、複数 Unit で使うものは `test/` に置く（C6）
    - 削除ごとに、残す側のテストか「存在しない理由」を対応付ける（C8）
    - 既存の `pnpm test:run`、`pnpm typecheck`、`pnpm lint` で確認する（C2）
  - Forbidden:
    - 振る舞いを変える - テストの整理だけを行う（C2）
    - 振る舞いやロジックを持たない primitive、bool、順序、有無をテストする - プリンシプルに反する（C2）
    - 実装の値を写すだけの定数確認を残す - 振る舞いを確認しない（C5）
    - `rules/` を変更する - このサイクルの範囲外（C2）
    - 型を満たすためだけの引数を削除する - 型が壊れる（C7）

#### Details

- プリンシプルの外にある断言の削除
  ```text
  - .pi/extensions/context-precompact/ui/status.test.ts:33: `expect(footer).toBeDefined()` を削除する
  ```
- 残す断言
  ```text
  - 不在を確認する断言は、分岐の振る舞いを確認するため残す（F18）
  ```
- 単体と重複する配線のテストの統合
  ```text
  - .pi/extensions/context-precompact/index.test.ts:337-386: stale の 4 変種を 1 つ（session-changed）に減らす。残りは prepare/guard.test.ts:36,43,50,57 が確認する
  - .pi/extensions/context-precompact/index.test.ts:389 と 419: 一致と不一致の 2 経路を残す
  - index.test.ts:269/290、721/731、837/847、854/869、808/819: 別のイベントか別のスイッチのため残す
  - ui/status.test.ts:14/44、21/44: 別の関数のため残す
  - prepare/prepare.test.ts:76-87: 1 つの it の 2 ケースのため残す
  ```
- fixture と helper の置き場所
  ```text
  - .pi/extensions/context-precompact/test/session-entries.ts: sessionWithTurns(count = 3) を追加し、assistant と project を削除する
  - .pi/extensions/context-precompact/test/prepared.fixture.ts: 新設し、llmUsage、preparedCompaction、modelFake、registryFake を置く
  - .pi/extensions/context-precompact/index.test.ts: compactOk と okResult を 1 つにまとめ、nowSetup と preparedNow を 1 つの setup にまとめる
  - test/settings.fixture.ts: 新設し、settingsDirWith を置く。02 の scrub.fixture.ts もそれをインポートする
  - test/temp-dir.ts: 移動しない
  ```
- 文言の修正
  ```text
  - .pi/extensions/context-precompact/ui/count.test.ts:7: 「期待値は en-US の書式で組み立てる。実装は 3 桁ごとのカンマを固定で入れる。」に直す
  ```
- インポート元の更新
  ```text
  - .pi/extensions/context-precompact/test/session-entries.ts: assistant と project を削除し、sessionWithTurns をエクスポートする。llmUsage は test/prepared.fixture.ts からインポートする
  - .pi/extensions/context-precompact/test/prepared.fixture.ts: llmUsage、preparedCompaction、modelFake、registryFake をエクスポートする。型は実装からインポートする
  - test/settings.fixture.ts: settingsDirWith をエクスポートし、tempDir を test/temp-dir.ts からインポートする
  - prepare/copied.test.ts、prepare/prepare.test.ts、index.test.ts: sessionWithTurns を session-entries.ts からインポートする
  - apply/draft.test.ts、run/ports.test.ts、run/summarize.test.ts、index.test.ts: preparedCompaction を prepared.fixture.ts からインポートする
  - index.test.ts、run/ports.test.ts: modelFake と registryFake を prepared.fixture.ts からインポートする
  - settings/read.test.ts、index.test.ts: settingsDirWith を test/settings.fixture.ts からインポートする
  - .pi/extensions/thinking-scrub/scrub.fixture.ts: settingsDirWith を test/settings.fixture.ts からインポートする
  - test/temp-dir.ts: context-precompact のテストは直接インポートせず、test/settings.fixture.ts がインポートする
  ```
- 既存のファイルの移動
  ```text
  - .pi/extensions/context-precompact/test/session-entries.ts: assistant と project を削除し、sessionWithTurns を追加する
  - .pi/extensions/context-precompact/test/prepared.fixture.ts: 新設する
  - test/settings.fixture.ts: 新設する
  - .pi/extensions/context-precompact/index.test.ts: nowSetup と preparedNow を 1 つの setup にまとめる
  - テストファイルの名前と、残るテストのテスト名は変えない
  - 保存データ、インストール済みのバージョン、配布済みの文書は移動しない
  - test/temp-dir.ts: 移動しない
  - テストの件数は 95 件のまま
  ```
- 残す検査
  ```text
  - index.test.ts:337-386 の stale の事実: 残す 1 変種が配線の経路を確認し、prepare/guard.test.ts:36,43,50,57 が 4 分岐を確認する
  - ui/status.test.ts:33 の toBeDefined: 同じ it の not.toContain(reason) が振る舞いを確認する
  - test/session-entries.ts の assistant と project: テストではないため、失う検査はない
  - 残す検査: prepare/guard.test.ts の 4 分岐、prepare/compare.test.ts の一致と 5 項目の不一致、gate/gate.test.ts、prepare/copied.test.ts、prepare/prepare.test.ts、apply/draft.test.ts、run/ports.test.ts、run/summarize.test.ts、settings/schema.test.ts、settings/read.test.ts、ui/count.test.ts、ui/status.test.ts、command/precompact.test.ts、index.test.ts
  - 新しい失敗経路は足さない
  ```

### Definition

- `Unit.context-precompact`(kept): テストの整理は検査の変更であり、コンパクションを待たずにコンテキストを空ける主機能は変わらない。
