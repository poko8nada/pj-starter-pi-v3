# ADR 051

## 01: チェッカー本体の形は何か

### Context

- 050 で手作業で行った日本語修正（10 件の規則、語対応表、872 件のコメント・802 件のテスト名・96 件の文字列）を、今後のサイクルでも決定論的に検査する仕組みが必要である。
- 既存の `scripts/checks` は型検査だけで、日本語の検査はない。
- 050 の close で、手動の grep による `骨組み` 中の `骨` と `純粋に` の誤検出が起きた。

### Scope

- 変更:
  - behaviour: in — 語を探し、warn/error を出し、exit code を返す。対象はテキストファイル（コード、テスト、コメント、文書、設定）とし、`ROADMAP.md` の `## 0.x.x` のセクションと `scripts/checks/ja-check.json` を除き、同じ引用符（`'`、`"`、`` ` ``）の間に語だけがある場合は指摘しない。
  - refactor: out — 既存の `scripts/checks` のコードは整理しない。（理由: このエントリーの問いはチェッカーの形だけであり、既存のコードの整理は別の問い）
  - dependency: out — 新しいパッケージは足さず、Node の標準ライブラリだけで書く。（理由: Node の標準ライブラリで足りるため、依存を増やさない）
  - naming: in — チェッカーの名前（`ja-check`、関数名）と Unit の名前（`japanese-check`）を決める。
  - format: in — 出力の形（`<file>:<line>: <語> → <対応> [warn|error]`、最後の固定の集計行）を決める。
  - prose: out — 文書はエントリー 04 の範囲とする。（理由: 文書の規則と使い方は 04 の問い）
- 品質:
  - speed: in — `pre-commit` で走るため、チェッカーがステージされた 100 ファイルを 1 秒未満で処理する。
  - security: out — ローカルの検査だけを行い、チェッカーは外部入力を扱わない。（理由: チェッカーはローカルのファイルだけを読む）
  - compatibility: in — チェッカーを作業環境の Node 24 の標準ライブラリと、`scripts/checks` の既存の形に合わせる。
  - errors: in — JSON がない、ファイルが読めない、引数がない場合の扱いを決める。
- 運用:
  - deploy: in — `scripts/checks` は `harness.json` の `copy` と `push` に含まれるため、`ja-check.mjs` は製品へ配られる。
  - migration: out — 移行はない。（理由: 既存の語に置き換えるだけである）
  - logs and monitoring: out — 出力は標準出力とし、監視系は足さない。（理由: pre-commit の出力で足りるため）

### Research & Trial

- `scripts/checks/typecheck-staged.mjs` は `process.argv.slice(2)` でファイルを受けて対象の拡張子だけに絞り、0 件なら exit 0、失敗なら exit 1 を返し、一方で `lefthook.yaml` の `pre-commit` は `{staged_files}` を渡す。
- `package.json` に textlint、prh、kuromoji はなく、`.oxlintrc.json` は `*.md` を無視する。
- 既存の `proofreader` は `**/*.md` だけを対象にし、コードのコメントとテスト名を直接読めない。
- `scripts/checks` は `scripts/harness/harness.json` の `copy` と `push` に含まれ、`scripts/product-ready/targets.mjs` の対象にも入らない。
- 新しいファイルは製品へ配られる。
- `ja-check.json` のキーは禁止語そのものであり、チェッカーのテストのサンプルも禁止語を含む。
- `cycles/` の 050 の adr は語対応表を持ち、`cycles/` は対象であるため、その語対応表も指摘の対象になる。`ROADMAP.md` の `## 0.x.x` の 012 は禁止語を列挙している。テストファイルとコードのコメントは対象であり、テストのデータは引用符で語を名指しするため、引用符の規則でスキップされる。`scripts/checks/ja-check.json` の値は `骨組み` や `入口` を含み、部分一致の `warn` になるため、自己除外を残す。
- `typecheck-staged.mjs` は引数がないとき `exit 0` とし、存在しないファイルを飛ばす。
- 作業環境の Node は 24.22.1 で、`package.json` に `engines` はない。

### Decision

- Status: **accepted**
- Adopted:
  - 案 A: `scripts/checks/ja-check.mjs` として自作し、`{staged_files}` を受けて JSON の禁止語を探し、`<file>:<line>: <語> → <対応> [warn|error]` と集計を出し、error があれば exit 1、warn だけなら exit 0 とする。
  - 対象はテキストファイル（コード、テスト、コメント、文書、設定）とし、`ROADMAP.md` の `## 0.x.x` のセクションと `scripts/checks/ja-check.json` を除く。
  - 同じ引用符（`'`、`"`、`` ` ``）の間に語だけがある場合は指摘しない。テストファイルとコードのコメントも対象にする。
  - 引数がない場合は `exit 0` とし、読めないファイルは飛ばして集計に載せる。
  - 出力の最後は、`error`、`warn`、設定なし、対象なしのどの場合でも `ja-check: <n> ファイル、error <n> 件、warn <n> 件` の形の 1 行にし、オーナーに報告する。`設定なし` はその前の行に出す。
  - 速度は、ステージされた 100 ファイルを 1 秒未満で処理することを目標とする。
  - Node は作業環境の 24 とし、チェッカーは標準ライブラリだけを使う。
- Options:
  - 案 B: oxlint の JS プラグインはアルファであり、`.oxlintrc.json` が `*.md` を無視するため文書が対象外になる。
  - 案 D: grep を `lefthook` に直結する案では JSON 設定がなく、語ごとの warn/error を分けられない。
  - textlint は文書の校正をエントリー 04 に回したが、04 は却下された。

### Definition

- `Unit.japanese-check`(added): エージェントが、日本語の語に対する指摘を受け取れる。
- `Unit.lefthook-gate`(kept): commit 前の検査に日本語の検査が加わるが、検査を通して commit も push もする働きは変わらない。

## 02: JSON の形は何か

### Context

- 01 のチェッカーは、禁止語の一覧を JSON から読み込む。
- 050 の語対応表は文章で、JSON ではない。
- チェッカーは既存の `scopes.json` を `fs.readFileSync` と `JSON.parse` で読み込み、`Array.isArray` だけで検証する。

### Scope

- 変更:
  - behaviour: in — `error`/`warn` のオブジェクト、語ごとの対応、既定の強さを決める。
  - refactor: out — 既存の `scopes.json` の読み取りコードは整理しない。（理由: 02 の問いは JSON の形だけであり、既存のコードの整理は別の問い）
  - dependency: out — 新しいパッケージは足さない。（理由: Node の標準ライブラリで足りるため）
  - naming: in — ファイルのパスと、`error`/`warn` のキーを決める。
  - format: in — JSON のスキーマを決める。
  - prose: out — 文書はエントリー 04 の範囲とする。（理由: 文書の規則と使い方は 04 の問い）
- 品質:
  - speed: out — 読み込みの速さは 01 の範囲で、02 では測らない。（理由: 02 の問いは JSON の形だけである）
  - security: out — ローカルの設定ファイルだけを読み、チェッカーは外部入力を扱わない。（理由: チェッカーはローカルのファイルだけを読む）
  - compatibility: in — チェッカーを Node の JSON パースと、既存の `scopes.json` の読み込み方に合わせる。
  - errors: in — ファイルがない、JSON が壊れている、キーと値の型が違う場合の扱いを決める。
- 運用:
  - deploy: in — `scripts/checks` は `harness.json` の `copy` と `push` に含まれるため、`ja-check.json` は製品へ配られ、製品の変更は `harness:push` でスターターへ戻る。
  - migration: out — 移行はない。（理由: 既存の語に置き換えるだけである）
  - logs and monitoring: out — 監視系は足さない。（理由: pre-commit の出力で足りるため）

### Research & Trial

- `scripts/checks/scopes.json` は `[".pi"]` という配列であり、読み込みは `fs.readFileSync` と `JSON.parse` で行い、`Array.isArray` だけで検証し、ファイルがなければ空配列として扱い、壊れていれば `the list is not valid JSON` を出して exit 1 とする。
- `{ "error": {...}, "warn": {...} }` というオブジェクトでは `Array.isArray` による検証を通らないため、新しい検証が要る。
- 050 の語対応表には「そのまま」とする語（`道具`、`観点`、`写し`、`偽物`、`印`）がある。
- `ja-check.json` のキーは禁止語そのものであり、チェッカーが自身を読むと自身のキーを指摘する。
- `scripts/checks` は `harness.json` の `copy` と `push` に含まれ、製品の `ja-check.json` は `harness:push` でスターターへ戻る。

### Decision

- Status: **accepted**
- Adopted:
  - 案 A: `scripts/checks/ja-check.json` に `{ "error": { "作業場": "ワークツリー", ... }, "warn": { "口": "入口", ... } }` を置き、キーを `error`/`warn`、値を、語から置き換え先への文字列の対応とし、新しい検証を書いて、ファイルがなければ空として扱い、「設定なし」を出し、壊れた JSON では exit 1 とする。
  - `error` と `warn` の分け方は、部分一致の危険がある語を `warn`、それ以外を `error` とする。どの語が危険かは plan が 050 の語対応表を 1 語ずつ見て決める。
  - 050 の語対応表の「そのまま」の語は JSON に入れない。
  - キーは `error` と `warn` だけとし、値は、語から置き換え先への文字列の対応とする。それ以外は壊れた JSON と同じ扱いにする。
- Options:
  - 案 B: `{ "words": [ { "word": "作業場", "replacement": "ワークツリー", "level": "error" }, ... ] }` という配列（`scopes.json` の `Array.isArray` による検証をそのまま使えるが、`error`/`warn` の区別が語ごとに並ぶ）。

### Definition

- `Unit.japanese-check`(kept): 語の一覧を JSON から読む経路が加わるが、指摘を受け取る働きは変わらない。
- `Unit.lefthook-gate`(kept): commit 前の検査に日本語の検査が加わるが、検査を通して commit も push もする働きは変わらない。

## 03: lefthook にどう載せるか

### Context

- 01 で決めたチェッカーは `scripts/checks/ja-check.mjs` であり、`pre-commit` で実行する。
- オーナーは成功時にも結果を受け取りたい。
- 既存の `pre-commit` では `checks` グループの 4 ジョブが並列に実行され、各ジョブに `{staged_files}` が渡される。

### Scope

- 変更:
  - behaviour: in — `pre-commit` に `ja-check` ジョブを足し、`{staged_files}` を渡し、`output` は既定のままとし、`stage_fixed` を `false` にする。
  - refactor: out — 既存の `format`/`lint`/`typecheck`/`test` のジョブは整理しない。（理由: 03 の問いは新しいジョブだけである）
  - dependency: out — `lefthook` は既存で、新しいパッケージは足さない。（理由: 既存のフックに載せるだけである）
  - naming: in — `ja-check` ジョブの名前を決める。
  - format: in — `lefthook.yaml` の形を決める。
  - prose: out — 文書はエントリー 04 の範囲とする。（理由: 文書の規則と使い方は 04 の問い）
- 品質:
  - speed: in — `ja-check` を `pre-commit` の並列実行に載せ、待ち時間を増やさない。
  - security: out — ローカルのフックだけを使い、チェッカーは外部入力を扱わない。（理由: チェッカーはローカルのファイルだけを読む）
  - compatibility: in — ジョブを既存の `lefthook` のバージョンとジョブの形に合わせる。
  - errors: in — ジョブが失敗したときの扱いを決める。
- 運用:
  - deploy: in — `lefthook.yaml` は `harness.json` の `copy` に含まれるため、`ja-check` ジョブは製品の `pre-commit` にも入る。
  - migration: out — 移行はない。（理由: 既存のフックにジョブを足すだけである）
  - logs and monitoring: in — `lefthook` の既定の `output` はすべて有効なため、成功時にも結果が表示され、監視系は足さない。（理由: `pre-commit` の出力で足りるため）

### Research & Trial

- `ja-check` ジョブは `checks.group.jobs` の 5 件目として入る。
- `{staged_files}` は既存の 4 ジョブと同様に渡せて、空のときは `lefthook` がジョブをスキップする。
- `lefthook` のスキーマにはジョブ単位の `output` がなく、`output` は設定のルートのキーである。

- ルートの `output` の既定はすべての出力が有効であり、`true` を足す必要はない。
- `glob: '*'` はネストしたパスにも当たる（`lefthook` のテストでは `*.rb` が `folder/subfolder/0.rb` に当たる）。
- `lefthook.yaml` は `harness.json` の `copy` に含まれ、製品へ配られる。
- `stage_fixed` が `true` なのは `format` だけであり、`ja-check` はファイルを変更しない。

### Decision

- Status: **accepted**
- Adopted:
  - 案 A: `ja-check` ジョブを足し、`glob` は `*` とし、`output` は既定のままとし、`stage_fixed` を `false` にし、ステージされたすべてのファイルを渡してチェッカー側で絞り込む。
- Options:
  - 案 B: 同じジョブで `glob` を `*.{js,jsx,ts,tsx,mts,cts,mjs,cjs,md,mdx,json,jsonc}` に絞り、既存の `format` と対象をそろえてチェッカー側の絞り込みを減らす。
  - 案 C: `glob` を省略してチェッカー側で拡張子を絞り、`typecheck-staged` の `CODE_EXTENSIONS` と同じ形にする。

### Definition

- `Stack.Checks.Git hooks`(kept): `lefthook` のままで、`ja-check` ジョブの追加は経路である。
- `Unit.japanese-check`(kept): `pre-commit` で走る経路が加わるが、指摘を受け取る働きは変わらない。
- `Unit.lefthook-gate`(kept): commit 前の検査に日本語の検査が加わるが、検査を通して commit も push もする働きは変わらない。

## 04: 文書に規則を残すか

### Context

- 050 の 10 規則と語対応表は `cycles/261101-050-dev/adr.md` にあり、オーナーはこれらの扱いを決めたい。
- エージェントは `rules/` を読まず、`AGENTS.md` は注入されても無視しがちである。
- オーナーはコミット前の機械的な検査に意味を見いだしている。

### Scope

- 変更:
  - behaviour: in — `rules/` に規則を足し、`README` に使い方を書く。
  - refactor: out — 既存の `rules/` のファイルは整理しない。（理由: 04 の問いは新しい規則と使い方だけである）
  - dependency: out — 新しいパッケージは足さない。（理由: 文書だけである）
  - naming: in — 規則のファイル名と、`README` の見出しを決める。
  - format: in — `rules/` と `README` の形を決める。
  - prose: in — `rules/` と `README` の日本語を整える。
- 品質:
  - speed: out — 文書の速度は測らない。（理由: 04 の問いは文書の配置だけである）
  - security: out — 文書だけを扱い、外部入力は扱わない。（理由: 文書の配置だけである）
  - compatibility: in — 新しい規則と使い方を既存の `rules/` と `README` の形に合わせる。
  - errors: out — 文書ではエラー処理を定めない。（理由: 文書の配置だけである）
- 運用:
  - deploy: out — 配布は変えない。（理由: 文書の配置だけである）
  - migration: out — 移行はない。（理由: 文書の配置だけである）
  - logs and monitoring: out — 監視系は足さない。（理由: 文書の配置だけである）

### Research & Trial

- `rules/` はエージェントが読み、`product:ready` とテストはその形を保ち、`README` は利用者向けであり、`AGENTS.md` は毎セッションで読まれ、`DEFINITION.md` は全体像を示す。
- 050 の 01 は `rules/japanese.rules.md` 案を、エージェントが読む手順と `Unit` が増えることと `proofreader` との重なりを理由に却下した。
- チェッカーの JSON と `lefthook` の設定に対応する実ファイルはまだない。

### Decision

- Status: **rejected**（チェッカーの JSON が規則の役目を担い、エージェントは `rules/` を読まず、`AGENTS.md` も注入されても無視しがちなので、オーナーは文書に残すよりコミット前の機械的な検査に意味を見いだしている）
- Adopted:
- Options:
  - 案 A: `rules/japanese.rules.md` を新設して 10 規則と語対応表を置き、`README` にチェッカーと JSON の変更方法を書くが、チェッカーの JSON が規則の役目を担い、エージェントは `rules/` を読まないため採用しなかった。
  - 案 B: `README` にだけ書くが、規則が利用者向けの文書に埋もれ、エージェントは読まないため採用しなかった。
  - 案 C: `AGENTS.md` に短い 1 行を足して `README` に詳細を書くが、エージェントは `AGENTS.md` を注入されても無視しがちであるため採用しなかった。
  - 案 D: `DEFINITION.md` に `ja-check` を書き加えて `README` に使い方を書くが、10 規則の全文は 1 行に収まらないため採用しなかった。

### Definition

- なし（採用しなかった）
