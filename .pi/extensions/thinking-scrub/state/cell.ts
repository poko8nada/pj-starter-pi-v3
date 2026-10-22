/**
 * thinking-scrub の状態。セッションの間だけ持つ。
 *
 * どれも新しい Status を返し、渡された状態を書き換えない。
 */

export interface Status {
  readonly removed: number;
  readonly lastAt: number | null;
  readonly failures: number;
}

/** 何も無い状態 */
export function emptyStatus(): Status {
  return { removed: 0, lastAt: null, failures: 0 };
}

/** 畳んだ結果を足した状態 */
export function addScrub(status: Status, removed: number, at: number): Status {
  return { ...status, removed: status.removed + removed, lastAt: at };
}

export interface Tally {
  readonly runs: number;
  readonly chars: number;
}

/** 何も消していない実行の合計 */
export function emptyTally(): Tally {
  return { runs: 0, chars: 0 };
}

/** 実行の中の合計を足した値 */
export function addTally(tally: Tally, runs: number, chars: number): Tally {
  return { runs: tally.runs + runs, chars: tally.chars + chars };
}

/** 失敗を足した状態 */
export function addFailure(status: Status): Status {
  return { ...status, failures: status.failures + 1 };
}
