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

- Findings: なし
- Unplanned:
  - `Args` の typedef を `index.mjs` に残した（持ち主が `parseArgs` と `main` のある `index` 自身のため。`Direction` は `display/index.mjs` に移した）
  - `collect` は `Dirent` 0件を `missing` とし、空ディレクトリ自身の `Dirent` ありでファイル0件は `missing` にしない（旧 `collect` の空 `.pi` で `missing` なし・exit 0を保つため）
- Commit: 4b3becb consult(ex-harness-structure): split harness into pure and side-effect modules
- Stopped: なし

### Cleanup: テストの重複・消滅分岐の点検（落とすものなし）

対象の7件（`index.test.ts` 10件、`config.test.ts` 3件、`list/index.test.ts` 7件、`path/index.test.ts` 6件、`collect/index.test.ts` 6件、`diff/index.test.ts` 4件、`display/index.test.ts` 3件、計39件）を全読みして点検した。近い組（`collect` の欠落ファイルと欠落glob、`diff` の純粋2件と実ファイル2件、`display` の空と `index` の空、`path` の `self` と `index` の `same`）はいずれも単体と通しの段違いか入力種違いで、計画の Steps が両方を求めているため残した。消えた振る舞い（旧 `statSync`・権限・二重glob分岐、旧 `./list.mjs` 輸入、`index` からの `resolveStarter` 再公開）の検査は残っていないことを検索で確かめた。計画に `## Test cases` 節がないため4つ目の観点は該当なし。各検査は Steps の箇条と1対1に対応し、落とすものはない。

- Findings: なし
- Unplanned: なし

## Work Review

### Round 1

- Stale: なし — scripts/harness内を大小文字を問わずgrepし、diffSidesとreadStarterが残っていないこと、vitest.config.ts:4とscripts/harness/config.test.ts:6の輸入元が./list/index.mjsに更新済みであることを確かめた
- Unlisted: なし — git diff 5ce98ea..HEAD --statの15件が## Filesの木と一致し、計画外のファイル変更はない
- Gaps: なし — Stepsの各ケース(path 6、collect 6、diff 4、display 3、list移動、main通し)に対応する検査がある。harness.jsonの新パターンの実効保証の薄さは重複を避けてUnprovenで扱う
- Unproven: scripts/harness/config.test.ts:12の保証が薄い — 期待値の末尾を実一覧(readListのcopy/push)から組み立てるため、scripts/harness/harness.json:21のscripts/harness/_/_.mjsなど4項目が欠けても緑のままになる。Steps 16の振る舞い(*は/をまたがないためのサブ目録)を壊しても検出しない
  - fixed: scripts/harness/config.test.tsに「実一覧に harness の下層 glob がある」を追加し、copyとpushが4項目を含むことを確かめるようにした
- Noise: scripts/harness/index.test.ts:222にマジックナンバー — countLine(COPY, 2)の2が入力の['.pi/a.ts', '.pi/extra.ts']から導かれていない。同ファイル内の他の保証が[rel].lengthの形で組み立てているのと不整合で、format.mdの## Test casesに反する
  - fixed: 入力をrels配列に切り出し、countLine(COPY, rels.length)に直した
  - scripts/harness/display/index.test.ts:26にマジックナンバー — countLine(MISSING, 1)と同28行のcountLine(COPY, 1)の1が入力の{ copy: [rel], missing: [missing] }から導かれていない。含める項目数から組み立てるべきところ固定値になっている
    - fixed: countLine(MISSING, [missing].length)とcountLine(COPY, [rel].length)に直した
- Doubts: なし — 以下は所見だが計上しない。scripts/harness/diff/index.mjs:17のsameFileのcatch→false経路に単独検査がないが、収集後の削除など到達困難な競合のみのため(旧振る舞い継承)。scripts/harness/collect/index.mjs:36のtoPathsに直の検査がないが、collectの6件経由で除外・変換・重複除去・辞書順が運動するため。scripts/harness/index.mjs:16のArgs残存はNotesのUnplannedで記録済みの決定事項のため

### Round 2

- Stale: なし — fixed 指定なしのため対象外
- Unlisted: なし — fixed 指定なしのため対象外
- Gaps: なし — fixed 指定なしのため対象外
- Unproven:
  - なし — fixed 1件を確認。`scripts/harness/config.test.ts:25-36` が実一覧（`readList(root)`）の `copy` と `push` に `scripts/harness/*.mjs`、`scripts/harness/*.test.ts`、`scripts/harness/*/*.mjs`、`scripts/harness/*/*.test.ts` の4件を含むことを `toContain` で確かめるため、`scripts/harness/harness.json:19-22`（`copy`）や `:27-30`（`push`）のいずれかが欠ければ赤になる。Round 1 の指摘（期待値を実一覧から組み立てるため欠落を見逃す）は閉じている
- Noise:
  - なし — fixed 2件を確認。`scripts/harness/index.test.ts:216,223` が入力を `rels` 配列に切り出し `countLine(COPY, rels.length)` で件数を導くため、`2` の直書きは残っていない。`scripts/harness/display/index.test.ts:23-24,26,28` が `countLine(MISSING, [missing].length)` と `countLine(COPY, [rel].length)` で件数を導くため、`1` の直書きは残っていない。同ディレクトリの `grep countLine` でも残る件数はすべて `.length` 導出である
- Doubts: なし

## Acceptance

- Ran: `pnpm test:run` (62 files / 791 tests)、`pnpm typecheck` (root と .pi が ok)、`pnpm lint`、`pnpm format:check`、`scripts/harness` の `grep` (`道`、`diffSides`、`readStarter` が 0 件)、純粋な 3 関数の中の `fs` の `grep` (0 件)、`mktemp -d` のツリーの `node_modules/a.js` を元に置いた `pull` (`copy` に出ない)、赤の確かめ 3 件 (`toPaths` から `isExcluded` を外すと `collect` の 1 件が赤、0 件の `missing` を外すと 3 件が赤、`diffPaths` から `isSame` を外すと 4 件が赤。いずれも戻した)
- Findings: なし
- Doubts: `Added` の `.git/b.js` の側は、この環境の権限が `**/.git/**` への書き込みを拒むため、私は書捨てのツリーに作れなかった。サブエージェントは作って確かめており、単体テスト (`collect` の `node_modules` と `.git`) も両方を被っている
