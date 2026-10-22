import { describe, expect, it } from 'vitest';
import type { Candidate } from './collect.ts';
import { batches, judgeRequest, verdicts, type JudgeAnswers } from './judge.ts';

function candidate(id: string): Candidate {
  return { id, toolName: 'read', args: `read({"path":"${id}.txt"})`, chars: 10 };
}

function answersOf(probabilities: Readonly<Record<string, number>>): JudgeAnswers {
  const answers: Record<string, { type: string; probabilities: Readonly<Record<string, number>> }> =
    {};
  for (const [key, probability] of Object.entries(probabilities)) {
    answers[key] = { type: 'choice', probabilities: { yes: probability } };
  }
  return answers;
}

function many(count: number): Candidate[] {
  const out: Candidate[] = [];
  for (let index = 0; index < count; index += 1) {
    out.push({ id: `c${index}`, toolName: 'read', args: '', chars: 1 });
  }
  return out;
}

describe('judgeRequest', () => {
  it('候補 2 件 → questions の鍵が keep_a と keep_b、state に要約と 2 件', () => {
    const request = judgeRequest('話題の要約', [candidate('a'), candidate('b')]);
    expect(Object.keys(request.questions).toSorted()).toEqual(['keep_a', 'keep_b']);
    expect(request.state['summary']).toBe('話題の要約');
    expect(request.state['candidates']).toHaveLength(2);
  });

  it('keep_a の criteria が yes と no を持ち、instructions が空でない', () => {
    const request = judgeRequest('話題の要約', [candidate('a')]);
    const question = request.questions['keep_a'];
    expect(question?.criteria).toEqual({
      yes: expect.any(String),
      no: expect.any(String),
    });
    expect(question?.instructions.length).toBeGreaterThan(0);
  });
});

describe('verdicts', () => {
  it('yes が 0.7 と 0.2、threshold 0.5 → keep が真と偽', () => {
    const result = verdicts(
      [candidate('a'), candidate('b')],
      answersOf({ keep_a: 0.7, keep_b: 0.2 }),
      0.5,
    );
    expect(result).toEqual([
      { id: 'a', keep: true, keepProbability: 0.7 },
      { id: 'b', keep: false, keepProbability: 0.2 },
    ]);
  });

  it('yes がちょうど 0.5 → keep 真（未満だけ落とす）、0.49 → keep 偽', () => {
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
  it('候補 90 件・maxQuestions 40 → 3 つの束（40、40、10）', () => {
    const result = batches(many(90), 40);
    expect(result).toHaveLength(3);
    expect(result[0]).toHaveLength(40);
    expect(result[1]).toHaveLength(40);
    expect(result[2]).toHaveLength(10);
  });

  it('maxQuestions 1 → 90 の束', () => {
    expect(batches(many(90), 1)).toHaveLength(90);
  });
});
