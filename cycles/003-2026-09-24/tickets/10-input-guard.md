# input-guard

Acceptance: 空の入力では、子が走らずに理由が返る

## Todo

- `.pi/extensions/consult/spec.ts`
  - 入力の検証を書く — 読み終えた payload が空（0 バイト、または空白だけ）なら、理由つきで弾く。001 の規則「無言で、文脈なしの子を走らせない」を形にする
- `.pi/extensions/consult/run.ts`
  - 実装の順を書く — 08 が先に `run.ts` / `spec.ts` を触る（08 の `Verify` はこの step を待たない）。だから 08 → 10 の順で実装する（plan の `Depends` は step 5 しか見ていない）
  - 子を起動する前に弾く — 空が混ざっていれば、その入力について子を走らせず、理由を結果に載せる（`run.ts` の結果まで。`{ok: false, reason: "空の入力"}`）。道具の本文の文言はこの step の担当外（`index.ts` は step 8 の `Files` だが、そこでは `input` の説明しか直さない）— この文言は今サイクルでは扱わず `Findings` に書く
  - 入力なし（`input` を渡さない）は今までどおり 1 体 — 空の「入力リスト」と、空の「1 つの入力」は別物
- `.pi/extensions/consult/spec.test.ts`
  - `isBlank("")` → `true` (empty)
  - `isBlank("   \n\t")` → `true`（空白だけ） (empty)
  - `isBlank("a")` → `false` (happy)
  - `isBlank("0")` → `false`（長さ 0 と中身が「0」は別） (boundary)
  - `isBlank("   a")` → `false`（前後の空白だけでは弾かない） (happy)
  - 想定エラー経路 → この関数は真偽を返すだけで投げない。弾いた結果と理由は `run.ts` が組む — ケース無し
  - null / undefined → 型で防ぐ — ケース無し
  - 権限 / 2 回目 / 並行 → 純関数 — ケース無し
- `.pi/extensions/consult/run.test.ts`
  - 2 入力のうち 1 つが空 → 空のほうは子が走らず `{ok: false, reason: "空の入力"}` が並び、もう 1 つは走る（子の起動回数が 1） (error)
  - 空だけで終わる → 子の起動回数が 0、結果に理由が並ぶ (error)
  - `input` なし（`undefined`）→ 1 体、payload 無し（起動回数が 1） (empty)
  - `[]`（空の配列）→ 1 体（既存の規則） (empty)
  - 不正な入力（数値や配列が混ざる）→ 起動前に投げる (error)

## Verify

- `pnpm test:run` が緑。実演: このセッションから `consult` を呼び、空のファイルを入力に渡す（type は問わない。`research` で試す）。子が走らず、理由（「空の入力」）が結果に返る

## Notes

### Findings

- 実演の結果（`Verify`）: `research` に空ファイル + 中身のあるファイルの 2 入力を渡した → **空のほうは「(the child could not run) 空の入力」が返り、子が走っていない**（`[consult]` の行が無い = 起動回数 0）。**中身のあるほうは走って答えを返した**（1 turns / in 267 / out 6）。チケットの求めた「1 つは止まり、1 つは走る」がそのまま出た
- 空の入力に `[consult]` の行が付かないので、結果を見ただけで「子が走ったか」が分かる
- 置き場所はチケットの `run.ts` ではなく **`index.ts`** にした。`runForInputs` は結果を組む係で、入力の検証はその呼び出し側の仕事（`Notes` の `Unplanned` も参照）
- 結果の形はチケットの `{ok: false, reason}` ではなく実物の **`{ok: false, error}`**（`InputOutcome`）。`isBlank` の 5 件は単体テストで押さえた

### Unplanned

- **実演が実バグを捕まえた。** ガードを `async` でないコールバックに置いたため、`throw` が `inputs.map(...)` を同期で抜け、`Promise.allSettled` が受け取る前に `runForInputs` 全体が棄却された — 空の入力が 1 つあると**全部の子が走らなくなっていた**（実演で「空の入力」だけが返り、2 つ目の結果が出なかった）。`runForInputs` でコールバックを `async` で包んで直し、回帰テスト 2 件を足した（1 件だけ失敗 / 全部空で 0 体）。`019ba68`
- **訂正**: この `Notes` を書く途中で「ガードは `run.test.ts` では試せない」と書いたが誤り。`runForInputs` の側を直したことで、チケットのケースはそのままテストできた
- 親のコード（`consult` 本体）を直した実演は、毎回 `/reload` が要る。子に渡すファイル（`child-guard.ts` など）なら要らない

Commit: d76c77d（ガード）、019ba68（実演で見つけた穴の修正）
