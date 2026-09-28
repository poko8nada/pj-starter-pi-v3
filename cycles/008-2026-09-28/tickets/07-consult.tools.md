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
- （影響読み `consult-40` の指摘と、親の修正）
  - blocking（直した）: `tool/consult.ts` のエラー文面が `consult:` のままで、`USAGE`（`consult_new:` に改名済み）と自己矛盾していた → 12 か所を `consult_new:` に揃えた（`c743fee`）
  - 未対応: `tool/render.ts:43,46`、`tool/consult.ts:283`、`policy/types.ts:56` の `consult …` は、拡張名として読めば正しい。どこまでを道具名とみなすかがチケットに書いていない（owner の判断）。`[consult]` 行は README が書式として名指ししているのでそのまま
  - 未対応（前からの矛盾、この step がその行を書き換えた）: `tool/consult.ts:4` の「`types.json` は git 管理外」は、README `:78` / `types.ts:180` / `types.test.ts:36`（コミット済み前提）と食い違う
  - 未対応: 改名（登録名）はテストの無い振る舞いの変化。`index.ts` を import するテストは無い
  - 未対応: チケット `:19` は `tool/refs.ts` の `description` / `promptGuidelines` を直せと言うが、それらは `index.ts:44-49` にある（Todo の指す場所が実物と違う）

### Unplanned

- なし

Commit: 4726d7c + c743fee（4726d7c = 子の実装、c743fee = 影響読みの修正（道具自身のメッセージを新しい名前に））
