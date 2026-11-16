# ADR 066

## 01: 乗り換えの判定をエラー応答で行う

Type: _Full_

### Context

- C1: このサイクルは ROADMAP.md 027（0.9.6、consultの改修）を扱い、エントリを 01〜03 の順に議論する。01 は乗り換えの判定を扱う。
- C2: いまの乗り換えは `run/run.ts` の `runWithFallback` が行う。候補モデルを順に試し、`sub/spec.ts` の `ranFrom`（`usageFrom(...).output > 0`）が偽のときだけ次の候補へ進む。中断（`aborted`）のときと、候補を使い切った後の 1 回（`--model` を渡さずメインエージェントと同じ設定で走る）では乗り換えない。
- C3: いまの実装は、生成が 0 ならモデルが動かなかったと見なし、生成の後に失敗したならタスクの失敗と見なして乗り換えない（`sub/spec.ts` の `ranFrom` のコメント）。
- C4: オーナーは、乗り換えの条件が微妙だと考えている。できれば、エラー応答が返ってきたら乗り換える形にしたい（オーナーの回答）。
- C5: type ごとの候補モデルの並びは `types.json` が持つ。このエントリでは候補の並びを変えない。
- C6: 乗り換えの判定を、生成の有無ではなくエラー応答で行えるか。行うなら、何をエラー応答と見なすか。

### Research & Trial

- F1: モデルの API エラーは `message_end` の assistant メッセージに載る。`event.message.stopReason === "error"` と `event.message.errorMessage` が手がかりで、HTTP ステータス専用の項目はない。429 と 503 は `errorMessage` の文字列でしか区別できない。出所: `node_modules/@earendil-works/pi-coding-agent/docs/message-types.md:119-140`、`docs/json.md:88-91`、`.../pi-ai/dist/utils/error-body.js:102-118`
- F2: JSON モードでは、assistant の `stopReason: "error"` は終了コード 0 になる。非 0 になるのは、起動時のモデル解決エラー、認証情報の欠落などの throw、シグナルの 129 と 143 である。出所: `docs/cli-integration.md:46`、`dist/modes/print-mode.js:110-136`、`dist/main.js:745-753`
- F3: pi はエージェントレベルの再試行を既定で行う（`retry.maxRetries = 3`、指数バックオフ）。`429`、`503`、`overloaded`、`rate limit`、`service unavailable` などが対象で、quota や billing の 429 は除かれる。この再試行は `auto_retry_start` と `auto_retry_end` として JSON に出る。同じモデルで続きを走らせる経路で、モデルやプロバイダは切り替えない。出所: `dist/core/settings-defaults.js:17-24`、`docs/settings.md:128-131`、`.../pi-ai/dist/utils/retry.js:4-36,108-112,202-209`、`docs/json.md:161-170`、`dist/core/agent-session.js:1449-1455,3102-3108`
- F4: プロバイダレベルの再試行（408/409/429/5xx）もあり、既定は `retry.provider.maxRetries = 0` である。このレイヤーは JSON イベントを出さない。429・503 を契機に pi が別モデル・別プロバイダへ切り替える処理は見つからない。出所: `.../pi-ai/dist/utils/provider-retry.js:9-21,76-95`、`docs/settings.md:133`、`docs/virtual-models.md:77-86`
- F5: `ranFrom` は `usageFrom(events).output > 0` だけを見て `stopReason` を見ない。よって、エラー応答で出力 0 なら乗り換え、エラー応答でも出力が 1 以上なら乗り換えない。正常応答で出力 0 の場合も乗り換えになる。429・503 が必ず出力 0 になる保証はなく、ストリームの途中まで生成してから失敗した場合は出力が 1 以上になり得る。出所: `.pi/extensions/consult/sub/spec.ts:149-151,175-188`、`.pi/extensions/consult/run/run.ts:77-85`、`.../pi-ai/dist/api/anthropic-messages.js:381-397,710-718`、`.../pi-ai/dist/api/openai-completions.js:361-373,493-515`、`docs/json.md:95`
- F6: 失敗の見え方は種類で異なる。存在しないモデル ID は assistant の JSON イベントを出さず、stderr に `Model "..." not found...`、終了コード 1 になる。認証鍵の欠落も JSON を出さず throw して終了コード 1 になる。認証鍵の無効は `stopReason: "error"` と `errorMessage` で、終了コード 0 になる。モデルが文章で「できません」と返したタスク失敗は `stopReason: "stop"` で、JSON だけからはタスク失敗と判定できない。出所: `dist/core/model-resolver.js:356-374`、`dist/main.js:745-753`、`dist/core/agent-session.js:1678-1692`、`docs/message-types.md:134-136`
- F7: pi のエージェントレベルの再試行は、最終的な `message_end` のエラーより前に起きる。consult の乗り換えは、pi が再試行を使い切った後のエラー応答を見ることになる。出所: `docs/json.md:161-170`、`dist/core/agent-session.js:1449-1455`、`.pi/extensions/consult/run/run.ts:70-88`
- F8: pi は再試行する失敗を raw history に残す（`_omitRecoveryAttempt` のコメント）。`_prepareRetry` は assistant メッセージの確定後に呼ばれるため、再試行で回復しても、失敗した試行の `message_end`（`stopReason: "error"`）はストリームに残る。出所: `dist/core/agent-session.js:1532-1544,3090-3110`
- F9: `run/run.test.ts` は存在せず、`runWithFallback` の継続条件を直接試すテストはない。`tool/render.test.ts` も `compose`（本文と理由を組み立てる関数）を試していない。出所: `.pi/extensions/consult/run/` の一覧、`.pi/extensions/consult/tool/render.test.ts:1-2`、`cycles/261113-066-dev/affected/01.md`

### Scope

- In:
  - result: 乗り換えが起きる条件が変わり、その結果として走るモデルが変わる。
  - logic: `run/run.ts` の `runWithFallback` が次へ進む条件を、`usage.output === 0` からエラー応答の判定に変える。`stopReason: "error"` と `errorMessage` の扱い、pi の `auto_retry` との関係を決める。
  - structure: エラー応答の判定を `sub/spec.ts` の述語として置き、`errorFrom` を削除して末尾メッセージの判定を 1 つに統合する（`ranFrom` との関係を含む）。
  - expression: 新しい述語の名前と、`ranFrom` のコメントを、新しい判定に合わせる。
  - downstream: `runWithFallback` の呼び出し元（`run/subagent.ts`）、`tool/render.ts` の `errorFrom` の呼び出し、判定を確かめるテスト、`consult/README.md` の記述を合わせる。
  - cost: 乗り換えの条件が変わることで、試行の回数と、消費するトークンと時間が変わることを織り込む。
  - failure: どの失敗で次のモデルへ進むか、どの失敗で進まないかを決める（モデル側のエラー、認証、タスクの失敗、中断）。
  - verification: 判定の述語のテストを変え、`runWithFallback` の継続条件と `compose` のテストを新しく足す。
- Out:
  - upstream: 外部パッケージを足さない（pi の JSON 形式を読むだけである）。
  - existing: 過去の `cycles/*` の記録を書き換えない（記録はその時点の形で残す）。
  - safety: 秘密情報、権限、露出、個人データを扱わない（エラーメッセージの表示は 02 が扱う）。
  - observability: 乗り換えの通知と記録を足さない（02 が扱う）。
  - release: 配布、リリース、適用の方法を変えない（git の変更だけである）。
  - other: ほかに扱う関心事はない。

### Decision

- Status: **accepted**
- Main: 乗り換えの判定は、生成の有無だけではなく、モデル側のエラー応答でも行う。どちらかに当たれば、次の候補へ進む（C1, C4, C6）
  - Add:
    - 末尾メッセージの判定を `sub/spec.ts` に置く。**最後の** assistant の `message_end` だけを見て、失敗していないか、失敗ならその理由を結果型で返す（F1, F5, F8）
    - `errorFrom` を削除し、その用途（本文がないときの理由）を同じ結果型に置き換える（F8）
    - 最後のメッセージがエラーなら、その前に生成があっても乗り換える。エラーで終わった結果は使わない（C3, F5, F8）
    - 乗り換えの対象は `stopReason: "error"` のすべてとする。エラーの種類は `errorMessage` で選ばない（F1, F3, F6）
    - タスクの失敗（`stopReason: "stop"`）とターン上限（`stopped`）では乗り換えない。認証鍵の欠落は生成 0 として乗り換える（F6, C2）
  - Update:
    - `run/run.ts` の `runWithFallback` の継続条件を、`ranFrom` だけから、生成 0 と末尾メッセージの失敗のどちらかに変える（F5, F7）
    - `tool/render.ts` の `errorFrom` の呼び出しを、末尾メッセージの結果型に置き換える（F8）
    - `sub/spec.test.ts` の `errorFrom` のテストを `failureFrom` に置き換え、`run/run.test.ts` と `tool/render.test.ts` の `compose` に新しいテストを足す。前のエラーがあっても最後が成功なら乗り換えないことを確かめる（F5, F8, F9）
    - `consult/README.md` の `## Model candidates` を新しい規則に書き換え、「生成した後に失敗したら乗り換えない」の段落を削除する。未知の ID については、一致しない ID とカタログにない ID の 2 つの場合に分ける。再試行と乗り換えの回数・待ち時間の目安も 1 段落で足す（F1, F3, F4, F5, F6）
    - `consult/README.md` の `## Tests` 表に `run/run.test.ts` の行を足す（F9）
  - Drop:
    - `errorFrom`（末尾の 1 メッセージだけを見る判定に統合する）（F8）
- Sub: なし
- Policy:
  - Allowed:
    - `errorMessage` を、失敗の理由として読む（F1）
  - Forbidden:
    - 終了コードで判定しない - JSON モードのエラー応答は終了コード 0 になる（F2）
    - 中断（`aborted`）で乗り換えない - 止めたのに別のモデルで走り直すのは意図に反する（C2）
    - 生成の有無の判定を消さない - 存在しないモデル ID と認証鍵の欠落は JSON のエラーを出さず終了コード 1 になるため、生成の有無が唯一の手がかりになる（F6）
    - 候補の数と pi の再試行の設定を変えない - 乗り換えは最後の退避であり、費用の上限は候補の数で決まる（C5, F3, F4）
    - 最後の試行（メインエージェントの設定）より先へ進めない - 候補を使い切ったらそこで終わる（C2）

#### Details

- `Failure` と `failureFrom`
  ```ts
  /** サブエージェントの末尾メッセージ。失敗していないか、失敗ならその理由 */
  export type Failure =
    | { readonly failed: false }
    | { readonly failed: true; readonly message: string };

  /** 最後の assistant メッセージがエラーで終わったか、その理由 */
  export function failureFrom(events: unknown[]): Failure {
    for (let i = events.length - 1; i >= 0; i -= 1) {
      const message = asEvent(events[i]).message;
      if (message?.role !== 'assistant') {
        continue;
      }
      return message.stopReason === 'error'
        ? { failed: true, message: message.errorMessage ?? '' }
        : { failed: false };
    }
    return { failed: false };
  }
  ```
- `ranFrom`（コメントだけ変える）
  ```ts
  /**
   * サブエージェントがモデルから何かを生成したか。
   *
   * エラーを出さずに終わった失敗（存在しないモデル ID など）を拾う。
   */
  export function ranFrom(events: unknown[]): boolean {
    return usageFrom(events).output > 0;
  }
  ```
- `runWithFallback`（コメントと継続条件）
  ```ts
  /**
   * 候補を順に試す。
   *
   * 生成が 0、または末尾メッセージがエラーなら、次の候補でやり直す。中断は乗り換えない。
   * 候補を使い切ったら、最後にメインエージェントと同じ設定で走る。
   */
  export async function runWithFallback(
    models: readonly string[],
    runOnce: (model: string | undefined) => Promise<RunResult>,
  ): Promise<RunResult> {
    const attempts = modelAttempts(models);

    // 再帰にする。並列にはできない（次の試行は前の結果で決まる）ので、ループにすると「待つのは意図的」という抑制コメントが要る。
    async function tryAt(index: number): Promise<RunResult> {
      const run = await runOnce(attempts[index]);
      const next = index + 1;
      // 最後の試行（メインエージェントと同じ）、中断、ターン上限は、いずれにせよ返す。
      if (next >= attempts.length || run.aborted || run.stopped !== undefined) {
        return run;
      }
      const events = parseEvents(run.stdout);
      // 生成が 0、または最後のメッセージがエラーなら、次の候補へ進む。
      const moveOn = !ranFrom(events) || failureFrom(events).failed;
      return moveOn ? tryAt(next) : run;
    }

    return tryAt(0);
  }
  ```

### Definition

- `Unit.subagent-consult`(kept): 乗り換えの条件が変わるだけで、エージェントがサブエージェントのコンサルを走らせ、そのワークツリーと結果を扱えるという主機能は変わらない（`rules/definition.rules.md:35`）。
- `Who.agent`(kept): 乗り換えはエージェントが指定せずに起きるものであり、プロダクトを作るという役割は変わらない。
- `Stack.Agent.Host`(kept): pi の JSON の形を読むだけで、ホストのパッケージとバージョンを変えない。

## 02: モデルの再試行と乗り換えを通知する

Type: _Full_

### Context

- C1: このサイクルは ROADMAP.md 027 を扱い、エントリを 01〜03 の順に議論する。02 は乗り換えの通知を扱う。
- C2: いまは、乗り換えが起きたことを人に知らせる経路がない。`run/run.ts` の `runWithFallback` は候補を順に試すが、どの候補で走ったかを通知しない。
- C3: どのモデルで走ったかは、結果の JSON イベントから `sub/spec.ts` の `modelFrom` で読める（最後の assistant の `message_end` の `provider` と `model`）。
- C4: 乗り換えの判定そのものは 01 が決める。このエントリは判定を変えない。
- C5: オーナーは、モデルが変更された場合に、対象の id とモデルが何に変わったかを `ctx.ui.notify` で表示させたい（ROADMAP.md 027 の ideas）。
- C6: 乗り換えを、誰に、いつ、何を、どこから通知するか。乗り換えのたびに出すか、最後に 1 回だけ出すか。
- C7: オーナーの意図は、モデル側のエラーで止まっていないか、モデルの調子がどうかを確認することである。通知は乗り換えだけでなく、同一モデルの再試行でも、起きたその場で出す（オーナーの回答）。走り終わった後の「どのモデルで走ったか」は完了報告で見えるので、通知しない（オーナーの回答）。

### Research & Trial

- F1: `ctx.ui.notify` を呼べるのは `index.ts` と `tool/consult.ts` のコマンドレイヤーである。`run/` レイヤーは `ctx` を持たず、`RunOptions` にも表示用の窓口がない。出所: `.pi/extensions/consult/index.ts:183-197,200-209`、`.pi/extensions/consult/tool/consult.ts:43-53,485-514`、`.pi/extensions/consult/run/run.ts:30-54`
- F2: `ctx.ui.notify(message, type?)` に文字数・行数の上限はなく、複数行は改行を保つ。`info` はチャットの status 行になり、連続して出すと、直前の status 行がまだチャット末尾にある間は行を増やさずに置き換える。出所: pi 本体 `dist/core/extensions/types.d.ts:72-80`、`dist/modes/interactive/interactive-mode.js:2273-2286,3074-3092`
- F3: どのモデルで走ったかは `run.stdout` のイベントから `sub/spec.ts` の `modelFrom` で読める。`RunRecord` にモデル専用の項目はなく、完了行の `notice` 文字列に `usageLine` 経由で `provider/model` が入る。出所: `.pi/extensions/consult/sub/spec.ts:153-165`、`.pi/extensions/consult/run/log.ts:24-50`、`.pi/extensions/consult/tool/render.ts:59-63`、`.pi/extensions/consult/tool/consult.ts:245-253`
- F4: `runWithFallback` は試行ごとのモデルや成否を返さず、試行の記録も残さない。戻るのは最後の `RunResult` だけである。出所: `.pi/extensions/consult/run/run.ts:70-88`
- `view/widget.ts` の `consult-running` はエディタ上に `[role:N]` の 1 行を出す。`notify` は `setWidget` を呼ばないため、両者は別の領域で互いを上書きしない。出所: `.pi/extensions/consult/view/widget.ts:57-72`、pi 本体 `dist/modes/interactive/interactive-mode.js:1853-1886`
- F6: pi は `--model` の `:low`、`:high` などの思考レベルのタグを `splitThinkingSuffix` で落としてからモデルを解決する。`message.model` に思考レベルのタグは残らない。出所: `node_modules/@earendil-works/pi-coding-agent/dist/core/model-resolver.js:53-59`
- F7: pi のエージェントレベルの再試行は、`auto_retry_start`（`attempt`、`maxAttempts`、`delayMs`、`errorMessage`）と `auto_retry_end`（`success`、`attempt`、失敗時は `finalError`）として JSON に出る。出所: `node_modules/@earendil-works/pi-coding-agent/docs/json.md:161-170`、`dist/core/agent-session.js:3102-3108,1550-1557`
- F8: `auto_retry_end` は、成功時は成功した `message_end` の直後、失敗時は最後のエラーの後に出る。出所: `dist/core/agent-session.js:772-787,1550-1557`

### Scope

- In:
  - result: モデル側のエラーで再試行や乗り換えが起きたとき、その場で警告の行が出る。
  - logic: どのイベントで通知するかを決める（pi の `auto_retry_start` と `auto_retry_end`、consult の乗り換え）。同じモデルの再試行と、別モデルへの切り替えを区別する。
  - structure: pi のイベントを拾う経路（`run/run.ts` の行読み取り）と、consult の乗り換えを拾う経路（`onFallback`）を、どちらも `consult()` まで運ぶ形に組み替える。
  - expression: 再試行・再試行の終わり・乗り換えの 3 つの文面を決める。
  - downstream: `sub/spec.ts`（`ModelEvent` と `modelEventFrom`）、`run/run.ts`、`run/subagent.ts`、`tool/consult.ts` の `consult()` と `ConsultContext`、`tool/render.ts`、テスト、`consult/README.md` を合わせる。
  - failure: 通知が失敗した場合や、UI がないモードでも、実行を止めずに黙って続けることを決める。
  - verification: 3 つのイベントで通知が出ることと、出ない場合のテストを足す。
  - observability: 通知という信号が増える。
- Out:
  - upstream: 外部パッケージを足さない（pi のイベントと `ctx.ui.notify` を使う）。
  - existing: 過去の `cycles/*` の記録を書き換えない（記録はその時点の形で残す）。
  - safety: 秘密情報を扱わない（通知に出すのは id とモデル名、エラーの理由だけである）。
  - cost: 通知は 1 イベント 1 行で、走っている処理に比べて無視できる（増える待ち時間もトークンもない）。
  - release: 配布、リリース、適用の方法を変えない（git の変更だけである）。
  - other: ほかに扱う関心事はない。

### Decision

- Status: **accepted**
- Main: モデル側のエラーで再試行や乗り換えが起きたとき、その場で `warning` の通知を出す（C1, C2, C5, C6, C7）
  - Add:
    - `sub/spec.ts` に `ModelEvent` と `modelEventFrom` を置き、`run/run.ts` が `auto_retry_start` と `auto_retry_end` を `onModelEvent` で `consult()` まで運ぶ。モデルは `lastModel` から読む（F3, F7, F8）
    - `runWithFallback` に `onFallback` を足し、乗り換えるときだけ次に試す候補を渡す（F4）
    - 再試行・再試行の終わり・乗り換えの 1 行を組み立てる `retryStartLine`、`retryEndLine`、`fallbackLine` を `tool/render.ts` に置く（F2）
    - `ConsultContext` に `ui`（`notify`）を足す（F1）
    - 通知は 3 種類とする。再試行の始まり、再試行の終わり（`ok` か `failed`）、乗り換え（前のモデルを出さず、`→ <次のモデル>` だけ。最後の試行は `→ main`）（C7, F3）
    - 通知の先頭は `[consult] <id>:` とする（F2, F6）
    - 通知のきっかけは `auto_retry_start`、`auto_retry_end`、乗り換えの 3 つとし、エラーそのものでは出さない（F7, F8）
    - モデル名は直前の assistant メッセージの `model` を使う。読めなければ、`subagent.ts` が要求した候補で埋めてから `consult()` に渡す（F3）
    - エラーの理由は最初の行だけを使い、120 文字までに切り詰め、超えたら `…` を付ける（C7）
    - 通知は try/catch で囲み、失敗しても実行の結果を変えない（F1）
  - Update:
    - `run/subagent.ts` の `runOneSubagent` が 2 つのコールバックを `consult()` まで渡す（F1）
    - `tool/consult.ts` の `consult()` が、イベントのたびに `ctx.ui.notify(line, 'warning')` を呼ぶ（F2）
    - `sub/spec.test.ts` に `modelEventFrom` のテストを、`run/run.test.ts` に `lastModel` と `onModelEvent` のテストを、`tool/render.test.ts` に 3 つの文面のテストを足し、`tool/consult.test.ts` で通知の有無を試す。切り詰めの境目は試さない（F2）
    - `consult/README.md` の `## Model candidates` に通知の説明を 1 段落足す（F2）
    - `ConsultContext.ui` は必須とし、テストの偽 `ctx`（`tool/consult.test.ts` の `toolCtx`、`run/subagent.test.ts` の `CONTEXT`）に `ui` を足す（F1）
  - Drop:
    - 走り終わった後の 1 回の通知（C7, F2）
