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

- Findings: なし
- Unplanned: なし
- Commit: 1efac90

### Slice 2: 統合: 調べた往復が記録に載る

- Findings: なし
- Unplanned: なし
- Commit: 07b4a1b

## Review

### Round 1

- Stale: なし — 旧一覧の edit と ls が訳の枝から消え文書と検証に残っていないことを確かめた。find 枝は残るが計画の消す対象外であり独自設定で戻せるため古くなった記述ではない。確認は .pi/extensions/intent-router/state/payload.ts:31 と .pi/extensions/intent-router/settings/schema.ts:273 と .pi/extensions/intent-router/settings.json:62 と .pi/extensions/intent-router/README.md:55 と .pi/extensions/intent-router/state/payload.test.ts:51 と .pi/extensions/intent-router/state/run.test.ts:105 と .pi/extensions/intent-router/judge/hook.test.ts:453
- Unlisted: なし — 差分の7件が Files の7件と一致し plan md の差分は Notes の記録だけであることを確かめた。README 表の空白揃えは同一行更新に伴う整形であり別振る舞いではない。確認は .pi/extensions/intent-router/README.md:29 と .pi/extensions/intent-router/settings/schema.ts:269 と .pi/extensions/intent-router/state/payload.ts:23
- Gaps: なし — Slice1 の6件と Slice2 の5件が各検証に対応することを確かめた。fetch_content の url と urls 先頭と空、quick_edit と target_edit、調べ物3件、codemode 空、judge の3件と空と edit 除外がいずれも対応する。確認は .pi/extensions/intent-router/state/payload.test.ts:61 と .pi/extensions/intent-router/state/run.test.ts:105 と .pi/extensions/intent-router/judge/hook.test.ts:454
- Unproven: なし — 新しい検証が壊れた振る舞いで赤になることを確かめた。fetch_content と quick_edit と target_edit と調べ物3件は枝を外すと期待値と食い違う。run の edit 除外と judge の3件は一覧漏れで要求件数が変わり失敗する。codemode 空と空入力の空は既定空と同じ値になるが観測値が変わらないため指摘にしない。確認は .pi/extensions/intent-router/state/payload.test.ts:66 と .pi/extensions/intent-router/state/run.test.ts:113 と .pi/extensions/intent-router/judge/hook.test.ts:458
- Doubts:
  - codemode 空判定は既定の空と同じ値のため分岐の有無を区別しない。観測値が同じであり計画の空の期待どおりなので指摘にしない。該当は .pi/extensions/intent-router/state/payload.ts:60 と .pi/extensions/intent-router/state/payload.test.ts:77 と .pi/extensions/intent-router/judge/hook.test.ts:462
  - find 枝が残るのは計画の消す対象が edit と ls のみであり独自設定で find を戻せるため残置が妥当と判断した。該当は .pi/extensions/intent-router/state/payload.ts:40
  - run.test の循環は一覧中身を固定しないが計画が一覧中身を決めた値として対象外にしており judge の代表3件で絞りを裏付けるため指摘にしない。該当は .pi/extensions/intent-router/state/run.test.ts:106
  - README 表全体の空白揃えは同一行更新に伴う整形であり意味は変わらないため指摘にしない。該当は .pi/extensions/intent-router/README.md:29

## Acceptance

- Ran:
  - plan の検査: `pnpm vitest run .pi/extensions/intent-router/state` → 33 件が緑、`pnpm vitest run .pi/extensions/intent-router/judge` → 36 件が緑
  - `pnpm vitest run .pi/extensions/intent-router` → 12 ファイル / 153 件が緑
  - `pnpm test:run` → 41 ファイル / 651 件が緑
  - `pnpm typecheck` → ルートと `.pi` とも ok
  - `pnpm lint` → 緑
  - 壊して赤を確かめた 3 件（同時に入れた）:
    - `state/payload.ts` の `fetch_content` の訳を空に → `targetOf` と judge の `fetch_content` の 2 件が赤
    - `settings/schema.ts` の既定から `codemode` と `consult_run` を落とす → 既定の一致と一覧の 2 件が赤
    - `state/run.ts` の絞りを外す → 一覧に無い道具の除外の 4 件が赤
    - 3 件で合わせて 7 件が赤になり、戻すと緑に復帰
- Findings:
  - なし
- Doubts:
  - なし
