# PLAN `ex-harness-structure`

## Files

```text
vitest.config.ts                update
scripts/
  harness/
    index.mjs                   update
    index.test.ts               update
    harness.json                update
    config.test.ts              update
    list.mjs                    drop
    list.test.ts                drop
    list/
      index.mjs                 add
      index.test.ts             add
    path/
      index.mjs                 add
      index.test.ts             add
    collect/
      index.mjs                 add
      index.test.ts             add
    diff/
      index.mjs                 add
      index.test.ts             add
    display/
      index.mjs                 add
      index.test.ts             add
```

## Slices

## 1.モジュールへの分割と、純粋と副作用の分離

### Types

```ts
/** どちらへ運ぶか */
type Direction = 'pull' | 'push';

/** 引数(純) */
type Args = {
  readonly direction: Direction;
  readonly run: boolean;
};

/** `scripts/harness/harness.json` の形 */
type HarnessList = {
  readonly starter: string;
  readonly copy: readonly string[];
  readonly push: readonly string[];
};

/** 相手が自分か他かと、解決した絶対のパス */
type Starter = {
  readonly kind: 'self' | 'other';
  readonly path: string;
};

/** 一覧の項目を 1 つのルートで展開した結果 */
type Resolved = {
  readonly paths: readonly string[];
  readonly missing: readonly string[];
};

/** コピー元からコピー先へ写す物と、コピー元で見つからなかった項目 */
type Diff = {
  readonly copy: readonly string[];
  readonly missing: readonly string[];
};

/** 相手のパスを、`~` と相対を解決する(純) */
function resolvePath(root: string, starter: string): string;

/** 相手のパスを決め、存在を確認する(境界) */
function resolveStarter(root: string, starter: string): Starter;

/** 一覧を読む */
function readList(root: string): HarnessList;

/** テストの除外の glob を作る(純) */
function harnessExcludes(list: HarnessList): readonly string[];

/** 一覧の項目を 1 つのルートで展開する(境界) */
function collect(sideRoot: string, patterns: readonly string[]): Resolved;

/** glob の一致から、重複を除いた `/` 区切りの相対パスを作る(純) */
function toPaths(sideRoot: string, matches: readonly string[]): readonly string[];

/** 両側の同じパスの中身を比べる(境界) */
function sameFile(fromRoot: string, toRoot: string, rel: string): boolean;

/** 写す物を作る(純)。`isSame` が中身の比較 */
function diffPaths(
  fromPaths: readonly string[],
  toPaths: readonly string[],
  isSame: (rel: string) => boolean,
): readonly string[];

/** 表示の行を作る(純) */
function formatLines(
  direction: Direction,
  starter: string,
  root: string,
  diff: Diff,
): readonly string[];
```

### Steps

1. `scripts/harness/path/index.mjs`:
   - `resolvePath(root, starter)` を作り、`~` と相対を解決して絶対パスを返すだけにする(`fs` を呼ばない)。
   - `resolveStarter(root, starter)` を作り、`resolvePath` を呼び、`fs.existsSync` で存在を確認し、`self` か `other` を返し、なければ 1 行で投げる。
   - `Starter` の typedef をここに置く。
2. `scripts/harness/path/index.test.ts`:
   - (happy) `~` で始まる `starter` → `HOME` の下のパスになる
   - (happy) 相対の `starter` → `ルート` からの絶対パスになる
   - (happy) 絶対の `starter` → そのパスになる
   - (happy) 指されたパスが `ルート` と同じ → `self` を返す
   - (happy) 指されたパスが `ルート` と違う → `other` を返す
   - (error) 指されたパスがない → 1 行のエラーで投げる
3. `scripts/harness/collect/index.mjs`:
   - 項目ごとに `fs.globSync` を 1 回だけ呼び、`[項目, 項目/**/*]` の配列を渡し、`withFileTypes: true` で返る `Dirent` から `isFile()` の物だけを名前として採る。
   - 0 件の項目は `missing` に入れる。
   - `toPaths(sideRoot, matches)` を作り、`isExcluded` による絞り込み、`/` 区切りの相対パスへの変換、重複の除去、辞書順を 1 か所で行う。
   - `Resolved` の typedef をここに置く。
   - Outside: `fs.globSync`。`cwd` に対象のルート、`exclude` に `**/node_modules/**` と `**/.git/**`、`followSymlinks` は既定のまま。
4. `scripts/harness/collect/index.test.ts`:
   - (happy) 一覧の項目がコピー元にだけある → `paths` にそのパスが入る
   - (empty) 一覧の項目が両側にない → `paths` が空で、`missing` にその項目が入る
   - (empty) 一致 0 件の glob → `missing` にその項目が入る
   - (happy) `node_modules` と `.git` の中のファイル → `paths` に入らない
   - (happy) ディレクトリの項目 → その下のファイルが `paths` に入る
   - (happy) 同じパスが 2 つの項目から出る → `paths` で 1 つになる
