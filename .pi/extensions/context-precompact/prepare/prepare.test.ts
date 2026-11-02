import { describe, expect, it } from 'vitest';
import { prepare } from './prepare.ts';
import type { PrepareInput } from './types.ts';
import { defaultSettings } from '../settings/schema.ts';
import {
  createSessionFixture,
  projectEntries,
  type SessionFixture,
} from '../test/session-entries.ts';

const KEEP_RECENT_TOKENS = 1_500;
const TOKENS_BEFORE = 6_000;
const READ_PATH = 'a.ts';
const EDITED_PATH = 'b.ts';

function makeInput(session: SessionFixture, overrides: Partial<PrepareInput> = {}): PrepareInput {
  const branch = overrides.branch ?? session.turns(3);
  return {
    projectedEntries: projectEntries(branch),
    branch,
    tokensBefore: TOKENS_BEFORE,
    settings: { ...defaultSettings(), keepRecentTokens: KEEP_RECENT_TOKENS },
    piEnabled: true,
    sessionId: 's1',
    ...overrides,
  };
}

describe('prepare', () => {
  it('fromHook の details があるときだけ read と edited に path が入る', () => {
    const session = createSessionFixture();
    const prev = session.compaction('prev', {
      fromHook: true,
      details: { readFiles: [READ_PATH], modifiedFiles: [EDITED_PATH] },
    });
    const prepared = prepare(makeInput(session, { branch: [prev, ...session.turns(3)] }));
    expect(prepared?.compaction.fileOps.read.has(READ_PATH)).toBe(true);
    expect(prepared?.compaction.fileOps.edited.has(EDITED_PATH)).toBe(true);

    const emptySession = createSessionFixture();
    const emptyPrev = emptySession.compaction('prev');
    const emptyPrepared = prepare(
      makeInput(emptySession, { branch: [emptyPrev, ...emptySession.turns(3)] }),
    );
    expect(emptyPrepared).toBeDefined();
    expect(emptyPrepared?.compaction.fileOps.read.size).toBe(0);
    expect(emptyPrepared?.compaction.fileOps.written.size).toBe(0);
    expect(emptyPrepared?.compaction.fileOps.edited.size).toBe(0);

    const hookFalseSession = createSessionFixture();
    const hookFalseOld = hookFalseSession.compaction('old');
    const hookFalsePrev = hookFalseSession.compaction('prev', {
      fromHook: false,
      details: { readFiles: [READ_PATH], modifiedFiles: [EDITED_PATH] },
    });
    const hookFalsePrepared = prepare(
      makeInput(hookFalseSession, {
        branch: [hookFalseOld, hookFalsePrev, ...hookFalseSession.turns(3)],
      }),
    );
    expect(hookFalsePrepared?.compaction.fileOps.read.size).toBe(0);
    expect(hookFalsePrepared?.compaction.fileOps.edited.size).toBe(0);
  });

  it('details が配列でなければ例外を投げずに無視する', () => {
    const session = createSessionFixture();
    const prev = session.compaction('prev', {
      fromHook: true,
      details: { readFiles: READ_PATH, modifiedFiles: READ_PATH.length },
    });
    const input = makeInput(session, { branch: [prev, ...session.turns(3)] });
    expect(() => prepare(input)).not.toThrow();
    expect(prepare(input)?.compaction.fileOps.read.size).toBe(0);
  });

  it('いずれかが無効なら undefined になる', () => {
    const session = createSessionFixture();
    const settings = {
      ...defaultSettings(),
      keepRecentTokens: KEEP_RECENT_TOKENS,
      enabled: false,
    };
    expect(prepare(makeInput(session, { settings }))).toBeUndefined();

    const piSession = createSessionFixture();
    expect(prepare(makeInput(piSession, { piEnabled: false }))).toBeUndefined();
  });
});
