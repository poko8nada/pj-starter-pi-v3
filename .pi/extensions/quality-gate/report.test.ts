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

/** 見出しは 1 行目だけを取り出して比べる */
function firstLine(text: string): string {
  return text.split('\n')[0] ?? '';
}

describe('buildGateMessage', () => {
  it('失敗したチェックの label と試行回数が 1 行目に出る', () => {
    const label = 'lint-fail';
    const output = 'boom';
    const attempt = 1;
    const maxAttempts = 3;
    const text = buildGateMessage(
      report({ outcomes: [{ label, failed: true, output }], attempt, maxAttempts }),
    );
    const head = firstLine(text);
    expect(head).toContain(label);
    expect(head).toContain(`${attempt}/${maxAttempts}`);
  });

  it('失敗が複数 → 1 行目にその label が全部並ぶ', () => {
    const first = 'lint-fail';
    const second = 'format-fail';
    const passed = 'typecheck-pass';
    const text = buildGateMessage(
      report({
        outcomes: [
          { label: first, failed: true, output: 'a' },
          { label: second, failed: true, output: 'b' },
          { label: passed, failed: false, output: '' },
        ],
      }),
    );
    const head = firstLine(text);
    expect(head).toContain(first);
    expect(head).toContain(second);
  });

  it('成功したチェックの label は 1 行目に出ない', () => {
    const passed = 'lint-pass';
    const failed = 'typecheck-fail';
    const text = buildGateMessage(
      report({
        outcomes: [
          { label: passed, failed: false, output: '' },
          { label: failed, failed: true, output: 'boom' },
        ],
      }),
    );
    const head = firstLine(text);
    expect(head).toContain(failed);
    expect(head).not.toContain(passed);
  });

  it('成功したチェックは空でない output を渡してもその節に output は出ない', () => {
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

  it('失敗したチェックの節にその output が出る', () => {
    const label = 'lint-fail';
    const output = 'visible-boom';
    const text = buildGateMessage(report({ outcomes: [{ label, failed: true, output }] }));
    expect(text).toContain(output);
  });

  it('検査から外れた skippedPaths のパスが出る', () => {
    const skipped = 'gone.ts';
    const touched = 'a.ts';
    const text = buildGateMessage(report({ relativePaths: [touched], skippedPaths: [skipped] }));
    expect(text).toContain(skipped);
  });

  it('出力が空の失敗 → 空である旨の印が出る', () => {
    const label = 'lint-fail';
    const output = '  ';
    const text = buildGateMessage(report({ outcomes: [{ label, failed: true, output }] }));
    expect(text).toContain('(no output)');
  });

  it('触ったファイルが無ければ「(none)」と出す', () => {
    const text = buildGateMessage(report({ relativePaths: [], skippedPaths: [] }));
    expect(text).toContain('Files touched in this turn: (none)');
  });

  it('触ったファイルがあれば `(none)` は出さない', () => {
    const touched = 'touched-a.ts';
    const text = buildGateMessage(report({ relativePaths: [touched], skippedPaths: [] }));
    expect(text).toContain(touched);
    expect(text).toContain('Files touched in this turn:');
    expect(text).not.toContain('(none)');
  });

  it('上限を超える出力は切り詰めて落とした行数を告げる', () => {
    const label = 'lint-fail';
    // 行数で上限を超える（truncateHead と同じ上限を共有する）
    const lineOutput = Array.from(
      { length: DEFAULT_MAX_LINES + 10 },
      (_, index) => `line ${index}`,
    ).join('\n');
    const lineText = buildGateMessage(
      report({ outcomes: [{ label, failed: true, output: lineOutput }] }),
    );
    expect(lineText).toContain('[output truncated:');
    expect(lineText).toContain('more line(s) omitted]');

    // 1 行でバイト数の上限を超える（行数ではなく大きさで落ちる）
    const byteOutput = 'x'.repeat(DEFAULT_MAX_BYTES + 1000);
    const byteText = buildGateMessage(
      report({ outcomes: [{ label, failed: true, output: byteOutput }] }),
    );
    expect(byteText).toContain('[output truncated:');
    expect(byteText).toContain('more line(s) omitted]');
  });

  it('上限以内の出力はそのまま出す（切り詰めの記号を付けない）', () => {
    const label = 'lint-fail';
    const lines = Array.from({ length: DEFAULT_MAX_LINES - 1 }, (_, index) => `line ${index}`);
    const output = lines.join('\n');
    const text = buildGateMessage(report({ outcomes: [{ label, failed: true, output }] }));
    expect(text).not.toContain('[output truncated:');
    const last = lines[lines.length - 1] ?? '';
    expect(text).toContain(last);
  });

  it('check の 3 層は見出し→触ったファイル→本体→指示の順に並ぶ', () => {
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
