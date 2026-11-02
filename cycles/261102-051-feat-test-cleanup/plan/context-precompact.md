# PLAN `context-precompact`

- No: 03

## Files

```text
.pi/extensions/context-precompact/
  gate/
    gate.test.ts          update
  command/
    precompact.test.ts    update
  prepare/
    compare.test.ts       update
    prepare.test.ts       update
  settings/
    schema.test.ts        update
    read.test.ts
    constants.ts
  ui/
    status.test.ts
  index.test.ts
```

## Slices

## 1.settings の削除と統合

### Types

なし

### Steps

1. `.pi/extensions/context-precompact/settings/schema.test.ts`:
   - `it('thresholdRatio が下限未満なら broken になる')` を削除する。`constants.ts:17` の `MIN_THRESHOLD` の宣言をなぞるだけである。
   - `it('thresholdRatio が上限超過なら broken になる')` を削除する。`constants.ts:18` の `MAX_THRESHOLD` の宣言をなぞるだけである。
   - `it('keepRecentTokens が下限未満なら broken になる')` を削除する。`constants.ts:19` の `MIN_KEEP` の宣言をなぞるだけである。
   - `it('JSON でなければ broken になる')` を削除する。統合先は `settings/read.test.ts` の `it('壊れた JSON なら broken になる')` であり、同じ `parseSettings` の分岐をファイル経由で確かめる。
   - 未使用になった `MIN_KEEP_RECENT_TOKENS` の import を削除する。
2. `.pi/extensions/context-precompact/settings/read.test.ts` は変えない。統合先としてそのまま残す。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/context-precompact/settings/schema.test.ts .pi/extensions/context-precompact/settings/read.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `! grep -E 'thresholdRatio が下限未満|thresholdRatio が上限超過|keepRecentTokens が下限未満|JSON でなければ broken' .pi/extensions/context-precompact/settings/schema.test.ts`
  - `test "$(grep -c '壊れた JSON なら broken' .pi/extensions/context-precompact/settings/read.test.ts)" = 1`
- Added: なし

## 2.prepare の統合

### Types

なし

### Steps

1. `.pi/extensions/context-precompact/prepare/compare.test.ts`:
   - (boundary) `fileOps` の `read` だけが違う → `mismatch` の `fileOps` になる。
   - (boundary) `fileOps` の `written` だけが違う → `mismatch` の `fileOps` になる。
   - (boundary) `fileOps` の `edited` だけが違う → `mismatch` の `fileOps` になる。
   - 上の3本を、`it('fileOps のどれかが違えば mismatch の fileOps になる')` の1本に統合する。ダミーは `base()` から取る。
2. `.pi/extensions/context-precompact/prepare/prepare.test.ts`:
   - (happy) 前回の `fromHook` の `details` がある → `read` と `edited` に path が入る。
   - (empty) `fromHook` がない前回 → 追加の merge がない。
   - 上の2本を、`it('fromHook の details があるときだけ read と edited に path が入る')` の1本に統合する。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/context-precompact/prepare/compare.test.ts .pi/extensions/context-precompact/prepare/prepare.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `! grep -E 'fileOps.read だけ違えば|fileOps.written だけ違えば|fileOps.edited だけ違えば' .pi/extensions/context-precompact/prepare/compare.test.ts`
  - `test "$(grep -c 'fileOps のどれかが違えば' .pi/extensions/context-precompact/prepare/compare.test.ts)" = 1`
  - `! grep -E '前回の fromHook の details があれば|fromHook がない前回は' .pi/extensions/context-precompact/prepare/prepare.test.ts`
  - `test "$(grep -c 'fromHook の details があるときだけ' .pi/extensions/context-precompact/prepare/prepare.test.ts)" = 1`
- Added: なし

## 3.command の統合

### Types

なし

### Steps

1. `.pi/extensions/context-precompact/command/precompact.test.ts`:
   - `it('最後の行は status と statusLine の文面になる')` を削除する。統合先は `ui/status.test.ts` の `it('ready と applied に前後の数を渡すと桁区切りの 2 値が入る')` であり、同じ `statusLine` の分岐を確かめる。
   - 未使用になった `statusLine` と `StatusState` の import、`statuses()`、`statusOf()`、`REASON` を削除する。
2. `.pi/extensions/context-precompact/ui/status.test.ts` は変えない。統合先としてそのまま残す。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/context-precompact/command/precompact.test.ts .pi/extensions/context-precompact/ui/status.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `! grep -E '最後の行は status と statusLine の文面になる' .pi/extensions/context-precompact/command/precompact.test.ts`
  - `test "$(grep -c 'ready と applied に前後の数を渡すと桁区切りの 2 値が入る' .pi/extensions/context-precompact/ui/status.test.ts)" = 1`
- Added: なし

## 4.gate と index の統合

### Types

なし

### Steps

1. `.pi/extensions/context-precompact/gate/gate.test.ts`:
   - `it('比率がしきい値で prepared なら apply になる')` を削除する。統合先は `index.test.ts` の `it('次の turn_end で比率がしきい値なら draft が 1 件でき、chat に applied が出て lastApplied が残る')` であり、同じ apply の分岐を統合の側から確かめる。
   - `it('比率がしきい値で prepared でなければ start になる')` は残す。ちょうどしきい値で `prepared` でない境界を確かめる唯一のテストである。
2. `.pi/extensions/context-precompact/index.test.ts` の `it('/precompact の on と off と now は settings を書き換えバックグラウンドで準備を始める')` は分割しない。2つの振る舞いを1本で持つ。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/context-precompact/gate/gate.test.ts .pi/extensions/context-precompact/index.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `! grep -E '比率がしきい値で prepared なら apply' .pi/extensions/context-precompact/gate/gate.test.ts`
  - `test "$(grep -c '比率がしきい値で prepared でなければ start' .pi/extensions/context-precompact/gate/gate.test.ts)" = 1`
  - `test "$(grep -c '次の turn_end で比率がしきい値なら' .pi/extensions/context-precompact/index.test.ts)" = 1`
  - `test "$(grep -c '/precompact の on と off と now は settings を書き換え' .pi/extensions/context-precompact/index.test.ts)" = 1`
- Added: other — `pnpm test:run .pi/extensions/context-precompact` で件数を数え、106 から減った件数を ## Notes に書く

## Notes

### Slice 1: settings の削除と統合

- Findings: なし
- Unplanned: なし
- Commit: adba68d
- Stopped:

### Slice 2: prepare の統合

- Findings: なし
- Unplanned: なし
- Commit: 71b21ff
- Stopped:

### Slice 3: command の統合

- Findings: なし
- Unplanned: なし
- Commit: 18ce9eb
- Stopped:

### Slice 4: gate と index の統合

- Findings: なし
- Unplanned: なし
- Commit: 819d347
- Tests: 97件（106から9減）
- Stopped:

### Cleanup: 無効・不明の早期リターンの統合

- Findings: なし
- Unplanned: 同じ早期リターンの両側を確かめる3組を1本ずつに統合した（prepare の enabled と piEnabled、gate の enabled と piEnabled、gate の tokens null と contextWindow 0）。94件（97から3減）で緑。

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
