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

- 計画とチケットの `Files` は `spec.ts` / `run.ts` / `README.md` だけを挙げるが、`runPi` が stdin を受け取る形にすると呼び出し側の `tool/consult.ts` も直さないと指示が子に届かない。最小の 1 箇所だけ直した（決めた）
- 子は stdin を初回プロンプトの前に連結する（pi の `docs/cli.md`）。`@path` がファイル展開になるのは位置引数のときだけなので、stdin に置けば先頭が `-` / `@` でも文書のまま渡る（決めた）
- `runPi` の stdin への書き込みは IO なので子のテストでは見ない。空の指示は `joinPrompt(undefined, '')` が空文字を返すことで確かめた（決めた）

### Unplanned

- `.pi/extensions/consult/tool/consult.ts` の `runPi` 呼び出し（`task:` の上書きをやめ、`stdin:` を渡す）。チケットの `Files` には無いが、stdin 化に必須

- 親の読み: `task` は `joinPrompt` → stdin で渡り、`buildPiArgs` は task を参照しない（確認）。残る穴: `policy.role` や `policy.tools` の値が `-` や `@` で始まると、同じ引数解析に食われ得る

Commit: 887a3ce（07・08 が同じコミット。`test` 93 件・`read` 通過）
