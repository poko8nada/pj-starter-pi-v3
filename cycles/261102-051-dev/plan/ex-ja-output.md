# PLAN `ex-ja-output`

## Files

```text
scripts/
  checks/
    ja-check.mjs             update
    ja-check.test.ts         update
```

## Slices

## 1.報告の出力

### Types

```ts
なし;
```

### Steps

1. `scripts/checks/ja-check.mjs`:
   - このスクリプトは実行するたびに英語の冒頭 2 行を出し、1 行目を `ja-check: Report to the owner. warn needs judgement (commit continues); error must be fixed (commit stops).` とし、2 行目を `ja-check: Replacements are ideas; judge by context and content.` とし、該当 1 件ごとに行を出して `<file>:<line>: <語> → <対応> [warn|error]` のあとに該当箇所の前後 10 文字を `…` で挟み、該当の語を `[` と `]` で挟んで丸括弧に入れて付け、前後がない側は欠けたまま崩さずに出し、該当が 0 件で設定がある場合は `ja-check: No findings.` の行を出し、設定がない場合は `ja-check: No config.` の行を出してどちらかだけを出し、集計行を `ja-check: <n> files, error <n>, warn <n>.` として 0 件のときも必ず出し、終了コードを（`warn` と引数なしとファイルが読めない場合は `exit 0`、`error` と壊れた設定の場合は `exit 1`）に保ち、100 ファイルを 1 秒未満で処理できるように保ち、1 行目から 4 行目の注釈を新しい出力に合わせて直し、`設定なし` の表記を `ja-check: No config.` にそろえる。
2. `scripts/checks/ja-check.test.ts`:
   - テストの期待値 15 件を新しい出力に合わせて直し、終了コードと振る舞いは変えず、行頭と行末の欠けは既存の単独行の入力で確かめる。
   - (happy) `WARN_WORD` を含む `.md` を渡す → 冒頭 2 行と語を `[` と `]` で挟んだ前後 10 文字と集計行が出て、`exit 0` で終わる。
   - (happy) `ERROR_WORD` を含む `.md` を渡す → `[error]` と語を `[` と `]` で挟んだ前後 10 文字が出て、`exit 1` で終わる。
   - (empty) 該当なしの `.md` を渡す → `ja-check: No findings.` が出て、集計行が出る。
   - (empty) `ja-check.json` がない状態で実行する → `ja-check: No config.` の行が集計行より前に出て、`ja-check: No findings.` は出ない。
   - (boundary) 壊れた `ja-check.json` を渡して実行する → 冒頭 2 行が出て、`exit 1` で終わる。

### Verify

- Always:
  - `pnpm test:related scripts/checks/ja-check.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -n 'and a summary line' scripts/checks/ja-check.mjs` が何も返さないことを確かめる。
- Added:
  - `pnpm test:related scripts/checks/ja-check.test.ts` が 18 件すべて通過する。
  - `mktemp -d` で作った一時ルートに `scripts/checks/ja-check.json`（`WARN_WORD` は `warn`、`ERROR_WORD` は `error`）と 3 個の `.md`（`WARN_WORD` を含む行、該当なしの行、空行）を置き、3 個の `.md` を引数に `node scripts/checks/ja-check.mjs` を実行する → 冒頭 2 行と語を `[` と `]` で挟んだ前後 10 文字と集計行が出て、`exit 0` で終わる。
  - 同じ一時ルートで該当なしの `.md` 1 個だけを引数にして実行する → `ja-check: No findings.` が出て、`exit 0` で終わる。
  - `ja-check.json` を置かずにコマンドを実行する → `ja-check: No config.` が集計行より前に出て、`ja-check: No findings.` は出ず、`exit 0` で終わる。
  - `mktemp -d` で作った一時ルートに 100 個の `.md` を作り、`time node scripts/checks/ja-check.mjs <100 files>` の real が 1 秒未満であることを確かめる。

## Notes

### Slice 1: 報告の出力

- Findings: なし
- Unplanned:
  - テスト名2件の `節` が `ja-check` の `error` に当たり `pre-commit` が止まったため、置き換え先の `セクション` に直した。
- Commit: 87e6804 consult(ex-ja-output): use English report output
- Stopped:

### Cleanup: 重複・廃止のテストなし

対象の `scripts/checks/ja-check.test.ts` 全件（16件）を読み、`scripts/checks/ja-check.mjs` の現行分岐と突き合わせた。`Files` で `update` は `ja-check.mjs` と当該テストの2件のみであり、報告出力の英語化だけで終了コードと振る舞いは変わらないため、他のテストには手を付けない。近い組はいずれもレベル違い・欄違いのため残した。正常系（warn/error、0.x.x抑制/1.x.x報告、cycles含む/自己除外）と投げ系（壊れJSONと鍵・値型違い）はいずれも検証レイヤーが違う。落とすものはない。

- 重複（0件）: warn/errorは終了コード（0/1）と `[warn]/[error]` と `→ 対応` が違い、表裏のため残した。`'`/`"`/`` ` `` の単独囲み3件は引用符リテラルが違い、片方の対応漏れ（typo）を検出するため残した。単独囲みスキップと前後文字あり報告は表裏の境界が違う。`ROADMAP` の `0.x.x` 抑制と `1.x.x` 報告は抑制範囲の境界が違う。`cycles` 含むと自己除外は対象の内外が違う。引数なしと読めないスキップと該当なしは分岐（引数なし/`catch` 継続/正常走査で打鍵なし）が違う。壊れJSONと鍵・値型違いは検証レイヤー（構文と鍵集合・値型）が違うため1件化しない。新設の該当なしは単独行の欠け（前後なしの `(…[語]…)`）を確かめ、前後あり報告（`it('[語]extra')`）と対になるため残した。
- 消えた振る舞い（0件）: 本計画は報告出力の英語化のみで既存振る舞いを消さない。`mjs` の分岐（設定なし・壊れ・鍵違い・自己除外・読めないスキップ・`ROADMAP` の `## 0.x.x` 抑制・引用単独スキップ）と突き合わせて、消えた検査は残っていない。旧日本語表記（`設定なし`・`ファイル、〜件`）を断言する検査は残らず、設定なし検査の `not.toContain('設定なし')` は退場の確認だけのため残した。
- 計画変更が消す分岐（0件）: 英語化は終了コードと振る舞いを保ち、他スクリプトの分岐を消さない。`ja-check.mjs` の分岐は従来通りであり、該当なし。100件1秒の維持も分岐を消さないため該当なし。
- `Test cases` が書かないもの（0件）: 本計画に `## Test cases` セクションがなく、`Steps` の `(happy)` 等5件は既存期待値の更新と新設1件（該当なし）の指定であり、自明・DB断言の新設ではない。前提の再現（型・スキーマ・DBが決めるだけの確認）や誰も気づかないものの追加は本計画になく、前計画で落とした自明・DB断言（未知語・実ファイル内容）を復活させない。`Goal` 行に対応する自動検査の新設はなく、計画が `Verify` の手動（3個のmd実走・該当なし実走・設定なし実走・100件1秒）に回しているため新設しない。

- Findings: なし
- Unplanned: なし
- Ran: `pnpm test:related scripts/checks/ja-check.test.ts`（16 passed）、`pnpm test:run`（63ファイル、802件、すべて通過）、`pnpm typecheck`、`pnpm lint`、`pnpm format:check` が緑。

### Added手動の記録（Round 1）

- 3-md実走: 一時ルートに `ja-check.json` と3個の `.md` を置き、3個を引数に実行 → 冒頭2行と前後10文字と `ja-check: 3 files, error 0, warn 1.` が出て、`exit 0` で終わった。
- 該当なし実走: 同じ一時ルートで該当なしの `.md` 1個だけを実行 → `ja-check: No findings.` と `ja-check: 1 files, error 0, warn 0.` が出て、`exit 0` で終わった。
- 設定なし実走: `ja-check.json` を置かずに実行 → `ja-check: No config.` が集計行より前に出て、`ja-check: No findings.` は出ず、`ja-check: 1 files, error 0, warn 0.` で `exit 0` で終わった。
- 100件実走: 一時ルートに100個の `.md` を作り実行 → 26ms（1秒未満）で `exit 0`、`ja-check: No findings.` が出た。

- Findings: なし
- Unplanned: なし

## Work Review

### Round 1

- Stale:
  - scripts/checks/ja-check.test.ts:227 の `it('設定なし → 設定なし行をサマリーより前に出してexit 0')` は題名に旧表記 `設定なし行` を残したままで、新出力 `ja-check: No config.` と食い違う。理由: Steps は `設定なし の表記を `ja-check: No config.` にそろえる` を求め、本文の断言は更新済みだが題名だけ旧語が残り、`grep 設定なし` で当該題名と退場確認の `not.toContain` のみが残るため。
  - fixed: `scripts/checks/ja-check.test.ts:227` の題名を `設定なし → No config行をサマリーより前に出してexit 0` に直し、本文の `No config.` とそろえた。
- Unlisted:
  - なし — `git diff 521ef4ea5dd54a331a6c4fb26db2ee5b589fe26..HEAD --stat` が `scripts/checks/ja-check.mjs` と `scripts/checks/ja-check.test.ts` の2件のみで、Files の2件と一致することを確かめた。
- Gaps:
  - scripts/checks/ja-check.mjs:89-93 の前後10文字への切り詰め (`at - 10` / `at + word.length + 10`) を確かめる自動検査がない。理由: Steps は該当箇所の前後10文字を要求するが、テストの入力は `骨` の単独行 (前後0文字、scripts/checks/ja-check.test.ts:60) と `it('骨extra')` (前後4・7文字、同:177) のみで、10文字を超える行で切り詰められる分岐を exercise しておらず、Verify Added の手動3-md走査も長行を含まない。
  - fixed: `前後が長い行 → 前後10文字に切り詰めて報告する` を追加し、前後15文字の行で前後10文字だけの `(…[語]…)` と15文字全体の不在と集計行を断言した。
  - scripts/checks/ja-check.mjs:47-49 の頂点が非レコード (`null`・配列・文字列など) のときの冒頭2行を確かめる検査がない。理由: Steps は `実行するたびに英語の冒頭2行` と `(boundary) 壊れた設定 → 冒頭2行` を求め、`failConfig` 化で全不正分岐に冒頭2行が付いたが、テストは構文エラー (scripts/checks/ja-check.test.ts:246) と鍵・値型違い (同:256-270) のみで頂点非レコードの分岐を exercise していない。
  - fixed: `頂点が非レコードの設定 → 冒頭2行を出してexit 1` を追加し、`null`・配列・文字列の3種で冒頭2行と `exit 1` を確かめた。
- Unproven:
  - scripts/checks/ja-check.test.ts:63-64 ほか各テストの `toContain(HEADER_1)` + `toContain(HEADER_2)` は順序と先頭位置を断言しないため、2行を入れ替えても findings の後に出しても緑のまま。理由: Steps は1行目と2行目の文面と順序を決めているが、順序・冒頭2行の断言がなく、Verify Added の手動 `冒頭2行` のみが頼り。
  - fixed: warn報告テストに `indexOf(HEADER_1)` が `0` で `indexOf(HEADER_2)` がそれより大きいことの断言を足し、順序と先頭位置を固定した。
  - scripts/checks/ja-check.test.ts:244-252 と同:254-277 の壊れた設定テストは `status` と冒頭2行のみを見て `stderr` の `is not valid JSON` と集計行なしを確かめないため、stderr を消しても集計行を足しても緑のまま。理由: `out.stderr` の断言と `No findings.`・`files, error` 集計行の不在断言がなく、正常系の排他断言 (`not.toContain`) と対照的に壊れ系にはない。
  - fixed: 壊れ設定と鍵・値型違いの3実行に `stderr` の `is not valid JSON` と集計行 (`files, error`) と `No findings.` の不在断言を足した。
- Noise:
  - なし — `HEADER_1/HEADER_2`・`(…[語]…)`・`ja-check: <n> files, ...` のリテラルは plan が文面を決めた値のため除外規定により finding にせず、残りに型・スキーマ・DB が決めるだけの断言や誰も気づかない振る舞いの新設はなく、数値は入力由来の件数で magic number ではないことを確かめた。
- Doubts:
  - cycles/261102-051-dev/adr.md:50 と cycles/261102-051-dev/design.md:63 が旧日本語集計行 `ja-check: <n> ファイル、error <n> 件、warn <n> 件` の記述のまま残るが、履歴的記録か生きた仕様か判断できず finding にしなかった。
  - left: 採用済みの記録は履歴のため直さない。出力文面の変更はcloseのトリアージに回し、`adr.md` と `design.md` は触らない。
  - cycles/261102-051-dev/plan/ex-ja-output.md:70 の Ran に Verify Added の手動 (`mktemp` での3-md実走・該当なし実走・設定なし実走・100件1秒) の記録がなく自動テストのみのため、手動が済んだか確認できず finding にしなかった。
  - fixed: Addedの手動4件（3-md実走・該当なし実走・設定なし実走・100件1秒）を実行し、結果を ## Notes に記録した。

### Round 2

- Stale: なし — fixed 1件を確認。`scripts/checks/ja-check.test.ts:250` の題名が `設定なし → No config行をサマリーより前に出してexit 0` で本文の `ja-check: No config.`（同:257）とそろい旧 `設定なし行` が残らないため、指摘の食い違いは閉じている。
- Unlisted: なし — Round 1 の `fixed:` は Stale・Gaps・Unproven・Doubts にあり、`Unlisted` には `fixed:` がないため対象外である（:89-:90）。
- Gaps: なし — fixed 2件を確認。`scripts/checks/ja-check.test.ts:192-207` が前後15文字の行で前後10文字だけの `(…[骨]…)` と15文字全体の不在と集計行を断言し実装 `scripts/checks/ja-check.mjs:89-93` の切り詰めに対応するため、長行の穴は閉じている。`scripts/checks/ja-check.test.ts:311-321` が `null`・配列・文字列の3種で冒頭2行と `exit 1` を確かめ実装 `scripts/checks/ja-check.mjs:43-49` の `isRecord`→`failConfig` に対応するため、頂点非レコードの穴は閉じている。
- Unproven: なし — fixed 2件を確認。`scripts/checks/ja-check.test.ts:72-75` が `indexOf(HEADER_1)` が `0` で `indexOf(HEADER_2)` がそれより大きいことを断言し実装 `scripts/checks/ja-check.mjs:15-18,107` の先頭順序出力に対応するため、入れ替え・後出しで赤になる。`scripts/checks/ja-check.test.ts:267-278,280-309` の3実行が `stderr` の `is not valid JSON` と集計行（`files, error`）と `No findings.` の不在を断言し実装 `scripts/checks/ja-check.mjs:20-24` の `failConfig` に対応するため、stderr消去・集計行追加で赤になる。
- Noise: なし — Round 1 の `fixed:` は上記の5件とDoubtsの1件であり、`Noise` には `fixed:` がないため対象外である（:101-:102）。
- Doubts: なし — fixed 1件を確認。`## Notes:72-77` にAdded手動4件（3-md実走・該当なし実走・設定なし実走・100件26ms）の結果が記録され `Verify Added`（:44-:47）の確認不能は閉じている。`left:` の1件（:104-:105）は対象外であり、新たに所見に至る疑義もない。

## Acceptance

- Ran:
  - `pnpm test:related scripts/checks/ja-check.test.ts` — 18 件すべて通過。
  - `pnpm test:run` — 63 ファイル、804 件、すべて通過。
  - `pnpm typecheck` — root ok、.pi ok。
  - `pnpm lint` — 通過。
  - `pnpm format:check` — 334 ファイル、通過。
  - `grep -n 'and a summary line' scripts/checks/ja-check.mjs` — 何も返さない。
  - 一時ルートの 3 個の `.md` で実行 — 冒頭 2 行と `[WWORD]` の前後と `ja-check: 3 files, error 0, warn 1.` が出て、`exit 0`。
  - 該当なしの 1 個で実行 — `ja-check: No findings.` が出て、`exit 0`。
  - 設定なしで実行 — `ja-check: No config.` が集計行より前に出て、`ja-check: No findings.` は出ず、`exit 0`。
  - 100 個の `.md` で実行 — real 0.027 秒（1 秒未満）。
  - 破壊確認 1 — 冒頭 1 行目の文言を変えると 18 件が赤になり、復元した。
  - 破壊確認 2 — 該当語の `[` と `]` を外すと該当行の 6 件が赤になり、復元した。
- Findings:
  - `Verify` の `Added` の「16 件」を「18 件」に直す（切り詰めと頂点非レコードの 2 件が増えたため）。
- Doubts: なし
