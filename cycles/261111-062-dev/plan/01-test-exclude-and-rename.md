# PLAN `test-exclude-and-rename`

- No: 01, 02
- Place: worktree
- Boundary Plans: なし

## Goal

テストの除外が `product-ready` の設定だけで決まり、ハーネス同期が `harness-sync` の名前で揃う。

## Design

- Inside:
  - Modules: `vitest.config.ts` の `testConfig` と `harnessExcludes` をなくし、`configDefaults.exclude` と目印と7件の `exclude` を1か所に置く。テストの除外の材料を JSON に移し、設定を1つにするためである。`scripts/product-ready/index.mjs` に `test-exclude.json` の読み取りと `vitest.config.ts` の書き換えを足し、`scripts/harness/list/index.mjs` から `harnessExcludes` を落とす。同じ導出を2か所に残さないためである。`scripts/harness/config.test.ts` を `vitest.config.test.ts` に移し、`vitest.config.ts` の隣に置く。テスト対象の隣に置く規則に合わせるためである。
  - Dirs: `scripts/harness` を `scripts/harness-sync` に移す。フォルダ名を役割に合わせるためである。
- Outside:
  - Extract: なし。`test-exclude.json` を読む処理と `vitest.config.ts` を書く処理は `scripts/product-ready` の中で閉じ、他の機能と共有しないためである。
  - Colocate: `test-exclude.json` を `scripts/product-ready` に、`setting.json` を `scripts/harness-sync` に置く。使う側の隣に置くためである。

## Files

```text
.pi/
  skills/
    plan/
      references/
        design.md              update
scripts/
  harness/                     drop
    collect/
      index.mjs
      index.test.ts
    diff/
      index.mjs
      index.test.ts
    display/
      index.mjs
      index.test.ts
    list/
      index.mjs
      index.test.ts
    path/
      index.mjs
      index.test.ts
    harness.json
    index.mjs
    index.test.ts
  harness-sync/                add
    collect/
      index.mjs
      index.test.ts
    diff/
      index.mjs
      index.test.ts
    display/
      index.mjs
      index.test.ts
    list/
      index.mjs
      index.test.ts
    path/
      index.mjs
      index.test.ts
    index.mjs
    index.test.ts
    setting.json
  product-ready/
    test-exclude.json          add
    cli.mjs                    update
    cli.test.ts                update
    index.mjs                  update
    index.test.ts              update
test/
  scripts.fixture.ts           update
DEFINITION.md                  update
package.json                   update
README.ja.md                   update
README.md                      update
vitest.config.test.ts          add
vitest.config.ts               update
vitest.starter.config.ts       drop
```

## Slices

## 1.テストの除外を product-ready の設定へ移す

テストの除外の材料を harness から `product-ready` の JSON に移し、vitest の設定を1つにする。

### Types

```ts
type TestExclude = readonly string[];

type Reporters =
  | readonly ['verbose']
  | readonly [readonly ['default', { readonly summary: boolean }]];

type SwitchPlan = {
  readonly exclude: string;
  readonly config: string;
};

function readTestExclude(root: string): TestExclude;
function writeTestExclude(root: string, paths: TestExclude): void;
function switchLines(plan: SwitchPlan): readonly string[];
function configLine(path: string): string;
function testExcludeLine(path: string): string;
```

### Steps

1. `vitest.config.ts`
   1. update: `configDefaults.exclude` を先に置き、目印 `// product-ready: test-exclude start` と `// product-ready: test-exclude end` の間を空にする。次の fence は `exclude` の部分だけを示す。`reporters` と `passWithNoTests` は4で残す。
   2. drop: `scripts/harness/list/index.mjs` からの `harnessExcludes` と `readList` の import。
   3. drop: `testConfig` 関数と `TestConf` 型ごと（2分岐と `harnessExcludes` の合成を含む）。既定の export は1のinline configになる。
   4. update: `reporters` の `TEST_VERBOSE` の条件分岐と `passWithNoTests: true` を残し、`root`、`dirname`、`fileURLToPath` の import と導出を落とす。

      ```ts
      import { configDefaults, defineConfig } from 'vitest/config';

      export default defineConfig({
        test: {
          exclude: [
            ...configDefaults.exclude,
            // product-ready: test-exclude start
            // product-ready: test-exclude end
          ],
        },
      });
      ```
2. `scripts/product-ready/test-exclude.json`
   1. add: テストの除外の7件を書く。

      ```json
      [
        "scripts/harness",
        ".pi",
        "scripts/checks",
        "scripts/product-ready",
        "test/temp-dir.ts",
        "test/pi.fixture.ts",
        "test/scripts.fixture.ts"
      ]
      ```
3. `scripts/product-ready/index.mjs`
   1. add: `readTestExclude(root)` を作り、`test-exclude.json` を読み、文字列の配列であることを検証する。違反は `the test exclude is not valid: <path>` の1行で投げる。
   2. add: `writeTestExclude(root, paths)` を作り、`vitest.config.ts` の目印の間を `'<path>',` の行で置き換える。空配列なら目印の間を空にする。
   3. drop: `STARTER_FLAG`、`STARTER_CONFIG_AT`、`TARGET_SCRIPTS`、`flaggedScripts` と、`package.json` の `--config`。
   4. drop: `configExists` と `rmSync(STARTER_CONFIG_AT)` のコード。ファイル自体は7で落とす。
   5. update: `main` の先頭、引数と `plan` の後で `readTestExclude` を呼ぶ。失敗は `the test exclude is not valid: <path>` の1行で `return 1`し、副作用はない。
   6. update: 表示を `switchLines({ exclude: <test-exclude.json のパス>, config: <vitest.config.ts のパス> })` に合わせる。
4. `scripts/product-ready/cli.mjs`
   1. update: `switchLines` の config と scripts の表示を、`test-exclude` と `config` の2行に変える。

      ```ts
      export function switchLines(plan: {
        readonly exclude: string;
        readonly config: string;
      }): readonly string[] {
        return [`test-exclude: ${plan.exclude}`, `config: ${plan.config}`];
      }
      ```

   2. drop: `config: vitest.starter.config.ts` と `scripts: ...` の行を落とす。
5. `scripts/harness/harness.json`
   1. update: `copy` から `vitest.config.ts` を外す。
6. `package.json`
   1. update: `test`、`test:run`、`test:related` から ` --config vitest.starter.config.ts` を外す。

      ```json
      "test": "vitest",
      "test:run": "vitest run",
      "test:related": "vitest related --run"
      ```
7. `vitest.starter.config.ts`
   1. drop: ファイル。
8. `scripts/harness/list/index.mjs`
   1. drop: `harnessExcludes` 関数。
   2. update: コメントを `// ハーネスの一覧を読む。保存場所は ...` から `// ハーネスの一覧を読む。` だけにする。
9. `scripts/harness/config.test.ts`
   1. update: `scripts/harness/config.test.ts` を `vitest.config.test.ts` に移し、`vitest.config.ts` の既定の export を読み、`exclude` の末尾（`configDefaults.exclude` + 目印の間の7件）と、`reporters` の `TEST_VERBOSE` の分岐と `passWithNoTests: true` を比べるテストにする。`testConfig` の import は落とす。
      - `happy: configDefaults.exclude の後ろに目印の間の一覧が並ぶ → 配列が一致する`
      - `happy: reporters と passWithNoTests が今の値のまま → 一致する`
10. `scripts/harness/list/index.test.ts`
    1. drop: `harnessExcludes` の2つのテスト。
    2. update: `harnessExcludes` の import を落とす。
11. `scripts/product-ready/cli.test.ts`
    1. update: `switchLines({ exclude: <path>, config: <path> })` が `testExcludeLine(<path>)` と `configLine(<path>)` の2行を返すテストにする。`empty` は空の `exclude`/`config` で `test-exclude: ` と `config: ` の2行。
       - `happy: JSON のパスと config のパス → test-exclude と config の2行`
       - `empty: exclude と config が空 → test-exclude: と config: の2行`
12. `scripts/product-ready/index.test.ts`
    1. update: `FLAG` と `CONFIG_AT` の定数と、flag と config の断言を、JSON と config の断言に置き換える。`makeTree` に7件の `test-exclude.json` と、目印付きの `vitest.config.ts` を書く。成功時は目印の間に7件を入れ、壊れた JSON では1行で exit 1し、ツリーは変えない。
       - `happy: --run → 目印の間に7件が入り、JSON が残る`
       - `error: JSON が壊れている → 1行で exit 1、ツリーは変わらない`
    2. update: 2回目の `--run` のテスト（一度 `--run` した後にもう一度 `--run` すると exit 1）はそのまま残す。
