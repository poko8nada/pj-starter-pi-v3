/**
 * child-budget — 子が上限の手前に来たら、報告して終えるように促す拡張。
 *
 * 親は `CONSULT_TURNS` で上限を渡す（`run/child.ts` が env に足す）。`turnIndex` は 0 から数えるので、
 * `上限 - 2` で促し、その後に 1 ターン残す。
 *
 * この版の pi（0.87.1 以降）は `turn_end` から値を返せる。そこを 1 度だけ使って、上限の 2 つ手前で
 * 「次が最後のターン」と伝え、その 1 ターンを報告に使わせる（`continue: true`）。
 * ここが働かなくても、子は上限で pi 側から打ち切られる。この仕掛けは「打ち切られる前に報告させる」ための物で、安全網ではない。
 */

import type { TurnEndEventResult } from '@earendil-works/pi-coding-agent';

/** 促しを出す番号。上限の 2 つ手前。上限が読めない（2 未満・数でない）ときは何もしない */
export function lastTurn(turns: number | undefined): number | undefined {
  if (turns === undefined || !Number.isInteger(turns) || turns < 2) {
    return undefined;
  }
  return turns - 2;
}

/** 親が渡した上限（env の文字列）。正の整数でなければ undefined */
export function turnsFrom(value: string | undefined): number | undefined {
  if (value === undefined || value.trim() === '') {
    return undefined;
  }
  const turns = Number(value);
  return Number.isInteger(turns) && turns > 0 ? turns : undefined;
}

/** 子に送る文。抽象を保つ（チケットやサイクルの言葉を入れない） */
export const LAST_TURN_MESSAGE =
  '次が最後のターンです。ここまでに分かったこと・やったことと、終わっていないことを報告して終えてください。';

/**
 * 促しを出すときの 1 つ分。出す必要がなければ undefined。
 *
 * 純粋な形にしてあるのは、子を実際に走らせずに「いつ出すか」を試せるようにするため。
 */
export function nudge(
  limit: number | undefined,
  sent: boolean,
  turnIndex: number,
): TurnEndEventResult | undefined {
  if (limit === undefined || sent || turnIndex < limit) {
    return undefined;
  }
  return {
    entries: [
      {
        type: 'custom_message',
        customType: 'consult-budget',
        content: LAST_TURN_MESSAGE,
        display: true,
      },
    ],
    continue: true,
  };
}

/** 促しを登録する口。`default export` から切り出した試せる形 */
export interface BudgetPiPort {
  on(event: 'turn_end', handler: (event: { turnIndex: number }) => TurnEndEventResult): void;
}

/** 促しを登録する。上限を読んで、その 2 つ手前で 1 度だけ促す */
export function registerBudget(pi: BudgetPiPort, turns: number | undefined): void {
  const limit = lastTurn(turns);
  let sent = false;
  pi.on('turn_end', (event) => {
    const result = nudge(limit, sent, event.turnIndex);
    if (result === undefined) {
      return {};
    }
    // 1 度だけ。無条件の続行はループになる。
    sent = true;
    return result;
  });
}

export default function (pi: BudgetPiPort) {
  registerBudget(pi, turnsFrom(process.env.CONSULT_TURNS));
}
