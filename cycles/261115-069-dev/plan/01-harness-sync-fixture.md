# PLAN `harness-sync-fixture`

- No: 01
- Place: worktree
- Boundary Plans: 02 と 03 がこの plan の後に並列で立つ。

## Goal

harness-sync のテストが、共有 helper を使い、重複した確認と基準外のテストを削った形になる。

## Design

- Inside:
  - Modules: なし。テストファイルの統合・分割はしない。`test/scripts.fixture.ts` に helper を足すだけである。
  - Dirs: なし。ファイルの保存場所は変えない。
- Outside:
  - Extract: `fakeRoot`、`writeFile`、`writeJson` を `test/scripts.fixture.ts` に置く。複数 Unit が使う一時ツリーの helper で、`test/temp-dir.ts` の `tempDir` を使う。02 と 03 も使う。
  - Colocate: `run`、`pair`、`writeList`、`snapTree`、`errorLines` は harness-sync のテストの側に残す。harness-sync だけが使う。`display` と `path` は共有 helper を使わない。

## Files

```text
scripts/
  harness-sync/
    collect/
      index.mjs
      index.test.ts        update
    diff/
      index.mjs
      index.test.ts        update
    display/
      index.mjs
      index.test.ts
    list/
      index.mjs
      index.test.ts        update
    path/
      index.mjs
      index.test.ts        update
    index.mjs
    index.test.ts          update
    setting.json
test/
  scripts.fixture.ts       update
  temp-dir.ts
```

## Slices

## 1.共有 fixture に一時ツリーの helper を置く

`test/scripts.fixture.ts` に、複数 Unit が使う一時ツリーの helper を足す。

### Types

```ts
export function fakeRoot(): string;
export function writeFile(root: string, rel: string, content = 'x\n'): string;
export function writeJson(root: string, rel: string, data: unknown): void;
```

### Steps

1. `test/scripts.fixture.ts`
   1. update: `node:fs` の `mkdirSync`、`realpathSync`、`writeFileSync`、`node:path` の `dirname`、`join`、`./temp-dir.ts` の `tempDir` を import する。
   2. add: `fakeRoot` を足す。

      ```ts
      export function fakeRoot(): string {
        return realpathSync(tempDir());
      }
      ```

   3. add: `writeFile` を足す。

      ```ts
      export function writeFile(root: string, rel: string, content = 'x\n'): string {
        const file = join(root, rel);
        mkdirSync(dirname(file), { recursive: true });
        writeFileSync(file, content);
        return file;
      }
      ```

   4. add: `writeJson` を足す。

      ```ts
      export function writeJson(root: string, rel: string, data: unknown): void {
        writeFile(root, rel, `${JSON.stringify(data, null, 2)}\n`);
      }
      ```

   5. update: 先頭コメントを次の形にする。

      ```ts
      /**
       * `scripts/` のテストが使う表示の印と旗、一時ツリーの helper。
       *
       * 何をする物か
       * - 表示行の印（`ok`、`failed`）と区画の名（`copy`、`missing`、`same`）と旗（`--run`、`--only`）を 1 か所に集める。
       * - 一時ツリーのルートと、その下への書き込み（`fakeRoot`、`writeFile`、`writeJson`）を 1 か所に集める。
       * - 断言はここから取り、`'root: ok'` のような行を各所に書かない。パスと名と件数はテストが渡した値から取る。
       *
       * どう使うか
       * - `statusLine(name, OK)` で `root: ok` の形、`countLine(COPY, n)` で `copy (n):` の形、`indented(rel)` で `  <rel>` の形を作る。
       * - `RUN_FLAG` と `ONLY_FLAG`（と `onlyEquals`）で引数を組み立てる。`INVALID_LIST_LINE` で一覧の壊れの理由を見る。
       * - `fakeRoot()` で一時ディレクトリの実体をルートにし、`writeFile(root, rel, content)` と `writeJson(root, rel, data)` でその下に書く。
       *
       * 何をしないか
       * - 書き込むのはテストが渡されたルートの下だけ。プロセスは開かない。テストの外で読まれても、待ち続けずに返る。
       */
      ```

### Policy

- Allowed:
  - テストの振る舞いを変えない範囲で、テストの本数、前提、断言を整理する。
  - 複数 Unit が使う helper を `test/scripts.fixture.ts` に置く。
  - 基準外のテストを削除する。
  - `pair()` のように harness-sync だけが使う helper を harness-sync の側に残す。
- Forbidden:
  - `scripts/harness-sync/index.mjs` の振る舞いを変えること - このエントリはテストの整理であり、製品の変更ではない。
  - テストを走らせる手段（vitest、`pnpm test`、lefthook）を変えること - `verification` は `Out` である。
  - `cycles/` の過去の記録を参照すること - オーナーの指示である。
  - 02 と 03 の領域（checks、product-ready）のテストをこのエントリで変えること - それぞれのエントリの範囲である。

### Verify

- Always:
  - `pnpm test:related test/scripts.fixture.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added: なし

## 2.harness-sync のテストが共有 helper を使う

harness-sync のテストが、ローカルの helper をやめ、共有の `fakeRoot`、`writeFile`、`writeJson` を使う。

### Types

```ts
function pair(
  copy: readonly string[] = ['.pi'],
  push: readonly string[] = ['.pi'],
): { origin: string; local: string };
function writeList(
  root: string,
  starter: string,
  copy?: readonly string[],
  push?: readonly string[],
): void;
```

### Steps

1. `scripts/harness-sync/collect/index.test.ts`
   1. update: ローカルの `writeFile` を削除し、`../../../test/scripts.fixture.ts` から `fakeRoot` と `writeFile` を import する。`../../../test/temp-dir.ts` の `tempDir` を `fakeRoot` に置き換える。
   2. update: `tempDir()` の 6 か所を `fakeRoot()` にする。
   3. update: `writeFile(join(root, <dir>, <name>), <content>)` の 7 か所を `writeFile(root, '<dir>/<name>', <content>)` にする。`dirname` と `writeFileSync` の import を外す（`mkdirSync` は「一致 0 件の glob」で使うので残す）。
   4. update: 先頭コメントの「fake root を `tempDir()` で作り、ファイルを置いてから `collect` で集める。」を「fake root を `fakeRoot()` で作り、ファイルを共有の `writeFile` で置いてから `collect` で集める。」に直す。
2. `scripts/harness-sync/diff/index.test.ts`
   1. update: ローカルの `writeFile` を削除し、`../../../test/scripts.fixture.ts` から `fakeRoot` と `writeFile` を import する。`../../../test/temp-dir.ts` の `tempDir` を `fakeRoot` に置き換える。
   2. update: `tempDir()` の 4 か所を `fakeRoot()` にする。
   3. update: `writeFile(join(<root>, rel), <content>)` の 4 か所を `writeFile(<root>, rel, <content>)` にする。使わなくなる `node:fs` と `node:path` の import を外す。
   4. update: 先頭コメントの「fake の 2 つのツリーを作り」を「共有 `fakeRoot` で 2 つのツリーを作り」に直す。
3. `scripts/harness-sync/list/index.test.ts`
   1. update: ローカルの `writeFile` と `writeJson` を削除し、`../../../test/scripts.fixture.ts` から `fakeRoot` と `writeJson` を import する。`../../../test/temp-dir.ts` の `tempDir` を `fakeRoot` に置き換える。
   2. update: `tempDir()` の 5 か所を `fakeRoot()` にする。
   3. update: `writeJson(<abs>, <data>)` の 4 か所を `writeJson(root, 'scripts/harness-sync/setting.json', <data>)` にする。`join` で組み立てる 2 か所と、`file` を渡す 2 か所である。期待値に使う `file` と `missing` の宣言は残す。`mkdirSync` と `writeFileSync` の import を外す（`join` は残す）。
   4. update: 先頭コメントの「fake root を `tempDir()` で作り、パスを作ってから読む。」を「fake root を `fakeRoot()` で作り、共有の `writeJson` でパスを作ってから読む。」に直す。
4. `scripts/harness-sync/index.test.ts`
   1. update: ローカルの `fakeRoot`、`writeFile`、`writeJson` を削除し、`../../test/scripts.fixture.ts` の import に `fakeRoot`、`writeFile`、`writeJson` を足す。`realpathSync`、`writeFileSync`、`dirname`、`../../test/temp-dir.ts` の `tempDir` の import を外す（`mkdirSync` は「両側のパスが空」で使うので残す）。
   2. update: `writeFile(join(<root>, '.pi', <name>), <content>)` の 15 か所を `writeFile(<root>, '.pi/<name>', <content>)` にする。
   3. update: `writeJson(join(<root>, 'scripts', 'harness-sync', 'setting.json'), <data>)` の 2 か所を `writeJson(<root>, 'scripts/harness-sync/setting.json', <data>)` にする。1 か所は `writeList` の中である。
   4. update: `pair()` を次の形にする。

      ```ts
      /** 元と先の 2 つを作り、先に一覧と相手のパスを置く */
      function pair(
        copy: readonly string[] = ['.pi'],
        push: readonly string[] = ['.pi'],
      ): { readonly origin: string; readonly local: string } {
        const origin = fakeRoot();
        const local = fakeRoot();
        writeList(local, origin, copy, push);
        return { origin, local };
      }
      ```

   5. update: 既定と同じ `['.pi']` を渡している「両側のパスが空」の 1 か所を `const { origin, local } = pair();` にする。
   6. update: 既定でない `copy` と `push` を渡す 5 か所を、次の形にする。`rel` と `rels` の宣言は `pair` の前へ移す。

      ```text
      「元に無いパス」         const { local } = pair([rel], [rel]);
      「pull は copy を読み」  const { origin, local } = pair(['.pi/a.ts'], ['.pi/b.ts']);
                              const { local: pushLocal } = pair(['.pi/a.ts'], ['.pi/b.ts']);
      「pull --run」           const { origin, local } = pair(rels, rels);
      「push --run」           const { origin, local } = pair(['.pi/a.ts'], ['.pi/a.ts', '.pi/extra.ts']);
      ```

   7. update: 先頭コメントの「fake の 2 つのツリー（元と先）を `tempDir()` で作り」を「fake の 2 つのツリー（元と先）を `fakeRoot()` で作り」に直す。

### Policy

- Allowed:
  - テストの振る舞いを変えない範囲で、テストの本数、前提、断言を整理する。
  - 複数 Unit が使う helper を `test/scripts.fixture.ts` に置く。
  - 基準外のテストを削除する。
  - `pair()` のように harness-sync だけが使う helper を harness-sync の側に残す。
- Forbidden:
  - `scripts/harness-sync/index.mjs` の振る舞いを変えること - このエントリはテストの整理であり、製品の変更ではない。
  - テストを走らせる手段（vitest、`pnpm test`、lefthook）を変えること - `verification` は `Out` である。
  - `cycles/` の過去の記録を参照すること - オーナーの指示である。
  - 02 と 03 の領域（checks、product-ready）のテストをこのエントリで変えること - それぞれのエントリの範囲である。

### Verify

- Always:
  - `pnpm test:related scripts/harness-sync/collect/index.test.ts scripts/harness-sync/diff/index.test.ts scripts/harness-sync/list/index.test.ts scripts/harness-sync/index.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added: なし

## 3.重複した確認と基準外のテストを削る

同じ事実を重ねて確認している箇所と、既に存在しないものを確認しているテストを削る。`collect` の `missing: []` と `paths: []`、`display` の行順は、単体の確認として残す。

### Types

なし

### Steps

1. `scripts/harness-sync/list/index.test.ts`
   1. drop: 1 本目の `it('skip と legacy があっても返さない')` を丸ごと削除する。
2. `scripts/harness-sync/path/index.test.ts`
   1. drop: `it('指されたパスがない → 1 行のエラーで投げる')` の最後の 1 行 `expect(() => resolveStarter(local, missing)).toThrow();` を削除する。同じテストの `try` の中の `resolveStarter(local, missing)` と、`message` の 2 つの確認は残す。

### Policy

- Allowed:
  - テストの振る舞いを変えない範囲で、テストの本数、前提、断言を整理する。
  - 複数 Unit が使う helper を `test/scripts.fixture.ts` に置く。
  - 基準外のテストを削除する。
  - `pair()` のように harness-sync だけが使う helper を harness-sync の側に残す。
- Forbidden:
  - `scripts/harness-sync/index.mjs` の振る舞いを変えること - このエントリはテストの整理であり、製品の変更ではない。
  - テストを走らせる手段（vitest、`pnpm test`、lefthook）を変えること - `verification` は `Out` である。
  - `cycles/` の過去の記録を参照すること - オーナーの指示である。
  - 02 と 03 の領域（checks、product-ready）のテストをこのエントリで変えること - それぞれのエントリの範囲である。

### Verify

- Always:
  - `pnpm test:related scripts/harness-sync/list/index.test.ts scripts/harness-sync/path/index.test.ts scripts/harness-sync/collect/index.test.ts scripts/harness-sync/display/index.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added: なし

## Notes

### Slice 1: 共有 fixture に一時ツリーの helper を置く

- Findings: なし
- Unplanned: なし
- Commit: ae7258b9b1b5881aaae9f2e135178771450e6c70
- Stopped:

### Slice 2: harness-sync のテストが共有 helper を使う

- Findings: なし
- Unplanned: なし
- Commit: a83cb66f89599e3b2c9f47978c53090c89df2c40
- Stopped:

### Slice 3: 重複した確認と基準外のテストを削る

- Findings: なし
- Unplanned: なし
- Commit: 1ec3a42e18f6cf8b46a1ebce82522c0cc355edc0
- Stopped:

### Cleanup: 重複した helper と基準外のテスト

- Findings: なし
- Unplanned:
  - `scripts/harness-sync/collect/index.test.ts` の「一覧の項目がコピー元にだけある」: 書き込む前提を直書きの `'.pi/a.ts'` から手元の `rel` に変えた（既定の中身 `'x\n'` は変わらない）。断言の値と前提がずれると気づけないため、その場で直した。
  - `scripts/harness-sync/collect/index.test.ts` の「同じパスが 2 つの項目から出る」: `rel` を置き、書き込みと一覧と断言をそこから作るようにした。理由は同じ。
  - `scripts/harness-sync/index.test.ts` の「中身違いの同じパス」: 両側への書き込みを直書きの `'.pi/a.ts'` から手元の `rel` に変えた。理由は同じ。

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
