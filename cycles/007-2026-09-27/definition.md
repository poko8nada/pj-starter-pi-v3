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

### Bad

### Carry over
