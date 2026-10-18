# PLAN `ex-include-tools`

## Files

```text
.pi/extensions/intent-router/
  settings/
    schema.ts                        update
    settings.json                    update
  state/
    payload.ts                       update
    payload.test.ts
    run.test.ts
  judge/
    hook.test.ts
  README.md                          update
```

## Slices

## 1.一覧と訳をこの環境の道具に合わせる

### Types

```ts
/** settings/schema.ts の既定 state.includeTools。この環境にある道具だけを並べる */
const includeTools: readonly string[] = [
  'read',
  'write',
  'quick_edit',
  'target_edit',
  'bash',
  'grep',
  'web_search',
  'fetch_content',
  'source_check',
  'get_search_content',
  'codemode',
  'consult_run',
  'consult_subagents',
];

/** state/payload.ts の targetOf に足す枝。道具 → 記録の target。同じ target の 2 回は 1 件に畳まれる */
// quick_edit / target_edit → input['path']
// fetch_content          → input['url']（無ければ input['urls'] の先頭）
// source_check           → input['claim']
// get_search_content     → input['responseId']
// consult_subagents      → input['action']
// codemode               → '' （1 回の束ねた呼び出しを 1 件として数える）
```

### Steps

1. `.pi/extensions/intent-router/settings/schema.ts`:
   - 既定の一覧を上の 13 個に差し替える（`edit` / `find` / `ls` はこの環境に無いので落ちる）
2. `.pi/extensions/intent-router/settings.json`:
   - `state.includeTools` を同じ 13 個にする
3. `.pi/extensions/intent-router/README.md`:
   - 設定の表の `state.includeTools` の行を同じ 13 個にする
4. `.pi/extensions/intent-router/state/payload.ts`:
   - `targetOf` に上の枝を足す（`read` / `write` の枝はそのまま。`edit` と `ls` の枝は消す）
5. `.pi/extensions/intent-router/state/payload.test.ts`:
   - `targetOf` の新しい枝のケースを足す
6. `.pi/extensions/intent-router/state/run.test.ts`:
   - 既定の一覧にある道具は `addAction` を通り、無い道具（`edit`）は通らないケースを足す

### Verify:

- `test`: `.pi/extensions/intent-router/state/payload.test.ts`、`pnpm vitest run .pi/extensions/intent-router/state`
  - (happy) `targetOf('fetch_content', { url: 'https://x' })` → `'https://x'`
  - (boundary values) `targetOf('fetch_content', { urls: ['https://a', 'https://b'] })` → `'https://a'`
  - (happy) `targetOf('quick_edit', { path: 'a.ts' })` と `targetOf('target_edit', { path: 'a.ts' })` → `'a.ts'`
  - (happy) `targetOf('source_check', { claim: 'c' })` → `'c'`、`targetOf('get_search_content', { responseId: 'r1' })` → `'r1'`、`targetOf('consult_subagents', { action: 'list' })` → `'list'`
  - (empty) `targetOf('codemode', { code: '...' })` → `''`
  - (error) `targetOf('fetch_content', {})` → `''`（url も urls も無い）
  - _no case_: 一覧の 13 個の中身 — plan が決めた値なので、ケースにならない

## 2.統合: 調べた往復が記録に載る

### Types

```ts
なし;
```

### Steps

1. `.pi/extensions/intent-router/judge/hook.test.ts`:
   - 新しい道具を記録に載せた往復で、Jev に渡す `latest` にその道具が出るケースを足す（`addAction` で種を入れる既存のやり方に合わせる）

### Verify:

- `test`: `.pi/extensions/intent-router/judge/hook.test.ts`、`pnpm vitest run .pi/extensions/intent-router/judge`
  - (happy) `fetch_content` の action を入れた往復 → Jev に渡る `latest` に `fetch_content` と url が出る
  - (happy) `codemode` の action を入れた往復 → `latest` に `codemode` が出る（target は空）
  - (happy) `quick_edit` の action を入れた往復 → `latest` に `quick_edit` と path が出る
  - (empty) action を 1 つも入れない往復 → `latest` は空のまま
  - (error) 一覧から落ちた `edit` の action を入れた往復 → `latest` に入らない
  - _no case_: `truncated` の枝 — この plan は渡す長さの上限を動かさない

## Notes

### Slice 1: 一覧と訳をこの環境の道具に合わせる

- Findings:
- Unplanned:
- Commit:

### Slice 2: 統合: 調べた往復が記録に載る

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
