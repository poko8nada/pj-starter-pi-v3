# PLAN `ex-collect-header`

## Files

```text
.pi/skills/
  close/
    scripts/
      collect.mjs         update
```

## Slices

## 1.header-note

### Types

なし

### Steps

1. `.pi/skills/close/scripts/collect.mjs`:
   - The header note (line 3) says the `No` is the plan md's; add that an `ex-` plan's `No` is read from the `close.md`'s `## Triage`.

### Verify

- Always:
  - `pnpm test:related .pi/skills/close/scripts/collect.mjs .pi/skills/close/scripts/collect.test.ts`; `pnpm test:run` if nothing is related
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -n "ex-.*No.*は close.md の.*## Triage.*から読んで" .pi/skills/close/scripts/collect.mjs` has the header note
- Added:
  - other — the agent reads the header note; the `ex-` source is the `Triage`.

## Notes

### Slice 1: header-note

- Findings: なし
- Unplanned: なし
- Commit: cb77254

### Cleanup: なし

- Findings: なし
- Unplanned: なし

## Review

### Round 1

- Stale: なし — 追記と整合しない文書・コメント・テストは確認できませんでした。
- Unlisted: なし — コード差分は Files が挙げる collect.mjs の1行のみで、plan md の差分は Notes の記録です。
- Gaps: なし — コメント追記のみで実行時の振る舞いの変更はなく、確認は Verify に含まれています。
- Unproven:
  - `grep -n "Triage"` はヘッダ注記を削除しても他の Triage 言及により成功するため、ヘッダ注記の存在を証明できません（cycles/261024-036-dev/plan/ex-collect-header.md:32、.pi/skills/close/scripts/collect.mjs:4）。
    - fixed: Verify の grep をヘッダ注記固有の文言（`ex-.*No.*は close.md の.*## Triage.*から読んで`）に絞り、collect.mjs:4 の1行のみに一致することを確認しました。ヘッダ削除では失敗します。
- Noise: なし — 新規テストはなく、既存テストは分岐を確認するもので型や制約の再現ではありません。
- Doubts: なし

## Acceptance

- Ran:
- Findings:
- Doubts:
