import { describe, expect, it } from 'vitest';
import { reportBlock, usageLine, type SubagentReport } from './render.ts';

// メインエージェントに届く形（本文と塊）を試す。サブエージェントを走らせないので、イベントと結果を自分で作る。
describe('usageLine', () => {
  it('モデルが分からなければ unknown と出す（空にしない）', () => {
    expect(usageLine([])).toContain('(model unknown)');
  });

  it('回数・入出力を 1 行にする', () => {
    const event =
      '{"type":"message_end","message":{"role":"assistant","model":"x/y","usage":{"input":10,"output":20,"turns":3}}}';
    const line = usageLine([JSON.parse(event)]);
    expect(line).toContain('x/y');
    expect(line).toContain('in 10 out 20');
  });
});

describe('reportBlock', () => {
  const base: SubagentReport = {
    role: 'review',
    state: 'done',
    files: [],
    turns: 12,
    turnsLimit: 40,
    spend: '0.0123 usd',
  };

  it('id を出し、無ければ consult とだけ書く（undefined と書かない）', () => {
    expect(reportBlock({ ...base, id: 'consult-7' })).toContain('## consult-7 — review / done');
    const noId = reportBlock(base);
    expect(noId).toContain('## consult — review / done');
    expect(noId).not.toContain('undefined');
  });

  it('素性・場所・回数・量・触った物を出す', () => {
    const block = reportBlock(base);
    expect(block).toContain('review / done');
    expect(block).toContain('place: parent tree');
    expect(block).toContain('turns: 12 / 40');
    expect(block).toContain('spend: 0.0123 usd');
    expect(block).toContain('files: (none)');
  });

  it('worktree のサブエージェントはその id を場所に出す', () => {
    expect(reportBlock({ ...base, worktree: '2-a' })).toContain('place: worktree 2-a');
  });

  it('触ったファイルを並べる', () => {
    expect(reportBlock({ ...base, files: ['a.ts', 'b.ts'] })).toContain('files: a.ts, b.ts');
  });

  it('done でなければ理由の行を出す。done なら出さない', () => {
    const stopped = reportBlock({
      ...base,
      state: 'turn-limit',
      reason: 'turn limit reached (40)',
    });
    expect(stopped).toContain('reason: turn limit reached (40)');
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
    const event =
      '{"type":"message_end","message":{"role":"assistant","model":"x/y","usage":{"input":10,"output":20,"turns":3,"cost":{"total":0.001}}}}';
    expect(usageLine([JSON.parse(event)])).toContain('$0.0010');
  });
});
