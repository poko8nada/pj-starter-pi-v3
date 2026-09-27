# ハーネス付きスターター

## What

### Type

プロジェクトと、そのエージェント用ハーネスが一緒に立ち上がるスターター。web 関係のありとあらゆるものを作るための汎用性が高いもの。

Changes: keep

### Who

- owner:clone する人。プロジェクトの持ち主
  - Does: 判断をする（何を作るか、何が要るか、何が要らないか）
  - Needs: エージェントが 1 人で進められること。判断は自分のところに来ること
- agent:同じリポジトリで作業する側
  - Does: プロダクトを作る（サイクルを回す）
  - Needs: 規則、検査、基準、記録が最初から揃っていること

Changes: update **フレームを `### Type` と `### Who` の 2 節にした（`Goal` / `Non-goal` / `Remarks` をやめた）**

## What to build

### 1. definition-skill

- Change: update
- Actor: agent
- Does: 定義書を書く
- Now:
  - `Who` の想定と例が無く、読み違えられる
  - 本文と `format` が責務分離されていない
  - `format` の説明が長い
  - 手順が具体的でなく、雰囲気で読むことになる
  - 本文がダラダラしていて、構造が無い
  - 同じ手順が、本文と `format` の両方にある
  - 規則だけで、判断の基準と例が無い（読み違えられる）
  - `Carry over` をいつ読み、何を写し、閉じるときにどう書き直すかが決まっていない
  - 同じ規則が `format` と本文の両方にある
  - 太字が多すぎて、本当に大事なものがどれかわからない
- Then:
  - 定義書が、あるべき項目の構造化された 1 枚になり、誰が読んでも一意の意味で取れる

### 2. stack-skill

- Change: update
- Actor: agent
- Does: スタックを決める
- Now:
  - サイクルの上流工程の変更を受けて、適切な手順になっていない
  - `Stack` 節の形が skill の中にある
  - 手順が具体的でなく、雰囲気で読むことになる
  - 本文がダラダラしていて、構造が無い
  - 規則だけで、判断の基準と例が無い（読み違えられる）
  - 太字が多すぎて、本当に大事なものがどれかわからない
- Then:
  - `stack` skill が、あるべき項目の構造化された 1 つになり、誰が読んでも一意の意味で取れる
  - `definition` をお手本として、この文章の特徴を持ったスキルになる

### 3. plan-skill

- Change: update
- Actor: agent
- Does: プランを書く
- Now:
  - サイクルの上流工程の変更を受けて、適切な手順になっていない
  - `Now` と `Then` のギャップが計画だ、という芯が無い（`Now` = いまの状態、`Then` = ビルド後の状態）
  - 書き方の規則が `format` と長く重なっている
  - 手順が具体的でなく、雰囲気で読むことになる
  - 本文がダラダラしていて、構造が無い
  - 同じ手順が、本文と `format` の両方にある
  - 規則だけで、判断の基準と例が無い（読み違えられる）
  - 太字が多すぎて、本当に大事なものがどれかわからない
- Then:
  - `plan` skill が、あるべき項目の構造化された 1 つになり、誰が読んでも一意の意味で取れる
  - `definition` をお手本として、この文章の特徴を持ったスキルになる

### 4. tickets-skill

- Change: update
- Actor: agent
- Does: チケットを切る
- Now:
  - サイクルの上流工程の変更を受けて、適切な手順になっていない
  - 本文と `format` が責務分離されていない
  - `format` の説明が長い
  - `Remarks` の節を前提にしている
  - 手順が具体的でなく、雰囲気で読むことになる
  - 本文がダラダラしていて、構造が無い
  - 同じ手順が、本文と `format` の両方にある
  - 規則だけで、判断の基準と例が無い（読み違えられる）
  - 同じ規則が `format` と本文の両方にある
  - 太字が多すぎて、本当に大事なものがどれかわからない
- Then:
  - `tickets` skill が、あるべき項目の構造化された 1 つになり、誰が読んでも一意の意味で取れる
  - `definition` をお手本として、この文章の特徴を持ったスキルになる

### 5. work-skill

- Change: update
- Actor: agent
- Does: step を進める
- Now:
  - サイクルの上流工程の変更を受けて、適切な手順になっていない
  - 同じ手順を、本文と失敗の一覧の 2 箇所に書いている
  - 手順が具体的でなく、雰囲気で読むことになる
  - 本文がダラダラしていて、構造が無い
  - 規則だけで、判断の基準と例が無い（読み違えられる）
  - 太字が多すぎて、本当に大事なものがどれかわからない
- Then:
  - `work` skill が、あるべき項目の構造化された 1 つになり、誰が読んでも一意の意味で取れる
  - `definition` をお手本として、この文章の特徴を持ったスキルになる

### 6. close-skill

- Change: update
- Actor: agent
- Does: サイクルを閉じる
- Now:
  - サイクルの上流工程の変更を受けて、適切な手順になっていない
  - 閉じる基準を `Goal` に置いている（この製品に `Goal` の節は無い）
  - `Remarks` の節を前提にしている
  - 手順が具体的でなく、雰囲気で読むことになる
  - 本文がダラダラしていて、構造が無い
  - 規則だけで、判断の基準と例が無い（読み違えられる）
  - 太字が多すぎて、本当に大事なものがどれかわからない
- Then:
  - `close` skill が、あるべき項目の構造化された 1 つになり、誰が読んでも一意の意味で取れる
  - `definition` をお手本として、この文章の特徴を持ったスキルになる

### 7. readme

- Change: update
- Actor: owner
- Does: `README.md` を開く
- Now:
  - skill 6 つを書き換えたので、README の中身が実物と食い違っている
  - `work` の行にレビューが無い
- Then:
  - README を読んだ人が、何が入っているかを実物どおりに知れる

## What to keep

- `check-suite` From: 001
- `commit-gate` From: 001
- `quality-gate` From: 001
- `sound-notify` From: 001
- `ref-cleanup` From: 003
- `secret-guard` From: 003
- `input-guard` From: 003
- `consult` From: 004
- `agent-rules` From: 004

## Stack

- Runtime: Node / TypeScript
- Deploy: なし
- Added:
  - pnpm
  - lefthook
  - oxlint
  - oxfmt
  - vitest
  - `@earendil-works/pi-coding-agent`
  - typebox

Changes: update **欄を `Runtime` / `Deploy` / `Added` に絞り、ハーネスの部品を `Base` から `Added` に移した**

## Carry over

1. `consult` の `types.json` が git 管理外になっている。管理に入れるか、別の渡し方にするかを決める From: 004.01-work-skill
2. `consult` の子の worktree に `types.json` が無く、実演の「子が起動して返る」が落ちる。渡し方を決める From: 004.03-consult.split
3. プランの子が承認までに触ったファイルがプランだけかを確かめた記録が無い。確かめる From: 004.02-plan-skill
4. `consult` の子が残した作業ファイル（`.flat` など）が成果と一緒に ref に入る。どこで外すかを決める From: 004.close
5. `consult/git-env.ts` が `policy/` `child/` `run/` `tool/` のどれでもない所にある。どの層に置くかを決める From: 004.close
6. `/tmp` に置いた実演の題材にも lint が当たる。外すか、当てたままにするかを決める From: 004.close
7. `consult` の guard で `$VAR` が未定義のときの動きが偶然に頼っている。意図した形にするかを決める From: 004.04-secret-guard.rules
8. `consult` の guard が読む `read` のキー名が確かめられていない。確かめる From: 004.04-secret-guard.rules
9. `Notes` の項目の形、`Retro` の `###`、`Carry over` のまとまりを機械的に検査する拡張が無い。作るかを決める From: 004.close
10. 造語を機械的に止める案を採らないと決めた代わりが無い。owner が決める From: 004.close

## Retro

### Good

- 本文と `format.md` の分離 — 6 つのスキルとも、順番と owner の入り口は本文に、欄と形は `format.md` にある
- Verify の型 14 — プランが型を名指しし、チケットが具体を書く形になった（`plan/references/format.md` の `## The Verify types`）
- `Notes` の意味 — 持ち越すのは `Findings`（完遂できなかったことと原因）だけ、`Unplanned` は記録（`tickets/references/format.md`）
- チケット 5 枚が全部、それぞれのコミットで閉じた（`cc5346b` / `84191ca` / `28f011a` / `be43985` / `334db00`）
- oxfmt の md の模型が分かった — 2 桁 step の下げ幅は番号の幅に合わせる、段落は 1 行ずつ書く
- 閉じが、閉じる前の穴を 2 つ見つけて、チケット 1 枚で直した（`334db00`）

### Bad

- unit 1（`definition`）と unit 3（`plan`）は 005 の計画に入らず、検証の記録がサイクルの外にある（004 の直後に書き換えた）
- 私の書き漏らしが 3 回 — `Carry over` の出所を片方にした、step の順序を逆にして挿入した、100 字の行を残した
- 凍結文書（定義書）を 2 回、owner の指示で書き換えた — unit 1・3・4 の `Now` と、`## Stack` の形
- oxfmt が書類を組み替えることを、サイクルの終わりまで理解していなかった（step 10 以降の崩れ）
- 「1 つずつ」で進めたので、私の報告が遅れ、owner から何度も聞かれることになった

### Carry over

1. `consult` の `types.json` が git 管理外になっている。管理に入れるか、別の渡し方にするかを決める From: 004.01-work-skill
2. `consult` の子の worktree に `types.json` が無く、実演の「子が起動して返る」が落ちる。渡し方を決める From: 004.03-consult.split
3. プランの子が承認までに触ったファイルがプランだけかを確かめた記録が無い。確かめる From: 004.02-plan-skill
4. `consult` の子が残した作業ファイル（`.flat` など）が成果と一緒に ref に入る。どこで外すかを決める From: 004.close
5. `consult/git-env.ts` が `policy/` `child/` `run/` `tool/` のどれでもない所にある。どの層に置くかを決める From: 004.close
6. `/tmp` に置いた実演の題材にも lint が当たる。外すか、当てたままにするかを決める From: 004.close
7. `consult` の guard で `$VAR` が未定義のときの動きが偶然に頼っている。意図した形にするかを決める From: 004.04-secret-guard.rules
8. `consult` の guard が読む `read` のキー名が確かめられていない。確かめる From: 004.04-secret-guard.rules
9. `Notes` の項目の形、`Retro` の `###`、`Carry over` のまとまりを機械的に検査する拡張が無い。作るかを決める From: 004.close
10. 造語を機械的に止める案を採らないと決めた代わりが無い。owner が決める From: 004.close
11. `plan/references/format.md` から `Layers` / `Seam` / `Tests` が消えている。戻すかを決める From: 005.close
12. `Commit: なし` の置き場が `tickets/references/format.md` に無い。閉じ方を決める From: 005.03-work-skill
13. `read` / `use` の子の起こし方が `work/SKILL.md` に無い。どこに書くかを決める From: 005.03-work-skill
14. oxfmt の癖（段落の連結 / 2 桁 step の下げ幅）を書類の書き方に書く From: 005.03-work-skill
15. `work/SKILL.md` の step 4 の「the child」が、親がやる場合の対象を名指ししていない。書くかを決める From: 005.close
16. 定義書の unit 1 と unit 4 の `Now` が同じことを 2 回言っている（凍結後の書き換えの副作用）。どちらかを消す From: 005.close
17. unit 1（`definition`）と unit 3（`plan`）の検証が、サイクルの外にある。次のサイクルで `Now` を確かめる From: 005.close
18. `.pi/skills/`: 6 つのスキルをもう一度リファクターしたいという願いがある（owner）。次にやるかを決める From: 005.close
