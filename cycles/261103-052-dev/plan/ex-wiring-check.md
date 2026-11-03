# PLAN `ex-wiring-check`

- Place: worktree

## Files

```text
.pi/extensions/consult/
  index.test.ts                  update
```

## Slices

## 1.入口の配線を確かめる

### Types

なし

### Steps

1. `.pi/extensions/consult/index.test.ts`:
   - `vi.mock('./run/worktree.ts', …)` で `topLevel`・`consultRoot`・`cleanWorktrees` をテスト用に置き換え、デフォルト export を呼んでも git を起動しないようにする。
   - (happy) 偽の `ExtensionAPI` を渡してデフォルト export を呼ぶ → `registerMessageRenderer` が `'consult'` と `renderNotice` を受け取る。
   - 偽物の型アサーションに、理由を書いた抑制コメントを付ける。`ExtensionAPI` は 30 以上のメンバーを持ち、偽物をすべて実装する価値がないこと、このテストが確かめるのは配線だけであることを日本語で書く。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/consult/index.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -ri` で `registerMessageRenderer` を探し、古い説明が残っていないことを確かめる
- Added:
  - `.pi/extensions/consult/index.ts` の `registerNotice(pi)` の行を消して、新しいテストが赤になることを確かめ、戻す。

## Notes

### Slice 1: 入口の配線を確かめる

- Findings: なし
- Unplanned: なし
- Commit: 2b2859f consult(ex-wiring-check): verify entry registers notice renderer
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
