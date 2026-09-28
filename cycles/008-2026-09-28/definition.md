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

Changes: keep

## What to build

### 1. consult.sound

- Change: update
- Actor: agent
- Does: 子が走っていることを音で知らせる
- Now:
  - 子が走っている間は無音で、始まるときと終わるときにだけ `Tink` が鳴る
  - 音を止める口が無い
- Then:
  - 子が 1 体以上走っている間、5 秒ごとに 1 音（子が何体でも 1 音、タイマーも 1 本）。0 体になったら止まる
  - 鳴るのはその 1 音だけで、始まりと終わりの音は無い
  - `/consult-sound on|off` で切り替えられる（既定 on、セッション限り）
  - テストでは鳴らない。`consult/README.md` が追随している

### 2. consult.retry

- Change: update
- Actor: agent
- Does: 子が止まったことを、確かに親へ伝える
- Now:
  - フックに拒否されると `ref` が作られず、`finally` が worktree を消すので子の作業が消える（007 で 2 回起きた）
  - 上限で打ち切られると、結果が途中のまま親に届く。打ち切りは本文の頭に 1 行（`consult stopped early: turn limit reached (60)`）出るが、親が判断に使う所（`details`）には来ない
- Then:
  - 拒否されたら、同じ worktree で `--continue` の子がもう 1 回走る（フックの出力がその子に渡る）。通れば `ref` ができる
  - 2 回目も通らなければ worktree が残り、親に理由が届いている: 落ちた検査の出力、変えたファイルの一覧、子の最後の本文、走った回数、時刻、worktree の id
  - 上限で打ち切られたら同じループが 1 回走り、それでも止まれば打ち切りと回数が本文に明示される
  - 上限は 1 回ごとに数え、使用量は合算して 1 回分として報告される
  - 2 回目にも同じ `AbortController` が渡る

### 3. consult.resume

- Change: add
- Actor: agent
- Does: 止まった子の場所を引き継いで、続きをやらせる
- Now:
  - 止まった子の worktree を扱う口が無い（一覧も、続きも、片付けもできない）
- Then:
  - `list` が、残った worktree を返す（id、時刻、止まった理由、変えたファイル）
  - `run` が、その worktree をそのまま使って子を走らせる。既定で `--continue`（同じ場所の直近の会話を引き継ぐ）。セッションが無ければ新しい会話になる
  - `run` の型は呼ぶ側が選ぶ（調べるのは `research`、直すのは `code`）
  - `remove` が、その worktree を消す（親は外のパスを直接消せないため）
  - 停止の記録（理由、時刻）は worktree の外に、工具によって置かれる（子には書かせない）

### 4. consult.tools

- Change: update
- Actor: agent
- Does: 道具の名前を揃える
- Now:
  - 名前が揃っていない（`consult` は実質「新しい worktree で走らせる物」、`ref_cleanup` は consult の ref を扱う物）
- Then:
  - `consult_new` / `consult_resume` / `consult_refs` の 3 つになる
  - 説明文と prompt、`consult/README.md`、`README.md` / `README.ja.md`、スキルの本文（`work/SKILL.md` などの呼び方）が新しい名前に揃っている

### 5. sound-notify.commit

- Change: update
- Actor: agent
- Does: コミットを音で知らせる
- Now:
  - 鳴るのは許可・質問・ターン終了の 3 つで、コミットの音が無い
  - テストが無く、鳴らす所が差し替えられない
- Then:
  - `bash` の `git commit` で `Pop` が鳴る
  - 音は今の 3 音と同じ形で差し替えられる（`config.json` の `sounds`。無ければ `Pop`）
  - 鳴らす所が差し替えられる形になっていて、テストでは鳴らない
  - `sound-notify/README.md` が追随している

### 6. plan-skill.owner

- Change: update
- Actor: agent
- Does: ユニットごとに、owner の値を owner に確認する
- Now:
  - ユニットごとに owner が入るかを決める段が無い（動きはサイクルの最後に 1 回報告する形だけ）
  - step をどの大きさで切るかの規則が無い
- Then:
  - プラン作成時に、ユニットごとに `owner: in the loop / at the end` が owner に確認される（既定は `at the end`）
  - `in the loop` のユニットの step は vertical slice で切られている。内部だけの step（列を足す、設定を変える、リファクタ）は単独にせず、見せられる切片に付いている
  - 「見せられる大きさ」の定義が `plan/references/format.md` にある: 1 つの操作が端から端まで動き、owner が見て 1 つの判断（残す / 直す / 捨てる）を下せること。見せる物は 1 つ
  - 見せ方（起動する・画面を撮る・差分を見せる）が step ごとに書かれている

### 7. tickets-skill.owner

- Change: update
- Actor: agent
- Does: チケットに、止まる場所と見せ方を書く
- Now:
  - チケットに owner の値も、どこで止まるかも書く欄が無い
  - チケット名の規則が、step の名前だけになっている
- Then:
  - チケットに `owner:` と「どこで止まるか・何を見せるか・何をもって終わりか」が入る
  - チケット名は `ユニット名.機能.何するか` になる（いまの `<unit-id>.<part>` の 2 段を、この 3 段に置き換える）。`<NN>-` の番号と `ex-`、`.check` / `.refactor` の扱いも `tickets/references/format.md` にある
  - 007 で決めた `ex-` の規則と合っている

### 8. tickets-skill.stopped

- Change: update
- Actor: agent
- Does: 止まった step をチケットに残す
- Now:
  - step が止まったことを書き込む欄が無く、閉じたのか止まったのかがチケットから分からない
- Then:
  - 止まった step のチケットは開いたまま残り、理由が書かれている: 落ちた検査の出力、変えたファイルの一覧、走った回数、時刻
  - この欄の形が `tickets/references/format.md` にある

### 9. work-skill.owner

- Change: update
- Actor: agent
- Does: owner の値に従って作業を進める
- Now:
  - ユニットごとの `owner` の値を見る段が無い
  - `work/SKILL.md` の「最後に 1 回報告する」と step 13 がそのままで、step で止まって見せる道が無い
- Then:
  - `work/SKILL.md` の段が `owner` の値に従う。`in the loop` のユニットでは、step の単位で止まって見せ、軽微な修正はそのチケットの中で繰り返す（チケットを増やさない）。コミットとレビューはループの後になる
  - 「最後に 1 回報告する」は `at the end` のユニットの動きになる
  - チケットの `read` に、どこで止まるか・何を見せるか・何をもって終わりかが書いてある

### 10. work-skill.stopped

- Change: update
- Actor: agent
- Does: 止まった step を、閉じずに close へ渡す
- Now:
  - 止まった step の扱いが無く、親がやり直すのが唯一の道になっている
- Then:
  - 止まった step のチケットは閉じない。親は理由を読んで、(a) 指示を直してやり直す、(b) `consult_resume` に `research` を送って調べる、(c) 分かれば `code` を送って直す、(d) 開いたまま close に渡す、から選ぶ
  - 止まったことが owner に報告される

### 11. work-skill.tests

- Change: update
- Actor: agent
- Does: テストを自分の一時ディレクトリに書かせる
- Now:
  - テストが本体にファイルを書けてしまう（書き方の決まりが無い）。子のコミット（`git add -A`）がそれを巻き込む
  - 「テストは自分の一時ディレクトリに書く」の行が、helper を名指ししていない
- Then:
  - `work/SKILL.md` の行が共通の helper（`test/tmp.ts`）を通すことを名指ししている（使わないテストは、書いてある規則の違反になる）
  - レビューの観点に 1 行入っている

### 12. work-skill.squash

- Change: update
- Actor: agent
- Does: ユニットのコミットを 1 つにまとめる道具を、どの長さのハッシュでも使えるようにする
- Now:
  - `work` スキルの道具 `squash.mjs`（ユニットのコミットを 1 つにたたみ、チケットの `Commit:` を埋める）は、ハッシュをフルで渡すと「一覧が base..HEAD と違う」と言って止まる。短いハッシュだけ通る
  - 007 の close の直後に、実際にこれで止まった
- Then:
  - 短くてもフルでも同じように通る（`base..HEAD` との照合がハッシュの長さで変わらない）
  - どちらの形で渡しても通るテストがある

### 13. check-suite.tmp

- Change: update
- Actor: agent
- Does: テストを本体から隔離する
- Now:
  - 相対パスでリポジトリに書くテストが混ざっても、何も止めない
- Then:
  - 共通の helper（`test/tmp.ts`）があり、その doc に使い方が書いてある。テストはそれを通して一時ディレクトリに書く
  - 既存のテストもその形に書き換わっている

### 14. definition-skill.units

- Change: update
- Actor: agent
- Does: ユニットの名前を安定させる
- Now:
  - 前のサイクルのユニット一覧を引き継ぐ段が無い
  - ユニット名の増減の規則が無い（更新のたびに名前が作り直される）
