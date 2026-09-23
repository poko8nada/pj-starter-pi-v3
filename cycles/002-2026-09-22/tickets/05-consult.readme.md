# consult.readme

Acceptance: 子は type ごとに決まったモデル・ツール・環境・上限・役割で走る（agent が選べるのは type だけ）

## Todo

- `README.md`
  - 「何のためか」 — 会話を見せずに子を走らせ、本文だけ返す。費用がかかる
  - 「type」 — `research` / `review` / `trial` / `code`。policy（モデル候補・ツール・環境・上限・役割）を持ち、呼び出し側は選べない
  - 「モデル候補の順」 — 1 番目 → 2 番目 → 親と同じ。乗り換える条件（生成が 0 のまま終わった）
  - 「環境」 — `tree` と `worktree`。worktree は依存を入れてから子が走り、フックが通れば ref になる
  - 「ref の受け取り方」 — 親が cherry-pick / 一部 / 捨てる。`ref` がある = 検査を通ったコミットがある
  - 「信頼」 — プロジェクトの設定・拡張・スキルは子に読ませない。要る手順は task / input で渡す
  - 「設定」 — `types.json` は git 管理外。`types.example.json` が形。変えたら次の consult から効く
  - 「道具の形」 — 項目は type / task / input。入力ごとに 1 体、並列に走る

## Verify

- 実演: README の「設定」と「道具の形」のとおりに `research` を 1 回走らせ、診断のモデルが 1 番目の候補になり、結果が入力ごとに並ぶ

## Notes

### Findings

なし

### Unplanned

なし

Commit:
