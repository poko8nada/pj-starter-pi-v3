import { spawnSync } from 'node:child_process';

/**
 * git を起動するときの環境。
 *
 * フック（lefthook など）の中で走ると、`GIT_INDEX_FILE` のような変数が process.env に載っている。そのまま渡すと、`cwd` で指定したリポジトリではなくフックのリポジトリを見てしまう（`.git/index: index file open failed: Not a directory` になった）。git は `cwd` と自分の探索で解決させる。
 *
 * @param {NodeJS.ProcessEnv} [env] @returns {NodeJS.ProcessEnv} `GIT_*` を落としたコピー
 */
export function gitEnv(env = process.env) {
  const cleaned = {};
  for (const [key, value] of Object.entries(env)) {
    if (!key.startsWith('GIT_')) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/**
 * git を起動する唯一の口。`GIT_*` を落とした環境で起動する。
 *
 * @param {string} cwd
 * @param {readonly string[]} args
 * @returns {{ status: number, stdout: string, stderr: string, error?: string }}
 */
export function git(cwd, args) {
  const spawned = spawnSync('git', [...args], { cwd, encoding: 'utf8', env: gitEnv() });
  return {
    status: spawned.status ?? 1,
    stdout: spawned.stdout ?? '',
    stderr: spawned.stderr ?? '',
    ...(spawned.error === undefined ? {} : { error: spawned.error.message }),
  };
}
