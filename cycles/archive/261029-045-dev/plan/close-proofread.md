# PLAN `close-proofread`

- No: 05

## Files

```text
.pi/
  skills/
    close/
      SKILL.md                 update
```

## Slices

## 1.proofread

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/close/SKILL.md:64-71`:
   - proofread のステップを、`cycles/<YYMMDD>-<NNN>-<slug>/close.md` と `.pi/skills/close/references/format.md` を名指す一文とパスにします。
   - `proofreader` の方針に従い、名指したファイルだけを編集すると書きます。
   - `proofreader` の報告と `git diff` を読み、`Triage` の行、`Verified` の行、行き先のいずれかの意味が変わったら `.pi/skills/close/references/format.md` の形に戻すことと、1 ラウンドで終えることを残します。

### Verify

- Always:
  - 既定の 5 つ。
- Added:
  - other — `grep -i 'close.md'` と `grep -i 'references/format.md'` が `.pi/skills/close/SKILL.md` の proofread のセクションに当たる。
  - other — `grep -i 'one round'` が `.pi/skills/close/SKILL.md` の proofread のセクションに当たり、名指したファイルだけを編集する規則が残っている。
  - other — `grep -i 'Triage'`、`grep -i 'Verified'`、`grep -i 'git diff'` が `.pi/skills/close/SKILL.md` の proofread のセクションに当たり、意味が変わったら `.pi/skills/close/references/format.md` の形に戻す規則が残っている。
  - base — オーナーが `.pi/skills/close/SKILL.md` の文面を読み、OK を返す。

## Notes

### Slice 1: proofread

- Findings: なし
- Unplanned: なし
- Commit: cb89b0c
- Stopped: なし

## Review

### Round 1

- Stale:
  - なし — 陳腐化なし。差分 `.pi/skills/close/SKILL.md:64-69` は新定型の一文で旧箇条書き (`the document:` / `name that file`) を除去済み。他文書に旧文言の引用なし (`.pi/skills/close/references/tasks.md` に proofreader 任務なし、`.pi/skills/close/references/format.md:19-33` の Triage/Verified 形と矛盾なし)。定型は `.pi/skills/plan/SKILL.md:92` および `.pi/skills/design/SKILL.md:80` と同形。
- Unlisted:
  - なし — `git diff --stat 06c5ca7..HEAD` は `.pi/skills/close/SKILL.md` の1件のみで、計画 `## Files` の `update` と一致する。
- Gaps:
  - なし — Slice 1 の Steps 3点は差分どおり実施済み (`cycles/261029-045-dev/plan/close-proofread.md:26-29` に対し `.pi/skills/close/SKILL.md:64` が2ファイルの一文名指し+パス、`SKILL.md:64` 後段が named files のみ編集、`SKILL.md:66-69` が報告+`git diff` 読み・意味変化時の format 戻し・1ラウンド)。Verify の Added 3本 (`close-proofread.md:36-38`) と base オーナー読会 (`close-proofread.md:39`) が各々に対応する。Types なし・テストファイルなしのため `.pi/skills/plan/references/format.md:164-172` の `## Test cases` 対象の追加ケースなし。
- Unproven:
  - なし — 本計画にテストファイルの変更なし。壊して赤を確認すべき新規テストが存在しない。Added の grep 3本はいずれかを除去すれば赤になる構成 (`close.md` / `references/format.md` / `one round` / `Triage` / `Verified` / `git diff` のいずれかを消せば対応する grep が当たらなくなる)。
- Noise:
  - なし — 本計画で追加したテストなし。magic number / hardcoded string を含むケースなし。Added の grep は型・スキーマ・DB が保証しない文書文言の確認で、重複・不要なテストなし。
- Doubts:
  - なし

## Acceptance

- Ran: `pnpm test:run`（57ファイル、788テスト）、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`。plan の `Verify` の grep（`close.md`、`references/format.md`、`one round`、`Triage`、`Verified`、`git diff`）を確認した。オーナーは slice 1 に OK を返した。
- Findings: なし
- Doubts: なし
