import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tmpDir } from '../../../../test/tmp.ts';
import { createRecent, type IntentRecord } from './recent.ts';

function routeRecord(ownerNow: string): IntentRecord {
  return {
    at: '2026-10-20T12:00:00.000Z',
    hook: 'route',
    owner_now: ownerNow,
    agent_prev: '',
    choice: 'reply',
    confidence: 0.9,
    threshold: 0.8,
    guide: 'guide text',
    verdicts: null,
    streak: null,
    nudge: null,
    fired: true,
  };
}

describe('createRecent', () => {
  it('createRecent(3, recent.json) → そのパスの 1 ファイルに直近 3 件だけが入る', () => {
    const dir = tmpDir();
    const file = join(dir, 'recent.json');
    const recent = createRecent(3, file);
    for (let index = 0; index < 5; index += 1) {
      recent.add(routeRecord(`hello${index}`));
    }
    const parsed: unknown = JSON.parse(readFileSync(file, 'utf8'));
    expect(Array.isArray(parsed)).toBe(true);
    if (!Array.isArray(parsed)) {
      return;
    }
    expect(parsed).toHaveLength(3);
    expect(JSON.stringify(parsed)).toContain('hello4');
    expect(JSON.stringify(parsed)).not.toContain('hello0');
    expect(recent.tail(10)).toHaveLength(3);
  });

  it('記録が上限を超える → 古い物から落ちる', () => {
    const dir = tmpDir();
    const file = join(dir, 'recent.json');
    const recent = createRecent(2, file);
    recent.add(routeRecord('first'));
    recent.add(routeRecord('second'));
    recent.add(routeRecord('third'));
    expect(recent.tail(10).map((record) => record.owner_now)).toEqual(['second', 'third']);
  });

  it('limit が 1 → 直近 1 件だけ残る', () => {
    const dir = tmpDir();
    const file = join(dir, 'recent.json');
    const recent = createRecent(1, file);
    recent.add(routeRecord('first'));
    recent.add(routeRecord('second'));
    expect(recent.tail(10)).toHaveLength(1);
    expect(recent.tail(10)[0]?.owner_now).toBe('second');
  });

  it('tail(count) → 直近 count 件', () => {
    const dir = tmpDir();
    const file = join(dir, 'recent.json');
    const recent = createRecent(10, file);
    for (let index = 0; index < 5; index += 1) {
      recent.add(routeRecord(`hello${index}`));
    }
    expect(recent.tail(3)).toHaveLength(3);
    expect(recent.tail(3).map((record) => record.owner_now)).toEqual([
      'hello2',
      'hello3',
      'hello4',
    ]);
  });

  it('空の recent → tail は空', () => {
    const dir = tmpDir();
    const recent = createRecent(3, join(dir, 'recent.json'));
    expect(recent.tail(3)).toEqual([]);
  });
});
