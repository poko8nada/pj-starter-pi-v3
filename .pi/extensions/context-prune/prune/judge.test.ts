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
  it('候補 2 件 → questions の鍵 2 件、state は summary だけ', () => {
    const summary = '話題の要約';
    const a = candidate('a');
    const b = candidate('b');
    const request = judgeRequest(summary, [a, b]);
    expect(Object.keys(request.questions).toSorted()).toEqual(
      [`keep_${a.id}`, `keep_${b.id}`].toSorted(),
    );
    expect(request.state['summary']).toBe(summary);
    expect(request.state).not.toHaveProperty('candidates');
    expect(Object.keys(request.state).toSorted()).toEqual(['summary']);
  });

  it('keep の criteria が keep と drop を持つ', () => {
    const a = candidate('a');
    const request = judgeRequest('話題の要約', [a]);
    const question = request.questions[`keep_${a.id}`];
    expect(question?.criteria).toEqual({
      keep: expect.any(String),
      drop: expect.any(String),
    });
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
    const goalBody = 'do thing';
    const excludedBody = '- none';
    const summary = ['## Goal', goalBody, '', '## Constraints & Preferences', excludedBody].join(
      '\n',
    );
    const excerpt = 'abc';
    const a = candidate('a', excerpt);
    const request = judgeRequest(summary, [a]);
    const stateSummary = request.state['summary'];
    expect(typeof stateSummary).toBe('string');
    if (typeof stateSummary !== 'string') {
      throw new Error('state summary must be a string');
    }
    expect(stateSummary).toContain(goalBody);
    expect(stateSummary).not.toContain(excludedBody);
    expect(request.state).not.toHaveProperty('candidates');
    const question = request.questions[`keep_${a.id}`];
    expect(question?.instructions).toContain(`tool: ${a.toolName}`);
    expect(question?.instructions).toContain(`args: ${a.args}`);
    expect(question?.instructions).toContain(`chars: ${String(a.chars)}`);
    expect(question?.instructions).toContain('result:');
    expect(question?.instructions).toContain(a.excerpt);
  });

  it('候補 0 件 → questions が空で、state は summary だけ', () => {
    const summary = '話題の要約';
    const request = judgeRequest(summary, []);
    expect(request.questions).toEqual({});
    expect(request.state).toEqual({ summary });
  });
});

describe('questionTokens', () => {
  it('抜粋が長いほど大きい', () => {
    const small = questionTokens(candidate('a', 'x'.repeat(500)));
    const large = questionTokens(candidate('a', 'x'.repeat(1000)));
    expect(large).toBeGreaterThan(small);
  });
});

describe('topicView', () => {
  it('Goal と Progress と Next Steps だけ残す', () => {
    const goalBody = 'goal body';
    const progressBody = 'progress body';
    const nextBody = '1. next';
    const decidedBody = '- decided';
    const ctxBody = '- ctx';
    const summary = [
      '## Goal',
      goalBody,
      '',
      '## Constraints & Preferences',
      '- none',
      '',
      '## Progress',
      progressBody,
      '',
      '## Key Decisions',
      decidedBody,
      '',
      '## Next Steps',
      nextBody,
      '',
      '## Critical Context',
      ctxBody,
    ].join('\n');
    const view = topicView(summary);
    expect(view).toContain(goalBody);
    expect(view).toContain(progressBody);
    expect(view).toContain(nextBody);
    expect(view).not.toContain(decidedBody);
    expect(view).not.toContain(ctxBody);
    expect(view).not.toContain('Constraints');
  });

  it('見出し無し → 全文', () => {
    const input = 'plain text';
    expect(topicView(input)).toBe(input);
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
  it('長いほど大きい', () => {
    const small = classifierTokens('a'.repeat(10));
    const large = classifierTokens('a'.repeat(25));
    expect(large).toBeGreaterThan(small);
  });

  it('空 → 0', () => {
    expect(classifierTokens('')).toBe(0);
  });
});

describe('verdicts', () => {
  it('probabilities の keep を読み、threshold で真偽を決める', () => {
    const a = candidate('a');
    const b = candidate('b');
    const keepHigh = 0.8;
    const keepLow = 0.2;
    const threshold = 0.5;
    const result = verdicts(
      [a, b],
      answersOf({ [`keep_${a.id}`]: keepHigh, [`keep_${b.id}`]: keepLow }),
      threshold,
    );
    expect(result).toEqual([
      { id: a.id, keep: true, keepProbability: keepHigh },
      { id: b.id, keep: false, keepProbability: keepLow },
    ]);
  });

  it('keep がちょうど threshold → 真、わずかに下 → 偽', () => {
    const a = candidate('a');
    const threshold = 0.5;
    const even = verdicts([a], answersOf({ [`keep_${a.id}`]: threshold }), threshold);
    expect(even[0]?.keep).toBe(true);
    const low = 0.49;
    const below = verdicts([a], answersOf({ [`keep_${a.id}`]: low }), threshold);
    expect(below[0]?.keep).toBe(false);
  });

  it('答えが無い候補 → keep 真、keepProbability 0', () => {
    const a = candidate('a');
    const threshold = 0.5;
    const result = verdicts([a], {}, threshold);
    expect(result).toEqual([{ id: a.id, keep: true, keepProbability: 0 }]);
  });
});

describe('batches', () => {
  it('大きい候補 100 件 → 予算で 2 束以上に割れる', () => {
    const count = 100;
    const result = batches(many(count), { total: 32000, fixed: 400 });
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result.flat()).toHaveLength(count);
  });

  it('候補 1 件が予算を超える → その 1 件だけの束になる', () => {
    const result = batches(many(1), { total: 10, fixed: 9 });
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveLength(1);
  });

  it('予算が 1 件分より小さい → 1 件だけの束になる', () => {
    const count = 2;
    const result = batches(many(count), { total: 10, fixed: 9 });
    expect(result[0]).toHaveLength(1);
    expect(result.flat()).toHaveLength(count);
  });

  it('空 → 空', () => {
    expect(batches([], { total: 32000, fixed: 100 })).toEqual([]);
  });
});
