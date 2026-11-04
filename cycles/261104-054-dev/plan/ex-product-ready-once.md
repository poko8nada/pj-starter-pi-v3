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
