import { describe, expect, it } from 'vitest';
import { prepareFromProjection } from './copied.ts';
import type { CompactionSettings } from './types.ts';
import { RESERVE_TOKENS } from '../settings/constants.ts';
import { projectEntries, sessionWithTurns } from '../test/session-entries.ts';

const KEEP_RECENT_TOKENS = 1_500;
const SMALL_KEEP_TOKENS = 500;
const TOKENS_BEFORE = 6_000;
const PREVIOUS_SUMMARY = 'previous summary';

function settingsOf(keepRecentTokens: number): CompactionSettings {
  return { enabled: true, reserveTokens: RESERVE_TOKENS, keepRecentTokens };
}

describe('prepareFromProjection', () => {
  it('3 ターンと小さい keep なら最後から 2 番目が firstKept で要約対象が空でない', () => {
    const { branch } = sessionWithTurns(3);
    const prepared = prepareFromProjection({
      projectedEntries: projectEntries(branch),
      pathEntries: branch,
      settings: settingsOf(KEEP_RECENT_TOKENS),
      tokensBefore: TOKENS_BEFORE,
    });
    expect(prepared?.firstKeptEntryId).toBe(branch.at(-2)?.id);
    expect(prepared?.messagesToSummarize.length).toBeGreaterThan(0);
  });

  it('最後が compaction なら undefined になる', () => {
    const { session, branch: turns } = sessionWithTurns(3);
    const pathEntries = [...turns, session.compaction('prev')];
    expect(
      prepareFromProjection({
        projectedEntries: projectEntries(pathEntries),
        pathEntries,
        settings: settingsOf(KEEP_RECENT_TOKENS),
        tokensBefore: TOKENS_BEFORE,
      }),
    ).toBeUndefined();
  });

  it('メッセージが 1 件もなければ undefined になる', () => {
    const { session } = sessionWithTurns(0);
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

  it('1 つの user 区間が keep を超えれば split で turnPrefix が空でない', () => {
    const { branch } = sessionWithTurns(1);
    const prepared = prepareFromProjection({
      projectedEntries: projectEntries(branch),
      pathEntries: branch,
      settings: settingsOf(SMALL_KEEP_TOKENS),
      tokensBefore: TOKENS_BEFORE,
    });
    expect(prepared?.isSplitTurn).toBe(true);
    expect(prepared?.turnPrefixMessages.length).toBeGreaterThan(0);
  });

  it('前回の compaction があれば previousSummary がその summary になる', () => {
    const { session, branch: turns } = sessionWithTurns(3);
    const prev = session.compaction(PREVIOUS_SUMMARY);
    const pathEntries = [prev, ...turns];
    const prepared = prepareFromProjection({
      projectedEntries: projectEntries(pathEntries),
      pathEntries,
      settings: settingsOf(KEEP_RECENT_TOKENS),
      tokensBefore: TOKENS_BEFORE,
    });
    expect(prepared?.previousSummary).toBe(PREVIOUS_SUMMARY);
  });

  it('read と edit と write の tool call はそれぞれの集合に path が入る', () => {
    const { session, branch: turns } = sessionWithTurns(1);
    const cases = [
      { name: 'read', path: 'r.ts', set: 'read' },
      { name: 'edit', path: 'e.ts', set: 'edited' },
      { name: 'write', path: 'w.ts', set: 'written' },
    ] as const;
    for (const item of cases) {
      const toolEntry = session.toolCall(item.name, item.path);
      const pathEntries = [toolEntry, ...turns];
      const prepared = prepareFromProjection({
        projectedEntries: projectEntries(pathEntries),
        pathEntries,
        settings: settingsOf(KEEP_RECENT_TOKENS),
        tokensBefore: TOKENS_BEFORE,
      });
      expect(prepared?.fileOps[item.set].has(item.path), item.name).toBe(true);
    }
  });

  it('前回の Pi 生成 compaction の details.readFiles は fileOps.read に path が入る', () => {
    const { session, branch: turns } = sessionWithTurns(3);
    const prev = session.compaction('prev', {
      details: { readFiles: ['prev.ts'], modifiedFiles: [] },
    });
    const pathEntries = [prev, ...turns];
    const prepared = prepareFromProjection({
      projectedEntries: projectEntries(pathEntries),
      pathEntries,
      settings: settingsOf(KEEP_RECENT_TOKENS),
      tokensBefore: TOKENS_BEFORE,
    });
    expect(prepared?.fileOps.read.has('prev.ts')).toBe(true);
  });
});
