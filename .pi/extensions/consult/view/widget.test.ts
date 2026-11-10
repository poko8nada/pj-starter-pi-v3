import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { aRunRecord } from '../consult.fixture.ts';
import { loadTypes } from '../policy/types.ts';
import { countRoles, runningLine } from './widget.ts';

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

  it('order にない役割は初出順で後ろに置き、名前の先頭 3 文字を使う', () => {
    const runs = [aRunRecord({ role: 'custom' })];

    expect(runningLine(countRoles(runs, ORDER))).toBe('[cus:1]');
  });

  it('先頭 3 文字が同じ役割は、同じ短い名前で 2 つ出る', () => {
    const runs = [aRunRecord({ role: 'research' }), aRunRecord({ role: 'researcher' })];

    expect(runningLine(countRoles(runs, ORDER))).toBe('[res:1 res:1]');
  });

  it('記録がない → undefined', () => {
    expect(runningLine(countRoles([], ORDER))).toBeUndefined();
  });
});
