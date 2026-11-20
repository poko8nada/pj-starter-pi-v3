# PLAN `guard`

- ADR-No: 01
- Place: worktree
- Boundary Plans: なし（`retry-args` と同じ番号で並行して走らせる）。ADR 01 の「6 件を消す」は 3 つの plan に分かれる（`ports` が 4 件、この plan が 1 件、`retry-args` が 1 件）。この plan が扱う範囲は `Files` が持つ。

## Goal

`thinking-scrub` が assistant であるかを `unknown` から型述語で確かめ、テストの偽物を型で守る。

## Refactor

- Inside:
  - Modules: `message.ts` が持つ。assistant であるかを確かめる手順は `scrubMessage` の内側にあり、入力を `unknown` にしたうえで、同じファイルに置くのが最も近い。`message.ts` は「純粋関数だけを置く」と宣言しており、型述語も純粋関数である。
  - Dirs: なし。
- Outside:
  - Extract: なし。この述語を使うのは `scrubMessage` とテストだけであり、共有する相手がまだいない。
  - Colocate: なし。`scrub.fixture.ts` の `PiAssistantMessage` は `MessageEndEvent['message']`（合併型全体）の別名であり、`message.ts` の `AssistantMessage`（assistant のメンバー）とは別の型である。統合しない。

## Files

```text
.pi/
  extensions/
    thinking-scrub/
      scrub/
        message.ts            update
        message.test.ts       update
      scrub.fixture.ts        update
      index.test.ts           update
      index.ts
```

## Slices

## 1.ガードを unknown から受ける型述語にする

`scrubMessage` の role と content のガードを、`unknown` を受ける `isAssistantMessage` に移す。

### Types

```ts
// `AgentMessage` は `message.ts:12` の既存の別名（`MessageEndEvent['message']`）
type AssistantMessage = Extract<AgentMessage, { role: 'assistant' }>;

export function isAssistantMessage(input: unknown): input is AssistantMessage {
  if (typeof input !== 'object' || input === null) {
    return false;
  }
  if (!('role' in input) || input.role !== 'assistant') {
    return false;
  }
  if (!('content' in input) || !Array.isArray(input.content)) {
    return false;
  }
  return true;
}
```

### Steps

1. `.pi/extensions/thinking-scrub/scrub/message.ts`
   1. add: `type AssistantMessage = Extract<AgentMessage, { role: 'assistant' }>` を置く。
   2. add: `isAssistantMessage(input: unknown): input is AssistantMessage` を置く。`object` であること、`role === 'assistant'` であること、`content` が配列であることを順に確かめる（C3, F8）。
   3. update: `scrubMessage` の role と content のガードを、`isAssistantMessage(message)` の 1 つの呼び出しに置き換える。`message` は `AgentMessage` から `AssistantMessage` に狭まる。`next` の型注釈はそのまま残す（狭まった後の `content` は配列である）。

### Policy

- Allowed:
  - 検証する関数の入力は `unknown` にし、型述語で確かめられた型を返す（C3, F8）
  - 確認は既存のコマンドで行う
- Forbidden:
  - `as unknown as T` を使わない - 述語の内側でもキャストを書かない（C3）
  - `isAssistantMessage` の検査を増やさない - いまの 2 つのガードと同じ条件に留める（C2）

### Verify

