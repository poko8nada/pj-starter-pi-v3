import { describe, expect, it } from 'vitest';
import { parseArgs, planLines } from './cli.mjs';

describe('planLines', () => {
  it('空 → 消える物が無い旨の1行', () => {
    expect(planLines('tests', [])).toEqual(['no tests to remove']);
  });

  it('2件 → 見出しと2件の3行', () => {
    const lines = planLines('tests', ['a', 'b']);
    expect(lines).toHaveLength(3);
    expect(lines[0]).toContain('tests');
    expect(lines[1]).toContain('a');
    expect(lines[2]).toContain('b');
  });
});

describe('parseArgs', () => {
  it('無し → カレントと表示だけ', () => {
    expect(parseArgs([])).toEqual({ root: process.cwd(), run: false });
  });

  it('--run と --root を読む', () => {
    expect(parseArgs(['--run', '--root', '/x'])).toEqual({ root: '/x', run: true });
  });

  it('--root の値が無い → 投げる', () => {
    expect(() => parseArgs(['--root'])).toThrow();
  });

  it('--root=/x の形も読む', () => {
    expect(parseArgs(['--root=/x'])).toEqual({ root: '/x', run: false });
  });

  it('未知の引数 → 投げる', () => {
    expect(() => parseArgs(['--bogus'])).toThrow();
  });
});
