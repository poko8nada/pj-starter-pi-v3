import { describe, expect, it } from 'vitest';
import { prepare } from './prepare.ts';
import type { PrepareInput } from './types.ts';
import { defaultSettings } from '../settings/schema.ts';
import { projectEntries, sessionWithTurns } from '../test/session-entries.ts';

const KEEP_RECENT_TOKENS = 1_500;
const TOKENS_BEFORE = 6_000;
const READ_PATH = 'a.ts';
const EDITED_PATH = 'b.ts';

function makeInput(
  overrides: Partial<PrepareInput> & { readonly branch: PrepareInput['branch'] },
): PrepareInput {
  const { branch } = overrides;
  return {
    projectedEntries: projectEntries(branch),
    tokensBefore: TOKENS_BEFORE,
    settings: { ...defaultSettings(), keepRecentTokens: KEEP_RECENT_TOKENS },
    piEnabled: true,
    sessionId: 's1',
    ...overrides,
  };
}

describe('prepare', () => {
  it('fromHook の details があるときだけ read と edited に path が入る', () => {
    const { session, branch: turns } = sessionWithTurns(3);
    const prev = session.compaction('prev', {
      fromHook: true,
      details: { readFiles: [READ_PATH], modifiedFiles: [EDITED_PATH] },
    });
    const prepared = prepare(makeInput({ branch: [prev, ...turns] }));
    expect(prepared?.compaction.fileOps.read.has(READ_PATH)).toBe(true);
    expect(prepared?.compaction.fileOps.edited.has(EDITED_PATH)).toBe(true);

    const { session: emptySession, branch: emptyTurns } = sessionWithTurns(3);
    const emptyPrev = emptySession.compaction('prev');
    const emptyPrepared = prepare(makeInput({ branch: [emptyPrev, ...emptyTurns] }));
    expect(emptyPrepared).toBeDefined();
    expect(emptyPrepared?.compaction.fileOps.read.size).toBe(0);
    expect(emptyPrepared?.compaction.fileOps.written.size).toBe(0);
    expect(emptyPrepared?.compaction.fileOps.edited.size).toBe(0);

    const { session: hookFalseSession, branch: hookFalseTurns } = sessionWithTurns(3);
    const hookFalseOld = hookFalseSession.compaction('old');
    const hookFalsePrev = hookFalseSession.compaction('prev', {
      fromHook: false,
      details: { readFiles: [READ_PATH], modifiedFiles: [EDITED_PATH] },
    });
    const hookFalsePrepared = prepare(
      makeInput({
        branch: [hookFalseOld, hookFalsePrev, ...hookFalseTurns],
      }),
    );
    expect(hookFalsePrepared?.compaction.fileOps.read.size).toBe(0);
    expect(hookFalsePrepared?.compaction.fileOps.edited.size).toBe(0);
  });

  it('details が配列でなければ例外を投げずに無視する', () => {
    const { session, branch: turns } = sessionWithTurns(3);
    const prev = session.compaction('prev', {
      fromHook: true,
      details: { readFiles: READ_PATH, modifiedFiles: READ_PATH.length },
    });
    const input = makeInput({ branch: [prev, ...turns] });
    expect(() => prepare(input)).not.toThrow();
    expect(prepare(input)?.compaction.fileOps.read.size).toBe(0);
  });

  it('いずれかが無効なら undefined になる', () => {
    const { branch } = sessionWithTurns(3);
    const settings = {
      ...defaultSettings(),
      keepRecentTokens: KEEP_RECENT_TOKENS,
      enabled: false,
    };
    expect(prepare(makeInput({ branch, settings }))).toBeUndefined();

    const { branch: piBranch } = sessionWithTurns(3);
    expect(prepare(makeInput({ branch: piBranch, piEnabled: false }))).toBeUndefined();
  });
});
