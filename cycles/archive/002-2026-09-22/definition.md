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
  - Why: ローカルのフックが担う
    - 自分用のスターターなので
- clone 先の技術選定に関与しない
  - Why: スタックは clone した側が決める
- 使わない設定を消さない
  - Why: 休眠として残す
    - `react`
    - `src`
    - `app`
    - `pages`
- メッシュ（`remote-pi`）をハーネスの機能にしない
  - Why: サードパーティのパッケージの仕事
    - ハーネスは設定の場所所だけを用意する
      - `.pi/remote-pi/.gitignore`

Changes: keep

## What to build

### 1. consult

- Change: update **type で policy を持つ形に変える**
  - 上書きは不可
  - 成果物は ref で返す
  - 実演とスキルから使う
- Actor: agent
- Given: pi セッションが動いている
- When: agent が type を渡して子に任せる
- Then:
  - 子は type ごとに決まった設定で走る
    - モデル
    - ツール
    - 環境
    - 上限
    - 役割
  - agent が選べるのは type だけ
  - 入力ごとに 1 体走る
    - 入力が 1 つなら 1 体
  - `code` の子のコミットは ref で返る
  - agent がその ref を取り込むかを決める

### 2. definition-skill

- Change: add
- Actor: agent
- Given: 前のサイクルが閉じている
- When: agent がサイクルを始める
- Then:
  - 1 枚の定義が出る
    - 型どおり
  - 前のサイクルを閉じる
  - 印を引き継ぐ
  - 承認を待つ
    - 承認前にコードに触らない

### 3. stack-skill

- Change: add
- Actor: agent
- Given: 定義の他の節が埋まっている
- When: agent がスタックを決める
- Then:
  - `Stack` が埋まる
    - 与えられたハーネスが土台
    - 足した分だけが書かれる
  - 足した理由が残る
    - 差分で読める

### 4. plan-skill

- Change: add
- Actor: agent
- Given: 定義が承認された
- When: agent がプランを書く
- Then:
  - `step 0` を含む `Steps` が出る
  - `Structure` が出る
  - 全 step にファイル名とテスト名が入っている
  - 承認を待つ

### 5. tickets-skill

- Change: add
- Actor: agent
- Given: プランが承認された
- When: agent がチケットを切って作業する
- Then:
  - チケットが出る
  - `Todo` と `Verify` の承認を取る
    - 承認前に手を動かさない
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

- Runtime:
  - Node 24
  - TypeScript 6
- Package manager: pnpm 12
- Checks:
  - oxlint
  - oxfmt
  - tsc
  - vitest
- Hooks: lefthook
  - pre-commit
  - pre-push
- Agent: pi 拡張
  - quality-gate
  - consult

Changes: keep

## Retro

- Good:
  - サイクルが最後まで回った
    - 12 枚のチケットが全部ハッシュで閉じた
    - 6 つの単位が届いた
  - 子のレビューが実物を直した
    - `001` と「最初の 1 枚」の混同は `definition` スキルで直した
    - `12` の `Verify` は `cycles/` 配下だけに直した
    - プランの `pnpm check` は実在する script 名に直した
    - `review` 型の上限は、実演の前に上限とタスクの大きさを見る規則にした
  - ゲートが実バグを拾った
    - フックの中では `GIT_*` が環境に載っていた
    - git が cwd のリポジトリではなく、フックのリポジトリを見ていた
    - 素の実行では再現しない
  - grilling で 1 枚が良くなった（`Goal` が「振り返りが主」に定まった）
  - 凍結の規律が効いた（変更はすべてチケットの「実装前の窓」で、理由付きで記録された）
- Bad:
  - **同じ形の失敗を 3 回繰り返した**: 「消せないものを作る」
    - ref を残した
    - 共有ストアに触った
    - 事後に掃除の 1 行を渡した
    - 守られない約束を書いた
    - 毎回 owner に止められた
  - **目の前の実例から製品の範囲を決めた**（ローカルの道具ばかりだったため、web の観点は要らないと提案した。owner の指摘で、入る前に止まった）
  - 実演が 2 回汚染された
  - 折り返しを直すスクリプトが frontmatter を 2 回壊した
  - まだ必要か決まっていないうちに、消える文書に規則を書き足した
    - README に移しては外し、を繰り返した
- Carry over:
  - 子は `bash` を使えない
  - `README.md` は古いインターフェース（`role`、`tools`、`worktree`）の記述のまま
  - 拡張は起動時に読まれるので、走っているセッションは新しいスキーマを使えない（子の pi からは呼べる）
  - フックの中では `GIT_*` が環境に載っており、`createWorktree` が `.git/index: index file open failed: Not a directory` で落ちる（素の実行では再現しない）
  - フックが実際に走ることは、markdown 1 つの変更では確かめられない（lefthook は非コードのファイルを飛ばす）
  - 親の ref の取り込みは未実装で、取り込むか捨てるかは親の判断（cherry-pick / 一部 / 捨てる）
  - `input` は子が読む文書ではなく、プロンプトの先頭に連結される payload で、指示として読まれる（「検査は oxlint…」と書いた `a.md` を子が作業指示と読んだ）
  - `readPayload` は読めない入力を例外にするのに、空ファイルは素通りする。空の payload で子は「ファイルが指定されていない」と答える（001 で「無言で空の子を走らせない」と決めた）
  - ref は残り続ける（掃除の仕組みが無く、このサイクルで 5 本残った）。消すのは決めたらその場で行う
  - 破壊的な操作はガード付きの道具側に持たせる（次のサイクルで作る）
  - モデルは `content` の最後の `[consult]` の 1 行でしか見えない（`details` は agent に渡らない）
  - `trial` の子が共有ストアに足した `picocolors` が 1 つ分残った（リポジトリには残らなかった）
  - `plan.md` の `cleanup` は定義の単位に無く、`step 0` の `Cleanup` で扱っても同じ。どう扱うかは未決
  - `review` 型は出力上限 20k に当たって打ち切られた（22,489 トークン、テキスト 0）。型の上限とタスクの大きさを実演の前に見る
  - 実演の題材には、リポジトリに答えが無いものを選ぶ（`plan.md` と `12-cleanup.md` が答えだった）
  - `plan.md` の `cleanup` の `Verify`「`grep -r CYCLE-DESIGN` が何も返さない」は、このチケット自身と `cycles/` の記録が一致するので満たせない
  - `plan.md` の `cleanup` の `pnpm check` は存在しない（`package.json` にあるのは `test:run`、`lint`、`typecheck`）
  - 文書がスキルより古い 3 箇所: 最初の 1 枚の規則、実演の規則（自分で消せるもの）、`Stack`（空で渡す）
  - プロダクト名は未決のまま（両方の README のタイトルは仮）
