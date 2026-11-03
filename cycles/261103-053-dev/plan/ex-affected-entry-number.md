# PLAN `ex-affected-entry-number`

- Place: worktree
- Boundary Plans: なし（サイクルの plan はすべて終わっている）

## Files

```text
.pi/skills/adr/scripts/
  affected.mjs            update
  cycle.mjs               update
  index.mjs               update
  index.test.ts           update
```

## Slices

## 1. 骨組みにエントリーの番号を渡す

### Types

```ts
/** 1 エントリー分の affected の骨組み。`nnn` はエントリーの番号 */
export function affectedEntrySkeleton(nnn: number): string;

/** `affected.md` の骨組み。`cycle` はサイクルの番号、`entry` は最初のエントリーの番号 */
export function affectedSkeleton(cycle: number, entry: number): string;

/** dir 名からサイクルの番号を抜く。合わなければ null */
export function cycleNumberOf(name: string): number | null;
```

### Steps

1. `.pi/skills/adr/scripts/affected.mjs`:
   - update: `affectedSkeleton(cycle, entry)` に変え、見出しの後に `affectedEntrySkeleton(entry)` を書く。
2. `.pi/skills/adr/scripts/cycle.mjs`:
   - update: 私的な `extractNNN` を `cycleNumberOf` として出し、`openCycleDir` と `nextNNN` もそれを使う。
3. `.pi/skills/adr/scripts/index.mjs`:
   - update: 開いたサイクルで `affected.md` がない分岐を、`cycleNumberOf` でサイクルの番号を取り、`affectedSkeleton(cycle, next)` を書く形に直す。
   - update: 新しいサイクルの作成を `affectedSkeleton(nnn, 1)` に直す。
4. `.pi/skills/adr/scripts/index.test.ts`:
   - update: `affectedSkeleton` の検査を新しい引数に合わせ、開いたサイクルで `affected.md` がない場合に `## 03:` が書かれる検査を足す。

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -n 'affectedSkeleton' .pi/skills/adr/scripts/affected.mjs .pi/skills/adr/scripts/index.mjs`
  - 変更した全ファイルを通読し、矛盾、循環、重複、不足、不自然な流れがないか確かめる。ダメなら直し、`Unplanned` に書く。
- Added: なし

## Notes

### Slice 1: 骨組みにエントリーの番号を渡す

- Findings: なし
- Unplanned: なし
- Commit: d908c99
- Stopped: なし

## Work Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
  - 新しいサイクルの作成 `affectedSkeleton(nnn, 1)` を確かめる検査がない。
    - fixed: 新しいサイクルの `affected.md` が `# Affected 001` で始まり `## 01:` を持つ断言を足した。
- Unproven:
- Noise:
- Doubts:

## Acceptance

- Ran:
- Findings:
- Doubts:
