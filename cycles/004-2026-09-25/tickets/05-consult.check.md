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

### Unplanned

なし

Commit:
