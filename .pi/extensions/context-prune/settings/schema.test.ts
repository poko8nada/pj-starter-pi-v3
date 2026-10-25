import { describe, expect, it } from 'vitest';
import { settingsJson } from '../../../../test/prune-fixture.ts';
import { defaultSettings, parseSettings } from './schema.ts';

const okCases = [
  { document: {}, patch: {} },
  { document: { ratio: 0.2 }, patch: { ratio: 0.2 } },
  { document: { ratio: 0.8 }, patch: { ratio: 0.8 } },
  { document: { threshold: 0 }, patch: { threshold: 0 } },
  { document: { threshold: 1 }, patch: { threshold: 1 } },
  { document: { rearmRatio: 0.001 }, patch: { rearmRatio: 0.001 } },
  { document: { rearmRatio: 0.999 }, patch: { rearmRatio: 0.999 } },
  { document: { recentTokens: 1 }, patch: { recentTokens: 1 } },
] as const;

const brokenDocuments = [
  { ratio: 0.19 },
  { ratio: 0.81 },
  { threshold: 1.1 },
  { rearmRatio: 0 },
  { rearmRatio: 1 },
  { recentTokens: 0 },
  { recentTokens: 1.5 },
  { enabled: 'yes' },
  { classifier: { allowPaid: 1 } },
  { classifier: { models: [{ provider: 1, model: 'm' }] } },
  { classifier: { models: [{ provider: 'p', model: 'm', extra: 1 }] } },
  { classifier: { models: [] } },
  { marker: '' },
] as const;

describe('parseSettings', () => {
  for (const { document, patch } of okCases) {
    it(`${settingsJson(document)} → ok で既定に重なる`, () => {
      expect(parseSettings(settingsJson(document))).toEqual({
        kind: 'ok',
        settings: { ...defaultSettings(), ...patch },
      });
    });
  }

  for (const document of brokenDocuments) {
    it(`${settingsJson(document)} → broken`, () => {
      expect(parseSettings(settingsJson(document)).kind).toBe('broken');
    });
  }

  it('知らないキー → broken で理由にそのキーが入る', () => {
    const key = 'unknown';
    const read = parseSettings(settingsJson({ [key]: 1 }));
    expect(read.kind).toBe('broken');
    if (read.kind !== 'broken') {
      throw new Error('must be broken');
    }
    expect(read.reason).toContain(key);
  });

  it(`JSON でない → broken で理由にその旨が入る`, () => {
    const input = '{';
    const marker = 'JSON';
    const read = parseSettings(input);
    expect(read.kind).toBe('broken');
    if (read.kind !== 'broken') {
      throw new Error('must be broken');
    }
    expect(read.reason).toContain(marker);
  });
});
