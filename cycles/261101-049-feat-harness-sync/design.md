# DESIGN 049

## Affected

### 01: 一覧は方向ごとに何を持ち、相手側のパスはどこに置くか

- `package.json` — `harness:pull` と `harness:push` で `scripts/harness/index.mjs` を起動する。
- `vitest.starter.config.ts` — `vitest.config.ts` から `testConfig` を輸入する。
- `.pi/skills/plan/SKILL.md` — 形と規則と校正の対象として `plan/references/format.md` を読む。
- `.pi/skills/plan/references/tasks.md` — 形を `plan/references/format.md` に求める。
- `.pi/skills/work/references/tasks.md` — `## Test cases` を `plan/references/format.md` に求める。

### 02: 一覧に載せたパスがコピー元にないとき、どう知らせてどう終わるか

- `package.json` — `harness:pull` と `harness:push` で実行する。
- `scripts/harness/harness.json` — `copy` に `scripts/harness` を含む。
- `scripts/product-ready/targets.mjs` — `README.md` と `README.ja.md` を置換の対象に列挙する。

### 03: コードのコメントとテスト名の「道」を、どこまでどう直すか

- `package.json` — `harness:pull` と `harness:push` で `scripts/harness/index.mjs` を呼ぶ。
- `scripts/product-ready/index.mjs` — `targets.mjs` から `labels`、`plan`、`remove`、`skeletonFor` を輸入する。
- `scripts/product-ready/cli.test.ts` — `test/scripts.fixture.ts` から定数を輸入する。
- `scripts/product-ready/index.test.ts` — `test/scripts.fixture.ts` から定数を輸入する。
- `vitest.starter.config.ts` — `vitest.config.ts` から `testConfig` を輸入する。
- `.pi/extensions/consult/index.ts` — `run/place.ts` の `placeFor` と `tool/commit.ts` の `COMMIT_PARAMETERS`、`commitExecute` を輸入する。
- `.pi/extensions/consult/tool/subagents.ts` — `run/place.ts` の `Place` を型として輸入する。
- `.pi/extensions/consult/tool/consult.ts` — `run/place.ts` の `Place` を型として輸入する。
- `.pi/extensions/consult/tool/worktree.ts` — `run/place.ts` の `Place` を型として輸入する。
- `.pi/extensions/consult/run/delivery.ts` — `run/place.ts` の `Place` を型として輸入する。
- `.pi/extensions/consult/run/log.ts` — `run/place.ts` の `dayFile` と `windowFiles` を輸入する。
- `.pi/extensions/consult/index.test.ts` — `run/place.ts` の `placeFor` を輸入する。
- `.pi/extensions/consult/tool/subagents.test.ts` — `run/place.ts` の `placeFor` を輸入する。
- `.pi/extensions/consult/tool/consult.test.ts` — `run/place.ts` の `placeFor` を輸入する。
- `.pi/extensions/consult/tool/worktree.test.ts` — `run/place.ts` の `placeFor` を輸入する。
- `.pi/extensions/consult/run/delivery.test.ts` — `run/place.ts` の `placeFor` を輸入する。
- `.pi/extensions/consult/run/log.test.ts` — `run/place.ts` の `placeFor` を輸入する。
- `tsconfig.json` — `include` で `scripts`、`test`、`vitest.config.ts` を含め、`.pi` を外す。
- `.pi/tsconfig.json` — `include` で `.pi` を含める。
- `scripts/checks/scopes.json` — 型検査の対象に `.pi` を指定する。
- `scripts/checks/typecheck.mjs` — `scopes.json` と各 `tsconfig.json` で `tsc -p` を回す。
- `scripts/checks/typecheck-staged.mjs` — 対象ファイルを `tsconfig` ごとに分け、一時 `tsconfig` で `tsc -p` を回す。
- `.oxlintrc.json` — 対象外に `dist` と `node_modules` を置き、対象の test 規定を持つ。
- `.oxfmtrc.json` — 対象外に `tsconfig` を置く。
- `lefthook.yaml` — `pre-commit` と `pre-push` で `format`、`lint`、`typecheck`、`test` を走らせる。
- `vitest.starter.config.ts` — `testConfig(true)` で全てのテストを走らせる。

## External

### 01: 一覧は方向ごとに何を持ち、相手側のパスはどこに置くか

- `/Users/yuyahanada/Desktop/main/_pj-starter-pi-v3` — `starter` に置き、pull は `copy` のパスをそこから写し、push は `push` のパスをそこへ写す。
- Node v24.22.1 の `fs.globSync` — 一覧の項目に書いたパスと glob を解決する。

### 02: 一覧に載せたパスがコピー元にないとき、どう知らせてどう終わるか

- コピー元のファイルシステム — 存在しないパスと読めないパスを区別せず、`missing` として集める。
- 標準出力 — 見出しの次に `missing (<件数>):` のセクションを置き、1 件につき 1 行を出す。
- 終了コード — コピー元にないパスがあれば、`--run` の有無にかかわらず 1 を返す。
- `--run` の引数 — なしでは表示だけで終わり、ありでは写せるパスを写したあとに終わる。

### 03: コードのコメントとテスト名の「道」を、どこまでどう直すか

- なし

## `harness-transport`

### ADR & Where

- No: 01, 02, 03
- Why: 01 と 02 は同じ `scripts/harness/index.mjs` の収集、表示、適用を書き換え、03 のそのファイルの語も同じ書き換えの中に置けるため、1 つの worktree で続けて行い、待つものはない。
- Where: worktree

### Goal

- `scripts/harness/harness.json` を読むと、`starter`、`copy`、`push` の 3 キーだけがあり、`skip` と `legacy` がない。
- `scripts/harness/harness.json` の `copy` に、`definition` のような存在しないパスが残っていない。
- `scripts/harness/index.mjs` の diff を読むと、`remove`、`pruneEmptyDirs`、`collectLegacy`、`skip` の読み取りがなくなっている。
- `scripts/harness/index.mjs` を読むと、pull は `copy`、push は `push` を読み、`--run` では写すだけで、消さない。
- `scripts/harness/index.mjs` を読むと、一覧の項目を `fs.globSync` で解決し、一致が 0 件の項目を「ない」ものとして扱う。
- `scripts/harness/list.mjs` を読むと、`starter`、`copy`、`push` だけを読み、`skip` と `legacy` を読まない。
- `scripts/harness/list.mjs` を読むと、キーがないときに空として扱い、キーの有無で分岐しない。
- `scripts/harness/list.mjs` の `harnessExcludes` を読むと、`copy` と `push` の両方から glob を作る。
- `scripts/harness/index.mjs` を読むと、`starter` がない、JSON でない、指されたパスがないときに、今と同じ 1 行のエラーで止まる。
- `copy` または `push` が配列でない `harness.json` で `pnpm harness:pull` を走らせると、今と同じ 1 行のエラーで止まる。
- `scripts/harness/starter.json` を消し、`scripts/harness/harness.json` の `starter` に相手のパスを書いた状態で `pnpm harness:pull` を走らせると、同じ一覧で動く。
- `scripts/harness/harness.json` の `copy` に `scripts/harness/*.mjs` と `scripts/harness/*.test.ts` を書いて `pnpm harness:pull` を走らせると、`harness.json` と `starter.json` が写る先に出ない。
- `scripts/harness/config.test.ts` を読むと、`test/` 直下の `*.ts` を `copy` に求めるテストがなくなっている。
- `vitest.config.ts` の `testConfig(false)` を走らせると、`copy` と `push` の両方の項目が `exclude` に入る。
- `README.md`、`README.ja.md` を読むと、`copy`、`push`、`starter` の 3 キーと、消さないことと、glob が書かれている。
- `.pi/skills/plan/references/format.md` の 106 行目を読むと、`test/` の備品を `copy` に載せると書かれ、2 つの一覧のどちらかが分かる。
- `scripts/harness/index.mjs` を読むと、コピー元にないパスを `missing` として集め、見出しの次に `missing (<件数>):` のセクションを置き、1 件につき 1 行を出す。
- 一覧に存在しないパスを 1 つ書いた状態で `pnpm harness:pull` を走らせると、`missing` の行が出て、終了コードが 1 になる。
- 同じ状態で `pnpm harness:pull --run` を走らせると、写せるパスは写り、終了コードが 1 になる。
- 読み取りの権限がないファイルを `copy` に書いたツリーで `pnpm harness:pull` を走らせると、`missing` のセクションにそのパスが出ない。
- `README.md`、`README.ja.md` を読むと、`missing` のセクションと、終了コード 1 が書かれている。
- `scripts/harness/index.mjs`、`list.mjs`、`index.test.ts`、`list.test.ts`、`config.test.ts`、`vitest.config.ts` で `grep 道` が 0 件になる。
- `scripts/harness/list.mjs` を読むと、プレースホルダーが `<パス>` になっている。
- `scripts/harness/index.test.ts` を読むと、「同じ道」が「同じやり方」などの方法の意味の語に直っている。
- `scripts/harness/index.test.ts` を読むと、`remove` と `legacy` のセクションを確かめるテストがなく、`missing` のセクションを確かめるテストがある。
- `test/scripts.fixture.ts` に「道」が残っていない。
- `scripts/harness/list.mjs` の `置き場` は、そのまま残っている。

### Non-goal

- 一覧の外にあるパスを消さない、比べない (理由: 一覧の内側のプロダクト独自ファイルが pull で消え、消すことが誤爆になるため)。
- `skip` を残さない (理由: 削除をやめると保護の仕事がなくなり、一覧に書かないことで外せるため)。
- `legacy` を残さない (理由: 消すことが起きないため)。
- 方向ごとに `skip` と `legacy` を持たない (理由: 方向差を使う場面がなく、2 つの一覧を合わせる手間だけが増えるため)。
- 方向のキーを分けない形に戻さない (理由: プロダクト側の変更が push で戻る問題が残るため)。
- `scripts/harness/starter.json` を残さない (理由: 一覧と相手側のパスが別々のファイルに分かれたままで、オーナーの指示に反するため)。
- 除外を `copy` だけから作らない (理由: `push` にだけ書いたパスがテストから漏れるため)。
- `copy` と `push` を必須にしない (理由: 書いてあるものだけを見るので、キーの有無で動きを変えないと決めたため)。
- キーがない向きを走らせたときだけエラーにしない (理由: キーの有無で動きを変えないと決めたため)。
- コピー元にないパスで、写す前に止まらない (理由: 1 件の書き間違いで、他のパスの運搬も止まるため)。
- コピー元にないパスがあるときに、終了コード 0 にしない (理由: 書き間違いが成功として通り、`missing` は一覧の状態についての知らせで、写したかどうかとは別だから)。
- 既存プロダクトの移行手順を書かない (理由: この機能を使っているプロダクトがまだない)。
- 依存を足さない (理由: `fs.globSync` で足りる)。

### Summary

- ハーネスの運搬を、方向ごとの一覧 (`copy`、`push`) と `starter` の 1 枚に変え、写すだけで消さない形にする。
- コピー元にないパスを `missing` のセクションで知らせ、終了コード 1 で終わる。
- そのファイルのコメントとテスト名の「道」を「パス」に直す。

### Paths

- `scripts/harness/index.mjs`
- `scripts/harness/list.mjs`
- `scripts/harness/harness.json`
- `scripts/harness/starter.json`
- `scripts/harness/index.test.ts`
- `scripts/harness/list.test.ts`
- `scripts/harness/config.test.ts`
- `vitest.config.ts`
- `README.md`
- `README.ja.md`
- `.pi/skills/plan/references/format.md`
- `test/scripts.fixture.ts`

### Boundary

- Plans: なし
- External:
  - `/Users/yuyahanada/Desktop/main/_pj-starter-pi-v3`: `starter` に置き、pull は `copy` をそこから写し、push は `push` をそこへ写す。
    - Path: `/Users/yuyahanada/Desktop/main/_pj-starter-pi-v3` が存在し、その `harness.json` はこのリポジトリのものと同一である。
  - `fs.globSync`: 一覧の項目に書いたパスと glob を解決する。
    - Env: Node は v24.22.1 で、`fs.globSync` がある。
  - 標準出力: 見出しの次に `missing (<件数>):` のセクションを置き、1 件につき 1 行を出す。
    - Contract: セクションの名前と行の形は、今の `copy (<件数>):` と同じ形の行にする。
  - コピー元のファイルシステム: 存在しないパスと読めないパスを区別せず、`missing` として集める。
    - Env: 存在の判定は glob の一致で行い、読み取りの成否とは分けない。
  - 終了コード: コピー元にないパスがあれば、`--run` の有無にかかわらず 1 を返す。
    - Contract: 0 か 1 のどちらかである。
  - `--run` の引数: なしでは表示だけで終わり、ありでは写せるパスを写したあとに終わる。
    - Contract: 引数の名前は `--run` のままである。

## `path-wording`

### ADR & Where

- No: 03
- Why: 03 のうち、`harness-transport` が書き換えないファイルの語を直す。そのファイルは重ならないため、待つものはない。
- Where: worktree

### Goal

- `scripts/checks/typecheck.test.ts` と `scripts/checks/typecheck-staged.test.ts` に「道」が残っていない。
- `scripts/product-ready/targets.mjs`、`targets.test.ts`、`readme-format.test.ts` に「道」が残っていない。
- `.pi/extensions/consult/run/place.ts`、`place.test.ts`、`run/subagent.test.ts` に「道」が残っていない。
- `.pi/extensions/consult/tool/commit.ts`、`commit.test.ts` に、「道具」を除いて「道」が残っていない。
- 方法の意味の 3 か所 (`subagent.test.ts` の「送り込む道」、`commit.test.ts` の「戻す道」、`commit.ts` の「メッセージを渡す道」) が、「経路」「方法」などの方法の意味の語に直っている。
- `pnpm test:run`、`pnpm lint`、`pnpm typecheck` が通る。

### Non-goal

- `cycles/` の下を直さない (理由: 過去の記録で、当時どう書いたかが分からなくなるため)。
- `README.md` と `README.ja.md` を直さない (理由: エントリ 01 の plan が持つ)。
- 実行時の振る舞いを変えない (理由: エントリ 03 の `behaviour: out`)。
- ファイルの形を変えない (理由: エントリ 03 の `format: out`)。
- パスの意味だけを直して、方法の意味の「道」を残さない (理由: `道` が 2 つの意味で残り、直した意味が薄まるため)。

### Summary

- コメントとテスト名の「道」を「パス」に直し、方法の意味の 3 か所は「経路」「方法」に直す。
- `置き場` と `cycles/` の下は残す。

### Paths

- `scripts/checks/typecheck.test.ts`
- `scripts/checks/typecheck-staged.test.ts`
- `scripts/product-ready/targets.mjs`
- `scripts/product-ready/targets.test.ts`
- `scripts/product-ready/readme-format.test.ts`
- `.pi/extensions/consult/run/place.ts`
- `.pi/extensions/consult/run/place.test.ts`
- `.pi/extensions/consult/run/subagent.test.ts`
- `.pi/extensions/consult/tool/commit.ts`
- `.pi/extensions/consult/tool/commit.test.ts`

### Boundary

- Plans: なし
- External: なし
