# PLAN `ex-delete-meaningless-test`

## Files

```text
.pi/extensions/consult/policy/
  types.test.ts           update
```

## Slices

## 1.意味のないテストの削除

### Types

なし

### Steps

1. `.pi/extensions/consult/policy/types.test.ts`:
   - `describe('stored types.json')` の `it('保存した review の指示 → 根拠をつけてくださいを含む')` を削除する。残るテストと import は変えない。

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `! grep -rn 'stored types.json' .pi/extensions/consult/policy/types.test.ts` (the command exits 0 when there is no match)
- Added: なし

## Notes

### Slice 1: 意味のないテストの削除

- Findings: なし
- Unplanned: 未使用になった `dirname` / `fileURLToPath` の import を削除し、末尾の空行を除去した（`pnpm lint` と `pnpm format:check` を緑にするため。Steps の「import は変えない」と矛盾するため、全体整合のために修正した）。
- Commit: 713ee2f
- Stopped:

### Cleanup: 重複・廃止のテストなし

対象の16件（`parseTypes` 11件、`loadTypes` 3件、`resolveType` 2件）を全読みして点検した。近い組はいずれも段違い・欄違いのため残した。通過系（`models`空、`paths`・`bash`空、`limits`正値）は対象欄と意図（空許容・空=全部・値の素通し）が違う。投げ系（`tools`空と未知ツール、`limits`なしと0以下とキー欠け、JSON壊れと未知type）は検証層（`minItems`・列挙・必須・最小値・構文・名引き）が違う。`turns`・`output`の2断言ずつも欄違いのため1件化しない。`loadTypes` 3件は再読込（毎回読む）・ENOENT文面（`restore it`）・権限文面（`could not read`かつ`committed`否定）で分岐が違う。`resolveType` 2件は未知投げと名前引きの表裏である。消えた振る舞いの検査は残っていないことを `types.ts` の現行分岐（object要求・`types`配列要求・非空要求・スキーマ照合・未知ツール・重複名）と突き合わせて確かめた。計画の変更（`stored`削除）は本番の分岐を消さないため3つ目の観点は該当なし。計画に `## Test cases` 節がないためGoal対応は該当なし。前提の再現（型・スキーマが決めるだけの確認）や誰も気づかないものもない。通過系はいずれも意図的許容の固定であり、投げ系はいずれも文面か欄で区別する。落とすものはない。

- Findings: なし
- Unplanned: なし

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
