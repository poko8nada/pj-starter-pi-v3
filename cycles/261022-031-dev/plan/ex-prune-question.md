# PLAN `ex-prune-question`

## Files

```text
.pi/extensions/context-prune/
  prune/
    judge.ts              update
    judge.test.ts         update
  README.md               update
```

## Slices

## 1.質問を「後に要るか」にする

### Types

```ts
なし;
```

### Steps

1. `.pi/extensions/context-prune/prune/judge.ts`:
   - `instructions` を「後に読む・引用する・使う何かを持つか」に変え、`criteria` のキーを `keep` / `drop` にする。
   - `verdicts` が `probabilities.keep` を読み、`threshold` 以上を keep にする。
2. `.pi/extensions/context-prune/prune/judge.test.ts`:
   - 質問文と criteria のキーの試験を差し替え、`probabilities.keep` の読みの試験を足す。
3. `.pi/extensions/context-prune/README.md`:
   - Pass の説明の「要約の話題に関係あるか」を「後に要るか」に直す。

### Verify:

- test: `pnpm test:run .pi/extensions/context-prune`
  - (happy) `criteria` のキーが `keep` と `drop`
  - (happy) `instructions` に `need` が入り、日本語を含まない
  - (happy) `probabilities: { keep: 0.8 }` → keep
  - (boundary) `probabilities: { keep: 0.5 }` → keep（`threshold` は 0.5）
  - (error) `probabilities: { keep: 0.2 }` → drop
  - (empty) 答えが無い → keep（fail-open）

## Notes

### Slice 1: 質問を「後に要るか」にする

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
