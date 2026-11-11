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

#### サイクルを回す

- adr-skill: オーナーが決め、エージェントが記録できる
- plan-skill: エージェントが、1 plan 分の作業の形と順序を決めて書ける
- work-skill: エージェントが、plan を 1 つずつ片付けられる
- close-skill: エージェントが、サイクル終了後に、クロージングできる
- yolo-skill: エージェントが、オーナーの確認を挟まずにクローズのトリアージまで進めることができる

#### 作ったものを検査する

- quality-gate: エージェントが、そのターンでの変更分に対し、検査結果を受け取れる
- lefthook-gate: エージェントが、検査を通した上で commit も push もできる
- format-check: エージェントが、コードの形を揃えられる
- lint-check: エージェントが、リンターの指摘を受け取れる
- type-check: エージェントが、型に対する指摘を受け取れる
- test-run: エージェントが、壊れた振る舞いの指摘を受け取れる
- japanese-check: エージェントが、日本語の語に対する指摘を受け取れる

#### 読んで知る

- definition-file: オーナーまたはエージェントが、プロダクトの全体像を 1 枚で読める
- definition-rules: エージェントが、全体像の書き方の規則を読める
- sound-notify: オーナーが、pi からの通知、commit が通ったことに気づける
- agent-rules: エージェントが、毎セッション同じ規則を読むことができる
- usage-readme: オーナーが、このスターターの使い方を読むことができる

#### 文脈を整える

- subagent-consult: エージェントが、サブエージェントのコンサルを走らせ、そのワークツリーと結果を扱える
- thinking-scrub: エージェントが、ループした thinking を取り除き、次のターンに持ち越さない
- context-precompact: エージェントが、コンパクションを待たずに、コンテキストを空けられる

#### ハーネスを保つ

- upgrade-skill: エージェントが、依存パッケージをアップグレードし、監査まで終えられる
- product-ready: オーナーが、ハーネスのテストを外した状態に切り替え、プロダクト開発を始められる
- harness-sync: オーナーが、スターターのハーネスをプロジェクトへ取り込み、プロジェクトのハーネスをスターターへ戻せる

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
