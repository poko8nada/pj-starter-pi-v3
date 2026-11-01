# PLAN `path-wording`

- No: 03

## Files

```text
package.json
tsconfig.json
lefthook.yaml
.oxlintrc.json
.oxfmtrc.json
vitest.starter.config.ts
scripts/
  checks/
    scopes.json
    typecheck.mjs
    typecheck-staged.mjs
    typecheck.test.ts             update
    typecheck-staged.test.ts      update
  product-ready/
    targets.mjs                   update
    targets.test.ts               update
    readme-format.test.ts         update
.pi/
  tsconfig.json
  extensions/
    consult/
      run/
        place.ts                  update
        place.test.ts             update
        subagent.test.ts          update
      tool/
        commit.ts                 update
        commit.test.ts            update
```

## Slices

## 1.コメントとテスト名の語の置き換え

### Types

なし

### Steps

1. `scripts/checks/typecheck.test.ts`:
   - コメントの「道」を「パス」に直す(6 行目と 37 行目)。
2. `scripts/checks/typecheck-staged.test.ts`:
   - コメントの「道」を「パス」に直す(7、108、123 行目)。
3. `scripts/product-ready/targets.mjs`:
   - コメントの「道」を「パス」に直す(47、77 行目)。
4. `scripts/product-ready/targets.test.ts`:
   - テスト名の「道」を「パス」に直す(121 行目)。
5. `scripts/product-ready/readme-format.test.ts`:
   - コメントの「道」を「パス」に直す(13 行目)。
6. `.pi/extensions/consult/run/place.ts`:
   - コメントの「道」を「パス」に直す(6、22 行目)。
7. `.pi/extensions/consult/run/place.test.ts`:
   - テスト名の「道」を「パス」に直す(10 行目)。
8. `.pi/extensions/consult/run/subagent.test.ts`:
   - テスト名の「送り込む道」を「送り込む経路」に直す(37 行目)。
9. `.pi/extensions/consult/tool/commit.ts`:
   - コメントの「メッセージを渡す道」を「メッセージを渡す方法」に直す(5 行目)。
10. `.pi/extensions/consult/tool/commit.test.ts`:
    - コメントの「戻す道」を「戻す方法」に直す(58 行目)。

### Verify

- Always:
  - 関連テスト (`pnpm test:related scripts/checks/typecheck.test.ts scripts/checks/typecheck-staged.test.ts scripts/product-ready/targets.test.ts scripts/product-ready/readme-format.test.ts .pi/extensions/consult/run/place.test.ts .pi/extensions/consult/run/subagent.test.ts .pi/extensions/consult/tool/commit.test.ts`。関連がなければ `pnpm test:run`)
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 「道」を、大小文字を問わず `grep` する
- Added:
  - other — `grep -rn "道" scripts/checks/typecheck.test.ts scripts/checks/typecheck-staged.test.ts scripts/product-ready/targets.mjs scripts/product-ready/targets.test.ts scripts/product-ready/readme-format.test.ts .pi/extensions/consult/run/place.ts .pi/extensions/consult/run/place.test.ts .pi/extensions/consult/run/subagent.test.ts .pi/extensions/consult/tool/commit.ts .pi/extensions/consult/tool/commit.test.ts` を `grep -v "道具"` に通して 0 件になる

## Notes

### Slice 1: コメントとテスト名の語の置き換え

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
