# ADR 078

## 01: 抑制として拾う構文と走査の範囲

Type: _Full_

### Context

- C1: いまの検査は `pnpm lint`（oxlint）と `pnpm typecheck`（tsc）であり、抑制コメントが 1 行あれば検査は通る。抑制コメントを探す手段はリポジトリに無い。
- C2: 対象はコードの拡張子（`js`、`jsx`、`ts`、`tsx`、`mts`、`cts`、`mjs`、`cjs`）に限り、`md`、`text`、`json` は読まない。`lefthook.yaml` の `lint` が同じ拡張子を使っており、この拡張子の一覧は新しく決めるものではない。
- C3: パスなしの全体走査では、生成物（`node_modules`、`dist`、`.next`、`.git`）を飛ばす。スクリプトは除外の設定を持たない。`node_modules`、`dist`、`.next` は `.oxlintrc.json` の `ignorePatterns` が明示している。
- C4: 抑制の種類は問わず、すべて弾く。テストの除外（`it.skip` など）は対象にしない（オーナーの指示）。
- C5: 検出した抑制にはルール名を持たせ、02 のホワイトリストはそのルール名を鍵に照合する（分割の合意）。
- C6: このサイクルの目的は、リンターと型チェックの抑制を見つけるスクリプトの追加である。`quality-gate` への登録は対象外だが、登録できる形で作る（ROADMAP 039）。

### Research & Trial

- F1: oxlint の抑制は `oxlint-disable`（ファイル全体）、`oxlint-enable`（再開）、`oxlint-disable-line`（同じ行）、`oxlint-disable-next-line`（次の行）であり、行コメントとブロックコメントの両方を持ち、ルール名はカンマ区切りで並べ、省略すると全ルールを対象にし、`oxlint` を `eslint` に置き換えた綴りも受け付ける。出所: `https://oxc.rs/docs/guide/usage/linter/ignore-comments`
- F2: eslint の抑制は `eslint-disable` と `eslint-enable`（ブロックとファイル全体）、`eslint-disable-line`、`eslint-disable-next-line` であり、ルール名はカンマ区切りで並べ、省略すると全ルールを対象にし、理由は `--`（ハイフン 2 つ以上）で区切って後ろに書く。出所: `https://eslint.org/docs/latest/use/configure/rules`
- F3: biome の抑制は `biome-ignore`（次の行）、`biome-ignore-all`（ファイルの先頭）、`biome-ignore-start` と `biome-ignore-end`（ブロック）であり、対象は `lint`、`assist`、`syntax`、`lint/<グループ>`、`lint/<グループ>/<ルール>`、`<ルール>(<値>)` の形で書き、理由は `: ` の後ろに書く。出所: `https://biomejs.dev/analyzer/suppressions/`
- F4: TypeScript の抑制は `@ts-expect-error` と `@ts-ignore`（次の行）、`@ts-nocheck`（ファイル全体）であり、ルール名を取らない。`@ts-check` は検査を有効にするもので、抑制ではない。出所: `https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-9.html`
- F5: oxlint、eslint、biome、tsc は、いずれも「使われなかった抑制」を報告する機能を持つ（`--report-unused-disable-directives`、`suppressions/unused`、`Unused '@ts-expect-error' directive.`）。出所: `https://oxc.rs/docs/guide/usage/linter/ignore-comments`、`https://eslint.org/docs/latest/use/configure/rules`、`https://biomejs.dev/analyzer/suppressions/`、`https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-9.html`
- F6: このリポジトリの実例は、`// eslint-disable-next-line max-params -- …`、`// oxlint-disable-next-line no-await-in-loop -- …`、`// eslint-disable-next-line @typescript-eslint/…, typescript/… -- …` のように、`eslint-` と `oxlint-` の 2 つの綴り、カンマ区切りの複数ルール、`--` の理由を持つ。出所: `.pi/extensions/consult/tool/render.ts:59`、`.pi/extensions/quality-gate/gate/checks.ts:139`、`.pi/extensions/context-precompact/index.test.ts:111`
- F7: `@ts-expect-error` は、回帰検出の目印として使われている。型エラーが消えると `tsc` が赤になる運用である。出所: `cycles/261119-077-dev/plan/01-consult-runtime.md:104,123,415,448,474`、`cycles/261119-077-dev/close.md:30,42`
- F8: biome の抑制の公式な例は `//` の行コメントだけで、`/* */` の形が有効かは公式ページに記載が無い。出所: `https://biomejs.dev/analyzer/suppressions/`
- F9: oxlint の公式ページには、抑制コメントの末尾に `--` で理由を書く仕様の記載が無い。末尾に説明を書くと指令の一致が壊れるという報告が Issue にある。出所: `https://oxc.rs/docs/guide/usage/linter/ignore-comments`、`https://github.com/oxc-project/oxc/issues/22152`
- F10: biome の 1 つのコメントに複数の対象を並べる形は、公式の書式に無い。出所: `https://biomejs.dev/analyzer/suppressions/`
- F11: この Node（v24.22.3）では、glob の `**` と `*` がドットで始まるディレクトリに当たらない。`fs.globSync('**/*.ts')` は `.pi/` の 119 件を含まず 20 件を返し、`.*/**/*.ts` は `.pi/` を含む 119 件を返す。`path.matchesGlob('.pi/extensions/quality-gate/gate/checks.ts', '**/*.ts')` は偽である。出所: `node v24.22.3` で `fs.globSync` と `path.matchesGlob` を実行した結果
- F12: TypeScript 7 の `typescript/unstable/ast/scanner` は、`createScanner(skipTrivia, languageVariant?, text)` と、コメントの範囲を返す `forEachLeadingCommentRange`、`getCommentDirectives` を公開している。ただし `unstable` の下にある subpath であり、安定した契約ではない。出所: `node_modules/typescript/dist/ast/scanner.d.ts:18-96`、`node_modules/typescript/package.json:37-51`

### Scope

- In:
  - failure: 検出の誤りが検査の結果を変えるから。文字列リテラルの中の指令、閉じないブロックコメント、知らない綴りを抑制として拾うかどうかを決める必要がある。
  - result: 検出の結果として、ファイル、行、ツール、ルール名を持つ「抑制の一覧」という種類が増える。02 の照合と 03 の表示は、この一覧を材料にする。
  - structure: `scripts/checks/` の下に検出のファイルが増え、既存の `ja-check.mjs` とは別のファイルになる。
  - logic: コメントの位置を見極め、指令の綴りとルール名を取り出す手順が、このエントリーの中心である。
  - downstream: 02 の照合と 03 の CLI が、この一覧の形に依存する。
  - cost: パスなしの全体走査では、対象の拡張子のファイルをすべて読む。時間はファイル数に比例して増える。
  - verification: 検出の境目を確かめるテストが増える。
- Out:
  - safety: `.env` のような秘密のファイルは拡張子の一覧に無く、読むのはコードだけである。権限も増やさない。
  - upstream: 新しいパッケージを加えない。使うのは `node:fs`、`node:path`、`node:url` の組み込みだけである。
  - existing data: 既存のファイルを書き換えない。ホワイトリストの JSON は 02 が決める。
  - values & expression: 表示する文と語は 03 が決める。拾う綴りは論理の定数として扱い、利用者が読む文としては扱わない。
  - observability: 記録や監視の信号は増やさない。表示は結果であり、03 が決める。
  - release: 配布と適用の経路は 03 が決める。`quality-gate` への適用はこのサイクルの外である。
  - other: 上のどれにも当たらない関心は無い。

### Decision

- Status: accepted
- Main: 抑制の検出器。ファイルの原文から、ツールが従う抑制を 1 件ずつ取り出す。
  - Add:
    - コメントを走査し、指令の綴りとルール名を読み取る検出器を、`scripts/checks/suppression-check.mjs` に加える（C1, C5, C6, F1, F2, F3, F4, F8, F9, F10）
    - 抑制 1 件の記録を加える。記録はファイル、行、ツール、指令、範囲、ルール名の配列、直前の行の原文を持つ（C5）
  - Update:
    - なし
  - Drop:
    - なし
- Secondary: 対象のファイルの集め方。パスなしのときに読むファイルを 1 つの関数で決める。
  - Add:
    - 拡張子の一覧と、飛ばすディレクトリの一覧を持つ収集器を加える（C2, C3, F11）
  - Update:
    - なし
  - Drop:
    - なし