- Then:
  - `definition/SKILL.md` が、前のサイクルの `What to build` と `What to keep` の一覧から始める（名前を持ってくる）
  - 名前が増えるのは `Change: add` のときだけ、減るのは `drop` のときだけ。`update` は名前を変えず `ユニット名.機能` で書く
  - unit は実物（拡張・スキル・ゲート・文書）で、機能は unit にしない。機能は `ユニット名.機能` で書く
  - 007 で unit として並んでいた `secret-guard` / `input-guard` / `ref-cleanup` は、実物では `consult` の中の機能なので unit をやめる（この定義では `Change: drop` として並んでいる）
  - `definition/references/format.md` の名前の規則はこの形に置き換わる

### 15. close-skill.stopped

- Change: update
- Actor: agent
- Does: 止まったままのチケットを close で判断する
- Now:
  - 開いたチケットを close で判断する段が無く、残った worktree も放置される
- Then:
  - close は、開いているチケットを穴として扱い、調査の段で理由を確かめて、owner と「続ける / 落とす / 持ち越す」を決める
  - 決めたとおりに、残った worktree を消すか残すかする（`consult_resume` の `remove` を使う）

### 16. readme.tools

- Change: update
- Actor: agent
- Does: README の道具の説明を実物に合わせる
- Now:
  - README が `consult` と `ref_cleanup` の 2 つとして説明しており、`consult_resume` が無い
- Then:
  - `README.md` / `README.ja.md` が 3 つの道具（`consult_new` / `consult_resume` / `consult_refs`）を説明している

### 17. secret-guard

- Change: drop

### 18. input-guard

- Change: drop

### 19. ref-cleanup

- Change: drop

## What to keep

- `commit-gate` From: 001
- `quality-gate` From: 001
- `agent-rules` From: 001
- `stack-skill` From: 007

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

Changes: keep

## Retro

### Good

### Bad

### Carry over

1. レビューの子が、サイクルごとに何度も走り、時間がかかりすぎる
   - Status: スキルごとに、レビューをかける段・本数・巡数の上限がばらばらで、全体の方針が無い。008 の tickets 段に入るまでで review の子が 9 体、plan は 4 巡（blocking は 4 → 1 → 3 → 1 件）にかかった
   - Research:
   - Action: レビュワーを使うスキルを棚卸しし、レビューの内容（観点）と、使うタイミング・本数を決め直す
   - Basis: 008 の実測: 1 体あたり 8〜33 ターン、$0.04〜0.09。review の子の上限は 40 ターン / 出力 60k（`.pi/extensions/consult/types.json`）
   - From: 008.tickets

2. 凍結の規則が、スキルごとに違って見える
   - Status: 「凍結」「そのあと編集しない」の書き方がスキルごとにばらばらで、何が凍り、何が凍らないかが読む側の解釈に委ねられている（定義の `Stack` / `Retro` は後から書く物、チケットの `Commit:` は後から埋まる物、スキルとコードは凍らない、などの関係が、それぞれの場所にしか書いていない）
   - Research:
   - Action: 全スキルの凍結の規則を棚卸しし、何が違うかを並べて、どれが良いかを決める（定義・プラン・チケットの凍結点と、凍ったあとに書ける物の一覧を 1 か所に置く）
   - Basis: `definition/SKILL.md` の `What is frozen`、`plan/SKILL.md` の `What is frozen`、`tickets/SKILL.md` の各段。008 では、凍結した定義の `Carry over` に後から書いてよいかの判断で迷った（`Retro` は後から書く物だが、それがどのスキルにも明記されていない）
   - From: 008.tickets

3. `work` と `tickets` の手順が、1 step ずつ直列に進める前提になっている
   - Status: `work/SKILL.md` は step を 1 つずつ閉じる形で書かれ、`tickets/SKILL.md` も 1 枚ずつ読む前提。並列に走らせると、どこまでを同時に流し、いつ検証し、どう閉じるかが手順から読めない（008 の `work` 段では親がその場で判断した）
   - Research:
   - Action: `work` と `tickets` の手順を、並列を前提に抜本的に書き直す（同時に走らせる条件、検証のタイミング、閉じ方、`Depends` との関係）
   - Basis: 008 の `work` 段で、依存の無い 3 step（`01` / `06` / `16`）を並列に流した。手順の側に並列の規則が無く、判断が親に残った
   - From: 008.work
