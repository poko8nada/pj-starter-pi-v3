# memo: ROADMAP 028「不要テストの整理」前調査と分割案

**このメモは 028 の完了後に削除する。**

- 日付: 2026-11-13
- 位置づけ: サイクル前の調査メモ。ADR ではない。サイクルは実行の段階なので、ここでは「何があるか」「どう分けるか」「判断の基準」を扱う。
- 状態: 調査は完了。分割と判断の基準は決定済み（2026-11-13）。実行状況は 6 章。各個別の削除可否は、各サイクルの ADR で確定する。
- 対象: ROADMAP 028（0.9.6、priority: mid）。

## 1. 前提

### 1.1 028 の狙い

- 不要なテストを整理する。基本は振る舞いを変えない。
- ROADMAP に書かれた観点は次の 6 つ。
  1. 既に存在しない振る舞いをテストしていないか
  2. 既に存在しないものが「ない」ことを確認しているテストがないか
  3. 同じ振る舞いを確認するテストが 2 つ以上ないか
  4. 同じ前提を共有すべきテストが、それぞれで前提を持っていないか
  5. 不要な引数が残ったままではないか
  6. `pi.fixture` はもう共通で使われていない。コメントも古い

### 1.2 判断の基準にする原則

- `AGENTS.md` の Test 1: 希少、影響が小さい、既に存在しないものはテストしない。
- `AGENTS.md` の Test 2: 振る舞いやロジックを持たない primitive、bool、順序、有無はテストしない。
- 028 は「削除すること」が目的ではない。残すテストの意図が読める状態にすることが目的である。

### 1.3 今回の範囲

- 調査と分割の協議まで。`cycles/<...>/adr.md` は作らない。
- 分割、順番、判断の基準はこのメモで決定した。
- 各個別の削除可否は、各サイクルの adr skill で改めて確定する。このメモの 4 章は候補一覧であり、承認済みの削除リストではない。

### 1.4 決定した基準（2026-11-13）

1. 単体と配線が同じ事実を確認する場合、判断・変換は単体に残し、配線は経路だけを確認する。同じ値の断言を両方に置かない。
2. 実装の値を写すだけの定数確認は削除する。`vitest.config.test.ts` の 1 本目は削除する。
3. fixture は、その Unit だけで使うものは Unit 内の `*.fixture.ts`、複数 Unit で使うものは `test/` に置く。テストの前提を組み立てる helper も fixture に置く。
4. 型を満たすためだけの引数は残す。実装が読まない引数は実装から削除する（thinking-scrub の 3 件）。
5. 削除ごとに、残す側のテストか「存在しない理由」を対応付ける。各サイクルで全件成功、typecheck、lint を確認する。

この 5 つは、各サイクルの ADR の Policy に、関係するものを書く。`rules/` は変更しない（028 の範囲外）。

## 2. 現状

### 2.1 テストの全体

- テストファイル: 66
- テスト: 873
- テストの行数: 14,124
- ベースライン: `pnpm test:run` は 66 ファイル、873 テストがすべて成功する（約 3 秒）。
- `.skip` / `.todo` / `.only` はない。`it.skipIf` が 1 件だけある（root 権限のときだけ飛ばす）。
- テストファイルに対応する実装がないものはない。削除済みの機能を指すテストファイルもない。

### 2.2 領域ごとの規模

| 領域                                           | ファイル | テスト行 | テスト数 | 実装行 | テスト/実装 |
| ---------------------------------------------- | -------: | -------: | -------: | -----: | ----------: |
| `.pi/extensions/consult`                       |       21 |    5,435 |      355 |  4,520 |        1.20 |
| `.pi/extensions/context-precompact`            |       14 |    1,898 |       95 |  1,934 |        0.98 |
| `.pi/extensions/thinking-scrub`                |        9 |    2,353 |      132 |  1,461 |        1.61 |
| `.pi/extensions/quality-gate`                  |        3 |      484 |       20 |    688 |        0.70 |
| `.pi/extensions/sound-notify`                  |        3 |      473 |       27 |    310 |        1.53 |
| `.pi/skills`（adr/plan/close のスクリプト）    |        3 |    1,211 |      110 |  1,504 |        0.81 |
| `scripts`（checks/harness-sync/product-ready） |       12 |    2,216 |      131 |  1,446 |        1.53 |
| `vitest.config.test.ts`                        |        1 |       54 |        2 |      - |           - |

- テスト数は `it(` と `test(` の行を数えた値。テスト行は `wc -l`。
- consult がテスト全体の約 41% を占める。

## 3. 調査の方法

- 次の 7 群に分割し、群ごとに 1 人の research サブエージェントに、テストと対応する実装を読ませた。
  1. consult `run` と `sub`
  2. consult `tool`、`view`、`index`、`policy`
  3. context-precompact
  4. thinking-scrub
  5. quality-gate、sound-notify、`vitest.config.test.ts`
  6. `.pi/skills` の adr、plan、close のスクリプト
  7. `scripts/checks`、`scripts/harness-sync`、`scripts/product-ready`
- 各報告は「事実のみ、修正案を書かない」という条件で集めた。修正案と分割はこのメモで扱う。
- 件数は報告に挙がった箇所の数であり、領域をまたいだ重複は除いていない。

## 4. 調査結果

### 4.1 全体の結論

- 「既に存在しない振る舞いをテストしている」ものは、実質 1 件だけだった（`consult/run/log.test.ts:306`）。
- 「既に存在しないものが、ないことを確認している」ものも、実質 1 件だけだった（`scripts/harness-sync/list/index.test.ts:24`）。
- 873 テストはすべて現在の実装と一致している。壊れたテスト、到達しない分岐を守るテストは見つかっていない。
- 大部分は「重複した確認」と「同じ前提の作り直し」である。
- したがって 028 の成果は、テスト数の大幅な削減ではなく、同じ事実を 1 か所で確認する形への統合と、古い文言・使われない補助の削除になる見込みである。
  - 削減の見込みは 20〜30 件程度。残りは統合によって行数が減るが、テスト数はあまり変わらない。

### 4.2 削除または文言修正の候補（事実が古い、または死んでいる）

| 場所                                                                          | 事実                                                                                                                               | 扱いの案                                                                               |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `.pi/extensions/consult/run/log.test.ts:306-307`                              | 表題は「旧形の行（`child` 欄だけを持つ JSON）は捨てる」。実装 `run/log.ts` に `child` はなく、実際の理由は `subagent` がないこと。 | 表題と前提を現在の理由に直す。または、`subagent` がない行の確認として 1 本に統合する。 |
| `.pi/extensions/consult/tool/commit.test.ts:5`                                | コメントの「最後のメインエージェントの `use` 検証」は、現在の道具名にもコマンド名にも存在しない。                                  | 文言を現在の名前（`consult_commit` など）に直す。                                      |
| `.pi/extensions/quality-gate/targets.test.ts:7`                               | 「porcelain の解析と差分だけを試す」とあるが、同じファイルは `fingerprint` と `filterByExtensions` も試す。                        | 文言を直す。                                                                           |
| `.pi/extensions/context-precompact/ui/count.test.ts:7`                        | 「区切りの仕様はプラットフォームの書式から取る」とあるが、実装は固定のカンマ正規表現、テストは `toLocaleString('en-US')`。         | 文言を直す。                                                                           |
| `.pi/extensions/context-precompact/test/session-entries.ts:20,23,132,144,147` | `assistant` はテストから直接呼ばれず、内部の `turns` だけが使う。`project` もテストから参照されない。                              | 直接の利用がないなら削除する。`turns` の中だけで組み立てる。                           |
| `.pi/extensions/thinking-scrub/scrub.fixture.ts:73,84`                        | `SCRUB_USAGE_MARK` と `FOLLOWUP_SAMPLE_HEADING` は定義だけで、参照がない。                                                         | 削除する。                                                                             |
| `.pi/extensions/thinking-scrub/scrub.fixture.ts:66`                           | 「製品の文言が変わればここだけ直す」とあるが、同じ文言の組み立てが `index.test.ts:170` にもある。                                  | 文言を 1 か所に寄せる。                                                                |
| `.pi/extensions/thinking-scrub/scrub/detect.test.ts:6`                        | 「fixture は関数の中で組み立てる」とあるが、`cycleText` を fixture から読んでいる。                                                | 文言を直す。                                                                           |
| `.pi/skills/adr/scripts/index.test.ts:581`                                    | 表題は「`close.md` を持つだけ」だが、前提は `adr.md` と `close.md` の両方を書いている。                                            | 表題を直す。                                                                           |
| `.pi/skills/plan/scripts/index.mjs:4`                                         | usage に `--root` がない。実装は `--root` を受け、テストも `--root` で呼ぶ。                                                       | 文言を直す。028 に含めるか 029 に回すかは判断が要る。                                  |
| `scripts/harness-sync/list/index.test.ts:24`                                  | 現在の `setting.json` にない `skip` と `legacy` を、返さないことの確認に使っている。                                               | 削除する。または、未知のキーを無視する一般的な確認に書き換える。                       |
| `test/pi.fixture.ts:3`                                                        | コメントは `context-prune` と `thinking-scrub` の共有と書くが、`context-prune` は削除済み。実際の利用は thinking-scrub だけ。      | thinking-scrub の `scrub.fixture.ts` に統合し、`test/pi.fixture.ts` を削除する。       |

### 4.3 同じ振る舞いを 2 つ以上で確認している候補

| 領域               | 確認している事実                                                                | 場所                                                                          | 判断の案                                                                 |
| ------------------ | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| consult            | 促しの本文（`continue`、`entries` 1 件、`consult-budget` の `custom_message`）  | `sub/budget.test.ts:41,61,84,102`                                             | 4 か所のうち、`nudge` の単体と、`registerBudget` の配線の 2 か所に絞る。 |
| consult            | `auto_retry_start` → `retry-start` の変換                                       | `run/run.test.ts:106,128`、`sub/spec.test.ts:189`、`run/subagent.test.ts:125` | 変換の本体（`spec`）と、配線（`run` または `subagent`）の 2 か所に絞る。 |
| consult            | 前の `error` と最後の `stop` で失敗しないこと                                   | `sub/spec.test.ts:280`、`run/run.test.ts:206`                                 | 変換の単体だけ残す。                                                     |
| consult            | `renderNotice` の登録                                                           | `index.test.ts:344`、`view/notice.test.ts:210`                                | 登録の配線は index、描画は notice。両方が必要か確認する。                |
| consult            | `no subagents running in this session` の文面                                   | `index.test.ts:362`、`tool/consult.test.ts:714`、`tool/subagents.test.ts:190` | 文面の生成を 1 か所に寄せ、配線は別の事実として残す。                    |
| consult            | ウィジェットの `[rev:1]`                                                        | `index.test.ts:223,262`                                                       | 同じファイル内の 2 経路。片方に絞る。                                    |
| consult            | 完了行が `done` になり `running` を含まないこと                                 | `tool/subagents.test.ts:134`、`index.test.ts:302`                             | `rowsOf` の単体を残し、index は配線だけにする。                          |
| context-precompact | `stale` の 4 分岐（session、leaf、firstKept、compaction）                       | `index.test.ts:349-360`、`gate/guard.test.ts:36,43,50,57`                     | 分岐の単体を `guard` に残し、index は 1 経路に絞る。                     |
| context-precompact | 照合の不一致（`firstKeptEntryId`）と一致                                        | `index.test.ts:389-434`、`prepare/compare.test.ts:37-46`                      | 単体を `compare` に残し、index は「捨てる」「使う」の 2 経路に絞る。     |
| thinking-scrub     | 既定の thinking を `degenerateExpected()` にすること                            | `scrub/message.test.ts:26`、`index.test.ts:274`                               | 単体を `message` に残す。                                                |
| thinking-scrub     | 66 文字では `char.minLength: 100` で差し替えないこと                            | `scrub/message.test.ts:56`、`index.test.ts:293`                               | 単体を `message` に残す。                                                |
| thinking-scrub     | `minRepeats - 1` / `minRepeats`、`minPeriod - 1`、`maxPeriod` / `maxPeriod + 1` | `scrub/detect.test.ts:52,63,72` と `139,152,161`                              | `detectRuns` の単体に寄せ、`scrubThinking` 側の同型は削る。              |
| thinking-scrub     | `message_end` 2 回後の `agent_end` の通知                                       | `index.test.ts:702,762`                                                       | 同じ配線の 2 経路。片方に絞る。                                          |
| skills             | close の番号行の下の文脈を保つこと                                              | `close/scripts/collect.test.ts:66,118`                                        | 1 本に統合する。                                                         |
| skills             | Simple の `_omission_` の 2 行                                                  | `adr/scripts/index.test.ts:443-444,487-488`、CLI `672-673,692-693`            | 単体と CLI の 2 つのレイヤーに絞る。                                     |
| skills             | `appendEntry` 後の `lastEntryNumber`                                            | `adr/scripts/index.test.ts:450-451,538-546`                                   | 1 本に統合する。                                                         |
| skills             | `Work Review Round 1` の写像                                                    | `close/scripts/collect.test.ts:84,97,156`                                     | 写像の単体を 1 か所に残す。                                              |

- ここは「レイヤーが違うから残す」ものが混ざる。単体と配線のどちらを残すかは、4.2 ではなく 1.4 の判断事項として扱う。

### 4.4 同じ前提を共有すべき候補

| 領域               | 繰り返している前提                                    | 代表的な場所                                                                                                           | まとめ先の案                                           |
| ------------------ | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| consult            | `place()`（`placeFor(tempDir(), tempDir())`）         | `index.test.ts:35`、`run/delivery.test.ts:12`、`run/log.test.ts:27`、`tool/subagents.test.ts:20`                       | `consult.fixture.ts` に 1 つ置く。                     |
| consult            | 終わった記録の `record()`                             | `index.test.ts:39`、`run/delivery.test.ts:16`、`run/log.test.ts:31`、`tool/subagents.test.ts:24`                       | 既定値が違うので、`aRunRecord` の上に 2 種類だけ置く。 |
| consult            | `message_end` の組み立て                              | `run/run.test.ts:10`、`sub/spec.test.ts:127`                                                                           | 共有の fixture に置く。                                |
| consult            | `registerBudget` 用の偽 `pi`                          | `sub/budget.test.ts:65,88,109`                                                                                         | 1 つの helper にする。                                 |
| consult            | 固定の日時 `Wed Oct 21 12:41:12 2026`                 | `tool/consult.test.ts:497,533`、`tool/subagents.test.ts:251`、`tool/worktree.test.ts:313,327,341`                      | 定数 1 つにする。                                      |
| consult            | 道具の 5 要素タプル（`undefined, undefined` を含む）  | `tool/subagents.test.ts:225,243,254,269,291,310,329,345,360,377`                                                       | helper で包む。                                        |
| consult            | `worktree` の `new` の前提                            | `tool/worktree.test.ts:190,208,214,226,236,245,257,268,278,288,298,312,326,338`                                        | helper にする。                                        |
| consult            | 一時ディレクトリに 1 行を書く前提                     | `tool/consult.test.ts:160`、`tool/worktree.test.ts:161`、`tool/subagents.test.ts:29`                                   | 1 つの helper に寄せる。                               |
| consult            | 固定の日時と `place()`                                | `run/delivery.test.ts:44,59,68,78,89,103,114`、`run/log.test.ts:37,46,58,68,80,95,113,127,133,211,231,245,263,312,324` | 日時を定数にし、`place()` を fixture にする。          |
| consult            | `worktree` を汚す手順                                 | `run/worktree.test.ts:342,384,394,407,419,444,479,508`                                                                 | helper にする。                                        |
| context-precompact | 同形の `PreparedCompaction`                           | `apply/draft.test.ts:26-37`、`run/ports.test.ts:18-29`、`run/summarize.test.ts:10-21`                                  | `test/` の fixture に 1 つ置く。                       |
| context-precompact | モデルとレジストリの偽物                              | `index.test.ts:72-84`、`run/ports.test.ts:41-51`                                                                       | 1 つに寄せる。                                         |
| context-precompact | `llmUsage`                                            | `index.test.ts:43-52`、`test/session-entries.ts:32-41`、`apply/draft.test.ts:15-24`                                    | `test/` の 1 か所にする。                              |
| context-precompact | compact 結果の組み立て                                | `index.test.ts:86-94,692-700`                                                                                          | 1 つに寄せる。                                         |
| context-precompact | `createSessionFixture()` と `turns(3)`                | `index.test.ts` の 16 か所、`prepare/copied.test.ts` の 6 か所、`prepare/prepare.test.ts` の 6 か所                    | `turns(3)` を既定にした helper にする。                |
| context-precompact | `nowSetup()` と `preparedNow()`                       | `index.test.ts:722,732,779,789,796,809,820,838,847,854,869`                                                            | 1 つの setup にする。                                  |
| context-precompact | 一時ディレクトリと `settings.json`                    | `settings/read.test.ts:14,25`、`index.test.ts:58-62`                                                                   | `settingsDirWith` に寄せる。                           |
| thinking-scrub     | `createScrubWiring` の同じ引数                        | `index.test.ts:196,215,262,275,536,703`                                                                                | helper にする。                                        |
| thinking-scrub     | 一時ディレクトリと `settings.json`                    | `index.test.ts` の 10 か所、`settings/read.test.ts:13,24,30`                                                           | helper にする。                                        |
| thinking-scrub     | `observe(emptyGuard(), ..., () => true)`              | `live/guard.test.ts:41,56,66,85,92,104`                                                                                | 1 つの helper にする。                                 |
| thinking-scrub     | `defaultSettings()` を各 `it` の先頭で呼ぶ            | `scrub/detect.test.ts:26,39,46,53,105,116`、`scrub/units.test.ts:113,141,151,182,191,203`                              | ファイルの先頭で 1 回にする。                          |
| quality-gate       | `tempDir()`、`tsFile()`、`fakePi()`                   | `checks.test.ts:88,120,140,153,178,194,210,228,249`                                                                    | 1 つの setup にする。                                  |
| sound-notify       | `played` と `setPlayer`                               | `index.test.ts:125,160,185,236,271,294,347`                                                                            | `beforeEach` に寄せる。                                |
| sound-notify       | `recordingPi` の記録                                  | `index.test.ts:74-86,104-116`                                                                                          | 1 つに寄せる。                                         |
| skills             | `setupCycle()` と同形の一時ツリー                     | `close/scripts/collect.test.ts:16,85,101,119`                                                                          | `setupCycle()` を全件で使う。                          |
| skills             | `cycles/` と `adr.md` の一時ツリー                    | `adr/scripts/index.test.ts:560,574,581,591,628,647,660,677,697,722,738,756,780`                                        | 1 つの helper にする。                                 |
| scripts            | `fakeRoot`、`writeFile`、`validConfig` の組           | `checks/ja-check.test.ts:45,49,56,60` と 34 か所の利用                                                                 | 1 つの setup にする。                                  |
| scripts            | `fakeRoot`、`stubTsc`、`writeTsconfig`、`writeScopes` | `checks/typecheck.test.ts:35,42,59,65` と 6 か所                                                                       | 同上。                                                 |
| scripts            | `fakeRoot`、`stubTsc`、`writeFile`、`writeScopes`     | `checks/typecheck-staged.test.ts:33,40,55,62` と 5 か所                                                                | 同上。                                                 |
| scripts            | `tempDir()` と `writeFile`                            | `harness-sync/collect:14,21,30,38,47,57,66`、`diff:14,25,34`、`list:14,19,28,41,47,53,60`、`path:19,32,37,44,49,55`    | `test/scripts.fixture.ts` に寄せる。                   |
| scripts            | `makeTree()` と `run()`                               | `product-ready/index.test.ts` の 27 か所                                                                               | 1 つの helper にする。                                 |

### 4.5 不要な引数

| 場所                                                                                                             | 事実                                                                                            | 扱いの案                                                       |
| ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `.pi/extensions/thinking-scrub/command/scrub.ts:50,55`、`index.ts:279`                                           | `runCommand` の第 3 引数 `at` は `void at;` で捨てられる。テスト 11 か所は `100` を渡している。 | 引数を実装から削除し、呼び出し側も直す。振る舞いは変わらない。 |
| `.pi/extensions/thinking-scrub/live/guard.ts:27-28`、`live/guard.test.ts:144`                                    | `resetOnUser(guard)` は引数を読まず、常に `emptyGuard()` を返す。                               | 引数を削除する。                                               |
| `.pi/extensions/thinking-scrub/scrub.fixture.ts:35`                                                              | `cycleText(pattern, cycles, sep = ' ')` の `sep` は、すべての呼び出しで省略される。             | 引数を削除する。                                               |
| `.pi/extensions/consult/tool/subagents.test.ts:226` ほか、`tool/worktree.test.ts:147`、`tool/consult.test.ts:86` | 道具の `execute` に `undefined, undefined` を渡す。実装は `signal` と `onUpdate` を読まない。   | 引数は道具の型を満たすために必要。削除せず、helper で包む。    |
| `.pi/extensions/consult/view/notice.test.ts:56`                                                                  | `aClick()` は 9 つの項目を持つが、実装は `type` と `button` だけを読む。                        | 型を満たすための項目。削除しない。                             |
| `.pi/extensions/sound-notify/index.test.ts:127` ほか 7 か所                                                      | 差し替えた player の `_pi` は未使用。                                                           | 型を満たすため。削除しない。                                   |
| `.pi/extensions/sound-notify/index.ts:154,164`                                                                   | `async (_event, ctx)` の `_event` は未使用。                                                    | 道具の型を満たすため。削除しない。                             |
| `.pi/extensions/consult/run/worktree.test.ts:17`、`sub/budget.test.ts:66,89,110`                                 | `_cwd`、`_args`、`_event` は未使用。                                                            | `_` 付きで意図が読める。削除しない。                           |

