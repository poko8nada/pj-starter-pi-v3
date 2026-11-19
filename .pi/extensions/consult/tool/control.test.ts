import { describe, expect, it } from 'vitest';
import { tempDir } from '../../../../test/temp-dir.ts';
import { aRunRecord, START_TOKEN } from '../consult.fixture.ts';
import { appendRun, type RunRecord } from '../run/log.ts';
import { placeFor, type Place } from '../run/place.ts';
import { controlSubagent } from './control.ts';

const SESSION = 'test-session';

/** 走っている行を 1 本書く。pid が生きている間だけ述語は true。`extra` で終わりの欄も足せる */
function seedRunning(place: Place, extra: Partial<RunRecord> = {}) {
  appendRun(
    place,
    aRunRecord({
      session: extra.session ?? SESSION,
      subagent: extra.subagent ?? 'consult-9',
      pid: extra.pid ?? process.pid,
      started: extra.started ?? Date.now(),
      ...extra,
    }),
    new Date(),
  );
}

describe('controlSubagent: cancel', () => {
  it('掴んでいるサブエージェント → abort で止まり、cancelled: true（kill は呼ばない）', () => {
    const kills: number[] = [];
    const controller = new AbortController();
    const subagents = new Map([
      ['consult-1', { id: 'consult-1', type: 'review', task: 'a', startedAt: 1, controller }],
    ]);
    const outcome = controlSubagent({
      action: { action: 'cancel', id: 'consult-1' },
      subagents,
      place: placeFor(tempDir(), tempDir()),
      session: SESSION,
      now: new Date(),
      kill: (pid) => {
        kills.push(pid);
      },
    });

    expect(controller.signal.aborted).toBe(true);
    expect(outcome.details).toMatchObject({ cancelled: true, id: 'consult-1' });
    expect(kills).toEqual([]);
  });

  it('掴んでいないサブエージェント（記録だけ、pid 生存）→ kill がその pid で 1 回呼ばれ、cancelled: true', () => {
    const found = placeFor(tempDir(), tempDir());
    seedRunning(found, { pid: process.pid });
    const kills: number[] = [];
    const outcome = controlSubagent({
      action: { action: 'cancel', id: 'consult-9' },
      subagents: new Map(),
      place: found,
      session: SESSION,
      now: new Date(),
      kill: (pid) => {
        kills.push(pid);
      },
    });

    expect(kills).toEqual([process.pid]);
    expect(outcome.details).toMatchObject({ cancelled: true, id: 'consult-9' });
    expect(outcome.text).toContain('cancelled consult-9');
  });

  it('pid が死んでいるサブエージェント → kill を呼ばず、止められない理由を返す', () => {
    const found = placeFor(tempDir(), tempDir());
    seedRunning(found, { pid: 999_999 });
    const kills: number[] = [];
    const outcome = controlSubagent({
      action: { action: 'cancel', id: 'consult-9' },
      subagents: new Map(),
      place: found,
      session: SESSION,
      now: new Date(),
      kill: (pid) => {
        kills.push(pid);
      },
    });

    expect(kills).toEqual([]);
    expect(outcome.details).toMatchObject({ cancelled: false });
    expect(outcome.text).toContain('lost');
  });

  it('終わったサブエージェント → kill を呼ばず、理由を返す', () => {
    const found = placeFor(tempDir(), tempDir());
    const id = 'consult-9';
    appendRun(
      found,
      aRunRecord({
        session: SESSION,
        subagent: id,
        pid: process.pid,
        started: 1,
        ended: 2,
        state: 'done',
      }),
      new Date(),
    );
    const kills: number[] = [];
    const outcome = controlSubagent({
      action: { action: 'cancel', id },
      subagents: new Map(),
      place: found,
      session: SESSION,
      now: new Date(),
      kill: (pid) => {
        kills.push(pid);
      },
    });

    expect(kills).toEqual([]);
    expect(outcome.details).toMatchObject({ cancelled: false });
  });

  it('記録にない id → kill を呼ばず、理由を返す', () => {
    const id = 'consult-999';
    const kills: number[] = [];
    const outcome = controlSubagent({
      action: { action: 'cancel', id },
      subagents: new Map(),
      place: placeFor(tempDir(), tempDir()),
      session: SESSION,
      now: new Date(),
      kill: (pid) => {
        kills.push(pid);
      },
    });

    expect(kills).toEqual([]);
    expect(outcome.details).toMatchObject({ cancelled: false });
    expect(outcome.text).toContain(`no such subagent: ${id}`);
  });

  it('別の session のサブエージェント → 止めず、理由を返す', () => {
    const found = placeFor(tempDir(), tempDir());
    seedRunning(found, { session: 'other-session', pid: process.pid });
    const kills: number[] = [];
    const outcome = controlSubagent({
      action: { action: 'cancel', id: 'consult-9' },
      subagents: new Map(),
      place: found,
      session: SESSION,
      now: new Date(),
      kill: (pid) => {
        kills.push(pid);
      },
    });

    expect(kills).toEqual([]);
    expect(outcome.details).toMatchObject({ cancelled: false });
    expect(outcome.text).toContain('another session');
  });

  it('now が窓を決める → 3 日前の記録は今日の now では見えない', () => {
    const found = placeFor(tempDir(), tempDir());
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    appendRun(
      found,
      aRunRecord({ session: SESSION, subagent: 'consult-9', pid: 11, started: 1, token: 'a' }),
      threeDaysAgo,
    );
    const kills: number[] = [];
    const kill = (pid: number): void => {
      kills.push(pid);
    };
    const fresh = controlSubagent({
      action: { action: 'cancel', id: 'consult-9' },
      subagents: new Map(),
      place: found,
      session: SESSION,
      now: new Date(),
      kill,
    });
    expect(fresh.text).toContain('no such subagent');
    const old = controlSubagent({
      action: { action: 'cancel', id: 'consult-9' },
      subagents: new Map(),
      place: found,
      session: SESSION,
      now: threeDaysAgo,
      kill,
      check: () => 'running',
    });
    expect(kills).toEqual([11]);
    expect(old.details).toMatchObject({ cancelled: true });
  });
});

describe('controlSubagent: cancel (startToken)', () => {
  it('開始行だけ（startToken 付き）の停止は check に従う（running → kill、ended → kill しない）', () => {
    const found = placeFor(tempDir(), tempDir());
    const id = 'consult-9';
    const startToken = START_TOKEN;
    appendRun(
      found,
      aRunRecord({ session: SESSION, subagent: id, pid: 11, started: 1, startToken }),
      new Date(),
    );
    const killsRunning: number[] = [];
    const outcomeRunning = controlSubagent({
      action: { action: 'cancel', id },
      subagents: new Map(),
      place: found,
      session: SESSION,
      now: new Date(),
      kill: (pid) => {
        killsRunning.push(pid);
      },
      check: () => 'running',
    });
    expect(killsRunning).toEqual([11]);
    expect(outcomeRunning.details).toMatchObject({ cancelled: true });
    const killsEnded: number[] = [];
    const outcomeEnded = controlSubagent({
      action: { action: 'cancel', id },
      subagents: new Map(),
      place: found,
      session: SESSION,
      now: new Date(),
      kill: (pid) => {
        killsEnded.push(pid);
      },
      check: () => 'ended',
    });
    expect(killsEnded).toEqual([]);
    expect(outcomeEnded.details).toMatchObject({ cancelled: false });
  });

  it('開始行だけ（startToken 付き）+ check が unknown の停止 → kill する（走っている側）', () => {
    const found = placeFor(tempDir(), tempDir());
    const id = 'consult-9';
    const startToken = START_TOKEN;
    appendRun(
      found,
      aRunRecord({ session: SESSION, subagent: id, pid: 11, started: 1, startToken }),
      new Date(),
    );
    const kills: number[] = [];
    const outcome = controlSubagent({
      action: { action: 'cancel', id },
      subagents: new Map(),
      place: found,
      session: SESSION,
      now: new Date(),
      kill: (pid) => {
        kills.push(pid);
      },
      check: () => 'unknown',
    });
    expect(kills).toEqual([11]);
    expect(outcome.details).toMatchObject({ cancelled: true });
  });
});

describe('controlSubagent: list', () => {
  it('サブエージェントが 0 体なら、そう言う（空文字を返さない）', () => {
    const outcome = controlSubagent({
      action: { action: 'list' },
      subagents: new Map(),
      place: placeFor(tempDir(), tempDir()),
      session: SESSION,
      now: new Date(),
    });
    expect(outcome.text).toContain('no subagent is running');
  });

  it('知らせの文はどの分岐でも consult_subagents: で始まる', () => {
    const controller = new AbortController();
    const held = new Map([
      ['consult-1', { id: 'consult-1', type: 'review', task: 'a', startedAt: 1, controller }],
    ]);
    const texts: string[] = [];
    texts.push(
      controlSubagent({
        action: { action: 'list' },
        subagents: new Map(),
        place: placeFor(tempDir(), tempDir()),
        session: SESSION,
        now: new Date(),
      }).text,
    );
    texts.push(
      controlSubagent({
        action: { action: 'cancel', id: 'consult-1' },
        subagents: held,
        place: placeFor(tempDir(), tempDir()),
        session: SESSION,
        now: new Date(),
      }).text,
    );
    texts.push(
      controlSubagent({
        action: { action: 'cancel', id: 'consult-999' },
        subagents: new Map(),
        place: placeFor(tempDir(), tempDir()),
        session: SESSION,
        now: new Date(),
      }).text,
    );
    const other = placeFor(tempDir(), tempDir());
    seedRunning(other, { session: 'other-session', pid: process.pid });
    texts.push(
      controlSubagent({
        action: { action: 'cancel', id: 'consult-9' },
        subagents: new Map(),
        place: other,
        session: SESSION,
        now: new Date(),
      }).text,
    );
    const done = placeFor(tempDir(), tempDir());
    const doneId = 'consult-9';
    appendRun(
      done,
      aRunRecord({
        session: SESSION,
        subagent: doneId,
        pid: process.pid,
        started: 1,
        ended: 2,
        state: 'done',
      }),
      new Date(),
    );
    texts.push(
      controlSubagent({
        action: { action: 'cancel', id: doneId },
        subagents: new Map(),
        place: done,
        session: SESSION,
        now: new Date(),
      }).text,
    );
    const lost = placeFor(tempDir(), tempDir());
    seedRunning(lost, { pid: 999_999 });
    texts.push(
      controlSubagent({
        action: { action: 'cancel', id: 'consult-9' },
        subagents: new Map(),
        place: lost,
        session: SESSION,
        now: new Date(),
      }).text,
    );
    const live = placeFor(tempDir(), tempDir());
    seedRunning(live, { pid: process.pid });
    texts.push(
      controlSubagent({
        action: { action: 'cancel', id: 'consult-9' },
        subagents: new Map(),
        place: live,
        session: SESSION,
        now: new Date(),
        kill: () => {},
      }).text,
    );
    expect(texts).toHaveLength(7);
    for (const text of texts) {
      expect(text.startsWith('consult_subagents:')).toBe(true);
    }
  });
});
