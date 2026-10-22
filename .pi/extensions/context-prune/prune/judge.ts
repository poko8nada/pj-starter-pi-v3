/**
 * 判定の問いと答えの読み。関係ない結果だけを落とす。答えが無ければ残す。
 */

import type { Candidate } from './collect.ts';

export interface ClassifierQuestion {
  readonly type: 'choice';
  readonly instructions: string;
  readonly criteria: Readonly<Record<string, string>>;
}

export interface JudgeRequest {
  readonly state: Record<string, unknown>;
  readonly questions: Readonly<Record<string, ClassifierQuestion>>;
}

export interface Verdict {
  readonly id: string;
  readonly keep: boolean;
  readonly keepProbability: number;
}

export type JudgeAnswers = Readonly<
  Record<
    string,
    { readonly type: string; readonly probabilities: Readonly<Record<string, number>> }
  >
>;

/** 要約と候補の表を state に、候補ごとの問いを questions に積む */
export function judgeRequest(summary: string, candidates: readonly Candidate[]): JudgeRequest {
  const listed = candidates.map((candidate) => ({
    key: `keep_${candidate.id}`,
    toolName: candidate.toolName,
    args: candidate.args,
    chars: candidate.chars,
  }));
  const questions: Record<string, ClassifierQuestion> = {};
  for (const candidate of candidates) {
    questions[`keep_${candidate.id}`] = {
      type: 'choice',
      instructions: 'このツール結果は要約の話題にまだ関係あるか',
      criteria: { yes: '要約の話題に関係ある', no: '要約の話題に関係ない' },
    };
  }
  return { state: { summary, candidates: listed }, questions };
}

/** 候補を maxQuestions ずつに切る。0 以下や小数は 1 以上に丸める */
export function batches(
  candidates: readonly Candidate[],
  maxQuestions: number,
): readonly (readonly Candidate[])[] {
  const size = Math.max(1, Math.floor(maxQuestions));
  const out: Candidate[][] = [];
  // 0 以下や小数は 1 以上の束に丸める（設定は 1 以上を保証するが公開関数の守り）
  for (let index = 0; index < candidates.length; index += size) {
    out.push(candidates.slice(index, index + size));
  }
  return out;
}

/** 答えの yes の確率を読み、threshold 未満だけ落とす。答えが無ければ残す */
export function verdicts(
  candidates: readonly Candidate[],
  answers: JudgeAnswers,
  threshold: number,
): readonly Verdict[] {
  return candidates.map((candidate) => {
    const answer = answers[`keep_${candidate.id}`];
    if (answer === undefined) {
      return { id: candidate.id, keep: true, keepProbability: 0 };
    }
    const probability = answer.probabilities['yes'] ?? 0;
    return { id: candidate.id, keep: probability >= threshold, keepProbability: probability };
  });
}
