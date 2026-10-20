import { describe, expect, it } from 'vitest';
import { DEFAULT_MAX_BYTES, DEFAULT_MAX_LINES } from '@earendil-works/pi-coding-agent';
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

  it('失敗が複数 → `, ` でつなぐ', () => {
    const text = buildGateMessage(
      report({
        outcomes: [
          { label: 'lint', failed: true, output: 'a' },
          { label: 'format', failed: true, output: 'b' },
          { label: 'typecheck', failed: false, output: '' },
        ],
      }),
    );
    expect(text).toContain('lint, format');
    expect(text).not.toContain('typecheck, ');
  });

  it('成功したチェックは出力を付けない（見出しだけ）', () => {
    const text = buildGateMessage(
      report({
        outcomes: [
          { label: 'lint', failed: false, output: '' },
          { label: 'typecheck', failed: true, output: 'boom' },
        ],
      }),
    );
    // ok のセクションは 3 連バッククォートを伴わない
    expect(text).toContain('### lint: ok');
    expect(text).not.toContain('### lint: ok\n```');
    expect(text).toContain('### typecheck: FAILED\n```');
  });

  it('出力が空なら `(no output)` と出す', () => {
    const text = buildGateMessage(
      report({ outcomes: [{ label: 'lint', failed: true, output: '  ' }] }),
    );
    expect(text).toContain('(no output)');
  });

  it('触ったファイルが無ければ「(none)」と出す', () => {
    const text = buildGateMessage(report({ relativePaths: [], skippedPaths: [] }));
    expect(text).toContain('Files touched in this turn: (none)');
  });

  it('触ったファイルがあれば `(none)` は出さない', () => {
    const text = buildGateMessage(report({ relativePaths: ['a.ts'], skippedPaths: [] }));
    expect(text).toContain('Files touched in this turn:');
    expect(text).not.toContain('(none)');
  });

  it('長すぎる出力は切り詰めて、落とした行数を告げる', () => {
    // 既定の上限を超える行数を作る（truncateHead と同じ上限を共有する）
    const output = Array.from(
      { length: DEFAULT_MAX_LINES + 10 },
      (_, index) => `line ${index}`,
    ).join('\n');
    const text = buildGateMessage(report({ outcomes: [{ label: 'lint', failed: true, output }] }));
    expect(text).toContain('[output truncated:');
    expect(text).toContain('more line(s) omitted]');
    expect(text).toContain('line 0');
  });

  it('既定の上限以内の出力はそのまま出す（切り詰めの記号を付けない）', () => {
    const output = Array.from(
      { length: DEFAULT_MAX_LINES - 1 },
      (_, index) => `line ${index}`,
    ).join('\n');
    const text = buildGateMessage(report({ outcomes: [{ label: 'lint', failed: true, output }] }));
    expect(text).not.toContain('[output truncated:');
    expect(text).toContain(`line ${DEFAULT_MAX_LINES - 2}`);
  });

  it('既定のバイト上限を超える出力も落とした行数を告げる', () => {
    // 1 行で既定のバイト上限を超える（行数ではなく大きさで落ちる）
    const output = 'x'.repeat(DEFAULT_MAX_BYTES + 1000);
    const text = buildGateMessage(report({ outcomes: [{ label: 'lint', failed: true, output }] }));
    expect(text).toContain('[output truncated:');
    expect(text).toContain('more line(s) omitted]');
  });

  it('最後の試行では代替の文面を出す（もう一度走る、とは言わない）', () => {
    const text = buildGateMessage(report({ attempt: 3, maxAttempts: 3, isFinalAttempt: true }));
    expect(text).toContain('This is the last automatic retry');
    expect(text).not.toContain('runs again automatically');
  });

  it('最後でなければ「次のターンの後にまた走る」と出す', () => {
    const text = buildGateMessage(report({ attempt: 1, maxAttempts: 3, isFinalAttempt: false }));
    expect(text).toContain('runs again automatically');
    expect(text).not.toContain('last automatic retry');
  });

  it('検査を弱める・ファイルを消して通すことを禁じる文面を入れる', () => {
    const text = buildGateMessage(report());
    expect(text).toContain('Do not weaken, disable, or reconfigure the checks');
    expect(text).toContain('Do not delete the offending file');
  });

  it('check の 3 層は見出し→触ったファイル→本体→指示の順に並ぶ', () => {
    const text = buildGateMessage(report());
    const header = text.indexOf('[quality-gate]');
    const touched = text.indexOf('Files touched in this turn:');
    const body = text.indexOf('### lint:');
    const steps = text.indexOf('Fix the problems reported above.');
    expect(header).toBeLessThan(touched);
    expect(touched).toBeLessThan(body);
    expect(body).toBeLessThan(steps);
  });
});
