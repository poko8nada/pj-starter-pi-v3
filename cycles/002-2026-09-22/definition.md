# ハーネス付きスターター

## What

- Type: プロジェクトと、そのエージェント用ハーネスが一緒に立ち上がるスターター
- Who:
  - owner: clone する人。プロジェクトの持ち主。検査とゲートの恩恵を受ける
  - agent: 同じリポジトリで作業する。規則に従う側

Changes: keep

## Goal

新しいプロジェクトを始めたときに、検査・commit ゲート・エージェントの規則が最初から揃っていて、
自分で配線しなくてよい。エージェントが 1 枚を書き、レビューと実演を子に任せて、サイクルを回せる。

Changes: update **エージェントがサイクルを回せることを加えた**

## Non-goal

- CI に検査を足さない
  - Why: ローカルのフックが担う。自分用のスターターなので
- clone 先の技術選定に関与しない
  - Why: スタックは clone した側が決める
- 使わない設定を消さない
  - Why: 休眠として残す（react / src / app / pages）
- メッシュ（`remote-pi`）をハーネスの機能にしない
  - Why: サードパーティのパッケージの仕事。ハーネスは設定の置き場所（`.pi/remote-pi/.gitignore`）だけを用意する

Changes: keep

## What to build

### 1. consult

- Change: update **type で policy を持つ形に変える（上書き不可）。成果物は ref で返す。実演とスキルから使う**
- Actor: agent
- Given: pi セッションが動いている
- When: agent が type を渡して子に任せる
- Then:
  - 子は type ごとに決まったモデル・ツール・環境・上限・役割で走る（agent が選べるのは type だけ）
  - 入力ごとに 1 体走る（入力が 1 つなら 1 体）
  - `code` の子のコミットは ref で返り、agent が取り込むかを決める

### 2. definition-skill

- Change: add
- Actor: agent
- Given: 前のサイクルが閉じている
- When: agent がサイクルを始める
- Then:
  - 1 枚の定義が出る（型どおり）
  - 前のサイクルを閉じて、印を引き継ぐ
  - 承認を待つ（承認前にコードに触らない）

### 3. stack-skill

- Change: add
- Actor: agent
- Given: 定義の他の節が埋まっている
- When: agent がスタックを決める
- Then:
  - `Stack` が埋まる（与えられたハーネスが土台、足した分だけが書かれる）
  - 足した理由が残る（差分で読める）

### 4. plan-skill

- Change: add
- Actor: agent
- Given: 定義が承認された
- When: agent がプランを書く
- Then:
  - `step 0` を含む `Steps` と、`Structure` が出る
  - 全 step にファイル名とテスト名が入っている
  - 承認を待つ

### 5. tickets-skill

- Change: add
- Actor: agent
- Given: プランが承認された
- When: agent がチケットを切って作業する
- Then:
  - チケットが出て、`Todo` と `Verify` の承認を取る（承認前に手を動かさない）
  - 作業した結果が `Notes` に残る
  - `Commit` のハッシュで閉じる

### 6. readme

- Change: add
- Actor: owner
- Given: clone 直後
- When: owner が `README.md` を開く
- Then:
  - 何が入っているか分かる
  - 最初に何をすればいいか分かる

## What to keep

- `agent-rules` From: 001
- `sound-notify` From: 001

## Stack

- Runtime: Node 24 / TypeScript 6
- Package manager: pnpm 12
- Checks: oxlint / oxfmt / tsc / vitest
- Hooks: lefthook（pre-commit / pre-push）
- Agent: pi 拡張（quality-gate / consult）

Changes: keep

## Retro

- Good:
- Bad:
