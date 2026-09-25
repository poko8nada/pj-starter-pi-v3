# definition-skill

Acceptance:

- 前のサイクルが閉じているときに agent がサイクルを始めると、1 枚の定義が出る
- 前を閉じる
- 印を引き継ぐ
- 承認を待つ

## Todo

- `.pi/skills/definition/SKILL.md` を書く — **英語**
  - frontmatter は `name` と `description`
  - `description` — 「いつ読むか」を書く
    - エージェントが見るのはここだけ
    - トリガーはここで成立させる
    - 案は `Use when a cycle starts or closes, or when a request may change the sheet's What, Goal or Non-goal. Writes the one-page definition for a product, grills the owner one question at a time until you share the same understanding, then freezes it.`
  - `When this runs` — サイクルの段階の地図を 1 段落
  - `Step 1: the impulse` — 今回やりたいことを 1 文で受ける
  - `Step 2: read (facts)` — 読むのは前の 1 枚、閉じたチケットの `Findings`、要るならコード
    - **聞かない**
  - `Step 3: settle the scope` — どこが動くかを決める
    - 印を先に決める
    - 入口 1 は枠から入る — 作り直し・方向転換
    - 入口 1 の順は `What` → `Goal` → `Non-goal`
    - 入口 2 は単位から入る — 追加・修正
    - 入口 2 は、まずその変化が 3 節を動かすかを確かめる
    - 動かすなら入口 1 に切り替える
  - `Step 4: grill` — 動く節を依存順に聞く
    - **1 問ずつ**
    - **推奨案つき**
    - 事実は調べる
    - 決定だけ聞く
    - 質問は「答えで 1 枚が変わるもの」だけ
  - `Step 5: count` — 締めの 1 問は「この `Goal` と `Non-goal` で要る振る舞いを数え上げると何があるか」
    - ここで `What to build` が導出になる
  - `Step 6: write the sheet` — 書くのは 1 枚の型、欄の規則、印の規則
    - 1 枚の型は 7 節
    - 設計書の該当節を英語に移す
  - `Step 7: close the previous cycle`
    - `Retro`
    - 凍結はコミット
    - 次の 1 枚で前のチケットの `Findings` を読む
  - `Rules`
    - 単位の規則
      - 1 単位 = 1 つのユーザーの行動
      - 使う側から書く
      - 数え上げ
      - `Actor` `Given` `When` `Then`
    - 印の規則
    - 書くものの規則
      - 決定だけ
      - 空でよいのは `Retro` と `Stack`
      - 完結優先
    - ラベルの規則
      - 節名と欄名は英語
      - 単位は小見出し
      - 表を使わない
- 移すのは `CYCLE-DESIGN.md` の該当節すべて
  - **削らない**
  - このスキルが唯一の出典になる
- **ハンズオフは書かない**
  - 「次は `stack`」と本文に書かない
  - 段の繋がりは `stack` 側の `description` が担う

## Verify

- 実演（a）: 子に `definition` だけを渡し、お題 1 文から 1 枚を書かせる
  - 渡すのは `--skill .pi/skills/definition`
  - 7 節と印が出るか
- 実演（b）: 子が 1 問ずつ聞いてくるか
  - 対話が要るなら、このセッションで親が実演する
  - グリリングは対話なので、単発の子では確かめられない部分

## Notes

### Findings

- 実演（a）の結果: 子は `.pi/skills/definition/` だけを読んで 1 枚を書いた
  - 7 節が出た
  - 印が出た — `update` の理由を太字
  - 単位は `memo-entry` と `memo-list`
  - 観測できる `Then` は `exit 0`
  - `Stack` は空のまま
  - 実行できない段を全部報告した
    - `consult` が無い
    - 対話できない
    - 前のサイクルが未クローズ
  - `001` と「最初の 1 枚」の混同を指摘した
    - スキル側で修正済み
- 実演（b）の結果: 成立した
  - 1 問ずつ回せた
  - 推奨案つきで回せた
  - 節の順は `What`、`Goal`、`Non-goal`、数え上げ
  - 訂正は 2 回あった
    - `Goal` で「振り返りが主」
    - 「ちゃんと」の解釈の確認
  - 質問は 5 問
    - 仮のお題が小さかったのが理由

### Unplanned

- `Todo` を改訂した — チケット改訂
  - 言語を日本語から**英語**へ変えた — ユーザーの指定
  - `Step 1`〜`Step 7` の構成に変更した
  - `grilling` のエッセンスを取り入れた
    - 1 問ずつ
    - 推奨案
    - 事実は調べる
    - 相互理解まで
- **(a) の実演が ref を 2 本残した**
  - ref は `consult/code-20260923-175302-0` と `-175543-0`
  - 子にリポジトリの中へ書かせたので、変更 → コミット → ブランチになった
  - **消す道具も権限も無いのに、残る実演をしたのが誤り**
  - 書き先をリポジトリの外にすれば、変更ゼロで同じ 1 枚を確かめられる
  - 設計に規則を足した — 実演は残るものを作らない
- 設計書の棚卸しで definition 側に足りないものが見つかり、足した
  - `references/format.md` の `## Where it lives`
    - `cycles/<NNN-DATE>/definition.md`
    - フォルダで完結
    - 別プロダクトは別レポ
    - クローンの `cycles/` は空
    - 閉じているかは `Retro` の有無
  - `## Writing` の「変わっていない行はそのまま写す」
  - `Step 10` の「中断してよい」
- **`Step 5` と `Step 6` がほぼ同じ作業だった**
  - `Step 5` は数え上げ
  - `Step 6` は units を組む
  - 分ける意味が薄いかもしれない — 次のサイクルで見る
- **owner に出す前の review の段を追加した** — `Step 8`
  - 子 `review` に固定のチェックリストを当てる
  - 直して再レビューする
  - 新しい指摘が無くなるまで — 上限 3 回
  - owner には指摘と処置を一緒に見せる

Commit: f50721a
