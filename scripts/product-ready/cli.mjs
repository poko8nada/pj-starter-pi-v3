/**
 * @typedef {{ readonly run: boolean, readonly only: string | undefined }} Args
 * @typedef {{ readonly label: string, readonly verb: 'remove' | 'replace' }} Label
 */

/**
 * 引数を解釈する（純）。
 *
 * @param {readonly string[]} argv `process.argv.slice(2)` の形
 * @returns {Args}
 */
export function parseArgs(argv) {
  let run = false;
  /** @type {string | undefined} */
  let only;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--run') {
      run = true;
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
  return { run, only };
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
 * 表示の行を作る（純）。label ごとに、無ければ `no <label> to <verb>`、あれば見出しと中身を出す。
 *
 * @param {readonly Label[]} labels 出す label（一覧の順）
 * @param {readonly { readonly label: string, readonly at: string, readonly path: string }[]} plan 見つけた物
 * @returns {readonly string[]} 表示の行
 */
export function planLines(labels, plan) {
  const lines = [];
  for (const item of labels) {
    const targets = plan.filter((entry) => entry.label === item.label);
    if (targets.length === 0) {
      lines.push(`no ${item.label} to ${item.verb}`);
    } else {
      lines.push(`${item.label} (${targets.length}):`);
      for (const target of targets) {
        lines.push(`  ${target.at}`);
      }
    }
  }
  return lines;
}
