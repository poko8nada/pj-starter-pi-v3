# consult.doc

Acceptance:

- `input` の全文が、子のプロンプトの先頭に payload として入る
  - 子が読む文書ではない
- `consult` の `README` の表が、実際のツールと一致する

## Todo

- `.pi/extensions/consult/spec.ts`
  - payload を組み立てる関数を読む — いま子のプロンプトにどう入るかを確かめる
  - 先頭に連結される形にする — `payload + "\n" + task`
    - 入力ごとに 1 体なので、1 回の呼び出しに payload は 1 つ
    - 2 つ渡しても 2 回の呼び出しになり、2 つとも先頭に入る
- `.pi/extensions/consult/run.ts`
  - 子の起動は `buildPiArgs` を通るので、`-e child-guard.ts` は自動で入る
  - この step で明示的に足すものは無い
    - 落としても緑にならないよう、ここに書く
  - 実装の順を書く — 05 → 08 の順で実装する
    - 05（`secret-guard.consult`）と同じ `run.ts` を触る
    - plan の `Depends` は step 7 しか見ていない
  - 子の起動で、その組み立てたプロンプトを渡す
  - 別の口（stdin など）にも流していれば、そちらを消す
  - `RunOptions.payload` の扱いを決めて `Notes` に書く — 消すか残すか
    - `readPayloads` は残る
      - 既存のテストが使う
    - `runForInputs` は残る
      - 既存のテストが使う
- `.pi/extensions/consult/index.ts`
  - 道具の説明（`PARAMETERS`）を直す — `input` は子が読む文書ではない
    - `input` はプロンプトの先頭に連結されるテキスト
- `.pi/extensions/consult/README.md`
  - `input` の意味を書く — 上と同じ文
  - ツール表を実物に合わせる — `types.json` の `tools` と一致させる（`fetch_content` の有無など）
  - 上限の読み方を書く
    - 実物は `types.json`（git 管理外）
    - clone が受け取るのは `types.example.json`
- `.pi/extensions/consult/spec.test.ts`
  - payload `"PAYLOAD"` + task `"TASK"` → `"PAYLOAD\nTASK"`（文字列そのものが一致する） (happy)
  - payload 無し + task `"TASK"` → `"TASK"` (happy)
  - payload が `""` + task `"TASK"` → `"TASK"`（空の payload を足さない） (happy)
  - payload が `"A\nB"` + task `"T"` → `"A\nB\nT"`（payload の中の改行を壊さない） (happy)
  - payload が空白だけ `"  "` + task `"TASK"` → `"  \nTASK"` (happy)
    - 空白は空とみなさない
    - 空とみなすのは入力の段で step 10 が決める
  - 想定エラー経路 — ケース無し
    - 組み立ては純関数で投げない
    - 読めない入力は `run.ts` 側が扱う
    - この step の担当外
  - null → 型で防ぐ — ケース無し
  - undefined → 型で防ぐ — ケース無し
  - 権限 → 純関数（組み立てるだけ） — ケース無し
  - 2 回目 → 純関数（組み立てるだけ） — ケース無し
  - 並行 → 純関数（組み立てるだけ） — ケース無し

## Verify

- `pnpm test:run` が緑
- 実演: `research` の子を 1 体走らせ、子の返答が payload を引用する
- README の表（ツール一覧）と `types.json` を読み合わせる
  - 上限の値も両方のファイルで一致することを見る

## Notes

### Findings

- **コードがドキュメントに追いついていなかった**
  - README は前から「prepended to the child's prompt… the payload first and the task after it」と書いていた
  - 実装は payload を **stdin** に流していた
  - 実装を README に合わせた
- `RunOptions.payload` は**消した**
  - 使っていたのは `run.ts` の stdin だけ
  - `run.test.ts` は `readPayloads` のほうしか見ていない

### Unplanned

- なし

Commit: 28ddbbb
