/**
 * consult の delivery — 子の完了を、いま生きているセッションへ届ける 1 本の通り道。
 *
 * pi のプロセスは reload で差し替わる（拡張のインスタンスも作り直される）。子は detach されて
 * 生き続けるので、完了の知らせを「もう居ない pi」へ渡すと落ちる。ここで 1 本にまとめ、古い配線は
 * no-op にして記録へ回す。新しいセッションはその記録（`notice` の欄）を起動の時に読む。
 *
 * `attach` はセッションごとに 1 回。`detach` の後に新しいインスタンスが `attach` しても、**古い
 * インスタンスの `send` は古いまま**（no-op + 記録）になる。掴んでいる pi はインスタンスごとに違うため。
 *
 * まだ渡していない通知の印（目録）は、追記のみの記録の外にある 1 ファイル `delivered.json` に持つ。
 * 形は `{ <session>: { ended: <配達済みの終わりの時刻（ms）> } }`。目録は配達の後に進めるので、
 * 途中で落ちても失われない（同じ物を 2 回渡すことはある）。
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ConsultMessage, ConsultSendOptions, PiFace } from '../tool/consult.ts';
import { appendRun, readRuns, type ReadScope, type RunRecord } from './log.ts';
import type { Place } from './place.ts';

/** 完了の知らせ 1 つ。pi に渡す形と、記録に回すときの元 */
export interface Delivery {
  /** いまのセッションの pi を掴む。新しいインスタンスがこれを呼ぶ */
  attach(pi: PiFace): void;
  /** 手放す。以後の `send` は記録だけになる（セッションの終わりに呼ぶ） */
  detach(): void;
  /** 子の完了を届ける。掴んでいる pi が無ければ、記録に 1 行足す */
  send(message: ConsultMessage, options: ConsultSendOptions, record: RunRecord): void;
  /** いま届けられるか（テストと、状態を出す所のため） */
  attached(): boolean;
}

/** 配達済みの印。session ごとに、最後に渡した通知の終わりの時刻を持つ */
export interface Cursor {
  readonly ended: number;
}

/** 目録のファイル。置き場の直下（日に割らない） */
export const CURSOR_FILE = 'delivered.json';

/** 目録の中身。session id から欄を引く */
type CursorIndex = Record<string, Cursor>;

/** 素の object を、欄だけを持つ枠として見る（`log.ts` の `asFields` と同じ形） */
function asFields(raw: unknown): Record<string, unknown> {
  return typeof raw === 'object' && raw !== null ? { ...raw } : {};
}

/**
 * 目録を読む。無い・壊れている（JSON でない・形が違う）ときは空。
 *
 * 空を返すと「未読が全部ある」側に倒れる（配達は失うより 2 回渡す方を選ぶ）。
 */
function readIndex(place: Place): CursorIndex {
  let text: string;
  try {
    text = readFileSync(join(place.dir, CURSOR_FILE), 'utf8');
  } catch {
    return {};
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return {};
  }
  const index: CursorIndex = {};
  for (const [session, value] of Object.entries(asFields(parsed))) {
    const ended = asFields(value).ended;
    if (typeof ended === 'number') {
      index[session] = { ended };
    }
  }
  return index;
}

/** 目録を書く。置き場が無ければ作る */
function writeIndex(place: Place, index: CursorIndex): void {
  mkdirSync(place.dir, { recursive: true });
  writeFileSync(join(place.dir, CURSOR_FILE), JSON.stringify(index));
}

/** その session が最後に渡した時刻。欄が無ければ undefined（未読は全部） */
export function readCursor(place: Place, session: string): Cursor | undefined {
  return readIndex(place)[session];
}

/** その session の欄を進める。他の session の欄は触らない */
export function writeCursor(place: Place, session: string, cursor: Cursor): void {
  const index = readIndex(place);
  index[session] = cursor;
  writeIndex(place, index);
}

/**
 * 古い欄を消す。`ended` が `at` から `keepDays` 日より前の session の欄を落とす。
 *
 * 残す側（ちょうど `keepDays` 日前）は消さない。目録に欄が残っていても、記録が窓の外に行けば
 * 未読にはならないので、これは置き場を小さく保つ掃除でしかない。
 */
export function pruneCursors(place: Place, at: Date, keepDays: number): void {
  const index = readIndex(place);
  const threshold = at.getTime() - keepDays * 24 * 60 * 60 * 1000;
  let changed = false;
  for (const [session, cursor] of Object.entries(index)) {
    if (cursor.ended < threshold) {
      delete index[session];
      changed = true;
    }
  }
  if (changed) {
    writeIndex(place, index);
  }
}

/**
 * まだ owner に渡していない完了の知らせを、古い順に返す。
 *
 * 記録のうち `notice` を持つ行（届け先が無かったときの報告）だけ。目録の `ended` と同じか古い物は
 * 渡し済みなので返さない。目録が無ければ全部返す（失うより 2 回渡す方を選ぶ）。
 */
export function unreadNotices(
  place: Place,
  scope: ReadScope & { readonly session: string },
): RunRecord[] {
  const cursor = readCursor(place, scope.session);
  return readRuns(place, scope).filter((record) => {
    if (record.notice === undefined || record.ended === undefined) {
      return false;
    }
    return cursor === undefined || record.ended > cursor.ended;
  });
}

/**
 * delivery を作る。
 *
 * 置き場は runtime の入力として渡す（起動しただけで作らない。`placeFor` は決めるだけ）。
 * 記録へ回すのは、届け先が消えたとき（reload のあと）だけ。目録は `send` では進めない
 * （進めるのは、通知を渡すループが終わった所で 1 回だけ）。
 */
export function createDelivery(place: Place): Delivery {
  let pi: PiFace | undefined;

  return {
    attach(next) {
      pi = next;
    },
    detach() {
      pi = undefined;
    },
    attached() {
      return pi !== undefined;
    },
    send(message, options, record) {
      if (pi === undefined) {
        // 届け先が無い。落とさず、記録に回す（新しいセッションが読む）
        appendRun(place, { ...record, notice: message.content });
        return;
      }
      pi.sendMessage(message, options);
    },
  };
}
