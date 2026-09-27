# work.commit-grouping

Acceptance:

- ユニットの終わりに 1 コミットにまとまる
- ハッシュを書くのは `squash.mjs` で、step の時点では空のまま

## Todo

- `.pi/skills/work/scripts/squash.mjs`（新規）
  - 引数: `<cycle-dir> <base-hash> <hash>...`（末尾 `run` で実行、無ければ乾燥）
  - 乾燥で出すもの: 潰す一覧（`base..HEAD` と突き合わせ、違えば中止）、新しいメッセージ、書き換えるチケットのファイルと行
  - 実行: `git reset --soft <base>` + 1 コミット。`cycles/<cycle>/tickets/*.md` の `Commit:` の行のハッシュを、古い→新しいで書き換える（注記は残す）
  - 安全策: 作業ツリーが汚れていたら中止／`HEAD` が一覧の最後でなければ中止／実行前に退避タグ（`squash-backup-<日時>`）
  - `.pi/skills/work/scripts/squash.test.ts`（新規）— 8 ケース（乾燥・`run`・書き換え・引数の不足・空の一覧・汚れたツリー・不一致）
- `.pi/skills/work/SKILL.md`
  - ユニットの終わりの段（乾燥 → 確認 → `run`）と、チケットの `Commit:` をそのときに書くことを足す

## Verify

### test

- `pnpm test:run .pi/skills/work`
  - 乾燥 → 何も変わらず、予定が出る（happy）
  - `run` で潰す → 1 コミットになり、チケットの `Commit:` が書き換わる（happy）
  - まだ空の `Commit:` のチケットだけ → 何も書き換えずに通る（happy、boundary）
  - 引数が足りない / 知らない引数 → 使い方を出して中止（error、null・missing）
  - 潰す対象が 0 件（`base..HEAD` が空）→ 何もせず、そう言う（error、empty）
  - `run` で一覧が `base..HEAD` と違う → 中止（error）
  - `run` で作業ツリーが汚れている → 中止（error）
  - 権限 / 2 回目 / 並行 → 見ない（ローカルの git を 1 回打つだけ）

### cli

- 作業用のコピー（`git clone --local`）で、006 の範囲に対して乾燥 → `run` を 1 回走らせ、1 コミットにまとまりチケットの `Commit:` が書き換わるのを読む（`git log --oneline` と `grep Commit:`）

### read

- `review` の子に `.pi/skills/work/SKILL.md` だけを渡す
  - 報告させる: ユニットの終わりの段（乾燥 → `run`）と、チケットの `Commit:` を誰がいつ書くか

## Notes

### Findings

- なし

### Unplanned

- なし

Commit:
