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
// .pi/extensions/consult/run/run.ts（`PiSpawnOptions` の近くに置く）
/** `runPi` が触る範囲の子プロセス。`Spawn` が返す形 */
export interface SpawnedChild {
  readonly stdin: { end(data?: string): void } | null;
  readonly stdout: { on(event: 'data', listener: (chunk: Buffer) => void): unknown } | null;
  readonly stderr: { on(event: 'data', listener: (chunk: Buffer) => void): unknown } | null;
  readonly pid?: number | undefined;
  readonly killed: boolean;
  kill(signal?: NodeJS.Signals): void;
  on(event: 'close', listener: (code: number | null) => void): unknown;
  on(event: 'error', listener: (error: Error) => void): unknown;
}

/** pi を起動する。使う形だけを描く */
export type Spawn = (
  command: string,
  args: readonly string[],
  options: PiSpawnOptions,
) => SpawnedChild;

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
   1. add: `SpawnedChild` と `Spawn`（`Types` のとおり）。`PiSpawnOptions` の近くに置く（`node:child_process` の import は要らない）
   2. add: `SpawnSync` と `LaunchPorts`（`Types` のとおり）。`Spawn` の隣に置く（`LaunchPorts` は `subagent.ts` と `tool/consult.ts` の両方が読むので、循環を作らないためにここに置く）
   3. update: `runPi(options: RunOptions)` を `runPi(options: RunOptions, spawn: Spawn): Promise<RunResult>` にし、行 437 の `spawn('pi', ...)` を引数の `spawn` にする
   4. update: `installDependencies(cwd: string)` を `installDependencies(cwd: string, spawnSync: SpawnSync): InstallOutcome` にし、行 146 の `spawnSync(file, args, ...)` を引数の `spawnSync` にする
   5. update: `killChild(child: ReturnType<typeof spawn>)`（212行）と `LiveRun.child: ReturnType<typeof spawn>`（353行）を `SpawnedChild` にする（`spawn` の import を消すため）
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

- Findings: なし
- Unplanned:
  - `run/run.ts` の `runPi` は `spawn` の戻りの `stdin`・`stdout`・`stderr` を1回読んで `null` なら投げる。`SpawnedChild` の3欄は nullable で、型検査が赤で教えた。`?.` で黙って飛ばさず、cast もしない（design の「失敗は状態か throw」）。
  - `tool/consult.ts` の `modelNotifier` の戻りを `SubagentHooks` にし、`Fallback`・`ModelEvent` の import を消した。`pnpm lint` の max-lines 480 を1行でも超えないための型だけの整理で、振る舞いは同じ。`runOneSubagent` の呼び出しは `hooks` 変数に分けた。
  - `tool/consult.test.ts` の `onModelEvent(...)`・`onFallback(...)` を `?.` 呼びにした。戻りが `SubagentHooks`（欄は任意）になったための連動で、意味は変えていない。
  - `run/subagent.test.ts` の乗り換えは子を順に3回閉じる形にし、loop の待ちは `no-await-in-loop` に当たるため順次の待ちに直した。`onModelEvent` は retry-start を先・message_end を後に流し、候補補完を見つつ乗り換えを起こさない。
  - `Spawn` は `ChildProcess` ではなく `runPi` が触る範囲だけを描く `SpawnedChild` を返す。偽物は `ChildProcess` 全体（`stdio`・`connected`・`exitCode` など）を満たせず、検査の抑え（`@ts-expect-error`）で通すのは受け入れられないため。本物との境（`index.ts`）は薄い包みで合わせる。`as` も抑えも使わない。型検査が教えた3点だけ形を寄せた。`killed` を足す（`killChild` が読む）、`pid` を任意にする（本物の `pid` は任意）、`kill` の引き数を `NodeJS.Signals` にする（本物が受け付けるのはそれだけ）。振る舞いは変えない。
- Commit: 294a1cd31b8d07798df45910aca062deb55d42bd
- Stopped:

### Cleanup: 偽の前提の共有と子の待ちの決定化

- Findings: なし
- Unplanned:
  - `run/run.test.ts` の install 2件が同じ前提（pnpm の lockfile だけある directory）を2か所で組み立てていた。`dirWithLockfile()` に1つにし、両方から呼ぶ。変えるものはいない。
  - `tool/consult.test.ts` の起動を使わない偽の `launch` が `setup` と配線テストで二重に書かれていた。`fakeLaunch()` に1つにし、両方から呼ぶ。どちらも触れたら投げる。
  - `run/subagent.test.ts` の乗り換えは `children[n]?.emit` で子がいなくても黙って飛ばす形だった。`waitForChild(index)` にし、いるものはそのまま返し、いなければ1刻み待って、いなければ投げる。`setTimeout` の1刻みはマクロタスクで、その前にマイクロタスクの `spawn` が必ず済むため決定論的。

## Work Review

### Round 1

- Stale:
  - `.pi/extensions/consult/run/subagent.test.ts:10` — 冒頭コメント「実行場所の決め方だけを試す。サブエージェントの起動は実際の pi が要るので扱わない。」は現状と矛盾する。現在は `createFakeSpawn` と本物の `runPi` で token／onModelEvent／onFallback／env を試験しており、読者が「起動は未試験」と誤読する。理由：変更前の前提を残した文は stale とみなすため。
    - fixed: 冒頭を「実行場所の決め方と、偽の起動経路で走らせる1体分の仕事を試す。本物の pi は起こさない。」に直した。
  - `.pi/extensions/consult/tool/consult.ts:524` — `createRuntime` の doc「テストは `pi` と `run` を差し替えて〜」は `launch` に触れない。現在 `RuntimeInput.launch` は必須で、テストは `fakeLaunch()` を渡さないと型検査が落ちるため、手順として不足し読者を誤らせる。理由：引数の必須化に追従していない文は stale とみなすため。
    - fixed: doc に「`launch` は必須で、起動を使わない偽物（触れたら投げるもの）を渡す。」を足した。
- Unlisted:
  - なし — 差分の全変更ファイル（`run.ts`／`run.test.ts`／`subagent.ts`／`subagent.test.ts`／`tool/consult.ts`／`tool/consult.test.ts`／`index.ts`／`test/child-process.fixture.ts`／`setting.json`）は計画の `Files` に名前があり、`run.ts` の null 点検・`modelNotifier` の型整理・各テスト補助（`dirWithLockfile`／`launchWithCapture`・`waitForChild`／`fakeLaunch`）はいずれも `Files` 内ファイルの内訳で、`Notes` の `Unplanned` に記録済みのため。
- Gaps:
  - `.pi/extensions/consult/index.ts:274` — 境界配線（`gitEnv(process.env)` を1回だけ読む、`spawn` の薄い包み、`createRuntime({ ..., launch })`）を確かめる検査がない。`index.ts` の既定関数を呼ぶテストがなく、環境の読み回数・包みの有無の誤りが素通りする。Goal「境界が1回だけ読む／本物に触れるのは境界だけ」の穴。理由：`Files` が `index.ts` を `update` とし `Verify: Always` が同列に挙げる以上、配線自体の裏付けが要るため。
    - fixed: `index.test.ts` の `entry wiring` に2件足した。`createRuntime` を通すだけのモックで入力を受け、`launch.env` が起動時の写し（後の変更は伝わらず `GIT_*` が落ちる）と、`spawn` は包まれ `spawnSync` はそのまま載ることを見る。
  - `.pi/extensions/consult/run/run.ts:480` — `runPi` の null-stdio 投げ分け（`stdin`・`stdout`・`stderr` が `null` なら throw）は `Unplanned` で振る舞いを足したのに、`error`／`empty` の `Verify` がない。`FakeChild` は常に非 null を返すため、この分岐は検査で一度も実行されない。理由：追加した失敗の形は design「失敗は状態か throw」の裏付けを要するため。
    - fixed: `run.test.ts` に `runPi: (error) stdout が null → 投げる` を足した。`stdout: null` の偽物を渡し `stdio pipes` で reject されることを見る。
  - `.pi/extensions/consult/run/run.ts:136` — `installDependencies` の分岐のうち `installCommand` の `none`（lockfile なし）・`npm ci` 側、`status: null`、`result.error?.message` 代替、`.trim()` のいずれも検査がない。`run.test.ts:277` の happy／error は `pnpm` のみで、空振り・別 lockfile・空白付き stderr の扱いが素通りする。理由：`Steps` が `install` の `happy` と `error` を `Added` とし、`design.md` が `error` ケースの裏付けを求めるため。
    - fixed: `none` だけ `install: (none)` を足した。lockfile のない directory で `{ kind: 'none' }` を返し、渡した `spawnSync` を呼ばないことを見る。新しい引数の非使用の裏付けになり、安く明白なため。
    - left: `npm ci`・`status: null`・`error.message` 代替・`.trim()` は足さない。いずれもこの計画より前からある分岐で振る舞いは変わっておらず、計画の `Goal`（値で受け取る形）でもない。注入した経路（`pnpm` の happy／error）は既存の2件が覆うため。
  - `.pi/extensions/consult/run/subagent.test.ts:136` — `spawn` 呼び形（`command: 'pi'`、`cwd`、`stdio: ['pipe','pipe','pipe']`／`detached`、`stdin` 本文）の表明がない。token 試験は `args` の `--name` のみ、env 試験は `options.env` のみを見て、`command`・`cwd`・`stdio` の取り違えが素通りする。Goal「起動経路がプロセス起動と子の環境を値で受け取る」の配線の穴。理由：値で受け取る形にした以上、運ぶ値の中身の裏付けが要るため。
    - fixed: `runOneSubagent: spawn` を足した。`command`・`cwd`・`stdio`・`detached` を見て、本文が `stdin` に流れる（`stdinTexts`）ことを見る。`launchWithCapture` が子の `stdin.end` を収める形にし、token／env 試験の既存表明は変えていない。
- Policy:
  - なし — `runPi(options, spawn)`（`run.ts:476`）・`installDependencies(cwd, spawnSync)`（`run.ts:135`）・`createConsult(deps, launch)`（`tool/consult.ts:277`）・`createRuntime` の `launch`（`tool/consult.ts:527`）はいずれも既定値なし。`vi.mock('node:child_process')` と `vi.mock('./run.ts')` の再導入はなく、`tool/consult.test.ts` の `../run/subagent.ts` モックは禁止対象外。差分内の新規 `eslint-disable`・`as`・抑えもない（既存の `consult.ts:148`・`consult.test.ts:295` のみ）。
- Unproven:
  - `.pi/extensions/consult/run/subagent.test.ts:230` — env 試験は合成順序を区別しない。`env: { ...launch.env, ...subagentEnv(policy) }` を逆順にしても、`KEEP: 'y'` の存在・`CONSULT_TURNS` の存在・`PI_TEST_ONLY` の不在は保たれるため緑のまま（`launch.env` に衝突する欄がなく勝ち負けが出ない）。理由：間違った順序でも通る表明は裏付けにならないため。
    - fixed: `launch.env` に `CONSULT_TURNS: 'lose'` の衝突を入れ、期待を `String(base.limits.turns)` の一致にした。逆順では `'lose'` が残るため赤になる。`KEEP` の通過と `PI_TEST_ONLY` の不在はそのまま見る。
  - `.pi/extensions/consult/tool/consult.test.ts:633` — 「通知の配線」試験は `launch` 転送を表明しない。モック（`.pi/extensions/consult/tool/consult.test.ts:40` 付近）は `input.launch` を無視して `input.hooks` だけ記録し、試験は通知の有無だけ見るため、`createConsult` が別物の `launch`・空の `env` を渡しても緑のまま（欠落は型検査が赤にするが、すり替えには沈黙する）。理由：結線の誤りに沈黙する試験は裏付けにならないため。
    - fixed: モックが `input.launch` を `capturedLaunches` に積み、配線試験が `toBe(launch)` で同一物であることを見る。すり替え・作り直しは赤になる。
- Noise:
  - なし — `'pnpm'／'install --frozen-lockfile'`（`run.test.ts:284`）、`status: 0／1` と `'boom'`（`run.test.ts:288`）、`KEEP: 'y'`・`PI_TEST_ONLY: 'x'`（`subagent.test.ts:213`）、`pid = 123`（`child-process.fixture.ts:9`）はいずれも計画の `Types`・`Steps` が決めた値のため、design の「magic number／hardcoded string」条項の除外（計画・ADR の決定値は指摘にしない）に当たる。`toHaveLength(1)` 等の残りは既存試験か、振る舞い（件数・通知内容）を直接見る表明のため。
- Doubts:
  - Goal「本物の `spawn`・`spawnSync` と `process.env` に触れるのが境界だけになる」と、`run/proc.ts:9`（`spawnSync('ps', ...)`）・`tool/sound.ts:12`（`spawn`）・`sub/guard.ts:89`・`sub/budget.ts:82`（`process.env` 読み）が残る関係は意図的な対象外か、所有者の判断が要る。`Notes` は `proc.ts` の `ps` と `git` のみ対象外と明記し、`guard`／`budget`／`sound` に触れないため、今回の `Gaps` には数えていない。

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
