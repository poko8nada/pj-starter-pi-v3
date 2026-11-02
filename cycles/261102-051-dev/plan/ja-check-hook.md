# PLAN `ja-check-hook`

- No: 03

## Files

```text
lefthook.yaml                update
scripts/
  checks/
    ja-check.mjs
    ja-check.test.ts
  harness/
    harness.json
    collect/
      index.mjs
    diff/
      index.mjs
    index.mjs
  product-ready/
    targets.mjs
package.json
```

## Slices

## 1.ja-check ジョブ

### Types

```ts
なし;
```

### Steps

1. `lefthook.yaml`:
   - `pre-commit` の `checks` グループの 5 番目に `ja-check` ジョブを足し、`glob: '*'`、`run: node scripts/checks/ja-check.mjs {staged_files}`、`stage_fixed: false` を設定し、`fail_text` とルートの `output` は足さず、`parallel: true` は変えない。
     - Outside: `lefthook` と `製品のハーネス`。`{staged_files}` を `lefthook` に渡し、空のときはスキップさせ、`harness.json` の `copy` で製品へ配られるようにする。

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -rniE 'ja-check' --exclude-dir=node_modules --exclude-dir=cycles .` が `lefthook.yaml`、`scripts/checks/ja-check.mjs`、`scripts/checks/ja-check.test.ts` だけを返す。
- Added:
  - `lefthook validate` が成功する。
  - `warn` の語（`骨`）を含む `.md` をステージして `lefthook run pre-commit` を実行し、`ja-check` ジョブが成功して固定行が出ることと、`error` の語（`雛形`）を含む `.md` では `ja-check` ジョブが失敗して固定行が出ることを確かめる。
  - `node -e` で `scripts/harness/harness.json` の `copy` に `lefthook.yaml` があり、`lefthook.yaml` に `ja-check` ジョブがあることを確かめる。
  - `lefthook.yaml` の `checks` グループの 5 番目に `ja-check` ジョブがあり、`parallel: true` のままで、ルートに `output` がないことを確かめる。

## Notes

### Slice 1: ja-check ジョブ

- Findings: なし
- Unplanned: なし
- Commit: ab4621d consult(ja-check-hook): add ja-check lefthook job
- Stopped:

### Cleanup: 重複・廃止のテストなし

対象の `scripts/checks/ja-check.test.ts` 全件（15件）を読み、`scripts/checks/ja-check.mjs` の現行分岐と突き合わせた。`Files` で `update` は `lefthook.yaml` のみであり、テストの追加・更新はない。`ja-check.mjs`、`harness` 系（`harness.json`、`collect/index.mjs`、`diff/index.mjs`、`index.mjs`）、`product-ready/targets.mjs`、`package.json` は記載のみで振る舞いも分岐も変わらないため、対応するテストには手を付けない。近い組はいずれも段違い・欄違いのため残した。正常系（warn/error、0.x.x抑制/1.x.x報告、cycles含む/自己除外）と投げ系（壊れJSONと鍵・値型違い）はいずれも検証層が違う。落とすものはない。

- 重複（0件）: warn/errorは終了コード（0/1）と `[warn]/[error]` と `→ 対応` が違い、表裏のため残した。`'`/`"`/`` ` `` の単独囲み3件は引用符リテラルが違い、片方の対応漏れ（typo）を検出するため残した。単独囲みスキップと前後文字あり報告は表裏の境界が違う。`ROADMAP` の `0.x.x` 抑制と `1.x.x` 報告は抑制範囲の境界が違う。`cycles` 含むと自己除外は対象の内外が違う。引数なしと読めないスキップは分岐（引数なし/`catch` 継続）が違う。壊れJSONと鍵・値型違いは検証層（構文と鍵集合・値型）が違うため1件化しない。
- 消えた振る舞い（0件）: 本計画は `lefthook.yaml` へのジョブ追加のみで既存振る舞いを消さない。`mjs` の分岐（設定なし・壊れ・鍵違い・自己除外・読めないスキップ・`ROADMAP` の `## 0.x.x` 抑制・引用単独スキップ）と突き合わせて、消えた検査は残っていない。
- 計画変更が消す分岐（0件）: `ja-check` 追加は他スクリプトの分岐を消さない。`parallel: true` 維持・ルート `output` なし維持・`glob: '*'`・`stage_fixed: false` は `lefthook.yaml` の表示だけであり、`ja-check.mjs`・`harness` 系・`targets` 系の分岐は従来通りであるため、該当なし。
- `Test cases` が書かないもの（0件）: 計画に `## Test cases` 節がなく、`Steps` に `(happy)` 等の列挙もないためGoal対応は該当なし。前提の再現（型・スキーマ・DBが決めるだけの確認）や誰も気づかないものの追加は本計画になく、前計画で落とした自明・DB断言（未知語・実ファイル内容）を復活させない。`Goal` 行（5番目の配置・`glob`・`stage_fixed`・`parallel` 維持・`output` 既定・`harness` 配布・`validate` 成功・固定行表示）に対応する自動検査はなく、計画が `Verify` の手動（`Added` の4件）に回しているため新設しない。

- Findings: なし
- Unplanned: なし
- Ran: `pnpm test:run`（63ファイル、801件、うち `ja-check.test.ts` 15件、すべて通過）、`pnpm typecheck`、`pnpm lint`、`pnpm format:check` が緑。

## Work Review

### Round 1

- Stale: なし — README.md:77 は4ジョブ列挙のままだが ADR 03 prose:out・設計Non-goalで文書不変と決めたため所見にしない。lefthook.yaml・scripts/checks/ja-check.mjs:1-4・scripts/checks/ja-check.test.ts に古くなる文言なし。
- Unlisted: なし — `git diff --stat` は lefthook.yaml:24-27 の4行追加のみで Files の update と一致し、他ファイルの変更なし。
- Gaps: なし — glob・run・5番目・parallel・output既定・harness配布・固定行はいずれも Added の validate・warn/error実走・copy確認・配置確認で実行される。stage_fixed:false・fail_textなしの文字列厳密照合と空時のスキップは観測不能または lefthook の既定動作（ADR 03 Research）のため挙げない。
- Unproven: なし — 新規テストがなく、Added の手動確認（warn/error実走・validate・配置確認）は run・glob・位置を壊すと赤になる。
- Noise: なし — 新規テストがなく、既存の scripts/checks/ja-check.test.ts:15件は本差分と無関係で型・スキーマが決める前提の再現なし。
- Doubts: なし

## Acceptance

- Ran:
  - `pnpm test:run` — 63 ファイル、801 件、すべて通過（うち `ja-check.test.ts` 15 件）。
  - `pnpm typecheck` — root ok、.pi ok。
  - `pnpm lint` — 通過。
  - `pnpm format:check` — 332 ファイル、通過。
  - `grep -rniE 'ja-check'` → `lefthook.yaml`、`scripts/checks/ja-check.mjs`、`scripts/checks/ja-check.test.ts` の 3 ファイルのみ。
  - `pnpm exec lefthook validate` — All good。
  - `骨` を含む `.md` をステージして `lefthook run pre-commit` — 成功、固定行 `ja-check: 1 ファイル、error 0 件、warn 1 件`、exit 0。
  - `雛形` を含む `.md` をステージして `lefthook run pre-commit` — 失敗、固定行 `ja-check: 1 ファイル、error 1 件、warn 0 件`、exit 1。
  - `harness.json` の `copy` に `lefthook.yaml` があり、`lefthook.yaml` に `ja-check` ジョブがあることを確認。
  - `lefthook.yaml` の 24 行目に `ja-check` ジョブがあり、5 番目（format、lint、typecheck、test、ja-check）で、`parallel: true` のまま、`stage_fixed: false`、`glob: '*'`、ルートの `output` なしを確認。
  - 破壊確認 1 — `run` を存在しない `missing.mjs` に変えると `lefthook run pre-commit` が MODULE_NOT_FOUND で exit 1 になり、復元した。
  - 破壊確認 2 — `ja-check` ジョブを外すと `grep` が赤になり、`has-job: false` になることを確認し、復元した。
- Findings: なし
- Doubts: なし
