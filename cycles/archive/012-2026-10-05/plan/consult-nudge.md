# PLAN `consult-nudge`

## Files

```text
.pi/extensions/consult/
  child/
    budget.ts                  update
    budget.test.ts             update
    spec.test.ts               update
  run/
    child.test.ts              update
    run.test.ts                update
```

## Slices

1. 促しの番号を上限の2つ前にし、いつ出すかを試せる形にする
   - I/O:
     ```ts
     // 変わる: 上限 40 なら 38 を返す（いまは 39）
     export function lastTurn(turns: number | undefined): number | undefined;

     // そのまま: 促しの1つ分。出す必要がなければ undefined
     // 返す TurnEndEventResult の中身: { entries: [{ type: 'custom_message', customType, content, display }], continue: true }
     export function nudge(
       limit: number | undefined,
       sent: boolean,
       turnIndex: number,
     ): TurnEndEventResult | undefined;

     // そのまま: env の文字列を上限にする。正の整数でなければ undefined
     export function turnsFrom(value: string | undefined): number | undefined;

     // 増える: 促しを登録する所を切り出す（いまは default export の中）
     export interface BudgetPiPort {
       on(event: 'turn_end', handler: (event: { turnIndex: number }) => TurnEndEventResult): void;
     }
     export function registerBudget(pi: BudgetPiPort, turns: number | undefined): void;
     ```
   - Verify:
     - test: `pnpm run test:run .pi/extensions/consult/child/budget.test.ts`
       - `lastTurn(40)` が 38（39 ではない）→ 促しの後に1ターン残る（happy）
       - `lastTurn(2)` が 0（boundary values）
       - `lastTurn(undefined)` / `lastTurn(1)` / `lastTurn(0)` / `lastTurn(2.5)` が `undefined`（invalid input）
       - `nudge(38, false, 38)` が `{entries: [custom_message], continue: true}` を返す（happy）
       - `nudge(38, false, 37)` が `undefined`（促す番号の1つ手前。boundary values）
       - `nudge(38, true, 38)` が `undefined`（一度出したら出さない。a second call）
       - `registerBudget` を偽 `pi` で組み、`turnIndex` 38 の `turn_end` を2度起こす → 1度目だけ促す（閉じ込めた `sent` の a second call）
       - 権限: 当てはまらない（数と値を返すだけ）
   - Steps:
     1. `.pi/extensions/consult/child/budget.ts`: `lastTurn` が返す番号を `turns - 2` にする。`turns` が 2 未満なら `undefined` のまま
        - Outside: design の `External`（`pi`: `turn_end` から `{entries, continue}` を返せる）。番号を1つ手前へ動かすだけで、pi に求める物は変わらない
     2. `.pi/extensions/consult/child/budget.ts`: `registerBudget(pi, turns)` を切り出し、`default export` は `registerBudget(pi, turnsFrom(process.env.CONSULT_TURNS))` を呼ぶだけにする
     3. `.pi/extensions/consult/child/budget.test.ts`: 上のケースを書く。`registerBudget` は偽 `pi`（`on` を記録するだけ）で試す
2. 促しが子に届く配線を固定する
   - I/O: なし（`buildPiArgs` と `childEnv` の形は変わらない）
   - Verify:
     - test: `pnpm run test:run .pi/extensions/consult/child/spec.test.ts`
       - `buildPiArgs` の引数の `--extension` がちょうど2つで、1つ目の直後が guard の絶対パス、2つ目の直後が budget の絶対パス（happy。個数と順序まで固定する）
       - 権限: 当てはまらない
     - test: `pnpm run test:run .pi/extensions/consult/run/child.test.ts`
       - `childEnv({ ...policy, limits: { turns: 40, output: 8000 } })` の `CONSULT_TURNS` が `'40'`（happy。値の振りを見る）
       - 権限: 当てはまらない
   - Steps:
     1. `.pi/extensions/consult/child/spec.test.ts`: `--extension` の個数だけでなく、その直後の2つの値を主張する形に直す（budget が子に載ることを固定する）
     2. `.pi/extensions/consult/run/child.test.ts`: `childEnv` の `CONSULT_TURNS` の値を確かめる形に直す（既に1件あるので、値の主張を足す）
