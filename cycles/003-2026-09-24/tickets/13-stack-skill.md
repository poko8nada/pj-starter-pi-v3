# stack-skill

Acceptance:

- `Stack` が埋まる
  - 与えられたハーネスが土台
  - 足した分だけが書かれる
- 足した理由が残る
  - 差分で読める
- `description` に、次のスキルの名前が無い

## Todo

- `.pi/skills/stack/SKILL.md`
  - `description` から「before the plan is written」を消す
    - 残るのは「Use when a definition has been approved」まで
    - 次のスキルを名指しする句だけを落とす
  - ref の扱いを 1 行足す
    - オーナーの指摘
    - `trial` の子は**書ける**ので、コミットすると ref が残る
    - 取り込むか捨てるかを決めたらその場で道具（`ref-cleanup`）で消す
- 観点（null / 空 / 境界 / 不正 / 権限 / 2 回目 / 並行）
  - 文書なので当たらない — ケース無し

## Verify

- 実演: 子に `stack` だけを読ませ、1 枚の `Stack` を書かせる
  - `Stack` が埋まる
  - 足した理由が差分で読める
  - `description` と本文に次のスキルの名前が無い
  - ref の扱いが書いてある

## Notes

### Findings

- 実演: 子（`trial`）に `stack` の 1 ファイルだけを読ませ、前の実演が `/tmp/definition-demo/` に書いた作業用の 1 枚の `Stack` を埋めさせた
  - 書き先は `/tmp/stack-demo/definition.md`
  - 出た `Stack`
    - base は名前の 1 行
    - `Added: なし`
    - `Changes: keep`
- **足した理由はコミットメッセージに書かれた**
  - 子が使うつもりのコミットメッセージを提示した
  - Step 3 の「理由はシートに書かず、コミットが記録」が読めている
- **`description` にも本文にも次の段の名前が無い**
  - 子が `description` を引用して「No」と報告した
- **ref の規則を引用で示せた**
  - `A trial child can write, and what it leaves behind is committed...`
- 子は trial を回す前に owner の許可を聞く形で止めた
  - 読めない候補を 1 つ挙げた
    - pi 拡張ホスト API のツール引数のキー名
  - shared store の規則が正しく適用された
- **リポジトリには 1 ファイルも触っていない**
  - `ref: (the child changed nothing)`

### Unplanned

- 実演で子が「与えられていないので自分で決めた」と挙げた 3 つを読んだ
  - **どれも直さなかった**
    - 既存の規則で足りている
  - このシートは 4 枚目なのでマーカーは `add` にならない
    - Step 5 に書いてある
  - base 行の形を 003（名前 1 行）と 002（5 行）のどちらで書くか
    - 形を変えるなら `Changes: update` と理由で足りる
      - 003 がまさにそうした
  - Step 6 の `review` の子は子からは起こせない
    - レビューは不在で、clean ではない
    - 子から子は起こせないのが前提
    - レビューは agent の仕事
    - skill の穴ではない

Commit: 928788c
