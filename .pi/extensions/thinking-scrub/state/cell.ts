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

/** 失敗を足した状態 */
export function addFailure(status: Status): Status {
  return { ...status, failures: status.failures + 1 };
}
