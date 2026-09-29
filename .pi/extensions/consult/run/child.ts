/**
 * 子 1 体分の仕事。
 *
 * 実行場所を用意し、走らせて、結果を返す。**worktree は消さない**（既定で残る。消すのは `consult_worktree{action: remove}` だけ）。
 * コミットは道具（`consult_commit`）が分けて行うので、ここでは触らない。道具は retry しない（止まったら親が決める）。
 */

import {
  gitEnv,
  installDependencies,
  isGitRepo,
  runPi,
  runWithFallback,
  type InstallOutcome,
  type RunResult,
} from './run.ts';
import { createWorktree, type Worktree } from './worktree.ts';
import { buildPiArgs, joinPrompt, needsIsolation } from '../child/spec.ts';
import { refLabel } from '../tool/render.ts';
import type { ConsultOptions } from '../child/spec.ts';
import type { ConsultContext } from '../tool/consult.ts';

interface Prepared {
  readonly cwd: string;
  readonly worktree?: Worktree;
}

/**
 * 実行場所を用意する。隔離するかは type の `readOnly` が決める（ツールから推測しない）。
 */
export function prepare(ctx: ConsultContext, options: ConsultOptions, id: string): Prepared {
  const base = ctx.cwd;
  if (!needsIsolation(options.policy)) {
    return { cwd: base };
  }
  if (!isGitRepo(base)) {
    // git 管理外では worktree を作れない。書き込むロールを隔離できないまま実ツリーで走らせない。
    throw new Error(
      'this type writes, but the directory is not a git repository. Run inside a repository, or use a read-only type',
    );
  }
  const worktree = createWorktree(base, id);
  return { cwd: worktree.path, worktree };
}

/** 子 1 体分の仕事 */
export interface ChildResult {
  readonly run: RunResult;
  readonly install?: InstallOutcome;
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
 * 候補のモデルを順に試し、全部落ちたら最後に親と同じ設定で走る（`runWithFallback`）。
 * 何が残ったかは worktree を見れば分かるので、ここでは何も片付けない。
 */
export async function runOneChild(
  ctx: ConsultContext,
  options: ConsultOptions,
  job: ChildJob,
): Promise<ChildResult> {
  const { payload, index, signal } = job;
  const prepared = prepare(ctx, options, refLabel(options.type, index));
  // 依存を入れる。無いと子もフックも何も確かめられない。
  const install = prepared.worktree === undefined ? undefined : installDependencies(prepared.cwd);
  if (install?.kind === 'failed') {
    // 環境の失敗。setup の誤り（設定）とは区別して、この子の状態にする。
    throw new Error(`could not install dependencies (${install.command}): ${install.error}`);
  }
  // 候補を順に試す。試行ごとに models を 1 つにした policy を渡す（空なら親と同じ）。
  const run = await runWithFallback(options.policy.models, (model) =>
    runPi({
      piArgs: buildPiArgs({
        ...options,
        policy: { ...options.policy, models: model === undefined ? [] : [model] },
      }),
      stdin: joinPrompt(payload, options.task),
      cwd: prepared.cwd,
      signal,
      env: gitEnv(),
      limits: options.policy.limits,
    }),
  );
  return { run, ...(install === undefined ? {} : { install }) };
}
