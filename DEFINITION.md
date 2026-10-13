# DEFINITION

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

- subagent-consult: エージェントが、サブエージェントのコンサルを走らせ、その作業場と結果を扱える
- quality-gate: エージェントが、そのターンでの変更分に対し、検査結果を受け取れる
- sound-notify: owner が、pi からの通知、commit が通ったことに気づける
- lefthook-gate: エージェントが、検査を通した上で commit も push もできる
- intent-router: エージェントが、owner の発言の種類に合わせて、調べ方と答え方を変えられる
- format-check: エージェントが、コードの形を揃えられる
- lint-check: エージェントが、リンターの指摘を受け取れる
- type-check: エージェントが、型に対する指摘を受け取れる
- test-run: エージェントが、壊れた振る舞いの指摘を受け取れる
- agent-rules: エージェントが、毎セッション同じ規則を読むことができる
- usage-readme: owner が、このスターターの使い方を読むことができる
- adr-skill: エージェントまたは owner が、決めるべきことを調べ、決めて記録できる
- design-skill: エージェントが、サイクルを plan に切り、どこで走らせるかを決められる
- plan-skill: エージェントが、1 plan 分の作業の形と順序を決めて書ける
- work-skill: エージェントが、plan を 1 つずつ片付けられる
- close-skill: エージェントが、サイクル終了後に、統合テストを書き、クロージングできる
- product-ready: owner が、ハーネス自身のテスト、型チェック、サイクル記録を削除、プロダクト開発を始められる

## Stack

| group  | role            | thing                             |
| ------ | --------------- | --------------------------------- |
| Ground | Language        | TypeScript                        |
| Ground | Runtime         | Node                              |
| Ground | Package manager | pnpm                              |
| Ground | Deploy          | なし                              |
| Checks | Typechecker     | tsc                               |
| Checks | Test runner     | vitest                            |
| Checks | Linter          | oxlint                            |
| Checks | Formatter       | oxfmt                             |
| Checks | Git hooks       | lefthook                          |
| Agent  | Host            | `@earendil-works/pi-coding-agent` |
| Agent  | Schema          | typebox                           |
| Agent  | Classifier      | Jev 1.13                          |
