/**
 * consult の整形と音。
 *
 * 子が返したイベントと実行結果を、呼び出し側が読める 1 つのテキストにする。ref の名前もここで組む。音はユーザーへの合図で、鳴らなくても走行は続ける。
 */

import { spawn } from 'node:child_process';
import type { AgentToolResult } from '@earendil-works/pi-coding-agent';
import { errorFrom, finalTextFrom, modelFrom, usageFrom } from '../spec.ts';
import type { RunResult } from '../run.ts';

/** 開始と終了に鳴らす音。ユーザーへの合図で、エージェントの関心ではない */
const SOUND_FILE = '/System/Library/Sounds/Tink.aiff';

/** 鳴らない環境（afplay の無い OS、音の無い CI）でも走行は続ける */
export function playSound(): void {
  try {
    spawn('afplay', [SOUND_FILE], { stdio: 'ignore', detached: true }).unref();
  } catch {
    // 音は補助。失敗しても本来の仕事を止めない。
  }
}

/** 道具の戻り値。details は必須なので、必ず埋める */
export function result(
  text: string,
  details: Record<string, unknown> = {},
): AgentToolResult<Record<string, unknown>> {
  return { content: [{ type: 'text', text }], details };
}

/** 消費量を 1 行にする。診断で、結果の本文とは混ぜない */
export function usageLine(events: unknown[]): string {
  const usage = usageFrom(events);
  const cost = usage.cost > 0 ? `, $${usage.cost.toFixed(4)}` : '';
  return `${modelFrom(events) ?? '(model unknown)'} / ${usage.turns} turns / in ${usage.input} out ${usage.output}${cost}`;
}

/** 結果を 1 つのテキストにする。止まった理由も本文に含める */
export function compose(events: unknown[], run: RunResult): string {
  const lines: string[] = [];
  if (run.aborted) {
    lines.push('consult was cancelled.', '');
  }
  if (run.stopped !== undefined) {
    lines.push(`consult stopped early: ${run.stopped}`, '');
  }
  const text = finalTextFrom(events);
  if (text !== '') {
    lines.push(text);
  } else if (run.code !== 0) {
    lines.push(errorFrom(events) || run.stderr.trim() || '(the child produced no text)');
  } else {
    lines.push('(the child produced no text)');
  }
  return lines.join('\n');
}

export function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/**
 * ブランチ名の後半。同じ秒に複数の子が終わっても衝突しないように、番号を付ける。親はこの名前で取り込むかどうかを決める。
 */
export function refLabel(type: string, index: number): string {
  const now = new Date();
  const date = `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}`;
  const time = `${pad2(now.getHours())}${pad2(now.getMinutes())}${pad2(now.getSeconds())}`;
  return `${type}-${date}-${time}-${index}`;
}
