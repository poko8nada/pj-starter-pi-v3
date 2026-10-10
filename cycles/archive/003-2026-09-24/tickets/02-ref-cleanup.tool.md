# ref-cleanup.tool

Acceptance:

- 消す前に、消えるものが一覧で見える
- `consult` の ref 以外は拒まれる

## Todo

- `.pi/extensions/ref-cleanup/refs.ts`
  - `deleteRef` を書く
    - git の起動を引数で受け取る
    - `git branch -D <名前>` を呼ぶ
    - 終了コード非 0 なら投げる
  - `runAction` を書く
    - `{action: "list"}` なら `listConsultRefs`
    - `{action: "delete", name}` なら `judgeRef` → `deleteRef`
    - git の起動は引数で受け取る
      - 道具の登録から切り離し、ここでテストできる形にする
- `.pi/extensions/ref-cleanup/index.ts`
  - `parseAction` を書く
    - `action` と `name` を検証する
    - `{action: "list"} | {action: "delete", name}` にする
  - 道具を登録する
    - 名前は `ref_cleanup`
    - `parseAction` → `runAction` を呼ぶ
    - 返り値を本文にする
- `.pi/extensions/ref-cleanup/refs.test.ts`
  - `deleteRef`: git が成功 → 名前を返す (happy)
  - `deleteRef`: git が失敗（終了コード 1）→ 投げる (error)
  - `runAction`: `list` → `[{hash: "abc1234567890123456789012345678901234567", name: "consult/foo"}]` (happy)
  - `runAction`: `delete` で `consult/foo` → `{deleted: "consult/foo"}` が返る (happy)
    - `deleteRef` が 1 回呼ばれる
  - `runAction`: `delete` で `main` → `{refused: "consult/ で始まらない"}` が返る (error)
    - `deleteRef` は呼ばれない
  - `runAction`: `delete` で `consulting/x` → 同じく拒む（前方一致の境目） (error)
  - `runAction`: `delete` で `""` → `{refused: "consult/ で始まらない"}`（空の名前） (empty)
  - `runAction`: `list` → `deleteRef` は呼ばれない（一覧で消さない） (happy)
  - `parseAction`: `{action: "list"}` → `{action: "list"}` (happy)
  - `parseAction`: `{action: "delete", name: "consult/foo"}` → 同じ (happy)
  - `parseAction`: `{}` → 投げる (error)
  - `parseAction`: `{action: "rm"}` → 投げる (error)
  - `parseAction`: `name` が無い（`delete`）→ 投げる (error)
  - `parseAction`: `name` が空文字（`delete`）→ 投げる (error)
  - null → 型で防ぐ
  - undefined → 型で防ぐ
    - 引数はオブジェクト
    - git の出力は文字列
    - ケース無し
  - 権限 → 判定を持たない
    - git が拒めば `deleteRef` の失敗で拾う
    - ケース無し
  - 2 回目 → 状態を持たない
  - 並行 → 状態を持たない
    - git の起動を差し替えるので、多重でも互いに干渉しない
    - ケース無し

## Verify

- `pnpm test:run` が緑
- `runAction` のテストが `Then` の 1（一覧）と 2（拒否）をその場で覆う

## Notes

### Findings

- `parseAction` を `index.ts` ではなく `refs.ts` に置いた
  - チケットは `index.ts` と書いていた
  - テストから読むには、拡張の登録を import せずに済ませたい
    - 登録は pi の型を読む
  - `index.ts` は登録だけになった
- `gitEnv` は `consult/run.ts` にある
  - `GIT_*` を落とす環境
  - `../consult/run.ts` から借りた
    - 同じものを 2 つ持たないため
- 登録した道具の呼び出しは step 3 の実演で見る
  - 拡張は起動時に読まれるので、`/reload` の後

### Unplanned

- なし

Commit: a1c606c
