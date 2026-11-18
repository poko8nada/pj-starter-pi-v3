# PLAN `launch-deps`

- No: 02
- Place: worktree
- Boundary Plans: `01-worktree-deps`（先に完了していること）

## Goal

起動経路が、プロセス起動と子の環境を値として受け取り、本物の `spawn`・`spawnSync` と `process.env` に触れるのが境界だけになる。

## Refactor

- Inside:
  - Modules: `run/run.ts` に `Spawn`・`SpawnSync` の型を置き、`runPi` と `installDependencies` が受け取る。`run/subagent.ts` の `runOneSubagent` を1つの入力（`SubagentInput`）にし、`gitEnv()` の呼び出しを消す。理由は、起動経路の外との接点を1つにし、テストが決めた偽のプロセスと環境を渡せるようにするため
  - Dirs: なし
- Outside:
  - Extract: `test/child-process.fixture.ts` を新しく置く。`run.test.ts` と `subagent.test.ts` が同じ偽の子プロセス（`stdout`・`stderr`・`stdin`・`pid`・`kill`）を必要とし、本物の `runPi` にその `stdout` を読ませるため。01 で偽の git を1つにしたのと同じ形
  - Colocate: なし

## Files

```text
.pi/extensions/consult/
  run/
    run.ts                update
    run.test.ts           update
    subagent.ts           update
    subagent.test.ts      update
    proc.ts
  sub/
    spec.ts
  tool/
    consult.ts            update
    consult.test.ts       update
  index.ts                update
  consult.fixture.ts
test/
  child-process.fixture.ts  add
  temp-dir.ts
scripts/
  harness-sync/
    setting.json          update
lib/
  git-env.mjs
package.json
```

## Slices

## 1.起動経路がプロセス起動と環境を値で受け取る

`runPi`・`installDependencies` が `spawn`・`spawnSync` を引数で受け取り、`runOneSubagent` が入力オブジェクトから `spawn`・`spawnSync`・`env` を受け取り、境界（`index.ts`）が `gitEnv(process.env)` を1回だけ読む。振る舞いは変えない。

### Types

```ts
// .pi/extensions/consult/run/run.ts（先頭の import の後に、`PiSpawnOptions` の近くに置く）
import type { ChildProcess } from 'node:child_process';

/** pi を起動する。使う形だけを描く */
export type Spawn = (
  command: string,
  args: readonly string[],
  options: PiSpawnOptions,
) => ChildProcess;

/** install を1回走らせる。使う形だけを描く */
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

/** 起動経路が外から受け取るもの。境界が1回だけ組み立てる */
export interface LaunchPorts {
  readonly spawn: Spawn;
  readonly spawnSync: SpawnSync;
  /** 子に渡す環境の元。GIT_* は境界で落としてある */
  readonly env: NodeJS.ProcessEnv;
}

// .pi/extensions/consult/run/subagent.ts（既存の型の並びに置く）
import type { LaunchPorts, Spawn, SpawnSync } from './run.ts';

export interface SubagentInput {
  readonly ctx: ConsultContext;
  readonly options: ConsultOptions;
  readonly job: SubagentJob;
  readonly hooks?: SubagentHooks;
  readonly launch: LaunchPorts;
}

// .pi/extensions/consult/tool/consult.ts（01 が作った `RuntimeInput` に足す）
import type { LaunchPorts } from '../run/run.ts';
readonly launch: LaunchPorts;

// test/child-process.fixture.ts
import { EventEmitter } from 'node:events';
import type { Spawn } from '../.pi/extensions/consult/run/run.ts';

/** 偽の子プロセス。`runPi` が触る欄だけを持つ */
export class FakeChild extends EventEmitter {
  readonly stdout = new EventEmitter();
  readonly stderr = new EventEmitter();
  readonly stdin = { end: (): void => {} };
  readonly pid = 123;
  killed = false;
  kill(): void {
    this.killed = true;
  }
}

/** 偽の `spawn` と、それが作った子の並び */
export function createFakeSpawn(): {
  readonly spawn: Spawn;
  readonly children: FakeChild[];
};
```

### Steps

1. `.pi/extensions/consult/run/run.ts`
   1. add: `import type { ChildProcess } from 'node:child_process';` と `Spawn`（`Types` のとおり）。`PiSpawnOptions` の近くに置く
   2. add: `SpawnSync` と `LaunchPorts`（`Types` のとおり）。`Spawn` の隣に置く（`LaunchPorts` は `subagent.ts` と `tool/consult.ts` の両方が読むので、循環を作らないためにここに置く）
   3. update: `runPi(options: RunOptions)` を `runPi(options: RunOptions, spawn: Spawn): Promise<RunResult>` にし、行 437 の `spawn('pi', ...)` を引数の `spawn` にする
   4. update: `installDependencies(cwd: string)` を `installDependencies(cwd: string, spawnSync: SpawnSync): InstallOutcome` にし、行 146 の `spawnSync(file, args, ...)` を引数の `spawnSync` にする
   5. update: `killChild(child: ReturnType<typeof spawn>)`（212行）と `LiveRun.child: ReturnType<typeof spawn>`（353行）を `ChildProcess` にする（`spawn` の import を消すため）
   6. drop: `import { spawn, spawnSync } from 'node:child_process';`
2. `.pi/extensions/consult/run/subagent.ts`
   1. drop: `import { gitEnv } from '../../../../lib/git-env.mjs';`
   2. add: `import type { LaunchPorts } from './run.ts';` と `SubagentInput`（`Types` のとおり）を既存の型の並びに書く（`Spawn`・`SpawnSync` は import しない。`subagent.ts` が使うのは `launch` の欄だけ）
   3. update: `runOneSubagent(ctx, options, job, hooks = {})` を `runOneSubagent(input: SubagentInput): Promise<SubagentResult>` にし、先頭で `const { ctx, options, job, hooks = {}, launch } = input;` と分割代入する
   4. update: 行 149 の `env: { ...gitEnv(), ...subagentEnv(options.policy) }` を `env: { ...launch.env, ...subagentEnv(options.policy) }` にする
   5. update: 行 118 の `installDependencies(prepared.cwd)` を `installDependencies(prepared.cwd, launch.spawnSync)` にする
   6. update: 行 139 の `runPi({ ... })` を `runPi({ ... }, launch.spawn)` にする
3. `.pi/extensions/consult/tool/consult.ts`
   1. update: `import type { LaunchPorts } from '../run/run.ts';` を足し、`RuntimeInput` に `readonly launch: LaunchPorts;` を足す
   2. update: `createRuntime` の分割代入に `launch` を足す（`const { pi, place, deps, launch, run, sessionNow = () => '', check, psRun } = input;`。01 で `run` の既定値は消えているので、ここでも既定値を付けない）
   3. update: 01 が作った `createConsult(deps)` を `createConsult(deps: WorktreeDeps, launch: LaunchPorts): ConsultRunner` にし、中の `runOneSubagent(ctx, options, job, modelNotifier(ctx, job.id))` を `runOneSubagent({ ctx, options, job, hooks: modelNotifier(ctx, job.id), launch })` にする（`launch` はファクトリの引数で受け取る）
   4. update: `createRuntime` の `const runner = run ?? createConsult(deps);` を `const runner = run ?? createConsult(deps, launch);` にする
4. `.pi/extensions/consult/index.ts`
   1. add: `import { gitEnv } from '../../../lib/git-env.mjs';` と `import type { LaunchPorts } from './run/run.ts';`
   2. add: `import { spawn, spawnSync } from 'node:child_process';`（01 で `run.ts` から消えた後、起動経路（pi と install）で本物を import するのはこの1箇所になる。`run/proc.ts` の `ps` と `lib/git-env.mjs` の `git` は別の関心なので残る）
   3. add: `export default function (pi)` の先頭で、01 が作る `const deps: WorktreeDeps = {...};` の直後に `const launch: LaunchPorts = { spawn, spawnSync, env: gitEnv(process.env) };` を作る。`env` は起動時に1回だけ読み、以後の `process.env` の変更は子に伝わらない（意図した差。以前はジョブごとに読んでいた）
   4. update: `createRuntime({ pi, place, deps, sessionNow: () => session })` を `createRuntime({ pi, place, deps, launch, sessionNow: () => session })` にする
5. `test/child-process.fixture.ts`
   1. add: `FakeChild`（`Types` のとおり。`EventEmitter` を継承し、`stdout`・`stderr`・`stdin`・`pid`・`killed`・`kill` を持つ）
   2. add: `createFakeSpawn()`（`Types` のとおり）。呼ばれるたびに `FakeChild` を作って `children` に積み、`spawn` として返す
6. `.pi/extensions/consult/run/run.test.ts`
   1. drop: `vi.mock('node:child_process', ...)`（62行）
   2. update: モジュール直下で `const { spawn: fakeSpawn, children } = createFakeSpawn();` を作り、`vi.hoisted` の `spawnedChildren` を消して `children` を読む形にする。`runPi(options, fakeSpawn)` に渡す
   3. add: `import { tempDir } from '../../../../test/temp-dir.ts';`
   4. add: `install: (happy) pnpm-lock.yaml のある directory → pnpm install --frozen-lockfile を1回走らせ、ok を返す` — `tempDir()` に空の `pnpm-lock.yaml` を書き、偽の `SpawnSync`（`{ status: 0, stdout: '', stderr: '' }` を返し、受けた引数を記録する）で `['pnpm', 'install', '--frozen-lockfile']` と `cwd` を確かめる
   5. add: `install: (error) status 1 → failed を返し、stderr を error に入れる` — 偽の `SpawnSync` が `{ status: 1, stdout: '', stderr: 'boom' }` を返す
7. `.pi/extensions/consult/run/subagent.test.ts`
   1. drop: `vi.mock('./run.ts', ...)`（91行）と `capturedOptions`
   2. update: `const { spawn: fakeSpawn, children } = createFakeSpawn();` を作り、偽の `launch`（`{ spawn: fakeSpawn, spawnSync: () => { throw new Error('spawnSync is not used'); }, env: {} }`）を渡す。`piArgs` は `fakeSpawn` が受けた `args` から観測する。`onModelEvent` は、テストが `hooks: { onModelEvent }` を渡し、`children.at(-1)?.stdout.emit('data', 行)` で本物の `runPi` に解釈させ、最後に `children.at(-1)?.emit('close', 0)` で決着させる（`close` を出さないと `runPi` は見張りの 30 秒まで返らない。`run.test.ts` の 148 行と同じ形）
   3. add: `env: (happy) 決めた env と subagentEnv(policy) が合わさり、process.env を読まない` — `process.env.PI_TEST_ONLY = 'x'` を設定し、`launch.env` に `{ KEEP: 'y' }` を入れる。`fakeSpawn` の1回目の呼び出しの `options.env` に `KEEP: 'y'` と `CONSULT_TURNS` があり、`PI_TEST_ONLY` がないことを確かめる（`subagent.ts` が env を自分で読まないことの証明）
8. `.pi/extensions/consult/tool/consult.test.ts`
   1. update: `createRuntime({ ... })` の入力に偽の `launch`（`{ spawn: () => { throw new Error('spawn is not used'); }, spawnSync: () => { throw new Error('spawnSync is not used'); }, env: {} }`）を足す（76、628行）
   2. update: `import type { SubagentInput } from '../run/subagent.ts';` を足し、偽の `runOneSubagent`（37行のモック）を `(input: SubagentInput) => ...` の形にする。`hooks` の記録は `if (input.hooks !== undefined)` の条件で行う
9. `scripts/harness-sync/setting.json`
   1. update: `copy` と `push` の `test/` の並び順の末尾に `test/child-process.fixture.ts` を足す

### Policy

- Allowed:
  - 境界（`index.ts`）が `gitEnv(process.env)` を1回だけ読むこと（C2, F4）
  - テストが決めた偽の `spawn`・`spawnSync` と env を渡すこと（F6, F8）
- Forbidden:
  - 既定値付きの `spawn`・`spawnSync` - 渡し忘れると本物の pi や install が静かに走る（C1）
  - `run`・`subagent` のテストでの `vi.mock('node:child_process')` と `vi.mock('./run.ts')` の再導入 - グローバルな差し替えを元に戻すことになる（C5）
  - 新しい `eslint-disable` - `AGENTS.md` の許す四つの場合に当たらない（C4）

### Verify

- Always:
  - `pnpm test:related test/child-process.fixture.ts .pi/extensions/consult/run/run.ts .pi/extensions/consult/run/run.test.ts .pi/extensions/consult/run/subagent.ts .pi/extensions/consult/run/subagent.test.ts .pi/extensions/consult/tool/consult.ts .pi/extensions/consult/tool/consult.test.ts .pi/extensions/consult/index.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、それらが参照するファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added: other — `runPi` を引数1つで呼ぶ行を一時的に足して `pnpm typecheck` が赤になることを確かめ、その行を元に戻す

## Notes

### Slice 1: 起動経路がプロセス起動と環境を値で受け取る

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
