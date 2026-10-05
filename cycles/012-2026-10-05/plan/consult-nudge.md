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
- Unplanned:
- Commit:

### Slice 2: 促しが子に届く配線を固定する

- Findings:
- Unplanned:
- Commit:

### Slice 3: 統合: 上限が読まれてから促しが出るまで

- Findings:
- Unplanned:
- Commit:

## Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Unproven:

## Acceptance

- Ran:
- Findings:
