# PLAN `product-ready-tests`

- No: 03
- Place: worktree
- Boundary Plans: 01 の後に立つ。02 と並列。

## Goal

product-ready のテストが、setup helper と共有 helper を使い、順序・定数の確認と重複したエラー経路を削った形になる。

## Design

- Inside:
  - Modules: `index.test.ts` の中で、各 `it` が繰り返す前提作りを `runOnTree` に統合する。3 つのテストファイルの分割・統合はしない。
  - Dirs: なし。ファイルの保存場所は変えない。
- Outside:
  - Extract: `fakeRoot`、`writeFile`、`writeJson` は 01 が `test/scripts.fixture.ts` に置くものをそのまま使う。`runOnTree`、`snapshot`、`expectUnchanged` は product-ready だけが使うので `index.test.ts` に置く。
  - Colocate: `makeTree`、`writeRules`、`writeReplaceTargets`、`writeTestExclude`、`writePackageJson`、`writeVitestConfig` は `index.test.ts` に残す。product-ready だけが使う。`targets` は `tempDir` を直接使う。

## Files

```text
scripts/
  product-ready/
    blocks.mjs
    cli.mjs
    cli.test.ts             update
    index.mjs
    index.test.ts           update
    targets.mjs
    targets.test.ts         update
    test-exclude.json
rules/
  definition.format.md
  readme.format.md
  roadmap.md
test/
  scripts.fixture.ts
  settings.fixture.ts
  temp-dir.ts
vitest.config.ts
```

## Slices

## 1.index の setup helper と共有 helper を使う

`index.test.ts` に `runOnTree`、`snapshot`、`expectUnchanged` を置き、ローカルの `writeFile`、`writeText`、`writePackageJson`、`writeTestExclude` を共有 helper に置き換える。

### Types

```ts
type Tree = { readonly root: string; readonly cycleA: string };
type RunOut = { readonly status: number; readonly output: string; readonly errors: string };
type Before = {
  readonly pkg: string;
  readonly config: string;
  readonly exclude: string | null;
  readonly targets: readonly string[];
};
function readTargets(root: string): readonly string[];
function readExclude(tree: Tree): string | null;
function runOnTree(
  args: readonly string[],
  setup?: (tree: Tree) => void,
): { tree: Tree; before: Before; result: RunOut };
function snapshot(tree: Tree): Before;
function expectUnchanged(tree: Tree, before: Before): void;
```

### Steps

