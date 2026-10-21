/**
 * 子の pi が生きているかの照合。
 *
 * pid だけでは使い回しに弱い（死んだ pid を別のプロセスが使うと「走っている」に見える）。
 * 開始行の `startToken`（起動時の `ps -p <pid> -o lstart=` の出力）と、いまの `lstart` が
 * 完全一致すれば生きている。`ps` 自体が失敗したときは分からないと言う（`unknown`）。
 */

import { spawnSync } from 'node:child_process';

/** 生死の判定。分からないときは `unknown`（閉じる側が終わり行を書く） */
export type Liveness = 'running' | 'ended' | 'unknown';

/** `ps` 1 回分の出力。テストが差し替える口 */
export type PsRun = (args: readonly string[]) => {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
};

/** 本番の `ps`。`lstart` は 28 桁に詰められ、幅で切れないので `-ww` は付けない */
function defaultRun(args: readonly string[]): {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
} {
  const result = spawnSync('ps', [...args], { encoding: 'utf8' });
  return {
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

/**
 * 子の起動時刻の文字列を読む。
 *
 * `ps -p <pid> -o lstart=` の出力を前後の空白を落として返す。pid が無い、stderr がある、status が 0 でないときは `undefined`。
 */
export function readStartToken(pid: number, run: PsRun = defaultRun): string | undefined {
  if (!Number.isInteger(pid) || pid <= 0) {
    return undefined;
  }
  const result = run(['-p', String(pid), '-o', 'lstart=']);
  if (result.stderr !== '') {
    return undefined;
  }
  if (result.status !== 0) {
    return undefined;
  }
  const token = result.stdout.trim();
  return token === '' ? undefined : token;
}

/**
 * pid が生きていて、起動時刻が `startToken` と一致するか。
 *
 * status 0 で `lstart` が一致すれば `running`、違えば `ended`（pid の使い回し）。
 * status 1 で出力も stderr も無ければ `ended`（pid が無い）。
 * stderr があれば、status に依らず `unknown`。status が 0・1 以外、または null なら `unknown`。
 */
export function checkPid(pid: number, startToken: string, run: PsRun = defaultRun): Liveness {
  if (!Number.isInteger(pid) || pid <= 0) {
    return 'ended';
  }
  if (startToken === '') {
    return 'unknown';
  }
  const result = run(['-p', String(pid), '-o', 'lstart=']);
  if (result.stderr !== '') {
    return 'unknown';
  }
  if (result.status === 0) {
    return result.stdout.trim() === startToken ? 'running' : 'ended';
  }
  if (result.status === 1) {
    return result.stdout.trim() === '' ? 'ended' : 'unknown';
  }
  return 'unknown';
}
