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
