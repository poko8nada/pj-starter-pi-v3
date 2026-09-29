import { describe, expect, it } from 'vitest';
import { reportBlock, result, usageLine, type ChildReport } from './render.ts';

// 親に届く形（本文と塊）を試す。子を走らせないので、イベントと結果を自分で作る。

describe('result', () => {
  it('本文と詳細を持つ。詳細は必ず入る（省略できない型なので）', () => {
    const out = result('hello');
    expect(out.content).toEqual([{ type: 'text', text: 'hello' }]);
    expect(out.details).toEqual({});
  });
});

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
  const base: ChildReport = {
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

  it('worktree の子はその id を場所に出す', () => {
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
