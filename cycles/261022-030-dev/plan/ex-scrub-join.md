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

- Findings:
- Unplanned:
- Commit:

### Slice 2: ヘッダを実際の配線に合わせる

- Findings:
- Unplanned:
- Commit:

### Slice 3: 統合: lint の自動修正で壊れない

- Findings:
- Unplanned:
- Commit:

## Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Unproven:
- Doubts:

## Acceptance

- Ran:
- Findings:
- Doubts:
