/**
 * consult 拡張の入口。道具とスラッシュコマンドの登録だけを行う。
 *
 * 走っている子の管理は `tool/consult.ts` の `createRuntime` が 1 か所で持ち、道具の `action` とコマンドの両方が同じ `control` を呼ぶ。
 */

import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import { PARAMETERS, createRuntime } from './tool/consult.ts';
import { PARAMETERS as RUN_PARAMETERS } from './tool/run.ts';
import { stopSound } from './tool/sound.ts';
import { PARAMETERS as WORKTREE_PARAMETERS, execute as worktreeExecute } from './tool/worktree.ts';
import { PARAMETERS as COMMIT_PARAMETERS, execute as commitExecute } from './tool/commit.ts';

export default function (pi: ExtensionAPI) {
  const consult = createRuntime(pi);

  pi.registerTool({
    name: 'consult_run',
    label: 'Consult run',
    description:
      'Run one child pi in the background, with a role and a place: consult_run{role, task, worktree?, continue?}. One call starts exactly one child; call it again for another. The child reads the files it needs itself, so name them in task. A writing role needs a worktree (consult_worktree); a read-only role runs in the parent tree when worktree is omitted. continue reopens the same conversation in that worktree. Returns started: <id> at once; the result arrives later as a message.',
    promptSnippet:
      'Run one background child pi with a role (research / review / trial / code) and a place',
    promptGuidelines: [
      'Use consult_run when a question or a piece of work is better done without this conversation in view: a review, a second opinion, or a role you were not given.',
      'One call is one child. For several, call it several times; it is background work, so do not wait.',
      'Pass the unit id in worktree for a role that writes; make the worktree first with consult_worktree.',
      'The policy (models, tools, readOnly, continueByDefault, limits, role) lives in .pi/extensions/consult/types.json; the caller cannot override it.',
    ],
    parameters: RUN_PARAMETERS,
    execute: (...args) => consult.run(...args),
  });

  pi.registerTool({
    name: 'consult_new',
    label: 'Consult new',
    description:
      "Start a child pi in the background with the policy of a type (model, tools, readOnly, continueByDefault, limits, role) and return its id at once. When the child finishes, its text is delivered as a message. The caller picks only the type; the child does not see this conversation. One child per input. An action of 'list' shows the running children, and 'cancel' stops one by id.",
    promptSnippet:
      'Start a background child pi with a type (research / review / trial / code); the result arrives as a message',
    promptGuidelines: [
      'Use consult_new when a question is better answered without this conversation in view: reviewing your own work, getting a second opinion, or applying a role you were not given.',
      'consult_new starts the child in the background and returns an id. Do not wait for it; the child text arrives later as a consult message. Use action list or cancel to see or stop the running children.',
      'The types and their limits live in .pi/extensions/consult/types.json. The caller cannot override them; to change the policy, edit that file.',
    ],
    parameters: PARAMETERS,

    execute: (...args) => consult.execute(...args),
  });

  pi.registerTool({
    name: 'consult_worktree',
    label: 'Consult worktree',
    description:
      "Work with the unit worktrees: 'new' makes one (branch consult/<unit>, under /tmp/pi-consult), 'list' shows them with their state, 'remove' deletes one and refuses while a child runs in it. A worktree stays until it is removed.",
    promptSnippet: 'Make, list or remove a unit worktree (it stays until removed)',
    promptGuidelines: [
      'Use consult_worktree with action: "new" and a unit id before starting a child that writes: the child runs in that worktree.',
      'Use action: "remove" only when the work is taken or dropped: the worktree is the record of what the child did.',
    ],
    parameters: WORKTREE_PARAMETERS,
    execute: worktreeExecute,
  });

  pi.registerCommand('consult-status', {
    description: 'List the consult children that are still running',
    handler: (args, ctx) => consult.commands.status(args, ctx),
  });

  pi.registerCommand('consult-cancel', {
    description: 'Stop a running consult child (usage: /consult-cancel <id>)',
    handler: (args, ctx) => consult.commands.cancel(args, ctx),
  });

  pi.registerCommand('consult-sound', {
    description: 'Turn the consult sound on or off (usage: /consult-sound on|off)',
    handler: (args, ctx) => consult.commands.sound(args, ctx),
  });

  // reload / セッションの差し替えで古いインスタンスが残っても、始めたタイマーが鳴り続けないように閉じる
  pi.on('session_shutdown', () => {
    stopSound();
  });

  pi.registerTool({
    name: 'consult_commit',
    label: 'Consult commit',
    description:
      "Commit the work a child left in its worktree, on that worktree's branch: consult_commit{worktree}. The message is made here (consult(<unit>): the child's work), so the log stays countable. Returns committed: <hash>, rejected: <hook output> (the work is left in place), or no change. Merging into your branch is a plain git command, run by you.",
    promptSnippet: "Commit a child's work in its worktree (by unit id)",
    promptGuidelines: [
      'Use consult_commit when a child that writes has finished and you have judged its work: one call commits the whole worktree.',
      'You never need the tmp path; the tool finds the worktree from the unit id.',
      'A rejected commit leaves the work in place; read the output, fix it, and call again, or discard the worktree with consult_worktree.',
      'Take the commit into your branch yourself with git merge --no-ff <branch>; consult does not merge.',
    ],
    parameters: COMMIT_PARAMETERS,
    execute: commitExecute,
  });
}
