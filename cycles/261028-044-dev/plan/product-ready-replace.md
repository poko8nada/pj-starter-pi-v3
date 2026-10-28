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

- Findings: なし
- Unplanned: `rules/roadmap.md` と `rules/definition.format.md` は `Files` では追随者だったが、中身を変えた。オーナーの指示で `R1`（表の区切り行）、`R2`（製品ファイルへの規則の混入）、`R3`（`cycles` の説明の配置）、`D2`（ロードマップの文の配置）、`M1`（「中身のないセクションは省く」の規則）を直し、`## Skeleton` を ready の姿に書き換えたためである。雛形の見出しも `## Shape` から `## Skeleton` に揃えた。
- Unplanned: `scripts/product-ready/index.mjs` の `main` が 81 行になり `max-lines-per-function` に当たったため、flag を集める部分を `flaggedScripts` に切り出した。
- Unplanned: `scripts/product-ready/index.test.ts` がスケルトンの写しを定数で持っていたため、実物の `rules/` から読む形に直した。形が変わればテストが落ちる。
- Commit: b5b429b
- Stopped: なし

## Review

### Round 1

- Stale:
  - `scripts/product-ready/targets.mjs:96` の「消す物を集める」は `plan` が差し替える行も集める今の動きと合わず、Steps が求めた両方を示す直しが入っていない。
    - fixed: `scripts/product-ready/targets.mjs:96` を「消す物と差し替える物を集める（純）」に直した。
- Unlisted:
  - なし — 追随者だった `rules/roadmap.md` と `rules/definition.format.md` の中身の変更は `Notes` の `Unplanned` にオーナー指示と R1・R2・R3・D2・M1 および `## Shape` から `## Skeleton` への揃えまで書かれ、差分の 11 枚は `Files` の 9 枚と追随者の 2 枚に一致し他に `Files` 外の変更はない。
- Gaps:
  - なし — Steps の happy・empty・error の各ケースに対応するテストが `targets.test.ts` と `index.test.ts` にそろい、`whole` と `sections` の置き換えや欠け・失敗時の exit 1 まで検査が通っている。
- Unproven:
  - `scripts/product-ready/index.test.ts:173` の README 置き換えテストは見出しの有無だけを見て `writeReplaceTargets` の `# old` が消えたことを確かめないため、追記でも緑のままになる。
    - fixed: README の 2 枚とも、置き換えた後に `old` を含まないことを確かめるようにした。
  - `scripts/product-ready/index.test.ts:170` は `## Stack` の見出しだけを見て本文が旧来のままかを見ず `Users can do` の残存も見ないため、Stack を誤って置き換えても緑のままになる。
    - fixed: 対象の `DEFINITION.md` に `### Users can do` と `- reader: x` を置き、`## Stack` の本文 `| a | b | c |` と `- reader: x` が残ることを確かめるようにした。
- Noise:
  - なし — 新規ケースの固定値は `REPLACE_TARGETS` の 4 行や `headings` など plan が決めた値であり、型が保証する前提の再現や誰も気づかない枝のテストはなく、写しの定数も仕様の確認に要る範囲である。
- Doubts:
  - `scripts/product-ready/index.mjs:214` は `jobsFor` を先に作り `remove` より前に投げる順序で原子性を保つが、error の 2 件は一部のファイルしか不変を見ないため全体の不変は目視に残る。
    - fixed: error の 2 件で、4 つの対象ファイルすべてが変わらないことを確かめるようにした。

### Round 2

- Stale: なし
- Unlisted: なし
- Gaps: なし
- Unproven: なし
- Noise: なし
- Doubts: なし

4 件とも `fixed` で閉じたことを確認した。

## Acceptance

- Ran: `pnpm test:run` は 55 ファイル 760 テストが通った。`pnpm typecheck` は `root: ok` と `.pi: ok`。`pnpm lint` は指摘なし。`pnpm format:check` は 307 ファイルが正しい形。`grep` は `STARTER_ONLY`、`skeleton: {`、`no replace to remove`、`A section with nothing in it` が `rules/` と `scripts/` に 0 件。
- Findings: Round 1 で Stale 1 件（`targets.mjs:96` の JSDoc が今の動きと合わない）、Unproven 2 件（README と `DEFINITION.md` の確かめが弱い）、Doubts 1 件（error の原子性が目視のまま）が出た。4 件とも直して `fixed` を付けた。Round 2 で残りの指摘はないと確認された。Unlisted、Gaps、Noise は 0 件。
- Doubts: なし。`## Shape` は `.pi/skills/*/references/format.md` に 5 件残るが、スキルの記録の見出しで、この雛形とは別物である。
