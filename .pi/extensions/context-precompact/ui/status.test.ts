import { describe, expect, it } from 'vitest';
import { notifyText, notifyType, statusText } from './status.ts';

const BEFORE = 1_000;
const AFTER = 500;
const MILLION = 1_000_000;

describe('statusText', () => {
  it('preparing → preparing…', () => {
    expect(statusText({ kind: 'preparing' })).toBe('precompact: preparing…');
  });

  it('ready の BEFORE → AFTER → ready 1,000 → 500', () => {
    expect(statusText({ kind: 'ready', before: BEFORE, after: AFTER })).toBe(
      'precompact: ready (1,000 → 500)',
    );
  });

  it('failed → failed とフォールバック通知', () => {
    expect(statusText({ kind: 'failed' })).toBe('precompact: failed');
    expect(notifyText({ kind: 'failed' })).toBe('precompact: failed; default compaction will run');
  });

  it('applied → status は undefined、通知は applied 1,000 → 500', () => {
    expect(statusText({ kind: 'applied', before: BEFORE, after: AFTER })).toBeUndefined();
    expect(notifyText({ kind: 'applied', before: BEFORE, after: AFTER })).toBe(
      'precompact: applied (1,000 → 500)',
    );
  });

  it('idle → status も通知も undefined', () => {
    expect(statusText({ kind: 'idle' })).toBeUndefined();
    expect(notifyText({ kind: 'idle' })).toBeUndefined();
    expect(notifyType({ kind: 'idle' })).toBeUndefined();
  });

  it('0 と MILLION の組 → カンマが入る', () => {
    expect(statusText({ kind: 'ready', before: MILLION, after: 0 })).toBe(
      'precompact: ready (1,000,000 → 0)',
    );
    expect(notifyType({ kind: 'applied', before: BEFORE, after: AFTER })).toBe('info');
    expect(notifyType({ kind: 'failed' })).toBe('warning');
  });
});
