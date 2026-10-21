/**
 * consult の実行記録。
 *
 * 1 回のサブエージェントの起動を 1 行の JSON として置き場（`Place`）の日ごとのファイルに足す。
 * メインエージェントのセッションが reload で差し替わっても、新しいインスタンスはこれを読めば
 * 前のサブエージェントを思い出せる。置き場はリポジトリから決まる固定の場所なので、記憶を持たない。
 *
 * 追記は 1 行単位。途中で落ちても、その前の行は残る。読む側は壊れた行を飛ばす。
 * 読む幅は今日と昨日の 2 ファイル（`RECORD_DAYS`）。掃除は 30 日より古い物を消す。
 */

import { appendFileSync, mkdirSync, readFileSync } from 'node:fs';
import type { SubagentState } from './run.ts';
import { dayFile, windowFiles, type Place } from './place.ts';
import { checkPid, type Liveness } from './proc.ts';

/** 読む窓の日数（今日と昨日） */
export const RECORD_DAYS = 2;

/** 残す日数。起動の掃除がこれより古いファイルを消す */
export const KEEP_DAYS = 30;

/** サブエージェント 1 体の 1 回の記録。終わりの欄は、走っている間は無い */
export interface RunRecord {
  /** pi のセッション id。照合に使うだけ（人が読む物ではない） */
  readonly session: string;
  /** メインエージェントが振った id（`consult-1` など） */
  readonly subagent: string;
  readonly role: string;
  /** worktree の id。ベースで走ったサブエージェント（読むだけ）には無い */
  readonly worktree?: string;
  readonly pid: number;
  /** 子の pi に `--name` で渡した印。`ps` の argv に出る。古い行には無い */
  readonly token?: string;
  /** 始まった時刻（ms） */
  readonly started: number;
  /** 終わった時刻（ms）。走っている間は無い */
  readonly ended?: number;
  readonly state?: SubagentState;
  readonly reason?: string;
  readonly files?: readonly string[];
  readonly turns?: number;
  readonly spend?: string;
  /** 届け先のセッションが無かったときの、完了の知らせ。次に起動したセッションが読む */
  readonly notice?: string;
}

/** 読む幅。`days` を省けば `RECORD_DAYS`、`at` を省けば今日 */
export interface ReadScope {
  readonly session?: string;
  readonly days?: number;
  readonly at?: Date;
}

/** 1 行足す。その日のファイルに書く。置き場のディレクトリが無ければ作る */
export function appendRun(place: Place, record: RunRecord, at?: Date): void {
  const file = dayFile(place, at ?? new Date());
  mkdirSync(place.dir, { recursive: true });
  appendFileSync(file, `${JSON.stringify(record)}\n`);
}

/**
 * 生存確認。
 *
 * シグナル 0 は「送らずに送れるかだけ見る」。投げなければ生きている。権限が無い場合も投げるので、
 * 別のユーザーのプロセスは「死んでいる」と見える（自分のサブエージェントしか見ないので、これで足りる）。
 */
export function pidAlive(pid: number): boolean {
  if (!Number.isInteger(pid) || pid <= 0) {
    return false;
  }
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/** 記録 1 行の生死。テストが差し替える口（`ps` を叩かない） */
export type CheckRecord = (record: RunRecord) => Liveness;

/** 既定の照合。token があれば `ps` の argv、無ければ `pidAlive`（古い行の移行） */
function defaultCheck(record: RunRecord): Liveness {
  if (record.token !== undefined) {
    return checkPid(record.pid, record.token);
  }
  return pidAlive(record.pid) ? 'running' : 'ended';
}

/**
 * 走っているサブエージェントの行か。終わりの行があれば false。`running` だけ true。
 *
 * メインエージェントの記憶ではなく記録で見るので、reload をまたいだサブエージェントにも効く。`check` はテストが差し替える口。
 */
export function isRunning(record: RunRecord, check: CheckRecord = defaultCheck): boolean {
  return record.ended === undefined && check(record) === 'running';
}

/**
 * 1 行を記録にする。壊れた行（JSON でない・形が違う・session が無い）は undefined。
 *
 * 型を書いた枠に 1 回だけ入れてから見る（`any` を各所に持ち回らない）。
 */
export function parseRun(line: string): RunRecord | undefined {
  const text = line.trim();
  if (text === '') {
    return undefined;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return undefined;
  }
  const fields = asFields(parsed);
  const { subagent, role, pid, started, session } = fields;
  if (typeof session !== 'string' || session === '') {
    return undefined;
  }
  if (typeof subagent !== 'string' || typeof role !== 'string' || typeof pid !== 'number') {
    return undefined;
  }
  if (typeof started !== 'number') {
    return undefined;
  }
  return {
    session,
    subagent,
    role,
    pid,
    started,
    ...(typeof fields.worktree === 'string' ? { worktree: fields.worktree } : {}),
    ...(typeof fields.token === 'string' ? { token: fields.token } : {}),
    ...(typeof fields.ended === 'number' ? { ended: fields.ended } : {}),
    ...(isState(fields.state) ? { state: fields.state } : {}),
    ...(typeof fields.reason === 'string' ? { reason: fields.reason } : {}),
    ...(isPaths(fields.files) ? { files: fields.files } : {}),
    ...(typeof fields.turns === 'number' ? { turns: fields.turns } : {}),
    ...(typeof fields.spend === 'string' ? { spend: fields.spend } : {}),
    ...(typeof fields.notice === 'string' ? { notice: fields.notice } : {}),
  };
}

/** 素の object を、欄だけを持つ枠として見る（`sub/spec.ts` の `asEvent` と同じ形） */
function asFields(raw: unknown): Record<string, unknown> {
  return typeof raw === 'object' && raw !== null ? { ...raw } : {};
}

/** 終わり方の 4 つのどれかか */
function isState(value: unknown): value is SubagentState {
  return value === 'done' || value === 'turn-limit' || value === 'error' || value === 'aborted';
}

/** パスの配列か */
function isPaths(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((path) => typeof path === 'string');
}

/** 置き場の窓の中の記録を、始まった順に返す */
export function readRuns(place: Place, scope: ReadScope = {}): RunRecord[] {
  const files = windowFiles(place, scope.at ?? new Date(), scope.days ?? RECORD_DAYS);
  const records: RunRecord[] = [];
  for (const file of files) {
    let text: string;
    try {
      text = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    for (const line of text.split('\n')) {
      const record = parseRun(line);
      if (record === undefined) {
        continue;
      }
      if (scope.session !== undefined && record.session !== scope.session) {
        continue;
      }
      records.push(record);
    }
  }
  return records.toSorted((left, right) => left.started - right.started);
}

/**
 * その session の、走っているサブエージェントの行だけを返す。
 *
 * `readRuns` の窓を `scope` で切り、`isRunning`（既定は token があれば `checkPid`、無ければ `pidAlive`）で生きている物だけにする。
 * 音の述語と、前のセッションのサブエージェントの告知が読む。
 */
export function runningRuns(
  place: Place,
  scope: ReadScope & { readonly session: string },
  check?: CheckRecord,
): RunRecord[] {
  return readRuns(place, scope).filter((record) => isRunning(record, check));
}
