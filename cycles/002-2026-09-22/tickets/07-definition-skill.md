# definition-skill

Acceptance: 前のサイクルが閉じているときに agent がサイクルを始めると、1 枚の定義が出て、前を閉じて印を引き継ぎ、承認を待つ

## Todo

- `.pi/skills/definition/SKILL.md` を書く — **英語**。frontmatter は `name` と `description`
  - `description` — 「いつ読むか」を書く（エージェントが見るのはここだけ。トリガーはここで成立させる）。案: `Use when a cycle starts or closes, or when a request may change the sheet's What, Goal or Non-goal. Writes the one-page definition for a product, grills the owner one question at a time until you share the same understanding, then freezes it.`
  - `When this runs` — サイクルの段階の地図を 1 段落
  - `Step 1: the impulse` — 今回やりたいことを 1 文で受ける
  - `Step 2: read (facts)` — 前の 1 枚 / 閉じたチケットの `Findings` / 要るならコード。**聞かない**
  - `Step 3: settle the scope` — どこが動くかを決める（印を先に決める）。入口 1（枠から: 作り直し・方向転換）は `What` → `Goal` → `Non-goal`。入口 2（単位から: 追加・修正）は、まずその変化が 3 節を動かすかを確かめ、動かすなら入口 1 に切り替える
  - `Step 4: grill` — 動く節を依存順に。**1 問ずつ**、**推奨案つき**、事実は調べる、決定だけ聞く。質問は「答えで 1 枚が変わるもの」だけ
  - `Step 5: count` — 締めの 1 問「この `Goal` / `Non-goal` で要る振る舞いを数え上げると何があるか」。ここで `What to build` が導出になる
  - `Step 6: write the sheet` — 1 枚の型（7 節）+ 欄の規則 + 印の規則（設計書の該当節を英語に移す）
  - `Step 7: close the previous cycle` — `Retro` / 凍結はコミット / 次の 1 枚で前のチケットの `Findings` を読む
  - `Rules` — 単位の規則（1 単位 = 1 つのユーザーの行動 / 使う側から書く / 数え上げ / `Actor` `Given` `When` `Then`）、印の規則、書くものの規則（決定だけ / 空でよいのは `Retro` と `Stack` / 完結優先）、ラベルの規則（節名と欄名は英語 / 単位は小見出し / 表を使わない）
- 移すのは `CYCLE-DESIGN.md` の該当節すべて。**削らない**（このスキルが唯一の出典になる）
- **ハンズオフは書かない。** 「次は `stack`」と本文に書かない。段の繋がりは `stack` 側の `description` が担う

## Verify

- 実演（a）: 子に `definition` だけを渡し（`--skill .pi/skills/definition`）、お題 1 文から 1 枚を書かせる。7 節と印が出るか
- 実演（b）: 子が 1 問ずつ聞いてくるか（対話が要るなら、このセッションで親が実演する。グリリングは対話なので、単発の子では確かめられない部分）

## Notes

### Findings

なし

### Unplanned

- `Todo` を改訂した（チケット改訂）: 言語を日本語から**英語**へ（ユーザーの指定）、`Step 1`〜`Step 7` の構成に変更、`grilling` のエッセンス（1 問ずつ / 推奨案 / 事実は調べる / 相互理解まで）を取り入れ
- **(a) の実演が ref を 2 本残した**（`consult/code-20260923-175302-0` / `-175543-0`）。子にリポジトリの中へ書かせたので、変更 → コミット → ブランチになった。**消す道具も権限も無いのに、残る実演をしたのが誤り。** 書き先をリポジトリの外にすれば、変更ゼロで同じ 1 枚を確かめられる。設計に規則を足した（実演は残るものを作らない）
- 設計書の棚卸しで definition 側に足りないものが見つかり、足した: `references/format.md` の `## Where it lives`（`cycles/<NNN-DATE>/definition.md` / フォルダで完結 / 別プロダクトは別レポ / クローンの `cycles/` は空 / 閉じているかは `Retro` の有無）、`## Writing` の「変わっていない行はそのまま写す」、`Step 9` の「中断してよい」

Commit:
