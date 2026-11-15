import { describe, expect, it } from 'vitest';
import { cycleText } from '../scrub.fixture.ts';
import { defaultSettings } from '../settings/schema.ts';
import { detectRuns, scrubThinking } from './detect.ts';

// 検出と除去を行う。fixture は scrub.fixture.ts から読む。

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

const tuning = defaultSettings();

describe('detectRuns', () => {
  it('離れた 2 か所に区間があれば 2 区間で昇順になる', () => {
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

  it('既定の char と abcd を 5 回重ねれば 1 区間になる', () => {
    const text = repeated('abcd', 5);
    expect(detectRuns(text, tuning.char)).toHaveLength(1);
  });

  it('abcd を 4 回重ねれば 0 区間になる', () => {
    const text = repeated('abcd', 4);
    expect(detectRuns(text, tuning.char)).toHaveLength(0);
  });

  it('minRepeats 未満の繰り返しは 0 区間になり minRepeats 回は 1 区間になる', () => {
    const block = `${'a'.repeat(9)}b`;
    expect(block.length).toBe(10);
    const few = repeated(block, tuning.char.minRepeats - 1);
    expect(detectRuns(few, tuning.char)).toHaveLength(0);
    const enough = repeated(block, tuning.char.minRepeats);
    expect(detectRuns(enough, tuning.char)).toHaveLength(1);
  });

  it('周期が minPeriod から 1 文字短ければ 0 区間になる', () => {
    const tooShortPeriod = 'abc';
    const text = repeated(tooShortPeriod, 20);
    expect(text.length).toBeGreaterThanOrEqual(tuning.char.minLength);
    expect(detectRuns(text, tuning.char)).toHaveLength(0);
  });

  it('周期が maxPeriod 文字なら 1 区間になり maxPeriod に 1 文字足せば 0 区間になる', () => {
    const maxBlock = `${'a'.repeat(tuning.char.maxPeriod - 1)}b`;
    const maxText = repeated(maxBlock, tuning.char.minRepeats + 3);
    expect(detectRuns(maxText, tuning.char)).toHaveLength(1);
    const tooLongBlock = `${'a'.repeat(tuning.char.maxPeriod)}b`;
    const longText = repeated(tooLongBlock, tuning.char.minRepeats + 3);
    expect(detectRuns(longText, tuning.char)).toHaveLength(0);
  });

  it('char.minRepeats を 2 にした設定で 20 文字の周期なら 1 区間になる', () => {
    const char = { ...tuning.char, minRepeats: 2 };
    const block = `${'a'.repeat(19)}b`;
    const text = repeated(block, 2);
    expect(detectRuns(text, char)).toHaveLength(1);
  });

  it('char.maxPeriod を 20 にした設定で周期 21 文字なら 0 区間になる', () => {
    const char = { ...tuning.char, maxPeriod: 20 };
    const block = `${'a'.repeat(20)}b`;
    const text = repeated(block, char.minRepeats + 3);
    expect(detectRuns(text, char)).toHaveLength(0);
  });
});

describe('scrubThinking', () => {
  it('"the *" を 12 回並べた本文なら 1 区間で removed が 1 になり並びが消える', () => {
    const text = repeated(unit(), 12);
    // 周期 5 と周期 10 のどちらも当たるが、重なりは 1 区間にまとまる。
    const runs = detectRuns(text, tuning.char);
    expect(runs).toHaveLength(1);
    const scrubbed = scrubThinking(text, tuning);
    expect(scrubbed.removed).toBe(runs.length);
    expect(scrubbed.text).not.toContain(unit());
  });

  it('foo と "the *" を 5 回と bar なら区間が 1 になり foo bar になる', () => {
    const prefix = 'foo';
    const suffix = 'bar';
    const text = `${prefix}${repeated(unit(), 5)}${suffix}`;
    const expected = `${prefix} ${suffix}`;
    const runs = detectRuns(text, tuning.char);
    expect(runs).toHaveLength(1);
    expect(scrubThinking(text, tuning)).toEqual({ text: expected, removed: runs.length });
  });

  it('反復のない文章なら removed が 0 になり本文が同一になる', () => {
    const text = 'hello world, this is a normal sentence without repeats.';
    const scrubbed = scrubThinking(text, tuning);
    expect(scrubbed.removed).toBe(0);
    expect(scrubbed.text).toBe(text);
  });

  it('境目の前後がどちらも非空白なら空白 1 個になり片方が空白なら足さない', () => {
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

  it('区間が改行 2 つと 1 つと なしを含む場合はつなぎ目にその改行を戻す', () => {
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

  it('区間が本文先頭と末尾にあれば詰めるだけで改行を足さない', () => {
    const suffix = 'bar';
    const prefix = 'foo';
    const headText = `${repeated('\n\nThe **', 5)}${suffix}`;
    expect(scrubThinking(headText, tuning).text).toBe(suffix);
    const tailText = `${prefix}${repeated('\n\nThe **', 5)}`;
    expect(scrubThinking(tailText, tuning).text).toBe(prefix);
  });
});

describe('scrubThinking sentence', () => {
  it('文ループ 3 周期なら最初の 1 周期だけ残り残りが消える', () => {
    const pattern = [sentence(0), sentence(1), sentence(2)];
    const text = cycleText(pattern, tuning.sentence.minCycles);
    expect(text.length).toBeGreaterThanOrEqual(tuning.sentence.minRunChars);
    const scrubbed = scrubThinking(text, tuning);
    expect(scrubbed.removed).toBe(1);
    expect(scrubbed.text).toBe(pattern.join(' '));
  });

  it('各周期が文字ループを持つ文ループなら文が先になり removed が 2 になる', () => {
    const pattern = [sentence(0), sentenceWithChar(1), sentence(2)];
    const text = cycleText(pattern, tuning.sentence.minCycles);
    expect(text.length).toBeGreaterThanOrEqual(tuning.sentence.minRunChars);
    const scrubbed = scrubThinking(text, tuning);
    expect(scrubbed.removed).toBe(2);
    expect(scrubbed.text).toContain(sentence(0));
    expect(scrubbed.text).not.toContain(repeated(unit(), 12));
  });

  it('柵を含む文ループは消えない', () => {
    const pattern = [sentence(0), sentence(1), sentence(2)];
    const cycle = pattern.join(' ');
    const fence = '```';
    const text = `${cycle}\n${fence}\ncode\n${fence}\n${cycle}\n${cycle}`;
    const scrubbed = scrubThinking(text, tuning);
    expect(scrubbed.removed).toBe(0);
    expect(scrubbed.text).toBe(text);
  });

  it('3 周期でも文字数不足の文ループは消えない', () => {
    const one = sentence(0);
    const text = cycleText([one], tuning.sentence.minCycles);
    expect(text.length).toBeLessThan(tuning.sentence.minRunChars);
    const scrubbed = scrubThinking(text, tuning);
    expect(scrubbed.removed).toBe(0);
    expect(scrubbed.text).toBe(text);
  });

  it('消える周期が改行を含めばつなぎ目に同じ改行を戻す', () => {
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
