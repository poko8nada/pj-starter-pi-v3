# PLAN `ex-doc-lists`

- Place: worktree
- Boundary Plans: なし（サイクルの plan はすべて終わっている）

## Files

```text
.pi/skills/
  adr/
    SKILL.md              update
  close/
    SKILL.md              update
  work/
    SKILL.md              update
    references/
      tasks.md            update
  yolo/
    SKILL.md              update
README.md                 update
README.ja.md              update
```

## Slices

## 1. 改名と観点を文書に届ける

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/close/SKILL.md`:
   - update: 31行目の「no plan's `Files` or `Paths` carries」を「no plan's `Files` carries」に直す。
2. `.pi/skills/adr/SKILL.md`:
   - update: 12行目のエントリー段階の一覧に「the discussion」を足す。
3. `.pi/skills/work/SKILL.md`:
   - update: 52行目の「a `Goal` line」を「an `Adopted` line」に直す。
4. `.pi/skills/work/references/tasks.md`:
   - update: 25行目の「a `Goal` line」を「an `Adopted` line」に直す。
5. `.pi/skills/yolo/SKILL.md`:
   - update: 26行目の plan のレビューの観点を、`Goal`、`Integration`、`Files`、`Types`、`Cases`、`Checks`、`Flow` の7つに直す。
6. `README.md`:
   - update: 61行目の plan の説明を、`plan` の `description`（ADR が定まり、カットを提示して合意した後）に合わせる。
7. `README.ja.md`:
   - update: 61行目の plan の説明を、`plan` の `description` に合わせる。

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `! grep -n 'Paths' .pi/skills/close/SKILL.md`
  - `! grep -n 'Goal' .pi/skills/work/SKILL.md .pi/skills/work/references/tasks.md`
  - `grep -n 'Integration' .pi/skills/yolo/SKILL.md`
  - `! grep -n 'after the split is settled' README.md`
  - 変更した全ファイルを通読し、矛盾、循環、重複、不足、不自然な流れがないか確かめる。ダメなら直し、`Unplanned` に書く。
- Added: なし

## Notes

### Slice 1: 改名と観点を文書に届ける

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
