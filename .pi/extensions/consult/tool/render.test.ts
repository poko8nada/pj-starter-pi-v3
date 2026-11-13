import { describe, expect, it } from 'vitest';
import { compose, reportBlock, usageLine, type SubagentReport } from './render.ts';
import type { RunResult } from '../run/run.ts';

// メインエージェントに届く形（本文と塊）を試す。サブエージェントを走らせないので、イベントと結果を自分で作る。
describe('usageLine', () => {
  it('モデルが分からなければ unknown と出す（空にしない）', () => {
    expect(usageLine([])).toContain('(model unknown)');
  });

  it('回数と入出力を 1 行にする', () => {
    const model = 'x/y';
    const input = 10;
    const output = 20;
    const event = JSON.stringify({
      type: 'message_end',
      message: { role: 'assistant', model, usage: { input, output, turns: 3 } },
    });
    const line = usageLine([JSON.parse(event)]);
    expect(line).toContain(model);
    expect(line).toContain(`in ${input} out ${output}`);
  });
});

describe('reportBlock', () => {
  const role = 'review';
  const base: SubagentReport = {
    role,
    state: 'done',
    files: [],
    turns: 12,
    turnsLimit: 40,
    spend: '0.0123 usd',
  };

  it('id を出し、なければ consult とだけ書く（undefined と書かない）', () => {
    const id = 'consult-7';
    expect(reportBlock({ ...base, id })).toContain(`## ${id} — ${role} / done`);
    const noId = reportBlock(base);
    expect(noId).toContain(`## consult — ${role} / done`);
    expect(noId).not.toContain('undefined');
  });

  it('素性・場所・回数・量・触ったものを出す', () => {
    const block = reportBlock(base);
    expect(block).toContain(`${role} / done`);
    expect(block).toContain('place: base');
    expect(block).toContain(`turns: ${base.turns} / ${base.turnsLimit}`);
    expect(block).toContain(`spend: ${base.spend}`);
    expect(block).toContain('files: (none)');
  });

  it('worktree のサブエージェントはその id を場所に出す', () => {
    const worktree = '2-a';
    expect(reportBlock({ ...base, worktree })).toContain(`place: worktree ${worktree}`);
  });

  it('触ったファイルを並べる', () => {
    const files = ['a.ts', 'b.ts'];
    expect(reportBlock({ ...base, files })).toContain(`files: ${files.join(', ')}`);
  });

  it('done でなければ理由の行を出す。done なら出さない', () => {
    const reason = 'turn limit reached (40)';
    const stopped = reportBlock({ ...base, state: 'turn-limit', reason });
    expect(stopped).toContain(`reason: ${reason}`);
    expect(reportBlock(base)).not.toContain('reason:');
  });

  it('diff を運ばない（塊はパスと量だけ）', () => {
    const block = reportBlock({ ...base, files: ['a.ts'] });
    expect(block).not.toContain('+++');
    expect(block).not.toContain('@@');
  });
});

describe('usageLine: cost', () => {
  it('cost があれば末尾に $ で出す', () => {
    const total = 0.001;
    const event = JSON.stringify({
      type: 'message_end',
      message: {
        role: 'assistant',
        model: 'x/y',
        usage: { input: 10, output: 20, turns: 3, cost: { total } },
      },
    });
    expect(usageLine([JSON.parse(event)])).toContain(`$${total.toFixed(4)}`);
  });
});

/** 本文のない実行結果。終了コードは 0 にする */
const EMPTY_RUN: RunResult = {
  stdout: '',
  stderr: '',
  code: 0,
  aborted: false,
  ended: true,
};

function messageEnd(overrides: Record<string, unknown> = {}) {
  return {
    type: 'message_end',
    message: {
      role: 'assistant',
      content: [],
      usage: { input: 1, output: 1 },
      ...overrides,
    },
  };
}

describe('compose', () => {
  it('本文が空で最後がエラー → その理由を出す', () => {
    const reason = 'rate limited';
    const events = [messageEnd({ stopReason: 'error', errorMessage: reason })];
    expect(compose(events, { ...EMPTY_RUN, stderr: 'boom' })).toContain(reason);
  });

  it('本文が空で前のエラーだけ → stderr を出す', () => {
    const stderr = 'boom';
    const events = [
      messageEnd({ stopReason: 'error', errorMessage: 'old failure' }),
      messageEnd({ stopReason: 'stop' }),
    ];
    expect(compose(events, { ...EMPTY_RUN, stderr })).toContain(stderr);
  });
});
