import { readMode, writeMode } from '../harness-state.mjs';
import { labels, plan, remove } from './targets.mjs';
import { modeLine, parseArgs, planLines } from './cli.mjs';

/**
 * cycles を消して状態を `product` にする入口。引数なしは表示だけ、`--run` で実行する。
 *
 * @param {readonly string[]} argv `process.argv.slice(2)` の形
 * @returns {number} 終了コード（0 か 1）
 */
export function main(argv) {
  let args;
  try {
    args = parseArgs(argv);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
  let entries;
  try {
    entries = plan(args.root, args.only);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
  let mode;
  try {
    mode = readMode(args.root);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
  for (const line of [modeLine(mode, 'product'), ...planLines(labels(args.only), entries)]) {
    console.log(line);
  }
  if (!args.run) {
    return 0;
  }
  try {
    remove(entries);
    writeMode(args.root, 'product');
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
  return 0;
}

process.exitCode = main(process.argv.slice(2));
