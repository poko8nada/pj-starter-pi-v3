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

- Findings: なし
- Unplanned: なし
- Commit: 47270dd consult(path-wording): replace michi wording with path wording
- Stopped: なし

### Cleanup: 重複・不要テストの点検

- Findings: なし
- Unplanned: なし — Files の update のうちテスト7件を点検し、重複・消えた振る舞い・消えた分岐・Test cases 外れはいずれもなしと判断したため何も落とさなかった。

## Work Review

### Round 1

- Stale: なし — 差分はコメントとテスト名の語だけの置換で、振る舞い・文書引用を変えない（ADR 03 behaviour: out、引用なしの実測）。残存の「道」は除外語「道具」のみ（例 `.pi/extensions/consult/tool/commit.ts:24`）。
- Unlisted: なし — 差分10件は Files の update 10件（例 `scripts/checks/typecheck.test.ts:6`、`scripts/product-ready/targets.mjs:47`）と一致し、計画外ファイルの変更はない。
- Gaps: なし — Steps 指定の15か所（例 `scripts/checks/typecheck-staged.test.ts:123`、`.pi/extensions/consult/run/subagent.test.ts:37`）は過不足なく置換され、Added の grep は「道具」を除き0件になる。
- Unproven: なし — 表明は一行も変わらず語の改名だけ（例 `scripts/product-ready/targets.test.ts:121`、`commit.test.ts:58` 近傍の expect 群は不変）のため green 条件は緩んでいない。
- Noise: なし — 新規ケース・数値・固定文字列の追加はなく（例 `.pi/extensions/consult/run/place.test.ts:10` は語の改名のみ）、Cleanup 点検でも落とす物なしと記録済み。
- Doubts: なし

## Acceptance

- Ran: `pnpm test:run` (58 files / 796 tests)、`pnpm typecheck` (root と .pi が ok)、`pnpm lint`、対象 10 ファイルの `grep -rn "道"`（`道具` を除く → 0 件）。振る舞いを足さない plan なので、`git diff 59405d8..HEAD` を読んで確かめた (10 ファイル、15 行)。修正の後に、すべてやり直した
- Findings:
  - `pnpm format:check` が `cycles/261101-049-feat-harness-sync/plan/path-wording.md` を赤にした。`## Work Review` の前に空行が 2 つあった。
    - fixed: 空行を 1 つに直した (`c7e56b8`)。
- Doubts: なし
