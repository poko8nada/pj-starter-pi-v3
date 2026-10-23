import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tempDir } from '../../../test/temp-dir.ts';
import { appendRun, deliveredKeys, KEEP_DAYS, readRuns, type RunRecord } from './run/log.ts';
import { pendingReports } from './run/delivery.ts';
import { placeFor, type Place } from './run/place.ts';
import { flushPending, startTick, stopTick, type TickPort } from './index.ts';
import { rowsOf } from './tool/subagents.ts';
import type { ConsultMessage, PiFace } from './tool/consult.ts';
import { SOUND_INTERVAL_MS, setPlayer, setSoundEnabled } from './tool/sound.ts';

function place(): Place {
  return placeFor(tempDir(), tempDir());
}

function record(extra: Partial<RunRecord> = {}): RunRecord {
  return {
    session: 'session-a',
    subagent: 'consult-1',
    role: 'review',
    pid: 1,
    started: 1000,
    ended: 2000,
    state: 'done',
    notice: 'できた',
    ...extra,
  };
}

function pending(found: Place, at: Date, extra: Partial<RunRecord> = {}): void {
  appendRun(found, record(extra), at);
}

function fakePi(fail: { next: boolean } = { next: false }): {
  pi: PiFace;
  sent: ConsultMessage[];
} {
  const sent: ConsultMessage[] = [];
  const pi: PiFace = {
    sendMessage: (message) => {
      if (fail.next) {
        fail.next = false;
        throw new Error('gone');
      }
      sent.push(message);
    },
  };
  return { pi, sent };
}

function portFor(
  found: Place,
  pi: PiFace,
  session = 'session-a',
  check?: TickPort['check'],
): TickPort {
  return {
    pi,
    place: found,
    sessionNow: () => session,
    ...(check === undefined ? {} : { check }),
  };
}

const played: string[] = [];

beforeEach(() => {
  played.length = 0;
  vi.useFakeTimers();
  setSoundEnabled(true);
  stopTick();
  setPlayer(() => {
    played.push('tink');
  });
});

afterEach(() => {
  stopTick();
  setSoundEnabled(true);
  vi.useRealTimers();
});

describe('flushPending', () => {
  it('印の無い完了を 1 件渡す → 1 を返す。印の行が 1 本増える', () => {
    const found = place();
    const at = new Date(2026, 9, 10, 12, 0);
    pending(found, at);
    const { pi, sent } = fakePi();

    expect(flushPending(portFor(found, pi))).toBe(1);

    expect(sent).toHaveLength(1);
    expect(sent[0]?.content).toBe('できた');
    const runs = readRuns(found, { session: 'session-a', days: KEEP_DAYS });
    expect(runs).toHaveLength(2);
    expect(deliveredKeys(runs).size).toBe(1);
    expect(pendingReports(found, { session: 'session-a', days: KEEP_DAYS })).toEqual([]);
  });

  it('0 件 → 0 を返す。送らない', () => {
    const found = place();
    const { pi, sent } = fakePi();

    expect(flushPending(portFor(found, pi))).toBe(0);
    expect(sent).toHaveLength(0);
  });
});

describe('startTick / stopTick', () => {
  it('印の無い完了の行、startTick、5 秒進める → 送り 1 回、印 1 本、音 1 回', () => {
    const found = place();
    const at = new Date(2026, 9, 10, 12, 0);
    pending(found, at);
    const { pi, sent } = fakePi();
    startTick(portFor(found, pi, 'session-a'));

    vi.advanceTimersByTime(SOUND_INTERVAL_MS);

    expect(sent).toHaveLength(1);
    expect(played).toHaveLength(1);
    const runs = readRuns(found, { session: 'session-a', days: KEEP_DAYS });
    expect(runs).toHaveLength(2);
    expect(deliveredKeys(runs).size).toBe(1);
    expect(pendingReports(found, { session: 'session-a', days: KEEP_DAYS })).toEqual([]);
  });

  it('走っている開始行 → 5 秒進める → 音が 1 回。送らない', () => {
    const found = place();
    appendRun(
      found,
      {
        session: 'session-a',
        subagent: 'consult-1',
        role: 'review',
        pid: process.pid,
        started: 1000,
      },
      new Date(),
    );
    const { pi, sent } = fakePi();
    startTick(portFor(found, pi, 'session-a'));

    vi.advanceTimersByTime(SOUND_INTERVAL_MS);

    expect(sent).toHaveLength(0);
    expect(played).toHaveLength(1);
  });

  it('何も無い → 5 秒進めても、送らず鳴らさない', () => {
    const found = place();
    const { pi, sent } = fakePi();
    startTick(portFor(found, pi, 'session-a'));

    vi.advanceTimersByTime(SOUND_INTERVAL_MS);

    expect(sent).toHaveLength(0);
    expect(played).toHaveLength(0);
  });

  it('音が off、印の無い完了 → 鳴らさず、送る', () => {
    const found = place();
    const at = new Date(2026, 9, 10, 12, 0);
    pending(found, at);
    setSoundEnabled(false);
    const { pi, sent } = fakePi();
    startTick(portFor(found, pi, 'session-a'));

    vi.advanceTimersByTime(SOUND_INTERVAL_MS);

    expect(sent).toHaveLength(1);
    expect(played).toHaveLength(0);
  });

  it('sendMessage が投げる → 印を書かない。次の tick で送り直す', () => {
    const found = place();
    const at = new Date(2026, 9, 10, 12, 0);
    pending(found, at);
    const fail = { next: true };
    const { pi, sent } = fakePi(fail);
    startTick(portFor(found, pi, 'session-a'));

    vi.advanceTimersByTime(SOUND_INTERVAL_MS);
    expect(sent).toHaveLength(0);

    vi.advanceTimersByTime(SOUND_INTERVAL_MS);
    expect(sent).toHaveLength(1);
  });

  it('startTick を 2 回呼ぶ → タイマーは 1 本。5 秒で送信 1 回、音 1 回', () => {
    const found = place();
    const at = new Date(2026, 9, 10, 12, 0);
    pending(found, at);
    const { pi, sent } = fakePi();
    const port = portFor(found, pi, 'session-a');
    startTick(port);
    startTick(port);

    vi.advanceTimersByTime(SOUND_INTERVAL_MS);

    expect(sent).toHaveLength(1);
    expect(played).toHaveLength(1);
  });

  it('stopTick の後、10 秒進める → 送らず鳴らさない', () => {
    const found = place();
    const at = new Date(2026, 9, 10, 12, 0);
    pending(found, at);
    const { pi, sent } = fakePi();
    startTick(portFor(found, pi, 'session-a'));
    stopTick();

    vi.advanceTimersByTime(SOUND_INTERVAL_MS * 2);

    expect(sent).toHaveLength(0);
    expect(played).toHaveLength(0);
  });
});

describe('reload', () => {
  it('古いインスタンスの完了 → 新しい tick が 1 回渡し、印を書く。次は渡さない', () => {
    const found = place();
    // old instance wrote the completion row and is gone
    appendRun(found, record({ subagent: 'consult-9' }), new Date());
    const { pi, sent } = fakePi();
    startTick(portFor(found, pi, 'session-a'));

    vi.advanceTimersByTime(SOUND_INTERVAL_MS);
    expect(sent).toHaveLength(1);
    expect(flushPending(portFor(found, pi))).toBe(0);

    vi.advanceTimersByTime(SOUND_INTERVAL_MS);
    expect(sent).toHaveLength(1);
  });

  it('同じ印で一覧は running から done へ、音は鳴るから鳴らないへ', () => {
    const found = place();
    appendRun(found, record({ subagent: 'consult-9' }), new Date());

    const before = rowsOf(readRuns(found, { session: 'session-a' }), undefined, 0);
    expect(before).toHaveLength(1);
    expect(before[0]).toContain('running');

    const { pi, sent } = fakePi();
    startTick(portFor(found, pi, 'session-a'));

    vi.advanceTimersByTime(SOUND_INTERVAL_MS);
    expect(sent).toHaveLength(1);
    expect(played).toHaveLength(1);

    const after = rowsOf(readRuns(found, { session: 'session-a' }), undefined, 0);
    expect(after).toHaveLength(1);
    expect(after[0]).toContain('done');
    expect(after[0]).not.toContain('running');

    vi.advanceTimersByTime(SOUND_INTERVAL_MS);
    expect(sent).toHaveLength(1);
    expect(played).toHaveLength(1);
  });
});
