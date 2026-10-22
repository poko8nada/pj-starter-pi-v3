import { describe, expect, it } from 'vitest';
import type { Candidate } from './collect.ts';
import {
  batches,
  classifierTokens,
  judgeRequest,
  questionTokens,
  topicView,
  verdicts,
  type JudgeAnswers,
} from './judge.ts';

function candidate(id: string, excerpt = 'excerpt'): Candidate {
  return { id, toolName: 'read', args: `read({"path":"${id}.txt"})`, chars: 10, excerpt };
}

function answersOf(probabilities: Readonly<Record<string, number>>): JudgeAnswers {
  const answers: Record<string, { type: string; probabilities: Readonly<Record<string, number>> }> =
    {};
  for (const [key, probability] of Object.entries(probabilities)) {
    answers[key] = { type: 'choice', probabilities: { keep: probability } };
  }
  return answers;
}

function many(count: number, excerpt = 'x'.repeat(1000)): Candidate[] {
  const out: Candidate[] = [];
  for (let index = 0; index < count; index += 1) {
    out.push({ id: `c${index}`, toolName: 'read', args: '', chars: 1000, excerpt });
  }
  return out;
}

describe('judgeRequest', () => {
  it('候補 2 件 → questions の鍵が keep_a と keep_b、state は summary だけ', () => {
    const request = judgeRequest('話題の要約', [candidate('a'), candidate('b')]);
    expect(Object.keys(request.questions).toSorted()).toEqual(['keep_a', 'keep_b']);
    expect(request.state['summary']).toBe('話題の要約');
    expect(request.state).not.toHaveProperty('candidates');
    expect(Object.keys(request.state).toSorted()).toEqual(['summary']);
  });

  it('keep_a の criteria が keep と drop を持ち、instructions に need と候補の行が入る', () => {
    const request = judgeRequest('話題の要約', [candidate('a')]);
    const question = request.questions['keep_a'];
    expect(question?.criteria).toEqual({
      keep: expect.any(String),
      drop: expect.any(String),
    });
    expect(question?.instructions).toContain('need');
    expect(question?.instructions).toContain('tool: read');
    expect(question?.instructions).toContain('args:');
    expect(question?.instructions).toContain('chars:');
    expect(question?.instructions).toContain('result:');
    expect(question?.instructions.length).toBeGreaterThan(0);
  });

  it('質問の instructions と criteria に日本語が含まれない', () => {
    const request = judgeRequest('summary', [candidate('a')]);
    const japanese = /[぀-ヿ一-鿿]/;
    for (const question of Object.values(request.questions)) {
      expect(question.instructions).not.toMatch(japanese);
      for (const value of Object.values(question.criteria)) {
        expect(value).not.toMatch(japanese);
      }
    }
  });

  it('要約の view を state に入れ、候補の抜粋は質問文に付ける', () => {
    const summary = ['## Goal', 'do thing', '', '## Constraints & Preferences', '- none'].join(
      '\n',
    );
    const request = judgeRequest(summary, [candidate('a', 'abc')]);
    expect(request.state['summary']).toBe('## Goal\ndo thing');
    expect(request.state).not.toHaveProperty('candidates');
    const question = request.questions['keep_a'];
    expect(question?.instructions).toContain('tool: read');
    expect(question?.instructions).toContain('args: read({"path":"a.txt"})');
    expect(question?.instructions).toContain('chars: 10');
    expect(question?.instructions).toContain('result:');
    expect(question?.instructions).toContain('abc');
  });

  it('候補 0 件 → questions が空で、state は summary だけ', () => {
    const request = judgeRequest('話題の要約', []);
    expect(request.questions).toEqual({});
    expect(request.state).toEqual({ summary: '話題の要約' });
  });
});

describe('questionTokens', () => {
  it('抜粋 1000 文字は 500 文字より大きい', () => {
    const small = questionTokens(candidate('a', 'x'.repeat(500)));
    const large = questionTokens(candidate('a', 'x'.repeat(1000)));
    expect(large).toBeGreaterThan(small);
  });
});

describe('topicView', () => {
  it('6 節 → Goal と Progress と Next Steps だけ残す', () => {
    const summary = [
      '## Goal',
      'goal body',
      '',
      '## Constraints & Preferences',
      '- none',
      '',
      '## Progress',
      'progress body',
      '',
      '## Key Decisions',
      '- decided',
      '',
      '## Next Steps',
      '1. next',
      '',
      '## Critical Context',
      '- ctx',
    ].join('\n');
    const view = topicView(summary);
    expect(view).toContain('goal body');
    expect(view).toContain('progress body');
    expect(view).toContain('1. next');
    expect(view).not.toContain('decided');
    expect(view).not.toContain('- ctx');
    expect(view).not.toContain('Constraints');
  });

  it('見出し無し → 全文', () => {
    expect(topicView('plain text')).toBe('plain text');
  });

  it('見出しはあるが Goal / Progress / Next Steps が無い → 全文', () => {
    const summary = [
      '## Constraints & Preferences',
      '- none',
      '',
      '## Key Decisions',
      '- decided',
    ].join('\n');
    expect(topicView(summary)).toBe(summary);
  });
});

describe('classifierTokens', () => {
  it("'a' 25 文字 → 10", () => {
    expect(classifierTokens('a'.repeat(25))).toBe(10);
  });

  it('空 → 0', () => {
    expect(classifierTokens('')).toBe(0);
  });
});

describe('verdicts', () => {
  it('probabilities の keep を読む（keep: 0.8 → keep 真）', () => {
    const answers: JudgeAnswers = {
      keep_a: { type: 'choice', probabilities: { keep: 0.8 } },
    };
    const result = verdicts([candidate('a')], answers, 0.5);
    expect(result).toEqual([{ id: 'a', keep: true, keepProbability: 0.8 }]);
  });

  it('keep が 0.8 と 0.2、threshold 0.5 → keep が真と偽', () => {
    const result = verdicts(
      [candidate('a'), candidate('b')],
      answersOf({ keep_a: 0.8, keep_b: 0.2 }),
      0.5,
    );
    expect(result).toEqual([
      { id: 'a', keep: true, keepProbability: 0.8 },
      { id: 'b', keep: false, keepProbability: 0.2 },
    ]);
  });

  it('keep がちょうど 0.5 → keep 真（未満だけ落とす）、0.49 → keep 偽', () => {
    const even = verdicts([candidate('a')], answersOf({ keep_a: 0.5 }), 0.5);
    expect(even[0]?.keep).toBe(true);
    const below = verdicts([candidate('a')], answersOf({ keep_a: 0.49 }), 0.5);
    expect(below[0]?.keep).toBe(false);
  });

  it('答えが無い候補 → keep 真、keepProbability 0', () => {
    const result = verdicts([candidate('a')], {}, 0.5);
    expect(result).toEqual([{ id: 'a', keep: true, keepProbability: 0 }]);
  });
});

describe('batches', () => {
  it('view 1000 文字・抜粋 1000 文字の候補 100 件 → 32000 の予算で 2 束以上', () => {
    // view 1000 文字ぶんの fixed 400 に対し、質問 1 件 ~473 で 100 件は ~47300 になる。
    const result = batches(many(100), { total: 32000, fixed: 400 });
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result.flat()).toHaveLength(100);
  });

  it('候補 1 件が予算を超える → その 1 件だけの束になる', () => {
    const result = batches(many(1), { total: 10, fixed: 9 });
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveLength(1);
  });

  it('予算が 1 件分より小さい → 1 件だけの束になる', () => {
    const result = batches(many(2), { total: 10, fixed: 9 });
    expect(result[0]).toHaveLength(1);
    expect(result.flat()).toHaveLength(2);
  });

  it('空 → 空', () => {
    expect(batches([], { total: 32000, fixed: 100 })).toEqual([]);
  });
});