- Sub: なし
- Policy:
  - Allowed:
    - `auto_retry_start`、`auto_retry_end`、`onFallback` を通知のきっかけにする（F3, F4, F7）
    - `modelFrom` で実際に走ったモデルを読む（C3, F3）
    - `warning` を使い、行を積む（F2）
    - UI がないモードでは、pi の `notify` に任せる（consult 側で `hasUI` を見ない）（F1）
  - Forbidden:
    - `info` を使わない - 直前の status 行を置き換えるため、再試行が続くと最後しか見えない（F2）
    - 乗り換えの文面にエラーを入れない - 再試行の行で理由が分かる（C7）
    - 候補の文字列だけで走ったモデルを決めない - 実際のモデルは `modelFrom` が返す値である（F3）
    - 通知のために乗り換えの判定を変えない - 判定は 01 が決めた（C4）
    - 通知の失敗を記録に残さない - 記録の形を変えると 03 と既存の記録に波及する（F4）

#### Details

- `ModelEvent` と `modelEventFrom`
  ```ts
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

  /** 再試行のイベントだけを取り出す。それ以外は undefined */
  export function modelEventFrom(event: unknown, model: string | undefined): ModelEvent | undefined;
  ```
- `RunState.lastModel` と `RunOptions.onModelEvent`
  ```ts
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
  ```
- `Fallback` と `onFallback`
  ```ts
  /** 乗り換えの行き先。最後の試行（メインエージェントの設定）は undefined */
  export interface Fallback {
    readonly requested: string | undefined;
  }

  export async function runWithFallback(
    models: readonly string[],
    runOnce: (model: string | undefined) => Promise<RunResult>,
    onFallback?: (attempt: Fallback) => void,
  ): Promise<RunResult> {
    // ...
    const moveOn = !ranFrom(events) || failureFrom(events).failed;
    if (moveOn) {
      onFallback?.({ requested: attempts[index + 1] });
    }
    return moveOn ? tryAt(next) : run;
  }
  ```
- `retryStartLine`、`retryEndLine`、`fallbackLine`
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
- 通知の文面（4 種類の例。`Warning: ` は pi が付ける）
  ```text
  [consult] consult-1: opencode-go/deepseek-v4.1-flash retry 1/3 (429 rate limit) in 2s
  [consult] consult-1: opencode-go/deepseek-v4.1-flash retry 1/3 ok
  [consult] consult-1: opencode-go/deepseek-v4.1-flash retry 1/3 failed
  [consult] consult-1: → opencode-go/muse-spark-1.3-contributor
  ```

### Definition

- `Unit.subagent-consult`(kept): モデルの再試行と乗り換えの通知が増えるだけで、エージェントがサブエージェントのコンサルを走らせ、そのワークツリーと結果を扱えるという主機能は変わらない（`rules/definition.rules.md:35`）。
- `Who.owner`(kept): 通知を見てモデルの調子を確かめるのはオーナーであり、判断をするという役割は変わらない。
- `Stack.Agent.Host`(kept): pi のイベントを読むだけで、ホストのパッケージとバージョンを変えない。

## 03: consult-status コマンドを復活させる

Type: _Full_

### Context

- C1: このサイクルは ROADMAP.md 027 を扱い、エントリを 01〜03 の順に議論する。03 は `/consult-status` コマンドの復活を扱う。
- C2: `/consult-status` は commit `ed0a62f`（061-dev、running-widget）で削除された。削除前は、`tool/consult.ts` の `commands.status` が `controlSubagent({ action: 'list' }, ...)` の `outcome.text` を `ctx.ui.notify(outcome.text, 'info')` に出していた。
- C3: いま、人が使う入口は `/consult-cancel` と `/consult-sound` である（`index.ts` の `registerCommands`）。
- C4: 乗り換えの判定と通知（01、02）を、このエントリは変えない。
- C5: オーナーは、`ctx.ui.notify` に id とロール、およびほかに出せそうなもの（エージェントが使う `consult_subagents` の list 相当）を表示させたい（ROADMAP.md 027 の ideas）。
- C6: `/consult-status` は何を出すか。id とロールだけで足りるか、worktree、経過時間、turns、spend まで出すか。

### Research & Trial

- F1: 削除前の `/consult-status` は、`tool/consult.ts` の `commands.status` が `controlSubagent({ action: 'list' }, ...)` の `outcome.text` を `ctx.ui.notify(outcome.text, 'info')` に出していた。commit `ed0a62f` は `index.ts` の登録、`ConsultRuntime.commands.status`、その実装を落とした。出所: `git show ed0a62f`
- F2: `controlSubagent({ action: 'list' })` の 1 行は `id`、`type`、`task` の最初の行（80 文字まで）で、worktree、経過時間、turns、spend、状態を含まない。出所: `.pi/extensions/consult/tool/consult.ts:120-160`
- F3: エージェントが使う `consult_subagents` の list は別の文字列で、`id`、`role`、`worktree` または `base`、状態、経過時間、turns、spend、必要なら reason を含む。出所: `.pi/extensions/consult/tool/subagents.ts:132-201`
- F4: `ctx.ui.notify` に文字数・行数の上限はない。`info` はチャットの status 行になり、連続して出すと、直前の status 行がまだチャット末尾にある間は行を増やさずに置き換える。出所: pi 本体 `dist/core/extensions/types.d.ts:72-80`、`dist/modes/interactive/interactive-mode.js:2273-2286,3074-3092`
- `roleShort` と `showRunning` はいまも `view/widget.ts` にある。`ed0a62f` で落ちたのは `/consult-status` の登録と `commands.status` の実装、および `showRunning` と `roleShort` のテストである。出所: `.pi/extensions/consult/view/widget.ts:25-27,69-72`、`git show ed0a62f`
- F6: 一覧を作る記録の読み方と、既存のコメント・説明が食い違う箇所がある。`tool/consult.ts:7` は一覧と停止が同じ `control` を呼ぶと書き、`index.ts:199` は停止と音だけを挙げ、`README.md:56` は commands が id を取ると書く。出所: `.pi/extensions/consult/tool/consult.ts:7`、`.pi/extensions/consult/index.ts:199`、`.pi/extensions/consult/README.md:56`、`cycles/261113-066-dev/affected/03.md`

### Scope

- In:
  - result: `/consult-status` を実行すると、動いているサブエージェントの一覧が `ctx.ui.notify` に出る。
  - logic: 何を出すか、どの記録を読むか、id とロールに加えて何を含めるかを決める。
  - structure: 一覧の文字列を、`controlSubagent` の list から作るか、`consult_subagents` の `listText` を使うかを決め、`tool/` の中の置き場所を決める。
  - expression: 一覧の 1 行の文面を決める。
  - downstream: `index.ts` の `registerCommands`、`tool/consult.ts` の `ConsultRuntime.commands`、テスト、`consult/README.md` を合わせる。
  - failure: 動いているサブエージェントがないときの表示を決める。
  - verification: コマンドの登録と、一覧の内容のテストを足す。
  - observability: 人が読む信号が増える。
- Out:
  - upstream: 外部パッケージを足さない（pi の `ctx.ui.notify` を使う）。
  - existing: 過去の `cycles/*` の記録を書き換えない（記録はその時点の形で残す）。
  - safety: 秘密情報を扱わない（id、ロール、worktree、状態などだけを出す）。
  - cost: 一覧を作る費用は、走っている処理に比べて無視できる（待ち時間もトークンもない）。
  - release: 配布、リリース、適用の方法を変えない（git の変更だけである）。
  - other: ほかに扱う関心事はない。

### Decision

- Status: **accepted**
- Main: `/consult-status` は、エージェントが使う `consult_subagents` の list と同じ記録と整形を使い、このセッションのサブエージェントの一覧を `ctx.ui.notify` に `info` で出す（C1, C2, C5, C6）
  - Add:
    - `ConsultRuntime.commands` に `status` を足し、`readRuns` と `listText(..., 'running')` で一覧を作る（F3）
    - `index.ts` に `/consult-status` の登録を足す（C3, F1）
    - 一覧は、このセッションでいま動いているサブエージェントだけを出す（C5, C6）
    - task の最初の行は出さない（C5）
    - 空のときは `no subagents running in this session` と出す（F3）
    - 一覧の 1 行は `rowOf` の形をそのまま使う（F3）
    - コマンドの説明は `List the running consult subagents of this session` とする（C5）
  - Update:
    - `consult/README.md` のコマンドの表に `/consult-status` を戻す（F1）
    - `tool/consult.test.ts` に、一覧が通知に出るテストを足す（F3）
    - `tool/consult.ts` の冒頭コメントを直す（一覧は `readRuns` を読む）（F6）
    - `index.ts` の `registerCommands` の説明に一覧を足す（F6）
    - `consult/README.md` の「`id` is what `consult_subagents` and the commands take」を直す（F6）
    - `tool/subagents.test.ts` の空の文面の期待を `no subagents in this session yet` に合わせる（F3）
  - Drop:
    - なし
- Sub: なし
- Policy:
  - Allowed:
    - `controlSubagent` の list ではなく、記録を読む `readRuns` を使う（F2, F3）
    - `listText` の整形をそのまま使う（F3）
    - コマンドの `notify` は try/catch で囲まない（失敗したら画面に出てよい）
  - Forbidden:
    - `warning` と `error` を使わない - 一覧は情報である（F4）
    - セッションの絞りを外さない - 前のセッションの一覧を出さない（F3）
    - 乗り換えの判定と通知を変えない - 01 と 02 の決定である（C4）

#### Details

- `rowsOf` と `listText` の `where`
  ```ts
  export type ListWhere = 'all' | 'running';

  export function rowsOf(
    records: readonly RunRecord[],
    check: CheckRecord | undefined,
    now: number,
    where: ListWhere = 'all',
  ): string[] {
    const delivered = deliveredKeys(records);
    const shown = latest(
      records.filter((record) => record.delivered === undefined || record.ended !== undefined),
    );
    return shown
      .map((record) => ({
        record,
        alive: isRunning(record, check),
        waiting: isWaiting(record, delivered),
      }))
      .filter((row) => where === 'all' || row.alive || row.waiting)
      .map((row) => rowOf(row.record, { alive: row.alive, waiting: row.waiting }, now));
  }

  export function listText(
    records: readonly RunRecord[],
    now: number,
    check?: CheckRecord,
    where: ListWhere = 'all',
  ): string {
    const rows = rowsOf(records, check, now, where);
    if (rows.length === 0) {
      return where === 'running'
        ? 'no subagents running in this session'
        : 'no subagents in this session yet';
    }
    return rows.join('\n');
  }
  ```

### Definition

- `Unit.subagent-consult`(kept): 動いているサブエージェントの一覧を見る入口が戻るだけで、コンサルを走らせ、ワークツリーと結果を扱えるという主機能は変わらない（`rules/definition.rules.md:35`）。
- `Who.owner`(kept): 一覧を読むのはオーナーであり、判断をするという役割は変わらない。
- `Stack.Agent.Host`(kept): pi のコマンドの API を使うだけで、ホストのパッケージとバージョンを変えない。
