# consult.check

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

- なし（この step に成果物は無い）
  - 実演が確かめる
- 観点のうち、正常系 (happy) → 検査が緑
- 想定エラー経路 (error)
  - 移した先で子が起動しない
  - `types.json` が読めない
  - 実演 ④ の中で見る
  - 期待する値: 起動失敗（「読めない」理由が出る）
- 観点（null / 空 / 境界 / 不正 / 権限 / 2 回目 / 並行）
  - 作るものが無く、実演がその場で見る — ケース無し

## Verify

- 実演
  - ① 検査が緑
  - ② `.pi/extensions/consult/` の直下が次のものだけであること
    - `index.ts`
    - `README.md`
    - `.gitignore`
    - `types.json`
    - `types.example.json`
    - `policy/`
    - `child/`
    - `run/`
    - `tool/`
    - `types.json` は git 管理外
  - ③ import の辺
    - `tool` は `run` を知っている
    - `run` は `child` を知っている
    - `child` は `policy` を知っている
    - 逆向きが無い
  - ④ 実際に起動する子 1 体
    - `review` の子に 003 の 1 枚を当て、出力上限に当たらずに終わる
    - `out` のトークンを `Notes` に書く
  - ⑤ `consult` の `README` の表と `types.json` の `tools` が一致する（読み合わせ）

## Notes

### Findings

- **`review` の `turns`** — 20 では足りない（決めた）
  - チケット 9 枚の全体レビューが、読むだけで 20 を使い切った
  - 報告の前に止まった
  - この step の実演で踏んだのではなく、チケットのフェーズで踏んだ
  - `turns` を 40 に上げた
  - `types.json` と `types.example.json` を揃えた
  - この変更はこの step の `Files`（なし）ではない。ツールの失敗から出た、プランに無い変更
  - 合意の材料としてここに残す
- **実演** — 緑（決めた）
  - 実際に起動する子 1 体: `review` の子に 003 の 1 枚を当てた → out 27,825
    - 出力上限 60,000 に当たらない
    - 子の報告は findings 8 件（blocking 3）
    - 中身は「003 の 1 枚が 004 の変更より前の記述である」か「既に記録済みの次の 1 枚が受ける穴（`09-readme` の `work` の行）」で、新しい穴は無かった
- **直下のファイル** — チケットの期待より 1 つ多い（決めた）
  - `git-env.ts` は事故の対処で増えた検査用のヘルパー
  - チケット 04 の `Notes` にも記録
- **一方向性の例外** — 逆向きが 1 本、同じ層の中が 1 本、4 層の型の外が 1 本（決めた）
  - `child/spec.test.ts` → `../tool/consult.ts`（`PARAMETERS` のためで、チケット 04 が指定）
  - `tool/consult.ts` → `./render.ts`（step 3 が作った）
  - 検査用の `git-env.ts` ↔ `run/` の辺もある

### Unplanned

なし

Commit: なし（コードを変えない。実演だけ）
