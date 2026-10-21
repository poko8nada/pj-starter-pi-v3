/**
 * consult_worktree — unit ごとの作業場を作り、一覧し、消す道具。
 *
 * 作るのは明示的で、消すのも明示的。作った worktree は指定しない限り残る（サブエージェントの仕事はそこに残る）。
 * 判断と解釈は `../run/worktree.ts` が持ち、ここは道具の面だけ。
 */

import type { AgentToolResult, AgentToolUpdateCallback } from '@earendil-works/pi-coding-agent';
import { Type } from 'typebox';
import type { Static } from 'typebox';
import { isRunning, readRuns, type CheckRecord, type RunRecord } from '../run/log.ts';
import type { Place } from '../run/place.ts';
import {
  createWorktree,
  listWorktrees,
  removeWorktree,
  type RemoveResult,
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
      description: 'What to branch from (for action=new). Defaults to the base HEAD',
    }),
  ),
  force: Type.Optional(
    Type.Boolean({
      description:
        'Remove even when changes are left in the worktree, and delete the branch even when it is not merged',
    }),
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

/**
 * その unit でサブエージェントが走っているか。
 *
 * 記録（置き場の日ごとのファイル）で見る: 同じ subagent に終わりの行があれば除き、無ければ
 * `check`（既定は startToken があれば `ps` の `lstart`、無ければ `pidAlive`）に渡す。
 * メインエージェントの記憶ではなく記録を見るので、reload をまたいだサブエージェントにも効く。
 *
 * session では絞らない。作業場を守る側なので、他のセッションのサブエージェントが走っている作業場も消してはいけない。
 */
export function runningIn(place: Place, id: string, check?: CheckRecord): boolean {
  const groups = new Map<string, RunRecord[]>();
  const all = readRuns(place).filter((run) => run.worktree === id);
  for (const run of all) {
    const list = groups.get(run.subagent);
    if (list !== undefined) {
      list.push(run);
    } else {
      groups.set(run.subagent, [run]);
    }
  }
  for (const records of groups.values()) {
    if (records.some((run) => run.ended !== undefined)) {
      continue;
    }
    const start = records[0];
    if (start !== undefined && isRunning(start, check)) {
      return true;
    }
  }
  return false;
}

function rowLine(row: WorktreeRow, busy: boolean): string {
  const state = [row.dirty ? 'changed' : 'clean', busy ? 'a subagent is running' : '']
    .filter((part) => part !== '')
    .join(', ');
  return `${row.id}  ${row.branch}  ${row.path}  (${state})`;
}

export function removeText(id: string, removed: RemoveResult): string {
  if (removed.outcome === 'busy') {
    return `消さない: ${id} でサブエージェントが走っている（この unit の記録がそう言っている。止めるか、終わるのを待つ）`;
  }
  const own = removed.cleanup.branches.find((entry) => entry.branch === `consult/${id}`);
  // `removed` のときは自分の枝の運命を前置きが言うので、掃除の内訳からは外す（二重に言わない）
  const swept =
    removed.outcome === 'removed'
      ? removed.cleanup.branches.filter((entry) => entry.branch !== `consult/${id}`)
      : removed.cleanup.branches;
  const extras: string[] = [];
  if (removed.cleanup.pruned.length > 0) {
    extras.push(`登録を掃除した: ${removed.cleanup.pruned.join(', ')}`);
  }
  const gone = swept.filter((entry) => entry.state === 'removed').map((entry) => entry.branch);
  if (gone.length > 0) {
    extras.push(`消した枝: ${gone.join(', ')}`);
  }
  const kept = swept.filter((entry) => entry.state === 'kept').map((entry) => entry.branch);
  if (kept.length > 0) {
    extras.push(`残した枝（未マージ）: ${kept.join(', ')}`);
  }
  const tail = extras.length > 0 ? `（${extras.join('。')}）` : '';
  if (removed.outcome === 'missing') {
    return `無い: ${id}${tail}`;
  }
  if (removed.outcome === 'dirty') {
    return `消さない: ${id} に変更が残っている（force を付ければ消す）${tail}`;
  }
  if (own?.state === 'kept') {
    return `消した: ${id}（ブランチは未マージなので残した。取り込むか、force で捨てる）${tail}`;
  }
  return `消した: ${id}（ブランチも消した）${tail}`;
}

/**
 * 道具を作る。置き場は結線の時に 1 回だけ渡す（`runningIn` が使う）。cwd は pi の文脈から取る。
 */
export function createWorktreeTool(place: Place, check?: CheckRecord) {
  return async function execute(...args: ExecuteArgs) {
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
      const removed = removeWorktree(cwd, action.id, {
        force: action.force,
        busy: runningIn(place, action.id, check),
      });
      return result(removeText(action.id, removed), {
        action: 'remove',
        outcome: removed.outcome,
        cleanup: removed.cleanup,
      });
    }
    const rows = listWorktrees(cwd);
    if (rows.length === 0) {
      return result('作業場は無い。', { action: 'list', rows });
    }
    return result(rows.map((row) => rowLine(row, runningIn(place, row.id, check))).join('\n'), {
      action: 'list',
      rows,
    });
  };
}
