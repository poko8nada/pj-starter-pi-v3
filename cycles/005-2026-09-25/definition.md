# ハーネス付きスターター

## What

### Type

プロジェクトと、そのエージェント用ハーネスが一緒に立ち上がるスターター。web 関係のありとあらゆるものを作るための汎用性が高いもの。

### Who

- owner:clone する人。プロジェクトの持ち主
  - Does: 判断をする（何を作るか、何が要るか、何が要らないか）
  - Needs: エージェントが 1 人で進められること。判断は自分のところに来ること
- agent:同じリポジトリで作業する側
  - Does: プロダクトを作る（サイクルを回す）
  - Needs: 規則、検査、基準、記録が最初から揃っていること

## What to build

### 1. definition-skill

- Change: update
- Actor: agent
- Does: 定義書を書く
- Now:
  - `Who` の想定と例が無く、読み違えられる
  - 本文と `format` が責務分離されていない
  - 順序が本文に無い
  - `format` の説明が長い
- Then:
  - 定義書が、あるべき項目の構造化された 1 枚になり、誰が読んでも一意の意味で取れる

### 2. stack-skill

- Change: update
- Actor: agent
- Does: スタックを決める
- Now:
  - 本文と `format` が責務分離されていない
  - 順序が本文に無い
  - `format` の説明が長い
  - `Stack` 節の形が skill の中にある
- Then:
  - `stack` skill が、あるべき項目の構造化された 1 つになり、誰が読んでも一意の意味で取れる

### 3. plan-skill

- Change: update
- Actor: agent
- Does: プランを書く
- Now:
  - 本文と `format` が責務分離されていない
  - 順序が本文に無い
  - `format` の説明が長い
  - 書き方の規則が `format` と長く重なっている
- Then:
  - `plan` skill が、あるべき項目の構造化された 1 つになり、誰が読んでも一意の意味で取れる

### 4. tickets-skill

- Change: update
- Actor: agent
- Does: チケットを切る
- Now:
  - 本文と `format` が責務分離されていない
  - 順序が本文に無い
  - `format` の説明が長い
  - `Remarks` の節を前提にしている
- Then:
  - `tickets` skill が、あるべき項目の構造化された 1 つになり、誰が読んでも一意の意味で取れる

### 5. work-skill

- Change: update
- Actor: agent
- Does: step を進める
- Now:
  - 本文と `format` が責務分離されていない
  - 順序が本文に無い
  - `format` の説明が長い
  - 同じ手順を、本文と失敗の一覧の 2 箇所に書いている
- Then:
  - `work` skill が、あるべき項目の構造化された 1 つになり、誰が読んでも一意の意味で取れる

### 6. close-skill

- Change: update
- Actor: agent
- Does: サイクルを閉じる
- Now:
  - 本文と `format` が責務分離されていない
  - 順序が本文に無い
  - `format` の説明が長い
  - 閉じる基準を `Goal` に置いている（この製品に `Goal` の節は無い）
  - `Remarks` の節を前提にしている
- Then:
  - `close` skill が、あるべき項目の構造化された 1 つになり、誰が読んでも一意の意味で取れる

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

- **`types.json` は git 管理外**（`01-work-skill`）→ 受けない — `consult` を触るサイクル
- **README の `work` の要約**（`01-work-skill`）→ `readme` の単位
- **実演で見ていないこと**（`02-plan-skill`）→ `plan-skill` の単位
- **004 のプランとチケットはこの規則より前に書かれている**（`02-plan-skill`）→ 受けない — 005 のプランから効く
- **検査の場所を書く 1 文**（`02-plan-skill`）→ `plan-skill` の単位
- **子の worktree には `types.json` が無い**（`03-consult.split`）→ 受けない — `consult` を触るサイクル
- **キャンセルしても ref が返る**（`06-definition-skill`）→ `work-skill` の単位
- **閉じる手順が 2 つある**（`07-close-skill`）→ `close-skill` の単位
- **README は検査の外**（`09-readme`）→ 受けない — `quality-gate` の話
- **`work` の `Then` とツリーのズレ**（`close` のフェーズ）→ `work-skill` の単位
- **子の残したファイルが ref に混ざる**（`close` のフェーズ）→ 受けない — `consult` を触るサイクル
- **`git-env.ts` の位置**（`close` のフェーズ）→ 受けない — `consult` の形
- **実演の題材も lint にかかる**（`close` のフェーズ）→ 受けない — `quality-gate` の話
- **003 の持ち越しの行き先が決まっていない**（`close` のフェーズ）→ 3 行に分ける
  - `$VAR` の fail-closed は偶然（`04-secret-guard.rules`）→ 受けない — `consult` の guard
  - `read` のキー名が未確認（`04-secret-guard.rules`）→ 受けない — `consult` の guard
  - `review` の句が 4 skill にある（`14-plan-skill`）→ `definition-skill` / `stack-skill` / `plan-skill` / `tickets-skill` の単位
- **`/tmp` の練習用の題材は消した**（`close` のフェーズ）→ 穴ではない — 004 の決定
- **記録の形の検査**（`close` のフェーズ）→ 受けない — 別の拡張
- **禁止語の検査はしない**（`close` のフェーズ）→ 受けない — owner が別の方法を考える
- **001〜003 の記録はこの形にしない**（`close` のフェーズ）→ 穴ではない — 004 の決定

## Retro
