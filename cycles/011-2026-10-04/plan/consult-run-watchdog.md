# PLAN `consult-run-watchdog`

## Files

```text
.pi/extensions/consult/
  run/
    run.ts                     update
    run.test.ts                update
    child.ts
  README.md                    update
.pi/test/
  pi                           add
```

## Slices

1. `agent_end` の後、静かになった子を止める
   - I/O:
     ```ts
     export interface RunState {
       readonly stdout: string;
       readonly stderr: string;
       readonly buffered: string;
       readonly aborted: boolean;
       readonly spent: Spent;
       readonly limits: Limits;
       endedAt?: number; // 新: agent_end を見た時刻
       lastOutputAt: number; // 新: 最後に出力があった時刻
       stopped?: string;
     }
     export function applyEvent(state: RunState, event: unknown, now: number): void;
     // lastOutputAt の初期値は spawn の時刻。stdout のチャンクが届くたびに now で更新する
     // `agent_end` の判定は、解析したイベントの `type === 'agent_end'` だけを見る;
     export function watchdogDue(
       endedAt: number | undefined,
       lastOutputAt: number,
       now: number,
       quietMs: number,
     ): boolean;
     ```
     `RunResult` に `readonly ended: boolean` が増える（必須。`run.test.ts` の literal `spoke` / `cancelled` にも `ended: false` を足す）。
   - Verify:
     - test: `pnpm run test:run .pi/extensions/consult/run/run.test.ts`
       - `agent_end` のイベント → `endedAt` が入る（happy）
       - `agent_end` の後に出力 → `lastOutputAt` が進む（happy）
       - `agent_end` が来ない → `endedAt` は空のまま（empty）
       - 猶予ちょうど（boundary values。`watchdogDue` に `now` を渡して決める）
       - 壊れた行 → イベントとして扱わない（invalid input）
       - 上限で止まった後のイベント → 数えない（既存の `stopped` の規則のまま）（a second call）
       - `ended: true` の run → `stateOf` が `done`、`reasonOf` が理由を返す（happy）
       - `aborted` と `ended` が同時 → `aborted` を先に見る（a second call）
       - 権限: 当てはまらない（子の出力を読むだけ）
   - Steps:
     1. `.pi/extensions/consult/run/run.ts`: `RunState` を export し、`endedAt` と `lastOutputAt` を足す。出力のたびに `lastOutputAt` を更新する
     2. `.pi/extensions/consult/run/run.ts`: 1イベントを state に反映する純関数 `applyEvent` を切り出し、`consumeLine` はそれを呼ぶだけにする
     3. `.pi/extensions/consult/run/run.ts`: `agent_end` を見たら `endedAt` を入れる
     4. `.pi/extensions/consult/run/run.ts`: `watchdogDue` を足す（`endedAt` があり、`lastOutputAt` から `quietMs` 静かなら true）
     5. `.pi/extensions/consult/run/run.ts`: `RunResult` に `ended` を足す。`stateOf` は `aborted` の次に `ended` を見て `done` を返し、`reasonOf` はその理由を返す
     6. `.pi/extensions/consult/run/run.test.ts`: 上のケースを書く。`run.test.ts` にある `RunResult` の literal 全部（`spoke` / `cancelled` / `silent` / `combinedRun` / `stopped`）に `ended: false` を足す
2. 統合: エージェントが終わった後に終わらない子を、run が最後の本文付きで `done` として閉じる
   - I/O:
     ```ts
     export interface RunOptions {
       readonly piArgs: string[];
       readonly stdin: string;
       readonly cwd: string;
       readonly signal?: AbortSignal;
       readonly env: NodeJS.ProcessEnv;
       readonly limits: Limits;
       readonly watchdogMs?: number; // 新: agent_end の後の猶予（既定 30000）
       readonly onStarted?: (pid: number) => void;
     }
     ```
     偽 pi との契約: `--mode json` のふりをして `message_end`（assistant + text）と `agent_end` を JSONL で出し、`FAKE_PI_MODE` で続きを変える
   - Verify:
     - test: `pnpm run test:run .pi/extensions/consult/run/run.test.ts`
       - `FAKE_PI_MODE=sleep`（`agent_end` を出してから眠る）→ 猶予の後に殺され、`ended: true`、`stateOf` が `done`、`stdout` から最後の本文が取れる（happy。殺されるまでの時間は主張しない）
       - `FAKE_PI_MODE=exit`（普通に終わる）→ 殺さず、今までどおり `done`（happy）
       - `FAKE_PI_MODE=extra`（`agent_end` の後にもう1つイベント）→ 猶予の内にタイマーが戻り、殺さない（happy）
       - 猶予の前に親が cancel → `aborted`（concurrency）
       - `PATH` を `pi` の無い一時ディレクトリだけにする → 起動できず `error`（error）
       - 権限: 当てはまらない（`.pi/test/pi` と一時ディレクトリの cwd だけを使う）
   - Steps:
     1. `.pi/extensions/consult/run/run.ts`: `runPi` に猶予の時計を足す（既定 30秒。`RunOptions` に `watchdogMs` を足して差し替えられるようにする）。`watchdogDue` が true なら子を殺し、run を `ended: true` で終える
        - Outside: design の `External: pi` の `Contract`。`--mode json` のイベントに `agent_end` がある前提にする
     2. `.pi/test/pi`: 偽の `pi` を置く。`--mode json` のふりをして、stdin を読み切ってから `message_end`（assistant、本文は `fake report`）と `agent_end` を JSONL で出す。`FAKE_PI_MODE` で続きを変える: `exit` は 0 で終わる、`sleep` は眠り続ける、`extra` は少し待ってからもう1つイベントを出して眠り続ける。`FAKE_PI_TEXT` で本文を差し替えられる（既定は `fake report`）。`FAKE_PI_MODE` が無ければ何も出さず exit 2（手で叩かれても眠らない）。shebang を付け、`chmod +x` して置く
     3. `.pi/extensions/consult/run/run.test.ts`: `PATH` の先頭に `.pi/test/` を立て、`FAKE_PI_MODE` と `watchdogMs: 100` を渡して上のケースを書く。冒頭のコメント（「子の起動は扱わない」）を、偽の `pi` で扱う形に直す
     4. `.pi/extensions/consult/README.md`: 子の終わり方の説明に、報告の後に終わらない子は止めて本文を配達することを足す

## Notes

### Slice 1: `agent_end` の後、静かになった子を止める

- Findings:
- Unplanned:
- Commit:

### Slice 2: 統合: エージェントが終わった後に終わらない子を、run が最後の本文付きで `done` として閉じる

- Findings:
- Unplanned:
- Commit:

## Review

### Round 1

- Stale:
- Unlisted:
- Gaps:

## Acceptance

- Ran:
- Findings:
