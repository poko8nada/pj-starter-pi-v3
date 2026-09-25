# consult.split

Acceptance:

- 子は type ごとに決まったモデル・ツール・環境・上限・役割で走る（agent が選べるのは type だけ）
- 入力ごとに 1 体走る（入力が 1 つなら 1 体）
- `code` の子のコミットは ref で返り、agent が取り込むかを決める
- `input` の全文が、子のプロンプトの先頭に payload として入る（子が読む文書ではない）
- `consult` の `README` の表が、実際のツールと一致する
- 定義 1 枚のレビューが、出力上限に当たらずに終わる
- agent が、直したいものがどのフォルダにあるか一目で分かる
  - `policy/` `child/` `run/` `tool/`
  - README と json は直下
- `index.ts` を開くと道具の登録だけがあり、進行も整形も見当たらない
- import の向きが一方通行で、逆向きを探しても無い
  - `tool` は `run` を、`run` は `child` を、`child` は `policy` を知っている
- 既存の検査が緑のまま（振る舞いは変えない）

## Todo

- `.pi/extensions/consult/index.ts`
  - `export default`（道具の登録）だけを残す
  - `PARAMETERS` は `tool/consult.ts` が持ち、ここは import して渡す（逆向きの辺を作らない）
- `.pi/extensions/consult/tool/consult.ts`（新規）
  - 道具の面を持たせる — `PARAMETERS`・`Params`・`ExecuteArgs`・`execute`
    - `execute` は型の解決・音・`consult` の呼び出し
  - 進行を持たせる — `consult`・`runOneChild`・`ChildJob`・`Prepared`・`ChildResult`
    - 道具の実行そのもの
    - 実行の道具を呼ぶので、step 3 では `consult/run.ts` を、step 4 で `run/run.ts` を import する
  - **`EXTENSION_DIR` をどうするか決めて書く**
    - `execute` が `tool/` に移ると `dirname(import.meta.url)` は `consult/tool/` を指し、`types.json`（`consult/` 直下）を読めなくなる
    - 定数を `index.ts` に残して渡すか、`tool/` から `../` を指す形にする
    - テストは `execute` を通らないので、黙って壊れる
- `.pi/extensions/consult/tool/render.ts`（新規）
  - 整形と音を持たせる — `compose`・`usageLine`・`pad2`・`refLabel`・`result`・`playSound`・`SOUND_FILE`
- `.pi/extensions/consult/spec.test.ts`
  - `PARAMETERS` の import 先を `./tool/consult.ts` にする
- **中身は書き換えない** — 関数の移動と import の貼り替えだけ（`Notes` に「動かしただけ」と書く）
- 観点のうち、正常系（happy）→ `pnpm test:run` の 4 テストを走らせる → 緑
  - 入力は「移動後のソース」
  - 結果は「4 ファイルが緑」
- 想定エラー経路 → `pnpm test:run` の赤、または道具を 1 回呼んだときの子の起動失敗 (error)
  - import の貼り替え漏れ
  - `types.json` の読み先
  - 期待する値
    - 赤
    - 起動失敗（`types.json` が読めない）
- null・空・境界・不正・権限・2 回目・並行 → ファイルの移動で、呼び出しの意味は変わらない — ケース無し

## Verify

- 実演
  - `pnpm test:run`（4 ファイルが緑のまま）
  - `grep` で `index.ts` に登録以外（`compose`・`playSound`・`consult` の定義）が残っていないことを見る
  - **道具を 1 回呼び、子が起動して返る**（`EXTENSION_DIR` の移動で `types.json` が読めているかを確かめる）

## Notes

### Findings

- プランの step 3 の `Files` に `spec.test.ts` が無い
  - `PARAMETERS` が `index.ts` を出るため、import 先を直す必要がある
  - プランは凍結済みなので、ここに書く
- 実演は次まで
  - `pnpm test:run` → 6 ファイル・166 テストが緑
  - `pnpm typecheck`・`pnpm lint`・`pnpm format:check` → いずれも緑
  - `grep` で `index.ts` に移動した定義（`compose`・`playSound`・`consult` など）が残っていないこと
  - 道具を 1 回呼ぶ実演は親に渡す
- **子の worktree には `types.json` が無い** — git 管理外のファイルは HEAD から作る worktree に入らない
- この worktree にあるのは `types.example.json` だけ
  - 実演の「子が起動して返る」は `EXTENSION_DIR` の決め方に関係なく `types.json` が読めずに落ちる（親の実ツリーでは読める）
- この制約はチケットにも skill にも書かれていない
- `EXTENSION_DIR` は `tool/consult.ts` が `dirname(dirname(fileURLToPath(import.meta.url)))` で `consult/` を指す形にした
- 定数を `index.ts` に残して渡すには道具を工場にする形が要るので、道具が自分の位置から解決し、上向きの辺を作らないようにした
- （親が追記）**親の読み**（Step 8）
  - `index.ts` は登録だけ（25 行）で `PARAMETERS` と `execute` を import する形 ✓
  - 中身は書き換えていない
    - 削除 299 行・追加 314 行を突き合わせると、説明のつかない書き換えは無し
    - 差分は import の貼り替え・`EXTENSION_DIR` の 1 行・`export` の付与・インデントのずれだけ
    - インデントに敏感な確認なので証明ではなく観察
- （親が追記）**実演**（親のツリーで、`/reload` の後）
  - `consult` を 1 回呼んだ（`research`・入力無し・「ok とだけ返せ」）→ 子が起動して `ok` を返した（1 turn・in 235・out 2・$0.0001）
  - `loadTypes(EXTENSION_DIR)` が `types.json` を読めている証拠（読めなければ子を起こす前に落ちる）

### Unplanned

なし

Commit: e064433
