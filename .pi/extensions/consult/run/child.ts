/**
 * 子 1 体分の仕事。
 *
 * 実行場所は**親が決めた worktree**（`consult_worktree` が作る）。ここでは作らないし、消さない。
 * 子のセッションは worktree ごとに 1 つ（`<root>/<unit>/session`）。続きから走らせるかは親が決める。
 * コミットは `consult_commit` が分けて行う。道具は retry しない（止まったら親が決める）。
 */

import { join } from 'node:path';
import {
  gitEnv,
  installDependencies,
  runPi,
  runWithFallback,
  type InstallOutcome,
  type RunResult,
} from './run.ts';
import { buildPiArgs, joinPrompt, needsIsolation } from '../child/spec.ts';
import type { ConsultOptions } from '../child/spec.ts';
import type { Worktree } from './worktree.ts';
import type { ConsultContext } from '../tool/consult.ts';

/** 子 1 体分の走らせ方 */
export interface ChildJob {
  /** 子への指示 */
  readonly task: string;
  readonly signal: AbortSignal | undefined;
  /** 走らせる worktree。書き込むロールでは必須（親が `consult_worktree` で作る） */
  readonly worktree?: Worktree;
  /** 同じ worktree の会話の続きから始めるか */
  readonly continueSession?: boolean;
  /** 子のプロセスが起きた直後に呼ばれる。実行の記録（`run/log.ts`）に pid を書くための口 */
  readonly onStarted?: (pid: number) => void;
}

/** 子 1 体分の仕事 */
export interface ChildResult {
  readonly run: RunResult;
  readonly install?: InstallOutcome;
}

interface Prepared {
  readonly cwd: string;
  readonly worktree?: Worktree;
}

/**
 * 実行場所を決める。隔離するかは type の `readOnly` が決める（ツールから推測しない）。
 *
 * 書き込むロールに worktree が渡されないのは呼び出し側の誤り。暗黙に作らない。
 */
export function prepare(
  ctx: ConsultContext,
  options: ConsultOptions,
  worktree?: Worktree,
): Prepared {
  if (worktree !== undefined) {
    // 親が行き先を指した。読むだけのロールもここに来る（残った worktree にレビューを直接送り込め）。
    return { cwd: worktree.path, worktree };
  }
  if (!needsIsolation(options.policy)) {
    return { cwd: ctx.cwd };
  }
  throw new Error(
    `${options.type} writes, so it needs a worktree: make one with consult_worktree and pass its id`,
  );
}

/** 子のセッションのファイル。worktree ごとに 1 つで、同じパスを指すと続きになる */
export function sessionFile(worktree: Worktree): string {
  return join(worktree.root, 'session');
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
  const { task, signal, worktree, continueSession } = job;
  const prepared = prepare(ctx, options, worktree);
  // 依存を入れる。無いと子もフックも何も確かめられない。
  const install = prepared.worktree === undefined ? undefined : installDependencies(prepared.cwd);
  if (install?.kind === 'failed') {
    // 環境の失敗。setup の誤り（設定）とは区別して、この子の状態にする。
    throw new Error(`could not install dependencies (${install.command}): ${install.error}`);
  }
  // 続きを使うときだけセッションを指す。指さなければ遣い捨ての子になる。
  const sessionPath =
    prepared.worktree !== undefined && continueSession === true
      ? sessionFile(prepared.worktree)
      : undefined;
  // 候補を順に試す。試行ごとに models を 1 つにした policy を渡す（空なら親と同じ）。
  const run = await runWithFallback(options.policy.models, (model) =>
    runPi({
      piArgs: buildPiArgs({
        ...options,
        policy: { ...options.policy, models: model === undefined ? [] : [model] },
        ...(sessionPath === undefined ? {} : { sessionPath }),
      }),
      stdin: joinPrompt(undefined, task),
      cwd: prepared.cwd,
      signal,
      env: { ...gitEnv(), CONSULT_TURNS: String(options.policy.limits.turns) },
      limits: options.policy.limits,
      ...(job.onStarted === undefined ? {} : { onStarted: job.onStarted }),
    }),
  );
  return { run, ...(install === undefined ? {} : { install }) };
}
