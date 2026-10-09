# PLAN `intent-router`

## Files

```text
.pi/extensions/intent-router/
  index.ts                   add
  index.test.ts              add
  settings.ts                add
  settings.test.ts           add
  questions.ts               add
  state.ts                   add
  state.test.ts              add
  log.ts                     add
  log.test.ts                add
  classifier.ts              add
  classifier.test.ts         add
  command.ts                 add
  command.test.ts            add
  hook/
    route.ts                 add
    route.test.ts            add
    judge.ts                 add
    judge.test.ts            add
  settings.json              add
  README.md                  add
  logs/                      （実行時に作る。`logs/` は .gitignore にある）
```

```text
README.md                  update
README.ja.md               update
```

置き場の決め：`Label / LABELS` は `questions.ts`（ラベルは route の criteria のキーそのもの）。`Usage / RunPort / FlagsPort / JsonObject`（= `Record<string, unknown>`）は `state.ts`（状態の持ち主）。`RouteDeps / JudgeDeps / CommandDeps` は使う側のファイル（`hook/route.ts` / `hook/judge.ts` / `command.ts`）。`Ask / Answer / AskOutcome / RegistryModel / RegistryAnswer` は `classifier.ts`。

pi の classifier の型は `@earendil-works/pi-ai` から取らない（この repo の依存に無く、pnpm は持ち上げない）。SDK の口から引き出す。

```ts
type Registry = ExtensionContext['modelRegistry'];
type RegistryModel = Parameters<Registry['classify']>[0];
type RegistryResult = Awaited<ReturnType<Registry['classify']>>;
type RegistryAnswer = RegistryResult['answers'][string];
```

## Slices

1. 設定と質問文を固定し、上書きの読み口をつくる
   - I/O:
     ```ts
     // questions.ts
     export type Label = 'question' | 'design' | 'verify' | 'permission' | 'chat' | 'unknown';
     export const LABELS: readonly Label[];
     export const ROUTE_QUESTION: ClassifierChoiceQuestion;
     export const JUDGE_QUESTION: ClassifierScoreQuestion;

     // settings.ts
     export interface ClassifierCandidate {
       readonly provider: string;
       readonly model: string;
     }

     export interface Thresholds {
       readonly routeConfidence: number;
       readonly judgeConfidence: number;
       readonly judgeScore: number;
     }

     export interface Settings {
       readonly classifier: {
         readonly models: readonly ClassifierCandidate[];
         readonly allowPaid: boolean;
       };
       readonly budget: {
         readonly maxJudgementsPerPrompt: number;
         readonly maxStateChars: number;
         readonly minIntervalMs: number;
         readonly timeoutMs: number;
       };
       readonly thresholds: Thresholds;
       readonly route: {
         readonly enabled: boolean;
         readonly shadow: boolean;
         readonly actOn: readonly Label[];
         readonly idleOn: readonly Label[];
       };
       readonly judge: {
         readonly enabled: boolean;
         readonly shadow: boolean;
         readonly minTurns: number;
         readonly everyNTurns: number;
         readonly maxFires: number;
       };
       readonly guide: {
         readonly enabled: boolean;
         readonly display: boolean;
         readonly text: string;
       };
       readonly stop: {
         readonly enabled: boolean;
         readonly display: boolean;
         readonly text: string;
       };
       readonly state: {
         readonly maxActions: number;
         readonly actionChars: number;
         readonly assistantChars: number;
         readonly includeTools: readonly string[];
       };
       readonly log: { readonly dir: string; readonly keepDays: number };
     }

     // 増える
     export function defaultSettings(): Settings;
     export function parseSettings(text: string, defaults: Settings): Settings;
     export function readSettings(dir: string, defaults: Settings): Settings;
     ```
     - 上書きは**部分**。書いていない欄は既定のまま（欠けは誤りではない）。書いてある欄が知らないキー・範囲外・別の型なら投げる
     - 既定の文面: `guide.text` は `Re: {prompt} — kind: {label}. The owner wants an answer, not an edit. Do not edit, write, delete, or commit anything. Investigate only what the answer needs, then answer.` / `stop.text` は `Enough has been investigated to answer. Stop investigating: no new tool calls. Answer the owner from what you have, and name anything you could not confirm.`
   - Verify:
     - test: `pnpm run test:run .pi/extensions/intent-router/settings.test.ts`
       - `defaultSettings().thresholds` が `{ routeConfidence: 0.5, judgeConfidence: 0.5, judgeScore: 1.5 }`（happy）
       - `parseSettings('{"thresholds":{"judgeScore":1.8}}', defaults)` の `judgeScore` が 1.8 で、他の欄は既定のまま（happy。部分上書き）
       - `parseSettings('{}', defaults)` と `parseSettings('{"route":{}}', defaults)` が既定と等しい（empty。欠けは誤りではない）
       - `parseSettings('{"route":{"enabledd":false}}', defaults)` が `/unknown key/` で投げる（error。打ち間違いを黙って無視しない）
       - `parseSettings('{"thresholds":{"routeConfidence":1.5}}', defaults)` が `/between 0 and 1/` で投げる（boundary values。0〜1 の外）
       - `parseSettings('{"thresholds":{"routeConfidence":1}}', defaults)` が通り、`parseSettings('{"budget":{"maxStateChars":0}}', defaults)` が `/positive/` で投げる（boundary values。0 は不可）
       - `parseSettings('{"thresholds":{"judgeScore":2.5}}', defaults)` が `/between 0 and 2/` で投げ、`{"thresholds":{"judgeScore":0}}` は通る（boundary values。score は 0〜2）
       - `parseSettings('{"thresholds":{"judgeConfidence":1.2}}', defaults)` が `/between 0 and 1/` で投げる（boundary values）
       - `parseSettings('{"judge":{"maxFires":1.5}}', defaults)` が `/integer/` で投げる（invalid input。非整数）
       - `parseSettings('{', defaults)` が `/not valid JSON/` で投げる（error）
       - `readSettings(dir, defaults)` が、`settings.json` の無い `tmpDir()` で既定を返す（empty）
       - commit 済みの `.pi/extensions/intent-router/settings.json` を `readSettings` で読むと、既定と同じ値になる（happy。置いたファイルが読める）
       - `LABELS` の6つと `ROUTE_QUESTION.criteria` のキーが一致する（happy。片方だけ増えるとラベルがずれる）
       - `JUDGE_QUESTION.criteria` が3本で、`1.5` が真ん中と上の間に入る（boundary values。score は 0〜2 の位置）
       - 権限: 当てはまらない（読むだけ）
   - Steps:
     1. `.pi/extensions/intent-router/questions.ts`: `Label` / `LABELS` / `ROUTE_QUESTION` / `JUDGE_QUESTION` を書く。文面と criteria は英語で memo の通り
     2. `.pi/extensions/intent-router/settings.ts`: `Settings` / `ClassifierCandidate` / `Thresholds` と `defaultSettings()` を書く（閾値 0.5 / 0.5 / 1.5、`maxJudgementsPerPrompt` 12、`maxStateChars` 12000、`minIntervalMs` 400、`timeoutMs` 1500、`minTurns` 2、`everyNTurns` 1、`maxFires` 1、`maxActions` 12、`actionChars` 300、`assistantChars` 500、`log.dir` は `.pi/extensions/intent-router/logs`、`keepDays` 14、`classifier.models` は `opencode/jev-1.13-free` → `openrouter/~typesafe/jev-latest`、`allowPaid` true）
     3. `.pi/extensions/intent-router/settings.ts`: `parseSettings(text, defaults)` を書く。`consult/policy/types.ts` の `as*` の形に合わせ、書かれている欄だけを重ねる。数は欄ごとに範囲（0〜1 / 正の整数）を見る
     4. `.pi/extensions/intent-router/settings.ts`: `readSettings(dir, defaults)` を書く。`settings.json` が無ければ既定、読めて壊れていれば投げる
     5. `.pi/extensions/intent-router/settings.json`: 上書きの口。`thresholds` と `classifier` を既定と同じ値で書き、何を書けば効くかがこのファイルで分かる形にする
     6. `.pi/extensions/intent-router/settings.test.ts`: 上のケースを書く。一時ファイルは `tmpDir()`（`.pi/test/tmp.ts`）
2. owner の発言1つ分の状態と、jev に渡す state を組み立てる
   - I/O:
     ```ts
     export interface Usage {
       readonly input: number;
       readonly output: number;
       readonly cost: number;
     }

     export type JsonObject = Record<string, unknown>;

     export interface Action {
       readonly turn: number;
       readonly tool: string;
       readonly target: string;
       readonly result: string;
       readonly attempts: number;
       readonly error: boolean;
     }

     export type Run =
       | { readonly kind: 'idle' }
       | {
           readonly kind: 'armed';
           readonly prompt: string;
           readonly label: Label;
           readonly confidence: number;
           readonly candidate: ClassifierCandidate;
           readonly startedAt: number;
           readonly lastJudgedAt: number | null;
           readonly actions: readonly Action[];
           readonly assistantLast: string;
           readonly turns: number;
           readonly judgements: number;
           readonly fires: number;
           readonly truncated: boolean;
         };

     /** いまの状態の持ち主。hook と command はここを通して読み書きする */
     export interface RunPort {
       readonly get: () => Run;
       readonly set: (next: Run) => void;
     }

     /** セッション中の on/off の持ち主 */
     export interface FlagsPort {
       readonly get: () => { readonly enabled: boolean };
       readonly set: (next: { readonly enabled: boolean }) => void;
     }

     export function idleRun(): Run;
     export function arm(input: {
       readonly prompt: string;
       readonly label: Label;
       readonly confidence: number;
       readonly candidate: ClassifierCandidate;
       readonly now: number;
     }): Run;
     /** 記録に入れない的（秘密）は捨てる */
     export function addAction(run: Run, action: Action, limits: Settings['state']): Run;
     export function noteTurn(run: Run, text: string, limits: Settings['state'], now: number): Run;
     export function countJudgement(run: Run, now: number): Run;
     export function fire(run: Run): Run;
     export function asInput(value: unknown): Record<string, unknown>;
     export function toAction(
       turn: number,
       tool: string,
       input: unknown,
       resultText: string,
       isError: boolean,
       actionChars: number,
     ): Action;
     export function targetOf(tool: string, input: Record<string, unknown>): string;
     export function isSecretTarget(target: string): boolean;
     export function judgeState(run: Run, maxChars: number): JsonObject;
     export function routeState(prompt: string, cwdBase: string, hasImages: boolean): JsonObject;
     ```
   - Verify:
     - test: `pnpm run test:run .pi/extensions/intent-router/state.test.ts`
       - `arm({ prompt: '…', label: 'question', confidence: 0.9, candidate, now: 1 })` の `kind` が `'armed'` で、`actions` 空・`turns` 0・`judgements` 0・`fires` 0・`lastJudgedAt` が null（happy）
       - `idleRun()` に `addAction` / `noteTurn` しても `idle` のまま（boundary values。arm 前に来た物は捨てる）
       - `addAction` を 12 回 → `actions` が 12 件で `truncated` は false、13 回目で `truncated` が true（boundary values。上限の対）
       - 同じ `read` と同じ path を 2 回 → 1 件のままで `attempts` が 2（a second call）
       - `toAction(1, 'read', { path: 'x.ts' }, 'あ'.repeat(301), false, 300)` の `result` が 300 字、`actionChars: 10000` なら 301 字のまま（boundary values。上限は設定から来る）
       - `toAction` の error が true の時、`result` が `error: ` で始まる（error）
       - `addAction` で `.env` を読んだ action が落ちる（`isSecretTarget('.env')` が true。security）
       - `targetOf('read', { path: 'x.ts' })` が `'x.ts'`、`targetOf('grep', { pattern: 'a|b' })` が `'a|b'`、`targetOf('bash', { command: 'pnpm test --run' })` が `'pnpm'`、`targetOf('consult_run', { role: 'review' })` が `'review'`、`targetOf('web_search', { query: 'x' })` が `'x'`、`targetOf('mystery', {})` が `''`（happy + boundary values。未知道具）
       - `includeTools` に無い道具（`mystery`）は `addAction` に渡しても入らない（empty）
       - `noteTurn` で `assistantLast` が 501 字の入力で 500 字に切れる（boundary values）
       - `countJudgement` が `judgements` を増やし `lastJudgedAt` を入れる（happy）
       - `fire` が `fires` を増やす（happy）
       - `routeState('a\nb', 'repo', true)` の `owner_prompt` が 2000 字までで、`has_images` が true（happy。画像は真偽だけ）
       - `judgeState` が画像・base64 の文字列を含まない（security。画像つきの action を渡しても入らない）
       - `judgeState` が `maxChars` を超える `actions` で末尾を落とし、`truncated` が true（boundary values。黙って減らさない）
       - 権限: 当てはまらない（値を作るだけ）
   - Steps:
     1. `.pi/extensions/intent-router/state.ts`: `Usage` / `Action` / `Run` / `RunPort` / `FlagsPort` / `idleRun` / `arm` を書く（状態は判別可能な union。optional の組み合わせにしない）
     2. `.pi/extensions/intent-router/state.ts`: `addAction` / `noteTurn` / `countJudgement` / `fire` を書く（純関数。`now` は引数で受ける）
     3. `.pi/extensions/intent-router/state.ts`: `asInput` / `toAction` / `targetOf` / `isSecretTarget` を書く。`isSecretTarget` は `.env`、`~/.pi/` の下、`id_rsa` のような鍵の名前を弾く
     4. `.pi/extensions/intent-router/state.ts`: `judgeState` / `routeState` を書く（`truncated` を立てる。画像は入れない）
     5. `.pi/extensions/intent-router/state.test.ts`: 上のケースを書く
