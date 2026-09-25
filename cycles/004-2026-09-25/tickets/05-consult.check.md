# consult.check

Acceptance: 子は type ごとに決まったモデル・ツール・環境・上限・役割で走る（agent が選べるのは type だけ）。入力ごとに 1 体走る（入力が 1 つなら 1 体）。`code` の子のコミットは ref で返り、agent が取り込むかを決める。`input` の全文が、子のプロンプトの先頭に payload として入る（子が読む文書ではない）。`consult` の `README` の表が、実際のツールと一致する。定義 1 枚のレビューが、出力上限に当たらずに終わる。agent が、直したいものがどのフォルダにあるか一目で分かる（`policy/` `child/` `run/` `tool/`。README と json は直下）。`index.ts` を開くと道具の登録だけがあり、進行も整形も見当たらない。import の向きが一方通行で、逆向きを探しても無い（`tool` は `run` を、`run` は `child` を、`child` は `policy` を知っている）。既存の検査が緑のまま（振る舞いは変えない）

## Todo

- なし（この step に成果物は無い。実演が確かめる）
- 観点のうち、正常系（happy）→ `pnpm test:run` の 5 テスト（4 + `refs.test.ts`）を走らせる → 緑
- 想定エラー経路（移した先で子が起動しない / `types.json` が読めない）→ 実演 ④ の中で見る。期待する値: 起動失敗（「読めない」理由が出る） (error)
- null / 空 / 境界 / 不正 / 権限 / 2 回目 / 並行 → 作るものが無く、実演がその場で見る — ケース無し

## Verify

- 実演: ① `pnpm test:run` が緑 ② `ls -a` で `.pi/extensions/consult/` の直下が `index.ts` / `README.md` / `.gitignore` / `types.json` / `types.example.json` / `policy/` `child/` `run/` `tool/` だけであること（`types.json` は git 管理外なので `git ls-files` では見えない） ③ `tool` は `run` を、`run` は `child` を、`child` は `policy` を知り、逆向きが無い（`grep`）④ 生きた子 1 体 — `review` の子に 003 の 1 枚を当て、出力上限に当たらずに終わる（`out` のトークンを `Notes` に書く）⑤ `consult` の `README` の表と `types.json` の `tools` が一致する（読み合わせ）

## Notes

### Findings

- **`review` の `turns` は 20 では足りない** — チケット 9 枚の全体レビューが、読むだけで 20 を使い切り、報告の前に止まった（**この step の実演で踏んだのではなく、チケットの段で踏んだ**）。`turns` を 40 に上げ、`types.json` と `types.example.json` を揃えた。この変更はこの step の `Files`（なし）ではない — ツールの失敗から出た、プランに無い変更。合意の材料としてここに残す
- （親が追記）**実演の結果**（この段はコードを変えない）
  - ① `pnpm test:run` → 6 ファイル / 167 テスト緑
  - ② 直下は `.gitignore` / `index.ts` / `README.md` / `types.json` / `types.example.json` / `git-env.ts` と `policy/` `child/` `run/` `tool/`。**チケットの期待より 1 つ多い**（`git-env.ts` は事故の対処で増えた検査用のヘルパー。チケット 04 の `Notes` にも記録）
  - ③ 下向きの辺は `index.ts` → `tool`、`tool` → `run` / `child` / `policy`、`run` → `child` / `policy`、`child` → `policy`。逆向きは `child/spec.test.ts` → `../tool/consult.ts` の 1 本だけ（`PARAMETERS` のためで、チケット 04 が指定）。同じ層の中は、テストが対象を読むもの（`run/run.test.ts` → `./run.ts` など）のほかは `tool/consult.ts` → `./render.ts`（step 3 が作った）。このほかに検査用の `git-env.ts` ↔ `run/` の辺がある（4 層の型の外）
  - ④ 生きた子 1 体: `review` の子に 003 の 1 枚を当てた → **21 turn / out 27,825 / in 63,537 / $0.0297** で正常に終わった（出力上限 60,000 に当たらない）。子の報告は findings 8 件（blocking 3）。中身は「003 の 1 枚が 004 の変更より前の記述である」か「既に記録済みの外の穴（`09-readme` の `work` の行）」で、新しい穴は無かった
  - ⑤ `README` の表（`research` / `review` / `trial` / `code` の tools・environment・turns・output）と `types.json` は一致（`review` は 40 turn / 60,000 で揃っている）

### Unplanned

なし

Commit: なし（コードを変えない。実演だけ）
