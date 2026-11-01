/**
 * consult の記録の保存場所を値にする。
 *
 * 保存場所はリポジトリから決まる固定の場所（`<root>/records/<project>/`）で、
 * 記憶を持たず、reload をまたいでも同じものになる。`<project>` は頂点の
 * 最後の成分にパスの sha1 の先頭 8 文字を付けたもの（同じ名前の repo が別のパスにあっても分かれる）。
 *
 * 日割りは行を書いた瞬間の日で決める。時刻はプロセスのローカルを使う
 *（`toISOString` は UTC なので使わない）。
 */

import { createHash } from 'node:crypto';
import { readdirSync } from 'node:fs';
import { basename, join } from 'node:path';

/** 記録の保存場所。`dir` の下に `<YYYY-MM-DD>.jsonl` が並ぶ */
export interface Place {
  readonly dir: string;
  readonly toplevel: string;
}

/** 頂点のパスから保存場所の名前を作る。同じ名前でもパスが違えば違う値になる */
export function projectKey(toplevel: string): string {
  const hash = createHash('sha1').update(toplevel).digest('hex').slice(0, 8);
  return `${basename(toplevel)}-${hash}`;
}

/** ローカルの日付を `YYYY-MM-DD` にする */
export function dayName(at: Date): string {
  const month = String(at.getMonth() + 1).padStart(2, '0');
  const day = String(at.getDate()).padStart(2, '0');
  return `${at.getFullYear()}-${month}-${day}`;
}

/** ルートと頂点から保存場所を作る。作らない（決めるだけ） */
export function placeFor(root: string, toplevel: string): Place {
  return { dir: join(root, 'records', projectKey(toplevel)), toplevel };
}

/** その日のファイル。書く先は 1 つ */
export function dayFile(place: Place, at: Date): string {
  return join(place.dir, `${dayName(at)}.jsonl`);
}

/** 日のファイルの名前だけを拾う（`delivered.json` などの一覧は拾わない） */
const DAY_FILE = /^\d{4}-\d{2}-\d{2}\.jsonl$/;

/**
 * 読む窓の中にあるファイルだけを、新しい順に返す。
 *
 * `days: 2` なら今日と昨日の 2 件。保存場所がなければ `[]`。
 */
export function windowFiles(place: Place, at: Date, days: number): string[] {
  let names: string[];
  try {
    names = readdirSync(place.dir);
  } catch {
    return [];
  }
  const wanted = new Set<string>();
  for (let back = 0; back < days; back += 1) {
    const day = new Date(at);
    day.setDate(day.getDate() - back);
    wanted.add(`${dayName(day)}.jsonl`);
  }
  return names
    .filter((name) => DAY_FILE.test(name) && wanted.has(name))
    .map((name) => join(place.dir, name))
    .toSorted()
    .toReversed();
}

/**
 * 保管の期限を過ぎたファイルだけを返す（起動の掃除が消すもの）。
 *
 * ちょうど `keepDays` 日前の日は残す側（含む側は残す）。
 */
export function oldFiles(place: Place, at: Date, keepDays: number): string[] {
  let names: string[];
  try {
    names = readdirSync(place.dir);
  } catch {
    return [];
  }
  const edge = new Date(at);
  edge.setDate(edge.getDate() - keepDays);
  const threshold = `${dayName(edge)}.jsonl`;
  return names
    .filter((name) => DAY_FILE.test(name) && name < threshold)
    .map((name) => join(place.dir, name))
    .toSorted();
}
