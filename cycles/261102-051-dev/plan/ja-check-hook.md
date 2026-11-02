# PLAN `ja-check-hook`

- No: 03

## Files

```text
lefthook.yaml                update
scripts/
  checks/
    ja-check.mjs
    ja-check.test.ts
  harness/
    harness.json
    collect/
      index.mjs
    diff/
      index.mjs
    index.mjs
  product-ready/
    targets.mjs
package.json
```

## Slices

## 1.ja-check ジョブ

### Types

```ts
なし;
```

### Steps

1. `lefthook.yaml`:
   - `pre-commit` の `checks` グループの 5 番目に `ja-check` ジョブを足し、`glob: '*'`、`run: node scripts/checks/ja-check.mjs {staged_files}`、`stage_fixed: false` を設定し、`fail_text` とルートの `output` は足さず、`parallel: true` は変えない。
     - Outside: `lefthook` と `製品のハーネス`。`{staged_files}` を `lefthook` に渡し、空のときはスキップさせ、`harness.json` の `copy` で製品へ配られるようにする。

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -rniE 'ja-check' --exclude-dir=node_modules --exclude-dir=cycles .` が `lefthook.yaml`、`scripts/checks/ja-check.mjs`、`scripts/checks/ja-check.test.ts` だけを返す。
- Added:
  - `lefthook validate` が成功する。
  - `warn` の語（`骨`）を含む `.md` をステージして `lefthook run pre-commit` を実行し、`ja-check` ジョブが成功して固定行が出ることと、`error` の語（`雛形`）を含む `.md` では `ja-check` ジョブが失敗して固定行が出ることを確かめる。
  - `node -e` で `scripts/harness/harness.json` の `copy` に `lefthook.yaml` があり、`lefthook.yaml` に `ja-check` ジョブがあることを確かめる。
  - `lefthook.yaml` の `checks` グループの 5 番目に `ja-check` ジョブがあり、`parallel: true` のままで、ルートに `output` がないことを確かめる。

## Notes

### Slice 1: ja-check ジョブ

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