13. `test/scripts.fixture.ts`
    1. update: `testExcludeLine(path)` を加え、`test-exclude: ${path}` を返す。`configLine` は残し、`scriptsLine` は落とす。
14. `README.md`、`README.ja.md`
    1. update: `README.md` の `vitest.config.ts` の行を英語に、`README.ja.md` の行を日本語にする。fence は上から `README.md`、`README.ja.md` の順にする。

       ```md
       - vitest.config.ts - Test config; product:ready writes the harness paths into its exclude list from test-exclude.json.
       - vitest.config.ts - テストの設定で、product:ready が test-exclude.json の一覧を除外に書く。
       ```

    2. update: `product-ready` の行を、fence の上から `README.md`、`README.ja.md` の順にする。

       ```md
       - product-ready: `scripts/product-ready/*` - Replaces roadmap, definition, and readmes with templates, and writes the test exclude list from test-exclude.json on first run.
       - product-ready: `scripts/product-ready/*` - roadmap と定義と readme をテンプレートに置き換え、test-exclude.json の一覧をテストの除外に書く。
       ```

    3. drop: `vitest.starter.config.ts` の行。
15. Outside: `vitest 5.0.5 の設定契約（test.exclude、test.include、configDefaults.exclude、defineConfig）`
    1. update: `configDefaults.exclude` と `defineConfig` を既存の使い方のまま使う。

### Policy

- Allowed:
  - `product:ready` は `vitest.config.ts` の除外配列を書き換えてよい。
  - `product:ready` は、自分自身も JSON も残してよい。
  - `product:ready` は、JSON が空の配列なら、目印の間を空のままにする。
- Forbidden:
  - `harness.json` の `copy` と `push` からテスト除外を導出する - 結合が戻るため。
  - 2つ目の vitest 設定を持つ - `product:ready` の書き換えとスクリプトの書き換えが戻るため。
  - `configDefaults.exclude` を書き換えの対象にする - `node_modules` と `.git` を常に除外するため。
  - `vitest.config.ts` がテスト実行時に JSON を読む - JSON は入力であり、実行時に読むものではないため。
  - JSON を読めない、JSON でない、配列でない、要素が文字列でないときに書き換える - 中途半端な状態を残さないため。
  - 029 のプリンシプル違反の修正と 028 の不要テストの整理をこのエントリに含める - 別のロードマップ項目であるため。

### Verify

- Always:
  - 関連テスト（`pnpm test:related <changed files>`。関連がなければ `pnpm test:run`）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added: other — `pnpm test:run`（65件）と、`node scripts/product-ready/index.mjs` の dry-run（JSON と config の表示）、2回目の `--run`（F7）を確かめる。

## 2.ハーネス同期を harness-sync の名前へ揃える

ハーネス同期のフォルダ、JSON、スクリプト、Unit 名を `harness-sync` に揃える。

### Types

```ts
type HarnessList = {
  readonly starter: string;
  readonly copy: readonly string[];
  readonly push: readonly string[];
};

function readList(root: string): HarnessList;
```

### Steps

1. `scripts/harness` → `scripts/harness-sync`
   1. add: `Files` の13ファイルを `scripts/harness-sync` に `git mv` で移す。
   2. drop: フォルダ `scripts/harness`。
   3. update: フォルダ内の相対 import はそのままにする。
2. `scripts/harness-sync/setting.json`
   1. add: ファイル（`harness.json` の改名）。
   2. update: `copy` と `push` の4つのパターンを `scripts/harness-sync` に変える。

      ```text
      scripts/harness-sync/*.mjs
      scripts/harness-sync/*.test.ts
      scripts/harness-sync/*/*.mjs
      scripts/harness-sync/*/*.test.ts
      ```
3. `scripts/harness-sync/index.mjs`
   1. update: 使い方のコメントを `node scripts/harness-sync/index.mjs pull|push [--run]` にし、3行目の `scripts/harness/harness.json` を `scripts/harness-sync/setting.json` にする。
4. `scripts/harness-sync/list/index.mjs`
   1. update: `readList` の読む先を `scripts/harness-sync/setting.json` にする。
   2. update: コメントの `scripts/harness/harness.json` を `scripts/harness-sync/setting.json` に置き換える。
5. `scripts/harness-sync/index.test.ts`、`scripts/harness-sync/list/index.test.ts`、`scripts/harness-sync/collect/index.test.ts`、`scripts/harness-sync/diff/index.test.ts`、`scripts/harness-sync/display/index.test.ts`、`scripts/harness-sync/path/index.test.ts`
   1. update: 6ファイル内の `scripts/harness`、`scripts/harness/harness.json`、`harness.json` の出現を、すべて `scripts/harness-sync`、`scripts/harness-sync/setting.json`、`setting.json` に置き換える。
6. `package.json`
   1. update: `harness:pull` を `harness-sync:pull` に、`harness:push` を `harness-sync:push` にする。
   2. update: 値を `node scripts/harness-sync/index.mjs pull|push` にする。

      ```json
      "harness-sync:pull": "node scripts/harness-sync/index.mjs pull",
      "harness-sync:push": "node scripts/harness-sync/index.mjs push"
      ```
7. `README.md`、`README.ja.md`
   1. update: `README.md` と `README.ja.md` の `scripts/harness/*` の出現を、すべて `scripts/harness-sync/*` に置き換える。
8. `.pi/skills/plan/references/design.md`
   1. update: `scripts/harness/harness.json` を `scripts/harness-sync/setting.json` にする。
9. `DEFINITION.md`
   1. update: `Unit.harness-copy` の行を `Unit.harness-sync` にする。

      ```md
      - harness-sync: オーナーが、スターターのハーネスをプロジェクトへ取り込み、プロジェクトのハーネスをスターターへ戻せる
      ```
10. `scripts/product-ready/test-exclude.json`
11. update: `scripts/harness` を `scripts/harness-sync` にする。

### Policy

- Allowed:
  - `scripts/harness`、`harness.json`、`harness:pull`、`harness:push`、`Unit.harness-copy` を `harness-sync` に変えてよい。
- Forbidden:
  - 過去の `cycles/` の記録を変える - 当時の名前の記録であるため。
  - 既存のプロダクトの `package.json` のスクリプトを移行する - このリポジトリのスターターの名前だけを変えるため。
  - `scripts/checks/scopes.json` と `HARNESS_DIRS` を変える - いずれも `scripts/harness` を指さないため。
  - `scripts/product-ready` と `test/` を変える - `scripts/harness` の参照がないため（`test-exclude.json` の `scripts/harness` を `scripts/harness-sync` にする更新は除く）。
  - pull と push の振る舞いを変える - 名前だけを変えるため。
  - `setting.json` の `copy` と `push` の形を変える - 値のフォルダ名だけを変えるため。
  - `vitest.config.ts` を追従させる - エントリ 01 が `scripts/harness` からの import を取り除くため。

### Verify

- Always:
  - 関連テスト（`pnpm test:related <changed files>`。関連がなければ `pnpm test:run`）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added: other — `pnpm harness-sync:pull` と `pnpm harness-sync:push` が新しいパスで動くこと、`git grep 'scripts/harness'` が `cycles/` の記録以外に残っていないことを確かめる。

## Notes

### Slice 1: テストの除外を product-ready の設定へ移す

- Findings: なし
- Unplanned:
  - `scripts/product-ready/index.test.ts` の dry-run の表示断言が macOS の一時領域の symlink（`/var` と `/private/var`）で落ちたため、`realpathSync` で実パスに揃えた。子プロセスの `process.cwd()` が実パスを返すため、待ちきれない崩れとしてここで直した。
- Commit: 445833ff7e92101ae117f1f2fc01a1369c07c90e
- Stopped:

### Slice 2: ハーネス同期を harness-sync の名前へ揃える

- Findings:
  - 旧名の `git grep` に `cycles/` の記録以外の残りが2件ある（`scripts/product-ready/index.test.ts:24` の試料値 `'scripts/harness'` と `ROADMAP.md:272` の当時の記述 `harness.json`）。
    - left: 前者は Slice 2 の Policy が `scripts/product-ready` の変更（`test-exclude.json` を除く）を禁じるため。後者は過去の版の記録であり、直すと履歴を改ざんするため。どちらも振る舞いに影響しない。
- Unplanned: なし
- Commit:
- Stopped:

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
