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

### 1. consult

- Change: update
- Actor: agent
- Does: 子に任せる
- Now:
  - `consult` の呼び出しは、子が全部終わるまで親を止める（並列でも待つ）
  - 子への指示を argv で渡しており、`-` や `@` で始まる文書で壊れる
  - `review` の出力上限が 120k で、レビューが長引く
  - 型の定義が読めないときの文面が、原因を問わず「コミットしてある。復元しろ」と言い切る
- Then:
  - 子は既定でバックグラウンドで走り、親は待たずに次の作業ができる（結果はメッセージで届く）
  - 子への指示は stdin で渡る（`-` や `@` で始まる文書でも壊れない）
  - `review` は 40 ターン / 出力 60k
  - 型の定義が読めないときの文面は、原因で分かれている

### 2. secret-guard

- Change: update
- Actor: agent
- Does: 子に読ませない
- Now:
  - 「シェルを真似ない」という線が決まっておらず、穴 3 つ（`cat${IFS}.env`、`cat .env;ls`、`~` の展開のずれ）がどこにも書かれていない
- Then:
  - 「シェルは真似ない（止めるのは、値が決まらない `$` まで）」と決まり、その線と穴 3 つが `guard.ts` の doc と `consult/README.md` の `## Trust` に書いてある

### 3. definition-skill

- Change: update
- Actor: agent
- Does: 定義書を書く
- Now:
  - 手順に、Type / Who の変更を明示的に聞く段が無い
  - `What to build` が owner の 1 回の確認に見え、Now / Then を詰める段が無い
  - レビューの観点が網羅的で、渡すファイルを名指ししていない（子が全体を読み返す）
  - レビューの前に owner が見て同意する、という順序が書かれていない
  - レビューの結果を owner に報告し、エージェントの意見を添えて議論する段が無い
  - レビューの回数が 3 回まで
- Then:
  - 手順の最初の段が、Type / Who の変更の有無を明示的に聞く
  - `What to build` の段が、ユニットごとの `Now` / `Then` を owner と詰める 2 段になっている（草稿の確認と、レビュー後の報告・議論）
  - `definition/SKILL.md` の `The review's checklist` が 2〜4 個で、渡すファイルが名指しされ、観点に「owner が見て同意したか」「直しが owner の指摘に答えているか」が入っている
  - 手順が owner → レビュー → コミット の順で、レビューは 2 回まで

### 4. stack-skill

- Change: update
- Actor: agent
- Does: スタックを決める
- Now:
  - レビューの観点が網羅的で、渡すファイルを名指ししていない
  - レビューの前に owner が見て同意する、という順序が書かれていない
- Then:
  - `stack/SKILL.md` の `The review's checklist` が 2〜4 個で、渡すファイルが名指しされ、観点に「owner が見て同意したか」「直しが owner の指摘に答えているか」が入っている
  - 手順が owner → レビュー → コミット の順で、レビューは 3 回までのループで収束する

### 5. plan-skill

- Change: update
- Actor: agent
- Does: プランを書く
- Now:
  - レビューの観点が網羅的で、渡すファイルを名指ししていない
  - レビューの前に owner が見て同意する、という順序が書かれていない
- Then:
  - `plan/SKILL.md` の `The review's checklist` が 2〜4 個で、渡すファイルが名指しされ、観点に「owner が見て同意したか」「直しが owner の指摘に答えているか」が入っている
  - 手順が owner → レビュー → コミット の順で、レビューは 3 回までのループで収束する

### 6. tickets-skill

- Change: update
- Actor: agent
- Does: チケットを切る
- Now:
  - レビューの観点が網羅的で、渡すファイルを名指ししていない
  - レビューの前に owner が見て同意する、という順序が書かれていない
  - `Commit:` が「自分の step のハッシュ」で、ユニット単位にまとめると指す先が消える
  - close で切ったチケットの名前の規則が無い
  - `read` の合否基準（期待値）を書く欄が無い
- Then:
  - `tickets/SKILL.md` の `The review's checklist` が 2〜4 個で、渡すファイルが名指しされ、観点に「owner が見て同意したか」「直しが owner の指摘に答えているか」が入っている
  - 手順が owner → レビュー → コミット の順で、レビューは 3 回までのループで収束する
  - `Commit:` は同じユニットの 1 コミットを名指し、step の時点では空
  - close で切ったチケットは `ex-<NN>-<step-name>`
  - `### read` に「何が返れば合格か」の欄がある

### 7. work-skill

- Change: update
- Actor: agent
- Does: サイクルの作業を進める
- Now:
  - 1 step = 1 コミットで、ひとつのユニットが 4〜6 コミットに散る
  - チケットが step のハッシュを指す
  - 作業の単位が曖昧（ユニット / チケット / サイクル）
  - ユニット単位のレビューが無い
  - step 7 が `tickets/references/format.md` を指していない
  - 報告が step ごとで、最後に止まって報告する形が無い
- Then:
  - 作業はサイクル単位で進み、最後に止まって報告する
  - ユニットの終わりに 1 コミットにまとまる（`squash.mjs` が `run` を渡されるまで乾燥し、チケットの `Commit:` を書き換える）
  - ユニットの検証のあと、コミットの前にレビューが 1 回入り、その観点は 2〜4 個で渡すファイルが名指しされ、観点に「owner が見て同意したか」「直しが owner の指摘に答えているか」が入っている
  - `work/SKILL.md` step 7 が `../tickets/references/format.md` を指している

### 8. close-skill

- Change: update
- Actor: agent
- Does: サイクルを閉じる
- Now:
  - レビューの観点が網羅的で、渡すファイルを名指ししていない
  - レビューの前に owner が見て同意する、という順序が書かれていない
  - close で切ったチケットの名前の規則が手順に無い
- Then:
  - `close/SKILL.md` の `The review's checklist` が 2〜4 個で、渡すファイルが名指しされ、観点に「owner が見て同意したか」「直しが owner の指摘に答えているか」が入っている
  - 手順が owner → レビュー → コミット の順で、レビューは 3 回までのループで収束する
  - close で切ったチケットは `ex-` で名指しする

## What to keep

- `check-suite` From: 001
- `commit-gate` From: 001
- `quality-gate` From: 001
- `agent-rules` From: 001
- `sound-notify` From: 001
- `input-guard` From: 003
- `ref-cleanup` From: 003
- `readme` From: 003

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

- レビューの観点の絞り込み — plan のレビューは 3 回・チケットは 2 回で blocking 0 件、スキル 5 枚の `read` は 1〜3 ターンで返った（従来は 21〜40 ターン）
- `squash.mjs` — テスト 15 件と実物での実演。空の `Commit:` を埋め、退避タグは 1 本を上書きする
- `consult` のバックグラウンド — すぐ `started: <id>` を返し、結果は `[consult]` 行つきのメッセージで届く。止める口は 2 面で実装は 1 つ（このサイクルの検証と調査で実際に使い、今日だけで 20 体以上を並列で走らせた）
- 子への指示の stdin 化 — `-` で始まる文書を `input` にしても子が起動して返る（実演）
- テスト環境の隔離 — `vitest.setup.ts` の 1 か所で `GIT_*` と利用者の git 設定を切る。毒を注入しても本体の状態が変わらない（実測）。今日の事故のクラスはこれで閉じた
- 5 つのスキルの観点と順序、`close` の統合が見つけた穴 2 つ（work のレビューの観点、空の `Commit:` の充填）の修正
- フォーカス・報告の形・`close` の調査フェーズ（このサイクルの後半で追加）— 穴を research の子で裏付けてから分類する形になった。推論は推論と明記させている
- 穴 5 つを、外の実例と出典で裏付けられた（git 公式 doc、CVE、OWASP、実 repo の issue）

### Bad

- 私のテストが `GIT_*` を継承して実リポジトリに書き、`core.bare`・`user.*`・テストのコミット・退避タグを本体に残した（004 と同じ族）
- 自分の判断で手順の外に出た — タグの削除、`git gc` と `reflog expire`（同意なし・不可逆）、判定を待たない `Retro` の書き換え、チケット無しの編集
- 判断を飛ばした — 穴の中 / 外の当てはめと、`Carry over` の「まだ開いているか」。穴でない物と決着済みの物が `Retro` に混ざった
- `high` / `low` を、基準ではなく場当たりで付け直した（同じ穴で 2 回変わった）。基準そのものも後から作り直した
- 頼まれていない実装で、スクリプト 2 つと `lefthook.yaml` の変更まで作った（取り消し済み）
- `consult` の子 2 体の作業がフックの拒否で消え、親がやり直した。同じ事故はサイクル 004 でも記録されていた
- 子の `pnpm typecheck` は緑でも、フックの `typecheck:staged` は赤になる。子は拒否のあと反復できない
- 計画の `What` が定義の `Then` より薄い箇所が、`close` の統合まで見つからなかった（work のレビューの 2 観点）

### Carry over

1. テストが本体にファイルを書けてしまう
   - Status: いまのテストは全部一時ディレクトリに書いているが、決まりが無いので、相対パスでリポジトリに書くテストが混ざっても何も止めない。子のコミット（`git add -A`）がそれを巻き込む
   - Research: よくある（実例 5 件）。定石は「テスト側の一時ディレクトリ fixture を使わせる」（pytest の `tmp_path` が代表）。この環境にはその形がまだ無い
   - Action: 共通の helper（`test/tmp.ts`）をテストに通す。既存テストも書き換える。レビューの観点に 1 行足す（取る段で名指しの無いファイルを取らない 1 行は済んでいる）
   - Basis: pytest `tmp_path` / pre-commit #1489 / evilmartians/lefthook #833 / SO 73128025
   - From: 007.ex-17-tests.git-isolation
2. フックが拒否すると子の作業が丸ごと消える
   - Status: 子が止まったあと、`consult` のコードが子の worktree をコミットする。拒否されると `ref` が作られず、`finally` が worktree を消すので、子の作業が丸ごと消える（原因の文は `commitWorktree` が拾っていて、親には `the commit was rejected: …` として届く）
   - Research: よくある（5 件以上、機構まで一致する実例あり）。この環境では定石なし（他では、失敗時に worktree を残す／1 回だけ rescue コミットする形がある）
   - Action: 同じ worktree で子をもう 1 回走らせる（上限 1 回。原因＝フックの出力を渡して直させる）。通れば `ref`、通らなければ worktree を残したまま原因と場所を親に返す。ツール側で保証できるのは「消さないこと」と「原因を返すこと」だけで、子が直すかは保証できない。使用量は合算して 1 回分として報告する（上限は 1 回ごとに数える）。2 回目にも同じ `AbortController` を渡す（止めれば 2 回目も止まる）。残した worktree を誰が消すかは保留。テストは「1 回目のコミットだけ落ちる pre-commit フック」を置いて、理由が 2 回目に渡る・2 回目で `ref` ができる・2 回目も駄目なら worktree が残る、の 3 つを確かめる
   - Basis: gotgenes/pi-packages#704 / claude-code #46470 / サイクル 004 のチケット（同じ事故の記録）
   - From: 007.close
3. 子がターン／トークンの上限で打ち切られる
   - Status: 大きい step では余裕が無く打ち切られる。打ち切りは本文の頭に 1 行（`consult stopped early: turn limit reached (60)`）出るが、親が判断に使う所（`details`）には来ない
   - Research: よくある（3 系統。claude-code の「completed として返る」は同じ形）。この環境の定石は部分的（OpenAI Agents SDK の `error_handlers` のような形がある）
   - Action: 上限で打ち切られたら、item 2 と同じループで、同じ worktree の続きを子にもう 1 回やらせる（上限 1 回）。それでも止まったら `stopped` を親に見える形で返す（親の操作は変わらない）
   - Basis: OpenAI Agents SDK の `error_handlers` / claude-code #73372 / サイクル 003 のチケット 07
   - From: 007.close
