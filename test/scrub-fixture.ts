/**
 * thinking の本文と印の工場。
 *
 * 値と文字列を組み立てるだけで、プロセスも FS も開かない。
 * テストの外から読まれても、何も起きずに止まらない。
 */

/** 退化の前後の印。`degenerate()` と期待値を同じ値から組む */
export const DEGENERATE_PREFIX = 'foo';
export const DEGENERATE_SUFFIX = 'bar';
export const DEGENERATE_UNIT = 'the *';
export const DEGENERATE_REPEATS = 12;

/** 退化した thinking の本文。前後の印の間に短い周期が続く */
export function degenerate(): string {
  return `${DEGENERATE_PREFIX}${DEGENERATE_UNIT.repeat(DEGENERATE_REPEATS)}${DEGENERATE_SUFFIX}`;
}

/** `degenerate()` が畳まれた後の本文。前後の印を空白 1 個でつなげる */
export function degenerateExpected(): string {
  return `${DEGENERATE_PREFIX} ${DEGENERATE_SUFFIX}`;
}

/** 文ループの 1 文。`index` で文面を変える */
export function loopSentence(index: number): string {
  return `scrub loop ${index} proceeds with steady reasoning about the task and its details.`;
}

/** 文の並びを `cycles` 回つなげる。区切りは既定で空白 1 個 */
export function cycleText(pattern: readonly string[], cycles: number, sep = ' '): string {
  return Array.from({ length: cycles }, () => pattern.join(' ')).join(sep);
}

/** `loopSentence` の 3 文周期で `length` 文字の thinking を作る。`base` は開始番号 */
export function thinkingWithRun(length: number, base = 0): string {
  const pattern = [loopSentence(base), loopSentence(base + 1), loopSentence(base + 2)];
  const cycle = pattern.join(' ');
  let text = '';
  while (text.length < length) {
    text += (text.length === 0 ? '' : ' ') + cycle;
  }
  return text.slice(0, length);
}

/** 通知と指示の印を 1 か所に集める。製品の文言が変わればここだけ直す */
export const SCRUB_PREFIX = 'thinking-scrub:';
export const SCRUB_REMOVED_MARK = 'thinking-scrub: removed';
export const SCRUB_OFF_LINE = 'thinking-scrub: off';
export const SCRUB_ON_LINE = 'thinking-scrub: on';
export const SCRUB_SHOW_LINE = 'thinking-scrub: show';
export const SCRUB_HIDE_LINE = 'thinking-scrub: hide';
export const SCRUB_USAGE_MARK = 'usage';
export const SCRUB_SHOW_ON = 'show: on';
export const SCRUB_SHOW_OFF = 'show: off';
export const SCRUB_REMOVED_LABEL = 'removed:';
export const SCRUB_BROKEN_MARK = 'broken';
export const SCRUB_DEFAULTS_MARK = 'defaults';
export const SCRUB_LAST_NONE = 'last: まだ無い';
export const FOLLOWUP_REPEATING = 'repeating';
export const FOLLOWUP_DO_NOT = 'Do not repeat';
export const FOLLOWUP_CONTINUE = 'Continue';
export const FOLLOWUP_SAMPLE_HEADING = 'Repeating sample:';
