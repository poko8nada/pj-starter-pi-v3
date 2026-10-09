/**
 * @typedef {{ readonly root: string, readonly run: boolean }} PruneArgs
 */

/**
 * 引数を解釈する（純）。
 *
 * @param {readonly string[]} argv `process.argv.slice(2)` の形
 * @returns {PruneArgs}
 */
export function parseArgs(argv) {
  let root = process.cwd();
  let run = false;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--run') {
      run = true;
    } else if (arg === '--root') {
      const value = argv[i + 1];
      if (value === undefined) {
        throw new Error('missing a value for --root');
      }
      root = value;
      i += 1;
    } else if (typeof arg === 'string' && arg.startsWith('--root=')) {
      const value = arg.slice('--root='.length);
      if (value === '') {
        throw new Error('missing a value for --root');
      }
      root = value;
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }
  return { root, run };
}

/**
 * 表示の行を作る（純）。
 *
 * @param {string} label 見出し（`tests` か `cycles`）
 * @param {readonly string[]} targets 消える物
 * @returns {readonly string[]} 表示の行
 */
export function planLines(label, targets) {
  if (targets.length === 0) {
    return [`no ${label} to remove`];
  }
  return [`${label} (${targets.length}):`, ...targets.map((target) => `  ${target}`)];
}
