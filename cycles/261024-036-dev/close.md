# Close 036

## Collected

### close-records (ADR 02)

1. 137 / Review Round 1 / 冒頭の仕組み注記（.pi/skills/close/scripts/collect.mjs:3）はplan mdのNoのみに読めますが、ex-の出所は詳細注記（.pi/skills/close/scripts/collect.mjs:241,353）で補われているためfindingとしませんでした。
   - Doing: `collect.mjs` の `noOf` は通常 plan の `No` を plan md から、`ex-` plan の `No` を `Triage` から読む（詳細注記は `.pi/skills/close/scripts/collect.mjs:241` と `353`）。
   - Left: 冒頭注記（`.pi/skills/close/scripts/collect.mjs:3`）は plan md の `No` だけを述べ、`ex-` の出所は詳細注記が補う。review は finding ではなく `Doubts` とした。
   - Cost: 冒頭注記だけを読むと `ex-` の `No` を plan md から読むと誤解する。詳細注記が正す。修正は冒頭コメント。

### yolo-pass (ADR 03)

2. 137 / Review Round 2 / `.pi/skills/design/references/format.md:95` — fixed confirmed: `## Where` に yolo 例外の一文が `references/format.md:96` にあり、`design/SKILL.md:59` の同文と一致することを確認しました。`Files` には `design/references/format.md update` が含まれており、Stale は解消されています。
   - Doing: `design/references/format.md` の `## Where` と `design/SKILL.md:59` に yolo の行を置いた。
   - Left: review の Stale を `4787c30` で直し、`Files` に `design/references/format.md` を足した。Round 2 が一致を確認した。
   - Cost: なし。修正は入っている。

## Triage

- 1: done eb8e9eaa2630355559f2dd1b7bce88a04461a45b (ADR 02, close の記録): collect.mjs の冒頭注記が plan md の No のみに読める。詳細注記が ex- の出所を補う。冒頭コメントを直した。
- 2: dropped (ADR 03, yolo の work): review の Stale は 4787c30 で修正済み。Round 2 が確認。修正は入っている。

## Verified

### design-skill

- Plans:
  - `close-records`
  - `yolo-pass`
- Result: しない — 実行する function ではなく、skill の文面。owner は design / plan / work の各段で文面を読み、判断している。

### plan-skill

- Plans:
  - `close-records`
- Result: しない — `ex-` の `No` の出所を `Triage` に揃えた文面の変更で、実行する function ではない。

### work-skill

- Plans:
  - `close-records`
  - `yolo-pass`
- Result: しない — `base` の hash / `Stopped` と `Added` の例外の文面。owner は work の slice ごとに確認した。

### yolo-skill

- Plans:
  - `close-records`
  - `yolo-pass`
- Result: しない — yolo の pass と base の扱いの文面。owner は slice ごとに確認した。
