# PLAN `consult-liveness`

## Files

```text
.pi/extensions/consult/
  index.ts                    update
  README.md                   update
  run/
    log.ts                    update
    log.test.ts               update
    proc.ts                   add
    proc.test.ts              add
    subagent.ts               update
    subagent.test.ts          update
    run.ts
    place.ts
    place.test.ts
    delivery.ts
    delivery.test.ts
  sub/
    spec.ts                   update
    spec.test.ts              update
  tool/
    consult.ts                update
    consult.test.ts           update
    subagents.ts              update
    subagents.test.ts         update
    worktree.ts               update
    worktree.test.ts          update
    sound.ts
    sound.test.ts
```

## 1.記録の token と子の argv

### Types

```ts
// run/log.ts — 既存の欄に足す
interface RunRecord {
  readonly token?: string;
}

// sub/spec.ts — 既存の欄に足す
interface ConsultOptions {
  readonly token: string;
}
function buildPiArgs(options: ConsultOptions): string[];

// run/subagent.ts — 既存の欄に足す
interface SubagentJob {
  readonly token: string;
}
```

### Steps

1. `.pi/extensions/consult/run/log.ts`:
   - `RunRecord` に `token?: string` を足し、`parseRun` は文字列の時だけ拾う。token の無い行は今までどおり読める。
2. `.pi/extensions/consult/sub/spec.ts`:
   - `ConsultOptions` に `token` を足し、`buildPiArgs` は `-p` の後に `--name` と token を並べる。
     - Outside: design の `External` の `pi`。`--name` は `session_info` を足すだけで、`--session` と併用できる。
3. `.pi/extensions/consult/run/subagent.ts`:
   - `SubagentJob` に token を足し、`runOneSubagent` から `buildPiArgs` に渡す。
4. `.pi/extensions/consult/tool/consult.ts`:
   - `beginRun` で `randomUUID()` の token を作り、job に持たせる。
   - `onStarted` の開始行の `appendRun` に token を入れる。`closeRecord` の終了行は token を持たない。
5. `.pi/extensions/consult/run/log.test.ts`:
   - token 付きの行の往復、token 無しの行、token が文字列でない行を足す。
6. `.pi/extensions/consult/sub/spec.test.ts`:
   - `--session` と `--no-session` の両方で `--name <token>` が出るケースを足す。
7. `.pi/extensions/consult/run/subagent.test.ts`:
   - job の token が `buildPiArgs` に届くケースを足す。
8. `.pi/extensions/consult/tool/consult.test.ts`:
   - `beginRun` の開始行に UUID の token が入るケースを足す。

### Verify:

- test: `.pi/extensions/consult/run/log.test.ts`、`.pi/extensions/consult/sub/spec.test.ts`、`.pi/extensions/consult/run/subagent.test.ts`、`.pi/extensions/consult/tool/consult.test.ts`、`pnpm vitest run --config vitest.starter.config.ts .pi/extensions/consult/run/log.test.ts .pi/extensions/consult/sub/spec.test.ts .pi/extensions/consult/run/subagent.test.ts .pi/extensions/consult/tool/consult.test.ts`
  - (happy) `buildPiArgs` に token と `--session <path>` → argv に `--name <token>` と `--session` が両方ある
  - (happy) `--no-session` の子 → argv に `--name <token>` がある
  - (happy) token 付きの開始行 → `parseRun` が token を返す
  - (happy) `beginRun` の開始行 → token が UUID で入る
  - (empty) token 無しの行（古い形）→ token は `undefined` で読める
  - (error) token が数値の行 → token を捨て、行は読める
  - (happy) `runOneSubagent` に job の token を渡す → `buildPiArgs` の argv に `--name <その token>`（取り違え・空文字なら赤）
  - (happy) `closeRecord` の終了行 → `token` を持たない（`undefined`）
  - _no case_: `--name` が pi のセッションに `session_info` を足すこと — 外部（design の `External` の `pi`）。`spec.test.ts` は argv まで

## 2.生存の check

### Types

```ts
// run/proc.ts
export type Liveness = 'running' | 'ended' | 'unknown';
export type PsRun = (args: readonly string[]) => {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
};
export function checkPid(pid: number, token: string, run?: PsRun): Liveness;

// run/log.ts
export type CheckRecord = (record: RunRecord) => Liveness;
export function isRunning(record: RunRecord, check?: CheckRecord): boolean;
export function runningRuns(
  place: Place,
  scope: ReadScope & { readonly session: string },
  check?: CheckRecord,
): RunRecord[];
```

### Steps

1. `.pi/extensions/consult/run/proc.ts`:
   - `ps -ww -p <pid> -o command=` を `spawnSync` で呼ぶ `PsRun` を既定にし、`checkPid` を置く。
   - status 0 で stdout に token があれば `running`、status 0 で無ければ `ended`。
   - status 1・stdout 空・stderr 空なら `ended`。stderr あり、または status が上記以外なら `unknown`。
2. `.pi/extensions/consult/run/proc.test.ts`:
   - `run` を差し替え、下の Verify のケースを試す。
3. `.pi/extensions/consult/run/log.ts`:
   - `isRunning` の `alive` を `CheckRecord` に替え、既定は「token があれば `checkPid`、無ければ `pidAlive`」にする。`ended` があれば false、`running` だけ true。
   - `runningRuns` の濾し方を同じ既定にする。
4. `.pi/extensions/consult/run/log.test.ts`:
   - token と check のケースを足す。

### Verify:

- test: `.pi/extensions/consult/run/proc.test.ts`、`.pi/extensions/consult/run/log.test.ts`、`pnpm vitest run --config vitest.starter.config.ts .pi/extensions/consult/run/proc.test.ts .pi/extensions/consult/run/log.test.ts`
  - (happy) 生きている pid で token が argv にある → `running`
  - (happy) 生きている pid で token が argv に無い → `ended`
  - (happy) status 1・出力なし・stderr なし → `ended`
  - (error) stderr あり → `unknown`
  - (error) status 2 → `unknown`
  - (error) status null → `unknown`
  - (error) status 0 で stderr あり → `unknown`
  - (error) status 1 で stderr あり → `unknown`
  - (happy) status 0 で token が出力の後ろにある → `running`
  - (happy) `checkPid` の `run` に渡る引数 → `-ww` を含む
  - (empty) token 無しの古い行で pid が死んでいる → `isRunning` は false
  - (happy) `ended` のある行 → `isRunning` は false
  - (empty) token 無しの古い行で pid が生きている → `isRunning` は true（移行）
  - (happy) token 付きの行で check が `running` → `isRunning` は true
  - (happy) token 付きの行で check が `ended` → false
  - (error) token 付きの行で check が `unknown` → false
  - (empty) token 無しの行で `pidAlive` が true → true（移行）
  - (empty) token 無しの行で `pidAlive` が false → false
  - _no case_: 本物の `ps` の出力の形 — 外部。acceptance の `look` で確かめる

## 3.subagent 単位の読み

### Types

```ts
// run/log.ts
export function runningRuns(
  place: Place,
  scope: ReadScope & { readonly session: string },
  check?: CheckRecord,
): RunRecord[];

// tool/subagents.ts
export function latest(records: readonly RunRecord[]): Map<string, RunRecord>;
```

### Steps

1. `.pi/extensions/consult/run/log.ts`:
   - `runningRuns` を subagent ごとにまとめ、同じ subagent に `ended` の行が 1 つでもあれば飛ばす。無ければ開始行を `check` に渡す。
2. `.pi/extensions/consult/tool/subagents.ts`:
   - `latest` を「`ended` の行があればそれを、無ければ開始行」にし、行の並びに依らなくする。
   - `listText` / `rowsOf` に `check` を通す口を足す。
3. `.pi/extensions/consult/tool/worktree.ts`:
   - `runningIn` を `readRuns(place)` から subagent ごとにまとめ、`ended` があれば除き、無ければ `check` に渡す。
   - `createWorktreeTool` に `check` を通す口を足す。
4. `.pi/extensions/consult/tool/consult.ts`:
   - 音の述語と `controlSubagent` の `isRunning` を `check` に通す。停止は `running` の時だけ kill する。
   - `createRuntime` に `check` を通す口を足す。
5. `.pi/extensions/consult/index.ts`:
   - 告知の `runningRuns` はそのまま（subagent の数になる）。
6. テスト: `.pi/extensions/consult/run/log.test.ts`、`.pi/extensions/consult/tool/subagents.test.ts`、`.pi/extensions/consult/tool/worktree.test.ts`、`.pi/extensions/consult/tool/consult.test.ts`:
   - 開始行と終了行の両方（pid が生きている）のケースを足す。日をまたぐ並びも足す。`check` は差し替える。

### Verify:

- test: `.pi/extensions/consult/run/log.test.ts`、`.pi/extensions/consult/tool/subagents.test.ts`、`.pi/extensions/consult/tool/worktree.test.ts`、`.pi/extensions/consult/tool/consult.test.ts`、`pnpm vitest run --config vitest.starter.config.ts .pi/extensions/consult/run/log.test.ts .pi/extensions/consult/tool/subagents.test.ts .pi/extensions/consult/tool/worktree.test.ts .pi/extensions/consult/tool/consult.test.ts`
  - (happy) 同じ subagent に開始行と終了行があり、pid が生きている → 走っていない（事故の形）
  - (happy) 開始行だけで token が合う → 走っている
  - (happy) 開始行だけで token が合わない → 走っていない
  - (empty) 行が無い → 空
  - (boundary) 終了行が新しい日のファイル、開始行が古い日のファイル → 走っていない
  - (boundary) 終了行が開始行より先に来る（逆順）→ 一覧は done（`latest` が `ended` の行を採る）
  - (happy) start と end のある unit → busy でない
  - (happy) start と end のある subagent の音の述語 → false
  - (happy) start と end のある subagent の停止 → kill しない
  - (happy) 開始行だけ + token 不一致 の停止 → kill しない（check の配線）
  - (happy) 一覧の check を差し替え、`running` と `ended` を返す → 一覧の状態がそれに従う（`listText` / `rowsOf` の口）
  - (happy) 開始行だけ + token 不一致 の worktree → busy でない
  - (error) 開始行だけ + check が `unknown` の worktree → busy でない
  - (error) `check` が `unknown` → 走っていない
  - _no case_: 5 秒のタイマー — 判定ではなく `tool/sound.ts` の担当。`sound.test.ts` が見る

