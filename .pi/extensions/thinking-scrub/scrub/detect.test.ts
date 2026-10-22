import { describe, expect, it } from 'vitest';
import { detectRuns, scrubThinking } from './detect.ts';

// 検出と除去。fixture は関数の中で組み立てる。

function unit(): string {
  return 'the *';
}

function repeated(pattern: string, times: number): string {
  return pattern.repeat(times);
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

  it('区間が改行2つを含み左端が空白 → 空白は残らず改行2つが入る', () => {
    const text = `foo ${repeated('\n\nThe **', 5)}bar`;
    const scrubbed = scrubThinking(text);
    expect(scrubbed.removed).toBe(1);
    expect(scrubbed.text).toBe('foo\n\nbar');
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

  it('畳んだ foo改行改行bar にもう一度かける → removed が 0、本文が同一', () => {
    const text = 'foo\n\nbar';
    const scrubbed = scrubThinking(text);
    expect(scrubbed.removed).toBe(0);
    expect(scrubbed.text).toBe(text);
  });
});
