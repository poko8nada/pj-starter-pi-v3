# PLAN `strings`

- No: 03

## Files

```text
.pi/extensions/consult/
  types.json               update
  index.test.ts
  policy/
    types.test.ts          update
    types.ts
  sub/
    budget.ts
    guard.test.ts
    guard.ts
    spec.test.ts
  tool/
    consult.test.ts
    consult.ts
    worktree.test.ts       update
    worktree.ts            update
.pi/extensions/thinking-scrub/
  command/
    scrub.test.ts
    scrub.ts               update
  scrub.fixture.ts         update
.pi/skills/adr/
  SKILL.md
  references/
    format.md
  scripts/
    scaffold.mjs           update
    scaffold.test.ts       update
.pi/skills/close/scripts/
  collect.mjs
  collect.test.ts
scripts/product-ready/
  index.test.ts
  readme-format.test.ts
```

## Slices

## 1.文字列と指示

### Types

なし

### Steps

1. `.pi/extensions/consult/types.json`:
   - `review` ロールの `根拠をつけでください` を `根拠をつけてください` に直す。他のロールの意味と条件は変えない。
2. `.pi/extensions/consult/policy/types.test.ts`:
   - (happy) the review role's text → it contains `根拠をつけてください`。他のロールの文言は変えない。
3. `.pi/extensions/consult/tool/worktree.ts`:
   - 出力の `作業場` を `ワークツリー` に直す。出力の構造と、`outcome` の判定は変えない。
4. `.pi/extensions/consult/tool/worktree.test.ts`:
   - (happy) `list` on an empty project → the output contains `ワークツリーは無い`。他の字面は変えない。
5. `.pi/extensions/thinking-scrub/command/scrub.ts`:
   - `last: まだ無い` を `last: まだない` に直す。状態の行の構造は変えない。
6. `.pi/extensions/thinking-scrub/scrub.fixture.ts`:
   - `SCRUB_LAST_NONE` を `last: まだない` に追随させる。
7. `.pi/extensions/thinking-scrub/command/scrub.test.ts`:
   - (happy) `lastAt` is null → the output contains the `SCRUB_LAST_NONE` constant.
8. `.pi/skills/adr/scripts/scaffold.mjs`:
   - 雛形の `<採った形>` を `<採用した形>` に、`(採らなかった理由)` を `(採用しなかった理由)` に直す。他の placeholders と見出しは変えない。
9. `.pi/skills/adr/scripts/scaffold.test.ts`:
   - (happy) `entrySkeleton` → the output contains `<採用した形>` and `(採用しなかった理由)`。

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `! grep -rniE '作業場は無い|last: まだ無い|<採った形>|採らなかった|つけで' .pi/extensions/consult/types.json .pi/extensions/consult/tool/worktree.ts .pi/extensions/consult/tool/worktree.test.ts .pi/extensions/thinking-scrub/command/scrub.ts .pi/extensions/thinking-scrub/scrub.fixture.ts .pi/skills/adr/scripts/scaffold.mjs` (the command exits 0 when there is no match)
- Added: the agent reads the diff for: `なし` and `未特定` stay; the `proofreader` quote `root→根、version→版、tree→木` stays; only the punctuation, the brackets and the symbols change; the stored records' wording and format are unchanged; the role instructions' meaning and conditions are unchanged; the test data changes only where it mirrors runtime strings

## Notes

### Slice 1: 文字列と指示

- Findings: なし
- Unplanned: なし
- Commit: 28e4cca consult(strings): fix Japanese wording in runtime strings
- Stopped:

### Cleanup: 重複・廃止のテストなし

- Findings: なし
- Unplanned: なし

## Work Review

### Round 1

- Stale:
  - なし — .pi に作業場/まだ無い/つけでは残らず、残る採った形/採らなかったは docs plan の範囲のため直さない（設計の Non-goal と ADR 05 が決めた分担）。
- Unlisted:
  - なし — 製品の差分 8 件は Files の update と一致し、あとは plan md の記録だけのため。
- Gaps:
  - なし — 4 件の実行時文字列は各テストが exercised し、残りの不変条件は Added の差分読みの範囲のため。
- Unproven:
  - なし — 各テストは対応する文字列を旧字面に戻すと赤になる（toContain の新旧字面は重ならない／scrub は定数経由で不一致になる）ため。
- Noise:
  - なし — 字面の固定値と entrySkeleton(1) の引数は plan の Steps と ADR が決めた値のため finding にしない。
- Doubts:
  - `.pi/skills/adr/references/format.md:38` と `.pi/skills/adr/SKILL.md:112` に残る旧表記は docs plan が直す範囲であり、strings の差分に含めないことを確認した。

## Acceptance

- Ran: `pnpm test:run` (62 files, 787 tests), `pnpm typecheck`, `pnpm lint`, `pnpm format:check`; the diff read of the 8 changed files and the unchanged followers
- Findings: なし
- Doubts: なし
