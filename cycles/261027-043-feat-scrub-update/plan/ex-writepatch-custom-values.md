# PLAN `ex-writepatch-custom-values`

## Files

```text
.pi/
  extensions/
    thinking-scrub/
      index.ts
      index.test.ts            update
```

## Slices

## 1.custom-keys-kept

### Types

```ts
なし;
```

### Steps

1. `.pi/extensions/thinking-scrub/index.test.ts`:
   - (happy) 独自のトップレベルキーと独自の `live` 内キーを持つ `settings.json` に `command off` を当てた場合 → 完全なファイルに独自キーが残り、`enabled` が `false` になる。
   - (happy) 独自キーを持つ `settings.json` に `command on` を当てた場合 → 完全なファイルに独自キーが残り、`enabled` が `true` になる。

### Verify

- Always:
  - `pnpm test:related <このスライスで変えたファイル>`。関連が無ければ `pnpm test:run`。
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `writePatch` と `mergeGroup` と独自キーの説明に古い表現がないことを、変えたファイルで大小無視して探し、残っていないこと。
- Added: なし

## Notes

### Slice 1: custom-keys-kept

- Findings: なし
- Unplanned: `index.test.ts` が `max-lines`（960）に触れたため、off/on の 2 試しを 1 つの loop 試しに統合。
- Commit: e7c4a24 consult(ex-writepatch-custom-values): keep custom keys across off/on
- Stopped:

## Review

### Round 1

- Stale:
  - なし — `.pi/extensions/thinking-scrub/index.test.ts:979` の追加は題名と断定だけで旧文言を残さず、`writePatch` と `mergeGroup` と独自キーの旧説明は変えたファイルに残らないことを `git diff 5389c41..HEAD` で確かめた。
- Unlisted:
  - `.pi/extensions/thinking-scrub/settings/read.ts:4` の注釈1行は Files が名指す `index.test.ts` でも `index.ts` でもなく、別計画 `ex-settings-read-comment` の変更である。
    - left: `git diff 5389c41..HEAD` に現れない既確定の別計画（`5389c41`）の変更であり、本計画の範囲外のため直さない。
  - `cycles/261027-043-feat-scrub-update/plan/ex-settings-read-comment.md:44` の Slice 記録と Review・Acceptance の追記は Files が名指す範囲外であり、本計画の Slice と無関係である。
    - left: `git diff 5389c41..HEAD` に現れない既確定計画の記録であり、本計画の範囲外のため直さない。
- Gaps:
  - なし — Steps の off/on の2件は `.pi/extensions/thinking-scrub/index.test.ts:979-1003` の loop 試しにあり、Added がなしのため振る舞いの穴はないことを確かめた。
- Unproven:
  - なし — `.pi/extensions/thinking-scrub/index.ts:99-104` の `...doc` や `mergeGroup` の `...docRecord` を外せば `.pi/extensions/thinking-scrub/index.test.ts:996-1000` の `customTop` と `customLive` の断定が落ちるため、名指す振る舞いは釘付けである。
- Noise:
  - なし — `off` と `on` と `enabled` は仕様の値であり、`customTop` と `customLive` と `kept` は入力の反復であり、`now: () => 7` は断定でないため、形式の Test cases で裁く魔法数・固定文字列・型済み前提の断定はないことを `.pi/extensions/thinking-scrub/index.test.ts:979-1000` で確かめた。
- Doubts:
  - `.pi/extensions/thinking-scrub/index.ts:102-103` の `sentence` と `char` の独自キーや `show`/`hide` 経路の独自キー保持は本試しが触れず、範囲外のため所見に留める。
  - `cycles/261027-043-feat-scrub-update/plan/ex-settings-read-comment.md:56` の「1行のみ」の記述は `git diff 16ef38c..HEAD` では3件になるが、当該計画は既に確定済み（`5389c41`）のため本計画では直さない。

## Acceptance

- Ran: `pnpm test:related .pi/extensions/thinking-scrub/index.test.ts`（36 件）、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`。Round 1 の `Unlisted` 2 件は既確定の別計画の変更のため `left` のままとし、直す点はない。
- Findings: なし
- Doubts: `.pi/extensions/thinking-scrub/index.ts:102-103` の `sentence` と `char` の独自キーや `show` と `hide` の経路の独自キー保持は本計画の範囲外のため残す。
