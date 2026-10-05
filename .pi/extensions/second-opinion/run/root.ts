/**
 * 子の記録の置き場。
 *
 * consult は worktree から root を決めるが、こちらは worktree を持たない。
 * cwd の basename ごとに1つ。時刻は使わない。
 */

import { basename, join } from 'node:path';

/** 記録をまとめる場所 */
export const OPINION_ROOT = '/tmp/pi-consult';

/** 記録の根。`CONSULT_ROOT` があればその下、無ければ既定の下 */
export function opinionRoot(cwd: string, env: NodeJS.ProcessEnv): string {
  const base = env.CONSULT_ROOT ?? OPINION_ROOT;
  return join(base, `second-opinion-${basename(cwd)}`);
}
