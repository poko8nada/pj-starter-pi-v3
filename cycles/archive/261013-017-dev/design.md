# DESIGN 017

## `harness-typecheck`

### ADR & Where

- No: 01, 04
- Why: 型チェックの意味を揃える変更（01）と、そこで見える赤を消す変更（04）は、同じ検査の結果を読むので 1 つの worktree にする。
- Where: worktree

### Scope

- `Unit.type-check`:
  - `scripts/harness-scopes.json` を足し、`scripts/typecheck.mjs` がルートと一覧の各所を回るようにする
  - `scripts/typecheck-staged.mjs` は同じ一覧を読み、無ければルートに落とす
- `Unit.usage-readme`: 検査の表と「On push」「On every agent turn」の文を、新しい形に合わせる
- `Unit.intent-router`: `settings.ts` の書きかけの型と解決済みの型を分け、`judge.ts` / `route.ts` の赤 3 件を消す

### Boundary

- Plans: なし
- External: なし

## `product-ready-list`

### ADR & Where

- No: 02
- Why: `product-ready` が消す物にハーネスの型チェックの一覧が入るので、`harness-typecheck` を待つ。
- Where: worktree

### Scope

- `Unit.product-ready`: 一覧を 1 本（`STARTER_ONLY`）にし、入口を 1 つにし、`--only <label>` で個別に回せるようにする

### Boundary

- Plans:
  - `harness-typecheck`: それが作る `scripts/harness-scopes.json` を、消す一覧の 1 行（`harness`）として載せる
- External: なし
