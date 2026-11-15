# PLAN `close-script-tests`

- No: 02
- Place: worktree
- Boundary Plans: なし

## Goal

close スクリプトのテストが、同じ事実を 1 か所で確認する形になり、一時ツリーの前提が `cycleTree` に集まり、配線に重ねた単体の断言が消える。

## Design

- Inside:
  - Modules: `collect.fixture.ts` に plan の定数を置き、`collect.test.ts` の一時ツリーの前提を `cycle.fixture.ts` に分ける。`cycleTree` が `collect.fixture.ts` の `normalPlan`/`betaPlan` を既定に使い、`collect.test.ts` は違いだけを渡す。`cycleTree` はテスト用の fixture で、テストの外から呼ばれても一時ツリーを作って返し、止まらない。`collect.fixture.ts` は文字列だけを組み立て、FS を開かない。この結合は close のテストの Unit の中に閉じる。`CloseCycleSpec` は `cycleTree` の引数の型で、状態ではない。`plans`/`close` は省略できる指定で、状態の union ではない。
  - Dirs: なし。`cycle.fixture.ts` は `collect.test.ts` の隣に置く。
- Outside:
  - Extract: なし。`cycleTree` は close のテストだけが使う。
  - Colocate: なし。`test/temp-dir.ts` は複数の Unit が使う共有のままにする。

## Files

```text
.pi/
  skills/
    close/
      references/
        format.md
      scripts/
        collect.fixture.ts     update
        collect.mjs
        collect.test.ts        update
        cycle.fixture.ts       add
      SKILL.md
test/
  temp-dir.ts
```

## Slices

## 1.一時ツリーの前提を cycleTree に集める

6 本の FS テストが、1 つの helper の呼び出しになる。

### Types

```ts
export type CloseCycleSpec = {
  readonly plans?: readonly { readonly file: string; readonly doc: string }[];
  readonly close?: string | null;
};

export function cycleTree(spec?: CloseCycleSpec): string;
```

### Steps

1. `.pi/skills/close/scripts/collect.fixture.ts`
   1. update: `planId`、`adrNo`、`planFile`、`betaFile`、`normalPlan`、`betaPlan` を export する。`betaId` は内部の定数にする。
   2. drop: `PlanDocOptions` の `export`。
2. `.pi/skills/close/scripts/cycle.fixture.ts`
   1. add: `Types` の `CloseCycleSpec` と `cycleTree` を置く。`tempDir()` で root を作り、`join`、`mkdirSync`、`writeFileSync` で `cycles/261024-001-dev/plan` と `close.md` を書く。既定は `01-alpha.md` = `normalPlan`、`02-beta.md` = `betaPlan`、`close` = `# Close 001\n\n## Collected\n\nなし\n\n## Triage\n\nなし\n`。
   2. add: `plans` は `{ file, doc }` の配列で、既定の 2 plan を置き換える。`close` は文字列なら `close.md` に書き、`null` なら `close.md` を作らない。
   3. add: 返すのはサイクルの dir。
3. `.pi/skills/close/scripts/collect.test.ts`
   1. update: `setupCycle` を削除し、6 本の FS テストを `cycleTree` にする。
      - `writeClose: (happy) 2 件 → 01/02 の順`: `cycleTree()`。
      - `writeClose: (happy) No なし → ADR 未特定`: `cycleTree({ plans: [{ file: planFile, doc: planDoc({ name: planId, notes: 'a hole' }) }] })`。
      - `writeClose: (happy) 番号行の下の文脈 → 残る`: `cycleTree()`。
      - `review: (happy) review の指摘 → ## Collected`: `cycleTree({ plans: [{ file: planFile, doc: planDoc({ no: adrNo, name: planId, notes: 'なし', review: ['work review hole'] }) }] })`。
      - `review: (empty) なし → ## Collected なし`: `cycleTree({ plans: [{ file: planFile, doc: planDoc({ no: adrNo, name: planId, notes: 'なし', review: ['なし'] }) }] })`。
      - `re-execution: (happy) 2 本目を足す → 通し番号`: `cycleTree({ plans: [{ file: planFile, doc: planDoc({ no: adrNo, name: planId, notes: 'first hole' }) }], close: null })`。
   2. update: `normalPlan`、`betaPlan`、`betaId`、`betaFile` の定義を外し、`planId`、`adrNo`、`planFile`、`normalPlan` を fixture から import する。`betaPlan`、`betaId`、`betaFile` は fixture の内部に置く。
   3. update: `writeClose` の 66-76 の `kept context` を足す `writeFileSync` と、118-143 の 2 本目の `02-beta.md` を足す `writeFileSync` を残す。初期ツリーの作成は `cycleTree` に任せる。
   4. update: `cycleTree` に渡す plan の `doc` は `planDoc` で作る。既定は fixture の `normalPlan`/`betaPlan` を使う。

