# consult.tools.check

Acceptance:

- 単位の `Then` を全部、1 回で確かめる（`consult_new` / `consult_resume` / `consult_refs` の 3 つが登録され、説明文・prompt・README・スキルの本文に古い名前（`ref_cleanup`、道具としての `consult`）が残っていない）

Owner: at the end

## Todo

- なし（step 7 と step 12 が作った物を、1 回で確かめるだけ）

## Verify

### form

- `git grep` で確かめる
  - `consult_new` / `consult_resume` / `consult_refs` が登録（`index.ts`）と説明に出ている（happy）
  - `ref_cleanup` が `.pi` と `README.md` / `README.ja.md` に 0 件（happy）
  - 道具としての `consult`（`consult(` や `name: 'consult'`）が残っていない（happy）
  - `README.md` / `README.ja.md` が 3 つの名前を持つ（happy）

## Notes

### Findings

- なし
- 親が `.check` を実行した（2026-09-28 15:49）。`Verify` の `form` 4 行とも通った
  - `index.ts` に `registerTool` が 3 つ（`consult_new:17` / `consult_resume:54` / `consult_refs:69`）
  - `ref_cleanup` の言及は `.pi` と `README.md` / `README.ja.md` に 0 件
  - 道具としての `consult` は無い。`git grep` が挙げた 2 件は偽陽性: `run/run.ts:275` のコミットメッセージ `consult(<label>): …` と、`tool/consult.ts:279` の内部関数 `consult(`（どちらも道具の名前ではない）
  - `README.md` / `README.ja.md` が 3 つの名前を持つ（各 3 行）

### Unplanned

- なし

Commit: なし（何も変えない step）
