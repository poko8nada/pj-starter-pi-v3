/**
 * 子 1 体分の仕事。
 *
 * 実行場所の用意から、走らせて、コミットし、後片付けするところまで。中断でも例外でも片付ける。
 * 2 回目も通らなかった worktree は消さずに残す（親が続きをやれるように。記録は `retry.ts` が外に置く）。
 */
import {
  createWorktree,
  gitEnv,
  installDependencies,
  isGitRepo,
  removeWorktree,
  runPi,
  runWithFallback,
  type CommitOutcome,
  type InstallOutcome,
  type RunResult,
  type Worktree,
} from './run.ts';
import { attemptAndCommit, type RetryOutcome } from './retry.ts';
import { buildPiArgs, joinPrompt, needsIsolation } from '../child/spec.ts';
import { refLabel } from '../tool/render.ts';
import type { ConsultOptions } from '../child/spec.ts';
import type { ConsultContext } from '../tool/consult.ts';

interface Prepared {
  readonly cwd: string;
  readonly worktree?: Worktree;
}

/**
 * 実行場所を用意する。payload は読み終わっている前提。隔離するかは type の `environment` が決める（ツールから推測しない）。
 */
export function prepare(ctx: ConsultContext, options: ConsultOptions): Prepared {
  const base = ctx.cwd;
  if (!needsIsolation(options.policy)) {
    return { cwd: base };
  }
  if (!isGitRepo(base)) {
    // git 管理外では worktree を作れない。隔離できないまま実ツリーで書かせない。
    throw new Error(
      'this type needs isolation but the directory is not a git repository. Use a type whose environment is "tree", or run inside a repository',
    );
  }
  const worktree = createWorktree(base);
  return { cwd: worktree.dir, worktree };
}

/** 子 1 体分の仕事。work は書き込む type のときだけ入る */
export interface ChildResult {
  readonly run: RunResult;
  readonly install?: InstallOutcome;
  readonly work?: CommitOutcome;
  readonly retry?: RetryOutcome;
}

/** 子 1 体分の走らせ方 */
export interface ChildJob {
  readonly payload: string | undefined;
  readonly index: number;
  readonly signal: AbortSignal | undefined;
}

/**
 * 子 1 体分を走らせる。
 *
 * worktree の用意から後片付けまでを 1 つにまとめる。中断でも例外でも片付ける。
 */
export async function runOneChild(
  ctx: ConsultContext,
  options: ConsultOptions,
  job: ChildJob,
): Promise<ChildResult> {
  const { payload, index, signal } = job;
  // 子ごとに用意する。隔離する type なら、子ごとに別の worktree になる。
  const prepared = prepare(ctx, options);
  // 2 回目も通らなかった worktree は、親が続きをやれるように残す（後片付けで消さない）
  let keepsWorktree = false;
  try {
    // 依存を入れる。無いと子もフックも何も確かめられない。
    const install =
      prepared.worktree === undefined ? undefined : installDependencies(prepared.worktree);
    if (install?.kind === 'failed') {
      // 環境の失敗。setup の誤り（設定）とは区別して、この子の状態にする。
      throw new Error(`could not install dependencies (${install.command}): ${install.error}`);
    }
    // 候補を順に試す。試行ごとに models を 1 つにした policy を渡す（空なら親と同じ）。
    const runOnce = (note: string | undefined) =>
      runWithFallback(options.policy.models, (model) =>
        runPi({
          piArgs: [
            ...buildPiArgs({
              ...options,
              policy: { ...options.policy, models: model === undefined ? [] : [model] },
            }),
            ...(note === undefined ? [] : ['--continue']),
          ],
          stdin:
            note === undefined
              ? joinPrompt(payload, options.task)
              : joinPrompt(payload, `${options.task}\n\n${note}`),
          cwd: prepared.cwd,
          signal,
          env: gitEnv(),
          limits: options.policy.limits,
        }),
      );
    // 書き込む type は、子が残した変更をコミットして ref にする。フックに拒否されたら、同じ worktree でもう 1 回だけ走らせる。
    const retry =
      prepared.worktree === undefined
        ? undefined
        : await attemptAndCommit({
            label: refLabel(options.type, index),
            worktree: prepared.worktree,
            runOnce,
          });
    keepsWorktree = retry?.kept !== undefined;
    const run = retry === undefined ? await runOnce(undefined) : retry.run;
    const work = retry?.work;
    return {
      run,
      ...(install === undefined ? {} : { install }),
      ...(work === undefined ? {} : { work }),
      ...(retry === undefined ? {} : { retry }),
    };
  } finally {
    // 中断でも例外でも片付ける。ただし 2 回目も通らなかった worktree は残す。記録は `run/retry.ts` が外に置く。
    if (prepared.worktree !== undefined && !keepsWorktree) {
      removeWorktree(prepared.worktree);
    }
  }
}
