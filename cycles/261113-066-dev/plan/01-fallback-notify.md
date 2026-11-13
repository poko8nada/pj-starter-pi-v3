# PLAN `fallback-notify`

- No: 01, 02
- Place: worktree
- Boundary Plans: なし

## Goal

乗り換えの判定がエラー応答でも働き、モデルの再試行と乗り換えがその場で警告として見える。

## Design

- Inside:
  - Modules: 新しいモジュールは作りません。末尾メッセージの判定（`Failure` と `failureFrom`）と、再試行イベントの読み取り（`ModelEvent` と `modelEventFrom`）は、pi の JSONL を読む `sub/spec.ts` に置きます。`parseEvents`、`ranFrom`、`modelFrom`、`errorFrom` が既にあり、イベントの読み方を 1 か所に保つためです。`errorFrom` は `failureFrom` に統合して消します。通知の 1 行は、エージェントに渡す文を組み立てる `tool/render.ts` に置きます（`reportBlock`、`usageLine`、`compose` と同じ関心を扱うためです）。イベントを伝えるコールバックは `run/run.ts`（`RunOptions`、`RunState`、`runWithFallback`）と `run/subagent.ts` に足し、通知の発火は `tool/consult.ts` の `consult()` に置きます。レイヤーをまたぐ形は既存の `onProgress`、`onDone`、`onStarted` と同じです。通知の窓口（`notify`）は `CommandContext.ui` と同じ形なので、`NotifyUI` として 1 つにし、両方がそれを使います。`run/run.test.ts` を新しく作ります。`runWithFallback` の継続条件を直接試すテストがなく、`run/run.ts` の隣にテストを置くのが既存の並び（`delivery.test.ts` など）に合うためです。スライスは 1、2、3、4 の順に進めます。スライス 3 はスライス 1 の `failureFrom` とスライス 2 の `tryAt` の上に載り、スライス 4 はスライス 1〜3 の振る舞いを説明します。
  - Dirs: なし。
- Outside:
  - Extract: なし。通知の 3 つの文面はこの plan だけが使い、他の plan と共有しません。
  - Colocate: なし。

## Files

```text
.pi/
  extensions/
    consult/
      run/
        log.ts
        run.test.ts                 add
        run.ts                      update
        subagent.test.ts            update
        subagent.ts                 update
      sub/
        spec.test.ts                update
        spec.ts                     update
      tool/
        consult.test.ts             update
        consult.ts                  update
        render.test.ts              update
        render.ts                   update
      README.md                     update
      types.json
```

## Slices

## 1.末尾メッセージの判定

最後の assistant メッセージがエラーで終わったかを、1 つの結果型で返すようにします。

### Types

```ts
/** サブエージェントの末尾メッセージ。失敗したか、失敗したならその理由 */
export type Failure =
  | { readonly failed: false }
  | { readonly failed: true; readonly message: string };

/** 最後の assistant メッセージがエラーで終わったかどうかと、その理由 */
export function failureFrom(events: unknown[]): Failure;

/** `message_end` の assistant メッセージに、メッセージの終わり方を足す */
interface AssistantMessage {
  // ...
  stopReason?: string;
}
```

### Steps

1. `.pi/extensions/consult/sub/spec.ts`
   1. add: `Failure` を足す。`failed` で判別できる共用体にする。
   2. update: `AssistantMessage` に `stopReason?: string` を足す。`message_end` の assistant メッセージからエラーで終わったかを読むため。
   3. add: `failureFrom(events)` を足す。最後の assistant の `message_end` だけを見て、`stopReason === "error"` なら `{ failed: true, message: errorMessage ?? '' }`、そうでなければ `{ failed: false }` を返す。

      ```ts
      /** 最後の assistant メッセージがエラーで終わったかどうかと、その理由 */
      export function failureFrom(events: unknown[]): Failure {
        for (let i = events.length - 1; i >= 0; i -= 1) {
          const event = asEvent(events[i]);
          if (event.type !== 'message_end' || event.message?.role !== 'assistant') {
            continue;
          }
          return event.message.stopReason === 'error'
            ? { failed: true, message: event.message.errorMessage ?? '' }
            : { failed: false };
        }
        return { failed: false };
      }
      ```

   4. drop: `errorFrom` を消す。理由の文字列は `failureFrom` の結果から取り出す。
   5. update: `ranFrom` のコメントを、生成の有無だけを見る述語に直す。

      ```ts
      /**
       * サブエージェントがモデルから何かを生成したか。
       *
       * エラーを出さずに終わった失敗（存在しないモデル ID など）を拾うために使う。
       */
      ```

2. `.pi/extensions/consult/tool/render.ts`
   1. update: `errorFrom` の import を `failureFrom` に変える。
   2. update: `compose` の本文がないときの理由を、`failureFrom(events)` から作る。`code !== 0` の分岐は消し、終了コードに関係なく理由を出す。`message` が空なら `stderr` に切り替える。

      ```ts
      const text = finalTextFrom(events);
      if (text !== '') {
        lines.push(text);
      } else {
        const failure = failureFrom(events);
        const reason = failure.failed ? failure.message : '';
        lines.push(reason || run.stderr.trim() || '(the subagent produced no text)');
      }
      ```

3. `.pi/extensions/consult/sub/spec.test.ts`
   1. update: `errorFrom` の import を消す（`snapshot` に残らないようにする）。
   2. drop: `errorFrom` のテストを消す。
   3. add: `failureFrom` のテストを足す。ケースは次のとおり。

      - `failure`: (happy) 前のエラーがあり、最後が成功 → `{ failed: false }`
      - `failure`: (error) 最後が `stopReason: "error"` と `errorMessage` → `{ failed: true, message }`
      - `failure`: (empty) assistant の `message_end` がない → `{ failed: false }`

4. `.pi/extensions/consult/tool/render.test.ts`
   1. add: `compose` のテストを足す。ケースは次のとおり。

      - `compose`: (error) 本文が空で、最後がエラー → その理由を出す
      - `compose`: (happy) 本文が空で、前のエラーだけ → `stderr` を出す

### Policy

- Allowed:
  - `errorMessage` を、失敗の理由として読む。
- Forbidden:
  - 終了コードで判定しない - JSON モードのエラー応答は終了コード 0 になる。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/consult/sub/spec.ts .pi/extensions/consult/tool/render.ts .pi/extensions/consult/sub/spec.test.ts .pi/extensions/consult/tool/render.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added: なし

## 2.乗り換えの継続条件

`runWithFallback` が、生成が 0 か、末尾メッセージが失敗したかのどちらかで、次の候補へ進むようにします。

### Types

なし

### Steps

1. `.pi/extensions/consult/run/run.ts`
   1. update: `sub/spec.ts` から `failureFrom` を import する。
   2. update: `tryAt` の継続条件を、`moveOn = !ranFrom(events) || failureFrom(events).failed` に変える。最後の試行、中断、ターン上限は、解析する前に返す。

      ```ts
      async function tryAt(index: number): Promise<RunResult> {
        const run = await runOnce(attempts[index]);
        const next = index + 1;
        // 最後の試行（メインエージェントと同じ）、中断、ターン上限は、いずれもそのまま返す。
        if (next >= attempts.length || run.aborted || run.stopped !== undefined) {
          return run;
        }
        const events = parseEvents(run.stdout);
        // 生成が 0、または最後のメッセージがエラーなら、次の候補へ進む。
        const moveOn = !ranFrom(events) || failureFrom(events).failed;
        return moveOn ? tryAt(next) : run;
      }
      ```

   3. update: `runWithFallback` のコメントを新しい規則に直す。

2. `.pi/extensions/consult/run/run.test.ts`
   1. add: `runWithFallback` の継続条件のテストを足す。偽の `runOnce` が、イベントの JSONL から作った `RunResult` を返す。ケースは次のとおり。

      - `fallback`: (happy) 生成が 0 で終わる → 次の候補を試す
      - `fallback`: (error) 出力があり、最後がエラー → 次の候補を試す
      - `fallback`: (happy) 前のエラーがあり、最後が成功 → 乗り換えない
      - `fallback`: (error) 中断 → 乗り換えない
      - `fallback`: (boundary) 最後の試行 → そのまま返す
      - `fallback`: (boundary) ターン上限（`stopped`） → 乗り換えない

### Policy

- Allowed:
  - なし
- Forbidden:
  - 中断（`aborted`）で乗り換えない - 止めたのに別のモデルで走り直すのは意図に反する。
  - 生成の有無の判定を消さない - 存在しないモデル ID や認証鍵の欠落では、JSON のエラーを出さずに終了コード 1 になるため、生成の有無が唯一の手がかりになる。
  - 候補の数と pi の再試行の設定を変えない - 乗り換えは最後の退避であり、費用の上限は候補の数で決まる。
  - 最後の試行（メインエージェントの設定）より先へ進めない - 候補を使い切ったらそこで終わる。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/consult/run/run.ts .pi/extensions/consult/run/run.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added: なし

## 3.再試行と乗り換えの通知

モデルの再試行と乗り換えを捉え、その場で 3 種類の `warning` を出します。

### Types

```ts
/** 再試行のイベント。pi の `auto_retry_start` と `auto_retry_end` から作る */
export type ModelEvent =
  | {
      readonly kind: 'retry-start';
      readonly model: string | undefined;
      readonly attempt: number;
      readonly maxAttempts: number;
      readonly delayMs: number;
      readonly error: string;
    }
  | {
      readonly kind: 'retry-end';
      readonly model: string | undefined;
      readonly attempt: number;
      readonly success: boolean;
    };

/** 再試行のイベントだけを取り出し、それ以外は undefined を返す */
export function modelEventFrom(event: unknown, model: string | undefined): ModelEvent | undefined;

/** 乗り換えの行き先。最後の試行（メインエージェントの設定）は undefined */
export interface Fallback {
  readonly requested: string | undefined;
}

/** 再試行の始まり。エラーの理由は 1 行にし、120 文字で切る */
export function retryStartLine(
  label: string,
  model: string,
  attempt: number,
  maxAttempts: number,
  error: string,
  delayMs: number,
): string;

/** 再試行の終わり */
export function retryEndLine(
  label: string,
  model: string,
  attempt: number,
  maxAttempts: number,
  success: boolean,
): string;

/** 乗り換え。前のモデルは出さない */
export function fallbackLine(label: string, next: string): string;

export interface RunState {
  // ...
  /** 直近の assistant メッセージのモデル。再試行の行に使う */
  lastModel?: string;
}

export interface RunOptions {
  // ...
  /** 再試行のイベント。サブエージェントの出力が届くたびに呼ぶ */
  readonly onModelEvent?: (event: ModelEvent) => void;
}

/** 1 つのイベントを state に反映し、再試行のイベントならそれを返す */
export function applyEvent(state: RunState, event: unknown, now: number): ModelEvent | undefined;

/** 通知の窓口。`CommandContext` と `ConsultContext` で同じ形 */
export interface NotifyUI {
  notify(message: string, type?: 'info' | 'warning' | 'error'): void;
}

export interface ConsultContext {
  readonly cwd: string;
  readonly ui: NotifyUI;
}

/** `runOneSubagent` が受け取る通知の窓口 */
export interface SubagentHooks {
  readonly onModelEvent?: (event: ModelEvent) => void;
  readonly onFallback?: (attempt: Fallback) => void;
}

/** モデルの再試行と乗り換えを通知する。失敗しても実行を止めない */
export function modelNotifier(
  ctx: ConsultContext,
  label: string,
): {
  readonly onModelEvent: (event: ModelEvent) => void;
  readonly onFallback: (attempt: Fallback) => void;
};
```

### Steps

1. `.pi/extensions/consult/sub/spec.ts`
   1. add: `ModelEvent` を足す。
   2. add: `modelEventFrom(event, model)` を足す。`auto_retry_start` を `retry-start`、`auto_retry_end` を `retry-end` にし、それ以外は `undefined` を返す。項目はイベントから写す。`ModelEvent.error` にはイベントの `errorMessage` を入れ、`model` は引数の値を入れる。型が合わない再試行イベント（`attempt`、`maxAttempts`、`delayMs` が数値でない、`success` が真偽値でない）は `undefined` を返し、通知しない。`errorMessage` が文字列でなければ空文字にする。壊れた値で行を出さないためです。
2. `.pi/extensions/consult/run/run.ts`
   1. update: `RunState` に `lastModel` を足し、`applyEvent` が assistant の `message_end` で `modelFrom([event])` を `lastModel` に入れる。
   2. update: `applyEvent` の戻り値を `ModelEvent | undefined` にし、assistant の `message_end` で `lastModel` を更新し、再試行のイベントなら `modelEventFrom(event, state.lastModel)` を返す。
   3. update: `RunOptions` と `LiveRun` に `onModelEvent` を足す。`consumeLine` の引数に `live` を渡し（`consumeStdout` の呼び出しを変える）、`applyEvent` の戻り値を `live.onModelEvent` に渡す。
   4. add: `Fallback` を置く。`onFallback` の引数の型とし、`requested` だけを持つ。
   5. update: `runWithFallback` に `onFallback` を足し、`moveOn` が真のとき `{ requested: attempts[index + 1] }` を渡す。
