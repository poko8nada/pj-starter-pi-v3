/**
 * `consult_resume` の口。
 *
 * 止まった子の worktree を一覧し（`list`）、その worktree で子をもう一度走らせ（`run`）、消す（`remove`）。
 * worktree は `consult_new` が残した物で、`run` はそのディレクトリをそのまま使う（新しい worktree は作らない）。
 * 既定で `--continue` を渡す。子は `--no-session` で走るので、会話の再開ではなく、同じ worktree での続きになる
 * （サイクル 008 の `Carry over` 5 本目）。
 *
 * 型は呼ぶ側が選ぶ（調べるのは `research`、直すのは `code`）。
 */
import type { AgentToolResult } from '@earendil-works/pi-coding-agent';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Type } from 'typebox';
import type { Static } from 'typebox';
import { buildPiArgs, parseEvents } from '../child/spec.ts';
import { loadTypes, resolveType } from '../policy/types.ts';
import { gitEnv, runPi } from '../run/run.ts';
import { removeStopped, stoppedWorktrees, type StoppedWorktree } from '../run/resume.ts';
import { attemptAndCommit } from '../run/retry.ts';
import { compose, refLabel } from './render.ts';

const EXTENSION_DIR = dirname(dirname(fileURLToPath(import.meta.url)));

export const PARAMETERS = Type.Object({
  action: Type.String({
    description:
      'list to see the stopped worktrees, run to continue one in its own worktree, remove to delete one',
  }),
  id: Type.Optional(
    Type.String({ description: 'the worktree id from list (required for run and remove)' }),
  ),
  type: Type.Optional(
    Type.String({ description: 'the type to run with (required for run); the caller picks it' }),
  ),
  task: Type.Optional(Type.String({ description: 'what the child should do next (run)' })),
});

export type Params = Static<typeof PARAMETERS>;

interface Ctx {
  readonly cwd: string;
}

/** 道具の引数。`consult.ts` と同じ 5 つだが、lint の上限に合わせて rest で受ける */
export type ExecuteArgs = [string, Params, AbortSignal | undefined, unknown, Ctx];

type ToolResult = AgentToolResult<Record<string, unknown>>;

const text = (body: string, details: Record<string, unknown> = {}): ToolResult => ({
  content: [{ type: 'text', text: body }],
  details,
});

const listLine = (entry: StoppedWorktree): string => {
  const record = entry.record;
  if (record === undefined) {
    return `- ${entry.id} (${entry.dir}) — no record`;
  }
  const files = record.files.length === 0 ? '' : `, files: ${record.files.join(', ')}`;
  const firstReason = record.reason.split('\n')[0] ?? '';
  return `- ${entry.id} (${entry.dir}) — ${record.attempts} run(s), stopped at ${record.stoppedAt}${files}\n  reason: ${firstReason}`;
};

function listResult(entries: readonly StoppedWorktree[]): ToolResult {
  const body = entries.length === 0 ? 'No stopped worktree.' : entries.map(listLine).join('\n');
  return text(body, { count: entries.length, ids: entries.map((entry) => entry.id) });
}

function removeResult(entry: StoppedWorktree, cwd: string): ToolResult {
  const removed = removeStopped(cwd, entry.id);
  return text(`Removed ${entry.dir}.`, { removed: removed?.id ?? entry.id });
}

async function runResult(
  entry: StoppedWorktree,
  params: Params,
  name: string,
  signal: AbortSignal | undefined,
): Promise<ToolResult> {
  const policy = resolveType(loadTypes(EXTENSION_DIR), name);
  const task = params.task ?? entry.record?.reason ?? 'Continue the work in this worktree.';
  const options = { type: policy.name, task, policy };
  const retry = await attemptAndCommit({
    label: refLabel(policy.name, 0),
    worktree: { parent: entry.parent, dir: entry.dir, cwd: entry.dir },
    ...(signal === undefined ? {} : { signal }),
    runOnce: (note) =>
      runPi({
        piArgs: [...buildPiArgs(options), ...(note === undefined ? [] : ['--continue'])],
        stdin: note === undefined ? task : `${task}\n\n${note}`,
        cwd: entry.dir,
        env: gitEnv(),
        limits: policy.limits,
      }),
  });
  const lines = [`## resume: ${entry.id}`, '', compose(parseEvents(retry.run.stdout), retry.run)];
  if (retry.work.kind === 'committed') {
    lines.push('', `ref: ${retry.work.ref}`, retry.work.stat);
  } else if (retry.work.kind === 'no-change') {
    lines.push('', 'ref: (the child changed nothing)');
  } else {
    lines.push('', `ref: (not created) the commit was rejected: ${retry.work.error}`);
    if (retry.kept !== undefined) {
      lines.push(
        `worktree kept: ${retry.kept}`,
        `attempts: ${retry.attempts}${retry.stoppedAt === undefined ? '' : `, stopped at ${retry.stoppedAt}`}`,
      );
    }
  }
  return text(lines.join('\n'), {
    id: entry.id,
    attempts: retry.attempts,
    ...(retry.kept === undefined ? {} : { kept: retry.kept }),
  });
}

export async function execute(...args: ExecuteArgs): Promise<ToolResult> {
  const [, params, signal, , ctx] = args;
  const entries = stoppedWorktrees(ctx.cwd);
  if (params.action === 'list') {
    return listResult(entries);
  }
  const id = params.id;
  if (id === undefined) {
    return text(`consult_resume ${params.action} needs an id (the worktree id from "list")`);
  }
  const entry = entries.find((candidate) => candidate.id === id || candidate.dir === id);
  if (entry === undefined) {
    return text(`No stopped worktree with id ${id}.`, { error: 'unknown-id' });
  }
  if (params.action === 'remove') {
    return removeResult(entry, ctx.cwd);
  }
  if (params.action !== 'run') {
    return text(`Unknown action: ${params.action}`, { error: 'unknown-action' });
  }
  const name = params.type;
  if (name === undefined) {
    return text('consult_resume run needs a type (for example code or research)');
  }
  return runResult(entry, params, name, signal);
}
