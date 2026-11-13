# PLAN `consult-status`

- No: 03
- Place: worktree
- Boundary Plans: fallback-notify（先）

## Goal

`/consult-status` が、このセッションで動いているサブエージェントの一覧を出す。

## Design

- Inside:
  - Modules: 新しいモジュールは作りません。一覧の絞り込み（`ListWhere` と `where`）は、一覧を組み立てる `tool/subagents.ts` の `rowsOf`/`listText` に足します。`rowOf` と `rowsOf` が同じファイルにあり、絞り込みと整形を 1 か所に保つためです。コマンドの実装は `tool/consult.ts` の `ConsultRuntime.commands`（`cancel`、`sound` の隣）に足し、登録は `index.ts` の `registerCommands` に足します。既存の 2 つのコマンドと同じ置き方です。`tool/consult.ts` は `fallback-notify` も触りますが、あちらは `ConsultContext` と `consult()`、こちらは `commands` で、変える部分は重なりません。スライスは 1、2、3 の順に進めます。スライス 2 はスライス 1 の `where` を使い、スライス 3 は 1 と 2 の振る舞いを説明します。
  - Dirs: なし。
- Outside:
  - Extract: なし。一覧の整形は `listText` がすでに持ち、`/consult-status` はそれを呼びます。
  - Colocate: なし。

## Files

```text
.pi/extensions/consult/
  index.ts                        update
  index.test.ts                   update
  run/
    log.ts
    log.test.ts
  tool/
    consult.ts                    update
    consult.test.ts               update
    subagents.ts                  update
    subagents.test.ts             update
  README.md                       update
```

## Slices

## 1.一覧の絞り込み

`rowsOf` と `listText` に、動いているものだけを出す `where` を足します。

### Types

```ts
export type ListWhere = 'all' | 'running';

export function rowsOf(
  records: readonly RunRecord[],
  check: CheckRecord | undefined,
  now: number,
  where: ListWhere = 'all',
): readonly string[];

export function listText(
  records: readonly RunRecord[],
  now: number,
  check?: CheckRecord,
  where: ListWhere = 'all',
): string;
```

### Steps

1. `.pi/extensions/consult/tool/subagents.ts`
   1. add: `ListWhere` を足す。
   2. update: `rowsOf` に `where` を足す。`latest` で 1 体 1 行にまとめた後に、`running` なら `isRunning` か `isWaiting` の記録だけを残す。既定は `all`。`latest` の前に絞ると、同じ subagent の終わりの行が `running` 側に残るため。
   3. update: `listText` に `where` を足す。空の文面は、`running` なら `no subagents running in this session`、`all` なら `no subagents in this session yet` にする。

2. `.pi/extensions/consult/tool/subagents.test.ts`
   1. update: 空の文面の期待を `no subagents in this session yet` に変える。
   2. add: `where` のテストを足す。ケースは次のとおり。

      - `list`: (happy) `running` で、走っている記録（`consult-1`）と `notice` のない終わった記録（`consult-2`） → `consult-1` の行だけ
      - `list`: (happy) `all` で、同じ記録 → 2 行
      - `list`: (empty) `running` で、走っている記録がない → `no subagents running in this session`
      - `list`: (empty) `all` で、記録がない → `no subagents in this session yet`
      - `list`: (boundary) `running` で、`ended` と `notice` があり `delivered` がない記録 → `running` として出る

      記録は subagent の id を分けて作る（同じ id は `latest` で 1 行に潰れるため）。終わった記録には `notice` を付けない（`isWaiting` を偽にするため）。

### Policy

- Allowed:
  - なし
- Forbidden:
  - セッションの絞りを外さない - 前のセッションの一覧を出さない。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/consult/tool/subagents.ts .pi/extensions/consult/tool/subagents.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added: なし

## 2.コマンドの登録と通知

`/consult-status` を登録し、動いているサブエージェントの一覧を `info` で通知します。

### Types

```ts
export interface ConsultRuntime {
  // ...
  readonly commands: {
    status(args: string, ctx: CommandContext): Promise<void>;
    cancel(args: string, ctx: CommandContext): Promise<void>;
    sound(args: string, ctx: CommandContext): Promise<void>;
  };
}
```

### Steps

1. `.pi/extensions/consult/tool/consult.ts`
   1. update: `ConsultRuntime` の `commands` の型に `status(args, ctx)` を足す。
   2. update: `./subagents.ts` からの import に `listText` を足す。
   3. add: `ConsultRuntime.commands` に `status` を足す。`readRuns(state.place, { session: state.sessionNow() })` と `listText(records, Date.now(), state.check, 'running')` で本文を作り、`ctx.ui.notify(text, 'info')` を呼ぶ。

      ```ts
      status: async (_args, ctx) => {
        const records = readRuns(state.place, { session: state.sessionNow() });
        const text = listText(records, Date.now(), state.check, 'running');
        ctx.ui.notify(text, 'info');
      },
      ```

   4. update: 冒頭コメントの「一覧と停止は、道具の `action` とスラッシュコマンドの両方から同じ `control` を呼ぶ」を、一覧については記録を読む形に直す。

2. `.pi/extensions/consult/index.ts`
   1. add: `registerCommands` に `consult-status` を登録する。説明は `List the running consult subagents of this session`。

      ```ts
      pi.registerCommand('consult-status', {
        description: 'List the running consult subagents of this session',
        handler: (args, ctx) => consult.commands.status(args, ctx),
      });
      ```

   2. update: `registerCommands` の説明に一覧を足す。
   3. update: 冒頭コメントの「道具の `action` とコマンドは同じ `control` を呼ぶ」を、一覧については記録を読む形に直す。

3. `.pi/extensions/consult/tool/consult.test.ts`
   1. update: 既存の `seedRunning` を使い、`setup` が返す `place` に走っている記録を置く。記録は subagent ごとに別の id にし、`latest` で 1 行に潰れないようにする。記録の `session` はテストの `SESSION` にする（`aRunRecord` の既定は `session-a` のため）。終わった記録は、`seedRunning` が書く開始行に `ended` と `state` を足して作り、`notice` と `delivered` は付けない（`isWaiting` を偽にするため）。
   2. add: `commands.status` のテストを足す。ケースは次のとおり。

      - `status`: (happy) 走っている記録が 2 件 → 1 回の通知に 2 行、`info` で出す
      - `status`: (empty) 走っている記録がない → `no subagents running in this session` を `info` で出す
      - `status`: (empty) 終わった記録だけ → `no subagents running in this session` を出す
      - `status`: (happy) 別セッションの走っている記録 → 出さない
      - `status`: (happy) `task` を持つ記録 → 行に task を出さない

4. `.pi/extensions/consult/index.test.ts`
   1. update: 偽の `registerCommand` が、登録された名前と handler を記録するようにする。
   2. add: 登録のテストを足す。ケースは次のとおり。

      - `command`: (happy) 拡張を読み込む → `consult-status` の名前と handler が登録され、handler を呼ぶと `commands.status` が通知する

### Policy

- Allowed:
  - `controlSubagent` の list ではなく、記録を読む `readRuns` を使う。
  - `listText` の整形をそのまま使う。
  - コマンドの `notify` は try/catch で囲まない（失敗したら画面に出てよい）。
- Forbidden:
  - `warning` と `error` を使わない - 一覧は情報である。
  - 乗り換えの判定と通知を変えない - 01 と 02 の決定である。
  - セッションの絞りを外さない - 前のセッションの一覧を出さない。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/consult/tool/consult.ts .pi/extensions/consult/index.ts .pi/extensions/consult/tool/consult.test.ts .pi/extensions/consult/index.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added: なし

## 3.ドキュメント

`/consult-status` を README のコマンドの表に戻し、id の説明を直します。

### Types

なし

### Steps

1. `.pi/extensions/consult/README.md`
   1. update: `Background and stopping` の表の user の行を「`/consult-status` lists the running ones; `/consult-cancel <id>` stops one」にし、agent の行に `action: "list"` も含める。前置きの「two faces for stopping」を、一覧と停止の 2 つを指す形に直し、「one implementation behind them」を、一覧は同じ記録と整形、停止は同じ `control` を使う形に直す。
   2. update: 「`id` is what `consult_subagents` and the commands take」を、`id` を取るのは `consult_subagents` と `/consult-cancel` だけであることが分かる形に直す（`/consult-status` と `/consult-sound` は取らない）。

### Policy

- Allowed:
  - なし
- Forbidden:
  - なし

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added: なし

## Notes

### Slice 1: 一覧の絞り込み

- Findings: なし
- Unplanned: なし
- Commit: 830a74e
- Stopped:

### Slice 2: コマンドの登録と通知

- Findings: なし
- Unplanned:
  - `.pi/extensions/consult/tool/consult.test.ts` の `seedRunning` の引数を `Partial<RunRecord>` に広げた。終わった記録を開始行に `ended` と `state` を足して作るために要る。
  - 同テストの「task を持つ記録」は、`RunRecord` に `task` の欄がないため、記録の JSONL に `task` を紛れ込ませて一覧に出ないことを見る形にした。`rowOf` と `readRuns` は `task` を読まない。
- Commit: 2197bd5
- Stopped:

### Slice 3: ドキュメント

- Findings: なし
- Unplanned: なし
- Commit: 7df4fa9
- Stopped:

### Cleanup: 一覧の絞り込みのテスト

- Findings: なし
- Unplanned:
  - `tool/subagents.test.ts` の「all で記録がない」を落とした。「記録がなければそう言う」が同じ既定（`all`）の空文面をすでに見ている。
  - 同ファイルの「記録が空 → 空の一覧」を落とした。`listText` の空文面のテストが同じ空の記録で `rowsOf` の空をすでに通る。
  - 同ファイルの `runningAndDone` を切り出し、「running」と「all」の 2 つのテストで共有した。同じ記録で `where` だけを変える前提を各テストが持っていた。
  - `tool/consult.test.ts` の「task を持つ記録 → 行に task を出さない」を落とした。`RunRecord` に `task` の欄がないことを型が決めており、記録の JSONL に紛れ込ませる前提は型がすでに否定している。

## Work Review

### Round 1

- Stale:
  - `.pi/extensions/consult/index.test.ts:336` — コメント「このテストが確かめるのは配線だけ」が、`fakeEntry` に切り出して 2 つのテスト（342、347）が共有する形になった後も 1 つのテストを指したまま。理由: 読む者が「このテスト」の範囲を取り違え、偽物の前提（4 つの入口だけを持つ）がどれに掛かるかを誤解する。
    - fixed: コメントを「入口の配線だけを見るので、使う 4 つの入口だけを持つ偽物を渡す」に直し、共有する `fakeEntry` 全体を指す形にした。
  - `.pi/extensions/consult/README.md:56` — 「`/consult-status` and `/consult-sound` take none」は引数を取らないとも読めるが、`/consult-sound` は `on|off` を取る（`.pi/extensions/consult/index.ts:210`）。プランの「id を取らない」が英語で落ちている。理由: `/consult-sound on` を読んだ人が「引数は無効」と誤解する。`take no id` に直すべき。
    - fixed: `take none` を `take no id` に直した。
- Unlisted:
  - なし
- Gaps:
  - `.pi/extensions/consult/tool/subagents.test.ts:160` — `running` のケースが別 id の 2 体（`runningAndDone`）だけで、同じ subagent に開始行と終わりの行が並ぶ組を見ていない。プラン slice 1 step 1.2 の「`latest` の後に絞る（先に絞ると同じ subagent の終わりの行が `running` 側に残る）」前提を逆にしても全テストが緑のまま。理由: 実際の終了は開始行＋終わりの行の 2 行で残るので、順序を逆にすると `/consult-status` に終わった subagent が running として出るのに、どのチェックも落ちない。`consult.test.ts:712` も終わりの欄を開始行に足した 1 本だけで、2 行の組を確かめていない。「`running` で、同じ id に開始行と終わりの行 → 出さない」1 ケースを足すべき。
    - fixed: `listText` の `running` に「同じ subagent に開始行と終わりの行 → 出さない」ケースを足した。`latest` の前に絞ると開始行が残って running と出るため、このテストは順序を固定する。
- Policy:
  - なし
- Unproven:
  - なし
- Noise:
  - `.pi/extensions/consult/tool/consult.test.ts:718` — 直前の 717 の `toBe('no subagents running in this session')` が文面全体を決めており、`not.toContain('consult-1')` は同じことを二度言っている。理由: 二重の主張は失敗の意味を増やさず、テストの意図を読みにくくする。
    - fixed: 重複する `not.toContain('consult-1')` を落とした。
  - `.pi/extensions/consult/tool/consult.test.ts:731` — 同様に 730 の `toBe` の後の `not.toContain('consult-9')` が重複している。理由: 同上。
    - fixed: 重複する `not.toContain('consult-9')` を落とした。
- Doubts:
  - `.pi/extensions/consult/index.test.ts:350` はコマンドの説明文を literal で固定している。ADR が決めた値なので指摘にしないが、文言を変える予定があるなら、テストを落とすか説明文を 1 か所から取る形にするかをオーナーに決めてほしい。

### Round 2

- Stale:
  - なし — `.pi/extensions/consult/index.test.ts:336`（1 件目の `fixed:`）: コメントは「入口の配線だけを見るので、使う 4 つの入口だけを持つ偽物を渡す」に変わり、「このテスト」が消えた。この行は `fakeEntry`（320-340）の中にあり、342 と 347 が共有する関数全体を指す。偽物の入口は `on`、`registerTool`、`registerCommand`、`registerMessageRenderer` の 4 つで、数も合う。理由: 読む者が指す範囲を取り違える余地が消えた。
  - なし — `.pi/extensions/consult/README.md:56`（2 件目の `fixed:`）: `take none` は `take no id` になった。`/consult-sound` は `on|off` を取り（`.pi/extensions/consult/tool/consult.ts:569-571`、`.pi/extensions/consult/index.ts:210`）、`/consult-status` は id を読まない。理由: 「引数を取らない」ではなく「id を取らない」というプランの意図どおりになった。
- Unlisted:
  - なし
- Gaps:
  - なし — `.pi/extensions/consult/tool/subagents.test.ts:195-202`（3 件目の `fixed:`）: 同じ `consult-1` に開始行（`ended` なし、`pid: 4242`）と終わりの行（`ended: 2000`、`notice` なし）を並べ、`running` で `no subagents running in this session` を期待する。`rowsOf` は `latest` の後に `alive || waiting` で絞る（`.pi/extensions/consult/tool/subagents.ts:176-183`）ため、`latest` は終わりの行を選び、`isRunning` は `ended !== undefined` で偽、`isWaiting` は `notice` なしで偽になり、行が残らない。逆に `latest` の前に絞ると開始行だけが残り `consult-1` の行が出るので、このテストは赤になる。理由: プラン slice 1 step 1.2 の「`latest` の後に絞る」前提が、初めてテストで固定された。
- Policy:
  - なし
- Unproven:
  - なし
- Noise:
  - なし — `.pi/extensions/consult/tool/consult.test.ts:718`、`731` の重複した `not.toContain`（4・5 件目の `fixed:`）は、いずれも直前の `toBe('no subagents running in this session')` の後にあって削除され、いまは 717 と 729 の `toBe` が 1 つずつ残るだけになった。文面全体を `toBe` が決める以上、`contains` の否定は同じことを二度言っていた。理由: 主張が 1 つに戻り、失敗の意味が読みやすくなった。
- Doubts:
  - Round 1 の Doubts の `.pi/extensions/consult/index.test.ts:350`（説明文の literal 固定）には `fixed:` が付かず、今回も変わっていない。ADR が決めた値なので finding にはしないが、未決のまま残っている。
  - `.pi/extensions/consult/tool/consult.test.ts:708-718` の「終わった記録だけ」は、Round 1 が挙げた「開始行＋終わりの行の 2 行の組」ではなく、1 行に `ended` を足した形のまま。順序の担保は `listText` 側の新しいテストが持つので finding にはしないが、コマンド経由で 2 行の組を通る道は誰も見ていない。
  - この Round 2 はコードの読みで判定し、テストは実行していない（この役割では `pnpm` を走らせられない）。`rowsOf` の順序を入れ替えたときに新しいテストが赤になることは、`rowsOf` と `isRunning`/`isWaiting` の定義をたどって確かめた。

## Acceptance

- Goal: 達成している。`/consult-status` が、このセッションで動いているサブエージェントの一覧を `info` で出す。記録は `readRuns` と `listText(..., 'running')` から作り、`consult_subagents` の list と同じ整形を使う。
- Ran:
  - `pnpm test:run`: 66 files, 871 tests passed。
  - `pnpm typecheck`: `root: ok`、`.pi: ok`。
  - `pnpm lint`: 指摘なし。
  - `pnpm format:check`: すべて整っている。
  - 壊して赤を確かめた: `rowsOf` の `running` の絞り込みを外す → 4 件赤。`commands.status` の `'running'` を外す → 4 件赤。`/consult-status` の登録を外す → 1 件赤。3 つとも戻した。
- Findings: なし
- Doubts:
  - `.pi/extensions/consult/index.test.ts:350` の説明文が literal で固定されている。ADR の決定値なので finding にしないが、文言を変えるときはテストも直す必要がある。
  - 「終わった記録だけ」のコマンド経由のケースは、開始行と終わりの行の 2 行の組ではなく 1 行に `ended` を足した形のまま。`latest` の後に絞る順序は `listText` 側の新しいテストが持つ。
