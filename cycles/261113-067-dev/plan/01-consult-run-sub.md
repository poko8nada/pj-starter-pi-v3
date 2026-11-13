# PLAN `consult-run-sub`

- No: 01
- Place: worktree
- Boundary Plans: なし

## Goal

consult の `run` と `sub` のテストが、各テスト固有の事実だけを残し、同じ事実をレイヤーごとに1回確認する形になる。

## Design

- Inside:
  - Modules: なし
  - Dirs: なし
- Outside:
  - Extract: `consult.fixture.ts` に `aPlace()`、`aDoneRun()`、`aAt()` を足す。4 つのテストが同じ前提をそれぞれ組み立てているため、1 か所に寄せる。`aPlace()` は `run/place.ts` の `placeFor` を使う。fixture は Unit のルート、`placeFor` は同じ Unit の葉であり、ルートが葉を組む向きは逆転ではない。`test/temp-dir.ts` は読むだけで変更しない。
  - Colocate: なし

## Files

```text
test/
  temp-dir.ts
.pi/
  extensions/
    consult/
      run/
        delivery.test.ts    update
        delivery.ts
        log.test.ts         update
        log.ts
        place.ts
        proc.test.ts        update
        proc.ts
        run.test.ts         update
        run.ts
        subagent.test.ts
        subagent.ts
        worktree.test.ts    update
        worktree.ts
      sub/
        budget.test.ts      update
        budget.ts
        guard.test.ts       update
        guard.ts
        spec.test.ts        update
        spec.ts
      tool/
        subagents.test.ts   update
        subagents.ts
      consult.fixture.ts    update
      index.test.ts         update
      index.ts
```

## Slices

## 1.fixture の共通前提

`place()`、done の `record()`、固定日時を `consult.fixture.ts` の helper に寄せる。

### Types

```ts
import { placeFor, type Place } from './run/place.ts';
import { tempDir } from '../../../test/temp-dir.ts';
import type { RunRecord } from './run/log.ts';

export function aPlace(): Place;
export function aDoneRun(overrides?: Partial<RunRecord>): RunRecord;
export function aAt(): Date;
```

### Steps

1. `.pi/extensions/consult/consult.fixture.ts`
   1. update: `placeFor` と `Place` を `./run/place.ts` から、`tempDir` を `../../../test/temp-dir.ts` から import する。`RunRecord` の type import は既にある。
   2. update: `aPlace()`、`aDoneRun()`、`aAt()` を足す。

      ```ts
      export function aPlace(): Place {
        return placeFor(tempDir(), tempDir());
      }

      export function aDoneRun(overrides: Partial<RunRecord> = {}): RunRecord {
        return aRunRecord({ ended: 2000, state: 'done', ...overrides });
      }

      export function aAt(): Date {
        return new Date(2026, 9, 10, 12, 0);
      }
      ```

   3. update: 冒頭の説明を「値と文字列を組み立てる。`aPlace()` は `tempDir()` で一時ディレクトリを作り、後始末は `temp-dir.ts` がする。`aAt()` は毎回新しい Date を返す」に直す。
2. `.pi/extensions/consult/run/delivery.test.ts`
   1. update: ローカルの `place()` と `record()` を削除し、import に `aPlace`、`aDoneRun`、`aAt` を足す。`place()` を `aPlace()`、`record(...)` を `aDoneRun(...)` に置き換え、`notice()` の中も `aDoneRun({ notice: 'できた', ...extra })` にする。
   2. update: `const at = new Date(2026, 9, 10, 12, 0)` を `const at = aAt()` に置き換える。
3. `.pi/extensions/consult/run/log.test.ts`
   1. update: `place()` の定義を消し、import に `aPlace` と `aAt` を足して `aPlace()` を使う。走っている記録の `record()` はローカルに残す。
   2. update: `const at = new Date(2026, 9, 10, 12, 0)` を `const at = aAt()` に置き換える。
4. `.pi/extensions/consult/index.test.ts`
   1. update: `place()` の定義を消し、import に `aPlace` を足して `aPlace()` を使う。
   2. update: ローカルの `record()` は残し、本体を `aDoneRun({ notice: 'できた', ...extra })` に変える。import に `aDoneRun` を足す。
5. `.pi/extensions/consult/tool/subagents.test.ts`
   1. update: `place()` の定義を消し、import に `aPlace` を足して `aPlace()` を使う。死んだ pid の `record()` はローカルに残す。

### Policy

- Allowed:
  - テストの削除と統合、fixture への helper の移動、古い文言の修正
  - 既にレイヤーが分かれている確認は、そのまま残す
- Forbidden:
  - 製品コードと consult の実装を変える - テストの整理だけを行うため
  - 単体テストが確認している値を配線テストでも同じ値で確認する - 同じ事実を2回確認しないため
  - 失敗経路の確認を落とす - 残す失敗経路を守るため
  - 到達しない入力、同じ分岐の言い換え、bool の写像だけの確認を足す - 壊れても気づけない確認を増やさないため

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added: なし

## 2.budget の重複断言と入力

`budget.test.ts` の内容の二重断言と、到達しない入力・同じ分岐の言い換えを落とす。

### Types

```ts
function aBudgetPi(
  register: (pi: BudgetPiPort) => void,
): () => ((event: { turnIndex: number }) => TurnEndEventResult) | undefined;
```

### Steps

1. `.pi/extensions/consult/sub/budget.test.ts`
   1. update: `lastTurn` のテストから `0`、`Number.NaN`、`2.5` の断言を落とし、題名を `lastTurn: (boundary) 上限なし・1 → 何もしない` にする。
   2. update: `turnsFrom` のテストから `'  '` と `'-5'` の断言を落とし、題名を `turnsFrom: (empty) 空・数でない・0 以下 → undefined` にする。
   3. update: 1 つ目の `registerBudget` テストの `entries[0]` に対する `toMatchObject` を落とし、`expect(first).toEqual(nudge(limit, false, limit))` と `second` が `{}` であることを残す。題名を `registerBudget: (happy) 促しの番号 → 1 度だけ促す` にする。
   4. update: `37 の後に 38` のテストも、38 の結果を `nudge(limit, false, limit)` と `toEqual` で比べ、37 の結果が `{}` であることを残す。
   5. update: env のテストも、結果を `nudge(limit, false, limit)` と `toEqual` で比べる。
   6. update: 3 か所の偽 `pi` を 1 つのローカル helper `aBudgetPi(register)` にまとめる。import に `type BudgetPiPort` を足す。1〜2 か所目は `(pi) => registerBudget(pi, turns)`、3 か所目は `(pi) => budgetDefault(pi)` を渡す。

      ```ts
      function aBudgetPi(
        register: (pi: BudgetPiPort) => void,
      ): () => ((event: { turnIndex: number }) => TurnEndEventResult) | undefined {
        let handler: ((event: { turnIndex: number }) => TurnEndEventResult) | undefined;
        const pi = {
          on(_event: 'turn_end', next: (event: { turnIndex: number }) => TurnEndEventResult) {
            handler = next;
          },
        };
        register(pi);
        return () => handler;
      }
      ```

### Policy

- Allowed:
  - テストの削除と統合、fixture への helper の移動、古い文言の修正
  - 既にレイヤーが分かれている確認は、そのまま残す
- Forbidden:
  - 製品コードと consult の実装を変える - テストの整理だけを行うため
  - 単体テストが確認している値を配線テストでも同じ値で確認する - 同じ事実を2回確認しないため
  - 失敗経路の確認を落とす - 残す失敗経路を守るため
  - 到達しない入力、同じ分岐の言い換え、bool の写像だけの確認を足す - 壊れても気づけない確認を増やさないため

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added: なし

## 3.retry-start を単体と配線に分ける

`retry-start` の変換を `spec` の単体に残し、`run.test.ts` の 2 つの配線テストは経路だけを確認する。`spec.test.ts:189` は変換の単体、`subagent.test.ts:125` は model の補完という別の事実であり、どちらも残す。`applyEvent` の `model` は、直前の `message_end` から `lastModel` を渡す配線固有の事実である。

### Types

なし

### Steps

1. `.pi/extensions/consult/run/run.test.ts`
   1. update: `applyEvent` の retry-start テストの断言を `toMatchObject({ kind: 'retry-start', model: 'p/m' })` にし、題名を `applyEvent: (happy) 直前の message_end のモデル → retry-start に model を載せる` にする。
   2. update: `runPi` の retry-start テストの断言を `received` の `toHaveLength(1)` と `toMatchObject({ kind: 'retry-start' })` にし、題名を `runPi: (happy) auto_retry_start の行 → onModelEvent に retry-start` にする。

### Policy

- Allowed:
  - テストの削除と統合、fixture への helper の移動、古い文言の修正
  - 既にレイヤーが分かれている確認は、そのまま残す
- Forbidden:
  - 製品コードと consult の実装を変える - テストの整理だけを行うため
  - 単体テストが確認している値を配線テストでも同じ値で確認する - 同じ事実を2回確認しないため
  - 失敗経路の確認を落とす - 残す失敗経路を守るため
  - 到達しない入力、同じ分岐の言い換え、bool の写像だけの確認を足す - 壊れても気づけない確認を増やさないため

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added: なし

## 4.到達しない入力と同じ分岐の整理

到達しない入力、同じ分岐の言い換え、bool の写像だけのテストを、どの場合を落とすか明示して落とす。

### Types

なし

### Steps

1. `.pi/extensions/consult/run/proc.test.ts`
   1. drop: `checkPid: (boundary) pid 0 → ended` の断言を落とす。`-5` と `3.5` は残す。
   2. drop: `readStartToken: (boundary) pid 0 → undefined` の断言を落とす。
   3. drop: `readStartToken: (empty) 空白だけ → undefined` の断言を落とし、残る空の題名を `readStartToken: (empty) 出力が空 → undefined` にする。
2. `.pi/extensions/consult/sub/guard.test.ts`
   1. drop: `parseLimits: (empty) '  ' → open` の断言を落とす。`undefined` は残す。
3. `.pi/extensions/consult/run/worktree.test.ts`
   1. drop: `removeWorktree: (boundary) '' → missing` の断言を落とし、題名を「consult/ のような id → missing」にする。
4. `.pi/extensions/consult/sub/spec.test.ts`
   1. drop: `needsIsolation: (happy) isolated true → true` の `describe` ごと落とす。隔離の結果は `subagent.test.ts` の `prepare` が確認する。
   2. drop: `buildPiArgs: (happy) extension のパス → 絶対パス` の `it` を落とす。絶対パスは同じ `describe` の他のテストが確認する。
   3. update: 使わなくなった `needsIsolation` の import を落とす。

### Policy

- Allowed:
  - テストの削除と統合、fixture への helper の移動、古い文言の修正
  - 既にレイヤーが分かれている確認は、そのまま残す
- Forbidden:
  - 製品コードと consult の実装を変える - テストの整理だけを行うため
  - 単体テストが確認している値を配線テストでも同じ値で確認する - 同じ事実を2回確認しないため
  - 失敗経路の確認を落とす - 残す失敗経路を守るため
  - 到達しない入力、同じ分岐の言い換え、bool の写像だけの確認を足す - 壊れても気づけない確認を増やさないため

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added: なし

## 5.log の古い文言

`log.test.ts` の `child` 欄を指す表題と前提を、現在の拒否理由に直す。

### Types

なし

### Steps

1. `.pi/extensions/consult/run/log.test.ts`
   1. update: 表題を `parseRun: (error) subagent がない行 → undefined` にする。入力は `aRunRecord({ session: 's', role: 'r', pid: 1, started: 2 })` から `subagent` を外して組む。

      ```ts
      const row = aRunRecord({ session: 's', role: 'r', pid: 1, started: 2 });
      expect(parseRun(JSON.stringify({ ...row, subagent: undefined }))).toBeUndefined();
      ```

### Policy

- Allowed:
  - テストの削除と統合、fixture への helper の移動、古い文言の修正
  - 既にレイヤーが分かれている確認は、そのまま残す
- Forbidden:
  - 製品コードと consult の実装を変える - テストの整理だけを行うため
  - 単体テストが確認している値を配線テストでも同じ値で確認する - 同じ事実を2回確認しないため
  - 失敗経路の確認を落とす - 残す失敗経路を守るため
  - 到達しない入力、同じ分岐の言い換え、bool の写像だけの確認を足す - 壊れても気づけない確認を増やさないため

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added: なし

## Notes

### Slice 1: fixture の共通前提

- Findings: なし
- Unplanned: なし
- Commit: d48bc33
- Stopped:

### Slice 2: budget の重複断言と入力

- Findings: なし
- Unplanned: `budget.test.ts` の `aBudgetPi` 呼び出し 3 か所を `{ }` 付きの arrow にした。plan の `(pi) => registerBudget(pi, turns)` の形だと `lint` の `no-confusing-void-expression` に触れて `Verify` が通らないため、ここで直した。
- Commit: f50b2cf
- Stopped:

### Slice 3: retry-start を単体と配線に分ける

- Findings: なし
- Unplanned: なし
- Commit: b747acd
- Stopped:

### Slice 4: 到達しない入力と同じ分岐の整理

- Findings: なし
- Unplanned: なし
- Commit: c8dfe6a
- Stopped:

### Slice 5: log の古い文言

- Findings: なし
- Unplanned: なし
- Commit: 4421eac
- Stopped:

### Cleanup: consult のテスト

- Findings:
  - `delivery.test.ts` の壊れテストから `pendingReports` の断言を落とした。`pendingReports` の happy が同じ行の返却をすでに見ている。
  - `log.test.ts` の `closeOrphans` の型だけのテストを落とした。`ended` が数値で `reason` が空でない文字列であることは型が決めており、設計の `Test cases` が書かない前提である。
  - `log.test.ts` の `token` と `startToken` の往復テストから `parseRun` 部分の断言を落とした。欄の素通しは単体が持ち、配線は保存からの読み返しだけを見る。
  - `log.test.ts` の `pidAlive(0)` を落とした。`-1` と同じ `<=0` の分岐に入る（`proc` の slice 4 と同じ整理）。
  - `budget.test.ts` の `lastTurn(2)` を落とした。`40` と同じ `turns - 2` の分岐で、境界値だけの確認は書かない。
  - `budget.test.ts` の `turnsFrom('2.5')` を落とした。題名の分類にない行である。
  - `spec.test.ts` の 1 つ目の guard テストから `guard.ts` の断言を落とした。2 つ目のテストが 2 つの拡張の絶対パスをすでに見ている。
  - `proc.test.ts`、`run.test.ts`、`guard.test.ts`、`tool/subagents.test.ts`、`index.test.ts`、`consult.fixture.ts` は重複なし。触っていない（`index` の配線の絞りは 02 の仕事のため）。
  - 66 ファイル、870 件のテストが成功（1 件減）。`pnpm test:run`、`pnpm typecheck`、`pnpm lint`、`pnpm format:check` が通る。
- Unplanned:
  - `delivery.test.ts` の壊れテストの死んだ前提を直した。壊れた JSON の上書きで消える `writeCursorFile` の 1 行を落とした。
  - `log.test.ts` の不良行テストの前提を `subagent` なしの 1 行に直した。`session` なし行の読み飛ばしは `parseRun` の単体が持つ。
  - `log.test.ts` の保存テストの前提を `readRuns` の 1 断言に直した。日ごとの文件の行数は同じ保存を 2 回見ていた。
  - `worktree.test.ts` の `unit の保存場所` の表題を直した。記録を置く前提が本文になかったため、本文の向き（`unit` の下の `wt`）に合わせた。

## Work Review

### Round 1

- Stale:
  - `.pi/extensions/consult/consult.fixture.ts:7` の「テストの外から読まれても、何も起きずに止まらない（副作用を持たない）」が古い。`aPlace()` が `tempDir()` で一時ディレクトリを作り、読み込み時に `test/temp-dir.ts:29` の `afterEach` 登録を引き込むため、何も起きない・副作用なしという説明と矛盾する。理由: 変更が前提（FS を開かない）を変えたのに文書の 3 行目が残ったため。なお冒頭 2 行目の文言自体は plan の Steps 1.1.3 が決めた値のため finding にしない。
    - fixed: 7 行目を「読むだけでは作らず（`temp-dir.ts` の `afterEach` 登録だけ引き込む）、作るのは `aPlace()` を呼んだとき」に直した。読むだけの引き込みと呼んだときの作成を分けて書いた。
- Unlisted: なし。理由: diff が触った 11 ファイル（fixture・delivery・log・proc・run・worktree・budget・guard・spec・subagents・index の各 test と fixture）はすべて `## Files` の `update` 名指し内であり、`delivery.ts`・`log.ts`・`place.ts`・`proc.ts`・`run.ts`・`subagent.ts`・`worktree.ts`・`budget.ts`・`guard.ts`・`spec.ts`・`subagents.ts`・`index.ts`・`test/temp-dir.ts` に変更はないため。
- Gaps: なし。理由: 落とした断言は同分岐・到達不能（ADR F12-F17）に沿い、残すべき内容は他レイヤーが持つ（促し内容は `nudge` 単体、変換全文は `spec.test.ts:176` の `modelEventFrom`、保存の読み返しは `readRuns`）。配線に残る重複（`index` の文面・widget 内容等）は Notes が 02 送りと明記した範囲のため 01 の対象外とする。
- Policy: なし。理由: 製品コードと consult 実装の変更はなく、失敗経路（`readCursor` の undefined、`sendMessage` 投げ、`appendRun` 投げ等）は残り、新たに到達不能・言い換え・bool 写像の確認を足していないため。`Allowed` の削除・統合・fixture 移動・文言修正の範囲内であるため。
- Unproven: なし。理由: 配線の絞り（`run.test.ts:116` の kind+model、`run.test.ts:153-154` の kind のみ、`budget.test.ts:75` の `nudge` 比較等）は plan の Steps 2-3 が決めたレイヤー分割であり、内容が壊れれば `nudge` 単体や `modelEventFrom` 単体が赤くなるため、単体で見れば見逃さないため。
- Noise: なし。理由: 残る数値・文字列（`lastTurn(40)→38`、`p/m`、`START`、`999999` 等）は plan/ADR が残すと決めた値かファクトリへの入力であり、断言自体は変数から取り、型が決める確認や魔数・直書き断言の新設はないため。
- Doubts: なし。

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