- Always:
  - `pnpm test:related .pi/extensions/thinking-scrub/scrub/message.ts .pi/extensions/thinking-scrub/scrub/message.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `message.ts` と、それを読む `index.ts`・`message.test.ts`・`index.test.ts` の全体を読み、`scrubMessage` の受け取る型と返す型が変わっていないことを確かめる
- Added:
  - `pnpm suppression-check --report` を作業の前に 1 度、後に 1 度実行する。違反の数が変わらない（このスライスは抑制を消さない）

## 2.ファクトリと 2 つの呼び出し側を同時に変える

`assistantMessage` の契約を `Partial` にする。型に合わない 2 つの呼び出しを正しい形に直し、抑制 1 件を消す。

### Types

```ts
export function assistantMessage(overrides: Partial<PiAssistantMessage> = {}): PiAssistantMessage {
  const base: PiAssistantMessage = {
    role: 'assistant',
    content: [{ type: 'thinking', thinking: degenerate(), thinkingSignature: 'reasoning_content' }],
    api: 'openai-completions',
    provider: 'opencode-go',
    model: 'deepseek-v4.1-flash',
    usage: piUsage(),
    stopReason: 'stop',
    timestamp: 123,
  };
  return Object.assign({}, base, overrides);
}
```

### Steps

1. `.pi/extensions/thinking-scrub/scrub.fixture.ts`
   1. update: `assistantMessage` の引数を `Partial<PiAssistantMessage>` にする（C2, F8）。
   2. update: `base` に `PiAssistantMessage` の注釈を付け、戻り値を `Object.assign({}, base, overrides)` にする。合併型へのスプレッドは落ちるためである（C2, F4）。
   3. drop: 81 行目の抑制コメントを消す（C2）。

2. `.pi/extensions/thinking-scrub/index.test.ts`
   1. add: `import type { ThinkingBlock } from './scrub/message.ts';` を足す。`ThinkingContent` は `@earendil-works/pi-coding-agent` が公開していないため、`message.ts` が持つ `ThinkingBlock` を使う。
   2. update: `assistantThinking` の `block` を `Record<string, unknown>` ではなく `ThinkingBlock` として型付けする（C2, F8）。

      ```ts
      const block: ThinkingBlock =
        signature === undefined
          ? { type: 'thinking', thinking }
          : { type: 'thinking', thinking, thinkingSignature: signature };
      ```

3. `.pi/extensions/thinking-scrub/scrub/message.test.ts`
   1. add: `./message.ts` の import に `isAssistantMessage` を足す。
   2. add: `type AgentMessage = MessageEndEvent['message']` の隣に `type UserMessage = Extract<AgentMessage, { role: 'user' }>` を置く。`UserMessage` は `@earendil-works/pi-coding-agent` が公開していないため、`AgentMessage` から取り出す。
   3. update: `role: 'user'` を上書きするテストを、本物の `UserMessage` を作って `scrubMessage` に渡す形にする（C2, F8）。

      ```ts
      const user: UserMessage = {
        role: 'user',
        content: [{ type: 'text', text: degenerate() }],
        timestamp: 1,
      };
      expect(scrubMessage(user, tuning)).toBeUndefined();
      ```

   4. update: `content` に `Set` を渡すテストを、`isAssistantMessage` に直接渡す形にする（C2, F8）。

      ```ts
      expect(isAssistantMessage({ role: 'assistant', content: blocks })).toBe(false);
      ```

### Policy

- Allowed:
  - 偽物は正しい型の値を作り、型に合わない値を渡すときは `unknown` を受ける関数に直接渡す（C3, F8）
  - 既定値に上書きを重ねるときは `Object.assign` を使う（F4）
  - 確認は既存のコマンドで行う
- Forbidden:
  - `Record<string, unknown>` を受けない - 31 か所の呼び出しを型の外に置くためである（C3, F8）
  - テストの期待を変えない - 変えるのは ADR の `Update` が決めた `content` が配列でないテスト 1 か所だけであり、それ以外の期待はそのままにする（C2）
  - 題名に `happy:` などの接頭辞を付けない - このファイルの題名の形を変えず、ADR の `values & expression` は題名の追加を述べていない

### Verify

- Always:
  - `pnpm test:related .pi/extensions/thinking-scrub/scrub.fixture.ts .pi/extensions/thinking-scrub/index.test.ts .pi/extensions/thinking-scrub/scrub/message.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えた 3 ファイルと、それらが読む `scrub/message.ts` の全体を読み、`assistantMessage` の 31 か所の呼び出しがすべて `Partial<PiAssistantMessage>` で表せることを確かめる
- Added:
  - `pnpm suppression-check --report` を作業の前に 1 度、後に 1 度実行する。違反が 1 件減る（`scrub.fixture.ts:81`）

## Notes

### Slice 1: ガードを unknown から受ける型述語にする

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 2: ファクトリと 2 つの呼び出し側を同時に変える

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
