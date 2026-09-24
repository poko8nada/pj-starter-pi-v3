# plan-skill

Acceptance: `step 0` を含む `Steps` と、`Structure` が出る。全 step にファイル名とテスト名が入っている。単位に無い step（後片付けなど）は、`step 0` の `Cleanup` に置かれる。承認までは、プランのファイル以外に変更が無い。`description` に、次のスキルの名前が無い

（オーナーの指摘で 1 つ広い: `Depends` に道具の依存を書く。003 の `Remarks` はまだ無いので、理由はこの ticket の `Notes` と `Retro` に落とす）

## Todo

- `.pi/skills/plan/SKILL.md`
  - `description` から「before the tickets」を消す — 残るのは「Use when a definition has been approved and its Stack is filled」まで
  - Step 2 に足す — 単位に無い step（後片付け、消す、移す）は `step 0` の `Cleanup` に置く（002 の step 12 で扱いが決まらなかった件）
  - （オーナーの指摘）Step 4 の `Depends` の説明に足す — **道具の依存**も書く。凍結されていない文書（スキル・コード）を先に直す必要があるときは、その step を先に置く。今日の失敗: `tickets` スキルを直さないままチケットを切り続けた
  - Step 5 の `Structure` の説明に足す — 凍結された文書の `Files` に無いファイルを触る場合（オーナーの指摘で範囲が広がった場合など）、`Structure` に入れ、理由をチケットの `Notes` に書く
- 観点（null / 空 / 境界 / 不正 / 権限 / 2 回目 / 並行）→ この step は文書の修正。作るものが無い — ケース無し
- 本文が答えるべき失敗（`Then` の裏側）→ 2 つそれぞれに、本文の答えの一文がある（無ければその Step を足す） (error)

## Verify

- 実演: 子に `plan` だけを読ませ、1 枚のプランを書かせる（`step 0` が出る / `Structure` が出る / 全 step にファイルとテストが入る / 単位に無い step が `Cleanup` に行く / `Depends` に道具の依存を書ける形になっている / 承認までプラン以外に変更が無い / `description` に次のスキルの名前が無い）

## Notes

### Findings

なし

### Unplanned

なし

Commit:
