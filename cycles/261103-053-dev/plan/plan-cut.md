# PLAN `plan-cut`

- No: 04, 05
- Place: base
- Boundary Plans: `design-removal` (01) は、同じ `work` と `close` の design の参照を先に消し、`work` が plan md の `Place` と `Boundary Plans` を、`close` が adr のエントリーと plan md の `No` と `Boundary Plans` を読む形にする。`adr-affected` (02) は、`affected.md` を先に書き、この plan の `Paths` と `Boundary.External` の出所になる。

## Files

```text
.pi/skills/plan/
  SKILL.md                update
  references/
    format.md             update
    tasks.md              update
    cut.md                add
```

## Slices

## 1.plan の分割の提示と plan md の Boundary Plans

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/plan/references/cut.md`:
   - add: design の `## Cut` と `## Where` を移す。切る対象、同じ入力を読む作業を1つの plan にまとめること、分ける前の4問、`worktree` と `base` の既定と条件、yolo の扱いを書く。
2. `.pi/skills/plan/SKILL.md`:
   - update: `description` の design を、分割の提示に直す。
   - update: 手順1を、adr のエントリーと plan md の `No`、`Place`、`Boundary Plans` を読むように直す。
   - update: 手順に、分割の提示（plan 名、`ADR`、`Place`、`Summary`、`Why`、実行順を英語のラベルで書く）と、オーナーの合意後に plan md を書く流れを足す。
   - update: 手順6に、`Place` と `Boundary Plans` を書くことを足す。
   - update: `What is not here` の design を、plan に直す。
   - update: `Do not copy the design or the ADR` を `Do not copy the ADR` に直す。
   - update: 本文の「written from the cycle's design and ADR」を「written from the ADR」に直す。
   - update: 手順4にある「The place is the design's」を、plan md の `Place` に直す。
   - update: 手順9のレビューにある `design's Goal` と `Non-goal` を、adr のエントリーの `Adopted` と `Scope` に直す。
   - update: 手順10と `Changes after this` の `design's Boundary.Plans` を、plan md の `Boundary Plans` に直す。
3. `.pi/skills/plan/references/format.md`:
   - update: `No` を adr のエントリーの番号に直し、`Place` と `Boundary Plans` を足す。
   - update: `Goal`、`Non-goal`、`Summary`、`Paths`、`Boundary`、`Why`、`Where` の design にある欄への参照を消し、`Boundary Plans` の欄に直す。
   - update: `## 10` の `design` の `Boundary.Plans` を、plan md の `Boundary Plans` に直す。
   - update: 「unless the design says base」と「the name the design gave it」を、plan md の `Place` と plan 名に直す。
   - update: 「Do not copy the design or the ADR」を「Do not copy the ADR」に直す。
4. `.pi/skills/plan/references/tasks.md`:
   - update: レビューの `Goal` と、リサーチの `Goal` と `Non-goal` を、adr のエントリーの `Adopted` と `Scope` を読むように直す。

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `! grep -rni 'design' .pi/skills/plan`
- Added: base の見た目: オーナーが `plan/SKILL.md`、`references/format.md`、`references/tasks.md`、`references/cut.md` の差分を読み、分割の提示と plan md の欄が意図どおりであることを確かめる。オーナーの OK をもって閉じる。

## 2.plan のレビューの Goal とステップの接頭辞

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/plan/SKILL.md`:
   - update: 手順6に、ステップの説明行の先頭に `add:`、`update:`、`drop:` のどれかを付けること、テストのステップの行を `<prefix>: (happy|error|empty|boundary) <given> → <result>` の形で書くこと、plan に関わるファイル（テストファイルを含む）を書く前に改めて読むことを足す。
2. `.pi/skills/plan/references/format.md`:
   - update: `## Slices` と `## Steps` の形を、`- <prefix>: <何をするか>` に直し、テストファイルの行は `- update: (happy) <given> → <result>` の形にする。
   - update: `## Steps` に、ステップの接頭辞と `Files` のツリーのマーカーが同じ語であり、`Files` のツリーのマーカーはそのまま残すことを書く。
   - update: `## Test cases` に、ケースの前の接頭辞を足す。
3. `.pi/skills/plan/references/tasks.md`:
   - update: レビューの `Cases` を、ステップの接頭辞とケースの両方を読むように直す。
   - update: レビューとリサーチの手順に、plan に関わるファイルを書く前に改めて読むことを書く。

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -n 'add:' .pi/skills/plan/references/format.md`
  - `grep -n 'update:' .pi/skills/plan/references/format.md`
  - `grep -n 'drop:' .pi/skills/plan/references/format.md`
  - `grep -n 'add:' .pi/skills/plan/SKILL.md`
  - `grep -n 'add:' .pi/skills/plan/references/tasks.md`
  - `grep -n '改めて読む' .pi/skills/plan/SKILL.md .pi/skills/plan/references/tasks.md`
- Added: base の見た目: オーナーが `plan/SKILL.md`、`references/format.md`、`references/tasks.md` の差分を読み、ステップの接頭辞が意図どおりであることを確かめる。オーナーの OK をもって閉じる。

## Notes

### Slice 1: plan の分割の提示と plan md の Boundary Plans

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 2: plan のレビューの Goal とステップの接頭辞

- Findings:
- Unplanned:
- Commit:
- Stopped:

## Work Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Unproven:
- Noise:
- Doubts:

## Acceptance

- Ran:
- Findings:
- Doubts:
