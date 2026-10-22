# DESIGN 032

## Affected

### 01: `/prune` のカードで、落とした量が分かるか

- `.pi/extensions/context-prune/index.ts` — `createCard` と `runPass` を読む
- `.pi/extensions/context-prune/command/prune.ts` — `PrunePass` と `formatCount` を読む
- `.pi/extensions/context-prune/apply/drafts.ts` — `PrunePass` と `formatCount` を読む
- `.pi/extensions/context-prune/entry/data.test.ts` — `isPrunePass` と `passesOf` を検査する
- `.pi/extensions/context-prune/entry/render.test.ts` — `cardText` と `createCard` を検査する
- `.pi/extensions/context-prune/format/count.test.ts` — `formatCount` を検査する
- `.pi/extensions/context-prune/prune/run.test.ts` — `runPass` を検査する
- `.pi/extensions/context-prune/index.test.ts` — `isPrunePass` と `PassPorts` を検査する
- `.pi/extensions/context-prune/command/prune.test.ts` — `PrunePass` を組み立てて `statusLines` を検査する
- `.pi/extensions/context-prune/apply/drafts.test.ts` — `PrunePass` を組み立てて `markerText` を検査する
- `.pi/extensions/context-prune/doc.test.ts` — README の見出しと `DEFINITION.md` の 1 行を検査する
- 生成: なし

### 02: `intent-router` を削除するか

- なし

## External

### 01: `/prune` のカードで、落とした量が分かるか

- `@earendil-works/pi-tui` — カードの折りたたみと展開を、`Box` / `Container` / `Markdown` / `MouseRegion` / `Spacer` / `Text` で描く
- `@earendil-works/pi-coding-agent` — テーマ（`getMarkdownTheme`）と展開キー（`keyText`）、`SessionEntry` の型を使う

### 02: `intent-router` を削除するか

- なし

## `prune-card-tokens`

### ADR & Where

- No: 01
- Why: 記録のフィールドと、それを使うカードの文面を同じ plan で変える。記録が無いと文面が出せず、他の plan とパスが重ならない。
- Where: base（owner が `/prune now` のカードを見る）

### Summary

- `/prune` のカードに、落とす前後のトークンと、落とした件数・トークン・文字数を出す。

### Paths

- `.pi/extensions/context-prune/entry/data.ts`
- `.pi/extensions/context-prune/entry/data.test.ts`
- `.pi/extensions/context-prune/entry/render.ts`
- `.pi/extensions/context-prune/entry/render.test.ts`
- `.pi/extensions/context-prune/prune/run.ts`
- `.pi/extensions/context-prune/prune/run.test.ts`
- `.pi/extensions/context-prune/index.test.ts`
- `.pi/extensions/context-prune/command/prune.test.ts`
- `.pi/extensions/context-prune/apply/drafts.test.ts`
- `.pi/extensions/context-prune/README.md`

### Boundary

- Plans: なし
- External:
  - `@earendil-works/pi-tui`: カードを今の部品で描く
    - Contract: `Box` / `Container` / `Markdown` / `MouseRegion` / `Spacer` / `Text`
  - `@earendil-works/pi-coding-agent`: テーマと展開キーと型を使う
    - Contract: `getMarkdownTheme` / `keyText` / `SessionEntry`

## `drop-intent-router`

### ADR & Where

- No: 02
- Why: 入力は `.pi/extensions/intent-router/` とその参照 4 つ（`DEFINITION.md`・`definition/rules.md`・`README.md`・`README.ja.md`）で、拡張を消すだけでは参照が残るので同じ plan で消す。待つ plan は無い。
- Where: worktree

### Summary

- `.pi/extensions/intent-router/` を設定と記録ごと削除し、参照を消す（`grep -r intent-router` が 0 件になることで確かめる）。

### Paths

- `.pi/extensions/intent-router/`
- `DEFINITION.md`
- `definition/rules.md`
- `README.md`
- `README.ja.md`

### Boundary

- Plans: なし
- External: なし
