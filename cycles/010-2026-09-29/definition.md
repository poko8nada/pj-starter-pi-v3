# Definition

## Product

ハーネス付きスターター

### What

プロジェクトと、そのエージェント用ハーネスが一緒に立ち上がるスターター。web 関係のありとあらゆるものを作るための汎用性が高いもの。

### Who

- owner: clone する人。プロジェクトの持ち主
  - Does: 判断をする（何を作るか、何が要るか、何が要らないか）
  - Needs: エージェントが 1 人で進められること。判断は自分のところに来ること
- agent: 同じリポジトリで作業する側
  - Does: プロダクトを作る（サイクルを回す）
  - Needs: 規則、検査、基準、記録が最初から揃っていること

### Users can do

- consult: エージェントが、子を走らせ、その作業場と結果を扱える
  - .run: ロールと作業場を指して、子を 1 体走らせられる
  - .children: 走っている子を見て、止められる
  - .worktree: unit ごとの作業場を作り、一覧し、片付けられる
  - .commit: 終わったチケットを、その作業場でコミットできる
  - .roles: ロールごとのモデル・道具・上限・続きの既定を決められる
  - .report: 子の結果と最後の本文を、次の判断に要る形で受け取れる
  - .reload: reload をまたいでも、子の作業と一覧をそのまま引き継げる
  - .docs: consult の道具と契約を読める
- quality-gate: エージェントが、そのターンで変えた分の検査をその場で受け取れる
- sound-notify: owner が、pi が助けを求めていることと、commit が通ったことに気づける
  - .permission: 許可を求められたことに気づける
  - .question: 質問されたことに気づける
  - .done: ターンが終わったことに気づける
  - .commit: commit が通ったことに気づける
- commit-gate: エージェントが、変えた分の検査を通ってから、コミットも push もできる
  - .pre-commit: コミットの前に、変えた分の整形・lint・型・テストが走る
  - .pre-push: push の前に、全体の型とテストが走る
- check-suite: エージェントが、整形・lint・型・テストを 1 コマンドで回せる
  - .format: 整形できる
  - .lint: lint できる
  - .typecheck: 型を確かめられる
  - .test: テストを回せる
- agent-rules: エージェントが、毎セッション同じ規則を読む
- readme: owner が、このスターターの使い方を読める
- definition-skill: エージェントが、1 サイクル分の定義を書ける
- stack-skill: エージェントが、何で作るかを決めて書ける
- plan-skill: エージェントが、作業の順序と形を決めて書ける
- tickets-skill: エージェントが、step ごとのチケットを切れる
- work-skill: エージェントが、チケットを 1 つずつ片付けられる
- close-skill: エージェントが、サイクル全体を裁ける

## Stack

- Ground:
  - Language: TypeScript
  - Runtime: Node
  - Package manager: pnpm
  - Deploy:
- Checks:
  - Typechecker: tsc
  - Test runner: vitest
  - Linter: oxlint
  - Formatter: oxfmt
  - Git hooks: lefthook
- Agent:
  - Host: `@earendil-works/pi-coding-agent`
  - Schema: typebox
- Product:
  - (ここからプロダクトが足す)
