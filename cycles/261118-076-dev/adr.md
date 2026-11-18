# ADR 076

## 01: worktree の依存の受け取り

Type: _Full_

### Context

- C1: `run/worktree.ts` は `lib/git-env.mjs` の `git` を import し、10箇所で呼んでいる。
- C2: `consultRoot()` が `process.env.CONSULT_ROOT` を読み、`rootFor` と `ensureRoot` がその値を使う。
- C3: テスト2つは `vi.mock('lib/git-env.mjs')` と `vi.stubEnv('CONSULT_ROOT', …)` で、モジュールと環境変数を差し替えている。
- C4: `.pi` と `test/` は `scripts/harness-sync/setting.json` の `copy` で製品に配られ、製品のエージェントが読む。
- C5: 制約: `max-params` は4、`max-lines-per-function` は80（`*.test.*` は240）、`no-non-null-assertion` は error。`*.fixture.ts` はテストの上限を受けない。
- C6: 制約: 抑止は `AGENTS.md` の許す四つの場合だけ。計画にない抑止は通さない。
- C7: 制約: `isolate: true` を維持し、`--no-isolate` を使わない。
- C8: 制約: 状態を外に出し、ホルダー越しに `!` で触る形は選ばない。サイクル 075 で抑止が四つ必要になり、その形を取り消した。
- C9: 意図: `git` と `root` を境界で受け取り、偽物を一つにし、テストが前提を述べ、製品が模倣してよい継ぎ目を一つ示す。
- C10: オーナーの指示: 変更の大きさを理由に設計を決めない。「既存の書き方を変えない」という前提は置かない。

### Research & Trial

- F1: `run/worktree.test.ts` の33件のうち、状態の6欄を設定するのは各1件だけ（`listStatus` は 128、`listOverride` は生の出力、`addStatus`・`removeStatus`・`pruneStatus`・`forEachRefStatus` はそれぞれ 1）。出所: `.pi/extensions/consult/run/worktree.test.ts:286, 318-323, 329, 494, 564, 571`
- F2: 同じファイルで補助を呼ぶのは `makeDirty` 4件、`addOrphan` 2件、`markUnmerged` 4件。`lastAdd` を読むのは2件。出所: `.pi/extensions/consult/run/worktree.test.ts:341, 384, 394, 395, 408, 419, 444, 479, 504, 507, 275, 281`
- F3: `tool/worktree.test.ts` の21件は、`removeStatus` と `forEachRefStatus` を各1件、`makeDirty` を1件だけ使う。`listStatus`・`addStatus`・`pruneStatus` は宣言だけで設定されず、`listOverride`・`lastAdd`・`addOrphan`・`markUnmerged` は存在しない。出所: `.pi/extensions/consult/tool/worktree.test.ts:25-29, 138-140, 220, 231, 240`
- F4: `tool/worktree.test.ts` の21件のうち6件は、偽物を一度も使わない（`removeText` の文言だけを確かめる）。出所: `.pi/extensions/consult/tool/worktree.test.ts:359-408`
- F5: 偽物が答えるのは九つの命令で、前提の種類は「コマンドが失敗する」「生の出力を返す」「未コミットの変更がある」「取り込み済みの孤児がある」「未マージである」の五つ。出所: `.pi/extensions/consult/run/worktree.test.ts:55-151`, `.pi/extensions/consult/tool/worktree.test.ts:45-134`
- 依存を渡す前例は、値を組み立てて渡す形。`GitRun` は `(args) => GitOutput` で（`run/run.ts:162`）、`worktreeGit(path)` が閉包で `git` に縛り（177行）、`commitInWorktree(git, id)` が受け取る（`tool/commit.ts:82`）。`Place` は `{dir, toplevel}` で（`run/place.ts:17`）、`placeFor(root, toplevel)` が作り（36行）、`index.ts:46` が1回だけ組み立てる。出所: `.pi/extensions/consult/run/run.ts:156-177`, `.pi/extensions/consult/tool/commit.ts:82,112`, `.pi/extensions/consult/run/place.ts:17,36`, `.pi/extensions/consult/index.ts:46`
- F7: `run/worktree.ts` の関数の引数は最大3（`createWorktree` と `removeWorktree` の3番目は既定値付き）。`deps` を1つ足しても最大4で、`max-params` の上限内に収まる。出所: `.pi/extensions/consult/run/worktree.ts:83, 106, 118, 131, 172, 177, 186, 326, 341`
- F8: 本番の呼び出しは16箇所、4ファイル。`index.ts` が `topLevel`（42行）・`consultRoot`（46行）・`cleanWorktrees`（229行）、`tool/worktree.ts` が `createWorktree`（174行）・`removeWorktree`（186行）・`listWorktrees`（196行）、`tool/commit.ts` が `findWorktree`（108行）、`tool/consult.ts` が `findWorktree`（446行）を呼ぶ。出所: `.pi/extensions/consult/index.ts:42,46,229`, `.pi/extensions/consult/tool/worktree.ts:174,186,196`, `.pi/extensions/consult/tool/commit.ts:108`, `.pi/extensions/consult/tool/consult.ts:446`
- F9: `CONSULT_ROOT` を読む本番箇所は `run/worktree.ts:132` の1つだけ。`GIT_*` を落とすのは `lib/git-env.mjs:13` で、`git()` が `gitEnv()` を通す（28行）。`subagent.ts:149` も `gitEnv()` を呼ぶ。出所: `.pi/extensions/consult/run/worktree.ts:18,132`, `lib/git-env.mjs:10,13,28`, `.pi/extensions/consult/run/subagent.ts:149`
- F10: テストは `process.env['CONSULT_ROOT']` を直接読む箇所が5つある（`run/worktree.test.ts` の196、210、226、242、244行）。出所: `.pi/extensions/consult/run/worktree.test.ts:178,183,196,210,226,242,244`
- F11: `run/run.ts:177-186` の `worktreeGit(path)` が `lib/git-env.mjs` の `git` を中で呼ぶ。`run.ts` が git を使うのはこの1行（179）だけ。呼ぶのは `tool/commit.ts:112` と `tool/consult.ts:293`。出所: `.pi/extensions/consult/run/run.ts:21,177-186,179`, `.pi/extensions/consult/tool/commit.ts:112`, `.pi/extensions/consult/tool/consult.ts:293`

### Scope

- In:
  - failure: `git` が失敗したときの例外と文言（`could not create the worktree`、`could not remove the worktree`、`could not list the orphan branches`、prune の例外）を、受け取った `git` でも同じ条件で保つ。`CONSULT_ROOT` が未設定のときの既定（`/tmp/pi-consult`）を、値を組み立てる側で保つ。
  - structure: `run/worktree.ts` に、`git` と `root` を受け取る形を一つ置く。`worktreeGit` は `git` を引数で受け取る。偽物を `test/fake-git.fixture.ts` に一つ置く。
  - logic: `git` の出どころを import から受け取った値へ、`root` の出どころを `process.env` から受け取った値へ変える。
  - downstream: 本番五ファイル（`index.ts`、`run/run.ts`、`tool/worktree.ts`、`tool/commit.ts`、`tool/consult.ts`）とテスト三つ（`run/worktree.test.ts`、`tool/worktree.test.ts`、`index.test.ts`）を、新しい受け取り方に合わせる。
  - verification: テスト二つから `vi.mock('lib/git-env.mjs')` と `vi.stubEnv('CONSULT_ROOT')` を外し、偽物と root を渡す形にする。`git-contract.test.ts` は変えない。
  - release: `scripts/harness-sync/setting.json` の `copy` と `push` に fixture を足す。
- Out:
  - safety: 秘密・権限・公開範囲・個人データに触れない（`CONSULT_ROOT` は保存先のパスで、秘密ではない）。
  - upstream: パッケージ・外部契約・`lib/git-env.mjs` の `GIT_*` 除去を変えない。
  - result: 返す型と値（`Worktree`、`WorktreeRow`、`RemoveResult`、`CleanupReport`）を変えない。
  - existing: ワークツリーの配置・記録・過去の実行結果を移さない。
  - cost: 実行時の速度・メモリ・外部呼び出しを変えない。
  - expression: 利用者に見える文言を変えない（テスト名も前提を述べる形のままで、変えない）。
  - observability: 記録・ログ・メトリクスを変えない。
  - other: なし。

### Decision

- Status: **accepted**
- Main: 偽物をねじ込むためにモジュールと環境変数を書き換えることをやめ、`run/worktree.ts` の関数群と `worktreeGit` が `git` と `root` を値として受け取る。worktree の経路が本物の git と環境変数に触れなくなる。（C1, C8, C9, C10, F11）
  - Add:
    - `git` と `root` を受け取る形（`WorktreeDeps` を常に2番目の引数として受け取る）（C1, C5, F7, C9）
    - `test/fake-git.fixture.ts` の偽物一つ（C4, F1, F3）
  - Update:
    - `run/worktree.ts` の九つの関数の入口（C1）
    - 本番五ファイルの呼び出しと、テスト三つの組み立て（F8, F11）
    - `index.ts` が起動時に `WorktreeDeps` を組み立て、環境変数を読む唯一の箇所になる（C2, F9）
    - `run/run.ts` の `worktreeGit(path)` が `git` を引数で受け取る形になる（C1, F11）
  - Drop:
    - `run/worktree.ts` の `import { git }`（C1）
    - `consultRoot()` の `process.env.CONSULT_ROOT` の読み（境界へ移す）（C2, F9）
    - `run/run.ts` の `import { git }`（F11）
- Secondary: テストの偽物は一つになり、前提を述べる六つの振る舞い（`fail`、`print`、`makeDirty`、`addOrphan`、`markUnmerged`、`lastAdd`）を持つ。テストは偽物を渡す。（C6, C8, F4）
  - Add:
    - `fail(command, status?)`、`print(command, output)`、`lastAdd()`（F1, F2, F5）
  - Update:
    - 二つのテストの組み立て（C3）
  - Drop:
    - `vi.mock('lib/git-env.mjs')` と `vi.stubEnv('CONSULT_ROOT', …)`（C3）
    - `process.env['CONSULT_ROOT']` の直接読み五つ（F10）
- Policy:
  - Allowed:
    - テストが偽物を一つ作って渡すこと（C9）
    - 境界（`index.ts` の組み立て）が `process.env.CONSULT_ROOT` を読むこと（C2, F9）
    - 偽物が使われない振る舞いを一つも持たないこと（F3）
    - `index.test.ts` が `vi.stubEnv('CONSULT_ROOT', …)` で配線の入力を決めること（主題が環境の取り込みだから）（C2, F9）
  - Forbidden:
    - テストから偽物の内部状態を設定すること - 前提ではなく実装の詳細を書くことになる（C9）
    - 既定値付きの `deps` 引数 - 渡し忘れると本物の git が静かに走る（C1, C9）
    - worktree を確かめる二つのテストでの `vi.mock` と `vi.stubEnv` の再導入 - グローバルな差し替えを戻すことになる（C3, C7）

#### Details

- `run/worktree.ts` の受け取り方
  ```ts
  import type { GitOutput } from './run.ts';

  /** worktree の関数が使う git と保存先のルート */
  export interface WorktreeDeps {
    readonly git: (cwd: string, args: readonly string[]) => GitOutput;
    readonly root: string;
  }

  export function topLevel(cwd: string, deps: WorktreeDeps): string;
  export function rootFor(cwd: string, deps: WorktreeDeps): string | undefined;
  export function ensureRoot(cwd: string, deps: WorktreeDeps): string;
  export function listWorktrees(cwd: string, deps: WorktreeDeps): WorktreeRow[];
  export function findWorktree(
    cwd: string,
    deps: WorktreeDeps,
    id: string,
  ): WorktreeRow | undefined;
  export function createWorktree(
    cwd: string,
    deps: WorktreeDeps,
    id: string,
    base = 'HEAD',
  ): Worktree;
  export function cleanWorktrees(cwd: string, deps: WorktreeDeps): CleanupReport;
  export function removeWorktree(
    cwd: string,
    deps: WorktreeDeps,
    id: string,
    options: RemoveOptions = {},
  ): RemoveResult;
  ```
- 偽物の振る舞い
  ```ts
  export interface FakeGit {
    readonly git: (cwd: string, args: readonly string[]) => GitOutput;
    /** そのコマンドを status で失敗させる。既定は 1 */
    readonly fail: (command: GitCommand, status?: number) => void;
    /** そのコマンドの生の出力を差し替える */
    readonly print: (command: GitCommand, output: string) => void;
    readonly makeDirty: (path: string) => void;
    readonly addOrphan: (branch: string, merged: boolean) => void;
    readonly markUnmerged: (branch: string) => void;
    /** 最後に受けた `worktree add` の引数 */
    readonly lastAdd: () => { branch: string; path: string; base: string } | undefined;
  }

  export type GitCommand =
    | 'rev-parse'
    | 'worktree list'
    | 'worktree add'
    | 'worktree prune'
    | 'worktree remove'
    | 'for-each-ref'
    | 'branch -d'
    | 'status';
  ```
- 境界（`index.ts`）の組み立て
  ```ts
  import { CONSULT_ROOT, type WorktreeDeps } from './run/worktree.ts';
  import { git } from '../../../../lib/git-env.mjs';

  // 起動時に 1 回だけ。環境を読むのはここだけになる
  const deps: WorktreeDeps = { git, root: process.env.CONSULT_ROOT ?? CONSULT_ROOT };
  ```

### Definition

- `Unit.subagent-consult`(kept): 主な機能（サブエージェントのコンサルを走らせ、そのワークツリーと結果を扱える）は同じ。変わったのは、worktree の関数が `git` と `root` をどこで受け取るかという経路と、その経路を確かめるテストの形
- `What`(kept): プロダクトが何であるかは変わらない
- `Who`(kept): 役割とその Does・Needs は変わらない
- `Stack`(kept): 依存するものは変わらない（`lib/git-env.mjs` はそのまま）

## 02: 起動経路の外部依存

Type: _Full_

### Context

- C1: `run/run.ts:437` の `runPi` が `spawn('pi', …)` を直接呼び、146行の install が `spawnSync(file, args)` を直接呼ぶ。
- C2: `run/subagent.ts:149` が `env: { ...gitEnv(), ...subagentEnv(options.policy) }` で子の環境を作る。`gitEnv()` は既定では `process.env` を読む。
- C3: 意図: 起動経路が、環境変数の掃除とプロセス起動を境界から受け取り、本物のプロセスと環境変数に触れるのが境界だけになる。
- C4: 制約: `max-params` は4、`max-lines-per-function` は80、抑止は `AGENTS.md` の許す四つの場合だけ。
- C5: 制約: `run/run.test.ts:62` が `node:child_process` をモックしている。起動経路のテストは前提を述べる形にする。
- C6: 前提: エントリ01 で `run/run.ts` の `worktreeGit` から `git` の import が消える（F11）。このエントリの範囲はプロセスと環境変数に限る。

### Research & Trial

- F1: `runPi(options: RunOptions)` は `spawn('pi', [...options.piArgs], spawnOptions(options.cwd, options.env))` を呼ぶ。`RunOptions` は `env` をすでに持つ。出所: `.pi/extensions/consult/run/run.ts:39,435,437`
- F2: `installDependencies(cwd)` が `spawnSync(file, args, { cwd, encoding: 'utf8' })` を1行で呼ぶ。走らせるコマンドは `installCommand` が `pnpm-lock.yaml` / `package-lock.json` から決める。出所: `.pi/extensions/consult/run/run.ts:116,137-146`
- F3: `runPi` を呼ぶのは `subagent.ts:139` の1つだけ、`installDependencies` を呼ぶのは `subagent.ts:118` の1つだけ。本番の他の呼び出しはない。出所: `.pi/extensions/consult/run/subagent.ts:118,139`
- F4: `runOneSubagent(ctx, options, job, hooks)` が子の env を `{ ...gitEnv(), ...subagentEnv(options.policy) }` で作り、`RunOptions.env` として渡す。出所: `.pi/extensions/consult/run/subagent.ts:109,149`
- F5: `runOneSubagent` を呼ぶのは `tool/consult.ts:288` の1つだけ。`SubagentJob` は `beginRun` が組み立てる（464行）。出所: `.pi/extensions/consult/tool/consult.ts:288,464`
- F6: `run/run.test.ts:62` が `node:child_process` をモックし、`runPi` を駆動する（121行）。確かめるのは `spawn` が呼ばれたことと結果だけで、引数・env・install は確かめない。出所: `.pi/extensions/consult/run/run.test.ts:62,121-155`
- F7: `installDependencies`・`installCommand`・`spawnSync` を駆動するテストはない。子の env 全体と `gitEnv()` の戻りを確かめるテストもない。出所: `.pi/extensions/consult/run/run.test.ts`, `.pi/extensions/consult/run/subagent.test.ts` の grep（該当なし）
- F8: `subagent.test.ts:91` が `./run.ts` を、`tool/consult.test.ts:37` が `../run/subagent.ts` をモックする。`subagentEnv(policy)` は `CONSULT_TURNS` と `CONSULT_POLICY` だけを返し、それを `subagent.test.ts:58` が確かめる。出所: `.pi/extensions/consult/run/subagent.test.ts:58,91`, `.pi/extensions/consult/tool/consult.test.ts:37`, `.pi/extensions/consult/run/subagent.ts:96`

### Scope

- In:
  - failure: `install` の `failed`（`status !== 0`）と、`runPi` の異常終了・停止（`stopped`/`aborted`）の扱いを変えない。プロセス起動そのものの失敗（`error`）の扱いも保つ。
  - structure: 起動経路に、プロセス起動と子の環境を受け取る形を一つ置く。
  - logic: `gitEnv()` の呼び出しを `subagent.ts` から外し、境界で1回読む。`spawn`・`spawnSync` の呼び出しを、受け取った関数に変える。
  - downstream: `run/run.ts`、`run/subagent.ts`、`tool/consult.ts`、`index.ts`（01 の `RuntimeInput` に環境を足す）、テスト（`run.test.ts`、`subagent.test.ts`、`consult.test.ts`）を合わせる。
  - verification: `run/run.test.ts` から `vi.mock('node:child_process')` を外し、偽の `spawn`・`spawnSync` を渡す。`subagent.test.ts` から `vi.mock('./run.ts')` を外せる形にする。
  - release: `scripts/harness-sync/setting.json` の `copy` と `push` に `test/child-process.fixture.ts` を足す（製品にコピーするテストが、存在しないファイルを import しないように）。