3. `.pi/extensions/consult/run/subagent.ts`
   1. add: 4 つ目の引数 `hooks: SubagentHooks = {}` を足す。
   2. update: `hooks.onModelEvent` を `runPi` に、`hooks.onFallback` を `runWithFallback` に渡す。`onModelEvent` の `model` が undefined なら、要求した候補で埋める。
4. `.pi/extensions/consult/tool/render.ts`
   1. add: `shortError` を足す。最初の行だけを使い、120 文字を超えたら `…` を付ける。
   2. add: `retryStartLine`、`retryEndLine`、`fallbackLine` を足す。

      ```ts
      /** 再試行の始まり。エラーの理由は 1 行にし、120 文字で切る */
      export function retryStartLine(
        label: string,
        model: string,
        attempt: number,
        maxAttempts: number,
        error: string,
        delayMs: number,
      ): string {
        return `[consult] ${label}: ${model} retry ${attempt}/${maxAttempts} (${shortError(error)}) in ${Math.round(delayMs / 1000)}s`;
      }

      /** 再試行の終わり */
      export function retryEndLine(
        label: string,
        model: string,
        attempt: number,
        maxAttempts: number,
        success: boolean,
      ): string {
        return `[consult] ${label}: ${model} retry ${attempt}/${maxAttempts} ${success ? 'ok' : 'failed'}`;
      }

      /** 乗り換え。前のモデルは出さない */
      export function fallbackLine(label: string, next: string): string {
        return `[consult] ${label}: → ${next}`;
      }

      /** エラーの理由を 1 行にし、120 文字で切る */
      function shortError(error: string): string {
        const line = error.split('\n')[0] ?? '';
        return line.length > 120 ? `${line.slice(0, 120)}…` : line;
      }
      ```

5. `.pi/extensions/consult/tool/consult.ts`
   1. update: `NotifyUI` を足し、`ConsultContext.ui` と `CommandContext.ui` を `NotifyUI` にする。
   2. add: `modelNotifier(ctx, label)` を足す。`retry-start` の `maxAttempts` を覚え、`retry-end` の行に使う。3 つの文面を組み立て、`ctx.ui.notify(line, 'warning')` を try/catch で呼ぶ。`model` が undefined なら `(model unknown)`、`requested` が undefined なら `main` と出す。
   3. update: `consult()` が `modelNotifier(ctx, job.id)` を呼び、その 2 つのコールバックを `runOneSubagent` の `hooks` に渡す。
6. `.pi/extensions/consult/sub/spec.test.ts`
   1. add: `modelEventFrom` のテストを足す。ケースは次のとおり。

      - `modelEvent`: (happy) `auto_retry_start` → `retry-start` と `attempt`、`maxAttempts`、`delayMs`、`error`
      - `modelEvent`: (happy) `auto_retry_end` → `retry-end` と `success`
      - `modelEvent`: (empty) 他のイベント → `undefined`
7. `.pi/extensions/consult/run/run.test.ts`
   1. add: `lastModel` のテストを足す。`applyEvent` に assistant の `message_end` を渡す。ケースは次のとおり。

      - `modelEvent`: (happy) assistant の `message_end` → `lastModel` がそのモデル
      - `modelEvent`: (empty) `message_end` がない → `lastModel` は undefined
      - `modelEvent`: (happy) `auto_retry_start` → `applyEvent` が `retry-start` を返す
      - `modelEvent`: (empty) 他のイベント → `undefined`

   2. add: `onFallback` のテストを足す。ケースは次のとおり。

      - `fallback`: (happy) 乗り換え → `onFallback` が次の候補で呼ばれる
      - `fallback`: (happy) 乗り換えない → 呼ばれない
      - `fallback`: (error) 中断 → 呼ばれない

   `onModelEvent` の配線は `subagent.test.ts` で確かめる（偽の `runPi` が受け取る options を見る）。

8. `.pi/extensions/consult/tool/render.test.ts`
   1. add: 3 つの文面のテストを足す。ケースは次のとおり。

      - `retry`: (happy) `retry-start` の文面
      - `retry`: (happy) `retry-end` の `ok`
      - `retry`: (error) `retry-end` の `failed`
      - `switch`: (happy) `→ <next>`

9. `.pi/extensions/consult/tool/consult.test.ts`
   1. update: 偽 `ctx` に `ui` を足す。
   2. add: `modelNotifier` のテストを足す。ケースは次のとおり。

      - `notify`: (happy) `retry-start` → `warning` で 1 回
      - `notify`: (happy) `retry-end` → 1 回
      - `notify`: (happy) 乗り換え → 1 回
      - `notify`: (boundary) `requested` が undefined → `→ main`
      - `notify`: (boundary) `model` が undefined → `(model unknown)` を含む
10. `.pi/extensions/consult/run/subagent.test.ts`
    1. update: 偽の `runPi` が options を記録し、`onModelEvent` が渡されることを試す。
    2. update: `CONTEXT` に `ui` を足す。
    3. add: `onModelEvent` の `model` が undefined のとき、要求した候補で埋まることを試す。

### Policy

- Allowed:
  - `auto_retry_start`、`auto_retry_end`、`onFallback` を通知のきっかけにする。
  - `modelFrom` で実際に走ったモデルを取得する。
  - `warning` を使い、行を追加する。
  - UI がないモードでは、pi の `notify` に任せる（consult 側で `hasUI` を見ない）。
- Forbidden:
  - `info` を使わない - 直前の status 行を置き換えるため、再試行が続くと最後しか見えない。
  - 乗り換えの文面にエラーを入れない - 再試行の行で理由が分かる。
  - 候補の文字列だけで走ったモデルを決めない - 実際のモデルは `modelFrom` が返す値である。
  - 通知のために乗り換えの判定を変えない - 判定は 01 が決めた。
  - 通知の失敗を記録に残さない - 記録の形を変えると 03 と既存の記録に波及する。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/consult/sub/spec.ts .pi/extensions/consult/run/run.ts .pi/extensions/consult/run/subagent.ts .pi/extensions/consult/tool/render.ts .pi/extensions/consult/tool/consult.ts .pi/extensions/consult/sub/spec.test.ts .pi/extensions/consult/run/run.test.ts .pi/extensions/consult/run/subagent.test.ts .pi/extensions/consult/tool/render.test.ts .pi/extensions/consult/tool/consult.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added: なし

## 4.ドキュメント

`## Model candidates` を新しい規則に書き換え、通知と費用の目安を書き、`## Tests` に `run/run.test.ts` を足します。

### Types

なし

### Steps

1. `.pi/extensions/consult/README.md`
   1. update: `## Model candidates` を、生成が 0 か、末尾メッセージがエラーかのどちらかで次の候補へ進む形に書き換える。「生成した後に失敗したら乗り換えない」の段落を消す。
   2. update: 未知の ID を、どのプロバイダにも一致しない ID と、プロバイダはあるがカタログにない ID の 2 つに分ける。
   3. update: pi の再試行（`retry.maxRetries`、2 秒、4 秒、8 秒）と、候補を使い切った後の 1 回分を含む待ち時間の目安を 1 段落で足す。
   4. update: 再試行の始まり、再試行の終わり、乗り換えの `warning` を 1 段落で足す。
   5. update: `## Tests` 表に `run/run.test.ts` の行を足す。Covers は「the fallback: the condition, the attempt record, the switch」のように書く。

### Policy

- Allowed:
  - なし
- Forbidden:
  - なし

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added: なし

## Notes

### Slice 1: 末尾メッセージの判定

- Findings: なし
- Unplanned: なし
- Commit: 3941d24
- Stopped:

### Slice 2: 乗り換えの継続条件

- Findings: なし
- Unplanned: `.pi/extensions/consult/run/run.ts` の冒頭コメントで `CLI` の後ろの語を `バージョン` に直した。ja-check がこのファイルを変えた commit で既存の行をエラーにし、commit が止まるため。
- Commit: 492e95b
- Stopped:

### Slice 3: 再試行と乗り換えの通知

- Findings: なし
- Unplanned:
  - `.pi/extensions/consult/tool/render.ts` の `retryStartLine` と `retryEndLine` に `eslint-disable-next-line max-params` を理由付きで足した。plan の署名が 6 個・5 個の引数を持ち、`pnpm lint` の上限 4 を超えるため。
  - `.pi/extensions/consult/run/subagent.ts` の既存コメントで、サブエージェントを識別する語を `区別` に直した。ja-check がこのファイルを変えた commit で既存の行をエラーにし、commit が止まるため。
  - `.pi/extensions/consult/tool/consult.test.ts` の既存コメントを、ctx が cwd と通知の窓口を持つ形に合わせた。
- Commit: 5a3db14
- Stopped:

### Slice 4: ドキュメント

- Findings:
- Unplanned:
- Commit:
- Stopped:

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
