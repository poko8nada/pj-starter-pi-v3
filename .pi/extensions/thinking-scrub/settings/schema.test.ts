import { describe, expect, it } from 'vitest';
import { defaultSettings, parseSettings } from './schema.ts';

describe('parseSettings', () => {
  it('{"enabled":false} → ok で enabled が偽', () => {
    expect(parseSettings('{"enabled":false}')).toEqual({
      kind: 'ok',
      settings: { enabled: false },
    });
  });

  it('{"enabled":true} → ok で enabled が真', () => {
    expect(parseSettings('{"enabled":true}')).toEqual({
      kind: 'ok',
      settings: { enabled: true },
    });
  });

  it('{} → ok で enabled が真', () => {
    expect(parseSettings('{}')).toEqual({ kind: 'ok', settings: { enabled: true } });
    expect(parseSettings('{}')).toEqual({ kind: 'ok', settings: defaultSettings() });
  });

  it('{"enabled": → broken', () => {
    expect(parseSettings('{"enabled":').kind).toBe('broken');
  });

  it('{"enabled":"no"} → broken', () => {
    expect(parseSettings('{"enabled":"no"}').kind).toBe('broken');
  });

  it('null と [] → どちらも broken', () => {
    expect(parseSettings('null').kind).toBe('broken');
    expect(parseSettings('[]').kind).toBe('broken');
  });
});
