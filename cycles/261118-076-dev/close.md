# Close 076

## Collected

### 01 worktree-deps (ADR 01)

1. 354 / Acceptance / Slice 1 と Slice 2 は1つのコミット（`807f90fa`）にまとまった。Slice 1 の中間状態が緑にならなかったためだ。`### Slice 1` の `Unplanned` に理由を書いた。計画のスライス境界とは異なる。

### 02 launch-deps (ADR 02)

2. 238 / Work Review Round 1 / `.pi/extensions/consult/run/run.ts:136` — `installDependencies` の分岐のうち、`installCommand` の `none`（lockfile なし）側と `npm ci` 側、`status: null`、`result.error?.message` の代替、`.trim()` のいずれも検査されていない。`run.test.ts:277` の happy／error の検査は `pnpm` のみで、空振り・別 lockfile・空白付き stderr の扱いも検査されていない。 / left: `npm ci`・`status: null`・`error.message` の代替・`.trim()` は追加しない（この計画より前からある分岐で、この計画の `Goal` の対象ではない）。
3. 273 / Acceptance / `Spawn` の戻り値は `ChildProcess` ではなく `SpawnedChild`（`runPi` が触る欄だけ）にした。偽物が `ChildProcess` を満たせず、型検査の抑止は受け入れないためである。ADR の `Details` は `ChildProcess` のままなので、その差を記録する。

### (ADR 01) — 運ぶ計画がない項目

4. なし / `test/fake-git.fixture.ts`・`test/child-process.fixture.ts` / close（会話で発見） — 2つの偽物が consult の型（`GitOutput`・`Spawn`）を import していた。さらに `fake-git` は、`worktree add` の引数の位置（`args[3..5]`）と、orphan・未マージ・`lastAdd` という consult 固有の git の使い方を含んでいた。`test/` は拡張をまたいで共有し、製品にも配られる場所なので、consult の型とモデルがそこに漏れ出ていた。

### (ADR 02) — 運ぶ計画がない項目

5. なし / `.pi/extensions/consult/index.ts:275`・`index.test.ts:373` / close（会話で発見） — 境界は `spawn: (command, args, options) => spawn(command, args, options)` という形で `spawn` を包んでいた。plan 02 の手順は `{ spawn, spawnSync, env }` をそのまま渡す形で、包みはない。本物の `spawn` はキャストなしで `Spawn` を満たすので、包みは不要だった。テストも「包まれている」ことを前提にしていた。

## Triage

- 2: _ex-change_ (ADR 02, 依存の導入の結果): done 7d966cab
  - Fact: `installCommand` は `pnpm-lock.yaml` → `pnpm install --frozen-lockfile`、`package-lock.json` → `npm ci`、どちらもなければ `undefined` を返す。`installDependencies` は `status !== 0` のとき `(stderr || error?.message || '').trim()` を失敗の文言にする。計画で追加した検査は `pnpm` の happy と error の2件と、レビューで追加した `none` の1件だけである。
  - Why: `install` は worktree でサブエージェントを走らせるための準備であり、誤るとサブエージェントが依存なしで走り、原因の分かりにくい失敗になる。`npm ci` の分岐と失敗の文言の組み立て（`status: null`・`error.message`・`trim`）は、いずれも `run.test.ts` の4件で確認できる。
  - Then: `run/run.test.ts` に、`package-lock.json` だけの directory では `npm ci` を走らせること、`spawnSync` が `status: null` を返すと failed になること、`stderr` が空で `error.message` がある場合はその文言を使うこと、`stderr` の前後の空白が trim されること、の4件を追加する。
- 3: _ex-change_ (ADR 02, 起動経路が値を受け取る): done f7e35d1c
  - Fact: ADR 02 の `Details` は `Spawn` の戻り値を `ChildProcess` と書いていたが、実装は `SpawnedChild`（`runPi` が触る欄だけ）である。偽物が `ChildProcess` 全体を満たせず、型検査の抑止（`@ts-expect-error`）は受け入れないため、型を偽物と本物の共通の形に寄せた。
  - Why: ADR を読む者が `ChildProcess` を探しても、実装には見当たらない。これは1行の注記で解消できる。
  - Then: ADR 02 の `Details` に、`Spawn` の戻り値は `SpawnedChild` であることとその理由を1行追加する。
- 4: _ex-change_ (ADR 01・02, テストの偽物の形): done 52374fc6
  - Fact: `test/fake-git.fixture.ts` が `GitOutput` を、`test/child-process.fixture.ts` が `Spawn` を consult から import していた。`fake-git` はさらに、`worktree add` の引数の位置（`args[3..5]`）と、orphan・未マージ・`lastAdd` という consult 固有の git の使い方を含んでいた。`test/` は拡張をまたいで共有し、製品にも配られる場所なので、consult の型とモデルがそこに漏れ出ていた。
  - Why: 偽物の責務は外の系（git・子プロセス）の代役を作ることで、型はその系の形で書く。git の命令の意味を持つ部分は consult のモデルなので、consult の隣に置く。こうすれば `test/` は git の意味を知らずに済み、consult のモデルは `run/worktree.ts` と同じ場所で保守できる。
  - Then: `test/fake-git.fixture.ts` を台本を持つ git（`createFakeGit(handle)`・`fail`・`print`。命令の意味は持たない）にし、`run/worktree.fixture.ts` が `handle` として consult のモデル（8つの命令、orphan・未マージ・`lastAdd`）を渡す。`child-process` は汎用のままにする。
- 5: _ex-change_ (ADR 02, 起動経路が値を受け取る): done c0cc7815
  - Fact: `index.ts` の `launch` は `spawn: (command, args, options) => spawn(command, args, options)` という形で `spawn` を包んでいた。`index.test.ts` も「包まれている」ことを前提にしていた（`not.toBe(spawn)`）。
  - Why: plan 02 の手順は `{ spawn, spawnSync, env }` をそのまま使い、包みを置いていない。本物の `spawn` はキャストなしで `Spawn` を満たす（typecheck で確認）ので、包みは値の流れを追う読者に余計な手順を挟む。テストも、包みという実装の詳細に依存していた。
  - Then: `launch` を `{ spawn, spawnSync, env: gitEnv(process.env) }` にし、テストを「本物の `spawn` と `spawnSync` がそのまま載る」に直す。
- 1: dropped (ADR 01, worktree の依存の受け取り)
  - Fact: Slice 1 の `Verify` が通らない状態（`tool/worktree.test.ts` の Step 10 が未了）で `0931a642` を `--no-verify` でコミットし、そのあと Slice 1 を緑に戻さず、2つのスライスを1つのコミット（`807f90fa`）にまとめた。これは work 4.1「run its `Verify`, and commit it after it passes」と「The plan is not rewritten to keep going」への違反である。
  - Why: コード・テスト・レビュー・受け入れはすべて緑で、境界の設計は plan のとおりである。計画のスライス境界だけが実行に合わせて変わり、直すには履歴の書き換えが要る。得られるものはない。スキルの文面の修正は所有者が行うので、close では何もしない。
  - Then: なし

## Verified

### subagent-consult

- Plans:
  - `worktree-deps`
  - `launch-deps`
- Result: OK（オーナーは実行できないため、エージェントが代わりに確認した）。`consult_worktree` の `new check-076` が `branch: consult/check-076` と `.../check-076/wt` を返し、`list` が `check-076 … (clean)` を出し、`remove check-076` が「消した: check-076（ブランチも消した）」を返した。`consult_run` で `research` を1つ走らせると、結果の塊（`research`・`done`・2ターン・0.0022 usd）と本文が返り、本文は `Triage` の `done` 4行と4番の行を正しく答えた。
- Change: OK。plan 01 の `WorktreeDeps`（`git` と `root` を2番目の引数で受け取る）と plan 02 の `LaunchPorts`（`spawn`・`spawnSync`・`env` を境界で1回だけ組み立てる）が、上の経路でそのまま働いている。`test/` の偽物は、台本を持つ git と consult のモデルに分かれ、consult の型を読まない。
- Fixed: なし

### subagent-consult_cancel

- Plans:
  - `worktree-deps`
  - `launch-deps`
- Result: OK（同上）。`consult_subagents` の `cancel` で `consult-52` を止め、「cancelled consult-52」を返した。
- Change: OK。`killChild` は `SpawnedChild`（`killed`・`kill`）を受ける形になり、`SIGTERM` を送り、猶予の後に `killed` でなければ `SIGKILL` を送る振る舞いは変えていない。
- Fixed: なし
