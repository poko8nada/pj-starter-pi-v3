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

このサイクルは **consult の作り直しだけ**をやる。作る形の全体は `consult-redesign.md`（リポジトリ直下、実装が終わったら削除する一時ファイル）に書いてある。以下の `Then` はそこから写した。
このサイクルは `consult` の**中の契約を総取り替え**する。名前と、実証済みの器官（`child/guard.ts`、`tool/sound.ts`、`run/git-env.ts`、`vitest` の検査一式）は残す。3 つの道具（`consult_new` / `consult_resume` / `consult_refs`）と、ref・diff・`stopped.json`・`kept` の契約は持ち込まない。

unit 11（`consult.workspace.remove`）は **owner の承認（2026-09-29）で追加**した。step 7 の実演で、worktree を消してもブランチが残り、片付けが人（owner）の手作業になることが分かったため。

### 1. consult.roles

- Change: update
- Actor: agent
- Does: 子をどのロールで、どこで走らせ、何ターンまで・続きを使うかを決める
- Now:
  - `environment: tree | worktree` が場所を決める。`tree` のロールは親の木でしか走れない
  - `code` の上限 60 は新モジュールを書く step に足りない（008 で親が 2 回やり直した）
  - 続き（`--continue`）を使うかどうかが型に無い
- Then:
  - `readOnly` が場所を決める: `true` は worktree 引数が任意（無ければ親の木）、`false` は必須（省略 = エラー）
  - 上限は全ロールに必須: research 40 / review 40 / trial 60 / code 80
  - `continueByDefault`（bool）が型にある: research false / review false / trial true / code true。`consult_run` の引数を省くとこの値が使われる
  - 型の `role` にチケット・サイクルの言葉が無い（疎結合）。「終わらなければ、どこまでやったかと理由を報告して終える」の抽象だけ

### 2. consult.workspace

- Change: add
- Actor: agent
- Does: unit ごとの作業場（worktree）を、明示しない限り残して持つ
- Now:
  - worktree は 1 回の実行ごとに作り、`finally` で必ず消す。残るのは失敗したときだけで、その道は実際には働いていない（008 で残った worktree は 0 件）
  - 置き場が `os.tmpdir()`（`/private/var/folders/...`）で、親から読めない
  - `--detach` なので、コミットが本体に載らない
- Then:
  - 置き場は `/tmp/pi-consult/<project>-<YYYYMMDD-HHMM>/<unit-id>/`。親も子も read/bash できる（規則を増やさない）
  - worktree 名 = unit id、ブランチ = `consult/<unit-id>`、base = 親の HEAD（`main` を仮定しない）
  - **明示しない限り残る**。消すのは `consult_worktree{action: remove}` だけ
  - 同じ worktree に同時に書けるのは 1 体（unit 内は直列）
  - 子が動いている worktree は `remove` を拒否する
  - 台帳ファイルは持たない（`git worktree list` と `consult/*` から導出）

### 3. consult.run

- Change: add
- Actor: agent
- Does: 1 体の子を、ロールと worktree を指して走らせる
- Now:
  - `consult_new{type, task, input}` が毎回新しい worktree を作る。行き先を指せない
  - 子は `--no-session` で走るので、続きが無い
- Then:
  - `consult_run{role, task, worktree?, continue?}` が子を 1 体起こし、`started: <id>` をすぐ返す（親は待たない）。`input` を引数に持たない（読ませたいファイルは `task` にパスを書く）。1 呼び出しで走るのは必ず 1 体で、複数欲しいときは道具を複数回呼ぶ
  - `worktree` を指せば同じ worktree で走る。存在しない id はエラー。`readOnly: false` で省略もエラー（暗黙に作らない）
  - `continue` を省くとロールの `continueByDefault`。true なら同じ会話の続き
  - 子のセッションは worktree ごとに 1 つ（`--session <root>/<unit-id>/session`）

### 4. consult.commit

- Change: add
- Actor: agent
- Does: 終わったチケットを worktree でコミットする
- Now:
  - コミットは道具の内側（`commitWorktree`）が差分から作り、フックに拒否されると「変えた物が無い」と見える（008 で 3 回、作業が宙に浮いた）
  - 親は worktree のパスを知らないとコミットできない
- Then:
  - `consult_commit{worktree}` が worktree でコミットし、`committed: <hash>` / `rejected: <フックの出力>` / `no change` を返す
  - 親は id だけで呼べる（tmp のパスを知らない）
  - フック拒否は理由として返り、作業は worktree に残っている
  - メッセージの型は道具が持ち、merge はしない（main 側は CLI）

### 5. consult.children

- Change: update
- Actor: agent
- Does: 走っている子を見て、止める
- Now:
  - `consult_new{action: list|cancel}` が走っている子を返す。reload をまたぐと見失う
- Then:
  - `consult_children{action: list|cancel, id?}` が `id / role / worktree / 経過 / ターン / 費用` を返す
  - reload をまたいでも出る（記録を読む）。動いている子の行には pid がある

### 6. consult.report

- Change: update
- Actor: agent
- Does: 子の結果を、親が次の判断に要る最小で返す
- Now:
  - 親は diff を取り、子の本文を読み、止まった理由を worktree から推測して `Stopped` を書く（親の負荷が大きい）
  - 打ち切りは「turn limit reached」の 1 行で、子自身の状況が無い
  - 親が子に diff を用意して渡す（`/tmp/*.diff`）
- Then:
  - 戻る塊は `id / role / worktree / state（done | stopped + reason）/ files / turns / spend` と、子の最後の本文
  - diff は渡さない（親が要るなら `git -C <path> diff`）
  - **最後の 1 ターン前に、子が自動で状況を報告する**（`turn_end` で `custom_message` を差し込み、`continue: true` を返す）。`stopped: turn-limit` には子自身の報告が付く
  - ありえる戻り値は 6 つで全部（done / done+files なし / turn-limit / hook-rejected / error / aborted）。止まった次の手は 2 択（同じ worktree に `continue: true` で送り直す / 何もしない）

### 7. consult.reload

- Change: add
- Actor: agent
- Does: reload で子の作業を失わない
- Now:
  - reload のとき、走っている子の完了通知が古い `pi` を叩いてプロセスごと落ちる（008 で 1 回、worktree が宙に浮いた）
  - 資源（タイマー・子の登録）がセッションに紐づいていない
- Then:
  - 子は pi のプロセスに従属しない（detach して起こす）。`session_shutdown` で資源を手放すが、子は殺さない
  - 完了通知は「セッションごとの delivery」を通り、reload で差し替わる。古い delivery は no-op になり `log.jsonl` に書く
  - 新しいインスタンスは起動時に `log.jsonl` を読み、前のセッションの子を `consult_children` に出す
  - 検証: 新しいインスタンスを作ってから古い完了ハンドラを呼んでも落ちない

### 8. consult.docs

- Change: update
- Actor: agent
- Does: consult 拡張の説明を新しい形に合わせる
- Now:
  - `.pi/extensions/consult/README.md` が `consult_new` / `consult_resume` / `consult_refs` / ref / diff を説明している
- Then:
  - 説明が 4 つの道具と「worktree は明示しない限り残る」設計に追随している
  - 消える物（`consult_new` / `consult_resume` / `consult_refs` / `stopped.json` / ref）の名残が無い

### 9. skills.align

- Change: update
- Actor: agent
- Does: スキルを新しい consult に合わせる
- Now:
  - `work` / `close` / `plan` / `tickets` が、`consult_new`・ref・diff・`stopped.json`・`consult_resume`・`kept` を前提にしている
- Then:
  - スキルの本文が 4 つの道具と worktree の設計に一致している
  - チケットやサイクルの規約（結果をチケットに書かせる等）は**スキル側の `task`**にある（型と道具には無い。道具は `input` を持たないので、読ませたいファイルも `task` に書く）
  - `Stopped` を書くのは親（`Verify` の結果を知っているのは親だけ）、`Commit:` のハッシュは worktree のコミットの物、という対応が書いてある

### 10. readme.consult

- Change: update
- Actor: agent
- Does: ルートの README から consult の使い方を読めるようにする
- Now:
  - ルートの `README.md` / `README.ja.md` が、consult の道具として `consult_new` / `consult_resume` / `consult_refs` の 3 つを説明している（008 の unit 16 の姿）
- Then:
  - ルートの `README.md` / `README.ja.md` の consult の説明が 4 つの道具（`consult_run` / `consult_children` / `consult_worktree` / `consult_commit`）と、worktree が明示しない限り残る設計に追随している
  - 消えた名前（`consult_new` / `consult_resume` / `consult_refs`）が残っていない

### 11. consult.workspace.remove

- Change: update
- Actor: agent
- Does: worktree を消すとき、取り込み済みのブランチも一緒に片付ける
- Now:
  - `consult_worktree{action: remove}` は worktree だけ消し、ブランチを残す。片付けが親（人）の手作業になり、unit ごとに 1 回残る（009 の step 7 の実演で実際に起きた）
  - agent からは `git branch -d` を打てない（権限の規則が拒否する）。道具の中の `git` なら打てる
- Then:
  - `consult_worktree{action: remove, id, force?}` が worktree を消したあと、**ブランチも消す**
  - 既定は「HEAD に取り込み済みのときだけ」。未マージならブランチを残し、その理由を返す（未マージの仕事を消さない）
  - `force: true` は未マージでも消す（捨てると決めたとき）
  - 「worktree は明示しない限り残る」はそのままで、消す口も `consult_worktree` のまま

## What to keep

- `commit-gate` From: 001
- `quality-gate` From: 001
- `agent-rules` From: 001
- `stack-skill` From: 007
- `sound-notify` From: 008
- `check-suite` From: 008
- `plan-skill` From: 008
- `tickets-skill` From: 008
- `work-skill` From: 008
- `definition-skill` From: 008
- `close-skill` From: 008

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

- consult の中の契約を、1 サイクルで総取り替えできた。3 道具 → 4 道具、`input` なし、worktree は明示しない限り残る
  - 値: 実演の `5696a4b`（子の `DEMO.md` が merge で親のブランチに入った）と、close の統合（置き場 → 子 → 記録 → commit → 片付けの 5 シームが全部緑）
- 「テストが緑でも実物で壊れている」を、実演と統合が当てた。このサイクルで見つかった本物の不具合は 4 件で、どれもテストだけでは出なかった
  - 値: root の 1 段ずれと `/tmp` の文字列比較（デモで `consult_children` が「no children」）／塊の見出し `## consult undefined`（完了メッセージ）／検査の `runGit` が worktree を扱えない（07b の検査）／ルート README の検査名（consult-7）
- レビューが軽くなった。008 は子 1 体が 8〜33 ターンかかり、close では 19 枚を 1 体に渡してターン上限に当たった
  - 値: 009 の review の子は 5 体、最大 3 ターン、計 $0.02。観点を 1 枚のチェックリストに絞ったのが効いた
- 4 つの道具の契約が、型と検査で決まる形になった。`readOnly` が場所を決め、`consult_commit` がメッセージを持ち、diff を運ばない
  - 値: 削除された契約（`consult_new` / `consult_resume` / `consult_refs` / `input` / ref / `stopped.json` / `kept`）が、木と README の両方から消えている（form の grep が 0 件）
- 子が親のプロセスに従属しない。reload をまたいでも、記録と一覧は生きている
  - 値: 完了メッセージが実際に届いた（`consult-1` の塊）／reload 後に `consult_children` が走っている子（`consult-2`）を pid つきで出した
- owner の判断が step の途中で入り、手戻りが小さかった（pi の 0.87.1 へ上げる、7b の追加、E と D を落とす、掃除は「自然に」）
  - 値: どれも 1 step 以内で吸収できた（7b は定義・プラン・チケットを追加して 3 コミット）

### Bad

- step 3（consult.run）で何度も往復した。大きな refactor で edit が対象を見失い、quality-gate に 1 回引っかかった
- 「消える器官を import しているファイルが連鎖で壊れる」形を、step 2・3・5・6 で繰り返した（resume 一式 / `tool/consult.ts` / refs 一式 / resume 参照）。消える物を先に grep する習慣が抜けた
- step 7 の実演で、テストが緑なのに実物が壊れていた（root の 1 段ずれ + `/tmp` と `/private/tmp` の文字列比較）。テストは同じ分に収まるので見えず、分が変わった実演で初めて出た
- チケットが想定していなかった実装を 2 つ、step の途中で足した（記録の書き手＝pid は spawn 直後にしか分からない／`stack` の子の受け渡し）。どちらも検査が拾ったが、Todo の段で見えていなかった
- `Then` を壊す穴（`remove` が実行の根ごと消し、`busy` がどこからも真にならない）を、**名前の話として `Carry over` に置いた**。`Then` と突き合わせていれば `ex-` の判断ができていた。close で owner の問い（「これについて説明して」）が発覚させ、`ex-11` で直した（312 tests）
- 完了メッセージを待つ間、私は「作業枠が尽きた」と何度も言った。実際にはそんな枠は無く、owner の指摘で取り下げた。ターンと信頼を無駄にした
- `Carry over` の「置き場の寿命」は owner が落とした（置き場は `/tmp` で決め）。設計の時に「寿命は macOS の 3 日 TTL に任せる」と明文化していなかったのが穴だった

### Carry over

1. レビューの子が、サイクルごとに何度も走り、時間がかかりすぎる
   - Status: スキルごとに、レビューをかける段・本数・巡数の上限がばらばらで、全体の方針が無い。008 の tickets 段に入るまでで review の子が 9 体、plan は 4 巡（blocking は 4 → 1 → 3 → 1 件）にかかった
     - 008 の close でも出た: 19 枚のチケットと定義を 1 体に渡したら、ターン上限 40 で何も返せずに止まった（観点を 2 つに割って 2 体にして通した）
   - Research:
   - Action: レビュワーを使うスキルを棚卸しし、レビューの内容（観点）と、使うタイミング・本数を決め直す
   - Basis: 008 の実測: 1 体あたり 8〜33 ターン、$0.04〜0.09。review の子の上限は 40 ターン / 出力 60k（`.pi/extensions/consult/types.json`）
     - 009 の実測: review の子は 5 体で最大 3 ターン、計 $0.02。逆に重かったのは research の子（2 体で 10・19 ターン、計 $0.09）
   - From: 008.tickets

2. 凍結の規則が、スキルごとに違って見える
   - Status: 「凍結」「そのあと編集しない」の書き方がスキルごとにばらばらで、何が凍り、何が凍らないかが読む側の解釈に委ねられている（定義の `Stack` / `Retro` は後から書く物、チケットの `Commit:` は後から埋まる物、スキルとコードは凍らない、などの関係が、それぞれの場所にしか書いていない）
   - Research:
   - Action: `definition` / `plan` / `tickets` の「凍結」の記述を 1 つの規則にそろえる
   - Basis: `definition/SKILL.md` の `What is frozen`、`plan/SKILL.md` の `What is frozen`、`tickets/SKILL.md` の各段。008 では、凍結した定義の `Carry over` に後から書いてよいかの判断で迷った（`Retro` は後から書く物だが、それがどのスキルにも明記されていない）
   - From: 008.tickets

3. `work` と `tickets` の手順が、1 step ずつ直列に進める前提になっている
   - Status: `work` は 1 step を親が回す形で、独立した step を並列に子へ渡す道が無い。008 では step 01・06・16 を並列で走らせ、コミットが混ざった（チケットの `Commit:` に複数のハッシュを書く形で回避した）
   - Research:
   - Action: `work` に「依存の無い step を同時に子へ渡す」形を書く（`Depends` の読み方、`Commit:` の書き方、混ざったときの squash をどうするかを含めて）
   - Basis: 008 の `plan.md` の `Depends`、`squash.mjs` が「`HEAD` が一覧の最後」を要求する実装（`squash.mjs:179-182`）、チケット 01・06・16 の `Commit:` の書き方
   - From: 008.plan

4. サイクルのフローそのものが重い（owner と一緒に見直す）
   - Status: owner の言葉「そもそもフローが大変なので、見直すって一緒に」（008 の step 09 のやり取り）。1 step ごとに子を出し、検証（`test`・`read`・影響読み）と単位レビューが積み重なり、サイクル 1 回で子が数十体・数十ドルになる
     - owner の補足: 私が出した局所案（検査を単位に寄せる、`read` を減らす等）は的外れ。「そう言う局所的なことではない。完全に見直す」との回答で、フロー全体の書き直しになる見込み。こちらから案を出すのは待つ
   - Research:
   - Action: owner がフロー全体を見直す（書き直す）。私は案を出さず、その結果を待つ。材料として、このサイクルの実測（子の数・費用・詰まった所・重かった検査）を渡す
     - owner の補足: squash そのもの（いまの `squash.mjs`）も、この見直しで考え直す。008 では 60 本のコミットを squash せずに残した（過程そのものが一次資料のため）
   - Basis: 008 の実測（子 40 体以上、1 体 $0.001〜0.09）。`Carry over` 1（レビューが重い）と 3（並列前提でない）は、この見直しの一部
   - From: 008.work

5. `definition` スキルの 3 つの穴（008 の unit 14 が `Carry over` 候補として残した物）
   - Status: プレースホルダのドット無し（N-3）、`add` の名前の形と初回の定義の例外（N-5）、チェックリストの入れ子（N-6）。`16-definition-skill.units.md:50` が「`Carry over` 候補」と名指ししたまま、008 の `Carry over` に 1 本も無かった
   - Research:
   - Action: 3 つのうち直す物を決め、`definition/references/format.md` を直す
   - Basis: `16-definition-skill.units.md:50`。008 の Close のレビュー（`consult-2`）が指摘
   - From: 008.close

6. 実体の無い worktree と、そのブランチの掃除（自然に、明示のアクションを足さずに）
   - Status: `/tmp` が掃除された後や、手で `git worktree prune` した後に、git の登録だけが残り（`prunable`）、そのブランチ `consult/<unit-id>` も残る。`consult_worktree` は git の登録を読むので、実体の無い行がゴーストとして並ぶ
   - Research: 009 の close のリサーチ（独立の報告 5 件以上）: git のメーリングリスト（2019 の 2 つのパッチ、Eric Sunshine のレビュー）、git-switchboard #14 / viwo #113 / agent-orchestrator #2045 / git-worktree-runner #182 / desktop #22605。手当て: `git for-each-ref %(worktreepath)`（git 2.23+、git 自身のテスト t6302 が同じ使い方）で「どの worktree にも checkout されていない枝」を列挙できる。prune 後は「元 worktree があった枝」と「最初から無い枝」の区別が消えるので、残る手掛かりは命名規約 `consult/*` だけ
   - Action: 新しい action は足さない。`remove` の中で（+ セッションの境目に 1 回）掃除する: ①実体の無い登録を `git worktree prune` で落とす ②worktree が無く HEAD にマージ済みの `consult/*` を消す ③未マージは消さずに列挙する ④消した物を返す（黙って消さない）。`list` は読むだけのまま
   - Basis: 009 の close の統合（`consult/demo-1` と `close-1` の枝が、worktree を消した後に残った／`remove` が `missing` で終わると枝に触らない）
   - From: 009.close
