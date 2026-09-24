# ハーネス付きスターター

## What

- Type: プロジェクトと、そのエージェント用ハーネスが一緒に立ち上がるスターター
- Who:
  - owner: clone する人。プロジェクトの持ち主。検査とゲートの恩恵を受ける
  - agent: 同じリポジトリで作業する。規則に従う側

Changes: update **プロダクト名を決めた（ハーネス付きスターター / Harness-included starter）**

## Goal

新しいプロジェクトを始めたときに、検査・commit ゲート・エージェントの規則が最初から揃っていて、自分で配線しなくてよい。エージェントが 1 枚を書き、レビューと実演を子に任せて、サイクルを回せる。

Changes: keep

## Non-goal

- CI に検査を足さない
  - Why: ローカルのフックが担う。自分用のスターターなので
- clone 先の技術選定に関与しない
  - Why: スタックは clone した側が決める
- 使わない設定を消さない
  - Why: 休眠として残す（react / src / app / pages）
- メッシュ（`remote-pi`）をハーネスの機能にしない
  - Why: サードパーティのパッケージの仕事。ハーネスは設定の置き場所（`.pi/remote-pi/.gitignore`）だけを用意する
- owner の判断を、エージェントが代わりにやらない
  - Why: シートの OK / `Verify` の合意 / 許可が要る操作は owner のもの。「エージェントだけ」は、owner が手を動かさないという意味
- `.env` の中身は触らない
  - Why: 問題は、子が読めてしまうことのほう。中身は別
- clone の初期化（`init`）はやらない
  - Why: このサイクルは「エージェントだけで終わらせる」に絞る

Changes: update **owner の判断の境界と、触らないものを足した**

## What to build

### 1. work-skill

- Change: add
- Actor: agent
- Given: チケットの `Todo` と `Verify` が合意されている
- When: agent がチケットの作業を進める
- Then:
  - 子に任せた場合、そのコミットは ref で返り、agent が取り込むかを決める
  - チケットは `Commit:` のハッシュで閉じる
  - `Notes` に `Findings` と `Unplanned` が書かれている（その step の中の穴は直し、外の穴は次の 1 枚に渡す）
  - 実演のあと、リポジトリに残っているのは自分で消せるものだけ

### 2. ref-cleanup

- Change: add
- Actor: agent
- Given: `consult` の ref が残っている
- When: agent が ref を消す
- Then:
  - 消す前に、消えるものが一覧で見える
  - `consult` の ref 以外は拒まれる
  - 消したあと、`git branch` から消えている

### 3. secret-guard

- Change: add
- Actor: agent
- Given: リポジトリに秘密のファイルがある（`.env` / `.envrc` / `*.pem` / `*.key`）
- When: agent が子に仕事を渡す
- Then:
  - 子の `read` は拒否され、子は「読めない」と報告する
  - 親の `.env` の中身は変わらない

### 4. consult

- Change: update **空ファイルを payload にしない。`input` の意味を正す。`consult` の `README` の表を実物に合わせる。`review` の出力上限を上げる**
- Actor: agent
- Given: pi セッションが動いている
- When: agent が type を渡して子に任せる
- Then:
  - 子は type ごとに決まったモデル・ツール・環境・上限・役割で走る（agent が選べるのは type だけ）
  - 入力ごとに 1 体走る（入力が 1 つなら 1 体）
  - `code` の子のコミットは ref で返り、agent が取り込むかを決める
  - `input` の全文が、子のプロンプトの先頭に payload として入る（子が読む文書ではない）
  - `consult` の `README` の表が、実際のツールと一致する
  - 定義 1 枚のレビューが、出力上限に当たらずに終わる

### 5. input-guard

- Change: add
- Actor: agent
- Given: `consult` に空のファイルを渡す
- When: agent が入力を渡す
- Then:
  - 子は走らず、理由が返る

### 6. readme

- Change: update **節は 7 つ。tickets の行を分ける。次の入口の名指しをやめる。検査の数を実物に合わせる**
- Actor: owner
- Given: clone 直後
- When: owner が `README.md` を開く
- Then:
  - 何が入っているか分かる
  - 最初に何をすればいいか分かる
  - 書いてあることと実物が食い違わない（節の数 / 各スキルの役割 / 検査の数）

### 7. definition-skill

- Change: update **本文から、次のスキルの名指しを消す（入口を指すのは `description` だけ）**
- Actor: agent
- Given: 前のサイクルが閉じている
- When: agent がサイクルを始める
- Then:
  - `cycles/<NNN-DATE>/definition.md` が出て、7 節がある（`Stack` と `Retro` は空でよい）
  - 前のサイクルの `Carry over` の全行が、この 1 枚のどこかに対応している（単位 / `Non-goal` / `Changes` の理由）
  - 子に書かせる題材には、リポジトリに答えが無いものを選ぶ（子が写せない）
  - 承認までは、`cycles/` 以外に変更が無い
  - 本文が、次のスキルを名指ししない

### 8. stack-skill

- Change: update **`description` から、次を名指しする句を消す**
- Actor: agent
- Given: 定義の他の節が埋まっている
- When: agent がスタックを決める
- Then:
  - `Stack` が埋まる（与えられたハーネスが土台、足した分だけが書かれる）
  - 足した理由が残る（差分で読める）
  - `description` に、次のスキルの名前が無い

### 9. plan-skill

- Change: update **`description` から、次を名指しする句を消す**
- Actor: agent
- Given: 定義が承認された
- When: agent がプランを書く
- Then:
  - `step 0` を含む `Steps` と、`Structure` が出る
  - 全 step にファイル名とテスト名が入っている
  - 単位に無い step（後片付けなど）は、`step 0` の `Cleanup` に置かれる
  - 承認までは、プランのファイル以外に変更が無い
  - `description` に、次のスキルの名前が無い

### 10. tickets-skill

- Change: update **`description` から、次を名指しする句を消す。合意で終わることを本文どおりにする**
- Actor: agent
- Given: プランが承認された
- When: agent がチケットを切る
- Then:
  - チケットが出て、`Todo` と `Verify` の承認を取り、コミットされる
  - ハッシュを書くのは作業した側で、このスキルは合意したところで終わる
  - `description` に、次のスキルの名前が無い

## What to keep

- `check-suite` From: 001
- `commit-gate` From: 001
- `quality-gate` From: 001
- `agent-rules` From: 001
- `sound-notify` From: 001
- `remote-pi` From: 001

## Stack

Changes: keep

## Retro

- Good:
- Bad:
- Carry over:
