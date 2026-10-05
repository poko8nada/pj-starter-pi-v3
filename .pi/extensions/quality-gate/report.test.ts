import { describe, expect, it } from 'vitest';
import { buildGateMessage, type GateFailureReport } from './report.ts';
import { filterByExtensions } from './targets.ts';

// ゲートの文面と、検査対象の絞り込み。どちらも純関数なので、道具を走らせずに試せる。

function report(overrides: Partial<GateFailureReport> = {}): GateFailureReport {
  return {
    outcomes: [{ label: 'lint', failed: true, output: 'boom' }],
    attempt: 1,
    maxAttempts: 3,
    relativePaths: ['a.ts'],
    skippedPaths: [],
    isFinalAttempt: false,
    ...overrides,
  };
}

describe('filterByExtensions', () => {
  it('format は md と json を通し、lint は ts 系だけ通す', () => {
    const paths = ['a.ts', 'b.md', 'c.json', 'd.png'];
    expect(filterByExtensions(paths, 'format')).toEqual(['a.ts', 'b.md', 'c.json']);
    expect(filterByExtensions(paths, 'lint')).toEqual(['a.ts']);
  });

  it('大文字の拡張子も通す', () => {
    expect(filterByExtensions(['A.TS'], 'lint')).toEqual(['A.TS']);
  });
});

describe('buildGateMessage', () => {
  it('失敗したチェック名と試行回数を出す', () => {
    const text = buildGateMessage(report());
    expect(text).toContain('lint');
    expect(text).toContain('attempt 1/3');
  });

  it('失敗していないチェックは名前に出さない', () => {
    const text = buildGateMessage(
      report({
        outcomes: [
          { label: 'lint', failed: false, output: '' },
          { label: 'typecheck', failed: true, output: 'boom' },
        ],
      }),
    );
    expect(text).toContain('typecheck');
    expect(text).not.toContain('These checks still fail: lint');
  });

  it('最後の試行では final と出す', () => {
    const text = buildGateMessage(report({ attempt: 3, isFinalAttempt: true }));
    expect(text).toContain('Final attempt (3/3)');
  });

  it('検査から外れたファイルを出す', () => {
    const text = buildGateMessage(report({ skippedPaths: ['gone.ts'] }));
    expect(text).toContain('gone.ts');
  });
});