5. `scripts/harness/diff/index.mjs`:
   - `sameFile(fromRoot, toRoot, rel)` を作り、2 つのファイルを読んで中身が同じかを返す。
   - `diffPaths(fromPaths, toPaths, isSame)` を作り、`toPaths` にないパスと、`isSame` が false のパスを `copy` として返す。
   - `Diff` の typedef をここに置く。
6. `scripts/harness/diff/index.test.ts`:
   - (happy) コピー元にだけある → `copy` に入る
   - (happy) 両側にあって中身が違う → `copy` に入る
   - (empty) 両側にあって中身が同じ → `copy` に入らない
   - (empty) コピー先にだけある → `copy` に入らない
7. `scripts/harness/display/index.mjs`:
   - `formatLines(direction, starter, root, diff)` を移す(純)。`missing` のセクションを見出しの次に置く。
8. `scripts/harness/display/index.test.ts`:
   - (happy) `missing` と `copy` がある → 見出し、`missing (n):`、`copy (n):` の順に出る
   - (empty) `missing` も `copy` も空 → `no files missing` と `no files to copy` が出る
   - (happy) `push` → `push:` の見出しになる
9. `scripts/harness/list/index.mjs`:
   - `list.mjs` の `readList` と `harnessExcludes` を移す(中身は変えない)。
   - `HarnessList` の typedef をここに置く。
10. `scripts/harness/list/index.test.ts`:
    - `list.test.ts` を移す(テスト名と中身は変えない)。
11. `scripts/harness/list.mjs` と `scripts/harness/list.test.ts`:
    - 消す。
12. `scripts/harness/index.mjs`:
    - `parseArgs`、`main`、`applyTo` だけを残し、`path/index.mjs`、`collect/index.mjs`、`diff/index.mjs`、`display/index.mjs` を読む。
    - `Direction`、`Args`、`Starter`、`Resolved`、`Diff` の typedef を、持ち主のモジュールへ移し、ここからは消す。
    - `main` は、`resolveStarter`、`collect` で `fromSide` と `toSide` を作り、`missing` を `fromSide.missing` から、`copy` を `diffPaths(fromSide.paths, toSide.paths, (rel) => sameFile(fromRoot, toRoot, rel))` から取り、`formatLines` と `applyTo` を順に呼ぶ。
13. `scripts/harness/index.test.ts`:
    - 新しいモジュールへ移したケースを消し、`main` の通しのケース(`copy`、`missing`、終了コード、3 種のエラー、`same`、`--run`)だけを残す。
14. `vitest.config.ts`:
    - 4 行目の輸入元を `./scripts/harness/list/index.mjs` に直す。
15. `scripts/harness/config.test.ts`:
    - 輸入元を `./list/index.mjs` に直す。
16. `scripts/harness/harness.json`:
    - `copy` と `push` の `scripts/harness/*.mjs` と `scripts/harness/*.test.ts` の 2 項目を、`scripts/harness/*.mjs`、`scripts/harness/*.test.ts`、`scripts/harness/*/*.mjs`、`scripts/harness/*/*.test.ts` の 4 項目にする(`*` は `/` をまたがないため)。

### Verify

- Always:
  - 関連テスト (`pnpm test:related scripts/harness vitest.config.ts`。関連がなければ `pnpm test:run`)
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `scripts/harness` の `.mjs` と `.test.ts` を、大小文字を問わず `grep` して、`diffSides` と `readStarter` が残っていないことを確かめる
- Added:
  - other — `grep -A30 "function diffPaths" scripts/harness/diff/index.mjs`、`grep -A20 "function toPaths" scripts/harness/collect/index.mjs`、`grep -A12 "function resolvePath" scripts/harness/path/index.mjs` を走らせ、`fs` が出ないことを確かめる
  - other — `mktemp -d` で作ったツリーに `scripts/harness/harness.json`(`starter` と `copy` に `**` を持つ)と、`node_modules/a.js`、`.git/b.js` を置き、そのツリーで `node scripts/harness/index.mjs pull` を走らせ、`a.js` と `b.js` が `copy` と `missing` のどちらにも出ないことを確かめる

## Notes

### Slice 1: モジュールへの分割と、純粋と副作用の分離

- Findings:
- Unplanned:
- Commit:
- Stopped:

## Work Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Unproven:
- Noise:
- Doubts:

## Acceptance

- Ran:
- Findings:
- Doubts:
