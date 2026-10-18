import { readFileSync, writeFileSync } from 'node:fs';
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
  it('3 件 add → ファイルが 3 行になり、各行が単体で JSON として読める', () => {
    const dir = tmpDir();
    const file = join(dir, 'recent.json');
    const recent = createRecent(3, file);
    for (let index = 0; index < 3; index += 1) {
      recent.add(routeRecord(`hello${index}`));
    }
    const lines = readFileSync(file, 'utf8')
      .split('\n')
      .filter((line) => line !== '');
    expect(lines).toHaveLength(3);
    for (const line of lines) {
      expect(JSON.parse(line)).toMatchObject({ hook: 'route' });
    }
    expect(recent.tail(10).map((record) => record.owner_now)).toEqual([
      'hello0',
      'hello1',
      'hello2',
    ]);
  });

  it('createRecent(3, recent.json) → そのパスの 1 ファイルに直近 3 件だけが入る', () => {
    const dir = tmpDir();
    const file = join(dir, 'recent.json');
    const recent = createRecent(3, file);
    for (let index = 0; index < 5; index += 1) {
      recent.add(routeRecord(`hello${index}`));
    }
    const lines = readFileSync(file, 'utf8')
      .split('\n')
      .filter((line) => line !== '');
    expect(lines).toHaveLength(3);
    expect(lines.join('\n')).toContain('hello4');
    expect(lines.join('\n')).not.toContain('hello0');
    expect(recent.tail(10)).toHaveLength(3);
  });

  it('limit 3 で 4 件 add → 3 行になり、先頭の 1 件が落ちて最後の 3 件が残る', () => {
    const dir = tmpDir();
    const file = join(dir, 'recent.json');
    const recent = createRecent(3, file);
    for (let index = 0; index < 4; index += 1) {
      recent.add(routeRecord(`hello${index}`));
    }
    const lines = readFileSync(file, 'utf8')
      .split('\n')
      .filter((line) => line !== '');
    expect(lines).toHaveLength(3);
    expect(recent.tail(10).map((record) => record.owner_now)).toEqual([
      'hello1',
      'hello2',
      'hello3',
    ]);
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

  it('空のファイル → tail は空', () => {
    const dir = tmpDir();
    const file = join(dir, 'recent.json');
    writeFileSync(file, '', 'utf8');
    const recent = createRecent(3, file);
    expect(recent.tail(1)).toEqual([]);
  });

  it('途中に読めない行がある → その行だけ落ちて、他の行は読める', () => {
    const dir = tmpDir();
    const file = join(dir, 'recent.json');
    writeFileSync(
      file,
      `${JSON.stringify(routeRecord('first'))}\nnot json\n\n${JSON.stringify(routeRecord('third'))}\n`,
      'utf8',
    );
    const recent = createRecent(10, file);
    expect(recent.tail(10).map((record) => record.owner_now)).toEqual(['first', 'third']);
  });

  it('旧形式（1 行に配列） → 読める行が無いので tail は空', () => {
    const dir = tmpDir();
    const file = join(dir, 'recent.json');
    writeFileSync(
      file,
      `${JSON.stringify([routeRecord('first'), routeRecord('second')])}\n`,
      'utf8',
    );
    const recent = createRecent(10, file);
    expect(recent.tail(1)).toEqual([]);
  });
});
