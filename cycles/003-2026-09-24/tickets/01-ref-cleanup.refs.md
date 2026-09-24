# ref-cleanup.refs

Acceptance: 消す前に、消えるものが一覧で見える。`consult` の ref 以外は拒まれる

## Todo

- `.pi/extensions/ref-cleanup/refs.ts`
  - `parseRefs` を書く — git の `--format='%(objectname) %(refname)'` の出力（2 列）を `{hash, name}` の一覧にする。git を起動しない
  - `listConsultRefs` を書く — git の起動を引数で受け取り、`--format='%(objectname) %(refname)'` とパターン `refs/heads/consult/` で絞る。名前から `refs/heads/` を落として `consult/…` にする
  - `judgeRef` を書く — 1 本の名前から `{ok: true}` か `{ok: false, reason}` を返す
  - `refs.test.ts`
    - `parseRefs`: `"abc123 consult/foo\n"` → `[{hash: "abc123", name: "consult/foo"}]` (happy)
    - `parseRefs`: `""` → `[]` (empty)
    - `parseRefs`: `"\n abc123 consult/foo \n\n"` → `[{hash: "abc123", name: "consult/foo"}]` (happy)
    - `parseRefs`: `"abc123 refs/heads/consult/foo"` → `[{hash: "abc123", name: "refs/heads/consult/foo"}]`（`refs/heads/` を落とすのは `listConsultRefs`） (happy)
    - `parseRefs`: `"abc123"`（1 列）→ 投げる (error)
    - `parseRefs`: `"abc123 consult/foo extra"`（3 列）→ 投げる (error)
    - `judgeRef`: `"consult/foo"` → `{ok: true}` (happy)
    - `judgeRef`: `"consult"` → `{ok: false, reason: "consult/ で始まらない"}` (error)
    - `judgeRef`: `"consulting/x"` → `{ok: false, reason: "consult/ で始まらない"}`（前方一致の境目） (error)
    - `judgeRef`: `"main"` → `{ok: false, reason: "consult/ で始まらない"}` (error)
    - `listConsultRefs`: git が `"abc123 abc1234567890123456789012345678901234567\n"` と `"def456 refs/heads/main\n"` を返す → `[{hash: "abc1234567890123456789012345678901234567", name: "consult/foo"}]`（`main` は落ちる） (happy)
    - `listConsultRefs`: git が終了コード 1 で失敗 → 投げる (error)
    - null / undefined → 型で防ぐ（git の出力も ref の名前も常に文字列なので、実行時には来ない）— ケース無し
    - `"consult/"` だけの ref → git が作れない（末尾が `/` の ref は無い）ので、実行時には来ない — ケース無し
    - 権限 → 判定を持たない（git が拒めば「git が失敗」で拾う）— ケース無し
    - 2 回目の呼び出し → 状態を持たない純関数なので、同じ入力なら同じ結果 — ケース無し
    - 並行 → 同上（共有の状態が無い）— ケース無し

## Verify

- `pnpm test:run` が緑（git の起動を差し替えているので、リポジトリの外でも走る）

## Notes

### Findings

なし

### Unplanned

なし

Commit:
