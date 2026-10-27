# PLAN `ex-partial-group-validation`

## Files

```text
.pi/
  extensions/
    thinking-scrub/
      settings/
        schema.ts
        schema.test.ts          update
```

## Slices

## 1.partial-group-cases

### Types

```ts
なし;
```

### Steps

1. `.pi/extensions/thinking-scrub/settings/schema.test.ts`:
   - (happy) `{ "live": { "scanEvery": 3000 } }` を渡した場合 → `ok` になり、`tail` は既定値の `20000` になる。
   - (error) `{ "live": { "scanEvery": 30000 } }` を渡した場合 → `broken` になり、理由は `live.scanEvery` と `live.tail` の関係を示す。
   - (error) `{ "live": { "tail": 1000 } }` を渡した場合 → `broken` になり、理由は `live.scanEvery` と `live.tail` の関係を示す。
   - (error) `{ "char": { "minPeriod": 200 } }` を渡した場合 → `broken` になり、理由は `char.minPeriod` と `char.maxPeriod` の関係を示す。
   - (error) `{ "char": { "maxPeriod": 2 } }` を渡した場合 → `broken` になり、理由は `char.minPeriod` と `char.maxPeriod` の関係を示す。

### Verify

- Always:
  - `pnpm test:related <このスライスで変えたファイル>`。関連が無ければ `pnpm test:run`。
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `scanEvery` と `minPeriod` の検証の説明に古い表現がないことを、変えたファイルで大小無視して探し、残っていないこと。
- Added: なし

## Notes

### Slice 1: partial-group-cases

- Findings: なし
- Unplanned: なし
- Commit: 7970a6c consult(ex-partial-group-validation): add partial group validation cases
- Stopped:

## Review

### Round 1

- Stale:
  - なし — 新5件は題名と断定だけで旧文言を残さず、`.pi/extensions/thinking-scrub/settings/schema.test.ts:41-53` の両指定試しと `:59-68` の等値ok試しを矛盾させず、`.pi/extensions/thinking-scrub/settings/schema.ts:1-5` の注釈を陳腐化しない。
- Unlisted:
  - なし — `git diff HEAD~1..HEAD --stat` の変更は1件55行追加のみで、`.pi/extensions/thinking-scrub/settings/schema.test.ts:70-123` の追加と一致し Files の `update` どおりである。
- Gaps:
  - なし — Steps の5件は `.pi/extensions/thinking-scrub/settings/schema.test.ts:70-123` にそろい、sentence 群は関係検査を持たず（`.pi/extensions/thinking-scrub/settings/schema.ts:128-157`）、Added なしのため振る舞いの穴はない。
- Unproven:
  - なし — `.pi/extensions/thinking-scrub/settings/schema.ts:122-124` の live 関係検査や `:192-194` の char 関係検査を外せば各 broken 断定が落ち、既定併合を外せば `.pi/extensions/thinking-scrub/settings/schema.test.ts:78` の tail 既定断定が落ちるため名指す振る舞いは釘付けである。
- Noise:
  - なし — 数値と鍵名は Steps 決定値であり、関係 `<=` は型で決まらず（`.pi/extensions/thinking-scrub/settings/schema.ts:122,192`）、受理可否に直結するため形式の Test cases で裁く不要な断定はないことを `.pi/extensions/thinking-scrub/settings/schema.test.ts:70-123` で確かめた。
- Doubts:
  - なし — 残すほどの疑義はない。

## Acceptance

- Ran: `pnpm test:related .pi/extensions/thinking-scrub/settings/schema.test.ts`（16 件）、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`。Round 1 は所見なしのため直す点はない。
- Findings: なし
- Doubts: なし
