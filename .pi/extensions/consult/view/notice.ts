/**
 * consult の完了報告の表示 — 折りたたみの1行と、開いたときの本文。
 *
 * 報告は `customType: 'consult'` のメッセージとして届き、pi はここで登録したレンダラーで描画する。
 * 折りたたみでは `[consult] <id> — <role> / <state>` の1行だけを表示し、開いたときだけ
 * `turns`・`spend`・`files` と本文を表示する。
 */

import { Box, Markdown, Text, type Component } from '@earendil-works/pi-tui';
import {
  getMarkdownTheme,
  keyText,
  type MessageRenderer,
  type MessageRenderOptions,
  type Theme,
} from '@earendil-works/pi-coding-agent';

/** レンダラーが受け取るメッセージ。公開された口から `CustomMessage<unknown>` と同じ型を取る */
export type NoticeMessage = Parameters<MessageRenderer>[0];

/** 描画に使う色。`Theme` の `fg` と `bg` だけを使う */
export type NoticePaint = Pick<Theme, 'fg' | 'bg'>;

/** 1行に並べる部分（`consult-1`、`code`、`done`）。details から読み取れた部分だけを順に保持し、空の場合は `[consult]` だけになる */
export type NoticeParts = readonly string[];

/** 素の object を、欄だけを持つ枠として見る（`run/log.ts` の `asFields` と同じ形） */
function asFields(raw: unknown): Record<string, unknown> {
  return typeof raw === 'object' && raw !== null ? { ...raw } : {};
}

/** 空でない文字列だけを値として読む */
function asText(value: unknown): string | undefined {
  return typeof value === 'string' && value !== '' ? value : undefined;
}

/**
 * details（外部から渡される未知の値）から、1行に並べる部分を読み取る。
 *
 * `type` は role として読む。読み取れた部分だけを入れ、何も読めなければ空を返す。
 */
export function noticeParts(details: unknown): NoticeParts {
  const fields = asFields(details);
  const id = asText(fields.id);
  const role = asText(fields.type);
  const state = asText(fields.state);
  const parts: string[] = [];
  if (id !== undefined) {
    parts.push(id);
  }
  if (role !== undefined) {
    parts.push(state === undefined ? role : `${role} / ${state}`);
  } else if (state !== undefined) {
    parts.push(state);
  }
  return parts;
}

/**
 * 部分と案内から1行を組み立てる。
 *
 * 部分は ` — ` でつなぎ、案内は括弧で添える。案内の名前が空のとき（キーが未設定のとき）は添えない。
 */
export function noticeLine(parts: NoticeParts, expandLabel: string): string {
  const head = parts.length === 0 ? '[consult]' : `[consult] ${parts.join(' — ')}`;
  return expandLabel === '' ? head : `${head} (${expandLabel} で展開)`;
}

/** 展開したときに並べる行（`turns`、`spend`、`files`）。読み取れたものだけを含む */
export function noticeDetailLines(details: unknown): readonly string[] {
  const fields = asFields(details);
  const lines: string[] = [];
  if (typeof fields.turns === 'number') {
    lines.push(`turns: ${fields.turns}`);
  }
  const spend = asText(fields.spend);
  if (spend !== undefined) {
    lines.push(`spend: ${spend}`);
  }
  if (Array.isArray(fields.files)) {
    const files = fields.files.filter((file): file is string => typeof file === 'string');
    lines.push(`files: ${files.length === 0 ? '(none)' : files.join(', ')}`);
  }
  return lines;
}

/** メッセージの本文。文字の塊だけをつなぐ */
function bodyOf(message: NoticeMessage): string {
  if (typeof message.content === 'string') {
    return message.content;
  }
  return message.content
    .map((block) => (block.type === 'text' ? block.text : ''))
    .filter((text) => text !== '')
    .join('\n');
}

/** consult のメッセージを描画する。常にコンポーネントを返す */
export function renderNotice(
  message: NoticeMessage,
  options: MessageRenderOptions,
  paint: NoticePaint,
): Component {
  const line = noticeLine(noticeParts(message.details), keyText('app.tools.expand'));
  const box = new Box(options.outputPad, 1, (text) => paint.bg('customMessageBg', text));
  box.addChild(new Text(paint.fg('customMessageText', line), 0, 0));
  if (!options.expanded) {
    return box;
  }
  const details = noticeDetailLines(message.details);
  if (details.length > 0) {
    box.addChild(new Text(paint.fg('customMessageText', details.join('\n')), 0, 0));
  }
  box.addChild(
    new Markdown(bodyOf(message), 0, 0, getMarkdownTheme(), {
      color: (text) => paint.fg('customMessageText', text),
    }),
  );
  return box;
}

/** レンダラーを登録する側のインターフェース。pi の `ExtensionAPI` が満たす */
export interface NoticeRegistry {
  registerMessageRenderer(customType: string, renderer: MessageRenderer): void;
}

/** `consult` のメッセージのレンダラーを登録する */
export function registerNotice(pi: NoticeRegistry): void {
  pi.registerMessageRenderer('consult', renderNotice);
}
