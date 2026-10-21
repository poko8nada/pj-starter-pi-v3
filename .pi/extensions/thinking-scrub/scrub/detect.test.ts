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

  it('同じ並びが 5 回 → removed が 0、本文が同一', () => {
    // 60 文字で MIN_LENGTH は通るため、0 は MIN_REPEATS のおかげ。
    const text = repeated('abcdefghijkl', 5);
    expect(text).toHaveLength(60);
    const scrubbed = scrubThinking(text);
    expect(scrubbed.removed).toBe(0);
    expect(scrubbed.text).toBe(text);
  });

  it('同じ並びが 6 回で区間 59 文字 → removed が 0', () => {
    const base = 'abcdefghi';
    const text = repeated(base, 6) + base.slice(0, 5);
    expect(text).toHaveLength(59);
    const scrubbed = scrubThinking(text);
    expect(scrubbed.removed).toBe(0);
    expect(scrubbed.text).toBe(text);
  });

  it('同じ並びが 6 回で区間 60 文字 → removed が 1', () => {
    const base = 'abcdefghi';
    const text = repeated(base, 6) + base.slice(0, 6);
    expect(text).toHaveLength(60);
    const scrubbed = scrubThinking(text);
    expect(scrubbed.removed).toBe(1);
  });

  it('周期 3 文字の連続 → removed が 0', () => {
    const text = repeated('abc', 20);
    expect(text).toHaveLength(60);
    const scrubbed = scrubThinking(text);
    expect(scrubbed.removed).toBe(0);
    expect(scrubbed.text).toBe(text);
  });

  it('周期 4 文字の連続 → removed が 1', () => {
    const text = repeated('abcd', 15);
    expect(text).toHaveLength(60);
    expect(scrubThinking(text).removed).toBe(1);
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

  it('結果にもう一度かける → removed が 0、本文が同一', () => {
    const text = `foo${repeated(unit(), 12)}bar`;
    const first = scrubThinking(text);
    expect(first.removed).toBe(1);
    const second = scrubThinking(first.text);
    expect(second.removed).toBe(0);
    expect(second.text).toBe(first.text);
  });
});
