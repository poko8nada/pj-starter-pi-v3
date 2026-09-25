# ハーネス付きスターター

## What

- Type: プロジェクトと、そのエージェント用ハーネスが一緒に立ち上がるスターター
- Who:
  - owner: clone する人。プロジェクトの持ち主。検査とゲートの恩恵を受ける
  - agent: 同じリポジトリで作業する。規則に従う側

## Goal

新しいプロジェクトを始めたときに、検査・commit ゲート・エージェントの規則が最初から揃っていて、自分で配線しなくてよい。

## Non-goal

- CI に検査を足さない
  - Why: ローカルのフックが担う。自分用のスターターなので
- clone 先の技術選定に関与しない
  - Why: スタックは clone した側が決める
- 使わない設定を消さない
  - Why: 休眠として残す（react / src / app / pages）
- メッシュ（`remote-pi`）をハーネスの機能にしない
  - Why: サードパーティのパッケージの仕事。ハーネスは設定の置き場所（`.pi/remote-pi/.gitignore`）だけを用意する

## What to build

1. check-suite
   - Change: add
   - Actor: owner
   - Given:
     - clone 直後
     - 依存は未インストール
   - When: `pnpm install` のあと `pnpm test:run` を叩く
   - Then:
     - format / lint / typecheck / test の 4 つが走る
     - 結果が 1 行ずつ出る
     - 全部通れば exit 0
2. commit-gate
   - Change: add
   - Actor: owner
   - Given:
     - 依存インストール済み
     - 作業ツリーに型エラーが 1 つある
   - When: `git commit` する
   - Then:
     - commit は起きない
     - 落ちた検査とファイルが出る
3. quality-gate
   - Change: add
   - Actor: agent
   - Given:
     - pi セッションが動いている
     - 編集した 2 つの `.ts` のうち片方に型エラーがある
   - When: agent がターンを終える
   - Then:
     - 変えた 2 つが検査される
     - 壊した方だけが差し戻される
     - 緑でないまま終えようとすると直しに戻る
     - 3 回で打ち切る
4. agent-rules
   - Change: add
   - Actor: agent
   - Given:
     - clone 直後
     - 何も説明されていない
   - When: owner が「テストが落ちてるので直して」と頼む
   - Then:
     - `AGENTS.md` の規則に従う
     - コードに触る前に 1 枚を書き、承認を待つ
     - 検査を弱めない
5. consult
   - Change: add
   - Actor: agent
   - Given: 自分の仕事を疑いたい場面
   - When: agent が `consult` を呼ぶ
   - Then:
     - この会話を見ていない子 pi が 1 回走る
     - 最後のテキストが返る
6. sound-notify
   - Change: add
   - Actor: agent
   - Given: pi セッションが動いている
   - When: agent が owner に許可を求める、または質問する
   - Then:
     - owner の環境で音が鳴る
     - 通知が出る

## Stack

- Runtime: Node 24 / TypeScript 6
- Package manager: pnpm 12
- Checks: oxlint / oxfmt / tsc / vitest
- Hooks: lefthook（pre-commit / pre-push）
- Agent: pi 拡張（quality-gate / consult）

## Retro

- Good:
  - 定義・プラン・チケットの型が実際に回った
    - プランを書く段で定義の穴が見えた
    - チケットを書く段で実装の粒度が決まった
  - 実演を回したので、規則が守られないことが分かった
    - チェックボックスなら「書いた」で終わっていた
  - `Verify` を動かせない規則が、失敗を失敗のまま残した
  - 自分で違反をやって、その場で規則にできた
    - `Todo` と `Verify` の書き換え
- Bad:
  - 機構がスキルとして存在しないので、`agent-rules` の `Acceptance` は達成できない
    - ハーネスが揃う前に回した
  - `Verify` が実行可能かを確かめずに書いた
    - `Verify` は後から直せないので、ここが緩いとチケット全体が無意味になる
  - 分量の要求が後から出た
    - 先に出ていれば、`Todo` を書き換える違反は起きなかった
  - 定義・プラン・チケットを同時に初めて回したので、問題の層を毎回切り分ける必要があった
    - どの紙の責任か
  - 001 を閉じた後の議論で見つかった: `What to build` がプロダクトの振る舞いを数え上げていなかった
    - 単位にも `Non-goal` にも無いもの
      - `consult`
      - `sound-notify`
      - 個人設定
      - `remote-pi`
      - `README`
    - 原因は 2 つ
      - 定義を直前の作業（検査とゲート）から書いたこと
      - 「プロダクトがすることを全部数え上げる」という規則が無かったこと
  - 同じく: 仕組みのスキル化を 1 つの大きなスキルとして考えるのは誤り
    - 荒いと破綻する
    - 成果物ごとに分ける
  - 同じく: 数え漏れのうち、元から動いていた 2 つは、例外的に 001 の定義に追記した
    - `consult`
    - `sound-notify`
  - 個人設定は単位にしない
    - `AGENTS.md` の規則と各ディレクトリの `.gitignore` で済んでいる
  - `remote-pi` は `Non-goal`
  - `README` は元から無い（空のファイル）ので 002
