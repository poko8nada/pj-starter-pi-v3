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
- Unplanned:

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
