/**
 * 子 pi の起動と後片付け。
 *
 * 中断への備えがこのファイルの主な仕事。ツールとして呼ばれると AbortSignal が渡されるので、それに合わせて子プロセスを殺す。CLI 版は SIGINT で finally が走らず worktree を残した。
 */

import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { accountEvent, parseEvents, ranFrom, type Spent } from '../child/spec.ts';
import type { Limits } from '../policy/types.ts';

const KILL_GRACE_MS = 5000;

/**
 * git を起動するときの環境。
 *
 * フック（lefthook など）の中で走ると、`GIT_INDEX_FILE` のような変数が process.env に載っている。そのまま渡すと、`cwd` で指定したリポジトリではなくフックのリポジトリを見てしまう（`.git/index: index file open failed: Not a directory` になった）。git は `cwd` と自分の探索で解決させる。
 */
export function gitEnv(env: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
  const cleaned: NodeJS.ProcessEnv = {};
  for (const [key, value] of Object.entries(env)) {
    if (!key.startsWith('GIT_')) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/** git リポジトリの中で実行しているか。worktree を作れるかの判定 */
export function isGitRepo(cwd: string): boolean {
  const result = spawnSync('git', ['rev-parse', '--git-dir'], {
    cwd,
    encoding: 'utf8',
    env: gitEnv(),
  });
  return result.status === 0;
}

/**
 * payload を読む。読めない入力は例外にする（道具の失敗として呼び出し側が伝える）。
 *
 * existsSync で先に確かめると「無いときだけ undefined」になり、文脈を渡したつもりで空の子が走る。ディレクトリも通ってしまう。
 */
export function readPayload(input: string, cwd: string): string {
  const file = isAbsolute(input) ? input : join(cwd, input);
  try {
    return readFileSync(file, 'utf8');
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`could not read the input file: ${file} (${detail})`, { cause: error });
  }
}

export interface RunResult {
  readonly stdout: string;
  readonly stderr: string;
  readonly code: number;
  /** 上限に達して止めた場合の理由 */
  readonly stopped?: string;
  /** 中断されたか */
  readonly aborted: boolean;
  /** `agent_end` を見たか（報告の後に終わらない子を止めた印） */
  readonly ended: boolean;
  /** 子のプロセス。走っている子を外から見分けるための印 */
  readonly pid?: number;
}

export interface RunOptions {
  readonly piArgs: readonly string[];
  /** 子の標準入力に流す本文。指示を argv に載せないための口 */
  readonly stdin: string;
  readonly cwd: string;
  readonly signal?: AbortSignal;
  readonly env: NodeJS.ProcessEnv;
  /**
   * 上限。type が決める。
   *
   * 子のプロセス 1 回ごとに数え直す。続けて走らせた分（拒否や打ち切りのあとの再走）は、合計でその回数だけ上限を使う。
   */
  readonly limits: Limits;
  /** 子のプロセスが起きた直後の口。記録を先に書きたい呼び出し側が使う */
  readonly onStarted?: (pid: number) => void;
  /** `agent_end` の後の猶予。静かなら子を止める（既定 30 秒） */
  readonly watchdogMs?: number;
  /** 進行の通知。子の出力が届くたびに呼ぶ */
  readonly onProgress?: (chunk: {
    readonly stream: 'stdout' | 'stderr';
    readonly text: string;
  }) => void;
  /** 完了のフック。待たずに結果を受け取る口で、返す promise より先に呼ぶ */
  readonly onDone?: (result: RunResult) => void;
}

/**
 * 試すモデルの並び。候補の後ろに「親と同じ」（`--model` を渡さない）を足す。候補が空でも 1 つは試す。
 */
export function modelAttempts(models: readonly string[]): (string | undefined)[] {
  return [...models, undefined];
}

/**
 * 候補を順に試す。
 *
 * 子が何も生成せずに終わったら、次の候補でやり直す。モデルが使えなかった（ID が無い、鍵が無い、レート制限）のか、タスクが失敗したのかを、生成の有無で分ける。喋ってから失敗したならタスクの問題なので乗り換えない。1 回目の失敗はトークンを消費しないので、乗り換えの費用はほぼ無い。
 *
 * 中断は乗り換えない。止めたのに別のモデルで走り直すのは逆。候補を使い切ったら、最後に親と同じ設定で走る。
 */
export async function runWithFallback(
  models: readonly string[],
  runOnce: (model: string | undefined) => Promise<RunResult>,
): Promise<RunResult> {
  const attempts = modelAttempts(models);

  // 再帰にする。並列にはできない（次の試行は前の結果で決まる）ので、ループにすると「待つのは意図的」という抑制コメントが要る。
  async function tryAt(index: number): Promise<RunResult> {
    const run = await runOnce(attempts[index]);
    const next = index + 1;
    // 最後の試行（親と同じ）はどのみち返す。
    if (next >= attempts.length || run.aborted || ranFrom(parseEvents(run.stdout))) {
      return run;
    }
    return tryAt(next);
  }

  return tryAt(0);
}

/**
 * 複数の payload を先に全部読む。
 *
 * 1 つでも読めなければ投げる。子を起動してから「2 つ目が読めない」と分かっても、1 体目はもう走っている。setup の誤りは、走らせる前に落とす。
 */
export function readPayloads(inputs: readonly string[], cwd: string): string[] {
  return inputs.map((input) => readPayload(input, cwd));
}

/** 入力ごとの結果。失敗も状態として持つ（投げない） */
export type InputOutcome<R> =
  | { readonly ok: true; readonly value: R }
  | { readonly ok: false; readonly error: string };

/**
 * 入力ごとに 1 体走らせる。
 *
 * 子は互いに独立なので並列に走らせる。結果は入力の順で返すので、待ち時間だけが縮む。1 体の失敗はその 1 体の状態にする（「実行中の失敗は投げない」の実装）。
 */
export async function runForInputs<T, R>(
  inputs: readonly T[],
  runOne: (input: T, index: number) => Promise<R>,
): Promise<InputOutcome<R>[]> {
  // コールバックを async で包む。包まないと、コールバックが**同期で**投げたときに入力の map がそこで止まり、
  // この関数ごと棄却される（1 つの入力の失敗が他を巻き込む。2026-09-24 の実演で踏んだ）。
  const settled = await Promise.allSettled(
    inputs.map(async (input, index) => runOne(input, index)),
  );
  return settled.map((entry) =>
    entry.status === 'fulfilled'
      ? { ok: true, value: entry.value }
      : {
          ok: false,
          error: entry.reason instanceof Error ? entry.reason.message : String(entry.reason),
        },
  );
}

/** worktree に初手で走らせるコマンド。lockfile で決める */
export function installCommand(dir: string): readonly string[] | undefined {
  if (existsSync(join(dir, 'pnpm-lock.yaml'))) {
    return ['pnpm', 'install', '--frozen-lockfile'];
  }
  if (existsSync(join(dir, 'package-lock.json'))) {
    return ['npm', 'ci'];
  }
  return undefined;
}

/** 依存を入れた結果。失敗しても投げない（その子の状態として返す） */
export type InstallOutcome =
  | { readonly kind: 'none' }
  | { readonly kind: 'ok'; readonly command: string }
  | { readonly kind: 'failed'; readonly command: string; readonly error: string };

/**
 * worktree に依存を入れる。
 *
 * 入っていない worktree では、子もフックも何も確かめられない。worktree の用意の一部であって、子の仕事ではない。失敗は環境の失敗で、設定の誤りではない。
 */
export function installDependencies(cwd: string): InstallOutcome {
  const command = installCommand(cwd);
  if (command === undefined) {
    return { kind: 'none' };
  }
  const [file, ...args] = command;
  if (file === undefined) {
    return { kind: 'none' };
  }
  const result = spawnSync(file, args, { cwd, encoding: 'utf8' });
  const label = command.join(' ');
  if (result.status !== 0) {
    const detail = (result.stderr || result.error?.message || '').trim();
    return { kind: 'failed', command: label, error: detail };
  }
  return { kind: 'ok', command: label };
}

/** git 1 回分の出力。起動そのものを受け取るので、テストで差し替えられる */
export interface GitOutput {
  readonly status: number;
  readonly stdout: string;
  readonly stderr: string;
}

export type GitRun = (args: readonly string[]) => GitOutput;

/**
 * 子が触ったファイル。worktree の git が言う分だけ（読んだだけのファイルは入らない）。
 *
 * 親に渡す塊に入れるのはパスだけ。diff は運ばない。
 */
export function changedFiles(git: GitRun): string[] {
  return git(['status', '--porcelain'])
    .stdout.split('\n')
    .map((line) => line.slice(3).trim())
    .filter((path) => path !== '');
}

/** 本番の git。worktree の中で走らせる */
export function worktreeGit(path: string): GitRun {
  return (args) => {
    const result = spawnSync('git', [...args], {
      cwd: path,
      encoding: 'utf8',
      env: gitEnv(),
    });
    return {
      status: result.status ?? 1,
      stdout: result.stdout ?? '',
      stderr: result.stderr ?? result.error?.message ?? '',
    };
  };
}

/** 子の起動オプション。stdio を文字列の組で書くことで、`spawn` の「3 本とも pipe」の形に当たる */
export interface PiSpawnOptions {
  readonly cwd: string;
  readonly env: NodeJS.ProcessEnv;
  readonly stdio: ['pipe', 'pipe', 'pipe'];
  readonly detached: true;
}

/**
 * 子の起動オプション。
 *
 * `detached: true` が要る: pi のプロセスが落ちても子は走り続け、残った作業は worktree に残る（完了の
 * 知らせは届かないが、記録を読めば分かる）。
 */
export function spawnOptions(cwd: string, env: NodeJS.ProcessEnv): PiSpawnOptions {
  return { cwd, env, stdio: ['pipe', 'pipe', 'pipe'], detached: true };
}

/**
 * 子を 1 回起動する。
 *
 * 中断（signal）で子を殺し、呼び出し側が後片付けできるように aborted を返す。上限は届いた行ごとに数え、超えた時点で殺す（終わってからでは遅い）。
 */
/** 子を殺す。SIGTERM を無視する子がいるので、猶予の後に強制終了する */
function killChild(child: ReturnType<typeof spawn>): void {
  child.kill('SIGTERM');
  setTimeout(() => {
    if (!child.killed) {
      child.kill('SIGKILL');
    }
  }, KILL_GRACE_MS).unref();
}

/** 走行中の状態。届いた行を数え、上限と中断を見る */
export interface RunState {
  stdout: string;
  stderr: string;
  buffered: string;
  stopped?: string;
  aborted: boolean;
  readonly spent: Spent;
  readonly limits: Limits;
  /** `agent_end` を見た時刻。来ていなければ空 */
  endedAt?: number;
  /** 最後に出力があった時刻。初期値は起動の時刻 */
  lastOutputAt: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 1 イベントを state に反映する純関数。子の停止はしない。
 *
 * 壊れた入力（record でない物）は無視する。上限で止まった後のイベントは数えない。
 * `agent_end`（`type === 'agent_end'`）を見たら `endedAt` を入れる。有効なイベントのたびに `lastOutputAt` を進める。
 */
export function applyEvent(state: RunState, event: unknown, now: number): void {
  if (state.stopped !== undefined) {
    return;
  }
  if (!isRecord(event)) {
    return;
  }
  state.lastOutputAt = now;
  if (event.type === 'agent_end') {
    if (state.endedAt === undefined) {
      state.endedAt = now;
    }
    return;
  }
  const reason = accountEvent(state.spent, event, state.limits);
  if (reason === undefined) {
    return;
  }
  state.stopped = reason;
}

/**
 * 静かになった子を止めてよいか。`agent_end` があり、`lastOutputAt` から `quietMs` 静かなら true。
 *
 * 猶予ちょうど（`now - lastOutputAt === quietMs`）は true。
 */
export function watchdogDue(
  endedAt: number | undefined,
  lastOutputAt: number,
  now: number,
  quietMs: number,
): boolean {
  if (endedAt === undefined) {
    return false;
  }
  return now - lastOutputAt >= quietMs;
}

/** 1 行を数える。上限を超えたら理由を記録し、子を殺す */
function consumeLine(
  line: string,
  state: RunState,
  child: ReturnType<typeof spawn>,
  now: number,
): void {
  if (line.trim() === '') {
    return;
  }
  if (state.stopped !== undefined) {
    return;
  }
  let event: unknown;
  try {
    event = JSON.parse(line);
  } catch {
    return; // 解析できない行はイベントではない。
  }
  applyEvent(state, event, now);
  if (state.stopped === undefined) {
    return;
  }
  killChild(child);
}

const DEFAULT_WATCHDOG_MS = 30000;

/** 起動直後の状態。`lastOutputAt` は起動の時刻。 */
function initialRunState(limits: Limits, startedAt: number): RunState {
  return {
    stdout: '',
    stderr: '',
    buffered: '',
    aborted: false,
    spent: { turns: 0, output: 0 },
    limits,
    lastOutputAt: startedAt,
  };
}

/** 終了の塊。`ended` は `agent_end` を見たか。 */
function runOutcome(state: RunState, ending: { code: number; pid?: number }): RunResult {
  return {
    stdout: state.stdout,
    stderr: state.stderr,
    code: ending.code,
    stopped: state.stopped,
    aborted: state.aborted,
    ended: state.endedAt !== undefined,
    ...(ending.pid === undefined ? {} : { pid: ending.pid }),
  };
}

/** 走っている子と見張りの時計。`settled` が立ったら何もしない。 */
interface LiveRun {
  readonly state: RunState;
  readonly child: ReturnType<typeof spawn>;
  readonly quietMs: number;
  readonly onProgress?: RunOptions['onProgress'];
  settled: boolean;
  watchdog?: NodeJS.Timeout;
}

/** 見張りの時計を止める。無ければ何もしない。 */
function clearWatchdog(live: LiveRun): void {
  if (live.watchdog === undefined) {
    return;
  }
  clearTimeout(live.watchdog);
  live.watchdog = undefined;
}

/** `agent_end` の後だけ時計を動かす。出力が来たら呼び直して戻す。 */
function armWatchdog(live: LiveRun): void {
  clearWatchdog(live);
  if (live.state.endedAt === undefined) {
    return;
  }
  if (live.settled) {
    return;
  }
  live.watchdog = setTimeout(() => {
    live.watchdog = undefined;
    if (live.settled) {
      return;
    }
    const now = Date.now();
    if (!watchdogDue(live.state.endedAt, live.state.lastOutputAt, now, live.quietMs)) {
      armWatchdog(live);
      return;
    }
    killChild(live.child);
  }, live.quietMs);
}

/** stdout の届きを足し、行を数え、時計を戻す。 */
function consumeStdout(live: LiveRun, input: { text: string; now: number }): void {
  live.state.stdout += input.text;
  live.state.buffered += input.text;
  live.state.lastOutputAt = input.now;
  live.onProgress?.({ stream: 'stdout', text: input.text });
  const lines = live.state.buffered.split('\n');
  live.state.buffered = lines.pop() ?? '';
  for (const line of lines) {
    consumeLine(line, live.state, live.child, input.now);
  }
  armWatchdog(live);
}

/** stderr の届きを足す。見張りの時計は触らない。 */
function appendStderr(live: LiveRun, text: string): void {
  live.state.stderr += text;
  live.onProgress?.({ stream: 'stderr', text });
}

/** 終了を 1 回だけ配る。2 回目は捨てる。 */
function finishLive(
  live: LiveRun,
  input: {
    code: number;
    signal?: AbortSignal;
    onAbort: () => void;
    onDone?: RunOptions['onDone'];
    settle: (result: RunResult) => void;
  },
): void {
  if (live.settled) {
    return;
  }
  live.settled = true;
  clearWatchdog(live);
  input.signal?.removeEventListener('abort', input.onAbort);
  const outcome = runOutcome(live.state, { code: input.code, pid: live.child.pid });
  input.onDone?.(outcome);
  input.settle(outcome);
}

export function runPi(options: RunOptions): Promise<RunResult> {
  return new Promise((settle) => {
    const child = spawn('pi', [...options.piArgs], spawnOptions(options.cwd, options.env));
    const live: LiveRun = {
      state: initialRunState(options.limits, Date.now()),
      child,
      quietMs: options.watchdogMs ?? DEFAULT_WATCHDOG_MS,
      ...(options.onProgress === undefined ? {} : { onProgress: options.onProgress }),
      settled: false,
    };
    const onAbort = () => {
      live.state.aborted = true;
      killChild(child);
    };
    const finish = (code: number) => {
      finishLive(live, {
        code,
        signal: options.signal,
        onAbort,
        onDone: options.onDone,
        settle,
      });
    };
    if (child.pid !== undefined) {
      options.onStarted?.(child.pid);
    }
    if (options.signal?.aborted === true) {
      live.state.aborted = true;
      killChild(child);
    } else {
      options.signal?.addEventListener('abort', onAbort, { once: true });
    }
    child.stdout.on('data', (chunk: Buffer) => {
      consumeStdout(live, { text: chunk.toString(), now: Date.now() });
    });
    child.stderr.on('data', (chunk: Buffer) => {
      appendStderr(live, chunk.toString());
    });
    child.on('error', (error: Error) => {
      live.state.stderr += error.message;
      finish(1);
    });
    child.on('close', (code: number | null) => {
      finish(code ?? 0);
    });
    child.stdin.end(options.stdin);
  });
}

/** 行単位の出力を、行の切れ目を保ったまま繋ぐ。詰めると最後の行が壊れる */

/** 子の終わり方。理由は done のときだけ無い */
export type ChildState = 'done' | 'turn-limit' | 'error' | 'aborted';

/**
 * 走り終えた子がどう終わったか。
 *
 * `aborted`（親が止めた）を先に見る。止めたときに上限の印も立っていることがあり、それは理由にならない。
 * `ended`（`agent_end` を見た）は `done` にする。報告の後に子が終わらなくても、本文は配達できる。
 */
export function stateOf(run: RunResult): ChildState {
  if (run.aborted) {
    return 'aborted';
  }
  if (run.ended) {
    return 'done';
  }
  if (run.stopped !== undefined) {
    return 'turn-limit';
  }
  return run.code === 0 ? 'done' : 'error';
}

/** 終わり方に添える理由。done なら undefined（出す必要がない） */
export function reasonOf(run: RunResult): string | undefined {
  if (run.aborted) {
    return 'stopped by the parent';
  }
  if (run.ended) {
    return undefined;
  }
  if (run.stopped !== undefined) {
    return run.stopped;
  }
  if (run.code === 0) {
    return undefined;
  }
  const line = run.stderr.split('\n').find((entry) => entry.trim() !== '');
  return line === undefined ? `exit ${run.code}` : line.trim();
}
