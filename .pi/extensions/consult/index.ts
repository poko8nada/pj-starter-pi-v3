/**
 * consult 拡張の入口。道具とスラッシュコマンドの登録だけを行う。
 *
 * 走っている子の管理は `tool/consult.ts` の `createRuntime` が 1 か所で持ち、道具の `action` とコマンドの両方が同じ `control` を呼ぶ。
 */

import type { ExtensionAPI, ExtensionContext } from '@earendil-works/pi-coding-agent';
import { createRuntime, type ConsultRuntime } from './tool/consult.ts';
import { PARAMETERS as CHILDREN_PARAMETERS, createChildrenTool, latest } from './tool/children.ts';
import { PARAMETERS as RUN_PARAMETERS } from './tool/run.ts';
import { runningChildren, startSound, stopSound } from './tool/sound.ts';
import { createDelivery } from './run/delivery.ts';
import { pidAlive, readRuns } from './run/log.ts';
import { cleanWorktrees, rootFor } from './run/worktree.ts';
import { PARAMETERS as WORKTREE_PARAMETERS, execute as worktreeExecute } from './tool/worktree.ts';
import { PARAMETERS as COMMIT_PARAMETERS, execute as commitExecute } from './tool/commit.ts';

/**
 * 前のセッション（reload の前）の子がまだ走っていれば、そのことを知らせて音を戻す。
 *
 * 子は detach されて親の記憶の外でも生きているので、判定は記録（log.jsonl）と pid で行う。
 */
function announceRunningChildren(ctx: ExtensionContext): void {
  const running = runningChildren(latest(readRuns(rootFor(ctx.cwd))), pidAlive);
  if (running.length === 0) {
    return;
  }
  ctx.ui.notify(
    `consult: ${running.length} child(ren) are still running from an earlier session (see consult_children)`,
    'info',
  );
  startSound();
}

/** 人が使う口。子の一覧と停止、音の切り替え */
function registerCommands(pi: ExtensionAPI, consult: ConsultRuntime): void {
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
}

export default function (pi: ExtensionAPI) {
  // 完了の届け先は 1 本。reload で捨てられても、古い delivery は記録へ回すだけ（新しいセッションが読む）
  const delivery = createDelivery(() => rootFor(process.cwd()));
  delivery.attach(pi);
  const consult = createRuntime(pi, undefined, delivery);

  // reload をまたいだ子がまだ走っていれば、知らせて音を戻す
  pi.on('session_start', (_event, ctx) => {
    announceRunningChildren(ctx);
    // ゴーストの登録と取り込み済みの孤児枝を静かに 1 回掃除する。失敗は握って続ける（開始を止めない）
    try {
      cleanWorktrees(ctx.cwd);
    } catch (error) {
      void error;
    }
  });

  pi.registerTool({
    name: 'consult_run',
    label: 'Consult run',
    description:
      'Run one child pi in the background, with a role and a place: consult_run{role, task, worktree?, continue?}. One call starts exactly one child; call it again for another. The child reads the files it needs itself, so name them in task. An isolated role needs a worktree (consult_worktree); one that is not runs in the parent tree when worktree is omitted. continue reopens the same conversation in that worktree. Returns started: <id> at once; the result arrives later as a message.',
    promptSnippet:
      'Run one background child pi with a role (research / review / trial / code) and a place',
    promptGuidelines: [
      'Use consult_run when a question or a piece of work is better done without this conversation in view: a review, a second opinion, or a role you were not given.',
      'One call is one child. For several, call it several times; it is background work, so do not wait.',
      'Pass the unit id in worktree for a role that writes; make the worktree first with consult_worktree.',
      'The policy (models, tools, isolated, paths, bash, continueByDefault, limits, role) lives in .pi/extensions/consult/types.json; the caller cannot override it.',
    ],
    parameters: RUN_PARAMETERS,
    execute: (...args) => consult.run(...args),
  });

  pi.registerTool({
    name: 'consult_children',
    label: 'Consult children',
    description:
      'Show the children of this project, and stop one: consult_children{action: list|cancel, id?}. Rows carry id, role, worktree, elapsed, turns and spend. The list comes from a record on disk, so it still shows children a previous session started (after a reload). cancel only stops a child this session started; one from an earlier session is named in the reply and left alone.',
    promptSnippet: 'List the consult children (and stop one) — works across reloads',
    promptGuidelines: [
      'Use consult_children to see what is still running before you wait or act: one call lists every child of this project, including ones from before a reload.',
      'Use action: cancel with the id to stop one; a child started by a previous session cannot be stopped, and says so.',
    ],
    parameters: CHILDREN_PARAMETERS,
    execute: createChildrenTool(consult),
  });

  pi.registerTool({
    name: 'consult_worktree',
    label: 'Consult worktree',
    description:
      "Work with the unit worktrees: 'new' makes one (branch consult/<unit>, under /tmp/pi-consult), 'list' shows them with their state, 'remove' deletes one and takes its merged branch (an unmerged one is kept), refusing while a child runs in it. A worktree stays until it is removed.",
    promptSnippet: 'Make, list or remove a unit worktree (it stays until removed)',
    promptGuidelines: [
      'Use consult_worktree with action: "new" and a unit id before starting a child that writes: the child runs in that worktree.',
      'Use action: "remove" only when the work is taken or dropped: the worktree is the record of what the child did.',
    ],
    parameters: WORKTREE_PARAMETERS,
    execute: worktreeExecute,
  });

  registerCommands(pi, consult);

  // reload / セッションの差し替えで古いインスタンスが残っても、始めたタイマーが鳴り続けないように閉じる
  pi.on('session_shutdown', () => {
    // 子は detach されているので殺さない。届け先を手放すだけ（以後の完了は記録に回る）
    delivery.detach();
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
