import { describe, expect, it } from 'vitest';
import { detectRuns, scrubThinking, separatorFor } from './detect.ts';
import { MIN_CYCLES, MIN_RUN_CHARS } from './units.ts';

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

function cycleText(pattern: readonly string[], cycles: number, sep = ' '): string {
  return Array.from({ length: cycles }, () => pattern.join(' ')).join(sep);
}

describe('detectRuns', () => {
  it('離れた 2 か所に区間 → 2 区間で昇順', () => {
    const block = repeated(unit(), 12);
    const text = `start ${block} middle ${block} end`;
    const runs = detectRuns(text);
    expect(runs).toHaveLength(2);
    expect(runs[0]?.at).toBeLessThan(runs[1]?.at ?? 0);
    expect(scrubThinking(text).removed).toBe(2);
  });
});

describe('separatorFor', () => {
  it('改行2つを含む → 改行2つを返す', () => {
    expect(separatorFor('\n\n')).toBe('\n\n');
  });

  it('改行1つだけを含む → 改行1つを返す', () => {
    expect(separatorFor('a\nb')).toBe('\n');
  });

  it('改行を含まない → undefinedを返す', () => {
    expect(separatorFor('ab')).toBeUndefined();
  });
});

describe('scrubThinking', () => {
  it('"the *" を 12 回並べた本文 → 1 区間で removed が 1、並びが消える', () => {
    const text = repeated(unit(), 12);
    // 周期 5 と周期 10 のどちらも当たるが、重なりは 1 区間にまとまる。
    expect(detectRuns(text)).toEqual([{ at: 0, length: 60 }]);
    const scrubbed = scrubThinking(text);
    expect(scrubbed.removed).toBe(1);
    expect(scrubbed.text).not.toContain(unit());
  });

  it('foo + "the *" × 5 + bar（25 文字）→ 区間 1、foo bar', () => {
    const text = `foo${repeated(unit(), 5)}bar`;
    expect(repeated(unit(), 5)).toHaveLength(25);
    const runs = detectRuns(text);
    expect(runs).toHaveLength(1);
    expect(scrubThinking(text)).toEqual({ text: 'foo bar', removed: 1 });
  });

  it('同じ 12 文字を 5 回（60 文字）→ 区間 1、消える', () => {
    const text = repeated('abcdefghijkl', 5);
    expect(text).toHaveLength(60);
    const runs = detectRuns(text);
    expect(runs).toHaveLength(1);
    expect(scrubThinking(text).removed).toBe(1);
  });

  it('同じ 30 文字を 2 回（60 文字）→ 区間 0、本文そのまま', () => {
    const block = `${'a'.repeat(29)}b`;
    expect(block).toHaveLength(30);
    const text = repeated(block, 2);
    expect(text).toHaveLength(60);
    const scrubbed = scrubThinking(text);
    expect(scrubbed.removed).toBe(0);
    expect(scrubbed.text).toBe(text);
  });

  it('周期 4 文字を 5 回（20 文字）→ 区間 1、消える', () => {
    const text = repeated('abcd', 5);
    expect(text).toHaveLength(20);
    const runs = detectRuns(text);
    expect(runs).toHaveLength(1);
    expect(scrubThinking(text).removed).toBe(1);
  });

  it('周期 4 文字を 4 回（16 文字）→ 区間 0、本文そのまま', () => {
    const text = repeated('abcd', 4);
    expect(text).toHaveLength(16);
    const scrubbed = scrubThinking(text);
    expect(scrubbed.removed).toBe(0);
    expect(scrubbed.text).toBe(text);
  });

  it('周期 3 文字の連続 → removed が 0', () => {
    const text = repeated('abc', 20);
    expect(text).toHaveLength(60);
    const scrubbed = scrubThinking(text);
    expect(scrubbed.removed).toBe(0);
    expect(scrubbed.text).toBe(text);
  });

  it('周期 120 文字の連続 → removed が 1', () => {
    const block = `${'a'.repeat(119)}b`;
    expect(block).toHaveLength(120);
    const text = repeated(block, 6);
    expect(scrubThinking(text).removed).toBe(1);
  });

  it('周期 121 文字の連続 → removed が 0', () => {
    const block = `${'a'.repeat(120)}b`;
    expect(block).toHaveLength(121);
    const text = repeated(block, 6);
    const scrubbed = scrubThinking(text);
    expect(scrubbed.removed).toBe(0);
    expect(scrubbed.text).toBe(text);
  });

  it('空文字 → removed が 0、本文が同一', () => {
    const scrubbed = scrubThinking('');
    expect(scrubbed.removed).toBe(0);
    expect(scrubbed.text).toBe('');
  });

  it('反復の無い文章 → removed が 0、本文が同一', () => {
    const text = 'hello world, this is a normal sentence without repeats.';
    const scrubbed = scrubThinking(text);
    expect(scrubbed.removed).toBe(0);
    expect(scrubbed.text).toBe(text);
  });

  it('境目の前後がどちらも非空白 → 空白 1 個が入る', () => {
    const text = `foo${repeated(unit(), 12)}bar`;
    const scrubbed = scrubThinking(text);
    expect(scrubbed.removed).toBe(1);
    expect(scrubbed.text).toBe('foo bar');
  });

  it('境目の前後どちらかが空白 → 空白を足さない', () => {
    const block = repeated(unit(), 12);
    expect(scrubThinking(`foo ${block}bar`).text).toBe('foo bar');
    expect(scrubThinking(`foo${block} bar`).text).toBe('foo bar');
  });

  it('区間が改行2つを含む → 繋ぎ目に改行2つが入る', () => {
    const text = `foo${repeated('\n\nThe **', 5)}bar`;
    const scrubbed = scrubThinking(text);
    expect(scrubbed.removed).toBe(1);
    expect(scrubbed.text).toBe('foo\n\nbar');
  });

  it('区間が改行2つを含み両端が空白 → 空白は残らず改行2つが入る', () => {
    const text = `foo ${repeated('\n\nThe **', 5)} bar`;
    const scrubbed = scrubThinking(text);
    expect(scrubbed.removed).toBe(1);
    expect(scrubbed.text).toBe('foo\n\nbar');
  });

  it('区間が本文先頭にある → 詰めるだけで改行を足さない', () => {
    const text = `${repeated('\n\nThe **', 5)}bar`;
    const scrubbed = scrubThinking(text);
    expect(scrubbed.removed).toBe(1);
    expect(scrubbed.text).toBe('bar');
  });

  it('区間が本文末尾にある → 詰めるだけで改行を足さない', () => {
    const text = `foo${repeated('\n\nThe **', 5)}`;
    const scrubbed = scrubThinking(text);
    expect(scrubbed.removed).toBe(1);
    expect(scrubbed.text).toBe('foo');
  });

  it('区間が改行1つだけを含む → 繋ぎ目に改行1つが入る', () => {
    const text = `foo${repeated('\nabcd', 12)}bar`;
    const scrubbed = scrubThinking(text);
    expect(scrubbed.removed).toBe(1);
    expect(scrubbed.text).toBe('foo\nbar');
  });

  it('結果にもう一度かける → removed が 0、本文が同一', () => {
    const text = `foo${repeated(unit(), 12)}bar`;
    const first = scrubThinking(text);
    expect(first.removed).toBe(1);
    const second = scrubThinking(first.text);
    expect(second.removed).toBe(0);
    expect(second.text).toBe(first.text);
  });
});

describe('scrubThinking sentence', () => {
  it('文ループ 3 周期 → 最初の 1 周期だけ残り、残りが消える', () => {
    const pattern = [sentence(0), sentence(1), sentence(2)];
    const text = cycleText(pattern, MIN_CYCLES);
    expect(text.length).toBeGreaterThanOrEqual(MIN_RUN_CHARS);
    const scrubbed = scrubThinking(text);
    expect(scrubbed.removed).toBe(1);
    expect(scrubbed.text).toBe(pattern.join(' '));
  });

  it('文字ループ repeated() → 前と同じく消える', () => {
    const text = repeated(unit(), 12);
    const scrubbed = scrubThinking(text);
    expect(scrubbed.removed).toBe(1);
    expect(scrubbed.text).not.toContain(unit());
  });

  it('各周期が文字ループを持つ文ループ → 文が先で removed が 2、文字が先ならもっと増える', () => {
    const pattern = [sentence(0), sentenceWithChar(1), sentence(2)];
    const text = cycleText(pattern, MIN_CYCLES);
    expect(text.length).toBeGreaterThanOrEqual(MIN_RUN_CHARS);
    const scrubbed = scrubThinking(text);
    expect(scrubbed.removed).toBe(2);
    expect(scrubbed.text).toContain(sentence(0));
    expect(scrubbed.text).not.toContain(repeated(unit(), 12));
  });

  it('柵を含む文ループ → 消えない', () => {
    const pattern = [sentence(0), sentence(1), sentence(2)];
    const cycle = pattern.join(' ');
    const text = `${cycle}\n\`\`\`\ncode\n\`\`\`\n${cycle}\n${cycle}`;
    const scrubbed = scrubThinking(text);
    expect(scrubbed.removed).toBe(0);
    expect(scrubbed.text).toBe(text);
  });

  it('3 周期でも 400 文字未満の文ループ → 消えない', () => {
    const one = sentence(0);
    const text = cycleText([one], MIN_CYCLES);
    expect(text.length).toBeLessThan(MIN_RUN_CHARS);
    const scrubbed = scrubThinking(text);
    expect(scrubbed.removed).toBe(0);
    expect(scrubbed.text).toBe(text);
  });

  it('普通の文章 → そのままで removed が 0', () => {
    const parts = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => sentence(index));
    const text = parts.join(' ');
    const scrubbed = scrubThinking(text);
    expect(scrubbed.removed).toBe(0);
    expect(scrubbed.text).toBe(text);
  });

  it('消える周期が改行2つを含む → 繋ぎ目に改行2つが残る', () => {
    const pattern = [sentence(0), sentence(1), sentence(2)];
    const cycle = pattern.join(' ');
    const text = `${sentence(10)}\n\n${cycle}\n\n${cycle}\n\n${cycle}\n\n${sentence(11)}`;
    const scrubbed = scrubThinking(text);
    expect(scrubbed.removed).toBe(1);
    expect(scrubbed.text).toBe(`${sentence(10)}\n\n${cycle}\n\n${sentence(11)}`);
  });

  it('消える周期が改行1つだけを含む → 繋ぎ目に改行1つが残る', () => {
    const pattern = [sentence(0), sentence(1), sentence(2)];
    const cycle = pattern.join(' ');
    const text = `${sentence(10)}\n${cycle}\n${cycle}\n${cycle}\n${sentence(11)}`;
    const scrubbed = scrubThinking(text);
    expect(scrubbed.removed).toBe(1);
    expect(scrubbed.text).toBe(`${sentence(10)}\n${cycle}\n${sentence(11)}`);
  });

  it('消える文に改行が無く前後が非空白 → 繋ぎ目に空白1つが入る', () => {
    const pattern = [sentence(0), sentence(1), sentence(2)];
    const cycle = pattern.join(' ');
    const text = `${sentence(10)} ${cycle} ${cycle} ${cycle} ${sentence(11)}`;
    const scrubbed = scrubThinking(text);
    expect(scrubbed.removed).toBe(1);
    expect(scrubbed.text).toBe(`${sentence(10)} ${cycle} ${sentence(11)}`);
    expect(scrubbed.text).not.toContain('\n');
  });
});