- Policy:
  - Allowed:
    - コメントの中の指令だけを抑制として扱う（C4, F1, F2, F3, F4）
    - 指令のキーワードがコメント本文の最初の語であるものだけを拾う（F1, F2, F3）
    - ルール名を省いた指令を、全ルールを意味するものとして空の配列で表す（F1, F2）
    - 抑制の位置を、指令を含むコメントの開始行とする（F1, F2, F3）
    - biome の対象を、`:` で切った後ろの `(...)` を落として 1 つの名前として記録する（F3, F10）
    - `-enable` と `-end` を読むが、報告の対象にしない（F1, F2, F3）
    - oxlint と eslint のルール名は、キーワードの後ろを `--` で切り、カンマで分ける（F1, F2, F6）
    - 回帰の目印として使われる `@ts-expect-error` も、抑制として報告する（C4, F7）
    - 記録に、指令を含むコメントの開始行の 1 つ前の行の原文を含める（オーナーの指示）
    - 検出と CLI を 1 つのファイルに置く。分割は、`max-lines` または `max-lines-per-function` の上限に当たったときだけ行う（オーナーの指示）
    - 同じファイルに CLI を足すときは、import されたときに走らせない守りを置く（`.pi/skills/adr/scripts/index.mjs:83`）
    - コメントの走査は自前の 1 文字走査で行う（オーナーの指示、F12）
  - Forbidden:
    - 新しいパッケージを加えない - TypeScript 7 の安定した公開 API はバージョンだけである。AST と scanner は `unstable` の下にあり、公開の契約として使えない（`node_modules/typescript/package.json`）
    - 既存の `ja-check.mjs` を変えない - 検査ごとに 1 つのファイルを保つため
    - 飛ばすディレクトリを設定で変えられないようにする - 設定を 1 つに保つため（C3）
    - 文字列リテラルとテンプレート文字列の中を読まない - ツールが従わない指令を報告しないため（C4, F1, F2, F3）
    - TypeScript の `unstable` の scanner を使わない - バージョンを上げると壊れる契約に、検査の土台を寄せないため（F12）
    - ツールの「未使用の抑制」の報告を、検出の代わりに使わない - その報告は使われなかった抑制だけを出し、効いている抑制を出さないため（F5）
    - `fs.globSync` を使わない - `**` がドットで始まるディレクトリに当たらず、`.pi` を見落とすため（F11）

#### Details

- 抑制 1 件の記録
  ```ts
  export interface Suppression {
    readonly file: string; // リポジトリからの相対パス。区切りは /
    readonly line: number; // 指令を含むコメントの開始行。1 始まり
    readonly tool: 'oxlint' | 'eslint' | 'biome' | 'tsc';
    readonly directive: string; // 例: eslint-disable-next-line
    readonly scope: 'line' | 'next-line' | 'block' | 'file';
    readonly rules: readonly string[]; // 空の配列は全ルール
    readonly before: string; // 指令を含むコメントの開始行の、1 つ前の行の原文
  }
  ```
- コメントを読む走査
  ```js
  // 1 文字ずつ読み、状態を code / line / block / single / double / template の間で移す。
  // code のときだけ // と /* がコメントを開き、' " ` が文字列を開く。
  // 文字列の中の \ は次の 1 文字を飛ばす。
  // 行コメントは \n で、ブロックコメントは */ で、文字列は同じ引用符で閉じる。
  // 閉じない引用符は行末で code に戻る。閉じないテンプレートはファイルの終わりまで続く。
  // コメントの本文と、そのコメントの開始行だけを次の処理に渡す。
  // 正規表現リテラルは特別扱いしない。中に // があり、その直後に指令の語が続く場合だけ、誤って報告しうる。
  // テンプレート文字列の ${} の中は読まない。その中のコメントは見落とす。
  ```
- 指令の一覧
  ```js
  const DIRECTIVES = [
    ['oxlint-disable-next-line', 'oxlint', 'next-line'],
    ['oxlint-disable-line', 'oxlint', 'line'],
    ['oxlint-disable', 'oxlint', 'block'],
    ['oxlint-enable', 'oxlint', null],
    ['eslint-disable-next-line', 'eslint', 'next-line'],
    ['eslint-disable-line', 'eslint', 'line'],
    ['eslint-disable', 'eslint', 'block'],
    ['eslint-enable', 'eslint', null],
    ['biome-ignore-all', 'biome', 'file'],
    ['biome-ignore-start', 'biome', 'block'],
    ['biome-ignore-end', 'biome', null],
    ['biome-ignore', 'biome', 'next-line'],
    ['@ts-nocheck', 'tsc', 'file'],
    ['@ts-ignore', 'tsc', 'next-line'],
    ['@ts-expect-error', 'tsc', 'next-line'],
  ];
  // コメント本文の最初の語を、この表と完全一致で照合する。
  // null の範囲は、抑制ではなく解除を表す。読むが報告しない。
  // oxlint と eslint のルール名は、キーワードの後ろを -- で切り、カンマで分ける。
  // biome の対象は、キーワードの後ろを : で切り、末尾の (...) を落とす。
  // tsc はルール名を持たない。
  ```
- ファイルの収集
  ```js
  const CODE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mts', '.cts', '.mjs', '.cjs']);
  const SKIP_DIRS = new Set(['node_modules', 'dist', '.next', '.git']);
  // readdirSync(dir, { withFileTypes: true }) を再帰する。
  // SKIP_DIRS のディレクトリには入らない。
  // CODE_EXTENSIONS のファイルだけを集め、リポジトリからの相対パスにそろえる。
  // fs.globSync は使わない。** がドットで始まるディレクトリに当たらず、.pi を見落とすため（F11）。
  ```

### Definition

- `Unit.suppression-check`(added): エージェントが、リンターと型チェックを抑制するコメントの指摘を受け取れる

## 02: 回避手段のホワイトリストと Reason

Type: _Full_

### Context

- C1: 回避手段は、JSON のホワイトリストに載り、かつ直前の行に `Reason` があるときだけ通る。どちらか片方だけでは通らない（オーナーの指示）。
- C2: ホワイトリストは、glob のパス 1 つに対し、ルール名の配列を複数持てる形にする（オーナーの指示）。
- C3: `Reason` は抑制コメントの直前の 1 行だけを見る。形は `// Reason: ...` に限り、日本語であるかどうかは検査しない（オーナーの指示）。
- C4: 既存の検査は、設定を `scripts/checks/*.json` に置き、`process.cwd()` をリポジトリのルートとして読む（`scripts/checks/ja-check.mjs`、`scripts/checks/ja-check.json`）。

### Research & Trial

- F1: `ja-check.mjs` は `exclude` の各パターンを `path.matchesGlob(relPosix, posixPattern)` で照合し、対象とパターンの両方を `/` 区切りのリポジトリルートからの相対パスにそろえている。出所: `scripts/checks/ja-check.mjs:95-115`
- F2: `ja-check.json` の `exclude` は `["ROADMAP.md", "**/affected/*.md", "scripts/checks/ja-check.test.ts"]` であり、`ROADMAP.md` というパターンが `src/ROADMAP.md` に一致しないことをテストが固定している。出所: `scripts/checks/ja-check.json:90`、`scripts/checks/ja-check.test.ts:240-287`
- F3: `path.matchesGlob(path, pattern)` は Node の API で、`v22.5.0` と `v20.17.0` に追加され、`v24.8.0` と `v22.20.0` で stable になった。出所: `https://nodejs.org/api/path.html`
- F4: Node の公式ドキュメントの `matchesGlob` のセクションには、`**`、`*`、`?`、文字クラス、ブレース展開の定義が無い。出所: `https://nodejs.org/api/path.html`
- F5: この Node（v24.22.3）の `path.matchesGlob` は、`**/affected/*.md` を `affected/01.md` と `cycles/a/affected/01.md` の両方に一致させ、`*.ts` を `src/a.ts` に一致させず、`**/*.ts` を `a.ts` と `src/a.ts` と `src/deep/a.ts` のすべてに一致させ、`?`、`[...]`、`{...}` を解釈し、`./a.ts` を `a.ts` に一致させない。出所: `node v24.22.3` で `path.matchesGlob` を実行した結果
- F6: このリポジトリの glob の照合は、`path.matchesGlob`（`ja-check` と `consult` の `guard.ts`）と `fs.globSync`（`harness-sync`）と、ツール自身の照合（`lefthook`、`oxlint`、`oxfmt`、`vitest`、`tsc`）に分かれており、1 つの記法を共有していない。出所: `scripts/checks/ja-check.mjs:110`、`.pi/extensions/consult/sub/guard.ts:205`、`scripts/harness-sync/collect/index.mjs:75-79`、`lefthook.yaml:8-25`、`.oxlintrc.json:82-132`、`vitest.config.ts:9-13`、`tsconfig.json:16-17`
- F7: `.pi/extensions/consult/sub/guard.ts` は `matchesGlob` の前に完全一致と前方一致を試し、`relative` の結果を `/` に正規化していない。出所: `.pi/extensions/consult/sub/guard.ts:194-207`
- F8: この Node（v24.22.3）では、`path.matchesGlob` の `**` と `*` がドットで始まるディレクトリに当たらない。`path.matchesGlob('.pi/extensions/quality-gate/gate/checks.ts', '**/*.ts')` は偽であり、`.*/**/*.ts` なら真である。`fs.globSync('**/*.ts')` も `.pi/` を含まない。出所: `node v24.22.3` で `fs.globSync` と `path.matchesGlob` を実行した結果

### Scope

- In:
  - failure: 回避手段の判定が「許可」「ホワイトリストに無い」「Reason が無い」の分かれ目そのものであり、設定が無いとき、壊れているとき、ホワイトリストのどの項目にも当たらないときの経路を決める必要がある。
  - result: 抑制 1 件ごとに「許可」「ホワイトリストに無い」「Reason が無い」の判定が増え、03 の表示と終了コードはこの判定を材料にする。
  - structure: `scripts/checks/` の下に、ホワイトリストの JSON が 1 つ増える。
  - logic: glob の照合と `Reason` の照合という 2 つの判定が、このエントリーの中心である。
  - downstream: 03 の CLI が、この判定を表示し、終了コードを決める。
  - values & expression: 設定の鍵の名前（`path`、`rules`）と、`// Reason: ` という綴りが決まる。
  - verification: 照合の境目を確かめるテストが増える。
- Out:
  - safety: 検査は秘密も権限も触れない。読むのはパスとルール名だけである。回避手段の広さは failure と logic で扱う。
  - upstream: 新しいパッケージも契約も加えない。設定はリポジトリの中の JSON 1 つである。
  - existing data: 既存の抑制コメントを書き換えたり、ホワイトリストに移したりしない。最初の実行で既存の抑制が違反として出ることは、見つける道具の目的にかなう。
  - cost: 読むのは小さい JSON 1 つで、時間と資源はほぼ変わらない。
  - observability: 記録や監視の信号は増やさない。
  - release: 配布と適用の経路は 03 が決める。
  - other: 上のどれにも当たらない関心は無い。

### Decision

- Status: accepted
- Main: 回避手段の判定。抑制 1 件ごとに、ホワイトリストと `Reason` を見て、判定を決める。
  - Add:
    - ホワイトリストの JSON（`scripts/checks/suppression-check.json`）を加える（C1, C2, C4）
    - 記録のパスとルール名を、ホワイトリストの glob と配列に照合する関数を加える（C1, C2, F1, F2, F5, F8）
    - `Reason` の判定を加える。指令を含むコメントの開始行の 1 つ前の行だけを見る（C3）
    - 抑制 1 件ごとの判定（許可、ホワイトリストに無い、`Reason` が無い）を加える（C1）
  - Update:
    - なし
  - Drop:
    - なし
- Secondary: なし
- Policy:
  - Allowed:
    - `path.matchesGlob(record.file, entry.path)` で、記録のファイルと設定の glob を照合する（F1, F3, F5, F8）
    - 設定と記録のパスは、`process.cwd()` をルートにした `/` 区切りの相対パスで扱う（C4, F1）
    - パスの照合は `path.matchesGlob` だけで行う。`guard.ts` のような完全一致と前方一致の前置きを持たない（F1, F6, F7）
    - 記録のルール名のすべてが設定の配列に含まれるときだけ、許可する（C2, F1, F2）
    - ルール名を持たない抑制を、その指令の名前で照合する（F1, F2, F4）
    - `Reason` の形は、行頭の空白の後に `// Reason: ` があり、その後に空白以外の文字が続くものとする（C3）
    - 設定が無いときは、許可の一覧を空として扱う。抑制はすべて違反になる（C1）
    - 判定を、許可、ホワイトリストに無い、ホワイトリストにあるが `Reason` が無い、の 3 つに分ける（オーナーの指示）
  - Forbidden:
    - 許可の条件を、パス、ルール名、`Reason` の 3 つに限る - 条件が増えるほど、回避手段が読めなくなるため（C1）
    - 行番号や位置を許可の条件にしない - 抑制を動かすたびに設定が壊れるため
    - 設定の鍵を増やさない - 読む人にも判定にも、増やす理由がないため

#### Details

- ホワイトリストの形
  ```json
  {
    "allow": [
      { "path": ".pi/extensions/**/*.ts", "rules": ["no-await-in-loop"] },
      { "path": "scripts/checks/*.mjs", "rules": ["max-params"] }
    ]
  }
  ```
- 照合の手順
  ```js
  // 記録の file は、process.cwd() をルートにした相対パスで、区切りは / である。
  // path.matchesGlob(record.file, entry.path) が真の entry だけを候補にする。
  // ** と * はドットで始まるディレクトリに当たらない。.pi を見る設定は .pi/** と書く（F8）。
  // 記録の rules が空なら、指令の名前（例: eslint-disable、@ts-expect-error）を 1 つの鍵とする。
  // 鍵のすべてが entry.rules に含まれるときだけ、その entry を当てる。
  // 複数の entry が当たるときは、最初の 1 つを選ぶ。
  ```
- `Reason` の判定
  ```js
  // 記録の before（指令を含むコメントの開始行の、1 つ前の行の原文）を見る。
  // 行頭の空白を取り除いた文字列が "// Reason: " で始まり、その後ろに空白以外の文字が 1 つ以上続くこと。
  // 行の途中の // Reason: は見ない。日本語であるかも見ない。
  ```
- 設定の不在と破損
  ```js
  // ENOENT: 許可の一覧を [] として扱い、例外を投げない。
  // JSON として読めない、または形が違う（allow 以外の鍵、path が文字列でない、rules が 1 つ以上の文字列の配列でない）:
  //   理由を持つエラーを投げる。終了コードは呼び出し側（03）が決める。
  ```
- 判定の 3 つの種類
  ```ts
  type Verdict =
    | { readonly kind: 'allowed'; readonly suppression: Suppression }
    | { readonly kind: 'not-listed'; readonly suppression: Suppression } // ホワイトリストのどの項目も当たらない
    | { readonly kind: 'no-reason'; readonly suppression: Suppression }; // 項目は当たるが、Reason が無い
  ```

### Definition

- `Unit.suppression-check`(kept): 回避手段は、指摘を出すかどうかの判定の条件である。指摘を受け取るという機能は変わらない。

## 03: 呼び出しの入口と結果の伝え方

Type: _Simple_

### Context

- C1: ROADMAP 039 は、ファイルパスを渡して実行でき、パスなしなら全体を走査し、`--report` で exit 0 でもすべての結果を表示するスクリプトを、`package.json` の scripts に登録することを定めている。
- C2: `quality-gate` は `pnpm run <script> <flags> <paths>` の形でスクリプトを呼び、終了コードで成否を読む（`.pi/extensions/quality-gate/gate/checks.ts`）。このサイクルでは登録しない。
- C3: 表示と終了コードの前例は `scripts/checks/ja-check.mjs` である。見出しの 2 行、ヒットごとの行、`No findings` の行、件数の行を持ち、違反があれば exit 1 を返す。
- C4: 許可済みの抑制は通常は表示せず、`--report` のときだけ表示する。終了コードは違反の有無だけで決める（オーナーの同意）。

### Research & Trial

- F1: `ja-check.mjs` は引数のパスを `process.argv.slice(2)` で受け、見出しの 2 行、ヒットごとの `file:line: word → replacement [error|warn] (…)` の行、`No findings` の行、件数の行を表示し、error があれば exit 1、warn だけなら exit 0 を返す。出所: `scripts/checks/ja-check.mjs:12-19,159-210`
- F2: `ja-check.mjs` は設定 `scripts/checks/ja-check.json` が無いとき、`No config.` と件数の行を表示して exit 0 で終わる。壊れているときは理由を stderr に出して exit 1 で終わる。出所: `scripts/checks/ja-check.mjs:21-42`
- F3: `package.json` の `scripts` は `lint`、`lint:fix`、`format`、`format:check`、`typecheck`、`typecheck:staged`、`test`、`test:run`、`test:related` を持ち、`ja-check` の登録は無い。出所: `package.json:5-20`
- F4: `lefthook.yaml` は `lint` と `typecheck:staged` を `pnpm` の script 名で呼び、`ja-check` は `node scripts/checks/ja-check.mjs {staged_files}` で直接呼ぶ。出所: `lefthook.yaml:12-27`
- F5: `quality-gate` は `pnpm run <script> <flags> <paths>` の形でスクリプトを呼び、`result.code !== 0` を失敗として読む。fix の結果は捨て、verify の結果だけを報告する。出所: `.pi/extensions/quality-gate/gate/checks.ts:103-121,130-150`
- F6: `quality-gate` は `typecheck` では対象を拡張子で絞らず、`lint` と `format` は `targets.ts` の拡張子の一覧で絞る。`lint` の一覧は `.js`、`.jsx`、`.ts`、`.tsx`、`.mts`、`.cts`、`.mjs`、`.cjs` である。出所: `.pi/extensions/quality-gate/gate/targets.ts:6-36`、`.pi/extensions/quality-gate/gate/checks.ts:109`
- F7: `typecheck-staged.mjs` は対象が 0 件のとき、何も表示せず exit 0 で終わる。出所: `scripts/checks/typecheck-staged.mjs:36-41`

### Scope

_omission_

### Decision

- Status: accepted
- Main: 呼び出しの入口。スクリプトを、人と `quality-gate` の両方から呼べる形にする。
  - Add:
    - CLI の引数の読み取りを加える。パスと `--report` を受け取る（C1）
    - 表示と終了コードを加える（C1, C3, C4）
    - `package.json` の `scripts` に `suppression-check` を加える（C1, F3）
    - `scripts/checks/suppression-check.mjs` に、import されたときに走らせない守りを加える（01 の Policy）
  - Update:
    - なし
  - Drop:
    - なし
- Secondary: なし
- Policy:
  - Allowed:
    - 引数のパスを対象にし、パスが無ければ 01 の収集器で全体を集める（C1）
    - 存在しないパスは、黙って飛ばす（C1）
    - 存在するがファイルでないパスは、誤りとして exit 1 で終わる
    - 対象の拡張子の絞り込みは、スクリプトの中で行う（F6）
    - `--report` のときは、許可済みの抑制も表示する（C1, C4）
    - 終了コードは、違反があれば 1、無ければ 0 とする（C1, C4）
    - 表示は `ja-check.mjs` の形に合わせる。見出しの 2 行、1 件ごとの行、`No findings.`、件数の行（C3, F1）
    - 1 件ごとの行は、ファイル、行、指令、ツール、ルール名、判定を持つ（C3, F1）
    - 判定の文は 3 つに分ける。許可は `allowed`、ホワイトリストに無いものは `not allowed`、ホワイトリストにあるが `Reason` が無いものは `no Reason line: add // Reason: above (owner's approval needed)`（オーナーの指示）
    - 件数の行は `N files, V violations, A allowed.` とする（C3, F1）
    - `No findings.` は、表示する行が 0 のときだけ出す（C3, F1）
    - `--report` 以外の `--` で始まる引数は、誤りとして exit 1 で終わる
    - 設定が壊れているときは、理由を stderr に出して exit 1 で終わる（F2）
    - 対象が 0 件でも、見出しと件数の行を出す（F7）
    - `quality-gate` から呼べる形にする。対象パスを引数で受け、終了コードで成否を返す（C2, F5）
  - Forbidden:
    - 許可済みの抑制を、通常の表示に出さない - `--report` を付けたときだけ全件を見せるため（C4）
    - `quality-gate` の `CHECK_SPECS` に登録しない - このサイクルの対象外だから（C2）
    - `lefthook.yaml` に登録しない - このサイクルの対象外であり、適用は `quality-gate` と同じく次のサイクルで決めるため（F4）
    - `package.json` の script に `--report` を付けない - 通常は違反だけを出すため（C4）

#### Details

_omission_

### Definition

- `Unit.suppression-check`(kept): 呼び出しの入口は、指摘を届ける経路である。指摘を受け取るという機能は変わらない。
