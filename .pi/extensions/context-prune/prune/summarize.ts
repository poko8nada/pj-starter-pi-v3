/**
 * 要約の促しと本文の抜き出し。要約は判定の state にだけ入れ、文脈には入れない。
 */

import type { EntryMessage } from './collect.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** 要約の促し。見出しと上限を 1 つの文にする */
export function summaryPrompt(maxTokens: number): string {
  return [
    'Summarize the recent conversation so older tool results can be judged without reading them.',
    `Keep the summary within ${maxTokens} tokens.`,
    'Use exactly these headings:',
    '## Goal',
    '## Progress',
    '## Decisions',
    '## Next steps',
  ].join('\n');
}

/** text ブロックだけを連結する。text が無ければ空文字 */
export function assistantText(message: EntryMessage): string {
  if (!('content' in message)) {
    return '';
  }
  const content: unknown = message.content;
  if (typeof content === 'string') {
    return content;
  }
  if (!Array.isArray(content)) {
    return '';
  }
  const parts: string[] = [];
  for (const block of content) {
    if (isRecord(block) && block['type'] === 'text' && typeof block['text'] === 'string') {
      parts.push(block['text']);
    }
  }
  return parts.join('');
}
