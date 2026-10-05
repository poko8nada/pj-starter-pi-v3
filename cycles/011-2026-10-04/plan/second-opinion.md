# PLAN `second-opinion`

## Files

```text
.pi/extensions/second-opinion/
  index.ts                   add
  index.test.ts              add
  conversation.ts            add
  conversation.test.ts       add
  answer.ts                  add
  answer.test.ts             add
  types.json                 add   （この拡張のロール。1つだけ）
  policy/
    types.ts                 add   （consult から写す。KNOWN_TOOLS はそのまま）
    types.test.ts            add   （写して、ロール名の期待を1つに直す）
  child/
    spec.ts                  add   （同上）
    spec.test.ts             add   （同上）
    guard.ts                 add   （同上）
    guard.test.ts            add   （同上）
    budget.ts                add   （同上）
    budget.test.ts           add   （同上）
  run/
    git-env.ts               add   （同上）
    run.ts                   add   （同上。worktree と依存導入は写さない）
    run.test.ts              add   （同上）
  README.md                  add
```

（`.pi/test/pi` は `consult-run-watchdog` が作る物を使う。自分では作らない）

## Slices

1. 子を1体走らせる芯（consult からの写し）
   - I/O:
     ```ts
     // policy/types.ts（写して1ロールに絞る）
     interface TypePolicy {
       name;
       models;
       tools;
       isolated;
       paths;
       bash;
       continueByDefault;
       limits;
       role?;
     }
     // child/spec.ts（そのまま）
     export function buildPiArgs(options: ConsultOptions): string[];
     // child/guard.ts（そのまま）
     export function judgeToolCall(
       name: string,
       input: unknown,
       cwd: string,
       limits?: Limits,
     ): { block?: true; reason?: string };
     // child/budget.ts（そのまま）
     export function nudge(turns: number | undefined, turnIndex: number): string | undefined;
     // run/git-env.ts（そのまま。使い手は子の起動時の env を組む所）
     export function gitEnv(env?: NodeJS.ProcessEnv): NodeJS.ProcessEnv;
     // run/run.ts（worktree と installDependencies を落とす）
     export function runPi(options: RunOptions): Promise<RunResult>;
     ```
   - Verify:
     - test: `pnpm run test:run .pi/extensions/second-opinion/child/spec.test.ts .pi/extensions/second-opinion/child/guard.test.ts .pi/extensions/second-opinion/child/budget.test.ts .pi/extensions/second-opinion/policy/types.test.ts .pi/extensions/second-opinion/run/run.test.ts`
       - 写したテストが通る。`policy/types.test.ts` はロール名の期待を1つ（`opinion`）に直してから通す（happy）
       - 落とした物（worktree / 依存導入）を参照していない（empty）
       - 権限: 当てはまらない（写した物の判定をそのまま試す）
   - Steps:
     1. `.pi/extensions/second-opinion/policy/types.ts` と `types.test.ts`: consult から写し、ロールを `opinion` 1つに絞る（読みだけ / `isolated: false` / `paths: []` / `bash: []` / 親と別モデル / 上限は turns 8, output 8000）
     2. `.pi/extensions/second-opinion/child/spec.ts` と `spec.test.ts`: そのまま写す（`needsIsolation` は残す）
     3. `.pi/extensions/second-opinion/child/guard.ts` と `guard.test.ts`: そのまま写す（許可の規則は読みだけのロールでも秘密パスに効く）
     4. `.pi/extensions/second-opinion/child/budget.ts` と `budget.test.ts`: そのまま写す
     5. `.pi/extensions/second-opinion/run/git-env.ts`: そのまま写す
     6. `.pi/extensions/second-opinion/run/run.ts` と `run.test.ts`: 写して、worktree と依存導入（`installDependencies` / `changedFiles`）を落とす
2. 会話の窓
   - I/O:
     ```ts
     export type Held = { readonly messages: AgentMessage[] };
     export function recordMessage(held: Held, message: AgentMessage): void;
     export type Window = { readonly text: string; readonly dropped: number };
     export function windowFrom(
       messages: readonly AgentMessage[],
       count: number,
       ownToolName: string,
     ): Window;
     // 打切り: 1つの発言は 4000 字、道具の結果は 2000 字（定数）
     ```
   - Verify:
     - test: `pnpm run test:run .pi/extensions/second-opinion/conversation.test.ts`
       - 直近 N 件だけを残し、落とした件数を返す（happy）
       - 道具の引数（`path` / `command` / `queries` / `urls`）と結果を、道具名つきで出す（happy）
       - 長い発言は切る（boundary values）
       - 自分の道具（`ownToolName`）の結果は入れない（happy）
       - 会話が空（empty）
       - N が 0 以下（invalid input）
       - 権限: 当てはまらない（文字列を組むだけ）
   - Steps:
     1. `.pi/extensions/second-opinion/conversation.ts`: `windowFrom` を書く。役割・本文・道具の引数と結果を、`owner:` / `agent:` / `agent: [tool: <name>] <args>` の形にし、発言は 4000 字・道具の結果は 2000 字で切る
     2. `.pi/extensions/second-opinion/conversation.test.ts`: 上のケースを書く（`AgentMessage` の literal を fixture にする）
3. ツールとコマンド
   - I/O:
     ```ts
     // ツールの引数（typebox）
     { focus?: string; messages?: number }
     // コマンドの引数（文字列1つ）
     parseCommandArgs(args: string): { focus?: string; messages?: number }
     // 子に渡す指示（既定の質問は answer.ts の定数）
     export function opinionTask(window: Window, focus: string | undefined): string;
     // ツールの実行経路（同期。子の本文をそのまま返す）
     export function runOpinion(pi: PiPort, held: Held, request: OpinionRequest): Promise<string>;
     ```
   - Verify:
     - test: `pnpm run test:run .pi/extensions/second-opinion/answer.test.ts .pi/extensions/second-opinion/index.test.ts`
       - 既定の質問と、`focus` の上書き（happy）
       - `messages` の既定 20 と上書き（happy）
       - コマンド引数: 先頭が数字なら件数、残りが質問（happy）
       - コマンド引数が空 → 既定の質問（empty）
       - 権限: 当てはまらない（文字列を組むだけ）
   - Steps:
     1. `.pi/extensions/second-opinion/answer.ts` と `answer.test.ts`: 既定の質問（矛盾・穴・別案）、答えの形（`Consistent` / `Holes` / `Alternative` / `Cannot judge` / `Read`、無い欄は `なし`、15行以内）を、ロールの文面と `opinionTask` に書く
     2. `.pi/extensions/second-opinion/index.ts` と `index.test.ts`: ツール `opinion`（`focus?` / `messages?`）とコマンド `/opinion`（引数を `parseCommandArgs` で読む）を登録する。ツールは子の本文をそのまま返し、コマンドは会話へメッセージとして出す
     3. `.pi/extensions/second-opinion/index.ts`: `pi.on('message_end')` と `pi.on('input')` で会話を貯める
     4. `.pi/extensions/second-opinion/README.md`: 何をする拡張か、呼び方、答えの形、設定（既定の質問・件数・ロール）を書く
4. 統合: 会話を渡して、子の判定を同じターンで受け取る
   - Verify:
     - test: `pnpm run test:run .pi/extensions/second-opinion/index.test.ts`
       - `.pi/test/pi`（`FAKE_PI_MODE=exit`、`FAKE_PI_TEXT`）で、ツールが子の本文をそのまま返す（happy）
       - 子の起動引数に `--no-session` と、`types.json` のロールのツール一覧（`read` / `ls` / `find` / `grep` / `web_search` / `fetch_content`）が入る（happy）
       - 子の答えは加工せずそのまま返る（happy）
       - 会話が空のまま呼ぶ → 既定の質問だけで走る（empty）
       - `.pi/test/pi` が無い（PATH に `pi` が無い）→ 例外を投げ、黙って空を返さない（error）
       - 権限: 当てはまらない（`.pi/test/pi` と一時ディレクトリの cwd だけを使う）
   - Steps:
     1. `.pi/extensions/second-opinion/index.test.ts`: `PATH` の先頭に `.pi/test/` を立て、`FAKE_PI_MODE=exit` と `FAKE_PI_TEXT` を渡して上のケースを書く（`.pi/test/pi` は `consult-run-watchdog` が作る物をそのまま使う）

## Notes

### Slice 1: 子を1体走らせる芯（consult からの写し）

- Findings:
- Unplanned:
- Commit:

### Slice 2: 会話の窓

- Findings:
- Unplanned:
- Commit:

### Slice 3: ツールとコマンド

- Findings:
- Unplanned:
- Commit:

### Slice 4: 統合: 会話を渡して、子の判定を同じターンで受け取る

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
