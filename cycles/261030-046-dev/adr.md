# ADR 046

## 01: README の形式は、どの見出しをどの順に持つか

### Context

- `ROADMAP.md:19` の `006` は「readmeのフォーマット改訂」で、`status` は `wip` である。
- `rules/readme.format.md:9-21` の英語の雛形は `# <the product's name>` と 5 つの見出し `## What is in it`、`## Getting started`、`## Checks`、`## Harness`、`## Cycle` を持つ。
- `rules/readme.format.md:27-39` の日本語の雛形は、同じ 5 つを `## 入っているもの`、`## 使い始める`、`## 検査`、`## ハーネス`、`## サイクル` として持つ。
- `rules/readme.format.md:41-45` の `## Writing` は、要らない見出しは落とす、ペアは同じ見出しを同じ順で持つ、調べられることは書かない、の 3 つの規則を定める。
- `scripts/product-ready/targets.mjs:72-73` は、`README.md` を `## Skeleton` のブロックで、`README.ja.md` を `## Skeleton (ja)` のブロックで差し替える。どちらも `kind: 'whole'` である。
- `scripts/product-ready/index.mjs:115-117` は、全体の差し替えでブロックの後ろに改行を 1 つ足し、ファイルを丸ごと上書きする。
- `scripts/product-ready/index.test.ts:187`、`:189` は、`--run` の後に `README.md` が `## What is in it` を持ち、`README.ja.md` が `## 入っているもの` を持つことを固定している。
- `README.md:1`、`:7`、`:23`、`:33`、`:47`、`:56` がスターター自身の見出しで、`README.ja.md:1`、`:7`、`:23`、`:33`、`:47`、`:56` が同じ並びを日本語で持つ。
- `rules/definition.rules.md:31` は、このスターターから作るプロダクトが必ず `Stack` に `Checks` と `Agent` を持つと定める。
- `README.md:9-21` が示すとおり、ハーネスは `.pi` と `scripts/` で運ばれる。
- `consult-1` の調査では、一般の構成はタイトル、バッジ、短い説明、目次、インストール、使用方法、貢献、ライセンスであり、バッジは見出しを持たず、タイトルの直後に置く。
- したがって、バッジは見出しの外にあるが、形式の一部なので、このエントリで決める。
- スターターではハーネスがプロダクトなので、スターター自身の README は、プロダクトの見出しでハーネスを書く。
- `git tag -l` は 0 件で、`package.json:2-3` は `"private": true` で `version` を持たない。
- バッジの出所は、GitHub Actions（`origin` が `git@github.com:poko8nada/pj-starter-pi-v3.git`、ワークフローが `.github/workflows/pullfrog.yml`）と、`DEFINITION.md:46-60` の `Stack` の静的な値である。
- 各見出しの本文をどう書くかは `02` が決め、雛形に何を置くかは `03` が決める。
- `DEFINITION.md:34` の `Unit.usage-readme` と、`DEFINITION.md:42` の `Unit.product-ready` が関係する。
- 外部調査は `consult-1` が済ませており、リポジトリの外に新しく調べる問いはなく、試作も要らない。

### Scope

- 変更:
  - behaviour: out — 実行時の挙動を持たない。`product:ready` が差し込む雛形の中身は `03` が決める。
  - refactor: out — 形式のファイルの置き場所と名前を変えない。`rules/readme.format.md` のままにする。
  - dependency: out — パッケージを足さない。
  - naming: in — 見出しの名前そのものがこのエントリの対象である。今の 5 つの見出しのどれを残し、どれを落とし、何を足すかを決める。
  - format: in — 見出しの並び（順序）を決め、`## Writing` の規則をその並びに合わせる。バッジの行を、見出しを持たない行として形式に置く。
  - prose: in — `rules/readme.format.md` の説明文を、決めた見出しに合わせる。`README.md` と `README.ja.md` の本文は `02` が扱う。
- 品質:
  - speed: out — 実行時の処理を変えない。
  - security: out — 権限も入力も増えない。
  - compatibility: in — `scripts/product-ready/index.test.ts:187` と `:189` が見出しの文字列（`## What is in it`、`## 入っているもの`）を固定している。見出しを変えると、このテストが落ちる。
  - errors: out — 失敗の道を変えない。
- 運用:
  - deploy: out — `Stack` の `Deploy` は「なし」である。
  - migration: out — 既存の製品の README を新しい見出しに移さない。新しい雛形は新しいクローンから使う。
  - logs and monitoring: out — 記録は `cycles/` と git が持つ。

### Research & Trial

- `rules/readme.format.md:9-21` — 英語の雛形は、`# <the product's name>` と 5 つの見出しを持つ。
- `rules/readme.format.md:27-39` — 日本語の雛形は、同じ 5 つを日本語で持つ。
- `rules/readme.format.md:41-45` — `## Writing` の 3 つの規則がある。
- `scripts/product-ready/targets.mjs:72-73` — `README.md` は `## Skeleton`、`README.ja.md` は `## Skeleton (ja)` で、どちらも `kind: 'whole'` である。
- `scripts/product-ready/index.mjs:115-117` — 全体の差し替えは、ブロックと改行でファイルを上書きする。
- `scripts/product-ready/index.test.ts:187`、`:189` — `## What is in it` と `## 入っているもの` を固定している。
- `README.md:1`、`:7`、`:23`、`:33`、`:47`、`:56` — スターター自身のタイトルと 5 つの見出しである。
- `README.ja.md:1`、`:7`、`:23`、`:33`、`:47`、`:56` — 同じ並びを日本語で持つ。
- `rules/definition.rules.md:31` — このスターターから作るプロダクトは、必ず `Stack` に `Checks` と `Agent` を持つ。
- `README.md:9-21` — ハーネスは `.pi` と `scripts/` で運ばれる。
- `consult-1` — 一般の構成はタイトル、バッジ、短い説明、目次、インストール、使用方法、貢献、ライセンスである。
- `consult-1` — バッジは見出しを持たず、タイトルの直後に置く。
- `consult-1` — 見出しが 100 行を超えると目次が要る。
- `consult-1` — 固有事項は `Extra Sections` という名称を使わず、独自のタイトルを付ける。
- `git tag -l` — タグは 0 件である。
- `package.json:2-3` — `"private": true` で、`version` を持たない。
- `git remote -v` — `origin` は `git@github.com:poko8nada/pj-starter-pi-v3.git` である。
- `.github/workflows/pullfrog.yml:4-12`、`:28-31` — dispatch でエージェントを走らせるワークフローがある。
- `DEFINITION.md:46-60` — `Stack` の静的な値がある。
- `DEFINITION.md:34`、`:42` — `Unit.usage-readme` と `Unit.product-ready` が関係する。
- リポジトリの外に新しく調べる問いはなく、試作も要らない。

### Decision

- Status: **accepted**
- Adopted:
  - 案 B: 見出しをプロダクトの構成に置き換える形で、スターター自身の README は、その見出しでハーネスをプロダクトとして書く。
  - 英語の雛形は 8 行とし、`# <the product's name>`、`<badges>`、`<what it is, in one sentence>`、`## What is in it`、`## Getting started`、`## <the product's own sections>`、`## Contributing`、`## License` とする。
  - 日本語の雛形も同じ 8 行とし、`# <プロダクトの名前>`、`<バッジ>`、`<何であるか、何をするか。1 文>`、`## 入っているもの`、`## 使い始める`、`## <プロダクト固有のセクション>`、`## コントリビュート`、`## ライセンス` とする。
  - 埋める場所の `<...>` は、それぞれの言語で書く。
  - `## Usage` は独立させず、`## Getting started` がインストールと最小の使用方法を兼ねる。
  - `## <the product's own sections>`（日本語では `## <プロダクト固有のセクション>`）は Extra Sections であり、各プロダクトが独自のタイトルを付け、スターターでは `## Checks`、`## Harness`、`## Cycle` がここに入る。
  - バッジは `# <the product's name>` の直後、見出しを持たない行に置く。
  - `## Writing` に「バッジは関連するものだけに絞り、出所のある値だけを置く」を足す。
- Options:
  - 案 A: 今の 5 見出しを残し、プロダクトの見出しを足す。採らなかった理由: ハーネスの見出しを形式に残すと、ハーネスを削ったプロダクトの雛形にも `Harness` と `Cycle` が現れ、要らない見出しを消す判断をクローンした人に負わせる。
  - 案 C: プロダクトの見出しを前半に、ハーネスの見出しを後半に置く。採らなかった理由: 見出しが 8 つを超え、`## Checks` がプロダクトの検査かハーネスの検査か曖昧になる。100 行を超えると目次が要る。
  - 案 D: `README.md` とハーネスの説明を別ファイルに分ける。採らなかった理由: スコープの `refactor: out` と `format: in` の範囲を超えてファイルを増やし、スターターではハーネスがプロダクトなので、プロダクトの説明が 2 枚に割れる。

### Definition

- `Unit.usage-readme`(kept): 行は「owner が、このスターターの使い方を読むことができる」で、主たる機能は変わらない。見出しの並びと、バッジの行が変わる。
- `Unit.product-ready`(kept): 行は「owner が、ハーネスのテストを外した状態に切り替え、プロダクト開発を始められる」で、主たる機能は変わらない。差し込む README の見出しの並びが変わる。

## 02: スターター自身の `README.md` と `README.ja.md` を、その形式でどう埋めるか

### Context

- `ROADMAP.md:19` の `006` は「readmeのフォーマット改訂」で、`status` は `wip` である。
- 形式はエントリ `01` が決めたもので、見出しは `## What is in it`、`## Getting started`、`## <プロダクト固有のセクション>`、`## Contributing`、`## License` とし、タイトルの直後にバッジの行を置く。
- `README.md:1`、`:3`、`:5`、`:7-21`、`:23-31`、`:33-45`、`:47-54`、`:56-70` が今の本文で、`README.ja.md` の同じ行が同じ並びを日本語で持つ。
- `README.md:9-21` の部品の列は、`.pi/skills/` の 7 ディレクトリ、`.pi/extensions/` の 5 ディレクトリ、`lefthook.yaml:1-32`、`scripts/harness/harness.json:2-20`、`.github/workflows/pullfrog.yml:4-31` と一致する。
- `README.md:19` の置き場は `.pi/extensions/consult/run/worktree.ts:7-8` と一致する。
- `README.md:44` の修正ステージと検証ステージは `.pi/extensions/quality-gate/checks.ts:31-56` と一致する。
- `README.md:45` のテスト設定の分け方は `vitest.starter.config.ts:3`、`vitest.config.ts:30-41`、`package.json:10-12` と一致する。
- `README.md:69` の記録の置き場は `.pi/skills/adr/scripts/scaffold.mjs:166-168` と一致する。
- `README.md:61-67` の各ステージの説明は、`.pi/skills/*/SKILL.md:3` の `description` と一致しない。
- `adr`、`design`、`plan`、`work`、`close` の行は、`description` に無い「校正」または「レビュー」を書き、`yolo` の行は「close のトリアージで止まる」を書かない。
- `README.md:5` の言語のリンクの行は、短い説明の次の行にある。
- リポジトリに `LICENSE`、`CONTRIBUTING.md`、`.github/CONTRIBUTING.md` は無く、`.github/` には `workflows/pullfrog.yml` だけがある。
- `package.json:2-3` は `name` が `project-starter` で、`"private": true` であり、`license`、`engines`、`packageManager`、`version` を持たない。
- `package.json:29` は `typescript` に `^7.0.2` を置く。
- `git tag -l` は 0 件である。
- `git remote -v` の `origin` は `git@github.com:poko8nada/pj-starter-pi-v3.git` である。
- `lefthook.yaml:1-23` は commit の 4 つの検査を持ち、`:25-32` は push の 2 つの検査を持つ。
- `consult-1` は、バッジを関連するものだけに絞ることと、未ライセンスは `UNLICENSED` と書いて本文を置かずにライセンスのファイルへリンクすることを定める。
- スターターではハーネスがプロダクトなので、`## Checks`、`## Harness`、`## Cycle` は、このスターター自身のセクションである。
- `DEFINITION.md:24-44` が `Users can do` の 21 の Unit を持つ。
- リポジトリの外に新しく調べる問いはなく、試作も要らない。

### Scope

- 変更:
  - behaviour: out — 実行時の挙動を持たない。
  - refactor: out — ファイルを増やさない。`README.md` と `README.ja.md` の 2 枚のままとし、`LICENSE` と `CONTRIBUTING.md` は作らない。
  - dependency: out — パッケージを足さない。
  - naming: in — 見出しの名前は `01` が決める。このエントリは、01 の見出しの下に何を書くかを決め、今の `## Checks`、`## Harness`、`## Cycle` を残すか書き直すかを決める。
  - format: in — 2 枚を 01 の並びにし、バッジの行と言語のリンクの行の位置を決める。
  - prose: in — 各見出しの本文を書く。今の本文のどれを残し、どれを書き直し、どれを落とすかを決める。
  - values: in — バッジに出す値を決める。
- 品質:
  - speed: out — 実行時の処理を変えない。
  - security: out — 権限も入力も増えない。
  - compatibility: in — `scripts/product-ready/index.test.ts:187`、`:189` が `## What is in it` と `## 入っているもの` を固定している。この 2 つは 01 の並びでも残るので、テストは落ちない。
  - errors: out — 失敗の道を変えない。
- 運用:
  - deploy: out — `Stack` の `Deploy` は「なし」である。
  - migration: out — 既存のクローンの README を移さない。
  - logs and monitoring: out — 記録は `cycles/` と git が持つ。

### Research & Trial

- `README.md:9-21`、`.pi/skills/` の 7 ディレクトリ、`.pi/extensions/` の 5 ディレクトリ、`lefthook.yaml:1-32`、`scripts/harness/harness.json:2-20`、`.github/workflows/pullfrog.yml:4-31` — 部品の列は一致する。
- `.pi/extensions/consult/run/worktree.ts:7-8` — 置き場は `/tmp/pi-consult/<project>-<YYYYMMDD-HHMM>/<unit>/wt` で、ブランチは `consult/<unit>`、base の既定は `HEAD` である。`README.md:19` と一致する。
- `.pi/extensions/quality-gate/checks.ts:31-56` — 修正ステージは `lint:fix` と `format` で、検証ステージは `lint` と `typecheck:staged` である。`README.md:44` と一致する。
- `vitest.starter.config.ts:3`、`vitest.config.ts:30-41`、`package.json:10-12` — starter config は `testConfig(true)`、product config は `testConfig(false)` で `harnessExcludes` を `exclude` に入れる。`README.md:45` と一致する。
- `.pi/skills/adr/scripts/scaffold.mjs:166-168` — `cycleDirName` は `<YYMMDD>-<NNN>-<slug>` を作る。`README.md:69` と一致する。
- `.pi/skills/adr/SKILL.md:3`、`close/SKILL.md:3`、`design/SKILL.md:3`、`plan/SKILL.md:3`、`work/SKILL.md:3`、`yolo/SKILL.md:3`、`upgrade/SKILL.md:3` — `description` の文面。`README.md:61-67` と一致しない。
- `README.md:58` — 「the next stage is called by that skill's `description`」と書く。
- `lefthook.yaml:1-23`、`:25-32` — commit の 4 つの検査と、push の 2 つの検査。
- `package.json:2-3`、`:29` — `"private": true` で、`license`、`engines`、`packageManager`、`version` を持たない。`typescript` は `^7.0.2` である。
- `git tag -l` — タグは 0 件である。
- `git remote -v` — `origin` は `git@github.com:poko8nada/pj-starter-pi-v3.git` である。
- `ls .github` — `workflows/pullfrog.yml` だけである。ルートに `LICENSE` も `CONTRIBUTING.md` も無い。
- `consult-1` — バッジは関連するものだけに絞る。未ライセンスは `UNLICENSED` と書き、本文を置かずにライセンスのファイルへリンクする。
- `DEFINITION.md:24-44` — `Users can do` の 21 の Unit。
- リポジトリの外に新しく調べる問いはなく、試作も要らない。

### Decision

- Status: **accepted**
- Adopted:
  - 案 B: 5 つのセクションの本文を、ハーネスをプロダクトとして書き直す。
  - `## What is in it` は、このスターターが提供するものの列にする。検査、ゲート、エージェントの規則、サイクルの仕組み、パッケージ、拡張、CI、サイクルの記録である。
  - `## Getting started` は、インストールと、そこから最初に動かすところまでを書く。
  - `## Checks`、`## Harness`、`## Cycle` は、このスターター自身のセクションとして `## <プロダクト固有のセクション>` の位置に置く。
  - `## Cycle` の各ステージの説明は、`.pi/skills/*/SKILL.md:3` の `description` に合わせる。
  - バッジは GitHub Actions の状態と、TypeScript のバージョンの 2 つにする。
  - バッジは `# <the product's name>` の直後に置く。
  - 言語のリンクの行は、今のとおり短い説明の次の行に置く。
  - `## Contributing` は、commit と push で `lefthook` が検査を走らせることと、commit の前に `pnpm lint`、`pnpm typecheck`、`pnpm test:run` を通すことを書く。
  - PR を受け付けるかどうかは、記録が無いので README に書かない。
  - `## License` は `UNLICENSED` の 1 語だけを置く。
- Options:
  - 案 A: 本文は今のまま残し、`## Cycle` の各ステージの行だけを `description` に合わせて書き直す。採らなかった理由: `## What is in it` がハーネスの部品一覧のままで、プロダクトの特徴として読むには語りが足りず、オーナーの「ハーネスをプロダクトとして書く」に対して語りがハーネスの説明のままになる。
  - 案 C: 案 B と同じく書き直すが、`## Cycle` の各ステージの説明を README に置かず、`description` を指す 1 行にする。採らなかった理由: `README.md:58` が「次のステージは `description` で見つかる」と書くので、README だけを読む人には各ステージの写しが要る。

### Definition

- `Unit.usage-readme`(kept): 行は「owner が、このスターターの使い方を読むことができる」で、主たる機能は変わらない。本文の語りと、見出しの並びが変わる。
- `Unit.product-ready`(kept): 行は「owner が、ハーネスのテストを外した状態に切り替え、プロダクト開発を始められる」で、主たる機能は変わらない。`## Getting started` の本文が変わる。
- `Unit.harness-copy`(kept): 行は「owner が、スターターのハーネスをプロジェクトへ取り込み、プロジェクトのハーネスをスターターへ戻せる」で、主たる機能は変わらない。`## Harness` の本文が変わる。
- `Unit.lefthook-gate`(kept): 行は「エージェントが、検査を通した上で commit も push もできる」で、主たる機能は変わらない。`## Checks` と `## Contributing` が、commit と push の検査を書く。
- `Unit.quality-gate`(kept): 行は「エージェントが、そのターンでの変更分に対し、検査結果を受け取れる」で、主たる機能は変わらない。`## Checks` が、ターンごとの検査を書く。
- `Unit.format-check`(kept): 行は「エージェントが、コードの形を揃えられる」で、主たる機能は変わらない。`## What is in it` と `## Checks` が名指すが、行は動かない。
- `Unit.lint-check`(kept): 行は「エージェントが、リンターの指摘を受け取れる」で、主たる機能は変わらない。`## What is in it` と `## Checks` が名指すが、行は動かない。
- `Unit.type-check`(kept): 行は「エージェントが、型に対する指摘を受け取れる」で、主たる機能は変わらない。`## What is in it` と `## Checks` が名指すが、行は動かない。
- `Unit.test-run`(kept): 行は「エージェントが、壊れた振る舞いの指摘を受け取れる」で、主たる機能は変わらない。`## What is in it` と `## Checks` が名指すが、行は動かない。
- `Unit.agent-rules`(kept): 行は「エージェントが、毎セッション同じ規則を読むことができる」で、主たる機能は変わらない。`## What is in it` が名指すが、行は動かない。
- `Unit.subagent-consult`(kept): 行は「エージェントが、サブエージェントのコンサルを走らせ、その作業場と結果を扱える」で、主たる機能は変わらない。`## What is in it` が名指すが、行は動かない。
- `Unit.sound-notify`(kept): 行は「owner が、pi からの通知、commit が通ったことに気づける」で、主たる機能は変わらない。`## What is in it` が名指すが、行は動かない。
- `Unit.thinking-scrub`(kept): 行は「エージェントが、ループした thinking を取り除き、次のターンに持ち越さない」で、主たる機能は変わらない。`## What is in it` が名指すが、行は動かない。
- `Unit.context-precompact`(kept): 行は「エージェントが、コンパクションを待たずに、コンテキストを空けられる」で、主たる機能は変わらない。`## What is in it` が名指すが、行は動かない。
- `Unit.adr-skill`(kept): 行は「owner が決め、エージェントが記録できる」で、主たる機能は変わらない。`## Cycle` が名指すが、行は動かない。
- `Unit.design-skill`(kept): 行は「エージェントが、サイクルを plan に切る材料を調べ、切り方を決め、どこで走らせるかを提案できる（owner が決める）」で、主たる機能は変わらない。`## Cycle` が名指すが、行は動かない。
- `Unit.plan-skill`(kept): 行は「エージェントが、1 plan 分の作業の形と順序を決めて書ける」で、主たる機能は変わらない。`## Cycle` が名指すが、行は動かない。
- `Unit.work-skill`(kept): 行は「エージェントが、plan を 1 つずつ片付けられる」で、主たる機能は変わらない。`## Cycle` が名指すが、行は動かない。
- `Unit.close-skill`(kept): 行は「エージェントが、サイクル終了後に、クロージングできる」で、主たる機能は変わらない。`## Cycle` が名指すが、行は動かない。
- `Unit.yolo-skill`(kept): 行は「エージェントが、オーナーの確認を挟まずにクローズのトリアージまで進めることができる」で、主たる機能は変わらない。`## Cycle` が名指すが、行は動かない。
- `Unit.upgrade-skill`(kept): 行は「エージェントが、依存パッケージをアップグレードし、監査まで終えられる」で、主たる機能は変わらない。`## What is in it` が名指すが、行は動かない。
- `Unit.definition-file`(kept): 行は「owner またはエージェントが、プロダクトの絵を 1 枚で読める」で、主たる機能は変わらない。README は名指さない。
- `Unit.definition-rules`(kept): 行は「エージェントが、絵の書き方の規則を読める」で、主たる機能は変わらない。README は名指さない。

## 03: `product:ready` が差し込む雛形は、その形式で何を置くか

### Context

- `ROADMAP.md:19` の `006` は「readmeのフォーマット改訂」で、`status` は `wip` である。
- 形式は `01` が決め、スターター自身の README の埋め方は `02` が決めた。
- `rules/readme.format.md:5-21` に `## Skeleton` があり、`:7` の説明文の後に英語のブロックが `:9-21` にある。
- 今の英語のブロックは `# <the product's name>` と 5 つの見出しだけで、バッジの行も、短い説明の行も、言語のリンクの行も持たない。
- `rules/readme.format.md:23-39` に `## Skeleton (ja)` があり、`:25` の説明文の後に日本語のブロックが `:27-39` にある。
- 今の日本語のブロックも、`# <プロダクトの名前>` と 5 つの見出しだけである。
- `scripts/product-ready/targets.mjs:72-73` は、`README.md` に `## Skeleton` を、`README.ja.md` に `## Skeleton (ja)` を結び付ける。どちらも `kind: 'whole'` である。
- `scripts/product-ready/index.mjs:19-42` の `blockUnder` は、見出しを前後の空白を除いた完全一致で探し、その後ろの最初のフェンスから、同じ記号の連なりと完全に一致する行までを返す。
- `scripts/product-ready/index.mjs:112-114` は、雛形のファイルが無い、または見出しの下にブロックが無ければ投げる。
- `scripts/product-ready/index.mjs:115-117` は、ブロックに改行を 1 つ足した文字列で、ファイルを丸ごと上書きする。
- `scripts/product-ready/index.test.ts:86-87` は、実物の `rules/` から 3 つの規則のファイルを写す。
- `scripts/product-ready/index.test.ts:187`、`:189` は、差し替えた後に `## What is in it` と `## 入っているもの` があることを固定する。
- `scripts/product-ready/index.test.ts:191` は、`README.ja.md` が `## What is in it` を持たないことを固定する。
- `rules/definition.format.md:9-11` は、先例として「ブロックはプロダクトが始まる状態である。プロダクト自身の欄は空で、スターターの欄はすでに埋まっている」と定める。
- `rules/roadmap.md:28-30` は、先例として「`<...>` の行は埋める場所である」と定める。
- `README.md:5` と `README.ja.md:5` が言語のリンクの行で、今の雛形はそれを持たない。
- `DEFINITION.md:34` の `Unit.usage-readme` と、`:42` の `Unit.product-ready` が関係する。
- リポジトリの外に新しく調べる問いはなく、試作も要らない。

### Scope

- 変更:
  - behaviour: out — `product:ready` の処理を変えない。差し込む中身だけが変わる。
  - refactor: out — ファイルを増やさない。`## Skeleton` と `## Skeleton (ja)` の 2 つのブロックのままとし、`targets.mjs:72-73` の対応も変えない。
  - dependency: out — パッケージを足さない。
  - naming: out — 見出しの名前は `01` が決める。
  - format: in — 2 つのブロックの行をエントリ `01` の並びに合わせ、どの行を `<...>` の場所にし、どの行を見出しとして残すかを決める。
  - prose: in — ブロックの前の説明文（`:7`、`:25`）を、新しいブロックに合わせる。
  - values: out — 値はない。
- 品質:
  - speed: out — 実行時の処理を変えない。
  - security: out — 権限も入力も増えない。
  - compatibility: in — `scripts/product-ready/index.test.ts:86-87` が実物の `rules/readme.format.md` を写し、`:187`、`:189` が `## What is in it` と `## 入っているもの` を固定している。この 2 つの見出しはエントリ `01` の並びでも残る。
  - errors: in — `blockUnder`（`index.mjs:19-42`）は、見出しの後ろの最初のフェンス付きブロックを、同じ記号の閉じの行まで返す。ブロックの中に同じ記号のフェンスを置くと、そこで切れる。
- 運用:
  - deploy: out — `Stack` の `Deploy` は「なし」である。
  - migration: out — 既存のクローンの README を、新しい雛形で上書きしない。
  - logs and monitoring: out — 記録は `cycles/` と git が持つ。

### Research & Trial

- `index.mjs:21` — 見出しは `line.trim() === heading` の完全一致で探す。`## Skeleton` と `## Skeleton (ja)` は別の見出しとして当たる。
- `index.mjs:9`、`:31` — `FENCE` は `^(`{3,}|~{3,})`で、記号の連なり全体を`mark` にする。
- `index.mjs:37` — ブロックは、前後の空白を除いた行が `mark` と完全に一致した行で閉じる。
- `index.mjs:112-114` — 見出しが無ければ `null` を返し、`jobsFor` が投げる。
- `index.mjs:115-117` — `kind: 'whole'` は、ブロックに改行を 1 つ足した文字列でファイルを丸ごと上書きする。
- `targets.mjs:72-73` — `README.md` は `## Skeleton`、`README.ja.md` は `## Skeleton (ja)` に結び付く。
- `index.test.ts:86-87` — テストは実物の `rules/` から 3 つの規則のファイルを写す。
- `index.test.ts:187`、`:189`、`:191` — 差し替えた後の見出しを固定する。
- `rules/readme.format.md:9-21`、`:27-39` — 今の 2 つのブロックはフェンスを持たない。
- `rules/definition.format.md:9-11` — ブロックはプロダクトが始まる状態である。
- `rules/roadmap.md:28-30` — `<...>` の行は埋める場所である。
- 限界は 5 つである。ブロックの中に同じ記号で同じ長さのフェンスを置くと、そこで切れる。ブロックの外は捨てられる。見出しは完全一致で探す。同じ見出しが 2 つあると先の 1 つを使う。ブロックが無ければ投げる。
- エントリ `01` の雛形の行はフェンスを含まないので、この限界には当たらない。
- リポジトリの外に新しく調べる問いはなく、試作も要らない。

### Decision

- Status: **accepted**
- Adopted:
  - 案 A: 英語と日本語のブロックを、`01` の 8 行のままにする。
  - 英語のブロックは `# <the product's name>`、`<badges>`、`<what it is, in one sentence>`、`## What is in it`、`## Getting started`、`## <the product's own sections>`、`## Contributing`、`## License` とする。
  - 日本語のブロックは `# <プロダクトの名前>`、`<バッジ>`、`<何であるか、何をするか。1 文>`、`## 入っているもの`、`## 使い始める`、`## <プロダクト固有のセクション>`、`## コントリビュート`、`## ライセンス` とする。
  - 埋める場所の `<...>` は、それぞれの言語で書く。
  - 言語のリンクの行は、雛形に置かない。
  - ブロックの中にフェンスを置かない。`blockUnder` が同じ記号の閉じの行で切れるためである。
  - ブロックの前の説明文（`:7`、`:25`）は、`<...>` が埋める場所であることと、それぞれの言語で書くことをそのまま保つ。
- Options:
  - 案 B: `## <the product's own sections>` を外した 7 行。採らなかった理由: 形式と雛形が 1 行だけ違い、`## Writing` の「ペアは同じ見出しを同じ順で持つ」と、形式の並びの説明が合わなくなる。
  - 案 C: 8 行に言語のリンクの行を足した 9 行。採らなかった理由: オーナーが案 A を採った。雛形だけを 9 行にすると、形式と雛形が食い違う。

### Definition

- `Unit.usage-readme`(kept): 行は「owner が、このスターターの使い方を読むことができる」で、主たる機能は変わらない。形式のファイルの雛形の行が変わる。
- `Unit.product-ready`(kept): 行は「owner が、ハーネスのテストを外した状態に切り替え、プロダクト開発を始められる」で、主たる機能は変わらない。差し込む README の行が変わる。
