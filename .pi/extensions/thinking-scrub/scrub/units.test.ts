import { describe, expect, it } from 'vitest';
import { cycleText } from '../scrub.fixture.ts';
import { defaultSettings } from '../settings/schema.ts';
import { detectUnitRuns, sampleOf, splitUnits, type Unit, type UnitRun } from './units.ts';

// 繰り返しの文は factory で組み立てる。各 case で直書きしない。

function sentenceUnit(index: number): string {
  return `analysis ${index} proceeds with steady reasoning about the task`;
}

function english(index: number, mark: '.' | '!' | '?' = '.'): string {
  return `${sentenceUnit(index)}${mark}`;
}

function japanese(index: number, mark: '。' | '！' | '？' = '。'): string {
  return `${sentenceUnit(index)}${mark}`;
}

function longEnglish(index: number): string {
  return `${sentenceUnit(index)} ${sentenceUnit(index)} ${sentenceUnit(index)}.`;
}

function unitsFromText(text: string): readonly Unit[] {
  return splitUnits(text);
}

describe('splitUnits', () => {
  it('2 行の英語が factory から → 4 単位で元の offset を保つ', () => {
    const expected = [english(0), english(1, '!'), english(2, '?'), english(3)];
    const line1 = `${expected[0]} ${expected[1]}`;
    const line2 = `${expected[2]} ${expected[3]}`;
    const text = `${line1}\n${line2}`;
    const units = unitsFromText(text);
    expect(units).toHaveLength(expected.length);
    for (const unit of units) {
      expect(text.slice(unit.start, unit.end)).toBe(unit.text);
      expect(unit.opaque).toBe(false);
    }
    for (const [index, sentence] of expected.entries()) {
      expect(units[index]?.text).toBe(sentence);
    }
    expect(units[1]?.start).toBeGreaterThan(units[0]?.end ?? 0);
    expect(units[2]?.start).toBeGreaterThanOrEqual(line1.length + 1);
  });

  it('。と！の日本語 1 行が factory から → その印で分かれ offset を保つ', () => {
    const expected = [japanese(20), japanese(21, '！')];
    const text = expected.join('');
    const units = unitsFromText(text);
    expect(units).toHaveLength(expected.length);
    for (const unit of units) {
      expect(text.slice(unit.start, unit.end)).toBe(unit.text);
    }
    expect(units[0]?.text.endsWith('。')).toBe(true);
    expect(units[1]?.text.endsWith('！')).toBe(true);
    expect(units[1]?.start).toBe(units[0]?.end);
  });

  it('フェンス囲み → 柵の行と中身が不透明', () => {
    const fenceOpen = '```js';
    const fenceClose = '```';
    const lines = [english(0), fenceOpen, english(1), english(2), fenceClose, english(3)];
    const text = lines.join('\n');
    const units = unitsFromText(text);
    expect(units).toHaveLength(lines.length);
    expect(units[0]?.opaque).toBe(false);
    expect(units[1]?.opaque).toBe(true);
    expect(units[1]?.text).toBe(fenceOpen);
    expect(units[2]?.opaque).toBe(true);
    expect(units[3]?.opaque).toBe(true);
    expect(units[4]?.opaque).toBe(true);
    expect(units[4]?.text).toBe(fenceClose);
    expect(units[5]?.opaque).toBe(false);
    for (const unit of units) {
      expect(text.slice(unit.start, unit.end)).toBe(unit.text);
    }
  });

  it('表の行と diff --git の行 → 不透明', () => {
    const table = '| a | b |';
    const diff = 'diff --git a/foo b/foo';
    const expectedOpaque = [table, diff];
    const expectedPlain = [english(0), english(1), english(2)];
    const text = [expectedPlain[0], table, expectedPlain[1], diff, expectedPlain[2]].join('\n');
    const units = unitsFromText(text);
    const byText = new Map(units.map((unit) => [unit.text, unit]));
    for (const line of expectedOpaque) {
      expect(byText.get(line)?.opaque).toBe(true);
    }
    for (const sentence of expectedPlain) {
      expect(byText.get(sentence)?.opaque).toBe(false);
    }
  });

  it('略語で終わる行 → 略語が 1 単位になり前後がずれない', () => {
    const abbrev = 'No.';
    const rest = english(5);
    const expected = [abbrev, rest];
    const text = `${abbrev} ${rest}`;
    const units = unitsFromText(text);
    expect(units).toHaveLength(expected.length);
    expect(units[0]?.text).toBe(abbrev);
    expect(units[0]?.start).toBe(0);
    expect(units[1]?.text).toBe(rest);
    expect(text.slice(units[1]?.start ?? 0, units[1]?.end ?? 0)).toBe(rest);
    expect(units[1]?.start).toBeGreaterThan(units[0]?.end ?? 0);
  });
});

describe('detectUnitRuns', () => {
  it('既定の sentence と 3 周期の並び → 1 つのラン', () => {
    const sentence = defaultSettings().sentence;
    const pattern = [english(0), english(1), english(2)];
    const text = cycleText(pattern, sentence.minCycles);
    expect(text.length).toBeGreaterThanOrEqual(sentence.minRunChars);
    const units = unitsFromText(text);
    expect(units).toHaveLength(pattern.length * sentence.minCycles);
    const runs = detectUnitRuns(units, sentence);
    expect(runs).toHaveLength(1);
    expect(runs[0]).toEqual({
      at: 0,
      length: pattern.length * sentence.minCycles,
      period: pattern.length,
    });
  });

  it('周期 6 と 12 が重なる factory の並び → 周期 6 の run が 1 つ', () => {
    const sentence = defaultSettings().sentence;
    const base6 = [0, 1, 2, 3, 4, 5].map((index) => english(index));
    const base12 = [...base6, ...base6];
    const text = cycleText(base12, sentence.minCycles);
    const units = unitsFromText(text);
    expect(units).toHaveLength(base12.length * sentence.minCycles);
    const runs = detectUnitRuns(units, sentence);
    expect(runs).toHaveLength(1);
    expect(runs[0]?.period).toBe(base6.length);
    expect(runs[0]?.length).toBe(base12.length * sentence.minCycles);
  });

  it('minCycles - 1 周期 → run が無い', () => {
    const sentence = defaultSettings().sentence;
    const pattern = [longEnglish(0), longEnglish(1), longEnglish(2)];
    const text = cycleText(pattern, sentence.minCycles - 1);
    expect(text.length).toBeGreaterThanOrEqual(sentence.minRunChars);
    const units = unitsFromText(text);
    expect(units).toHaveLength(pattern.length * (sentence.minCycles - 1));
    expect(detectUnitRuns(units, sentence)).toHaveLength(0);
  });

  it('minRunChars - 1 文字 → run が無い', () => {
    const sentence = defaultSettings().sentence;
    const one = `${sentenceUnit(0)} ${sentenceUnit(0)}.`;
    const text = cycleText([one], sentence.minCycles);
    expect(text.length).toBeLessThan(sentence.minRunChars);
    expect(sentence.minRunChars - text.length).toBeLessThan(one.length);
    const units = unitsFromText(text);
    expect(units).toHaveLength(sentence.minCycles);
    expect(detectUnitRuns(units, sentence)).toHaveLength(0);
  });

  it('柵を含む繰り返し → run が無い', () => {
    const sentence = defaultSettings().sentence;
    const pattern = [english(0), english(1), english(2)];
    const first = cycleText(pattern, 1);
    const second = cycleText(pattern, 1);
    const third = cycleText(pattern, 1);
    const fenceOpen = '```';
    const fenceClose = '```';
    const text = [
      `${first} ${english(0)}`,
      fenceOpen,
      'code',
      fenceClose,
      `${second} ${third}`,
    ].join('\n');
    const units = unitsFromText(text);
    expect(units.some((unit) => unit.opaque)).toBe(true);
    expect(detectUnitRuns(units, sentence)).toHaveLength(0);
  });

  it('普通の文章 → run が無い', () => {
    const sentence = defaultSettings().sentence;
    const sentences = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => english(index));
    const text = sentences.join(' ');
    const units = unitsFromText(text);
    expect(units).toHaveLength(sentences.length);
    expect(detectUnitRuns(units, sentence)).toHaveLength(0);
  });

  it('周期の上限を超える繰り返し → run が無い', () => {
    const sentence = defaultSettings().sentence;
    const pattern = Array.from({ length: sentence.maxPeriodUnits + 1 }, (_, index) =>
      english(index),
    );
    const text = cycleText(pattern, sentence.minCycles);
    expect(text.length).toBeGreaterThanOrEqual(sentence.minRunChars);
    const units = unitsFromText(text);
    expect(units).toHaveLength(pattern.length * sentence.minCycles);
    expect(detectUnitRuns(units, sentence)).toHaveLength(0);
  });

  it('sentence.minRunChars を 200 にした設定で、240 文字のラン → 1 つ', () => {
    const sentence = { ...defaultSettings().sentence, minRunChars: 200 };
    const pattern = [english(0), english(1)];
    const text = cycleText(pattern, sentence.minCycles);
    expect(text.length).toBeGreaterThanOrEqual(240);
    expect(text.length).toBeLessThan(defaultSettings().sentence.minRunChars);
    const units = unitsFromText(text);
    expect(detectUnitRuns(units, defaultSettings().sentence)).toHaveLength(0);
    const runs = detectUnitRuns(units, sentence);
    expect(runs).toHaveLength(1);
  });
});

describe('sampleOf', () => {
  it('12 単位の run → 最頻の 3 文で sampleChars 以下', () => {
    const tuning = defaultSettings();
    const pattern = [english(0), english(1), english(2)];
    const cycles = tuning.sentence.minCycles + 1;
    const text = cycleText(pattern, cycles);
    const units = unitsFromText(text);
    expect(units).toHaveLength(pattern.length * cycles);
    const run: UnitRun = { at: 0, length: units.length, period: pattern.length };
    const sample = sampleOf(units, run, tuning.live.sampleChars);
    expect(sample).toBe(pattern.join(' '));
    expect(sample.length).toBeLessThanOrEqual(tuning.live.sampleChars);
  });

  it('3 文で sampleChars を超える → 切れる', () => {
    const tuning = defaultSettings();
    const pattern = [longEnglish(0), longEnglish(1), longEnglish(2), longEnglish(3)];
    const text = cycleText(pattern, tuning.sentence.minCycles);
    const units = unitsFromText(text);
    const run: UnitRun = {
      at: 0,
      length: pattern.length * tuning.sentence.minCycles,
      period: pattern.length,
    };
    const sample = sampleOf(units, run, tuning.live.sampleChars);
    expect(sample.length).toBe(tuning.live.sampleChars);
    const expected = [longEnglish(0), longEnglish(1), longEnglish(2)].join(' ');
    expect(expected.length).toBeGreaterThan(tuning.live.sampleChars);
    expect(sample).toBe(expected.slice(0, tuning.live.sampleChars));
  });

  it('1 単位の周期 → その 1 文だけ', () => {
    const tuning = defaultSettings();
    const pattern = [longEnglish(0)];
    const one = pattern[0] ?? '';
    const text = cycleText(pattern, tuning.sentence.minCycles);
    expect(text.length).toBeGreaterThanOrEqual(tuning.sentence.minRunChars);
    const units = unitsFromText(text);
    expect(units).toHaveLength(tuning.sentence.minCycles);
    const run: UnitRun = { at: 0, length: tuning.sentence.minCycles, period: pattern.length };
    expect(sampleOf(units, run, tuning.live.sampleChars)).toBe(one);
  });
});
