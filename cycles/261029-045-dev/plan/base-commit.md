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
  - other — worktree plan の `consult(...)` の 3 つのメッセージ（`.pi/skills/work/SKILL.md` の acceptance、`.pi/skills/work/references/tasks.md` の slice と fixes）が変わっていないこと。

## Notes

### Slice 1: base-messages

- Findings: なし
- Unplanned: なし
- Commit: 4e48c2d consult(base-commit): describe base-plan commits with base prefix
- Stopped:

## Review

### Round 1

- Stale: なし
- Unlisted: なし
- Gaps: なし
- Unproven: なし
- Noise: なし
- Doubts: ADR 04 の Context（cycles/261029-045-dev/adr.md:231）が旧文「same message」を引用するが、決定前の事実記録であり陳腐化ではない。plan の Steps（cycles/261029-045-dev/plan/base-commit.md:30）の「same message」も作業指示であり残存でよい。diff は .pi/skills/work/SKILL.md:46,62,75 の 3 行のみで、consult( は SKILL.md:75（worktree の acceptance）のみに残り、tasks.md:10,64 は不変、base( の 3 メッセージは ADR 04 Adopted（adr.md:274-275）と一致する。doc 変更のため Test cases はなく、追加テストもない。

## Acceptance

- Ran: `pnpm test:run`（55ファイル、759テスト）、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`、plan の `Verify` の grep（`consult(`、`base(<plan id>)`）を worktree で実行した。
- Findings: なし
- Doubts: なし
