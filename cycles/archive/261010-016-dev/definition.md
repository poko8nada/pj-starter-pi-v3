# Definition 016

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

- consult: エージェントが、子を走らせ、その作業場と結果を扱える **update** (ADR 01-1, 01-2, 01-3)
  - .run: ロールと作業場を指して、子を 1 体走らせられる。報告を書いた後に終わらない子は、検出して止められる
  - .children: 走っている子を見て、止められる **update** (ADR 01-1, 01-2, 01-4)
  - .worktree: unit ごとの作業場を作り、一覧し、片付けられる **update** (ADR 01-2)
  - .commit: 終わった plan を、その作業場でコミットできる
  - .roles: ロールごとのモデル・道具・許可（書ける所・打てるコマンド）・上限・続きの既定を決められる
  - .report: 子の結果と最後の本文を、次の判断に要る形で受け取れる **update** (ADR 01-1)
  - .reload: reload をまたいでも、子の作業と一覧をそのまま引き継げる **update** (ADR 01-1)
  - .docs: consult の道具と契約を読める **update** (ADR 01-1, 01-2)
- quality-gate: エージェントが、そのターンで変えた分の検査をその場で受け取れる
- sound-notify: owner が、pi が助けを求めていることと、commit が通ったことに気づける
  - .permission: 許可を求められたことに気づける
  - .question: 質問されたことに気づける
  - .done: ターンが終わったことに気づける
  - .commit: commit が通ったことに気づける
  - .compact: コンテキストの圧縮が終わったことに気づける
- second-opinion: エージェントと owner が、いまの会話について別の目を得られる
  - .opinion: 直近の会話を材料に、一貫性・穴・別案の判定を、同期で受け取れる。reload をまたいでも材料にでき、待っている間の様子が見え、途中で打ち切られても最後の本文が返る
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
- product-ready: owner が、ハーネス自身の物（テストとサイクル記録）を外して、プロダクト開発を始められる
  - .tests: 名指しした場所（`.pi/`、`scripts/product-ready/`、`test/env.test.ts`）のテストを外せる。開始時にテストがゼロになる。テストとスクリプトの足場（`test/`、`lib/git-env.mjs`）は残る
  - .cycles: サイクルのフォルダを消せる
  - .report: 消える物を先に見られる（引数なしは表示だけ、`--run` で実行）
- adr-skill: エージェントが、決めるべきことを調べ、決めて記録できる
- definition-skill: エージェントが、1 サイクル分の定義を書ける **update** (ADR 02-1)
  - .scaffold: サイクルのフォルダを、日付・番号・ブランチの rule どおりの名前に作り、定義の草案を素起こしできる **update** (ADR 02-1)
- design-skill: エージェントが、サイクルを plan に切り、どこで走らせるかを決められる
- plan-skill: エージェントが、1 plan 分の作業の形と順序を決めて書ける
- work-skill: エージェントが、plan を 1 つずつ片付けられる
- close-skill: エージェントが、サイクルを裁き、統合テストを書いて閉じられる
  - .collect: サイクルの残り物を、機械的に一覧にできる
- intent-router: エージェントが、owner の発言の種類に合わせて、調べ方と答え方を変えられる
  - .route: 発言を question / design / verify / permission / chat / unknown に分けられる
  - .guide: 質問・設計・確認の発言には、編集せず調べるように促せる
  - .judge: 調査の途中で「もう答えられるか」を3段階で判定し、足りていれば調査を止めさせられる
  - .onoff: `/intent on|off` で、そのセッションだけ切り替えられる
  - .log: owner が、いつ何を判定し、何を差し込んだかを読める

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
  - Classifier: Jev 1.13
- Product:
