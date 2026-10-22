/**
 * 本番の口。要約は pi の `generateSummaryWithUsage`（本体のコンパクションと同じ関数）に任せる。
 * 判定は設定の順に分類器で聞く。
 *
 * 要約の関数が直列化・促し・キャッシュ・session id を中で決めるので、こちらでは組み立てない。
 */

import { generateSummaryWithUsage, type ExtensionContext } from '@earendil-works/pi-coding-agent';
import { readSettings } from '../settings/read.ts';
import type { Settings } from '../settings/schema.ts';
import type { EntryMessage } from './collect.ts';
import type { ClassifierQuestion, JudgeRequest } from './judge.ts';
import type { PassPorts } from './run.ts';

export interface ModelCell {
  registry?: ExtensionContext['modelRegistry'];
  model?: ExtensionContext['model'];
  sessionId?: string;
}

/** 要約の関数。テストは差し替える */
export type SummarizeWithUsage = typeof generateSummaryWithUsage;

type SummarizeOutcome = Awaited<ReturnType<PassPorts['summarize']>>;
type ClassifyOutcome = Awaited<ReturnType<PassPorts['classify']>>;

type RegistryAnswers = Awaited<
  ReturnType<ExtensionContext['modelRegistry']['classify']>
>['answers'];

type ShapedAnswers = Record<
  string,
  { readonly type: string; readonly probabilities: Readonly<Record<string, number>> }
>;

type SdkQuestions = Record<
  string,
  { type: 'choice'; instructions: string; criteria: Record<string, string> }
>;

/** null のヘッダを落として、要約の関数が受ける形にする */
function headersOf(
  headers: Readonly<Record<string, string | null>> | undefined,
): Record<string, string> | undefined {
  if (headers === undefined) {
    return undefined;
  }
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (value !== null) {
      out[key] = value;
    }
  }
  return out;
}

/** 要約の口。pi の要約関数に、直近のメッセージと認証をそのまま渡す */
async function summarizeViaCell(
  cell: ModelCell,
  settingsDir: string,
  recent: readonly EntryMessage[],
  summarize: SummarizeWithUsage,
): Promise<SummarizeOutcome> {
  const read = readSettings(settingsDir);
  if (read.kind === 'broken') {
    return { kind: 'failed', reason: read.reason };
  }
  if (cell.registry === undefined || cell.model === undefined) {
    return { kind: 'failed', reason: 'no model available' };
  }
  const auth = await cell.registry.getApiKeyAndHeaders(cell.model);
  if (!auth.ok) {
    return { kind: 'failed', reason: auth.error };
  }
  try {
    // generateSummaryWithUsage は maxTokens = 0.8 × reserveTokens で要約する
    const reserveTokens = Math.ceil(read.settings.summaryTokens / 0.8);
    const result = await summarize(
      [...recent],
      cell.model,
      reserveTokens,
      auth.apiKey,
      headersOf(auth.headers),
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      auth.env,
      undefined,
      undefined,
      cell.sessionId,
    );
    const summary = result.text;
    if (summary.trim() === '') {
      return { kind: 'failed', reason: 'summary is empty' };
    }
    return {
      kind: 'ok',
      summary,
      usage: {
        input: result.usage.input,
        output: result.usage.output,
        cost: result.usage.cost.total,
      },
    };
  } catch (error) {
    return { kind: 'failed', reason: error instanceof Error ? error.message : String(error) };
  }
}

/** 分類の答えを自前の形に直す。choice 以外や欠けがあれば undefined */
function toAnswers(
  answers: RegistryAnswers,
  questions: Readonly<Record<string, ClassifierQuestion>>,
): ShapedAnswers | undefined {
  const out: ShapedAnswers = {};
  for (const key of Object.keys(questions)) {
    const answer = answers[key];
    if (answer === undefined || answer.type !== 'choice') {
      return undefined;
    }
    out[key] = { type: answer.type, probabilities: { ...answer.probabilities } };
  }
  return out;
}

/** 判定の口。設定の順に分類器を試す。全部だめなら失敗する */
async function classifyViaCell(
  cell: ModelCell,
  settingsDir: string,
  request: JudgeRequest,
): Promise<ClassifyOutcome> {
  const read = readSettings(settingsDir);
  if (read.kind === 'broken') {
    return { kind: 'failed', reason: read.reason };
  }
  if (cell.registry === undefined) {
    return { kind: 'failed', reason: 'no model registry' };
  }
  const settings: Settings = read.settings;
  const available = await cell.registry.getAvailableOfType('classifier').catch(() => undefined);
  if (available === undefined) {
    return { kind: 'failed', reason: 'no classifier available' };
  }
  const ordered = settings.classifier.models.flatMap((want) => {
    const found = available.find(
      (model) => model.provider === want.provider && model.id === want.model,
    );
    if (found === undefined || (!settings.classifier.allowPaid && found.cost.input > 0)) {
      return [];
    }
    return [found];
  });
  if (ordered.length === 0) {
    return { kind: 'failed', reason: 'no classifier available' };
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JudgeRequest の state は JSON 値だけで組む
  const state = request.state as unknown as Parameters<
    ExtensionContext['modelRegistry']['classify']
  >[1]['state'];
  const questions: SdkQuestions = {};
  for (const [key, question] of Object.entries(request.questions)) {
    questions[key] = {
      type: 'choice',
      instructions: question.instructions,
      criteria: { ...question.criteria },
    };
  }
  let reason = 'no classifier available';
  for (const model of ordered) {
    // eslint-disable-next-line no-await-in-loop -- 候補は順に試し、答えた所で止める
    const result = await cell.registry.classify(model, { state, questions });
    if (result.stopReason === 'error') {
      reason = result.errorMessage ?? `classifier error from ${model.provider}/${model.id}`;
      continue;
    }
    if (result.stopReason === 'aborted') {
      reason = 'classify aborted';
      break;
    }
    const shaped = toAnswers(result.answers, request.questions);
    if (shaped === undefined) {
      reason = `unexpected answer shape from ${model.provider}/${model.id}`;
      continue;
    }
    return { kind: 'ok', answers: shaped };
  }
  return { kind: 'failed', reason };
}

/** 本番の口を作る。registry とモデルは後から掴む */
export function createPorts(
  cell: ModelCell,
  settingsDir: string,
  summarize: SummarizeWithUsage = generateSummaryWithUsage,
): PassPorts {
  return {
    summarize: (recent) => summarizeViaCell(cell, settingsDir, recent, summarize),
    classify: (request) => classifyViaCell(cell, settingsDir, request),
  };
}
