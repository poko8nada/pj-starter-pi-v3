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

- Findings:
- Unplanned:
- Commit:

## Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Unproven:
- Doubts:

## Acceptance

- Ran:
- Findings:
- Doubts:
