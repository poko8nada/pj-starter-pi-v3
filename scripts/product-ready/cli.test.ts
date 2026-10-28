import { describe, expect, it } from 'vitest';
import {
  ONLY_FLAG,
  RUN_FLAG,
  configLine,
  countLine,
  indented,
  onlyEquals,
  scriptsLine,
} from '../../test/scripts.fixture.ts';
import { parseArgs, planLines, switchLines } from './cli.mjs';

function makeScriptNames(): readonly string[] {
  return ['test', 'test:run'];
}

describe('switchLines', () => {
  it('config あり・scripts 2件 → 2行', () => {
    const configAt = 'vitest.starter.config.ts';
    const scripts = makeScriptNames();
    expect(switchLines({ config: true, scripts: [...scripts] })).toEqual([
      configLine(configAt),
      scriptsLine(scripts),
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
    expect(planLines([{ label, verb: 'remove' }], [])).toEqual([`no ${label} to remove`]);
  });

  it('無い label → 表示だけ', () => {
    const missing = 'no-such-label';
    expect(planLines([{ label: missing, verb: 'replace' }], [])).toEqual([
      `no ${missing} to replace`,
    ]);
  });

  it('2件 → 見出しと2件の3行', () => {
    const label = 'tests';
    const ats = ['a', 'b'];
    const entries = ats.map((at) => ({ label, at, path: `/${at}` }));
    expect(planLines([{ label, verb: 'remove' }], entries)).toEqual([
      countLine(label, entries.length),
      ...entries.map((entry) => indented(entry.at)),
    ]);
  });

  it('空の label は1行、並びは labels のまま', () => {
    const ordered = ['harness', 'tests', 'cycles'];
    const label = 'tests';
    const at = 'a';
    const entries = [{ label, at, path: `/${at}` }];
    const lines = planLines(
      ordered.map((name) => ({ label: name, verb: 'remove' as const })),
      entries,
    );
    const expected: readonly string[] = [
      `no ${ordered[0]} to remove`,
      countLine(label, entries.length),
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
    const entries = [
      { label: second, at: secondAt, path: `/${secondAt}` },
      { label: first, at: firstAt, path: `/${firstAt}` },
    ];
    const lines = planLines(
      [
        { label: first, verb: 'remove' },
        { label: second, verb: 'remove' },
      ],
      entries,
    );
    expect(lines).toEqual([
      countLine(first, entries.filter((entry) => entry.label === first).length),
      indented(firstAt),
      countLine(second, entries.filter((entry) => entry.label === second).length),
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
