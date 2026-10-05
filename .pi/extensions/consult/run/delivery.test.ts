import { describe, expect, it } from 'vitest';
import { tmpDir } from '../../../test/tmp.ts';
import type { ConsultMessage, ConsultSendOptions, PiFace } from '../tool/consult.ts';
import { createDelivery } from './delivery.ts';
import { readRuns, type RunRecord } from './log.ts';

// 子は起こさない。pi の偽物と、使い捨ての root だけで試す。

function record(): RunRecord {
  return {
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
    const delivery = createDelivery(() => tmpDir());
    const { pi, sent } = fakePi();
    delivery.attach(pi);

    delivery.send(message, options, record());

    expect(sent).toHaveLength(1);
    expect(sent[0]?.content).toBe('できた');
  });

  it('detach のあとは送らず、記録に 1 行足す', () => {
    const root = tmpDir();
    const delivery = createDelivery(() => root);
    const { pi, sent } = fakePi();
    delivery.attach(pi);
    delivery.detach();

    delivery.send(message, options, record());

    expect(sent).toHaveLength(0);
    const rows = readRuns(root);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.notice).toBe('できた');
  });

  it('detach のあとに新しいインスタンスが attach しても、古い send で落ちない', () => {
    const root = tmpDir();
    const old = createDelivery(() => root);
    const first = fakePi();
    old.attach(first.pi);
    // reload 相当: 古いセッションが終わり、新しいインスタンスが同じ root で生まれる
    old.detach();
    const fresh = createDelivery(() => root);
    const second = fakePi();
    fresh.attach(second.pi);

    old.send(message, options, record());
    fresh.send(message, options, record());

    // 古い方の送り先はもう居ない。新しい pi には渡らず、記録に回る
    expect(first.sent).toHaveLength(0);
    expect(second.sent).toHaveLength(1);
    expect(readRuns(root)).toHaveLength(1);
    expect(readRuns(root)[0]?.notice).toBe('できた');
  });

  it('attached で状態が分かる', () => {
    const delivery = createDelivery(() => tmpDir());
    expect(delivery.attached()).toBe(false);
    delivery.attach(fakePi().pi);
    expect(delivery.attached()).toBe(true);
    delivery.detach();
    expect(delivery.attached()).toBe(false);
  });
});
