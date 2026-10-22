# PLAN `ex-prune-state`

## Files

```text
.pi/extensions/context-prune/
  prune/
    judge.ts              update
    judge.test.ts         update
    run.ts                update
    run.test.ts           update
  README.md               update
```

## Slices

## 1.候補を state から質問文へ移す

### Types

```ts
// .pi/extensions/context-prune/prune/judge.ts
/** 質問の前置き。候補に依らない */
export const NEED_INSTRUCTIONS: string;
/** criteria の keep / drop */
export const NEED_CRITERIA: Readonly<Record<string, string>>;
/** 候補 1 件を質問文に埋め込んだ 1 問 */
export function questionFor(candidate: Candidate): ClassifierQuestion;
/** 質問 1 件ぶんのトークン見積もり。前置きと候補を合わせて数える */
export function questionTokens(candidate: Candidate): number;
/** state は要約の view だけ。候補は questions の instructions に埋め込む */
export function judgeRequest(summary: string, candidates: readonly Candidate[]): JudgeRequest;
```

### Steps

1. `.pi/extensions/context-prune/prune/judge.ts`:
   - `NEED_INSTRUCTIONS` と `NEED_CRITERIA` を置き、`questionFor(candidate)` が `tool` / `args` / `chars` / `result` の行を含む `instructions` を組み立てる。
   - `questionTokens(candidate)` を `questionFor` と `NEED_CRITERIA` の見積もりにし、非公開の `itemTokens` を置き換える。
   - `judgeRequest` の `state` を `{ summary: view }` だけにし、`questions` は `questionFor` で作る。
2. `.pi/extensions/context-prune/prune/judge.test.ts`:
   - `state` に `candidates` が無いこと、`instructions` に `tool: <name>` の行・`args:`・`chars:`・`result:` が入ること、`criteria` が `keep` / `drop` であることを試験する。
   - `questionTokens` が抜粋の長さに応じて増えることを試験する。
3. `.pi/extensions/context-prune/prune/run.ts`:
   - `fixed` を `classifierTokens(view)` だけにする（今は最初の候補の質問 JSON を数えており、候補が質問文に入ると二重に数える）。
4. `.pi/extensions/context-prune/prune/run.test.ts`:
   - 予算の分割の試験を、具体的な長さと件数で書き直す。
5. `.pi/extensions/context-prune/README.md`:
   - Pass の説明に「state は要約、候補は質問文」を書く。

### Verify:

- test: `pnpm test:run .pi/extensions/context-prune`
  - (happy) `judgeRequest` の `state` は `summary` だけを持ち、`candidates` キーが無い
  - (happy) 質問の `instructions` に `tool: read` の行、`args:`、`chars:`、`result:` が入る
  - (happy) 質問の `criteria` のキーが `keep` と `drop`
  - (happy) `questionTokens` は抜粋 1,000 文字の候補で、500 文字の候補より大きい
  - (empty) 候補 0 件 → `questions` が空で、`state` は `summary` だけ
  - (boundary) 候補 1 件が予算を超える → その 1 件だけの束になる
  - (happy) view 1,000 文字・抜粋 1,000 文字の候補 100 件 → 2 束以上に割れる

## Notes

### Slice 1: 候補を state から質問文へ移す

- Findings: なし
- Unplanned: なし
- Commit: 1657724

## Review

### Round 1

- Stale:
  - なし（`.pi/extensions/context-prune/README.md:8` が state 要約のみ・候補は質問文に更新済み、`prune/judge.ts:100-101` の fixed コメ・`prune/judge.ts:88,104` のコメも更新済み。`candidates` を state に持つ残存は汎用治具のみで本文・コメに残存なし）
- Unlisted:
  - なし（diff の 5 files が Files の 5 件と一致）
- Gaps:
  - なし（Verify の 7 項目：state 要約のみ・instructions 4 行・criteria 鍵・questionTokens 単調・empty・boundary 単束・100 件→2 束以上が `.pi/extensions/context-prune/prune/judge.test.ts:35,43,69,84,92,190,197` と `.pi/extensions/context-prune/prune/run.test.ts:71,94` で全て行われている）
- Unproven:
  - なし（上記 7 件の各試験は反転時に赤になる：state に candidates 復活・ラベル除去・鍵入替・定数化・empty に質問追加・boundary を空・100 件を 1 束にすると失敗）
- Doubts:
  - `.pi/extensions/context-prune/prune/ports.test.ts:39`・`.pi/extensions/context-prune/index.test.ts:765` の `state: { summary, candidates: [] }` 治具は汎用 passthrough 用で judge 仕様と無関係のため stale にしない（前回 Round 1 の yes/no 治具と同理由）。
  - `.pi/extensions/context-prune/prune/judge.test.ts:46-49` が criteria 値を `expect.any(String)` でしか見ない点は Verify が鍵のみ要求のため finding にしない（前回と同理由）。
  - `questionTokens` を旧 `itemTokens` 式（excerpt+args+tool）に戻しても `.pi/extensions/context-prune/prune/judge.test.ts:92,190` は単調・2 束以上で緑のままだが、Verify が単調と束数のみ要求のため finding にしない。32000・500 文字・英語化は ADR/plan の決定値のため指摘しない。
  - `fixed` を旧 `view+質問 JSON` に戻しても `.pi/extensions/context-prune/prune/run.test.ts:71,94` は 2 束以上で緑のままだが、Verify が束数のみ要求のため finding にしない。
  - `.pi/extensions/context-prune/prune/judge.test.ts:35` の 2 件試験が鍵しか見ず候補依存（tool 違いで文が変わる）を証明しない点は Verify が read のみ要求のため finding にしない。

## Acceptance

- Ran: `pnpm test:run`（64 files / 1036 tests）、`pnpm typecheck`（root / .pi とも ok）、`pnpm lint`（指摘なし）、`pnpm format:check`（差分なし）。
- Ran: 壊し試験 2 つ。`judgeRequest` が候補を state に戻す → 3 件 red。`questionFor` から `tool:` の行を外す → 2 件 red。どちらも復元後に再実行して緑。
- Findings: なし
- Doubts: なし
