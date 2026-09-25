# cleanup

Acceptance:

- `CYCLE-DESIGN.md` がリポジトリに無い
- スキル 4 つに吸収済み
- 理由は git 履歴に残る

## Todo

- `CYCLE-DESIGN.md` を消す — 中身がスキル 4 つにあることを先に確かめる
  - 確かめる先は definition、stack、plan、tickets
- 消した後に残る参照を直す
  - `CYCLE-DESIGN.md` を指している文書やコメントがあれば直す

## Verify

- 実演: 削除の前に、`CYCLE-DESIGN.md` の項目を 1 つずつ潰す
  - どのスキルに入ったか
  - または消すと決めたか
  - 移し漏れゼロが条件
- そのうえで確かめる
  - `CYCLE-DESIGN.md` が無い
  - `pnpm test:run` と `pnpm lint` と `pnpm typecheck` が緑
  - `grep -rn CYCLE-DESIGN --exclude-dir=node_modules --exclude-dir=.git .` の一致が `cycles/` 配下だけになる
    - このチケット自身と閉じた記録が必ず一致する
    - 「何も返さない」は満たせない

## Notes

### Findings

- 実演の結果: 棚卸しは全項目で行き先が決まった
  - 行き先は「移した」か「消す」
- 削除後、`pnpm test:run`、`lint`、`typecheck` は緑
- `ls CYCLE-DESIGN.md` は失敗
- `grep -rln CYCLE-DESIGN` の一致は `cycles/` 配下だけ
  - それは記録そのもの
- 差分が 3 箇所あったが、いずれも**文書のほうが古かった**
  - スキル側が新しい
  - `001` の行 → 「プロダクトの最初の 1 枚」
  - 実演の規則 → 「残してよいのは自分で消せるものだけ」
  - `Stack` → 「空で渡す」

### Unplanned

- 「どのスキルにも入らない」と分類した 4 行は、**当たり前すぎるので消す**ことにした
  - 4 行はメタの規則
  - README に節を足してから、owner の判断で外した
  - コミットしていないので、作業ツリーは元のまま

Commit: 5a9bcd5