- Out:
  - safety: 秘密・権限・公開範囲・個人データに触れない。
  - upstream: `pi` の起動引数、`pnpm`・`npm` のコマンド、`GIT_*` の除去を変えない。
  - result: `RunResult`、`InstallOutcome`、`SubagentResult` の型と値を変えない。
  - existing: 実行中のプロセス・記録・会話ファイルを移さない。
  - cost: 速度・メモリ・起動回数を変えない。
  - expression: 利用者に見える文言を変えない。
  - observability: 記録・ログを変えない。
  - other: なし。

### Decision

- Status: **accepted**
- Main: 起動経路が、プロセス起動と子の環境を値として受け取る。本物の `spawn`・`spawnSync` と `process.env` に触れるのは境界だけになる。（C1, C2, C3, C6）
  - Add:
    - `Spawn` と `SpawnSync` の型（`run/run.ts`）（F1, F2）
    - `LaunchPorts`（`spawn`・`spawnSync`・`env` を1つにした値）（C2, F4）
    - `RuntimeInput.launch`（`LaunchPorts` を運ぶ欄）（C2, F4）
    - `test/child-process.fixture.ts` の偽の子プロセスと `createFakeSpawn()`（F6, F8）
  - Update:
    - `runPi(options, spawn)`、`installDependencies(cwd, spawnSync)`（F1, F2, F3）
    - `runOneSubagent` の引数を1つのオブジェクトにする（F4, F5）
    - `tool/consult.ts` の `runOneSubagent` 呼び出しと `index.ts` の `RuntimeInput`（F5）
    - 3つのテスト（`run.test.ts`、`subagent.test.ts`、`consult.test.ts`）（F6, F7, F8）
  - Drop:
    - `run/subagent.ts` の `gitEnv()` の呼び出しと import（F4）
    - `run/run.ts` の `node:child_process` の import（F1, F2）
    - `run/run.test.ts` の `vi.mock('node:child_process')` と `subagent.test.ts` の `vi.mock('./run.ts')`（F6, F8）
- Secondary: なし
- Policy:
  - Allowed:
    - 境界（`index.ts`）が `gitEnv(process.env)` を1回だけ読むこと（C2, F4）
    - テストが偽の `spawn`・`spawnSync` と決めた env を渡すこと（F6, F8）
  - Forbidden:
    - 既定値付きの `spawn`・`spawnSync` - 渡し忘れると本物の pi や install が静かに走る（C1）
    - `run`・`subagent` のテストでの `vi.mock('node:child_process')` と `vi.mock('./run.ts')` の再導入 - グローバルな差し替えを元に戻すことになる（C5）
    - 新しい `eslint-disable` - `AGENTS.md` の許す四つの場合に当たらない（C4）

#### Details

- 受け取るプロセス起動の型
  ```ts
  import type { ChildProcess } from 'node:child_process';

  /** pi を起動する。差し替えられるように、使う形だけを描く */
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
  ```
- `runOneSubagent` の入力
  ```ts
  /** 起動経路が外から受け取るもの。境界が1回だけ組み立てる */
  export interface LaunchPorts {
    readonly spawn: Spawn;
    readonly spawnSync: SpawnSync;
    /** 子に渡す環境の元。GIT_* は境界で落としてある */
    readonly env: NodeJS.ProcessEnv;
  }

  export interface SubagentInput {
    readonly ctx: ConsultContext;
    readonly options: ConsultOptions;
    readonly job: SubagentJob;
    readonly hooks?: SubagentHooks;
    readonly launch: LaunchPorts;
  }

  export function runOneSubagent(input: SubagentInput): Promise<SubagentResult>;
  ```

### Definition

- `Unit.subagent-consult`(kept): 主な機能（サブエージェントを走らせて結果を扱う）は同じ。変わったのは、起動経路がプロセス起動と環境変数をどこで受け取るかという経路だけ。
- `What`(kept): プロダクトが何であるかは変わらない
- `Who`(kept): 役割とその Does・Needs は変わらない
- `Stack`(kept): 依存するものは変わらない（`node:child_process` はそのまま使う）
