/**
 * 1 パスの実行。要約して束で聞き、要らない結果だけを落とす。
 *
 * 失敗したら積まない（fail-open）。既定のコンパクションが保険になる。
 */

import type { Settings } from '../settings/schema.ts';
import type { Drop, PrunePass, Usage } from '../entry/data.ts';
import {
  batches,
  classifierTokens,
  judgeRequest,
  topicView,
  verdicts,
  type JudgeRequest,
} from './judge.ts';
import type { Candidate, EntryMessage } from './collect.ts';

export type PassOutcome =
  | { readonly kind: 'done'; readonly pass: PrunePass }
  | { readonly kind: 'failed'; readonly reason: string }
  | { readonly kind: 'skipped'; readonly reason: string };

export interface PassPorts {
  readonly summarize: (
    recent: readonly EntryMessage[],
  ) => Promise<
    | { readonly kind: 'ok'; readonly summary: string; readonly usage: Usage | undefined }
    | { readonly kind: 'failed'; readonly reason: string }
  >;
  readonly classify: (request: JudgeRequest) => Promise<
    | {
        readonly kind: 'ok';
        readonly answers: Readonly<
          Record<
            string,
            { readonly type: string; readonly probabilities: Readonly<Record<string, number>> }
          >
        >;
      }
    | { readonly kind: 'failed'; readonly reason: string }
  >;
}

export interface RunPassInput {
  readonly settings: Settings;
  readonly tokens: number;
  readonly candidates: readonly Candidate[];
  readonly recent: readonly EntryMessage[];
  readonly now: number;
}

/** 直近を文字列にして要約し、候補を束で聞いてパスを作る */
export async function runPass(input: RunPassInput, ports: PassPorts): Promise<PassOutcome> {
  if (input.candidates.length === 0) {
    return {
      kind: 'done',
      pass: {
        at: input.now,
        tokensBefore: input.tokens,
        summary: '',
        dropped: [],
        droppedChars: 0,
        kept: 0,
        latencyMs: 0,
        usage: undefined,
      },
    };
  }
  const startedAt = Date.now();
  const summarized = await ports.summarize(input.recent);
  if (summarized.kind === 'failed') {
    return { kind: 'failed', reason: summarized.reason };
  }
  if (summarized.summary.trim() === '') {
    return { kind: 'failed', reason: 'summary is empty' };
  }
  const view = topicView(summarized.summary);
  const sample = judgeRequest(view, input.candidates.slice(0, 1)).questions;
  const fixed = classifierTokens(view) + classifierTokens(JSON.stringify(sample));
  const answers: Record<
    string,
    { readonly type: string; readonly probabilities: Readonly<Record<string, number>> }
  > = {};
  for (const batch of batches(input.candidates, { total: 32000, fixed })) {
    // eslint-disable-next-line no-await-in-loop -- 束は順に聞き、失敗したら止める
    const classified = await ports.classify(judgeRequest(view, batch));
    if (classified.kind === 'failed') {
      return { kind: 'failed', reason: classified.reason };
    }
    for (const [key, answer] of Object.entries(classified.answers)) {
      answers[key] = answer;
    }
  }
  const decided = verdicts(input.candidates, answers, input.settings.threshold);
  const byId = new Map(input.candidates.map((candidate) => [candidate.id, candidate]));
  const drops: Drop[] = [];
  let droppedChars = 0;
  for (const verdict of decided) {
    if (verdict.keep) {
      continue;
    }
    const chars = byId.get(verdict.id)?.chars ?? 0;
    droppedChars += chars;
    drops.push({ id: verdict.id, chars });
  }
  return {
    kind: 'done',
    pass: {
      at: input.now,
      tokensBefore: input.tokens,
      summary: summarized.summary,
      dropped: drops,
      droppedChars,
      kept: decided.length - drops.length,
      latencyMs: Date.now() - startedAt,
      usage: summarized.usage,
    },
  };
}
