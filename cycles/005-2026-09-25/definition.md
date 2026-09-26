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
  - 同じ手順が 2 つの skill にある
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
  - 同じ手順が 2 つの skill にある
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
  - 同じ手順が 2 つの skill にある
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
  - 同じ手順が 2 つの skill にある
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
  - 同じ手順が 2 つの skill にある
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

## Carry over

- `consult` の `types.json` が git 管理外になっている。管理に入れるか、別の渡し方にするかを決める From: 004.01-work-skill
- `consult` の子の worktree に `types.json` が無く、実演の「子が起動して返る」が落ちる。渡し方を決める From: 004.03-consult.split
- プランの子が承認までに触ったファイルがプランだけかを確かめた記録が無い。確かめる From: 004.02-plan-skill
- `consult` の子が残した作業ファイル（`.flat` など）が成果と一緒に ref に入る。どこで外すかを決める From: 004.close
- `consult/git-env.ts` が `policy/` `child/` `run/` `tool/` のどれでもない所にある。どの層に置くかを決める From: 004.close
- `/tmp` に置いた実演の題材にも lint が当たる。外すか、当てたままにするかを決める From: 004.close
- `consult` の guard で `$VAR` が未定義のときの動きが偶然に頼っている。意図した形にするかを決める From: 004.04-secret-guard.rules
- `consult` の guard が読む `read` のキー名が確かめられていない。確かめる From: 004.04-secret-guard.rules
- `Notes` の項目の形、`Retro` の `###`、`Carry over` のまとまりを機械的に検査する拡張が無い。作るかを決める From: 004.close
- 造語を機械的に止める案を採らないと決めた代わりが無い。owner が決める From: 004.close

## Retro
