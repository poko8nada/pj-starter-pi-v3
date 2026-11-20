# PLAN `suppression-check`

- ADR-No: 01, 02, 03
- Place: worktree
- Boundary Plans: なし

## Goal

エージェントが、リンターと型チェックを抑制するコメントの一覧を、許可と違反に分けて、コマンドで受け取れる。

## Refactor

- Inside:
  - Modules: `scripts/checks/suppression-check.mjs` を新しく 1 つ作り、検出、照合、呼び出しの入口をその中に置く。ADR 01 の Policy が、行数の上限に当たるまで 1 ファイルと決めている。`max-lines` の 480 行か `max-lines-per-function` の 80 行を超える場合だけ、呼び出しの入口を `scripts/checks/suppression-check-cli.mjs` に分割し、`package.json` は分割した方を指す。
  - Dirs: なし。`scripts/checks/` に置き、新しいディレクトリは作らない。`ja-check.mjs` と同じ場所で、検査の入口が 1 つのディレクトリに揃う。
- Outside:
  - Extract: なし。glob の照合は `node:path` の `matchesGlob` を再利用し、共通化する新しいモジュールは作らない。使うのは `node:fs`、`node:path`、`node:url` の組み込みだけである。
  - Colocate: なし。共有しているモジュールを、利用者のそばへ移す変更はない。

## Files

```text
scripts/
  checks/
    suppression-check.mjs            add
    suppression-check.json           add
    suppression-check.test.ts        add
    ja-check.mjs
    ja-check.test.ts
test/
  scripts.fixture.ts
package.json                         update
DEFINITION.md                        update
```

## Slices

## 1. 検出器

抑制コメントを読み、ツールが従う指令を記録にする。

### Types

```ts
// .mjs なので、この形を JSDoc の @typedef で書く。
interface Suppression {
  readonly file: string; // process.cwd() をルートにした / 区切りの相対パス
  readonly line: number; // 指令を含むコメントの開始行。1 始まり
  readonly tool: 'oxlint' | 'eslint' | 'biome' | 'tsc';
  readonly directive: string; // 例: eslint-disable-next-line
  readonly scope: 'line' | 'next-line' | 'block' | 'file';
  readonly rules: readonly string[]; // 空は全ルール
  readonly before: string; // 開始行の 1 つ前の行の原文
}
// Suppression を作るのは検出器だけである。tool と scope の組は、DIRECTIVES の表が唯一の出所である。

function findSuppressions(file: string, text: string): readonly Suppression[];
function collectFiles(root: string): readonly string[]; // root からの / 区切りの相対パス
function findAll(root: string): readonly Suppression[];
```

### Steps

1. `scripts/checks/suppression-check.mjs`
   1. add: 冒頭のコメント。次の 4 行をそのまま置く。

      ```text
      // suppression-check: リンターと型チェックの抑制コメントを列挙する。
      // 使い方: node scripts/checks/suppression-check.mjs [--report] [file...]
      // 仕組み: コメントの指令を走査し、scripts/checks/suppression-check.json の allow と直前の // Reason: で判定する。
      // .pi のようなドットで始まるディレクトリは、** が当たらない。設定に書くときは .pi/** と明示する。
      ```

   2. add: `Suppression` の `@typedef`。`Types` の形をそのまま写す。
   3. add: コメントの走査。1 文字ずつ読み、次の遷移で状態を移す。

      ```text
      code: // → line、/* → block、' → single、" → double、` → template
      line: \n → code
      block: */ → code
      single: ' → code、\ → 次の 1 文字を飛ばす
      double: " → code、\ → 次の 1 文字を飛ばす
      template: ` → code、\ → 次の 1 文字を飛ばす
      single と double が行末に達したら、code に戻る（閉じない引用符）。
      template は、閉じなくてもファイルの終わりまで続く。
      template の ${} の中は読まない。その中のコメントは見落とす。
      正規表現リテラルは特別扱いしない。
      ```

   4. add: ファイルの収集。`collectFiles(root)` を置き、次の 2 つの定数と `readdirSync(dir, { withFileTypes: true })` の再帰を使う。

      ```js
      const CODE_EXTENSIONS = new Set([
        '.js',
        '.jsx',
        '.ts',
        '.tsx',
        '.mts',
        '.cts',
        '.mjs',
        '.cjs',
      ]);
      const SKIP_DIRS = new Set(['node_modules', 'dist', '.next', '.git']);
      ```

      - `SKIP_DIRS` のディレクトリには入らない。シンボリックリンクのディレクトリは辿らない。
      - `CODE_EXTENSIONS` のファイルだけを集める。返すのは `root` からの `/` 区切りの相対パスである。

   5. add: `findSuppressions(file, text)` と `findAll(root)`。
      - `file` は `process.cwd()` をルートにした `/` 区切りの相対パスである。
      - `text` は `\n` で行に分ける。
      - `findSuppressions` は、コメントの中の指令を記録にして返す。
      - `findAll` は、収集器で集めた各ファイルを読み、記録を `(file, line)` の順に並べて返す。
2. Outside: `cycles/261120-078-dev/affected/01.md` の `### External` の `oxlint`、`eslint`、`biome`、`tsc` の構文と、`max-lines` の上限
   1. add: `DIRECTIVES` の表。次の 15 行をそのまま置く（`F1`〜`F4`）。

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
      ```

   2. add: 指令の読み取り。
      - キーワードの後ろの文字列を、最初の `/\s--+\s/`（空白、ハイフン 2 つ以上、空白）で 2 つに切る。前がルール名の並び、後ろは理由である。
      - ルール名の並びを `,` で分割し、前後の空白を落とし、空の要素を捨てる。
      - biome は、キーワードの後ろを最初の `:` で切る。前が対象、後ろは理由である。対象の末尾の `(...)` を落とす。対象が空なら、空の配列にする。
      - tsc はルール名を持たない。空の配列にする。
      - 照合する語は、コメント本文の最初の語だけである。途中の語は拾わない。
   3. add: ファイルと関数を、`max-lines` の 480 行、`max-lines-per-function` の 80 行に収める。
3. `scripts/checks/suppression-check.test.ts`
   1. add: 走査の境界の cases。`findSuppressions` に文字列を渡して試す。
      - `scan: boundary 文字列の中の // と指令 → コメントとして読まず、報告しない`
      - `scan: boundary テンプレート文字列の中の指令 → 報告しない`
      - `scan: boundary ブロックコメントが行をまたぐ → 開始行で 1 件`
      - `scan: boundary 閉じない引用符 → 行末で code に戻り、次の行のコメントを読む`
      - `scan: boundary 正規表現の中の // の後ろに指令がない → 報告しない`
   2. add: 指令の cases。`findSuppressions` に文字列を渡して試す。
      - `directive: happy oxlint の 3 形（oxlint-disable、oxlint-disable-line、oxlint-disable-next-line） → scope が block、line、next-line`
      - `directive: happy eslint の綴り（eslint-disable-next-line） → tool が eslint`
      - `directive: happy biome の 3 形（biome-ignore、biome-ignore-all、biome-ignore-start） → tool が biome、scope が next-line、file、block`
      - `directive: happy @ts-expect-error、@ts-ignore、@ts-nocheck → rules が空`
      - `directive: boundary -enable と -end → 記録に残らない`
      - `directive: boundary コメント本文の途中の語 → 記録に残らない`
   3. add: ルール名の cases。`findSuppressions` に文字列を渡して試す。
      - `rules: happy カンマ区切り → 2 つの名前`
      - `rules: happy -- の理由 → 理由を除いた名前`
      - `rules: happy biome の (値) → 値付きの名前`
      - `rules: empty ルール名を省く → 空の配列`
   4. add: 収集の cases。`collectFiles(fakeRoot())` を `import` して試す。
      - `collect: happy 8 拡張子 → すべて集まる`
      - `collect: happy .pi の中 → 集まる`
      - `collect: boundary 生成物 → 飛ばす`
      - `collect: empty md と json → 集めない`

### Policy

- Allowed:
  - コメントの中の指令だけを抑制として扱う。
  - 指令のキーワードがコメント本文の最初の語であるものだけを拾う。
  - ルール名を省いた指令を、全ルールを意味するものとして空の配列で表す。
  - 抑制の位置を、指令を含むコメントの開始行とする。
  - biome の対象を、`:` で切った後ろの `(…)` を落として 1 つの名前として記録する。
  - `-enable` と `-end` を読むが、報告の対象にしない。
  - oxlint と eslint のルール名は、キーワードの後ろを `--` で切り、カンマで分ける。
  - 回帰の目印として使われる `@ts-expect-error` も、抑制として報告する。
  - 記録に、開始行の 1 つ前の行の原文を含める。
  - 検出と CLI を 1 つのファイルに置き、分割は `max-lines` か `max-lines-per-function` の上限に当たったときだけ行う。
  - 同じファイルに CLI を足すときは、import されたときに走らせない守りを置く。
  - コメントの走査は自前の 1 文字走査で行う。
- Forbidden:
  - 新しいパッケージを加えない - TypeScript 7 の安定した公開 API はバージョンだけで、AST と scanner は `unstable` の下にある。
  - 既存の `ja-check.mjs` を変えない - 検査ごとに 1 つのファイルを保つため。
  - 飛ばすディレクトリを設定で変えられないようにする - 設定を 1 つに保つため。
  - 文字列リテラルとテンプレート文字列の中を読まない - ツールが従わない指令を報告しないため。
  - TypeScript の `unstable` の scanner を使わない - バージョンを上げると壊れる契約に寄せないため。
  - ツールの「未使用の抑制」の報告を、検出の代わりに使わない - その報告は使われなかった抑制だけを出すため。
  - `fs.globSync` を使わない - `**` がドットで始まるディレクトリに当たらず、`.pi` を見落とすため。

### Verify

- Always:
  - `pnpm test:related scripts/checks/suppression-check.mjs scripts/checks/suppression-check.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、明示するファイル（`scripts/checks/ja-check.mjs`、`test/scripts.fixture.ts`）を読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added: なし

## 2. 照合

記録をホワイトリストの glob とルール名、直前の `Reason` で許可か違反かにする。

### Types

```ts
// Suppression は Slice 1 の型を使う。
interface AllowEntry {
  readonly path: string; // process.cwd() をルートにした / 区切りの glob
  readonly rules: readonly string[]; // 1 つ以上
}
// AllowEntry を作るのは loadAllow だけである。rules が 1 つ以上であることは、その中で確かめる。

type Verdict =
  | { readonly kind: 'allowed'; readonly suppression: Suppression }
  | { readonly kind: 'not-listed'; readonly suppression: Suppression } // ホワイトリストのどの項目も当たらない
  | { readonly kind: 'no-reason'; readonly suppression: Suppression }; // 項目は当たるが、Reason がない

function loadAllow(root: string): readonly AllowEntry[];
function hasReason(before: string): boolean;
function judge(record: Suppression, allow: readonly AllowEntry[]): Verdict;
```

### Steps

1. `scripts/checks/suppression-check.json`
   1. add: `allow` の配列。すべての `ts` と `tsx` に、アサーションの抑制を許可する 3 つの entry を置く。既存の抑制は入れない（ADR 02 の Scope の `existing data` が Out）。

      ```json
      {
        "allow": [
          {
            "path": "**/*.{ts,tsx}",
            "rules": [
              "@typescript-eslint/consistent-type-assertions",
              "@typescript-eslint/no-unsafe-type-assertion",
              "typescript/no-unsafe-type-assertion"
            ]
          },
          {
            "path": "**/.*/**/*.{ts,tsx}",
            "rules": [
              "@typescript-eslint/consistent-type-assertions",
              "@typescript-eslint/no-unsafe-type-assertion",
              "typescript/no-unsafe-type-assertion"
            ]
          },
          {
            "path": ".*.{ts,tsx}",
            "rules": [
              "@typescript-eslint/consistent-type-assertions",
              "@typescript-eslint/no-unsafe-type-assertion",
              "typescript/no-unsafe-type-assertion"
            ]
          }
        ]
      }
      ```
2. `scripts/checks/suppression-check.mjs`
   1. add: `loadAllow(root)`。`scripts/checks/suppression-check.json` を `readFileSync` と `JSON.parse` で読む。
      - `ENOENT` のときは `[]` を返す。
      - `allow` 以外の鍵がある場合、`path` が文字列でない場合、`rules` が 1 つ以上の文字列の配列でない場合は `throw new Error(<理由>)`。理由は、何が悪いかを 1 文で書く（例: `suppression-check.json is not valid JSON`）。
   2. add: `hasReason(before)`。`before.trimStart()` が `// Reason: ` で始まり、その後ろに空白以外の文字が 1 つ以上続くこと。日本語であるかは見ない。
   3. add: `judge(record, allow)`。
      - `allow` を先頭から走査し、`matchesGlob(record.file, entry.path)` が真で、鍵のすべてが `entry.rules` に含まれる最初の entry を選ぶ。
      - 鍵は、`record.rules` が空なら `[record.directive]`、そうでなければ `record.rules` である。
      - entry がなければ `not-listed`。
      - entry があり `hasReason(record.before)` が真なら `allowed`、偽なら `no-reason`。
3. Outside: `cycles/261120-078-dev/affected/02.md` の `### External` の `path.matchesGlob`、`process.cwd()` をルートにした解決、`node:fs` と `ENOENT`
   1. add: パスの照合。`matchesGlob(record.file, entry.path)` を使い、記録と設定の両方を `process.cwd()` をルートにした `/` 区切りの相対パスにそろえる。完全一致と前方一致の事前判定は行わない。
   2. add: ルール名の比較は、大文字小文字を区別する完全一致にする。前方一致もしない。
      - 実測: `**/*.{ts,tsx}` は `.pi/x.ts` に当たらない。`**/.*/**/*.{ts,tsx}` は当たる（`F8`、`F11`）。
   3. add: `ENOENT` だけを「設定がない」として扱い、他の読み取りの失敗はそのまま投げる。
4. `scripts/checks/suppression-check.test.ts`
   1. add: 設定の形の cases。`loadAllow(fakeRoot())` を `import` して試す。
      - `config: happy 正しい形 → 読める`
      - `config: empty 設定がない → 許可なし`
      - `config: error allow 以外の鍵 → 理由を持つエラー（toThrow）`
      - `config: error rules が空 → 理由を持つエラー（toThrow）`
      - `config: error JSON でない → 理由を持つエラー（toThrow）`
   2. add: 照合の cases。`judge` に記録と entry を渡して試す。
      - `match: happy glob が一致し Reason がある → allowed`
      - `match: boundary **/*.{ts,tsx} は .pi/x.ts に当たらない → not-listed`
      - `match: happy **/.*/**/*.{ts,tsx} は .pi/x.ts に当たる → allowed`
      - `match: happy .*.{ts,tsx} は .foo.ts に当たる → allowed`
      - `match: happy ルール名のすべてを含む → allowed`
      - `match: boundary ルール名の 1 つが欠ける → not-listed`
      - `match: boundary 項目は当たるが Reason がない → no-reason`
      - `match: happy ルール名を持たない抑制を指令の名前で → allowed`
   3. add: `Reason` の cases。`hasReason` を `import` して試す。
      - `reason: happy 直前の 1 行 → Reason がある`
      - `reason: boundary 行の途中 → Reason がない`
      - `reason: boundary 空白以外の文字がない → Reason がない`
      - `reason: happy 日本語でない → Reason がある`

### Policy

- Allowed:
  - `path.matchesGlob(record.file, entry.path)` で、記録のファイルと設定の glob を照合する。
  - 設定と記録のパスは、`process.cwd()` をルートにした `/` 区切りの相対パスで扱う。
  - パスの照合は `path.matchesGlob` だけで行う。`guard.ts` のような完全一致と前方一致の事前判定は行わない。
  - 記録のルール名のすべてが設定の配列に含まれるときだけ、許可する。
  - ルール名を持たない抑制を、その指令の名前で照合する。
  - `Reason` の形は、行頭の空白の後に `// Reason: ` があり、その後に空白以外の文字が続くものとする。
  - 設定がないときは、許可の一覧を空として扱う。抑制はすべて not-listed になる。
  - 判定を、allowed、not-listed、no-reason の 3 つに分ける。
- Forbidden:
  - 許可の条件を、パス、ルール名、`Reason` の 3 つに限る - 条件が増えるほど、回避手段が読めなくなるため。
  - 行番号や位置を許可の条件にしない - 抑制を動かすたびに設定が壊れるため。
  - 設定の鍵を増やさない - 読む人にも判定にも、増やす理由がないため。

### Verify

- Always:
  - `pnpm test:related scripts/checks/suppression-check.mjs scripts/checks/suppression-check.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、明示するファイル（`scripts/checks/ja-check.mjs`、`test/scripts.fixture.ts`）を読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added: なし

## 3. 呼び出しの入口

コマンドとして結果を出し、`package.json` と `DEFINITION.md` に載せる。

### Types

```ts
interface Options {
  readonly report: boolean;
  readonly paths: readonly string[];
}
// paths を / 区切りの相対パスにそろえるのは、対象の決定の手順だけである。

function parseArgs(argv: readonly string[]): Options;
function run(root: string, options: Options): number; // 終了コード
```

### Steps

1. `scripts/checks/suppression-check.mjs`
   1. add: `parseArgs(argv)`。`--report` との完全一致だけを判定する。
      - `--report` は `Options.report` を真にする。
      - `--report=...` と、`--` で始まる他の引数（`--` 単体を含む）は、`throw new Error('unknown argument: <arg>')`。
      - 残りは `Options.paths` に入れる。
   2. add: 対象の決定。
      - パスが 1 つでもあれば、それぞれを `process.cwd()` をルートにして絶対パスにし、`existsSync` と `statSync().isFile()` でファイルだけを残す。
      - 存在しないパスは、黙って飛ばす。
      - 存在するがファイルでないパス（ディレクトリなど）は、`throw new Error('not a file: <path>')`。
      - `CODE_EXTENSIONS` にない拡張子は落とす。
      - 残したパスを `/` 区切りの相対パスにそろえる。
      - パスがなければ `findAll(process.cwd())` で全体を集める。
   3. add: 表示。見出しの 2 行、1 件 1 行（ファイル、行、指令、ツール、ルール名、判定）、`No findings.`、`N files, V violations, A allowed.`。記録は `(file, line)` の順に並べる。ルール名はカンマで並べ、空なら `all` と書く。

      ```text
      suppression-check: Report to the owner. A suppressed rule is a bypass unless the whitelist and the Reason line allow it.
      suppression-check: Fix the code, or ask the owner to allow it.
      <file>:<line>: <directive> [<tool>] <rules|all> allowed
      <file>:<line>: <directive> [<tool>] <rules|all> not allowed
      <file>:<line>: <directive> [<tool>] <rules|all> no Reason line: add // Reason: above (owner's approval needed)
      suppression-check: <N> files, <V> violations, <A> allowed.
      ```

      - 通常は、`allowed` 以外の行だけを出す。`--report` のときは、`allowed` の行も出す。
      - `V` は `not-listed` と `no-reason` の数、`A` は `allowed` の数、`N` は読んだファイルの数である。
      - `No findings.` は、表示する行が 0 のときだけ出す。

   4. add: `run(root, options)`。判定を集め、表示し、終了コードを返す。`not-listed` か `no-reason` が 1 件でもあれば 1、なければ 0。エラーは捕まえない。
   5. add: `isMain` の守り。`import.meta.url === pathToFileURL(process.argv[1]).href` のときだけ、次を走らせる。
      - `try` の中で `parseArgs(process.argv.slice(2))` を読み、`run(process.cwd(), options)` の返り値を `process.exit` に渡す。
      - `parseArgs`、`loadAllow`、対象の決定のどれかが投げたら、`suppression-check: <message>` を stderr に出し、`process.exit(1)` で終わる。
2. Outside: `cycles/261120-078-dev/affected/03.md` の `### External` の `process.argv` と終了コード
   1. add: 引数は `process.argv.slice(2)` だけから読み、`process.argv[0]` と `process.argv[1]` を引数として扱わない。
   2. add: `process.exit` に渡す値を 0 か 1 に限り、`process.exitCode` を使わない。
3. `package.json`
   1. update: `scripts` に `"suppression-check": "node scripts/checks/suppression-check.mjs"` を、`typecheck:staged` の次に加える。
4. `DEFINITION.md`
   1. update: 「作ったものを検査する」の `japanese-check` の次に `- suppression-check: エージェントが、リンターと型チェックを抑制するコメントの指摘を受け取れる` を加える。
5. `scripts/checks/suppression-check.test.ts`
   1. add: 引数の cases。`ja-check.test.ts` と同じく、`spawnSync('node', [SCRIPT, ...args], { cwd: fakeRoot() })` で試す。`SCRIPT` は実リポジトリの `scripts/checks/suppression-check.mjs` の絶対パスである。
      - それぞれの case は、`fakeRoot()` に `scripts/checks/suppression-check.json` を `writeJson` で書き、対象のファイルを `writeFile` で書いてから試す。許可の case は、`// Reason: ...` の行と、そのルール名を持つ entry を用意する。
      - `cli: happy --report → 許可済みの行も出る`
      - `cli: error 知らない --flag → exit 1 と stderr`
      - `cli: boundary 存在しないパス → 飛ばす`
      - `cli: error ディレクトリのパス → exit 1 と stderr`
      - `cli: happy パスなし → 全体を集める`
   2. add: 表示と終了コードの cases。同じく `spawnSync` で試す。
      - `display: happy ホワイトリストにない → not allowed の行と件数、exit 1`
      - `display: happy 項目は当たるが Reason がない → no Reason line の行と件数、exit 1`
      - `display: happy すべて許可 → No findings. と件数、exit 0`
      - `display: empty 抑制なし → No findings. と件数`
      - `display: happy --report で許可済み → allowed の行`
      - `display: error 設定が壊れている → stderr と exit 1`

### Policy

- Allowed:
  - 引数のパスを対象にし、パスがなければ 01 の収集器で全体を集める。
  - 存在しないパスは、黙って飛ばす。
  - 存在するがファイルでないパスは、誤りとして exit 1 で終わる。
  - 同じファイルに CLI を足すときは、import されたときに走らせない守りを置く。
  - 対象の拡張子の絞り込みは、スクリプトの中で行う。
  - `--report` のときは、許可済みの抑制も表示する。
  - 終了コードは、違反があれば 1、なければ 0 とする。
  - 表示は `ja-check.mjs` の形に合わせる。見出しの 2 行、1 件ごとの行、`No findings.`、件数の行。
  - 1 件ごとの行は、ファイル、行、指令、ツール、ルール名、判定を持つ。
  - 判定の文は 3 つに分ける。allowed、not allowed、no Reason line: add // Reason: above (owner's approval needed)。
  - 件数の行は `N files, V violations, A allowed.` とする。
  - `No findings.` は、表示する行が 0 のときだけ出す。
  - `--report` 以外の `--` で始まる引数は、誤りとして exit 1 で終わる。
  - 設定が壊れているときは、理由を stderr に出して exit 1 で終わる。
  - 対象が 0 件でも、見出しと件数の行を出す。
  - `quality-gate` から呼べる形にする。対象パスを引数で受け、終了コードで成否を返す。
- Forbidden:
  - 許可済みの抑制を、通常の表示に出さない - `--report` を付けたときだけ全件を見せるため。
  - `quality-gate` の `CHECK_SPECS` に登録しない - このサイクルの対象外だから。
  - `lefthook.yaml` に登録しない - 適用は `quality-gate` と同じく次のサイクルで決めるため。
  - `package.json` の script に `--report` を付けない - 通常は違反だけを出すため。

### Verify

- Always:
  - `pnpm test:related scripts/checks/suppression-check.mjs scripts/checks/suppression-check.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、明示するファイル（`scripts/checks/ja-check.mjs`、`test/scripts.fixture.ts`）を読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added: other
  - `node scripts/checks/suppression-check.mjs --report` を実行し、`.pi` の既存の抑制が一覧に出て、終了コードが 1 であることを見る。
  - `pnpm suppression-check; echo "exit=$?"` を実行し、同じ一覧と、終了コードが 1 であることを見る。

## Notes

### Slice 1: 検出器

- Findings: なし
- Unplanned: なし
- Commit: 6038c347
- Stopped:

### Slice 2: 照合

- Findings: なし
- Unplanned: なし
- Commit: 8563802a
- Stopped:

### Slice 3: 呼び出しの入口

- Findings: なし
- Unplanned:
  - `isMain` の守りに `node:url` の `pathToFileURL` を使った。Steps の式（`import.meta.url === pathToFileURL(process.argv[1]).href`）どおりで、前例（`.pi/skills/adr/scripts/index.mjs:83`）と同じ形。検出と照合の本体は `node:fs` と `node:path` だけを使う。
- Commit: bb8f30aa
- Stopped:

### Cleanup: テストの重複を落とし、共通の前提をファクトリに移した

- Findings: なし
- Unplanned:
  - `scripts/checks/suppression-check.test.ts` の `cli: happy --report → 許可済みの行も出る` を落とした。`display: happy --report で許可済み → allowed の行` と前提・引数が同一で、断言（`allowed` と `a.ts:2:` を含む）が完全行の断言に含まれるため。
  - 同ファイルの `reason: happy 日本語でない → Reason がある` を落とした。`reason: happy 直前の 1 行 → Reason がある` と同じ分岐（有効な形の英語 → 真）で、日本語を要求しないことは英語が通ること自体が示すため。
  - 許可済みと違反のツリー作りを `writeAllowedTree` と `writeViolationTree` に移した。4 件が同じ不変の前提を字面で繰り返しており、誰も変えないため（可変の `fakeRoot()` は各テストに残す）。

## Work Review

### Round 1

- Stale:
  - `scripts/checks/suppression-check.test.ts:1`: 冒頭コメントが「検出器を試す」「収集は共有の `fakeRoot()` と `writeFile` で作った一時ツリーで試す」と slice 1 の範囲だけを説明し、config・match・reason・cli・display（slice 2〜3）の対象に触れていない。理由：440 行のファイル全体の説明として古く、読む者が対象を誤認するため。
    fixed: 冒頭コメントを検出・照合・入口の 3 範囲を指す文に書き換えた。
- Unlisted:
  - なし。理由：差分のうち `DEFINITION.md`、`package.json`、`suppression-check.mjs`、`suppression-check.json`、`suppression-check.test.ts` は `## Files` に命名があり、`plan` md 自体の `Notes` 追記はサイクルの記録で `Files` の対象外のため。
- Gaps:
  - `scripts/checks/suppression-check.mjs:362`（対応する test は `scripts/checks/suppression-check.test.ts:347` のみ）：`parseArgs` の `--report=...` と `--` 単体を含む `--` 始まり引数の誤り分岐（plan Slice 3 Steps 1.1）が試されていない。理由：`--unknown` だけでは入口の誤り分岐を exercise しておらず、`Goal` のコマンド受付の堅さに穴が残るため。
    fixed: 誤り flag の test を `--unknown`／`--report=x`／`--` の巡回にし、`--report=` 形と `--` 単体を exercise した。
  - `scripts/checks/suppression-check.mjs:380`：`resolveTargets` の `CODE_EXTENSIONS` にない拡張子の絞り込み（plan Slice 3 Steps 1.2）が CLI・display のいずれの case でも試されていない。理由：絞り込みが壊れても全 CLI test が緑のままで、対象決定の振る舞いに穴が残るため。
    fixed: `cli: boundary 対象外の拡張子 → 飛ばす` を足し、`a.md` を引数にして `0 files`・exit 0 を確かめた。
  - `scripts/checks/suppression-check.mjs:390`：空 `rules` を `all` と書く表示分岐（plan Slice 3 Steps 1.3）が display のいずれの case でも試されていない（全 display case が `max-params` あり）。理由：ルール名を持たない抑制の表示は `Goal` の一覧の正しさに関わるのに穴が残るため。
    fixed: `display: happy ルールなし → all と書く` を足し、`@ts-expect-error` の行で `[tsc] all` を確かめた。
- Policy:
  - なし。理由：`Allowed`／`Forbidden` の各行（1 ファイル配置、`isMain` の守り、自前走査、`matchesGlob` のみ、`Reason` 形、3 値判定、表示形、終了コード、`--report` 扱い、`quality-gate`・`lefthook` 不登録、`--report` なし script 等）は差分が守っており、`node:url` の import は Steps の式どおりの plan 決定値のため finding にしないため。
- Unproven:
  - `scripts/checks/suppression-check.test.ts:205`（`213`、`219` も同形）：`expect(() => loadAllow(root)).toThrow()` が引数なしで、plan の「理由を持つエラー」を確かめていない。理由：誤った理由文や汎用エラーでも緑になるため。
    fixed: 3 件の `toThrow()` を `reasonOf` による文面長さの断言に変えた（具体文は断言しない）。
  - `scripts/checks/suppression-check.test.ts:71`（`85`〜`88` も同形）：`oxlint` は `block` の `tool` のみ、`biome` は `next` の `tool` のみを断言し、`line`／`next-line`（`file`／`block`）の `tool` 対応が壊れても緑のまま。理由：表の写し間違いを検出できないため。
    fixed: `oxlint` の `line`／`next-line` と `biome` の `file`／`block` に `tool` の断言を足した。
- Noise:
  - なし。理由：表示断言の見出し・件数・判定文は plan Slice 3 Steps 1.3 の決定値であり、`8`・行番号・`0 files` 等は前提から導出される値で magic number ではなく、linter・formatter・型エラーの抑止コメントもないため。
- Doubts:
  - `Refactor Outside` の「使うのは `node:fs` と `node:path` だけ」と Steps の `pathToFileURL` 式の読み方。`Notes` は Steps どおり・前例どおり・本体は `fs`／`path` のみと許容しているが、文言を直すかは owner の判断が要る。
  - Slice 3 `Verify Added` の `node scripts/checks/suppression-check.mjs --report` と `pnpm suppression-check; echo "exit=$?"` の実行確認は、本レビューでは行っていない（本 role は `git diff`・`status`・`log` のみ）。owner の実行確認が要る。

### Round 2

- Stale:
  - なし。理由：`fixed:` の1件（冒頭コメントの書き換え）を確認した。現行 `suppression-check.test.ts:1-6` は「検出・照合・呼び出しの入口を試す」と3範囲を明示し、本文も `findSuppressions`／`fakeRoot()`・`writeFile`・`writeJson`／子プロセスと手段まで対応づけており、Round 1指摘の「slice 1の範囲だけ」状態は解消されているため。
- Unlisted:
  - なし。理由：Round 1に `fixed:` がなく、今回の差分（`suppression-check.test.ts` のみ＋plan追記）にも `## Files` 外の新規・未記載ファイルはないため。
- Gaps:
  - なし。理由：`fixed:` の3件を diff と実装に当てて確認した。(1) 誤りflag巡回（test:363-371）は `parseArgs`（mjs:354-368）の `arg === '--report'` 以外の `--` 始まりは一律 `unknown argument` 投下と一致し、`--unknown`／`--report=x`／`--` の3通りで `exit 1`＋`unknown argument` を断言している。(2) 対象外拡張子（test:373-380）は `resolveTargets`（mjs:380-381）の `CODE_EXTENSIONS` 不一致は `continue` と一致し、`a.md` 指定で `0 files`・exit 0を断言している。(3) 空rules表示（test:451-458）は `formatRecord`（mjs:390）の `rules.length === 0 ? 'all'` と一致し、`@ts-expect-error` で `[tsc] all not allowed` を断言しているため。
- Policy:
  - なし。理由：Round 1に `fixed:` がなく、今回の差分は test の断言追加のみで `Allowed`／`Forbidden`（1ファイル配置・`matchesGlob` のみ・表示形・終了コード等）の振る舞いを変えていないため。
- Unproven:
  - なし。理由：`fixed:` の2件を確認した。(1) `reasonOf` 化（test:206-224、定義346-356）は `loadAllow`（mjs:289-317）が 3 つとも `Error` に文面を持たせて投げることと一致し、投げない・文面なし・非 `Error` 投下では `length` が0になり赤になるため、Round 1指摘の「引数なし `toThrow()`」状態は解消されている。(2) `tool` 断言追加（test:71-73、89・91）は `DIRECTIVES` 表（mjs:23-39）の `oxlint` 3形・`biome` 3形の対応と一致し、写し間違いがあれば赤になるため。
- Noise:
  - なし。理由：Round 1に `fixed:` がなく、今回の追加断言（`0 files`、`all not allowed`、`unknown argument` 等）は plan Slice 3 Steps 1.1〜1.3 の決定値・前提から導出される値の確認で、新たな magic number や抑止コメントはないため。
- Doubts:
  - `reasonOf` は文面の長さのみを断言し具体文を固定しない（fixed 自体が「具体文は断言しない」と明記）。厳密な文面固定の是非は owner の運用判断が要るが、本レビューは finding にしない。

## Acceptance

- Goal: エージェントが、リンターと型チェックを抑制するコメントの一覧を、許可と違反に分けて、コマンドで受け取れる。達成している。
- Ran: `pnpm test:run`（69 ファイル、900 テスト）と `pnpm typecheck`（root と `.pi`）、`pnpm lint`、`pnpm format:check`。`node scripts/checks/suppression-check.mjs --report` と `pnpm suppression-check` は、162 ファイル、19 違反、0 許可、exit 1。`findSuppressions`、`judge`、`parseArgs` を変更すると 48 件中 25 件が赤になり、戻すと 48 件が緑になった。
- Findings: なし
- Doubts: `Round 2` の `reasonOf` の文面固定は、`design.md` の「断言は直書きの文字列を持たない」に従い、固定しない。
