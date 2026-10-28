# PLAN `product-ready-replace`

- No: 05

## Files

```text
scripts/
  product-ready/
    targets.mjs           update
    targets.test.ts       update
    index.mjs             update
    index.test.ts         update
    cli.mjs               update
    cli.test.ts           update
rules/
  readme.format.md        add
  roadmap.md
  definition.format.md
README.md                 update
README.ja.md              update
package.json
vitest.starter.config.ts
test/
  scripts.fixture.ts
  temp-dir.ts
scripts/
  harness/
    harness.json
    config.test.ts
.pi/
  skills/
    adr/
      scripts/
        scaffold.mjs
```

## Slices

## 1.replace-and-docs

### Types

```ts
type Part =
  | { readonly kind: 'whole' }
  | { readonly kind: 'sections'; readonly headings: readonly string[] };

type Skeleton = {
  readonly file: string;
  readonly heading: string;
  readonly part: Part;
};

type RemoveTarget = {
  readonly action: 'remove';
  readonly label: string;
  readonly at: string;
  readonly pick: 'dirs' | 'files';
};

type ReplaceTarget = {
  readonly action: 'replace';
  readonly label: string;
  readonly at: string;
};

type FoundEntry = (RemoveTarget | ReplaceTarget) & {
  readonly path: string;
};

type Label = {
  readonly label: string;
  readonly verb: 'remove' | 'replace';
};

function skeleton(file: string, heading: string, part: Part): Skeleton;
function skeletonFor(at: string): Skeleton;
function plan(root: string, only?: string): readonly FoundEntry[];
function labels(only?: string): readonly Label[];
function planLines(labels: readonly Label[], plan: readonly FoundEntry[]): readonly string[];
function remove(entries: readonly (RemoveTarget & { readonly path: string })[]): readonly string[];
function main(argv: readonly string[]): number;
```

- 表の行が持つのは `action` と `label` と `at` だけとし、雛形の出所は `SKELETONS` の別の表が持つ。
- `skeleton` は `file` か `heading` が空文字ならエラーを投げる。
- `skeletonFor` は `REPLACE_TARGETS` に無い `at` を受けたらエラーを投げる。
- `part.kind` の `switch` は `whole` と `sections` の 2 つを扱い尽くし、`default` を書かない。

### Steps

1. `scripts/product-ready/targets.mjs`:
   - `STARTER_ONLY` を `REMOVE_TARGETS: readonly RemoveTarget[]` と `REPLACE_TARGETS: readonly ReplaceTarget[]` の 2 つに分け、`SKELETONS` は `at` から `Skeleton` を引く別の表として置く。
     - 消す側は現在の `cycles` の 1 行をそのまま置く。
     - 差し替える側は `ROADMAP.md`、`DEFINITION.md`、`README.md`、`README.ja.md` の 4 行を置く。
     - 雛形は 4 つとも `rules/` から読み、`ROADMAP.md` は `rules/roadmap.md` の `Skeleton` で `kind: 'whole'` とし、`DEFINITION.md` は `rules/definition.format.md` の `Shape` で `kind: 'sections'` と `headings: ['## Product', '### What']` とし、`README.md` は `rules/readme.format.md` の `Skeleton` で `kind: 'whole'` とし、`README.ja.md` は同じファイルの `Skeleton (ja)` で `kind: 'whole'` とする。
   - `plan` が `FoundEntry` の配列を `at` の昇順で返し、対象のファイルが無い差し替える行は返さない、という現在の形を残す。
   - `labels` は `Label[]` を返す形にし、`LABELS` を `[{ label: 'cycles', verb: 'remove' }, { label: 'replace', verb: 'replace' }]` にする。
   - `remove` は `action: 'remove'` の行だけを受ける形にし、呼び出し側が `plan` が返す差し替える行を渡してはならないことを JSDoc に書く。
   - `4`、`8`、`47` 行目の JSDoc の「消す物を集める」「消す物を消す」を、消す物と差し替える物の両方を示す説明に直す。
2. `scripts/product-ready/targets.test.ts`:
   - 既存の 10 ケースの期待値を、`FoundEntry` が `action` を持つ形に直す。
   - (happy) `ROADMAP.md` と `rules/roadmap.md` がある → `action: 'replace'` の 1 行が返り、`skeletonFor('ROADMAP.md')` が `rules/roadmap.md` の `Skeleton` を返す
   - (happy) `DEFINITION.md` と `rules/definition.format.md` がある → `sections` の `headings` が `['## Product', '### What']` である
   - (happy) `labels(undefined)` → `[{ label: 'cycles', verb: 'remove' }, { label: 'replace', verb: 'replace' }]`
   - (happy) `plan(root, 'replace')` → 差し替える行だけを返す
   - (empty) `ROADMAP.md` が無い → 差し替える行を返さない
   - (error) `ROADMAP.md` はあるが `rules/roadmap.md` が無い → `skeletonFor` が雛形の出所のパスを含めたエラーを投げる
3. `scripts/product-ready/cli.mjs`:
   - `planLines` の第 1 引数を `Label[]` にし、並びが空の場合の行を `no <label> to <verb>` にする。
   - `61` から `66` 行目の JSDoc は、`Label` を受ける形に直す。
4. `scripts/product-ready/cli.test.ts`:
   - 既存の `planLines` の 5 ケースの第 1 引数を、`Label` の並びに直す。
5. `scripts/product-ready/index.mjs`:
   - `--run` のときに、`action: 'replace'` の行を `skeletonFor` が返す雛形で置き換える。
     - `part.kind` が `whole` ならファイル全体を雛形のブロックで書き換える。
     - `part.kind` が `sections` なら、対象のファイルの各見出しの範囲の本文だけを、雛形のブロックの同じ見出しの本文で書き換える。
     - 雛形のブロックに見出しが無いときは、何も書かずに 1 行のエラーを出して exit 1 で終わる。
   - `11` 行目の JSDoc の「cycles を消し」を、消す物と差し替える物の両方を示す説明に直す。
6. `scripts/product-ready/index.test.ts`:
   - 既存の 11 ケースでは、ツリーに `rules/` の雛形 3 枚を書く形に直す。
   - (happy) `--run` で `ROADMAP.md` が `rules/roadmap.md` の雛形に置き換わる
   - (happy) `--run` で `DEFINITION.md` の `Product` と `What` の本文だけが置き換わり、`Users can do` と `Stack` がそのまま残る
   - (happy) `--run` で `README.md` と `README.ja.md` がそれぞれの雛形に置き換わる
   - (empty) 差し替える対象が 1 つも無い → 何も書かずに exit 0 で終わる
   - (error) `ROADMAP.md` はあるが `rules/roadmap.md` が無い → 1 行のエラーで exit 1、ツリーは変わらない
   - (error) 雛形のブロックに `## Product` の見出しが無い → 1 行のエラーで exit 1、ツリーは変わらない
7. `rules/readme.format.md`:
   - `## Skeleton` の見出しの下の `md` のフェンス付きブロックに `README.md` の雛形を書き、`README.md:7-56` の英語の 5 つの見出しを残して各セクションの中身を書く欄にする。
   - `## Skeleton (ja)` の見出しの下の `md` のフェンス付きブロックに `README.ja.md` の雛形を書き、「入っているもの」「使い始める」「検査」「ハーネス」「サイクル」の 5 つの見出しを残して各セクションの中身を書く欄にする。
8. `README.md`:
   - `29` 行目の `product:ready` のセクションに、`ROADMAP.md`、`DEFINITION.md` の `Product` と `What`、2 枚の README を雛形に差し替えることを書く。
9. `README.ja.md`:
   - `29` 行目の 3 つの動きを、差し替える対象 4 つを含む列挙に直す。

### Verify

- Always:
  - この slice に関係するテスト（この slice が書くものも含む）を `pnpm test:related <変えたファイル>` で走らせ、関係するものが無ければ `pnpm test:run` を走らせる。
  - `pnpm typecheck` を走らせる。
  - `pnpm lint` を走らせる。
  - `pnpm format:check` を走らせる。
  - `STARTER_ONLY`、`skeleton: {`、`no replace to remove` を、大文字小文字を無視した `grep` でリポジトリ全体（`cycles/` と `node_modules/` を除く）から探し、ヒットが 0 件であること。
- Added: base — オーナーがこの slice の変更を読み、OK を返す。

## Notes

### Slice 1: replace-and-docs

- Findings:
- Unplanned:
- Commit:
- Stopped:

## Review

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
