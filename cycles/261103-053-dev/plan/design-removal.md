# PLAN `design-removal`

- No: 01
- Place: base
- Boundary Plans: `plan-cut` (04) は、この plan が直す `work` と `close` の design の参照の後に、plan md の `Place` と `Boundary Plans` の読み方を追記する。

## Files

```text
.pi/skills/design/
  SKILL.md                drop
  references/
    format.md             drop
    tasks.md              drop
.pi/skills/adr/
  SKILL.md                update
.pi/skills/work/
  SKILL.md                update
.pi/skills/close/
  SKILL.md                update
  references/
    format.md             update
  scripts/
    collect.mjs           update
.pi/skills/yolo/
  SKILL.md                update
.pi/skills/upgrade/
  SKILL.md                update
AGENTS.md                 update
README.md                 update
README.ja.md              update
DEFINITION.md             update
```

## Slices

## 1.design の削除とスキルの参照

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/design/SKILL.md`:
   - drop: ファイルを削除する。
2. `.pi/skills/design/references/format.md`:
   - drop: ファイルを削除する。
3. `.pi/skills/design/references/tasks.md`:
   - drop: ファイルを削除する。
4. `.pi/skills/adr/SKILL.md`:
   - update: 「The design, the plan and the work are written from `DEFINITION.md`」を「The plan and the work are written from `DEFINITION.md`」に直す。
   - update: 「the design cuts it, the plan writes it」を「the plan cuts it, the plan writes it」に直す。
5. `.pi/skills/work/SKILL.md`:
   - update: 実行場所の「Design's `Where`」を plan md の `Place` に直す。
   - update: コミット対象の `design.md` を `affected.md` に直す。
   - update: コミットメッセージの `design` を `affected` に直す。
   - update: マージ順序の「the design's `Why`」を plan md の `Boundary Plans` に直す。
6. `.pi/skills/close/SKILL.md`:
   - update: 読む資料の design の切分けと `Boundary Plans` を ADR のエントリーと plan md の `No` と `Boundary Plans` に直す。
   - update: `未特定` の補完の design を plan md の `No` に直す。
   - update: `ex-` plan の「design なし」を「`No` なし」に直す。
   - update: 「do not write the fix into the design」から design を消す。
7. `.pi/skills/close/references/format.md`:
   - update: `## Collected` の並び順の「the design's plans first」を「the normal plans first」に直す。
   - update: `ex-` plan の「no design」を「no `No`」に直す。
   - update: `## Verified` の `Plans` の「the design's `No`」を「the plan md's `No`」に直す。
8. `.pi/skills/close/scripts/collect.mjs`:
   - update: コメントの「設計の plan が先」を「通常の plan が先」に直す。
9. `.pi/skills/yolo/SKILL.md`:
   - drop: design ステージのセクションを削除する。
   - update: ステージの数を4から3に直す。
10. `.pi/skills/upgrade/SKILL.md`:
    - update: 「no ADR, no design and no plan」を「no ADR, no affected and no plan」に直す。

### Verify

- Always:
  - `pnpm test:related .pi/skills/close/scripts/collect.test.ts`
  - `! grep -n '設計の plan が先' .pi/skills/close/scripts/collect.mjs`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `! grep -rni 'design\|設計' .pi/skills/adr .pi/skills/work .pi/skills/close .pi/skills/yolo .pi/skills/upgrade --exclude=tasks.md`
- Added: base の確認: オーナーがこのスライスの差分を読み、design の参照が消えていることを確かめる。オーナーの OK で閉じる。

## 2.利用者向け文書とエージェントの規則

### Types

```ts
なし;
```

### Steps

1. `README.md`:
   - update: 6つのスキルを5つに直す。
   - update: サイクルの流れを「ADR → plan → plan execution → close」に直す。
   - update: 記録の一覧を `adr.md` / `affected.md` / `plan/<plan id>.md` / `close.md` に直す。
   - drop: `design` の行を削除する。
   - update: `plan` の行から design を消す。
2. `README.ja.md`:
   - update: 6つのスキルを5つに直す。
   - update: サイクルの流れを「ADR → plan → plan execution → close」に直す。
   - update: 記録の一覧を `adr.md` / `affected.md` / `plan/<plan id>.md` / `close.md` に直す。
   - drop: `design` の行を削除する。
   - update: `plan` の行から design を消す。
3. `AGENTS.md`:
   - update: 「then design→plan→work→close」を「then plan→work→close」に直す。
4. `DEFINITION.md`:
   - drop: `design-skill` の行を削除する。

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `! grep -ni 'design\|設計' README.md README.ja.md AGENTS.md DEFINITION.md`
- Added: base の確認: オーナーがこのスライスの差分を読み、文書の design の参照が消えていることを確かめる。オーナーの OK で閉じる。

## Notes

### Slice 1: design の削除とスキルの参照

- Findings: なし
- Unplanned: `.pi/skills/work/SKILL.md` の「An `ex-` plan has no design」は、ステップ4が名指していなかった。design が消えるため「An `ex-` plan takes the default (a worktree)」に直した。
- Commit: 3392aef
- Stopped: なし

### Slice 2: 利用者向け文書とエージェントの規則

- Findings: なし
- Unplanned: なし
- Commit: 3340dd3
- Stopped: なし

### Cleanup: なし

- Findings: なし
- Unplanned: なし

## Work Review

### Round 1

- Stale: なし
- Unlisted: なし
- Gaps: なし
- Unproven: なし
- Noise: なし
- Doubts: なし

## Acceptance

- Ran: `pnpm test:run`（64ファイル、727テスト）、`pnpm typecheck`（root と .pi）、`pnpm lint`、`pnpm format:check`、`! grep -rni 'design\|設計' .pi/skills/adr .pi/skills/work .pi/skills/close .pi/skills/yolo .pi/skills/upgrade --exclude=tasks.md`、`! grep -n '設計の plan が先' .pi/skills/close/scripts/collect.mjs`、オーナーの base の確認（スライス1と2）。
- Findings: なし
- Doubts: なし
