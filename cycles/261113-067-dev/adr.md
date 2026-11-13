# ADR 067

## 01: consult の `run` と `sub` のテストを、どの単位で確認する形にするか

Type: _Full_

### Context

- C1: `run` と `sub` のテストは10ファイルあり、ログ、配達、保存場所、プロセス、実行、サブエージェント、ワークツリー、予算、権限、仕様を確認している。
- C2: 製品の振る舞いと consult の実装は変えず、テストの削除と統合だけを行う。
- C3: 判断と変換は単体テストに残し、配線テストでは経路だけを確認する。同じ値の断言を単体と配線の両方には置かない。
- C4: fixture は Unit 内の `consult.fixture.ts` に置く。テストの前提を組み立てる helper も同ファイルに置く。
- C5: 同じ事実を複数のレイヤーで確認している状態を、レイヤーごとに1回の確認に変える。テスト数を減らすこと自体は目的ではなく、古い文言も直す。
- C6: 問いは「`run` と `sub` のテストを、どの単位で確認する形にするか」である。

### Research & Trial

- F1: `sub/budget.test.ts:41` と `:61` は、促しに対する同じ `toMatchObject` を2回確認している。`:84` は `turnIndex` の条件、`:102` は `CONSULT_TURNS` の読み取りを確認し、内容への `toMatchObject` は持たない。出所: 実測。
- F2: `run/run.test.ts:106`、`:128`、`sub/spec.test.ts:189`、`run/subagent.test.ts:125` は、`auto_retry_start` から `retry-start` への同じ変換を4回確認している。出所: 実測。
- F3: `sub/spec.test.ts:280` は `failureFrom` の判定、`run/run.test.ts:206` は `runWithFallback` が乗り換えないことを確認している。入力の前提は同じだが、確認対象の関数と結果は異なる。出所: 実測。
- F4: `index.test.ts:35`、`run/delivery.test.ts:12`、`run/log.test.ts:27`、`tool/subagents.test.ts:20` は、同じ `place()` をそれぞれ定義している。出所: 実測。
- F5: `index.test.ts:39`、`run/delivery.test.ts:16`、`run/log.test.ts:31`、`tool/subagents.test.ts:24` は、既定値の異なる `record()` をそれぞれ定義している。出所: 実測。
- F6: `run/run.test.ts:10` と `sub/spec.test.ts:127` は、どちらも `messageEnd` という名前だが、既定値は異なる。前者は content が空で usage が 1/1であり、後者は provider/model と cost を持つ。同じ helper にはまとめられない。出所: 実測。
- F7: `sub/budget.test.ts:65`、`:88`、`:109` は、同じ形の偽の `pi` をそれぞれ組み立てている。出所: 実測。
- F8: 固定の日時 `new Date(2026, 9, 10, 12, 0)` を、`run/delivery.test.ts` の7か所と `run/log.test.ts` の15か所で直書きしている。出所: 実測。
- F9: `run/log.test.ts:306` の表題は削除済みの `child` 欄を指している。実装の `run/log.ts` には `child` がなく、拒否される理由は `subagent` がないことである。出所: 実測。
- F10: 66ファイル、873件のテストは、現在すべて成功している。出所: `pnpm test:run` の実測。
- F11: `sub/budget.test.ts:66`、`:89`、`:110` の `_event` と、`run/worktree.test.ts:17` の `_cwd`、`_args` は、型を満たすためだけの引数であり、実装は読まない。出所: 実測。
- F12: `sub/budget.ts:15-20` の `lastTurn` は、`registerBudget` から `turnsFrom` の正の整数か undefined だけを受け取るため、`0`、`Number.NaN`、`2.5` は到達しない。出所: 実測。
- F13: `sub/budget.ts:23-28` の `turnsFrom` では、`'  '` は `''` と同じ trim の分岐に、`'-5'` は `'0'` と同じ `>0` の分岐に入る。出所: 実測。
- F14: `run/proc.ts:41,63` の pid ガードは1つの条件であり、`0` と `-5` は同じ側に入る。`readStartToken` の空白だけの出力は `''` と同じ trim の分岐に入る。出所: 実測。
- F15: `sub/spec.ts:31-33` の `needsIsolation` は `policy.isolated` をそのまま返し、`sub/spec.test.ts:109-113` は true だけを確認している。出所: 実測。
- F16: `sub/spec.test.ts:52-55` のパス形の確認は、直前のテストが絶対パスを確認しており、パスを `import.meta.url` から組み立てている。出所: 実測。
- F17: `parseLimits('  ')` は `parseLimits(undefined)` と同じ `open` を返す。`removeWorktree('consult/')` と `removeWorktree('')` は同じ `missing` を返す。出所: 実測。

### Scope

- In:
  - result: テストの出力が変わる。テスト名と断言が変わるため、エージェントが受け取る指摘も変わる。テストは2件減る。
  - logic: どのレイヤーで何を確認するかの規則が変わる。判断と変換は単体テストに残し、配線テストでは経路だけを確認する。
  - structure: 前提を組み立てる helper を `consult.fixture.ts` に寄せる。
  - expression: テスト名とコメントが変わり、`child` 欄の文言を直す。
  - cost: テストの行数は減るが、実行時間はほぼ変わらない。
  - failure: 残す失敗経路の確認は落とさない。
  - verification: テストの確認方法が変わり、重複した確認をレイヤーごとに1回にする。
- Out:
  - upstream: 依存は変えない（理由: 外部の追加も更新もない）。
  - downstream: 製品コードはテストを参照しない（理由: 呼び出し元がない）。
  - existing: 移すデータや配布済みの記録はない（理由: テストの整理だけである）。
  - safety: 秘密、権限、個人データは扱わない（理由: テストの整理だけである）。
  - observability: ログ、メトリクス、監査記録は変えない（理由: テストの整理だけである）。
  - release: 配布や適用の仕方は変えない（理由: 配布物がない）。
  - other: 他の関心は扱わない（理由: 対象がない）。

### Decision

- Status: **accepted**
- Main: `run` と `sub` のテストでは、各テストが固有に確認している事実だけを残し、同じ事実をレイヤーごとに1回確認する。
  - Add:
    - `consult.fixture.ts` に、`aPlace()` と `aDoneRun()`、固定日時の `aAt()` を置く（C4, F4, F5, F8）。
  - Update:
    - budget の促しの内容は `nudge` の単体テストで確認し、`registerBudget` では sent の状態だけを確認する（F1）。
    - `retry-start` の変換は `spec` の単体テストで確認し、配線テストでは経路だけを確認する。各テストが固有に確認している条件は残し、配線のテスト名も確認する内容に合わせる（F2, C5）。
    - `place()`、done の `record()`、固定日時の直書きは `aPlace()`、`aDoneRun()`、`aAt()` に置き換える。`budget.test.ts` の偽の `pi` はファイル内の helper にまとめる（F4, F5, F7, F8）。
    - `log.test.ts:306` の表題と前提は、`subagent` がない行の確認に直す（F9）。
  - Drop:
    - `registerBudget` にある促しの内容への `toMatchObject`（F1）。
    - 各ファイルにある `place()` と done の `record()` の重複定義、`budget.test.ts` の偽の `pi` の重複（F4, F5, F7）。
    - 固定日時の直書き（`aAt()` に置き換える、F8）。
    - `needsIsolation` とパス形の2テスト（F15, F16）。
    - budget の到達しない入力3つと、同じ分岐の言い換え2つ（F12, F13）。
    - proc の同じ分岐の言い換え3つ（F14）。
    - guard と worktree の同じ分岐の言い換え2つ（F17）。
- Sub: なし
- Policy:
  - Allowed:
    - テストの削除と統合、fixture への helper の移動、古い文言の修正（C2, C4, C5）。
    - すでにレイヤーが分かれている確認は、そのまま残す（F3）。
  - Forbidden:
    - 製品コードと consult の実装を変える - テストの整理だけを行うため（C2）。
    - 単体テストが確認している値を配線テストでも同じ値で確認する - 同じ事実を2回確認しないため（C3）。
    - 失敗経路の確認を落とす - 残す失敗経路を守るため（C2, C5）。
    - 到達しない入力、同じ分岐の言い換え、bool の写像だけの確認を足す - 壊れても気づけない確認を増やさないため（F12-F17）。

#### Details

なし

### Definition

- `Unit.subagent-consult`(kept): サブエージェントのコンサルを走らせ、そのワークツリーと結果を扱う働きは変わらない。テストの重複と前提を整理するだけで、実装は変えない。
- `Unit.test-run`(kept): 壊れた振る舞いの指摘を受け取る働きは変わらない。テストは2件減るが、残るテストは同じ事実をレイヤーごとに確認する。
- `Stack.Checks.Test runner`(kept): vitest のままで、テストの件数は減る。

## 02: consult の `tool`、`view`、`index`、`policy` のテストを、どの単位で確認する形にするか

Type: _Full_

### Context

- C1: `tool`、`view`、`index`、`policy` のテストは11ファイルあり、道具、表示、配線、`types.json` の読み込みを確認している。
- C2: 製品の振る舞いと consult の実装は変えず、テストの削除と統合だけを行う。
- C3: 判断と変換は単体テストに残し、配線テストでは経路だけを確認する。同じ値の断言を単体と配線の両方には置かない。
- C4: fixture は Unit 内の `consult.fixture.ts` に置き、エントリ01の結果を共有する。
- C5: 同じ事実を複数のレイヤーで確認している状態を、レイヤーごとに1回の確認に変える。テスト数を減らすこと自体は目的ではなく、古い文言も直す。
- C6: 問いは「`tool`、`view`、`index`、`policy` のテストを、どの単位で確認する形にするか」である。

### Research & Trial

- F1: `index.test.ts:344` と `view/notice.test.ts:210` は、`renderNotice` の登録を2回確認している。出所: 実測。
- F2: `index.test.ts:362`、`tool/consult.test.ts:714`、`tool/subagents.test.ts:190` は、`no subagents running in this session` の同じ文面を3回確認している。出所: 実測。
- F3: `index.test.ts:223` と `:262` は、`[rev:1]` の同じ表示を2経路で確認している。出所: 実測。
- F4: `tool/subagents.test.ts:134` と `index.test.ts:302` は、完了行が `done` になり `running` を含まないことを2回確認している。出所: 実測。
- F5: `index.test.ts:35` と `tool/subagents.test.ts:20` は、同じ `place()` を定義している。出所: 実測。
- F6: `index.test.ts:53` と `tool/consult.test.ts:96` は、`sendMessage` を記録する偽の `PiFace` をそれぞれ定義している。出所: 実測。
- F7: 固定の日時 `Wed Oct 21 12:41:12 2026` を、`tool/consult.test.ts` の2か所、`tool/subagents.test.ts` の1か所、`tool/worktree.test.ts` の3か所で直書きしている。出所: 実測。
- F8: `tool/subagents.test.ts` の10か所は、`['call', {...}, undefined, undefined, { cwd: tempDir() }]` の5要素タプルをそれぞれ組み立てている。出所: 実測。
- F9: `tool/worktree.test.ts` の14か所は、`call({ action: 'new', id: '2-b' }, dir)` の同じ前提をそれぞれ組み立てている。出所: 実測。
- F10: `tool/consult.test.ts:160`、`tool/worktree.test.ts:161`、`tool/subagents.test.ts:29` は、一時ディレクトリに記録を1行書く同じ趣旨の helper を定義している。出所: 実測。
- F11: `tool/commit.test.ts:5` のコメントにある `use` 検証は、現在の道具名にもコマンド名にも存在しない。出所: 実測。
- F12: `subagents.ts` の `execute` は、5要素タプルの第3、第4、第5要素を読まない。出所: 実測。
- F13: `worktree.ts` の `execute` は、`call` が渡す第1、第3、第4要素を読まない。出所: 実測。
- F14: `isLeftClick` は、`aClick()` の9項目のうち `type` と `button` だけを読む。出所: 実測。
- F15: 66ファイル、873件のテストは、現在すべて成功している。出所: `pnpm test:run` の実測。
- F16: `view/widget.test.ts:19` は `runningLine` の内容を確認し、`view/widget.ts:69-72` の `showRunning` は line を widget に渡す変換を持つ。`index.test.ts:262` は `showRunningOnce` 経由で同じ内容を確認している。出所: 実測。
- F17: `policy/types.test.ts` は `types.json` の読み込みとスキーマを確認しており、他のレイヤーと重複する確認はない。出所: 実測。

### Scope

- In:
  - result: テストの出力が変わる。テスト名と断言が変わるため、エージェントが受け取る指摘も変わる。テストは2件増える（`showRunning` の happy と empty）。
  - logic: どのレイヤーで何を確認するかの規則が変わる。判断と変換は単体テストに残し、配線テストでは経路だけを確認する。
  - structure: `place()`、done の `record()`、偽の `PiFace`、5要素タプル、worktree の `new` の前提を helper に寄せる。
  - expression: テスト名とコメントが変わり、`use` の文言を直す。
  - cost: テストの行数は減るが、実行時間はほぼ変わらない。
  - failure: 残す失敗経路の確認は落とさない。
  - verification: テストの確認方法が変わり、重複した確認をレイヤーごとに1回にする。
- Out:
  - upstream: 依存は変えない（理由: 外部の追加も更新もない）。
  - downstream: 製品コードはテストを参照しない（理由: 呼び出し元がない）。
  - existing: 移すデータや配布済みの記録はない（理由: テストの整理だけである）。
  - safety: 秘密、権限、個人データは扱わない（理由: テストの整理だけである）。
  - observability: ログ、メトリクス、監査記録は変えない（理由: テストの整理だけである）。
  - release: 配布や適用の仕方は変えない（理由: 配布物がない）。
  - other: 他の関心は扱わない（理由: 対象がない）。

### Decision

- Status: **accepted**
- Main: `tool`、`view`、`index`、`policy` のテストでは、各テストが固有に確認している事実だけを残し、同じ事実をレイヤーごとに1回確認する。
  - Add:
    - `consult.fixture.ts` に、偽の `PiFace` を作る `aPiFace()`、5要素タプルを組む `aToolCall()`、`Wed Oct 21 12:41:12 2026` の `START_TOKEN` を置く（F6, F7, F8）。
    - `view/widget.test.ts` に、`showRunning` の単体を足す（happy と empty の 2 ケース、F16）。
  - Update:
    - `renderNotice` の登録は `view/notice.test.ts:210` の単体テストで確認し、`index.test.ts:344` は登録が1回あることだけを確認する（F1）。
    - status の文面は `tool/subagents.test.ts:190` の `listText` で確認し、`tool/consult.test.ts:714` では info で通知すること、`index.test.ts:362` ではコマンドの登録と説明文を確認する（F2）。
    - ウィジェットの表示内容は `view/widget.test.ts` の `runningLine` と `showRunning` で確認し、`showRunningOnce` と `startTick` はキーだけを確認する（F3, F16）。
    - 断言を減らすテストの名前は、確認する内容に合わせる（F1-F4, F16）。
    - 完了行の表示は `rowsOf` のテストで確認し、index の reload では通知と音（`sent`、`played`）だけを確認する（F4）。
    - `place()`、done の `record()`、`aAt()` は01の helper を使い、`Wed Oct 21 12:41:12 2026` の直書きは `START_TOKEN` にし、偽の `PiFace` と5要素タプルを02の helper に置き換える。worktree の `new` と seed helper は、ツール実行と FS 書き込みを含むため、それぞれのファイルに残す（F5-F10）。
    - `tool/commit.test.ts:5` の `use` の文言を直す（F11）。
  - Drop:
    - `index.test.ts` の登録タプル、status の文面、ウィジェットの内容、完了行の文面の重複断言（F1-F4, F16）。
    - `place()` と done の `record()` の重複定義、`aAt()` と `START_TOKEN` の直書き、偽の `PiFace` と5要素タプルの重複（F5-F8）。
- Sub: なし
- Policy:
  - Allowed:
    - テストの削除と統合、fixture への helper の移動、古い文言の修正（C2, C4, C5）。
  - Forbidden:
    - 製品コードと consult の実装を変える - テストの整理だけを行うため（C2）。
    - 単体テストが確認している値を配線テストでも同じ値で確認する - 同じ事実を2回確認しないため（C3）。
    - 失敗経路の確認を落とす - 残す失敗経路を守るため（C2, C5）。
    - `policy` のテストを変える - 重複した確認がないため（F17）。

#### Details

なし

### Definition

- `Unit.subagent-consult`(kept): サブエージェントのコンサルを走らせ、そのワークツリーと結果を扱う働きは変わらない。テストの重複した断言と前提を整理するだけで、実装は変えない。
- `Unit.test-run`(kept): 壊れた振る舞いの指摘を受け取る働きは変わらない。テストは2件増えるが、残るテストは同じ事実をレイヤーごとに確認する。
- `Stack.Checks.Test runner`(kept): vitest のままで、テストの行数は減る。
