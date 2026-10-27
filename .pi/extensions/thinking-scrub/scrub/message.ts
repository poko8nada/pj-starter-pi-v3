/**
 * thinking ブロックの書き換え。純関数だけを置く。
 *
 * replay 先が reasoning のフィールド名のブロックだけを畳む。
 * 署名が無い・JSON・redacted のブロックには触らない。
 */

import type { MessageEndEvent } from '@earendil-works/pi-coding-agent';
import type { Tuning } from '../settings/schema.ts';
import { scrubThinking } from './detect.ts';

type AgentMessage = MessageEndEvent['message'];

export const REPLAY_FIELDS = ['reasoning_content', 'reasoning', 'reasoning_text'] as const;

export interface ThinkingBlock {
  readonly type: 'thinking';
  readonly thinking: string;
  readonly thinkingSignature?: string;
  readonly redacted?: boolean;
}

export interface Scrubbed {
  readonly message: AgentMessage;
  readonly removed: number;
  readonly chars: number;
}

/** 本文が次のリクエストに届くブロックか */
export function isReplayable(block: ThinkingBlock): boolean {
  if (block.redacted === true) {
    return false;
  }
  const signature = block.thinkingSignature;
  if (signature === undefined) {
    return false;
  }
  for (const field of REPLAY_FIELDS) {
    if (signature === field) {
      return true;
    }
  }
  return false;
}

function isThinkingBlock(block: unknown): block is ThinkingBlock {
  if (typeof block !== 'object' || block === null || Array.isArray(block)) {
    return false;
  }
  if (!('type' in block) || !('thinking' in block)) {
    return false;
  }
  return block.type === 'thinking' && typeof block.thinking === 'string';
}

/** assistant の thinking を書き換える。変わらなければ undefined */
export function scrubMessage(message: AgentMessage, tuning: Tuning): Scrubbed | undefined {
  if (message.role !== 'assistant') {
    return undefined;
  }
  if (!Array.isArray(message.content)) {
    return undefined;
  }
  let removed = 0;
  let chars = 0;
  const next: typeof message.content = [];
  for (const block of message.content) {
    if (isThinkingBlock(block) && isReplayable(block)) {
      const scrubbed = scrubThinking(block.thinking, tuning);
      if (scrubbed.removed > 0 && scrubbed.text.trim() !== '') {
        removed += scrubbed.removed;
        chars += block.thinking.length - scrubbed.text.length;
        next.push({ ...block, thinking: scrubbed.text });
        continue;
      }
    }
    next.push(block);
  }
  if (removed === 0) {
    return undefined;
  }
  return { message: { ...message, content: next }, removed, chars };
}
