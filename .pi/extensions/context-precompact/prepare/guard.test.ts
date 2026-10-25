import { describe, expect, it } from 'vitest';
import type { SessionEntry } from '@earendil-works/pi-coding-agent';
import { guard } from './guard.ts';
import type { GuardInput, PrepareStamp } from './types.ts';

function entryOf(id: string): SessionEntry {
  return {
    type: 'message',
    id,
    parentId: null,
    timestamp: new Date(1).toISOString(),
    message: { role: 'user', content: [{ type: 'text', text: 'hi' }], timestamp: 1 },
  };
}

function stampOf(overrides: Partial<PrepareStamp> = {}): PrepareStamp {
  return { sessionId: 's1', leafId: 'leaf', latestCompactionId: undefined, ...overrides };
}

function inputOf(overrides: Partial<GuardInput> = {}): GuardInput {
  return {
    stamp: stampOf(),
    currentSessionId: 's1',
    branch: [entryOf('leaf'), entryOf('kept')],
    latestCompactionId: undefined,
    firstKeptEntryId: 'kept',
    ...overrides,
  };
}

describe('guard', () => {
  it('session、leaf、firstKept、latest が同じ → ok', () => {
    expect(guard(inputOf())).toEqual({ kind: 'ok' });
  });

  it('session が違う → session-changed', () => {
    expect(guard(inputOf({ currentSessionId: 's2' }))).toEqual({
      kind: 'stale',
      reason: 'session-changed',
    });
  });

  it('leaf が branch に無い → leaf-not-on-branch', () => {
    expect(guard(inputOf({ branch: [entryOf('other'), entryOf('kept')] }))).toEqual({
      kind: 'stale',
      reason: 'leaf-not-on-branch',
    });
  });

  it('firstKept が branch に無い → first-kept-missing', () => {
    expect(guard(inputOf({ branch: [entryOf('leaf'), entryOf('other')] }))).toEqual({
      kind: 'stale',
      reason: 'first-kept-missing',
    });
  });

  it('新しい compaction がある → new-compaction', () => {
    expect(guard(inputOf({ latestCompactionId: 'c2' }))).toEqual({
      kind: 'stale',
      reason: 'new-compaction',
    });
  });
});
