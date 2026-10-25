/**
 * フッターと通知の文言。数字は `formatCount` で整える。
 */
import { formatCount } from './count.ts';

export type StatusState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'preparing' }
  | { readonly kind: 'ready'; readonly before: number; readonly after: number }
  | { readonly kind: 'failed' }
  | { readonly kind: 'applied'; readonly before: number; readonly after: number }
  | { readonly kind: 'discarded' };

/** フッターに出す文言。無ければ `undefined` で clear */
export function statusText(state: StatusState): string | undefined {
  switch (state.kind) {
    case 'preparing':
      return 'precompact: preparing…';
    case 'ready':
      return `precompact: ready (${formatCount(state.before)} → ${formatCount(state.after)})`;
    case 'failed':
      return 'precompact: failed';
    case 'applied':
      return `precompact: applied (${formatCount(state.before)} → ${formatCount(state.after)})`;
    case 'discarded':
    case 'idle':
      return undefined;
  }
  return undefined;
}

/** 通知に出す文言。無ければ `undefined` で出さない */
export function notifyText(state: StatusState): string | undefined {
  switch (state.kind) {
    case 'failed':
    case 'discarded':
      return 'precompact: failed; default compaction will run';
    case 'idle':
    case 'preparing':
    case 'ready':
    case 'applied':
      return undefined;
  }
  return undefined;
}

/** 通知の種類。無ければ `undefined` */
export function notifyType(state: StatusState): 'info' | 'warning' | 'error' | undefined {
  switch (state.kind) {
    case 'failed':
    case 'discarded':
      return 'warning';
    case 'idle':
    case 'preparing':
    case 'ready':
    case 'applied':
      return undefined;
  }
  return undefined;
}
