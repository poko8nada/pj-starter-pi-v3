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
       - `ended: true` の run → `stateOf` が `done`、`reasonOf` は理由なし（`undefined`）（happy）
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
  - なし
- Unplanned:
  - なし
- Commit: a61d43f

### Slice 2: 統合: エージェントが終わった後に終わらない子を、run が最後の本文付きで `done` として閉じる

- Findings:
  - なし
- Unplanned:
  - なし
- Commit: 9d98e57

## Review

### Round 1

- Stale:
  - `tool/render.ts` の `compose`（`if (run.stopped !== undefined)`、`run.code !== 0 → error` 分岐）は `ended` を知らず、`stateOf` の新優先度（`aborted` > `ended` > `stopped`）と食い違う。到達可能：`applyEvent` は `agent_end` の後も `message_end` を数え続けるので `ended:true + stopped` が共存し（`run.ts:310-320`）、その run は `stateOf` が `done` なのに `compose` が「consult stopped early」を出す。`compose` の既存テストは `ended:false` のみで `ended:true` の coverage がない（`run.test.ts:343-365`）。`stopped/code ≠ 0 ⇒ 早止まり/異常` という前提が stale。
    fixed: `applyEvent` が報告後の出力を上限に数えないようにし（`run.ts`）、`ended:true + stopped` は `runPi` 経路で共存しなくなった。優先度と `compose(ended:true)` のテストを追加。`tool/render.ts` 自体は ## Files 外のため不変。
  - 本 plan の Slice 1 Verify「`ended: true` の run → `stateOf` が `done`、`reasonOf` が理由を返す」は as-built と食い違う。実装は `ended` なら理由なし（`run.ts:552-` の `reasonOf` は `undefined` を返す）で、テスト名も「理由は出さない」（`run.test.ts:470`）。plan 側の一文が stale。
    fixed: Slice 1 Verify の一文を as-built（`reasonOf` は `undefined`）に合わせた。
- Unlisted:
  - なし（`0d4af01..HEAD` の変更は `run.ts`・`run.test.ts`・`README.md`・`.pi/test/pi` の4点で、いずれも ## Files に named。`child.ts` は named だが無変更のまま）。
- Gaps:
  - `ended:true + stopped` 共存時の優先度が Verify にない。Slice 1 は `aborted + ended`（a second call）のみで、`ended` が `stopped` に勝つこと（`stateOf`/`reasonOf`/`compose` の振る舞い）をどのテストも主張しない。上記 Stale の `compose` 乖離もここから漏れている。
    fixed: `ended` が `stopped` に勝つ `stateOf`/`reasonOf` テストと、報告後に出力を重ねても `stopped` が付かないテストを追加。
  - Slice 2 の `extra` テスト（`run.test.ts:529-535`）はタイマーリセットを証明しない。`ended:true`・`done`・`stdout` に `extra` を含むことは、リセットせず最初の猶予で殺しても成立する。初回締切を越えて生き残ったことの主張がなく、Verify の「猶予の内にタイマーが戻り」は未 cover。
    fixed: 偽 `pi` に `steady` を足し、初回猶予を越える 350ms 生存→abort でリセットを証明するテストを追加。
  - 偽 `pi` の契約の一部と既定猶予が未 cover。`FAKE_PI_TEXT` での本文差し替え、`FAKE_PI_MODE` 未設定・不正時の exit 2（`.pi/test/pi:1-35`）、および既定 `watchdogMs` 30000（`run.ts:366`）の経路は、統合テスト（全て `sleep/exit/extra` × `watchdogMs:100` × 既定本文）が触っていない。
    fixed: `FAKE_PI_TEXT` 差し替え・未設定/不正の exit 2・`watchdogMs` 省略の既定経路のテストを追加。
  - 「静か」の定義が層で割れていて未 cover。`consumeStdout` は空行・壊れた行も含め stdout チャンク毎に `lastOutputAt` を進める（`run.ts:440` が `consumeLine` の早期 return より前）が、単位レベルの `applyEvent` は非 record 入力で `lastOutputAt` を進めないことがテストで固定されている。一方 `stderr` は猶予を延ばさない（`appendStderr` は時計を触らない、`run.ts:451-454`）。空行・壊行・`agent_end` 後の `stderr` が猶予に効くかは Verify のどこも主張しない。
    fixed: 非recordは時計を進めない単体テストを拡充し、壊行/空行は進むこと（`broken` mode 生存）と `stderr` は延ばさないこと（`stderr` mode で `done`）を統合テストで固定。

### Round 2

- Stale:
  - なし（`fixed:` 2件を検証。`applyEvent` は報告後を上限に数えず、先に `stopped` が立てば `endedAt` を入れないので、`ended:true + stopped` は `runPi` の経路で共存しない。単体・優先度・`compose(ended:true)` のテストあり。`tool/render.ts` を変えないのは、その状態が到達不能になったためで許容）
  - なし（Slice 1 の Verify 一文は as-built の「`reasonOf` は理由なし（`undefined`）」に直り、実装とテスト名に一致）
- Unlisted:
  - なし（変更は `run.ts` / `run.test.ts` / `.pi/test/pi` のみで、いずれも `## Files` に named）
- Gaps:
  - 既定猶予 30000 の値が未 cover。`watchdogMs` を省略した既定経路のテスト（`run.test.ts:712-723`）は `exit`（即時正常終了）なので watchdog が発火せず、既定値が何でも通る。`DEFAULT_WATCHDOG_MS = 30000` は非 export で、`??` 分岐を通ることは示すが 30000 であることは主張しない
    fixed: `DEFAULT_WATCHDOG_MS` を export して 30000 のテストを追加。既存の省略テストと合わせ値と経路を cover（30秒の実待ちはしない）。

### Round 3

- Stale:
  - なし
- Unlisted:
  - なし
- Gaps:
  - なし（`fixed:` 1件を検証。`DEFAULT_WATCHDOG_MS` は export され 30000 に固定（`run.ts:370`、`run.test.ts:7,713-715`）。既存の省略テスト（`run.test.ts:717-728`）と合わせ値と経路を cover し、30秒の実待ちなし）

## Acceptance

- Ran:
  - `pnpm run test:run .pi/extensions/consult/run/run.test.ts` → 58 passed
  - `pnpm run typecheck` → 緑
  - `pnpm run test:run` → 20 files / 370 passed
- Findings: なし
