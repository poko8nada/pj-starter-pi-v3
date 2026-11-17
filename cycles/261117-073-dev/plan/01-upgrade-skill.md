# PLAN `upgrade-skill`

- No: 01, 02, 03, 04, 05, 06
- Place: worktree
- Boundary Plans: なし

## Goal

upgrade スキルが、土台の確認・トライアル・監査の報告と、具体化したチェックを持つ、矛盾のない 9 段階の手順になる。

## Refactor

- Inside:
  - Modules: `references/audit.md` を新しいモジュールとして足す。監査の報告は、パッケージの報告（`report.md`）とは別の形で、`SKILL.md` の監査の段階から参照する。`SKILL.md` の手順を 7 から 9 に組み直す。
  - Dirs: なし。
- Outside:
  - Extract: なし（`audit.md` の `Rules` は `report.md` と同じ考え方だが、別の文書で、共有するモジュールではない）。
  - Colocate: なし。

## Files

```text
.pi/
  extensions/
    consult/
      run/
        run.ts
        subagent.ts
        worktree.ts
      sub/
        budget.ts
        guard.ts
      tool/
        consult.ts
        worktree.ts
      index.ts
      README.md
      types.json
  skills/
    adr/
      references/
        tasks.md
      SKILL.md
    upgrade/
      references/
        audit.md        add
        report.md       update
        tasks.md        update
      SKILL.md          update
    work/
      SKILL.md
scripts/
  checks/
    ja-check.json
    typecheck.mjs
  harness-sync/
    setting.json
.oxfmtrc.json
.oxlintrc.json
lefthook.yaml
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
README.ja.md
README.md
ROADMAP.md
vitest.config.ts
```

## Slices

## 1.手順全体の組み直し

`SKILL.md` の手順を、7 段階から 9 段階に組み直す。

### Types

なし

### Steps

1. `.pi/skills/upgrade/SKILL.md`
   1. update: `## Procedure` の 7 つの見出しを、下のフェンスの 9 つの見出し（`### 1. Check the ground` から `### 9. Audit, and stop`）に組み直す。
   2. update: 現在の段階の本文を、次の対応で移す（1→2、2→3、3→4、4→5、5→7、6→8、7→9）。新しい 1 と 6 は、このスライスではテンプレート（下のフェンス）を置き、スライス 2 と 4 が本文を詳しくする。2、8、9 の「Run the checks, then commit」は、スライス 6 の commit として保つ。
   3. update: `references/report.md` を新しい 5、`references/tasks.md` を新しい 4 と 6、`references/audit.md` を新しい 9 に置く。
   4. update: 移り方を段階の名前で書き、`step 2` のような順番名を外す。

      ```text
      ### 1. Check the ground
      - Ask the owner whether to check. When skipped, go on to the update.
      - Read `packageManager`, `engines.node`, `node --version`, `pnpm --version`.
      - Run one research subagent for the sources.
      - Write the results in the report's `Ground`.

      ### 2. Update inside the range
      - Check that `git status --porcelain` is empty. When it is not, stop.
      - Run `pnpm update`.
      - Run the checks, then commit.
      - On a red check, restore and report.

      ### 3. Find what is out of range
      - Run `pnpm outdated --json`.
      - Read the number from `pnpm-workspace.yaml`.

      ### 4. Look each package up, all at once
      - Run one research subagent per package, with the files the rule names.
      - Wait for all of them.

      ### 5. Report, and stop
      - Write the package report in the shape `references/report.md` gives, and put it as markdown in the chat.
      - The owner picks the packages and the order.
      - Wait for the owner's answer.

      ### 6. Try the update in a worktree
      - When any picked package has a breaking change, try all the picked packages in one worktree.
      - When the trial fails, do not apply; report and let the owner decide.
      - Remove the worktree.

      ### 7. Apply one package at a time
      - Apply, run the checks, and commit.
      - On a red check, restore and report.

      ### 8. Keep the configuration true
      - Clean `minimumReleaseAgeExclude`, `overrides`, `allowBuilds`.
      - Run the checks, then commit.
      - On a red check, restore and report.

      ### 9. Audit, and stop
      - Run the audit, write the audit report in the shape `references/audit.md` gives, run `--fix=update`, run the checks and audit again.
      - Take `override` and `ignore` with the owner's OK, then commit.
      - Work ends when the owner reads the leftovers and says they are as expected.
      ```

### Policy

- Allowed:
  - 段階の順序は、土台、更新、範囲外の発見、調査、報告、トライアル、適用、設定、監査である。
- Forbidden:
  - 段階を飛ばして先へ進むこと - 停止点とスキップの条件を守る。
  - 停止点を、報告と監査の 2 つ以外に増やすこと - オーナーの判断は 2 つに絞る。

### Verify

- Always:
  - `pnpm test:run`（変わった `.md` に関連するテストはない）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、そこで名を挙げるファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added:
  - Other: `grep '^### [0-9]' .pi/skills/upgrade/SKILL.md` が 9 行を返す。`grep '^### 1\. Update inside the range' .pi/skills/upgrade/SKILL.md` が 0 行を返し、`grep '^### 2\. Update inside the range' .pi/skills/upgrade/SKILL.md` が 1 行を返す。

## 2.土台の確認

`SKILL.md` の先頭に、土台を確かめる段階を足し、`report.md` と `tasks.md` を合わせる。

### Types

なし

### Steps

1. `.pi/skills/upgrade/SKILL.md`
   1. update: `## Procedure` の `### 1` の本文（手順全体の組み直しで置いた 4 行のテンプレート）を、下のフェンスの 5 つの手順に置き換える。

      ```text
      1. Ask the owner whether to check the ground. When the owner skips, go on to the update.
      2. Read `packageManager` and `engines.node` in `package.json`.
      3. Read the running versions: `node --version` and `pnpm --version`.
      4. Run one `research` subagent for the ground. It runs before the package research.
      5. Write the results in the report's `Ground`, with the source URL of each.
      ```

2. `.pi/skills/upgrade/references/tasks.md`
   1. add: `## Look one package up` の前に、`## Check the ground` のセクションを足す。

      ```text
      Report the ground the update stands on, and nothing else.

      1. pnpm: the version in `packageManager`. Is there a newer patch in the same minor? Is the version deprecated?
      2. Node: the running version and the range in `engines.node`. Is there a newer patch in the same major? Is the major EOL?
      3. Read the sources:
         - pnpm: `https://registry.npmjs.org/pnpm/<version>`, `https://data.jsdelivr.com/v1/package/npm/pnpm`, `https://api.github.com/repos/pnpm/pnpm/releases`
         - Node: `https://nodejs.org/dist/index.json`, `https://endoflife.date/api/nodejs.json`
      4. Report one line per item, with the value and the source URL.
         - IF a source cannot be read → write `unknown`, and write what stopped it.
      ```

3. `.pi/skills/upgrade/references/report.md`
   1. update: `## Ground` を、パッチ、非推奨、EOL を持つ 2 行にする。

      ```text
      - pnpm <version>: the newest patch in <minor> is <version or none>. <deprecated / not deprecated>. <source URL>
      - Node <version>: the newest patch in <major> is <version or none>. <EOL date / not EOL>. <source URL>
      ```

   2. update: 冒頭を、土台とパッケージが分かった時点で書く、に直す。

      ```text
      What `upgrade` puts in front of the owner once the ground and the out-of-range packages are known. It goes to the chat, not into a file.
      ```

### Policy

- Allowed:
  - 土台の確認は、オーナーがスキップしてよい。
  - 確認は、認証なしの HTTP 取得で行う。
  - 現在のパッチは、`node --version` と `pnpm --version` で読む。
- Forbidden:
  - 確認のために pnpm や Node を更新すること - 更新はグローバルの話で、このスキルの外である。
  - 完全な packument を取得すること - 5MB を超えて取得できない。

### Verify

- Always:
  - `pnpm test:run`（変わった `.md` に関連するテストはない）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、そこで名を挙げるファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added:
  - Other: `.pi/skills/upgrade/SKILL.md` に土台の段階がある。`.pi/skills/upgrade/references/report.md` の `## Ground` が 2 行で、冒頭が `once the ground and the out-of-range packages are known`。`.pi/skills/upgrade/references/tasks.md` に土台のタスクがある。

## 3.チェックと合格条件

`SKILL.md` のチェックを具体化し、`report.md` と `tasks.md` の `Check` を揃える。

### Types

なし

### Steps

1. `.pi/skills/upgrade/SKILL.md`
   1. update: 適用の段階のチェックを、コマンド名と順序にする。

      ```text
      1. `pnpm test:run` exits 0.
      2. `pnpm typecheck` exits 0.
      3. `pnpm lint` exits 0.
      4. `pnpm format:check` exits 0.
      5. The read-through finds no mismatch in a number, a path, a name or a shape.
      ```

   2. update: チェックの並びの直後に、失敗したときの戻しを足す。`<...>` は変数として残す。

      ```text
      1. Restore the files the package's update touched to HEAD (git restore --source=HEAD -- package.json pnpm-lock.yaml <the source it changed>).
      2. Run pnpm install to restore node_modules.
      3. Report the failed check's output and the restored files to the owner, and decide whether to go on to the next package or stop.
      ```

   3. update: 読み合わせで直した後の再実行を足す。

      ```text
      1. After the fix, run all four checks again (pnpm test:run, pnpm typecheck, pnpm lint, pnpm format:check).
      2. When the four pass, commit it. When they do not, follow the undo.
      ```

   4. update: 更新の段階に、`git status --porcelain` が空であることの確認を足す。
2. `.pi/skills/upgrade/references/tasks.md`
   1. add: 現在の 3 の後に、`Check` の 4 を足し、現在の 4 と 5 を 5 と 6 に繰り下げる。

      ```text
      4. For each breaking change that hits, write the check that closes it here in one sentence.
         - IF the check is a command → name the command.
         - IF the check is a read-through → name the file and what to read.
      ```

3. `.pi/skills/upgrade/references/report.md`
   1. update: `Check` を、4 つのコマンドと読み合わせにする。

      ```text
      - Check: pnpm test:run, pnpm typecheck, pnpm lint, pnpm format:check. In addition, read `<file>` and check `<what>`.
      ```

### Policy

- Allowed:
  - チェックは、リポジトリのスクリプト（`pnpm test:run`、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`）をそのまま使う。
- Forbidden:
  - 依存更新のチェックを `pnpm test:related` だけで済ませること - `pnpm-lock.yaml` だけを渡すと関連テストが 0 件になり、依存の影響を見逃す。
  - チェックが赤いまま commit すること - 記録は commit で、赤い commit は記録を汚す。

### Verify

- Always:
  - `pnpm test:run`（変わった `.md` に関連するテストはない）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、そこで名を挙げるファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added:
  - Other: `.pi/skills/upgrade/SKILL.md` のチェックの並びが 5 つ。`.pi/skills/upgrade/references/report.md` の `Check` が 4 つのコマンドと読み合わせ。`.pi/skills/upgrade/references/tasks.md` に `Check` の要求がある。

## 4.トライアル

`SKILL.md` にトライアルの段階を足し、`tasks.md` にタスクを置く。

### Types

なし

### Steps

1. `.pi/skills/upgrade/SKILL.md`
   1. update: `## Procedure` の `### 6` の本文を、下のフェンスの 6 つの手順に置き換える（手順全体の組み直しで置いた 3 行を、詳しくする）。

      ```text
      1. After the owner picks the packages, check whether any of them has a breaking change. When none has, skip the trial and go on to the apply. When at least one has, try all the picked packages in one worktree.
      2. Make one worktree for the trial: `consult_worktree new upgrade-trial`.
      3. The worktree's install runs before the subagent: `pnpm install --frozen-lockfile`.
      4. Hand the trial subagent the packages and the trial task. The task text is in `tasks.md`.
      5. When the trial reports, read it.
      6. Remove the worktree: `consult_worktree remove upgrade-trial` with `force`.
      7. Go on to the apply. When the trial failed, do not apply; report and let the owner decide.
      - When the trial subagent stops at the turn limit:
        - IF its report says the trial is going well → continue the same subagent.
        - IF its report says something cannot be resolved → treat it as a failure.
      - The owner decides: narrow the trial to a subset, or open a cycle.
      ```

2. `.pi/skills/upgrade/references/tasks.md`
   1. add: `## Look one package up` の後に、`## Try the update in a worktree` のセクションを足す。

      ```text
      Try the update in this worktree, and report what it changes.

      1. Apply the packages: `pnpm update --latest <package>` for each.
      2. Run the checks: `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`.
      3. Report the resolved versions, the failed check and its output, and the smallest change that makes it pass.
      4. Leave the worktree as it is. Do not commit.
      ```

### Policy

- Allowed:
  - 1 つでも壊れる変更があれば、選んだ全てのパッケージを 1 つのトライアルでまとめて試す。
  - トライアルの worktree は、オーナーが同意した場所に作る。
- Forbidden:
  - トライアルが通る前に、レポへ適用すること - 通らない手順をレポに入れない。
  - トライアルの worktree を残すこと - 記録は報告で、worktree は道具である。

### Verify

- Always:
  - `pnpm test:run`（変わった `.md` に関連するテストはない）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、そこで名を挙げるファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added:
  - Other: `.pi/skills/upgrade/SKILL.md` のトライアルの段階が、`consult_worktree new/remove`、`pnpm install --frozen-lockfile`、6 つの手順、turn 上限の分岐、絞るかサイクルかの分岐を持つ。`.pi/skills/upgrade/references/tasks.md` にトライアルのタスクがある。

## 5.監査の報告

`references/audit.md` を作り、`SKILL.md` の監査の段階を、その形の報告にする。

### Types

なし

### Steps

1. `.pi/skills/upgrade/references/audit.md`
   1. add: 監査の報告の形を作る。

      ```text
      # Audit report (<YYYY-MM-DD>)

      ## Ground

      - `pnpm audit --audit-level low`: <the exit code, and what it means>.
      - The advisories at or above `low`: <n>.

      ## List

      | # | Advisory | Severity | Package | Vulnerable | Patched | Paths |
      | - | -------- | -------- | ------- | ---------- | ------- | ----- |

      ## Each advisory

      ### <n>. `<GHSA>` <title>

      - Severity: <severity>
      - Package: <name> <vulnerable versions>
      - Patched: <patched versions, or none>
      - Paths: <the paths>
      - Fix: <the command or the override that closes it>
      - Source: <URL>

      ## What to decide

      - which advisories to close with `overrides`
      - which to ignore with `audit.ignore`, and why

      ## Leftovers

      - <the advisories that remain, and why>

      ## Rules

      - Every fact carries its URL.
      - Write a number only when it was measured.
      - A file name is written from the project root.
      ```

2. `.pi/skills/upgrade/SKILL.md`
   1. update: 監査の段階を、`references/audit.md` を参照する形にする。

      ```text
      1. Run `pnpm audit --audit-level low`.
      2. Write the report in the shape `references/audit.md` gives, from `pnpm audit --json`'s `advisories` and `metadata`, with the failure in `Ground` or `Leftovers`, and put it as markdown in the chat.
      3. Run `pnpm audit --fix=update` once with leftovers.
      4. Run the checks and audit again.
      5. Take the `override` method (`--fix=override`), `--ignore` and `--ignore-unfixable` only with the owner's OK.
      6. The work ends when the owner reads the leftovers and says they are as expected.
      ```

### Policy

- Allowed:
  - `pnpm audit --audit-level low` をそのまま使う。
  - 監査の報告はチャットに出す。
  - `overrides` と `audit.ignore` は、オーナーの OK で使う。
- Forbidden:
  - 監査から助言が消えたと確かめる前に、助言を閉じたと言うこと - 監査の結果が先である。
  - `--fix` と `--ignore` を同じ監査で使うこと - 何が消えたか分からなくなる。
  - 監査の段階を上げ下げすること - 段階は `low` で固定である。

### Verify

- Always:
  - `pnpm test:run`（変わった `.md` に関連するテストはない）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、そこで名を挙げるファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added:
  - Other: `.pi/skills/upgrade/references/audit.md` に `# Audit report`、`## Ground`、`## List`、`## Each advisory`、`## What to decide`、`## Leftovers`、`## Rules` がある。`.pi/skills/upgrade/SKILL.md` の監査の段階が `references/audit.md` と `pnpm audit --json` を参照し、`--fix=override` を明示する。

## 6.現行の矛盾点の修正

`SKILL.md` の古い記述を、事実に合わせて直す。

### Types

なし

### Steps

1. `.pi/skills/upgrade/SKILL.md`
   1. update: 範囲外の発見の段階の View を、`wanted`、`latest`、`target` の 3 行にする。

      ```text
      | value    | what it is                                      |
      | -------- | ----------------------------------------------- |
      | `wanted` | the version in the wanted lockfile              |
      | `latest` | the newest one after `minimumReleaseAge`        |
      | target   | the skill's target: the newest stable version at least `minimumReleaseAge` old |
      ```

   2. update: `It is 1440 when it is not there.` を `When it is not there, pnpm's default applies.` に置き換える。
   3. update: 調査の段階の `Hand it the files...` の行を、下のフェンスの 4 項目に置き換える。

      ```text
      1. `package.json`.
      2. `pnpm-workspace.yaml`.
      3. The package's entry in `pnpm-lock.yaml`.
      4. Every tracked file `git grep -l '<the package>'` returns, except `cycles/`.
      ```

   4. update: 適用の段階の Notes から、「resolved が target でない」の重複を外す。
   5. update: 設定の掃除の段階に、3 つの欄と規則を足す。

      ```text
      - `minimumReleaseAgeExclude`: a line is `package@version`, a package name, or a pattern.
        - Keep a `package@version` line only while that version is installed.
        - Keep a package-name or pattern line only while the package is installed.
      - `overrides`: keep a line only while its version is installed.
      - `allowBuilds`: keep a line only while the package is installed.
      ```

   6. update: 範囲外の発見の段階から「Apply with `pnpm update --latest <package>`, never with an explicit version」を外し、適用の段階に移す。

### Policy

- Allowed:
  - 事実と合う記述は、そのまま残す。
- Forbidden:
  - 事実と合う記述を、矛盾として直すこと - 直すと事実とずれる。
  - 事実と合わない記述を、事実のまま残すこと - 矛盾が残る。

### Verify

- Always:
  - `pnpm test:run`（変わった `.md` に関連するテストはない）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、そこで名を挙げるファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added:
  - Other: `.pi/skills/upgrade/SKILL.md` の View が `wanted`、`latest`、`target` の 3 行。`1440` がない。調査のファイルが 4 つ。設定の欄が 3 つ。`pnpm-workspace.yaml` の `minimumReleaseAge: 1440` はプロジェクトの値で、`SKILL.md` の「なければ既定」はフォールバックである。

## Notes

### Cleanup: <what it cleaned>

## Work Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Policy:
- Unproven:
- Noise:
- Doubts:

### Round 2

- Stale:
- Unlisted:
- Gaps:
- Policy:
- Unproven:
- Noise:
- Doubts:

## Acceptance

- Goal:
- Ran:
- Findings:
- Doubts:
