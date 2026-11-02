# DESIGN 051

## Affected

### 01: チェッカー本体の形は何か

- `scripts/checks/typecheck.mjs` — このファイルが `scopes.json` を `fs.readFileSync`、`JSON.parse`、`Array.isArray` で読み取る今の形を示す。
- `scripts/harness/list/index.mjs` — このファイルが `harness.json` を `readList` で読み、`copy` と `push` の対象に `scripts/checks` を含める。
- `scripts/harness/index.mjs` — このファイルが `readList` の結果を使い、`copy` と `push` の対象を集めて渡す。
- `scripts/product-ready/index.mjs` — このファイルが `targets.mjs` から `labels`、`plan`、`remove`、`skeletonFor` をインポートするが、`targets.mjs` は `scripts/checks` を対象に含めない。
- `vitest.starter.config.ts` — このファイルが `vitest.config.ts` の `testConfig(true)` をインポートして使う。
- `vitest.config.ts` — このファイルが `harness.json` を `readList` で読み、テストの除外条件を作る。
- `test/scripts.fixture.ts` — このファイルが `the list is not valid JSON` の理由を示す行を定義する。
- `test/temp-dir.ts` — このファイルが検査用の仮ルートを作るために `tempDir` を提供する。
- `scripts/checks/typecheck.test.ts` — このテストが `scopes.json` が壊れた場合に `exit 1` で終了し、理由を示す行が出ることを確かめる。
- `scripts/harness/list/index.test.ts` — このテストが `harness.json` の読み取りと除外の生成を確かめる。
- `scripts/product-ready/targets.test.ts` — このテストが `targets.mjs` の `plan` と `remove` を確かめる。

### 02: JSON の形は何か

- `scripts/checks/typecheck.mjs` — このファイルが `scopes.json` を読む。
- `scripts/harness/list/index.mjs` — このファイルが `harness.json` を `readList` で読む。
- `scripts/harness/index.mjs` — このファイルが `harness.json` の `copy` と `push` を実行する。
- `vitest.config.ts` — このファイルが `harness.json` を `readList` で読み、テストの除外条件を作る。
- `scripts/checks/typecheck.test.ts` — このテストが `scopes.json` が壊れた場合の `exit 1` を確かめる。
- `scripts/harness/list/index.test.ts` — このテストが `harness.json` の欠落と形の違いを確かめる。

### 03: lefthook にどう載せるか

- `scripts/harness/collect/index.mjs` — このファイルが `copy` の対象として `lefthook.yaml` を列挙する。
- `scripts/harness/diff/index.mjs` — このファイルが両側の `lefthook.yaml` の中身を読み比べ、コピーするものを決める。
- `scripts/harness/index.mjs` — このファイルが `copy` の差分にしたがい `lefthook.yaml` をコピーする。

## External

### 01: チェッカー本体の形は何か

- `Node 24 の実行環境と標準ライブラリ` — この変更はチェッカーを標準ライブラリだけで書き、Node 24 に合わせる。
- `ステージされた 100 ファイルを 1 秒未満で処理すること` — `pre-commit` で実行するための速度の目標である。

### 02: JSON の形は何か

- `Node.js 標準ライブラリ` — この項目は `JSON.parse` とファイルの読み取りを前提とする。

### 03: lefthook にどう載せるか

- `lefthook` — この変更は `pre-commit` の並列実行に `ja-check` ジョブを載せ、`{staged_files}` の受け渡し、空の場合のスキップ、`glob` の設定、`output` の既定、`stage_fixed` の条件を前提とする。
- `製品のハーネス` — ここでは `lefthook.yaml` の `copy` で製品の `pre-commit` にも `ja-check` ジョブが入る。

## `ja-check`

### ADR & Where

- No: 01, 02
- Why: 01 と 02 は `scripts/checks` の同じファイル群を入力にし、チェッカーと JSON を分けると片方が動かないため、このプランでまとめて実施し、他のプランを待たない。
- Where: worktree（オーナーが見る必要がないため）

### Goal

- `node scripts/checks/ja-check.mjs <file>` が、禁止語がある行を `<file>:<line>: <語> → <対応> [warn|error]` の形で出力し、`error` があれば `exit 1`、`warn` だけなら `exit 0` になる。
- チェッカーの対象はテキストファイル（コード、テスト、コメント、文書、設定）であり、チェッカーは `ROADMAP.md` の `## 0.x.x` セクションと `scripts/checks/ja-check.json` を指摘せず、同じ引用符（`'`、`"`、`` ` ``）の間に語だけがある場合は指摘しない。
- 引数がない場合は処理が `exit 0` になり、チェッカーは読み取れないファイルをスキップして集計に載せる。
- 出力の最後は、`error`、`warn`、設定なし、対象なしのどの場合でも `ja-check: <n> ファイル、error <n> 件、warn <n> 件` の形の 1 行になってオーナーに報告し、`設定なし` は集計行の前の行に出る。
- 100 ファイルを引数に渡した `node scripts/checks/ja-check.mjs` の実行時間が 1 秒未満になる。
- `scripts/checks/ja-check.mjs` が Node 24 の標準ライブラリだけを使い、`process.argv.slice(2)` でファイルを受け取り、`fs.readFileSync` と `JSON.parse` で JSON を読み取る。
- スクリプト名が `ja-check` で、エージェントは `DEFINITION.md` を読んで `Unit.japanese-check` の行が「エージェントが、日本語の語に対する指摘を受け取れる」となっていることを確かめられる。
- `scripts/checks/ja-check.json` のキーが `error` と `warn` だけで、値が語と置き換え先文字列の対応になる。
- 部分一致の危険がある語は `warn` になり、それ以外は `error` になり、`scripts/checks/ja-check.json` に 050 の語対応表の「そのまま」の語（`道具`、`観点`、`写し`、`偽物`、`印`）が入らない。
- チェッカーは JSON がない場合に「設定なし」を出し、JSON が壊れている場合やキーや値の型が違うときに `exit 1` で終了する。
- `scripts/checks/ja-check.mjs`、`scripts/checks/ja-check.test.ts`、`scripts/checks/ja-check.json` が `scripts/checks` に置かれ、`harness.json` の `copy` と `push` の対象になる。

### Non-goal

- 既存の `scripts/checks` のコードは整理しない（01 と 02 の `refactor: out`）。
- 新しいパッケージは追加しない（01 と 02 の `dependency: out`）。
- 文書（`rules/`、`README`）は変更しない（01 と 02 の `prose: out`）。
- 外部入力は扱わない（01 と 02 の `security: out`）。
- データの移行はしない（01 と 02 の `migration: out`）。
- 監視系は追加しない（01 と 02 の `logs and monitoring: out`）。
- 02 の JSON の読み込みの速さは測らない（02 の `speed: out` であり、問いは JSON の形だけであるため）。
- oxlint の JS プラグインは使わない（01 の案 B で、アルファバージョンであり、`.oxlintrc.json` が `*.md` を無視して文書が対象外になるため）。
- grep を `lefthook` に直結しない（01 の案 D では、JSON 設定がなく語ごとの warn/error を分けられないため）。
- textlint は使わない（01 の textlint であり、04 で却下されたため）。
- `{ "words": [...] }` の配列形式は使わない（02 の案 B では、`error`/`warn` の区別が語ごとに並ぶため）。

### Summary

- このプランでは 050 の語対応表を JSON ファイルにまとめ、`scripts/checks/ja-check.mjs` がステージされたファイルの禁止語を探して warn/error を出力し、最後に固定の集計行を出して error がある場合にコミットを止める。
- このプランでは 050 の語対応表を 1 語ずつ見て、部分一致の危険がある語を `warn` に、それ以外を `error` に分ける。
- チェッカーは `ROADMAP.md` の `## 0.x.x` セクションと `scripts/checks/ja-check.json` を対象外にし、同じ引用符の間に語だけがある場合は指摘せず、100 ファイルを 1 秒未満で処理する。

### Paths

- `DEFINITION.md`
- `scripts/checks/ja-check.mjs`
- `scripts/checks/ja-check.test.ts`
- `scripts/checks/ja-check.json`

### Boundary

- Plans: なし
- External:
  - `Node 24 の実行環境と標準ライブラリ`（01 と 02 が使う）: チェッカーは標準ライブラリだけを使う。
    - Env: Node 24 の実行環境
  - `ステージされた 100 ファイルを 1 秒未満で処理すること`: チェッカーの速度目標である。
    - Limit: `pre-commit` の待ち時間

## `ja-check-hook`

### ADR & Where

- No: 03
- Why: 03 は 01 のチェッカーを `pre-commit` に載せるため、このプランは 01 と 02 の後に実施し、`lefthook.yaml` だけを変える。
- Where: worktree（オーナーが見る必要がないため）

### Goal

- `lefthook.yaml` の `pre-commit` の `checks` グループに `ja-check` ジョブが 5 番目として入り、`glob: '*'` と `stage_fixed: false` が設定され、`{staged_files}` が渡される。
- `output` はルートに追加されず、既定のままになる。
- `lefthook validate` が成功する（03 の `compatibility: in` の確認）。
- `checks` グループが `parallel: true` のままである。
- `lefthook.yaml` が `harness.json` の `copy` に含まれるため、製品の `pre-commit` にも `ja-check` ジョブが入る。
- `lefthook run pre-commit` の成功時に、`ja-check` の出力の最後の固定行が表示される。

### Non-goal

- 既存の `format`/`lint`/`typecheck`/`test` のジョブは整理しない（03 の `refactor: out`）。
- 新しいパッケージは追加しない（03 の `dependency: out`）。
- 文書は変更しない（03 の `prose: out`）。
- 外部入力は扱わない（03 の `security: out`）。
- 移行はしない（03 の `migration: out`）。
- `glob` を拡張子のリストに絞らない（03 の案 B）。
- `glob` を省略しない（03 の案 C）。

### Summary

- このプランでは `lefthook.yaml` の `pre-commit` に `ja-check` ジョブを追加し、ステージされたファイルをチェッカーに渡し、報告をスクリプトの出力の最後の固定行で行う。

### Paths

- `lefthook.yaml`

### Boundary

- Plans: `ja-check` — 01 と 02 が作る `scripts/checks/ja-check.mjs` を `pre-commit` から呼ぶ。
- External:
  - `lefthook`: `pre-commit` の並列実行に `ja-check` ジョブを載せる。
    - Contract: `lefthook` の設定スキーマとバージョン、`{staged_files}` の受け渡し、空の場合のスキップ、`glob` の設定、`output` の既定、`stage_fixed`
  - `製品のハーネス`: `lefthook.yaml` の `copy` で製品の `pre-commit` にも `ja-check` ジョブが入る。
    - Contract: `harness.json` の `copy` の対象
