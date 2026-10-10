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

- Findings: なし
- Unplanned:
  - `child/spec.test.ts` の guard パスの期待を `/.pi/extensions/consult/` から `/.pi/extensions/second-opinion/` に直した。写した `spec.ts` がパスを `import.meta.url` から組むため、写したままでは落ちる
- Commit: c30dd83

### Slice 2: 会話の窓

- Findings: なし
- Unplanned: なし
- Commit: b964fde

### Slice 3: ツールとコマンド

- Findings: なし
- Unplanned: なし
- Commit: 8ad797b

### Slice 4: 統合: 会話を渡して、子の判定を同じターンで受け取る

- Findings: なし
- Unplanned:
  - `index.test.ts` の tmp helper の import を `../../../test/tmp.ts` から `../../test/tmp.ts` に直した。このテストだけ拡張ルート直下にあり、写し元の深さ（1階層下）と違うため
- Commit: 9ca2e24

## Review

### Round 1

- Stale:
  - `README.md:13` / `README.ja.md:13` の拡張一覧が古い。`consult`（4道具）・`quality-gate`・`sound-notify` の3つだけを数えたままで、diff が足した4つ目の拡張 `second-opinion` が無い
    fixed: `second-opinion` と `opinion` を両 README の拡張一覧に足した
  - `second-opinion/policy/types.ts:6` のコメント「次の consult から効く」が古い。写し元の文面のままで、この拡張（`opinion` / `second-opinion`）を指していない
    fixed: 「次の opinion から効く」に直した
  - `second-opinion/policy/types.ts:39,71,205` が古い。`consult_run` の言及とエラー接頭辞 `consult types:` が残り、`opinion` 拡張の物になっていない
    fixed: `continueByDefault` の説明を遣い捨ての旨に書き直し、接頭辞を `second-opinion types:` にした
  - `second-opinion/child/spec.ts:2,22` のコメントが古い。「consult が起動する子」と `run/child.ts`（この拡張には無い。正しくは `run/run.ts`）を指す
    fixed: 主語を `second-opinion` にし、env を足す所を `index.ts` に直した
  - `second-opinion/child/guard.ts:4,155` のコメントが古い。「`consult` が子の起動引数に」「consult 以外から起動」のままで、`second-opinion` になっていない
    fixed: 両方 `second-opinion` に直した（`CONSULT_POLICY` の env 名は変えていない）
  - `second-opinion/child/budget.ts:4,52` と `child/budget.test.ts:4,47` が古い。`run/child.ts`（存在しない）と `customType: 'consult-budget'` が残り、子の促しが別拡張の名を名乗る
    fixed: 参照を `index.ts` にし、`customType` を `second-opinion-budget` にした（本体とテストの両方）
  - `second-opinion/run/run.ts:168-169` の `spawnOptions` コメント「残った作業は worktree に残る」が古い。Slice 1 で worktree を落としたのに文面は worktree 前提のまま
    fixed: 読みだけの子で作業場の心配が要らない旨に書き直した
- Unlisted:
  - なし（`0a8a56a..HEAD` の19ファイルは Files の19項目と一致。Files 外の変更は無い）
