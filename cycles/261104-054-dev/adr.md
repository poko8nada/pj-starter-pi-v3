# ADR 054

## 01: スターターの README をどの見出しで何を書く形にするか

### Context

- スターターの `README.md` と `README.ja.md` では、サイクルの説明をコードフェンスで囲んでおり、`## Checks`、`## Harness`、`## Cycle`、`## Contributing` の内容が重複している。
- `## What is in it` は1つの箇条書きに詰め込まれているうえ、粒度がそろわず、`## Checks` と重複しており、`scripts/product-ready/` や `scripts/checks/` の説明が抜けている。
- `pnpm product:ready` は README を `rules/readme.format.md` のテンプレートで置き換えるため、置き換え後の `## What is in it` にはスターターの内容が残らない。
- バッジは、Node と pnpm の値に出所がなく、プルフロッグのバッジが手動実行のみのワークフローを指している。
- オーナーは、`## What is in it` を5つの見出しで構成し、`product:ready` のあとは `### Product` と `### Default` にすると決めた。

### Scope

- 変更:
  - format: in — `## What is in it` を `### Roadmap & Cycle`、`### Agent`、`### Checks`、`### Handover`、`### CI` の5つで構成し、各見出しの直後にファイルの一覧に先立つ説明文を1つ置いて一覧の項目ごとに説明を持たせ、サイクルの説明のコードフェンスとトップレベルの `## Checks`、`## Harness`、`## Cycle`、`## Contributing` を廃止して5つの見出しに集める。
  - prose: in — 見出しの直後の一覧と説明文、題名、言語リンク、`## Getting started` を書き直し、題名の下の説明の文は現行を継承し、粒度をそろえ、重複と抜けを解消する。
  - naming: in — 見出しの名前を `Roadmap & Cycle`、`Agent`、`Checks`、`Handover`、`CI` にそろえ、日本語の README でも同じ名前を使う。
  - dependency: in — バッジを TypeScript、Node 24、pnpm、pi の4つにしてプルフロッグのバッジを外し、値の出所を示すため `package.json` に `engines: ">=24"` と `packageManager: "pnpm@12.15.0"` を書く。
  - behaviour: in — `engines` と `packageManager` の追加により、pnpm のインストール時の判定が変わる。
  - compatibility: in — 本エントリーでは、Node 24 未満ではインストールが停止し、宣言と異なる pnpm は宣言したバージョンに切り替わることを許容範囲とする。
  - refactor: out — テンプレートと生成の仕組みは変えない（理由: `rules/readme.format.md` と `scripts/product-ready` による生成はエントリー 02 が扱う）。
- 品質:
  - security: in — バッジの参照先を4つに限り、値を `package.json` から取得する。
  - errors: in — 相対リンク先が実在することを確認し、`ja-check` の禁止語を使わずに書く。
  - speed: out — 速度は扱わない（理由: 読むだけの文書だからである）。
- 運用:
  - deploy: out — 配布の準備はしない（理由: 配布物ではないからである）。
  - migration: out — 移行は扱わない（理由: クローン済みのプロダクトの README は `product:ready` で置き換え済みだからである）。
  - logs and monitoring: out — ログと監視は設けない（理由: 該当するものがないからである）。

### Research & Trial

- 2020年代の README で定番の項目は、タイトル、短い説明、導入、使い方、貢献方法、ライセンス、関連文書へのリンクである（standard-readme の仕様、Make a README、GitHub の公式説明、Google の文書、Write the Docs）。
- README の任意の項目は、バッジ、ビジュアル、背景、API リファレンス、メンテナー、謝辞、サポート、ロードマップ、FAQ、機能一覧、要件、目次、プロジェクト状態である（前項と同じ出所）。
- 変更履歴、行動規範の全文、脆弱性報告の詳細、引用の詳細、長い仕様は、別のファイルに分けることが主流になっている（Keep a Changelog、Contributor Covenant、GitHub の `SECURITY.md` と `CITATION.cff` の説明）。
- standard-readme は100行を超える README に目次を求めており、Make a README は README が長すぎる場合には別の文書に分けたうえで情報を削らないことを求めている。
- GitHub が既定で出せるバッジはワークフロー状態だけであり、npm のバッジは公開パッケージでないと出せない（GitHub の公式説明）。
- `.github/workflows/pullfrog.yml` は手動実行のみであり、ワークフローの実行がなければ状態を示すバッジが付かない（`.github/workflows/pullfrog.yml:4-12`）。
- `package.json` に `version` の欄がないため、同ファイルから値を取得するバッジは出せない（`package.json:1-37`）。
- リポジトリ直下に `LICENSE` のファイルがない。
- shields.io の静的なバッジは値を URL に直接書くため、値の出所は `package.json` などに別途必要である（shields.io の説明）。
- Node のバージョンを記録する場所は、`engines`、`.nvmrc`、`.node-version`、CI の `node-version` のいずれにもなく、このリポジトリで pnpm が判定に使うのは `package.json` の `engines` だけである（pnpm はプロジェクトの `engines` の不適合の場合にインストールを停止する）。
- `package.json` の `packageManager` に記載したバージョンと異なる pnpm で実行すると、pnpm は宣言したバージョンに切り替わる（既定は `download` であり、pnpm の `package.json` の説明と `pmOnFail` の説明による）。
- 手元の pnpm のバージョンは 12.15.0 である。
- `pnpm product:ready` が削除するのは `cycles/` 配下のディレクトリ（`scripts/product-ready/targets.mjs:25`、`:113-129`）と、`vitest.starter.config.ts` と `test` 系スクリプトにおける ` --config vitest.starter.config.ts` である（`scripts/product-ready/index.mjs:7-9`、`:175-177`）。
- `cycles/` の直下のファイルは削除されない（`scripts/product-ready/targets.test.ts:22-28`）。
- 現在の README と `rules/readme.format.md` は `## Contributing` を含み、`product:ready` では README の全体をテンプレートで置き換える（`rules/readme.format.md:9-25`、`scripts/product-ready/targets.mjs:72-73`）。
- `ROADMAP.md` の `1.0.0` には `003`、`002`、`001` の3項目があり、`002` は「github workflowの整備」で `### 1.0.0 002` の説明を持つ（`ROADMAP.md:8-10`、`:12-20`）。

### Decision

- Status: **accepted**
- Adopted:
  - `## What is in it` は `### Roadmap & Cycle`、`### Agent`、`### Checks`、`### Handover`、`### CI` の5つの見出しで構成する。
  - 各見出しの直後に、ファイルの一覧に先立つ説明文を1つ置き、一覧の各項目は `- <パス>: <説明>` の形で説明を持ち、文書の項目はリンクにする。
  - 説明文は、一覧を読まなくても意味が通る1文とし、指示語や一覧に並ぶ名前を含めない。
  - 説明文は、置かれた場所に依存せず、スターターでもプロダクトでも同じ意味になるように書く。
  - `### CI` の説明文は、英語の README と日本語の README のどちらも `_Under construction_` にする。
  - `product:ready` のあとの `## What is in it` は `### Product` と `### Default` となり、`### Default` には各見出しの説明文を並べた箇条書きを置く。
  - トップレベルの `## Contributing`、`## Checks`、`## Harness`、`## Cycle` は外し、その内容は5つの見出しの一覧の項目の説明に集める（コマンドの走らせ方、`harness.json` の鍵、`product:ready` の削除対象は残さない）。
  - バッジは TypeScript、Node 24、pnpm、pi の4つとし、`Stack` の `Ground` の順（Language、Runtime、Package manager）に `Agent` の `Host` を続け、プルフロッグのバッジを外す。
  - 値の出所は、TypeScript が `devDependencies`、Node が `engines: ">=24"`、pnpm が `packageManager: "pnpm@12.15.0"`、pi が `devDependencies` の `@earendil-works/pi-coding-agent` である。
  - `### Roadmap & Cycle` の一覧は `DEFINITION.md`、`ROADMAP.md`、`rules`（`rules/*`）とし、`rules` はファイルごとではなく1つの説明にする。
  - `### Agent` の一覧は `AGENTS.md`、`skills`（`adr`、`plan`、`work`、`close`、`yolo`、`upgrade`）、`extensions`（`consult`、`quality-gate`、`context-precompact`、`thinking-scrub`、`sound-notify`）とし、`skills` と `extensions` は入れ子にして項目ごとに説明を置き、説明文にはハーネスが `pi` であることを含める。
  - `### Checks` の一覧は `lint`（`oxlint`）、`format`（`oxfmt`）、`typecheck`（`scripts/checks/typecheck.mjs`、`scripts/checks/typecheck-staged.mjs`）、`test`（`vitest.config.ts`、`vitest.starter.config.ts`）、`japanese-check`（`scripts/checks/ja-check.mjs`）、`localhook`（`lefthook` の pre-commit と pre-push）とし、`typecheck`、`test`、`localhook` は入れ子にして項目ごとに説明を置く。
  - `### Handover` の一覧は `harness-sync`（`scripts/harness/*`）と `product-ready`（`scripts/product-ready/*`）とし、項目ごとに説明を置く。
  - `## Getting started` の冒頭に前提条件（Node 24 以上と pnpm）を1文で示し、そのあとに `pnpm install`、`pnpm product:ready`、`pi` の起動を順に示す。
  - タイトルは英語の `# Harness-included starter` を継承し、日本語の README の題名だけ `# Harness-included starter（ハーネス付きスターター）` と英語（日本語）表記にし、題名の下の説明の文は現行を継承し、言語リンクは現行どおりとする。
- Options:
  - 機能の軸で見出しを7つに分ける（採用しなかった理由: 置き場所の軸と混在し、`upgrade` のみを切り出すなど、粒度がそろわなかった）。
  - standard-readme の順序に沿って、`## Usage` を独立させる（採用しなかった理由: 操作が3つのみであり、導入と使い方に分けると同じことを2回書くことになる）。
  - `## Why` を冒頭に置き理由から書く（採用しなかった理由: 定番の順序から外れ、`DEFINITION.md` と重複する）。
  - 道具のバッジ（`oxlint`、`oxfmt`、`vitest`、`lefthook`）とライセンスのバッジも並べる（採用しなかった理由: 道具のバッジは読者の判断に役立たず、`UNLICENSED` も何も伝えない）。
  - CI の作り直しを `0.9.4` の新しい項目として足す（採用しなかった理由: `ROADMAP.md:9` の `1.0.0 002` が「github workflowの整備」としてすでに扱っており、`### 1.0.0 002` の説明を持つため）。

### Definition

- `Unit.usage-readme`(kept): 主な機能は「オーナーが、このスターターの使い方を読むことができる」のままであり、変わるのは見出しの構成と説明文の書き方だけである。

## 02: product:ready がプロダクトの README をどう組み立てるか

### Context

- エントリー 01 により、スターターの README は `## What is in it` の下に 5 つの `###` と説明文を持つ形になり、日本語の README の見出しも英語でそろえる。
- `pnpm product:ready` は README 全体を `rules/readme.format.md` のテンプレートに置き換えるため、置き換え後の README にはスターターの中身が残らない。
- 現在の `readme-format.test.ts` は、テンプレートの 8 行、8 行、Writing の 6 行を固定値で写し取っており、`rules/readme.format.md` と二重管理になっている。
- オーナーは、`rules/readme.format.md` を唯一の出所にし、スクリプトに固定の文字列を置かず、置き換え前の `## What is in it` を動的に処理すると決めた。

### Scope

- 変更:
  - format: in — `rules/readme.format.md` の Skeleton を、`## What is in it` の下に `###` を 2 つ持つ形（前がプロダクト用で、後ろが `### Default`）に変え、`## Writing` に説明文の規則とスターターの README に `### Product` を置かない理由を加え、日本語の Skeleton の見出しも英語にそろえる。
  - behaviour: in — `pnpm product:ready` が、置き換える前の README の `## What is in it` の各 `###` の直後の段落を集めて `- <見出しの名前>: <段落>` の箇条書きにまとめ、テンプレートの後ろの `###` の本文に置く。
  - refactor: in — `scripts/product-ready/` に固定の文字列を置かず、テンプレートの見出しと本文を `rules/readme.format.md` から読む。
  - refactor: in — `readme-format.test.ts` の 3 つの固定値の配列を削除し、固定値のテストをなくす。
  - prose: in — `rules/readme.format.md` の説明文とテンプレートのプレースホルダの文言を新しい形に合わせる。
  - naming: in — 組み立ての処理に名前を付ける。
  - dependency: out — 新しいパッケージは足さない（理由: 文字列の処理で済むから）。
- 品質:
  - errors: in — 想定と違う README があれば、書き込む前に処理を止める（どのケースをどう確かめるかはプランが決める）。
  - compatibility: in — `--only <label>` と表示行の形を変えない。
  - speed: out — 速度は扱わない（理由: 読むのは 2 つの README と 1 つのテンプレートだけだから）。
  - security: out — 外部からの入力は扱わない（理由: 読むのはリポジトリ内の README だけであり、外部から取得も外部へ送信もしないから）。
- 運用:
  - deploy: out — 配布の準備はしない（理由: `product:ready` を手元で実行するから）。
  - migration: out — 移行は扱わない（理由: 一度だけの操作だから）。
  - logs and monitoring: in — `product:ready` の表示に、`### Default` に並べた見出しを出す。

### Research & Trial

- `rules/readme.format.md` の `## Skeleton` と `## Skeleton (ja)` のブロックを `scripts/product-ready/index.mjs` が `blockUnder` で読み、`whole` の置き換えではブロックをそのまま書き込む（`scripts/product-ready/targets.mjs:63-74`、`index.mjs:47-72`）。
- `blockUnder` は見出しの後ろの最初のコードフェンスの中身を返し、`sectionOf` は見出しの直後の本文の範囲を返す（`scripts/product-ready/blocks.mjs:14-37`、`:46-59`）。
- `index.mjs` は、置き換える中身をすべて組み立ててから `remove` と書き込みを行う（`index.mjs:158-161`）。
- `readme-format.test.ts` は、テンプレートの 8 行、8 行、Writing の 6 行を固定値で持ち、写し取った内容と突き合わせている（`readme-format.test.ts:17-46`）。
- 現在のテンプレートの `## What is in it` は本文も `###` も持たない（`rules/readme.format.md:16-17`、`:38-39`）。
- 現在の README の `## What is in it` は 1 件の箇条書きであり、`###` を持たない（`README.md:9-23`）。
- `index.test.ts` は、置き換え後の日本語の見出しが `## 入っているもの` であることと、`## What is in it` を含まないことを確かめている（`scripts/product-ready/index.test.ts:181-192`）。

### Decision

- Status: **accepted**
- Adopted:
  - `rules/readme.format.md` を唯一の出所とし、テンプレートの `## What is in it` は `###` を 2 つ持ち、前がプロダクト用で、後ろが `### Default` である。
  - スターターの README に `### Product` を置かない理由を `rules/readme.format.md` に書き、スターター自身がプロダクトではないことを示す。
  - 日本語の Skeleton の見出しも英語にそろえる（`## What is in it`、`## Getting started`、`## License`）。
  - `pnpm product:ready` は、置き換え前の README の `## What is in it` の各 `###` の直後の段落を集めて `- <見出しの名前>: <段落>` の箇条書きにまとめ、テンプレートの後ろの `###` の本文に置き、前の `###` はそのまま残す。
  - スクリプトは見出しの名前を定数にせず、テンプレートから読む。
  - `readme-format.test.ts` を削除して固定値のテストをなくし、テンプレートの形と生成は `index.test.ts` で確かめ、エラーケースはプランで決める。
  - 想定と違う README があれば、書き込む前に処理を止める。
- Options:
  - 見出しの名前（`Product`、`Default`）をスクリプトの定数で持つ（採用しなかった理由: `rules/readme.format.md` との二重管理になるから）。
  - `### Default` の本文にプレースホルダの文字列を置き、それを置き換える（採用しなかった理由: プレースホルダの文字列もスクリプトに持つ固定の文字列になるから）。
  - `readme-format.test.ts` を残し、テンプレートの行を写して突き合わせる（採用しなかった理由: 規則の写しになり、二重管理になるから）。

### Definition

- `Unit.product-ready`(kept): 主な機能は「オーナーが、ハーネスのテストを外した状態に切り替え、プロダクト開発を始められる」のままであり、変わるのは README の `## What is in it` を組み立てる経路とテンプレートを `rules/readme.format.md` から読む形である。

## 03: ロードマップの記法をどうそろえるか

### Context

- `ROADMAP.md` の表は、status が `_todo_`、`wip`、`done` で、cycles が `052-d`、`051-f` の形になっている。
- `rules/roadmap.md` は記法を定める文書であり、status を `todo`、`wip`、`done` と書き、cycles の末尾の文字を定めていない。
- `adr` と `close` のスキルも status をアンダースコアなしの `wip` や `done` と書いている。
- 016 のメモは status の `todo` を `_todo_` に変え、cycles を数字と `m`（main）、`d`（develop）、`f`（feature）の組み合わせにするとしている。

### Scope

- 変更:
  - format: in — `rules/roadmap.md` の status を `_todo_`、`wip`、`done` に直し、cycles を `NNN-m`、`NNN-d`、`NNN-f` の形として定め、その末尾の文字をサイクルのフォルダ名の接尾辞（`main`、`dev`、`feat`）から決める規則を書く。
  - naming: in — `adr` と `close` のスキルの status の記述を、`rules/roadmap.md` と同じ語にそろえる。
  - prose: in — 表の記法の説明は `rules/roadmap.md` に集め、スキル側はそこを参照する。
  - behaviour: out — 記法だけを直し、サイクルの進み方は変えない（理由: サイクルの手順はエントリー 04 から 07 が扱うから）。
  - refactor: out — コードは変えない（理由: `ROADMAP.md` を解析するコードはなく、`close` の `collect.mjs` は `close.md` とプランの md を読むから）。
  - dependency: out — 新しいパッケージは追加しない（理由: 文書だけを直すから）。
- 品質:
  - errors: in — `rules/roadmap.md` と、`adr` と `close` のスキルの記述が一致していることを確かめる。
  - compatibility: out — 過去のサイクルの記録は当時の記法のまま残す（理由: `cycles/` の記録は当時の事実だから）。
  - speed: out — 読むだけの文書であり、速度の対象がない（理由: 文書だけを直すから）。
  - security: out — この作業では外部との受け渡しがない（理由: リポジトリの中の文書だけを直すから）。
- 運用:
  - deploy: out — 配布の準備はしない（理由: 文書だけを直すから）。
  - migration: out — 既存の行はすでに `_todo_` と `NNN-d` の形であるため、遡って直すことはしない（理由: 直す行がないから）。
  - logs and monitoring: out — 記録や監視の対象はない（理由: 記法の文書だけを直すから）。

### Research & Trial

- `ROADMAP.md` の status は `_todo_`、`wip`、`done` であり、cycles は `044-d` から `053-d` までと `051-f` の形である（`ROADMAP.md:31-52`）。
- `rules/roadmap.md` は status を `todo`、`wip`、`done` と書き、`cycles` の末尾の文字を定めていない（`rules/roadmap.md:11-12`、`:19-20`）。
- `adr` のスキルは status を `wip` と書き、`close` のスキルは `done` と `wip` をアンダースコアなしで書いている（`.pi/skills/adr/SKILL.md:46`、`.pi/skills/close/SKILL.md:101`）。
- サイクルのフォルダ名の接尾辞はブランチ名から作られ、`main` では `main`、`develop` では `dev`、`feature/x` では `feat-x` になる（`.pi/skills/adr/scripts/cycle.mjs:55-67`）。
- フォルダの接尾辞の内訳は `dev` が 22 件、`feat-*` が 6 件であり、`main` はない（`cycles/` と `cycles/archive/`）。
- `ROADMAP.md` を解析するコードはなく、`scripts/product-ready/targets.mjs` は `ROADMAP.md` をテンプレートで置き換えるだけである。
- `ja-check` は `ROADMAP.md` の `## 0.x.x` 以降を読み飛ばす（`scripts/checks/ja-check.mjs:135-141`、`:160-176`）。

### Decision

- Status: **accepted**
- Adopted:
  - `rules/roadmap.md` の status を `_todo_`、`wip`、`done` に直し、`todo` だけをアンダースコアで囲む。
  - `rules/roadmap.md` の cycles を `NNN-m`、`NNN-d`、`NNN-f` と定め、`m` は `main`、`d` は `dev`、`f` は `feat` のサイクルを指すと書く。
  - cycles の末尾の文字はサイクルのフォルダ名の接尾辞の最初の語（`main`、`dev`、`feat`）の頭文字とする。
  - `adr` と `close` のスキルの status の記述を `rules/roadmap.md` と同じ語にそろえ、記法の説明は `rules/roadmap.md` に集める。
- Options:
  - なし（オーナーが調査も他の案の検討も行わないと決めた）。

### Definition

- `Unit.adr-skill`(kept): 主な機能は「オーナーが決め、エージェントが記録できる」のままであり、変わるのは status の語と cycles の記法だけである。
- `Unit.close-skill`(kept): 主な機能は「エージェントが、サイクル終了後に、クロージングできる」のままであり、変わるのは status の語だけである。

## 04: close のトリアージの表記をどうするか

### Context

- `close` のスキルは、トリアージの区分を `ex-` と `proposed` の素のまま書き、`references/format.md` は `ex-plan` と `proposed` と書いている。
- 016 のメモは、`ex-plan` を `_ex-plan_` に、`proposed` を `_proposed_` に変えると定めている。
- `.pi/skills/close/scripts/collect.mjs` は、`close.md` の `## Triage` から、`ex-plan <plan id> (ADR <NN>, ...)` の形の行の `No` を読んでいる（`collect.mjs:235`）。
- `_ex-plan_` に変えると、この正規表現は一致しない。

### Scope

- 変更:
  - format: in — `.pi/skills/close/SKILL.md` と `references/format.md` の区分の表記（`ex-`、`ex-plan`、`proposed`）を `_ex-plan_` と `_proposed_` にし、プランのファイル名の接頭辞 `ex-<what it fixes>` は変えない。
  - refactor: in — `.pi/skills/close/scripts/collect.mjs` の正規表現を `_ex-plan_` に合わせて、古い `ex-plan` の形は読まない。
  - prose: in — `references/format.md` の「プランの id はすぐ後ろ、バッククォートを付けない」という文を、新しい表記に合わせて直す。
  - behaviour: out — トリアージの判断と `close.md` の列は変えない（理由: 表記だけを変えるため）。
  - dependency: out — 新しいパッケージは追加しない（理由: 文字列の処理で済むから）。
- 品質:
  - errors: in — `_ex-plan_` の行から `No` を読めないときに `未特定` になることを、テストで確かめる。
  - compatibility: out — 過去のサイクルの `close.md` は読まない（理由: 閉じ直さないため、後方互換を持たないと決めたから）。
  - speed: out — 文字列の処理だけのため、速度の対象はない（理由: 読むのは `close.md` だけだから）。
  - security: out — この変更には外部との受け渡しがない（理由: リポジトリ内の文書とスクリプトだけを直すから）。
- 運用:
  - deploy: out — 配布の準備はしない（理由: 文書とスクリプトだけを直すから）。
  - migration: out — 過去の `close.md` を書き換えない（理由: 記録は当時の事実だから）。
  - logs and monitoring: out — ログや監視の表示を変えない（理由: ログや監視の対象がないから）。

### Research & Trial

- `.pi/skills/close/scripts/collect.mjs:235` の正規表現は `^-\s*\d+:\s*ex-plan\s+(\S+)\s*\(ADR\s+([^,\s)]+)` であり、行頭の `ex-plan` を求めるため、`_ex-plan_` には一致しない。
- `collect.mjs` に `proposed` を読むコードはない。
- `references/format.md:65` は、プランの id を `ex-plan` のすぐ後ろに置き、バッククォートを付けないと定めている。
- `close.md` の `## Triage` の行の形は `- <N>: ex-plan <plan id> (ADR <NN>, <定義の部分>)` と `- <N>: proposed (ADR <NN>, <定義の部分>)` である（`references/format.md:18`、`:22`）。
- `collect.mjs` は、`ex-` で始まる plan の id からトリアージの `No` を引く（`collect.mjs:249-252`）。

### Decision

- Status: **accepted**
- Adopted:
  - `.pi/skills/close/SKILL.md` と `references/format.md` の区分の表記（`ex-`、`ex-plan`、`proposed`）を `_ex-plan_` と `_proposed_` にし、プランのファイル名の接頭辞 `ex-<what it fixes>` は変えない。
  - `collect.mjs` の正規表現を `_ex-plan_` に合わせて、古い `ex-plan` の形は読まない。
  - `references/format.md` の「id はすぐ後ろ、バッククォートを付けない」の文を、`_ex-plan_` に合わせて直す。
  - `_ex-plan_` の行から `No` を読めないときに `未特定` になることを、テストで確かめる。
- Options:
  - なし（オーナーが、調査と他の案の検討を行わないと決めた）。

### Definition

- `Unit.close-skill`(kept): 主な機能は「エージェントが、サイクル終了後に、クロージングできる」のままであり、変わるのはトリアージの区分の表記と、`close.md` を読む正規表現である。

