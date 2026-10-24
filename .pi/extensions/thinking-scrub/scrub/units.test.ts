import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  MAX_PERIOD_UNITS,
  MIN_CYCLES,
  MIN_RUN_CHARS,
  SAMPLE_CHARS,
  detectUnitRuns,
  sampleOf,
  splitUnits,
  type Unit,
  type UnitRun,
} from './units.ts';

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

function cycleText(pattern: readonly string[], cycles: number): string {
  return Array.from({ length: cycles }, () => pattern.join(' ')).join(' ');
}

describe('splitUnits', () => {
  it('2 行の英語が factory から → 4 単位で元の offset を保つ', () => {
    const line1 = `${english(0)} ${english(1, '!')}`;
    const line2 = `${english(2, '?')} ${english(3)}`;
    const text = `${line1}\n${line2}`;
    const units = unitsFromText(text);
    expect(units).toHaveLength(4);
    for (const unit of units) {
      expect(text.slice(unit.start, unit.end)).toBe(unit.text);
      expect(unit.opaque).toBe(false);
    }
    expect(units[0]?.text).toBe(english(0));
    expect(units[1]?.text).toBe(english(1, '!'));
    expect(units[2]?.text).toBe(english(2, '?'));
    expect(units[3]?.text).toBe(english(3));
    expect(units[1]?.start).toBeGreaterThan(units[0]?.end ?? 0);
    expect(units[2]?.start).toBeGreaterThanOrEqual(line1.length + 1);
  });

  it('。と！の日本語 1 行が factory から → その印で分かれ offset を保つ', () => {
    const text = `${japanese(20)}${japanese(21, '！')}`;
    const units = unitsFromText(text);
    expect(units).toHaveLength(2);
    for (const unit of units) {
      expect(text.slice(unit.start, unit.end)).toBe(unit.text);
    }
    expect(units[0]?.text.endsWith('。')).toBe(true);
    expect(units[1]?.text.endsWith('！')).toBe(true);
    expect(units[1]?.start).toBe(units[0]?.end);
  });

  it('フェンス囲み → 柵の行と中身が不透明', () => {
    const text = [english(0), '```js', english(1), english(2), '```', english(3)].join('\n');
    const units = unitsFromText(text);
    expect(units).toHaveLength(6);
    expect(units[0]?.opaque).toBe(false);
    expect(units[1]?.opaque).toBe(true);
    expect(units[1]?.text).toBe('```js');
    expect(units[2]?.opaque).toBe(true);
    expect(units[3]?.opaque).toBe(true);
    expect(units[4]?.opaque).toBe(true);
    expect(units[4]?.text).toBe('```');
    expect(units[5]?.opaque).toBe(false);
    for (const unit of units) {
      expect(text.slice(unit.start, unit.end)).toBe(unit.text);
    }
  });

  it('表の行と diff --git の行 → 不透明', () => {
    const table = '| a | b |';
    const diff = 'diff --git a/foo b/foo';
    const text = [english(0), table, english(1), diff, english(2)].join('\n');
    const units = unitsFromText(text);
    const byText = new Map(units.map((unit) => [unit.text, unit]));
    expect(byText.get(table)?.opaque).toBe(true);
    expect(byText.get(diff)?.opaque).toBe(true);
    expect(byText.get(english(0))?.opaque).toBe(false);
    expect(byText.get(english(1))?.opaque).toBe(false);
    expect(byText.get(english(2))?.opaque).toBe(false);
  });

  it('略語で終わる行 → 略語が 1 単位になり前後がずれない', () => {
    const rest = english(5);
    const text = `No. ${rest}`;
    const units = unitsFromText(text);
    expect(units).toHaveLength(2);
    expect(units[0]?.text).toBe('No.');
    expect(units[0]?.start).toBe(0);
    expect(units[1]?.text).toBe(rest);
    expect(text.slice(units[1]?.start ?? 0, units[1]?.end ?? 0)).toBe(rest);
    expect(units[1]?.start).toBeGreaterThan(units[0]?.end ?? 0);
  });
});

describe('detectUnitRuns', () => {
  it(`${MIN_CYCLES} 周期ぶんの 3 文 → 周期 3 の run が 1 つ`, () => {
    const pattern = [english(0), english(1), english(2)];
    const text = cycleText(pattern, MIN_CYCLES);
    expect(text.length).toBeGreaterThanOrEqual(MIN_RUN_CHARS);
    const units = unitsFromText(text);
    expect(units).toHaveLength(pattern.length * MIN_CYCLES);
    const runs = detectUnitRuns(units);
    expect(runs).toHaveLength(1);
    expect(runs[0]).toEqual({ at: 0, length: pattern.length * MIN_CYCLES, period: 3 });
  });

  it('周期 6 と 12 が重なる factory の並び → 周期 6 の run が 1 つ', () => {
    const base6 = [0, 1, 2, 3, 4, 5].map((index) => english(index));
    const base12 = [...base6, ...base6];
    const text = cycleText(base12, MIN_CYCLES);
    const units = unitsFromText(text);
    expect(units).toHaveLength(base12.length * MIN_CYCLES);
    const runs = detectUnitRuns(units);
    expect(runs).toHaveLength(1);
    expect(runs[0]?.period).toBe(6);
    expect(runs[0]?.length).toBe(base12.length * MIN_CYCLES);
  });

  it(`${MIN_CYCLES - 1} 周期 → run が無い`, () => {
    const pattern = [longEnglish(0), longEnglish(1), longEnglish(2)];
    const text = cycleText(pattern, MIN_CYCLES - 1);
    expect(text.length).toBeGreaterThanOrEqual(MIN_RUN_CHARS);
    const units = unitsFromText(text);
    expect(units).toHaveLength(pattern.length * (MIN_CYCLES - 1));
    expect(detectUnitRuns(units)).toHaveLength(0);
  });

  it(`${MIN_CYCLES} 周期でも ${MIN_RUN_CHARS} 文字未満 → run が無い`, () => {
    const one = english(0);
    const text = cycleText([one], MIN_CYCLES);
    expect(text.length).toBeLessThan(MIN_RUN_CHARS);
    const units = unitsFromText(text);
    expect(units).toHaveLength(MIN_CYCLES);
    expect(detectUnitRuns(units)).toHaveLength(0);
  });

  it('柵を含む繰り返し → run が無い', () => {
    const pattern = [english(0), english(1), english(2)];
    const first = cycleText(pattern, 1);
    const second = cycleText(pattern, 1);
    const third = cycleText(pattern, 1);
    const text = [`${first} ${english(0)}`, '```', 'code', '```', `${second} ${third}`].join('\n');
    const units = unitsFromText(text);
    expect(units.some((unit) => unit.opaque)).toBe(true);
    expect(detectUnitRuns(units)).toHaveLength(0);
  });

  it('普通の文章 → run が無い', () => {
    const sentences = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => english(index));
    const text = sentences.join(' ');
    const units = unitsFromText(text);
    expect(units).toHaveLength(sentences.length);
    expect(detectUnitRuns(units)).toHaveLength(0);
  });

  it(`周期 ${MAX_PERIOD_UNITS + 1} の繰り返し → 上限を超えるため run が無い`, () => {
    const pattern = Array.from({ length: MAX_PERIOD_UNITS + 1 }, (_, index) => english(index));
    const text = cycleText(pattern, MIN_CYCLES);
    expect(text.length).toBeGreaterThanOrEqual(MIN_RUN_CHARS);
    const units = unitsFromText(text);
    expect(units).toHaveLength(pattern.length * MIN_CYCLES);
    expect(detectUnitRuns(units)).toHaveLength(0);
  });
});

describe('sampleOf', () => {
  it('12 単位の run → 最頻の 3 文で SAMPLE_CHARS 以下', () => {
    const pattern = [english(0), english(1), english(2)];
    const text = cycleText(pattern, 4);
    const units = unitsFromText(text);
    expect(units).toHaveLength(12);
    const run: UnitRun = { at: 0, length: 12, period: 3 };
    const sample = sampleOf(units, run);
    expect(sample).toBe(pattern.join(' '));
    expect(sample.length).toBeLessThanOrEqual(SAMPLE_CHARS);
  });

  it(`3 文で ${SAMPLE_CHARS} 文字を超える → SAMPLE_CHARS で切れる`, () => {
    const pattern = [longEnglish(0), longEnglish(1), longEnglish(2), longEnglish(3)];
    const text = cycleText(pattern, MIN_CYCLES);
    const units = unitsFromText(text);
    const run: UnitRun = { at: 0, length: pattern.length * MIN_CYCLES, period: 4 };
    const sample = sampleOf(units, run);
    expect(sample.length).toBe(SAMPLE_CHARS);
    const expected = [longEnglish(0), longEnglish(1), longEnglish(2)].join(' ');
    expect(expected.length).toBeGreaterThan(SAMPLE_CHARS);
    expect(sample).toBe(expected.slice(0, SAMPLE_CHARS));
  });

  it('1 単位の周期 → その 1 文だけ', () => {
    const one = longEnglish(0);
    const text = cycleText([one], MIN_CYCLES);
    expect(text.length).toBeGreaterThanOrEqual(MIN_RUN_CHARS);
    const units = unitsFromText(text);
    expect(units).toHaveLength(MIN_CYCLES);
    const run: UnitRun = { at: 0, length: MIN_CYCLES, period: 1 };
    expect(sampleOf(units, run)).toBe(one);
  });

  it('units.ts のソースに生の NUL が無い → indexOf(0) が -1', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const source = readFileSync(join(here, 'units.ts'));
    expect(source.indexOf(0)).toBe(-1);
  });
});
