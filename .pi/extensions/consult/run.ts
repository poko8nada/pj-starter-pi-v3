/**
 * 子 pi の起動と後片付け。
 *
 * 中断への備えがこのファイルの主な仕事。ツールとして呼ばれると
 * AbortSignal が渡されるので、それに合わせて子プロセスを殺す。
 * CLI 版は SIGINT で finally が走らず worktree を残した。
 */

import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { isAbsolute, join } from 'node:path';
import { accountEvent, type Spent } from './spec.ts';
import type { Limits } from './types.ts';

const KILL_GRACE_MS = 5000;

export interface Worktree {
  readonly parent: string;
  readonly dir: string;
  readonly cwd: string;
}

/** git リポジトリの中で実行しているか。worktree を作れるかの判定 */
export function isGitRepo(cwd: string): boolean {
  const result = spawnSync('git', ['rev-parse', '--git-dir'], { cwd, encoding: 'utf8' });
  return result.status === 0;
}

/** リポジトリ外に一時 worktree を作る。中に置くと git が埋め込みリポジトリと見なす */
export function createWorktree(cwd: string, from = 'HEAD'): Worktree {
  const parent = mkdtempSync(join(tmpdir(), 'consult-'));
  const dir = join(parent, 'wt');
  const result = spawnSync('git', ['worktree', 'add', '--detach', dir, from], {
    cwd,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    rmSync(parent, { recursive: true, force: true });
    throw new Error(
      `could not create a worktree: ${(result.stderr || result.error?.message || '').trim()}`,
    );
  }
  return { parent, dir, cwd };
}

/** 登録を消してからディレクトリを消す。順序を逆にすると登録が残る */
export function removeWorktree(handle: Worktree): void {
  spawnSync('git', ['worktree', 'remove', '--force', handle.dir], {
    cwd: handle.cwd,
    encoding: 'utf8',
  });
  rmSync(handle.parent, { recursive: true, force: true });
}

/**
 * payload を読む。読めない入力は例外にする（道具の失敗として呼び出し側が伝える）。
 *
 * existsSync で先に確かめると「無いときだけ undefined」になり、
 * 文脈を渡したつもりで空の子が走る。ディレクトリも通ってしまう。
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
}

export interface RunOptions {
  readonly piArgs: readonly string[];
  readonly cwd: string;
  readonly payload?: string;
  readonly signal?: AbortSignal;
  readonly env: NodeJS.ProcessEnv;
  /** 上限。type が決める */
  readonly limits: Limits;
}

/**
 * 子を 1 回起動する。
 *
 * 中断（signal）で子を殺し、呼び出し側が後片付けできるように aborted を返す。
 * 上限は届いた行ごとに数え、超えた時点で殺す（終わってからでは遅い）。
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
interface RunState {
  stdout: string;
  stderr: string;
  buffered: string;
  stopped?: string;
  aborted: boolean;
  readonly spent: Spent;
  readonly limits: Limits;
}

/** 1 行を数える。上限を超えたら理由を記録し、子を殺す */
function consumeLine(line: string, state: RunState, child: ReturnType<typeof spawn>): void {
  if (line.trim() === '' || state.stopped !== undefined) {
    return;
  }
  let event: unknown;
  try {
    event = JSON.parse(line);
  } catch {
    return; // 解析できない行はイベントではない。
  }
  const reason = accountEvent(state.spent, event, state.limits);
  if (reason !== undefined) {
    state.stopped = reason;
    killChild(child);
  }
}

export function runPi(options: RunOptions): Promise<RunResult> {
  return new Promise((settle) => {
    const child = spawn('pi', [...options.piArgs], {
      cwd: options.cwd,
      env: options.env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const state: RunState = {
      stdout: '',
      stderr: '',
      buffered: '',
      aborted: false,
      spent: { turns: 0, output: 0 },
      limits: options.limits,
    };
    let settled = false;

    const onAbort = () => {
      state.aborted = true;
      killChild(child);
    };

    const finish = (code: number) => {
      if (settled) {
        return;
      }
      settled = true;
      options.signal?.removeEventListener('abort', onAbort);
      settle({
        stdout: state.stdout,
        stderr: state.stderr,
        code,
        stopped: state.stopped,
        aborted: state.aborted,
      });
    };

    // 中断が既に来ていれば即座に止める。来たら子を殺す。
    if (options.signal?.aborted === true) {
      state.aborted = true;
    } else {
      options.signal?.addEventListener('abort', onAbort, { once: true });
    }

    child.stdout.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      state.stdout += text;
      state.buffered += text;
      const lines = state.buffered.split('\n');
      state.buffered = lines.pop() ?? '';
      for (const line of lines) {
        consumeLine(line, state, child);
      }
    });
    child.stderr.on('data', (chunk: Buffer) => {
      state.stderr += chunk.toString();
    });
    child.on('error', (error: Error) => {
      state.stderr += error.message;
      finish(1);
    });
    child.on('close', (code: number | null) => {
      finish(code ?? 0);
    });

    if (options.payload === undefined) {
      child.stdin.end();
    } else {
      child.stdin.end(options.payload);
    }
  });
}
