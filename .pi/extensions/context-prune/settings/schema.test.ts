import { describe, expect, it } from 'vitest';
import { defaultSettings, parseSettings } from './schema.ts';

describe('parseSettings', () => {
  it('{} → ok で既定と等しい', () => {
    expect(parseSettings('{}')).toEqual({ kind: 'ok', settings: defaultSettings() });
  });

  it('既定が enabled 真・しきい値・印・分類器の 2 件を持つ', () => {
    const settings = defaultSettings();
    expect(settings.enabled).toBe(true);
    expect(settings.threshold).toBe(0.5);
    expect(settings.rearmRatio).toBe(0.1);
    expect(settings.marker).toBe('古いツール結果（{chars} 文字）を省略');
    expect(settings.classifier.models).toHaveLength(2);
    expect(settings.classifier.allowPaid).toBe(true);
  });

  it('境界値 ratio 0.2 / 0.8 → ok', () => {
    expect(parseSettings('{"ratio":0.2}').kind).toBe('ok');
    expect(parseSettings('{"ratio":0.8}').kind).toBe('ok');
  });

  it('境界値 threshold 0 / 1 → ok', () => {
    expect(parseSettings('{"threshold":0}').kind).toBe('ok');
    expect(parseSettings('{"threshold":1}').kind).toBe('ok');
  });

  it('境界値 rearmRatio 0.001 / 0.999 → ok', () => {
    expect(parseSettings('{"rearmRatio":0.001}').kind).toBe('ok');
    expect(parseSettings('{"rearmRatio":0.999}').kind).toBe('ok');
  });

  it('境界値 recentTokens 1 → ok', () => {
    expect(parseSettings('{"recentTokens":1}').kind).toBe('ok');
  });

  it('範囲外 ratio 0.19 / 0.81 → broken', () => {
    expect(parseSettings('{"ratio":0.19}').kind).toBe('broken');
    expect(parseSettings('{"ratio":0.81}').kind).toBe('broken');
  });

  it('範囲外 threshold 1.1 → broken', () => {
    expect(parseSettings('{"threshold":1.1}').kind).toBe('broken');
  });

  it('範囲外 recentTokens 0 / 1.5 → broken', () => {
    expect(parseSettings('{"recentTokens":0}').kind).toBe('broken');
    expect(parseSettings('{"recentTokens":1.5}').kind).toBe('broken');
  });

  it('`{ "summaryTokens": 2000 }` → broken（未知キー）', () => {
    const read = parseSettings('{"summaryTokens":2000}');
    expect(read.kind).toBe('broken');
    if (read.kind !== 'broken') {
      throw new Error('must be broken');
    }
    expect(read.reason).toContain('unknown');
  });

  it('既定に summaryTokens が無い', () => {
    expect(defaultSettings()).not.toHaveProperty('summaryTokens');
  });

  it('`{ "maxQuestions": 40 }` → broken（未知キー）', () => {
    const read = parseSettings('{"maxQuestions":40}');
    expect(read.kind).toBe('broken');
    if (read.kind !== 'broken') {
      throw new Error('must be broken');
    }
    expect(read.reason).toContain('unknown');
  });

  it('既定に maxQuestions が無い', () => {
    expect(defaultSettings()).not.toHaveProperty('maxQuestions');
  });

  it('範囲外 rearmRatio 0 / 1 / -0.1 → broken', () => {
    expect(parseSettings('{"rearmRatio":0}').kind).toBe('broken');
    expect(parseSettings('{"rearmRatio":1}').kind).toBe('broken');
    expect(parseSettings('{"rearmRatio":-0.1}').kind).toBe('broken');
  });

  it('型違い enabled "yes" → broken', () => {
    expect(parseSettings('{"enabled":"yes"}').kind).toBe('broken');
  });

  it('型違い classifier.allowPaid 1 → broken', () => {
    expect(parseSettings('{"classifier":{"allowPaid":1}}').kind).toBe('broken');
  });

  it('空の classifier.models → broken', () => {
    expect(parseSettings('{"classifier":{"models":[]}}').kind).toBe('broken');
  });

  it('provider が数値の models → broken', () => {
    expect(parseSettings('{"classifier":{"models":[{"provider":1}]}}').kind).toBe('broken');
  });

  it('空の marker → broken', () => {
    expect(parseSettings('{"marker":""}').kind).toBe('broken');
  });

  it('知らないキー → broken で理由に unknown を含む', () => {
    const read = parseSettings('{"unknown":1}');
    expect(read.kind).toBe('broken');
    if (read.kind !== 'broken') {
      throw new Error('must be broken');
    }
    expect(read.reason).toContain('unknown');
  });

  it("'{' → broken で理由に not JSON を含む", () => {
    const read = parseSettings('{');
    expect(read.kind).toBe('broken');
    if (read.kind !== 'broken') {
      throw new Error('must be broken');
    }
    expect(read.reason).toContain('not JSON');
  });
});
