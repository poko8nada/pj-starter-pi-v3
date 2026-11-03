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
  - なし — 既存の flushPending・startTick・stopTick・reload テストは place() を placeFor で直接作り mock 対象の3関数を通らないため壊れず、頭注と README に矛盾も生じない（.pi/extensions/consult/index.test.ts:14-22,85-235）。
- Unlisted:
  - なし — 差分は Files の1件（.pi/extensions/consult/index.test.ts）のみで、plan md の Notes 記入は定型の記録である。
- Gaps:
  - なし — mock の3関数・happy の登録 assertion・抑制コメントと日本語理由はいずれも Steps 通りで、registerNotice(pi) を消せば received が空になり赤になる（.pi/extensions/consult/index.test.ts:237-252）。
- Unproven:
  - なし — assertion は関数同一性で [['consult', renderNotice]] を確かめるため、行削除・型名変更・別関数登録のいずれも赤になる（.pi/extensions/consult/index.test.ts:251）。
- Noise:
  - なし — 'consult' は .pi/extensions/consult/view/notice.ts:180 が決めた契約値で plan が指名した期待値であり、魔数や重複前提はない。
- Doubts:
  - close.md が worktree に存在せず補足の出どころ（## Triage の3行）を読めなかったため、ex- の No の出所の確認は close に残る。
  - 検査を実行できなかった（pnpm test:related が subagent-guard で拒否）ため、既存テストの無破損と Added の赤確認は読了照合だけであり、実行の確認は acceptance・close に残る。

## Acceptance

- Ran:
  - `pnpm test:related .pi/extensions/consult/index.test.ts` — 10件通過。
  - `pnpm typecheck` — `root: ok`、`.pi: ok`。
  - `pnpm lint` — 指摘なし。
  - `pnpm format:check` — 整形済み。
  - `grep -ri registerMessageRenderer` — `view/notice.ts:175`、`view/notice.ts:180`、`index.test.ts:244`、`view/notice.test.ts:205`。古い説明はない。
  - 全体: `pnpm test:run` — 64ファイル、727件すべて通過。
  - 振る舞いを壊して赤になるか: `.pi/extensions/consult/index.ts` の `registerNotice(pi)` を消す → 新テスト1件が赤。戻して10件が緑になったことを確かめた。
- Findings:
  - なし — レビューが実行できなかった検査（`pnpm test:related`）は、ここで実行して確かめた。
- Doubts:
  - `close.md` がワークツリーに無いため、`ex-` の `No`（`ADR 02`）の出所は close で確かめる。
