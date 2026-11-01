# PLAN `comments-scripts`

- No: 02

## Files

```text
.pi/
  skills/
    adr/
      scripts/
        scaffold.mjs                 update
        scaffold.test.ts             update
    close/
      scripts/
        collect.fixture.ts           update
        collect.mjs                  update
        collect.test.ts              update
lib/
  git-env.mjs                  update
scripts/
  checks/
    typecheck-staged.mjs         update
    typecheck-staged.test.ts     update
    typecheck.mjs                update
    typecheck.test.ts            update
  harness/
    collect/
      index.mjs                    update
      index.test.ts                update
    config.test.ts               update
    diff/
      index.mjs                    update
      index.test.ts                update
    display/
      index.mjs                    update
      index.test.ts                update
    index.mjs                    update
    index.test.ts                update
    list/
      index.mjs                    update
      index.test.ts                update
    path/
      index.mjs                    update
      index.test.ts                update
  product-ready/
    blocks.mjs                   update
    cli.mjs                      update
    cli.test.ts                  update
    index.mjs                    update
    index.test.ts                update
    readme-format.test.ts        update
    targets.mjs                  update
    targets.test.ts              update
test/
  pi.fixture.ts                update
  scripts.fixture.ts           update
  temp-dir.ts                  update
vitest.config.ts             update
```

## Slices

## 1.コメントとテスト名

### Types

なし

### Steps

1. `.pi/skills/adr/scripts/scaffold.mjs`:
   - コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。
2. `.pi/skills/adr/scripts/scaffold.test.ts`:
   - (happy) the existing test's given → the test passes; the test name is corrected; the test data is unchanged. 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。
3. `.pi/skills/close/scripts/collect.fixture.ts`:
   - コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。
4. `.pi/skills/close/scripts/collect.mjs`:
   - コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。
5. `.pi/skills/close/scripts/collect.test.ts`:
   - (happy) the existing test's given → the test passes; the test name is corrected; the test data is unchanged. 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。
6. `lib/git-env.mjs`:
   - コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。
7. `scripts/checks/typecheck-staged.mjs`:
   - コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。
8. `scripts/checks/typecheck-staged.test.ts`:
   - (happy) the existing test's given → the test passes; the test name is corrected; the test data is unchanged. 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。
9. `scripts/checks/typecheck.mjs`:
   - コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。
10. `scripts/checks/typecheck.test.ts`:

- (happy) the existing test's given → the test passes; the test name is corrected; the test data is unchanged. 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

11. `scripts/harness/collect/index.mjs`:

- コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

12. `scripts/harness/collect/index.test.ts`:

- (happy) the existing test's given → the test passes; the test name is corrected; the test data is unchanged. 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

13. `scripts/harness/config.test.ts`:

- (happy) the existing test's given → the test passes; the test name is corrected; the test data is unchanged. 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

14. `scripts/harness/diff/index.mjs`:

- コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

15. `scripts/harness/diff/index.test.ts`:

- (happy) the existing test's given → the test passes; the test name is corrected; the test data is unchanged. 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

16. `scripts/harness/display/index.mjs`:

- コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

17. `scripts/harness/display/index.test.ts`:

- (happy) the existing test's given → the test passes; the test name is corrected; the test data is unchanged. 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

18. `scripts/harness/index.mjs`:

- コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

19. `scripts/harness/index.test.ts`:

- (happy) the existing test's given → the test passes; the test name is corrected; the test data is unchanged. 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

20. `scripts/harness/list/index.mjs`:

- コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

21. `scripts/harness/list/index.test.ts`:

- (happy) the existing test's given → the test passes; the test name is corrected; the test data is unchanged. 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

22. `scripts/harness/path/index.mjs`:

- コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

23. `scripts/harness/path/index.test.ts`:

- (happy) the existing test's given → the test passes; the test name is corrected; the test data is unchanged. 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

24. `scripts/product-ready/blocks.mjs`:

- コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

25. `scripts/product-ready/cli.mjs`:

- コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

26. `scripts/product-ready/cli.test.ts`:

- (happy) the existing test's given → the test passes; the test name is corrected; the test data is unchanged. 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

27. `scripts/product-ready/index.mjs`:

- コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

28. `scripts/product-ready/index.test.ts`:

- (happy) the existing test's given → the test passes; the test name is corrected; the test data is unchanged. 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

29. `scripts/product-ready/readme-format.test.ts`:

- (happy) the existing test's given → the test passes; the test name is corrected; the test data is unchanged. 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

30. `scripts/product-ready/targets.mjs`:

- コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

31. `scripts/product-ready/targets.test.ts`:

- (happy) the existing test's given → the test passes; the test name is corrected; the test data is unchanged. 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

32. `test/pi.fixture.ts`:

- コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

33. `test/scripts.fixture.ts`:

- コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

34. `test/temp-dir.ts`:

- コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

35. `vitest.config.ts`:

- コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `! grep -rniE '作業場|置き場|目録|畳む|雛形|骨|番人|水位|残り物|工場|採る|木|穴' .pi/skills/adr/scripts/scaffold.mjs .pi/skills/adr/scripts/scaffold.test.ts .pi/skills/close/scripts/collect.fixture.ts .pi/skills/close/scripts/collect.mjs .pi/skills/close/scripts/collect.test.ts lib/git-env.mjs scripts/checks/typecheck-staged.mjs scripts/checks/typecheck-staged.test.ts scripts/checks/typecheck.mjs scripts/checks/typecheck.test.ts scripts/harness/collect/index.mjs scripts/harness/collect/index.test.ts scripts/harness/config.test.ts scripts/harness/diff/index.mjs scripts/harness/diff/index.test.ts scripts/harness/display/index.mjs scripts/harness/display/index.test.ts scripts/harness/index.mjs scripts/harness/index.test.ts scripts/harness/list/index.mjs scripts/harness/list/index.test.ts scripts/harness/path/index.mjs scripts/harness/path/index.test.ts scripts/product-ready/blocks.mjs scripts/product-ready/cli.mjs scripts/product-ready/cli.test.ts scripts/product-ready/index.mjs scripts/product-ready/index.test.ts scripts/product-ready/readme-format.test.ts scripts/product-ready/targets.mjs scripts/product-ready/targets.test.ts test/pi.fixture.ts test/scripts.fixture.ts test/temp-dir.ts vitest.config.ts` (the command exits 0 when there is no match)
- Added: the agent reads the diff for the JSDoc structure, the `口`/`手`/`純`/`穴`, the test data, the string literals, the risky comments and the passing lines

## Notes

### Slice 1: コメントとテスト名

- Findings:
  - plan の Verify の `grep -rniE '作業場|置き場|目録|畳む|雛形|骨|番人|水位|残り物|工場|採る|木|穴'` が `骨組み` に含まれる `骨` に当たり、0 件にならない。
    - left: 対応表が `骨` → `骨組み` を求めるため。部分一致を除けば対象ファイルの単独の `骨` は 0 件で、`pnpm test:run`、`pnpm typecheck`、`pnpm lint`、`pnpm format:check` は緑。
- Unplanned:
  - なし
- Commit:
  - 154d7d4
- Stopped:

### Cleanup: 重複テストの整理

- Findings: なし
- Unplanned:
  - `scripts/harness/config.test.ts` の `実一覧に harness の下層 glob がある` を落とした。`testConfig` の振る舞いではなく実データの固定であり、除外組み立ての確認は `false の一覧` に残るため。
  - `scripts/product-ready/readme-format.test.ts` の `1行を落とした写しは通らない` を落とした。`1行を別の見出しに変えた写しは通らない` と同じ英語雛形不一致の投げであり、見出し置換とフェンス追加の確認が残るため。削除後は `pnpm test:run`、`pnpm typecheck`、`pnpm lint`、`pnpm format:check` が緑。

## Work Review

### Round 1

- Stale:
  - `scripts/harness/list/index.test.ts:5` の `純粋に` は対応表の `純→副作用なし` に合っていない。実装の `scripts/harness/list/index.mjs:11` は `副作用なし` に直されており、同じ意味に同じ語を使う規則9に反するため残存である。
    - left: ADR 01は「純関数」を「純粋関数」と明記し純粋自体は適合語である。実装の（副作用なし）はJSDoc注記、テストの純粋には副詞修飾であり、無理に揃えると不自然になるため残す。
  - `scripts/harness/path/index.test.ts:4` の `純粋に` は対応表の `純→副作用なし` に合っていない。実装の `scripts/harness/path/index.mjs:12` は `副作用なし` に直されており、同じ意味に同じ語を使う規則9に反するため残存である。
    - left: 同上。純粋は適合語であり、副詞修飾を副作用なしに置き換えると不自然になるため残す。
  - `scripts/harness/display/index.test.ts:4` の `純粋に` は対応表の `純→副作用なし` に合っていない。実装の `scripts/harness/display/index.mjs:8` は `副作用なし` に直されており、同じ意味に同じ語を使う規則9に反するため残存である。
    - left: 同上。純粋は適合語であり、副詞修飾を副作用なしに置き換えると不自然になるため残す。
- Unlisted:
  - なし — 差分の22件はFilesの35件の内側であることを確かめた。
- Gaps:
  - なし — 未変更の13件は検証済み語（雛形・残り物・置き場・作業場・目録・畳む・番人・水位・工場・採る・木・穴）が残らず、削除2件の理由はNotesのCleanupと一致し、Verifyのgrepに純・口・手が無い分はAddedの目視が担うため。
- Unproven:
  - なし — テスト名の正しさは緑では証明できないが、Addedの差分目視が担うためfindingにしない。
- Noise:
  - なし — 残る数字と文字列はテストのデータとしてplanが変えないと決めたため。削除済みの2件は重複と実データ固定の整理であり残存のNoiseはない。
- Doubts:
  - Verifyのgrepが `骨組み` の `骨` に当たる件はNotesのFindingsに記録済みであり、対応表の `骨→骨組み` のためfindingにしない。

### Round 2

- Stale:
  - なし — 今回は `### Round 1` の `fixed:` のみを確認対象とするため、`Stale` には `fixed:` がなく確かめる修正はない（:228-:234）。
- Unlisted:
  - なし — 同上の理由により、`Unlisted` には `fixed:` がなく確かめる修正はない（:235-:236）。
- Gaps:
  - なし — 同上の理由により、`Gaps` には `fixed:` がなく確かめる修正はない（:237-:238）。
- Unproven:
  - なし — 同上の理由により、`Unproven` には `fixed:` がなく確かめる修正はない（:239-:240）。
- Noise:
  - なし — 同上の理由により、`Noise` には `fixed:` がなく確かめる修正はない（:241-:242）。
- Doubts:
  - なし — 同上の理由により、`Doubts` には `fixed:` がなく確かめる修正はない（:243-:244）。
  - Doubts: なし — `fixed:` 以外を見ないため、新たな疑義は出さない。

## Acceptance

- Ran: `pnpm test:run` (62 files, 789 tests), `pnpm typecheck`, `pnpm lint`, `pnpm format:check`; the diff read of the 22 changed files and the 13 unchanged
- Findings: なし
- Doubts: なし
