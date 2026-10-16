# PLAN `consult-vocabulary`

## Files

```text
.pi/extensions/consult/
  index.ts                       update
  README.md                      update
  policy/
    types.ts                     update
    types.test.ts                update
  sub/
    budget.ts                    add
    budget.test.ts               add
    guard.ts                     add
    guard.test.ts                add
    spec.ts                      add
    spec.test.ts                 add
  child/
    budget.ts                    drop
    budget.test.ts               drop
    guard.ts                    drop
    guard.test.ts                drop
    spec.ts                      drop
    spec.test.ts                 drop
  run/
    subagent.ts                  add
    subagent.test.ts             add
    run.ts                       update
    delivery.ts                  update
    delivery.test.ts             update
    log.ts                       update
    log.test.ts                  update
    worktree.ts                  update
    worktree.test.ts             update
    child.ts                     drop
    child.test.ts                drop
  tool/
    subagents.ts                 add
    subagents.test.ts            add
    consult.ts                   update
    consult.test.ts              update
    commit.ts                    update
    commit.test.ts               update
    render.ts                    update
    render.test.ts               update
    run.ts                       update
    run.test.ts                  update
    sound.ts                     update
    sound.test.ts                update
    worktree.ts                  update
    worktree.test.ts             update
    children.ts                  drop
    children.test.ts             drop
README.md                        update
README.ja.md                     update
```

## Slices

## 1.ファイルとディレクトリを移す

### Types

なし

### Steps

1. `.pi/extensions/consult/child/` の 6 ファイルを `sub/` に移す（`budget.ts`、`budget.test.ts`、`guard.ts`、`guard.test.ts`、`spec.ts`、`spec.test.ts`）。
2. `.pi/extensions/consult/run/child.ts` と `run/child.test.ts` を `run/subagent.ts` と `run/subagent.test.ts` に移す。
3. `.pi/extensions/consult/tool/children.ts` と `tool/children.test.ts` を `tool/subagents.ts` と `tool/subagents.test.ts` に移す。
4. 移した先を import しているファイルの道を直す（`index.ts`、`tool/consult.ts`、`tool/render.ts`、`tool/commit.ts`、`run/run.ts`、`run/delivery.ts`、`run/log.ts`、`run/worktree.ts` と、それぞれのテスト）。

### Verify:

- test: `pnpm vitest run .pi/extensions/consult` と `pnpm typecheck`
  - (happy) `pnpm typecheck` → `root: ok` と `.pi: ok`
  - (happy) `.pi/extensions/consult` のテスト → 移す前と同じ本数が緑
  - (boundary values) `ls .pi/extensions/consult/child .pi/extensions/consult/run/child.ts .pi/extensions/consult/tool/children.ts` → どれも無い
  - _no case_: 移すこと自体 — 機械的で、上の 2 つが新しい道で緑になることが証拠になる

## 2.呼び方を揃える

### Types

```ts
// run/subagent.ts（元 run/child.ts）
export interface SubagentJob { readonly id: string; /* … */ }
export interface SubagentResult { /* … */ }
export function runOneSubagent(/* … */): /* … */;
export function subagentEnv(policy: TypePolicy): NodeJS.ProcessEnv;   // 元 childEnv

// run/run.ts
export type SubagentState = 'done' | 'turn-limit' | 'error' | 'aborted';   // 元 ChildState
export function stateOf(run: RunResult): SubagentState;

// run/log.ts
export interface RunRecord {
  readonly session: string;
  readonly subagent: string;   // 元 child
  /* … */
}

// tool/consult.ts
export interface RunningSubagent { /* … */ }   // 元 RunningChild

// tool/subagents.ts（元 tool/children.ts）
export interface SubagentsHost { /* … */ }     // 元 ChildrenHost
export type SubagentsArgs = ExecuteArgs;       // 元 ChildrenArgs
export function createSubagentsTool(host: SubagentsHost): /* … */;

// tool/render.ts
export interface SubagentReport { /* … */ }    // 元 ChildReport
```

- 残す名前: `run/run.ts` の spawn が返す物の locals（`killChild`、`live.child`、`const child = spawn(...)`、`child.stdout` など）。Node の `child_process` と同じ語で、エージェントを指していない（ADR 01 の「残す呼び方」）。

### Steps

1. `.pi/extensions/consult/run/subagent.ts`: `ChildJob` → `SubagentJob`、`ChildResult` → `SubagentResult`、`runOneChild` → `runOneSubagent`、`childEnv` → `subagentEnv`。日本語のコメントを「サブエージェント」「エージェント」（並べるときは「メインエージェント」）に揃える。
2. `.pi/extensions/consult/sub/budget.ts`、`sub/guard.ts`、`sub/spec.ts`: 日本語のコメントを `subagent.ts` と同じように揃える。
3. `.pi/extensions/consult/run/run.ts`: `ChildState` → `SubagentState`、`stateOf` の戻り。`stopped by the parent` → `stopped by the agent`。日本語のコメントも揃える。spawn の locals は触らない。
4. `.pi/extensions/consult/run/log.ts`: `RunRecord.child` → `RunRecord.subagent`。読むときの必須の欄も `subagent` にする（古い `child` は受けない）。
5. `.pi/extensions/consult/tool/consult.ts`: `RunningChild` → `RunningSubagent`、`startChild` → `startSubagent`、`controlChild` → `controlSubagent`、`describeChild` → `describeSubagent`、`nextChildId` → `nextSubagentId`、`announceRunningChildren` → `announceRunningSubagents`、`children` → `subagents`。記録を読む所の `record.child` → `record.subagent` も揃える。日本語のコメントも揃える。
6. `.pi/extensions/consult/tool/subagents.ts`: `ChildrenHost` → `SubagentsHost`、`ChildrenArgs` → `SubagentsArgs`、`createChildrenTool` → `createSubagentsTool`、`byChild` → `bySubagent`。日本語のコメントも揃える。
7. `.pi/extensions/consult/tool/render.ts`: `ChildReport` → `SubagentReport`。日本語のコメントも揃える。
8. `.pi/extensions/consult/index.ts`: `CHILDREN_PARAMETERS` → `SUBAGENTS_PARAMETERS`。記録を読む所の `record.child` → `record.subagent` も揃える。ツールの説明と起動の 1 行に出る `child` / `children` は、次の slice（名前）と分けて、ここでは語だけを揃える。
9. `.pi/extensions/consult/tool/commit.ts`: 日本語のコメントと `the child's work` → `the subagent's work`。
10. `.pi/extensions/consult/tool/run.ts`、`tool/worktree.ts`、`tool/sound.ts`、`policy/types.ts`: 説明の文と日本語のコメントを揃える。
11. `.pi/extensions/consult` の各テスト: 記録の fake の `child:` → `subagent:`、期待値の文、識別子、日本語のコメントを揃える。
12. `.pi/extensions/consult/run/log.test.ts`: `parseRun` が旧形の行（`child` 欄だけを持つ JSON）を捨てる case を足す。

### Verify:

- test: `pnpm vitest run .pi/extensions/consult` と `pnpm typecheck`
  - (happy) `pnpm typecheck` → `root: ok` と `.pi: ok`
  - (happy) `.pi/extensions/consult` のテスト → slice 1 と同じ本数 + 1（新しい case）が緑
  - (happy) `grep -rn "ChildJob\|ChildResult\|runOneChild\|childEnv\|ChildState\|RunningChild\|ChildrenHost\|ChildrenArgs\|createChildrenTool\|ChildReport\|CHILDREN_PARAMETERS" .pi/extensions/consult` → 0 件
  - (happy) `grep -rn "startChild\|controlChild\|describeChild\|byChild\|nextChildId\|announceRunningChildren" .pi/extensions/consult` → 0 件
  - (happy) `grep -rn "親" .pi/extensions/consult` → 道の親子（`親ディレクトリ`）だけが残る（`run/worktree.test.ts:204,508`）
  - (happy) `grep -rn "subagent" .pi/extensions/consult/run/log.ts` → 記録の欄の名前に出る
  - (happy) `grep -n "stopped by the agent" .pi/extensions/consult/run/run.ts` → 1 行、`grep -rn "stopped by the parent" .pi/extensions/consult` → 0 件
  - (happy) `grep -n "the subagent's work" .pi/extensions/consult/tool/commit.ts` → 出る、`grep -rn "the child's work" .pi/extensions/consult --include="*.ts"` → 0 件
  - (happy) `grep -rn "サブエージェント" .pi/extensions/consult/tool/run.ts .pi/extensions/consult/tool/worktree.ts .pi/extensions/consult/tool/sound.ts .pi/extensions/consult/policy/types.ts` → 出る
  - (boundary values) `grep -n "killChild\|live.child" .pi/extensions/consult/run/run.ts` → 残る（spawn の呼び方）
  - (boundary values) 旧形の行を `parseRun` に読ませる → `undefined`（ADR 05 の決定）
  - (error) `parseRun` の欄の名前を `child` に戻す → `pnpm vitest run .pi/extensions/consult/run/log.test.ts` と `tool/subagents.test.ts` が赤（書く側と読む側の名前が揃っていることを見る）

## 3.ツールの名前と場所の呼び方

### Types

```ts
// tool/subagents.ts
export const USAGE = 'consult_subagents: action is list (default) or cancel. cancel needs id';

// index.ts
// name: 'consult_subagents'、label: 'Consult subagents'
```

### Steps

1. `.pi/extensions/consult/index.ts`: 登録名 `consult_children` → `consult_subagents`、`label`、`description`、`promptSnippet`、`promptGuidelines` に出る名前を揃える。起動の 1 行（`consult: N child(ren) are still running ... (see consult_children)`）も揃える。
   - Outside: design の `External` の `pi`。名前はこの `name` が決める。実行中のセッションは `/reload` まで古い名前のままで、次回の起動は新しい名前になる（この plan では何もしない）。
2. `.pi/extensions/consult/tool/subagents.ts`: `USAGE` と、投げるエラーの文に出る名前を `consult_subagents` にする。
3. `.pi/extensions/consult/tool/consult.ts`: 知らせの頭の `consult_new:` → `consult_subagents:`（8 か所）。日本語のコメントの `consult_new` も揃える。
4. 場所の呼び方を `base` に揃える: `tool/render.ts` の `'parent tree'` → `'base'`、`tool/subagents.ts` の `'parent'` → `'base'`、`tool/run.ts` と `index.ts` の `runs in the parent tree` → `runs in the base`、`tool/worktree.ts` の `Defaults to the parent's HEAD` → `Defaults to the base HEAD`。
5. 各テスト: 期待値の文に出る `consult_children`、`consult_new:`、`parent tree`、`parent` を揃える。`run/subagent.test.ts` の fake の道 `cwd: '/tmp/parent'` を `/tmp/base` にする。
6. テストに 2 つの assertion を足す: `USAGE` が `consult_subagents:` で始まること、知らせの文が `consult_subagents:` で始まること。

### Verify:

- test: `pnpm vitest run .pi/extensions/consult`
  - (happy) `.pi/extensions/consult` のテスト → 緑（slice 2 の本数 + 追加分）
  - (happy) `grep -rn "consult_children" .pi/extensions/consult --include="*.ts"` → 0 件
  - (happy) `grep -rn "consult_new" .pi/extensions/consult --include="*.ts"` → 0 件
  - (happy) `grep -c "consult_subagents: " .pi/extensions/consult/tool/consult.ts` → 8
  - (happy) `grep -n "name: 'consult_subagents'" .pi/extensions/consult/index.ts` → 1 行、`grep -n "label: 'Consult subagents'" .pi/extensions/consult/index.ts` → 1 行
  - (happy) `grep -rn "parent" .pi/extensions/consult --include="*.ts"` → 0 件
  - (boundary values) `grep -rn "consult_run\|consult_worktree\|consult_commit" .pi/extensions/consult --include="*.ts"` → 名前を変えないツールの行だけが残る（`index.ts` の登録、`policy/types.ts` の一覧、`tool/run.ts` の説明）
  - (error) `USAGE` の名前を戻す → 赤（新しい assertion が押さえる）
  - (error) `consult_new:` を 1 か所戻す → 赤（どの分岐でも頭を見る新しい assertion が押さえる）

## 4.文書を揃える

### Types

なし

### Steps

1. `.pi/extensions/consult/README.md`: ツールの表、見出し、本文、例の名前を `consult_subagents` に、呼び方を `agent` / `subagent` と `base` / `worktree` に揃える。
2. `README.md`（root）: ツールの一覧の `consult_children` の行と、説明の `children` / `child` を揃える。`parent's HEAD` も `base` に揃える。
3. `README.ja.md`（root）: 同じ行を日本語で揃える（「子を一覧し」「子が…」「親の `HEAD`」）。

### Verify:

- cli: 文書の grep
  - (happy) `grep -rn "consult_children" README.md README.ja.md .pi/extensions/consult/README.md` → 0 件
  - (happy) `grep -n "consult_subagents" README.md README.ja.md .pi/extensions/consult/README.md` → 3 ファイルすべてに出る
  - (happy) `grep -rn "child\|children\|parent" README.md .pi/extensions/consult/README.md` → 0 件
  - (happy) `grep -n "サブエージェント" README.ja.md` → 出る
  - (happy) `grep -rn "子が\|子を\|子の\|親の" README.ja.md` → 0 件
  - _no case_: 文の正しさ — 振る舞いは code の slice が決めており、ここは名前の一致だけを見る

## 5.統合: 呼び方が 1 つになっている

### Types

なし

### Steps

1. `memo/consult-vocabulary.md` は触らない（close で消える）。
2. 残る呼び方を確かめる: `.pi/extensions/consult` に残るのは `node:child_process` と spawn の locals だけ、`.pi/skills` に残るのは `Boundary` の親子と `createLeafDir` だけである。

### Verify:

- cli: `pnpm typecheck` / `pnpm test:run` / `pnpm lint` と、残りの grep
  - (happy) `pnpm typecheck` → `root: ok` と `.pi: ok`
  - (happy) `pnpm test:run` → 緑（着手前は 37 files / 608 tests）
  - (happy) `pnpm lint` → 緑
  - (happy) `grep -rn "child\|parent" .pi/extensions/consult --include="*.ts"` → `node:child_process` の 5 行（`run/run.ts:7`、`run/worktree.ts:13`、`run/worktree.test.ts:2`、`run/git-env.ts:2`、`tool/sound.ts:12`）と、`run/run.ts` の spawn の locals と、旧形破棄のテスト（`run/log.test.ts:207,208`）の 2 行だけ
  - (happy) `grep -rn "child\|children\|parent" .pi/extensions/consult/README.md README.md README.ja.md` → 0 件
  - (happy) `grep -rn "consult_children" .pi/ README.md README.ja.md` → 0 件
  - (happy) `grep -rn "parent\|children" .pi/skills` → 変えないと決めた 4 か所だけ（`.pi/skills/design/references/format.md:79,80`、`.pi/skills/adr/references/format.md:42` の `parentheses`、`.pi/skills/adr/scripts/scaffold.mjs:116-122` の `parentDir`、`.pi/skills/adr/scripts/scaffold.test.ts:98-111` の locals）
  - (happy) `grep -c "consult_" .pi/extensions/intent-router/state.ts` → 1（`consult_run`。名前を変えないツール）
  - (happy) `grep -n "consult_subagents" .pi/extensions/consult/index.ts` → 登録名、説明、起動の 1 行に出る
  - (happy) `git diff --name-only -- memo/consult-vocabulary.md` → 空（触らない。close で消える）

## Notes

### Slice 1: ファイルとディレクトリを移す

- Findings: なし
- Unplanned: なし
- Commit: f7167a7

### Slice 2: 呼び方を揃える

- Findings:
  - 道の親子（`run/worktree.test.ts:204,508` の `親ディレクトリ`）はエージェントを指していないので `親` が残る
    - left: 道の親子は呼び方の対象外のため（エージェント/サブエージェント・ベース/worktree のいずれでもない）
- Unplanned: なし
- Commit: 0463af0

### Slice 3: ツールの名前と場所の呼び方

- Findings: なし
- Unplanned: なし
- Commit: 6007525

### Slice 4: 文書を揃える

- Findings: なし
- Unplanned: なし
- Commit: 3f70f2c

### Slice 5: 統合: 呼び方が 1 つになっている

- Findings:
  - 旧形破棄のテスト（`run/log.test.ts:207,208`）は旧欄名 `child` を字面に含むので `child` の grep に 2 行残る
    - left: 旧形を受けないことを示すには旧欄名を書くしかないため（書く側・読む側は `subagent` で揃っている）
- Unplanned: なし
- Commit: ccff683

## Review

### Round 1

- Stale:
  - `cycles/261016-019-dev/plan/consult-vocabulary.md:218` の期待（`child|parent` の grep は node:child_process の 5 行と `run/run.ts` の spawn locals だけ）は今のツリーと食い違う。`.pi/extensions/consult/run/log.test.ts:207,208` が旧欄名 `child` を字面に含み grep に残ることは `## Notes`（同 plan `cycles/261016-019-dev/plan/consult-vocabulary.md:256`）自身が認めており、Verify の文にその 2 行の扱いが無い。
    - fixed: slice 5 の Verify に旧形破棄テストの 2 行の扱いを追記した
- Unlisted:
  - `.pi/extensions/consult/tool/run.test.ts:4` は差分にあるのに `## Files` に名指しが無い（`cycles/261016-019-dev/plan/consult-vocabulary.md:47` は `tool/run.ts` のみ）。現行 4 行目のサブエージェント文が語彙変更の対象。
    - fixed: `## Files` に `tool/run.test.ts` の update を追記した
  - `.pi/extensions/consult/tool/worktree.test.ts:73` は差分にあるのに `## Files` に名指しが無い（`cycles/261016-019-dev/plan/consult-vocabulary.md:50` は `tool/worktree.ts` のみ）。現行 73 行目のサブエージェント文などが語彙変更の対象（plan md 自体の差分は記録のため除外）。
    - fixed: `## Files` に `tool/worktree.test.ts` の update を追記した
- Gaps:
  - `cycles/261016-019-dev/plan/consult-vocabulary.md:120` の Steps（`stopped by the parent` → `stopped by the agent`）に対応する case が同 slice の Verify（`cycles/261016-019-dev/plan/consult-vocabulary.md:133-142`）に無い。現行 `.pi/extensions/consult/run/run.ts:481` が新文を持つが、それを指す grep も assertion も無い。
    - fixed: slice 2 の Verify に新旧の文を見る grep の case を追記し、回して緑を確認した
  - `cycles/261016-019-dev/plan/consult-vocabulary.md:126` の Steps（`the child's work` → `the subagent's work`）に対応する case が Verify に無い。現行 `.pi/extensions/consult/tool/commit.ts:61` が新文を持つが、旧文の有無を見る case が無い。
    - fixed: slice 2 の Verify に新旧の文を見る grep の case を追記し、回して緑を確認した
  - `cycles/261016-019-dev/plan/consult-vocabulary.md:127` の Steps（`tool/run.ts`・`tool/worktree.ts`・`tool/sound.ts`・`policy/types.ts` の説明文と日本語コメント）にファイル名指しの case が Verify に無い。例 `.pi/extensions/consult/tool/sound.ts:2` のサブエージェント文など。
    - fixed: slice 2 の Verify に 4 ファイルのサブエージェント文を見る case を追記し、回して緑を確認した
  - `cycles/261016-019-dev/plan/consult-vocabulary.md:209` の Steps（`memo/consult-vocabulary.md` は触らない）に対応する case が同 slice の Verify（`cycles/261016-019-dev/plan/consult-vocabulary.md:214-223`）に無い。
    - fixed: slice 5 の Verify に memo の差分が空を見る case を追記し、回して緑を確認した
  - `README.ja.md:18` の「base はベースの `HEAD`」と `.pi/extensions/consult/run/worktree.ts:75,79` の同じ形の文は、`base` と「ベース」が続いて読みにくい（agent の指摘）
    - fixed: 3 か所を「base の既定は HEAD（`HEAD`）」の形に直した
- Unproven:
  - `cycles/261016-019-dev/plan/consult-vocabulary.md:177`（`consult_new:` を 1 か所戻すと赤）は、新 assertion が空一覧の 1 文しか見ないため、他の 7 か所を戻しても vitest は緑のまま。`.pi/extensions/consult/tool/consult.test.ts:503-510` は `.pi/extensions/consult/tool/consult.ts:149` の空一覧文だけを見て、例 `.pi/extensions/consult/tool/consult.ts:166` の cancel 文などを押さえない。`grep consult_new → 0 件`（同 plan `cycles/261016-019-dev/plan/consult-vocabulary.md:171`）は手動で、vitest だけでは赤にならない。
    - fixed: 7 分岐をまとめて頭を見る assertion と cancel 使い方の頭の assertion を足し、166 行目を戻すと赤になることを回して確認した。Verify の文も「どの分岐でも」に直した
  - `cycles/261016-019-dev/plan/consult-vocabulary.md:135`（slice 1 と同じ本数 + 1 が緑）は本数自体を自動で押さえない。旧形破棄の 1 本 `.pi/extensions/consult/run/log.test.ts:207,208` を消しても残りは緑のまま。
    - left: 本数を vitest で自動化する仕組みが無いため。旧形破棄の case 自体はあり、削除は差分で見るしかないので close に残す
  - `cycles/261016-019-dev/plan/consult-vocabulary.md:160` の Steps のエラーの文の頭（例 `.pi/extensions/consult/tool/subagents.ts:153,159` の `consult_subagents:`）を旧名に戻しても vitest は緑のまま。`.pi/extensions/consult/tool/subagents.test.ts:263,277` は接尾辞（`/cancel needs id/`・`/action is list or cancel/`）しか見ず、頭を押さえない（頭を見るのは `USAGE` 定数の assertion `.pi/extensions/consult/tool/subagents.test.ts:280,281` だけ）。
    - fixed: 2 つの rejects の正規表現に `consult_subagents:` の頭を含め、153 行目を戻すと赤になることを回して確認した
- Doubts:
  - 旧記録（`child` 欄）の破棄が走行中の引継ぎに何を起こすか、前提が疑わしい。`.pi/extensions/consult/run/log.ts:103-108` と `cycles/261016-019-dev/plan/consult-vocabulary.md:121,142`（古い `child` は受けない、ADR 05 の決定）では、上げ前後にまたがる走行中サブエージェントが一覧から消える扱いになるが、移行も両受けもしない理由の検討が見えない。finding ではなく設計への疑い。
  - 改名の外側への波及の受口が疑わしい。`.pi/extensions/consult/index.ts:172` の登録名変更に対し `cycles/261016-019-dev/plan/consult-vocabulary.md:159` は実行中セッションは旧名のまま・次回起動で新名として何もしないが、外側の自動化や手順書が旧名を呼ぶ場合の壊れをどこで受けるかの前提が見えない。finding ではなく前提への疑い。
  - spawn locals の `child` 残しの線引きが疑わしい。`.pi/extensions/consult/run/run.ts:191` の `killChild` 等を残すことは `cycles/261016-019-dev/plan/consult-vocabulary.md:114,140` で決めているが、将来の読み手が Node の `child_process` の子とサブエージェントの子のどちらの `child` か誤読する余地が残る。finding ではなく言葉の設計への疑い。

## Acceptance

- Ran:
- Findings:
- Doubts:
