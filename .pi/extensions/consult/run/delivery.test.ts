import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { tmpDir } from '../../../../test/tmp.ts';
import type { ConsultMessage, ConsultSendOptions, PiFace } from '../tool/consult.ts';
import { createDelivery } from './delivery.ts';
import { placeFor, type Place } from './place.ts';
import { readRuns, type RunRecord } from './log.ts';

// 子は起こさない。pi の偽物と、使い捨ての置き場だけで試す。

function place(): Place {
  return placeFor(tmpDir(), tmpDir());
}

function record(): RunRecord {
  return {
    session: 'session-a',
    child: 'consult-1',
    role: 'review',
    pid: 1,
    started: 1000,
    ended: 2000,
    state: 'done',
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
    const rows = readRuns(found);
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
    expect(readRuns(found)).toHaveLength(1);
    expect(readRuns(found)[0]?.notice).toBe('できた');
  });

  it('attached で状態が分かる', () => {
    const delivery = createDelivery(place());
    expect(delivery.attached()).toBe(false);
    delivery.attach(fakePi().pi);
    expect(delivery.attached()).toBe(true);
    delivery.detach();
    expect(delivery.attached()).toBe(false);
  });
});

describe('createDelivery: 置き場の遅延', () => {
  it('作っただけでは置き場を作らない（届け先が無くなって初めて書く）', () => {
    const found = place();
    createDelivery(found);
    expect(existsSync(found.dir)).toBe(false);
  });
});
