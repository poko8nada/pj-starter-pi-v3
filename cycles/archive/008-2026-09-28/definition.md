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

- 19 枚のチケットが全部閉じた — すべての step が `Verify`（`test` / `read` / `form`）と影響読みを通り、`Commit:` を持った。`.check` の 2 枚は `なし（何も変えない step）` のまま
- 止まった step の道が書いてあるとおり動いた — 5 step が止まった（09・12・14・17・18）。12 は `### Stopped` 節で、09・14・17・18 は `Findings` と `Unplanned` で、理由と親の手が残っている。親はどれも続けられた（09・12 は親がやり直し、14・17・18 はオブジェクトから救出）
- レビューの子が、テストでは出ない物を当てた — 検証と影響読みで blocking が計 12 件。例えば「1 回目に `--continue` が付かない」「2 回目が中断を見ない」「README の表が two tools のまま」
- 道具に、フローが要る部品が入った — `consult_resume`（`list` / `run` / `remove`）、worktree の外に置く停止の記録、拒否されたときに作業を残す再走

### Bad

- 子が自分でコミットした step は ref が作られない — 14・17・18 の 3 連続で「変えた物が無い」と見え、worktree ごと消えた。毎回オブジェクトが残っていたので救えたが、保証はない
- reload と走っている子でプロセスが落ちる — 1 回（14:08）。`deliver` が古い `pi` を使い、子の未コミットの作業が worktree ごと宙に浮いた
- 親がやり直した step が 2 つ — 09 と 12（12 は 3 回かかった）。新しいモジュールを書く step にターン上限 60 は短く、どちらもフックにコミットを拒否された
- 道具を agent が呼べないセッションがある — `consult_resume` と `consult_refs` は reload で登録されたが、走っている agent の道具一覧はセッションを開いた時のまま。最後の worktree と 13 本の ref は owner が消した（Close の step 9 の担当。owner の call は「消す」。2026-09-28）

### Carry over

1. レビューの子が、サイクルごとに何度も走り、時間がかかりすぎる
   - Status: スキルごとに、レビューをかける段・本数・巡数の上限がばらばらで、全体の方針が無い。008 の tickets 段に入るまでで review の子が 9 体、plan は 4 巡（blocking は 4 → 1 → 3 → 1 件）にかかった
   - Research:
   - Action: レビュワーを使うスキルを棚卸しし、レビューの内容（観点）と、使うタイミング・本数を決め直す
   - Basis: 008 の実測: 1 体あたり 8〜33 ターン、$0.04〜0.09。review の子の上限は 40 ターン / 出力 60k（`.pi/extensions/consult/types.json`）
     - 008 の close でも出た: 19 枚のチケットと定義を 1 体に渡したら、ターン上限 40 で何も返せずに止まった（観点を 2 つに割って 2 体にして通した）
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

4. reload が、走っている子の完了通知でプロセスごと落とす
   - Status: `consult` の `deliver`（`tool/consult.ts:471`）が、`createRuntime(pi)` で掴んだ古い `pi` を保持したまま `pi.sendMessage` を呼ぶ。reload のあと、走っていた子が終わるときに「This extension ctx is stale after session replacement or reload」で uncaughtException になり、pi が終了する（008 で実際に起きた。子 1 体の作業が worktree ごと宙に浮き、未コミットのまま取り出せなくなった）
   - Research:
   - Action: どちらかを決めて直す。(a) 拡張が reload 後に古い `pi` を捨てる（配送を譲る、または session 系のイベントで新しい `pi` を受け直す）。(b) 手順側で「子が 0 体のときだけ reload する」を `work` / `close` の規則に書く。私は (a) が本筋だと思う（規則で避けるより、落ちない形にする）
   - Basis: 008 の crash（2026-09-28 14:08。`tool/consult.ts:471` の `deliver` → `pi.sendMessage`）。`docs/extensions.md` の「Do not use a captured pi or command ctx after ... `ctx.reload()`」。`work/SKILL.md:86` の reload の規則は「子が走っている間は reload するな」と言っていない
   - From: 008.work

5. 子の再走の `--continue` が、効いていない
   - Status: `child/spec.ts:64` が `--no-session` を渡すので、pi は `--continue` を見ずに新しい会話で走る（`docs/sessions.md:52`「An ephemeral session cannot be resumed after Pi exits.」）。2 回目の子が引き継ぐのはペイロード＋task＋フック出力だけで、直前の会話ではない。008 では字面（同じ worktree でもう 1 回、フックの出力が渡る）が満たされるので、そのまま進めた（owner の判断）
   - Research:
   - Action: 子に会話を引き継がせるか（2 回目だけ `--no-session` を外す）、会話は引き継がないと決めて「resume」の意味を「同じ worktree での続き」に定義し直すか。step 12（`consult.resume`）の設計はここに依存する
   - Basis: 008 の step 09（`run/child.ts:96` が `--continue` を足す）と `child/spec.ts:64`。影響読み `consult-9` の指摘（チケット `09-consult.retry.reject.md` の `Findings`）
   - From: 008.work

6. サイクルのフローそのものが重い（owner と一緒に見直す）
   - Status: owner の言葉「そもそもフローが大変なので、見直すって一緒に」（008 の step 09 のやり取り）。1 step ごとに子を出し、検証（`test`・`read`・影響読み）と単位レビューが積み重なり、サイクル 1 回で子が数十体・数十ドルになる
     - owner の補足: 私が出した局所案（検査を単位に寄せる、`read` を減らす等）は的外れ。「そう言う局所的なことではない。完全に見直す」との回答で、フロー全体の書き直しになる見込み。こちらから案を出すのは待つ
   - Research:
   - Action: owner がフロー全体を見直す（書き直す）。私は案を出さず、その結果を待つ。材料として、このサイクルの実測（子の数・費用・詰まった所・重かった検査）を渡す
     - owner の補足: squash そのもの（いまの `squash.mjs`）も、この見直しで考え直す。008 では 60 本のコミットを squash せずに残した（過程そのものが一次資料のため）
   - Basis: 008 の実測（子 40 体以上、1 体 $0.001〜0.09）。`Carry over` 1（レビューが重い）と 3（並列前提でない）は、この見直しの一部
   - From: 008.work

7. 子が自分でコミットすると、ref が作られず作業が失われる
   - Status: `commitWorktree` は working tree の差分をコミットするので、子が自分で `git commit` していると「変えた物が無い」と見え、ref が作られない。そのまま `finally` が worktree を消すと、そのコミットは宙に浮く（008 で 14・17・18 の 3 連続。いずれもオブジェクトが残っていたので `git cherry-pick` で救えたが、保証はない）
   - Research:
   - Action: worktree に base より先のコミットがあれば、それを ref にする（子のコミットをそのまま `consult/<label>` に載せる）。無ければ今までどおり差分をコミットする
   - Basis: 008 の 3 件。`run/run.ts` の `commitWorktree` は `git status --porcelain` が空なら `no-change` を返すので、子のコミットは見えない。3 件とも本文は `ref: (the child changed nothing)` で、親が `git cherry-pick` で救った
   - From: 008.close

8. 拒否の 2 回目で、worktree が残らなかった
   - Status: step 12 の停止で、`attemptAndCommit` の「2 回目も通らなければ worktree を残す」道が働かず、worktree が消えた（`12-consult.resume.md:85`）。unit 2 の `Then`（「2 回目も通らなければ worktree が残り」）を割り得る。007 の `Carry over`（フック拒否で子の作業が消える）の残りでもある
   - Research:
   - Action: `attemptAndCommit` の `kept` の道を実物で 1 回確かめ、なぜ残らなかったかを追う（worktree を消す `finally` との順序、例外の道）
   - Basis: `12-consult.resume.md:85` と `:86`（owner の call: 続ける）。008 で worktree が残った停止は 1 件も無い
   - From: 008.close

9. `definition` スキルの 3 つの穴（008 の unit 12 が `Carry over` 候補として残した物）
   - Status: プレースホルダのドット無し（N-3）、`add` の名前の形と初回の定義の例外（N-5）、チェックリストの入れ子（N-6）。`16-definition-skill.units.md:50` が「`Carry over` 候補」と名指ししたまま、008 の `Carry over` に 1 本も無かった
   - Research:
   - Action: 3 つのうち直す物を決め、`definition/references/format.md` を直す
   - Basis: `16-definition-skill.units.md:50`。008 の Close のレビュー（`consult-2`）が指摘
   - From: 008.close

10. `consult_resume` の面が、`consult_new` と揃っていない（008 の Close のレビュー `consult-3` が見つけた 4 件）
    - Status: (A) `run` の本文に `consult runs: N` と `files:` が出ない（`tool/resume.ts:107` が summary を渡さず、kept でもファイル一覧を出さない。`list` には出る）。(B) kept の通知は worktree の `id` ではなくパス（`stopped.json` に id が無い。dir から導出できるので復帰は可能）。(C) `consult/README.md:126` が「limit で止まった子は worktree を残す」と広く読める（実際に残るのは 2 回目もフックに拒否されたときだけ）。(D) `work/SKILL.md:17` の read 一覧に `止まり方` が無い（`:21-37` には読む道がある）
    - Research:
    - Action: 4 件を直すか捨てるかを決める（A・C は文面と引数の受け渡し、B は id を記録に足すか、D は列挙に 1 語）
    - Basis: 008 の Close のレビュー（`consult-3`、blocking は 0 でこれだけが残った）。Definition の `Then` の主面（`consult_new`）は満たされている
    - From: 008.close
