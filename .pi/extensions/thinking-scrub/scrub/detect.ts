/**
 * ループした thinking の検出と除去。純関数だけを置く。
 *
 * 同じ周期が続いた区間を取り除き、次のリクエストに壊れた reasoning を渡さない。
 * 周期の下限より短い繰り返し（1〜3 文字）は数えない。短い周期の繰り返しは
 * 大きい周期としても当たるため、残すと下限の意味が無くなる。
 */

export interface Run {
  readonly at: number;
  readonly length: number;
}

export interface Scrub {
  readonly text: string;
  readonly removed: number;
}

export const MIN_PERIOD = 4;
export const MAX_PERIOD = 120;
export const MIN_REPEATS = 3;
export const MIN_LENGTH = 20;

function isWhitespace(char: string): boolean {
  return (
    char === ' ' ||
    char === '\t' ||
    char === '\n' ||
    char === '\r' ||
    char === '\f' ||
    char === '\v'
  );
}

/** 区間が下限より短い周期でも当たるとき真。短い周期は数えない */
function isSmallPeriodic(text: string, at: number, end: number): boolean {
  for (let q = 1; q < MIN_PERIOD; q += 1) {
    let periodic = true;
    for (let index = at + q; index < end; index += 1) {
      if (text[index] !== text[index - q]) {
        periodic = false;
        break;
      }
    }
    if (periodic) {
      return true;
    }
  }
  return false;
}

/** 1 つの周期で極大区間を集める */
function runsForPeriod(text: string, period: number): Run[] {
  const runs: Run[] = [];
  let start: number | undefined;
  for (let index = period; index < text.length; index += 1) {
    if (text[index] === text[index - period]) {
      if (start === undefined) {
        start = index - period;
      }
      continue;
    }
    if (start !== undefined) {
      const length = index - start;
      if (length >= MIN_LENGTH && length >= period * MIN_REPEATS) {
        if (!isSmallPeriodic(text, start, index)) {
          runs.push({ at: start, length });
        }
      }
      start = undefined;
    }
  }
  if (start !== undefined) {
    const length = text.length - start;
    if (length >= MIN_LENGTH && length >= period * MIN_REPEATS) {
      if (!isSmallPeriodic(text, start, text.length)) {
        runs.push({ at: start, length });
      }
    }
  }
  return runs;
}

/** 重なりをまとめて昇順にする。触れる区間も 1 つにする */
function mergeRuns(sorted: readonly Run[]): readonly Run[] {
  const merged: Run[] = [];
  for (const run of sorted) {
    const last = merged.at(-1);
    if (last === undefined) {
      merged.push(run);
      continue;
    }
    const lastEnd = last.at + last.length;
    const end = run.at + run.length;
    if (run.at <= lastEnd) {
      if (end > lastEnd) {
        merged[merged.length - 1] = { at: last.at, length: end - last.at };
      }
      continue;
    }
    merged.push(run);
  }
  return merged;
}

/** 周期が続く区間を、重なりをまとめて昇順で返す */
export function detectRuns(text: string): readonly Run[] {
  if (text.length < MIN_LENGTH) {
    return [];
  }
  const found: Run[] = [];
  for (let period = MIN_PERIOD; period <= MAX_PERIOD; period += 1) {
    if (period * MIN_REPEATS > text.length) {
      break;
    }
    for (const run of runsForPeriod(text, period)) {
      found.push(run);
    }
  }
  if (found.length === 0) {
    return [];
  }
  found.sort((a, b) => a.at - b.at || a.length - b.length);
  return mergeRuns(found);
}

/** 区間を取り除いた本文を返す。区間が無ければ同じ文字列を返す */
export function scrubThinking(text: string): Scrub {
  const runs = detectRuns(text);
  if (runs.length === 0) {
    return { text, removed: 0 };
  }
  const kept: string[] = [];
  let prev = 0;
  for (const run of runs) {
    kept.push(text.slice(prev, run.at));
    prev = run.at + run.length;
  }
  kept.push(text.slice(prev));
  let out = kept.at(0) ?? '';
  for (let index = 1; index < kept.length; index += 1) {
    const before = kept.at(index - 1) ?? '';
    const current = kept.at(index) ?? '';
    const removedText = text.slice(
      runs[index - 1]?.at ?? 0,
      (runs[index - 1]?.at ?? 0) + (runs[index - 1]?.length ?? 0),
    );
    if (removedText.indexOf('\n\n') >= 0) {
      const left = out.trimEnd();
      const right = current.trimStart();
      if (left.length === 0 || right.length === 0) {
        out = left + right;
      } else {
        out = `${left}\n\n${right}`;
      }
      continue;
    }
    if (removedText.indexOf('\n') >= 0) {
      const left = out.trimEnd();
      const right = current.trimStart();
      if (left.length === 0 || right.length === 0) {
        out = left + right;
      } else {
        out = `${left}\n${right}`;
      }
      continue;
    }
    const bothKept = before.length > 0 && current.length > 0;
    const lastChar = before.at(-1) ?? '';
    const firstChar = current.at(0) ?? '';
    const needsSpace = bothKept && !isWhitespace(lastChar) && !isWhitespace(firstChar);
    out += (needsSpace ? ' ' : '') + current;
  }
  return { text: out, removed: runs.length };
}
