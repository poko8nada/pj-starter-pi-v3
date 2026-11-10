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

- Findings:
  - なし
- Unplanned:
  - なし
- Commit:
  - 12f7294 consult(ex-role-order-fallback): export roleOrder with dir fallback test
- Stopped:
  - なし

### Cleanup: roleOrder テストの重複と前提の見直し

- Findings:
  - なし
- Unplanned:
  - なし

## Work Review

### Round 1

- Stale:
  - なし — `.pi/extensions/consult/index.ts:108-115` のコメント更新と export 化が既存 doc・comment を古くしないことを確認。`README.md` に `roleOrder` の記載なし、`view/widget.ts:5-6` の順序説明と矛盾なし、既存 widget／`showRunningOnce` テストは既定ルートのまま緑。姉妹 plan `01-running-widget.md:80` の旧署名は履歴記録のため対象外。
- Unlisted:
  - なし — 差分のコード変更は `Files` 指名内（`.pi/extensions/consult/index.ts`、`.pi/extensions/consult/index.test.ts`）に収まる。`policy/types.ts` と `test/temp-dir.ts` は関連参照のまま変更なし（import のみ）。plan md 自体の更新は記録のため対象外。
- Gaps:
  - なし — `Goal` の読み失敗フォールバックは `index.test.ts:274-283` の happy（既定ルート→並び）と empty（一時 dir→`[]`）で exercised。壊れた JSON も `index.ts:110-114` の同一 `catch` で `[]` に倒れる同一経路のため、missing での確認で経路は覆われる。`Steps` が決めた 2 ケースどおりで、`Added: なし` の追加確認も要らない。
- Policy:
  - なし — `Forbidden`（表示の更新が失敗しても実行・音・完了報告を止めない）を保持。`roleOrder` は例外を握って `[]` を返し、呼び出し側 `showRunningOnce`（`index.ts:117-129`）と `startTick`（`index.ts:157-161`）の try／catch も残る。export 化で投げない性質は変わらない。
- Unproven:
  - なし — happy を `[]` 固定に壊すと `loadTypes` 比較（`index.test.ts:275-278`）で赤、empty を既定読みに壊すと `[]` 比較（`index.test.ts:280-282`）で赤、`catch` を外すと empty が throw で赤、`dir` 引数無視も empty で検出できる。oracle は `Steps` の決定値のため finding 化しない。
- Noise:
  - なし — 2 ケースは `Steps` の決定値どおりで、magic number／hardcoded な期待値なし（`[]` と `loadTypes` 由来の比較のみ）。型・schema が保証する前提の再現や、誰も気づかないアサーションなし。
- Doubts:
  - なし

### Round 2

- Stale:
- Unlisted:
- Gaps:
- Policy:
- Unproven:
- Noise:
- Doubts:

## Acceptance

- Goal: 達成している。`roleOrder()` の読み失敗のフォールバック（`[]`）と、既定のルートの並びが、テストで確かめられている。
- Ran:
  - `pnpm test:run`: 64 ファイル、797 件が通った（ワークツリー）。
  - `pnpm typecheck`: `root: ok`、`.pi: ok`。
  - `pnpm lint`: 指摘なし。
  - `pnpm format:check`: すべて整っている。
  - `pnpm test:related .pi/extensions/consult/index.ts .pi/extensions/consult/index.test.ts`: 17 件が通った。
  - 壊して赤を確かめた: `roleOrder` が常に `[]` を返す → 1 件が赤、`dir` を無視して `EXTENSION_DIR` を読む → 1 件が赤。2 つとも戻した。
- Findings: なし
- Doubts: なし
