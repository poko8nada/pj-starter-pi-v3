# PLAN `scripts-skills`

- No: 06

## Files

```text
scripts/
  checks/
    typecheck-staged.test.ts  update
    typecheck.test.ts
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
   - `it('scopes.json が JSON でない → exit 1 と理由の行')` を削除する。統合先は `scripts/checks/typecheck.test.ts` の同じ名前のテストであり、同じ文面と exit を確かめる。
   - 未使用になった `INVALID_LIST_LINE` の import と、先頭コメントの「理由行は `test/scripts.fixture.ts` から取る」の記述を直す。
3. `scripts/checks/typecheck.test.ts` は変えない。統合先としてそのまま残す。

### Verify

- Always:
  - `pnpm test:related scripts/product-ready/targets.test.ts scripts/checks/typecheck-staged.test.ts scripts/checks/typecheck.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `! grep -E '無い root → 投げる|表に無い at → 投げる' scripts/product-ready/targets.test.ts`
  - `! grep -E 'scopes.json が JSON でない' scripts/checks/typecheck-staged.test.ts`
  - `test "$(grep -c 'scopes.json が JSON でない' scripts/checks/typecheck.test.ts)" = 1`
- Added: なし

## 2.skills の統合

### Types

なし

### Steps

1. `.pi/skills/adr/scripts/scaffold.test.ts`:
   - (happy) `## 01:` を持つ markdown → 1 を返す。
   - (happy) `## 02:` を持つ markdown → 2 を返す。
   - 上の2本を、`it('## NN: を持つ markdown から、その最大値を返す')` の1本に統合する。
   - (happy) `## 01:` を持つ markdown に `## 02:` を足し、`# ADR` は1つのまま。
   - (happy) `## 02:` を持つ markdown に `## 03:` を足す。
   - 上の2本を、`it('次の番号のエントリーを足し、# ADR は1つのまま')` の1本に統合する。
   - (happy) 空の tmp に作る → path が返り、dir ができる。
   - (error) 既存の dir には作らず投げる。
   - 上の2本を、`it('空の tmp に作り、既存の dir には作らず投げる')` の1本に統合する。
   - (happy) 両ルートの dir 名を集める（`archive` も入る）。
   - (empty) 無いルートは空として扱う。
   - 上の2本を、`it('両ルートの dir 名を集め、無いルートは空として扱う')` の1本に統合する。
2. `.pi/skills/close/scripts/collect.test.ts`:
   - (happy) `ex-` plan は Triage 行の `ADR <NN>` を読む。
   - (empty) Triage 行が無い `ex-` plan は null（`未特定`）になる。
   - 上の2本を、`it('`ex-`plan は Triage 行の`ADR <NN>` を読み、行が無ければ null になる')` の1本に統合する。

### Verify

- Always:
  - `pnpm test:related .pi/skills/adr/scripts/scaffold.test.ts .pi/skills/close/scripts/collect.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `! grep -E '## 01: を持つ markdown → 1 を返す|## 02: を持つ markdown → 2 を返す' .pi/skills/adr/scripts/scaffold.test.ts`
  - `test "$(grep -c '## NN: を持つ markdown から、その最大値を返す' .pi/skills/adr/scripts/scaffold.test.ts)" = 1`
  - `! grep -E '## 01: を持つ markdown → ## 02: を足し|## 02: を持つ markdown → ## 03: を足す' .pi/skills/adr/scripts/scaffold.test.ts`
  - `test "$(grep -c '次の番号のエントリーを足し' .pi/skills/adr/scripts/scaffold.test.ts)" = 1`
  - `! grep -E '空 tmp に作る → path が返り|既存 dir には作らず投げる' .pi/skills/adr/scripts/scaffold.test.ts`
  - `test "$(grep -c '空の tmp に作り、既存の dir には作らず投げる' .pi/skills/adr/scripts/scaffold.test.ts)" = 1`
  - `! grep -E "it\('両ルートの dir 名を集める|it\('無いルートは空として扱う" .pi/skills/adr/scripts/scaffold.test.ts`
  - `test "$(grep -c '両ルートの dir 名を集め、無いルートは空として扱う' .pi/skills/adr/scripts/scaffold.test.ts)" = 1`
  - `! grep -E '`ex-` planは`- No:`が無くても|Triage行が無い`ex-` plan' .pi/skills/close/scripts/collect.test.ts`
  - `test "$(grep -c '`ex-`plan は Triage 行の`ADR <NN>` を読み' .pi/skills/close/scripts/collect.test.ts)" = 1`
- Added: other — `pnpm test:run scripts .pi/skills` で件数を数え、144 から減った件数を ## Notes に書く

## Notes

### Slice 1: scripts の削除と統合

- Findings: なし
- Unplanned: なし
- Commit: 606bdc1 consult(scripts-skills): prune unreachable scripts tests
- Stopped:

### Slice 2: skills の統合

- Findings:
  - Verify の `! grep -E '両ルートの dir 名を集める（`archive` も入る）|無いルートは空として扱う'` が新テスト名にも一致し、緑にできない。
    left: 新テスト名 `両ルートの dir 名を集め、無いルートは空として扱う` は `test "$(grep -c '両ルートの dir 名を集め、無いルートは空として扱う')" = 1` を満たすために必須だが、その末尾 `無いルートは空として扱う` が `! grep` の後半に一致するため、両立しない。plan の Verify 修正が必要。
- Unplanned: なし
- Commit:
- Stopped: Slice 2 の Steps まで実施し、Verify で停止（上記1行のみ赤）。コミットせず、作業ツリーに未コミットのまま残す。`pnpm test:run scripts .pi/skills` は 136 件（144 から 8 減）。

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
