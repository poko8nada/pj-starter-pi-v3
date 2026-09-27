# consult.prompt

Acceptance:

- 子への指示は stdin で渡る（`-` や `@` で始まる文書でも壊れない）

## Todo

- `.pi/extensions/consult/child/spec.ts`
  - `buildPiArgs` — 指示を引数に載せるのをやめ、`ConsultOptions` に指示を持たせる（`--` の行も不要になる）
  - `.pi/extensions/consult/child/spec.test.ts` — 引数の組み立てのケースを入れ替える
    - `task: '調べる'` → 引数に指示が載らない（happy）
    - `task: '---\nname: x'`（先頭が `-`）→ 引数の並びが変わらない（happy、boundary）
    - `task: '@file'`（先頭が `@`）→ 引数の並びが変わらない（happy、boundary）
    - `task: ''`（空）→ 引数は同じで、stdin に空を書く（happy、empty）
    - 指示が undefined → 型で防ぐ（理由: `ConsultOptions.task` は必須。テストしない）
- `.pi/extensions/consult/run/run.ts`
  - `runPi` — 指示を `child.stdin` に書き、閉じる（いまは即 `end()` している）
- `.pi/extensions/consult/README.md`
  - 子への渡し方（指示は stdin）を 1 行足す

## Verify

### test

- `pnpm test:run .pi/extensions/consult/child`
  - `task: '調べる'` → 引数に指示が載らない（happy）
  - `task: '---\nname: x'`（先頭が `-`）→ 引数の並びが変わらない（happy、boundary）
  - `task: '@file'`（先頭が `@`）→ 引数の並びが変わらない（happy、boundary）
  - `task: ''`（空）→ 引数は同じで、stdin に空を書く（happy、empty）
  - `--tools` / `--extension` / `--no-approve` の位置が崩れない（happy、既存ケースが緑のまま）
  - 指示が undefined → 型で防ぐ（理由: `ConsultOptions.task` は必須）
  - 権限 / 2 回目 / 並行 → 見ない（引数の組み立ては純関数）

### read

- `review` の子に `.pi/extensions/consult/child/spec.ts` を渡す
  - 報告させる: 指示がどこを通って子に渡るか、引数の組み立てに指示が混ざらないか

## Notes

### Findings

- なし

### Unplanned

- なし

Commit:
