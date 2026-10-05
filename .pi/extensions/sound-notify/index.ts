import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  ExtensionAPI,
  ExtensionContext,
  ToolExecutionEndEvent,
} from '@earendil-works/pi-coding-agent';

/** 通知の種類。種類ごとに音を出し分ける（commit・compact を除いて文言も） */
type NotifyKind = 'permission' | 'question' | 'done' | 'commit' | 'compact';

/** cmux へ文言を送る種類。commit と compact は音だけにする */
type NotificationKind = Exclude<NotifyKind, 'commit' | 'compact'>;

interface SoundNotifyConfig {
  enabled: boolean;
  /** 種類ごとのシステムサウンド名（/System/Library/Sounds/<name>.aiff） */
  sounds: Record<NotifyKind, string>;
  /** cmux への通知を送るか */
  notifications: boolean;
}

/** この拡張が pi に求める口だけ。テストは exec だけ持つ偽物を渡す */
export interface PiPort {
  exec(command: string, args: string[]): Promise<unknown>;
}

/** この拡張が ctx に求める口だけ。テストは hasUI だけ持つ偽物を渡す */
export type CtxPort = Pick<ExtensionContext, 'hasUI'>;

const DEFAULT_CONFIG: SoundNotifyConfig = {
  enabled: true,
  sounds: { permission: 'Blow', question: 'Ping', done: 'Glass', commit: 'Pop', compact: 'Glass' },
  notifications: true,
};

const SOUNDS_DIR = '/System/Library/Sounds';
const NOTIFICATION_TITLE = 'pi';

/**
 * cmux の通知文言。
 * subtitle で種類を出し分け、body は「何を待っているか」が分かる文にする。
 */
const NOTIFICATION_COPY: Record<NotificationKind, { subtitle: string; body: string }> = {
  permission: { subtitle: 'Permission', body: 'Approval needed' },
  question: { subtitle: 'Question', body: 'Agent is waiting for your answer' },
  done: { subtitle: 'Done', body: 'Turn complete' },
};

/** 設定ファイルは拡張と同じディレクトリに置く（ローカル/グローバルどちらでも解決できる） */
const EXTENSION_DIR = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = join(EXTENSION_DIR, 'config.json');

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value !== '' ? value : fallback;
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

export function parseConfig(parsed: unknown): SoundNotifyConfig {
  if (!isRecord(parsed)) {
    return DEFAULT_CONFIG;
  }

  const sounds = isRecord(parsed.sounds) ? parsed.sounds : {};
  return {
    enabled: readBoolean(parsed.enabled, DEFAULT_CONFIG.enabled),
    notifications: readBoolean(parsed.notifications, DEFAULT_CONFIG.notifications),
    sounds: {
      permission: readString(sounds.permission, DEFAULT_CONFIG.sounds.permission),
      question: readString(sounds.question, DEFAULT_CONFIG.sounds.question),
      done: readString(sounds.done, DEFAULT_CONFIG.sounds.done),
      commit: readString(sounds.commit, DEFAULT_CONFIG.sounds.commit),
      compact: readString(sounds.compact, DEFAULT_CONFIG.sounds.compact),
    },
  };
}

function loadConfig(): SoundNotifyConfig {
  if (!existsSync(CONFIG_PATH)) {
    return DEFAULT_CONFIG;
  }
  try {
    return parseConfig(JSON.parse(readFileSync(CONFIG_PATH, 'utf8')));
  } catch {
    // 壊れた設定で通知が止まるより、既定値で鳴らし続ける方が安全
    return DEFAULT_CONFIG;
  }
}

/**
 * 入力待ちの種類を判定する。
 * permission 系のダイアログは title が "Permission Required\n..." で始まるため、
 * それ以外（通常の質問・確認ダイアログ）は question として扱う。
 */
function classify(title: string | undefined): NotifyKind {
  return title !== undefined && /permission/i.test(title) ? 'permission' : 'question';
}

/** 音を 1 つ鳴らす口。テストは afplay を起動しない物に差し替える */
export type SoundPlayer = (pi: PiPort, soundName: string) => Promise<void>;

/** 既定の鳴らす所。afplay に音のファイルを渡す */
const afplay: SoundPlayer = async (pi, soundName) => {
  await pi.exec('afplay', [`${SOUNDS_DIR}/${soundName}.aiff`]);
};

let player: SoundPlayer = afplay;

/** 鳴らす所を差し替え、元に戻す関数を返す。テスト用 */
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

function dispatch(pi: PiPort, ctx: CtxPort, kind: NotifyKind, config: SoundNotifyConfig): void {
  // print / JSON モードには端末が無いため鳴らさない（CI やパイプ実行での誤爆を防ぐ）
  if (!config.enabled || !ctx.hasUI) {
    return;
  }

  const tasks: Promise<void>[] = [player(pi, config.sounds[kind])];
  // commit と compact は音だけ。cmux 通知は入力待ち・ターン完了の合図に限る。
  if (config.notifications && kind !== 'commit' && kind !== 'compact') {
    tasks.push(sendNotification(pi, kind));
  }

  // 通知の完了を待つと pi がアイドルに戻るタイミングが遅れるため投げっぱなしにする。
  // afplay / cmux は失敗しても exec が reject しないが、念のため握りつぶす。
  Promise.all(tasks).catch(() => undefined);
}

/** bash の結果からテキスト部分を取り出す */
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

/** git commit の出力（例: `[main abc1234] 件名`）が結果に含まれるか */
export function isCommitResult(result: unknown): boolean {
  return /\[[^\]]* [0-9a-f]{7,40}\]/.test(resultText(result));
}

/** bash の git commit が成功したときだけ commit の音を鳴らす */
export function handleToolExecutionEnd(
  pi: PiPort,
  ctx: CtxPort,
  event: ToolExecutionEndEvent,
  config: SoundNotifyConfig,
): void {
  if (event.toolName === 'bash' && !event.isError && isCommitResult(event.result)) {
    dispatch(pi, ctx, 'commit', config);
  }
}

/** 圧縮が終わったときだけ compact の音を鳴らす */
export function handleSessionCompact(pi: PiPort, ctx: CtxPort, config: SoundNotifyConfig): void {
  dispatch(pi, ctx, 'compact', config);
}

/** 拡張の入口が pi に求める口だけ。テストは on を記録する偽物を渡す */
export type EntryPiPort = {
  on: ExtensionAPI['on'];
  exec: PiPort['exec'];
};

/** 拡張の入口の配線。既定の export は設定を読んでここに渡す。テストは設定を直接渡す */
export function registerSoundHandlers(pi: EntryPiPort, config: SoundNotifyConfig): void {
  // 入力待ち: エージェントが止まってユーザーの答えを待っている（緊急度が高い）
  pi.on('ui_prompt_start', async (event, ctx) => {
    dispatch(pi, ctx, classify(event.title), config);
  });

  // ターン完了: エージェントが仕事を終えた（報告）
  pi.on('agent_settled', async (_event, ctx) => {
    dispatch(pi, ctx, 'done', config);
  });

  // コミット完了: bash が git commit の出力を返したときに 1 音
  pi.on('tool_execution_end', async (event, ctx) => {
    handleToolExecutionEnd(pi, ctx, event, config);
  });

  // 圧縮完了: 圧縮が終わったときに 1 音（失敗は鳴らさない）
  pi.on('session_compact', async (_event, ctx) => {
    handleSessionCompact(pi, ctx, config);
  });
}

export default function (pi: EntryPiPort) {
  registerSoundHandlers(pi, loadConfig());
}
