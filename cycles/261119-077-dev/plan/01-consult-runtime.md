# PLAN `consult-runtime`

- ADR-No: 01, 02, 03
- Place: worktree
- Boundary Plans: なし

## Goal

`subagent-consult` が実行環境（`process.env`、`process.cwd()`、時刻）を入口で 1 回読み、値を引数で受け取る。

## Refactor

- Inside:
  - Modules: なし。変更は既存の関数のシグネチャと組み立ての範囲に留める。
  - Dirs: なし。
- Outside:
  - Extract: なし。
  - Colocate: なし。

## Files

```text
lib/
  git-env.mjs                update
.pi/
  extensions/
    consult/
      index.ts               update
      index.test.ts          update
      README.md
      run/
        run.ts               update
        run.test.ts          update
        log.ts               update
        log.test.ts          update
        worktree.ts          update
        worktree.test.ts     update
        delivery.ts          update
        delivery.test.ts     update
        subagent.ts          update
        subagent.test.ts     update
        git-contract.test.ts update
        place.ts
        place.test.ts
        worktree.fixture.ts
      tool/
        consult.ts           update
        consult.test.ts      update
        subagents.ts         update
        subagents.test.ts    update
        worktree.ts          update
        worktree.test.ts     update
        commit.ts
  skills/
    adr/
      scripts/
        index.mjs            update
test/
  fake-git.fixture.ts
```

## Slices

## 1. `git()` が環境を値で受け取る

`git()` が `process.env` を自分で読むのをやめ、渡された環境から `GIT_*` を落として使う。

### Types

```ts
// lib/git-env.mjs
export function gitEnv(env: Readonly<NodeJS.ProcessEnv>): NodeJS.ProcessEnv;

export function git(
  cwd: string,
  args: readonly string[],
  env: Readonly<NodeJS.ProcessEnv>,
): GitOutput;

// run/run.ts
export interface GitOutput {
  readonly status: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly error?: string;
}
```

### Steps

1. `lib/git-env.mjs`
   1. update: `gitEnv(env = process.env)` の既定値をなくし、`gitEnv(env: Readonly<NodeJS.ProcessEnv>)` を必須引数にする。戻り値は `GIT_*` を落とした `NodeJS.ProcessEnv`。
   2. update: `git(cwd, args)` を `git(cwd, args, env: Readonly<NodeJS.ProcessEnv>)` にし、`spawnSync` に `env: gitEnv(env)` を渡す。
2. `.pi/skills/adr/scripts/index.mjs`
   1. update: `git(root, ['branch', '--show-current'])` を `git(root, ['branch', '--show-current'], process.env)` にする。
3. `.pi/extensions/consult/index.ts`
   1. update: 入口で `const env = process.env;` を 1 回読み、`deps` の `git` を `(cwd, args) => git(cwd, args, env)` のラッパーにする。
   2. update: `launch.env` の `gitEnv(process.env)` を `gitEnv(env)` に変え、入口で `process.env` を 2 回読まないようにする。
4. `.pi/extensions/consult/run/git-contract.test.ts`
   1. update: `initRepo` と各ケースの `git(dir, ...)`、`git(wt, ...)` に `process.env` を渡す。
   2. update: `error: 使えない GIT_INDEX_FILE（ディレクトリ）を設定した状態 → git() はそれでも一時リポジトリを見る` を、`git(dir, ['status', '--porcelain'], { ...process.env, GIT_INDEX_FILE: tempDir('git-contract-index-') })` のように不正な env を値で渡す形にする。
   3. add: `happy: GIT_INDEX_FILE を含む env を渡す → git() はその env から GIT_* を落として一時リポジトリを見る` を追加する。
   4. drop: `vi.stubEnv` と `afterEach` の `vi.unstubAllEnvs()` を削除し、`vi` を使わなくなったら `vi` の import も削除する。
   5. add: `gitEnv()` の引数なし呼び出しが型エラーになることを `// @ts-expect-error` で確かめる。

### Policy

- Allowed:
  - 入口で `process.env` を 1 回だけ読み、`git()` に渡す。
- Forbidden:
  - `git()` の内部で `process.env` を読むこと - 入口より下では実行環境を読まないという規則に反する。
  - `GIT_*` を落とす処理をやめること - フックの中で別のリポジトリを見る不具合が戻る。

### Verify

- Always:
  - `pnpm test:related lib/git-env.mjs .pi/skills/adr/scripts/index.mjs .pi/extensions/consult/index.ts .pi/extensions/consult/run/git-contract.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、明示したファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added:
  - `gitEnv()` の引数なし呼び出しが `@ts-expect-error` で型エラーになる。既定値が戻ると `@ts-expect-error` が外れて `pnpm typecheck` が赤になる。

## 2. 入口が値を組み立てる

入口が `process.env` と `process.cwd()` を 1 回読み、`buildDeps`・`buildLaunch` に渡す。`createRuntime` は既定のランナーを組み立てない。

### Types

```ts
// run/run.ts
export interface GitOutput {
  readonly status: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly error?: string;
}

export type Git = (cwd: string, args: readonly string[]) => GitOutput;

export type Spawn = (
  command: string,
  args: readonly string[],
  options: PiSpawnOptions,
) => SpawnedChild;

export type SpawnSync = (
  command: string,
  args: readonly string[],
  options: { readonly cwd: string; readonly encoding: 'utf8' },
) => {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
  readonly error?: Error;
};

export interface LaunchPorts {
  readonly spawn: Spawn;
  readonly spawnSync: SpawnSync;
  readonly env: NodeJS.ProcessEnv;
  readonly now: () => number;
}

// run/worktree.ts
export interface WorktreeDeps {
  readonly git: Git;
  readonly root: string;
}

// tool/consult.ts
export interface RuntimeInput {
  readonly pi: PiFace;
  readonly place: Place;
  readonly deps: WorktreeDeps;
  readonly launch: LaunchPorts;
  readonly run: ConsultRunner;
  readonly sessionNow?: () => string;
  readonly check?: CheckRecord;
  readonly psRun?: PsRun;
}

// index.ts
export function buildDeps(
  env: Readonly<NodeJS.ProcessEnv>,
  git: (cwd: string, args: readonly string[], env: Readonly<NodeJS.ProcessEnv>) => GitOutput,
): WorktreeDeps;

