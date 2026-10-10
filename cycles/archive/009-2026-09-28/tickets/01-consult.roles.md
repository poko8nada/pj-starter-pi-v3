# consult.roles

Acceptance:

- `readOnly` が場所を決める: `true` は worktree 引数が任意（無ければ親の木）、`false` は必須（省略 = エラー）
- 上限が全ロールにあり、research 40 / review 40 / trial 60 / code 80 になっている
- `continueByDefault` が型にあり、research `false` / review `false` / trial `true` / code `true`。`consult_run` の引数を省くとこの値が使われる
- 型の `role` にチケット・サイクルの言葉が無く、「終わらなければ、どこまでやったかと止まった理由を報告して終える」の抽象だけになっている
- `environment` を消したことで `child/spec.ts` の `needsIsolation` が壊れない（`readOnly` を読む）

Owner: at the end

## Todo

- `.pi/extensions/consult/types.json`
  - `environment` を消し、`readOnly`（research/review `true`、trial/code `false`）を足す
  - `continueByDefault` を足す（research/review `false`、trial/code `true`）
  - `limits.turns` を research 40 / review 40 / trial 60 / code 80 にする
  - `trial` / `code` の `role` 文を「終わらなければ、どこまでやったかと止まった理由を報告して終える」に置き換える（チケットの言葉を消す）
- `.pi/extensions/consult/policy/types.ts`
  - `Environment` 型と `environment` のパース・検証を消す
  - `readOnly: boolean` と `continueByDefault: boolean` のパース・検証を足す（無い場合はエラー）
  - `needsIsolation` 相当の判定は `readOnly === false` にする
- `.pi/extensions/consult/child/spec.ts`
  - `needsIsolation` が `policy.environment` ではなく `policy.readOnly === false` を読む
- テスト: `.pi/extensions/consult/policy/types.test.ts`（書き換え）、`.pi/extensions/consult/child/spec.test.ts`（`needsIsolation` を `readOnly` で呼ぶ形に）

## Verify

### test

- `pnpm test:run consult/policy/types consult/child/spec`（9 ケース）
  - 正しい 4 ロール（`readOnly` と `continueByDefault` つき）→ パースできる（happy）— 1・2・3 行目を決める
  - `environment` が残っている → 読み込みが失敗する（error）— 1 行目を決める
  - `readOnly` が無い → エラー（error）— 1 行目を決める
  - `continueByDefault` が無い → エラー（error）— 3 行目を決める
  - `turns: 0` と `turns: -1` → エラー（error）— 2 行目を決める
  - `turns: 1` → 通る（boundary）— 2 行目を決める
  - `code` の `role` に「チケット」の語が無い（happy）— 4 行目を決める
  - `needsIsolation`: `readOnly: true` → false、`readOnly: false` → true（happy）— 5 行目を決める
  - 同じ設定を 2 回読む → 同じ結果（a second call）— 1〜5 行目を決める
  - 権限: 該当なし（理由: 読むだけのパースで、権限の分岐を持たない）
  - 同時実行: 該当なし（理由: 純粋なパースで、共有状態を持たない）

## Notes

### Findings

- 後続の step が持ち主の依存先 3 つ: `.pi/extensions/consult/index.ts:20`（道具の説明文が `environment` と言っている）→ step 2（`index.ts`）／`.pi/extensions/consult/run/child.ts:32` のコメントと `:42` のエラー文（`Use a type whose environment is "tree"`）→ step 3（`run/child.ts`）／`.pi/extensions/consult/README.md:19`（ポリシーの説明が `environment`）→ step 8（`consult.docs`）
  - なぜ外か: この step の `Files`（`types.json` / `policy/types.ts` / `child/spec.ts`）のどれでもなく、plan の `Files` でも別の step の担当になっている
  - 観測: `grep -rn "environment" .pi/extensions/consult` が 3 ファイル・4 箇所。テストと typecheck は緑（型で壊れていない）
  - この環境の条件: 型はもう `readOnly` なので、残るのは文字列と説明文だけ。守っているのは step の境界（`Files` の外は触らない）

### Unplanned

- なし

Commit: 6223e60
