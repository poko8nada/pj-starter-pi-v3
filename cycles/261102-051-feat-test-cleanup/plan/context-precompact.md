# PLAN `context-precompact`

- No: 03

## Files

```text
.pi/extensions/context-precompact/
  gate/
    gate.test.ts       update
  command/
    precompact.test.ts update
  prepare/
    compare.test.ts    update
    prepare.test.ts    update
  settings/
    schema.test.ts     update
```

## Slices

## 1.settings の削除

### Types

なし

### Steps

1. `.pi/extensions/context-precompact/settings/schema.test.ts`:
   - `it('thresholdRatio が下限未満なら broken になる')` を削除する。`constants.ts:17` の `MIN_THRESHOLD` の宣言をなぞるだけである。
   - `it('thresholdRatio が上限超過なら broken になる')` を削除する。`constants.ts:18` の `MAX_THRESHOLD` の宣言をなぞるだけである。
   - `it('keepRecentTokens が下限未満なら broken になる')` を削除する。`constants.ts:19` の `MIN_KEEP` の宣言をなぞるだけである。
   - `it('JSON でなければ broken になる')` を削除する。`settings/read.test.ts` の `it('壊れた JSON なら broken になる')` が同じ分岐を確かめる。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/context-precompact/settings/schema.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `! grep -n 'thresholdRatio が下限未満\|thresholdRatio が上限超過\|keepRecentTokens が下限未満\|JSON でなければ broken' .pi/extensions/context-precompact/settings/schema.test.ts`
  - `grep -c '壊れた JSON なら broken' .pi/extensions/context-precompact/settings/read.test.ts` が 1 である
- Added: なし

## 2.prepare の統合

### Types

なし

### Steps

1. `.pi/extensions/context-precompact/prepare/compare.test.ts`:
   - `it('fileOps.read だけ違えば mismatch の fileOps になる')`、`it('fileOps.written だけ違えば mismatch の fileOps になる')`、`it('fileOps.edited だけ違えば mismatch の fileOps になる')` を1本に統合する。統合したテストは、`fileOps` の `read`、`written`、`edited` のどれかが違えば、`mismatch` の `fileOps` になることを3つの場合で確かめる。
2. `.pi/extensions/context-precompact/prepare/prepare.test.ts`:
   - `it('前回の fromHook の details があれば read と edited に path が入る')` と `it('fromHook がない前回は追加の merge がない')` を1本に統合する。統合したテストは、`fromHook` の `details` があるときだけ `read` と `edited` に path が入ることを確かめる。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/context-precompact/prepare/compare.test.ts .pi/extensions/context-precompact/prepare/prepare.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -c 'fileOps.read だけ違えば\|fileOps.written だけ違えば\|fileOps.edited だけ違えば' .pi/extensions/context-precompact/prepare/compare.test.ts` が 0 である
  - `grep -c 'fileOps のどれかが違えば' .pi/extensions/context-precompact/prepare/compare.test.ts` が 1 である
  - `grep -c 'fromHook の details があるときだけ' .pi/extensions/context-precompact/prepare/prepare.test.ts` が 1 である
- Added: なし

## 3.command の統合

### Types

なし

### Steps

1. `.pi/extensions/context-precompact/command/precompact.test.ts`:
   - `it('最後の行は status と statusLine の文面になる')` を削除する。`ui/status.test.ts` の `it('ready と applied に前後の数を渡すと桁区切りの 2 値が入る')` が `statusLine` を確かめている。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/context-precompact/command/precompact.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `! grep -n '最後の行は status と statusLine の文面になる' .pi/extensions/context-precompact/command/precompact.test.ts`
  - `grep -c 'ready と applied に前後の数を渡すと桁区切りの 2 値が入る' .pi/extensions/context-precompact/ui/status.test.ts` が 1 である
- Added: なし

## 4.gate と index の統合

### Types

なし

### Steps

1. `.pi/extensions/context-precompact/gate/gate.test.ts`:
   - `it('比率がしきい値で prepared でなければ start になる')` を削除する。`index.test.ts` の `it('flush が実行中のパスを待つと prepared ができ、status が ready になる')` が同じ分岐を統合の側から確かめている。
   - `it('比率がしきい値で prepared なら apply になる')` を削除する。`index.test.ts` の `it('turn_end で比率がしきい値なら draft が 1 件でき、chat に applied が出て lastApplied が残る')` が同じ分岐を統合の側から確かめている。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/context-precompact/gate/gate.test.ts .pi/extensions/context-precompact/index.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `! grep -n '比率がしきい値で prepared でなければ start\|比率がしきい値で prepared なら apply' .pi/extensions/context-precompact/gate/gate.test.ts`
  - `grep -c 'flush が実行中のパスを待つと' .pi/extensions/context-precompact/index.test.ts` が 1 である
  - `grep -c 'turn_end で比率がしきい値なら' .pi/extensions/context-precompact/index.test.ts` が 1 である
- Added: なし

## Notes

### Slice 1: settings の削除

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 2: prepare の統合

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 3: command の統合

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 4: gate と index の統合

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Cleanup: <what it cleaned>

- Findings:
- Unplanned:

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
