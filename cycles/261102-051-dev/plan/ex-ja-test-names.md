# PLAN `ex-ja-test-names`

## Files

```text
scripts/
  checks/
    ja-check.test.ts         update
```

## Slices

## 1.テスト名の日本語化

### Types

```ts
なし;
```

### Steps

1. `scripts/checks/ja-check.test.ts`:
   - 15 件の `it` の名称を日本語に直し、期待値と振る舞いは変えない。

### Verify

- Always:
  - `pnpm test:related scripts/checks/ja-check.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
- Added:
  - `pnpm test:related scripts/checks/ja-check.test.ts` が 15 件すべて通過する。
  - 15 件の `it` の名称に英語の文が残っていないことを確かめる。

## Notes

### Slice 1: テスト名の日本語化

- Findings: なし
- Unplanned: なし
- Commit: 103f393 consult(ex-ja-test-names): translate ja-check test names to Japanese
- Stopped:

### Cleanup: 重複・廃止のテストなし

対象の `scripts/checks/ja-check.test.ts` 全件（15件）を読み、`scripts/checks/ja-check.mjs` の現行分岐と突き合わせた。`Files` で `update` は当該テストのみであり、実装・設定の振る舞いも分岐も変わらないため、他のテストには手を付けない。近い組はいずれも段違い・欄違いのため残した。正常系（warn/error、0.x.x抑制/1.x.x報告、cycles含む/自己除外）と投げ系（壊れJSONと鍵・値型違い）はいずれも検証層が違う。落とすものはない。

- 重複（0件）: warn/errorは終了コード（0/1）と `[warn]/[error]` と `→ 対応` が違い、表裏のため残した。`'`/`"`/`` ` `` の単独囲み3件は引用符リテラルが違い、片方の対応漏れ（typo）を検出するため残した。単独囲みスキップと前後文字あり報告は表裏の境界が違う。`ROADMAP` の `0.x.x` 抑制と `1.x.x` 報告は抑制範囲の境界が違う。`cycles` 含むと自己除外は対象の内外が違う。引数なしと読めないスキップは分岐（引数なし/`catch` 継続）が違う。壊れJSONと鍵・値型違いは検証層（構文と鍵集合・値型）が違うため1件化しない。
- 消えた振る舞い（0件）: 本計画はテスト名の日本語化のみで振る舞いを消さない。`mjs` の分岐（設定なし・壊れ・鍵違い・自己除外・読めないスキップ・`ROADMAP` の `## 0.x.x` 抑制・引用単独スキップ）と突き合わせて、消えた検査は残っていない。
- 計画変更が消す分岐（0件）: 改名は他スクリプトの分岐を消さない。`ja-check.mjs` の分岐は従来通りであり、該当なし。
- `Test cases` が書かないもの（0件）: 本計画に `## Test cases` 節がなく、`Steps` に `(happy)` 等の列挙もないためGoal対応は該当なし。前提の再現（型・スキーマ・DBが決めるだけの確認）や誰も気づかないものの追加は本計画になく、前計画で落とした自明・DB断言（未知語・実ファイル内容）を復活させない。`Goal` 行（15件改名・振る舞い不変）に対応する自動検査の新設はなく、計画が `Verify` の手動（15件通過・英語残存なし）に回しているため新設しない。

- Findings: なし
- Unplanned: なし
- Ran: `pnpm test:related scripts/checks/ja-check.test.ts`（15 passed）、`pnpm test:run`（63ファイル、801件、すべて通過）、`pnpm typecheck`、`pnpm lint`、`pnpm format:check` が緑。

## Work Review

### Round 1

- Stale: なし — 旧英語名は `scripts/checks` 配下に残らず、他文書の言及は履歴である前計画の記録のため陳腐化しない。
- Unlisted: なし — 差分は `Files` 指定の1件のみの改名であり、他ファイルの変更はない。
- Gaps: なし — 改名のみで振る舞いと期待値は不変であり、`Verify` の15件通過と英語文残存なしで閉じる。
- Unproven: なし — 15件の本体は不変で、各名称と断言（終了コードと `[warn]`/`[error]` と集計行）が対応する。
- Noise: なし — 新設ケースがなく、残る断言の数値・文字列は振る舞い自体か前計画の決定値である。
- Doubts:
  - ヘッダコメントの英語は残るが、`Steps` の対象は15件の `it` 名称のみのため対象外と読んだ。
  - 新名称に残る `warn`/`error`/`md`/`exit` 等は単語であり、`Verify` のいう「英語の文」には当たらないと読んだ。

## Acceptance

- Ran:
  - `pnpm test:related scripts/checks/ja-check.test.ts` — 15 件すべて通過。
  - `pnpm typecheck` — root ok、.pi ok。
  - `pnpm lint` — 通過。
  - `pnpm format:check` — 333 ファイル、通過。
  - 15 件の `it` の名称が日本語であり、英語の文が残っていないことを確認（144 行目の `it(` は引用規則の検査データであり名称ではない）。
  - 破壊確認 1 — warn 件の期待終了コードを 0 から 1 に変えると 1 件が赤になり、復元した。
  - 破壊確認 2 — `設定なし` の期待文字列を変えると 1 件が赤になり、復元して緑に戻した。
- Findings: なし
- Doubts: なし
