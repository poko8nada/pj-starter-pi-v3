# consult.tools

Acceptance:

- 名前が揃っていない（`consult` は実質「新しい worktree で走らせる物」、`ref_cleanup` は consult の ref を扱う物）、が解ける: `consult` は `consult_new`、`ref_cleanup` は `consult_refs` という名前になる（`consult_resume` は step 12 で足す）
- 説明文・prompt・README・スキルの本文が古い名前のまま、が解ける: 新しい名前になっている（`consult/README.md`、`README.md`、`README.ja.md`、`stack/SKILL.md`、`work/SKILL.md`、`close/SKILL.md`）

Owner: at the end

## Todo

- `.pi/extensions/consult/index.ts`
  - `pi.registerTool` の `name: 'consult'` → `consult_new`（`label`、`description`、`promptSnippet`、`promptGuidelines` も揃える）
  - `pi.registerTool` の `name: 'ref_cleanup'` → `consult_refs`
  - `pi.registerCommand('consult-status' / 'consult-cancel')` は名前を変えない（道具ではなくコマンド）
- `.pi/extensions/consult/tool/consult.ts`
  - `PARAMETERS` はそのまま。`action` の説明と、道具名が出ている文面を直す
- `.pi/extensions/consult/tool/refs.ts`
  - `description` / `promptGuidelines` / 文面の `ref_cleanup` を `consult_refs` に
- `.pi/extensions/consult/README.md`
  - 道具の節を `consult_new` と `consult_refs` で書き直す（`consult_resume` は step 12 で追記）
- `.pi/skills/stack/SKILL.md` / `.pi/skills/work/SKILL.md` / `.pi/skills/close/SKILL.md`
  - `consult` / `ref_cleanup` と書いてある所（`The trial child`、verify の段、`ref_cleanup` の使用）を新しい名前に
- `README.md` / `README.ja.md`
  - 拡張の説明を 2 つの道具（`consult_new` / `consult_refs`）に。`consult_resume` は step 18 で足す

## Verify

### form

- `git grep -n "consult_new"` → 登録（`index.ts`）、説明、`consult/README.md`、スキル、README に出ている（happy）
- `git grep -n "consult_refs"` → 登録、説明、`consult/README.md`、`README.md` / `README.ja.md` に出ている（happy）
- `git grep -n "ref_cleanup"` → 0 件（happy）
- `git grep -n "name: 'consult'"` と、道具としての `consult(` の使用 → 0 件（happy）

## Notes

### Findings

- なし

### Unplanned

- なし

Commit:
