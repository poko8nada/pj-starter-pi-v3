# PLAN `second-opinion-usable`

## Files

```text
.pi/extensions/second-opinion/
  index.ts                     update
  index.test.ts                update
  conversation.ts              drop
  conversation.test.ts         drop
  answer.ts                    drop
  answer.test.ts               drop
  tool/
    conversation.ts            add
    conversation.test.ts       add
    answer.ts                  add
    answer.test.ts             add
  run/
    root.ts                    add
    root.test.ts               add
    log.ts                     add
    log.test.ts                add
  child/
    budget.ts                  update
    budget.test.ts             update
  types.json                   update
  README.md                    update
```

## Slices

1. `conversation.ts` と `answer.ts` を `tool/` に移す（01-8）
   - I/O: なし（置き場だけが変わる）
   - Verify:
     - test: `pnpm run test:run .pi/extensions/second-opinion`
       - 移した後も全部通る（happy）
       - 権限: 当てはまらない
   - Steps:
     1. `.pi/extensions/second-opinion/tool/`: `conversation.ts` / `answer.ts` と、そのテストを移す
     2. `.pi/extensions/second-opinion/index.ts`: 2つの import を直す（`./tool/conversation.ts` と `./tool/answer.ts`。片方だけ直すと読めなくなる）
     3. `.pi/extensions/second-opinion/README.md`: 「The code」の並びを直す
2. 道具とコマンドの名前を拡張に合わせる（01-1）
   - I/O: なし（`TOOL_NAME` の値が `second_opinion` に変わるだけ）
   - Verify:
     - test: `pnpm run test:run .pi/extensions/second-opinion/index.test.ts`
       - 偽 `pi` の `registerTool` に渡る名前と、`registerCommand` に渡る名前が `second_opinion`（happy）
       - コマンドの `description` が `second_opinion` を指す（happy）
       - 権限: 当てはまらない（文字列の話）
   - Steps:
     1. `.pi/extensions/second-opinion/index.ts`: `TOOL_NAME` を `second_opinion` にする
     2. `.pi/extensions/second-opinion/index.test.ts`: 偽 `pi` に `registerTool` / `registerCommand` を記録させ、名前を主張する
     3. `.pi/extensions/second-opinion/README.md`: 道具とコマンドの名前、例を直す
3. reload をまたいでも会話を材料にする（01-2）
   - I/O:
     ```ts
     export interface Held {
       readonly messages: AgentMessage[];
       /** 入れた発言の印。`role` と `timestamp` を繋げた物 */
       readonly seen: Set<string>;
     }
     /** 既にある会話を写す。`seen` に印を立てるので、後から同じ発言が来ても二重にならない */
     export function seedHeld(messages: readonly AgentMessage[], held: Held): void;
     export function recordMessage(held: Held, message: AgentMessage): void;
     ```
   - Verify:
     - test: `pnpm run test:run .pi/extensions/second-opinion/tool/conversation.test.ts`
       - 既にある会話を `seedHeld` に渡す → `held.messages` に入り、`held.seen` に `role` と `timestamp` の印が立つ（happy）
       - 同じ `role` と `timestamp` の `message_end` が seed の後に来る → `held.messages` は増えない（a second call。`seen` が無ければ増える）
       - 空の会話を渡す → `held.messages` も `held.seen` も空のまま（empty）
       - 権限: 当てはまらない（配列を写すだけ）
     - test: `pnpm run test:run .pi/extensions/second-opinion/index.test.ts`
       - 偽 `pi` の `context` を起こす → その会話で子の窓が埋まる（happy）
       - 権限: 当てはまらない
   - Steps:
     1. `.pi/extensions/second-opinion/tool/conversation.ts`: `Held` に `seen` を足し、`recordMessage` が `role` と `timestamp` の印で二重を除くようにする。`seedHeld` を足す
     2. `.pi/extensions/second-opinion/index.ts`: `held` を `{ messages: [], seen: new Set() }` にし、`pi.on('context')` で `seedHeld(event.messages, held)` を呼ぶ
        - Outside: design の `External`（`pi`: `on("context")` は `messages: AgentMessage[]` を渡す）。渡された会話を写すだけで、pi に求める物は変わらない
     3. `.pi/extensions/second-opinion/index.test.ts`: 偽 `pi` に `context` を起こさせ、reload の後に窓が埋まることを試す
4. 実行中の様子を出す（01-3）
   - I/O:
     ```ts
     // 変わる: 進行の通知を受ける
     export async function runOpinion(
       port: PiPort,
       held: Held,
       request: OpinionRequest,
       onProgress?: (text: string) => void,
     ): Promise<string>;

     // 動く2つの形（この2つを繋ぐのがこのスライスの仕事）
     // 1. runPi が受ける物（run/run.ts の RunOptions.onProgress）
     type RunProgress = (chunk: {
       readonly stream: 'stdout' | 'stderr';
       readonly text: string;
     }) => void;
     // 2. execute が受ける物（index.ts の ExecuteArgs[3]）
     type Update = (update: {
       readonly content: { readonly type: 'text'; readonly text: string }[];
     }) => void;
     ```
   - Verify:
     - test: `pnpm run test:run .pi/extensions/second-opinion/index.test.ts`
       - 子を起こす前に、渡した `onProgress` がちょうど1度呼ばれる（happy。起動前の1回）
       - 子の本文が届いたら、その本文が `onProgress` に来る（happy。`chunk.text` を渡している）
       - `onProgress` を渡さない → 何も起きず、今までどおり本文が返る（empty）
       - 子が起動できない → 例外を投げる（error）
       - 権限: 当てはまらない
   - Steps:
     1. `.pi/extensions/second-opinion/index.ts`: `runOpinion` に `onProgress?: (text: string) => void` を受けさせ、子の起動前に1度呼ぶ。`runPi` へは `onProgress: (chunk) => onProgress?.(chunk.text)` の形で渡す（`RunOptions.onProgress` は `{stream, text}` を受けるので、そのままは渡せない）
        - Outside: design の `External`（`pi`: 道具の `execute` は `onUpdate` を受け取る）。呼ぶだけで、pi に求める物は変わらない
     2. `.pi/extensions/second-opinion/index.ts`: `execute` の `args[3]`（`onUpdate`）を捨てずに、`(text) => onUpdate?.({ content: [{ type: 'text', text }] })` の形に包んで `runOpinion` へ渡す
     3. `.pi/extensions/second-opinion/index.test.ts`: 記録する `onUpdate` を渡し、上のケースを書く
5. 打ち切られても最後の本文を返す（01-4）
   - I/O:
     ```ts
     // 見る側（run/run.ts。形は変わらない。枝をこのスライスで歩く）
     export type ChildState = 'done' | 'turn-limit' | 'error' | 'aborted';
     export function stateOf(run: RunResult): ChildState;
     export function reasonOf(run: RunResult): string | undefined;

     export interface Body {
       readonly text: string;
       /** 打ち切りの理由。done なら無い */
       readonly cut?: string;
     }
     export function bodyOf(run: RunResult): Body;
     // 変わる: cut があれば本文の後ろに1行添える
     export async function runOpinion(
       port: PiPort,
       held: Held,
       request: OpinionRequest,
       onProgress?: (text: string) => void,
     ): Promise<string>;
     ```
   - Verify:
     - test: `pnpm run test:run .pi/extensions/second-opinion/index.test.ts`
       - `ended` で本文あり → `{text: 'hi'}`（happy。`stateOf` は `done`）
       - `stopped: 'turn limit reached (20)'` で本文あり → `{text: 'hi', cut: 'turn limit reached (20)'}`（error。`stateOf` は `turn-limit`）
       - `aborted` で本文あり → `cut` は `'stopped by the parent'`（error）
       - `code: 1` / `stderr: 'boom'` で本文あり → `cut` は `'boom'`（error。`stateOf` は `error`）
       - 本文が空で `ended` → `{text: ''}`（empty）
       - 本文が空で `stopped` / `aborted` / `code: 1` → いずれも投げる（empty × 3）
       - `cut` 付きの子を `runOpinion` に走らせると、返る本文が `(打ち切られました: <cut>)` で終わる（error。`exit` モードの偽 `pi` と、`bodyOf` の `cut` を直に組んだ物の2通りで見る）
       - 権限: 当てはまらない
   - Steps:
     1. `.pi/extensions/second-opinion/index.ts`: `bodyOf` を `{text, cut?}` に変える。本文があれば `stateOf` が `done` 以外でも返し、`reasonOf` を `cut` に入れる。本文が無ければ今までどおり投げる
     2. `.pi/extensions/second-opinion/index.ts`: `runOpinion` は `text` を返し、`cut` があれば本文の後ろに `\n\n(打ち切られました: <cut>)` を添える
     3. `.pi/extensions/second-opinion/index.test.ts`: 既存の3件を `{text}` の形に直し、上のケースを書く
6. 促しを上限の2つ前に出す（01-5）
   - I/O:
     ```ts
     // consult-nudge と同じ形。写しなので、形も同じにする
     export interface BudgetPiPort {
       on(event: 'turn_end', handler: (event: { turnIndex: number }) => TurnEndEventResult): void;
     }
     export function lastTurn(turns: number | undefined): number | undefined;
     export function nudge(
       limit: number | undefined,
       sent: boolean,
       turnIndex: number,
     ): TurnEndEventResult | undefined;
     export function turnsFrom(value: string | undefined): number | undefined;
     export function registerBudget(pi: BudgetPiPort, turns: number | undefined): void;
     ```
   - Verify:
     - test: `pnpm run test:run .pi/extensions/second-opinion/child/budget.test.ts`
       - `lastTurn(20)` が 18（19 ではない）（happy。この plan が決める上限）
       - `lastTurn(2)` が 0（boundary values）
       - `lastTurn(undefined)` / `lastTurn(1)` / `lastTurn(0)` / `lastTurn(2.5)` が `undefined`（invalid input）
       - `nudge(18, false, 18)` が `{entries: [{type: 'custom_message', customType: 'consult-budget', content: LAST_TURN_MESSAGE, display: true}], continue: true}` を返す（happy。`LAST_TURN_MESSAGE` の中身も見る）
       - `nudge(18, false, 17)` が `undefined`（促す番号の1つ手前。boundary values）
       - `nudge(18, true, 18)` / `nudge(undefined, false, 18)` が `undefined`（a second call と invalid input）
       - `turnsFrom('20')` が 20、`turnsFrom('')` / `'  '` / `'x'` / `'0'` / `'-5'` / `'2.5'` / `undefined` が `undefined`（invalid input）
       - `registerBudget` を偽 `pi` で組み、`turnIndex` 18 の `turn_end` を2度起こす → 1度目だけ促す（a second call。閉じ込めた `sent`）
       - 権限: 当てはまらない
   - Steps:
     1. `.pi/extensions/second-opinion/child/budget.ts`: `consult-nudge` の Slice 1 の結果を写す（`turns - 2` と `registerBudget` の切り出し）
     2. `.pi/extensions/second-opinion/child/budget.test.ts`: `consult-nudge` の Slice 1 の結果を写し、上限だけ 20 に合わせる（上のケース）
7. ターン数を窓に見合う値にする（01-6）
   - I/O: なし（`types.json` の値だけが変わる）
   - Verify:
     - test: `pnpm run test:run .pi/extensions/second-opinion/index.test.ts`
       - 子に渡る `CONSULT_TURNS` が `'20'`（happy。`types.json` の `limits.turns` を読んでいる）
       - 権限: 当てはまらない
   - Steps:
     1. `.pi/extensions/second-opinion/types.json`: `limits.turns` を 8 から 20 にする（consult の `research` は 40。窓が20件で道具の結果を含むので、読みと報告に20ターン）
     2. `.pi/extensions/second-opinion/index.test.ts`: `CONSULT_TURNS` の期待値を `'20'` に直す
     3. `.pi/extensions/second-opinion/README.md`: 上限の記述を直す
8. 子の記録を残す（01-7）
   - I/O:
     ```ts
     // 置き場。consult は worktree から root を決めるが、こちらは worktree を持たない
     export const OPINION_ROOT = '/tmp/pi-consult';
     export function opinionRoot(cwd: string, env: NodeJS.ProcessEnv): string;

     // consult/run/log.ts の RunRecord をそのまま写す（欄を削らない）
     export interface RunRecord {
       readonly child: string;
       readonly role: string;
       readonly worktree?: string;
       readonly pid: number;
       readonly started: number;
       readonly ended?: number;
       readonly state?: ChildState;
       readonly reason?: string;
       readonly files?: readonly string[];
       readonly turns?: number;
       readonly spend?: string;
       readonly notice?: string;
     }
     export const PARENT_UNIT = '_parent';
     export function unitOf(worktree: string | undefined): string;
     export function logPath(root: string, unit: string): string;
     export function appendRun(root: string, record: RunRecord): void;
     export function parseRun(line: string): RunRecord | undefined;
     export function readRuns(root: string): RunRecord[];
     ```
   - Verify:
     - test: `pnpm run test:run .pi/extensions/second-opinion/run/root.test.ts`
       - `opinionRoot('/a/b', { CONSULT_ROOT: '/tmp/x' })` が `/tmp/x/second-opinion-b`（happy。cwd と env から決まる）
       - `opinionRoot('/a/b', {})` が `/tmp/pi-consult/second-opinion-b`（empty。env が無ければ既定）
       - 権限: 当てはまらない（文字列を組むだけ）
     - test: `pnpm run test:run .pi/extensions/second-opinion/run/log.test.ts`
       - `unitOf('2-a')` が `'2-a'`、`unitOf(undefined)` が `'_parent'`（happy）
       - 開始の1行と終了の1行が書かれ、`readRuns` で読める（happy）
       - 同じ unit に2件目を足しても1件目が消えない（a second call）
       - 2つの unit の記録が `started` の順に並ぶ（happy。`_parent: 1000` と `2-b: 2000`）
       - `parseRun` が壊れた行と、形の違う行（`pid` が文字列、`state` が未知の語）を `undefined` にする（invalid input）
       - root が無ければ `[]`（empty）
       - 権限: 当てはまらない（一時ディレクトリに書く）
   - Steps:
     1. `.pi/extensions/second-opinion/run/root.ts`: `opinionRoot(cwd, env)` を書く（`CONSULT_ROOT` があればその下、無ければ `/tmp/pi-consult/` の下。cwd の basename ごとに1つ。時刻は使わない）
     2. `.pi/extensions/second-opinion/run/root.test.ts`: 上のケースを書く
     3. `.pi/extensions/second-opinion/run/log.ts`: `consult/run/log.ts` から `RunRecord` / `PARENT_UNIT` / `unitOf` / `logPath` / `appendRun` / `parseRun` / `readRuns` を写す（欄と署名を削らない）
     4. `.pi/extensions/second-opinion/run/log.test.ts`: `consult/run/log.test.ts` から写し、上のケースを書く
     5. `.pi/extensions/second-opinion/index.ts`: 子を起こす前に開始の1行、終わったら終了の1行を書く（`runPi` の `onStarted` と `onDone` を使う）。`child` は `second-opinion-1` の形、`role` は `'opinion'`、`state` と `reason` は `stateOf` と `reasonOf` から
9. 統合: 実用で1回使える
   - I/O: なし
   - Verify:
     - test: `pnpm run test:run .pi/extensions/second-opinion`
       - 偽 `pi` の `exit` モードで、reload の後に呼んでも会話が材料になり、本文が返る（happy）
       - 同じ呼び出しで、`log.jsonl` に開始の1行と終了の1行が残り、`readRuns` で `state: 'done'` として読める（happy）
       - 子が起動できない → 例外を投げ、記録にも終了の1行が `state: 'error'` として残る（error）
       - 権限: 当てはまらない（偽 `pi` と一時ディレクトリだけを使う）
   - Steps:
     1. `.pi/extensions/second-opinion/index.test.ts`: 上のケースを書く。`exit` モードで足りる（`turn_end` は要らない。促しは Slice 6 が、打ち切りの本文は Slice 5 が押さえる）

## Notes

### Slice 1: `conversation.ts` と `answer.ts` を `tool/` に移す（01-8）

- Findings:
  - なし
- Unplanned:
  - なし
- Commit: 245035a

### Slice 2: 道具とコマンドの名前を拡張に合わせる（01-1）

- Findings:
  - なし
- Unplanned:
  - なし
- Commit: 3bfaaff

### Slice 3: reload をまたいでも会話を材料にする（01-2）

- Findings:
  - なし
- Unplanned:
  - なし
- Commit: 0b7ac2a

### Slice 4: 実行中の様子を出す（01-3）

- Findings:
  - なし
- Unplanned:
  - なし
- Commit: 810d94a

### Slice 5: 打ち切られても最後の本文を返す（01-4）

- Findings:
  - なし
- Unplanned:
  - なし
- Commit: aca6edf

### Slice 6: 促しを上限の2つ前に出す（01-5）

- Findings:
  - なし
- Unplanned:
  - なし
- Commit: 2919c3b

### Slice 7: ターン数を窓に見合う値にする（01-6）

- Findings:
  - なし
- Unplanned:
  - なし
- Commit: 39acf43

### Slice 8: 子の記録を残す（01-7）

- Findings:
  - なし
- Unplanned:
  - parseRun は未知の `state` を `undefined` にする（写し元の consult は欄を落として読むが、Verify の invalid input に合わせ厳格化）
- Commit: 14b3e5d

### Slice 9: 統合: 実用で1回使える

- Findings:
  - なし
- Unplanned:
  - なし
- Commit: 646fc54

## Review

### Round 1

- Stale:
  - index.ts 冒頭コメントが「道具 opinion とコマンド /opinion」のまま — `TOOL_NAME` は `second_opinion` に変わり (3bfaaff)、貯め方も `message_end` と `input` の2つだけと書くが `pi.on('context', seedHeld)` が足されている (0b7ac2a, index.ts:2-6,272-274)。
    fixed: 冒頭コメントを `second_opinion`・`/second_opinion`・`context` 写し・打ち切り注つき返却に直した
  - `Returns the child text as-is.` が古い — Slice 5 で `cut` ありは `formatBody` が `\n\n(打ち切られました: <cut>)` を添える (index.ts:140-145) のに、`README.md:11` と道具 `description` (index.ts:249) が無条件のまま。
    fixed: 道具 `description` と README の表・What comes back に打ち切り注の旨を足した
  - `README.md:61` の `run/ ... record-free synchronous wait` が古い — Slice 8 で `onStarted`/`onDone` から `appendRun` する (index.ts:179-194) のに記録なしのまま。
    fixed: `run/` の行を synchronous wait と run record を持つ旨に直した
- Unlisted:
  - なし
- Gaps:
  - `/second_opinion` コマンドの `handler` を呼ぶ検査がない — 登録の名前/`description` と道具 `execute` 経路のみで、`sendMessage({customType:'second-opinion-answer',...})` (index.ts:263-270) とコマンド経路の振る舞いが未 exercise。
    fixed: 偽 pi で handler を呼び、`second-opinion-answer` の送信と子の窓入りを試す検査を足した
  - `runOpinion` で打ち切り子を走らせる検査がない — `runOpinion: 打ち切りの注` の2件目は `bodyOf` と `formatBody` の直結で、偽 pi は `exit`(done) のみ。`runOpinion → formatBody` の注付き返却が spawn 経路で未 exercise (index.test.ts:295-298)。
    fixed: `agent_end` なしで `message_end` 21件出す打ち切り子 wrapper を置き、`runOpinion` の注付き返却を spawn 経路で試した（`formatBody` 外しで赤になることを確認）
  - `nudge` の上限超過後 (`turnIndex > limit`) が未 exercise — 実装は `turnIndex < limit` のみ弾くため `nudge(18,false,19)` は促す (child/budget.ts:45) が、検査は `18` happy と `17` boundary のみ。
    fixed: `nudge(18,false,19)` が促す検査を足した
  - `pi.on('input', ...)` の owner 入力経路を偽 pi で起こす検査がない — `context` seed と `message_end` はあるが、`ownerMessage(Date.now()) → held → 子の窓` の end-to-end がない (index.ts:278-280)。
    fixed: 偽 pi で `input` を起こし、`execute` の子の窓に入ることを試す検査を足した
- Unproven:
  - `runOpinion: 打ち切りの注 / cut 付きの子 → 返る本文が注で終わる` (index.test.ts:295-298) は `runOpinion` を呼ばない — `runOpinion` から `formatBody` を外しても緑のまま。
    fixed: 上の spawn 経路の検査で配線を証明した（`formatBody` 外しで赤になることを確認）
  - 自道具除外と `TOOL_NAME` の配線が未証明 — `tool/conversation.test.ts` は旧名 `'opinion'` で generic に試すだけで、`index.test.ts` の held は owner のみ。`runOpinion` の `windowFrom(..., TOOL_NAME)` (index.ts:158) を別名に変えても全テストが緑のまま。
    fixed: `TOOL_NAME` 名の呼び出しと結果を含む held で `runOpinion` を走らせ、窓から除かれる検査を足した（別名化で赤になることを確認）

## Acceptance

- Ran:
- Findings:
