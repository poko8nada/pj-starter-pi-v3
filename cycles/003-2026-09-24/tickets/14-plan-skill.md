# plan-skill

Acceptance:

- `step 0` を含む `Steps` と `Structure` が出る
- 全 step にファイル名とテスト名が入っている
- 単位に無い step（後片付けなど）は `step 0` の `Cleanup` に置かれる
- 承認までは、プランのファイル以外に変更が無い
- `description` に、次のスキルの名前が無い

（オーナーの指摘で 1 つ広い: `Depends` に道具の依存を書く。003 の `Remarks` はまだ無いので、理由はこの ticket の `Notes` と `Retro` に落とす）

## Todo

- `.pi/skills/plan/SKILL.md`
  - `description` から「before the tickets」を消す
    - 残るのは「Use when a definition has been approved and its Stack is filled」まで
  - Step 2 に足す
    - 単位に無い step は `step 0` の `Cleanup` に置く
      - 後片付け
      - 消す
      - 移す
    - 002 の step 12 で扱いが決まらなかった件
  - （オーナーの指摘）Step 4 の `Depends` の説明に足す
    - **道具の依存**も書く
    - 凍結されていない文書（スキル・コード）を先に直す必要があるときは、その step を先に置く
    - 今日の失敗: `tickets` スキルを直さないままチケットを切り続けた
  - Step 5 の `Structure` の説明に足す
    - 凍結された文書の `Files` に無いファイルを触る場合（オーナーの指摘で範囲が広がった場合など）、`Structure` に入れる
    - 理由をチケットの `Notes` に書く
- 観点（null / 空 / 境界 / 不正 / 権限 / 2 回目 / 並行）
  - この step は文書の修正。作るものが無い — ケース無し
- 本文が答えるべき失敗（`Then` の裏側）
  - 2 つそれぞれに、本文の答えの一文がある（無ければその Step を足す） (error)

## Verify

- 実演: 子に `plan` だけを読ませ、1 枚のプランを書かせる
  - `step 0` が出る
  - `Structure` が出る
  - 全 step にファイルとテストが入る
  - 単位に無い step が `Cleanup` に行く
  - `Depends` に道具の依存を書ける形になっている
  - 承認までプラン以外に変更が無い
  - `description` に次のスキルの名前が無い

## Notes

### Findings

- 実演の結果（`Verify`）: 子（`trial`）に `plan` の 2 ファイルだけを読ませた
  - 1 枚のプランを書かせた
  - 題材は前の実演の作業用の 1 枚（`/tmp/stack-demo/definition.md`）
  - 書き先は `/tmp/plan-demo/plan.md`
  - `step 0` は `Install` / `Cleanup` / `Refactor` すべて なし
  - step 1〜8 が出た
  - `Structure` は 8 行（`add` / `update`）
- step 1 以降はすべて `Files` と `Tests` を持っている
  - `step 0` は 3 つの問いだけで `Files` / `Tests` を持たない
- **道具の依存が書けた**
  - `setup-check` は直した `secret-guard` のコードに依存すると `Depends` に書いた
  - `plan-skill` は `review` の子に依存すると `Depends` に書いた
- 単位に無い仕事は出なかった（`Cleanup` は なし）
  - 出ればそこに行く、と子が答えた
- `description` に次の段の名前は無い
- リポジトリには 1 ファイルも触っていない
  - 子の ref は `(the child changed nothing)`
- **次のサイクルへ送る**: 子が「本文は次のフェーズを名指ししている（Step 6 の `review`）」と報告した
  - ここでの `review` は consult の **type** で skill 名ではない（`consult` を読めば分かる）
  - 子自身が練習用シートに `review` という skill の unit を作っていたので、そう読めた
  - 同じ句が definition / stack / plan / tickets の 4 skill にあるので、1 つだけ直すと揺れる
  - この step では直さず、次のサイクルの候補として残す

### Unplanned

- チケットの「本文が答えるべき失敗 2 つ」は名前が無かったので、`Then` の裏側から読んだ
  - 単位に無い step の場所が無い → Step 2 の `Cleanup` の規則
  - 承認前に他所（古い skill）に手を入れてしまう → Step 4 の道具の依存と、Step 7 の「コミットしない」
- `trial` の子は子を起こせない（`consult` が無い）ので、Step 6 のレビューは実演の中で走っていない
  - skill の穴ではなく、レビューは agent の仕事

Commit: b237fd7
