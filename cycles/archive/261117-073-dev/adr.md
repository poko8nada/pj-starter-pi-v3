# ADR 073

## 01: チェックと合格条件

Type: _Full_

### Context

- C1: ロードマップ 035（0.9.7、mid）「upgradeスキルの更新」。意図は、スキル全体を棚卸しし、追加・修正と矛盾・不整合の除去を合わせて行うことにある。全体を書き直すレベルの作業である。サイクルは 6 エントリに分かれた（01 チェックと合格条件、02 土台の確認、03 トライアル、04 監査の報告、05 現行の矛盾点の修正、06 手順全体の組み直し）。
- C2: upgrade スキルはサイクル外で走るルーティンで、その性格は変えない。対象は `SKILL.md`、`references/report.md`、`references/tasks.md`。必要なら reference を増やす。
- C3: いまの手順5のチェックは「test, typecheck, lint, format check」と「build when `package.json` has one」で、`plan` の `Verify` と具体度が違う。オーナーは「今のチェックの方法は書き方が曖昧。planスキルのように具体化」と言った。
- C4: `report.md` は各パッケージに `Check: what closes it` を書かせるが、`tasks.md` の調査タスクは `Check` を要求していない。オーナーは「tasks.md にもチェックを要求するようにしとく。report.md と同じに合わせる」と言った。
- C5: このエントリの合格条件を、03 のトライアルと 04 の監査も使う。オーナーは 01 を先に決める順序に同意した。
- C6: いまの手順5は、チェックが通れば commit、通らなければ Undo する、とだけ書く。Undo が何を指すかは書かれていない。
- C7: このエントリが決める問いは、依存更新のたびに回すチェックはどのコマンドを、どの順で、何を合格とするか、失敗したときは何を戻すか、である。
- C8: このスキルの記録は commit で、停止点は報告と監査である。出所: `.pi/skills/upgrade/SKILL.md:3`

### Research & Trial

- F1: `pnpm test:run` は `vitest run` で、フィルタなしの全テストを対象にする。`passWithNoTests: true` なので、テストが 0 件でも終了コード 0 になる。出所: `package.json:11`, `vitest.config.ts:9-15`
- F2: `pnpm test:related` は `vitest related --run` で、引数のファイルを直接または間接に import するテストを選ぶ。選ばれたテストが 0 件でも `passWithNoTests` により終了コード 0 になる。出所: `package.json:12`, `vitest.config.ts:15`, `node_modules/vitest/dist/chunks/cli-api.De07GUeT.js:10389-10395`
- F3: `test:related` に `package.json` を渡すと、`forceRerunTriggers` の `**/package.json` に一致して全テストが対象になる。`pnpm-lock.yaml` だけを渡すと関連テストは 0 件になる。出所: `node_modules/vitest/dist/chunks/defaults.B1FCaFfh.js:65`, `node_modules/vitest/dist/chunks/cli-api.De07GUeT.js:10384-10386`
- F4: `pnpm typecheck` は `scripts/checks/typecheck.mjs` で、ルートの `tsconfig.json` と `scripts/checks/scopes.json` の各ディレクトリ（`.pi`）の `tsconfig.json` に対し `tsc -p <tsconfig> --noEmit` を実行する。出所: `package.json:17`, `scripts/checks/typecheck.mjs:31-46`, `scripts/checks/scopes.json:1`
- F5: `pnpm typecheck:staged` は、引数に渡したファイルだけを、対応する tsconfig の下で `tsc -p --noEmit` にかける。引数なしなら終了コード 0 になる。出所: `package.json:18`, `scripts/checks/typecheck-staged.mjs:10,36-41`
- F6: `pnpm lint` は `oxlint --deny-warnings` で、パス引数がなければカレントディレクトリを対象にする。`.oxlintrc.json` は correctness を error、suspicious と perf を warn にし、`*.md` などを無視する。出所: `package.json:13`, `.oxlintrc.json:4-11,132`
- F7: `pnpm format:check` は `oxfmt --check` で、パス引数がなければカレントディレクトリを対象にし、ファイルを書き換えない。出所: `package.json:16`, `.oxfmtrc.json:3-13`
- F8: quality-gate は、変更されたファイルに対して `lint:fix`、`format`、`lint`、`typecheck:staged` をこの順で実行する。テストと `format:check` は含まない。出所: `.pi/extensions/quality-gate/gate/checks.ts:31-56,138-149`
- F9: lefthook の pre-commit は `format`、`lint`、`typecheck:staged`、`test:related`、`ja-check` を並列で実行し、pre-push は `pnpm typecheck` と `pnpm test:run` を実行する。出所: `lefthook.yaml:3-36`
- F10: plan の `Verify` の `Always` は、関連テスト（`pnpm test:related <changed files>`、関連がなければ `pnpm test:run`）、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`、変更ファイルと、そこで名を挙げるファイルとの読み合わせ、を要求する。出所: `.pi/skills/plan/references/format.md:195-220`
- このリポジトリの `package.json` に build スクリプトはない。出所: `package.json:5-20`
- `pnpm audit` は上記のチェックにも lefthook にも含まれない。出所: `.pi/skills/upgrade/SKILL.md:101-119`, `lefthook.yaml:3-36`

### Scope

- In:
  - failure: チェックが失敗したときの扱い（何を戻し、どこで止めるか）を決める。
  - structure: チェックの一覧と順序を手順の中の 1 つの並びとして決め、`tasks.md` と `report.md` の `Check` の位置を決める。
  - logic: どのコマンドを、どの順で、何を合格とするかの規則を決める。
  - downstream: `report.md` の `Check` と、`tasks.md` の調査タスクの `Check` 要求を、このエントリの合格条件に合わせる。
  - cost: `test:run` と `test:related` のどちらを回すかで、時間とトークンが変わる。その選択を決める。
  - expression: 適用の段階のチェックの文言を、コマンド名で書き直す。
  - verification: 依存更新の正しさを確かめる手段そのものを決める。
- Out:
  - safety: 秘密・権限・公開・個人データに触れない。
  - upstream: 外部のパッケージや契約の追加・更新・削除はない。
  - result: チェックの結果として出るものの種類は変えない（コマンドの出力と合否は同じ種類）。
  - existing: 既存のデータ・インストール済みのバージョン・配布済みの文書・過去の記録の移行はない。
  - observability: 監査記録は変えない（報告の `Check` 行は `downstream` で扱う）。
  - release: 公開・配布・適用・ロールバックの仕組みは変えない。
  - other: ほかに当たる懸念はない。

### Decision

- Status: **accepted**
- Main: 依存更新のチェックが、コマンド名と順序を持つ 1 つの並びになり、失敗したときに何を戻すかまで決まる。（C1, C2, C7）
  - Add:
    - 更新を始める前に、ツリーがきれいであることを確かめる（C8）
    - 依存更新のたびに回すチェックの並び（`pnpm test:run`、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`、読み合わせ）（C5, F1, F4, F5, F6, F7, F10）
    - 読み合わせで直した後は、4 つのチェックをすべて回し直す（F9）
    - チェックが失敗したときに戻すファイルと手順（C6, F8）
  - Update:
    - 適用の段階の「test, typecheck, lint, format check」を、コマンド名と順序に置き換える（C3, F10）
  - Drop:
    - 依存更新のチェックから `pnpm test:related` を外す（F2, F3）
- Secondary: 各 breaking change を閉じる `Check` が、報告と調査タスクの両方に書かれる。
  - Add:
    - `tasks.md` の調査タスクに、各 breaking change を閉じる `Check` を書かせる（C4）
  - Update:
    - `report.md` の `Check` 行の説明を、このエントリの合格条件に合わせる（C4）
  - Drop:
    - なし
- Policy:
  - Allowed:
    - チェックは、リポジトリのスクリプト（`pnpm test:run`、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`）をそのまま使う（F1, F4, F6, F7）。
  - Forbidden:
    - 依存更新のチェックを `pnpm test:related` だけで済ませること - `pnpm-lock.yaml` だけを渡すと関連テストが 0 件になり、依存の影響を見逃す（F3）。
    - チェックが赤いまま commit すること - 記録は commit で、赤い commit は記録を汚す（C8）。

#### Details

- 始める前の確認
  ```text
  1. Run `git status --porcelain` and check that it is empty.
  2. If it is not empty, do not start the update. Report it to the owner and stop.
  ```
- 合格条件
  ```text
  1. `pnpm test:run` exits 0.
  2. `pnpm typecheck` exits 0.
  3. `pnpm lint` exits 0.
  4. `pnpm format:check` exits 0.
  5. The read-through finds no mismatch in a number, a path, a name or a shape.
  ```
- チェックの並び
  ```text
  1. pnpm test:run
  2. pnpm typecheck
  3. pnpm lint
  4. pnpm format:check
  5. the read-through: read the files the package changed (package.json, pnpm-workspace.yaml, the source changed for the breaking change) and the files they name, and check the number, path, name and shape.
     - Do not read pnpm-lock.yaml. Read the resolved version in step 5.2.
  ```
- 読み合わせで直したとき
  ```text
  1. After the fix, run all four checks again (pnpm test:run, pnpm typecheck, pnpm lint, pnpm format:check).
  2. When the four pass, commit it. When they do not, follow the undo below.
  ```
- 失敗したときの戻し
  ```text
  1. Restore the files the package's update touched to HEAD (git restore --source=HEAD -- package.json pnpm-lock.yaml <the source it changed>).
  2. Run pnpm install to restore node_modules.
  3. Report the failed check's output and the restored files to the owner, and decide whether to go on to the next package or stop.
  ```
- `tasks.md` の `Check`
  ```text
  4. For each breaking change that hits, write the check that closes it here in one sentence.
     - IF the check is a command → name the command.
     - IF the check is a read-through → name the file and what to read.
  ```
- `report.md` の `Check`
  ```text
  - Check: pnpm test:run, pnpm typecheck, pnpm lint, pnpm format:check. In addition, read `<file>` and check `<what>`.
  ```

### Definition

- `Unit.upgrade-skill`(kept): 主な機能は同じで、変わるのは、その機能を支えるチェックのルートである。
- `Who.agent`(kept): アップグレードを走らせるのはエージェントのままで、変わるのはチェックのルートである。
- `Stack.Checks`(kept): tsc、vitest、oxlint、oxfmt、lefthook の行は変わらない。変わるのは、それらを走らせるコマンドの並びである。
- `What`(kept): プロダクトの一文は変わらない。

## 02: 土台の確認

Type: _Full_

### Context

- C1: ロードマップ 035（0.9.7、mid）「upgradeスキルの更新」。意図は、スキル全体を棚卸しし、追加・修正と矛盾・不整合の除去を合わせて行うことにある。全体を書き直すレベルの作業である。サイクルは 6 エントリに分かれた（01 チェックと合格条件、02 土台の確認、03 トライアル、04 監査の報告、05 現行の矛盾点の修正、06 手順全体の組み直し）。
- C2: upgrade スキルはサイクル外で走るルーティンで、その性格は変えない。対象は `SKILL.md`、`references/report.md`、`references/tasks.md`。必要なら reference を増やす。
- C3: オーナーは「packageマネージャとengineのバージョンの確認も入れる」と言い、「これは、アップデート自体は扱わない。基本的にグローバルの話なので」と決めた。
- C4: オーナーは、要点を「現バージョンにパッチが当たってるマイナーアップデートがないか」「現バージョンが非推奨になってないか」とした。
- C5: いまのスキルには、土台（pnpm / Node）の確認がない。
- C6: `report.md` の `## Ground` には pnpm と Node のバージョンを書く欄があるが、パッチと非推奨の欄はない。
- C7: このエントリが決める問いは、pnpm と Node の現在値について何を確かめ、報告のどこに出すか、である。
- C8: オーナーは、土台の確認を手順の先頭の独立したステップにし、パッケージのリサーチとは別に、先に走らせる、と決めた。確認の結果を報告するかどうかはオーナーが決めるので、スキップもあり得る。

### Research & Trial

- F1: `package.json` の `packageManager` は `pnpm@12.15.0`、`engines.node` は `>=24` である。出所: `package.json:37-40`
- F2: pnpm の `12.15.x` に新しいパッチはなく、`12.15.0` が最新である。次のマイナーは `12.16.0` と `12.16.1`、全体の最新は `12.21.0` である。出所: `https://registry.npmjs.org/pnpm/12.15.0`, `https://data.jsdelivr.com/v1/package/npm/pnpm`, `https://api.github.com/repos/pnpm/pnpm/releases?per_page=30`
- F3: `pnpm@12.15.0` の registry JSON に `deprecated` キーはない。出所: `https://registry.npmjs.org/pnpm/12.15.0`
- F4: Node の `engines` は `>=24` でパッチ番号を含まないため、リポジトリから現在のパッチは特定できない。出所: `package.json:37-39`
- F5: Node メジャー 24 の最新は `v24.22.3`（2026-11-10）で、コードネームは Krypton、LTS である。出所: `https://nodejs.org/dist/index.json`, `https://nodejs.org/en/about/previous-releases`
- F6: Node メジャー 24 の EOL は `2028-04-30` で、まだ EOL ではない。出所: `https://endoflife.date/api/nodejs.json`
- F7: pnpm のバージョンと非推奨は、個別バージョンの URL、`/pnpm/latest`、jsDelivr、GitHub API で認証なしに取得できる。完全な packument（`https://registry.npmjs.org/pnpm`）は 5MB を超えて取得できない。出所: 本調査
- F8: Node のバージョンと EOL は、`https://nodejs.org/dist/index.json`、`https://nodejs.org/en/about/previous-releases`、`https://endoflife.date/api/nodejs.json` で認証なしに取得できる。出所: 本調査
- F9: `v24.22.3` の日付は、`nodejs.org/dist/index.json` が `2026-11-10`、`endoflife.date` が `2026-11-11` で一致しない。出所: `https://nodejs.org/dist/index.json`, `https://endoflife.date/api/nodejs.json`

### Scope

- In:
  - failure: 土台のバージョンを確かめられなかったときの扱い（不明として報告するか、止めるか）を決める。
  - structure: 土台の確認を手順の中の 1 つのステップとして置き、`report.md` の `Ground` に欄を足す。
  - logic: 「同じマイナーに新しいパッチがある」「非推奨である」「EOL である」の判定の規則を決める。
  - downstream: `report.md` の `Ground` を、このエントリの確認結果に合わせる。
  - expression: 手順と `report.md` の文言を、確認の項目名で書き直す。
  - verification: 土台（pnpm / Node）の状態を確かめる手段そのものを決める。
- Out:
  - safety: 秘密・権限・公開・個人データに触れない。
  - upstream: 外部のパッケージ・ライブラリ・契約の追加・更新・削除はない（情報源を読むのは手順であり、依存ではない）。
  - result: 報告という結果の種類は変えない（`Ground` の内容が増える）。
  - existing: 既存のデータ・インストール済みのバージョン・配布済みの文書・過去の記録の移行はない。
  - cost: 時間・資源・費用は変えない（確認の HTTP は数回で、誤差の範囲）。
  - observability: 監査記録は変えない（確認の結果は `report.md` に出す）。
  - release: 公開・配布・適用・ロールバックの仕組みは変えない。
  - other: ほかに当たる懸念はない。

### Decision

- Status: **accepted**
- Main: 手順の先頭に、土台（pnpm / Node）を確かめる独立したステップが入る。オーナーの判断でスキップでき、結果は `Ground` に出る。更新はしない。（C1, C2, C7）
  - Add:
    - 手順の先頭に、土台を確かめる独立したステップを置く（C3, C5, F1）
    - そのステップの最初に、確認するかどうかをオーナーに聞く。スキップできる（C8）
    - `package.json` の `packageManager` と `engines.node` を読み、`node --version` と `pnpm --version` で実行中のバージョンを確かめる（F1, F4）
    - 1 つの `research` サブエージェントで、pnpm のパッチと非推奨、Node のパッチと EOL を調べる（C4, F2, F3, F5, F6, F7, F8）
    - 土台のリサーチは、パッケージのリサーチとは別に、先に走らせる（C8）
    - `Ground` の各行に、その出所の URL を書く（F7, F8）
  - Update:
    - `report.md` の `Ground` を、バージョンだけでなく、パッチ・非推奨・EOL を持つ形にする（C6）
    - `report.md` の冒頭を、土台とパッケージが分かった時点で書く、に直す
  - Drop:
    - なし
- Secondary: 情報源を読めなかった場合の扱いが決まる。
  - Add:
    - 読めなかった項目は `unknown` と書き、何が妨げになったかを書く（F7, F9）
  - Update:
    - なし
  - Drop:
    - なし
- Policy:
  - Allowed:
    - 土台の確認は、オーナーがスキップしてよい（C8）。
    - 確認は、認証なしの HTTP 取得で行う（F7, F8）。
  - Forbidden:
    - 確認のために pnpm や Node を更新すること - 更新はグローバルの話で、このスキルの外（C3, C4）。
    - 完全な packument を取得すること - 5MB を超えて取得できない（F7）。

#### Details

- 手順の先頭
  ```text
  1. Ask the owner whether to check the ground. When the owner skips, go to the update.
  2. Read `packageManager` and `engines.node` in `package.json`.
  3. Read the running versions: `node --version` and `pnpm --version`.
  4. Run one `research` subagent for the ground. It runs before the package research.
  5. Write the results in the report's `Ground`, with the source URL of each.
  ```
- 土台のリサーチのタスク
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
- `report.md` の `Ground`
  ```text
  - pnpm <version>: the newest patch in <minor> is <version or none>. <deprecated / not deprecated>. <source URL>
  - Node <version>: the newest patch in <major> is <version or none>. <EOL date / not EOL>. <source URL>
  ```
- `report.md` の冒頭
  ```text
  What `upgrade` puts in front of the owner once the ground and the out-of-range packages are known. It goes to the chat, not into a file.
  ```

### Definition

- `Unit.upgrade-skill`(kept): 主な機能は同じで、変わるのは、その機能の前に置く土台の確認である。
- `Who.owner`(kept): 土台の確認をするかどうかを決めるのはオーナーのままで、役は変わらない。
- `Who.agent`(kept): 土台を確かめ、更新するのはエージェントのままで、役は変わらない。
- `Stack.Ground`(kept): pnpm と Node の行は変わらない。変わるのは、それらのバージョンを確かめる手順である。
- `What`(kept): プロダクトの一文は変わらない。

## 03: トライアル

Type: _Full_

### Context

- C1: ロードマップ 035（0.9.7、mid）「upgradeスキルの更新」。意図は、スキル全体を棚卸しし、追加・修正と矛盾・不整合の除去を合わせて行うことにある。全体を書き直すレベルの作業である。サイクルは 6 エントリに分かれた（01 チェックと合格条件、02 土台の確認、03 トライアル、04 監査の報告、05 現行の矛盾点の修正、06 手順全体の組み直し）。
- C2: upgrade スキルはサイクル外で走るルーティンで、その性格は変えない。対象は `SKILL.md`、`references/report.md`、`references/tasks.md`。必要なら reference を増やす。
- C3: オーナーは「破壊的な変更がある場合は、トライアルで隔離された場所で問題ないかを確認させたい」「トライアルで確認された手順をレポでも適用する形」と言った。
- C4: オーナーは「ライブラリは互いに依存がある可能性もあるので、アップデートするものを決めたら、それを全てトライアルでアップデートして、チェックがOKかを確認した方が良いかもしれない」と言った。粒度は未決。
- C5: オーナーは「できなかった場合などの分岐も考えないといけない」と言った。
- C6: いまのスキルは、パッケージを 1 つずつ適用する。トライアルの手順はない。
- C7: upgrade スキルはサイクル外で走る。ADR のトライアルは、holding point が事実でないときに使う。
- C8: このエントリが決める問いは、壊れる変更をどの粒度で、どこで試し、失敗したらどう分岐するか、である。

### Research & Trial

- F1: consult の worktree は git worktree で、パスは `/tmp/pi-consult/<project>-<stamp>/<unit-id>/wt`、ブランチは `consult/<unit-id>`、分岐元の既定は `HEAD` である。出所: `.pi/extensions/consult/run/worktree.ts:17-18,60-63,186-194`
- F2: サブエージェントの cwd は worktree で、開始前に `pnpm-lock.yaml` があれば `pnpm install --frozen-lockfile` が実行され、失敗するとサブエージェントも失敗する。出所: `.pi/extensions/consult/run/subagent.ts:117-118`, `.pi/extensions/consult/run/run.ts:115-153`
- F3: consult の設定上、`trial` は `bash` と書き込みのツールを持ち、`paths: []` と `bash: []` はガードで制限なしを意味する。worktree 内で `pnpm update --latest` を実行し、`package.json` と `pnpm-lock.yaml` を書ける。出所: `.pi/extensions/consult/types.json:65-68`, `.pi/extensions/consult/sub/guard.ts:194-216`, `.pi/extensions/consult/README.md:32`
- F4: `trial` の上限は 80 turns と 120000 output tokens である。出所: `.pi/extensions/consult/types.json:70`
- F5: `trial` の実行にはオーナーの同意が要る。出所: `.pi/skills/adr/SKILL.md:203`, `.pi/skills/adr/references/tasks.md:22,33`
- F6: `isolated: true` の役割は worktree が必須で、consult は自動作成しない。出所: `.pi/extensions/consult/README.md:30`, `.pi/extensions/consult/run/subagent.ts:69-84`
- F7: チェックのコマンドは `test:run` = `vitest run`、`lint` = `oxlint --deny-warnings`、`format:check` = `oxfmt --check`、`typecheck` = `node scripts/checks/typecheck.mjs` である。出所: `package.json:10-19`
- F8: `pnpm typecheck` は `process.cwd()` を root として `<root>/node_modules/.bin/tsc` を実行する。出所: `scripts/checks/typecheck.mjs:9-10,29,32-46`
- F9: worktree の変更は base から見えず、worktree に残る。出所: `.pi/extensions/consult/README.md:90`, `.pi/extensions/consult/tool/worktree.ts:4`
- F10: `consult_worktree remove` は、その unit のサブエージェントが走っている間と、未コミットの変更が残っている間（`force` なし）は拒否される。出所: `.pi/extensions/consult/tool/worktree.ts:100-121`, `.pi/extensions/consult/run/worktree.ts:341-354`
- F11: `pnpm-workspace.yaml` に `packages` の指定はない。出所: `pnpm-workspace.yaml:1-7`
- F12: サブエージェントはプロジェクトの設定・ローカル拡張・スキルを読み込まず、指示は task で渡す。出所: `.pi/extensions/consult/README.md:157,170,172`
- F13: 現行の `tasks.md` のパッケージの調査タスクは、すでに壊れる変更（`:17`）と、それがこのレポに当たるか（`:18`）を調べる。出所: `.pi/skills/upgrade/references/tasks.md:17-18`
- 実際の `pnpm update --latest` で解決されるバージョンと、4 つのチェックの合否は、この調査では試しておらず未観測である。

### Scope

- In:
  - failure: トライアルが失敗したときの分岐（レポに適用しない、サイクルに渡す、など）を決める。
  - result: トライアルが残す worktree と、その報告をどうするか（残す／消す）を決める。
  - structure: トライアルを手順の中の 1 つの段階として置き、worktree の場所と、パッケージの適用との順序を決める。
  - logic: どの変更をトライアルに回すか、全パッケージをまとめて試すか個別に試すかの規則を決める。
  - downstream: トライアルの結果を、パッケージの適用（手順 5）がどう使うかを決める。
  - expression: 手順と `tasks.md` の文言を、トライアルの項目名で書き直す。
  - verification: 壊れる変更がレポで問題ないかを確かめる手段そのものを決める。
- Out:
  - safety: 秘密・権限・公開・個人データに触れない。
  - upstream: 外部のパッケージ・ライブラリ・契約の追加・更新・削除はない（トライアルで試すのは更新そのもの）。
  - existing: 既存のデータ・インストール済みのバージョン・配布済みの文書・過去の記録の移行はない。
  - cost: トライアルの時間とトークンは受け入れる。粒度は、相互依存と原因の特定で決める。
  - observability: 監査記録は変えない。
  - release: 公開・配布・適用・ロールバックの仕組みは変えない。
  - other: ほかに当たる懸念はない。

### Decision

- Status: **accepted**
- Main: 選んだパッケージに 1 つでも壊れる変更があれば、選んだすべてのパッケージを 1 つの worktree でまとめて試す。壊れる変更が 1 つもなければ、トライアルを飛ばして適用する。失敗したら、レポには適用せず、オーナーが次を決める。（C1, C2, C8）
  - Add:
    - 報告の後、適用の前に、選んだパッケージに壊れる変更が 1 つでもあれば、選んだすべてのパッケージを 1 つの worktree でまとめて試す（C3, C4, C6, C7, F1, F4, F13）
    - 壊れる変更が 1 つもなければ、トライアルを飛ばして、適用に進む（C4）
    - トライアルでは、選んだすべてのパッケージを `pnpm update --latest` で更新し、`pnpm test:run`、`pnpm typecheck`、`pnpm lint`、`pnpm format:check` を回す（F3, F7, F8, F11）
    - トライアルが通ったら、レポには 1 つずつ適用する（C3）
    - トライアルが失敗したら、レポには適用せず、失敗したチェックと解決したバージョンを報告し、オーナーが次を決める（C5, F5）
    - サブエージェントが turns の上限で止まったときは、続けられるなら続ける。解決できない問題を報告したときだけ、失敗として扱う（F4）
    - トライアルでは開始前に `pnpm install --frozen-lockfile` を実行し、worktree は報告の後に `consult_worktree remove` で消す（F2, F9, F10）
  - Update:
    - 適用の段階の前に、トライアルの段階を置く（C6）
  - Drop:
    - なし
- Secondary: `tasks.md` に、トライアルのタスクが入る。
  - Add:
    - `tasks.md` に、選んだパッケージを worktree で試すタスクを置く（C3, F12）
  - Update:
    - なし
  - Drop:
    - なし
- Policy:
  - Allowed:
    - 1 つでも壊れる変更があれば、選んだすべてのパッケージを 1 つのトライアルでまとめて試す（C4）。
    - トライアルの worktree は、オーナーが同意した場所に作る（F5, F6）。
  - Forbidden:
    - トライアルが通る前に、レポへ適用すること - 通らない手順をレポに入れない（C3）。
    - トライアルの worktree を残すこと - 記録は報告で、worktree は道具である（F9, F10）。

#### Details

- トライアルの段階
  ```text
  1. After the owner picks the packages, check whether any of them has a breaking change. When none has, skip the trial and go to the apply. When at least one has, try all the picked packages in one worktree.
  2. Make one worktree for the trial: `consult_worktree new upgrade-trial`.
  3. Hand the trial subagent the packages and the trial task. The task text is in `tasks.md`.
  4. When the trial reports, read it.
  5. Remove the worktree: `consult_worktree remove upgrade-trial` with `force`.
  6. Go to the apply step. When the trial failed, do not apply; report and let the owner decide.
  ```
- トライアルのタスク
  ```text
  Try the update in this worktree, and report what it changes.

  1. Apply the packages: `pnpm update --latest <package>` for each.
  2. Run the checks: `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`.
  3. Report the resolved versions, the failed check and its output, and the smallest change that makes it pass.
  4. Leave the worktree as it is. Do not commit.
  ```
- 失敗したとき
  ```text
  - Report the failed check and the resolved versions.
  - Do not apply the package to the base.
  - When the trial subagent stops at the turn limit:
    - IF its report says the trial is going well → continue the same subagent.
    - IF its report says something cannot be resolved → treat it as a failure.
  - The owner decides: narrow the trial to a subset, or open a cycle.
  ```

### Definition

- `Unit.upgrade-skill`(kept): 主な機能は同じで、変わるのは、壊れる変更を試すルートである。
- `Who.owner`(kept): トライアルに同意し、失敗の分岐を決めるのはオーナーのままで、役は変わらない。
- `Who.agent`(kept): トライアルを走らせ、通った手順を適用するのはエージェントのままで、役は変わらない。
- `Stack.Ground`(kept): Ground の Language、Runtime、Package manager の行は変わらない。変わるのは、それらを worktree で試す手順である。
- `Stack.Checks`(kept): tsc、vitest、oxlint、oxfmt の行は変わらない。変わるのは、それらを worktree で回す手順である。
- `What`(kept): プロダクトの一文は変わらない。

## 04: 監査の報告

Type: _Full_

### Context

- C1: ロードマップ 035（0.9.7、mid）「upgradeスキルの更新」。意図は、スキル全体を棚卸しし、追加・修正と矛盾・不整合の除去を合わせて行うことにある。全体を書き直すレベルの作業である。サイクルは 6 エントリに分かれた（01 チェックと合格条件、02 土台の確認、03 トライアル、04 監査の報告、05 現行の矛盾点の修正、06 手順全体の組み直し）。
- C2: upgrade スキルはサイクル外で走るルーティンで、その性格は変えない。対象は `SKILL.md`、`references/report.md`、`references/tasks.md`。必要なら reference を増やす。
- C3: オーナーは「監査にもレポートフォーマットをつくった方が良いかも」と言った。作るかどうか自体が未決。
- C4: いまの手順7は「Say which one it was to the owner」とだけ書く。監査の結果の形は決まっていない。
- C5: 監査は 2 つ目の停止点。オーナーが残りを読んで「想定どおり」と言うまで終わらない。
- C6: 監査の後、`--fix=update` を 1 回、チェックと監査をもう一度、という順序がある。
- C7: このエントリが決める問いは、監査の結果をどの形で、どこに出すか、である。

### Research & Trial

- F1: `pnpm audit --json` は `advisories`（ID をキーとするオブジェクト）と `metadata` を返す。各助言は `findings`、`id`、`title`、`module_name`、`vulnerable_versions`、`patched_versions`、`severity`、`cwe`、`github_advisory_id`、`url` を持つ。出所: `https://pnpm.io/cli/audit#--json`, `https://github.com/pnpm/pnpm/blob/main/pnpm/crates/cli/src/cli_args/audit/report.rs`
- F2: `patched_versions` は修正バージョンが公開されていない助言で `null` になる。出所: `https://pnpm.io/cli/audit#--json`
- F3: `metadata.vulnerabilities` は `info`、`low`、`moderate`、`high`、`critical` の件数を持つ。出所: `https://github.com/pnpm/pnpm/blob/main/pnpm/crates/cli/src/cli_args/audit/report.rs`
- F4: 人間向け出力は、助言ごとに `severity + title`、`Package`、`Vulnerable versions`、`Patched versions`、`Paths`、`More info` を表にし、末尾に `N vulnerabilities found` と `Severity: ...` を付ける。出所: `https://github.com/pnpm/pnpm/blob/main/pnpm/crates/cli/src/cli_args/audit/render.rs`
- F5: `--audit-level` は `info`、`low`、`moderate`、`high`、`critical` を受け、既定は `low`。指定した段階以上の助言だけを表示し、失敗対象にする。`low` は `info` を外す。出所: `https://pnpm.io/cli/audit#--audit-level-severity`
- F6: `--fix` の既定は `override` で、`pnpm-workspace.yaml` に `overrides` を書く。`--fix=update` は `overrides` を書かず、lockfile 内の脆弱なパッケージを更新する。出所: `https://pnpm.io/cli/audit#--fix`
- F7: `--fix=update` の更新先は「非脆弱なバージョン」とだけ書かれ、最小の修正バージョンか最新バージョンかの指定はない。出所: `https://pnpm.io/cli/audit#--fix`
- `minimumReleaseAge` がある場合、`--fix` は各助言の最小の修正バージョンを `minimumReleaseAgeExclude` に追加する。出所: `https://pnpm.io/cli/audit#--fix`
- F9: `--ignore <GHSA>` は ID を `pnpm-workspace.yaml` の `audit.ignore`（または旧 `auditConfig.ignoreGhsas`）へ保存し、監査レポートを出力しない。出所: `https://pnpm.io/cli/audit#--ignore-vulnerability`
- F10: `--ignore-unfixable` は解決策のない助言をすべて無視する。GHSA ID のない修正不能な助言は無視できず、`ERR_PNPM_AUDIT_MISSING_GHSA` で失敗する。出所: `https://pnpm.io/cli/audit#--ignore-unfixable`
- F11: `overrides` は非脆弱なバージョンを強制する。例は `"lodash@<2.1.0": "^2.1.0"`。出所: `https://pnpm.io/settings/dependency-resolution#overrides`
- F12: `pnpm audit` は、無視対象を除いた後に監査段階以上の助言が残ると終了コード 1、なければ 0 を返す。出所: `https://pnpm.io/cli/audit`
- 公式ドキュメントには JSON のキー一覧と人間向け出力の例がない。上記は実装の `report.rs` と `render.rs` で確認した。出所: `https://github.com/pnpm/pnpm/tree/main/pnpm/crates/cli/src/cli_args/audit`

### Scope

- In:
  - failure: 監査が失敗したとき（registry のエラー、修正不能な助言）の報告の扱いを決める。
  - result: 監査の結果を、パッケージの報告とは別の結果として出すかどうかを決める。
  - structure: 監査の報告の形と、置き場所（新しい reference か `report.md` のセクションか）を決める。
  - logic: 報告に何を出すか（助言、重大度、修正バージョン、残り、オーナーの決定）を決める。
  - downstream: `SKILL.md` の監査の手順を、この報告の形に合わせる。
  - expression: 監査の手順と報告の文言を書き直す。
  - observability: 監査の記録の形を決める。
- Out:
  - safety: 秘密・権限・公開・個人データに触れない（報告はチャットに出す）。
  - upstream: 外部のパッケージ・ライブラリ・契約の追加・更新・削除はない。
  - existing: 既存のデータ・インストール済みのバージョン・配布済みの文書・過去の記録の移行はない。
  - cost: 監査の時間と資源は変えない。
  - verification: 監査の手段は変えない。報告の形だけを決める。
  - release: 公開・配布・適用・ロールバックの仕組みは変えない。
  - other: ほかに当たる懸念はない。

### Decision

- Status: **accepted**
- Main: 監査の結果が、パッケージの報告とは別のレポートになり、`references/audit.md` の形でチャットに出る。オーナーが `overrides` と `audit.ignore` を決める。（C1, C2, C7）
  - Add:
    - `references/audit.md` を新設し、監査の報告の形を置く（C3, C5）
    - 監査の後に、その形でチャットに出す（C3, C5）
    - 報告は `pnpm audit --json` の `advisories` と `metadata` から作る（F1, F3）
    - `Ground` に、監査の段階（`low`）と、終了コードの意味を書く（F5, F12）
    - 助言ごとに、重大度、パッケージ、脆弱なバージョン、修正バージョン（なければ `なし`）、パス、閉じ方（`--fix=update` か `overrides` か）、出所 URL を書く（F1, F2, F4, F6, F7）
    - 失敗（registry のエラー、GHSA のない修正不能な助言）を `Ground` か `Leftovers` に書く（F10, F12）
  - Update:
    - `SKILL.md` の監査の手順を、`references/audit.md` を参照する形にする（C4, C6）
  - Drop:
    - なし
- Secondary: `references/audit.md` の `Rules` が、`report.md` と同じ考え方を持つ。
  - Add:
    - 各事実に出所 URL を書き、測った数だけを書き、ファイル名はルートから書く（F1, F4）
  - Update:
    - なし
  - Drop:
    - なし
- Policy:
  - Allowed:
    - `pnpm audit --audit-level low` をそのまま使う（F5）。
    - 監査の報告はチャットに出す（C5）。
    - `overrides` と `audit.ignore` は、オーナーの OK で使う（C3, F9, F11）。
  - Forbidden:
    - 監査から助言が消えたと確かめる前に、助言を閉じたと言うこと - 監査の結果が先（C5, F12）。
    - `--fix` と `--ignore` を同じ監査で使うこと - 何が消えたか分からなくなる（F6, F9）。
    - 監査の段階を上げ下げすること - 段階は `low` で固定（F5）。

#### Details

- `references/audit.md` の形
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
  ```
- `SKILL.md` の監査の手順
  ```text
  1. Run `pnpm audit --audit-level low`.
  2. Write the report in the shape `references/audit.md` gives, and put it as markdown in the chat.
  3. Run `pnpm audit --fix=update` once with leftovers.
  4. Run the checks and audit again.
  5. Take `override`, `--ignore` and `--ignore-unfixable` only with the owner's OK.
  6. The work ends when the owner reads the leftovers and says they are as expected.
  ```

### Definition

- `Unit.upgrade-skill`(kept): 主な機能は同じで、変わるのは、監査の結果を報告するルートである。
- `Who.owner`(kept): `overrides` と `ignore` を決め、残りを読むのはオーナーのままで、役は変わらない。
- `Who.agent`(kept): 監査を走らせ、報告を書くのはエージェントのままで、役は変わらない。
- `Stack.Ground`(kept): pnpm の行は変わらない。変わるのは、その `audit` の結果を報告する形である。
- `What`(kept): プロダクトの一文は変わらない。

## 05: 現行の矛盾点の修正

Type: _Full_

### Context

- C1: ロードマップ 035（0.9.7、mid）「upgradeスキルの更新」。意図は、スキル全体を棚卸しし、追加・修正と矛盾・不整合の除去を合わせて行うことにある。全体を書き直すレベルの作業である。サイクルは 6 エントリに分かれた（01 チェックと合格条件、02 土台の確認、03 トライアル、04 監査の報告、05 現行の矛盾点の修正、06 手順全体の組み直し）。
- C2: upgrade スキルはサイクル外で走るルーティンで、その性格は変えない。対象は `SKILL.md`、`references/report.md`、`references/tasks.md`。必要なら reference を増やす。
- C3: オーナーは「現行の矛盾点はまとめて1つのエントリにして、これは全て修正対象にする」と言った。
- C4: 対象は 8 点。commit の欠け、手順2の適用指示、二重の記述、`pnpm update` の範囲、`latest` と `minimumReleaseAge`、1440、files の曖昧さ、手順6の対象外。
- C5: 事実確認の結果、記述が正しいと分かったものは「矛盾ではない」と記録し、修正対象から外す。
- C6: 手順1の commit の位置は、01 の合格条件に依存する。
- C7: このエントリが決める問いは、8 点のどれを、どう直すか、である。

### Research & Trial

- F1: `pnpm update` は、通常の依存関係では、解決したバージョンに合わせて `package.json` の範囲を書き換える。`^1.1.0` は caret のまま維持され、`--latest` の有無を問わない。出所: `https://pnpm.io/cli/update#what-an-update-writes`
- F2: `pnpm update` が `package.json` を書き換えない例外は、`catalog:` 宣言、dist-tag 宣言、`--no-save`、`packageExtensions` / `readPackage` / `override` 由来の指定子である。出所: `https://pnpm.io/cli/update#what-an-update-writes`, `https://pnpm.io/cli/update#--no-save`
- F3: `pnpm outdated --json` の `current` は `node_modules` に入っているバージョン、`wanted` は wanted lockfile に記録されたバージョン、`latest` は `latestManifest?.version` である。出所: `https://github.com/pnpm/pnpm/blob/2e07c4f6ffe5bc339f222fb7d96c345b734a3de2/reviewing/plugin-commands-outdated/src/outdated.ts`
- F4: `wanted` は「宣言された範囲内の最新バージョン」ではなく、lockfile に記録されたバージョンである。出所: `https://github.com/pnpm/pnpm/pull/3859`
- F5: `latest` は `minimumReleaseAge` を適用した解決結果のバージョンである。`minimumReleaseAgeExclude` に該当するパッケージは適用から外れる。出所: `https://github.com/pnpm/pnpm/blob/2e07c4f6ffe5bc339f222fb7d96c345b734a3de2/reviewing/outdated/src/createManifestGetter.ts`, `https://github.com/pnpm/pnpm/pull/10030`
- F6: `pnpm outdated --json` の型に `target` フィールドはない。出所: `https://github.com/pnpm/pnpm/blob/2e07c4f6ffe5bc339f222fb7d96c345b734a3de2/reviewing/plugin-commands-outdated/src/outdated.ts`
- F7: `minimumReleaseAge` の既定値は 1440 分で、型は number（分）である。すべての依存（推移的を含む）に適用される。出所: `https://pnpm.io/settings/dependency-resolution#minimumreleaseage`
- F8: `minimumReleaseAge` を明示しない場合、組み込みの既定値 1440 分が使われ、`minimumReleaseAgeStrict` は false なので、条件を満たすバージョンがないときは条件を満たさないバージョンへフォールバックする。出所: `https://pnpm.io/settings/dependency-resolution#minimumreleaseagestrict`
- F9: `minimumReleaseAgeExclude` はパッケージ名で除外し、パターンと特定バージョン（`||` で複数）も書ける。出所: `https://pnpm.io/settings/dependency-resolution#minimumreleaseageexclude`

### Scope

- In:
  - structure: 範囲外の発見の段階の適用指示を適用の段階へ移し、`target` の行と設定の掃除の段階の欄を直す。
  - logic: `wanted` の定義、`minimumReleaseAgeExclude` の規則、調査に渡すファイルの規則を直す。
  - existing: 現行の `SKILL.md` の記述を、その場で直す。
  - downstream: `SKILL.md` の段階の名前を揃える。
  - expression: 直した行の文言を整え、1440 の直書きを外す。
- Out:
  - safety: 秘密・権限・公開・個人データに触れない。
  - failure: 失敗の設計はエントリ 01 のもの。このエントリは文言を直す。
  - upstream: 外部のパッケージ・ライブラリ・契約の追加・更新・削除はない。
  - result: 記録は commit のままで、種類は変わらない。足すのは位置だけ。
  - cost: 時間・資源・費用は変えない。
  - verification: チェックの手段は変えない。直した文言は校正で確かめる。
  - observability: 監査記録は変えない。
  - release: 公開・配布・適用・ロールバックの仕組みは変えない。
  - other: ほかに当たる懸念はない。

### Decision

- Status: **accepted**
- Main: 現行の矛盾点 8 点のうち、事実と違うもの、位置が違うもの、重複したもの、欠けているものを直す。事実と合うものは「矛盾ではない」と記録し、直さない。（C1, C2, C7）
  - Add:
    - 範囲内の更新、設定の掃除、監査の段階に、チェックの後の commit を足す（C3, C4, C6）
    - 調査の段階の「Hand it the files」に、どのファイルかを明示する規則を足す（C7）
    - 設定の掃除の段階に、`minimumReleaseAgeExclude`、`overrides`、`allowBuilds` の 3 つの欄を足す（C4, C7, F9）
  - Update:
    - 範囲外の発見の段階の「Apply with `pnpm update --latest <package>`」を、適用の段階へ移す（C4）
    - 範囲外の発見の段階の View の `wanted` を「lockfile に記録されたバージョン」に、`target` を「スキルが決めた target」に直す（C4, F3, F4, F6）
    - 範囲外の発見の段階の 1440 の直書きを外し、pnpm の既定に任せる（C4, F7, F8）
    - 設定の掃除の段階の `minimumReleaseAgeExclude` の規則を、パッケージ名とパターンにも当たる形に直す（C4, F9）
  - Drop:
    - 適用の段階の Notes の「resolved が target でない」という重複を外す（C4）
- Secondary: 事実と合う記述は、直さずに残す。
  - Add:
    - なし
  - Update:
    - なし
  - Drop:
    - なし
- Policy:
  - Allowed:
    - 事実と合う記述は、そのまま残す（C5, F1, F2, F5）。
  - Forbidden:
    - 事実と合う記述を、矛盾として直すこと - 直すと事実とずれる（F1, F5）。
    - 事実と合わない記述を、事実のまま残すこと - 矛盾が残る（F3, F4, F6）。

#### Details

- 事実と合う記述（直さない）
  ```text
  - `pnpm update` writes the range in `package.json`: correct for normal dependencies (F1). The exceptions (F2) stay out of the procedure.
  - `latest` is the newest after `minimumReleaseAge`: correct (F5).
  - `minimumReleaseAge` is 1440 when it is not there: the fact is correct (F7), but the number is removed from the step because the rule forbids a number of minutes.
  ```
- 範囲外の発見の段階の View（直す）
  ```text
  | value    | what it is                                      |
  | -------- | ----------------------------------------------- |
  | `wanted` | the version in the wanted lockfile              |
  | `latest` | the newest one after `minimumReleaseAge`        |
  | target   | the skill's target: the newest stable version at least `minimumReleaseAge` old |
  ```
- 調査の段階のファイル
  ```text
  1. `package.json`.
  2. `pnpm-workspace.yaml`.
  3. The package's entry in `pnpm-lock.yaml`.
  4. Every tracked file `git grep -l '<the package>'` returns, except `cycles/`.
  ```
- 設定の掃除の段階の 3 つの欄（足す）
  ```text
  - `minimumReleaseAgeExclude`: a line is `package@version`, a package name, or a pattern.
    - Keep a `package@version` line only while that version is installed.
    - Keep a package-name or pattern line only while the package is installed.
  - `overrides`: keep a line only while its version is installed.
  - `allowBuilds`: keep a line only while the package is installed.
  ```

### Definition

- `Unit.upgrade-skill`(kept): 主な機能は同じで、変わるのは、その手順の記述の整合である。
- `Who.owner`(kept): 記述の修正は、オーナーの役を変えない。
- `Who.agent`(kept): 記述の修正は、エージェントの役を変えない。
- `Stack`(kept): ツールの行は変わらない。記述の修正だけである。
- `What`(kept): プロダクトの一文は変わらない。

## 06: 手順全体の組み直し

Type: _Full_

### Context

- C1: ロードマップ 035（0.9.7、mid）「upgradeスキルの更新」。意図は、スキル全体を棚卸しし、追加・修正と矛盾・不整合の除去を合わせて行うことにある。全体を書き直すレベルの作業である。サイクルは 6 エントリに分かれた（01 チェックと合格条件、02 土台の確認、03 トライアル、04 監査の報告、05 現行の矛盾点の修正、06 手順全体の組み直し）。
- C2: upgrade スキルはサイクル外で走るルーティンで、その性格は変えない。対象は `SKILL.md`、`references/report.md`、`references/tasks.md`。必要なら reference を増やす。
- C3: オーナーは「この修正を入れた時のそもそもの手順を最終的にどう組み直すかをエントリとして入れた方がよい」と言った。
- C4: 01〜05 の結果を受ける。01 はチェック、02 は土台、03 はトライアル、04 は監査、05 は矛盾の修正。
- C5: いまの手順は 1〜7 の 7 ステップ。停止点は手順4（レポート）と手順7（監査）。
- C6: 06 は最後。01〜05 の決定を落とさず、順序と構成を決める。
- C7: このエントリが決める問いは、01〜05 を入れた後の手順を、どの順序で組み、どこに停止点と commit を置くか、である。

### Research & Trial

- なし

### Scope

- In:
  - structure: 手順の順序と構成を、土台の確認、更新、調査、報告、トライアル、適用、設定の掃除、監査の順に組み直す。
  - logic: 段階の間の移り方（スキップ、停止、戻り）を決める。
  - existing: 現行の手順の段階を、新しい順序へ移す。
  - downstream: `report.md`、`audit.md`、`tasks.md` への参照を、新しい順序に合わせる。
  - expression: 手順の見出しと文言を、新しい構成に合わせる。
- Out:
  - safety: 秘密・権限・公開・個人データに触れない。
  - failure: 失敗の設計はエントリ 01〜03 のもの。このエントリは順序を組み直す。
  - upstream: 外部のパッケージ・ライブラリ・契約の追加・更新・削除はない。
  - result: 報告と commit の種類は変わらない。変わるのは順序。
  - cost: 時間・資源・費用は変えない。
  - verification: チェックの手段はエントリ 01・03・04 のもの。このエントリは順序を組み直す。
  - observability: 監査記録は変えない（`references/audit.md` はエントリ 04）。
  - release: 公開・配布・適用・ロールバックの仕組みは変えない。
  - other: ほかに当たる懸念はない。

### Decision

- Status: **accepted**
- Main: 手順が、土台の確認、範囲内の更新、範囲外の発見、調査、報告、トライアル、適用、設定の掃除、監査の 9 段階に組み直され、各段階の停止点と commit が決まる。（C1, C2, C3, C5, C7）
  - Add:
    - 先頭に土台の確認の段階を置き、オーナーがスキップできる（C4）
    - 報告の後、適用の前にトライアルの段階を置く（C4）
    - 監査の段階に、`references/audit.md` の報告を置く（C4）
  - Update:
    - 範囲内の更新、適用、設定の掃除、監査の各段階に、チェックの後の commit を置く（C4）
    - 各段階の見出しを、新しい順序に付け直す（C4）
  - Drop:
    - なし
- Secondary: 各段階の間の移り方が決まる。
  - Add:
    - 土台をスキップしたら更新へ、トライアルがなければ適用へ、失敗したら止まる（C4）
  - Update:
    - なし
  - Drop:
    - なし
- Policy:
  - Allowed:
    - 段階の順序は、土台、更新、範囲外の発見、調査、報告、トライアル、適用、設定、監査（C6）。
  - Forbidden:
    - 段階を飛ばして先へ進むこと - 停止点とスキップの条件を守る（C4）。
    - 停止点を、報告と監査の 2 つ以外に増やすこと - オーナーの判断は 2 つに絞る（C2）。

#### Details

- 手順の 9 段階
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

### Definition

- `Unit.upgrade-skill`(kept): 主な機能は同じで、変わるのは、その手順の順序と構成である。
- `Who.owner`(kept): 停止点で決めるのはオーナーのままで、役は変わらない。
- `Who.agent`(kept): 段階を進めるのはエージェントのままで、役は変わらない。
- `Stack`(kept): ツールの行は変わらない。手順の構成だけである。
- `What`(kept): プロダクトの一文は変わらない。
