/**
 * thinking-scrub のテストが使うファクトリである。
 *
 * thinking の本文と印と assistant メッセージを作る。
 * 退化した thinking が既定の本文である（形はホスト、中身は機能）。
 * pi の `usage` と型はここで作る。同じものを作らない。
 *
 * 値と文字列を組み立てるが、`scrubWiring` は `settingsDirWith` で一時ファイルを開く。
 * テストの外から読まれても、何も起きずに止まらない。
 */
import type { MessageEndEvent } from '@earendil-works/pi-coding-agent';
import { settingsDirWith } from '../../../test/settings.fixture.ts';
import { createScrubWiring, type ScrubWiring } from './index.ts';
import { emptyGuard, observe, type GuardStep } from './live/guard.ts';
import { readSettings } from './settings/read.ts';
import { defaultSettings, type SettingsRead, type Tuning } from './settings/schema.ts';

export type PiAssistantMessage = MessageEndEvent['message'];

/** pi の `usage` を作る */
export function piUsage() {
  return {
    input: 1,
    output: 1,
    cacheRead: 0,
    cacheWrite: 0,
    totalTokens: 2,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
  };
}

/** 退化の前後の印である。`degenerate()` と期待値を同じ値から組む。 */
export const DEGENERATE_PREFIX = 'foo';
export const DEGENERATE_SUFFIX = 'bar';
export const DEGENERATE_UNIT = 'the *';
export const DEGENERATE_REPEATS = 12;

/** 退化した thinking の本文である。前後の印の間に短い周期が続く。 */
export function degenerate(): string {
  return `${DEGENERATE_PREFIX}${DEGENERATE_UNIT.repeat(DEGENERATE_REPEATS)}${DEGENERATE_SUFFIX}`;
}

/** `degenerate()` をまとめた後の本文である。前後の印を空白 1 個でつなげる。 */
export function degenerateExpected(): string {
  return `${DEGENERATE_PREFIX} ${DEGENERATE_SUFFIX}`;
}

/** 文ループの 1 文である。`index` で文面を変える。 */
export function loopSentence(index: number): string {
  return `scrub loop ${index} proceeds with steady reasoning about the task and its details.`;
}

/** 文の並びを `cycles` 回つなげる。区切りは既定で空白 1 個である。 */
export function cycleText(pattern: readonly string[], cycles: number, sep = ' '): string {
  return Array.from({ length: cycles }, () => pattern.join(' ')).join(sep);
}

/** `loopSentence` の 3 文周期で `length` 文字の thinking を作る。`base` は開始番号である。 */
export function thinkingWithRun(length: number, base = 0): string {
  const pattern = [loopSentence(base), loopSentence(base + 1), loopSentence(base + 2)];
  const cycle = pattern.join(' ');
  let text = '';
  while (text.length < length) {
    text += (text.length === 0 ? '' : ' ') + cycle;
  }
  return text.slice(0, length);
}

/** assistant メッセージを作る。既定は退化した thinking 1 件である。 */
export function assistantMessage(overrides: Record<string, unknown> = {}): PiAssistantMessage {
  const base = {
    role: 'assistant',
    content: [{ type: 'thinking', thinking: degenerate(), thinkingSignature: 'reasoning_content' }],
    api: 'openai-completions',
    provider: 'opencode-go',
    model: 'deepseek-v4.1-flash',
    usage: piUsage(),
    stopReason: 'stop',
    timestamp: 123,
  };
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- テストの偽物を作る
  return { ...base, ...overrides } as unknown as PiAssistantMessage;
}

/** テストが期待する文言を 1 箇所に集める。製品の文言は実装側にもあるため、変えるときは両方を修正する。 */
export const SCRUB_PREFIX = 'thinking-scrub:';
export const SCRUB_REMOVED_MARK = 'thinking-scrub: removed';
export const SCRUB_OFF_LINE = 'thinking-scrub: off';
export const SCRUB_ON_LINE = 'thinking-scrub: on';
export const SCRUB_SHOW_LINE = 'thinking-scrub: show';
export const SCRUB_HIDE_LINE = 'thinking-scrub: hide';
export const SCRUB_USAGE_LINE = 'thinking-scrub usage: /thinking-scrub [on|off|show|hide]';
export const SCRUB_SHOW_ON = 'show: on';
export const SCRUB_SHOW_OFF = 'show: off';
export const SCRUB_REMOVED_LABEL = 'removed:';
export const SCRUB_BROKEN_MARK = 'broken';
export const SCRUB_DEFAULTS_MARK = 'defaults';
export const SCRUB_LAST_NONE = 'last: まだない';
export const FOLLOWUP_REPEATING = 'repeating';
export const FOLLOWUP_DO_NOT = 'Do not repeat';
export const FOLLOWUP_CONTINUE = 'Continue';

/** 配線を作る。既定は空の設定の一時ディレクトリと固定時刻で動く。 */
export function scrubWiring(
  options: {
    readonly settingsDir?: string;
    readonly readSettings?: () => SettingsRead;
    readonly followUp?: (content: string) => void;
  } = {},
): ScrubWiring {
  const dir = options.settingsDir ?? settingsDirWith({});
  return createScrubWiring({
    settingsDir: dir,
    now: () => 7,
    followUp: options.followUp ?? (() => undefined),
    readSettings: options.readSettings ?? (() => readSettings(dir)),
  });
}

/** 既定のガードで thinking を 1 回見る。 */
export function observeIn(thinking: string, tuning: Tuning = defaultSettings()): GuardStep {
  return observe(emptyGuard(), thinking, tuning, () => true);
}

/** 削除の通知の 1 行を作る。 */
export function removedLine(runs: number, chars: number): string {
  return `${SCRUB_REMOVED_MARK} ${runs} (${chars} chars)`;
}