## 05: ex- のプランを通常のプランと同じ手順で扱うとき、何をどこに書くか

### Context

- `close` のスキルは、エージェントが確定した `ex-` のプランを直接書き、その作業を走らせると定めている（`.pi/skills/close/SKILL.md:84`、`:94`）。
- `plan` のスキルは、エージェントがプランを書いたらすぐに `review` のサブエージェントに渡し、すべてのレビューのあとに `proofreader` を走らせると定めている（`.pi/skills/plan/SKILL.md:58`、`:74`）。
- `work` のスキルは、`base` のプランではエージェントが 1 スライスごとにオーナーの OK を待つと定めている（`.pi/skills/work/SKILL.md:46`）。
- 016 のメモは、`ex-` のプランも通常のプランと同じくプラン自体をレビューし、修正してコミットすること、そのあと worktree のプランならエージェントが worktree を作り、`base` のプランならエージェントが自走することを明記するとしている。

### Scope

- 変更:
  - prose: in — `.pi/skills/close/SKILL.md` の `ex-` のプランの手順に、プラン自体のレビュー、修正、コミットを加える（`SKILL.md:84`、`:94`）。
  - prose: in — レビューと修正のあと、worktree のプランならエージェントが worktree を作り、`base` のプランならオーナーの確認を挟まずに走ることを書く。
  - prose: in — `.pi/skills/work/SKILL.md` の `base` のプランの手順（`:46`）に、`ex-` のプランではエージェントがオーナーの確認を挟まないことを書く。
  - behaviour: in — `ex-` のプランの扱いが、エージェントがプランを書いてすぐに作業に入る形から、プランのレビュー、修正、コミットを挟む形に変わる。
  - refactor: out — コードは変えない（理由: スキルの文書だけを直すため）。
  - dependency: out — 新しいパッケージは追加しない（理由: スキルの文書だけを直すため）。
- 品質:
  - errors: in — `close`、`work`、`plan` の 3 つのスキルの手順の記述に食い違いがないことを確かめる。
  - compatibility: out — 過去のサイクルには遡らない（理由: 手順は次のサイクルから効くため）。
  - speed: out — 読むだけの文書であり、速度を上げる対象がない（理由: スキルの文書だけを直すため）。
  - security: out — 外部との受け渡しがない（理由: リポジトリ内の文書だけを直すため）。
- 運用:
  - deploy: out — 配布の準備はしない（理由: スキルの文書だけを直すため）。
  - migration: out — 過去のサイクルの記録を書き換えない（理由: 記録は当時の事実だから）。
  - logs and monitoring: out — ログや監視の表示を変えない（理由: ログや監視の対象がないため）。

### Research & Trial

- `close` のスキルの第 9 手順は、エージェントが確定した `ex-` の残りのプランを直接書き、その作業を走らせ、マージしたら `done <commit>` を書くと定めている（`.pi/skills/close/SKILL.md:82`、`:84`）。
- `close` のスキルは、Unit の機能が動かない場合も、エージェントが `ex-` のプランを書いて、その作業を走らせると定めている（`SKILL.md:94`）。
- `plan` のスキルは、エージェントがプランを書いたらすぐに `review` のサブエージェントに渡す（`.pi/skills/plan/SKILL.md:58`）。
- `plan` のスキルは、すべてのレビューのあとに、エージェントがプランのファイルごとに `proofreader` を走らせる（`plan/SKILL.md:74`）。
- `work` のスキルは、`ex-` のプランの `Place` を既定で worktree とする（`.pi/skills/work/SKILL.md:25`）。
- `work` のスキルは、`base` のプランではエージェントが 1 スライスごとにオーナーの OK を待ってコミットすると定めている（`work/SKILL.md:46`）。
- `close` のスキルは、エージェントが `ex-` のプランとその作業を、マージのときにそれぞれコミットすると定めている（`SKILL.md:112`）。

### Decision

- Status: **accepted**
- Adopted:
  - `close` のスキルの `ex-` のプランの手順に、プラン自体のレビュー、修正、コミットを加える。
  - レビューと修正のあと、worktree のプランならエージェントが worktree を作り、`base` のプランならオーナーの確認を挟まずに走ることを書く。
  - `work` のスキルの `base` のプランの手順に、`ex-` のプランではオーナーの確認を挟まないこと、`ex-` 以外の `base` のプランではこれまでどおり 1 スライスごとに確認することを書く。
- Options:
  - なし（オーナーが調査と他の案の検討を行わないと決めた）。

### Definition

- `Unit.close-skill`(kept): 主な機能は「エージェントが、サイクル終了後に、クロージングできる」のままであり、変わるのは `ex-` のプランにレビュー、修正、コミットを挟む手順である。
- `Unit.work-skill`(kept): 主な機能は「エージェントが、plan を 1 つずつ片付けられる」のままであり、変わるのは `ex-` のプランでの確認の扱いである。

## 06: work の開始時と close のコミットメッセージをどうするか

### Context

- `work` のスキルは、サイクル文書のコミットメッセージを `update: NNN's ADR, affected and plan` と定めている（`.pi/skills/work/SKILL.md:31`）。
- `close` のスキルの第 13 手順は、`close.md` と `ROADMAP.md` を 1 つのコミットにすると定めているが、メッセージを定めていない（`.pi/skills/close/SKILL.md:111`）。
- 実際のコミットメッセージは `update: 053's ADR, affected and plan` と `close: 053's close and roadmap` である。
- 016 のメモは、両方のメッセージにサイクル番号だけでなくサイクルのフォルダ名の番号より右（`054-dev`）まで含めるとしている。

### Scope

- 変更:
  - format: in — `work` のコミットメッセージを `update: NNN-<suffix>'s ADR, affected and plan` にする。
  - format: in — `close` の第 13 手順に、コミットメッセージ `close: NNN-<suffix>'s close and roadmap` を書く。
  - prose: in — `<suffix>` の取り方（サイクルのフォルダ名の番号より右）を書く。
  - behaviour: out — コミットする中身と時点は変えない（理由: メッセージだけを変えるため）。
  - refactor: out — コードは変えない（理由: コミットはエージェントが作るため）。
  - dependency: out — 新しいパッケージは追加しない（理由: 文書だけを直すため）。
- 品質:
  - errors: in — メッセージの形が実際のコミットメッセージと食い違っていないことを確かめる。
  - compatibility: out — 過去のコミットのメッセージは書き換えない（理由: 履歴はそのまま残すため）。
  - speed: out — 読むだけの文書であり、速度の対象がない（理由: 文書だけを直すため）。
  - security: out — 外部との受け渡しがない（理由: リポジトリ内の文書だけを直すため）。
- 運用:
  - deploy: out — 配布の準備はしない（理由: 文書だけを直すため）。
  - migration: out — 過去のコミットを書き換えない（理由: 履歴はそのまま残すため）。
  - logs and monitoring: out — 表示を変えない（理由: ログや監視の対象がないため）。

### Research & Trial

- `work` のスキルは、サイクル文書のコミットメッセージを `update: NNN's ADR, affected and plan` と定めている（`.pi/skills/work/SKILL.md:31`）。
- `close` のスキルの第 13 手順は、`close.md` と `ROADMAP.md` を 1 つのコミットにすると定め、メッセージを定めていない（`.pi/skills/close/SKILL.md:109-112`）。
- 直近のコミットメッセージは `update: 053's ADR, affected and plan` と `close: 053's close and roadmap` である（`git log --format='%s'`）。
- サイクルのフォルダ名は `261103-053-dev` であり、番号より右は `dev` である（`cycles/`）。
- コミットメッセージを読むコードはない（`scripts/` と `.pi/` の `.mjs` に `git log` と `%s` の参照がない）。
- `.pi/skills/close/scripts/collect.mjs` が読むのは Triage 行の `done <commit>` のハッシュであり、メッセージではない（`collect.mjs:235-238`）。

### Decision

- Status: **accepted**
- Adopted:
  - `work` のコミットメッセージを `update: NNN-<suffix>'s ADR, affected and plan` にし、`close` の第 13 手順に `close: NNN-<suffix>'s close and roadmap` を書く。
  - `<suffix>` は、サイクルのフォルダ名の番号より右（`261104-054-dev` なら `dev`）とする。
  - 過去のコミットのメッセージは書き換えない。
- Options:
  - なし（オーナーが調査と他の案の検討を行わないと決めた）。

### Definition

- `Unit.work-skill`(kept): 主な機能は「エージェントが、plan を 1 つずつ片付けられる」のままであり、変わるのはコミットメッセージの形だけである。
- `Unit.close-skill`(kept): 主な機能は「エージェントが、サイクル終了後に、クロージングできる」のままであり、変わるのはコミットメッセージの形だけである。

## 07: プランのファイル名に NN- を付けると影響はどこまで及ぶか

### Context

- プランのファイル名は `cycles/<YYMMDD>-<NNN>-<slug>/plan/<plan id>.md` という形で、いずれも番号を持たない（`cycles/261103-053-dev/plan/plan-cut.md`、`ex-doc-lists.md`）。
- `.pi/skills/close/scripts/collect.mjs` は、ファイル名から `.md` を除いたものを plan id とし（`collect.mjs:367`）、`planRank` で `ex-` の並びを決め（`:223`）、`noOf` で `ex-` かどうかを判定する（`:249-252`）。
- `close` の `## Collected` の見出しは `### <plan id> (ADR <No>)` であり、並びは通常のプランが先、`ex-` のプランが後で、いずれもファイル名の文字順である（`references/format.md:12`、`:50`、`collect.mjs:284`）。
- 016 のメモでは、ファイル名の先頭に `NN-` を付けて順番をわかりやすくするとしている。

### Scope

- 変更:
  - naming: in — プランのファイル名を `NN-<plan id>.md` にする（`01-plan-cut.md`、`06-ex-doc-lists.md`）。
  - format: in — `plan`、`work`、`close` のスキルと `close` の `references/format.md` にある `plan/<plan id>.md` の記述を `plan/<NN>-<plan id>.md` にし、`## Collected` の見出しを `### <NN> <plan id> (ADR <No>)` にする。
  - refactor: in — `collect.mjs` は `NN-` を除いた名前を plan id とし、`planRank` と `noOf` による `ex-` の判定を `NN-` より後の名前で行い、`## Collected` の並びを `NN` の数値の順にし、見出しに `NN` を渡す。
  - behaviour: out — プランの中身と `close.md` の Triage の形は変えない（理由: ファイル名だけを変えるため）。
  - dependency: out — 新しいパッケージは追加しない（理由: 文書と文字列の処理だけを直すため）。
- 品質:
  - errors: in — `NN-` 付きのファイル名から、`No` と並び順が正しく出ることをテストで確かめる。
  - compatibility: out — 過去のサイクルのプランのファイル名は変えない（理由: 記録はそのまま残すため）。
  - speed: out — 速度の改善は行わない（理由: 文書と文字列の処理だけを直すため）。
  - security: out — 外部とのやり取りは扱わない（理由: リポジトリ内の文書と文字列の処理だけを直すため）。
- 運用:
  - deploy: out — 配布の準備はしない（理由: 文書と文字列の処理だけを直すため）。
  - migration: out — 過去のサイクルのプランのファイル名を変えない（理由: 記録はそのまま残すため）。
  - logs and monitoring: out — ログや監視のための表示は変えない（理由: 対象がないため）。

### Research & Trial

- `collect.mjs:367` は、ファイル名から `.md` を除いたものを plan id としている。
- `collect.mjs:223` の `planRank` は、ファイル名が `ex-` で始まるかどうかによって、通常のプランと `ex-` のプランの並びを決めている。
- `collect.mjs:249-252` の `noOf` は、plan id が `ex-` で始まるかどうかを判定し、`readTriageNos` との対応から `No` を引く。
- `readTriageNos` は、Triage 行の `ex-plan <plan id>` にある plan id を手がかりに対応付ける（`collect.mjs:231-238`）。
- `plan` のスキルは、通常のプランでは plan md の先頭に `No` を書き、`ex-` のプランには書かないと定めている（`plan/SKILL.md:20`）。
- 現在のプランのファイル名は、`plan-cut.md`、`ex-doc-lists.md` のようにいずれも番号を持たない（`cycles/261103-053-dev/plan/`）。
- `## Collected` の見出しは、`collect.mjs` の `render` が `### ${id} (ADR <No>)` の形で作り（`collect.mjs:284`）、見出しには plan id をそのまま使っている（`references/format.md:12`）。
- `## Collected` の並びは、通常のプランを先に、`ex-` のプランを後にし、いずれもファイル名の文字順である（`references/format.md:50`）。
- `collect.mjs:363` の並びは、`planRank` の値と `localeCompare` で決めており、同じ順位ではファイル名の文字順になる。
- `collect.mjs:271` の `contexts` は `<plan id>:<line>` を鍵とし、`## Collected` の番号行の下の文脈は plan id で引ける。
- `writeClose` は `collectCycle` の結果を `render` に渡し、`## Collected` と `## Triage` を 1 つの `close.md` に書く（`collect.mjs:385-402`）。
- `collect.test.ts:45-46` と `:66` は、`### <plan id> (ADR <No>)` を見出しとして確かめている。
- `collect.fixture.ts:19` の plan md は `# PLAN \`<plan id>\`` を持ち、plan のファイル名はテスト内で作られる（`collect.test.ts:22-24`）。
- `plan/<plan id>.md` を持つ記述は、`plan/SKILL.md:3`、`:12`、`:74`、`plan/references/format.md:3`、`plan/references/tasks.md:8`、`work/SKILL.md:16`、`work/references/tasks.md:8`、`:35`、`:70` である。
- `close/references/format.md:12` は `### <plan id> (ADR <プランの No の値>)` を見出しの形として定め、`:50` は並びを定めている。

### Decision

- Status: **accepted**
- Adopted:
  - プランのファイル名を `NN-<plan id>.md` にする（`01-plan-cut.md`、`06-ex-doc-lists.md`）。
  - `NN-` を並び順の接頭辞として plan id に含めず、`collect.mjs` はファイル名から `NN-` と `.md` を除いた名前を plan id とする。
  - `planRank` は、`NN-` を除いた名前で `ex-` かどうかを判定する。
  - `## Collected` の並びは、通常のプランを先に、`ex-` のプランを後にし、いずれも `NN` の数値の順にする（ファイル名の文字順にしない）。
  - `## Collected` の見出しは `### <NN> <plan id> (ADR <No>)` にする（例: `### 02 design-removal (ADR 01)`）。
  - `close.md` の Triage 行の plan id は、これまでどおり `ex-<what it fixes>` とする。
  - `NN-` 付きのファイル名から `No` と並び順が出ることをテストで確かめる。
- Options:
  - なし（オーナーが調査も他の案の検討も行わないと決めた）。

### Definition

- `Unit.plan-skill`(kept): 主な機能は「エージェントが、1 plan 分の作業の形と順序を決めて書ける」のままであり、変わるのはファイル名の接頭辞だけである。
- `Unit.close-skill`(kept): 主な機能は「エージェントが、サイクル終了後に、クロージングできる」のままであり、変わるのはファイル名から plan id を作る処理だけである。
