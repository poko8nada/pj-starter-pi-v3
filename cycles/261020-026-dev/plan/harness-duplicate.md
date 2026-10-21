# PLAN `harness-duplicate`

## Files

```text
scripts/
  harness/
    index.mjs                update
    index.test.ts
```

## 1.重複を消す

### Types

なし

### Steps

1. `scripts/harness/index.mjs`:
   - `~` と `~/` の枝と `~foo` の枝を、`if (expanded.startsWith('~'))` の 1 本にまとめる。本文は `path.join(os.homedir(), expanded.slice(1))` のまま。
   - `rootAbs` を `path.resolve(root)` にする。

### Verify:

- read: `review` サブエージェントが `scripts/harness/index.mjs` を読み、次を報告する
  - (happy) `expanded` の分岐 → `if (expanded.startsWith('~'))` が 1 本だけで、`else if` が無い
  - (happy) `expanded` の `if` の本文 → `path.join(os.homedir(), expanded.slice(1))` で、`~`、`~/x`、`~foo` を同じ本文で扱う
  - (happy) `rootAbs` → `path.resolve(root)` で、両枝同一の三項が無い
  - _no case_: 振る舞い — テストでは区別できない（同じ結果）。acceptance で `scripts/harness/index.test.ts` と `pnpm test:run` を回す

## Notes

### Slice 1: 重複を消す

- Findings: なし
- Unplanned: なし
- Commit: bbcaef1

### Test cleanup（slice 外・slices の後）

- 対象: `scripts/harness/index.test.ts`（`## Files` に載る test file。slice 1 が `~` の枝と `rootAbs` の三項を畳んだ後の掃除）
- 落とした test（1 件、42 → 41）:
  - 同じ振る舞いを見る重複 — `harness diff` の `cwd のツリーを root として読む` を削除。最初の `元と先に同じ道の1ファイル（中身違い） → copy (1) に1行、no files to remove` と同じ構成（`.pi/a.ts` の B/A 差分に `pull`）・同じ assertion の部分集合で、全 test が既に `cwd=local` を root として回しているため別物を見ていない。
- 落とさず残した test（review 指摘で復元）:
  - `harness starter` の `~ 単体 → HOME そのものを starter として copy する` と `~foo（`/` 無し）→ HOME/foo を starter として copy する` は残す。一度は `~/...` と同一経路として落としたが、`~` → HOME そのもの・`~foo` → HOME/foo の入力を pin し、`~/...` の 1 件だけでは入力固有の壊し（例: 条件を `startsWith('~/')` に狭める壊しでは `~/...` 件が緑のまま）を見逃すため。
- 探して無かったもの:
  - 消えた振る舞いの test — なし。slice 1 は両枝同一の本文・三項の畳みで振る舞い不変（`bbcaef1` の差分で確認）のため、残りの test は現行の振る舞いを指す。
  - `rootAbs` の `path.isAbsolute(root)` 三項の枝を指す test — なし。`main` は `process.cwd()`（絶対）のみを渡し、相対 `root` で回す test は元から無い。
- Verify: `pnpm vitest run --config vitest.starter.config.ts scripts/harness/index.test.ts` → 41 passed。`pnpm test:run` → 42 files / 707 passed。`pnpm format:check`・`pnpm lint` → green。

## Review

### Round 1

- Stale: なし — `scripts/harness/index.mjs:93-96` の畳みで JSDoc `scripts/harness/index.mjs:69`（`~` は HOME に開き）は依然真。41 件は振る舞い不変のため現行を指し、`cwd` の重複 1 件削除は test の掃除として本 commit に含める。`~` 3 形の pin は残すため ADR `cycles/261020-026-dev/adr.md:72` の意図（振る舞いの pin を壊さない）に沿う。
- Unlisted: `scripts/harness/index.test.ts` の `cwd` 1 件削除 — `## Files` `cycles/261020-026-dev/plan/harness-duplicate.md:5-10` に載る test file 内の重複掃除で、本 cleanup として commit に含める。`index.mjs` の振る舞いは不変で、他に載っていない変更はなし。
- Gaps: なし — Steps 2 件に Verify `cycles/261020-026-dev/plan/harness-duplicate.md:24-30` の 3 happy が対応し、振る舞いは `_no case_` `cycles/261020-026-dev/plan/harness-duplicate.md:30` で同結果と決定済み。ADR `cycles/261020-026-dev/adr.md:79-82` も同結果・`read` で確かめると決定。
- Unproven: なし — `~` 3 形を覆い、単一 `if` を壊すと赤になる（例: 条件を `startsWith('~/')` に狭めると `~`・`~foo` 件が赤、`~/...` 件だけ緑のままになるため復元で捕まえる）。`rootAbs` の三項区別不能は `_no case_` `cycles/261020-026-dev/plan/harness-duplicate.md:30` と Notes の決定値のため数えない。
- Doubts: なし（前回の 2 件は解決 — `~`・`~foo` 復元で入力固有の pin を維持し、削除は `cwd` の重複 1 件のみに絞って本 commit に含める）。

## Acceptance

- Ran: `pnpm test:run` 42 files / 707 tests、`pnpm typecheck` root: ok / .pi: ok、`pnpm lint` exit 0、`pnpm format:check` 緑。`read` で `scripts/harness/index.mjs:93-96` が `if (expanded.startsWith('~'))` 1 本、本文 `path.join(os.homedir(), expanded.slice(1))`、`rootAbs = path.resolve(root)` であることを確認。壊し確認は 3 つ: `:93` を `startsWith('~/')` にすると `~ 単体` と `~foo` の 2 件が赤、`:96` を `path.resolve(root, 'x')` にすると `same` と `../starter` の 2 件が赤、`:94` を `slice(0)` にすると `~/...`、`~ 単体`、`~foo` の 3 件が赤。いずれも戻して 707 tests が緑に戻ることを確かめた。
- Findings: なし。review Round 1 は 4 視点とも finding なし。テスト整理の 2 Doubts は `63679de` で `~ 単体` と `~foo` を戻して解消した。
- Doubts:
  - テスト整理で `cwd のツリーを root として読む` の 1 件だけ落とした（最初の diff テストの重複）。ADR `02` の「テストは変えない」とは 1 件だけ差がある。
