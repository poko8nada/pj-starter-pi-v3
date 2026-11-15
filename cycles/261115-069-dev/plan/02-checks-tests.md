# PLAN `checks-tests`

- No: 02
- Place: worktree
- Boundary Plans: 01 の後に立つ。03 と並列。

## Goal

checks のテストが、共有 helper と checks の helper を使い、重複した確認と実装の定数の写しを削った形になる。

## Design

- Inside:
  - Modules: `scripts/checks/checks.fixture.ts` を新しく置く。`stubTsc` と `writeScopes` を 1 か所に集めるためである。3 つのテストファイルの分割・統合はしない。
  - Dirs: なし。`scripts/checks/` の中に fixture を 1 つ足すだけである。
- Outside:
  - Extract: `fakeRoot`、`writeFile`、`writeJson` は 01 の `test/scripts.fixture.ts` を使う。`checks.fixture.ts` もその `writeFile` と `writeJson` を使う。
  - Colocate: `writeConfig` と `validConfig` は ja-check のテストの側に残す。ja-check だけが使う。`ja-check.json` と `scopes.json` は変えない。

## Files

```text
scripts/
  checks/
    checks.fixture.ts       add
    ja-check.mjs
    ja-check.json
    ja-check.test.ts        update
    scopes.json
    typecheck.mjs
    typecheck.test.ts       update
    typecheck-staged.mjs
    typecheck-staged.test.ts update
test/
  scripts.fixture.ts
  temp-dir.ts
```

## Slices

## 1.checks の fixture に tsc と scopes の helper を置く

`scripts/checks/checks.fixture.ts` に、type-check のテストが共有する `stubTsc` と `writeScopes` を置く。

### Types

```ts
export function stubTsc(root: string): void;
export function writeScopes(root: string, scopes: readonly string[]): void;
```

### Steps

1. `scripts/checks/checks.fixture.ts`
   1. add: `stubTsc` を足す。`stub -p` を出し、`STUB_FAIL` が `-p` のパスに含まれるときだけ exit 1 する。

      ```ts
      import { chmodSync } from 'node:fs';
      import { join } from 'node:path';
      import { writeFile, writeJson } from '../../test/scripts.fixture.ts';

      export function stubTsc(root: string): void {
        const stub = writeFile(
          root,
          join('node_modules', '.bin', 'tsc'),
          '#!/usr/bin/env node\n' +
            "const at = process.argv.indexOf('-p');\n" +
            'const got = at >= 0 ? (process.argv[at + 1] ?? "") : "";\n' +
            'console.log(`stub -p ${got}`);\n' +
            'const fail = process.env.STUB_FAIL ?? "";\n' +
            'if (fail !== "" && got.includes(fail)) process.exit(1);\n' +
            'process.exit(0);\n',
        );
        chmodSync(stub, 0o755);
      }

      export function writeScopes(root: string, scopes: readonly string[]): void {
        writeJson(root, join('scripts', 'checks', 'scopes.json'), scopes);
      }
      ```

   2. add: 先頭にファイルコメントを置く。

      ```ts
      /**
       * `scripts/checks/` のテストが使う tsc のスタブと scopes.json の書き込み。
       *
       * - `stubTsc(root)` は `node_modules/.bin/tsc` を置く。渡された `-p` を出し、`STUB_FAIL` がそのパスに含まれるときだけ exit 1 する。
       * - `writeScopes(root, scopes)` は `scripts/checks/scopes.json` を書く。
       *
       * テストの外から呼ばれても、待ち続けずに返る。
       */
      ```

### Policy

- Allowed:
  - テストの振る舞いを変えない範囲で、テストの本数、前提、断言を整理する。
  - 複数 Unit が使う `fakeRoot` と `writeFile` は 01 の `test/scripts.fixture.ts` を使う。
  - checks だけが使う helper は `scripts/checks/` の側に置く。
  - 基準外のテストを削除する。
  - checks の `stubTsc` は `STUB_FAIL` を見る 1 バージョンにし、typecheck-staged は `STUB_FAIL` を設定しない。
  - 順序・有無の断言のうち、出力の表示内容とフィルタの振る舞いを確認するものは残す。
- Forbidden:
  - `scripts/checks/*.mjs` と `ja-check.json`、`scopes.json` の振る舞いを変えること - このエントリはテストの整理である。
  - テストを走らせる手段（vitest、`pnpm test`、lefthook）を変えること - `verification` は `Out` である。
  - `cycles/` の過去の記録を参照すること - オーナーの指示である。
  - 01 と 03 の領域のテストをこのエントリで変えること - それぞれの範囲である。

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added: なし

## 2.ja-check の重複した確認を統合する

ja-check のテストで、同じ出力になる 3 本の単独引用、3 本の `exclude` パス、対称な 6 本の設定誤りを、それぞれ 1 本にまとめる。あわせてローカルの `fakeRoot` と `writeFile` を共有 helper に置き換える。

### Types

なし

### Steps

1. `scripts/checks/ja-check.test.ts`
   1. update: ローカルの `fakeRoot`、`writeFile`、`writeConfig` を削除し、`../../test/scripts.fixture.ts` から `fakeRoot`、`writeFile`、`writeJson` を import する。`writeConfig` は次の形で残す。

      ```ts
      function writeConfig(root: string, value: unknown): void {
        writeJson(root, join('scripts', 'checks', 'ja-check.json'), value);
      }
      ```

      `mkdirSync`、`realpathSync`、`writeFileSync` と `../../test/temp-dir.ts` の `tempDir` の import を外す（`join` は残す）。`validConfig`、`JaCheckConfig`、`TestConfig` はそのまま残す。

   2. update: 次の 3 本を削除し、下の fence の 1 本にする。ヘッダの断言は落とし、`No findings` と件数の行を残す（ヘッダの位置は「md内のwarn語」の本が `h1At === 0` と 2 つの `toContain` で見る）。

      ```text
      単独引用のerror語 → 報告しない
      バッククォート単独のコードコメント → 報告しない
      ダブルクォート単独のerror語 → 報告しない
      ```

      ```ts
      it('単独引用の error 語 → 報告しない（3 つの引用符）', () => {
        for (const quote of ["'", '`', '"']) {
          const root = fakeRoot();
          writeConfig(root, validConfig());
          const file = writeFile(root, 'a.md', `${quote}${ERROR_WORD}${quote}\n`);
          const out = run(root, [file]);
          expect(out.status).toBe(0);
          expect(out.stdout).not.toContain('[error]');
          expect(out.stdout).toContain('ja-check: No findings.');
          expect(out.stdout).toContain('ja-check: 1 files, error 0, warn 0.');
        }
      });
      ```

   3. update: `exclude` が `ROADMAP.md` を見る次の 3 本を削除し、下の fence の 1 本にする。「excludeが`**/affected/*.md`…」と「excludeがROADMAP.mdで行がsrc配下…」の 2 本は残す。ヘッダの断言は落とし、`No findings` と件数の行を残す。

      ```text
      (happy) excludeがROADMAP.mdで行が1.x.xの下のerror語 → 報告せずexit 0
      (happy) excludeがROADMAP.mdで引数が絶対パス → 報告せずexit 0
      (happy) excludeがROADMAP.mdで引数が./ROADMAP.md → 報告せずexit 0
      ```

      ```ts
      it('exclude が ROADMAP.md で引数が相対・絶対・./ → 報告せず exit 0', () => {
        for (const form of ['relative', 'absolute', 'dot']) {
          const root = fakeRoot();
          writeConfig(root, { ...validConfig(), exclude: ['ROADMAP.md'] });
          writeFile(root, 'ROADMAP.md', `${ERROR_WORD}\n`);
          const arg =
            form === 'relative'
              ? 'ROADMAP.md'
              : form === 'absolute'
                ? join(root, 'ROADMAP.md')
                : './ROADMAP.md';
          const out = run(root, [arg]);
          expect(out.status).toBe(0);
          expect(out.stdout).not.toContain('[error]');
          expect(out.stdout).toContain('ja-check: No findings.');
          expect(out.stdout).toContain('ja-check: 1 files, error 0, warn 0.');
        }
      });
      ```

   4. update: 設定誤り 9 本のうち、`exclude` と `exception` の同じ形の 3 組を 3 本にし、欄をループする。残す 3 本は「余分な欄がある設定」「キーや値の型が誤った設定」「頂点が非レコードの設定」であり、「壊れた設定」も残す。

      ```ts
      it('(error) exclude または exception がない設定 → header の 2 行を出して exit 1', () => {
        for (const missing of ['exclude', 'exception'] as const) {
          const root = fakeRoot();
          const config = Object.fromEntries(
            Object.entries(validConfig()).filter(([key]) => key !== missing),
          );
          writeConfig(root, config);
          const file = writeFile(root, 'a.md', 'ok\n');
          const out = run(root, [file]);
          expect(out.status).toBe(1);
          expect(out.stdout).toContain(HEADER_1);
          expect(out.stdout).toContain(HEADER_2);
        }
      });
      ```

      ```ts
      it('(error) exclude または exception が配列でない設定 → header の 2 行を出して exit 1', () => {
        for (const field of ['exclude', 'exception'] as const) {
          const root = fakeRoot();
          writeConfig(root, { ...validConfig(), [field]: 'x' });
          const file = writeFile(root, 'a.md', 'ok\n');
          const out = run(root, [file]);
          expect(out.status).toBe(1);
          expect(out.stdout).toContain(HEADER_1);
          expect(out.stdout).toContain(HEADER_2);
        }
      });
      ```

      ```ts
      it('(error) exclude または exception の要素が文字列でない設定 → header の 2 行を出して exit 1', () => {
        for (const field of ['exclude', 'exception'] as const) {
          const root = fakeRoot();
          writeConfig(root, { ...validConfig(), [field]: [1] });
          const file = writeFile(root, 'a.md', 'ok\n');
          const out = run(root, [file]);
          expect(out.status).toBe(1);
          expect(out.stdout).toContain(HEADER_1);
          expect(out.stdout).toContain(HEADER_2);
        }
      });
      ```

   5. drop: 「md内のwarn語」の `const h2At = out.stdout.indexOf(HEADER_2);` と `expect(h2At).toBeGreaterThan(h1At);` を削除する。`const h1At = out.stdout.indexOf(HEADER_1);` と `expect(h1At).toBe(0);` は残す。

### Policy

- Allowed:
  - テストの振る舞いを変えない範囲で、テストの本数、前提、断言を整理する。
  - 複数 Unit が使う `fakeRoot` と `writeFile` は 01 の `test/scripts.fixture.ts` を使う。
  - checks だけが使う helper は `scripts/checks/` の側に置く。
  - 基準外のテストを削除する。
  - checks の `stubTsc` は `STUB_FAIL` を見る 1 バージョンにし、typecheck-staged は `STUB_FAIL` を設定しない。
  - 順序・有無の断言のうち、出力の表示内容とフィルタの振る舞いを確認するものは残す。
- Forbidden:
  - `scripts/checks/*.mjs` と `ja-check.json`、`scopes.json` の振る舞いを変えること - このエントリはテストの整理である。
  - テストを走らせる手段（vitest、`pnpm test`、lefthook）を変えること - `verification` は `Out` である。
  - `cycles/` の過去の記録を参照すること - オーナーの指示である。
  - 01 と 03 の領域のテストをこのエントリで変えること - それぞれの範囲である。

### Verify

- Always:
  - `pnpm test:related scripts/checks/ja-check.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added: なし

## 3.typecheck の空と不在を 1 本にする

typecheck のテストで、同じ表示になる「一覧が空」と「一覧のファイルが無い」を 1 本にし、ローカルの helper を共有 helper と `checks.fixture.ts` に置き換える。

### Types

```ts
function fakeRoot(): string;
function writeFile(root: string, rel: string, content?: string): string;
function stubTsc(root: string): void;
function writeScopes(root: string, scopes: readonly string[]): void;
```

### Steps

1. `scripts/checks/typecheck.test.ts`
   1. update: ローカルの `fakeRoot`、`stubTsc`、`writeTsconfig`、`writeScopes` を削除し、`fakeRoot` と `writeFile` を `../../test/scripts.fixture.ts` から、`stubTsc` と `writeScopes` を `./checks.fixture.ts` から import する。`chmodSync`、`mkdirSync`、`realpathSync`、`writeFileSync` と `../../test/temp-dir.ts` の `tempDir` の import を外す（`join` は残す）。
   2. update: `writeTsconfig(root, rel)` の 11 か所を `writeFile(root, rel, '{}')` にする。
   3. update: 「scopes.json が JSON でない」の `const dir = join(root, 'scripts', 'checks'); mkdirSync(dir, { recursive: true }); writeFileSync(join(dir, 'scopes.json'), '{not json');` を `writeFile(root, join('scripts', 'checks', 'scopes.json'), '{not json');` にする。
   4. update: 「一覧が空」と「一覧のファイルが無い」を 1 本にし、2 つの入力をループする。

      ```ts
      it('一覧が空、または一覧のファイルが無い → root の行だけを出し、exit 0', () => {
        const scope = '.pi';
        const rootName = 'root';
        for (const form of ['empty', 'missing']) {
          const root = fakeRoot();
          stubTsc(root);
          writeFile(root, 'tsconfig.json', '{}');
          writeFile(root, join(scope, 'tsconfig.json'), '{}');
          if (form === 'empty') writeScopes(root, []);
          const out = run(root);
          expect(out.status).toBe(0);
          expect(out.stdout).toContain(statusLine(rootName, OK));
          expect(out.stdout).not.toContain(scope);
        }
      });
      ```

### Policy

- Allowed:
  - テストの振る舞いを変えない範囲で、テストの本数、前提、断言を整理する。
  - 複数 Unit が使う `fakeRoot` と `writeFile` は 01 の `test/scripts.fixture.ts` を使う。
  - checks だけが使う helper は `scripts/checks/` の側に置く。
  - 基準外のテストを削除する。
  - checks の `stubTsc` は `STUB_FAIL` を見る 1 バージョンにし、typecheck-staged は `STUB_FAIL` を設定しない。
  - 順序・有無の断言のうち、出力の表示内容とフィルタの振る舞いを確認するものは残す。
- Forbidden:
  - `scripts/checks/*.mjs` と `ja-check.json`、`scopes.json` の振る舞いを変えること - このエントリはテストの整理である。
  - テストを走らせる手段（vitest、`pnpm test`、lefthook）を変えること - `verification` は `Out` である。
  - `cycles/` の過去の記録を参照すること - オーナーの指示である。
  - 01 と 03 の領域のテストをこのエントリで変えること - それぞれの範囲である。

### Verify

- Always:
  - `pnpm test:related scripts/checks/typecheck.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added: なし

## 4.typecheck-staged の定数の写しを削る

typecheck-staged のテストで、実装の `CODE_EXTENSIONS` を写した 8 拡張子の列挙をやめ、対象と対象外の 1 組にする。ローカルの helper も共有 helper と `checks.fixture.ts` に置き換える。

### Types

```ts
function fakeRoot(): string;
function writeFile(root: string, rel: string, content?: string): string;
function stubTsc(root: string): void;
function writeScopes(root: string, scopes: readonly string[]): void;
```

### Steps

1. `scripts/checks/typecheck-staged.test.ts`
   1. update: ローカルの `fakeRoot`、`stubTsc`、`writeFile`、`writeScopes` を削除し、`fakeRoot` と `writeFile` を `../../test/scripts.fixture.ts` から、`stubTsc` と `writeScopes` を `./checks.fixture.ts` から import する。`chmodSync`、`mkdirSync`、`realpathSync`、`writeFileSync` と `../../test/temp-dir.ts` の `tempDir` の import を外す（`join` と `STUB_MARK` は残す）。
   2. update: `run` の `spawnSync` に `env: { ...process.env, STUB_FAIL: '' }` を渡す。staged は `STUB_FAIL` を設定せず、外側の環境に `STUB_FAIL` があっても共通の `stubTsc` が落ちないようにする。
   3. update: 「対象は 8 つの拡張子で、md は外れる」を下の fence にし、`codeExtensions()` を削除する。`writeFile(root, 'a.ts')` の第 3 引数は共有の既定 `'x\n'` に任せる。

      ```ts
      it('a.ts は対象で、a.md は対象外', () => {
        const root = fakeRoot();
        stubTsc(root);
        writeFile(root, 'tsconfig.json', '{}');
        const ts = writeFile(root, 'a.ts');
        const tsOut = run(root, [ts]);
        expect(tsOut.status).toBe(0);
        expect(tsOut.stdout).toContain(STUB_MARK);
        const mdRoot = fakeRoot();
        stubTsc(mdRoot);
        const md = writeFile(mdRoot, 'a.md', '# hi\n');
        const mdOut = run(mdRoot, [md]);
        expect(mdOut.status).toBe(0);
        expect(mdOut.stdout).not.toContain(STUB_MARK);
      });
      ```

### Policy

- Allowed:
  - テストの振る舞いを変えない範囲で、テストの本数、前提、断言を整理する。
  - 複数 Unit が使う `fakeRoot` と `writeFile` は 01 の `test/scripts.fixture.ts` を使う。
  - checks だけが使う helper は `scripts/checks/` の側に置く。
  - 基準外のテストを削除する。
  - checks の `stubTsc` は `STUB_FAIL` を見る 1 バージョンにし、typecheck-staged は `STUB_FAIL` を設定しない。
  - 順序・有無の断言のうち、出力の表示内容とフィルタの振る舞いを確認するものは残す。
- Forbidden:
  - `scripts/checks/*.mjs` と `ja-check.json`、`scopes.json` の振る舞いを変えること - このエントリはテストの整理である。
  - テストを走らせる手段（vitest、`pnpm test`、lefthook）を変えること - `verification` は `Out` である。
  - `cycles/` の過去の記録を参照すること - オーナーの指示である。
  - 01 と 03 の領域のテストをこのエントリで変えること - それぞれの範囲である。

### Verify

- Always:
  - `pnpm test:related scripts/checks/typecheck-staged.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added: なし

## 5.先頭コメントを共有 helper に合わせる

3 つの checks のテストファイルの先頭コメントを、残す事実と共有 helper に合わせる。

### Types

なし

### Steps

1. `scripts/checks/ja-check.test.ts`
   1. update: 先頭コメントを次の形にする。

      ```ts
      /**
       * `scripts/checks/ja-check.mjs` の振る舞いを、子プロセスとして実行して試す。
       *
       * fake root は共有の `fakeRoot()`、ファイルと設定は共有の `writeFile` と `writeJson` で作る。
       * WARN_WORD は warn に、ERROR_WORD は error に入る。引用符で囲まれた語だけなら報告しない。
       * exclude に一致するパスは読まずに飛ばす。例外の語に一致するヒットも報告しない。
       */
      ```

2. `scripts/checks/typecheck.test.ts`
   1. update: 先頭コメントを次の形にする。

      ```ts
      /**
       * `scripts/checks/typecheck.mjs` の振る舞いを、子プロセスとして実行して試す。
       *
       * fake root は共有の `fakeRoot()`、tsconfig は共有の `writeFile`、スタブは `checks.fixture.ts` の `stubTsc()` で作る。
       * スタブは渡された `-p` を出して、`STUB_FAIL` に含まれる所だけ exit 1 で落とす。
       * これで、回した所の名前・渡された `-p` のパス・exit を stdout で見る。
       * 表示の行は `test/scripts.fixture.ts` から組み立てる。
       */
      ```

3. `scripts/checks/typecheck-staged.test.ts`
   1. update: 先頭コメントを次の形にする。

      ```ts
      /**
       * `scripts/checks/typecheck-staged.mjs` の振る舞いを、子プロセスとして実行して試す。
       *
       * fake root は共有の `fakeRoot()`、ファイルは共有の `writeFile`、スタブは `checks.fixture.ts` の `stubTsc()` で作る。
       * staged は `STUB_FAIL` を空にして走らせるので、スタブは常に exit 0 である。
       * これで、どの `tsconfig` が使われたかを見る。スタブに渡るのは一時 tsconfig
       * （`.typecheck-staged-*.json`）で、元の `tsconfig.json` と同じ所に置かれる。
       * だから `-p` のパスに `.pi` が入るかで、`.pi` の group か root の group かが分かる。
       * tsc そのものが成功するかは pre-commit の時系列で担保されているので、ここでは見ない。
       * `stub -p` は下のスタブが出す目印で、断言はそこから取る。
       */
      ```

### Policy

- Allowed:
  - テストの振る舞いを変えない範囲で、テストの本数、前提、断言を整理する。
  - 複数 Unit が使う `fakeRoot` と `writeFile` は 01 の `test/scripts.fixture.ts` を使う。
  - checks だけが使う helper は `scripts/checks/` の側に置く。
  - 基準外のテストを削除する。
  - checks の `stubTsc` は `STUB_FAIL` を見る 1 バージョンにし、typecheck-staged は `STUB_FAIL` を設定しない。
  - 順序・有無の断言のうち、出力の表示内容とフィルタの振る舞いを確認するものは残す。
- Forbidden:
  - `scripts/checks/*.mjs` と `ja-check.json`、`scopes.json` の振る舞いを変えること - このエントリはテストの整理である。
  - テストを走らせる手段（vitest、`pnpm test`、lefthook）を変えること - `verification` は `Out` である。
  - `cycles/` の過去の記録を参照すること - オーナーの指示である。
  - 01 と 03 の領域のテストをこのエントリで変えること - それぞれの範囲である。

### Verify

- Always:
  - `pnpm test:related scripts/checks/ja-check.test.ts scripts/checks/typecheck.test.ts scripts/checks/typecheck-staged.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added: なし

## Notes

### Slice 1: checks の fixture に tsc と scopes の helper を置く

- Findings: なし
- Unplanned: なし
- Commit: 8b6d6f8eb2b68b3d38747ce072bb473329b5db67
- Stopped:

### Slice 2: ja-check の重複した確認を統合する

- Findings: なし
- Unplanned: なし
- Commit: 8f5295cf50dc554eed61aef27fbf31e32eecd351
- Stopped:

### Slice 3: typecheck の空と不在を 1 本にする

- Findings: なし
- Unplanned: なし
- Commit: dc90880c1280e59a1f3f351c1f2d35d2f1eac7e0
- Stopped:

### Slice 4: typecheck-staged の定数の写しを削る

- Findings: なし
- Unplanned: なし
- Commit: 4f8af7df0f53d29693795c238fe917c5ae860d05
- Stopped:

### Slice 5: 先頭コメントを共有 helper に合わせる

- Findings: なし
- Unplanned: なし
- Commit: b6645a8d132b7fcafa1504380adccd22599f9cac
- Stopped:

### Cleanup: 重複した helper と定数確認

- Findings: なし
- Unplanned: なし

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
