import { describe, expect, it } from 'vitest';
import { defaultSettings, parseSettings } from './schema.ts';

describe('parseSettings', () => {
  it('3 グループとフラグを持つ JSON → ok で、その値が返る', () => {
    const input = JSON.stringify({
      enabled: false,
      show: false,
      live: { minThinking: 8000, scanEvery: 1000, tail: 20000, maxAborts: 1, sampleChars: 100 },
      sentence: { minCycles: 2, minRunChars: 350, maxPeriodUnits: 32 },
      char: { minPeriod: 4, maxPeriod: 60, minRepeats: 2, minLength: 30 },
    });
    expect(parseSettings(input)).toEqual({
      kind: 'ok',
      settings: {
        enabled: false,
        show: false,
        live: { minThinking: 8000, scanEvery: 1000, tail: 20000, maxAborts: 1, sampleChars: 100 },
        sentence: { minCycles: 2, minRunChars: 350, maxPeriodUnits: 32 },
        char: { minPeriod: 4, maxPeriod: 60, minRepeats: 2, minLength: 30 },
      },
    });
  });

  it('{} → ok で、defaultSettings() が返る', () => {
    expect(parseSettings('{}')).toEqual({ kind: 'ok', settings: defaultSettings() });
  });

  it('enabled が文字列 → broken', () => {
    expect(parseSettings('{"enabled":"no"}').kind).toBe('broken');
  });

  it('live.minThinking が文字列 → broken', () => {
    expect(parseSettings('{"live":{"minThinking":"no"}}').kind).toBe('broken');
  });

  it('live.scanEvery が 0 → broken', () => {
    expect(parseSettings('{"live":{"scanEvery":0}}').kind).toBe('broken');
  });

  it('live.scanEvery が live.tail より大きい → broken', () => {
    const input = JSON.stringify({ live: { scanEvery: 3000, tail: 2000 } });
    expect(parseSettings(input).kind).toBe('broken');
  });

  it('sentence.minCycles が 1 → broken', () => {
    expect(parseSettings('{"sentence":{"minCycles":1}}').kind).toBe('broken');
  });

  it('char.minPeriod が 5 で char.maxPeriod が 4 → broken', () => {
    const input = JSON.stringify({ char: { minPeriod: 5, maxPeriod: 4 } });
    expect(parseSettings(input).kind).toBe('broken');
  });

  it('char.minRepeats が 1 → broken', () => {
    expect(parseSettings('{"char":{"minRepeats":1}}').kind).toBe('broken');
  });

  it('live.scanEvery が live.tail と等しい → ok', () => {
    const input = JSON.stringify({ live: { scanEvery: 2000, tail: 2000 } });
    const read = parseSettings(input);
    expect(read.kind).toBe('ok');
    if (read.kind !== 'ok') {
      throw new Error('must be ok');
    }
    expect(read.settings.live.scanEvery).toBe(2000);
    expect(read.settings.live.tail).toBe(2000);
  });

  it('live.scanEvery だけが 3000 → ok で、tail は既定の 20000 になる', () => {
    const input = JSON.stringify({ live: { scanEvery: 3000 } });
    const read = parseSettings(input);
    expect(read.kind).toBe('ok');
    if (read.kind !== 'ok') {
      throw new Error('must be ok');
    }
    expect(read.settings.live.scanEvery).toBe(3000);
    expect(read.settings.live.tail).toBe(20000);
  });

  it('live.scanEvery だけが 30000 → broken で、理由は live.scanEvery と live.tail の関係を示す', () => {
    const input = JSON.stringify({ live: { scanEvery: 30000 } });
    const read = parseSettings(input);
    expect(read.kind).toBe('broken');
    if (read.kind !== 'broken') {
      throw new Error('must be broken');
    }
    expect(read.reason).toContain('live.scanEvery');
    expect(read.reason).toContain('live.tail');
  });

  it('live.tail だけが 1000 → broken で、理由は live.scanEvery と live.tail の関係を示す', () => {
    const input = JSON.stringify({ live: { tail: 1000 } });
    const read = parseSettings(input);
    expect(read.kind).toBe('broken');
    if (read.kind !== 'broken') {
      throw new Error('must be broken');
    }
    expect(read.reason).toContain('live.scanEvery');
    expect(read.reason).toContain('live.tail');
  });

  it('char.minPeriod だけが 200 → broken で、理由は char.minPeriod と char.maxPeriod の関係を示す', () => {
    const input = JSON.stringify({ char: { minPeriod: 200 } });
    const read = parseSettings(input);
    expect(read.kind).toBe('broken');
    if (read.kind !== 'broken') {
      throw new Error('must be broken');
    }
    expect(read.reason).toContain('char.minPeriod');
    expect(read.reason).toContain('char.maxPeriod');
  });

  it('char.maxPeriod だけが 2 → broken で、理由は char.minPeriod と char.maxPeriod の関係を示す', () => {
    const input = JSON.stringify({ char: { maxPeriod: 2 } });
    const read = parseSettings(input);
    expect(read.kind).toBe('broken');
    if (read.kind !== 'broken') {
      throw new Error('must be broken');
    }
    expect(read.reason).toContain('char.minPeriod');
    expect(read.reason).toContain('char.maxPeriod');
  });

  it('壊れた JSON と配列と null → broken', () => {
    for (const input of ['{"enabled":', 'null', '[]']) {
      expect(parseSettings(input).kind).toBe('broken');
    }
  });
});
