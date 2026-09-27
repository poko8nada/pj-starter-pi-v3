/**
 * ref_cleanup — `consult` の ref を一覧し、消す道具。
 *
 * 消す前に一覧を見せる（何が消えるかを先に言う）。消せるのは `consult/` で始まる ref だけ。
 * それ以外は理由つきで拒む。判断と解釈は `../run/refs.ts` が持ち、ここは道具の面だけ。
 */

import type {
  AgentToolResult,
  AgentToolUpdateCallback,
  ExtensionContext,
} from '@earendil-works/pi-coding-agent';
import { Type } from 'typebox';
import type { Static } from 'typebox';
import { spawnSync } from 'node:child_process';
import { gitEnv } from '../run/run.ts';
import { parseAction, runAction, type GitRun } from '../run/refs.ts';

/** 道具のパラメータ。一覧する（`list`）か、消す（`delete`）か */
export const PARAMETERS = Type.Object({
  action: Type.String({ description: 'list to see what is there, delete to remove one ref' }),
  name: Type.Optional(
    Type.String({
      description: 'The ref to delete (only for action=delete). Must start with consult/',
    }),
  ),
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

/** 道具の戻り値。details は必須なので、必ず埋める */
function result(
  text: string,
  details: Record<string, unknown> = {},
): AgentToolResult<Record<string, unknown>> {
  return { content: [{ type: 'text', text }], details };
}

/** git を起動する。環境は consult と同じ理由で `GIT_*` を落とす */
function git(cwd: string): GitRun {
  return (args) => {
    const spawned = spawnSync('git', [...args], { cwd, encoding: 'utf8', env: gitEnv() });
    return {
      status: spawned.status ?? 1,
      stdout: spawned.stdout ?? '',
      stderr: spawned.stderr ?? '',
    };
  };
}

/** 結果を本文にする。消す前の一覧も、拒んだ理由も、そのまま出す */
function compose(outcome: ReturnType<typeof runAction>): string {
  if ('refs' in outcome) {
    if (outcome.refs.length === 0) {
      return 'consult/ の ref は無い。';
    }
    return outcome.refs.map((ref) => `${ref.name} ${ref.hash}`).join('\n');
  }
  if ('refused' in outcome) {
    return `消さない: ${outcome.refused}`;
  }
  return `消した: ${outcome.deleted}`;
}

export async function execute(...args: ExecuteArgs) {
  const [, params, , , ctx] = args;
  const action = parseAction(params);
  const outcome = runAction(action, git(ctx.cwd));
  return result(compose(outcome), { action: action.action, outcome });
}
