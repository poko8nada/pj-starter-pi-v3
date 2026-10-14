import { describe, expect, it } from 'vitest';
import { parseArgs, planLines } from './cli.mjs';

describe('planLines', () => {
  it('空 → 消える物が無い旨の1行', () => {
    expect(planLines(['tests'], [])).toEqual(['no tests to remove']);
  });

  it('2件 → 見出しと2件の3行', () => {
    const lines = planLines(
      ['tests'],
      [
        { label: 'tests', at: 'a', path: '/a' },
        { label: 'tests', at: 'b', path: '/b' },
      ],
    );
    expect(lines).toEqual(['tests (2):', '  a', '  b']);
  });

  it('空の label は1行、並びは labels のまま', () => {
    const lines = planLines(
      ['harness', 'tests', 'cycles'],
      [{ label: 'tests', at: 'a', path: '/a' }],
    );
    expect(lines).toEqual(['no harness to remove', 'tests (1):', '  a', 'no cycles to remove']);
  });

  it('label ごとにまとめ、at を出す', () => {
    const lines = planLines(
      ['harness', 'tests'],
      [
        { label: 'tests', at: 'b', path: '/b' },
        { label: 'harness', at: 'a', path: '/a' },
      ],
    );
    expect(lines).toEqual(['harness (1):', '  a', 'tests (1):', '  b']);
  });
});

describe('parseArgs', () => {
  it('無し → カレントと表示だけ', () => {
    expect(parseArgs([])).toEqual({ root: process.cwd(), run: false, only: undefined });
  });

  it('--run と --root を読む', () => {
    expect(parseArgs(['--run', '--root', '/x'])).toEqual({
      root: '/x',
      run: true,
      only: undefined,
    });
  });

  it('--root の値が無い → 投げる', () => {
    expect(() => parseArgs(['--root'])).toThrow();
  });

  it('--root=/x の形も読む', () => {
    expect(parseArgs(['--root=/x'])).toEqual({ root: '/x', run: false, only: undefined });
  });

  it('未知の引数 → 投げる', () => {
    expect(() => parseArgs(['--bogus'])).toThrow();
  });

  it('--only tests を読む', () => {
    expect(parseArgs(['--only', 'tests'])).toEqual({
      root: process.cwd(),
      run: false,
      only: 'tests',
    });
  });

  it('--only=tests の形も読む', () => {
    expect(parseArgs(['--only=tests'])).toEqual({
      root: process.cwd(),
      run: false,
      only: 'tests',
    });
  });

  it('--only の値が無い → 投げる', () => {
    expect(() => parseArgs(['--only'])).toThrow();
    expect(() => parseArgs(['--only='])).toThrow();
  });
});
