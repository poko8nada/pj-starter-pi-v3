/**
 * consult の整形。
 *
 * 子が返したイベントと実行結果を、呼び出し側が読める 1 つのテキストにする。ref の名前もここで組む。
 */

import type { AgentToolResult } from '@earendil-works/pi-coding-agent';
import { errorFrom, finalTextFrom, modelFrom, usageFrom } from '../child/spec.ts';
import type { RunResult } from '../run/run.ts';

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

/**
 * 再走の要約。`compose` が、打ち切りの行の隣に「何回走ったか」と「続きを走らせたか」を出す。
 */
export interface RetrySummary {
  /** 走らせた回数（1 か 2） */
  readonly attempts: number;
  /** 続きの子を走らせたか */
  readonly continued: boolean;
}

/** 打ち切りの 1 行の隣に置く 1 行。回数と、続きを走らせたかを見せる */
function stoppedRunsLine(retry: RetrySummary): string {
  const tail = retry.continued
    ? ' (continued once in the same worktree; the last run stopped at the limit)'
    : ' (not continued; it stopped at the limit)';
  return `consult runs: ${retry.attempts}${tail}`;
}

/** 結果を 1 つのテキストにする。止まった理由も本文に含める */
export function compose(events: unknown[], run: RunResult, retry?: RetrySummary): string {
  const lines: string[] = [];
  if (run.aborted) {
    lines.push('consult was cancelled.', '');
  }
  if (run.stopped !== undefined) {
    // 打ち切りは 1 行だと見落とされる。何回走ったかまで、隣に出して判断に使えるようにする。
    lines.push(`consult stopped early: ${run.stopped}`);
    if (retry !== undefined) {
      lines.push(stoppedRunsLine(retry));
    }
    lines.push('');
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
