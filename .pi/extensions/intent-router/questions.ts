/**
 * intent-router のラベルと classifier への質問文。
 *
 * ラベルは route の criteria のキーそのもの。片方だけ増やすとずれるので、
 * テストで一致を見る。
 */

export type Label = 'question' | 'design' | 'verify' | 'permission' | 'chat' | 'unknown';

export const LABELS: readonly Label[] = [
  'question',
  'design',
  'verify',
  'permission',
  'chat',
  'unknown',
];

/** pi の classifier が受ける choice の質問の形（`ClassifierContext.questions` の1件） */
export interface ClassifierChoiceQuestion {
  readonly type: 'choice';
  readonly instructions: string;
  readonly criteria: Record<string, string>;
}

/** pi の classifier が受ける score の質問の形 */
export interface ClassifierScoreQuestion {
  readonly type: 'score';
  readonly instructions: string;
  readonly criteria: string[];
}

export const ROUTE_QUESTION: ClassifierChoiceQuestion = {
  type: 'choice',
  instructions: 'Classify the owner message into exactly one intent label.',
  criteria: {
    question:
      'Asks for an explanation, an answer, or information. The owner wants an answer, not an edit',
    design: 'Asks for an opinion, a review, or a design judgement on a proposal, plan, or design',
    verify: 'Asks to check, confirm, or verify a fact, behavior, or result',
    permission: 'A permission request, a confirmation, or an approval gate',
    chat: 'Small talk, a greeting, thanks, or other casual chat',
    unknown: 'Anything else that fits none of the above',
  },
};

export const JUDGE_QUESTION: ClassifierScoreQuestion = {
  type: 'score',
  instructions:
    'How ready is the investigation to answer the owner question? Rate the investigation state.',
  criteria: [
    '0: almost nothing has been investigated yet; answering now would be a guess',
    '1: partly investigated; key evidence is still missing',
    '2: enough has been investigated to answer; stop investigating and answer from what is known',
  ],
};
