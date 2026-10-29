# PLAN `base-commit`

- No: 04

## Files

```text
.pi/
  skills/
    work/
      SKILL.md                 update
```

## Slices

## 1.base-messages

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/work/SKILL.md`:
   - `base` plan の slice のコミットを、オーナーの OK の後に `base(<plan id>): <subject>` で行うと書きます。
   - `base` plan の fixes のコミットを `base(<plan id>): round <N> fixes` と書きます。
   - worktree plan の `consult(<plan id>): round <N> fixes` は残します。
   - `base` plan の acceptance のコミットを `base(<plan id>): acceptance` にし、「same message」の文を消します。
   - worktree plan の `consult(<plan id>): acceptance` は残します。

### Verify

- Always:
  - 既定の 5 つ。
  - `.pi/skills/work/SKILL.md` の `consult(` が worktree plan の行だけに残っていること。
- Added:
  - other — `base(<plan id>): <subject>`、`base(<plan id>): round <N> fixes`、`base(<plan id>): acceptance` の 3 つが `.pi/skills/work/SKILL.md` にあること。
  - other — `base` plan の 3 つのメッセージが ADR 04 の `Adopted` と一致すること。
  - other — worktree plan の `consult(...)` の 3 つのメッセージが `.pi/skills/work/SKILL.md` で変わっていないこと。

## Notes

### Slice 1: base-messages

- Findings:
- Unplanned:
- Commit:
- Stopped:

## Review

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
