import { findTests, removeTests } from './targets.mjs';
import { parseArgs, planLines } from './cli.mjs';

/**
 * 名指しのテスト（targets.mjs の TEST_TARGETS）を消す入口。引数なしは表示だけ、`--run` で実行する。
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
  let targets;
  try {
    targets = findTests(args.root);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
  for (const line of planLines('tests', targets)) {
    console.log(line);
  }
  if (!args.run) {
    return 0;
  }
  try {
    removeTests(args.root, targets);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
  return 0;
}

process.exitCode = main(process.argv.slice(2));
