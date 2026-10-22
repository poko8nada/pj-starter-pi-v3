# PLAN `prune-card-tokens`

## Files

```text
.pi/extensions/context-prune/
  entry/
    data.ts               update
    data.test.ts          update
    render.ts             update
    render.test.ts        update
  prune/
    run.ts                update
    run.test.ts           update
  command/
    prune.ts
    prune.test.ts         update
  apply/
    drafts.ts
    drafts.test.ts        update
  index.test.ts           update
  README.md               update
```

## Slices

## 1.記録に、落とした結果のトークンを足す

### Types

```ts
// .pi/extensions/context-prune/entry/data.ts
export interface PrunePass {
  readonly at: number;
  readonly tokensBefore: number;
  /** 落とした結果の見積もり。tokensBefore から引くと、落とした後の値になる */
  readonly droppedTokens: number;
  readonly summary: string;
  readonly dropped: readonly Drop[];
  readonly droppedChars: number;
  readonly kept: number;
  readonly latencyMs: number;
  readonly usage: Usage | undefined;
}
```

### Steps

1. `.pi/extensions/context-prune/entry/data.ts`:
   - `PrunePass` に `droppedTokens` を足し、`isPrunePass` で数値（有限・0 以上）として検査する。
   - これで、この項目を持たない古い記録はパスとして通らなくなる（ADR 01 の「古い記録はむしする」）。
2. `.pi/extensions/context-prune/prune/run.ts`:
   - 落とす候補の `chars` から `Math.ceil(chars / 4)` を**1 件ずつ**足し、パスの `droppedTokens` に入れる（`estimateTokens` と同じ数え方。合計してから割らない）。
3. `.pi/extensions/context-prune/entry/data.test.ts`:
   - `droppedTokens` を持つ記録を通し、持たない記録・負値の記録を弾く試験を足す。
4. `.pi/extensions/context-prune/prune/run.test.ts`:
   - 落とした候補の合計が `droppedTokens` になる試験と、候補が全部 keep のときに 0 になる試験を足す。
5. `.pi/extensions/context-prune/command/prune.test.ts`、`.pi/extensions/context-prune/apply/drafts.test.ts`、`.pi/extensions/context-prune/index.test.ts`:
   - `PrunePass` を組み立てている治具に `droppedTokens` を足す。

### Verify:

- test: `pnpm test:run .pi/extensions/context-prune`
  - (happy) `droppedTokens: 102` を持つ記録 → `isPrunePass` が真
  - (empty) `droppedTokens` を持たない記録 → `isPrunePass` が偽（古い記録はむしされる）
  - (error) `droppedTokens: -1` → `isPrunePass` が偽
  - (error) `droppedTokens: Infinity` → `isPrunePass` が偽
  - (happy) 201 文字と 201 文字の結果を落とす → `droppedTokens` が 102（合計してから割った 101 ではない）
  - (boundary values) 候補があるが全部 keep → `droppedTokens` が 0
  - (empty) 候補が 0 件 → `droppedTokens` が 0

## 2.カードの文面を、前後のトークンと件数にする

### Types

```ts
// .pi/extensions/context-prune/entry/render.ts（形は変えない。文面だけが変わる）
export function cardText(pass: PrunePass, expanded: boolean, expandKey: string): readonly string[];
export function createCard(pass: PrunePass, theme: Theme, outputPad?: number): Component;
```

### Steps

1. `.pi/extensions/context-prune/entry/render.ts`:
   - 折りたたみを `Compacted from {前} → {後} tokens ({expandKey} to expand)` にする。後は `tokensBefore - droppedTokens`。
   - 展開を、見出し `**Compacted from {前} → {後} tokens**`、空行、要約、空行、`省略: {件数} 件 / {トークン} トークン / {文字数} 文字`、`要約と判定: {秒} 秒` の順に並べる。
   - `formatCount` を数字の整形に使う。
2. `.pi/extensions/context-prune/entry/render.test.ts`:
   - 折りたたみと展開の文面の試験を、新しい並びに差し替える。展開キーは既定値と違う文字列（`ctrl+e`）を渡す。

### Verify:

- test: `pnpm test:run .pi/extensions/context-prune`
  - (happy) `cardText(pass, false, 'ctrl+e')` → `Compacted from 12,345 → 11,036 tokens (ctrl+e to expand)`
  - (happy) `cardText(pass, true, 'ctrl+e')` → 見出し、要約、空行、`省略: 3 件 / 1,309 トークン / 1,234 文字`、`要約と判定: 1.2 秒` の順
  - (boundary values) `droppedTokens` が 0 → `12,345 → 12,345`
  - (empty) 落とした候補が 0 件 → `省略: 0 件 / 0 トークン / 0 文字`
  - _no case_: 展開したカードの描画 — Markdown がグローバルなテーマを要求し、試験環境では初期化できない。文面は `cardText` で確かめている

## 3.統合: README とカードが一致し、owner がカードを開いて確かめる

### Types

```ts
なし;
```

### Steps

1. `.pi/extensions/context-prune/README.md`:
   - カードの節を、折りたたみと展開の実際の文面に合わせて直す。
2. pi を reload し、owner が `/prune now` を 1 回叩いてカードを開く。

### Verify:

- look: owner が実機のカードと、`README.md` のカードの節を読む
  - (happy) 折りたたみに、`{前} → {後} tokens` と展開キーが出ている
  - (happy) 展開に、件数・トークン・文字数の行、秒数の行、その後に要約がこの順で出ている
  - (happy) `README.md` のカードの節の文面が、実機のカードと同じ形
  - (boundary values) 落とした件数が 0 のパスの表示は、テスト（slice 2）で確かめているので、ここでは見ない

## Notes

### Slice 1: 記録に、落とした結果のトークンを足す

- Findings: なし
- Unplanned: なし
- Commit: d32ca80

### Slice 2: カードの文面を、前後のトークンと件数にする

- Findings:
  - `entry/render.ts` の展開の描画（`paintExpanded`）を試験で通せない。Markdown がグローバルなテーマを要求し、試験環境では初期化できない。
    - left: 文面は `cardText` で確かめており、描画は同じ helper を並べるだけ。
- Unplanned: なし
- Commit: 339d036

### Slice 3: 統合: README とカードが一致し、owner がカードを開いて確かめる

- Findings: なし
- Unplanned: owner の `look` で、展開の並びが読みにくいと出た（件数が先で、要約が最後）。`cardText`、`paintExpanded`、`render.test.ts`、`README.md` を「見出し、要約、空行、省略、秒数」に直した
- Commit: f383bd4（並びを直した commit。owner の `look` は修正後に通った）

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