3. 判定と差し込みを1行1件で記録し、古い物を落とす
   - I/O:
     ```ts
     export type OutcomeView =
       | {
           readonly kind: 'answered';
           readonly provider: string;
           readonly model: string;
           readonly stopReason: 'stop';
           readonly usage: Usage;
           readonly latencyMs: number;
         }
       | {
           readonly kind: 'failed';
           readonly reason: string;
           readonly tried: readonly string[];
           readonly latencyMs: number;
         };

     export type LogRecord =
       | {
           readonly at: string;
           readonly hook: 'route';
           readonly owner_prompt: string;
           readonly label: Label | null;
           readonly confidence: number | null;
           readonly probabilities: Readonly<Record<string, number>>;
           readonly thresholds: Thresholds;
           readonly decision: 'act' | 'idle' | 'skip'; // skip は「聞いたが actOn にも idleOn にも無いラベル」
           readonly shadow: boolean;
           readonly guide: 'fired' | 'would' | 'none';
           readonly text: string | null;
           readonly truncated: boolean;
           readonly outcome: OutcomeView;
         }
       | {
           readonly at: string;
           readonly hook: 'judge';
           readonly owner_prompt: string;
           readonly label: Label;
           readonly score: number | null;
           readonly confidence: number | null;
           readonly thresholds: Thresholds;
           readonly decision: 'fire' | 'hold';
           readonly shadow: boolean;
           readonly stop: 'fired' | 'would' | 'none';
           readonly text: string | null;
           readonly truncated: boolean;
           readonly turn_index: number;
           readonly outcome: OutcomeView;
         }
       | { readonly at: string; readonly hook: 'command'; readonly enabled: boolean };

     // 記録するのは ask した時だけ。聞く前にやめた場合（off・`/` 始まり・道具0件・助走・間隔・上限）は行を作らない

     export function logPath(dir: string, at: Date): string;
     export function append(record: LogRecord, dir: string): void;
     /** 消した数を返す。`YYYY-MM-DD.jsonl` 以外の名前は触らない */
     export function prune(dir: string, keepDays: number, at: Date): number;
     ```
   - Verify:
     - test: `pnpm run test:run .pi/extensions/intent-router/log.test.ts`
       - `append` を route と judge の2件で → `tmpDir()` の `<YYYY-MM-DD>.jsonl` が 2 行で、1行目を `JSON.parse` すると `hook` が `'route'`、2行目が `'judge'`（happy。1行1件の JSONL）
       - `logPath(dir, new Date('2026-10-09T23:59:59'))` が `2026-10-09.jsonl`、`new Date('2026-10-10T00:00:01')` が `2026-10-10.jsonl`（boundary values。日付の境）
       - ディレクトリが無い所へ `append` → 作って書く（empty）
       - `keepDays: 14` で、14日前のファイルは残り、15日前のファイルは消える（boundary values。境の対）
       - `prune` の戻りが消した数（15日前1件 + 当日1件 → 1）（happy）
       - `memo.txt` を置いて `prune` → 消えず、戻りは 0（invalid input。名前で選ぶ）
       - 権限: 当てはまらない（一時ディレクトリの中だけ）
   - Steps:
     1. `.pi/extensions/intent-router/log.ts`: `OutcomeView` と `LogRecord`（hook で判別する union）を書く
     2. `.pi/extensions/intent-router/log.ts`: `logPath` / `append` / `prune` を書く。`append` は `mkdirSync(..., { recursive: true })` してから 1 行足す
     3. `.pi/extensions/intent-router/log.test.ts`: `tmpDir()` を使い、上のケースを書く
4. classifier の候補を順に試し、有料に落ちたら知らせる
   - I/O:
     ```ts
     /** 自前の答え。SDK の答え（RegistryAnswer）から作る */
     export type Answer =
       | {
           readonly type: 'choice';
           readonly choice: string;
           readonly probabilities: Readonly<Record<string, number>>;
           readonly confidence: number;
         }
       | { readonly type: 'score'; readonly score: number; readonly confidence: number };

     /** 質問の型に合う答えだけを返す。合わなければ undefined */
     export function fromRegistryAnswer(
       kind: 'choice' | 'score',
       raw: RegistryAnswer,
     ): Answer | undefined;

     export type AskOutcome =
       | {
           readonly kind: 'answered';
           readonly provider: string;
           readonly model: string;
           readonly answer: Answer;
           readonly usage: Usage;
           readonly latencyMs: number;
         }
       | {
           readonly kind: 'failed';
           readonly tried: readonly string[];
           readonly reason: string;
           readonly latencyMs: number;
         };

     export interface AskRequest {
       readonly kind: 'choice' | 'score';
       readonly state: JsonObject;
       /** 同じプロンプトの中では、route が選んだ候補を使い回す */
       readonly only?: ClassifierCandidate;
       readonly signal?: AbortSignal;
     }

     export interface Ask {
       (request: AskRequest): Promise<AskOutcome>;
     }

     export interface ClassifierDeps {
       readonly registry: Registry;
       readonly settings: Settings;
       readonly notify: (message: string) => void;
       readonly now?: () => number;
       /** 時間切れの口。既定は `setTimeout`（試す側が偽の時計を挿せる） */
       readonly timer?: (ms: number, fire: () => void) => void;
     }

     export function createAsk(deps: ClassifierDeps): Ask;
     /** 使う候補。カタログにある物だけ、`allowPaid: false` なら有料を外す。順は設定のまま */
     export function candidatesFor(
       available: readonly RegistryModel[],
       settings: Settings,
     ): readonly RegistryModel[];

     // `ask` の頭で `registry.getAvailableOfType('classifier')` を引き、`candidatesFor` に渡す。
     // `only` は `registry.findOfType('classifier', only.provider, only.model)` で引く。引けなければ `failed`
     ```
   - Verify:
     - test: `pnpm run test:run .pi/extensions/intent-router/classifier.test.ts`
       - 偽 registry が1つ目の候補で choice を返す → `kind` が `'answered'` で `provider` / `model` がその候補、`answer.choice` が `'design'`、`usage` と `latencyMs` が入る（happy）
       - score を聞いて score が返る → `answer.score` が `1.8`（happy）
       - 1つ目が `stopReason: 'error'`、2つ目が答え → `answered` で `tried` が2件（error。フォールバック）
       - 全部 `error` → `failed` で `tried` が2件、`reason` に1つ目の理由が入る（error）
       - choice を聞いて score が返る → `failed` で `tried` が2件（invalid input。形が違えば次へ）
       - 外部から `abort` した signal → `failed` で `reason` が `/aborted/`（error。割り込み）
       - 偽の `timer`（渡された `fire` をすぐ呼ぶ）→ `failed` で `reason` が `/timeout/`（error。時間切れ。割り込みと区別する）
       - `candidatesFor` がカタログに無い候補を落とし、残りの順を設定のまま保つ（happy）
       - `candidatesFor` が `allowPaid: false` で有料（`cost.input > 0`）だけを落とし、無料は残す（happy）
       - 無料がカタログに無く有料だけ → `failed` で `tried` が空（empty）
       - `only` を渡すと、その候補だけを試す（`only` がカタログに無ければ `failed`）（happy。judge の使い回し）
       - 有料の候補で答えた時、`notify` が `/paid/` に合う1行を1回だけ呼ぶ（happy）。2回目の `ask` では呼ばれない（a second call）
       - 権限: 当てはまらない（registry は偽物）
   - Steps:
     1. `.pi/extensions/intent-router/classifier.ts`: `Answer` / `fromRegistryAnswer` / `AskOutcome` / `AskRequest` / `Ask` / `ClassifierDeps` と `candidatesFor` を書く
     2. `.pi/extensions/intent-router/classifier.ts`: `createAsk` を書く。`only` があれば `findOfType` で引いた1つ、無ければ `getAvailableOfType` → `candidatesFor` の順。`registry.classify(model, { state, questions }, { signal })` を待ち、`stopReason === 'stop'` かつ `fromRegistryAnswer` が値を返す時だけ `answered`。時間切れは内部の `AbortController` を作り、外から来た `signal` と `timer(settings.budget.timeoutMs, …)` の両方で abort する（`timeout` と `aborted` を理由で分ける）。有料の候補で答えた最初の1回だけ `notify` する
     3. `.pi/extensions/intent-router/classifier.test.ts`: 偽の registry（`classify` が順に決めた結果を返し、`getAvailableOfType` がカタログを返し、`findOfType` が引ける）と、すぐ `fire` する偽の `timer` を書き、上のケースを試す
5. `before_agent_start` で分け、質問なら「編集せず調べろ」を1回だけ差し込む
   - I/O:
     ```ts
     export type RouteDecision =
       | { readonly kind: 'act'; readonly label: Label; readonly confidence: number }
       | { readonly kind: 'idle'; readonly label: Label; readonly confidence: number }
       | { readonly kind: 'skip'; readonly reason: string };

     /** 閾値は `>=`。actOn に無いラベルは idle */
     export function decideRoute(
       answer: Answer,
       thresholds: Thresholds,
       actOn: readonly Label[],
       idleOn: readonly Label[],
     ): RouteDecision;

     /** `{prompt}` と `{label}` を埋める。抜粋は改行を潰して 40 字まで */
     export function guideMessage(template: string, label: Label, prompt: string): string;

     export interface RouteCtx {
       readonly cwd: string;
     }

     export interface RoutePiPort {
       on(
         event: 'before_agent_start',
         handler: (
           event: { readonly prompt: string; readonly images?: readonly unknown[] },
           ctx: RouteCtx,
         ) => Promise<
           | {
               readonly message: {
                 readonly customType: string;
                 readonly content: string;
                 readonly display: boolean;
               };
             }
           | undefined
         >,
       ): void;
     }

     export interface RouteDeps {
       readonly settings: Settings;
       readonly ask: Ask;
       readonly run: RunPort;
       readonly flags: FlagsPort;
       readonly log: (record: LogRecord) => void;
     }

     export function registerRoute(pi: RoutePiPort, deps: RouteDeps): void;
     ```
   - Verify:
     - test: `pnpm run test:run .pi/extensions/intent-router/hook/route.test.ts`
       - `decideRoute({ type: 'choice', choice: 'design', probabilities: {}, confidence: 0.9 }, thresholds, ['design'], ['chat'])` が `act`（happy）
       - 同じ入力で confidence がちょうど `0.5` → `act`（boundary values。閾値は `>=`）
       - confidence `0.49` → `idle`（boundary values。閾値の下）
       - `chat` → `idle`（happy。動かないラベル）
       - actOn にも idleOn にも無いラベル → `skip`（invalid input。設定の穴）
       - 偽 `pi` の handler を、`ask` が `design` 0.9 を返す偽物で起こす → 戻り値の `message.content` が `'Re: この設計どう思う — kind: design. The owner wants an answer, not an edit. Do not edit, write, delete, or commit anything. Investigate only what the answer needs, then answer.'` と一字一句同じ（happy。自己一致にしない）
       - 同じ handler を confidence 0.49 で起こす → 戻り値が `undefined`、`run.get().kind` が `'idle'`（boundary values。judge が arm されない）
       - `flags` が `{ enabled: false }` → `ask` が呼ばれない（empty。off）
       - `settings.route.enabled` が false → `ask` が呼ばれない（empty）
       - 発言が `/intent off` → `ask` が呼ばれない（empty。コマンドは分類しない）
       - `ask` が `failed` → 戻り値が `undefined`、`run` は `idle`、ログの `decision` が `idle` で `label` が `null`、`outcome.kind` が `failed`（error）
       - `shadow: true` で `act` → 戻り値が `undefined`、ログの `guide` が `would` で `text` に文面が入る（happy。shadow は変えないが何をするかは残す）
       - 2回目の発言で handler を起こす → `run.get().prompt` が入れ替わり `actions` が空、`ask` の `state.owner_prompt` も入れ替わる（a second call）
       - `ctx.cwd` が `routeState` の `cwd_basename` に入る（happy）
       - 権限: 当てはまらない（message を返すだけ）
   - Steps:
     1. `.pi/extensions/intent-router/hook/route.ts`: 型（`RouteDecision` / `RouteCtx` / `RoutePiPort` / `RouteDeps`）と `decideRoute` / `guideMessage` を書く
     2. `.pi/extensions/intent-router/hook/route.ts`: `registerRoute` を書く。`flags` / `settings.route.enabled` を見て、`/` で始まる発言は分類しない。`ask` を待ち、`act` なら `arm` して（`shadow` でなければ）guide の文を返す。結果は `log` に残す
        - Outside: design の `External`（`pi`: `before_agent_start` の戻り値 `message`）。`sendMessage` は使わない。何もしない時は `undefined` を返す（`runner.js:1142-1146` が戻り値の無い handler を許す）
     3. `.pi/extensions/intent-router/hook/route.test.ts`: 偽の `ask` / `RunPort` / `FlagsPort` / `RoutePiPort` を書き、`log` は `tmpDir()` に書く。上のケースを試す
6. `turn_end` で「もう答えられるか」を判定し、1回だけ止めて答えさせる
   - I/O:
     ```ts
     export type JudgeDecision =
       | { readonly kind: 'fire'; readonly score: number; readonly confidence: number }
       | { readonly kind: 'hold'; readonly score: number; readonly confidence: number }
       | { readonly kind: 'skip'; readonly reason: string };

     /** score と confidence の**両方**が閾値以上（`>=`）で fire。score の答えでなければ skip */
     export function decideJudge(answer: Answer, thresholds: Thresholds): JudgeDecision;

     /** 判定を出す番か。助走・間隔・間隔の連続・上限・撃ち数を見る。道具の有無は見ない */
     export function due(
       run: Run,
       settings: Settings,
       now: number,
     ): { readonly kind: 'due' } | { readonly kind: 'wait'; readonly reason: string };

     export function stopMessage(template: string, label: Label): string;

     export interface JudgePiPort {
       on(
         event: 'turn_end',
         handler: (
           event: {
             readonly turnIndex: number;
             readonly message: { readonly content: unknown };
             readonly toolResults: readonly {
               readonly toolName: string;
               readonly content: unknown;
               readonly isError?: boolean;
             }[];
           },
           ctx: RouteCtx,
         ) => Promise<
           | {
               readonly entries: readonly {
                 readonly type: 'custom_message';
                 readonly customType: string;
                 readonly content: string;
                 readonly display: boolean;
               }[];
             }
           | undefined
         >,
       ): void;
     }

     export interface JudgeDeps {
       readonly settings: Settings;
       readonly ask: Ask;
       readonly run: RunPort;
       readonly flags: FlagsPort;
       readonly log: (record: LogRecord) => void;
     }

     export function registerJudge(pi: JudgePiPort, deps: JudgeDeps): void;
     ```
   - Verify:
     - test: `pnpm run test:run .pi/extensions/intent-router/hook/judge.test.ts`
       - `decideJudge({ type: 'score', score: 1.8, confidence: 0.8 }, thresholds)` が `fire`（happy）
       - score ちょうど `1.5` / confidence ちょうど `0.5` → `fire`（boundary values。閾値は `>=`）
       - score 1.8 / confidence 0.49 → `hold`（boundary values。片方だけ）
       - score 1.49 / confidence 0.9 → `hold`（boundary values。片方だけ）
       - `decideJudge({ type: 'choice', choice: 'design', probabilities: {}, confidence: 0.9 }, thresholds)` が `skip`（invalid input。score の答えではない）
       - `due` が `idle` の run → `wait`（empty。arm されていない）
       - `due` が `turns: 1`（`minTurns: 2`）→ `wait`、`turns: 2` → `due`（boundary values。助走の対）
       - `due` が `turns: 3`（`everyNTurns: 2`）→ `wait`、`turns: 4` → `due`（boundary values。間隔）
       - `due` が `now - lastJudgedAt < minIntervalMs` → `wait`、以上 → `due`（boundary values。連続で撃たない）
       - `due` が `fires: 1`（`maxFires: 1`）→ `wait`（a second call。撃った後）
       - `due` が `judgements: 12` → `wait`（boundary values。上限）
       - handler を、道具1件の `turn_end` と `ask` が score 1.8 / 0.8 を返す偽物で起こす → `entries` が1件で `customType` が `intent-stop`、`content` が `stopMessage` と一字一句同じ、戻り値に `continue` の欄が無い（happy。design の契約）
       - 同じ handler を 2 回目に起こすと `ask` が呼ばれず戻り値が `undefined`（a second call）
       - 道具0件の `turn_end` → `ask` が呼ばれず `undefined`、ログに judge の行が増えない（empty。答えの後なので撃たない。記録するのは ask した時だけ）
       - `ask` が `failed` → `undefined` で、ログの `decision` が `hold`・`outcome.kind` が `failed`（error）
       - `shadow: true` → `undefined` で、ログの `stop` が `would`・`text` に文面（happy）
       - `flags` が `{ enabled: false }` → `undefined`（empty。off）
       - 道具の結果（`read x.ts`）が `run.get()` の `actions` に入り、`judgeState` の `investigation` に載る（happy）
       - 権限: 当てはまらない（entries を返すだけ）
   - Steps:
     1. `.pi/extensions/intent-router/hook/judge.ts`: 型（`JudgeDecision` / `JudgePiPort` / `JudgeDeps`）と `decideJudge` / `due` / `stopMessage` を書く
     2. `.pi/extensions/intent-router/hook/judge.ts`: `registerJudge` を書く。道具0件なら何もログせず終える。`due` を満たせば道具と assistant の文を state に足し、`judgeState` で `ask`（`only: run.candidate`）を待ち、`fire` なら `{ entries: [custom_message] }` を返す（`continue` は返さない）
        - Outside: design の `External`（`pi`: `turn_end` の `{ entries }`。`continue` は使わない）。何もしない時は `undefined`（`runner.js:774-778` は `entries` が `undefined` なら何も足さない）
     3. `.pi/extensions/intent-router/hook/judge.test.ts`: 偽の `ask` / `RunPort` / `FlagsPort` / `JudgePiPort` を書き、`log` は `tmpDir()` に書く。上のケースを試す
7. `/intent` でセッション中だけ切り、README を置く
   - I/O:
     ```ts
     export interface CommandCtx {
       readonly ui: { readonly notify: (message: string) => void };
     }

     export interface CommandPiPort {
       registerCommand(
         name: string,
         options: {
           readonly description: string;
           readonly handler: (args: string, ctx: CommandCtx) => void;
         },
       ): void;
     }

     export interface CommandDeps {
       readonly flags: FlagsPort;
       readonly run: RunPort;
       readonly log: (record: LogRecord) => void;
     }

     /** 引数を解釈し、次の flag と画面に出す1行を返す */
     export function intentMessage(
       args: string,
       enabled: boolean,
     ): { readonly next: { readonly enabled: boolean }; readonly message: string };

     export function registerCommand(pi: CommandPiPort, deps: CommandDeps): void;
     ```
   - Verify:
     - test: `pnpm run test:run .pi/extensions/intent-router/command.test.ts`
       - `intentMessage('off', true)` → `next.enabled` が false で、`message` が `'intent-router: off'`（happy）
       - `intentMessage('on', false)` → `next.enabled` が true（happy）
       - `intentMessage('', true)` → `next.enabled` が true のままで、`message` が `'intent-router: on'`（happy。引数なしは状態）
       - `intentMessage('maybe', true)` → `next.enabled` が true のままで、`message` が `'intent-router: on|off'`（invalid input）
       - 偽 `pi` に登録し `off` で起こす → `flags.get().enabled` が false、`ctx.ui.notify` が `'intent-router: off'` で1回、`run.get()` が `idle`（happy。off は arm 済みを捨てる）
       - `off` の前後で `readSettings('.pi/extensions/intent-router', defaultSettings())` が同じ値（happy。セッション限り）
       - `off` のログに `hook: 'command'` の行が1件あり、`enabled` が false（happy。1行1件の JSONL）
       - 権限: 当てはまらない（flag を返すだけ）
     - read: `review` の子が `.pi/extensions/intent-router/README.md` を読み、(1) 設定の表が `defaultSettings()` と一致するか、(2) `/intent on|off` と `logs/` の場所が書いてあるか、(3) `second-opinion/README.md` の形（見出しと表）に合っているかを報告する
   - Steps:
     1. `.pi/extensions/intent-router/command.ts`: 型（`CommandCtx` / `CommandPiPort` / `CommandDeps`）と `intentMessage` / `registerCommand` を書く。`off` は `run.set(idleRun())` も行い、`hook: 'command'` のログを1行残す
     2. `.pi/extensions/intent-router/command.test.ts`: 上のケースを書く。`log` は `tmpDir()` に書く
     3. `.pi/extensions/intent-router/README.md`: 何をする拡張か、`/intent on|off`、設定の表、記録の場所（`logs/`）を書く。`second-opinion/README.md` の形に合わせる
8. 統合: 配線が1本につながり、実セッションのログに残るまで
   - I/O:
     ```ts
     // index.ts が持つ物。入口はこれだけを公開する
     export interface Wiring {
       readonly settings: Settings;
       readonly run: Run;
       readonly flags: { readonly enabled: boolean };
     }

     export function register(pi: ExtensionAPI, options?: { readonly cwd?: string }): Wiring;
     ```
   - Verify:
     - test: `pnpm run test:run .pi/extensions/intent-router/index.test.ts`
       - 偽の `ExtensionAPI`（`on` / `registerCommand` / `modelRegistry` / `ui.notify` を記録する物）で `register` → 登録された `before_agent_start` が先、`turn_end` が後、`session_start` が1つ、`intent` コマンドが1つ（happy。順序と個数）
       - `logs` に15日前のファイルと当日のファイルを置いて `session_start` を起こす → 15日前の物だけが消える（happy。整備の結線）
       - 同じ偽物で `before_agent_start`（`ask` が `question` を返す）→ `turn_end`（道具1件）の順に起こす → `settings.log.dir` を `tmpDir()` にした時、`<YYYY-MM-DD>.jsonl` に route と judge の2行が出る（happy。1本の配線）
       - その2行目の `owner_prompt` が1行目の `owner_prompt` と同じ（happy。state が引き継がれている）
       - 壊れた `settings.json` を置いた `tmpDir()` で `register` → 投げる（error。黙って既定で走らない）
       - `settings.json` の無い `tmpDir()` で `register` → 既定で登録できる（empty）
       - 有料の候補で答えた時、偽 `ui.notify` が1回呼ばれる（happy。02-1 の可視化の結線）
       - 権限: 当てはまらない（偽物だけ）
     - look: worktree で `pi -e .pi/extensions/intent-router/index.ts --no-session -p "cycles/013-2026-10-09/design.md は何を決めた?"` を1回走らせた子が、`.pi/extensions/intent-router/logs/<YYYY-MM-DD>.jsonl` を開いて報告する。(1) `hook: "route"` の行が1件あり `label` が入っているか、(2) `hook: "judge"` の行があるか、(3) 差し込み（`guide` / `stop` が `fired`）が出ていないか（shadow のため）。判断は人（子）が読んで報告する。閾値や往復で揺れるので合否にはしない
   - Steps:
     1. `.pi/extensions/intent-router/index.ts`: `register(pi, options)` を書く。設定を `readSettings` で読み（壊れていれば投げる）、`session_start` で `logs` を整え（`prune`）、`createAsk` を作り、`registerRoute` → `registerJudge` → `registerCommand` の順に登録する。`Run` と `Flags` はここが持ち、`RunPort` / `FlagsPort` で渡す
        - Outside: design の `External`（`pi`: `ctx.modelRegistry` / `ctx.ui.notify` / `ctx.cwd`）。`.pi/extensions/intent-router/logs/`: 拡張のファイルからの相対で引き、`append` に渡す `dir` はここで決める
     2. `.pi/extensions/intent-router/index.test.ts`: 上のケースを書く。偽の `ExtensionAPI` と偽 `ask` を書き、`log.dir` は `tmpDir()`
     3. worktree で上の `look` を1回走らせ、3点を子が読んで報告する

## Notes

### Slice 1: 設定と質問文を固定し、上書きの読み口をつくる

- Findings: なし
- Unplanned: なし
- Commit: 2e16bde

### Slice 2: owner の発言1つ分の状態と、jev に渡す state を組み立てる

- Findings: なし
- Unplanned: なし
- Commit: 5b37506

### Slice 3: 判定と差し込みを1行1件で記録し、古い物を落とす

- Findings: なし
- Unplanned: なし
- Commit: 21e3077

### Slice 4: classifier の候補を順に試し、有料に落ちたら知らせる

- Findings: なし
- Unplanned: なし
- Commit: 5d51785

### Slice 5: `before_agent_start` で分け、質問なら「編集せず調べろ」を1回だけ差し込む

- Findings: なし
- Unplanned: なし
- Commit: ddcb73e

### Slice 6: `turn_end` で「もう答えられるか」を判定し、1回だけ止めて答えさせる

- Findings: なし
- Unplanned: なし
- Commit: c5f275c

### Slice 7: `/intent` でセッション中だけ切り、README を置く

- Findings:
  - review の子の読み（README の3点照合）を子で実行できず、既定値・記載・形状を直接照合した
    - `left: この worktree には子を走らせる口（consult_run 等）が無く、review ロールでの読みを実行できない`
- Unplanned: なし
- Commit: 5f5113d

### Slice 8: 統合: 配線が1本につながり、実セッションのログに残るまで

- Findings:
  - look 実行 (`pi -e .pi/extensions/intent-router/index.ts --no-session -p "cycles/013-2026-10-09/design.md は何を決めた?"`) の `logs/2026-10-09.jsonl`: (1) `hook: "route"` が1件あり `label: "question"` (`confidence: 1`) / (2) `hook: "judge"` の行は無し（短い応答で `minTurns: 2` に届かず判定が出なかった）/ (3) 差し込みは出ていない（`shadow: true` で `guide: "would"`）。合否にはしない
    - `left: judge 行の有無は応答の往復数と閾値で揺れるため、ここでは確認だけした`
- Unplanned: なし
- Commit: d97063f

## Review

### Round 1

- Stale:
  - `README.md:13` / `README.ja.md:13` の拡張一覧が `consult` / `quality-gate` / `sound-notify` / `second-opinion` のままで、この差分が足した `.pi/extensions/intent-router/` を含まない
    - `fixed: 両 README の拡張一覧に intent-router を足し、この2ファイルを ## Files に update で追記した`
  - `.pi/extensions/intent-router/README.md:30` の「The file is read on every prompt」が `index.ts:96` と矛盾する。設定は `register` 時に1回だけ `readSettings` し、handler は閉じ込めた `settings` を使う。プロンプト毎に読み直さない
    - `fixed: README の文を「register 時に1回だけ読み、変えたら reload」に直した`
- Unlisted:
  - なし
- Gaps:
  - `guide.enabled: false`（`hook/route.ts:181`）/ `stop.enabled: false`（`hook/judge.ts:263`）の分岐を叩く検査が無い。Slices 5・6 の Verify は shadow のみで、無効化で `guide` / `stop` が `none` になる経路を見ない
    - `fixed: route.test と judge.test に無効化の検査を足し、guide / stop が none・text null になることを見た`
  - `judge.enabled: false`（`hook/judge.ts:380`）を叩く検査が無い。対照的に `route.enabled: false` は `hook/route.test.ts:249` で叩く
    - `fixed: judge.test に judge.enabled: false の検査を足し、ask もログも増えないことを見た`
  - `decideRoute` の score回答→skip（`hook/route.ts:49`）と未知ラベル文字列→skip（`hook/route.ts:52-54`）の単位検査が無く、handler の skip 経路（actOn / idleOn のどちらにも無い）のログ検査も無い
    - `fixed: 単位検査2件と handler の skip ログ検査2件（設定の穴は label 付き・未知文字列は label null）を足した。設定の穴の skip が label null で数を数えられない穴も見つけ、既知ラベルを残す直しと一緒に検査した`
  - `isSecretTarget` の `.env` 以外（`state.ts:187-196` の `~/.pi/`・`id_rsa` / `id_ed25519`・`.pem` / `.key`）を叩く検査が無い。`state.test.ts:101` は `.env` のみ
    - `fixed: state.test に秘密の的5種と非秘密の検査を足し、秘密混じりの記録が落ちることも見た`
  - `due` が wait の時に行を作らないことの検査が空道具以外に無い（`hook/judge.ts:323`）。`hook/judge.test.ts:305` は道具0件のみで、助走・間隔・連続・上限・撃ち済み・idle の wait でログ件数を見ない。2回目テスト（`judge.test.ts:291`）も `requests` のみでログ件数を見ない
    - `fixed: idle・助走・撃ち済み後の2回目・hold 直後の連続でログ件数を見ない検査を足し、2回目テストにもログ1件の検査を足した`
  - `has_images`（`hook/route.ts:278`）・`truncated`（`hook/route.ts:148` と judge の `state['truncated']`）・`display`（`hook/route.ts:219` と `hook/judge.ts:312`）の伝搬を見る検査が無い。route.test は `cwd_basename` のみ、judge.test は `customType` / `content` のみを見る
    - `fixed: route.test に画像・truncated・display の検査を、judge.test に display と maxStateChars を絞った truncated の検査を足した`
- Unproven:
  - `state.test.ts:72` の溢れ検査は件数と `truncated` のみで、どれを捨てたかを見ない。`state.ts:117` の `slice(1)` を `slice(0, -1)`（新しい方を捨てる）に変えても緑のまま
    - `fixed: 溢れ検査に古い方（f0.ts）が落ち・新しい方（overflow.ts）が残ることを足した`
  - `state.test.ts:90` の重複検査は同じ `result: 'ok'` を2回入れて `attempts` のみ見る。`state.ts:110` の `result` 上書きを消しても緑のまま
    - `fixed: 重複検査を first / second の別文にし、attempts と最新文の両方を見るようにした`
  - `hook/judge.test.ts:287` は `entries.content` を `stopMessage(...)` の戻り値と比べる自己一致で、`settings.ts:251` の `stop.text` に `{label}` が無いため置換を消しても緑のまま。対照的に route.test は文面を一字一句の literal で比べる
    - `fixed: entries.content を一字一句の literal と比べ、stopMessage には {label} の置換検査を別に足した`
  - `index.test.ts:190` の配線検査は `findOfType` が常に同モデルを返す偽物のため、`hook/judge.ts:327` の `only: run.candidate` を消して選び直しても2行・`owner_prompt` 一致のまま緑
    - `fixed: findOfType が別モデルを返す偽物にし、route と judge の classify 先が可用と使い回しで分かれることを見る検査を足した`
  - `command.test.ts:87-114` は前後空白無しの `off` / `on` / `''` / `maybe` のみで、`command.ts:35` の `trim()` を消しても緑のまま
    - `fixed: 前後空白つきの on / off の検査を足した`
  - `settings.test.ts:118` は `JUDGE_QUESTION.criteria` の件数と閾値の位置のみで中身の `0:` / `1:` / `2:` を見ない。`questions.ts:51-55` を `['a', 'b', 'c']` に変えても緑のまま
    - `fixed: criteria の先頭の 0: / 1: / 2: を見る検査を足した`

## Acceptance

- Ran:
- Findings:
