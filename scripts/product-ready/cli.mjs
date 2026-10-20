/**
 * @typedef {{ readonly root: string, readonly run: boolean, readonly only: string | undefined }} Args
 */

/**
 * 引数を解釈する（純）。
 *
 * @param {readonly string[]} argv `process.argv.slice(2)` の形
 * @returns {Args}
 */
export function parseArgs(argv) {
  let root = process.cwd();
  let run = false;
  /** @type {string | undefined} */
  let only;
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
    } else if (arg === '--only') {
      const value = argv[i + 1];
      if (value === undefined) {
        throw new Error('missing a value for --only');
      }
      only = value;
      i += 1;
    } else if (typeof arg === 'string' && arg.startsWith('--only=')) {
      const value = arg.slice('--only='.length);
      if (value === '') {
        throw new Error('missing a value for --only');
      }
      only = value;
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }
  return { root, run, only };
}

/**
 * 切り替えの 2 行（純）。
 *
 * @param {{ readonly config: boolean, readonly scripts: readonly string[] }} plan 残る物
 * @returns {readonly string[]} 表示の行
 */
export function switchLines(plan) {
  /** @type {string[]} */
  const lines = [];
  if (plan.config) {
    lines.push('config: vitest.starter.config.ts');
  } else {
    lines.push('no config to remove');
  }
  if (plan.scripts.length === 0) {
    lines.push('no scripts to change');
  } else {
    lines.push(`scripts: ${plan.scripts.join(', ')}`);
  }
  return lines;
}

/**
 * 表示の行を作る（純）。
 *
 * @param {readonly string[]} labels 出す label（一覧の順）
 * @param {readonly { readonly label: string, readonly at: string, readonly path: string }[]} plan 消える物
 * @returns {readonly string[]} 表示の行
 */
export function planLines(labels, plan) {
  const lines = [];
  for (const label of labels) {
    const targets = plan.filter((entry) => entry.label === label);
    if (targets.length === 0) {
      lines.push(`no ${label} to remove`);
    } else {
      lines.push(`${label} (${targets.length}):`);
      for (const target of targets) {
        lines.push(`  ${target.at}`);
      }
    }
  }
  return lines;
}
