# PLAN `exception-words`

- No: 02
- Place: base
- Boundary Plans: `exception-shape`（`exception` の空の配列と 3 欄の検証を先に作る）

## Files

```text
scripts/
  checks/
    ja-check.json      update
README.md              update
README.ja.md           update
```

## Slices

## 1.語の選定と記入

### Types

なし

### Steps

1. `scripts/checks/ja-check.json`:
   - update: 先行の plan が作った空の `exception` の配列に、ヒット位置を含む漢字の連続に後続のひらがなを加えた並びをすべて集め、禁止語そのものになる並びと助詞で終わる句を除いた候補を、禁止語ごとに分けて出現数の多い順にオーナーに示し、採用する語の OK を得てから、五十音順に 1 行に 1 語ずつ書き込む（どの禁止語も含まない例外は、抑えようとした警告が残るため誤りとしない）。

### Verify

- Always:
  - `pnpm test:run`（このスライスに関連するテストはなく、実際の設定の語はテストの対象外である）。
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format` を通したあと `git diff scripts/checks/ja-check.json` を読み、`exception` の要素が消えず、1 行 1 語のままであることを確かめる。
  - `pnpm format:check`
  - 変更した全ファイルを通読し、矛盾、循環、重複、不足、不自然な流れがないか確かめる。
- Added:
  - base: オーナーが、禁止語ごとに分けた候補の一覧と、`exception` に書き込んだ語を読み、採用する語の OK を返す。
  - other: `node scripts/checks/ja-check.mjs $(git ls-files)` を`exception` への語の書き込み前後で実行し、サマリー行の `error` と `warn` の合計が書き込み前の合計より少なくなることを確かめる。

## 2.文書

### Types

なし

### Steps

1. `README.md`:
   - update: `exception` の欄の説明に、`exception` に載った語のうち 3 語を例に挙げ、採用した語は `error` と `warn` のどちらでも報告されないことを添える。
2. `README.ja.md`:
   - update: `exception` の欄の説明に、`README.md` と同じ 3 語を例に挙げ、`README.md` と同じ説明を添える。

### Verify

- Always:
  - `pnpm test:run`（このスライスに関連するテストはない）。
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `README.md` と `README.ja.md` の `exception` の欄の説明に載る語を、`grep -rnF` で `scripts/checks/ja-check.json` の中で探し、すべて見つかることを確かめる。
  - 変更した全ファイルを通読し、矛盾、循環、重複、不足、不自然な流れがないか確かめる。
- Added:
  - base: オーナーが、`exception` に載った語と `README.md` と `README.ja.md` の例を読み、例が `exception` に設定した語から選ばれていることと文面を確かめ、OK を返す。
