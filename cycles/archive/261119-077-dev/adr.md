# ADR 077

## 01: git() の環境の受け取り

Type: _Simple_

### Context

- C1: `gitEnv(env = process.env)` は既定値では `process.env` を読み、`git(cwd, args)` は `gitEnv()` を引数なしで呼ぶ。出所: `lib/git-env.mjs:10,28`
- C2: `GIT_*` を落とす処理は、フックの中で別のリポジトリを見る不具合を防ぐ機能である。この振る舞いは変えない。出所: `lib/git-env.mjs:6`
- C3: 実装が実行環境を読むのは入口だけにし、入口より下の関数は値を引数で受け取る。
- C4: `git()` の直接呼び出し元は `.pi/skills/adr/scripts/index.mjs:110` だけで、consult は `deps.git` 経由で `git()` を呼ぶ。出所: `.pi/skills/adr/scripts/index.mjs:110`、`.pi/extensions/consult/index.ts:273`
- C5: `Git = (cwd, args) => GitOutput` 型と `WorktreeDeps.git` に `env` を置く場所がない。出所: `.pi/extensions/consult/run/run.ts:162`、`.pi/extensions/consult/run/worktree.ts:22-25`

### Research & Trial

- `git` は `{ status, stdout, stderr, error? }` を返し、`error` は子プロセス起動失敗時のみ付く。出所: `lib/git-env.mjs:29-34`
- F2: `gitEnv` の本番呼び出し元は `lib/git-env.mjs:28` の内部呼び出しと `.pi/extensions/consult/index.ts:277` の `gitEnv(process.env)` の 2 箇所だけである。出所: `.pi/extensions/consult/index.ts:277`
- F3: consult 内の実 `git` 実行はすべて `deps.git` 経由で行われ、`run/worktree.ts` に 10 箇所の呼び出しがある。出所: `.pi/extensions/consult/run/worktree.ts:91,140,159,202,230,244,280,307,316,375`
- F4: `run/git-contract.test.ts:86-91` の `GIT_INDEX_FILE` 隔離テストは、現在 `vi.stubEnv` 後の `process.env` の読みに依存している。出所: `.pi/extensions/consult/run/git-contract.test.ts:86-91`
- F5: テストで実 `git` を直接呼ぶのは `run/git-contract.test.ts` の `initRepo` と各ケースである。出所: `.pi/extensions/consult/run/git-contract.test.ts:12-19`

### Scope

_omission_

### Decision

- Status: **accepted**
- Main: `git()` が環境を値で受け取り、`gitEnv` が既定値を持たない
  - Add:
    - `git(cwd, args, env)` の `env` 引数（C1）
    - `gitEnv(env)` の純関数化（C1）
  - Update:
    - `git()` が `gitEnv()` を引数なしで呼ぶのをやめ、渡された `env` から `GIT_*` を落として使う（C1）
    - `git()` の直接呼び出し元（`.pi/skills/adr/scripts/index.mjs:110`）が環境を渡す（C4）
    - consult の `deps.git` を、`index.ts` の入口で `process.env` を 1 回読み、`(cwd, args) => git(cwd, args, env)` というラッパーにする（C5, F3）
    - `run/git-contract.test.ts` の `initRepo` と各ケースが `git(dir, args, process.env)` のように環境を渡し、隔離テストは `vi.stubEnv` ではなく、悪い `env` を値で渡す（F4, F5）
  - Drop:
    - `gitEnv` の既定値 `env = process.env`（C1, F2）
- Policy:
  - Allowed:
    - 入口で `process.env` を 1 回だけ読み、`git()` に渡す（C3）
  - Forbidden:
    - `git()` の内部で `process.env` を読むこと - 入口より下で実行環境を読まないという規則に反する（C3）
    - `GIT_*` を落とす処理をやめること - フックの中で別のリポジトリを見る不具合が戻る（C2）

#### Details

_omission_

### Definition

- `Unit.subagent-consult`(kept): 機能は変わらず、git への環境の渡し方だけが変わる。

## 02: 入口の組み立て

Type: _Full_

### Context

- C1: 入口は `process.env.CONSULT_ROOT`、`gitEnv(process.env)`、`process.cwd()` をそれぞれ 1 回読み、`createRuntime` を組み立てる。出所: `.pi/extensions/consult/index.ts:272-280`
- C2: `createConsult(deps, launch)` はすでに値を受け取る形になっており、`createRuntime` の既定ランナーとして内部で呼ばれる。出所: `.pi/extensions/consult/tool/consult.ts:277,527-528`
- C3: 入口は値を作らず、渡すだけにする。純粋な組み立てと副作用（`pi` への登録）を分ける。
- C4: `createConsult(deps, launch)` をテストから直接呼べる形にし、既定のランナーを組み立てるのは `index.ts` だけにする。
- C5: `index.test.ts` は `run/worktree.ts` と `tool/consult.ts` をモックして入口の配線をテストしている。出所: `.pi/extensions/consult/index.test.ts:33-59`
- C6: `tool/consult.test.ts` は `run/subagent.ts` をモックして `createConsult` 経由のランナーをテストしている。出所: `.pi/extensions/consult/tool/consult.test.ts:40-52`

### Research & Trial

- F1: 既定の入口は `export default function (pi: ExtensionAPI)` で、`.pi/extensions/consult/index.ts:272` にある。出所: `.pi/extensions/consult/index.ts:272`
- F2: 入口は `spawn` と `spawnSync` を `node:child_process` からそのまま `launch` に載せる。出所: `.pi/extensions/consult/index.ts:274-278`
- F3: `ConsultRunner` は `(ctx: ConsultContext, options: ConsultOptions, job: SubagentJob) => Promise<ConsultOutcome>` である。出所: `.pi/extensions/consult/tool/consult.ts:127-131`
- F4: `RuntimeInput` は `pi, place, deps, launch` を必須、`run, sessionNow, check, psRun` を任意に持つ。出所: `.pi/extensions/consult/tool/consult.ts:322-331`
- F5: `index.test.ts` は `run/worktree.ts` をモックし、`topLevel` を「`cwd` をそのまま返し `deps.root` を記録」に、`cleanWorktrees` を固定値返却に差し替える。出所: `.pi/extensions/consult/index.test.ts:33-46`
- F6: `index.test.ts` は `tool/consult.ts` をモックし、`createRuntime` を「`input.launch` を記録して本物に委譲」に差し替える。出所: `.pi/extensions/consult/index.test.ts:48-59`
- F7: `tool/consult.test.ts` は `run/subagent.ts` の `runOneSubagent` をモックし、固定成功値を返しつつ `hooks` と `launch` を捕捉する。出所: `.pi/extensions/consult/tool/consult.test.ts:40-52`
- F8: `tool/consult.test.ts` の `toolCtx` は `cwd: process.cwd()` を読む。出所: `.pi/extensions/consult/tool/consult.test.ts:56`

### Scope

- In:
  - failure: `buildDeps`・`buildLaunch` が受け取る値の検証と、失敗の伝わり方を確認する。
  - structure: `index.ts` の組み立てを `buildDeps`・`buildLaunch` に分ける。
  - logic: 入口が `process.env`・`process.cwd()` を読む代わりに、組み立ての関数が引数で受け取る。
  - downstream: `index.test.ts` と `tool/consult.test.ts` が組み立ての関数の契約に追従する。
  - values & expression: `buildDeps`・`buildLaunch` の名前が増える。
- Out:
  - safety: `process.env` を読む場所を入口に集めるが、秘密情報の扱いは変えない。
  - upstream: 外部の package や contract は変わらない。
  - result: 入口が組み立てる deps と launch の中身は同じで、外から見た結果は変わらない。
  - existing data: 保存データ、インストール済みのバージョン、配布済みの文書、過去の記録は変わらない。
  - cost: 実行時のコストは変わらない。
  - verification: テストのロジックと方法は変わるが、外部から使えるコマンドや分類は変わらない。質問はテストのロジックと方法を除く。
  - observability: 記録やシグナルは変わらない。
  - release: 配布や適用の仕方は変わらない。
  - other: なし。

### Decision

- Status: **accepted**
- Main: 入口が値を作らず、組み立ての関数に値を渡す
  - Add:
    - `buildDeps(env, git)`（C3, C4）
    - `buildLaunch(env, spawn, spawnSync, now)`（C3, F2）
    - `LaunchPorts.now: () => number`（C3）
  - Update:
    - `index.ts` の入口が `process.env` と `process.cwd()` を 1 回読み、`buildDeps`・`buildLaunch` に渡す。`buildLaunch` には `Date.now` も渡す（C1, C3, F1）
    - `createRuntime` の `run` を必須にし、`run ?? createConsult(deps, launch)` のフォールバックを削除する（C4）
    - `index.ts` が `createConsult(deps, launch)` を呼び、`run` として渡す（C2, C4, F3, F4）
    - `index.test.ts` の `run/worktree.ts` のモックをやめ、`buildDeps`・`buildLaunch` を直接テストする（C5, F5, F6）
    - `tool/consult.test.ts` を、`createConsult` を直接呼ぶ形に変える（C6, F7, F8）
  - Drop:
    - `createRuntime` の `run` の既定フォールバック（C4）
    - `index.test.ts` の `run/worktree.ts` のモック（C5）
- Policy:
  - Allowed:
    - 入口で `process.env` と `process.cwd()` を 1 回だけ読む（C3）
  - Forbidden:
    - 入口より下の関数で `process.env` や `process.cwd()` を読むこと - 実行環境を読むのは入口だけという規則に反する（C3）
    - `createRuntime` の中で既定のランナーを組み立てること - 既定のランナーを組み立てるのは `index.ts` だけと決めている（C4）

#### Details

- `buildDeps` と `buildLaunch`

  ```ts
  // .pi/extensions/consult/index.ts
  export function buildDeps(env: NodeJS.ProcessEnv, git: Git): WorktreeDeps {
    return {
      git: (cwd, args) => git(cwd, args, env),
      root: env.CONSULT_ROOT ?? CONSULT_ROOT,
    };
  }

  export function buildLaunch(
    env: NodeJS.ProcessEnv,
    spawn: Spawn,
    spawnSync: SpawnSync,
    now: () => number,
  ): LaunchPorts {
    return { spawn, spawnSync, env: gitEnv(env), now };
  }
  ```

- 入口
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

### Definition

- `Unit.subagent-consult`(kept): 機能は変わらず、入口が値を組み立てる経路だけが変わる。

## 03: 時刻の受け取り

Type: _Full_

### Context

- C1: `subagent-consult` には 14 箇所の時刻の読み取りがある。出所: `.pi/extensions/consult/index.ts:225,293`、`.pi/extensions/consult/tool/consult.ts:375,468,550`、`.pi/extensions/consult/tool/subagents.ts:211`、`.pi/extensions/consult/run/run.ts:425,484,514`、`.pi/extensions/consult/run/log.ts:61,168,259`、`.pi/extensions/consult/run/worktree.ts:77`、`.pi/extensions/consult/run/delivery.ts:132`
- C2: `stamp(now)`、`appendRun(..., at)`、`readRuns(..., scope.at)`、`appendDelivered(..., at)`、`windowFiles(place, at, days)`、`oldFiles(..., at)`、`dayName(at)`、`applyEvent(state, event, now)`、`watchdogDue(..., now, ...)`、`consumeStdout(live, { now })` はすでに値を受け取る。出所: 各ファイル。
- C3: 既定値 `at = new Date()` は渡し忘れても気づけないので、必須の引数にする。
- C4: 時刻を `now` または `at` で受け取る形に揃える。`thinking-scrub`・`context-precompact` も同じ形である。
- C5: `run/worktree.test.ts` は `vi.useFakeTimers` と `vi.setSystemTime(2030-01-01)` で既存の `root` の再利用をテストしている。出所: `.pi/extensions/consult/run/worktree.test.ts:31-46,63-78`
- C6: `index.test.ts` の tick の `vi.useFakeTimers` は `setInterval` の進行に必要なので残す。

### Research & Trial

- F1: `index.ts:225` の `new Date()` は `sweep` 内にあり、`now/at` 引数を持たない。出所: `.pi/extensions/consult/index.ts:223-236`
- F2: `index.ts:293` の `new Date()` は `session_start` ハンドラー内にあり、時刻引数を持たない。出所: `.pi/extensions/consult/index.ts:286-295`
- F3: `tool/consult.ts:375` の `Date.now()` は `completionRecord` 内にあり、`now` 引数を持たない。出所: `.pi/extensions/consult/tool/consult.ts:368-384`
- F4: `tool/consult.ts:468` の `Date.now()` は `beginRun` 内の `startedAt` で、`now` 引数を持たない。出所: `.pi/extensions/consult/tool/consult.ts:444-470`
- F5: `tool/consult.ts:550` の `Date.now()` は `createRuntime` の `status` コマンド内で `listText` に渡され、時刻引数を持たない。出所: `.pi/extensions/consult/tool/consult.ts:548-551`
- F6: `tool/subagents.ts:211` の `Date.now()` は `createSubagentsTool` の `execute` 内の局所変数で、`listText` と `rowsOf` には値として渡される。出所: `.pi/extensions/consult/tool/subagents.ts:203-218`
- F7: `run/run.ts:425` の `Date.now()` は `armWatchdog` のタイマー発火時に読まれ、`armWatchdog` は `now` 引数を持たない。出所: `.pi/extensions/consult/run/run.ts:412-432`
- F8: `run/run.ts:484` の `Date.now()` は `runPi` の起動時刻で、`runPi` は `now` 引数を持たない。出所: `.pi/extensions/consult/run/run.ts:476-490`
- F9: `run/run.ts:514` の `Date.now()` は `runPi` の stdout 受信時に読まれ、`consumeStdout` には `{ text, now }` の値として渡される。出所: `.pi/extensions/consult/run/run.ts:513-515`
- F10: `run/worktree.ts:77` の `stamp(now: Date = new Date())` は既定値でのみ時刻を読み、明示的な値があれば読まない。出所: `.pi/extensions/consult/run/worktree.ts:77-87`
- F11: `ensureRoot(cwd, deps)` は `stamp()` を引数なしで呼び、自らは `now` 引数を持たない。出所: `.pi/extensions/consult/run/worktree.ts:126-136`
- F12: `run/log.ts:259` の `Date.now()` は `closeOrphans(place, session, check?)` 内にあり、`now` 引数を持たない。出所: `.pi/extensions/consult/run/log.ts:234-264`
- F13: `run/worktree.test.ts:37-42` は時刻を 2030 年に固定しても既存の `root` が返り、新規ディレクトリが作られないことを検証する。出所: `.pi/extensions/consult/run/worktree.test.ts:31-46`
- F14: `run/worktree.test.ts:70-74` は時刻を 2030 年に固定しても `ensureRoot` が同一ルートを返し、新規作成しないことを検証する。出所: `.pi/extensions/consult/run/worktree.test.ts:63-78`

### Scope

- In:
  - failure: 既定値 `at = new Date()` をなくし必須の引数にすると、渡し忘れが型エラーになる。失敗の経路が変わる。
  - structure: 14 箇所の関数のシグネチャに `now` または `at` を追加する。
  - logic: 時刻の出所が `Date.now()`・`new Date()` から引数に変わる。
  - downstream: 14 箇所の呼び出し元と `run/worktree.test.ts` が追従する。
  - values & expression: 関数の引数名 `now`・`at` が増える。
- Out:
  - safety: 時刻の値の受け渡しだけで、秘密情報や個人データの扱いは変わらない。
  - upstream: 外部の package や contract は変わらない。
  - result: 外から見た結果の種類は変わらない。
  - existing data: 既存の保存データや配布済みの文書は変わらない。
  - cost: 実行時のコストは変わらない。
  - verification: テストのロジックと方法は変わるが、外部から使えるコマンドや分類は変わらない。質問はテストのロジックと方法を除く。
  - observability: 記録やシグナルは変わらない。
  - release: 配布や適用の仕方は変わらない。
  - other: なし。

### Decision

- Status: **accepted**
- Main: 時刻を読む関数が `now` または `at` を必須の引数で受け取る（C1, C4）
  - Add:
    - `sweep(place, cwd, deps, now)` の `now`（F1）
    - `completionRecord(job, report, now)` の `now`（F3）
    - `beginRun(state, ctx, request, deps, now)` の `now`（F4）
    - `createRuntime` の `RuntimeInput.now`（F5）
    - `createSubagentsTool` の `host.now`（F6）
    - `armWatchdog(live, now)` の `now`（F7）
    - `runPi(options, spawn, now)` の `now`（F8, F9）
    - `runOneSubagent` が `runPi` に `launch.now` を渡す（F8, F9）
    - `ensureRoot(cwd, deps, now)` の `now`（F11）
    - `createWorktree({ cwd, deps, id, base, now })` の `now`（F11）
    - `createWorktreeTool({ place, deps, now, check })` の `now`（F11）
    - `closeOrphans({ place, session, check, now })` の `now`（F12）
    - `controlSubagent(action, subagents, place, session, now, check)` の `now`（F5）
    - `nextSubagentId(state, session, now)` の `now`（F5）
    - `highestInRecord(place, session, now)` の `now`（F5）
    - `runningIn(place, id, now)` の `now`（F11）
    - `RuntimeState.now`（F5）
    - `TickPort.now`（F2）
  - Update:
    - `session_start` ハンドラーが時刻を 1 回読み、`closeQuietly`・`announceRunningSubagents`・`showRunningOnce`・`sweep`・`flushPending`・`pruneCursors` に渡す（F2）
    - `closeQuietly(place, current, now)` の `now`（F2）
    - `flushPending(port, now)` の `now`（F2）
    - `showRunningOnce(ui, place, sessionId, now, check)` の `now`（F2）
    - `startTick(port)` の `TickPort.now`（F2）
    - `announceRunningSubagents(place, announced, ctx, now, check)` の `now`（F2）
    - `stamp(now: Date)` の既定値をなくし、必須の引数にする（F10）
    - `appendRun(place, record, at)` の `at` を必須にする（C2）
    - `readRuns(place, scope)` の `scope.at` を必須にし、呼び出し元が `scope.at` を渡す（C2）
    - `appendDelivered(place, record, at)` の `at` を必須にする（C2）
    - `pendingReports` の `scope` に `at` を追加する（C2）
    - `consumeStdout` の `input.now` を `() => number` にする（F7）
    - `run/worktree.test.ts` の `vi.useFakeTimers`・`vi.setSystemTime` をやめ、時刻を値で渡す（C5, F13, F14）
    - `index.test.ts` の tick の `vi.useFakeTimers` は `setInterval` の進行に必要なので残す（C6）
  - Drop:
    - `stamp` の既定値 `now: Date = new Date()`（F10）
    - `appendRun` の `at ?? new Date()`（C2）
    - `readRuns` の `scope.at ?? new Date()`（C2）
    - `appendDelivered` の `at ?? new Date()`（C2）
- Policy:
  - Allowed:
    - 呼び出し元が時刻を 1 回読み、関数に渡す（C3, C4）
  - Forbidden:
    - 関数の内部で `Date.now()` や `new Date()` を読むこと - 実行環境を読むのは入口だけという規則に反する（C3）
    - 既定値 `at = new Date()` を置くこと - 渡し忘れても気づけない（C3）

#### Details

- `now` の型

  ```ts
  // 時刻を点として扱う関数は Date
  stamp(now: Date)
  appendRun(place, record, at: Date)
  readRuns(place, scope: { at: Date })
  runningRuns(place, scope: { at: Date; session: string }, check?)
  appendDelivered(place, record, at: Date)
  pendingReports(place, scope: { at: Date; session: string })
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

  // 時刻を関数で受け取るもの
  createWorktreeTool({ place, deps, now: () => Date, check })
  TickPort.now: () => Date

  // 経過時間を計算する関数は number
  applyEvent(state, event, now: number)
  watchdogDue(endedAt, lastOutputAt, now: number, quietMs)

  // タイマー発火時に読む関数は () => number
  armWatchdog(live, now: () => number)
  runPi(options, spawn, now: () => number)
  consumeStdout(live, { text, now: () => number })
  RuntimeState.now: () => number
  ```

- `RuntimeInput` と `SubagentsHost`
  ```ts
  export interface RuntimeInput {
    // ...
    readonly now: () => number;
  }

  export interface SubagentsHost {
    // ...
    readonly now: () => number;
  }
  ```

### Definition

- `Unit.subagent-consult`(kept): 機能は変わらず、時刻の受け渡し方だけが変わる。
