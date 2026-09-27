# readme

Acceptance:

- 拡張の行が `consult` / `quality-gate` / `sound-notify` の 3 つを並べている
- `consult` が 2 つの道具（`consult` / `ref_cleanup`）を持つと書いてある
- 「使い始める」から例を写す手順が消え、`types.json` はリポジトリにあるものとして書いてある

## Todo

- `README.md`
  - `## What is in it` の Extensions の行 — 拡張 3 つ。`consult` は 2 つの道具（子を走らせる、ref を片付ける）を持つ 1 つの拡張として書く
  - `## Getting started` — 2 番目（例を写す）を消し、`types.json` はリポジトリにあり、自分のモデルに変えて使うと書く
- `README.ja.md`
  - 同じ 2 か所を同じ意味で直す

## Verify

### form

- 拡張の行に `ref-cleanup` が無く、`consult` / `quality-gate` / `sound-notify` がある
- `types.example.json` が README 2 枚に出てこない
- 節の数と見出しが 2 枚で同じ

### read

- `review` の子に `README.md` だけを渡す
  - 何が入っているかを報告させる（拡張の数と、`consult` の道具）
  - 最初に何をすればいいかを報告させる（`types.json` の扱い）

## Notes

### Findings

- `README.md` / `README.ja.md`: 「the formatter runs first, as a fix」は実物と違う（実物は `lint:fix` → `format` の順）。閉じるには: 文面を実物に合わせるか、順序を変えるかを決める
- `README.md` / `README.ja.md`: 「On every agent turn」は、変えた物が無いターンでは検査が走らないので成立しない。閉じるには: 文面を直すか、検査を毎ターン走らせるかを決める
- `README.md` / `README.ja.md`: `types.json` の場所が書かれていない（step 3 の `Findings` と同じ穴）。閉じるには: パスを書くか、この書き方でよいと決める
- `README.md` / `README.ja.md`: `.github/workflows/pullfrog.yml` が「入っているもの」に無い。閉じるには: 書くか、書かないと決める

### Unplanned

- なし

Commit: b27c4bf（07 と同じ子のコミット。`form` の「見出し」は 2 枚が日英なので字面ではなく節の数と順で見た。4 ↔ 4、順も同じ）
