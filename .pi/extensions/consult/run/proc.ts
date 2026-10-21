/**
 * 子の pi が生きているかの照合。
 *
 * pid だけでは使い回しに弱い（死んだ pid を別のプロセスが使うと「走っている」に見える）。
 * 開始行の `token` を子の argv に `--name` で渡してあるので、`ps` の出力にその token が
 * 残っているかで見る。`ps` 自体が失敗したときは分からないと言う（`unknown`）。
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

/** 本番の `ps`。幅で切れないように `-ww` を付ける */
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
 * pid が生きていて、その argv に token が残っているか。
 *
 * status 0 で token があれば `running`、無ければ `ended`（pid の使い回し）。
 * status 1 で出力も stderr も無ければ `ended`（pid が無い）。
 * stderr があれば、status に依らず `unknown`。status が 0・1 以外、または null なら `unknown`。
 */
export function checkPid(pid: number, token: string, run: PsRun = defaultRun): Liveness {
  if (!Number.isInteger(pid) || pid <= 0) {
    return 'ended';
  }
  if (token === '') {
    return 'unknown';
  }
  const result = run(['-ww', '-p', String(pid), '-o', 'command=']);
  if (result.stderr !== '') {
    return 'unknown';
  }
  if (result.status === 0) {
    return result.stdout.includes(token) ? 'running' : 'ended';
  }
  if (result.status === 1) {
    return result.stdout === '' ? 'ended' : 'unknown';
  }
  return 'unknown';
}
