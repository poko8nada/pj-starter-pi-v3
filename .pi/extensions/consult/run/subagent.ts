/**
 * サブエージェント 1 体分の仕事。
 *
 * 実行場所は**メインエージェントが決めた worktree**（`consult_worktree` が作る）。ここでは作らないし、消さない。
 * サブエージェントのセッションは **(worktree, ロール) ごとに 1 つ**（`<root>/<unit>/session-<role>`）。同じ worktree に別のロールを送っても、会話は混ざらない。続きから走らせるかはメインエージェントが決める。
 * コミットは `consult_commit` が分けて行う。道具は retry しない（止まったらメインエージェントが決める）。
 */

import { join } from 'node:path';
import {
  installDependencies,
  runPi,
  runWithFallback,
  type InstallOutcome,
  type RunResult,
} from './run.ts';
import { gitEnv } from '../../../../lib/git-env.mjs';
import { buildPiArgs, joinPrompt, needsIsolation } from '../sub/spec.ts';
import type { ConsultOptions } from '../sub/spec.ts';
import type { TypePolicy } from '../policy/types.ts';
import type { Worktree } from './worktree.ts';
import type { ConsultContext } from '../tool/consult.ts';

/** サブエージェント 1 体分の走らせ方 */
export interface SubagentJob {
  /** サブエージェントへの指示 */
  readonly task: string;
  /** 子の pi に `--name` で渡す印。`buildPiArgs` が argv に載せる */
  readonly token: string;
  readonly signal: AbortSignal | undefined;
  /** 走らせる worktree。隔離するロールでは必須（メインエージェントが `consult_worktree` で作る） */
  readonly worktree?: Worktree;
  /** 同じ worktree の会話の続きから始めるか */
  readonly continueSession?: boolean;
  /** メインエージェントが振った id。塊に載せて、メインエージェントがどのサブエージェントか見分けられるようにする */
  readonly id?: string;
  /** サブエージェントのプロセスが起きた直後に呼ばれる。実行の記録（`run/log.ts`）に pid を書くための口 */
  readonly onStarted?: (pid: number) => void;
}

/** サブエージェント 1 体分の仕事 */
export interface SubagentResult {
  readonly run: RunResult;
  readonly install?: InstallOutcome;
}

interface Prepared {
  readonly cwd: string;
  readonly worktree?: Worktree;
}

/**
 * 実行場所を決める。隔離するかは type の `isolated` が決める（ツールから推測しない）。
 *
 * 隔離するロールに worktree が渡されないのは呼び出し側の誤り。暗黙に作らない。
 */
export function prepare(
  ctx: ConsultContext,
  options: ConsultOptions,
  worktree?: Worktree,
): Prepared {
  if (worktree !== undefined) {
    // メインエージェントが行き先を指した。読むだけのロールもここに来る（残った worktree にレビューを直接送り込め）。
    return { cwd: worktree.path, worktree };
  }
  if (!needsIsolation(options.policy)) {
    return { cwd: ctx.cwd };
  }
  throw new Error(
    `${options.type} writes, so it needs a worktree: make one with consult_worktree and pass its id`,
  );
}

/** サブエージェントのセッションのファイル。(worktree, ロール) ごとに 1 つで、同じパスを指すと続きになる */
export function sessionFile(worktree: Worktree, role: string): string {
  return join(worktree.unitDir, `session-${role}`);
}

/**
 * サブエージェントに渡す環境。メインエージェントが解決した値だけを載せる。
 *
 * 上限は `budget.ts` が、役割の許可は `guard.ts` が読む。どちらもサブエージェントは `types.json` を読まない。
 */
export function subagentEnv(policy: TypePolicy): NodeJS.ProcessEnv {
  return {
    CONSULT_TURNS: String(policy.limits.turns),
    CONSULT_POLICY: JSON.stringify({ paths: policy.paths, bash: policy.bash }),
  };
}

/**
 * サブエージェント 1 体分を走らせる。
 *
 * 候補のモデルを順に試し、全部落ちたら最後にメインエージェントと同じ設定で走る（`runWithFallback`）。
 * 何が残ったかは worktree を見れば分かるので、ここでは何も片付けない。
 */
export async function runOneSubagent(
  ctx: ConsultContext,
  options: ConsultOptions,
  job: SubagentJob,
): Promise<SubagentResult> {
  const { task, signal, worktree, continueSession } = job;
  const prepared = prepare(ctx, options, worktree);
  // 依存を入れる。無いとサブエージェントもフックも何も確かめられない。
  const install = prepared.worktree === undefined ? undefined : installDependencies(prepared.cwd);
  if (install?.kind === 'failed') {
    // 環境の失敗。setup の誤り（設定）とは区別して、このサブエージェントの状態にする。
    throw new Error(`could not install dependencies (${install.command}): ${install.error}`);
  }
  // 続きを使うときだけセッションを指す。指さなければ遣い捨てのサブエージェントになる。
  const sessionPath =
    prepared.worktree !== undefined && continueSession === true
      ? sessionFile(prepared.worktree, options.type)
      : undefined;
  // 候補を順に試す。試行ごとに models を 1 つにした policy を渡す（空ならメインエージェントと同じ）。
  const run = await runWithFallback(options.policy.models, (model) =>
    runPi({
      piArgs: buildPiArgs({
        ...options,
        token: job.token,
        policy: { ...options.policy, models: model === undefined ? [] : [model] },
        ...(sessionPath === undefined ? {} : { sessionPath }),
      }),
      stdin: joinPrompt(task),
      cwd: prepared.cwd,
      signal,
      env: { ...gitEnv(), ...subagentEnv(options.policy) },
      limits: options.policy.limits,
      ...(job.onStarted === undefined ? {} : { onStarted: job.onStarted }),
    }),
  );
  return { run, ...(install === undefined ? {} : { install }) };
}
