# ADR 019

## 01: エージェントとサブエージェントの呼び方

### Context

- `.pi/extensions/consult` は、2 つのエージェントを `child` / `parent` と呼んでいる
- `DEFINITION.md` は既に「サブエージェント」と書き、名前も `subagent-consult` にしている
- スキル（`.pi/skills/adr`、`design`、`plan`）も、サイクル 017 で `subagent` に揃えた
- 揃っていないのはこの拡張だけで、同じ相手に 2 つの呼び方が残っている
- 英語の識別子だけではない。日本語のコメントも「子」「親」を使っている（33 ファイル）。表示の文と commit の文にも `child` がある
- 呼び方を変えるだけで、振る舞いは変えない

### Decision

- Status: **accepted**
- Adopted:
  - 呼び方を `agent` / `subagent` にする
  - 両方を並べて書くときは、`the main agent` と書く
  - 識別子も揃える（`ChildJob` → `SubagentJob`、`runOneChild` → `runOneSubagent`、`ChildReport` → `SubagentReport` など）
  - 日本語のコメントは「エージェント」と「サブエージェント」に揃える。並べて書くときは「メインエージェント」と書く
  - commit の文を `consult(<unit>): the child's work` から `consult(<unit>): the subagent's work` にする
  - `consult_run` が返す報告の文、`index.ts` の起動の 1 行、エラーの文も揃える
  - `run/run.ts` の `stopped by the parent` も `stopped by the agent` にする
- Options:
  - `child` を残す（`DEFINITION.md` とスキルでは `subagent` なので、2 つの呼び方が並ぶ）
  - 英語の識別子だけ変える（日本語のコメントと表示の文に「子」が残る）

### Research & Trial

- 出てくる所（`.pi/extensions/consult`）: `.ts` の `child` / `parent` が 26 ファイル、日本語の「子」「親」が 33 ファイル、`README.md` が 67 行
- 残す呼び方:
  - `node:child_process`（`tool/sound.ts:12`）。Node の API の名前。
  - `definition/format.md` の `the children: the conditions`。定義のブロックの子を指す
  - `.pi/skills/design/references/format.md` の `parent line` と `children`。外の物の親子を指す
  - `.pi/skills/adr/scripts/scaffold.mjs` の `createLeafDir(parentDir, name)`。ディレクトリの親子を指す
  - `run/run.ts` の spawn が返す物の locals（`killChild`、`live.child`、`child.stdout` など）。Node の `child_process` と同じ語で、エージェントを指していない
- 受け入れの条件:
  - `grep -rn "child\|parent" .pi/extensions/consult` に出るのが、上の 5 つだけになる
  - `grep -rn "consult_children" .pi/ README.md README.ja.md` が 0 になる
  - `.pi/extensions/consult` のテストが通る

### Definition Change

- `Unit.subagent-consult`(updated)（`DEFINITION.md` の行は動かない。呼び方だけが変わる）

## 02: ツールの名前

### Context

- `consult_children` は pi が登録するツールの名前で、この拡張の外から見える。変えるときは一括で変える
- 呼ぶ側は 3 つある。`index.ts`（登録名、説明、起動の 1 行）、`tool/children.ts`（`USAGE` とエラー）、README 3 ファイルが呼んでいる
- `intent-router` は `consult_run` しか見ていない。この改名の影響は受けない
- 改名した物は `scripts/harness.json` の一覧でプロダクトへ届く。`copy` に `.pi` と `AGENTS.md` が入っているためである。届かないのは `README.md`、`README.ja.md`、`cycles`、`records`、logs である

### Decision

- Status: **accepted**
- Adopted:
  - `consult_children` を `consult_subagents` にする
  - `USAGE`、エラーの文、ツールの説明、起動の 1 行に出る名前も揃える
  - 知らせの頭にある `consult_new:` も `consult_subagents:` に揃える（`consult_new` というツールは無いため）
- Options:
  - `consult_subs`（短いが、他の呼び方と揃わない）
  - そのまま（名前に古い語が残り、この拡張の呼び方だけが変わる）
  - `consult_new:` はそのまま（存在しないツールの名前が、利用者の読む文に残る）

### Research & Trial

- 出てくる所: `index.ts:95,172,175,178`、`tool/children.ts:2,55,153,159`、`README.md:15`、`README.ja.md:15`、`.pi/extensions/consult/README.md:14,55,59,186,193`
- `intent-router` が見るツール名は `consult_run` だけ（`state.ts:170`、`settings.ts:240`、`state.test.ts:159`）
- 決めているのはこの拡張で、pi の側に同じ名前は無い（`index.ts` の `name`）

### Definition Change

- `Unit.subagent-consult`(updated)（`DEFINITION.md` の行は動かない。ツールの名前だけが変わる）

## 03: ファイルとディレクトリの名前

### Context

- ファイルとディレクトリの名にも `child` / `children` が残っている。`child/`（`budget.ts` / `guard.ts` / `spec.ts`）、`run/child.ts`、`tool/children.ts`。テストも同じ名で隣に並ぶ
- 呼び方を変えた後にファイル名だけ古いままだと、読む人は 2 つの呼び方を突き合わせることになる

### Decision

- Status: **accepted**
- Adopted:
  - `child/` を `sub/` にする
  - `run/child.ts` を `run/subagent.ts` にする
  - `tool/children.ts` を `tool/subagents.ts` にする
  - テストの名前も揃える（`child.test.ts` → `subagent.test.ts`、`children.test.ts` → `subagents.test.ts`）
  - 中身は呼び方だけを変えて、振る舞いは変えない
- Options:
  - `child/` のまま（ファイル名に古い呼び方が残る）
  - `subagent/`（長い。`run/subagent.ts` と重なる）
  - `sub/`（依頼の案）

### Research & Trial

- 移す物: `child/budget.ts` / `child/guard.ts` / `child/spec.ts` と、そのテスト 3 本（`budget.test.ts` / `guard.test.ts` / `spec.test.ts`）
- 追随する物: `index.ts`、`run/child.ts`、`tool/children.ts`、`tool/consult.ts`、`run/run.ts`、`run/delivery.ts`、`run/log.ts`、`run/worktree.ts` の import
- `policy/types.ts` は役の一覧を持つが、`child` という呼び方は使っていない

### Definition Change

- `Unit.subagent-consult`(updated)（`DEFINITION.md` の行は動かない。ファイルの名前だけが変わる）

## 04: 実行する場所の呼び方

### Context

- 「親」はエージェントだけではなく、場所にも使われている
  - `place: parent tree`（`tool/render.ts:41`）
  - `parent`（`tool/children.ts:101`。一覧の場所の欄）
  - `runs in the parent tree`（`tool/run.ts:20`、`index.ts:158`。ツールの説明）
  - `Defaults to the parent's HEAD`（`tool/worktree.ts:35`）
  - consult の README の表と文（`the parent's tree` など）
- エージェントを指す物もある。`stopped by the parent`（`run/run.ts:481`）は 01 で変える
- 呼び方は、`consult_worktree` では既に `base` と `worktree` にしている。`base` は「何からブランチを切るか」を指す
- 01 でエージェントの呼び方を変えると、`parent` は場所としてだけ残る

### Decision

- Status: **accepted**
- Adopted:
  - 場所の呼び方を `base` / `worktree <id>` に揃える
  - `place: parent tree` を `place: base` にする（`tool/render.ts:41`）
  - 一覧の場所の欄の `parent` を `base` にする（`tool/children.ts:101`）
  - ツールの説明の `runs in the parent tree` を `runs in the base` にする（`tool/run.ts:20`、`index.ts:158`）
  - `worktree` の `base` の説明にある `parent's HEAD` も `base` に揃える（`tool/worktree.ts:35`）
  - README の表と文の `the parent's tree` も揃える
- Options:
  - `main tree` にする（`consult_worktree` の `base` と別の呼び方になり、2 つの語が並ぶ）
  - 触らない（場所の呼び方が `parent tree` のまま残り、01 の後は `parent` が場所だけを指す）

### Research & Trial

- 場所として `parent` が出てくる所: `tool/render.ts:41`、`tool/children.ts:101`、`tool/run.ts:20`、`tool/worktree.ts:35`、`index.ts:158`、`run/run.ts:481`、consult の README の 8 行
- エージェントとして `the parent` が出てくる所: consult の README の 8 行（01 で変える）

### Definition Change

- `Unit.subagent-consult`(updated)（`DEFINITION.md` の行は動かない。場所の呼び方だけが変わる）

## 05: 追従（この repo のどこを直すか）

### Context

- このサイクルの目的は統一なので、古い呼び方が残っている所を全部直す
- 洗い出した結果、この repo の内容で直す所は 2 つである。`.pi/extensions/consult` の全部と、root の `README.md` と `README.ja.md` である
- スキルと `intent-router` には古い呼び方は無い。あるのは名前を変えない `consult_worktree` と `consult_run` だけである（調べた）
- 履歴は書き換えない。`cycles`、`.pi/extensions/intent-router/logs`（gitignore 対象）、consult の記録 `records`、すでにある commit の文である
- `memo/consult-vocabulary.md` はこのサイクルの close で消す
- ハーネスは `scripts/harness.json` の `copy` の一覧でプロダクトへ渡る。その中に `.pi` と `AGENTS.md` があるので、改名した物は次の pull でプロダクトへ届く。届かないのは `README.md`、`README.ja.md`、`cycles`、`records`、logs である

### Decision

- Status: **accepted**
- Adopted:
  - この repo の内容を全部直す。`.pi/extensions/consult` の全部と、root の `README.md`、`README.ja.md` である
  - ハーネスの一覧に入っている物（`.pi`、`AGENTS.md`）は、次の pull でプロダクトへ届く
  - 履歴（`cycles`、logs、`records`、すでにある commit の文）は書き換えない
  - 記録の `child` 欄は `subagent` にする。変える前に書かれた行は読めなくなる（今日と昨日の分が対象だが、走っている子も届け待ちの知らせも無いことを確かめた）
- Options:
  - 古い名前のツールを残して中継する（統一に反する。2 つの名前が残る）
  - 記録を読むときに古い `child` も受ける（2 日で誰も読まなくなる行のための分岐が、読むコードに残る）
  - プロダクトの root の `README.md` も一覧に入れる（プロダクトが書いた README を pull が上書きする。018 の「README はプロダクトの物」という決定を崩す）
  - 何もしない（統一にならない）

### Research & Trial

- この repo の内容で古い呼び方がある所: `.pi/extensions/consult/index.ts:95,172,175,178`、`tool/children.ts:2,55,153,159`、root の `README.md:14,15,17,18`、`README.ja.md:14,15,17,18`、`.pi/extensions/consult/README.md` の 16 行
- スキルと `intent-router` にあるのは、名前を変えない `consult_worktree` と `consult_run` だけである（`.pi/skills/work/SKILL.md:35,71`、`.pi/skills/close/SKILL.md:65`、`.pi/extensions/intent-router/state.ts:170`、`settings.ts:240`、`state.test.ts:159`、`README.md:61`）
- 履歴: `cycles`、`.pi/extensions/intent-router/logs/2026-10-*.jsonl`（`.gitignore:25` の `logs/`）、`records`（`run/place.ts:36-38` が決める実行時の置き場で、この repo には無い）
- コピーの一覧: `scripts/harness.json:2-24` に `.pi`、`AGENTS.md`、`definition`、`lib`、`scripts` などがある。`README.md`、`README.ja.md`、`cycles`、`records` は無い。`skip` は `logs`、`harness.local.json`、`harness.mode.json`
- 渡し方: `scripts/harness.mjs:236-260`（先にだけある物は `remove`）、`:301-312`（消してから写す）

### Definition Change

- なし（動くのは 01〜04 で名前を書いた `Unit.subagent-consult` である）
