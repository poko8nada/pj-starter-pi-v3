# PLAN `context-precompact-tests`

- No: 03
- Place: worktree
- Boundary Plans: 02-thinking-scrub-tests (order 2)

## Goal

context-precompact のテストが、同じ事実を 1 箇所で確認し、前提を fixture に集めた形になる。

## Design

- Inside:
  - Modules: `test/session-entries.ts` から `sessionWithTurns(count = 3)` を出し、`assistant` と `project` を削る。`test/prepared.fixture.ts` に `llmUsage`、`preparedCompaction`、`modelFake`、`registryFake` を集める。`index.test.ts` の `compactOk` と `okResult`、`nowSetup` と `preparedNow` をそれぞれ 1 つにまとめる。セッションの形と準備の形は別の関心なので、`session-entries.ts` と `prepared.fixture.ts` に分ける。
  - Dirs: `test/` に `prepared.fixture.ts` を足す。ディレクトリの分割や移動はない。
- Outside:
  - Extract: `settingsDirWith` は 02 が `test/settings.fixture.ts` に置いたものを読む。03 では作らない。
  - Colocate: なし。

## Files

```text
.pi/
  extensions/
    context-precompact/
      apply/
        draft.test.ts        update
        draft.ts
      command/
        precompact.test.ts
        precompact.ts
      gate/
        gate.test.ts
        gate.ts
      prepare/
        compare.test.ts      update
        compare.ts
        copied.test.ts       update
        copied.ts
        guard.test.ts
        guard.ts
        prepare.test.ts      update
        prepare.ts
      run/
        ports.test.ts        update
        ports.ts
        summarize.test.ts    update
        summarize.ts
      settings/
        constants.ts
        read.test.ts         update
        read.ts
        schema.test.ts
        schema.ts
      test/
        prepared.fixture.ts  add
        session-entries.ts   update
      ui/
        count.test.ts        update
        count.ts
        status.test.ts       update
        status.ts
      index.test.ts          update
      index.ts
test/
  settings.fixture.ts
  temp-dir.ts
package.json
```

## Slices

## 1.前提を fixture に集める

テストが作り直しているセッションと準備の前提を `test/` の fixture に集め、テストの import を合わせる。

### Types

```ts
export function sessionWithTurns(count?: number): {
  readonly session: SessionFixture;
  readonly branch: readonly SessionEntry[];
};

export function llmUsage(): CompactionResult['usage'];

export function preparedCompaction(overrides?: Partial<PreparedCompaction>): PreparedCompaction;

export function modelFake(contextWindow?: number): ExtensionContext['model'];

export function registryFake(
  auth?: Awaited<ReturnType<ExtensionContext['modelRegistry']['getApiKeyAndHeaders']>>,
): ExtensionContext['modelRegistry'];

function okResult(
  preparation: Parameters<SummaryCtx['compactFn']>[0],
): Awaited<ReturnType<SummaryCtx['compactFn']>>;

function compactOk(): SummaryCtx['compactFn'];

async function nowSetup(compactFn?: SummaryCtx['compactFn']): Promise<{
  readonly branch: readonly SessionEntry[];
  readonly wiring: ReturnType<typeof createPrecompactWiring>;
  readonly dir: string;
  readonly setPiEnabled: (value: boolean) => void;
  readonly ready: NonNullable<
    ReturnType<ReturnType<typeof createPrecompactWiring>['getState']>['prepared']
  >;
}>;
```

### Steps

1. `.pi/extensions/context-precompact/test/prepared.fixture.ts`
   1. add: `llmUsage()` を置く。`index.test.ts:43-52`、`test/session-entries.ts:32-41`、`apply/draft.test.ts:15-24` の同形を 1 つにする。
   2. add: `preparedCompaction(overrides = {})` を置く。既定は `firstKeptEntryId: 'kept-1'`、`messagesToSummarize: []`、`turnPrefixMessages: []`、`isSplitTurn: false`、`tokensBefore: 100`、`previousSummary: undefined`、`fileOps: { read: new Set(), written: new Set(), edited: new Set() }`、`settings: { enabled: true, reserveTokens: RESERVE_TOKENS, keepRecentTokens: 2000 }`。`prepare/compare.test.ts` の `previousSummary: 'prev'`、`messagesToSummarize: [messageOf()]`、`fileOps.read: ['a.ts']`、`reserveTokens: 16384` と、`apply/draft.test.ts` の `tokensBefore: 1000` は `overrides` で渡す。
   3. add: `modelFake(contextWindow = 200_000)` と `registryFake(auth = { ok: true, apiKey: 'k', headers: {}, env: {} })` を置く。`modelFake` は `ExtensionContext['model']` を返し、`registryFake` は `getApiKeyAndHeaders: async () => auth` を持つ `ExtensionContext['modelRegistry']` を返す。`index.test.ts` は `modelFake(CONTEXT_WINDOW)`、`run/ports.test.ts` は `modelFake()` と `registryFake(auth)` を使う。
2. `.pi/extensions/context-precompact/test/session-entries.ts`
   1. add: `sessionWithTurns(count = 3)` を置く。`createSessionFixture()` と `turns(count)` を組み、`{ session, branch }` を返す。
   2. drop: `SessionFixture` の `assistant` と `project` の欄を削除する。`turns` が内部で使う `assistantEntry` は残す（未使用になるのは公開の `assistant` 欄のみ）。`projectEntries` は `prepare/copied.test.ts`、`prepare/prepare.test.ts`、`index.test.ts` が使うため残す。
   3. update: `llmUsage` を `test/prepared.fixture.ts` からインポートし、ローカルの `llmUsage` を削除する。
3. `.pi/extensions/context-precompact/index.test.ts`
   1. update: `llmUsage`、`modelFake`、`registryFake` を fixture からインポートし、ローカルの定義を削除する。（`preparedCompaction` を使う箇所はないため入れない）
   2. update: `okResult(preparation)` を 1 つ残し、`compactOk()` を `async (preparation) => okResult(preparation)` にする。`okResult` は `Parameters<SummaryCtx['compactFn']>[0]` を受け、`Awaited<ReturnType<SummaryCtx['compactFn']>>` を返す。
   3. update: `nowSetup(compactFn = compactOk())` を async にし、`onCommand('now', lead.ctx)` と `flush` まで行って `{ branch, wiring, dir, setPiEnabled, ready }` を返す。`preparedNow(setup)` を削除し、呼び出しを `const setup = await nowSetup(); const ready = setup.ready;` に直す。実行中の完了を待つ `deferred` 系と初回失敗の `onceFails` 系（および error/session-reset の一部）は `ready` を持たないため手動配線のままとする。
   4. update: `const { session, branch } = sessionWithTurns(3);` とし、`branch` だけ使う箇所は `const { branch } = sessionWithTurns(3);` にする。`session.compaction('new')` など `session` を使う箇所は `session` を残す。
   5. update: ローカルの `settingsDirWith` と `defaultSettingsDir` を削除し、`test/settings.fixture.ts` の `settingsDirWith` をインポートする。`defaultSettingsDir()` の呼び出しを `settingsDirWith(settingsDocument())` に置き換える。`settingsDocument` は残す。
4. `.pi/extensions/context-precompact/apply/draft.test.ts`
   1. update: `preparedCompaction` と `llmUsage` を fixture からインポートし、ローカルの `preparedOf` と `usage` を削除する。`usage()` の呼び出しを `llmUsage()` に、`preparedOf()` の呼び出しを `preparedCompaction()` に置き換える。`tokensBefore: 1000` など既定と違う値は `overrides` で渡す。
5. `.pi/extensions/context-precompact/run/ports.test.ts`
   1. update: `preparedCompaction`、`modelFake`、`registryFake` を fixture からインポートし、ローカルの `preparedOf`、`modelOf`、`registryOf` を削除する。`registryOf(auth)` の呼び出しは `registryFake(auth)` に置き換え、失敗系とヘッダ透過の auth をそのまま渡す。`modelOf()` は `modelFake()` に置き換える。
6. `.pi/extensions/context-precompact/run/summarize.test.ts`
   1. update: `preparedCompaction` を fixture からインポートし、ローカルの `preparedOf` を削除する。
7. `.pi/extensions/context-precompact/prepare/copied.test.ts`
   1. update: `const { session, branch } = sessionWithTurns(3);` とし、`session.toolCall`、`session.compaction`、`session.user` を使う箇所は `session` を、`pathEntries` は `branch` を使う。
8. `.pi/extensions/context-precompact/prepare/prepare.test.ts`
   1. update: `const { session, branch } = sessionWithTurns(3);` とし、`makeInput(session, { branch, ... })` に渡す。`makeInput` の `branch` の既定を `session.turns(3)` から受け取った `branch` に変える。
9. `.pi/extensions/context-precompact/settings/read.test.ts`
   1. update: 有効な JSON を書く箇所（13-17 行目）を `settingsDirWith(settings)` に置き換える。壊れた JSON を書く箇所（30-33 行目）は `tempDir()` と `writeFileSync(..., truncatedJson())` のまま残す。`mkdirSync` とファイルなしの箇所も残す。
10. `.pi/extensions/context-precompact/prepare/compare.test.ts`
    1. update: `base()` を `preparedCompaction()` に寄せ、`previousSummary: 'prev'`、`messagesToSummarize: [messageOf()]`、`fileOps.read: ['a.ts']`、`reserveTokens: 16384` は `overrides` で渡す。`messageOf()` と `fileOpsOf()` は単体固有の形のため残す。

### Policy

- Allowed:
  - 判断と変換は単体に残し、配線は経路だけを確認する。
  - fixture は、その Unit だけで使うものは Unit 内の `*.fixture.ts` に置き、複数 Unit で使うものは `test/` に置く。
  - 削除ごとに、残す側のテストか「存在しない理由」を対応付ける。
  - 既存の `pnpm test:run`、`pnpm typecheck`、`pnpm lint` で確認する。
- Forbidden:
  - 振る舞いを変える - テストの整理だけを行う。
  - 振る舞いやロジックを持たない primitive、bool、順序、有無をテストする - プリンシプルに反する。
  - 実装の値を写すだけの定数確認を残す - 振る舞いを確認しない。
  - `rules/` を変更する - このサイクルの範囲外。
  - 型を満たすためだけの引数を削除する - 型が壊れる。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/context-precompact/test/prepared.fixture.ts .pi/extensions/context-precompact/test/session-entries.ts .pi/extensions/context-precompact/index.test.ts .pi/extensions/context-precompact/apply/draft.test.ts .pi/extensions/context-precompact/run/ports.test.ts .pi/extensions/context-precompact/run/summarize.test.ts .pi/extensions/context-precompact/prepare/copied.test.ts .pi/extensions/context-precompact/prepare/prepare.test.ts .pi/extensions/context-precompact/settings/read.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added: なし

## 2.重複と前提の削除

単体と重複する配線のテストと、プリンシプルの外にある断言を削除する。

### Types

なし

### Steps

1. `.pi/extensions/context-precompact/index.test.ts`
   1. update: 337-386 行目の `variants` の 4 変種のうち、`session` 変種（`sessionId: OTHER_SESSION_ID`）だけを残し、ループを単一ケースに直す。残り 3 つは `prepare/guard.test.ts:36,43,50,57` が確認する。
   2. update: 減らしたテストで、`expect(outcome).toBeUndefined()` の後に `expect(wiring.getState().prepared).toBeUndefined()` を足し、`FALLBACK_TEXT` の通知を確認する。
      - case: 1.2: boundary: `session` が変わった `onTurnEnd` → `undefined` を返し、`prepared` が消え、`FALLBACK_TEXT` を通知する
2. `.pi/extensions/context-precompact/ui/status.test.ts`
   1. drop: 33 行目の `expect(footer).toBeDefined()` を削除する。同じ `it` の `not.toContain(reason)` が振る舞いを確認する。
3. `.pi/extensions/context-precompact/ui/count.test.ts`
   1. update: 7 行目の JSDoc の `/** */` を残し、本文だけを「期待値は en-US の書式で組み立てる。実装は 3 桁ごとのカンマを固定で入れる。」に直す。

### Policy

- Allowed:
  - 判断と変換は単体に残し、配線は経路だけを確認する。
  - fixture は、その Unit だけで使うものは Unit 内の `*.fixture.ts` に置き、複数 Unit で使うものは `test/` に置く。
  - 削除ごとに、残す側のテストか「存在しない理由」を対応付ける。
  - 既存の `pnpm test:run`、`pnpm typecheck`、`pnpm lint` で確認する。
- Forbidden:
  - 振る舞いを変える - テストの整理だけを行う。
  - 振る舞いやロジックを持たない primitive、bool、順序、有無をテストする - プリンシプルに反する。
  - 実装の値を写すだけの定数確認を残す - 振る舞いを確認しない。
  - `rules/` を変更する - このサイクルの範囲外。
  - 型を満たすためだけの引数を削除する - 型が壊れる。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/context-precompact/index.test.ts .pi/extensions/context-precompact/ui/status.test.ts .pi/extensions/context-precompact/ui/count.test.ts .pi/extensions/context-precompact/prepare/guard.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added: なし

## Notes

### Slice 1: 前提を fixture に集める

- Findings:
  - なし
- Unplanned:
  - `llmUsage()` の戻りを `NonNullable<CompactionResult['usage']>` にした。`CompactionResult['usage']` のままだと `session-entries.ts` の assistant/toolCall の `usage` に渡せず typecheck が落ちるため。由来は `CompactionResult` のままにし、具体型を直書きしない。
  - `assistantEntry` を残した。`turns` が内部で使うため、プランの削除指示では振る舞いが壊れる。公開の `assistant` 欄だけ削り、未使用の公開実装として整理した。
  - `deferred`/`onceFails` 系の 6 箇所は新しい `nowSetup` を使わず手動配線にした。新 `nowSetup` は `onCommand('now')`+`flush` まで行うため、解放待ちの `deferred` ではデッドロックし、初回失敗の `onceFails` では `ready` がなく wiring を失うため。振る舞いは変えず、準備の作り方だけ分割した。
  - `index.test.ts` の `deferredCompact` の戻りを `okResult(preparation)` に寄せた。`compactOk` との重複を 1 箇所にするため。
  - `index.test.ts` では `preparedCompaction` を import していない。使う箇所がなく、未使用 import で lint が落ちるため。
  - Round 1 対応で `compare.test.ts` の `base()` を `preparedCompaction()`＋`overrides` に寄せた。手順 1.2 が例示する上書き経路が他で使われず、`...overrides` の結合が検証されなかったため。`Files` に `update` を記入し、手順 1 に 10 を追加した。
  - Round 1 対応で `index.test.ts` の先頭の配線テスト 1 件を `sessionWithTurns()`（引数なし）に変え、既定値の経路を実行するようにした。
- Commit: be1d92ff
- Stopped:

### Slice 2: 重複と前提の削除

- Findings:
  - なし
- Unplanned:
  - なし
- Commit: f79ba89f
- Stopped:

### Cleanup: makeInput の隠れた branch 既定の除去

- Findings:
  - なし
- Unplanned:
  - `prepare.test.ts` の `makeInput` から死んだ `branch` 既定（`overrides.branch ?? session.turns(3)`）を除去し、`branch` を必須にして未使用の `session` 引数を削った。全呼び出しが既に明示の `branch` を渡しており、既定は到達不能だった。残すと将来の呼び出しが気づかず余計な `turns(3)` を作る隠れた前提になるため。`...overrides` が `branch` を供給するため重複指定の TS2783 を避けて明示の `branch` 行を削った。

## Work Review

### Round 1

- Stale:
  - `.pi/extensions/context-precompact/test/session-entries.ts:143` — `/** セッションと 3 ターン分の branch を作る。 */` が `3` に固定され、引数 `count = 3`（`.pi/extensions/context-precompact/prepare/copied.test.ts:43` の `sessionWithTurns(0)`、`56` の `sessionWithTurns(1)` など）と矛盾する。コメントが古い。
    fixed: コメントを「セッションと branch を作る。既定は 3 ターン分。」に直した。
- Unlisted:
  - なし
- Gaps:
  - `.pi/extensions/context-precompact/test/prepared.fixture.ts:24` — `preparedCompaction(overrides)` の `previousSummary`／`messagesToSummarize`／`fileOps.read`／`reserveTokens: 16384` の上書き経路（手順 1.2 が例示）が更新後のテストで使われない。使っているのは `.pi/extensions/context-precompact/apply/draft.test.ts:35` の `tokensBefore` のみで、`.pi/extensions/context-precompact/prepare/compare.test.ts:23` は依然ローカル `base()` を持つ。`...overrides` の浅い結合（特に `fileOps`／`settings` の置換え方）が検証されない。
    fixed: `compare.test.ts` の `base()` を `preparedCompaction()`＋`overrides` に寄せた（手順 1 に 10 を追加、`Files` に `update` を記入）。`messageOf()` と `fileOpsOf()` は単体固有の形のため残した。
  - `.pi/extensions/context-precompact/test/session-entries.ts:144` — `sessionWithTurns(count = 3)` の既定値（引数なし）を呼ぶ箇所がなく、全呼び出しが `sessionWithTurns(3/1/0)` の明示値である。既定値の振る舞いが検証されない。
    fixed: `index.test.ts` の先頭の配線テスト 1 件を `sessionWithTurns()`（引数なし）に変え、既定値の経路を実行するようにした。
- Policy:
  - なし
- Unproven:
  - なし
- Noise:
  - なし
- Doubts:
  - `.pi/extensions/context-precompact/index.test.ts:21` — 手順 3.1 は `preparedCompaction` の import を求めるが、使う箇所がなく lint が落ちるため現状 import していない（Notes 記載）。手順文言の修正が必要か、所有者の判断を求める。
  - `.pi/extensions/context-precompact/test/session-entries.ts:41` — `assistantEntry` を残す判断（Notes 記載）は `turns` が内部利用するためで妥当だが、手順 2.2 の「`assistantEntry` を削除」と矛盾する。手順を「公開 `assistant` 欄のみ削除」に直すか、所有者の判断を求める。
  - `.pi/extensions/context-precompact/index.test.ts:670`、`.pi/extensions/context-precompact/index.test.ts:696` — `deferred`／`onceFails` の 2 箇所を `nowSetup` 外の手動配線にした（Notes 記載）。重複を避けるため `nowSetup` に選択肢を足すか、現状の分割を許容するか、所有者の判断を求める。

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