## 4.終了行の閉じ

### Types

```ts
// run/log.ts
export function closeOrphans(
  place: Place,
  session: string,
  check?: CheckRecord,
): readonly RunRecord[];
```

### Steps

1. `.pi/extensions/consult/run/log.ts`:
   - `closeOrphans` を置く。session の行を subagent ごとにまとめ、`ended` の無い subagent の開始行を `check` に渡す。
   - `check` が `ended` か `unknown` なら、開始行を写して `ended: Date.now()`、`state: 'error'`、`reason` を足した行を `appendRun` し、閉じた行を返す。`running` なら何もしない。
2. `.pi/extensions/consult/index.ts`:
   - `session_start` で、告知より先に `closeOrphans(place, session)` を呼ぶ。失敗は握って続ける。
3. `.pi/extensions/consult/run/log.test.ts`:
   - 下のケースを足す。

### Verify:

- test: `.pi/extensions/consult/run/log.test.ts`、`pnpm vitest run --config vitest.starter.config.ts .pi/extensions/consult/run/log.test.ts`
  - (happy) 終了行の無い開始行で token が合わない → `state: 'error'` の終了行が 1 行増え、`runningRuns` が空になる
  - (happy) 終了行の無い開始行で token が合う → 行は増えない
  - (happy) token 無しの古い行で pid が死んでいる → 終了行を書く
  - (empty) 行が無い → 何も書かない
  - (boundary) 終了行が既にある → 新しい行を書かない
  - (error) `appendRun` が投げる → 例外はそのまま（呼ぶ側の `index.ts` が握る）
  - (error) check が `unknown` → 終了行を書く
  - (empty) token 無し + `pidAlive` が true → 閉じない
  - (boundary) 閉じた行 → `ended` が数値、`reason` が空でない文字列
  - _no case_: `session_start` から呼ばれること — `index.ts` は拡張でテストが無い。acceptance の `look` で確かめる

## 5.説明を合わせる

### Types

なし

### Steps

1. `.pi/extensions/consult/README.md`:
   - 「走っている」の判定、音、一覧の状態の記述を読み、token と `ps` の判定、subagent 単位の読みに合うように直す。記述が無ければ足さない。

### Verify:

- read: `review` サブエージェントが `.pi/extensions/consult/README.md` を読み、次を報告する
  - (happy) 走っているかの記述 → token と `ps`、subagent 単位で読むと読める
  - (happy) 音と一覧の記述 → 終わった subagent で止まる、状態が見えると読める
  - (empty) 判定の記述が無い → その旨を報告する（足さない）
  - _no case_: 文面の読みやすさ — 読む者の判断

## 6.統合: consult の生存判定

### Types

なし

### Steps

1. `.pi/extensions/consult/run/proc.ts`:
   - `ps -ww -p <pid> -o command=` の引数を読み、`-ww` があることを確かめる。変えない。
2. `package.json`:
   - `test` / `test:run` / `test:related` の `--config vitest.starter.config.ts` を読む。変えない。

### Verify:

- cli: 作業ツリーで次のコマンドを打ち、出力と exit code を読む
  - (happy) `pnpm test:run` → exit 0、出力に `.pi/extensions/consult/` のテストファイルが出る
  - (happy) `pnpm typecheck` → root: ok、`.pi`: ok、exit 0
  - (happy) `pnpm lint` → exit 0
  - (happy) `pnpm format:check` → exit 0
  - _no case_: 本物の subagent を走らせて音が止まること — acceptance の `look` で確かめる
  - _no case_: `-ww` が tty の幅で切れるのを防ぐこと — ハーネスに tty が無く、`script` はソケットで失敗する。slice 2 の引数のケースが `-ww` を見る

## Notes

### Slice 1: 記録の token と子の argv

- Findings: なし
- Unplanned: なし
- Commit: 04db2af consult(consult-liveness): record token and pass --name to child

### Slice 2: 生存の check

- Findings: なし
- Unplanned: なし
- Commit: 051a520 consult(consult-liveness): check liveness via ps token

### Slice 3: subagent 単位の読み

- Findings: なし
- Unplanned: なし
- Commit: f481f3f consult(consult-liveness): read liveness per subagent

### Slice 4: 終了行の閉じ

- Findings: なし
- Unplanned: oxfmt の追いつき (slice 3 分) と lint 対応 (`toSorted`、`closeQuietly` 切り出し)
- Commit: 2d56199 consult(consult-liveness): close orphaned runs on session start

### Slice 5: 説明を合わせる

- Findings: なし
- Unplanned: なし
- Commit: consult(consult-liveness): describe liveness in README

### Slice 6: 統合: consult の生存判定

- Findings:
- Unplanned:
- Commit:

## Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Unproven:
- Doubts:

## Acceptance

- Ran:
- Findings:
- Doubts:
