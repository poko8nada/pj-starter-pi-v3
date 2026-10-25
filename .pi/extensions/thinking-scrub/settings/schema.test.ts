import { describe, expect, it } from 'vitest';
import { parseSettings } from './schema.ts';

const okCases = [
  { input: '{"enabled":true}', expected: { enabled: true, show: true } },
  { input: '{}', expected: { enabled: true, show: true } },
  { input: '{"enabled":true,"show":false}', expected: { enabled: true, show: false } },
  { input: '{"enabled":false}', expected: { enabled: false, show: true } },
  { input: '{"unknown":1}', expected: { enabled: true, show: true } },
] as const;

const brokenInputs = ['{"enabled":', '{"enabled":"no"}', '{"show":"yes"}', 'null', '[]'] as const;

describe('parseSettings', () => {
  for (const { input, expected } of okCases) {
    it(`${input} → ok で既定または指定の値`, () => {
      expect(parseSettings(input)).toEqual({ kind: 'ok', settings: { ...expected } });
    });
  }

  for (const input of brokenInputs) {
    it(`${input} → broken`, () => {
      expect(parseSettings(input).kind).toBe('broken');
    });
  }
});