- Gaps:
  - 会話の蓄積（`index.ts:185-194` の `message_end` / `input`）を Verify が見ない。user 重複除外・`Date.now()` の保持を試す物が無く、手組みの `Held` だけを通す
    fixed: 蓄積を `collectMessage` に抜き出し、user 除外・agent 蓄積・input の時刻保持を試した
  - 不正な `messages`（`toRequest` 素通し・`parseCommandArgs` の `0 ...` → `messages: 0`）経由の `windowFrom` の throw を Verify が見ない。Slice 2 は `windowFrom` 単体の throw を見るが、道具・コマンド経路の invalid input は無い
    fixed: `messages: 0` での `runOpinion` の throw（子を走らせない）・素通し・`'0 check'`・`'-3 x'` を試した
  - 子の空出力（`index.ts:134` の `finalTextFrom(...)` が `''`）をそのまま返す道を Verify が見ない。Slice 4 の「黙って空を返さない」は `pi` 不在だけを見て、生成 0 のまま `done` の空本文は試さない
    fixed: 終わり方の判定を `bodyOf` に抜き出し、非 done の throw・done+空の素通し・本文ありを試した
  - 子への env（`index.ts:115-119` の `CONSULT_POLICY` / `CONSULT_TURNS`）とモデル乗換え（`withModel` / `runWithFallback`）を Verify が見ない。Slice 4 は `--no-session` と `--tools` だけを確かめる
    fixed: wrapper で env と呼び出し回数を記録し、許可・上限・1番目モデル・1回終了を試した（2番目以降への乗換えは写した `runWithFallback` の検査が持つ）
  - 描画の枝（`conversation.ts:148-210` の system / custom 除外・thinking 除外・未知引数の JSON 落とし・窓外に落ちた自道具呼び出しに対応する結果の漏れ）を Verify が見ない。Slice 2 は既知キー（`path` / `command` / `queries` / `urls`）の happy だけ
    fixed: 自道具 id の走査を窓全体に直し、system / custom・thinking・未知引数 JSON・窓外の自道具結果の除外と他道具結果の残存を試した
  - 15行以内（`answer.ts` の既定質問・`README.md`）の強制が無い。`runOpinion` は子の本文をそのまま返し（`index.test.ts:117-127` が素通しを保証）、Verify は文面に `15行` が入ることしか見ない
    left: 強制（切断・拒否）は plan I/O の「子の本文をそのまま返す」と矛盾するため入れない。15行は子への指示として残す

### Round 2

- Stale:
  - なし（`fixed:` 7件を検証。`README.md:13` / `README.ja.md:13` は両方 `second-opinion` と `opinion` を含む。`policy/types.ts:6` は「次の opinion から効く」。`policy/types.ts:39` は遣い捨ての旨、`71,205` は `second-opinion types:` で、`types.ts` 内の `consult` は0件。`child/spec.ts:2` は `second-opinion が起動する子`、`22` は `(index.ts)` で `run/child.ts` の言及なし。`child/guard.ts:4,155` は両方 `second-opinion` で小文字 `consult` は0件。`child/budget.ts:4` は `index.ts`、`52` と `budget.test.ts:47` は `second-opinion-budget` で `run/child.ts` / `consult-budget` なし。`run/run.ts:168-169` は読みだけの旨に直っている）
- Unlisted:
  - なし（Round 1 がなしで、`fixed:` 対象外）
- Gaps:
  - なし（`fixed:` 5件を検証。蓄積は `index.ts:177-182` の `collectMessage` に user 除外があり `index.test.ts:161-196` が user 除外・agent 蓄積・input 時刻を試す。不正 `messages` は `index.ts:132` の `windowFrom` が `runPi` より先に投げ、`index.test.ts:219-238` が throw・素通し・`0 check`・`-3 x` を試す。空出力は `index.ts:113-120` の `bodyOf` が非 done を投げ、`index.test.ts:203-217` が throw・空素通し・本文ありを試す。env と乗換えは `index.ts:135-148` が `CONSULT_POLICY` / `CONSULT_TURNS` と `runWithFallback` を組み立て、`index.test.ts:240-263` が許可・上限8・1番目モデル・1回終了を試し、2番目以降は `run/run.test.ts:69-137` が持つ。描画は `conversation.ts:233` が窓全体走査で `148-217` が除外を持ち、`conversation.test.ts:135-146,191-210` が除外と残存を試す。`left:` 1件は対象外で据え置き）

## Acceptance

- Ran:
  - `pnpm run test:run .pi/extensions/second-opinion` → 8 files / 244 passed
  - `pnpm run typecheck` → 緑
  - `pnpm run test:run` → 28 files / 623 passed
- Findings: なし
