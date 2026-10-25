import { describe, expect, it } from 'vitest';
import { prepareFromProjection } from './copied.ts';
import type { CompactionSettings } from './types.ts';
import { RESERVE_TOKENS } from '../settings/constants.ts';
import { createSessionFixture, projectEntries } from '../test/session-entries.ts';

const KEEP_RECENT_TOKENS = 1_500;
const SMALL_KEEP_TOKENS = 500;
const TOKENS_BEFORE = 6_000;
const PREVIOUS_SUMMARY = 'previous summary';

function settingsOf(keepRecentTokens: number): CompactionSettings {
  return { enabled: true, reserveTokens: RESERVE_TOKENS, keepRecentTokens };
}

describe('prepareFromProjection', () => {
  it('3 ターンと小さい keep → 最後から 2 番目が firstKept で要約対象が空でない', () => {
    const session = createSessionFixture();
    const pathEntries = session.turns(3);
    const prepared = prepareFromProjection({
      projectedEntries: projectEntries(pathEntries),
      pathEntries,
      settings: settingsOf(KEEP_RECENT_TOKENS),
      tokensBefore: TOKENS_BEFORE,
    });
    expect(prepared?.firstKeptEntryId).toBe(pathEntries.at(-2)?.id);
    expect(prepared?.messagesToSummarize.length).toBeGreaterThan(0);
  });

  it('最後が compaction → undefined', () => {
    const session = createSessionFixture();
    const pathEntries = [...session.turns(3), session.compaction('prev')];
    expect(
      prepareFromProjection({
        projectedEntries: projectEntries(pathEntries),
        pathEntries,
        settings: settingsOf(KEEP_RECENT_TOKENS),
        tokensBefore: TOKENS_BEFORE,
      }),
    ).toBeUndefined();
  });

  it('メッセージが 1 件も無い → undefined', () => {
    const session = createSessionFixture();
    const only = session.user('question');
    expect(
      prepareFromProjection({
        projectedEntries: [{ sourceEntry: only, messages: [] }],
        pathEntries: [only],
        settings: settingsOf(KEEP_RECENT_TOKENS),
        tokensBefore: TOKENS_BEFORE,
      }),
    ).toBeUndefined();
  });

  it('1 つの user 区間が keep を超える → split で turnPrefix が空でない', () => {
    const session = createSessionFixture();
    const pathEntries = session.turns(1);
    const prepared = prepareFromProjection({
      projectedEntries: projectEntries(pathEntries),
      pathEntries,
      settings: settingsOf(SMALL_KEEP_TOKENS),
      tokensBefore: TOKENS_BEFORE,
    });
    expect(prepared?.isSplitTurn).toBe(true);
    expect(prepared?.turnPrefixMessages.length).toBeGreaterThan(0);
  });

  it('前回の compaction がある → previousSummary がその summary', () => {
    const session = createSessionFixture();
    const prev = session.compaction(PREVIOUS_SUMMARY);
    const pathEntries = [prev, ...session.turns(3)];
    const prepared = prepareFromProjection({
      projectedEntries: projectEntries(pathEntries),
      pathEntries,
      settings: settingsOf(KEEP_RECENT_TOKENS),
      tokensBefore: TOKENS_BEFORE,
    });
    expect(prepared?.previousSummary).toBe(PREVIOUS_SUMMARY);
  });

  it('read / edit / write の tool call → それぞれの集合に path', () => {
    const session = createSessionFixture();
    const cases = [
      { name: 'read', path: 'r.ts', set: 'read' },
      { name: 'edit', path: 'e.ts', set: 'edited' },
      { name: 'write', path: 'w.ts', set: 'written' },
    ] as const;
    for (const item of cases) {
      const pathEntries = [session.toolCall(item.name, item.path), ...session.turns(1)];
      const prepared = prepareFromProjection({
        projectedEntries: projectEntries(pathEntries),
        pathEntries,
        settings: settingsOf(KEEP_RECENT_TOKENS),
        tokensBefore: TOKENS_BEFORE,
      });
      expect(prepared?.fileOps[item.set].has(item.path), item.name).toBe(true);
    }
  });

  it('前回の Pi 生成 compaction の details.readFiles → fileOps.read に path', () => {
    const session = createSessionFixture();
    const prev = session.compaction('prev', {
      details: { readFiles: ['prev.ts'], modifiedFiles: [] },
    });
    const pathEntries = [prev, ...session.turns(3)];
    const prepared = prepareFromProjection({
      projectedEntries: projectEntries(pathEntries),
      pathEntries,
      settings: settingsOf(KEEP_RECENT_TOKENS),
      tokensBefore: TOKENS_BEFORE,
    });
    expect(prepared?.fileOps.read.has('prev.ts')).toBe(true);
  });
});
