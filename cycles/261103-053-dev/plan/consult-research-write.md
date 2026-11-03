# PLAN `consult-research-write`

- No: 03
- Place: base
- Boundary Plans: `adr-affected` (02) は、この plan が足す `research` ロールの書き込み用のツールと `paths`（`cycles/*/affected.md`）で、`affected.md` を書く。

## Files

```text
.pi/extensions/consult/
  types.json              update
  README.md               update
  sub/
    guard.test.ts         update
```

## Slices

## 1.research ロールの書き込みの許可

### Types

```ts
なし;
```

### Steps

1. `.pi/extensions/consult/types.json`:
   - update: `research` の `tools` に `edit`、`quick_edit`、`target_edit`、`write` を足す。
   - update: `research` の `paths` を `["cycles/*/affected.md"]` にする。

### Verify

- Always:
  - `pnpm test:run .pi/extensions/consult`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `test "$(grep -c '"paths": \["cycles/\*/affected.md"\]' .pi/extensions/consult/types.json)" = 1`
- Added: base の見た目: オーナーが `.pi/extensions/consult/types.json` の差分を読み、`research` の `tools` と `paths` が意図どおりであることを確かめ、その OK で閉じる。

## 2.README の Roles の表とテスト

### Types

```ts
なし;
```

### Steps

1. `.pi/extensions/consult/README.md`:
   - update: `Roles` の表の `research` の `Tools` に `edit`、`quick_edit`、`target_edit`、`write` を足す。
   - update: `review` の `Tools` に `bash` を足す。
   - update: `proofreader` の `Turns` を `60`、`Output tokens` を `100,000` に直す。
   - update: `trial` の `Turns` を `80` に直す。
2. `.pi/extensions/consult/sub/guard.test.ts`:
   - update: `cycles/261026-042-dev/design.md` のフィクスチャを `cycles/261026-042-dev/affected.md` に置き換える。
   - add: (happy) `cycles/010/affected.md` が `cycles/*/affected.md` に許される → `pathAllowed` が `true` を返す。
   - add: (happy) `write` に `cycles/010/affected.md` を渡す → `judgeToolCall` が `{}` を返す。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/consult/sub/guard.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `! grep -n 'design.md' .pi/extensions/consult/sub/guard.test.ts`
- Added: base の見た目: オーナーが `.pi/extensions/consult/README.md` と `.pi/extensions/consult/sub/guard.test.ts` の差分を読み、`Roles` の表と許可のテストが意図どおりであることを確かめ、その OK で閉じる。

## Notes

### Slice 1: research ロールの書き込みの許可

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 2: README の Roles の表とテスト

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
