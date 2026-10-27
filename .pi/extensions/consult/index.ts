/**
 * consult 拡張の入口。道具とスラッシュコマンドの登録だけを行う。
 *
 * 走っているサブエージェントの管理は `tool/consult.ts` の `createRuntime` が 1 か所で持ち、道具の `action` とコマンドの両方が同じ `control` を呼ぶ。
 * 置き場（`Place`）はここで 1 回だけ決め、runtime に渡す。テストは置き場を一時ディレクトリに逃がせる。
 */

import { rmSync } from 'node:fs';
import type { ExtensionAPI, ExtensionContext } from '@earendil-works/pi-coding-agent';
import { createRuntime, type ConsultRuntime, type PiFace } from './tool/consult.ts';
import { PARAMETERS as SUBAGENTS_PARAMETERS, createSubagentsTool } from './tool/subagents.ts';
import { PARAMETERS as RUN_PARAMETERS } from './tool/run.ts';
import { SOUND_INTERVAL_MS, playSound } from './tool/sound.ts';
import { appendDelivered, pendingReports, pruneCursors } from './run/delivery.ts';
import {
  closeOrphans,
  KEEP_DAYS,
  runningRuns,
  type CheckRecord,
  type RunRecord,
} from './run/log.ts';
import { oldFiles, placeFor, type Place } from './run/place.ts';
import { cleanWorktrees, consultRoot, topLevel } from './run/worktree.ts';
import { PARAMETERS as WORKTREE_PARAMETERS, createWorktreeTool } from './tool/worktree.ts';
import { PARAMETERS as COMMIT_PARAMETERS, execute as commitExecute } from './tool/commit.ts';

/** いまの pi のセッション id。`session_start` で読み直す（照合に使うだけ） */
let session = '';

/** cwd から置き場を決める。頂点が引けなければ cwd 自身に落とす（読み込みで投げない） */
function placeOf(cwd: string): Place {
  let toplevel: string;
  try {
    toplevel = topLevel(cwd);
  } catch {
    toplevel = cwd;
  }
  return placeFor(consultRoot(), toplevel);
}

/** session_start の文脈からセッション id を読む。取れなければ今のまま */
function readSession(ctx: ExtensionContext): string {
  const id = ctx.sessionManager.getSessionId();
  return id === '' ? session : id;
}

/** 渡す通知の details。記録の欄から組み直す（完了のメッセージと同じ形） */
function noticeDetails(record: RunRecord): Record<string, unknown> {
  return {
    id: record.subagent,
    type: record.role,
    ...(record.worktree === undefined ? {} : { worktree: record.worktree }),
    ...(record.state === undefined ? {} : { state: record.state }),
    ...(record.files === undefined ? {} : { files: [...record.files] }),
    ...(record.turns === undefined ? {} : { turns: record.turns }),
    ...(record.spend === undefined ? {} : { spend: record.spend }),
    ...(record.reason === undefined ? {} : { reason: record.reason }),
  };
}

/** tick に渡す口。置き場と、いまのセッションと、送る pi だけ */
export interface TickPort {
  readonly pi: PiFace;
  readonly place: Place;
  readonly sessionNow: () => string;
  readonly check?: CheckRecord;
}

/**
 * 印の無い完了を渡す。渡した数を返す。
 *
 * 渡すたびに印の行を足す。送る途中で投げたら、その行から印は進めない（次の tick が送り直す）。
 */
export function flushPending(port: TickPort): number {
  const current = port.sessionNow();
  if (current === '') {
    return 0;
  }
  let count = 0;
  for (const record of pendingReports(port.place, { session: current, days: KEEP_DAYS })) {
    port.pi.sendMessage(
      {
        customType: 'consult',
        content: record.notice ?? '',
        display: true,
        details: noticeDetails(record),
      },
      { triggerTurn: true, deliverAs: 'followUp' },
    );
    appendDelivered(port.place, record);
    count += 1;
  }
  return count;
}

let tickTimer: ReturnType<typeof setInterval> | undefined;

/**
 * 5 秒ごとに、印の無い完了を渡し、まだあれば音を鳴らす。すでに動いていれば何もしない。
 *
 * `flushPending` の失敗は捕まえ、次の tick に任せる。音の判定の失敗も tick を止めない。
 */
export function startTick(port: TickPort): void {
  if (tickTimer !== undefined) {
    return;
  }
  tickTimer = setInterval(() => {
    let delivered = 0;
    try {
      delivered = flushPending(port);
    } catch {
      // 次の tick に任せる。印は進めていないので、同じ物を送り直す
    }
    try {
      const current = port.sessionNow();
      if (current === '') {
        return;
      }
      const running = runningRuns(port.place, { session: current }, port.check).length > 0;
      const pending = pendingReports(port.place, { session: current, days: KEEP_DAYS }).length > 0;
      if (running || delivered > 0 || pending) {
        playSound();
      }
    } catch {
      // 音の判定で落ちても tick は止めない
    }
  }, SOUND_INTERVAL_MS);
}

/** tick のタイマーを止める。無ければ何もしない */
export function stopTick(): void {
  if (tickTimer === undefined) {
    return;
  }
  clearInterval(tickTimer);
  tickTimer = undefined;
}

/**
 * 前のセッション（reload の前）のサブエージェントがまだ走っていれば、そのことを知らせる。
 *
 * いまの session の走っているサブエージェントだけを見る（別の session のサブエージェントの報告はここには来ないので、
 * 待たせない）。
 */
function announceRunningSubagents(
  place: Place,
  announced: string,
  ctx: ExtensionContext,
  check?: CheckRecord,
): void {
  if (runningRuns(place, { session: announced }, check).length === 0) {
    return;
  }
  const count = runningRuns(place, { session: announced }, check).length;
  ctx.ui.notify(
    `consult: ${count} subagent(s) are still running from an earlier session (see consult_subagents)`,
    'info',
  );
}

/** 人が使う口。サブエージェントの一覧と停止、音の切り替え */
function registerCommands(pi: ExtensionAPI, consult: ConsultRuntime): void {
  pi.registerCommand('consult-status', {
    description: 'List the consult subagents that are still running',
    handler: (args, ctx) => consult.commands.status(args, ctx),
  });
  pi.registerCommand('consult-cancel', {
    description: 'Stop a running consult subagent (usage: /consult-cancel <id>)',
    handler: (args, ctx) => consult.commands.cancel(args, ctx),
  });
  pi.registerCommand('consult-sound', {
    description: 'Turn the consult sound on or off (usage: /consult-sound on|off)',
    handler: (args, ctx) => consult.commands.sound(args, ctx),
  });
}

/**
 * 起動の掃除。古い記録のファイルと、ゴーストの登録・取り込み済みの孤児枝を静かに 1 回片付ける。
 *
 * 失敗は握って続ける（開始を止めない）。
 */
function sweep(place: Place, cwd: string): void {
  try {
    for (const file of oldFiles(place, new Date(), KEEP_DAYS)) {
      rmSync(file, { force: true });
    }
  } catch (error) {
    void error;
  }
  try {
    cleanWorktrees(cwd);
  } catch (error) {
    void error;
  }
}

/** 終わりの無い開始行を閉じる。失敗は握って続ける（開始を止めない） */
function closeQuietly(place: Place, current: string): void {
  try {
    closeOrphans(place, current);
  } catch {
    // 閉じ損ねても開始は止めない。走っていない物は次の判定で止まる
  }
}

export default function (pi: ExtensionAPI) {
  const place = placeOf(process.cwd());
  const consult = createRuntime(pi, place, undefined, () => session);

  // reload をまたいだサブエージェントがまだ走っていれば知らせ、tick で記録を読み直す
  pi.on('session_start', (_event, ctx) => {
    session = readSession(ctx);
    closeQuietly(place, session);
    announceRunningSubagents(place, session, ctx);
    sweep(place, ctx.cwd);
    flushPending({ pi, place, sessionNow: () => session });
    pruneCursors(place, new Date(), KEEP_DAYS);
    startTick({ pi, place, sessionNow: () => session });
  });

  pi.registerTool({
    name: 'consult_run',
    label: 'Consult run',
    description:
      'Run one subagent pi in the background, with a role and a place: consult_run{role, task, worktree?, continue?}. One call starts exactly one subagent; call it again for another. The subagent reads the files it needs itself, so name them in task. An isolated role needs a worktree (consult_worktree); one that is not runs in the base when worktree is omitted. continue reopens the same conversation in that worktree. Returns started: <id> at once; the result arrives later as a message. No need to sleep while waiting; the response wake you.',
    promptSnippet:
      'Run one background subagent pi with a role (research / review / proofreader / trial / code) and a place',
    promptGuidelines: [
      'Use consult_run when a question or a piece of work is better done without this conversation in view: a review, a second opinion, or a role you were not given.',
      'One call is one subagent. For several, call it several times; it is background work, so do not wait.',
      'Pass the unit id in worktree for a role that writes; make the worktree first with consult_worktree.',
      'The policy (models, tools, isolated, paths, bash, continueByDefault, limits, role) lives in .pi/extensions/consult/types.json; the caller cannot override it.',
    ],
    parameters: RUN_PARAMETERS,
    execute: (...args) => consult.run(...args),
  });

  pi.registerTool({
    name: 'consult_subagents',
    label: 'Consult subagents',
    description:
      'Show the subagents of this session, and stop one: consult_subagents{action: list|cancel, id?}. Rows carry id, role, worktree, elapsed, turns and spend. The list comes from a record on disk, so it still shows subagents this session started (even ones from before a reload). cancel stops a running subagent of this session, including one a previous instance started (by process id); a subagent from another session is named in the reply and left alone.',
    promptSnippet: 'List the consult subagents (and stop one) — works across reloads',
    promptGuidelines: [
      'Use consult_subagents to see what is still running before you wait or act: one call lists this session’s subagents, including ones from before a reload.',
      'Use action: cancel with the id to stop one; a subagent started by another session cannot be stopped, and says so.',
    ],
    parameters: SUBAGENTS_PARAMETERS,
    execute: createSubagentsTool({
      place,
      sessionNow: () => session,
      control: (action, subagentSession) => consult.control(action, subagentSession),
    }),
  });

  pi.registerTool({
    name: 'consult_worktree',
    label: 'Consult worktree',
    description:
      "Work with the unit worktrees: 'new' makes one (branch consult/<unit>, under /tmp/pi-consult), 'list' shows them with their state, 'remove' deletes one and takes its merged branch (an unmerged one is kept), refusing while a subagent runs in it. A worktree stays until it is removed.",
    promptSnippet: 'Make, list or remove a unit worktree (it stays until removed)',
    promptGuidelines: [
      'Use consult_worktree with action: "new" and a unit id before starting a subagent that writes: the subagent runs in that worktree.',
      'Use action: "remove" only when the work is taken or dropped: the worktree is the record of what the subagent did.',
    ],
    parameters: WORKTREE_PARAMETERS,
    execute: createWorktreeTool(place),
  });

  registerCommands(pi, consult);

  // reload / セッションの差し替えで古いインスタンスが残っても、始めたタイマーが鳴り続けないように閉じる
  pi.on('session_shutdown', () => {
    stopTick();
  });

  pi.registerTool({
    name: 'consult_commit',
    label: 'Consult commit',
    description:
      "Commit the work a subagent left in its worktree, on that worktree's branch: consult_commit{worktree}. The message is made here (consult(<unit>): the subagent's work), so the log stays countable. Returns committed: <hash>, rejected: <hook output> (the work is left in place), or no change. Merging into your branch is a plain git command, run by you.",
    promptSnippet: "Commit a subagent's work in its worktree (by unit id)",
    promptGuidelines: [
      'Use consult_commit when a subagent that writes has finished and you have judged its work: one call commits the whole worktree.',
      'You never need the tmp path; the tool finds the worktree from the unit id.',
      'A rejected commit leaves the work in place; read the output, fix it, and call again, or discard the worktree with consult_worktree.',
      'Take the commit into your branch yourself with git merge --no-ff <branch>; consult does not merge.',
    ],
    parameters: COMMIT_PARAMETERS,
    execute: commitExecute,
  });
}