### Policy

- Allowed:
  - 単体と配線が同じ事実を確認する場合、判断・変換は単体に残し、配線は経路だけを確認する。
  - 一時ツリーの前提を `cycleTree` にまとめ、テストごとの違いはオプションで表す。
  - `planDoc` を fixture に残し、テストは `cycleTree` に plan の配列を渡す。
  - 既に存在しない振る舞いのテストはないため、削除は重複と前提の整理に限る。
  - `collect.mjs` に読まれない引数、使われない定数はないため、実装は触らない。
- Forbidden:
  - 製品の出力、エラー、ファイルの形を変える - 振る舞いを変えないため。
  - エラー分岐を確認するテストを、残す側の対応付けなしに削除する - 失敗経路の確認を失わないため。
  - 同じ値の断言を単体と配線の両方に置く - 同じ事実を 2 か所で確認しないため。
  - テストを整理するために実装の振る舞いを変える - このサイクルの目的がテストの整理だから。

### Verify

- Always:
  - `pnpm test:related .pi/skills/close/scripts/collect.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added: なし

## 2.同じ事実を 1 か所で確認する

review の単体と配線、Policy の place が、残す側の 1 か所に寄る。

### Types

なし

### Steps

1. `.pi/skills/close/scripts/collect.test.ts`
   1. update: review 1 本目の単体の断言を残す。
      - `review: (happy) collectPlan の finding と place → Work Review Round 1`
   2. update: review 1 本目の配線の断言を、見出しと番号行だけにする。
      - `writeClose: (happy) ## Collected に書く → 見出しと番号行`
   3. update: review 1 本目のテスト名を「review の指摘を `collectPlan` が拾い、`writeClose` が `## Collected` に書く」にする。1 本の `it` のまま。
   4. update: Policy の `place` を外し、`finding` を残す。
      - `Policy: (happy) Policy: a policy hole → a policy hole`

### Policy

- Allowed:
  - 単体と配線が同じ事実を確認する場合、判断・変換は単体に残し、配線は経路だけを確認する。
  - 一時ツリーの前提を `cycleTree` にまとめ、テストごとの違いはオプションで表す。
  - `planDoc` を fixture に残し、テストは `cycleTree` に plan の配列を渡す。
  - 既に存在しない振る舞いのテストはないため、削除は重複と前提の整理に限る。
  - `collect.mjs` に読まれない引数、使われない定数はないため、実装は触らない。
- Forbidden:
  - 製品の出力、エラー、ファイルの形を変える - 振る舞いを変えないため。
  - エラー分岐を確認するテストを、残す側の対応付けなしに削除する - 失敗経路の確認を失わないため。
  - 同じ値の断言を単体と配線の両方に置く - 同じ事実を 2 か所で確認しないため。
  - テストを整理するために実装の振る舞いを変える - このサイクルの目的がテストの整理だから。

### Verify

- Always:
  - `pnpm test:related .pi/skills/close/scripts/collect.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added: なし — テストの断言の削除は振る舞いを変えない。`Always` のテストとレビューで確かめる。

## Notes

### Slice 1: 一時ツリーの前提を cycleTree に集める

- Findings: なし
- Unplanned: なし
- Commit: 5ea350ff
- Stopped:

### Slice 2: 同じ事実を 1 か所で確認する

- Findings: なし
- Unplanned: なし
- Commit: 2f78eeb6
- Stopped:

### Cleanup: close スクリプトのテストの整理

- Findings: なし
- Unplanned: なし

## Work Review

### Round 1

- Stale:
  - なし（`setupCycle` への残存参照はなく、`PlanDocOptions` の export 削除に対する外部参照もない。fixture のヘッダコメントは現状と一致している）
- Unlisted:
  - なし（変更は `collect.fixture.ts`・`collect.test.ts`・`cycle.fixture.ts` のみで、`Files` の `update`/`add` 指定と一致し、`collect.mjs`・`format.md`・`SKILL.md`・`test/temp-dir.ts` に変更はない）
- Gaps:
  - `cycle.fixture.ts:13`・`cycle.fixture.ts:34` — `CloseCycleSpec.close` が文字列の場合（`close.md` にその文字列を書く分岐）は、どのテストからも呼ばれていない（`collect.test.ts` の `cycleTree` 呼び出し 6 件は既定か `close: null` のみ：`collect.test.ts:30,38,46,64,71,85`）。`Steps` が文字列分岐を定めているのに検証がなく、helper 自体の振る舞いが 1 分岐だけ無検証で残る。
    fixed: `collect.test.ts` に `describe('cycleTree')` を足し、`cycleTree({ close: body })` が `close.md` にそのまま書く 1 件を追加して文字列分岐を検証した。
- Policy:
  - なし（`collect.mjs` 不変。単体の finding/place は `collect.test.ts:62-63` に残し、配線は `collect.test.ts:66-67` で見出しと番号行のみにして同じ値の重複なし。エラー分岐の削除なし）
- Unproven:
  - なし（`collect.test.ts:50-51,92-93` は `toBeDefined` が先に落ちるため早期 return では緑にならず、各断言は対応する破壊で赤になる）
- Noise:
  - なし（`beta` の直書きは plan が `betaId` を内部化し test の import 対象外と決めた所与であり、`1.`/`2.` は通し番号という仕様の確認である）
- Doubts:
  - なし

### Round 2

- Stale: なし — Round 1 の `fixed:` は Gaps の 1 件のみで、Stale に `fixed:` はないため対象外。
- Unlisted: なし — 同上、Unlisted に `fixed:` はないため対象外。
- Gaps: なし — Round 1 の `fixed:` 1 件（`cycleTree({ close: body })` が `close.md` にそのまま書く 1 件で文字列分岐を検証）は現物で確認した。`collect.test.ts:121-127` に `describe('cycleTree')` があり、`body = '# Close 001\n\n## Collected\n\ncustom\n\n## Triage\n\nなし\n'` を `cycleTree({ close: body })` に渡し、`readFileSync(join(cycle, 'close.md'), 'utf8')` が `toBe(body)` で一字一句の一致を確かめる。`cycle.fixture.ts:31-34` は `close === null` なら作らず、それ以外は `spec?.close ?? defaultClose` を書くため、このテストは文字列分岐だけを通る。既存の 6 件（既定と `close: null`）と合わせて 3 通りがそろった。理由: 文字列を既定に戻すなどの破壊はこの `toBe` を赤にするため、無検証の分岐は残らない。
- Policy: なし — Round 1 の `fixed:` は Gaps の 1 件のみで、Policy に `fixed:` はないため対象外。
- Unproven: なし — 同上、Unproven に `fixed:` はないため対象外。
- Noise: なし — 同上、Noise に `fixed:` はないため対象外。
- Doubts: この Round 2 は読み取りでの確認に留まり、`pnpm test:related` を実行していない（実行が許可されていないため）。`toBe(body)` が緑になることは読み取りで確かめたが、実走での緑は未確認。

## Acceptance

- Goal: close スクリプトのテストが、同じ事実を 1 か所で確認する形になり、一時ツリーの前提が `cycleTree` に集まり、配線に重ねた単体の断言が消える — 達成した。
- Ran: `pnpm test:run`（868 件）、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`、`pnpm test:related .pi/skills/close/scripts/collect.test.ts`（12 件）。
- Findings: なし
- Doubts: なし
