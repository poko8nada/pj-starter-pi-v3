# consult.split

Acceptance:

- 子は type ごとに決まったモデル・ツール・環境・上限・役割で走る
  - agent が選べるのは type だけ
- 入力ごとに 1 体走る
  - 入力が 1 つなら 1 体
- `code` の子のコミットは ref で返る
  - agent が取り込むかを決める
- `input` の全文が、子のプロンプトの先頭に payload として入る
  - 子が読む文書ではない
- `consult` の `README` の表が、実際のツールと一致する
- 定義 1 枚のレビューが、出力上限に当たらずに終わる
- agent が、直したいものがどのフォルダにあるか一目で分かる
  - `policy/`
  - `child/`
  - `run/`
  - `tool/`
  - README と json は直下
- `index.ts` を開くと道具の登録だけがある
  - 進行も整形も見当たらない
- import の向きが一方通行で、逆向きを探しても無い
  - `tool` は `run` を知っている
  - `run` は `child` を知っている
  - `child` は `policy` を知っている
- 既存の検査が緑のまま
  - 振る舞いは変えない

## Todo

- `.pi/extensions/consult/index.ts`
  - `export default`（道具の登録）だけを残す
  - `PARAMETERS` は `tool/consult.ts` が持ち、ここは import して渡す
    - 逆向きの辺を作らない
- `.pi/extensions/consult/tool/consult.ts`（新規）
  - 道具の面を持たせる
    - `PARAMETERS`
    - `Params`
    - `ExecuteArgs`
    - `execute`
    - 型の解決
    - 音
    - `consult` の呼び出し
  - 進行を持たせる
    - `consult`
    - `runOneChild`
    - `ChildJob`
    - `Prepared`
    - `ChildResult`
    - 道具の実行そのもの
    - 実行の道具を呼ぶ
      - step 3 では `consult/run.ts` を import する
      - step 4 で `run/run.ts` を import する
  - **`EXTENSION_DIR` をどうするか決めて書く**
    - `execute` が `tool/` に移ると `dirname(import.meta.url)` は `consult/tool/` を指す
    - `types.json`（`consult/` 直下）が読めなくなる
    - 定数を `index.ts` に残して渡すか、`tool/` から `../` を指す形にする
    - テストは `execute` を通らないので、黙って壊れる
- `.pi/extensions/consult/tool/render.ts`（新規）
  - 整形と音を持たせる
    - `compose` — 子の出力を 1 つのテキストにまとめる
    - `usageLine` — 消費量の 1 行
    - `pad2` — 2 桁に揃える
    - `refLabel` — ref の名前
    - `result` — 道具の戻り値
    - `playSound` — 開始と終了の音
    - `SOUND_FILE` — 鳴らす音のファイル
- `.pi/extensions/consult/spec.test.ts`
  - `PARAMETERS` の import 先を `./tool/consult.ts` にする
- **中身は書き換えない**
  - 関数の移動と import の貼り替えだけ
  - `Notes` に「動かしただけ」と書く
- 移動後のソース → 4 ファイルが緑 (happy)
- import の貼り替え漏れ → 赤 (error)
- `types.json` の読み先 → 子の起動失敗 (error)
- 観点（null / 空 / 境界 / 不正 / 権限 / 2 回目 / 並行）
  - ファイルの移動で、呼び出しの意味は変わらない — ケース無し

## Verify

- 実演
  - 4 ファイルが緑のまま
  - `index.ts` に登録以外が残っていない
    - `compose`
    - `playSound`
    - `consult` の定義
  - 道具を 1 回呼ぶと、子が起動して返る
    - `EXTENSION_DIR` の移動で `types.json` が読めているか

## Notes

### Findings

- **プランの step 3 の `Files` に `spec.test.ts` が無い** — `PARAMETERS` が `index.ts` を出るため import 先を直す必要がある。プランは凍結済みなのでここに書く（決めた）
- **子の worktree には `types.json` が無い** — git 管理外のファイルは HEAD から作る worktree に入らず、そこにあるのは `types.example.json` だけ。実演の「子が起動して返る」は `EXTENSION_DIR` の決め方に関係なく読めずに落ちる。親の実ツリーでは読める。この制約はチケットにも skill にも書かれていない（次へ回す）
- **`EXTENSION_DIR` は道具に自分の位置から解決させた** — 定数を `index.ts` に残して渡すと道具を工場にする形が要る。上向きの辺を作らないことを優先した（決めた）
- **実演** — `consult` を 1 回呼ぶと子が起動し `ok` を返した。`loadTypes(EXTENSION_DIR)` が `types.json` を読めている証拠（読めなければ子を起こす前に落ちる）（決めた）

### Unplanned

なし

Commit: e064433
