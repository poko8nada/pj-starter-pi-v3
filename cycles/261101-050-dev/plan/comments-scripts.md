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
