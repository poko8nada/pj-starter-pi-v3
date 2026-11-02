# PLAN `scripts-skills`

- No: 06

## Files

```text
scripts/
  checks/
    typecheck-staged.test.ts  update
    typecheck.test.ts         update
  product-ready/
    targets.test.ts           update
.pi/skills/
  adr/
    scripts/
      scaffold.test.ts        update
  close/
    scripts/
      collect.test.ts         update
```

## Slices

## 1.scripts の削除と統合

### Types

なし

### Steps

1. `scripts/product-ready/targets.test.ts`:
   - `it('無い root → 投げる')` を削除する。`root` は `process.cwd()` から来るため、CLI から届かない。
   - `it('表に無い at → 投げる')` を削除する。`at` は固定の一覧から来るため、CLI から届かない。
2. `scripts/checks/typecheck-staged.test.ts`:
   - `it('scopes.json が JSON でない → exit 1 と理由の行')` を削除する。`scripts/checks/typecheck.test.ts` の同じ名前のテストが、同じ文面と exit を確かめている。

### Verify

- Always:
  - `pnpm test:related scripts/product-ready/targets.test.ts scripts/checks/typecheck-staged.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `! grep -n '無い root → 投げる\|表に無い at → 投げる' scripts/product-ready/targets.test.ts`
  - `! grep -n 'scopes.json が JSON でない' scripts/checks/typecheck-staged.test.ts`
  - `grep -c 'scopes.json が JSON でない' scripts/checks/typecheck.test.ts` が 1 である
- Added: なし

## 2.skills の統合

### Types

なし

### Steps

1. `.pi/skills/adr/scripts/scaffold.test.ts`:
   - `it('## 01: を持つ markdown → 1 を返す')` と `it('## 02: を持つ markdown → 2 を返す')` を1本に統合する。統合したテストは、`## NN:` を持つ markdown から、その最大値を返すことを2つの入力で確かめる。
   - `it('## 01: を持つ markdown → ## 02: を足し # ADR は1つのまま')` と `it('## 02: を持つ markdown → ## 03: を足す')` を1本に統合する。統合したテストは、次の番号のエントリーを足し、`# ADR` が1つのままであることを2つの入力で確かめる。
   - `it('空 tmp に作る → path が返り dir ができる')` と `it('既存 dir には作らず投げる')` を1本に統合する。統合したテストは、空の tmp に作り、既存の dir には作らず投げることを確かめる。
   - `it('両ルートの dir 名を集める（`archive` も入る）')` と `it('無いルートは空として扱う')` を1本に統合する。統合したテストは、両ルートの dir 名を集め、無いルートは空として扱うことを確かめる。
2. `.pi/skills/close/scripts/collect.test.ts`:
   - `it('`ex-` planは`- No:`が無くてもTriage行の`ADR <NN>`を読む')` と `it('Triage行が無い`ex-` planはnull（`未特定`）')` を1本に統合する。統合したテストは、`ex-` plan が Triage 行の `ADR <NN>` を読み、行が無ければ null になることを確かめる。

### Verify

- Always:
  - `pnpm test:related .pi/skills/adr/scripts/scaffold.test.ts .pi/skills/close/scripts/collect.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -c '## 01: を持つ markdown → 1 を返す\|## 02: を持つ markdown → 2 を返す' .pi/skills/adr/scripts/scaffold.test.ts` が 0 である
  - `grep -c '## NN: を持つ markdown から、その最大値を返す' .pi/skills/adr/scripts/scaffold.test.ts` が 1 である
  - `grep -c '## 01: を持つ markdown → ## 02: を足し\|## 02: を持つ markdown → ## 03: を足す' .pi/skills/adr/scripts/scaffold.test.ts` が 0 である
  - `grep -c '次の番号のエントリーを足し' .pi/skills/adr/scripts/scaffold.test.ts` が 1 である
  - `grep -c '空 tmp に作る → path が返り\|既存 dir には作らず投げる' .pi/skills/adr/scripts/scaffold.test.ts` が 0 である
  - `grep -c '両ルートの dir 名を集める（`archive` も入る）\|無いルートは空として扱う' .pi/skills/adr/scripts/scaffold.test.ts` が 0 である
  - `grep -c '`ex-` planは`- No:`が無くても\|Triage行が無い`ex-` plan' .pi/skills/close/scripts/collect.test.ts` が 0 である
- Added: なし

## Notes

### Slice 1: scripts の削除と統合

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 2: skills の統合

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Cleanup: <what it cleaned>

- Findings:
- Unplanned:

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
