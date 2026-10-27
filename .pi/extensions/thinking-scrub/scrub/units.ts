/**
 * 文単位の分割と周期検出。純関数だけを置く。
 *
 * 行に分けてから文に分ける。英語は `.` `!` `?` の後に空白か行末が来たら切り、
 * 日本語は `。` `！` `？` で切る。フェンス・表・diff の行は不透明な単位にする。
 */

export interface Unit {
  readonly start: number;
  readonly end: number;
  readonly text: string;
  readonly opaque: boolean;
}

export interface UnitRun {
  readonly at: number;
  readonly length: number;
  readonly period: number;
}

import type { SentenceTuning } from '../settings/schema.ts';

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

function isFenceLine(trimmed: string): boolean {
  return trimmed.startsWith('```') || trimmed.startsWith('~~~');
}

function isTableRow(trimmed: string): boolean {
  return trimmed.startsWith('|');
}

function isDiffLine(trimmed: string): boolean {
  return (
    trimmed.startsWith('diff --git') ||
    trimmed.startsWith('+++') ||
    trimmed.startsWith('---') ||
    trimmed.startsWith('@@')
  );
}

/** 文に分ける前の 1 行が不透明か */
function isOpaqueLine(trimmed: string): boolean {
  return isFenceLine(trimmed) || isTableRow(trimmed) || isDiffLine(trimmed);
}

function isEnglishEnd(char: string, next: string | undefined): boolean {
  if (char !== '.' && char !== '!' && char !== '?') {
    return false;
  }
  return next === undefined || isWhitespace(next);
}

function isJapaneseEnd(char: string): boolean {
  return char === '。' || char === '！' || char === '？';
}

/** 本文を行に分け、元の offset を付けて返す */
function splitLines(text: string): { readonly start: number; readonly line: string }[] {
  const lines: { readonly start: number; readonly line: string }[] = [];
  let pos = 0;
  while (pos <= text.length) {
    const next = text.indexOf('\n', pos);
    const end = next === -1 ? text.length : next;
    lines.push({ start: pos, line: text.slice(pos, end) });
    if (next === -1) {
      break;
    }
    pos = end + 1;
  }
  return lines;
}

/** 通常行を文に分けて単位にする */
function splitSentences(line: string, lineStart: number): Unit[] {
  const units: Unit[] = [];
  const length = line.length;
  let sentStart = 0;
  const pushSentence = (from: number, toExclusive: number): void => {
    let fromTrimmed = from;
    while (fromTrimmed < toExclusive && isWhitespace(line[fromTrimmed] ?? '')) {
      fromTrimmed += 1;
    }
    let toTrimmed = toExclusive;
    while (toTrimmed > fromTrimmed && isWhitespace(line[toTrimmed - 1] ?? '')) {
      toTrimmed -= 1;
    }
    if (fromTrimmed >= toTrimmed) {
      return;
    }
    units.push({
      start: lineStart + fromTrimmed,
      end: lineStart + toTrimmed,
      text: line.slice(fromTrimmed, toTrimmed),
      opaque: false,
    });
  };
  for (let index = 0; index < length; index += 1) {
    const char = line[index] ?? '';
    const next = index + 1 < length ? (line[index + 1] ?? '') : undefined;
    if (isJapaneseEnd(char) || isEnglishEnd(char, next)) {
      pushSentence(sentStart, index + 1);
      sentStart = index + 1;
    }
  }
  if (sentStart < length) {
    pushSentence(sentStart, length);
  }
  return units;
}

/** 本文を文単位に分ける。`text.slice(start, end) === text` が成り立つ */
export function splitUnits(text: string): readonly Unit[] {
  if (text.length === 0) {
    return [];
  }
  const units: Unit[] = [];
  let inFence = false;
  for (const { start: lineStart, line } of splitLines(text)) {
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      if (inFence && line.length > 0) {
        units.push({ start: lineStart, end: lineStart + line.length, text: line, opaque: true });
      }
      continue;
    }
    if (isFenceLine(trimmed)) {
      units.push({ start: lineStart, end: lineStart + line.length, text: line, opaque: true });
      inFence = !inFence;
      continue;
    }
    if (inFence || isOpaqueLine(trimmed)) {
      units.push({ start: lineStart, end: lineStart + line.length, text: line, opaque: true });
      continue;
    }
    for (const unit of splitSentences(line, lineStart)) {
      units.push(unit);
    }
  }
  return units;
}

/** 単位の等しさで 1 つの周期の極大区間を集める */
function runsForPeriod(
  units: readonly Unit[],
  period: number,
  sentence: SentenceTuning,
): UnitRun[] {
  const runs: UnitRun[] = [];
  let start: number | undefined;
  const flush = (endExclusive: number): void => {
    if (start === undefined) {
      return;
    }
    const length = endExclusive - start;
    if (length >= sentence.minCycles * period) {
      const first = units[start];
      const last = units[endExclusive - 1];
      if (first !== undefined && last !== undefined) {
        const chars = last.end - first.start;
        if (chars >= sentence.minRunChars) {
          runs.push({ at: start, length, period });
        }
      }
    }
    start = undefined;
  };
  for (let index = period; index < units.length; index += 1) {
    const current = units[index];
    const prev = units[index - period];
    if (
      current !== undefined &&
      prev !== undefined &&
      !current.opaque &&
      !prev.opaque &&
      current.text === prev.text
    ) {
      if (start === undefined) {
        start = index - period;
      }
      continue;
    }
    if (start !== undefined) {
      flush(index);
    }
  }
  if (start !== undefined) {
    flush(units.length);
  }
  return runs;
}

function overlaps(a: UnitRun, b: UnitRun): boolean {
  return a.at < b.at + b.length && b.at < a.at + a.length;
}

/** 単位の並びの周期区間を、重なりを小さい周期で残して昇順で返す */
export function detectUnitRuns(
  units: readonly Unit[],
  sentence: SentenceTuning,
): readonly UnitRun[] {
  if (units.length < sentence.minCycles) {
    return [];
  }
  const maxPeriod = Math.min(
    sentence.maxPeriodUnits,
    Math.floor(units.length / sentence.minCycles),
  );
  const found: UnitRun[] = [];
  for (let period = 1; period <= maxPeriod; period += 1) {
    for (const run of runsForPeriod(units, period, sentence)) {
      found.push(run);
    }
  }
  if (found.length === 0) {
    return [];
  }
  found.sort((a, b) => a.period - b.period || a.at - b.at || b.length - a.length);
  const kept: UnitRun[] = [];
  for (const run of found) {
    if (kept.some((other) => overlaps(run, other))) {
      continue;
    }
    kept.push(run);
  }
  kept.sort((a, b) => a.at - b.at || a.period - b.period || a.length - b.length);
  return kept;
}

/** run の中で最も多い 3 文の連続を返す。周期が 3 以下なら周期そのもの */
export function sampleOf(units: readonly Unit[], run: UnitRun, sampleChars: number): string {
  const slice = units.slice(run.at, run.at + run.length);
  if (slice.length === 0) {
    return '';
  }
  let picked: readonly Unit[];
  if (run.period <= 3) {
    picked = slice.slice(0, Math.min(run.period, slice.length));
  } else {
    const counts = new Map<
      string,
      { readonly count: number; readonly first: number; readonly window: readonly Unit[] }
    >();
    for (let index = 0; index + 3 <= slice.length; index += 1) {
      const window = slice.slice(index, index + 3);
      const key = window.map((unit) => unit.text).join('\u0000');
      const existing = counts.get(key);
      if (existing !== undefined) {
        counts.set(key, {
          count: existing.count + 1,
          first: existing.first,
          window: existing.window,
        });
      } else {
        counts.set(key, { count: 1, first: index, window });
      }
    }
    let best:
      | { readonly count: number; readonly first: number; readonly window: readonly Unit[] }
      | undefined;
    for (const entry of counts.values()) {
      if (
        best === undefined ||
        entry.count > best.count ||
        (entry.count === best.count && entry.first < best.first)
      ) {
        best = entry;
      }
    }
    picked = best?.window ?? slice.slice(0, Math.min(3, slice.length));
  }
  const joined = picked.map((unit) => unit.text).join(' ');
  return joined.length > sampleChars ? joined.slice(0, sampleChars) : joined;
}
