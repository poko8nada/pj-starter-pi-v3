# PLAN `ex-precompact-reason-notify`

## Files

```text
.pi/extensions/context-precompact/
  index.ts                 update
  index.test.ts            update
.oxlintrc.json             update
cycles/261025-038-dev/
  adr.md                   update
  close.md                 update
```

## Slices

## 1.reason-notify

### Types

`なし`

### Steps

1. `.pi/extensions/context-precompact/index.ts`:
   - `failPass` に `reason: string` を戻し、`ctx.ui.notify` で `precompact: failed (<reason>); default compaction will run` を警告で出す。`console` は使わない。
   - 使われなくなった `notifyFallback` を消す。
   - 2 か所の `failPass` の呼び出しに理由を戻す。`outcome.reason` と要約の throw の文面。
2. `.pi/extensions/context-precompact/index.test.ts`:
   - (error) 要約が `boom` で失敗 → 通知に `boom` と `default compaction` が入る。
3. `.oxlintrc.json`:
   - `.pi/extensions/context-precompact/**/*.ts` の override を足し、`no-console` を `error` にする。全体の `allow` は変えない。
4. `cycles/261025-038-dev/adr.md`:
   - Adopted に1行足す。記録の口は通知とフッターとセッション entry とし、`console` は使わない。
5. `cycles/261025-038-dev/close.md`:
   - Triage 13 を `done` にする。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/context-precompact/index.ts .pi/extensions/context-precompact/index.test.ts`; 関連が無いときは `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -rn "console\." .pi/extensions/context-precompact --include=*.ts` が なし
- Added: なし

## Notes

### Slice 1: reason-notify

- Findings:
- Unplanned:
- Commit:
- Stopped:

## Review

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
