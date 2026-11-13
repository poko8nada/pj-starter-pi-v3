import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { aRunRecord, aWidgetUI } from '../consult.fixture.ts';
import { loadTypes } from '../policy/types.ts';
import { countRoles, runningLine, showRunning, WIDGET_KEY } from './widget.ts';

const extensionDir = dirname(dirname(fileURLToPath(import.meta.url)));
const ORDER = loadTypes(extensionDir).map((type) => type.name);

describe('countRoles / runningLine', () => {
  it('order の順に数え、動いている役割だけの 1 行にする', () => {
    const runs = [
      aRunRecord({ role: 'review' }),
      aRunRecord({ role: 'research' }),
      aRunRecord({ role: 'research' }),
    ];

    expect(runningLine(countRoles(runs, ORDER))).toBe('[res:2 rev:1]');
  });

  it('order が辞書順と違う組でも、order の順に並ぶ', () => {
    const runs = [aRunRecord({ role: 'code' }), aRunRecord({ role: 'research' })];

    expect(runningLine(countRoles(runs, ORDER))).toBe('[res:1 cod:1]');
  });

  it('order にない役割は初出順で後ろに置き、名前の先頭 3 文字を使う', () => {
    const runs = [aRunRecord({ role: 'custom' })];

    expect(runningLine(countRoles(runs, ORDER))).toBe('[cus:1]');
  });

  it('order にない役割が 2 つ → 初出順で後ろに並ぶ', () => {
    const runs = [aRunRecord({ role: 'zeta' }), aRunRecord({ role: 'alpha' })];

    expect(runningLine(countRoles(runs, ORDER))).toBe('[zet:1 alp:1]');
  });

  it('先頭 3 文字が同じ役割は、同じ短い名前で 2 つ出る', () => {
    const runs = [aRunRecord({ role: 'research' }), aRunRecord({ role: 'researcher' })];

    expect(runningLine(countRoles(runs, ORDER))).toBe('[res:1 res:1]');
  });

  it('記録がない → undefined', () => {
    expect(runningLine(countRoles([], ORDER))).toBeUndefined();
  });
});

describe('showRunning', () => {
  it('showRunning: (happy) role 1 件 → line を widget に渡す', () => {
    const counts = [{ role: 'review', count: 1 }];
    const { ui, calls } = aWidgetUI();
    showRunning(ui, counts);
    expect(calls).toEqual([{ key: WIDGET_KEY, content: [runningLine(counts)] }]);
  });

  it('showRunning: (empty) 0 件 → undefined を渡す', () => {
    const { ui, calls } = aWidgetUI();
    showRunning(ui, []);
    expect(calls).toEqual([{ key: WIDGET_KEY, content: runningLine([]) }]);
  });
});
