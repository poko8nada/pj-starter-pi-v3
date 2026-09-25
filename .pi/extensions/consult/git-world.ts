/**
 * 検査が git を起動するときの「自分の世界」。
 *
 * 004 の事故: `run.test.ts` の fixture は temp の repo を作りながら環境を継承していた。フックが
 * 載せる `GIT_*`（`GIT_DIR` / `GIT_WORK_TREE` / `GIT_INDEX_FILE`）は `cwd` 探索に勝つので、fixture の
 * `git init` / `git config` が実リポジトリに届き、config（`core.bare` / `user.*`）を書き換えた。
 * 世界は継承するものではなく、検査が自分で決めるもの。
 *
 * 本番側の `gitEnv` は「cwd のリポジトリを見る」ためのもの。こちらは検査のためで、`gitEnv` で
 * 継承した `GIT_*` を落としたうえで、置き場（repo / config / `HOME`）を全部自分で置く。
 */

import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { join } from 'node:path';
import { gitEnv } from './run.ts';

/** `repo` と `home` を git の置き場として宣言した環境。`home` は config と `HOME` の置き場 */
export function gitWorld(repo: string, home: string): NodeJS.ProcessEnv {
  return {
    ...gitEnv(process.env),
    GIT_DIR: join(repo, '.git'),
    GIT_WORK_TREE: repo,
    GIT_INDEX_FILE: join(repo, '.git', 'index'),
    GIT_CONFIG_GLOBAL: join(home, 'gitconfig'),
    GIT_CONFIG_SYSTEM: join(home, 'gitconfig-system'),
    GIT_CONFIG_NOSYSTEM: '1',
    HOME: home,
    XDG_CONFIG_HOME: join(home, '.config'),
  };
}

/** `repo` に git を打つ。世界は呼び出しごとにここで決める（継承した環境は使わない） */
export function runInGitWorld(
  repo: string,
  home: string,
  args: readonly string[],
): SpawnSyncReturns<string> {
  return spawnSync('git', [...args], { cwd: repo, encoding: 'utf8', env: gitWorld(repo, home) });
}
