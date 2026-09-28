/**
 * 走らせて、コミットして、止められたらもう 1 回だけ走らせる。
 *
 * 拒否は「検査が通っていない」なので ref にしない（`ref` ができた = 検査を通った、を崩さない）。上限で
 * 打ち切られた子も、同じ worktree・`--continue` でもう 1 回だけ続きを走らせる。上限で止まった回の仕事は
 * 途中なのでコミットせず、続きの結果と合わせて 1 回だけコミットする（ref を途中の姿にしない）。
 *
 * 再走はどちらの理由でも 1 回だけ。2 回目も通らなければ worktree を消さずに残し、親が続きをやれるように
 * する。理由は `stopped.ts` が外に置く。
 *
 * 上限（`limits`）は子のプロセス 1 回ごとに数え直すので、2 回走れば合計でその回数だけ上限を使う。使用量は
 * `combineRuns` が走らせた回数分を足し合わせ、1 回分として親に報告する。
 *
 * 子を走らせる所は呼ぶ側が持つ（型ごとの policy、`--continue` の組み立て、中断の口）。
 */
import {
  combineRuns,
  commitWorktree,
  worktreeGit,
  type CommitOutcome,
  type RunResult,
  type Worktree,
} from './run.ts';
import { writeStopped } from './stopped.ts';

/** 上限。拒否や打ち切りに対する再走は 1 回だけ */
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

/** 上限で止まった子に渡す続きの指示。仕事が途中で切れたことを伝える */
export function limitContinuation(reason: string): string {
  return [
    'Your last run was stopped at the limit before the work was finished, so what is in this worktree is incomplete.',
    'Continue the work from where you stopped, in this worktree, and stop when it is done.',
    '',
    'The limit said:',
    reason,
  ].join('\n');
}

export interface RetryOutcome {
  readonly run: RunResult;
  readonly work: CommitOutcome;
  /** 走らせた回数（1 か 2） */
  readonly attempts: number;
  /** 続きの子を走らせたか（2 回目があるか） */
  readonly continued: boolean;
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
  const runs: RunResult[] = [];
  const next = async (note: string | undefined): Promise<RunResult> => {
    const run = await options.runOnce(note);
    runs.push(run);
    return run;
  };
  let run = await next(undefined);
  let attempts = 1;
  let continued = false;
  // 上限で止まっただけなら、コミットせずに続きを走らせる（途中の仕事を ref にしない）。
  // 中断が来ていれば走らせない（同じ AbortController なので、走らせても止まる）。
  if (run.stopped !== undefined && attempts < MAX_ATTEMPTS && !aborted(options.signal)) {
    attempts += 1;
    continued = true;
    run = await next(limitContinuation(run.stopped));
  }
  let work = commitWorktree(options.label, git);
  // 拒否されたら、フックの出力を見せてもう 1 回だけ走らせる。中断が来ていれば走らせない。
  if (!aborted(options.signal) && work.kind === 'failed' && attempts < MAX_ATTEMPTS) {
    attempts += 1;
    continued = true;
    run = await next(continuation(work.error));
    work = commitWorktree(options.label, git);
  }
  // 走らせた回数分の使用量を足して 1 回分にする。止まったのは最後の回だけ見る。
  const merged = combineRuns(runs);
  if (work.kind !== 'failed') {
    return { run: merged, work, attempts, continued };
  }
  const files = git(['status', '--porcelain'])
    .stdout.trim()
    .split('\n')
    .filter((line) => line !== '')
    .map((line) => line.slice(3).trim());
  const stoppedAt = new Date().toISOString();
  writeStopped(options.worktree, { reason: work.error, files, attempts, stoppedAt });
  return { run: merged, work, attempts, continued, kept: options.worktree.dir, stoppedAt, files };
}
