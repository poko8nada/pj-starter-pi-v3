# PLAN `drop-intent-router`

## Files

```text
.pi/extensions/intent-router/   drop
DEFINITION.md                   update
definition/rules.md             update
README.md                       update
README.ja.md                    update
```

## Slices

## 1.拡張を消す

### Types

```ts
なし;
```

### Steps

1. `.pi/extensions/intent-router/`:
   - ディレクトリごと削除する（コード、`settings.json`、`logs/*.jsonl`、`README.md`）。

### Verify:

- cli: `test ! -e .pi/extensions/intent-router`、`pnpm test:run`
  - (happy) `test ! -e .pi/extensions/intent-router` → exit 0（ディレクトリが無い）
  - (error) `settings.json` だけ残す → `test ! -e` が exit 1
  - (error) `logs/` だけ残す → `test ! -e` が exit 1
  - (happy) `pnpm test:run` → exit 0（他のテストが落ちない）

## 2.参照を消す

### Types

```ts
なし;
```

### Steps

1. `DEFINITION.md`:
   - `- intent-router: エージェントが、owner の発言の意図通りに動ける` の行を消す。
2. `definition/rules.md`:
   - 名前の形の例から `intent-router` を外す。
3. `README.md`:
   - 拡張の並びから `intent-router` を外す。
4. `README.ja.md`:
   - 同じ行から `intent-router` を外す。

### Verify:

- cli: `grep -rn intent-router DEFINITION.md definition/rules.md README.md README.ja.md`
  - (happy) 4 つの文書に `intent-router` が残っていない → 出力なし、exit 1
  - (error) `DEFINITION.md` に行が残っている → 1 件出る
  - (error) `README.ja.md` にだけ残っている → 1 件出る

## 3.統合: `intent-router` がリポジトリから消えている

### Types

```ts
なし;
```

### Steps

1. `.pi/extensions/intent-router/`:
   - 消した後に、他の拡張やスキルからの参照が残っていないことを確かめる。

### Verify:

- cli: `test ! -e .pi/extensions/intent-router`、`grep -rln intent-router . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=cycles`、`pnpm test:run`、`pnpm typecheck`
  - (happy) `test ! -e .pi/extensions/intent-router` → exit 0
  - (happy) `grep -rln` → 出力なし、exit 1
  - (error) 他の拡張が `intent-router` を含むようになった → grep が 1 件返す
  - (happy) `pnpm test:run` と `pnpm typecheck` → exit 0

## Notes

### Slice 1: 拡張を消す

- Findings: なし
- Unplanned: なし
- Commit: 2fa7424 consult(drop-intent-router): remove intent-router extension

### Slice 2: 参照を消す

- Findings: なし
- Unplanned: なし
- Commit: b76e701 consult(drop-intent-router): drop intent-router references from docs

### Slice 3: 統合: `intent-router` がリポジトリから消えている

- Findings: なし
- Unplanned: なし
- Commit: 1b9ab00（記録の commit。差分の本体は 86b6791・0968510）

## Review

### Round 1

- Stale: なし
- Unlisted: なし
- Gaps: なし
- Unproven: なし
- Doubts:
  - `cycles/` 内の `intent-router` 残存は記録であり stale としない — `cycles/261022-032-dev/adr.md:66` が複製不要を決定し、Slice 3 の grep が `--exclude-dir=cycles` を明示 (`cycles/261022-032-dev/plan/drop-intent-router.md:77`)
  - `logs/*.jsonl` の削除が diff に出ないのは tracked file が無いためで、ディレクトリごと削除に含まれる — ADR は設定と記録ごと削除を決定 (`cycles/261022-032-dev/adr.md:63`)、手順はディレクトリごと削除 (`cycles/261022-032-dev/plan/drop-intent-router.md:26`)

## Acceptance

- Ran: `pnpm test:run`（52 files / 834 tests）、`pnpm typecheck`（root / .pi とも ok）、`pnpm lint`（指摘なし）、`pnpm format:check`（差分なし）、`test ! -e .pi/extensions/intent-router`（exit 0）、`grep -rln intent-router`（出力なし、exit 1）。
- Ran: 壊し試験 2 つ。`settings.json` だけ戻す → `test ! -e` が exit 1。`README.md` に 1 行戻す → `grep` が 1 件返す。どちらも復元後に再実行して緑。
- Findings: なし
- Doubts: なし
