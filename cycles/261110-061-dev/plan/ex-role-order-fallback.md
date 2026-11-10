# PLAN `ex-role-order-fallback`

- Place: worktree
- Boundary Plans: なし

## Goal

`roleOrder()` の読み失敗時のフォールバックが、テストで確かめられている。

## Design

- Inside:
  - Modules: なし。対象は `roleOrder` の引数とテスト 1 ファイルだけである。
  - Dirs: なし。
- Outside:
  - Extract: なし。
  - Colocate: なし。

## Files

```text
.pi/extensions/consult/
  index.ts                        update
  index.test.ts                   update
  policy/
    types.ts
test/
  temp-dir.ts
```

## Slices

## 1.読み失敗のテスト

`roleOrder()` が `types.json` を読めないときのフォールバックを、テストで確かめます。

### Types

```ts
/** 表示に並べる役割の順序。`types.json` の並びを読み込み、失敗時は空の配列を返す */
export function roleOrder(dir = EXTENSION_DIR): readonly string[];
```

### Steps

1. `.pi/extensions/consult/index.ts`
   1. update: `roleOrder` を export し、引数 `dir = EXTENSION_DIR` を受け取り、`loadTypes(dir)` で読み込む。
2. `.pi/extensions/consult/index.test.ts`
   1. update: テストは次のケースをもつ。既定のルートは `dirname(fileURLToPath(import.meta.url))` で求め、`roleOrder()` と `loadTypes(求めたルート).map((type) => type.name)` を比べる。`types.json` のないディレクトリは `tempDir()` で作る。

      - `roleOrder`: (happy) 既定のルートで呼ぶ → `types.json` の並びを返す
      - `roleOrder`: (empty) `types.json` のない一時ディレクトリで呼ぶ → `[]` を返す

### Policy

- Forbidden:
  - consult は、表示の更新が失敗しても、サブエージェントの実行も音も完了報告も止めない - 表示は補助であり、実行の成否に関係しない。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/consult/index.ts .pi/extensions/consult/index.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、挙げたファイルを読み、読む順に手順をたどり、番号、パス、名前、形を照らし合わせ、不整合を直す
- Added: なし

## Notes

### Slice 1: 読み失敗のテスト

- Findings: なし
- Unplanned: なし
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
