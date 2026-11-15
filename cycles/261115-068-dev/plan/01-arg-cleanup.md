# PLAN `arg-cleanup`

- No: 01
- Place: worktree
- Boundary Plans: なし

## Goal

thinking-scrub の実装から読まれない引数が消える。

## Design

- Inside:
  - Modules: なし。`runCommand` と `resetOnUser` の署名だけを変え、モジュールの分割や統合はしない。
  - Dirs: なし。
- Outside:
  - Extract: なし。
  - Colocate: なし。

## Files

```text
.pi/
  extensions/
    thinking-scrub/
      command/
        scrub.test.ts        update
        scrub.ts             update
      live/
        guard.test.ts        update
        guard.ts             update
      index.ts               update
```

## Slices

## 1.読まれない引数の削除

`runCommand` の第 3 引数と `resetOnUser` の引数を削除し、呼び出し側を合わせる。

### Types

```ts
export function runCommand(port: CommandPort, command: ScrubCommand): readonly string[];

export function resetOnUser(): Guard;
```

### Steps

1. `.pi/extensions/thinking-scrub/command/scrub.ts`
   1. update: `runCommand` の第 3 引数 `at: number` を削除する。
   2. update: `void at;` を削除する。
2. `.pi/extensions/thinking-scrub/index.ts`
   1. update: `runCommand` の呼び出しから第 3 引数 `options.now()` を削除する。
   2. update: `resetOnUser(state.guard)` を `resetOnUser()` に直す。
3. `.pi/extensions/thinking-scrub/live/guard.ts`
   1. update: `resetOnUser` の引数 `guard: Guard` を削除する。
   2. update: `void guard;` を削除する。
4. `.pi/extensions/thinking-scrub/command/scrub.test.ts`
   1. update: `runCommand` の 11 の呼び出しから第 3 引数 `100` を削除する。
5. `.pi/extensions/thinking-scrub/live/guard.test.ts`
   1. update: `resetOnUser(second.guard)` を `resetOnUser()` に直す。

### Policy

- Allowed:
  - 振る舞いを変えない範囲で、引数の宣言と呼び出しを直す。
  - `cycleText` の `sep` を残す。
- Forbidden:
  - 型を満たすためだけの引数を削除する - 型が壊れる。
  - `cycleText` の `sep` を削除する - 実装が外側の `.join(sep)` で読んでおり、「読まれない引数」に当たらない。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/thinking-scrub/command/scrub.ts .pi/extensions/thinking-scrub/index.ts .pi/extensions/thinking-scrub/live/guard.ts .pi/extensions/thinking-scrub/command/scrub.test.ts .pi/extensions/thinking-scrub/live/guard.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added: なし

## Notes

### Slice 1: 読まれない引数の削除

- Findings: なし
- Unplanned: なし
- Commit:
- Stopped:

## Work Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Policy:
- Unproven:
- Noise:
- Doubts:

### Round 2

- Stale:
- Unlisted:
- Gaps:
- Policy:
- Unproven:
- Noise:
- Doubts:

## Acceptance

- Goal:
- Ran:
- Findings:
- Doubts:
