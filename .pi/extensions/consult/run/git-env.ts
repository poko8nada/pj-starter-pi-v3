/** 検査が git に使わせる置き場（repo / config / HOME）を自分で決める。環境は継承しない */
import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { join } from 'node:path';
import { gitEnv } from '../../../../lib/git-env.mjs';

/** `repo` と `home` を置き場として決めた環境を返す。`home` は config と `HOME` の置き場 */
export function gitEnvFor(repo: string, home: string): NodeJS.ProcessEnv {
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

/** `repo` に git を打つ。置き場は呼び出しごとに決める（継承した `GIT_*` は使わない） */
export function runGit(
  repo: string,
  home: string,
  args: readonly string[],
): SpawnSyncReturns<string> {
  return spawnSync('git', [...args], { cwd: repo, encoding: 'utf8', env: gitEnvFor(repo, home) });
}
