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

- Findings: なし
- Unplanned:
  - plan の Slice 2 `Verify` の dirNames 除外行を `it\('` 付きに修正（統合後名との両立不能を解消）。
- Commit: 9a53179 consult(scripts-skills): merge skills tests into combined cases（`pnpm test:run scripts .pi/skills` 136 件、144 から 8 減）
- Stopped:

### Cleanup: 追加の削除なし（4分類で点検、136件維持）

- Findings: なし
- Unplanned: なし

## Work Review

### Round 1

- Stale:
  - なし — 先頭コメントの fixture 言及削除と `INVALID_LIST_LINE` import 削除は Steps 通りで、残る `test/scripts.fixture.ts:38` の定義は `scripts/checks/typecheck.test.ts:152` が使うため陳腐化しない（`scripts/checks/typecheck-staged.test.ts:9`、`scripts/checks/typecheck-staged.test.ts:16`）。統合後の 5 件の新名は旧名を残さず、旧名への言及は計画の Verify 除外行だけに残る（`.pi/skills/adr/scripts/scaffold.test.ts:112`、`.pi/skills/adr/scripts/scaffold.test.ts:125`、`.pi/skills/adr/scripts/scaffold.test.ts:197`、`.pi/skills/adr/scripts/scaffold.test.ts:216`、`.pi/skills/close/scripts/collect.test.ts:34`）。
- Unlisted:
  - なし — 差分は Files の `update` 4 件（`scripts/product-ready/targets.test.ts`、`scripts/checks/typecheck-staged.test.ts`、`.pi/skills/adr/scripts/scaffold.test.ts`、`.pi/skills/close/scripts/collect.test.ts`）だけを変え、`scripts/checks/typecheck.test.ts` は Steps 通り不変であり、`cycles/261102-051-feat-test-cleanup/plan/scripts-skills.md:89` と `cycles/261102-051-feat-test-cleanup/plan/scripts-skills.md:99` の記録追記は作業記録であって Files 対象外である。
- Gaps:
  - なし — 統合 5 件はいずれも両分岐の断言を 1 本に残す（空と既存、両ルートと空ルート、`## 01` と `## 02`、`## 02` 追加と `## 03` 追加、Triage ありと無し）。削除 3 件（到達不能な root・at、不正 JSON の重複）は ADR 06 の到達不能・重複の決定値のため所見にしない（`scripts/product-ready/targets.test.ts:53` は空 root の `[]` を残す、`scripts/checks/typecheck.test.ts:143` が文面と exit の照合先として残る）。
- Unproven:
  - なし — 統合後の各 `it` は片側を壊すと赤になる。`createLeafDir` は二回目が投げなければ落ちる、空ルートの `[]` は余分を返せば落ちる、`lastEntryNumber` の 1 と 2 は固定値を返せば片方が落ちる、`appendEntry` の loop は `next` 無視で片方が落ちる、`noOf` は常時値・常時 null のいずれも片方が落ちる（`.pi/skills/adr/scripts/scaffold.test.ts:112`、`.pi/skills/adr/scripts/scaffold.test.ts:125`、`.pi/skills/adr/scripts/scaffold.test.ts:197`、`.pi/skills/adr/scripts/scaffold.test.ts:216`、`.pi/skills/close/scripts/collect.test.ts:34`）。
- Noise:
  - なし — 残る 5 件はいずれも外から届く分岐（作成と衝突、両ルート収集と空扱い、最大値、次の番号追加、Triage 有無）にひもづき、型・スキーマが保証する前提の再現ではない。`## NN`・`<問い>`・`02` 等の字面は製品出力の契約および Steps の決定値のため所見にしない（`format.md` の `## Test cases` に照合、`.pi/skills/adr/scripts/scaffold.test.ts:216`、`scripts/checks/typecheck.test.ts:143`）。
- Doubts:
  - `scripts/checks/typecheck-staged.mjs:17` と `scripts/checks/typecheck.mjs:16` は別プロセスで同じ文面を出すため、将来 staged 側だけが壊れても `scripts/checks/typecheck.test.ts:143` は緑のままである。重複扱いは ADR 06 の決定なので所見にせず残す。
  - 統合後の 1 本に 2 断言が入る形（例: `.pi/skills/adr/scripts/scaffold.test.ts:216` の loop）は、落ちたときにどちらの入力かを行番号でしか切り分けられない。計画の命名決定通りなので所見にせず残す。

## Acceptance

- Ran: `pnpm test:run`（62 本、778 件）と `pnpm typecheck` をワークツリーで実行し、緑。plan の `Always` は各スライスの `Verify` で実行済み。`Added` はなし。この plan は振る舞いを足さずテストを削るため、壊して赤を確かめる対象はない。差分を読み、テストの削除と統合だけであることを確かめた。
- Findings: なし
- Doubts: なし
