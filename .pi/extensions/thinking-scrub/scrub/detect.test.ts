import { describe, expect, it } from 'vitest';
import { cycleText } from '../scrub.fixture.ts';
import { defaultSettings } from '../settings/schema.ts';
import { detectRuns, scrubThinking } from './detect.ts';

// 検出と除去。fixture は関数の中で組み立てる。

function unit(): string {
  return 'the *';
}

function repeated(pattern: string, times: number): string {
  return pattern.repeat(times);
}

function sentence(index: number): string {
  return `${unit()} ${index} proceeds with steady reasoning about the task and its details.`;
}

function sentenceWithChar(index: number): string {
  return `${unit()} ${index} thinks ${repeated(unit(), 12)} end.`;
}

describe('detectRuns', () => {
  it('離れた 2 か所に区間 → 2 区間で昇順', () => {
    const tuning = defaultSettings();
    const block = repeated(unit(), 12);
    const prefix = 'start';
    const middle = 'middle';
    const suffix = 'end';
    const text = `${prefix} ${block} ${middle} ${block} ${suffix}`;
    const runs = detectRuns(text, tuning.char);
    expect(runs).toHaveLength(2);
    expect(runs[0]?.at).toBeLessThan(runs[1]?.at ?? 0);
    expect(scrubThinking(text, tuning).removed).toBe(runs.length);
  });

  it('既定の char と abcd × 5 回 → 1 区間', () => {
    const tuning = defaultSettings();
    expect(tuning.char.minPeriod).toBe(4);
    const text = repeated('abcd', 5);
    expect(detectRuns(text, tuning.char)).toHaveLength(1);
  });

  it('abcd × 4 回 → 0 区間', () => {
    const tuning = defaultSettings();
    const text = repeated('abcd', 4);
    expect(text.length).toBeLessThan(tuning.char.minLength);
    expect(detectRuns(text, tuning.char)).toHaveLength(0);
  });

  it('minRepeats 未満の繰り返し → 0 区間、minRepeats 回 → 1 区間', () => {
    const tuning = defaultSettings();
    const block = `${'a'.repeat(9)}b`;
    expect(block.length).toBe(10);
    const few = repeated(block, tuning.char.minRepeats - 1);
    expect(few.length).toBeGreaterThanOrEqual(tuning.char.minLength);
    expect(detectRuns(few, tuning.char)).toHaveLength(0);
    const enough = repeated(block, tuning.char.minRepeats);
    expect(detectRuns(enough, tuning.char)).toHaveLength(1);
  });

  it('周期 minPeriod - 1 文字 → 0 区間', () => {
    const tuning = defaultSettings();
    const tooShortPeriod = 'abc';
    expect(tooShortPeriod.length).toBe(tuning.char.minPeriod - 1);
    const text = repeated(tooShortPeriod, 20);
    expect(text.length).toBeGreaterThanOrEqual(tuning.char.minLength);
    expect(detectRuns(text, tuning.char)).toHaveLength(0);
  });

  it('周期 maxPeriod 文字 → 1 区間、maxPeriod + 1 文字 → 0 区間', () => {
    const tuning = defaultSettings();
    const maxBlock = `${'a'.repeat(tuning.char.maxPeriod - 1)}b`;
    expect(maxBlock.length).toBe(tuning.char.maxPeriod);
    const maxText = repeated(maxBlock, tuning.char.minRepeats + 3);
    expect(detectRuns(maxText, tuning.char)).toHaveLength(1);
    const tooLongBlock = `${'a'.repeat(tuning.char.maxPeriod)}b`;
    expect(tooLongBlock.length).toBe(tuning.char.maxPeriod + 1);
    const longText = repeated(tooLongBlock, tuning.char.minRepeats + 3);
    expect(detectRuns(longText, tuning.char)).toHaveLength(0);
  });

  it('char.minRepeats を 2 にした設定で、20 文字の周期 → 1 区間', () => {
    const tuning = defaultSettings();
    const char = { ...tuning.char, minRepeats: 2 };
    const block = `${'a'.repeat(19)}b`;
    expect(block.length).toBe(20);
    const text = repeated(block, 2);
    expect(detectRuns(text, char)).toHaveLength(1);
  });

  it('char.maxPeriod を 20 にした設定で、周期 21 文字 → 0 区間', () => {
    const tuning = defaultSettings();
    const char = { ...tuning.char, maxPeriod: 20 };
    const block = `${'a'.repeat(20)}b`;
    expect(block.length).toBe(21);
    const text = repeated(block, char.minRepeats + 3);
    expect(detectRuns(text, char)).toHaveLength(0);
  });
});

describe('scrubThinking', () => {
  it('"the *" を 12 回並べた本文 → 1 区間で removed が 1、並びが消える', () => {
    const tuning = defaultSettings();
    const text = repeated(unit(), 12);
    // 周期 5 と周期 10 のどちらも当たるが、重なりは 1 区間にまとまる。
    const runs = detectRuns(text, tuning.char);
    expect(runs).toHaveLength(1);
    const scrubbed = scrubThinking(text, tuning);
    expect(scrubbed.removed).toBe(runs.length);
    expect(scrubbed.text).not.toContain(unit());
  });

  it('foo + "the *" × 5 + bar → 区間 1、foo bar', () => {
    const tuning = defaultSettings();
    const prefix = 'foo';
    const suffix = 'bar';
    const text = `${prefix}${repeated(unit(), 5)}${suffix}`;
    const expected = `${prefix} ${suffix}`;
    const runs = detectRuns(text, tuning.char);
    expect(runs).toHaveLength(1);
    expect(scrubThinking(text, tuning)).toEqual({ text: expected, removed: runs.length });
  });

  it('周期の長さと繰り返しの数は別々に効く', () => {
    const tuning = defaultSettings();
    const minBlock = 'abcd';
    expect(minBlock.length).toBe(tuning.char.minPeriod);
    const longEnough = repeated(minBlock, tuning.char.minRepeats + 2);
    expect(longEnough.length).toBeGreaterThanOrEqual(tuning.char.minLength);
    expect(scrubThinking(longEnough, tuning).removed).toBe(1);
    const tooShort = repeated(minBlock, tuning.char.minRepeats + 1);
    expect(tooShort.length).toBeLessThan(tuning.char.minLength);
    const shortScrubbed = scrubThinking(tooShort, tuning);
    expect(shortScrubbed.removed).toBe(0);
    expect(shortScrubbed.text).toBe(tooShort);

    const midBlock = `${'a'.repeat(tuning.char.minLength + 9)}b`;
    expect(midBlock.length).toBe(tuning.char.minLength + 10);
    const enoughRepeats = repeated(midBlock, tuning.char.minRepeats);
    expect(enoughRepeats.length).toBeGreaterThanOrEqual(tuning.char.minLength);
    expect(scrubThinking(enoughRepeats, tuning).removed).toBe(1);
    const fewRepeats = repeated(midBlock, tuning.char.minRepeats - 1);
    expect(fewRepeats.length).toBeGreaterThanOrEqual(tuning.char.minLength);
    const fewScrubbed = scrubThinking(fewRepeats, tuning);
    expect(fewScrubbed.removed).toBe(0);
    expect(fewScrubbed.text).toBe(fewRepeats);
  });

  it('周期の下限より短い周期は消さず、上限を超える周期は消さない', () => {
    const tuning = defaultSettings();
    const tooShortPeriod = 'abc';
    expect(tooShortPeriod.length).toBe(tuning.char.minPeriod - 1);
    const shortText = repeated(tooShortPeriod, 20);
    expect(shortText.length).toBeGreaterThanOrEqual(tuning.char.minLength);
    const shortScrubbed = scrubThinking(shortText, tuning);
    expect(shortScrubbed.removed).toBe(0);
    expect(shortScrubbed.text).toBe(shortText);

    const maxBlock = `${'a'.repeat(tuning.char.maxPeriod - 1)}b`;
    expect(maxBlock.length).toBe(tuning.char.maxPeriod);
    const maxText = repeated(maxBlock, tuning.char.minRepeats + 3);
    expect(scrubThinking(maxText, tuning).removed).toBe(1);

    const tooLongBlock = `${'a'.repeat(tuning.char.maxPeriod)}b`;
    expect(tooLongBlock.length).toBe(tuning.char.maxPeriod + 1);
    const longText = repeated(tooLongBlock, tuning.char.minRepeats + 3);
    const longScrubbed = scrubThinking(longText, tuning);
    expect(longScrubbed.removed).toBe(0);
    expect(longScrubbed.text).toBe(longText);
  });

  it('反復の無い文章 → removed が 0、本文が同一', () => {
    const tuning = defaultSettings();
    const text = 'hello world, this is a normal sentence without repeats.';
    const scrubbed = scrubThinking(text, tuning);
    expect(scrubbed.removed).toBe(0);
    expect(scrubbed.text).toBe(text);
  });

  it('境目の前後がどちらも非空白 → 空白 1 個、片方が空白 → 足さない', () => {
    const tuning = defaultSettings();
    const prefix = 'foo';
    const suffix = 'bar';
    const block = repeated(unit(), 12);
    const bothTight = `${prefix}${block}${suffix}`;
    expect(scrubThinking(bothTight, tuning).text).toBe(`${prefix} ${suffix}`);
    const leftSpaced = `${prefix} ${block}${suffix}`;
    expect(scrubThinking(leftSpaced, tuning).text).toBe(`${prefix} ${suffix}`);
    const rightSpaced = `${prefix}${block} ${suffix}`;
    expect(scrubThinking(rightSpaced, tuning).text).toBe(`${prefix} ${suffix}`);
  });

  it('区間が改行 2 つ / 1 つ / 無しを含む → 繋ぎ目にその改行を戻す', () => {
    const tuning = defaultSettings();
    const prefix = 'foo';
    const suffix = 'bar';
    const doubleReturn = '\n\n';
    const doubleText = `${prefix}${repeated(`${doubleReturn}The **`, 5)}${suffix}`;
    expect(scrubThinking(doubleText, tuning).text).toBe(`${prefix}${doubleReturn}${suffix}`);
    const singleReturn = '\n';
    const singleText = `${prefix}${repeated(`${singleReturn}abcd`, 12)}${suffix}`;
    expect(scrubThinking(singleText, tuning).text).toBe(`${prefix}${singleReturn}${suffix}`);
    const noReturnText = `${prefix}${repeated(unit(), 12)}${suffix}`;
    expect(scrubThinking(noReturnText, tuning).text).toBe(`${prefix} ${suffix}`);
  });

  it('区間が本文先頭 / 末尾にある → 詰めるだけで改行を足さない', () => {
    const tuning = defaultSettings();
    const suffix = 'bar';
    const prefix = 'foo';
    const headText = `${repeated('\n\nThe **', 5)}${suffix}`;
    expect(scrubThinking(headText, tuning).text).toBe(suffix);
    const tailText = `${prefix}${repeated('\n\nThe **', 5)}`;
    expect(scrubThinking(tailText, tuning).text).toBe(prefix);
  });

  it('結果にもう一度かける → removed が 0、本文が同一', () => {
    const tuning = defaultSettings();
    const prefix = 'foo';
    const suffix = 'bar';
    const text = `${prefix}${repeated(unit(), 12)}${suffix}`;
    const first = scrubThinking(text, tuning);
    expect(first.removed).toBe(1);
    const second = scrubThinking(first.text, tuning);
    expect(second.removed).toBe(0);
    expect(second.text).toBe(first.text);
  });
});

describe('scrubThinking sentence', () => {
  it('文ループ 3 周期 → 最初の 1 周期だけ残り、残りが消える', () => {
    const tuning = defaultSettings();
    const pattern = [sentence(0), sentence(1), sentence(2)];
    const text = cycleText(pattern, tuning.sentence.minCycles);
    expect(text.length).toBeGreaterThanOrEqual(tuning.sentence.minRunChars);
    const scrubbed = scrubThinking(text, tuning);
    expect(scrubbed.removed).toBe(1);
    expect(scrubbed.text).toBe(pattern.join(' '));
  });

  it('各周期が文字ループを持つ文ループ → 文が先で removed が 2', () => {
    const tuning = defaultSettings();
    const pattern = [sentence(0), sentenceWithChar(1), sentence(2)];
    const text = cycleText(pattern, tuning.sentence.minCycles);
    expect(text.length).toBeGreaterThanOrEqual(tuning.sentence.minRunChars);
    const scrubbed = scrubThinking(text, tuning);
    expect(scrubbed.removed).toBe(2);
    expect(scrubbed.text).toContain(sentence(0));
    expect(scrubbed.text).not.toContain(repeated(unit(), 12));
  });

  it('柵を含む文ループ → 消えない', () => {
    const tuning = defaultSettings();
    const pattern = [sentence(0), sentence(1), sentence(2)];
    const cycle = pattern.join(' ');
    const fence = '```';
    const text = `${cycle}\n${fence}\ncode\n${fence}\n${cycle}\n${cycle}`;
    const scrubbed = scrubThinking(text, tuning);
    expect(scrubbed.removed).toBe(0);
    expect(scrubbed.text).toBe(text);
  });

  it('3 周期でも文字数不足の文ループ → 消えない', () => {
    const tuning = defaultSettings();
    const one = sentence(0);
    const text = cycleText([one], tuning.sentence.minCycles);
    expect(text.length).toBeLessThan(tuning.sentence.minRunChars);
    const scrubbed = scrubThinking(text, tuning);
    expect(scrubbed.removed).toBe(0);
    expect(scrubbed.text).toBe(text);
  });

  it('消える周期が改行を含む → 繋ぎ目に同じ改行を戻す', () => {
    const tuning = defaultSettings();
    const pattern = [sentence(0), sentence(1), sentence(2)];
    const cycle = pattern.join(' ');
    const head = sentence(10);
    const tail = sentence(11);
    const doubleReturn = '\n\n';
    const doubleText = `${head}${doubleReturn}${cycle}${doubleReturn}${cycle}${doubleReturn}${cycle}${doubleReturn}${tail}`;
    expect(scrubThinking(doubleText, tuning).text).toBe(
      `${head}${doubleReturn}${cycle}${doubleReturn}${tail}`,
    );
    const singleReturn = '\n';
    const singleText = `${head}${singleReturn}${cycle}${singleReturn}${cycle}${singleReturn}${cycle}${singleReturn}${tail}`;
    expect(scrubThinking(singleText, tuning).text).toBe(
      `${head}${singleReturn}${cycle}${singleReturn}${tail}`,
    );
    const spacedText = `${head} ${cycle} ${cycle} ${cycle} ${tail}`;
    expect(scrubThinking(spacedText, tuning).text).toBe(`${head} ${cycle} ${tail}`);
  });
});
