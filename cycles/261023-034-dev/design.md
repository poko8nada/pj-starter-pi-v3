# DESIGN 034

## Affected

### 01: git を起動する保証をテストからコードへ移し、実 git のテストとテストの足場をやめるか

- 結果を読む:
  - `.pi/skills/adr/scripts/scaffold.mjs` — `gitEnv()` を呼ぶ。
  - `.pi/extensions/consult/run/subagent.ts` — `gitEnv()` と run の型を使う。
  - `.pi/extensions/consult/tool/commit.ts` — `GitRun` と worktree 検索を使う。
  - `.pi/extensions/consult/tool/consult.ts` — run の関数と worktree 検索を使う。
  - `.pi/extensions/consult/tool/render.ts` — `RunResult` 等の型を使う。
  - `.pi/extensions/consult/tool/worktree.ts` — worktree の作成・一覧・削除を使う。
  - `.pi/extensions/consult/index.ts` — worktree の一覧・掃除を使う。
  - `.pi/extensions/consult/tool/commit.test.ts` — `GitRun` 型を使う。
  - `.pi/extensions/consult/run/log.ts` — `run.ts` の型 `SubagentState` を読む。
  - `.pi/extensions/consult/run/subagent.test.ts` — `worktree.ts` の型 `Worktree` を読み、`run.ts` を mock する。
  - `vitest.starter.config.ts` — `testConfig()` を読む。
  - `scripts/harness/config.test.ts` — `testConfig()` を読む。
  - `scripts/harness/list.mjs` — 一覧を読む。
  - `scripts/harness/index.mjs` — 一覧を読む。
  - `scripts/product-ready/targets.test.ts` — `tmpDir()` を使う。
  - `scripts/product-ready/index.test.ts` — `tmpDir()` を使う。
  - `scripts/checks/typecheck.test.ts` — `tmpDir()` を使う。
  - `scripts/checks/typecheck-staged.test.ts` — `tmpDir()` を使う。
  - `scripts/harness/list.test.ts` — `tmpDir()` を使う。
  - `scripts/harness/index.test.ts` — `tmpDir()` を使う。
  - `.pi/skills/adr/scripts/scaffold.test.ts` — `tmpDir()` を使う。
  - `.pi/extensions/consult/tool/subagents.test.ts` — `tmpDir()` を使う。
  - `.pi/extensions/consult/tool/consult.test.ts` — `tmpDir()` を使う。
  - `.pi/extensions/consult/policy/types.test.ts` — `tmpDir()` を使う。
  - `.pi/extensions/consult/index.test.ts` — `tmpDir()` を使う。
  - `.pi/extensions/consult/run/delivery.test.ts` — `tmpDir()` を使う。
  - `.pi/extensions/consult/run/log.test.ts` — `tmpDir()` を使う。
  - `.pi/extensions/consult/run/place.test.ts` — `tmpDir()` を使う。
  - `.pi/extensions/consult/sub/guard.test.ts` — `tmpDir()` を使う。
  - `.pi/extensions/context-prune/command/prune.test.ts` — `tmpDir()` を使う。
  - `.pi/extensions/context-prune/prune/ports.test.ts` — `tmpDir()` を使う。
  - `.pi/extensions/context-prune/settings/read.test.ts` — `tmpDir()` を使う。
  - `.pi/extensions/context-prune/index.test.ts` — `tmpDir()` を使う。
  - `.pi/extensions/thinking-scrub/index.test.ts` — `tmpDir()` を使う。
  - `.pi/extensions/thinking-scrub/settings/read.test.ts` — `tmpDir()` を使う。
  - `.pi/extensions/quality-gate/checks.test.ts` — `tmpDir()` を使う。
  - `.pi/extensions/quality-gate/targets.test.ts` — `tmpDir()` を使う。
- 検査する:
  - `scripts/harness/config.test.ts` — `setupFiles` と除外を検証する。
  - `scripts/harness/list.test.ts` — 一覧の読みと除外生成を検証する。
  - `scripts/harness/index.test.ts` — 一覧を使った往復を検証する。
- 生成される:
  - `なし`

## External

### 01: git を起動する保証をテストからコードへ移し、実 git のテストとテストの足場をやめるか

- `git` コマンド — `worktree.ts`、`run.ts`、`run/git-env.ts`、`scaffold.mjs` で `spawnSync('git', ...)` として起動する。変更は起動口を `lib/` の 1 関数にまとめ、3 か所を通す。
- `GIT_*` 環境変数 — `GIT_DIR`、`GIT_WORK_TREE`、`GIT_INDEX_FILE`、`GIT_CONFIG_GLOBAL`、`GIT_CONFIG_SYSTEM`、`GIT_CONFIG_NOSYSTEM`。`lib/git-env.mjs` が `GIT_` で始まるキーを落とし、`run/git-env.ts` が固定値を設定し、`test/setup.ts` がプロセス環境から削除する。変更はコード側の除去を残し、テスト側の切断と `setupFiles` を外す。
- `HOME`、`XDG_CONFIG_HOME` — `test/setup.ts` が一時ディレクトリに逃がし、`run/git-env.ts` が `home` 引数に固定する。変更は前者を削除する。
- ファイルシステムの一時領域と `/tmp/pi-consult` — `worktree.ts` の `CONSULT_ROOT`、`test/tmp.ts` の `mkdtempSync(join(tmpdir(), 'pi-test-'))`、`test/setup.ts` の `pi-test-home-`。変更は `test/tmp.ts` を `test/temp-dir.ts` に改名して接頭辞を呼び出し側に渡せるようにし、`test/setup.ts` の隔離を削除する。
- lefthook のフック環境 — `GIT_INDEX_FILE` などを継承させる元。`lib/git-env.mjs`、`test/setup.ts`、`consult/README.md:178,248` に記録がある。変更は継承経路の対処をコード側の 1 関数に集約し、テスト側の対処を削除する。

## `single-git-spawn`

### ADR & Where

- No: 01
- Why: コード・テスト・足場が「git 起動の保証をどこに置くか」という同じ入力に乗るので、分けると片方だけでは緑にならず、待つ plan も無い。
- Where: worktree

### Summary

- git を起動する口を `lib/git-env.mjs` の 1 関数にまとめ、`worktree.ts`、`run.ts`、`scaffold.mjs` を通す。`gitEnv()` の適用を、書く人が忘れ得る規約から、その関数を通らないと起動できない形へ変える。
- 実 git を起動する 2 つのテストを、`GitRun` 型の偽物で書いた論理のテストへ置き換える。テスト専用の `run/git-env.ts` を消す。
- 直下の `test/` から `setup.ts`、`env.test.ts`、`README.md` を消し、`tmp.ts` を `temp-dir.ts` に改名して `tempDir(prefix = 'test-')` にする。`vitest.config.ts` の `setupFiles`、`harness.json` の `copy`、consult の README の該当記述を合わせる。

### Paths

- `lib/git-env.mjs`
- `.pi/extensions/consult/run/worktree.ts`
- `.pi/extensions/consult/run/run.ts`
- `.pi/skills/adr/scripts/scaffold.mjs`
- `.pi/extensions/consult/run/worktree.test.ts`
- `.pi/extensions/consult/tool/worktree.test.ts`
- `.pi/extensions/consult/run/git-env.ts`
- `test/setup.ts`
- `test/env.test.ts`
- `test/README.md`
- `test/temp-dir.ts`
- `.pi/skills/adr/scripts/scaffold.test.ts`
- `.pi/extensions/consult/policy/types.test.ts`
- `.pi/extensions/consult/sub/guard.test.ts`
- `.pi/extensions/consult/run/delivery.test.ts`
- `.pi/extensions/consult/run/log.test.ts`
- `.pi/extensions/consult/run/place.test.ts`
- `.pi/extensions/consult/index.test.ts`
- `.pi/extensions/consult/tool/consult.test.ts`
- `.pi/extensions/consult/tool/subagents.test.ts`
- `.pi/extensions/consult/README.md`
- `.pi/extensions/context-prune/command/prune.test.ts`
- `.pi/extensions/context-prune/index.test.ts`
- `.pi/extensions/context-prune/prune/ports.test.ts`
- `.pi/extensions/context-prune/settings/read.test.ts`
- `.pi/extensions/quality-gate/checks.test.ts`
- `.pi/extensions/quality-gate/targets.test.ts`
- `.pi/extensions/thinking-scrub/index.test.ts`
- `.pi/extensions/thinking-scrub/settings/read.test.ts`
- `scripts/checks/typecheck.test.ts`
- `scripts/checks/typecheck-staged.test.ts`
- `scripts/harness/config.test.ts`
- `scripts/harness/harness.json`
- `scripts/harness/index.test.ts`
- `scripts/harness/list.test.ts`
- `scripts/product-ready/index.test.ts`
- `scripts/product-ready/targets.test.ts`
- `vitest.config.ts`

### Boundary

- Plans: なし
- External:
  - `git` コマンド: 起動口を 1 つにまとめ、argv・cwd・exit code・stdout・stderr をそこだけで扱う。
    - Contract: `git` が PATH にある。`GIT_*` を落とした環境で起動する。
  - `GIT_*` 環境変数: 継承を落とす。落とす場所は `lib/git-env.mjs` の 1 か所だけになる。
    - Env: `GIT_` で始まるキーはすべて落とす。
  - `HOME`、`XDG_CONFIG_HOME`: テスト側の隔離を削除する。
    - Contract: テストは git を起動しないので、以後この隔離は要らない。破るテストを書かないことが前提。
  - ファイルシステムの一時領域: `tempDir()` は `os.tmpdir()` の下に、呼び出し側の接頭辞で作る。
    - Path: OS の一時領域。リポジトリの中には作らない。既定の接頭辞は `test-`。
  - lefthook のフック環境: テストが git を起動しなくなるので、`GIT_*` の継承経路が消える。
    - Env: フックは `GIT_INDEX_FILE` などを渡すが、テストは git を起動しない。
