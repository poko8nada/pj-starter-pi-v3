import { describe, expect, it } from 'vitest';
import { defaultSettings, parseSettings } from './schema.ts';

describe('parseSettings', () => {
  it('{"enabled":true} → ok で enabled が真、show が真', () => {
    expect(parseSettings('{"enabled":true}')).toEqual({
      kind: 'ok',
      settings: { enabled: true, show: true },
    });
  });

  it('{} → ok で既定（値を書く）', () => {
    expect(parseSettings('{}')).toEqual({
      kind: 'ok',
      settings: { enabled: true, show: true },
    });
    expect(parseSettings('{}')).toEqual({ kind: 'ok', settings: defaultSettings() });
  });

  it('{"enabled":true,"show":false} → ok で show が偽', () => {
    expect(parseSettings('{"enabled":true,"show":false}')).toEqual({
      kind: 'ok',
      settings: { enabled: true, show: false },
    });
  });

  it('{"enabled":false} → ok で { enabled: false, show: true }', () => {
    expect(parseSettings('{"enabled":false}')).toEqual({
      kind: 'ok',
      settings: { enabled: false, show: true },
    });
  });

  it('{"show":false} → ok で { enabled: true, show: false }', () => {
    expect(parseSettings('{"show":false}')).toEqual({
      kind: 'ok',
      settings: { enabled: true, show: false },
    });
  });

  it('{"enabled": → broken', () => {
    expect(parseSettings('{"enabled":').kind).toBe('broken');
  });

  it('{"enabled":"no"} → broken', () => {
    expect(parseSettings('{"enabled":"no"}').kind).toBe('broken');
  });

  it('{"show":"yes"} → broken', () => {
    expect(parseSettings('{"show":"yes"}').kind).toBe('broken');
  });

  it('null と [] → どちらも broken', () => {
    expect(parseSettings('null').kind).toBe('broken');
    expect(parseSettings('[]').kind).toBe('broken');
  });
});
