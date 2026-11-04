# PLAN `ex-product-ready-once`

- Place: base
- Boundary Plans: なし（`readme` のマージ後に、`scripts/product-ready` の中で閉じる）

## Files

```text
scripts/product-ready/index.mjs       update
scripts/product-ready/index.test.ts   update
```

## Slices

## 1.「何が変わるか」を 1 回だけ計算する

### Types

```ts
/** 置き換え後の本文と箇条書きを入れた `###` の見出し名 */
export type Filled = { readonly text: string; readonly filled: readonly string[] };

/** テンプレートの block と置き換え前の README から、本文と箇条書きを入れた `###` の見出し名を取り出す。材料がなければ例外を投げる（副作用なし） */
export function fillDefaults(block: string, source: string): Filled;

/** 差し替えの仕事。`filled` は表示用である */
export type Job = {
  readonly at: string;
  readonly path: string;
  readonly text: string;
  readonly filled: readonly string[];
};

/** 表示用の見出し。仕事の `filled` を順につなげ、重複を取り除いたもの */
export function headingsOf(jobs: readonly Job[]): readonly string[];
```

### Steps

1. `scripts/product-ready/index.mjs`:
   - update: `fillDefaults` から「組み立て済みなら省く」判定を取り除き、戻り値を `{ text, filled }` に変え、JSDoc の戻り値も修正する。`filled` は箇条書きを入れた `###` の見出しである。2 回目は材料となる段落がないため、`collectUnder` がエラーを投げて止まる。
   - update: `headingsFor`、`hasTarget`、`defaultLines` を削除する。あとの 2 つは `headingsFor` だけが使っているため、残すと使われない関数が残り（`pnpm lint` が失敗する）、`fillDefaults` の対象探索と同じ形の重複も残る。
   - update: `jobsFor` が作る仕事に `filled` を加え、JSDoc の `@returns` を修正する。
   - update: `main` は仕事を 1 回だけ作り（`jobsFor`）、表示には `headingsOf(jobs)` を用いる。組み立てのエラーは `remove` と書き込みよりも先に送出する。`--only` は `plan` にだけ効かせ、表示と書き込みは同じ `jobs` から作る。`--run` の場合にだけ `remove` と書き込みを行う。
2. `scripts/product-ready/index.test.ts`:
   - update: (error) 一度 `--run` した後の同じツリーでもう一度 `--run` する → 終了コード 1、出力はエラー 1 行のみ、`README.md` と `README.ja.md` は変わらない
   - update: (happy) 1 回目の `--run` で、表示の `headings:` 行の見出しと `### Default` の下の箇条書きの見出しが同じ順序で並ぶ
   - update: (happy) `--only readme` 付きのドライラン → 表示の見出しが `readme` の仕事の `filled` だけになる

### Verify

- Always:
  - `pnpm test:run scripts/product-ready`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - grep ツールで `scripts/product-ready` 内の `headingsFor` を検索し、0 件であることを確認する
  - grep ツールで `scripts/product-ready` 内の `hasTarget` と `defaultLines` を検索し、各 0 件であることを確認する
  - grep ツールで `scripts/product-ready/index.mjs` 内の `sourceNames` を検索し、0 件であることを確認する（「組み立て済みなら省く」判定を取り除いたこと）
  - 変更した 2 つのファイルを、変更前の内容と見比べながら読み、矛盾、循環、重複、不足、不自然な流れがないか確認する
- Added: base — オーナーが差分を確認して OK を出す

## Notes

### Slice 1: 「何が変わるか」を 1 回だけ計算する

- Findings: 2 回目の `--run` のエラーは「材料が無い」で、`not enough headings` ではなく `no paragraph under ### Product` だった。`### Default` の下が箇条書きだけになり、段落が無くなるためである。事例の文をそちらに合わせた。
- Unplanned: `--only readme` の事例は書けない。`REPLACE_TARGETS` のラベルはすべて `replace` で、「readme」のラベルは無い。代わりに `--only cycles` の dry-run で `headings:` 行が出ないことを見る事例にした。
- Commit: `a4236b9`
- Stopped: なし

## Work Review

### Round 1

- Stale: なし。理由：差分内の JSDoc・コメントは更新済み（`fillDefaults` の戻り値、`jobsFor` の `@returns`）で、`DefaultLine` は `collectUnder` が使い続け、`indented` の import 削除も対応済み。`headingsFor` 等の grep は 0 件で残存参照なし。旧名を記す `01-readme.md` の Types と ADR の実測記述は実行済み記録であり、`close.md` の収集 01・所見 2 の先例（歴史的記録は stale としない）に倣い対象外とした。
- Unlisted: `index.test.ts:296-301` の `(empty) \`--only cycles\` の dry-run → \`headings:\` 行が出ない`事例。理由：Steps（48 行目）が名指すのは`\`--only readme\``付き dry-run で`readme`の`filled` だけを表示する事例であり、`cycles` 絞り込みの空事例はどの Step も名指していない。Notes（68 行目）が置き換えを明記しているため意図的逸脱だが、Steps と実装テストの対応は切れている。
  - left: `REPLACE_TARGETS` のラベルがすべて `replace` で「readme」のラベルが無く、その事例は書けない。置き換えは `Notes` の `Unplanned` に記録した。
- Gaps: なし。理由：残り 1 の `Then` はすべて運ばれている（2 か所の判定削除＝`fillDefaults` の `blockNames`/`sourceNames` 比較と `headingsFor` 本体の削除、`jobsFor` の 1 回化と `remove`・書き込みより前の送出＝`main:318-325,335-354`、`{text, filled}` の返却と `headingsOf(jobs)` の表示利用、`index.test.ts:265-275` の 2 回目エラー事例化）。ADR 02 の `Adopted` も運ばれている（`index.mjs` に `Product`/`Default` の定数なし、`slice(0,h3[1]+1)` で前の `###` を残す、読みはテンプレートから）。
- Unproven: Steps（44 行目）の「`--only` は `plan` にだけ効かせ、表示と書き込みは同じ `jobs` から作る」の非空側（48 行目の `\`--only readme\` → `readme` の `filled` だけ表示）。理由：Notes（68 行目）のとおり `REPLACE_TARGETS` のラベルがすべて `replace` のため該当テストが書けず、残った `(empty)` 事例（`index.test.ts:296-301`）は空集合側しか保持しない。表示が絞り込み前の `jobs` を参照しても非空側ではどのテストも赤にならない。
  - left: ラベルの無い絞り込みの非空側は事例にできない。空集合側の事例と、表示と書き込みが同じ `jobs` から出ることを見る事例で足りている。
- Noise: `filled` という名が何を持つか言っていない。理由：`index.mjs:149` と plan Types は「箇条書きを入れた `###` の見出し名」と書くが、実装（`index.mjs:172-174`）が積むのは箇条書きの材料の見出し名（`Roadmap & Cycle` 等）であり、箇条書きを受け取った容器（`Default`）の名ではない。読む側は `headingsOf`（`index.mjs:186-198`）まで追わないと表示内容が分からず、非 `whole` 経路の `filled: []`（`index.mjs:233-238`）も「常時空の `filled`」という紛らわしさを足している。
  - fixed: `fillDefaults` の JSDoc を、`filled` が箇条書きで埋めた `###` の見出し名（材料の名。文書の順）だと書く形に直した。
- Doubts: `fillDefaults` が `filled` を文書順の逆向き（`index.mjs:162` の後ろからの走査順）に積む点。現テンプレートは対象 `##` が 1 つのため発現しないが、対象 `##` が 2 つ以上に増えたら表示順が文書順と逆になる。`filled` を文書順に積み直すか、単一対象の前提を JSDoc に書いて残すか、オーナーの判断を求める。
  - fixed: `fillDefaults` が各見出しの名前を組で積み、最後に `toReversed()` して文書の順の `filled` を返すようにした。

## Acceptance

- Ran:
- Findings:
- Doubts:
