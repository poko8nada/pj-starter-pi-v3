import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tmpDir } from '../../../../test/tmp.ts';
import type { ConsultMessage, ConsultSendOptions, PiFace } from '../tool/consult.ts';
import {
  CURSOR_FILE,
  createDelivery,
  pruneCursors,
  readCursor,
  unreadNotices,
  writeCursor,
} from './delivery.ts';
import { appendRun, KEEP_DAYS, type RunRecord } from './log.ts';
import { placeFor, type Place } from './place.ts';

// 子は起こさない。pi の偽物と、使い捨ての置き場だけで試す。

function place(): Place {
  return placeFor(tmpDir(), tmpDir());
}

function record(extra: Partial<RunRecord> = {}): RunRecord {
  return {
    session: 'session-a',
    child: 'consult-1',
    role: 'review',
    pid: 1,
    started: 1000,
    ended: 2000,
    state: 'done',
    ...extra,
  };
}

const message: ConsultMessage = {
  customType: 'consult',
  content: 'できた',
  display: true,
  details: {},
};

const options: ConsultSendOptions = { triggerTurn: true, deliverAs: 'followUp' };

/** sendMessage を記録するだけの偽 pi */
function fakePi(): { readonly pi: PiFace; readonly sent: ConsultMessage[] } {
  const sent: ConsultMessage[] = [];
  const pi: PiFace = {
    sendMessage: (next) => {
      sent.push(next);
    },
  };
  return { pi, sent };
}

/** その日に通知つきの行を書く。`ended` は呼び側が決める */
function notice(found: Place, at: Date, extra: Partial<RunRecord> = {}): RunRecord {
  const run = record({ notice: 'できた', ...extra });
  appendRun(found, run, at);
  return run;
}

describe('createDelivery', () => {
  it('attach した pi へ送る', () => {
    const delivery = createDelivery(place());
    const { pi, sent } = fakePi();
    delivery.attach(pi);

    delivery.send(message, options, record());

    expect(sent).toHaveLength(1);
    expect(sent[0]?.content).toBe('できた');
  });

  it('detach のあとは送らず、記録に 1 行足す', () => {
    const found = place();
    const delivery = createDelivery(found);
    const { pi, sent } = fakePi();
    delivery.attach(pi);
    delivery.detach();

    delivery.send(message, options, record());

    expect(sent).toHaveLength(0);
    const rows = unreadNotices(found, { session: 'session-a' });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.notice).toBe('できた');
  });

  it('detach のあとに新しいインスタンスが attach しても、古い send で落ちない', () => {
    const found = place();
    const old = createDelivery(found);
    const first = fakePi();
    old.attach(first.pi);
    // reload 相当: 古いセッションが終わり、新しいインスタンスが同じ置き場で生まれる
    old.detach();
    const fresh = createDelivery(found);
    const second = fakePi();
    fresh.attach(second.pi);

    old.send(message, options, record());
    fresh.send(message, options, record());

    // 古い方の送り先はもう居ない。新しい pi には渡らず、記録に回る
    expect(first.sent).toHaveLength(0);
    expect(second.sent).toHaveLength(1);
    expect(unreadNotices(found, { session: 'session-a' })).toHaveLength(1);
  });

  it('attached で状態が分かる', () => {
    const delivery = createDelivery(place());
    expect(delivery.attached()).toBe(false);
    delivery.attach(fakePi().pi);
    expect(delivery.attached()).toBe(true);
    delivery.detach();
    expect(delivery.attached()).toBe(false);
  });

  it('届け先が無い時の send は notice を 1 行足し、目録を進めない', () => {
    const found = place();
    const delivery = createDelivery(found);
    delivery.detach();

    delivery.send(message, options, record());

    // 目録はまだ無い（進めるのは、通知を渡すループが終わった所で 1 回だけ）
    expect(readCursor(found, 'session-a')).toBeUndefined();
    expect(unreadNotices(found, { session: 'session-a' })).toHaveLength(1);
  });
});

describe('createDelivery: 置き場の遅延', () => {
  it('作っただけでは置き場を作らない（届け先が無くなって初めて書く）', () => {
    const found = place();
    createDelivery(found);
    expect(() => readFileSync(join(found.dir, CURSOR_FILE), 'utf8')).toThrow();
  });
});

describe('writeCursor / readCursor', () => {
  it('書いて読む → 同じ値が返る', () => {
    const found = place();
    writeCursor(found, 'session-a', { ended: 1234 });
    expect(readCursor(found, 'session-a')).toEqual({ ended: 1234 });
  });

  it('欄が無ければ undefined', () => {
    expect(readCursor(place(), 'session-a')).toBeUndefined();
  });

  it('壊れている（JSON でない）→ undefined（全部返す側に倒れる）', () => {
    const found = place();
    writeCursor(found, 'session-a', { ended: 1234 });
    writeFileSync(join(found.dir, CURSOR_FILE), 'これは JSON ではない');
    expect(readCursor(found, 'session-a')).toBeUndefined();
    expect(unreadNotices(found, { session: 'session-a' })).toHaveLength(0);
  });
});

describe('unreadNotices', () => {
  it('目録が無い → 窓の中の通知を全部返す', () => {
    const found = place();
    const at = new Date(2026, 9, 10, 12, 0);
    notice(found, at, { ended: 2000, child: 'consult-1' });
    notice(found, at, { ended: 3000, child: 'consult-2' });
    expect(unreadNotices(found, { at, session: 'session-a' }).map((run) => run.child)).toEqual([
      'consult-1',
      'consult-2',
    ]);
  });

  it('目録の ended と同じか古い通知は返らない', () => {
    const found = place();
    const at = new Date(2026, 9, 10, 12, 0);
    notice(found, at, { ended: 2000, child: 'consult-1' });
    notice(found, at, { ended: 3000, child: 'consult-2' });
    writeCursor(found, 'session-a', { ended: 2000 });
    expect(unreadNotices(found, { at, session: 'session-a' }).map((run) => run.child)).toEqual([
      'consult-2',
    ]);
  });

  it('通知を持たない行は返らない', () => {
    const found = place();
    const at = new Date(2026, 9, 10, 12, 0);
    appendRun(found, record({ child: 'consult-plain', ended: 1500 }), at);
    expect(unreadNotices(found, { at, session: 'session-a' })).toEqual([]);
  });

  it('KEEP_DAYS を渡せば 3 日前の通知も返る（配達は時間で失わない）', () => {
    const found = place();
    const threeDaysAgo = new Date(2026, 9, 7, 12, 0);
    notice(found, threeDaysAgo, { ended: 2000 });
    expect(
      unreadNotices(found, {
        at: new Date(2026, 9, 10, 12, 0),
        session: 'session-a',
        days: KEEP_DAYS,
      }),
    ).toHaveLength(1);
  });

  it('days を省くと 3 日前の通知は返らない（既定は RECORD_DAYS）', () => {
    const found = place();
    const threeDaysAgo = new Date(2026, 9, 7, 12, 0);
    notice(found, threeDaysAgo, { ended: 2000 });
    expect(
      unreadNotices(found, { at: new Date(2026, 9, 10, 12, 0), session: 'session-a' }),
    ).toEqual([]);
  });

  it('別の session の通知は返らない。別の session の目録の欄は影響しない', () => {
    const found = place();
    const at = new Date(2026, 9, 10, 12, 0);
    notice(found, at, { session: 'session-b', ended: 2000, child: 'consult-b' });
    notice(found, at, { session: 'session-a', ended: 3000, child: 'consult-a' });
    // session-b の目録を進めても、session-a の未読は消えない
    writeCursor(found, 'session-b', { ended: 9999 });
    expect(unreadNotices(found, { at, session: 'session-a' }).map((run) => run.child)).toEqual([
      'consult-a',
    ]);
  });
});

describe('pruneCursors', () => {
  it('古い ended の欄を消し、新しい欄を残す', () => {
    const found = place();
    const at = new Date(2026, 9, 10, 12, 0);
    const old = new Date(2026, 8, 1, 12, 0);
    writeCursor(found, 'session-old', { ended: old.getTime() });
    writeCursor(found, 'session-new', { ended: at.getTime() });

    pruneCursors(found, at, KEEP_DAYS);

    expect(readCursor(found, 'session-old')).toBeUndefined();
    expect(readCursor(found, 'session-new')).toEqual({ ended: at.getTime() });
  });
});
