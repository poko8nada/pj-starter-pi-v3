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

- Findings: なし
- Unplanned: なし
- Commit: 5c401f34052ce69d6e24cff838b097b57408b7c1
- Stopped: なし

### Slice 2: ファクトリと 2 つの呼び出し側を同時に変える

- Findings: なし
- Unplanned: なし
- Commit: a757a8a96842ed210138ae19e2f1fa9b9cdcd5e9
- Stopped: なし

### Cleanup: ずれた題名と置き場所

- Findings: なし
- Unplanned:
  - `scrub/message.test.ts` の role テストの説明を直した（`happy test と同じ` → `text の user`）。スライス 2 で本文が text に変わり、説明が実態とずれていたため、ここで直した。
  - `content` が配列でないテストを `describe('scrubMessage')` から `describe('isAssistantMessage')` に移し、題名を `false になる` に、説明を `Set は iterable だが配列でないため` に直した。スライス 2 で対象が `isAssistantMessage` に変わり、題名（`undefined`）と置き場所がずれていたため、ここで直した。

## Work Review

### Round 1

- Stale: なし — コメント・題名は差分後の実態と一致し、冗長な文はない（`.pi/extensions/thinking-scrub/scrub/message.ts:57` の説明は述語の 3 段階と一致、`scrub/message.test.ts:107,224` の説明は user/text と Set/配列でない対象と一致）。`next` の注釈残置（`message.ts:78`）は plan Slice 1 Steps が決めた値のため対象外。
- Unlisted: なし — コード差分は Files の 4 ファイル（`message.ts`・`message.test.ts`・`scrub.fixture.ts`・`index.test.ts`）に収まり、`index.ts` は無変更。plan md の Notes 追記は作業記録であり Files の対象外。
- Gaps: なし — Goal の 2 要素（unknown 述語での assistant 判定、Partial による偽物の型保護）は Defined/Undefined 系テストと typecheck で exercise される。null・キー欠落の直撃テストはないが、`design.md` の「境界値は単独のテストにしない」に従うため gap としない。
- Policy: なし — Slice 1・2 の Allowed/Forbidden を保持。述語内にキャストなし（`message.ts:58-69`）、検査は 2 ガードに留まる、`Record` 受けなし（`scrub.fixture.ts:70`・`index.test.ts:37`）、`Object.assign` 使用（`scrub.fixture.ts:81`）、期待変更は content の 1 か所のみ、接頭辞なし。残存する evil の `Record`/cast（`index.test.ts:643,650`）は ADR 04 C1 で残すと決めた値のため対象外。
- Unproven: なし — role テスト（`scrub/message.test.ts:106-114`）は text 系 user のため単独では role ガード単体の破壊を見逃しうるが、前提値（text の user・`timestamp: 1`）は plan Slice 2 Steps と ADR Update が決めた値のため除外規定により finding としない。他に単独で green のまま残るテストはない（常時 false 化は Defined 系で検出される）。
- Noise: なし — 新規の数値・文字列は plan/ADR の決定値（fixture 既定値、`timestamp: 1`、thinking 署名等）のため対象外。型・spec が保証する前提の再現テストなし。新規の抑制コメントなし（1 件削除のみ）。
- Doubts: なし — 上記の role テストの弱さは plan/ADR の決定のため doubt とせず、所有者判断を求める事項はない。

### Round 2

- Stale:
- Unlisted:
- Gaps:
- Policy:
- Unproven:
- Noise:
- Doubts:

## Acceptance

- Goal: `thinking-scrub` が、assistant かを `unknown` から型述語で確かめ、テストの偽物を型で守る。実装は達成している（`scrub/message.ts` の `isAssistantMessage` と `scrub/message.ts` の `scrubMessage` の 1 呼び出しへの置換、`scrub.fixture.ts` の `Partial<PiAssistantMessage>` と `Object.assign`）。
- Ran: `pnpm typecheck`、`pnpm lint`、`pnpm format:check`、`pnpm test:run`（69 ファイル、902 件）、`pnpm suppression-check`（15 件から 14 件に減ることを確かめた）。
- Findings: なし
- Doubts: なし
