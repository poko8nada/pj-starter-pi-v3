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
  - `Who` の想定と例が無く、読み違えられる — 一覧と `Does` / `Needs` を足す
  - `Goal` / `Non-goal` / `Remarks` の節が無くなる — 定義書は 6 節になる
- Actor: agent
- Given: 前のサイクルが閉じている
- When: agent がサイクルを始める
- Then:
  - `definition` だけを読めば、定義書が書ける
  - 定義書は 6 節で、`Goal` / `Non-goal` / `Remarks` が無い
  - `Who` は一覧から選び、それぞれに `Does` と `Needs` がある

### 2. stack-skill

- Change: update **再点検。想定と例と選び方を持たせる**
- Actor: agent
- Given: `definition` が新しい形になっている
- When: agent がスタックを決める
- Then:
  - `stack` だけを読めば、`Stack` が書ける

### 3. plan-skill

- Change: update **再点検。想定と例と選び方を持たせる**
- Actor: agent
- Given: `Stack` が埋まっている
- When: agent がプランを書く
- Then:
  - `plan` だけを読めば、プランが書ける

### 4. tickets-skill

- Change: update **再点検。想定と例と選び方を持たせる**
- Actor: agent
- Given: プランが承認されている
- When: agent がチケットを切る
- Then:
  - `tickets` だけを読めば、チケットが書ける

### 5. work-skill

- Change: update **再点検。想定と例と選び方を持たせる**
- Actor: agent
- Given: チケットが合意されている
- When: agent が 1 つの step を進める
- Then:
  - `work` だけを読めば、step を閉じられる

### 6. close-skill

- Change: update **再点検。想定と例と選び方を持たせる**
- Actor: agent
- Given: 全部のチケットが閉じている
- When: agent がサイクルを閉じる
- Then:
  - `close` だけを読めば、サイクルを閉じられる

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

## Retro