1. `scripts/product-ready/index.test.ts`
   1. update: ローカルの `writeFile` と `writeText` を削除し、`../../test/scripts.fixture.ts` の import に `fakeRoot`、`writeFile`、`writeJson` を足す。`dirname`、`mkdirSync`、`realpathSync`、`writeFileSync` と `../../test/temp-dir.ts` の `tempDir` の import を外す（`existsSync`、`readFileSync`、`rmSync`、`join` は残す）。
   2. update: `writePackageJson` の中身を `writeJson(root, 'package.json', { name: 't', private: true, scripts })` にし、`writeTestExclude` の中身を `writeJson(root, TEST_EXCLUDE_AT, entries)` にする。
   3. update: `writeVitestConfig` の `writeFileSync(file, <text>)` を `writeFile(root, VITEST_CONFIG_AT, <text>)` にする。
   4. update: `writeRules` と `writeReplaceTargets` の `writeText(root, rel, text)` を `writeFile(root, rel, text)` にする。
   5. update: `makeTree()` の `const root = tempDir();` を `const root = fakeRoot();` にし、戻り値の型を `Tree` にする。中の `writeFile(join(root, CYCLES_LABEL, name, 'note.txt'))` を `writeFile(root, join(CYCLES_LABEL, name, 'note.txt'))` にする。
   6. update: `run` の戻り値の型を `RunOut` にし、`readTargets` の戻り値の型を `readonly string[]` にする。
   7. add: `runOnTree` を足す。

      ```ts
      function runOnTree(
        args: readonly string[],
        setup?: (tree: Tree) => void,
      ): { tree: Tree; before: Before; result: RunOut } {
        const tree = makeTree();
        setup?.(tree);
        const before = snapshot(tree);
        const result = run(INDEX, args, tree.root);
        return { tree, before, result };
      }
      ```

   8. add: `readExclude` と `snapshot` を足す。

      ```ts
      function readExclude(tree: Tree): string | null {
        const at = join(tree.root, TEST_EXCLUDE_AT);
        return existsSync(at) ? readFileSync(at, 'utf8') : null;
      }

      function snapshot(tree: Tree): Before {
        return {
          pkg: readFileSync(join(tree.root, 'package.json'), 'utf8'),
          config: readFileSync(join(tree.root, VITEST_CONFIG_AT), 'utf8'),
          exclude: readExclude(tree),
          targets: readTargets(tree.root),
        };
      }
      ```

   9. add: `expectUnchanged` を足す。

      ```ts
      function expectUnchanged(tree: Tree, before: Before): void {
        expect(existsSync(tree.cycleA)).toBe(true);
        expect(readFileSync(join(tree.root, 'package.json'), 'utf8')).toBe(before.pkg);
        expect(readFileSync(join(tree.root, VITEST_CONFIG_AT), 'utf8')).toBe(before.config);
        expect(readExclude(tree)).toBe(before.exclude);
        expect(readTargets(tree.root)).toEqual(before.targets);
      }
      ```

   10. update: 26 本の `makeTree()` と `run(INDEX, args, tree.root)` を `const { tree, result } = runOnTree(args)` に置き換える。前提を書き換える 11 本は第 2 引数の `setup` で書き換える。実行の前に読んでいた `beforeConfig`、`beforePkg`、`beforeExclude`、`beforeRoadmap`、`beforeTargets` は戻り値の `before` に置き換える。戻り値は使う分だけ取る（`result` だけの本は `const { result } = runOnTree(...)`）。`setup` はブロック本体 `(t) => { writeFile(t.root, ...); }` で書く。`setup` の中では `writeFile`、`writeTestExclude`、`rmSync` を使い、`writeFileSync` は使わない。JSON の形の 2 本は slice 2 で 1 本にまとめるので、ここでは 26 本のまま置き換える。

       ```text
       (empty) 空配列の JSON で --run                 setup: writeTestExclude(tree.root, [])
       error: JSON が壊れている                        setup: writeFile(tree.root, TEST_EXCLUDE_AT, '{not json')
       (error) 目印が無い config で --run              setup: writeFile(tree.root, VITEST_CONFIG_AT, <目印の無い config>)
       テンプレートのファイルが無い                     setup: rmSync(join(tree.root, 'rules', 'roadmap.md'))
       テンプレートのブロックに ## Product が無い       setup: writeFile(tree.root, join('rules', 'definition.format.md'), SKELETON_WITHOUT_PRODUCT)
       (error) JSON が無い                             setup: rmSync(join(tree.root, TEST_EXCLUDE_AT))
       (error) JSON が配列でない                       setup: writeFile(tree.root, TEST_EXCLUDE_AT, '{"exclude": []}\n')
       (error) 要素が文字列でない                      setup: writeFile(tree.root, TEST_EXCLUDE_AT, '[".pi", 1]\n')
       ## What is in it を持たない README で --run     setup: writeFile(tree.root, 'README.md', <## Getting started だけの文書>)
       ### の直後に段落がない README で --run          setup: writeFile(tree.root, 'README.md', broken)
       ### が1つだけの README で --run                 setup: writeFile(tree.root, 'README.md', broken)
       ```

   11. update: dry-run の `realpathSync(tree.root)` を `tree.root` に置き換える。

### Policy

- Allowed:
  - テストの振る舞いを変えない範囲で、テストの本数、前提、断言を整理する。
  - `index.test.ts` の `runOnTree`、`snapshot`、`expectUnchanged` を使う。
  - 共有 `fakeRoot`、`writeFile`、`writeJson` を使う。
  - `targets.test.ts` は `tempDir()` のままにする。
  - 基準外のテストを削除する。
  - 順序・有無の断言のうち、出力の表示内容を確認するもの（`## What is in it` < `### Product` < `### Default`、`headings` の順序と不在、`### Default` の 5 行、`no replace to replace`）は残す。
  - `cli.test.ts` の `parseArgs` と `index` の子プロセスの `exit 1` は、観測点が違うため両方残す。
- Forbidden:
  - `scripts/product-ready/*.mjs` と `test-exclude.json` の振る舞いを変えること - このエントリはテストの整理である。
  - テストを走らせる手段（vitest、`pnpm test`、lefthook）を変えること - `verification` は `Out` である。
  - `cycles/` の過去の記録を参照すること - オーナーの指示である。
  - 01 と 02 の領域のテストをこのエントリで変えること - それぞれの範囲である。
  - `rules/` のテンプレートと `vitest.config.ts` の目印を変えること - テストの前提である。
  - `blocks.mjs` の専用テストを追加すること - このエントリは整理であり、追加は範囲外である。

### Verify

- Always:
  - `pnpm test:related scripts/product-ready/index.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added: なし

## 2.index の同じエラー経路を統合する

`index.test.ts` で、同じ終わり方をする JSON の「配列でない」と「要素が文字列でない」を 1 本にし、エラー時と dry-run の「ツリーは変わらない」を `snapshot` と `expectUnchanged` に寄せる。この slice は slice 1 が足す `runOnTree`、`snapshot`、`expectUnchanged` を使う。

### Types

なし

### Steps

1. `scripts/product-ready/index.test.ts`
   1. update: JSON の「配列でない」と「要素が文字列でない」を 1 本にし、2 つの入力をループする。題名も次のとおりにする。

      ```ts
      it('error: JSON の形が正しくない（配列でない・要素が文字列でない） → 1 行で exit 1、ツリーは変わらない', () => {
        for (const text of ['{"exclude": []}\n', '[".pi", 1]\n']) {
          const { tree, before, result } = runOnTree([RUN_FLAG], (t) =>
            writeFile(t.root, TEST_EXCLUDE_AT, text),
          );
          expect(result.status).toBe(1);
          expect(result.output).toBe('');
          expect(result.errors.trim().split('\n')).toHaveLength(1);
          expect(result.errors).toContain('the test exclude is not valid:');
          expectUnchanged(tree, before);
        }
      });
      ```

   2. update: 次の 12 本の「ツリーは変わらない」の断言を、`runOnTree` の戻り値の `before` と、実行の後の `expectUnchanged(tree, before)` に置き換える。`beforeConfig`、`beforePkg`、`beforeExclude`、`beforeRoadmap`、`beforeTargets`、`readTargets(...)` の比較は消す。

      ```text
      error: JSON が壊れている → 1行で exit 1、ツリーは変わらない
      --run なし → 表示だけで、ツリーは変わらない
      テンプレートのファイルが無い → 1行のエラーで exit 1、ツリーは変わらない
      テンプレートのブロックに ## Product が無い → 1行のエラーで exit 1、ツリーは変わらない
      (error) 目印が無い config で --run → エラー1行で exit 1、cycles は残る
      (error) JSON が無い → 1行で exit 1、ツリーは変わらない
      error: JSON の形が正しくない（配列でない・要素が文字列でない） → 1 行で exit 1、ツリーは変わらない
      ## What is in it を持たない README で --run → 1行のエラーで exit 1、ツリーは変わらない
      ### の直後に段落がない README で --run → 1行のエラーで exit 1、ツリーは変わらない
      ### が1つだけの README で --run → 1行のエラーで exit 1、ツリーは変わらない
      --only に値が無い → exit 1
      未知の引数 → exit 1
      ```

   3. update: 「(error) 一度 --run した後の同じツリーでもう一度 --run する」は、1 回目の実行を `const { tree } = runOnTree([RUN_FLAG])` にし、その後に `const before = snapshot(tree);` を取る。2 回目を `run(INDEX, [RUN_FLAG], tree.root)` のまま残し、`expect(readTargets(tree.root)).toEqual(before.targets)` で比べる。1 回目の実行で cycles が消えているため `expectUnchanged` は使わない。

### Policy

- Allowed:
  - テストの振る舞いを変えない範囲で、テストの本数、前提、断言を整理する。
  - `index.test.ts` の `runOnTree`、`snapshot`、`expectUnchanged` を使う。
  - 共有 `fakeRoot`、`writeFile`、`writeJson` を使う。
  - `targets.test.ts` は `tempDir()` のままにする。
  - 基準外のテストを削除する。
  - 順序・有無の断言のうち、出力の表示内容を確認するもの（`## What is in it` < `### Product` < `### Default`、`headings` の順序と不在、`### Default` の 5 行、`no replace to replace`）は残す。
  - `cli.test.ts` の `parseArgs` と `index` の子プロセスの `exit 1` は、観測点が違うため両方残す。
- Forbidden:
  - `scripts/product-ready/*.mjs` と `test-exclude.json` の振る舞いを変えること - このエントリはテストの整理である。
  - テストを走らせる手段（vitest、`pnpm test`、lefthook）を変えること - `verification` は `Out` である。
  - `cycles/` の過去の記録を参照すること - オーナーの指示である。
  - 01 と 02 の領域のテストをこのエントリで変えること - それぞれの範囲である。
  - `rules/` のテンプレートと `vitest.config.ts` の目印を変えること - テストの前提である。
  - `blocks.mjs` の専用テストを追加すること - このエントリは整理であり、追加は範囲外である。

### Verify

- Always:
  - `pnpm test:related scripts/product-ready/index.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added: なし

## 3.実物 test-exclude.json の確認を削る

`index.test.ts` から、実物の `test-exclude.json` が `test/settings.fixture.ts` を含み `test/pi.fixture.ts` を含まないことを確認するテストを削る。

### Types

なし

### Steps

1. `scripts/product-ready/index.test.ts`
   1. drop: `describe('product-ready test-exclude.json')` と、その 1 本を削除する。

### Policy

- Allowed:
  - テストの振る舞いを変えない範囲で、テストの本数、前提、断言を整理する。
  - `index.test.ts` の `runOnTree`、`snapshot`、`expectUnchanged` を使う。
  - 共有 `fakeRoot`、`writeFile`、`writeJson` を使う。
  - `targets.test.ts` は `tempDir()` のままにする。
  - 基準外のテストを削除する。
  - 順序・有無の断言のうち、出力の表示内容を確認するもの（`## What is in it` < `### Product` < `### Default`、`headings` の順序と不在、`### Default` の 5 行、`no replace to replace`）は残す。
  - `cli.test.ts` の `parseArgs` と `index` の子プロセスの `exit 1` は、観測点が違うため両方残す。
- Forbidden:
  - `scripts/product-ready/*.mjs` と `test-exclude.json` の振る舞いを変えること - このエントリはテストの整理である。
  - テストを走らせる手段（vitest、`pnpm test`、lefthook）を変えること - `verification` は `Out` である。
  - `cycles/` の過去の記録を参照すること - オーナーの指示である。
  - 01 と 02 の領域のテストをこのエントリで変えること - それぞれの範囲である。
  - `rules/` のテンプレートと `vitest.config.ts` の目印を変えること - テストの前提である。
  - `blocks.mjs` の専用テストを追加すること - このエントリは整理であり、追加は範囲外である。

### Verify

