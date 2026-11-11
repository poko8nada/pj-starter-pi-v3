/**
 * @typedef {{ readonly run: boolean, readonly only: string | undefined }} Args
 * @typedef {{ readonly label: string, readonly verb: 'remove' | 'replace' }} Label
 */

/**
 * 引数を解釈する（副作用なし）。
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
 * 切り替えの 2 行（副作用なし）。
 *
 * @param {{ readonly exclude: string, readonly config: string }} plan 残る物
 * @returns {readonly string[]} 表示の行
 */
export function switchLines(plan) {
  return [`test-exclude: ${plan.exclude}`, `config: ${plan.config}`];
}

/**
 * 表示の行を作る（副作用なし）。label ごとに、無ければ `no <label> to <verb>`、あれば見出しと中身を出す。見出しがあれば末尾に足す。
 *
 * @param {readonly Label[]} labels 出す label（一覧の順）
 * @param {readonly { readonly label: string, readonly at: string, readonly path: string }[]} plan 見つけた物
 * @param {readonly string[]} [headings] 並べた見出し（空なら行を足さない）
 * @returns {readonly string[]} 表示の行
 */
export function planLines(labels, plan, headings = []) {
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
  if (headings.length > 0) {
    lines.push(`headings: ${headings.join(', ')}`);
  }
  return lines;
}
