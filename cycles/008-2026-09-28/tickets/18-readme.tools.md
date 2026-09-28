# readme.tools

Acceptance:

- README が `consult` と `ref_cleanup` の 2 つとして説明し、`consult_resume` が無い、が解ける: `README.md` / `README.ja.md` が 3 つの道具（`consult_new` / `consult_resume` / `consult_refs`）を説明している

Owner: at the end

## Todo

- `README.md`
  - Extensions の行 — 3 つの道具の説明に書き換える: `consult_new`（会話を見せずに子を走らせる）、`consult_resume`（止まった子の場所を一覧し、そこに子を送り込み、要らなくなったら消す）、`consult_refs`（残した ref の一覧と削除）
- `README.ja.md`
  - 同じ行を同じ意味の日本語で書き換える（英語と日本語で食い違わせない）

## Verify

### form

- `git grep` で確かめる（1 行）
  - `git grep -c "consult_new\|consult_resume\|consult_refs" -- README.md README.ja.md` → 両方のファイルで 3 以上（happy）
  - `git grep -n "ref_cleanup" -- README.md README.ja.md` → 0 件（happy）
  - `consult(` や `name: 'consult'` のような道具としての `consult` → 0 件（happy）
- 英語と日本語を突き合わせる
  - 3 つの名前が両方にあり、説明の役割が同じ（happy）

## Notes

### Findings

- なし

### Unplanned

- なし

Commit:
