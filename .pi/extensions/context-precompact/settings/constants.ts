/**
 * context-precompact の内部定数。
 *
 * `RESERVE_TOKENS` は `compact()` に渡す `reserveTokens`、
 * `LEAD_RATIO` は準備を始める手前、
 * `MIN_OLD_RATIO` は古い領域の最小、
 * `REARM_RATIO` は再発動の幅、
 * `SUMMARY_TIMEOUT_MS` は要約の打ち切り（5分）、
 * `MAX_IN_FLIGHT` は同時実行の上限。
 */
export const RESERVE_TOKENS = 16_384;
export const LEAD_RATIO = 0.05;
export const MIN_OLD_RATIO = 0.1;
export const REARM_RATIO = 0.05;
export const SUMMARY_TIMEOUT_MS = 300_000;
export const MAX_IN_FLIGHT = 1;
export const DEFAULT_KEEP_RECENT_TOKENS = 20_000;
export const DEFAULT_THRESHOLD_RATIO = 0.8;
export const MIN_THRESHOLD_RATIO = 0.5;
export const MAX_THRESHOLD_RATIO = 0.95;
export const MIN_KEEP_RECENT_TOKENS = 1;
