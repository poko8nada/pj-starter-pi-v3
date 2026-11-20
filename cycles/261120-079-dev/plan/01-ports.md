# PLAN `ports`

- ADR-No: 01
- Place: worktree
- Boundary Plans: なし。ADR 01 の「6 件を消す」は 3 つの plan に分かれる（この plan が 4 件、`guard` が 1 件、`retry-args` が 1 件）。この plan が扱う範囲は `Files` が持つ。

## Goal

`context-precompact` が、外部の型をそのまま受けず、読むメンバーだけの狭いポートを受ける。

## Refactor

- Inside:
  - Modules: `SessionPort` と `RegistryPort` は `run/ports.ts` に置く。`SessionPort` を `PrecompactCtx`（`index.ts`）と `SummaryCtx`（`run/ports.ts`）の両方が使うため、`index.ts` が既に import している `run/ports.ts` に置けば、依存の向きを増やさずに済む。ファイルは増やさない。
  - Dirs: なし。ディレクトリの分割も移動もしない。
- Outside:
  - Extract: なし。`SessionPort` は `ExtensionContext['sessionManager']` から `Pick` で作るため、新しい共通モジュールを作らない。
  - Colocate: なし。`SessionPort` を `run/ports.ts` に置くのは、`SummaryCtx` がその `Pick` を使い、`index.ts` が既にこのファイルを import しているためである。別々に置けば、同じ型を 2 か所に置くことになる。

## Files

```text
.pi/
  extensions/
    context-precompact/
      run/
        ports.ts              update
        ports.test.ts         update
      test/
        prepared.fixture.ts   update
      index.ts                update
      index.test.ts           update
```

## Slices

## 1.ポートの型を置く

`SessionPort` と `RegistryPort` を `run/ports.ts` に置き、`SummaryCtx` が狭いポートで受けるようにする。

### Types

```ts
export type SessionPort = Pick<
  ExtensionContext['sessionManager'],
  'getBranch' | 'getSessionId' | 'buildSessionProjection'
>;
export type RegistryPort = Pick<ExtensionContext['modelRegistry'], 'getApiKeyAndHeaders'>;

export interface SummaryCtx {
  readonly model: ExtensionContext['model'];
  readonly modelRegistry: RegistryPort;
  readonly thinkingLevel: ExtensionContext['thinkingLevel'];
  readonly sessionManager: Pick<SessionPort, 'getSessionId'>;
  readonly compactFn: typeof compact;
}
```

### Steps

1. `.pi/extensions/context-precompact/run/ports.ts`
   1. add: `SessionPort` を置く。`PrecompactCtx` が読む `getBranch`・`getSessionId`・`buildSessionProjection` を持つ（F6）。
   2. add: `RegistryPort` を置く。`SummaryCtx` が読む `getApiKeyAndHeaders` だけを持つ（F6）。
   3. update: `SummaryCtx.modelRegistry` を `RegistryPort` にする。
   4. update: `SummaryCtx.sessionManager` を `Pick<SessionPort, 'getSessionId'>` にする。要約が読むのは `getSessionId` だけである（F6）。
   5. update: `SummaryCtx.model` は `ExtensionContext['model']` のままにする。`compact` が本物の `Model<any>` を要求する（F7）。

### Policy

- Allowed:
  - 狭いポートは `Pick<本物の型, 読むメンバー>` で作る（C3, F1, F2, F6）
- Forbidden:
  - `SummaryCtx` の `model` を `Pick` で狭めない - `compact` が本物の `Model<any>` を要求する（F7）

### Verify

- Always:
  - `pnpm test:related .pi/extensions/context-precompact/run/ports.ts .pi/extensions/context-precompact/run/ports.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `run/ports.ts` と、それを読む `index.ts`・`run/ports.test.ts` を全体で読み、`SummaryCtx` の欄が読む側と合っているか確かめる
- Added:
  - `pnpm suppression-check --report` を、作業の前に 1 度、後に 1 度実行する。違反の数が変わらない（このスライスは抑制を消さない）

## 2.入口を狭いポートに合わせる

`PrecompactCtx` の 2 欄を狭いポートにし、本物の `ExtensionContext` をそのまま受ける。

### Types

```ts
export interface PrecompactCtx {
  readonly sessionManager: SessionPort;
  readonly model: ExtensionContext['model'];
  readonly modelRegistry: RegistryPort;
  readonly thinkingLevel?: ExtensionContext['thinkingLevel'];
  readonly getContextUsage: ExtensionContext['getContextUsage'];
  readonly signal: AbortSignal | undefined;
  readonly ui: {
    readonly notify: ExtensionContext['ui']['notify'];
    readonly setStatus: ExtensionContext['ui']['setStatus'];
  };
}
```

### Steps

1. `.pi/extensions/context-precompact/index.ts`
   1. update: `./run/ports.ts` から `type RegistryPort` と `type SessionPort` を import する。
   2. update: `PrecompactCtx.sessionManager` を `SessionPort` にする。
   3. update: `PrecompactCtx.modelRegistry` を `RegistryPort` にする。
   4. update: `PrecompactCtx.model` は `ExtensionContext['model']` のままにする（F7）。

### Policy

- Allowed:
  - 本物の `ExtensionContext` は狭いポートを満たすため、`pi.on` と `pi.registerCommand` の受け渡しは変えない（F1, F2, F10）
- Forbidden:
  - `pi.on` と `pi.registerCommand` の並びを変えない - 変えるのは型だけである

### Verify

- Always:
  - `pnpm test:related .pi/extensions/context-precompact/index.ts .pi/extensions/context-precompact/index.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `index.ts` 全体と、それを読む `index.test.ts` を読み、`sessionManager` と `modelRegistry` の 2 欄の受け渡しが合っているか確かめる。`createSummaryPorts`（`index.ts:248-254`）に `SessionPort` を渡す箇所が、`Pick<SessionPort, 'getSessionId'>` を受ける側と型で合うことも確かめる（F10）
- Added:
  - `pnpm suppression-check --report` を、作業の前に 1 度、後に 1 度実行する。違反の数が変わらない（このスライスは抑制を消さない）

## 3.テストからキャストを消す

4 つの偽物を狭いポートのリテラルにし、イベントを型注釈で受け、抑制 4 件を消す。

### Types

```ts
const manager: SessionPort = {
  buildSessionProjection: () => ({
    entries: projectEntries(branch).map((entry) => ({
      ...entry,
      messages: [...entry.messages],
    })),
    messages: [],
    thinkingLevel: 'off',
    model: null,
  }),
  getBranch: () => [...branch],
  getSessionId: () => sessionId,
};
const event: SessionBeforeCompactEvent = {
  /* type, preparation, branchEntries, reason, willRetry, signal */
};
function sessionManagerOf(sessionId: string): Pick<SessionPort, 'getSessionId'>;
```

### Steps

1. `.pi/extensions/context-precompact/run/ports.test.ts`
   1. add: `./ports.ts` の type import に `type SessionPort` を足す。
   2. update: `sessionManagerOf` の戻り値を `Pick<SessionPort, 'getSessionId'>` にし、`as unknown as` を消す。偽物のリテラルがそのまま合う（C2, F1, F6）。
   3. drop: 29 行目の抑制コメントを消す（C2）。

2. `.pi/extensions/context-precompact/test/prepared.fixture.ts`
   1. add: `import type { RegistryPort } from '../run/ports.ts';` を足す。
   2. update: `registryFake` の戻り値を `RegistryPort` にし、`as unknown as` を消す。引数の型は変えない。偽物のリテラルがそのまま合う（C2, F2, F6）。
   3. drop: 57 行目の抑制コメントを消す（C2）。
   4. update: `modelFake` とその抑制は触らない。ADR の `Main` の残る 2 件と `Policy`（部分モック）は entry 04 が扱う。

3. `.pi/extensions/context-precompact/index.test.ts`
   1. add: `./run/ports.ts` から `type SessionPort` を import する。
   2. update: `buildSessionProjection` の戻り値の `entries` を、`projectEntries(branch).map((entry) => ({ ...entry, messages: [...entry.messages] }))` にする。`SessionProjection.entries[].messages` は書き換え可能な配列であり、`ProjectedEntry.messages` は読み取り専用のため、そのままでは合わない（F12）。
   3. update: `const manager: SessionPort = { ... }` と注釈を付け、`sessionManager: manager` にして `as unknown as` を消す。注釈で文字列と真偽値の広がりを止める（C2, F1, F3, F6）。
   4. drop: 111 行目の抑制コメントを消す（C2）。
   5. update: `compactEvent` の `event` に `SessionBeforeCompactEvent` の注釈を付け、`as unknown as` を消す（C2, F3）。
   6. drop: 208 行目の抑制コメントを消す（C2）。

### Policy

- Allowed:
  - 偽物は読むメンバーだけを持つリテラルにする（C2, F1, F2, F6）
  - リテラルは型注釈で受けて、文字列と真偽値の広がりを止める（C3, F3）
- Forbidden:
  - `as unknown as T` を新しく足さない - 全体規約が禁じている（C3）
  - `modelFake` のキャストを触らない - ADR の `Main` の残る 2 件として entry 04 が扱う

### Verify

- Always:
  - `pnpm test:related .pi/extensions/context-precompact/run/ports.test.ts .pi/extensions/context-precompact/test/prepared.fixture.ts .pi/extensions/context-precompact/index.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えた 3 ファイルと、それらが読む `run/ports.ts`・`index.ts` を全体で読み、偽物が狭いポートの欄だけを持つことを確かめる
- Added:
  - `pnpm suppression-check --report` を、作業の前に 1 度、後に 1 度実行する。違反が 4 件減る（`ports.test.ts:29`、`index.test.ts:111`、`index.test.ts:208`、`prepared.fixture.ts:57`）

## Notes

### Slice 1: ポートの型を置く

- Findings: なし
- Unplanned: なし
- Commit:
- Stopped:

### Slice 2: 入口を狭いポートに合わせる

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 3: テストからキャストを消す

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Cleanup: なし

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
