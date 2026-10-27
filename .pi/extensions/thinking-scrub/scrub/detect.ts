/**
 * ループした thinking の検出と除去。純関数だけを置く。
 *
 * 同じ周期が続いた区間を取り除き、次のリクエストに壊れた reasoning を渡さない。
 * 周期の下限より短い繰り返し（1〜3 文字）は数えない。短い周期の繰り返しは
 * 大きい周期としても当たるため、残すと下限の意味が無くなる。
 * 文の周期は最初の 1 周期を残し、文字の周期は全部消す。文を先に畳む。
 */

import type { CharTuning, SentenceTuning, Tuning } from '../settings/schema.ts';
import { detectUnitRuns, splitUnits } from './units.ts';

export interface Run {
  readonly at: number;
  readonly length: number;
}

export interface Scrub {
  readonly text: string;
  readonly removed: number;
}

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
function isSmallPeriodic(text: string, at: number, end: number, minPeriod: number): boolean {
  for (let q = 1; q < minPeriod; q += 1) {
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
function runsForPeriod(text: string, period: number, char: CharTuning): Run[] {
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
      if (length >= char.minLength && length >= period * char.minRepeats) {
        if (!isSmallPeriodic(text, start, index, char.minPeriod)) {
          runs.push({ at: start, length });
        }
      }
      start = undefined;
    }
  }
  if (start !== undefined) {
    const length = text.length - start;
    if (length >= char.minLength && length >= period * char.minRepeats) {
      if (!isSmallPeriodic(text, start, text.length, char.minPeriod)) {
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
export function detectRuns(text: string, char: CharTuning): readonly Run[] {
  if (text.length < char.minLength) {
    return [];
  }
  const found: Run[] = [];
  for (let period = char.minPeriod; period <= char.maxPeriod; period += 1) {
    if (period * char.minRepeats > text.length) {
      break;
    }
    for (const run of runsForPeriod(text, period, char)) {
      found.push(run);
    }
  }
  if (found.length === 0) {
    return [];
  }
  found.sort((a, b) => a.at - b.at || a.length - b.length);
  return mergeRuns(found);
}

/** 消した区間が含んでいた改行のうち、いちばん強いもの。含まなければ undefined */
export function separatorFor(removed: string): string | undefined {
  if (removed.includes('\n\n')) {
    return '\n\n';
  }
  if (removed.includes('\n')) {
    return '\n';
  }
  return undefined;
}

/** 文字の区間を取り除いた本文を返す。区間が無ければ同じ文字列を返す */
function removeSpans(text: string, spans: readonly Run[]): Scrub {
  if (spans.length === 0) {
    return { text, removed: 0 };
  }
  const sorted = spans.toSorted((a, b) => a.at - b.at || a.length - b.length);
  const merged: Run[] = [];
  for (const span of sorted) {
    const last = merged.at(-1);
    if (last === undefined) {
      merged.push(span);
      continue;
    }
    const lastEnd = last.at + last.length;
    const end = span.at + span.length;
    if (span.at <= lastEnd) {
      if (end > lastEnd) {
        merged[merged.length - 1] = { at: last.at, length: end - last.at };
      }
      continue;
    }
    merged.push(span);
  }
  const kept: string[] = [];
  let prev = 0;
  for (const run of merged) {
    kept.push(text.slice(prev, run.at));
    prev = run.at + run.length;
  }
  kept.push(text.slice(prev));
  let out = kept.at(0) ?? '';
  for (let index = 1; index < kept.length; index += 1) {
    const before = kept.at(index - 1) ?? '';
    const current = kept.at(index) ?? '';
    const removedText = text.slice(
      merged[index - 1]?.at ?? 0,
      (merged[index - 1]?.at ?? 0) + (merged[index - 1]?.length ?? 0),
    );
    const separator = separatorFor(removedText);
    if (separator !== undefined) {
      const left = out.trimEnd();
      const right = current.trimStart();
      if (left.length === 0 || right.length === 0) {
        out = left + right;
      } else {
        out = `${left}${separator}${right}`;
      }
      continue;
    }
    const bothKept = before.length > 0 && current.length > 0;
    const lastChar = before.at(-1) ?? '';
    const firstChar = current.at(0) ?? '';
    const needsSpace = bothKept && !isWhitespace(lastChar) && !isWhitespace(firstChar);
    out += (needsSpace ? ' ' : '') + current;
  }
  return { text: out, removed: merged.length };
}

/** 文の run を文字の区間に直す。最初の 1 周期を残し、2 周期目から消す */
function sentenceSpans(text: string, sentence: SentenceTuning): Run[] {
  const units = splitUnits(text);
  const runs = detectUnitRuns(units, sentence);
  const spans: Run[] = [];
  for (const run of runs) {
    const firstKeptEnd = units[run.at + run.period - 1]?.end;
    const lastEnd = units[run.at + run.length - 1]?.end;
    if (firstKeptEnd !== undefined && lastEnd !== undefined && lastEnd > firstKeptEnd) {
      spans.push({ at: firstKeptEnd, length: lastEnd - firstKeptEnd });
    }
  }
  return spans;
}

/** 文の周期は最初の 1 周期を残し、文字の周期は全部消す。文を先に畳む */
export function scrubThinking(text: string, tuning: Tuning): Scrub {
  const afterSentence = removeSpans(text, sentenceSpans(text, tuning.sentence));
  const charRuns = detectRuns(afterSentence.text, tuning.char);
  const afterChar = removeSpans(afterSentence.text, charRuns);
  return { text: afterChar.text, removed: afterSentence.removed + afterChar.removed };
}
