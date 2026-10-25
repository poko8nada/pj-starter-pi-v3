# PLAN `ex-precompact-now-command`

## Files

```text
.pi/extensions/context-precompact/
  index.ts                 update
  index.test.ts            update
  ui/
    status.ts              update
    status.test.ts         update
```

## Slices

## 1.now-command

### Types

`なし`

### Steps

1. `.pi/extensions/context-precompact/index.ts`:
   - `onCommand` の `now` を `beginPass(deps, ctx)` にして即 return する。`runPass` の await、`precompact: ready ...` の info 通知、`precompact: nothing to prepare` の通知を消す。実行中なら何も出さずに return する。
   - `applyReady` から `notifyApplied` を外す。`refreshStatus` だけで footer に `applied` を出す。`notifyApplied` が他で使われていなければ関数ごと消す。
   - `readSettingsOrNotify` の壊れた settings の通知を `'warning'` にする。
   - `runPass` が他の呼び出しで使われていなければ関数ごと消す。
2. `.pi/extensions/context-precompact/index.test.ts`:
   - 既存の `/precompact now` の case を、deferred の `compactFn` で「`onCommand` が要約を待たずに返り、status が `preparing` になる」ように直す。deferred を解決して `flush` した後、status が `ready` になることも同じ case で確かめる。
   - 既存の apply の case を、`applied` の info 通知ではなく footer の `precompact: applied (X → Y)` を確かめるように直す。
3. `.pi/extensions/context-precompact/ui/status.ts`:
   - `statusText` の `applied` を `precompact: applied (X → Y)` にする。
   - `notifyText` と `notifyType` の `applied` を `undefined` にする。
4. `.pi/extensions/context-precompact/ui/status.test.ts`:
   - 既存の `applied` の case を、`statusText` が applied の文字列、`notifyText` と `notifyType` が `undefined` になるように直す。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/context-precompact/index.ts .pi/extensions/context-precompact/index.test.ts .pi/extensions/context-precompact/ui/status.ts .pi/extensions/context-precompact/ui/status.test.ts`; 関連が無いときは `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -nE "beginPass|notifyApplied|precompact: applied" .pi/extensions/context-precompact/index.ts .pi/extensions/context-precompact/ui/status.ts` で `beginPass` と `applied` の status があり、`notifyApplied` が無い
- Added: なし

## Notes

### Slice 1: now-command

- Findings:
  - なし
- Unplanned:
  - なし
- Commit: f222bd0 consult(ex-precompact-now-command): fix now command
- Stopped:

## Review

### Round 1

- Stale:
  - `.pi/extensions/context-precompact/README.md:19` の「now は foreground で結果を報告する」との説明が、変更後の `beginPass` による即時復帰（通知なし）と合っておらず古くなっています。
    fixed: README の now 説明を裏で開始し即時復帰・通知なし・実行中は無言で戻る旨に直しました。
  - `.pi/extensions/context-precompact/README.md:26` の「applied は行を clear して通知する」との説明が、変更後の footer 表示（`.pi/extensions/context-precompact/ui/status.ts:24`）と通知なし（`.pi/extensions/context-precompact/ui/status.ts:41`）に合っておらず古くなっています。
    fixed: README の applied 説明を footer 表示に直しました。
  - `.pi/extensions/context-precompact/index.test.ts:529` の題名にある「通知」が、変更後の now ケース（`.pi/extensions/context-precompact/index.test.ts:570-575` は通知を検証しません）と合っておらず古くなっています。
    fixed: 題名の「通知」を外し裏での準備開始に直しました。
- Unlisted:
  - なし — 差分は Files の 4 件（`.pi/extensions/context-precompact/index.ts`、`.pi/extensions/context-precompact/index.test.ts`、`.pi/extensions/context-precompact/ui/status.ts`、`.pi/extensions/context-precompact/ui/status.test.ts`）のみです。
- Gaps:
  - 実行中の `now` が何も出さずに return すること（`.pi/extensions/context-precompact/index.ts:430-431`）に対し、二重呼び出しで通知の不在を確かめる検査がありません。
    fixed: 実行中に二度目の now を呼んで通知なし・preparing 維持を確かめる検査を追加しました。
  - `now` が `ready` 通知や `nothing to prepare` 通知を出さないことに対し、now ケース（`.pi/extensions/context-precompact/index.test.ts:570-575`）は `notified` の空を検証しないため、通知の削除が検査されていません。
    fixed: now 開始直後と ready 到達後の notified 空を検証しました。
  - 壊れた settings 通知の種別 `warning`（`.pi/extensions/context-precompact/index.ts:106`）に対し、既存の壊れケース（`.pi/extensions/context-precompact/index.test.ts:494-495`）は件数と文言のみを見て種別を検証しないため、種別の変更が検査されていません。
    fixed: 壊れ通知の type が warning である検証を追加しました。
- Unproven:
  - なし — 反転時に赤くなることを確認しました（applied の footer／通知なし、now の `preparing`→`ready`、status の `applied` 文言と通知なしはいずれも旧挙動に戻すと失敗します）。
- Noise:
  - なし — 断言中の `precompact: applied` 等は plan が指定した値のため所見にせず、残りの断言に magic number や hardcoded string のみのケースはありません。
- Doubts:
  - `.pi/extensions/context-precompact/index.ts:175` の `console.info` による applied ログは残っていますが、plan が対象にしていないため所見にしていません。

## Acceptance

- Ran:
  - `pnpm test:related` 2 files / 25 tests（plan の Verify）。
  - `pnpm test:run` 56 files / 806 tests。
  - `pnpm typecheck`（root / .pi）、`pnpm lint`、`pnpm format:check`。
  - 壊して戻す 2 件: `status.ts` の `applied` を `undefined` にすると `status.test.ts` の applied と `index.test.ts` の footer applied が赤。`index.ts` の `now` に info 通知を足すと `now` の通知空検証が赤。いずれも復旧して緑に戻した。
- Findings:
  - なし
- Doubts:
  - なし
