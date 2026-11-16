# PLAN `adr-script-tests`

- No: 01
- Place: worktree
- Boundary Plans: なし

## Goal

adr スクリプトのテストが、同じ事実を 1 か所で確認する形になり、一時ツリーの前提が `cycleTree` に集まり、プリンシプルの外にある primitive・定数の確認が消える。

## Design

- Inside:
  - Modules: `index.test.ts` の一時ツリーの前提を `cycle.fixture.ts` に分ける。13 か所が同じ形のツリーを毎回組み、違いは `adr.md` の種類、`affected/`、`close.md`、サイクル名だけである。1 つの helper に集め、テストは違いだけを渡す。`cycle.fixture.ts` は adr スクリプトの feature root（`scripts/`、`index.mjs` がある場所）に置く。`CycleSpec` は `cycleTree` の引数の型で、状態ではない。`adr` の `undefined`/`null`/文字列はオプションの指定で、状態の union ではない。
  - Dirs: なし。`cycle.fixture.ts` は `scripts/` に置く。
- Outside:
  - Extract: なし。`cycleTree` は adr のテストだけが使う。close と plan は自分の Unit に同じ形の helper を置く。
  - Colocate: なし。`test/temp-dir.ts` は複数の Unit が使う共有のままにする。

## Files

```text
.pi/
  skills/
    adr/
      references/
        adr.format.md
        affected.format.md
      scripts/
        adr.mjs
        affected.mjs
        cycle.fixture.ts        add
        cycle.mjs
        index.mjs
        index.test.ts           update
test/
  temp-dir.ts
```

## Slices

## 1.一時ツリーの前提を cycleTree に集める

一時ツリーを組む 13 か所が、1 つの helper の呼び出しになる。

### Types

```ts
export type CycleSpec = {
  readonly name?: string;
  readonly adr?: string | null;
  readonly close?: string | null;
  readonly affected?: readonly { readonly nn: number; readonly title?: string }[];
};

export function cycleTree(cycles?: readonly CycleSpec[]): {
  readonly root: string;
  readonly cyclesDir: string;
  readonly dirs: readonly string[];
};
```

### Steps

1. `.pi/skills/adr/scripts/cycle.fixture.ts`
   1. add: `Types` の `CycleSpec` と `cycleTree` を置く。`adrSkeleton`、`affectedEntrySkeleton`、`cycleDirName` を `./adr.mjs`、`./affected.mjs`、`./cycle.mjs` から、`tempDir` を `../../../../test/temp-dir.ts` から import する。`root` は `tempDir()`、`cyclesDir` は `join(root, 'cycles')`。
   2. add: `name` の既定は `cycleDirName(15, '261010', 'main')`。`adr` は `undefined` なら `adrSkeleton(15)`、`null` なら `adr.md` を作らない、文字列ならそのまま `adr.md` に書く。`close` は文字列なら `close.md` に書く。`affected` は `{ nn, title }` から `affectedEntrySkeleton(nn, title)` を作る。
   3. add: `cycles` を省略すると 1 サイクルを作る。`cycleTree([])` は root だけを返し、`dirs` は空。`dirs` は作ったサイクルの `join(cyclesDir, name)` を渡された順で返す。
2. `.pi/skills/adr/scripts/index.test.ts`
   1. update: `openCycleDir` の 4 本を `cycleTree()`、`cycleTree([{ adr: null }])`、`cycleTree([{ close: '# Close\n' }])`、`cycleTree([{}, { name: cycleDirName(16, '261011', 'main') }])` にする。`cycleTree()` は既定の 1 サイクル（`adrSkeleton(15)`）を返す。`const { cyclesDir, dirs } = cycleTree(...)` で受け、1 件は `dirs[0]`、2 件は `dirs[1]`、`openCycleDir(cyclesDir)` を呼ぶ。
   2. update: CLI の 9 本を次の仕様にする。
      - `--add 既存`（628）: `cycleTree([{ adr: adrSkeleton(15, '一'), affected: [{ nn: 1, title: '一' }] }])`。
      - `--add 新規`（647）: `cycleTree([])`。
      - `--add 新規 Simple`（660）: `cycleTree([])`。
      - `--add 既存 Simple`（677）: `cycleTree([{ adr: adrSkeleton(15, '一'), affected: [{ nn: 1, title: '一' }] }])`。
      - `--delete`（697）: `cycleTree([{ adr: appendEntry(appendEntry(adrSkeleton(15, '一'), 2, '二'), 3, '三'), affected: [{ nn: 1, title: '一' }, { nn: 2, title: '二' }, { nn: 3, title: '三' }] }])`。
      - `--set`（722）: `cycleTree([{ adr: adrSkeleton(15, '旧'), affected: [{ nn: 1, title: '旧' }] }])`。
      - `--set Type なし Simple`（738）: `cycleTree([{ adr: adrSkeleton(15, '旧', 'Simple'), affected: [{ nn: 1, title: '旧' }] }])`。
      - `--set Type あり Simple`（756）: `cycleTree([{ adr: adrSkeleton(15, '旧'), affected: [{ nn: 1, title: '旧' }] }])`。
      - `--check`（780）: `cycleTree([{ adr: <既存の手書きの adr 文字列>, affected: [] }])`。
   3. update: `cycleTree` を `./cycle.fixture.ts` から import し、`writeFileSync` を import から外す。
   4. update: `createLeafDir`、`dirNames`、CLI の「操作なし」、`openCycleDir` の「サイクルなし」（569）は `tempDir` のままにする。

### Policy

- Allowed:
  - 単体と配線が同じ事実を確認する場合、判断・変換は単体に残し、配線は経路だけを確認する。
  - 一時ツリーの前提を `cycleTree` にまとめ、テストごとの違いはオプションで表す。
  - テスト名、コメント、表題を現在の実装に合わせる。
  - primitive・定数の確認を削除する。
- Forbidden:
  - 製品の出力、エラー、ファイルの形を変える - 振る舞いを変えないため。
  - エラー分岐を確認するテストを、残す側の対応付けなしに削除する - 失敗経路の確認を失わないため。
  - 同じ値の断言を単体と配線の両方に置く - 同じ事実を 2 か所で確認しないため。
  - テストを整理するために実装の振る舞いを変える - このサイクルの目的がテストの整理だから。

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added: other — `node .pi/skills/adr/scripts/index.mjs --check`

## 2.同じ事実を 1 か所で確認する

重複した断言が、残す側の 1 か所に寄る。

### Types

なし

### Steps

1. `.pi/skills/adr/scripts/index.test.ts`
   1. update: Simple の `_omission_` を `entrySkeleton`（443-444）と `--add` 新規（672-673）に絞る。`it` は残し、487-488、692-693、753、775-776 の `_omission_` の断言だけを外す。`setEntryType` の Simple は、元の `- In:` と Details のフェンスが消えることを確認する。
      - `Simple: (happy) entrySkeleton の Simple → _omission_ の 2 行`
      - `Simple: (happy) --add Simple の新規 → _omission_ の 2 行`
   2. update: `lastEntryNumber` を単体（449-451）に絞り、`appendEntry` の 546、555 の断言だけを外す。
      - `lastEntryNumber: (happy) adrSkeleton → 1`
      - `lastEntryNumber: (empty) エントリなし → null`
      - `lastEntryNumber: (error) 壊れた見出し → throw`
   3. update: Full の骨組みを `entrySkeleton`（433-438）に絞り、`setEntryType` の 479-480 の `- In:` とフェンスの断言だけを外す。題名と Type の断言（478）を残し、元の `_omission_` が消えることを確認する。
      - `Full: (happy) entrySkeleton の Full → - In: とフェンス`
   4. update: `setEntryTitle` と `deleteEntry` の CLI を経路だけにする。CLI `--set`（722-735）は `adr.md` と `affected/01.md` の両方の題名を確認し、CLI `--delete`（697-719）は `affected/` の振り直しと `03.md` の消滅を確認し、`adr.md` は削除した題名が消えていることだけを見る。`## 01: 一`、`## 02: 三`、`not 二` の値は単体に任せる。
      - `setEntryTitle: (happy) 題名を置き換える → 新しい題名`
      - `deleteEntry: (happy) 2 を削除 → 01/02 に振り直す`
   5. update: 581 の表題を「`adr.md` と `close.md` を持つ → null」に直す。
      - `openCycleDir: (happy) adr.md と close.md → null`

### Policy

- Allowed:
  - 単体と配線が同じ事実を確認する場合、判断・変換は単体に残し、配線は経路だけを確認する。
  - 一時ツリーの前提を `cycleTree` にまとめ、テストごとの違いはオプションで表す。
  - テスト名、コメント、表題を現在の実装に合わせる。
  - primitive・定数の確認を削除する。
- Forbidden:
  - 製品の出力、エラー、ファイルの形を変える - 振る舞いを変えないため。
  - エラー分岐を確認するテストを、残す側の対応付けなしに削除する - 失敗経路の確認を失わないため。
  - 同じ値の断言を単体と配線の両方に置く - 同じ事実を 2 か所で確認しないため。
  - テストを整理するために実装の振る舞いを変える - このサイクルの目的がテストの整理だから。

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added: なし

## 3.primitive・定数の確認を整理する

プリンシプルの外にある primitive・定数の確認が消える。

### Types

なし

### Steps

1. `.pi/skills/adr/scripts/index.test.ts`
   1. update: `adrSkeleton` の 28 と 38 を 1 本に統合する。`adrSkeleton(7, '題名')` で `# ADR 007` の先頭と `## 01: 題名` の含有を確認する。
      - `adrSkeleton: (happy) 7 と題名 → # ADR 007 と ## 01: 題名`
   2. update: `affectedEntrySkeleton` の 605 と 621 を 1 本に統合する。見出し配列 `['## 01: <トピック>', '### Keywords', '### Code', '### External']` の一致と、題名の含有を確認する。`Kind`/`Edge` の選択肢の全文は外す。
      - `affectedEntrySkeleton: (happy) → 見出しと題名`
   3. update: `entrySkeleton` の 242 の同じ `it` に `expect(skeleton).toContain('出所:')` を 1 行足す。
      - `entrySkeleton: (happy) → 見出しの順と 出所:`
   4. drop: `parseArgs` の 149（空の既定）、159（`--root`）、170（`--add` Full）、194（`--check`）。
   5. drop: `entrySkeleton` の 226（フィールドの文字列の写し）、258（`In`/`Out` の含有）。
   6. update: テスト名を、統合した内容に合わせる。`adrSkeleton` は「番号を 0 埋めした見出しで始まり、題名が最初のエントリに入る」、`affectedEntrySkeleton` は「affected.format.md の見出しとブロックを持ち、題名が入る」、`entrySkeleton` の 242 は「見出しの順と `出所:` を持つ」にする。ほかの名前は変えない。

### Policy

- Allowed:
  - 単体と配線が同じ事実を確認する場合、判断・変換は単体に残し、配線は経路だけを確認する。
  - 一時ツリーの前提を `cycleTree` にまとめ、テストごとの違いはオプションで表す。
  - テスト名、コメント、表題を現在の実装に合わせる。
  - primitive・定数の確認を削除する。
- Forbidden:
  - 製品の出力、エラー、ファイルの形を変える - 振る舞いを変えないため。
  - エラー分岐を確認するテストを、残す側の対応付けなしに削除する - 失敗経路の確認を失わないため。
  - 同じ値の断言を単体と配線の両方に置く - 同じ事実を 2 か所で確認しないため。
  - テストを整理するために実装の振る舞いを変える - このサイクルの目的がテストの整理だから。

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added: なし

## Notes

### Slice 1: 一時ツリーの前提を cycleTree に集める

- Findings:
  - Verify の Added（`node .pi/skills/adr/scripts/index.mjs --check` の手動実行）ができない。
    - left: bash から当該スクリプトを直接叩くと subagent-guard に止められるため。この cycle では閉じない。同じ経路は CLI の `--check` テスト（vitest 内の spawn）が通り、suite 全体も緑。
- Unplanned: なし
- Commit: fd3c62e5
- Stopped:

### Slice 2: 同じ事実を 1 か所で確認する

- Findings: なし
- Unplanned: なし
- Commit: e2eff5fa
- Stopped:

### Slice 3: primitive・定数の確認を整理する

- Findings: なし
- Unplanned: なし
- Commit: eb776a46
- Stopped:

### Cleanup: adr スクリプトのテストの整理

- Findings: なし
- Unplanned: なし

## Work Review

### Round 1

- Stale:
  - なし。理由：未使用 import は残っていない（`writeFileSync` を外し、`mkdirSync`・`tempDir` は `createLeafDir`・`dirNames`・「操作なし」・「サイクルなし」で使用中）。改名 4 件以外のテスト名は plan が変えないと決めた範囲で、重複文も生んでいない。
- Unlisted:
  - なし。理由：変更は `cycle.fixture.ts`（add）と `index.test.ts`（update）のみで `## Files` の通り。plan md の Notes/Commit 追記は作業記録であり `Files` の対象外。
- Gaps:
  - なし。理由：13 か所（`openCycleDir` 4＋CLI 9）はすべて `cycleTree` 化され、`tempDir` 残しは Steps 1.2.4 の通り。削減（`lastEntryNumber`・`_omission_`・`Kind/Edge` 全文等）は Steps と Allowed の通りで、Goal の 3 点に穴はない。
- Policy:
  - なし。理由：製品ファイル無変更で出力・形不変、error 系テストは全残し、新規の重複断言なし、実装変更なし。残存の `Type` 断言等は Steps が残すと決めた範囲。
- Unproven:
  - なし。理由：弱めた CLI（`--delete` の `not 二` のみ等）は Steps 2.4 の「判断は単体・配線は経路」の設計通りで、値は単体（`deleteEntry`・`setEntryTitle`・`entrySkeleton の Type`）が押さえている。`setEntryType` Full の `_omission_` 計数は題名・Type 断言と組み合わせており変換漏れを検出できる。
- Noise:
  - なし。理由：`'# Close\n'`・`'261011'`・`'一/旧/新'` 等は plan Steps が指定した値であり、plan 決定値は finding にしない。`toHaveLength(2)` の `2` は残る Simple 1 件の Scope＋Details から導ける数である。
- Doubts:
  - Added の手動 `node .pi/skills/adr/scripts/index.mjs --check` が未実行のまま（Notes Slice1）。CLI `--check` テスト＋suite 緑で代用とあるが、実データでの確認を close 時に行うか残すかは owner の判断が必要。
  - Verify Always（`pnpm test:run`・`typecheck`・`lint`・`format:check`＋読み合わせ）の実行記録が Notes にない（Slice1 は suite 緑のみ、Slice2・3 は記載なし）。本 role は git のみ許可のため未実行。close 時に実行し Acceptance に記録する要あり。

### Round 2

- Stale:
- Unlisted:
- Gaps:
- Policy:
- Unproven:
- Noise:
- Doubts:

## Acceptance

- Goal: adr スクリプトのテストが、同じ事実を 1 か所で確認する形になり、一時ツリーの前提が `cycleTree` に集まり、プリンシプルの外にある primitive・定数の確認が消える — 達成した。
- Ran: `pnpm test:run`（859 件）、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`、`node .pi/skills/adr/scripts/index.mjs --check`。
- Findings: なし
- Doubts: なし
