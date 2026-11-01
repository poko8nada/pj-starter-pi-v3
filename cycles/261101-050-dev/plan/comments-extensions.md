# PLAN `comments-extensions`

- No: 02

## Files

```text
.pi/
  extensions/
    context-precompact/
      apply/
        draft.test.ts                update
        draft.ts                     update
      command/
        precompact.test.ts           update
        precompact.ts                update
      gate/
        gate.test.ts                 update
        gate.ts                      update
      index.test.ts                update
      index.ts                     update
      prepare/
        compare.test.ts              update
        compare.ts                   update
        copied.test.ts               update
        copied.ts                    update
        guard.test.ts                update
        guard.ts                     update
        prepare.test.ts              update
        prepare.ts                   update
        types.ts                     update
      run/
        ports.test.ts                update
        ports.ts                     update
        summarize.test.ts            update
        summarize.ts                 update
      settings/
        constants.ts                 update
        read.test.ts                 update
        read.ts                      update
        schema.test.ts               update
        schema.ts                    update
      test/
        session-entries.ts           update
      ui/
        count.test.ts                update
        count.ts                     update
        status.test.ts               update
        status.ts                    update
    quality-gate/
      checks.test.ts               update
      checks.ts                    update
      index.ts                     update
      report.test.ts               update
      report.ts                    update
      targets.test.ts              update
      targets.ts                   update
    sound-notify/
      index.test.ts                update
      index.ts                     update
      settings/
        read.test.ts                 update
        read.ts                      update
        schema.test.ts               update
        schema.ts                    update
    thinking-scrub/
      command/
        scrub.test.ts                update
        scrub.ts                     update
      index.test.ts                update
      index.ts                     update
      live/
        guard.test.ts                update
        guard.ts                     update
      scrub/
        detect.test.ts               update
        detect.ts                    update
        message.test.ts              update
        message.ts                   update
        units.test.ts                update
        units.ts                     update
      scrub.fixture.ts             update
      settings/
        read.test.ts                 update
        read.ts                      update
        schema.test.ts               update
        schema.ts                    update
      state/
        cell.test.ts                 update
        cell.ts                      update
```

## Slices

## 1.コメントとテスト名

### Types

なし

### Steps

1. `.pi/extensions/context-precompact/apply/draft.test.ts`:
   - (happy) the existing test's given → the test passes; the test name is corrected; the test data is unchanged. 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。
2. `.pi/extensions/context-precompact/apply/draft.ts`:
   - コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。
3. `.pi/extensions/context-precompact/command/precompact.test.ts`:
   - (happy) the existing test's given → the test passes; the test name is corrected; the test data is unchanged. 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。
4. `.pi/extensions/context-precompact/command/precompact.ts`:
   - コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。
5. `.pi/extensions/context-precompact/gate/gate.test.ts`:
   - (happy) the existing test's given → the test passes; the test name is corrected; the test data is unchanged. 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。
6. `.pi/extensions/context-precompact/gate/gate.ts`:
   - コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。
7. `.pi/extensions/context-precompact/index.test.ts`:
   - (happy) the existing test's given → the test passes; the test name is corrected; the test data is unchanged. 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。
8. `.pi/extensions/context-precompact/index.ts`:
   - コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。
9. `.pi/extensions/context-precompact/prepare/compare.test.ts`:
   - (happy) the existing test's given → the test passes; the test name is corrected; the test data is unchanged. 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。
10. `.pi/extensions/context-precompact/prepare/compare.ts`:

- コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

11. `.pi/extensions/context-precompact/prepare/copied.test.ts`:

- (happy) the existing test's given → the test passes; the test name is corrected; the test data is unchanged. 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

12. `.pi/extensions/context-precompact/prepare/copied.ts`:

- コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

13. `.pi/extensions/context-precompact/prepare/guard.test.ts`:

- (happy) the existing test's given → the test passes; the test name is corrected; the test data is unchanged. 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

14. `.pi/extensions/context-precompact/prepare/guard.ts`:

- コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

15. `.pi/extensions/context-precompact/prepare/prepare.test.ts`:

- (happy) the existing test's given → the test passes; the test name is corrected; the test data is unchanged. 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

16. `.pi/extensions/context-precompact/prepare/prepare.ts`:

- コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

17. `.pi/extensions/context-precompact/prepare/types.ts`:

- コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

18. `.pi/extensions/context-precompact/run/ports.test.ts`:

- (happy) the existing test's given → the test passes; the test name is corrected; the test data is unchanged. 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

19. `.pi/extensions/context-precompact/run/ports.ts`:

- コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

20. `.pi/extensions/context-precompact/run/summarize.test.ts`:

- (happy) the existing test's given → the test passes; the test name is corrected; the test data is unchanged. 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

21. `.pi/extensions/context-precompact/run/summarize.ts`:

- コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

22. `.pi/extensions/context-precompact/settings/constants.ts`:

- コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

23. `.pi/extensions/context-precompact/settings/read.test.ts`:

- (happy) the existing test's given → the test passes; the test name is corrected; the test data is unchanged. 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

24. `.pi/extensions/context-precompact/settings/read.ts`:

- コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

25. `.pi/extensions/context-precompact/settings/schema.test.ts`:

- (happy) the existing test's given → the test passes; the test name is corrected; the test data is unchanged. 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

26. `.pi/extensions/context-precompact/settings/schema.ts`:

- コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

27. `.pi/extensions/context-precompact/test/session-entries.ts`:

- コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

28. `.pi/extensions/context-precompact/ui/count.test.ts`:

- (happy) the existing test's given → the test passes; the test name is corrected; the test data is unchanged. 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

29. `.pi/extensions/context-precompact/ui/count.ts`:

- コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

30. `.pi/extensions/context-precompact/ui/status.test.ts`:

- (happy) the existing test's given → the test passes; the test name is corrected; the test data is unchanged. 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

31. `.pi/extensions/context-precompact/ui/status.ts`:

- コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

32. `.pi/extensions/quality-gate/checks.test.ts`:

- (happy) the existing test's given → the test passes; the test name is corrected; the test data is unchanged. 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

33. `.pi/extensions/quality-gate/checks.ts`:

- コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

34. `.pi/extensions/quality-gate/index.ts`:

- コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

35. `.pi/extensions/quality-gate/report.test.ts`:

- (happy) the existing test's given → the test passes; the test name is corrected; the test data is unchanged. 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

36. `.pi/extensions/quality-gate/report.ts`:

- コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

37. `.pi/extensions/quality-gate/targets.test.ts`:

- (happy) the existing test's given → the test passes; the test name is corrected; the test data is unchanged. 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

38. `.pi/extensions/quality-gate/targets.ts`:

- コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

39. `.pi/extensions/sound-notify/index.test.ts`:

- (happy) the existing test's given → the test passes; the test name is corrected; the test data is unchanged. 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

40. `.pi/extensions/sound-notify/index.ts`:

- コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

41. `.pi/extensions/sound-notify/settings/read.test.ts`:

- (happy) the existing test's given → the test passes; the test name is corrected; the test data is unchanged. 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

42. `.pi/extensions/sound-notify/settings/read.ts`:

- コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

43. `.pi/extensions/sound-notify/settings/schema.test.ts`:

- (happy) the existing test's given → the test passes; the test name is corrected; the test data is unchanged. 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

44. `.pi/extensions/sound-notify/settings/schema.ts`:

- コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

45. `.pi/extensions/thinking-scrub/command/scrub.test.ts`:

- (happy) the existing test's given → the test passes; the test name is corrected; the test data is unchanged. 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

46. `.pi/extensions/thinking-scrub/command/scrub.ts`:

- コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

47. `.pi/extensions/thinking-scrub/index.test.ts`:

- (happy) the existing test's given → the test passes; the test name is corrected; the test data is unchanged. 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

48. `.pi/extensions/thinking-scrub/index.ts`:

- コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

49. `.pi/extensions/thinking-scrub/live/guard.test.ts`:

- (happy) the existing test's given → the test passes; the test name is corrected; the test data is unchanged. 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

50. `.pi/extensions/thinking-scrub/live/guard.ts`:

- コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

51. `.pi/extensions/thinking-scrub/scrub.fixture.ts`:

- コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

52. `.pi/extensions/thinking-scrub/scrub/detect.test.ts`:

- (happy) the existing test's given → the test passes; the test name is corrected; the test data is unchanged. 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

53. `.pi/extensions/thinking-scrub/scrub/detect.ts`:

- コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

54. `.pi/extensions/thinking-scrub/scrub/message.test.ts`:

- (happy) the existing test's given → the test passes; the test name is corrected; the test data is unchanged. 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

55. `.pi/extensions/thinking-scrub/scrub/message.ts`:

- コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

56. `.pi/extensions/thinking-scrub/scrub/units.test.ts`:

- (happy) the existing test's given → the test passes; the test name is corrected; the test data is unchanged. 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

57. `.pi/extensions/thinking-scrub/scrub/units.ts`:

- コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

58. `.pi/extensions/thinking-scrub/settings/read.test.ts`:

- (happy) the existing test's given → the test passes; the test name is corrected; the test data is unchanged. 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

59. `.pi/extensions/thinking-scrub/settings/read.ts`:

- コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

60. `.pi/extensions/thinking-scrub/settings/schema.test.ts`:

- (happy) the existing test's given → the test passes; the test name is corrected; the test data is unchanged. 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

61. `.pi/extensions/thinking-scrub/settings/schema.ts`:

- コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

62. `.pi/extensions/thinking-scrub/state/cell.test.ts`:

- (happy) the existing test's given → the test passes; the test name is corrected; the test data is unchanged. 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

63. `.pi/extensions/thinking-scrub/state/cell.ts`:

- コメントとテスト名を基準に合わせる。 基準に合う行は残す。危険なコメントはコードを読んで意味を保つ。JSDoc の欄の構造は変えない。行の折り返しと句点は変えてよい。コメント、JSDoc、テスト名、テストの説明だけを変える。文字列リテラルとテストのデータは変えない。一覧にない語は規則で判断する。1 行ずつ判断し、直した理由を言える。

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `! grep -rniE '作業場|置き場|目録|畳む|雛形|骨|番人|水位|残り物|工場|採る|木|穴' .pi/extensions/context-precompact/apply/draft.test.ts .pi/extensions/context-precompact/apply/draft.ts .pi/extensions/context-precompact/command/precompact.test.ts .pi/extensions/context-precompact/command/precompact.ts .pi/extensions/context-precompact/gate/gate.test.ts .pi/extensions/context-precompact/gate/gate.ts .pi/extensions/context-precompact/index.test.ts .pi/extensions/context-precompact/index.ts .pi/extensions/context-precompact/prepare/compare.test.ts .pi/extensions/context-precompact/prepare/compare.ts .pi/extensions/context-precompact/prepare/copied.test.ts .pi/extensions/context-precompact/prepare/copied.ts .pi/extensions/context-precompact/prepare/guard.test.ts .pi/extensions/context-precompact/prepare/guard.ts .pi/extensions/context-precompact/prepare/prepare.test.ts .pi/extensions/context-precompact/prepare/prepare.ts .pi/extensions/context-precompact/prepare/types.ts .pi/extensions/context-precompact/run/ports.test.ts .pi/extensions/context-precompact/run/ports.ts .pi/extensions/context-precompact/run/summarize.test.ts .pi/extensions/context-precompact/run/summarize.ts .pi/extensions/context-precompact/settings/constants.ts .pi/extensions/context-precompact/settings/read.test.ts .pi/extensions/context-precompact/settings/read.ts .pi/extensions/context-precompact/settings/schema.test.ts .pi/extensions/context-precompact/settings/schema.ts .pi/extensions/context-precompact/test/session-entries.ts .pi/extensions/context-precompact/ui/count.test.ts .pi/extensions/context-precompact/ui/count.ts .pi/extensions/context-precompact/ui/status.test.ts .pi/extensions/context-precompact/ui/status.ts .pi/extensions/quality-gate/checks.test.ts .pi/extensions/quality-gate/checks.ts .pi/extensions/quality-gate/index.ts .pi/extensions/quality-gate/report.test.ts .pi/extensions/quality-gate/report.ts .pi/extensions/quality-gate/targets.test.ts .pi/extensions/quality-gate/targets.ts .pi/extensions/sound-notify/index.test.ts .pi/extensions/sound-notify/index.ts .pi/extensions/sound-notify/settings/read.test.ts .pi/extensions/sound-notify/settings/read.ts .pi/extensions/sound-notify/settings/schema.test.ts .pi/extensions/sound-notify/settings/schema.ts .pi/extensions/thinking-scrub/command/scrub.test.ts .pi/extensions/thinking-scrub/command/scrub.ts .pi/extensions/thinking-scrub/index.test.ts .pi/extensions/thinking-scrub/index.ts .pi/extensions/thinking-scrub/live/guard.test.ts .pi/extensions/thinking-scrub/live/guard.ts .pi/extensions/thinking-scrub/scrub.fixture.ts .pi/extensions/thinking-scrub/scrub/detect.test.ts .pi/extensions/thinking-scrub/scrub/detect.ts .pi/extensions/thinking-scrub/scrub/message.test.ts .pi/extensions/thinking-scrub/scrub/message.ts .pi/extensions/thinking-scrub/scrub/units.test.ts .pi/extensions/thinking-scrub/scrub/units.ts .pi/extensions/thinking-scrub/settings/read.test.ts .pi/extensions/thinking-scrub/settings/read.ts .pi/extensions/thinking-scrub/settings/schema.test.ts .pi/extensions/thinking-scrub/settings/schema.ts .pi/extensions/thinking-scrub/state/cell.test.ts .pi/extensions/thinking-scrub/state/cell.ts` (the command exits 0 when there is no match)
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
