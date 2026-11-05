# PLAN `ex-exclude-test-cases`

- Place: worktree
- Boundary Plans: なし

## Files

```text
scripts/checks/ja-check.test.ts   update
```

## Slices

## 1.excludeの事例を1か所にまとめ、`./` 付きの事例を足す

### Types

なし

### Steps

1. `scripts/checks/ja-check.test.ts`:
   - update: `describe('ja-check exclude')` の中で、既存の happy 4 件の直後に、`./` 付きの事例を置く。
   - update: (happy) excludeがROADMAP.mdで引数が./ROADMAP.md → 報告せずexit 0
   - update: `exclude` の検証 3 件（`(error) excludeのない設定`、`(error) excludeが配列でない設定`、`(error) excludeの要素が文字列でない設定`）を `describe('ja-check exclude')` の末尾に移し、2 つ目の `describe('ja-check')` から消す。
   - update: (error) `exclude` のない設定 → header の 2 行を出して exit 1
   - update: (error) `exclude` が配列でない設定 → header の 2 行を出して exit 1
   - update: (error) `exclude` の要素が文字列でない設定 → header の 2 行を出して exit 1

### Verify

- Always:
  - `pnpm test:related scripts/checks/ja-check.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep` ツールで `describe(` を `scripts/checks/ja-check.test.ts` から検索し、`describe('ja-check exclude')` の行から次の `describe(` の行までの間に `it(` が 8 件あり、その並びが happy 5 件のあとに error 3 件であることを確かめる。
  - 変更したすべてのファイルを通読し、矛盾、循環、重複、不足、不自然な流れがないか確かめる。
- Added: なし

## Notes

### Slice 1: excludeの事例を1か所にまとめ、`./` 付きの事例を足す

- Findings:
  - なし
- Unplanned:
  - なし
- Commit:
  - a56d8e0 consult(ex-exclude-test-cases): group exclude cases and add dot-slash case
- Stopped:
  - なし

## Work Review

### Round 1

- Stale: なし — 旧配置を示す文書・コメントはなく、移動で冗長になる文もないことを確かめた（scripts/checks/ja-check.test.ts:1-8、scripts/checks/ja-check.test.ts:290-389）。
- Unlisted: なし — コード差分はFiles指定の1件のみで、plan mdの7→8件修正はVerifyの自己訂正でありFilesの対象外であることを確かめた（cycles/261105-055-dev/plan/ex-exclude-test-cases.md:37、scripts/checks/ja-check.test.ts:343-388）。
- Gaps: なし — 新規happyの`./`除外と移動したerror 3件の振る舞いはSteps通りに検査され、Verifyの8件・happy 5件＋error 3件の数え方とも一致することを確かめた（scripts/checks/ja-check.test.ts:343-388、cycles/261105-055-dev/plan/ex-exclude-test-cases.md:30-39）。
- Unproven: なし — `./`正規化（scripts/checks/ja-check.mjs:102-114）を壊せば新規happyが、`exclude`検証（scripts/checks/ja-check.mjs:58-77）を壊せば対応するerrorが、それぞれ赤くなることを実装と照合して確かめた（scripts/checks/ja-check.test.ts:343-388）。
- Noise: なし — `ROADMAP.md`・`./ROADMAP.md`・header 2行・exit 0/1はいずれも計画が決めた値であり、型やスキーマが保証する前提の再現や魔数・決め打ちの新規導入はないことを確かめた（scripts/checks/ja-check.test.ts:343-388）。
- Doubts: なし

## Acceptance

- Ran:
  - `pnpm test:related scripts/checks/ja-check.test.ts` — 33 件が通過。
  - `pnpm test:run` — 63 ファイル、762 件が通過。
  - `pnpm typecheck` — `root: ok`、`.pi: ok`。
  - `pnpm lint` と `pnpm format:check` — 通過。
  - `grep` ツールで `describe(` を `scripts/checks/ja-check.test.ts` から検索し、`describe('ja-check exclude')`（290 行）から次の `describe(`（391 行）までの間に `it('` が 8 件（291、304、317、330、343、356、370、380 行）あり、happy 5 件のあとに error 3 件であることを確かめた。
  - 2 つ目の `describe('ja-check')` から `exclude` の検証が消えていることを、同じ検索結果で確かめた。
  - 差分を通読した。移した 3 件は題名と期待結果が変わらず、新しい 1 件は引数 `./ROADMAP.md` で終了コード 0 と `No findings` を確かめる。振る舞いを変えないテストだけの変更なので、壊して赤になるかの確認は行わない。
- Findings: なし
- Doubts: なし
