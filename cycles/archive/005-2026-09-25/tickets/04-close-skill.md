# close-skill

Acceptance:

- `definition` の `Carry over` と `Retro` の新しい形に沿った手順になっている
- 閉じる基準は単位の `Then` にある
- 製品に無い節を前提にしていない
- 読んだ者がその通りに動ける（何を、どの順で、どこで owner が入るか）
- 手順が 1 行 1 つに割れている
- 規則が軸・判定・例を持っている
- 太字が本当に大事なものだけになっている

## Todo

- `.pi/skills/close/SKILL.md`
  - 冒頭: 何をするスキルか（サイクルを 1 つとして裁く）。変えない 2 つの規則（実装しない / 基準を発明しない。基準は単位の `Then`）
  - `## Steps`: 1 行 1 つ。行為だけを並べる
    - 読む: 定義書（unit の `Then`、`## Carry over`）、チケットの `Notes`、`Retro` の形
    - 走らせる: unit をまたぐ統合を 1 つ（継ぎ目を見る）
    - レビュー: `review` の子。チェックリストを渡す。3 周まで
    - 穴の行き先: 3 つ（`Then` を壊す / 閉じる行為の中 / 次へ）
    - `Retro` を書く（`Good` / `Bad` / `Carry over`）
    - owner に見せる → yes → commit（このコミットがサイクルを閉じる）
  - `Carry over` の材料は `Findings` だけにする。`Unplanned` は持ち越さない。`From: <NNN>.<ticket>` を付ける
  - 閉じる基準を「単位の `Then`」に直す（`Goal` は無い）
  - `Goal` / `Remarks` への言及を消す
  - 本文・チェックリスト・`## How not to` に散っている同じ規則を 1 か所に寄せる
  - 太字は手順の頭だけにする
- テストファイル: なし（書類の書き換え。`Verify` に `test` は無い）
- 材料: `definition/references/format.md` の `## Carry over` / `## Retro`、`tickets/references/format.md` の `## Notes`、`.pi/skills/work/SKILL.md`（手順の形）

## Verify

### read

- `review` の子に `.pi/skills/close/SKILL.md` を渡す（1 つの子に 1 つの入力）
  - `definition/references/format.md` と `tickets/references/format.md` は子が自分で読む
  - `Acceptance` の 1・2・6・7 行を 1 行ずつ判定させ、落ちた行と箇所を報告させる

### use

- `review` の子に `.pi/skills/close/SKILL.md` だけを渡し、手順を歩かせる
  - 題材: `cycles/005-2026-09-25/`（定義書・プラン・チケット 5 枚）の閉じ
  - 書き込みはさせず、何を、どの順で、どこで owner が入るかを書き出させる
  - 止まった箇所を行番号で報告させ、`Acceptance` の 4・5 行を判定させる

### form

- `perl -CSD -ne 'print if length($_) > 100' .pi/skills/close/SKILL.md | wc -l` → 0 行（1 行）
- `grep -n 'Goal\|Remarks' .pi/skills/close/SKILL.md` → 0 行（3 行）
- `grep -o '\*\*' .pi/skills/close/SKILL.md | wc -l` → 14（手順 7 の 2 倍）（7 行）

## Notes

### Findings

- なし

### Unplanned

- `cycles/005-2026-09-25/tickets/04-close-skill.md` の `form`: 太字の期待値を 12（手順 6）と書いたが、実物は 14（手順 7）
  - なぜ: 書ける手順を数えずに先に凍らせた。検証の子が見つけた。`Verify` が動かない形なので、その場で直した

Commit: 28f011a
