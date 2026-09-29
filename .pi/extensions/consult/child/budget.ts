/**
 * child-budget — 子が上限の手前に来たら、報告して終えるように促す拡張。
 *
 * 親は `CONSULT_TURNS` で上限を渡す（`run/child.ts` が env に足す）。`turnIndex` は 0 から数えるので、
 * `上限 - 1` が最後の 1 つ手前になる。
 *
 * この版の pi（0.85.1）は `turn_end` から値を返せないため、促しは「そのターンで道具を止める」形で渡す。
 * 止めるのは 1 度だけ（止め続けるとループになる）。ここが働かなくても、子は上限で pi 側から打ち切られる。
 * この仕掛けは「打ち切られる前に報告させる」ための物で、安全網ではない。
 */

import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';

/** 次が最後のターンになる番号。上限が読めない（1 以下・数でない）ときは何もしない */
export function lastTurn(turns: number | undefined): number | undefined {
  if (turns === undefined || !Number.isInteger(turns) || turns < 2) {
    return undefined;
  }
  return turns - 1;
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

export default function (pi: ExtensionAPI) {
  const limit = lastTurn(turnsFrom(process.env.CONSULT_TURNS));
  let turns = 0;
  let told = false;
  // この版の pi（0.85.1）では `turn_end` から値を返せない（`ExtensionHandler<TurnEndEvent>`）。
  // だからターンは数えるだけにして、報告の促しは次の `tool_call` を止める形で渡す。
  // 道具を止めれば子は本文で応えるしかない。そこで報告して終わる。
  pi.on('turn_end', (event) => {
    turns = event.turnIndex + 1;
  });
  pi.on('tool_call', () => {
    if (limit === undefined || told || turns < limit) {
      return {};
    }
    told = true;
    return { block: true, reason: LAST_TURN_MESSAGE };
  });
}
