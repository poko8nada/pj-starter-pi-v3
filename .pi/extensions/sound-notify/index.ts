import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  ExtensionAPI,
  ExtensionContext,
  ToolExecutionEndEvent,
} from '@earendil-works/pi-coding-agent';
import { readSettings } from './settings/read.ts';
import { settingsOrDefault, type Settings } from './settings/schema.ts';

/** 通知の種類である。種類ごとに音を出し分ける（commit と compact を除き文言も変える）。 */
type NotifyKind = 'permission' | 'question' | 'done' | 'commit' | 'compact';

/** cmux へ文言を送る種類である。commit と compact は音だけにする。 */
type NotificationKind = Exclude<NotifyKind, 'commit' | 'compact'>;

/** この拡張が pi に求める窓口だけである。テストは exec だけを持つ偽物を渡す。 */
export interface PiPort {
  exec(command: string, args: string[]): Promise<unknown>;
}

/** この拡張が ctx に求める窓口だけである。テストは hasUI だけを持つ偽物を渡す。 */
export type CtxPort = Pick<ExtensionContext, 'hasUI'>;

const SOUNDS_DIR = '/System/Library/Sounds';
const NOTIFICATION_TITLE = 'pi';

/**
 * cmux の通知文言である。
 * subtitle で種類を出し分け、body は「何を待っているか」が分かる文にする。
 */
const NOTIFICATION_COPY: Record<NotificationKind, { subtitle: string; body: string }> = {
  permission: { subtitle: 'Permission', body: 'Approval needed' },
  question: { subtitle: 'Question', body: 'Agent is waiting for your answer' },
  done: { subtitle: 'Done', body: 'Turn complete' },
};

/** 設定ファイルは拡張と同じディレクトリに置く（ローカルとグローバルのどちらでも解決できる）。 */
const EXTENSION_DIR = dirname(fileURLToPath(import.meta.url));

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 入力待ちの種類を判定する。
 * permission 系のダイアログは title が "Permission Required\n..." で始まるため、
 * それ以外（通常の質問と確認ダイアログ）は question として扱う。
 */
function classify(title: string | undefined): NotifyKind {
  return title !== undefined && /permission/i.test(title) ? 'permission' : 'question';
}

/** 音を 1 つ鳴らす窓口である。テストは afplay を起動しない物に差し替える。 */
export type SoundPlayer = (pi: PiPort, soundName: string) => Promise<void>;

/** 既定の鳴らす処理である。afplay に音のファイルを渡す。 */
const afplay: SoundPlayer = async (pi, soundName) => {
  await pi.exec('afplay', [`${SOUNDS_DIR}/${soundName}.aiff`]);
};

let player: SoundPlayer = afplay;

/** 鳴らす処理を差し替え、元に戻す関数を返す。テスト用である。 */
export function setPlayer(next: SoundPlayer): () => void {
  const previous = player;
  player = next;
  return () => {
    player = previous;
  };
}

async function sendNotification(pi: PiPort, kind: NotificationKind): Promise<void> {
  const copy = NOTIFICATION_COPY[kind];
  await pi.exec('cmux', [
    'notify',
    '--title',
    NOTIFICATION_TITLE,
    '--subtitle',
    copy.subtitle,
    '--body',
    copy.body,
  ]);
}

function dispatch(pi: PiPort, ctx: CtxPort, kind: NotifyKind, config: Settings): void {
  // print と JSON モードには端末がないため鳴らさない（CI とパイプ実行での誤作動を防ぐ）。
  if (!config.enabled || !ctx.hasUI) {
    return;
  }

  const tasks: Promise<void>[] = [player(pi, config.sounds[kind])];
  // commit と compact は音だけにする。cmux 通知は入力待ちとターン完了の合図に限る。
  if (config.notifications && kind !== 'commit' && kind !== 'compact') {
    tasks.push(sendNotification(pi, kind));
  }

  // 通知の完了を待つと pi がアイドルに戻るタイミングが遅れるため待ち合わせをしない。
  // afplay と cmux は失敗しても exec が reject しないが、念のため例外を隠す。
  Promise.all(tasks).catch(() => undefined);
}

/** bash の結果からテキスト部分を取り出す。 */
function resultText(result: unknown): string {
  if (typeof result === 'string') {
    return result;
  }
  if (!isRecord(result) || !Array.isArray(result.content)) {
    return '';
  }
  return result.content
    .map((part) =>
      isRecord(part) && part.type === 'text' && typeof part.text === 'string' ? part.text : '',
    )
    .join('\n');
}

/** git commit の出力（例: `[main abc1234] 件名`）が結果に含まれるかどうかを返す。 */
export function isCommitResult(result: unknown): boolean {
  return /\[[^\]]* [0-9a-f]{7,40}\]/.test(resultText(result));
}

/** bash の git commit が成功したときだけ commit の音を鳴らす。 */
export function handleToolExecutionEnd(
  pi: PiPort,
  ctx: CtxPort,
  event: ToolExecutionEndEvent,
  config: Settings,
): void {
  if (event.toolName === 'bash' && !event.isError && isCommitResult(event.result)) {
    dispatch(pi, ctx, 'commit', config);
  }
}

/** 圧縮が終わったときだけ compact の音を鳴らす。 */
export function handleSessionCompact(pi: PiPort, ctx: CtxPort, config: Settings): void {
  dispatch(pi, ctx, 'compact', config);
}

/** 拡張の入口が pi に求める窓口だけである。テストは on を記録する偽物を渡す。 */
export type EntryPiPort = {
  on: ExtensionAPI['on'];
  exec: PiPort['exec'];
};

/** 拡張の入口を配線する。既定の export は設定を読んでここに渡す。テストは設定を直接渡す。 */
export function registerSoundHandlers(pi: EntryPiPort, config: Settings): void {
  // 入力待ちである。エージェントが止まってユーザーの答えを待っている（緊急度が高い）。
  pi.on('ui_prompt_start', async (event, ctx) => {
    dispatch(pi, ctx, classify(event.title), config);
  });

  // ターン完了である。エージェントが仕事を終えた（報告）。
  pi.on('agent_settled', async (_event, ctx) => {
    dispatch(pi, ctx, 'done', config);
  });

  // コミット完了である。bash が git commit の出力を返したときに 1 音鳴らす。
  pi.on('tool_execution_end', async (event, ctx) => {
    handleToolExecutionEnd(pi, ctx, event, config);
  });

  // 圧縮完了である。圧縮が終わったときに 1 音鳴らす（失敗は鳴らさない）。
  pi.on('session_compact', async (_event, ctx) => {
    handleSessionCompact(pi, ctx, config);
  });
}

/** 既定の export である。dir は検査が一時ディレクトリを渡すための窓口であり、pi は渡さない。 */
export default function (pi: EntryPiPort, dir: string = EXTENSION_DIR) {
  // 起動時に 1 回だけ読む。壊れていれば既定で動き、通知しない。
  registerSoundHandlers(pi, settingsOrDefault(readSettings(dir)));
}