- `oxlint` の `no-unused-vars` は `_` 付きを許す。lint は通っているので、残っている未使用引数は意図的なものか、型を満たすためのものだけである。

### 4.6 補足

- `vitest.config.test.ts` の 1 本目は、`configDefaults.exclude` の後ろに目印の間の一覧が並ぶことと、`reporters` の値を確認する。値の確認だけであり、振る舞いを持たない。2 本目は `TEST_VERBOSE` による切り替えを確認しており、こちらは振る舞いを持つ。
- 067-f で 1 本目を削除した。ただし `passWithNoTests` を守るガードが `2bd8dba` で追加された。product-ready のテストは生成する設定だけを見ており、リポジトリの `vitest.config.ts` の値を守らないため。
- `test/temp-dir.ts` の説明は現在の実装と一致している。変更の必要はない。
- `test/scripts.fixture.ts` は checks、harness-sync、product-ready の 5 ファイルが使っている。表示の印を 1 か所に集める意図は生きている。

## 5. 分割案

### 5.1 分割の軸

1. 関心を Unit または領域に揃える。同じファイルと同じ fixture を触る作業を同じサイクルに入れる。
2. 判断の基準は 1.4 で決定済みである。サイクルは基準を決める場ではない。
3. 大きい領域から始める。最大の consult を先頭に置く。小さい領域を先に回す理由はない。
4. 1 サイクルに複数の plan を置いてよい。ただし、サイクルをまたいで同じ fixture を何度も作り直さない。

### 5.2 推奨案: 5 サイクル

|  順 | 作業名（仮）         | 状態          | 対象                                                | ファイル | テスト | テスト行 | 主な内容                                                                                                     |
| --: | -------------------- | ------------- | --------------------------------------------------- | -------: | -----: | -------: | ------------------------------------------------------------------------------------------------------------ |
|   1 | consult              | done（067-d） | run、sub、tool、view、index、policy                 |       21 |    355 |    5,435 | `place()`、`record()`、`fakePi()` の共有、単体と配線の重複の整理、固定日時の定数化                           |
|   2 | 文脈系 2 Unit        | pending       | thinking-scrub、context-precompact                  |       23 |    227 |    4,251 | 実装の死んだ引数の削除、単体と配線の重複の整理、fixture の統合、`pi.fixture` の統合                          |
|   3 | リポジトリスクリプト | pending       | checks、harness-sync、product-ready                 |       12 |    131 |    2,216 | 一時ツリーと実行の helper 化、消えた key の確認の削除                                                        |
|   4 | スキルスクリプト     | pending       | adr、plan、close                                    |        3 |    110 |    1,211 | 一時ツリーの helper 化、同型の確認の統合、usage の修正（029 には回さない）                                   |
|   5 | 小さな Unit          | done（067-f） | quality-gate、sound-notify、`vitest.config.test.ts` |        7 |     49 |    1,011 | 前提の統合、文言修正、定数確認テストの削除（067-f では `gate/` への移動と `passWithNoTests` のガードを含む） |

- 順番の理由: 変更の大きい順に並べた。小さい領域を先に回す理由がないため。
  - 1 の consult は最も大きい（テスト全体の約 41%）。重複と前提の繰り返しも最も多い。
  - 2 は thinking-scrub が実装の引数削除を含む。`test/pi.fixture.ts` の統合もここで行う。
  - 3、4、5 はコードの Unit に依存しない。
- サイクル 2 は 2 つの Unit を 1 サイクルに入れる。plan は Unit ごとに分ける。サイクル 1 は 1 つの Unit を 2 つの plan（run/sub と tool/view/index/policy）に分ける。
- 実際の番号は 6 章。日付と `-d` / `-f` は adr の時に決める。

## 6. 実施状況

|  順 | サイクル                                | 状態    | 結果                                                                                                                                                                                              |
| --: | --------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   1 | `261113-067-dev`（067-d）               | done    | `consult-run-sub` と `consult-tool-view` の 2 plan。close `2398da9`。close 時のテストは 869 件。                                                                                                  |
|   2 | 未着手                                  | pending | 次の候補。文脈系 2 Unit。                                                                                                                                                                         |
|   3 | 未着手                                  | pending | リポジトリスクリプト。                                                                                                                                                                            |
|   4 | 未着手                                  | pending | スキルスクリプト。                                                                                                                                                                                |
|   5 | `261113-067-feat-test-cleanup`（067-f） | done    | ADR 4 エントリ、`quality-gate-sound` と `vitest-config` の 2 plan。plan の `Ran` は 871 件と 872 件。close `7058fd6`、merge `3352935`。`_ex-change_` は `2bd8dba`（`passWithNoTests` のガード）。 |

- 現在の base は 66 ファイル・867 件成功、typecheck ok。
- `ROADMAP.md` の 028 は `cycles: 067-d,067-f`、`status: wip`。
- 5 番目は計画の順番より先に、feat ブランチで実施された。残りは 2 → 3 → 4 の順。次の 068 は 2（文脈系 2 Unit）。
