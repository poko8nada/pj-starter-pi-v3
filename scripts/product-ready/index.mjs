import * as fs from 'node:fs';
import * as path from 'node:path';
import { labels, plan, remove } from './targets.mjs';
import { parseArgs, planLines, switchLines } from './cli.mjs';

const STARTER_FLAG = ' --config vitest.starter.config.ts';
const STARTER_CONFIG_AT = 'vitest.starter.config.ts';
const TARGET_SCRIPTS = ['test', 'test:run', 'test:related'];

/**
 * cycles を消し、`test*` の flag を外し、`vitest.starter.config.ts` を消す入口。引数なしは表示だけ、`--run` で実行する。
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
  const packageFile = path.join(args.root, 'package.json');
  let packageText;
  try {
    packageText = fs.readFileSync(packageFile, 'utf8');
  } catch (_unused) {
    console.error(`no such file: ${packageFile}`);
    return 1;
  }
  let packageData;
  try {
    packageData = JSON.parse(packageText);
  } catch (_unused) {
    console.error(`the package.json is not valid JSON: ${packageFile}`);
    return 1;
  }
  const scripts =
    typeof packageData === 'object' &&
    packageData !== null &&
    typeof packageData.scripts === 'object'
      ? packageData.scripts
      : {};
  /** @type {string[]} */
  const flagged = [];
  for (const name of TARGET_SCRIPTS) {
    const value = scripts !== null && typeof scripts === 'object' ? scripts[name] : undefined;
    if (typeof value === 'string' && value.includes(STARTER_FLAG)) {
      flagged.push(name);
    }
  }
  const configExists = fs.existsSync(path.join(args.root, STARTER_CONFIG_AT));
  for (const line of [
    ...switchLines({ config: configExists, scripts: flagged }),
    ...planLines(labels(args.only), entries),
  ]) {
    console.log(line);
  }
  if (!args.run) {
    return 0;
  }
  try {
    remove(entries);
    if (typeof packageData === 'object' && packageData !== null) {
      const nextScripts =
        typeof packageData.scripts === 'object' && packageData.scripts !== null
          ? { ...packageData.scripts }
          : {};
      for (const name of flagged) {
        const value = nextScripts[name];
        if (typeof value === 'string') {
          nextScripts[name] = value.replaceAll(STARTER_FLAG, '');
        }
      }
      packageData = { ...packageData, scripts: nextScripts };
      fs.writeFileSync(packageFile, `${JSON.stringify(packageData, null, 2)}\n`);
    }
    if (configExists) {
      fs.rmSync(path.join(args.root, STARTER_CONFIG_AT), { force: true });
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
  return 0;
}

process.exitCode = main(process.argv.slice(2));
