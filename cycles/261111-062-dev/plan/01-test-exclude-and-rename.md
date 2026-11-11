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
    - left: 前者は Slice 2 の Policy が `scripts/product-ready` の変更（`test-exclude.json` を除く）を禁じるため。後者は当時の記録であり、直すと履歴を改ざんするため。どちらも振る舞いに影響しない。
- Unplanned: なし
- Commit: e7d2a633ca78bc4fa071622ef7bad958697cbf68
- Stopped:

### Cleanup: 更新したテストの重複・廃止の点検（落とすものなし）

- Findings: なし
- Unplanned: なし

## Work Review

### Round 1

- Stale:
  - なし（`scripts/product-ready/index.test.ts:24` の `'scripts/harness'` 試料と `ROADMAP.md:272` の `harness.json` は Notes の Slice 2 Findings で left と決定済みのため finding にしない。`testConfig`・`harnessExcludes`・`vitest.starter.config.ts` への参照は `cycles/` の記録以外に残っていない）。
- Unlisted:
  - なし（Files の列挙に `scripts/harness/config.test.ts` の行はないが、Slice 1 Steps 9 と Design Modules で `vitest.config.test.ts` への移動が決定済みで、`scripts/harness/` の drop に含まれる。`realpathSync` の Unplanned 対応も Files 記載の `scripts/product-ready/index.test.ts` の内側）。
- Gaps:
  - 空配列で目印の間を空にする振る舞い（Policy Allowed・Slice 1 Steps 3.2、`scripts/product-ready/index.mjs:289`）を確かめるテストがない。happy は7件、error は壊れた JSON のみ（`scripts/product-ready/index.test.ts:191`）。
    - fixed: `(empty) 空配列の JSON で --run` を追加し、config 全文不変と JSON の `[]` 残存を断言した。
  - `readTestExclude` の不正4種（無い・JSONでない・配列でない・要素が文字列でない、`scripts/product-ready/index.mjs:263`）のうち、error テスト（`scripts/product-ready/index.test.ts:207`）が扱うのは「JSONでない」1種のみ。残り3種で書き換えず exit 1 になることがチェックされておらず、Policy Forbidden 5行目（不正時の書き換え禁止）の保証が1種にしかない。
    - fixed: 不正3種の error テストを `product-ready index exclude errors` に追加し、いずれも1行 exit 1・ツリー不変を断言した。
- Policy:
  - なし（Forbidden はいずれも保持。Slice 1: harness 由来の除外導出なし・2つ目の設定なし・`configDefaults` 非対象・実行時 JSON 読みなし・不正時は副作用（`remove`、`writeTestExclude`、`applyJobs`）より前の `return 1`（`scripts/product-ready/index.mjs:325`）・029/028 不干渉。Slice 2: 過去 `cycles/` 不変・`scopes.json` と `HARNESS_DIRS` 不変・pull/push の振る舞い不変（`.mjs` はパスとコメントのみ変更）・`setting.json` の形不変・`vitest.config.ts` 追従なし）。
- Unproven:
  - happy テストの目印の断言が `toContain` の繰り返し（`scripts/product-ready/index.test.ts:200`）のため、8行目の混入・重複書き込み・順序入替・目印外のゴミがあっても緑のまま。「目印の間に7件が入る」の厳密な一致は証明されない。
    - fixed: happy を config 全文の `toBe` 一致（目印間への7件挿入のみの差分）に強化し、順序・重複・余分・目印外変更があれば落ちる形にした。
- Noise:
  - なし（`toHaveLength(1)` と `the test exclude is not valid:` は plan 指定の仕様値、`TEST_EXCLUDE_ENTRIES` の7件は Slice 1 Steps 12.1 決定の共有定数で各テストのリテラルではない、`cli.test.ts` の期待は `testExcludeLine`/`configLine` の helper 組み立て、削除されたテストは plan 指定の drop）。
- Doubts:
  - `main` は `remove()`（`scripts/product-ready/index.mjs:352`）を `writeTestExclude()`（`:353`）より先に呼ぶため、目印欠落（`no test exclude markers`、`:295`）では cycles 削除済みの半端状態が残る。JSON 不正時は副作用前に `return 1` するが、markers 異常時の順序（write 先か現状維持か）は plan・Policy ともに無言。修正か現状追認か、オーナー判断が必要。
    - decided(fix): Steps に順序指定がないため `writeTestExclude` を `remove` より先にし、markers 異常時は副作用なしにした。欠落時の error テストで cycles 残存を固定した。
  - `reporters` テスト（`vitest.config.test.ts:31`）は実行時 env の分岐しか確かめない。もう一方の `TEST_VERBOSE` 分岐が壊れても通常実行では緑のまま。plan は「今の値のまま」と決めた形だが、CI を両 env で回すか現状でよいか、オーナー判断が必要。
    - decided(leave): Steps 9 は今の値の一致のみ要求し、両分岐の実行を要求しないため現状維持。

### Round 2

- Stale:
  - なし（`testConfig`・`harnessExcludes`・`vitest.starter.config.ts` への参照は `cycles/` の記録以外に残っていない。残る `scripts/harness` は `scripts/product-ready/index.test.ts:24` の試料値と `ROADMAP.md:272` の当時記述のみで、Round 1 Notes の left 決定どおりのため finding にしない）。
- Unlisted:
  - なし（Files 外の変更は `realpathSync` の Unplanned 対応のみで `scripts/product-ready/index.test.ts` の内側。`vitest.config.test.ts` への移動は Slice 1 Steps 9 決定どおり）。
- Gaps:
  - なし（空配列の振る舞いは `scripts/product-ready/index.test.ts:215` の `(empty)` が config 全文不変と JSON `[]` 残存を断言し、Slice 1 Steps 3.2・Policy Allowed を満たす。`readTestExclude` の不正4種は `:225` の壊れた JSON に加え、`:431` の欠落・`:446` の非配列・`:461` の非文字列要素の3種が追加され、いずれも1行 exit 1・出力空・config 不変・targets 不変・cycles 残存を断言し、Policy Forbidden の不正時書き換え禁止を4種とも保証する）。
- Policy:
  - なし（Forbidden はいずれも保持。不正時は `scripts/product-ready/index.mjs:326` の `readTestExclude` 直後の `return 1` で副作用前に終了し、目印欠落時は `:351-355` の `writeTestExclude` 先行・同一 try 内のため `remove`・`applyJobs` まで届かず、`:413` の error テストが cycles 残存・config 不変・targets 不変を固定する。`configDefaults` 非対象・実行時 JSON 読みなし・2つ目の設定なしも変わらない）。
- Unproven:
  - なし（happy は `scripts/product-ready/index.test.ts:200-210` の `toContain` 繰り返しから `:205-210` の目印間7件挿入のみの差分による config 全文 `toBe` 一致に強化され、順序入替・重複・混入・目印外変更があれば落ちる。`reporters` は `vitest.config.test.ts:31` の今の値の一致のままで、Round 1 の decided(leave) どおり両分岐実行は要求しないため追加の証明は不要）。
- Noise:
  - なし（`toHaveLength(1)` と `the test exclude is not valid:` は plan 指定の仕様値、`TEST_EXCLUDE_ENTRIES` は Steps 12.1 決定の共有定数、`cli.test.ts` の期待は helper 組み立て、削除テストは plan 指定の drop のままで、新たな冗長・脆さはない）。
- Doubts:
  - なし（Round 1 の2件は decided 済みで、順序修正は上記 Policy どおり実装・固定され、`reporters` の片 env のみは Steps 9 の要求どおりのため、新たにオーナー判断を求める事項はない）。

## Acceptance

- Goal: テストの除外が `product-ready` の設定だけで決まり、ハーネス同期が `harness-sync` の名前で揃う。実装はこれを達成している。
- Ran: `pnpm typecheck`、`pnpm lint`、`pnpm format:check`、`pnpm test:run`（65 files / 813 tests）、`pnpm product:ready` の dry-run、`pnpm harness-sync:pull` と `push`（pull の missing 5 はベースが旧 `scripts/harness` のため。push は13を写す）、`git grep 'scripts/harness'`（`scripts/harness-sync` の部分一致と `scripts/product-ready/index.test.ts:24` の試料、`ROADMAP.md:272` の `harness.json`）。`readTestExclude` の検証を外すと不正 JSON の2テストが赤になり、戻すと緑に戻ることを確認した。
- Findings: なし
- Doubts: `reporters` テストは実行時 env の片分岐だけを見る。`Steps` 9 は「今の値のまま」の一致だけを求めるため、両 env では回さない（decided(leave)）。
