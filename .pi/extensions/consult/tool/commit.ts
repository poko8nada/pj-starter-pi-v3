/**
 * consult_commit — worktree の子の仕事を、その worktree のブランチにコミットする道具。
 *
 * 親は id だけで呼べる（tmp のパスは道具が解決する）。メッセージはここで型を作る
 * （`consult(<unit>): the child's work`）。引数でメッセージを渡す道は作らない。型が崩れると、あとから
 * `git log` で unit を数えられなくなる。
 *
 * merge はここではしない。親のブランチへ取り込むのは CLI の仕事（境界: 親のディレクトリで完結する物は
 * CLI、tmp のパスが要る物は道具）。
 *
 * フックが拒んだ場合は `rejected` とその出力を返し、**作業は worktree に残す**（消さない）。
 */

import type {
  AgentToolResult,
  AgentToolUpdateCallback,
  ExtensionContext,
} from '@earendil-works/pi-coding-agent';
import { Type } from 'typebox';
import type { Static } from 'typebox';
import { changedFiles, worktreeGit, type GitRun } from '../run/run.ts';
import { findWorktree } from '../run/worktree.ts';

/** 道具のパラメータ。worktree の id だけ */
export const PARAMETERS = Type.Object({
  worktree: Type.String({
    description: 'The unit id of the worktree to commit (the one consult_worktree made)',
  }),
});

type Params = Static<typeof PARAMETERS>;

/** pi が渡す引数。位置で渡される 5 つを 1 つのタプルにまとめる */
type ExecuteArgs = [
  toolCallId: string,
  params: Params,
  signal: AbortSignal | undefined,
  onUpdate: AgentToolUpdateCallback<unknown> | undefined,
  ctx: ExtensionContext,
];

/** 知らない引数のときに添える使い方 */
export const USAGE = 'consult_commit: worktree is required (the unit id)';

/** 道具の戻り値。details は必須なので、必ず埋める */
function result(
  text: string,
  details: Record<string, unknown> = {},
): AgentToolResult<Record<string, unknown>> {
  return { content: [{ type: 'text', text }], details };
}

/** コミットの中身。3 つのどれか */
export type CommitResult =
  | { readonly kind: 'no-change' }
  | { readonly kind: 'committed'; readonly hash: string }
  | { readonly kind: 'rejected'; readonly output: string };

/** メッセージの型。引数からは作らない */
export function commitMessage(id: string): string {
  return `consult(${id}): the child's work`;
}

/** 引数を検証する。知らない形は使い方つきで投げる */
export function parseCommitRequest(raw: unknown): string {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error(`consult_commit: the arguments are not an object. ${USAGE}`);
  }
  const { worktree } = raw as { worktree?: unknown };
  if (typeof worktree !== 'string' || worktree.trim() === '') {
    throw new Error(`consult_commit: worktree must be the unit id. ${USAGE}`);
  }
  return worktree;
}

/**
 * worktree でコミットする。
 *
 * 変更が無ければ `no-change`。フックが拒んだら `rejected` とその出力を返し、`add` した分も含めて作業は
 * そのまま残す（`git reset` で戻さない。親が中身を見て決められるように）。
 */
export function commitInWorktree(git: GitRun, id: string): CommitResult {
  if (changedFiles(git).length === 0) {
    return { kind: 'no-change' };
  }
  git(['add', '-A']);
  const committed = git(['commit', '-m', commitMessage(id)]);
  if (committed.status !== 0) {
    return { kind: 'rejected', output: (committed.stderr || committed.stdout).trim() };
  }
  return { kind: 'committed', hash: git(['rev-parse', 'HEAD']).stdout.trim() };
}

/** 結果を本文にする。3 つの形がそのまま親の判断材料になる */
export function compose(outcome: CommitResult): string {
  if (outcome.kind === 'no-change') {
    return 'no change';
  }
  if (outcome.kind === 'rejected') {
    return `rejected: ${outcome.output}`;
  }
  return `committed: ${outcome.hash}`;
}

export async function execute(...args: ExecuteArgs) {
  const [, params, , , ctx] = args;
  const id = parseCommitRequest(params);
  const row = findWorktree(ctx.cwd, id);
  if (row === undefined) {
    throw new Error(`consult_commit: no such worktree: ${id}. ${USAGE}`);
  }
  const outcome = commitInWorktree(worktreeGit(row.path), row.id);
  return result(compose(outcome), { worktree: row.id, outcome });
}
