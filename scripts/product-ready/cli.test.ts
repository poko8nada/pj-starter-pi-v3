import { describe, expect, it } from 'vitest';
import {
  ONLY_FLAG,
  RUN_FLAG,
  countLine,
  indented,
  onlyEquals,
} from '../../test/scripts-fixture.ts';
import { parseArgs, planLines, switchLines } from './cli.mjs';

function makeScriptNames(): readonly string[] {
  return ['test', 'test:run'];
}

describe('switchLines', () => {
  it('config あり・scripts 2件 → 2行', () => {
    const scripts = makeScriptNames();
    expect(switchLines({ config: true, scripts: [...scripts] })).toEqual([
      'config: vitest.starter.config.ts',
      `scripts: ${scripts.join(', ')}`,
    ]);
  });

  it('空 → 消す物が無い旨の2行', () => {
    expect(switchLines({ config: false, scripts: [] })).toEqual([
      'no config to remove',
      'no scripts to change',
    ]);
  });
});

describe('planLines', () => {
  it('空 → 消える物が無い旨の1行', () => {
    const label = 'tests';
    expect(planLines([label], [])).toEqual([`no ${label} to remove`]);
  });

  it('無い label → 表示だけ', () => {
    const missing = 'no-such-label';
    expect(planLines([missing], [])).toEqual([`no ${missing} to remove`]);
  });

  it('2件 → 見出しと2件の3行', () => {
    const label = 'tests';
    const ats = ['a', 'b'];
    const entries = ats.map((at) => ({ label, at, path: `/${at}` }));
    expect(planLines([label], entries)).toEqual([
      countLine(label, entries.length),
      ...entries.map((entry) => indented(entry.at)),
    ]);
  });

  it('空の label は1行、並びは labels のまま', () => {
    const ordered = ['harness', 'tests', 'cycles'];
    const label = 'tests';
    const at = 'a';
    const lines = planLines(ordered, [{ label, at, path: `/${at}` }]);
    const expected: readonly string[] = [
      `no ${ordered[0]} to remove`,
      countLine(label, 1),
      indented(at),
      `no ${ordered[2]} to remove`,
    ];
    expect(lines).toEqual([...expected]);
  });

  it('label ごとにまとめ、at を出す', () => {
    const first = 'harness';
    const second = 'tests';
    const firstAt = 'a';
    const secondAt = 'b';
    const lines = planLines(
      [first, second],
      [
        { label: second, at: secondAt, path: `/${secondAt}` },
        { label: first, at: firstAt, path: `/${firstAt}` },
      ],
    );
    expect(lines).toEqual([
      countLine(first, 1),
      indented(firstAt),
      countLine(second, 1),
      indented(secondAt),
    ]);
  });
});

describe('parseArgs', () => {
  it('無し → 表示だけ', () => {
    expect(parseArgs([])).toEqual({ run: false, only: undefined });
  });

  it('旗あり → 実行する', () => {
    expect(parseArgs([RUN_FLAG])).toEqual({
      run: true,
      only: undefined,
    });
  });

  it('未知の引数 → 投げる', () => {
    expect(() => parseArgs(['--bogus'])).toThrow();
  });

  it('旗と値の2語を読む', () => {
    const only = 'tests';
    expect(parseArgs([ONLY_FLAG, only])).toEqual({
      run: false,
      only,
    });
  });

  it('等号つきの1語も読む', () => {
    const only = 'tests';
    expect(parseArgs([onlyEquals(only)])).toEqual({
      run: false,
      only,
    });
  });

  it('値が無い → 投げる', () => {
    expect(() => parseArgs([ONLY_FLAG])).toThrow();
    expect(() => parseArgs([onlyEquals('')])).toThrow();
  });
});