3. 統合: 上限が読まれてから促しが出るまで
   - I/O: なし
   - Verify:
     - test: `pnpm run test:run .pi/extensions/consult/child/budget.test.ts`
       - `turnsFrom('40')` → `lastTurn` → 38 → `registerBudget(pi, 38)` の `turnIndex` 38 で促しが出る（happy。env から促しまでの1本）
       - 同じ並びで `turnIndex` 37 → 促しは出ない（boundary values）
       - `turnsFrom('')` / `turnsFrom('x')` / `turnsFrom(undefined)` → 促しは出ない（invalid input。上限が読めない）
       - 権限: 当てはまらない
     - test: `pnpm run test:run .pi/extensions/consult/run/run.test.ts`
       - 上限で止まった子の `stdout` に本文の `message_end` がある → `stateOf` は `turn-limit` で、本文は `finalTextFrom(parseEvents(...))` で取れる（error。促しを無視しても本文が失われない）
       - 権限: 当てはまらない
   - Steps:
     1. `.pi/extensions/consult/child/budget.test.ts`: 上のケースを足す（env から促しまでを1本で歩く）
     2. `.pi/extensions/consult/run/run.test.ts`: `stateOf` と `finalTextFrom` の純粋な組み合わせを足す（偽 `pi` は要らない。`turn-limit` の `RunResult` を直に組む）。促しのループそのものは子の pi の内部（`budget.ts`）で、Slice 1 と 2 が押さえる

## Notes

### Slice 1: 促しの番号を上限の2つ前にし、いつ出すかを試せる形にする

- Findings:
  - なし
- Unplanned:
  - なし
- Commit: f9e2757

### Slice 2: 促しが子に届く配線を固定する

- Findings:
  - なし
- Unplanned:
  - なし
- Commit: 88927ff

### Slice 3: 統合: 上限が読まれてから促しが出るまで

- Findings:
  - なし
- Unplanned:
  - なし
- Commit: b29af3d

## Review

### Round 1

- Stale:
  - なし（consult 内に 39/`turns - 1` の残りは無い。`child/budget.ts:4-8,14` と `child/budget.test.ts:20-25` は 38/`turns - 2` に更新済み。`README.md:143`「last turn の前に促す」・`child/spec.ts:20-22`「上限の手前」は 2 つ手前でも真で偽にならない。`second-opinion/child/budget.ts:19` の `turns - 1` は別拡張の写しで `design.md:5` が対象外と明記。`adr.md:69,130`・`009/plan.md:61` の `turns - 1` は当時の観測・履歴で仕様ではない）
- Unlisted:
  - なし（`8703e56..HEAD` は `child/budget.ts`・`child/budget.test.ts`・`child/spec.test.ts`・`run/child.test.ts`・`run/run.test.ts` の 5 件で Files の 5 項目と一致）
- Gaps:
  - `default export` の env 読み→登録の配線を検査が歩かない。変更点 `child/budget.ts:81-83`（`turnsFrom(process.env.CONSULT_TURNS)` を `registerBudget` に渡す）に対し、テストは `child/budget.test.ts:3` の名前付き import のみで default を呼ばず、env からの 1 本も `turnsFrom('40')` の直値代用（`child/budget.test.ts:96-99` の `fireWith(turns, ...)`）。`CONSULT_TURNS` 未設定・不正で default が登録しないこと、`'40'` で 38 に登録することの e2e が無い（値 40/38 自体は plan 決定のため問わない）
    fixed: default export の env 配線を `fireDefaultWith` で試した（`'40'`→38 で促す、未設定・`''`・`'x'` は促さない）。偽 pi を unsafe 主張なしで渡せるよう default の引口を `BudgetPiPort` に狭めた
  - 同一登録での `37 → 38` の順序を検査が歩かない。`registerBudget` は `result === undefined` のとき `sent` を立てない（`child/budget.ts:70-76`）が、Slice 1 Verify は `38,38` の 2 度押しのみ、Slice 3 の `37` は毎回新規 `pi` の `fireWith`（`child/budget.test.ts:8-17,104-106`）。同一 `pi` で `37` の後に `38` が促すこと（`37` が `sent` を消費しないこと）を主張する物が無い
    fixed: 同一 pi で 37→38 の順序を試した（37 は `{}` で `sent` を消費せず、38 で促す）
- Unproven:
  - `child/budget.test.ts:79-92`「促しの番号で 1 度だけ促す」は `entries` を見ない。`first` の `continue` と `second` の `{}` だけなので、`nudge` が `{continue: true, entries: []}` を返しても緑のまま。促しの中身（`custom_message` 1 件）は `nudge` 単体と env chain が見るが、このテストの名指す「促す」は素抜け
    fixed: `first` に `entries` 1 件（`custom_message`/`consult-budget`）の主張を足した

## Acceptance

- Ran:
  - `pnpm run test:run`（worktree、29 files / 678 tests、すべて green）
  - `pnpm run typecheck` / `pnpm run lint` / `pnpm run format:check`（すべて green）
  - 変異試験3件。`lastTurn` の `turns - 2` を `turns - 1` に → `budget.test.ts` が 6 件赤。`sent = true` を削除 → 一度だけ促すケースが赤。`--extension` の順序を入れ替え → `spec.test.ts` が 2 件赤。いずれも復元して 138 件 green に戻した
- Findings:
  - なし
