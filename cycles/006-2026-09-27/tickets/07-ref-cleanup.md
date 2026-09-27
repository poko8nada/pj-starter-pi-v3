# ref-cleanup

Acceptance:

- 拡張は `consult` 1 つで、`consult` と `ref_cleanup` の 2 つの道具が同じ所から登録される
- `git-env.ts` は `run/` にあり、git を起動する側がそこから読む
- `consult` の README が、2 つの道具（`consult` / `ref_cleanup`）と、実装の木（`policy/` `child/` `run/` `tool/`）を説明している

## Todo

- `.pi/extensions/consult/run/refs.ts`（新規）
  - `ref-cleanup/refs.ts` の論理を移す（`ConsultRef` / `parseRefs` / `listConsultRefs` / `judgeRef` / `deleteRef` / `parseAction` / `runAction` / `GitRun`）。git の起動は今までどおり引数で受ける
- `.pi/extensions/consult/tool/refs.ts`（新規）
  - `ref-cleanup/index.ts` の道具の面を移す（`PARAMETERS` / `result` / `compose` / `execute`）
  - import は `../run/refs.ts` と `../run/run.ts` の `gitEnv` にする
- `.pi/extensions/consult/run/git-env.ts`（新規）
  - `consult/git-env.ts` を移す。`gitEnv` の import を `./run.ts` にする
- `.pi/extensions/consult/index.ts`
  - `ref_cleanup` の `registerTool` を足す（`tool/refs.ts` の `PARAMETERS` / `execute`）。登録だけ、は崩さない
- `.pi/extensions/ref-cleanup/`
  - `index.ts` / `refs.ts` を消す
- テスト
  - `.pi/extensions/ref-cleanup/refs.test.ts` → `.pi/extensions/consult/run/refs.test.ts`（import を `./refs.ts` に）
  - `.pi/extensions/consult/run/run.test.ts` — `../git-env.ts` を `./git-env.ts` に
- `.pi/extensions/consult/README.md`
  - 道具の表を 2 つにする（`consult` / `ref_cleanup`）
  - 実装の木（`policy/` `child/` `run/` `tool/` と、`run/git-env.ts` が検査の補助であること）を書く
  - `## Settings` は step 3 が直すので触らない

## Verify

### test

- `pnpm test:run .pi/extensions/consult`
  - 移した ref の 30 ケースが緑のまま（happy）
  - `list` → `consult/` の ref だけが、接頭辞を落として返る（happy、既存）
  - `delete` で `main` → 拒み、git を呼ばない（error、既存）
  - `delete` で `consulting/x` → 拒む（boundary、既存）
  - `branch -D` が失敗 → 投げる（error、既存）
  - 登録が 2 つになったこと自体はテストで見ない（pi の登録は実演で見る）
  - 権限 / 2 回目 / 並行 → 見ない（git を 1 回打つだけ）

### look

- pi を再読み込みして、道具の一覧に `consult` と `ref_cleanup` がある
- `.pi/extensions/` に `ref-cleanup/` が無い

### form

- `.pi/extensions/` の直下が 3 つ（`consult` / `quality-gate` / `sound-notify`）
- `consult/` の直下が `index.ts` / `README.md` / `types.json` / `child/` / `policy/` / `run/` / `tool/`

## Notes

### Findings

- なし

### Unplanned

- なし

Commit: b27c4bf（ref を取った。`git mv` で移し、振る舞いは変えていない）
