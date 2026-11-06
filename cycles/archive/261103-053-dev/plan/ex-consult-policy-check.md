# PLAN `ex-consult-policy-check`

- Place: worktree
- Boundary Plans: なし（サイクルの plan はすべて終わっている）

## Files

```text
.pi/extensions/consult/
  policy/
    types.test.ts         update
  sub/
    guard.test.ts         update
```

## Slices

## 1. 実物の research と affected.md の許可を検査する

### Types

```ts
なし;
```

### Steps

1. `.pi/extensions/consult/policy/types.test.ts`:
   - update: 実物の `types.json` を読み、`research` の `tools` に `edit`・`quick_edit`・`target_edit`・`write` があり、`paths` が `["cycles/*/affected.md"]` であることを断言する検査を足す。
2. `.pi/extensions/consult/sub/guard.test.ts`:
   - update: `affected.md` のフィクスチャの存在と、`pathAllowed`・`judgeToolCall` の2件を断言する形に直す。

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -n 'affected.md' .pi/extensions/consult/policy/types.test.ts .pi/extensions/consult/sub/guard.test.ts`
  - 変更した全ファイルを通読し、矛盾、循環、重複、不足、不自然な流れがないか確かめる。ダメなら直し、`Unplanned` に書く。
- Added: なし

## Notes

### Slice 1: 実物の research と affected.md の許可を検査する

- Findings: なし
- Unplanned: なし
- Commit: 1bed4ac
- Stopped: なし

## Work Review

### Round 1

- Stale:
  - なし — 実物の `research` の許可を固定する変更で、古くなる文書・コメント・テストは残らない。`types.json` の `paths` は `cycles/*/affected.md` のままで (`.pi/extensions/consult/types.json:22`)、実ファイル言及の注釈 (`.pi/extensions/consult/sub/guard.ts:41`) とも矛盾しない。
- Unlisted:
  - なし — `git diff eb53bf9..1bed4ac --stat` の2件が `## Files` の2件 (`.pi/extensions/consult/policy/types.test.ts:107`、`.pi/extensions/consult/sub/guard.test.ts:25`) と一致し、計画外ファイルの変更はない。
- Gaps:
  - なし — `Steps` の2件 (実物 `research` の `tools`・`paths` 断言、fixture 存在と `pathAllowed`・`judgeToolCall` の2件) はいずれも差分にある (`.pi/extensions/consult/policy/types.test.ts:111`、`.pi/extensions/consult/sub/guard.test.ts:137`)。
- Unproven:
  - なし — `tools` から1件欠ければ `arrayContaining` が赤になり (`.pi/extensions/consult/policy/types.test.ts:111`)、`paths` を変えれば完全一致が赤になり (`.pi/extensions/consult/policy/types.test.ts:114`)、`patterns` を変えれば `pathAllowed` と `write` の `judgeToolCall` が赤になる (`.pi/extensions/consult/sub/guard.test.ts:138`)。
- Noise:
  - なし — 固定文字列 (`research`、`cycles/*/affected.md`、`edit` 等) は plan と実物 `types.json` の決定値であり (`format.md` の `## Test cases` により所見にしない)、重複検査や型が決める前提の再掲はない (`.pi/extensions/consult/policy/types.test.ts:107`)。
- Doubts:
  - なし — なお `arrayContaining` は余分な道具の追加を許すが (`.pi/extensions/consult/policy/types.test.ts:111`)、plan が「あり」と決めた containing 検査のため所見にしない。`affected.md` 側は `write` の1件で代表しており (`.pi/extensions/consult/sub/guard.test.ts:141`)、同一 `WRITE_TOOLS` 経路のため (`.pi/extensions/consult/sub/guard.ts:219`) 追加検査を求めない。

## Acceptance

- Ran: `pnpm test:run`（732テスト、マージ後）、`pnpm typecheck`（root と .pi）、`pnpm lint`、`pnpm format:check`、`grep -n 'affected.md' .pi/extensions/consult/policy/types.test.ts .pi/extensions/consult/sub/guard.test.ts`、変更した2ファイルの通読。
- Findings: なし
- Doubts: なし
