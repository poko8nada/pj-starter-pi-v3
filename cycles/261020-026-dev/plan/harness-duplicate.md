# PLAN `harness-duplicate`

## Files

```text
scripts/
  harness/
    index.mjs                update
    index.test.ts
```

## 1.重複を消す

### Types

なし

### Steps

1. `scripts/harness/index.mjs`:
   - `~` と `~/` の枝と `~foo` の枝を、`if (expanded.startsWith('~'))` の 1 本にまとめる。本文は `path.join(os.homedir(), expanded.slice(1))` のまま。
   - `rootAbs` を `path.resolve(root)` にする。

### Verify:

- read: `review` サブエージェントが `scripts/harness/index.mjs` を読み、次を報告する
  - (happy) `expanded` の分岐 → `if (expanded.startsWith('~'))` が 1 本だけで、`else if` が無い
  - (happy) `expanded` の `if` の本文 → `path.join(os.homedir(), expanded.slice(1))` で、`~`、`~/x`、`~foo` を同じ本文で扱う
  - (happy) `rootAbs` → `path.resolve(root)` で、両枝同一の三項が無い
  - _no case_: 振る舞い — テストでは区別できない（同じ結果）。acceptance で `scripts/harness/index.test.ts` と `pnpm test:run` を回す

## Notes

### Slice 1: 重複を消す

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
