/**
 * consult_run — 1 体の子を、ロールと行き先を指して走らせる道具の面。
 *
 * **1 呼び出し = 必ず 1 体**。複数の子が欲しいときはこの道具を複数回呼ぶ（背景なので親は待たない）。
 * 読ませたいファイルはここには渡さない（`input` は持たない）。子は `read` を持っているので、`task` にパスを書いて自分で読ませる。
 * 走らせるのは `tool/consult.ts` の runtime（走っている子を 1 か所で持つ所）で、ここは引数の面だけ。
 */

import { Type } from 'typebox';

/** 道具のパラメータ */
export const PARAMETERS = Type.Object({
  role: Type.String({
    description: 'How the child runs: research / review / trial / code. Set in types.json',
  }),
  task: Type.String({ description: 'What the child should do. Name any file it must read' }),
  worktree: Type.Optional(
    Type.String({
      description:
        'The unit id of the worktree to run in. An isolated role needs it; one that is not runs in the parent tree when it is omitted',
    }),
  ),
  continue: Type.Optional(
    Type.Boolean({
      description:
        "Continue the same conversation in that worktree. Defaults to the role's continueByDefault",
    }),
  ),
});

/** 知らない引数や不足のときに添える使い方 */
export const USAGE =
  'consult_run: role and task are required. worktree is the unit id (required for a writing role); continue is optional';

/** 検証済みの依頼 */
export interface RunRequest {
  readonly role: string;
  readonly task: string;
  readonly worktree?: string;
  readonly continue?: boolean;
}

function asText(value: unknown, where: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`consult_run: ${where} must be a non-empty string. ${USAGE}`);
  }
  return value;
}

/** 引数を検証して依頼にする。知らない形は使い方つきで投げる */
export function parseRunRequest(raw: unknown): RunRequest {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error(`consult_run: the arguments are not an object. ${USAGE}`);
  }
  const {
    role,
    task,
    worktree,
    continue: continueSession,
  } = raw as {
    role?: unknown;
    task?: unknown;
    worktree?: unknown;
    continue?: unknown;
  };
  const worktreeId = worktree === undefined ? undefined : asText(worktree, 'worktree');
  return {
    role: asText(role, 'role'),
    task: asText(task, 'task'),
    ...(worktreeId === undefined ? {} : { worktree: worktreeId }),
    ...(typeof continueSession === 'boolean' ? { continue: continueSession } : {}),
  };
}
