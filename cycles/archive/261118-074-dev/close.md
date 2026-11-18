# Close 074

## Collected

なし

## Triage

なし

## Verified

### definition-file

- Plans:
  - `definition-rules`
- Result: OK — `DEFINITION.md` の `Users can do` が Unit と Sub の 1 行ずつで読めることを確かめた。
- Change: OK — `rules/definition.format.md` の `## Sections` の `Users can do` が説明だけになり、1 行 1 Unit/Sub が `## Writing` に 1 つだけ残ることを確かめた。
- Fixed: なし

### definition-rules

- Plans:
  - `definition-rules`
- Result: OK — 6 セクションで Unit と Sub の判定、行の書き方、名付けが読めることを確かめた。
- Change: OK — 差分が組み替えと重複の削除だけで、旧ファイルの規則が新しい見出しの下に残ることを確かめた。
- Fixed: なし

### product-ready

- Plans:
  - `readme-format`
- Result: OK — `pnpm test:related scripts/product-ready/index.test.ts` の 26 件が合格し、両方の README が同じ `## Skeleton` から作られることを確かめた。
- Change: OK — `## Skeleton (ja)` が消え、`SKELETONS` の 2 行が同じ `## Skeleton` を指し、1 行目一致の断言が足され、空振りの断言が消えたことを確かめた。
- Fixed: なし
