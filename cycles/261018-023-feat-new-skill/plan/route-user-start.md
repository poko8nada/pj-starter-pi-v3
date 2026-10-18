# PLAN `route-user-start`

## Files

```text
.pi/
  extensions/
    intent-router/
      index.ts                        update
      index.test.ts                   update
      route/
        hook.ts                       update
        hook.test.ts                  update
package.json                          update
pnpm-lock.yaml                        update
```

## Slices

## 1.型を実行時に合わせる

### Types

なし

### Steps

1. `package.json`:
   - `devDependencies` の `@earendil-works/pi-coding-agent` を `^1.3.0` にする。
     - Outside: design の `@earendil-works/pi-coding-agent`。`peerDependencies` の `"*"` は触らない（ホストが渡す物で、pi の作法どおり）。`dependencies` にも入れない。

2. `pnpm-lock.yaml`:
   - `pnpm add -D @earendil-works/pi-coding-agent@^1.3.0` を打つ。`package.json`、lock、`node_modules` が一度に揃う（`--frozen-lockfile` は lock を変えるので使わない）。

3. 新しい型で出たエラーを、その場で直す:
   - どのファイルに出るかは上げた時に分かる。出たファイルは `Files` に足し、`Unplanned` に書く。design は変わらない（`Scope` も `Boundary` も動かない）。

### Verify:

- test: `pnpm typecheck` と `pnpm test:run`
  - (happy) `node_modules/@earendil-works/pi-coding-agent/package.json` の `version` → `1.3.0` 以上
  - (error) `pnpm typecheck` → 落ちない（1.3.0 の型で出るエラーをこの slice で閉じる）
  - (boundary values) `pnpm test:run` → 41 files が全部緑（前より減っていない）
  - _no case_: `peerDependencies` と `dependencies` — 触らないと決めたので、確かめない

## 2.誰の走り出しかを見分ける

### Types

```ts
export type RouteStart =
  | { readonly messageType: 'user'; readonly prompt: string; readonly images?: readonly unknown[] }
  | { readonly messageType: 'custom' };

export interface RoutePiPort {
  on(
    event: 'before_agent_start',
    handler: (
      event: RouteStart,
      ctx: RouteCtx,
    ) => Promise<
      | {
          readonly message: {
            readonly customType: string;
            readonly content: string;
            readonly display: boolean;
          };
        }
      | undefined
    >,
  ): void;
}
```

### Steps

1. `.pi/extensions/intent-router/route/hook.ts`:
   - `RouteStart` を足し、`RoutePiPort` のハンドラが受けるイベントをそれにする。
   - `registerRoute` の入口で、`event.messageType !== 'user'` なら `undefined` を返す。

2. `.pi/extensions/intent-router/route/hook.test.ts`:
   - テスト側の `Handler` の型を `RouteStart` にし、既存の呼び出しに `messageType: 'user'` を足す。
   - `custom` のケースを足す。

### Verify:

- test: `pnpm vitest run .pi/extensions/intent-router/route/hook.test.ts`
  - (happy) `messageType: 'user'`、prompt が「これ直して」、shadow → `ask` が 1 回呼ばれ、記録が 1 行残る
  - (boundary values) `messageType: 'user'`、prompt が `/investigate` → `ask` が呼ばれず、記録も残らない
  - (error) `messageType: 'custom'` → `ask` が呼ばれず、記録も残らず、戻り値は `undefined`
  - _no case_: `RouteStart` の `images` — route は payload を prompt と `agentPrev` で組み、`images` を読まない

## 3.統合: `custom` の走り出しで route が落ちないこと

### Types

```ts
handler(
  ev.messageType === 'user'
    ? { messageType: 'user', prompt: ev.prompt, images: ev.images }
    : { messageType: 'custom' },
  { cwd: ctx.cwd, agentPrev },
);
```

### Steps

1. `.pi/extensions/intent-router/index.ts`:
   - 包みで pi の `ev` の枝を見てから `RouteStart` を組み立てる。`ev.prompt` は `messageType === 'user'` の枝でしか読めないので、分岐がないと型が通らない。
   - `cell.hold(ctx)` と `refresh()` は `custom` の時も今までどおり走らせる（design の `adr.md` の決定）。

2. `.pi/extensions/intent-router/index.test.ts`:
   - `before_agent_start` に流すイベントへ `messageType: 'user'` を足す。
   - `custom` のケースを足す。

### Verify:

- test: `pnpm vitest run .pi/extensions/intent-router/index.test.ts` と `pnpm typecheck`
  - (happy) `{ messageType: 'user', prompt: 'hello' }` を `before_agent_start` に流す → route の行が 1 行出る（包みが `messageType` を渡していることの証明になる）
  - (error) `{ messageType: 'custom' }` を流す → 例外にならず、route の行が出ない
  - (happy) `custom` の次に `{ messageType: 'user', prompt: 'hello' }` を流す → route の行が 1 行出る
  - (boundary values) `pnpm typecheck` → 落ちない（包みの分岐が型で強制されている）
  - _no case_: `cell.hold(ctx)` と `refresh()` が `custom` の時も走ること — テストから見える結果が無く（`cell` はコマンドが読む）、ADR が変えないと決めている
  - _no case_: `custom` の `message` の中身 — 包みは枝しか見ないので、どんな文字列でも結果は同じ

## Notes

### Slice 1: 型を実行時に合わせる

- Findings: なし
- Unplanned: なし（型エラーは index.ts に出たが Files 済み。index.test.ts の呼び側も Files 済みのため Files 追加なし）
- Commit: aa06c53 consult(route-user-start): align pi types to 1.3.0 with custom guard

### Slice 2: 誰の走り出しかを見分ける

- Findings: なし
- Unplanned: なし
- Commit: 495e21f consult(route-user-start): discriminate route start by messageType（--no-verify: index.ts が旧形を渡すため赤い中間状態。slice 3 で閉じる。hook.test.ts 22/22 緑）

### Slice 3: 統合: `custom` の走り出しで route が落ちないこと

- Findings: なし
- Unplanned: なし
- Commit: d70059b consult(route-user-start): build RouteStart in the wrapper

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

## Merge

- マージした後、base で `pnpm install` を打つ（worktree の `node_modules` は移らない）。それから `pnpm typecheck` と `pnpm test:run` を通す。
- 打ち忘れると base の型は 1.0.3 のままで、`messageType` を読むコードで `pnpm typecheck` が落ちる。