export function buildLaunch(
  env: Readonly<NodeJS.ProcessEnv>,
  spawn: Spawn,
  spawnSync: SpawnSync,
  now: () => number,
): LaunchPorts;
```

`RuntimeInput.now` は Slice 3 で追加する。Slice 2 の時点では `RuntimeInput` は `now` を持たない。

### Steps

1. `.pi/extensions/consult/index.ts`
   1. add: `buildDeps(env, git)` を追加する。`git` は `lib/git-env.mjs` の 3 引数の `git` で、その `typeof` を型にする。Slice 1 の完了を前提にする。

      ```ts
      export function buildDeps(
        env: Readonly<NodeJS.ProcessEnv>,
        git: (cwd: string, args: readonly string[], env: Readonly<NodeJS.ProcessEnv>) => GitOutput,
      ): WorktreeDeps {
        return {
          git: (cwd, args) => git(cwd, args, env),
          root: env.CONSULT_ROOT ?? CONSULT_ROOT,
        };
      }
      ```

   2. add: `buildLaunch(env, spawn, spawnSync, now)` を追加する。

      ```ts
      export function buildLaunch(
        env: Readonly<NodeJS.ProcessEnv>,
        spawn: Spawn,
        spawnSync: SpawnSync,
        now: () => number,
      ): LaunchPorts {
        return { spawn, spawnSync, env: gitEnv(env), now };
      }
      ```

   3. update: 入口を次の形にする。`session` は `index.ts` の既存のモジュール変数で、`spawn`・`spawnSync`・`git` は import した値をそのまま渡す。

      ```ts
      export default function (pi: ExtensionAPI) {
        const env = process.env;
        const deps = buildDeps(env, git);
        const launch = buildLaunch(env, spawn, spawnSync, Date.now);
        const place = placeOf(process.cwd(), deps);
        const run = createConsult(deps, launch);
        const consult = createRuntime({ pi, place, deps, launch, run, sessionNow: () => session });
      }
      ```

2. `.pi/extensions/consult/run/run.ts`
   1. update: `LaunchPorts` に `now: () => number` を追加する。
3. `.pi/extensions/consult/tool/consult.ts`
   1. update: `RuntimeInput.run` を必須にする。
   2. update: `createRuntime` 内の `run ?? createConsult(deps, launch)` を `run` に変える。
   3. update: `pnpm typecheck` で落ちた `createRuntime` の呼び出し元に `run` を渡す。対象は `.pi/extensions/consult/index.ts` の入口と `.pi/extensions/consult/tool/consult.test.ts` の `createRuntime` 呼び出し。
4. `.pi/extensions/consult/index.test.ts`
   1. update: `vi.mock('./run/worktree.ts')` をやめ、`buildDeps`・`buildLaunch` を直接テストする。
   2. add: `buildDeps` のテストケースを追加する。
      - `buildDeps: (happy) env に CONSULT_ROOT がある → root にその値が入る`
      - `buildDeps: (empty) env に CONSULT_ROOT がない → root に既定値が入る`
      - `buildDeps: (happy) ラッパーに cwd と args を渡す → 元の git に env とともに渡る`
   3. add: `buildLaunch` のテストケースを追加する。
      - `buildLaunch: (happy) env に GIT_INDEX_FILE がある → launch.env から落ちる`
      - `buildLaunch: (happy) spawn を渡す → launch.spawn が同じ`
      - `buildLaunch: (happy) spawnSync を渡す → launch.spawnSync が同じ`
      - `buildLaunch: (happy) now を渡す → launch.now が同じ`
   4. update: `vi.mock('./tool/consult.ts')` は入口の配線テストのために残す。
   5. update: `createRuntime` の呼び出しに `run` を渡す。
5. `.pi/extensions/consult/tool/consult.test.ts`
   1. update: `setup` の `createRuntime` 呼び出しを、`createConsult(deps, launch)` を `run` として渡す形に変える。
   2. update: `fakeLaunch(): LaunchPorts` に `now: () => 0` を追加する。
   3. update: `toolCtx` の `cwd: process.cwd()` を `cwd: tempDir()` に変える。
6. `.pi/extensions/consult/run/subagent.test.ts`
   1. update: `launch` に `now: () => 0` を追加する。

### Policy

- Allowed:
  - 入口で `process.env` と `process.cwd()` を 1 回だけ読む。
- Forbidden:
  - 入口より下の関数で `process.env` や `process.cwd()` を読むこと - 実行環境を読むのは入口だけという規則に反する。
  - `createRuntime` の中で既定のランナーを組み立てること - 既定のランナーを組み立てるのは `index.ts` だけと決めている。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/consult/index.ts .pi/extensions/consult/index.test.ts .pi/extensions/consult/tool/consult.ts .pi/extensions/consult/tool/consult.test.ts .pi/extensions/consult/run/run.ts .pi/extensions/consult/run/subagent.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、明示したファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added: なし。

## 3. 時刻を値で受け取る

時刻を読む関数が `now` または `at` を必須の引数で受け取り、タイマー発火時に読む関数は `() => number` を受け取る。日付時計（`() => Date`）は日付ファイルの選択に、数値時計（`() => number`）は経過時間の計算に使う。

### Types

```ts
// 時刻を点として扱う関数は Date
stamp(now: Date)
appendRun(place, record, at: Date)
readRuns(place, scope: ReadScope)
runningRuns(place, scope: ReadScope & { session: string }, check?)
appendDelivered(place, record, at: Date)
pendingReports(place, scope: ReadScope & { session: string })
sweep(place, cwd, deps, now: Date)
completionRecord(job, report, now: Date)
beginRun(state, ctx, request, deps, now: Date)
ensureRoot(cwd, deps, now: Date)
closeQuietly(place, current, now: Date)
closeOrphans({ place, session, check, now: Date })
createWorktree({ cwd, deps, id, base, now: Date })
controlSubagent(action, subagents, place, session, now: Date, check?)
nextSubagentId(state, session, now: Date)
highestInRecord(place, session, now: Date)
runningIn(place, id, now: Date)

// 日付時計（日付ファイルの選択に使う）
createWorktreeTool({ place, deps, now: () => Date, check })

// 経過時間を計算する関数は number
applyEvent(state, event, now: number)
watchdogDue(endedAt, lastOutputAt, now: number, quietMs)

// 数値時計（経過時間の計算に使う）
LaunchPorts.now: () => number
RuntimeInput.now: () => number
RuntimeState.now: () => number
SubagentsHost.now: () => number
armWatchdog(live, now: () => number)
runPi(options, spawn, now: () => number)
consumeStdout(live, { text, now: () => number })

// 型の定義
interface ReadScope {
  readonly days?: number;
  readonly at: Date;
  readonly session?: string;
}

interface TickPort {
  readonly pi: PiFace;
  readonly place: Place;
  readonly sessionNow: () => string;
  readonly ui: WidgetUI;
  readonly check?: CheckRecord;
  readonly now: () => Date;
}

interface RuntimeState {
  // ...
  readonly now: () => number;
}
```

### Steps

1. `.pi/extensions/consult/index.ts`
   1. update: `sweep(place, cwd, deps)` を `sweep(place, cwd, deps, now: Date)` にし、`oldFiles(place, now, KEEP_DAYS)` を呼ぶ。
   2. update: `closeQuietly(place, current)` を `closeQuietly(place, current, now: Date)` にし、`closeOrphans({ place, session: current, now })` を呼ぶ。
   3. update: `flushPending(port)` を `flushPending(port, now: Date)` にし、`pendingReports(port.place, { session: current, days: KEEP_DAYS, at: now })` と `appendDelivered(port.place, record, now)` を呼ぶ。
   4. update: `showRunningOnce(ui, place, sessionId, check?)` を `showRunningOnce(ui, place, sessionId, now: Date, check?)` にし、`runningRuns(place, { session: sessionId, at: now }, check)` を呼ぶ。
   5. update: `startTick(port)` の tick 処理で `const now = port.now();` を 1 回読み、`flushPending(port, now)`、`runningRuns(port.place, { session: current, at: now }, port.check)`、`pendingReports(port.place, { session: current, days: KEEP_DAYS, at: now })` を呼ぶ。
   6. update: `announceRunningSubagents(place, announced, ctx, check?)` を `announceRunningSubagents(place, announced, ctx, now: Date, check?)` にし、`runningRuns(place, { session: announced, at: now }, check)` を呼ぶ。
   7. update: `session_start` ハンドラーで `const now = new Date();` を 1 回読み、`closeQuietly(place, session, now)`、`announceRunningSubagents(place, session, ctx, now)`、`showRunningOnce(ctx.ui, place, session, now)`、`sweep(place, ctx.cwd, deps, now)`、`flushPending({ pi, place, sessionNow: () => session, ui: ctx.ui }, now)`、`pruneCursors(place, now, KEEP_DAYS)` に渡す。
   8. update: `createRuntime` に `now: Date.now` を渡す。
   9. update: `TickPort` に `readonly now: () => Date` を追加し、`startTick` と `portFor` が `now: () => new Date()` を返すようにする。
   10. update: `createWorktreeTool({ place, deps, now: () => new Date(), check })` を呼ぶ。
   11. update: `createSubagentsTool({ place, sessionNow: () => session, now: Date.now, control: ... })` の `host` に `now: Date.now` を追加する。
2. `.pi/extensions/consult/tool/consult.ts`
   1. update: `completionRecord(job, report)` を `completionRecord(job, report, now: Date)` にし、`ended: now.getTime()` にする。`runInBackground` で `const now = new Date(state.now());` を 1 回読み、`completionRecord(job, outcome.report, now)` と `appendRun(state.place, { ... }, now)` に渡す。`runInBackground` 内の `Date.now()` を削除する。
   2. update: `beginRun(state, ctx, request, deps)` を `beginRun(state, ctx, request, deps, now: Date)` にし、`startedAt: now.getTime()` にする。`onStarted` の `appendRun(state.place, { ... }, now)` にも `now` を渡す。
   3. update: `createRuntime` の `run` ハンドラーで `const now = new Date(state.now());` を 1 回読み、`beginRun(..., now)` に渡す。`run` ハンドラー内の `Date.now()` を削除する。
   4. update: `status` コマンドで `const now = new Date(state.now());` を読み、`readRuns(state.place, { session: state.sessionNow(), at: now })` を呼ぶ。`status` コマンド内の `Date.now()` を削除する。
   5. update: `RuntimeState` に `readonly now: () => number` を追加し、`createRuntime` で `now` を `state` に載せる。
   6. update: `controlSubagent(action, subagents, place, session, check?)` を `controlSubagent(action, subagents, place, session, now: Date, check?)` にし、`readRuns(place, { session, at: now })` と `readRuns(place, { at: now })` を呼ぶ。`createRuntime` の `control` から `new Date(state.now())` を渡す。
   7. update: `highestInRecord(place, session)` を `highestInRecord(place, session, now: Date)` にし、`readRuns(place, { session, days: KEEP_DAYS, at: now })` を呼ぶ。
   8. update: `nextSubagentId(state, session)` を `nextSubagentId(state, session, now: Date)` にし、`highestInRecord(place, session, now)` を呼ぶ。`beginRun` から `now` を渡す。
3. `.pi/extensions/consult/tool/subagents.ts`
   1. update: `SubagentsHost` に `readonly now: () => number` を追加する。
   2. update: `execute` で `const now = new Date(host.now());` を 1 回読み、`readRuns(host.place, { session, at: now })` を呼ぶ。`Date.now()` を削除する。
4. `.pi/extensions/consult/run/run.ts`
   1. update: `armWatchdog(live)` を `armWatchdog(live, now: () => number)` にし、タイマー発火時に `now()` を読む。再帰の `armWatchdog(live, now)` にも同じ `now` を渡す。
   2. update: `runPi(options, spawn)` を `runPi(options, spawn, now: () => number)` にし、`initialRunState(options.limits, now())` と stdout 受信時の `now()` を読む。
   3. update: `consumeStdout(live, input: { text: string; now: () => number })` にし、`const at = input.now();` を 1 回読み、`lastOutputAt`・`consumeLine`・`applyEvent` には `at`、`armWatchdog(live, input.now)` には関数を渡す。
5. `.pi/extensions/consult/run/log.ts`
   1. update: `ReadScope.at` を必須にし、`readRuns(place, scope: ReadScope)` の `scope = {}` をやめて `scope` を必須にする。
   2. update: `appendRun(place, record, at: Date)` の `at` を必須にする。
   3. update: `runningRuns(place, scope: ReadScope & { session: string }, check?)` は `scope.at` を必須にし、`readRuns(place, scope)` に渡す。
   4. update: `closeOrphans({ place, session, check, now: Date })` にし、`readRuns(place, { session, at: now })` と `appendRun(place, done, now)` に渡す。
6. `.pi/extensions/consult/run/worktree.ts`
   1. update: `stamp(now: Date)` の既定値をなくす。
   2. update: `ensureRoot(cwd, deps, now: Date)` にし、`stamp(now)` を呼ぶ。
   3. update: `createWorktree({ cwd, deps, id, base, now: Date })` にし、`ensureRoot(cwd, deps, now)` を呼ぶ。`base` は任意。
7. `.pi/extensions/consult/run/delivery.ts`
   1. update: `appendDelivered(place, record, at: Date)` の `at` を必須にする。
   2. update: `pendingReports` の `scope` の `at` を必須にする。
8. `.pi/extensions/consult/run/subagent.ts`
   1. update: `runOneSubagent` が `runPi(options, launch.spawn, launch.now)` を呼ぶ。
9. `.pi/extensions/consult/tool/worktree.ts`
   1. update: `createWorktreeTool({ place, deps, now: () => Date, check })` にし、`execute` で `createWorktree({ cwd, deps, id: action.id, base: action.base, now: now() })` を呼ぶ。
   2. update: `runningIn(place, id, now: Date)` に `now` を追加し、`readRuns(place, { at: now })` を呼ぶ。`createWorktreeTool` の `execute` から `now()` を渡す。
10. テスト:
    - `.pi/extensions/consult/index.test.ts`
      1. update: `appendRun` の全呼び出しに `at` を渡す。
      2. update: `readRuns` と `pendingReports` の全呼び出しに `at` を渡す。
      3. update: `createRuntime` の全呼び出しに `now` を渡す。
      4. update: `portFor` に `now: () => new Date()` を追加する。
    - `.pi/extensions/consult/tool/consult.test.ts`
      1. update: `appendRun` の全呼び出しに `at` を渡す。
      2. update: `readRuns` の全呼び出しに `at` を渡す。
      3. update: `createConsult` と `createRuntime` の全呼び出しに `now` を渡す。
    - `.pi/extensions/consult/run/worktree.test.ts`
      1. update: `vi.useFakeTimers`・`vi.setSystemTime` をやめ、`createWorktree` と `ensureRoot` に固定の `Date` を渡す。
      2. update: `createWorktree` の全呼び出しを `createWorktree({ cwd: dir, deps, id, base, now })` のオブジェクト呼びに変える。
    - `.pi/extensions/consult/run/log.test.ts`
      1. update: `appendRun` の全呼び出しに `at` を渡す。
      2. update: `readRuns` と `runningRuns` の全呼び出しに `at` を渡す。
      3. update: `closeOrphans` の全呼び出しを `closeOrphans({ place, session, check, now })` に変える。
      4. update: `appendRun(place, record)`、`readRuns(place)`、`closeOrphans({ place, session })` が `@ts-expect-error` で型エラーになることを確かめる。
    - `.pi/extensions/consult/run/delivery.test.ts`
      1. update: `appendRun` の全呼び出しに `at` を渡す。
      2. update: `pendingReports` と `appendDelivered` の全呼び出しに `at` を渡す。
    - `.pi/extensions/consult/run/run.test.ts`
      1. update: `runPi` の全呼び出しに `now: () => number` を渡す。
      2. update: `consumeStdout` の `input.now` を `() => number` に変える。
    - `.pi/extensions/consult/run/subagent.test.ts`
      1. update: `launch` に `now: () => number` を追加する。
    - `.pi/extensions/consult/tool/subagents.test.ts`
      1. update: `host` に `now: () => number` を追加する。
      2. update: `appendRun` の全呼び出しに `at` を渡す。
    - `.pi/extensions/consult/tool/worktree.test.ts`
      1. update: `createWorktreeTool` の呼び出しを `createWorktreeTool({ place, deps, now: () => 固定 Date, check })` に変える。
      2. update: `appendRun` の全呼び出しに `at` を渡す。

### Policy

- Allowed:
  - 呼び出し元が時刻を 1 回読み、関数に渡す。
- Forbidden:
  - 関数の内部で `Date.now()` や `new Date()` を読むこと - 実行環境を読むのは入口だけという規則に反する。
  - 既定値 `at = new Date()` を置くこと - 渡し忘れても気づけない。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/consult/index.ts .pi/extensions/consult/index.test.ts .pi/extensions/consult/tool/consult.ts .pi/extensions/consult/tool/consult.test.ts .pi/extensions/consult/tool/subagents.ts .pi/extensions/consult/tool/subagents.test.ts .pi/extensions/consult/run/run.ts .pi/extensions/consult/run/run.test.ts .pi/extensions/consult/run/log.ts .pi/extensions/consult/run/log.test.ts .pi/extensions/consult/run/worktree.ts .pi/extensions/consult/run/worktree.test.ts .pi/extensions/consult/run/delivery.ts .pi/extensions/consult/run/delivery.test.ts .pi/extensions/consult/run/subagent.ts .pi/extensions/consult/run/subagent.test.ts .pi/extensions/consult/tool/worktree.ts .pi/extensions/consult/tool/worktree.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、明示したファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added:
  - `appendRun(place, record)`、`readRuns(place)`、`appendDelivered(place, record)`、`stamp()`、`ensureRoot(cwd, deps)` が `@ts-expect-error` で型エラーになる。既定値が戻ると `@ts-expect-error` が外れて `pnpm typecheck` が赤になる。

## Notes

### Slice 1: `git()` が環境を値で受け取る

- Findings: なし
- Unplanned: なし
- Commit: 6c77d553
- Stopped:

### Slice 2: 入口が値を組み立てる

- Findings: なし
- Unplanned:
  - `index.ts` の `buildDeps`・`buildLaunch` の引数名（`git`・`spawn`・`spawnSync`）は plan の形どおりにし、shadow の警告を `eslint-disable-next-line no-shadow` で抑えた（入口の値をそのまま渡すため）。`index.test.ts` の `now` は外側に移し、動的 import を静的 import に変えて shadow を消した。
- Commit: 9acd5e17
- Stopped:

### Slice 3: 時刻を値で受け取る

- Findings: なし
- Unplanned:
  - `registerRunTool` の実行時は `showRunningOnce(ctx.ui, place, session, new Date())` と読む。plan の 1.4 が変えた署名の呼び出し側で、plan が挙げていない。道具の実行時（入口の一種）に時刻を 1 回読んで渡す形にした。
  - `session_start` の port に `now: () => now` を載せた。plan の 1.7 の port リテラルには `now` がないが、1.9 の `TickPort.now` 必須と合わせ、`const now = new Date()` の 1 回読みを使い回すための読み一貫である。
  - `max-lines: 480` を保つため振る舞いを変えずに圧縮した。`createRuntime` に `controlAt` を抽出して `control` と `cancel` で共用し、`runInBackground` に `appendOutcome` を抽出し、`nextSubagentId` の床の計算を集約した。`max-params` の抑えは 3 か所（`beginRun`・`showRunningOnce`・`announceRunningSubagents` の 5 引数は plan の形どおり）。
  - Added の回帰検出を補った。`appendDelivered(place, record)` と `ensureRoot(cwd, deps)` の `@ts-expect-error` を `delivery.test.ts`・`run/worktree.test.ts` に足した（`stamp()` は非公開関数のため、既定値なしの署名を読み直しで確かめた）。
- Commit: 05550574
- Stopped:

### Cleanup: 重複する GIT_* 検査と module 外の一時文脈

- Findings:
  - `run/git-contract.test.ts` の `happy: GIT_INDEX_FILE を含む env を渡す → git() はその env から GIT_* を落として一時リポジトリを見る` は、直上の `error:` ケースと Given（`GIT_INDEX_FILE` に使えないディレクトリを渡す）も結果（`status` 0）も同一のため落とした。残した `error:` が回帰（使えない `GIT_INDEX_FILE` でも一時リポジトリを見る）を担う。
- Unplanned:
  - `tool/consult.test.ts` の module 外の `toolCtx`（`tempDir()` を外で呼ぶと最初のテストの後始末で消える）を、テストごとに作る `testCtx()` に変えた。`startSubagent` が使う。振る舞いは同じ。

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
