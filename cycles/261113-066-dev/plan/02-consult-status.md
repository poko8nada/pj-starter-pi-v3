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

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 2: コマンドの登録と通知

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 3: ドキュメント

- Findings:
- Unplanned:
- Commit:
- Stopped:

## Work Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Policy:
- Unproven:
- Noise:
- Doubts:

### Round 2

- Stale:
- Unlisted:
- Gaps:
- Policy:
- Unproven:
- Noise:
- Doubts:

## Acceptance

- Goal:
- Ran:
- Findings:
- Doubts:
