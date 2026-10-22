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

- Findings:
- Unplanned:
- Commit:

### Slice 3: 統合: `intent-router` がリポジトリから消えている

- Findings:
- Unplanned:
- Commit:

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
