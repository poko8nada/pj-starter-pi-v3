/**
 * 走らせて、コミットして、フックに拒否されたらもう 1 回だけ走らせる。
 *
 * 拒否は「検査が通っていない」なので ref にしない（`ref` ができた = 検査を通った、を崩さない）。
 * 2 回目も通らなければ worktree を消さずに残し、親が続きをやれるようにする。理由は `stopped.ts` が外に置く。
 * 子を走らせる所は呼ぶ側が持つ（型ごとの policy、`--continue` の組み立て、中断の口）。
 */
import {
  commitWorktree,
  worktreeGit,
  type CommitOutcome,
  type RunResult,
  type Worktree,
} from './run.ts';
import { writeStopped } from './stopped.ts';

/** 上限。拒否に対する再走は 1 回だけ */
const MAX_ATTEMPTS = 2;

const aborted = (signal: AbortSignal | undefined): boolean => signal?.aborted === true;

/** 2 回目の子に渡す続きの指示。フックの出力をそのまま見せる */
export function continuation(reason: string): string {
  return [
    'Your work is in this worktree. The repository hooks rejected the commit, so nothing is recorded yet.',
    'Fix what they report, in this worktree, and stop when they pass.',
    '',
    'The hooks said:',
    reason,
  ].join('\n');
}

export interface RetryOutcome {
  readonly run: RunResult;
  readonly work: CommitOutcome;
  /** 走らせた回数（1 か 2） */
  readonly attempts: number;
  /** 2 回目も通らなかったときだけ。残した worktree の場所 */
  readonly kept?: string;
  readonly stoppedAt?: string;
  readonly files?: readonly string[];
}

export async function attemptAndCommit(options: {
  readonly label: string;
  readonly worktree: Worktree;
  /** 中断の口。既に中断されていれば、再走はしない */
  readonly signal?: AbortSignal;
  readonly runOnce: (continuation: string | undefined) => Promise<RunResult>;
}): Promise<RetryOutcome> {
  const git = worktreeGit(options.worktree);
  let run = await options.runOnce(undefined);
  let work = commitWorktree(options.label, git);
  let attempts = 1;
  // 拒否への再走は 1 回だけ（上限 2）。中断が来ていれば走らせない（同じ AbortController なので、走らせても止まる）。
  if (!aborted(options.signal) && work.kind === 'failed' && attempts < MAX_ATTEMPTS) {
    attempts += 1;
    run = await options.runOnce(continuation(work.error));
    work = commitWorktree(options.label, git);
  }
  if (work.kind !== 'failed') {
    return { run, work, attempts };
  }
  const files = git(['status', '--porcelain'])
    .stdout.trim()
    .split('\n')
    .filter((line) => line !== '')
    .map((line) => line.slice(3).trim());
  const stoppedAt = new Date().toISOString();
  writeStopped(options.worktree, { reason: work.error, files, attempts, stoppedAt });
  return { run, work, attempts, kept: options.worktree.dir, stoppedAt, files };
}
