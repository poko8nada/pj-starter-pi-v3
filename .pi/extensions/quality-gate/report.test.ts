import { describe, expect, it } from 'vitest';
import { DEFAULT_MAX_BYTES, DEFAULT_MAX_LINES } from '@earendil-works/pi-coding-agent';
import { buildGateMessage, type GateFailureReport } from './report.ts';

// ゲートの文面だけを試す。対象の絞り込みは `targets.test.ts` で試す。
// 期待する値は、渡した `outcomes` の `label` と `output`、
// `relativePaths` と `skippedPaths`、`attempt` と `maxAttempts` から取る。

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

/** 見出しは 1 行目だけを取り出して比べる。 */
function firstLine(text: string): string {
  return text.split('\n')[0] ?? '';
}

describe('buildGateMessage', () => {
  it('失敗したチェックの label と試行回数だけが 1 行目に出る', () => {
    const first = 'lint-fail';
    const second = 'format-fail';
    const passed = 'typecheck-pass';
    const attempt = 1;
    const maxAttempts = 3;
    const text = buildGateMessage(
      report({
        outcomes: [
          { label: first, failed: true, output: 'a' },
          { label: second, failed: true, output: 'b' },
          { label: passed, failed: false, output: '' },
        ],
        attempt,
        maxAttempts,
      }),
    );
    const head = firstLine(text);
    expect(head).toContain(first);
    expect(head).toContain(second);
    expect(head).toContain(`${attempt}/${maxAttempts}`);
    expect(head).not.toContain(passed);
  });

  it('失敗したチェックの節にだけ output が出る', () => {
    const passed = 'lint-pass';
    const failed = 'typecheck-fail';
    const hidden = 'should-be-hidden';
    const shown = 'boom';
    const text = buildGateMessage(
      report({
        outcomes: [
          { label: passed, failed: false, output: hidden },
          { label: failed, failed: true, output: shown },
        ],
      }),
    );
    expect(text).not.toContain(hidden);
    expect(text).toContain(shown);
  });

  it('検査から外れた skippedPaths のパスが出る', () => {
    const skipped = 'gone.ts';
    const touched = 'a.ts';
    const text = buildGateMessage(report({ relativePaths: [touched], skippedPaths: [skipped] }));
    expect(text).toContain(skipped);
  });

  it('出力が空の失敗は空である旨の印が出る', () => {
    const label = 'lint-fail';
    const output = '  ';
    const text = buildGateMessage(report({ outcomes: [{ label, failed: true, output }] }));
    expect(text).toContain('(no output)');
  });

  it('変更したファイルの有無で (none) を出すか決める', () => {
    const empty = buildGateMessage(report({ relativePaths: [], skippedPaths: [] }));
    expect(empty).toContain('Files touched in this turn: (none)');
    const touched = 'touched-a.ts';
    const filled = buildGateMessage(report({ relativePaths: [touched], skippedPaths: [] }));
    expect(filled).toContain(touched);
    expect(filled).toContain('Files touched in this turn:');
    expect(filled).not.toContain('(none)');
  });

  it('上限を超えるときだけ切り詰めて、除外した行数を告げる', () => {
    const label = 'lint-fail';
    // 行数で上限を超える（truncateHead と同じ上限を共有する）。
    const lineOutput = Array.from(
      { length: DEFAULT_MAX_LINES + 10 },
      (_, index) => `line ${index}`,
    ).join('\n');
    const lineText = buildGateMessage(
      report({ outcomes: [{ label, failed: true, output: lineOutput }] }),
    );
    expect(lineText).toContain('[output truncated:');
    expect(lineText).toContain('more line(s) omitted]');

    // 1 行でバイト数の上限を超える（行数ではなく大きさで上限を超える）。
    const byteOutput = 'x'.repeat(DEFAULT_MAX_BYTES + 1000);
    const byteText = buildGateMessage(
      report({ outcomes: [{ label, failed: true, output: byteOutput }] }),
    );
    expect(byteText).toContain('[output truncated:');
    expect(byteText).toContain('more line(s) omitted]');

    const lines = Array.from({ length: DEFAULT_MAX_LINES - 1 }, (_, index) => `line ${index}`);
    const output = lines.join('\n');
    const text = buildGateMessage(report({ outcomes: [{ label, failed: true, output }] }));
    expect(text).not.toContain('[output truncated:');
    const last = lines[lines.length - 1] ?? '';
    expect(text).toContain(last);
  });

  it('チェックの 3 層は見出しと変更したファイルと本体と指示の順に並ぶ', () => {
    const label = 'lint-fail';
    const touched = 'touched-a.ts';
    const text = buildGateMessage(
      report({ outcomes: [{ label, failed: true, output: 'boom' }], relativePaths: [touched] }),
    );
    const header = text.indexOf('[quality-gate]');
    const touchedAt = text.indexOf('Files touched in this turn:');
    const body = text.indexOf(`### ${label}:`);
    const steps = text.indexOf('Fix the problems reported above.');
    expect(header).toBeLessThan(touchedAt);
    expect(touchedAt).toBeLessThan(body);
    expect(body).toBeLessThan(steps);
  });
});
