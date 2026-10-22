# PLAN `ex-scrub-join`

## Files

```text
.pi/
  extensions/
    thinking-scrub/
      index.ts                      update
      scrub/
        detect.ts                   update
```

## Slices

## 1.繋ぎ目の判断を純関数に切り出し、2 つの枝を 1 つにする

### Types

```ts
/** 消した区間が含んでいた改行のうち、いちばん強いもの。含まなければ undefined */
export function separatorFor(removed: string): string | undefined;
```

### Steps

1. `.pi/extensions/thinking-scrub/scrub/detect.ts`:
   - `separatorFor` を足す。`\n\n` を含むなら `\n\n`、`\n` だけを含むなら `\n`、どちらも含まなければ `undefined` を返す。
   - `scrubThinking` の、`\n\n` の枝と `\n` の枝を 1 つにまとめ、`separatorFor` を 1 回だけ呼ぶ。両側のどちらかが空なら繋がずに詰める。
   - 判定を `removedText.includes(...)` で書き、`indexOf(...) >= 0` の回避を消す。

### Verify:

- test: `pnpm vitest run --config vitest.starter.config.ts .pi/extensions/thinking-scrub`
  - (happy) `foo` + `\n\nThe **` × 5 + `bar` → `foo\n\nbar`
  - (happy) `foo ` + `\n\nThe **` × 5 + ` bar` → `foo\n\nbar`（両側の空白は残らない）
  - (happy) `foo` + `\nabcd` × 12 + `bar` → `foo\nbar`
  - (happy) `foo` + `the *` × 5 + `bar` → `foo bar`（区間が改行を含まない）
  - (happy) `separatorFor('\n\n')` → `'\n\n'`、`separatorFor('a\nb')` → `'\n'`、`separatorFor('ab')` → `undefined`
  - (boundary values) `separatorFor('\n\n\n')` → `'\n\n'`
  - (empty) `separatorFor('')` → `undefined`
  - (boundary values) 区間が本文の先頭にある（左が空）→ 詰めるだけで、改行を足さない

## 2.ヘッダを実際の配線に合わせる

### Types

```ts
なし;
```

### Steps

1. `.pi/extensions/thinking-scrub/index.ts`:
   - ヘッダを、`message_end` で畳み、実行の終わりに合計を 1 行で報告し、`/thinking-scrub` で scrub と表示を切り替える、という実際の配線に合わせる。

### Verify:

- read: `code` サブエージェントが `.pi/extensions/thinking-scrub/index.ts` のヘッダを読み、次を報告する。書き換えたあとに読む。
  - (happy) `message_end` で畳む → 報告に挙がる
  - (happy) 実行の終わり（`agent_end`）に合計を 1 行で報告する → 報告に挙がる
  - (happy) `/thinking-scrub` で scrub と表示を切り替える → 報告に挙がる
  - (error) どれかがヘッダに無い → 報告でその点が「書かれていない」と挙がる

## 3.統合: lint の自動修正で壊れない

### Types

```ts
なし;
```

### Steps

1. `.pi/extensions/thinking-scrub/scrub/detect.ts`:
   - 自動修正のあとに何も変わらないことを確かめる。変更が要るなら、`separatorFor` の受け手の形を見直す。

### Verify:

- cli: `.pi/extensions/thinking-scrub` に対して `pnpm exec oxlint --fix` をかけ、そのあとの `git status --short` を読む。
  - (happy) 修正前後で差分が出ない → `git status --short` の出力が空
  - (error) 差分が出る → `git diff` の中身を報告し、受け手の形を直す

## Notes

### Slice 1: 繋ぎ目の判断を純関数に切り出し、2 つの枝を 1 つにする

- Findings: なし
- Unplanned: 右が空（区間が本文末尾）の枝のテストを足した。planのVerifyは左のみで、Round 1のDoubtで見つけた穴のため。
- Commit: 3957265

### Slice 2: ヘッダを実際の配線に合わせる

- Findings: なし
- Unplanned: なし
- Commit: 67e20aa

### Slice 3: 統合: lint の自動修正で壊れない

- Findings: なし
- Unplanned: なし
- Commit: なし（`pnpm exec oxlint --fix .pi/extensions/thinking-scrub` で差分なしのため commit なし）

## Review

### Round 1

- Stale: なし
- Unlisted: なし
- Gaps:
  - `separatorFor` の直呼び happy 3 件 (`'\n\n'`→`'\n\n'`、`'a\nb'`→`'\n'`、`'ab'`→`undefined`)を運動するテストが無い。`detect.test.ts` は `detectRuns, scrubThinking` のみ import し `separatorFor` に触れない — `.pi/extensions/thinking-scrub/scrub/detect.test.ts:2` / `cycles/261022-030-dev/plan/ex-scrub-join.md:39` / `.pi/extensions/thinking-scrub/scrub/detect.ts:128`
    - fixed: separatorForの直呼び3件をdetect.test.tsのseparatorFor describeに足し、importにseparatorForを加えた。
  - `separatorFor('\n\n\n')`→`'\n\n'` と `separatorFor('')`→`undefined` の boundary/empty がテストに無い — `cycles/261022-030-dev/plan/ex-scrub-join.md:40` / `cycles/261022-030-dev/plan/ex-scrub-join.md:41` / `.pi/extensions/thinking-scrub/scrub/detect.test.ts:2`
    - fixed: separatorForのboundary/empty2件を同じdescribeに足した。
  - 区間が本文先頭（左が空）のとき詰めるだけで改行を足さない、のテストが無い。`left.length === 0` の枝を運動しない — `.pi/extensions/thinking-scrub/scrub/detect.ts:163` / `cycles/261022-030-dev/plan/ex-scrub-join.md:42`
    - fixed: 区間が本文先頭のケース（ブロック+bar→bar）をscrubThinkingに足し、left.length===0の枝を運動させた。
  - 両側に空白（`foo ` + 区間 + ` bar` → `foo\n\nbar`）のテストが無い。既存は左のみ・右のみの別テストだけで両側同時は無い — `.pi/extensions/thinking-scrub/scrub/detect.test.ts:134` / `.pi/extensions/thinking-scrub/scrub/detect.test.ts:141` / `cycles/261022-030-dev/plan/ex-scrub-join.md:36`
    - fixed: 両側空白のケース（foo +区間+ bar→foo\n\nbar）をscrubThinkingに足した。
- Unproven: なし
- Doubts:
  - 右が空（区間が本文末尾）の `right.length === 0` の枝もテストが無いが、Verify は左のみを挙げる。右も要るのかは plan からは不明 — `.pi/extensions/thinking-scrub/scrub/detect.ts:163` / `cycles/261022-030-dev/plan/ex-scrub-join.md:29`
    - fixed: 右が空のケース（foo+ブロック→foo）をscrubThinkingに足し、right.length===0の枝を運動させた。Notes Slice 1にUnplannedとして記録した。
  - Slice 2/3 の `read`/`cli` チェックの実行証跡は diff からは読めないが、Notes の記載を疑う根拠は無いため finding にしない。`look`/`use` 系は対象外とした — `cycles/261022-030-dev/plan/ex-scrub-join.md:59` / `cycles/261022-030-dev/plan/ex-scrub-join.md:80`

## Acceptance

- Ran:
- Findings:
- Doubts:
