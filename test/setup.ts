/**
 * テストの環境を、このリポジトリから切り離す。
 *
 * フック（lefthook）の中でテストを走らせると、フックが渡す `GIT_*`（`GIT_INDEX_FILE` など）が
 * そのまま載っている。テストが git を起動すると、`cwd` で指定した一時ディレクトリではなく本体のリポジトリを見てしまい、コミット・タグ・config が本体に書かれる
 * （2026-09-27 に踏んだ。004 でも同じ族の事故が起きている）。
 *
 * ここで 1 か所だけ切っておけば、以後どのテストが git を起動しても本体は汚れない。
 * 範囲は vitest が走らせるテストだけ。手で走らすスクリプトは自分で `gitEnv` を持つ。
 */
import { mkdtempSync } from 'node:fs';
import { devNull, tmpdir } from 'node:os';
import { join } from 'node:path';

// 名前で選ばず一括で落とす。`GIT_CONFIG_COUNT` や `GIT_CONFIG_PARAMETERS` のような
// 見落としやすい物まで含めるため（cli/cli でも同じ罠が記録されている）。
for (const key of Object.keys(process.env)) {
  if (key.startsWith('GIT_')) {
    delete process.env[key];
  }
}

// 利用者の git 設定（グローバル・システム）を読ませない。
process.env.GIT_CONFIG_GLOBAL = devNull;
process.env.GIT_CONFIG_SYSTEM = devNull;

// `HOME` も一時ディレクトリへ。`git` は設定と認証情報をここから探す。
const home = mkdtempSync(join(tmpdir(), 'pi-test-home-'));
process.env.HOME = home;
process.env.XDG_CONFIG_HOME = join(home, '.config');