- Always:
  - `pnpm test:related scripts/product-ready/index.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added: なし

## 4.targets と cli の順序・定数の確認を削る

`targets.test.ts` の `labels` 2 本と `at` の昇順の 2 つ目の断言、`cli.test.ts` の `switchLines` の 2 本を整理する。

### Types

なし

### Steps

1. `scripts/product-ready/targets.test.ts`
   1. drop: `describe('labels')` の 2 本を削除する。
   2. drop: `at の昇順（作った順が逆でも）` の `found.map((entry) => entry.at).toSorted()` と `found.map((entry) => entry.at)` の一致確認を削除する。1 つ目の `sorted` との `toEqual` が at の昇順をすでに担保するので、2 つ目は重複である。
2. `scripts/product-ready/cli.test.ts`
   1. update: `switchLines` の 2 本を 1 本にし、パスと空の 2 つの入力をループする。題名も次のとおりにする。

      ```ts
      it('happy: JSON のパス、または空 → test-exclude と config の 2 行', () => {
        for (const value of [
          { exclude: 'scripts/product-ready/test-exclude.json', config: 'vitest.config.ts' },
          { exclude: '', config: '' },
        ]) {
          expect(switchLines(value)).toEqual([
            testExcludeLine(value.exclude),
            configLine(value.config),
          ]);
        }
      });
      ```

### Policy

- Allowed:
  - テストの振る舞いを変えない範囲で、テストの本数、前提、断言を整理する。
  - `index.test.ts` の `runOnTree`、`snapshot`、`expectUnchanged` を使う。
  - 共有 `fakeRoot`、`writeFile`、`writeJson` を使う。
  - `targets.test.ts` は `tempDir()` のままにする。
  - 基準外のテストを削除する。
  - 順序・有無の断言のうち、出力の表示内容を確認するもの（`## What is in it` < `### Product` < `### Default`、`headings` の順序と不在、`### Default` の 5 行、`no replace to replace`）は残す。
  - `cli.test.ts` の `parseArgs` と `index` の子プロセスの `exit 1` は、観測点が違うため両方残す。
- Forbidden:
  - `scripts/product-ready/*.mjs` と `test-exclude.json` の振る舞いを変えること - このエントリはテストの整理である。
  - テストを走らせる手段（vitest、`pnpm test`、lefthook）を変えること - `verification` は `Out` である。
  - `cycles/` の過去の記録を参照すること - オーナーの指示である。
  - 01 と 02 の領域のテストをこのエントリで変えること - それぞれの範囲である。
  - `rules/` のテンプレートと `vitest.config.ts` の目印を変えること - テストの前提である。
  - `blocks.mjs` の専用テストを追加すること - このエントリは整理であり、追加は範囲外である。

### Verify

- Always:
  - `pnpm test:related scripts/product-ready/targets.test.ts scripts/product-ready/cli.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added: なし

## 5.先頭コメントを足し、題名を残す断言に合わせる

3 つの product-ready のテストファイルに先頭コメントを足し、`targets` の題名を残す断言に合わせる。

### Types

なし

### Steps

1. `scripts/product-ready/index.test.ts`
   1. add: 先頭にファイルコメントを足す。

      ```ts
      /**
       * `scripts/product-ready/index.mjs` の振る舞いを、子プロセスとして実行して試す。
       *
       * `runOnTree(args, setup)` で一時ツリーを作り、`setup` で前提を書き換え、実行の前の `snapshot` を取ってから走らせる。
       * 実行の前にツリーを書き換える本は `setup` に、読み取る本は戻り値の `before` に寄せる。
       * エラー時と dry-run の「ツリーは変わらない」は `expectUnchanged(tree, before)` で見る。
       * 共有の `fakeRoot`、`writeFile`、`writeJson` は `test/scripts.fixture.ts` から取る。
       */
      ```
2. `scripts/product-ready/cli.test.ts`
   1. add: 先頭にファイルコメントを足す。

      ```ts
      /**
       * `scripts/product-ready/cli.mjs` の `switchLines`、`planLines`、`parseArgs` の振る舞いを試す。
       *
       * 子プロセスは開かない。表示の行は `test/scripts.fixture.ts` の `countLine`、`indented`、`configLine`、`testExcludeLine` から組み立てる。
       */
      ```
3. `scripts/product-ready/targets.test.ts`
   1. add: 先頭にファイルコメントを足す。

      ```ts
      /**
       * `scripts/product-ready/targets.mjs` の `plan`、`skeletonFor`、`remove` の振る舞いを試す。
       *
       * ツリーは `tempDir()` で作り、テンプレートは `x\n` の中身で置く。
       */
      ```

   2. update: `at の昇順（作った順が逆でも）` の題名を `at の昇順（作った順が逆でも） → plan が昇順で返す` にする。

### Policy

- Allowed:
  - テストの振る舞いを変えない範囲で、テストの本数、前提、断言を整理する。
  - `index.test.ts` の `runOnTree`、`snapshot`、`expectUnchanged` を使う。
  - 共有 `fakeRoot`、`writeFile`、`writeJson` を使う。
  - `targets.test.ts` は `tempDir()` のままにする。
  - 基準外のテストを削除する。
  - 順序・有無の断言のうち、出力の表示内容を確認するもの（`## What is in it` < `### Product` < `### Default`、`headings` の順序と不在、`### Default` の 5 行、`no replace to replace`）は残す。
  - `cli.test.ts` の `parseArgs` と `index` の子プロセスの `exit 1` は、観測点が違うため両方残す。
- Forbidden:
  - `scripts/product-ready/*.mjs` と `test-exclude.json` の振る舞いを変えること - このエントリはテストの整理である。
  - テストを走らせる手段（vitest、`pnpm test`、lefthook）を変えること - `verification` は `Out` である。
  - `cycles/` の過去の記録を参照すること - オーナーの指示である。
  - 01 と 02 の領域のテストをこのエントリで変えること - それぞれの範囲である。
  - `rules/` のテンプレートと `vitest.config.ts` の目印を変えること - テストの前提である。
  - `blocks.mjs` の専用テストを追加すること - このエントリは整理であり、追加は範囲外である。

### Verify

- Always:
  - `pnpm test:related scripts/product-ready/index.test.ts scripts/product-ready/cli.test.ts scripts/product-ready/targets.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added: なし

## Notes

### Slice 1: index の setup helper と共有 helper を使う

- Findings: なし
- Unplanned:
  - snapshot が存在しない test-exclude.json で投げる穴を `readExclude(tree): string | null` で塞いだ。`Before.exclude` を `string | null` にし、`snapshot` と `expectUnchanged` を `readExclude` 経由にしたので、`(error) JSON が無い` を `runOnTree` の `setup`（`rmSync`）で扱える。計画の修正を取り込んだ形であり、振る舞いは変えない。
  - 二重 `--run` の `before` 取得タイミングの穴を塞いだ。1 回目の `runOnTree` の戻り値 `before`（1 回目の実行前）ではなく、1 回目の実行後に `snapshot(tree)` を取り直すので、2 回目の後の `readTargets` 比較が実行後の状態と合う。Slice 2 の手順 3 が正式な形を決める。
- Commit: 040664a568a0aa2134b4700d16c2ae92d7ef0864
- Stopped:

### Slice 2: index の同じエラー経路を統合する

- Findings: なし
- Unplanned: なし
- Commit: 7cb01c725a551057a777aedd7941a6f25cbfd3a0
- Stopped:

### Slice 3: 実物 test-exclude.json の確認を削る

- Findings: なし
- Unplanned: なし
- Commit: 282de81b222a7a3cb2af0860eb76ca2fa4cdfd19
- Stopped:

### Slice 4: targets と cli の順序・定数の確認を削る

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 5: 先頭コメントを足し、題名を残す断言に合わせる

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Cleanup: 順序・定数・重複したエラー経路

- Findings:
- Unplanned:

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
