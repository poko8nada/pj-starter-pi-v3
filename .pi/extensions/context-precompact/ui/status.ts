/**
 * フッター、チャット、`/precompact` の文言。数字は `formatCount` で整える。
 *
 * 文面の持ち主はこの 1 ファイルだけにする。`index.ts` はここから引く。
 */
import { formatCount } from './count.ts';

export type StatusState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'preparing' }
  | { readonly kind: 'ready'; readonly before: number; readonly after: number }
  | { readonly kind: 'failed'; readonly reason: string }
  | { readonly kind: 'applied'; readonly before: number; readonly after: number }
  | { readonly kind: 'discarded' };

export type NotifiableStatus = Extract<StatusState, { kind: 'preparing' | 'ready' | 'applied' }>;

/** チャットに出す短い通知の種類 */
export type NoticeKind = 'on' | 'off' | 'nothing' | 'running';

/** 準備を捨てたときの警告。理由を持たない */
export const FALLBACK_TEXT = 'precompact: failed; default compaction will run';

/** チャットに出す文言。`preparing` / `ready` / `applied` だけを受け取る */
export function chatText(status: NotifiableStatus): string {
  switch (status.kind) {
    case 'preparing':
      return 'precompact: preparing…';
    case 'ready':
      return `precompact: ready (${formatCount(status.before)} → ${formatCount(status.after)})`;
    case 'applied':
      return `precompact: applied (${formatCount(status.before)} → ${formatCount(status.after)})`;
  }
  const exhaustive: never = status;
  return exhaustive;
}

/** チャットに出す短い通知 */
export function noticeText(notice: NoticeKind): string {
  switch (notice) {
    case 'on':
      return 'precompact: on';
    case 'off':
      return 'precompact: off';
    case 'nothing':
      return 'precompact: nothing to prepare';
    case 'running':
      return 'precompact: running';
  }
  const exhaustive: never = notice;
  return exhaustive;
}

/** 要約が失敗したときの警告。理由を入れる */
export function failureText(reason: string): string {
  return `precompact: failed (${reason}); default compaction will run`;
}

/** `settings.json` が壊れているときの警告 */
export function brokenText(reason: string): string {
  return `context-precompact: settings broken (${reason})`;
}

/** フッターに出す文言。無ければ `undefined` で clear */
export function statusText(state: StatusState): string | undefined {
  switch (state.kind) {
    case 'preparing':
    case 'ready':
    case 'applied':
      return chatText(state);
    case 'failed':
      return 'precompact: failed';
    case 'discarded':
    case 'idle':
      return undefined;
  }
  return undefined;
}

/** `/precompact` の status 行に出す文言 */
export function statusLine(state: StatusState): string {
  switch (state.kind) {
    case 'idle':
      return 'idle';
    case 'preparing':
      return 'preparing';
    case 'ready':
      return `ready (${formatCount(state.before)} → ${formatCount(state.after)})`;
    case 'applied':
      return `applied (${formatCount(state.before)} → ${formatCount(state.after)})`;
    case 'failed':
      return `failed (${state.reason})`;
    case 'discarded':
      return 'discarded';
  }
  const exhaustive: never = state;
  return exhaustive;
}
