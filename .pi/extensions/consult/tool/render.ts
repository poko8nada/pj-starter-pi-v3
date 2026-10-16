/**
 * consult の整形。
 *
 * サブエージェントが返したイベントと実行結果を、呼び出し側が読める 1 つのテキストにする。ref の名前もここで組む。
 */

import type { AgentToolResult } from '@earendil-works/pi-coding-agent';
import { errorFrom, finalTextFrom, modelFrom, usageFrom } from '../sub/spec.ts';
import type { SubagentState, RunResult } from '../run/run.ts';

/** 道具の戻り値。details は必須なので、必ず埋める */
export function result(
  text: string,
  details: Record<string, unknown> = {},
): AgentToolResult<Record<string, unknown>> {
  return { content: [{ type: 'text', text }], details };
}

/**
 * メインエージェントに渡す塊。サブエージェント 1 体分の素性・場所・終わり方・触った物・使った量。
 *
 * diff は入れない（メインエージェントが見る物ではないし、行数だけでも意味がない）。重い物を運ばないのがこの塊の役目。
 */
export interface SubagentReport {
  readonly id?: string;
  readonly role: string;
  /** worktree の id。ベースで走ったとき（読むだけ）は無い */
  readonly worktree?: string;
  readonly state: SubagentState;
  /** 終わり方が done でないときの理由。本文から拾った 1 行 */
  readonly reason?: string;
  /** サブエージェントが触ったファイル（git が言う分）。読んだだけのファイルは入らない */
  readonly files: readonly string[];
  readonly turns: number;
  readonly turnsLimit: number;
  readonly spend: string;
}

/** 塊を 1 つのテキストにする。先頭に置いて、サブエージェントの本文が続く */
export function reportBlock(report: SubagentReport): string {
  const where = report.worktree === undefined ? 'base' : `worktree ${report.worktree}`;
  // id はメインエージェントが振る物で、無いこともある（テストや、id を持たない呼び方）。その時は consult とだけ書く
  const label = report.id ?? 'consult';
  const lines = [
    `## ${label} — ${report.role} / ${report.state}`,
    '',
    `- place: ${where}`,
    `- turns: ${report.turns} / ${report.turnsLimit}`,
    `- spend: ${report.spend}`,
    `- files: ${report.files.length === 0 ? '(none)' : report.files.join(', ')}`,
  ];
  if (report.reason !== undefined && report.reason !== '') {
    lines.push(`- reason: ${report.reason}`);
  }
  return lines.join('\n');
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
  /** 続きのサブエージェントを走らせたか */
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
    lines.push(errorFrom(events) || run.stderr.trim() || '(the subagent produced no text)');
  } else {
    lines.push('(the subagent produced no text)');
  }
  return lines.join('\n');
}
