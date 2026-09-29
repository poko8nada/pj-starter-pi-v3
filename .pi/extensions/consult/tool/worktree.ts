/**
 * consult_worktree — unit ごとの作業場を作り、一覧し、消す道具。
 *
 * 作るのは明示的で、消すのも明示的。作った worktree は指定しない限り残る（子の仕事はそこに残る）。
 * 判断と解釈は `../run/worktree.ts` が持ち、ここは道具の面だけ。
 */

import type { AgentToolResult, AgentToolUpdateCallback } from '@earendil-works/pi-coding-agent';
import { Type } from 'typebox';
import type { Static } from 'typebox';
import {
  createWorktree,
  listWorktrees,
  removeWorktree,
  type RemoveOutcome,
  type WorktreeRow,
} from '../run/worktree.ts';

/** 道具のパラメータ。`new` で作り、`list` で見て、`remove` で消す */
export const PARAMETERS = Type.Object({
  action: Type.Optional(
    Type.String({
      description: 'new to make one, list to see them (default), remove to delete one',
    }),
  ),
  id: Type.Optional(
    Type.String({
      description: 'The unit id (for action=new or action=remove), e.g. 2-consult.retry',
    }),
  ),
  base: Type.Optional(
    Type.String({
      description: "What to branch from (for action=new). Defaults to the parent's HEAD",
    }),
  ),
  force: Type.Optional(
    Type.Boolean({ description: 'Remove even when changes are left in the worktree' }),
  ),
});

type Params = Static<typeof PARAMETERS>;

/** pi が渡す引数。位置で渡される 5 つを 1 つのタプルにまとめる。ctx は使う所（cwd）だけを言う */
type ExecuteArgs = [
  toolCallId: string,
  params: Params,
  signal: AbortSignal | undefined,
  onUpdate: AgentToolUpdateCallback<unknown> | undefined,
  ctx: { readonly cwd: string },
];

/** 道具の戻り値。details は必須なので、必ず埋める */
function result(
  text: string,
  details: Record<string, unknown> = {},
): AgentToolResult<Record<string, unknown>> {
  return { content: [{ type: 'text', text }], details };
}

/** 使える action か。知らない物と欠けた引数は理由つきで断る */
function parseAction(
  params: Params,
):
  | { action: 'new'; id: string; base: string | undefined }
  | { action: 'list' }
  | { action: 'remove'; id: string; force: boolean } {
  const action = params.action ?? 'list';
  if (action === 'list') {
    return { action: 'list' };
  }
  const id = params.id?.trim();
  if (id === undefined || id === '') {
    throw new Error(`consult_worktree: action=${action} needs an id (the unit id).`);
  }
  if (action === 'new') {
    return { action: 'new', id, base: params.base };
  }
  if (action === 'remove') {
    return { action: 'remove', id, force: params.force === true };
  }
  throw new Error(
    `consult_worktree: unknown action: ${JSON.stringify(action)}. Use new, list or remove.`,
  );
}

function rowLine(row: WorktreeRow, busy: boolean): string {
  const state = [row.dirty ? 'changed' : 'clean', busy ? 'a child is running' : '']
    .filter((part) => part !== '')
    .join(', ');
  return `${row.id}  ${row.branch}  ${row.path}  (${state})`;
}

function removeText(outcome: RemoveOutcome, id: string): string {
  if (outcome === 'removed') {
    return `消した: ${id}`;
  }
  if (outcome === 'missing') {
    return `無い: ${id}`;
  }
  if (outcome === 'busy') {
    return `消さない: ${id} で子が動いている`;
  }
  return `消さない: ${id} に変更が残っている（force を付ければ消す）`;
}

export async function execute(...args: ExecuteArgs) {
  const [, params, , , ctx] = args;
  const action = parseAction(params);
  const cwd = ctx.cwd;
  if (action.action === 'new') {
    const made = createWorktree(cwd, action.id, action.base);
    return result(
      [
        `id: ${made.id}`,
        `branch: ${made.branch}`,
        `path: ${made.path}`,
        `base: ${action.base ?? 'HEAD'}`,
      ].join('\n'),
      { action: 'new', worktree: made },
    );
  }
  if (action.action === 'remove') {
    const outcome = removeWorktree(cwd, action.id, { force: action.force });
    return result(removeText(outcome, action.id), { action: 'remove', outcome });
  }
  const rows = listWorktrees(cwd);
  if (rows.length === 0) {
    return result('作業場は無い。', { action: 'list', rows });
  }
  return result(rows.map((row) => rowLine(row, false)).join('\n'), { action: 'list', rows });
}
