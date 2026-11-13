# PLAN `consult-tool-view`

- No: 02
- Place: worktree
- Boundary Plans: 01-consult-run-sub

## Goal

consult の `tool`、`view`、`index`、`policy` のテストが、各テスト固有の事実だけを残し、同じ事実をレイヤーごとに1回確認する形になる。

## Design

- Inside:
  - Modules: なし
  - Dirs: なし
- Outside:
  - Extract: `consult.fixture.ts` に `aPiFace()`、`aToolCall()`、`START_TOKEN` を足す。`index` と `tool/consult` の偽 `PiFace`、`tool/subagents` と `tool/worktree` の 5 要素タプル、3 ファイルの `Wed Oct 21 12:41:12 2026` の直書きを 1 か所に寄せるため。
  - Colocate: なし

## Files

```text
.pi/
  extensions/
    consult/
      policy/
        types.test.ts
        types.ts
      tool/
        commit.test.ts        update
        consult.test.ts       update
        consult.ts
        subagents.test.ts     update
        subagents.ts
        worktree.test.ts      update
        worktree.ts
      view/
        notice.test.ts
        notice.ts
        widget.test.ts        update
        widget.ts
      consult.fixture.ts      update
      index.test.ts           update
      index.ts
      README.md
      types.json
test/
  temp-dir.ts
```

## Slices

## 1.fixture のモックとタプル

偽 `PiFace`、5 要素タプル、`Wed Oct 21 12:41:12 2026` を `consult.fixture.ts` に寄せる。

### Types

```ts
export function aPiFace(): {
  readonly pi: PiFace;
  readonly sent: readonly ConsultMessage[];
  readonly calls: ReadonlyArray<{
    readonly message: ConsultMessage;
    readonly options?: ConsultSendOptions;
  }>;
  readonly failNext: () => void;
};

export function aToolCall<T, C>(
  params: T,
  ctx: C,
  id?: string,
): [string, T, undefined, undefined, C];

export const START_TOKEN: string;

function aNewWorktree(dir: string, id?: string): Promise<Outcome>;
```

### Steps

1. `.pi/extensions/consult/consult.fixture.ts`
   1. update: `PiFace`、`ConsultMessage`、`ConsultSendOptions` を `./tool/consult.ts` から import する。
   2. update: `aPiFace()` を足す。`sent`、`calls`、`failNext` を持ち、`failNext()` の後の 1 回だけ投げてから記録する。

      ```ts
      export function aPiFace(): {
        readonly pi: PiFace;
        readonly sent: readonly ConsultMessage[];
        readonly calls: ReadonlyArray<{
          readonly message: ConsultMessage;
          readonly options?: ConsultSendOptions;
        }>;
        readonly failNext: () => void;
      } {
        const sent: ConsultMessage[] = [];
        const calls: Array<{ message: ConsultMessage; options?: ConsultSendOptions }> = [];
        let fail = false;
        const pi: PiFace = {
          sendMessage: (message, options) => {
            if (fail) {
              fail = false;
              throw new Error('gone');
            }
            sent.push(message);
            calls.push({ message, options });
          },
        };
        return {
          pi,
          sent,
          calls,
          failNext: () => {
            fail = true;
          },
        };
      }
      ```

   3. update: `aToolCall()` を足す。

      ```ts
      export function aToolCall<T, C>(
        params: T,
        ctx: C,
        id = 'call',
      ): [string, T, undefined, undefined, C] {
        return [id, params, undefined, undefined, ctx];
      }
      ```

   4. update: `START_TOKEN` を足す。

      ```ts
      export const START_TOKEN = 'Wed Oct 21 12:41:12 2026';
      ```

   5. update: 冒頭の説明に「偽 `PiFace` は `aPiFace()`、5 要素タプルは `aToolCall()`、開始時刻は `START_TOKEN` で作る」を足す。
2. `.pi/extensions/consult/index.test.ts`
   1. update: `fakePi(fail)` を `const made = aPiFace(); if (fail.next) made.failNext(); return { pi: made.pi, sent: made.sent };` に変える。
3. `.pi/extensions/consult/tool/consult.test.ts`
   1. update: `fakePi()` の本体を `aPiFace()` にし、`{ pi, calls }` を返す。使わなくなった `ConsultMessage` と `ConsultSendOptions` の import を落とす。
   2. update: `setup()` の `placeFor(tempDir(), tempDir())` を `aPlace()` にし、`placeFor` の import を落とす。`aPlace` を import する。
   3. update: 2 か所の `Wed Oct 21 12:41:12 2026` を `START_TOKEN` にし、`START_TOKEN` を import する。
4. `.pi/extensions/consult/tool/subagents.test.ts`
   1. update: `../consult.fixture.ts` から `aToolCall` と `START_TOKEN` を import し、10 か所の 5 要素タプルを `aToolCall(params, { cwd: tempDir() })` にする。`const args: SubagentsArgs` の型注釈は残す。
   2. update: 1 か所の `Wed Oct 21 12:41:12 2026` を `START_TOKEN` にする。
5. `.pi/extensions/consult/tool/worktree.test.ts`
   1. update: `../consult.fixture.ts` から `aToolCall` と `START_TOKEN` を import し、`call` helper の `createWorktreeTool(place, check)('call-1', params, undefined, undefined, { cwd })` を `createWorktreeTool(place, check)(...aToolCall(params, { cwd }, 'call-1'))` にする。`call(params, cwd, check?)` のシグネチャは変えない。
   2. update: `new` の前提をローカル helper `aNewWorktree(dir, id = '2-b')` にまとめる。成功する 14 か所を `aNewWorktree(dir)`（`id` を渡す 1 か所は `aNewWorktree(dir, id)`）にし、id なしのエラー系はそのまま残す。

      ```ts
      function aNewWorktree(dir: string, id = '2-b') {
        return call({ action: 'new', id }, dir);
      }
      ```

   3. update: 3 か所の `Wed Oct 21 12:41:12 2026` を `START_TOKEN` にする。
6. 01 が `index.test.ts` と `tool/subagents.test.ts` の `place()`、done の `record()`、`aAt()` を置換済みである。02 はそれをそのまま使い、重複定義を戻さない。

### Policy

- Allowed:
  - テストの削除と統合、fixture への helper の移動、古い文言の修正
- Forbidden:
  - 製品コードと consult の実装を変える - テストの整理だけを行うため
  - 単体テストが確認している値を配線テストでも同じ値で確認する - 同じ事実を2回確認しないため
  - 失敗経路の確認を落とす - 残す失敗経路を守るため
  - `policy` のテストを変える - 重複した確認がないため

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added: なし

## 2.登録と status のレイヤー

`renderNotice` の登録、status の文面、完了行の表示を、それぞれ 1 つのレイヤーに残す。

### Types

なし

### Steps

1. `.pi/extensions/consult/index.test.ts`
   1. update: レンダラー登録のテストは `expect(received).toHaveLength(1)` だけを確認する。`renderNotice` の import を落とす。
   2. update: `consult-status` のテストは `commands.get('consult-status')` と `description` の断言だけを残し、`notices`、`ctx`、ハンドラ呼び出しを消す。
   3. update: reload のテストは `sent` と `played` の 3 断言だけを残し、`rowsOf` の `before` と `after` を落とす。`rowsOf` の import を落とし、`readRuns` は残す。
2. `.pi/extensions/consult/tool/consult.test.ts`
   1. update: `expect(notices).toHaveLength(1); expect(notices[0]?.type).toBe('info');` にし、題名を「走っている記録がない → info で通知する」にする。
   2. update: 同じ 2 断言にし、題名を「開始行と終わりの行を渡しても info で通知する」にする。

### Policy

- Allowed:
  - テストの削除と統合、fixture への helper の移動、古い文言の修正
  - `view/notice.test.ts:56` の `aClick()` の 9 項目は型を満たすため残す。値の確認は単体が持ち、配線は `notices`/`sent`/`played` の経路だけを確認する。
- Forbidden:
  - 製品コードと consult の実装を変える - テストの整理だけを行うため
  - 単体テストが確認している値を配線テストでも同じ値で確認する - 同じ事実を2回確認しないため
  - 失敗経路の確認を落とす - 残す失敗経路を守るため
  - `policy` のテストを変える - 重複した確認がないため

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added: なし

## 3.ウィジェットのレイヤー

表示内容を `view/widget.test.ts` の単体に寄せ、`showRunningOnce` と `startTick` はキーだけを確認する。

### Types

```ts
export const WIDGET_KEY: string;
export interface RoleCount {
  readonly role: string;
  readonly count: number;
}
export type WidgetUI = Pick<ExtensionUIContext, 'setWidget'>;
export function runningLine(counts: readonly RoleCount[]): string | undefined;
export function showRunning(ui: WidgetUI, counts: readonly RoleCount[]): void;
export function aWidgetUI(): {
  readonly ui: WidgetUI;
  readonly calls: ReadonlyArray<{ readonly key: string; readonly content: unknown }>;
};
```

### Steps

1. `.pi/extensions/consult/view/widget.test.ts`
   1. update: `countRoles / runningLine` の `describe` の後に、`showRunning` の 2 ケースを足す。期待値は `runningLine` から取る。

      ```ts
      describe('showRunning', () => {
        it('showRunning: (happy) role 1 件 → line を widget に渡す', () => {
          const counts = [{ role: 'review', count: 1 }];
          const { ui, calls } = aWidgetUI();
          showRunning(ui, counts);
          expect(calls).toEqual([{ key: WIDGET_KEY, content: [runningLine(counts)] }]);
        });

        it('showRunning: (empty) 0 件 → undefined を渡す', () => {
          const { ui, calls } = aWidgetUI();
          showRunning(ui, []);
          expect(calls).toEqual([{ key: WIDGET_KEY, content: runningLine([]) }]);
        });
      });
      ```

   2. update: `./widget.ts` の `showRunning` と `WIDGET_KEY`、`../consult.fixture.ts` の `aWidgetUI` を import する。
2. `.pi/extensions/consult/index.test.ts`
   1. update: 4 つのテスト（`startTick` の 2 件、`showRunningOnce` の 2 件）の内容の断言を `expect(calls.some((call) => call.key === WIDGET_KEY)).toBe(true)` にし、題名を `startTick: (happy) 走っている review が 1 体 → consult-running を更新する`、`startTick: (empty) 何も走っていない → consult-running を更新する`、`showRunningOnce: (happy) 走っている記録 → consult-running を更新する`、`showRunningOnce: (empty) 記録がない → consult-running を更新する` にする。
   2. update: `setWidget` が投げるテストはそのまま残す。

### Policy

- Allowed:
  - テストの削除と統合、fixture への helper の移動、古い文言の修正
- Forbidden:
  - 製品コードと consult の実装を変える - テストの整理だけを行うため
  - 単体テストが確認している値を配線テストでも同じ値で確認する - 同じ事実を2回確認しないため
  - 失敗経路の確認を落とす - 残す失敗経路を守るため
  - `policy` のテストを変える - 重複した確認がないため

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added: なし

## 4.古い文言

`commit.test.ts` の `use` を、現在の検査の名前に直す。

### Types

なし

### Steps

1. `.pi/extensions/consult/tool/commit.test.ts`
   1. update: 冒頭のコメントから「最後のメインエージェントの `use` 検証」を落とし、「`consult_worktree` の検査が実もので見る」に直す。

### Policy

- Allowed:
  - テストの削除と統合、fixture への helper の移動、古い文言の修正
- Forbidden:
  - 製品コードと consult の実装を変える - テストの整理だけを行うため
  - 単体テストが確認している値を配線テストでも同じ値で確認する - 同じ事実を2回確認しないため
  - 失敗経路の確認を落とす - 残す失敗経路を守るため
  - `policy` のテストを変える - 重複した確認がないため

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added: なし

## Notes

### Slice 1: fixture のモックとタプル

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 2: 登録と status のレイヤー

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 3: ウィジェットのレイヤー

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 4: 古い文言

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Cleanup: consult のテスト

- Findings:
- Unplanned:

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
