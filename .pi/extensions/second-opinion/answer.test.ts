import { describe, expect, it } from 'vitest';
import { DEFAULT_QUESTION, opinionTask } from './answer.ts';
import type { Window } from './conversation.ts';

// 既定の質問と `opinionTask` の組み立てだけを試す。子の起動は `index.test.ts` が扱う。

function windowOf(text: string): Window {
  return { text, dropped: 0 };
}

describe('DEFAULT_QUESTION', () => {
  it('矛盾・穴・別案を問う', () => {
    expect(DEFAULT_QUESTION).toContain('一貫性');
    expect(DEFAULT_QUESTION).toContain('穴');
    expect(DEFAULT_QUESTION).toContain('別案');
  });

  it('答えの形は5項目で、無い欄はなし', () => {
    for (const heading of ['Consistent', 'Holes', 'Alternative', 'Cannot judge', 'Read']) {
      expect(DEFAULT_QUESTION).toContain(heading);
    }
    expect(DEFAULT_QUESTION).toContain('なし');
  });
});

describe('opinionTask', () => {
  it('窓と focus から指示を組む', () => {
    const task = opinionTask(windowOf('owner: hi'), 'is this consistent?');
    expect(task).toContain('owner: hi');
    expect(task).toContain('is this consistent?');
    expect(task).not.toContain(DEFAULT_QUESTION);
  });

  it('focus が無ければ既定の質問', () => {
    const task = opinionTask(windowOf('owner: hi'), undefined);
    expect(task).toContain('owner: hi');
    expect(task).toContain(DEFAULT_QUESTION);
  });

  it('focus が空なら既定の質問', () => {
    const task = opinionTask(windowOf('owner: hi'), '   ');
    expect(task).toContain(DEFAULT_QUESTION);
  });

  it('窓が空なら既定の質問だけで走る', () => {
    expect(opinionTask(windowOf(''), undefined)).toBe(DEFAULT_QUESTION);
    expect(opinionTask(windowOf('  \n '), 'check this')).toBe('check this');
  });
});

describe('opinionTask: 窓の前置き', () => {
  it('窓があるときは、会話であることと上が古いことを添える', () => {
    const task = opinionTask(windowOf('owner: hi'), undefined);
    expect(task).toContain('以下は直近の会話である');
    expect(task).toContain('上が古い');
  });
});
