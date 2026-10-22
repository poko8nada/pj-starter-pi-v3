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

/** 要約から Goal / Progress / Next Steps の節だけを残す。見出しが無ければそのまま返す */
export function topicView(summary: string): string {
  const lines = summary.split('\n');
  const sections: { readonly name: string; readonly lines: string[] }[] = [];
  let current: { readonly name: string; readonly lines: string[] } | undefined;
  for (const line of lines) {
    const match = /^##\s+(.*?)\s*$/.exec(line);
    if (match !== null) {
      const started: { readonly name: string; readonly lines: string[] } = {
        name: (match[1] ?? '').toLowerCase(),
        lines: [line],
      };
      sections.push(started);
      current = started;
    } else if (current !== undefined) {
      current.lines.push(line);
    }
  }
  if (sections.length === 0) {
    return summary;
  }
  const wanted = sections.filter(
    (section) =>
      section.name === 'goal' || section.name === 'progress' || section.name === 'next steps',
  );
  if (wanted.length === 0) {
    return summary;
  }
  return wanted
    .map((section) => section.lines.join('\n').trim())
    .join('\n\n')
    .trim();
}

/** 分類器のトークン数を文字数から見積もる。実測 2.5 文字/トークンで割る（保守側） */
export function classifierTokens(text: string): number {
  return Math.ceil(text.length / 2.5);
}

/** 質問の前置き。候補に依らない */
export const NEED_INSTRUCTIONS = 'Will you need this tool result later (to read, quote, or use)?';

/** criteria の keep / drop */
export const NEED_CRITERIA: Readonly<Record<string, string>> = {
  keep: 'Will need later (to read, quote, or use)',
  drop: 'Will not need later',
};

/** 候補 1 件を質問文に埋め込んだ 1 問 */
export function questionFor(candidate: Candidate): ClassifierQuestion {
  return {
    type: 'choice',
    instructions: `${NEED_INSTRUCTIONS}\n\ntool: ${candidate.toolName}\nargs: ${candidate.args}\nchars: ${candidate.chars}\nresult:\n${candidate.excerpt}`,
    criteria: { ...NEED_CRITERIA },
  };
}

/** 質問 1 件ぶんのトークン見積もり。前置きと候補を合わせて数える */
export function questionTokens(candidate: Candidate): number {
  const question = questionFor(candidate);
  return Math.max(
    1,
    classifierTokens(question.instructions) + classifierTokens(JSON.stringify(NEED_CRITERIA)),
  );
}

export interface BatchBudget {
  /** Jev の per-question 上限 */
  readonly total: number;
  /** 要約の view の分 */
  readonly fixed: number;
}

/** state は要約の view だけ。候補は questions の instructions に埋め込む */
export function judgeRequest(summary: string, candidates: readonly Candidate[]): JudgeRequest {
  const view = topicView(summary);
  const questions: Record<string, ClassifierQuestion> = {};
  for (const candidate of candidates) {
    questions[`keep_${candidate.id}`] = questionFor(candidate);
  }
  return { state: { summary: view }, questions };
}

/** 候補を予算で束に割る。1 束は fixed と件数の分の合計が total を超えない所まで。足りなくても 1 件は入れる */
export function batches(
  candidates: readonly Candidate[],
  budget: BatchBudget,
): readonly (readonly Candidate[])[] {
  if (candidates.length === 0) {
    return [];
  }
  const available = budget.total - budget.fixed;
  const out: Candidate[][] = [];
  let current: Candidate[] = [];
  let used = 0;
  for (const candidate of candidates) {
    const need = questionTokens(candidate);
    if (current.length > 0 && used + need > available) {
      out.push(current);
      current = [];
      used = 0;
    }
    current.push(candidate);
    used += need;
  }
  if (current.length > 0) {
    out.push(current);
  }
  return out;
}

/** 答えの keep の確率を読み、threshold 未満だけ落とす。答えが無ければ残す */
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
    const probability = answer.probabilities['keep'] ?? 0;
    return { id: candidate.id, keep: probability >= threshold, keepProbability: probability };
  });
}
