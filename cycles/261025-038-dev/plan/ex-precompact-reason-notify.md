# PLAN `ex-precompact-reason-notify`

## Files

```text
.pi/extensions/context-precompact/
  index.ts                 update
  index.test.ts            update
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
   - `failPass` に `reason: string` を戻し、`ctx.ui.notify` で `precompact: failed (<reason>); default compaction will run` を警告で出す。
   - 理由は `outcome.reason` と ports の投げ文言をそのまま使う。
   - stale と不一致の4か所と `notifyText` の汎用文面は変えない。
   - 使われなくなった `notifyFallback` を消す。
   - 2 か所の呼び出しに理由を戻す。
2. `.pi/extensions/context-precompact/index.test.ts`:
   - 偽 ctx の工場に `model` の上書き口を足す。
   - compactFn を1回目成功・2回目以降失敗にする偽物を足す。
   - (error) 1回目成功で `prepared` が立ち2回目の要約が `boom` で失敗 → 通知は1通で文面が指定どおりで種別が `warning` で status は `failed` で `prepared` は無し。
   - (error) 1回目に `model` ありで `prepared` が立ち2回目に `model` が undefined → 通知は1通で文面に `no model available` と `default compaction` が入り種別が `warning` で status は `failed` で `prepared` は無し。
3. `cycles/261025-038-dev/adr.md`:
   - Adopted に1行足す。記録の口は通知とフッターとセッション entry とし、`console` は使わない。失敗理由の通知は要約失敗に限り、stale と不一致は汎用文面のままにする。
   - 70行のフォールバック文面を `precompact: failed (<reason>); default compaction will run` に直す。
4. `cycles/261025-038-dev/close.md`:
   - Triage 13 を `done` にする。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/context-precompact/index.ts .pi/extensions/context-precompact/index.test.ts`; 関連が無いときは `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -rn "console\." .pi/extensions/context-precompact --include=*.ts` が なし
  - `grep -n "console.*使わない" cycles/261025-038-dev/adr.md` と `grep -n "done.*ex-precompact-reason-notify" cycles/261025-038-dev/close.md` と `grep -n "failed (<reason>)" cycles/261025-038-dev/adr.md` で文書がある
- Added: なし

## Notes

### Slice 1: reason-notify

- Findings: なし
- Unplanned:
  - 偽 ctx の `model` 既定値が明示の undefined を潰したため、`'model' in options` に直した。
  - `compactOnceOk` の引数を `Parameters` の spread に直した。12引数の `compactFn` に合わせるため。
  - 行数制限のため2件の失敗試験を `describe('precompact failure reason')` に分けた。
- Commit: 8278b24 fix: notify failure reason in context-precompact
- Stopped:

## Review

### Round 1

- Stale: なし
- Unlisted: なし
- Gaps: なし
- Unproven: なし
- Noise: なし
- Doubts: なし

## Acceptance

- Ran:
  - `pnpm test:related` 18 tests（plan の Verify）。
  - `pnpm test:run` 56 files / 806 tests。
  - `pnpm typecheck`（root / .pi）、`pnpm lint`、`pnpm format:check`。
  - `grep -rn "console\."` は exit 1。文書の `grep` 3件あり。
  - 壊して戻す 1 件: 理由埋め込みを汎用文面に戻すと新しい2件が赤。復旧して緑に戻した。
- Findings:
  - なし
- Doubts:
  - なし
