# ADR 055

## 01: affected の調査は、変更に依存するものをどうやって網羅するか

### Context

- オーナーは `cycles/261104-054-dev` で `.github/workflows/pullfrog.yml` の削除を決めたが、`scripts/harness/harness.json:7` の `copy` に `".github/workflows"` が残った。
- 調査は `pullfrog` という1つの名前で `README.md`、`README.ja.md`、`.github` 配下の3か所だけを検索した（`cycles/261104-054-dev/affected.md:145`）。`".github/workflows"` は `pullfrog` を含まない値なので、この検索では届かない。
- 残った古い値は表示だけの問題ではない。今日でも `node scripts/harness/index.mjs pull` は `missing (1): .github/workflows` を返し、終了コード1で終わる。
- 手順（`.pi/skills/adr/references/tasks.md:20-52`）は、名前ごとの検索と前方・後方の読みを定めている。しかし、何を名前とするか、どこまでたどるか、調査の完了をどう示すかが定まっていない。
- ADR の `Adopted` は日本語の散文で、パスをかならずしも書かない。調査では、その文章から検索対象を導く必要がある。
- オーナーは、調査のコストをリポジトリの大きさではなく変更の大きさに比例させることに決めた。調査では全件を列挙しない。
- オーナーは、調査役に読み取り用の `bash` を許可することに決めた。
- 変更は調査の時点では適用されていないので、検査は調査では使わない。検査は plan の `Verify` と trial の仕事である。

### Scope

- 変更:
  - format: in — 手順を「対象を導く」「表記に広げる」「検索する」「判定する」「効果を確かめる」「作業表を埋める」「止める」「振り返る」の順序に組み直す。
  - prose: in — `references/tasks.md` の「Look at the affected」を、上の順序で書き直す。`SKILL.md` の項目7は、規則と食い違っている1文だけを直す。
  - behaviour: in — ディレクトリのパスと設定の値も名前として扱い、範囲はリポジトリ全体とし、当たりから新しい名前を加える反復を行う。
  - dependency: in — 調査役に読み取り用の `bash` を加える（`.pi/extensions/consult/types.json` の `research` の `tools` と `bash`）。
  - naming: out — 記録の項目の名前は変えない（理由: 記録の形はエントリー 02 が扱う）。
  - refactor: out — `scripts/affected.mjs` と `scripts/index.test.ts` は変えない（理由: エントリー 02 が扱う）。
  - compatibility: out — 過去のサイクルの `affected.md` は書き直さない（理由: 記録はサイクルごとのもので、読み手は同じサイクルの plan だけである）。
- 品質:
  - errors: in — 答えられなかった問いと導けなかった名詞を事実として返す規則を残す。
  - speed: out — 調査の時間は目標にしない（再検討条件: 調査が `turns: 40` で終わらないことが続いたら、上限については別の項目で扱う）。
  - security: out — 調査では秘密情報を扱わない（理由: 調べる対象はリポジトリ内だけである）。
- 運用:
  - deploy: out — 今回の変更は配布物ではない。
  - migration: out — 既存の `affected.md` を新しい規則に移行しない。
  - logs and monitoring: out — 監視は設けない（理由: 記録は `Research & Trial` に残すだけである）。

### Research & Trial

- 調査は3回に分けて行った。1回目は影響範囲を漏れなく決める方法、2回目はエージェント向けのスキルと方法、3回目は散文形式の決定から検索対象を導く方法である。
- `git grep --fixed-strings '.github/workflows'` は10件のファイルに当たり、そのうち9件は `cycles/` の記録である。残りの1件が `scripts/harness/harness.json` である。
- feature location のサーベイは、方法を textual（VSM、LSI）、dynamic、static、historical、hybrid の5種類に分ける（Dit et al., Journal of Software Maintenance and Evolution, 2011, https://doi.org/10.1002/smr.567）。
- requirements traceability の一般過程は、前処理、類似度によるリンク生成、後処理の3段階である。語彙の不一致は、名詞だけを残すこと、biterm の抽出、中間成果物による補完といった方法で緩和できる（Wang et al., SEKE 2022, https://doi.org/10.18293/seke2022-098）。
- bug localization は、報告をクエリとし、全ファイルを文書として順位付けする。BLUiR は、識別子を分割した語と完全な識別子の両方を索引する（Zhou et al., ICSE 2012, https://doi.org/10.1109/icse.2012.6227210）。
- クエリ拡張は、語彙の不一致を反復により緩和できる（Nie et al., IEEE TSC 2016, https://doi.org/10.1109/tsc.2016.2560165、Lu et al., SANER 2015, https://doi.org/10.1109/saner.2015.7081874）。
- LLM による位置特定には、階層を使う方法とグラフの走査を使う方法がある。前者は Agentless のファイル、要素、行であり、後者は LocAgent の directory/file/class/function のノード、import/invocation/inheritance の辺、方向と深さを指定する `TraverseGraph` である（Xia et al., arXiv 2024, https://arxiv.org/abs/2407.01489、Chen et al., ACL 2025, https://arxiv.org/abs/2503.09089）。
- Deep Research は、下位の問いへの分解、委任、読み取り、カバレッジの振り返り、主張ごとの出典で構成される（OpenAI, 2025, https://openai.com/index/introducing-deep-research/、LangChain deepagents）。
- CodeGraph は、呼ぶ側、呼ばれる側、検査、危険度、確認方法、鮮度を返す（https://github.com/brettmartin97/codegraph）。SCIP と TypeScript Language Service は、宣言、参照、実装を意味的に解釈する（https://github.com/sourcegraph/scip/）。
- Aider の repo map は、tree-sitter と PageRank で重要度を付け、トークン予算で打ち切る（https://aider.chat/docs/repomap.html）。
- `bash` なしで実行できる止め方は、範囲を限定した問いの完了（Claude Code, https://code.claude.com/docs/en/sub-agents）と、深さと追問が尽きること（Deep Research）だけである。予算（Aider）と記号ごとの問い合わせの完了（SCIP、CodeGraph）は、索引の実行が必要である。
- 網羅を証明する様式は、どの系統にも見つからなかった。もっとも近いものは、カバレッジの振り返りと主張ごとの出典である。
- 索引器、AST、LLM、埋め込みを前提にする方法は、`read` と `grep` と `git grep` だけで再現できるという出典がない。
- 日本語の散文の決定から検索語を導く手順を直接評価した研究は見つからなかった。見出しや設定キーを語として扱う方法の定型も見つからなかった。
- 5つの表記と7つの効果は、このプロダクトの判断である。前者は 054 の事例から作り、後者は plan の review の観点（`Stale`、`Checks`、`Files`）から作った。どちらも外部の方法には同じ形が見つからなかった。
- 新しい形と手順で、054-dev のエントリー 01 を 7 回書かせた。形はどの回も書けた。事実だけで、設計は書かれなかった。
- 散文の `Decision` では、5 回とも削除の対象を抜けなかった。`.github/workflows/pullfrog.yml` が `Path` にならず、親ディレクトリの検索も走らない。054 の `Scope` の括弧が「削除は 002 が扱う」と読めるためである。
- `Decision` を `Add` / `Update` / `Drop` の形にし、対象の抽出の指示と辺の規則を足すと、7 回目で 10 パスになり、削除の対象、その親ディレクトリ、`scripts/harness/harness.json`、その `Edge: names .github/workflows` が入った。
- 作業表と辺の規則がなければ、当たりは記録に残らない。検索で当たっても、辺にしなければ関係が読めない。

### Decision

- Status: **accepted**
- Adopted:
  - A: 対象と効果の組み合わせで調べ、当たりから名前を加える反復で補う。
    - Add:
      - 読み: `Context`、`Scope`、`Adopted`、`Definition` をすべて読む。
      - 対象: 決定が操作するものを抜く。`Scope` の `in` の kind ごとに、`Adopted` の文ごとに、操作の動詞（削除する、外す、置き換える、書き換える、足す、加える、そろえる、廃止する、組み替える、移す）を拾い、その目的語を対象にする。1文に複数の操作があれば、動詞ごとに分ける（「A を外し、B を削除する」は2つ）。結果を述べる文（「X は5つの見出しになる」）は、操作（X を書き換える）として扱う。
      - 種類: 名詞をパス、ディレクトリ、見出し、キー、識別子、文字列、文、コマンド、抽象に分ける。
      - 抽象: 抽象の名詞は、エントリーが指定したファイルに固定する（「説明文の粒度」なら `README.md` と `README.ja.md` の本文）。固定できない抽象は、解決できなかった事実として返す。
      - 表記: 名詞を5種類の表記に広げる（完全パス、親ディレクトリ、末尾の要素、識別子、URL の断片）。
      - 範囲: 範囲は常にリポジトリ全体とする。範囲選択の余地を残さない。
      - 手がかり: すべての名前を、まず `git grep` でリポジトリ全体から文字列として探す。パスも例外にしない。`git ls-files` と `find` は、存在するかどうかだけを答える。見出しは `grep '^#\{1,6\} '`、キーは設定ファイルの `grep`、文は対象の文書の `read`、コマンドは `package.json` の `scripts` である。
      - 除外: `cycles/` の記録、`node_modules`、生成物は種類で除外する。件数では除外しない。
      - 判定: 当たりは候補である。当たりを読んでから、記録の項目を決める。文字列の一致をそのまま依存として記録しない。
      - 効果: 対象ごとに7つの効果を1つずつ確かめる（壊れる、指す先を失う、嘘になる、検査しなくなる、生成物に残る、登録が必要である、外部との約束が変わる）。効果ごとに探す手がかりが定まる（壊れるは参照、指す先を失うは値、嘘になるは記述、検査しなくなるは検査、生成物に残るは生成、登録が必要であるは登録、外部との約束が変わるは外部）。
      - 作業表: 対象ごとに、5つの表記の検索結果と7つの効果の答えを1行ずつ埋める。空欄は許さない。空欄があれば、調査は終わっていない。検索のセルは、`ls` や `find` ではなく、`git grep` の結果で埋める。作業表の対象のうちパスであるものは、すべて `Path` にする。`Path` は作業表にないものを増やさない。作業表は報告に入れ、記録には入れない。
      - 辺: 検索のセルで当たったファイルは、その綴りを `names` / `mentions` / `needs` の辺として書く。当たりを辺にしないと、パスはあっても関係が読めない。
      - 反復: 当たりから新しい名前を加える（当たったファイルのパス、親ディレクトリ、識別子、周辺の見出し）。新しい名前が出なくなるまで繰り返す。
      - 停止: 新しい名前が出ず、作業表に空欄がなくなったら終了する。
      - 確認: エージェントは、受け取った作業表のセルを見る。`ls` や `find` だけで埋めたセルがあれば、受け取らない。
      - 確認（対象）: `Scope` の `in` の kind それぞれに、少なくとも1つの操作が対応していることを確かめる。対応しない kind があれば、抽出は終わっていない。対象の一覧は、検索の前に報告に書く。
      - 振り返り: 見た範囲、見なかった範囲とその理由、加えた名前を書く。
      - 記録: 結果は `affected.md` に書く。形はエントリー 02 が定める。
      - 誤り: 答えられなかった問い、導けなかった名詞、止まった理由を事実として返す。
      - 制約: 変更は未適用なので、検査は調査では使わない。調査では索引器、AST、`LLM` も使わない。調査のコストは変更の大きさに比例させ、調査では全件の列挙を行わない。
      - ポリシー: `.pi/extensions/consult/types.json` の `research` の `tools` に `bash` を加える。`bash` は `["git grep", "git ls-files", "git log", "rg"]` とする。書き込みを伴うコマンドと `--run` は含めない。
    - Update:
      - `references/tasks.md` の「Look at the affected」を、上の順序で書き直す。
      - `.pi/skills/adr/SKILL.md` の項目7は、規則と食い違っている1文のみを直す。
      - `.pi/extensions/consult/types.json` の `research` は、`tools` と `bash` の2か所を変更する。
    - Drop:
      - 現行の「How to look」11項目と「What to answer」9項目を削除する（`references/tasks.md:26-48`）。
      - 手順6の検索名に範囲を書かせる形式を削除する（`references/tasks.md:32`）。
      - 手順3から5の前方と後方に分ける言い方を削除する（`references/tasks.md:29-31`）。
- Options:
  - B: 伝播で調査を止める（理由: コードの参照は正確になるが、`harness.json` のようにパスを値で持つ依存には届かない。意味の参照を取るスクリプトも必要になるためである）。

### Definition

- `Unit.adr-skill`(kept): オーナーが決め、エージェントが記録できるという主な機能は変わらない。変わるのは、調査の進め方（対象の導き方、止め方、振り返り）である。
- `Unit.subagent-consult`(kept): サブエージェントのコンサルを実行し、結果を扱えるという主な機能は変わらない。変わるのは、調査役が使える道具（読み取り用の `bash`）である。

## 02: 記録は何を残せば足りるか。落とす情報の役割はどこへ移るか

### Context

- いまの `affected.md` は、パスごとに `Search`、`Adr`、`Direction`、`Relation`、`Role`、`Role change`、`Adjustment` の7項目を持つ。
- 054-dev のエントリー 01 の `affected.md` は213行あり、12のパスについて7項目ずつ書かれていた。
- 01 の手順は、検索の範囲と効果を「作業表」として報告に書いて、記録には残さないと決めたため、`Search` と `Adr` は記録から落ちる。
- `plan` が `affected.md` から読むのは、パス、`Direction`、`Relation`、`Role`、`Role change`、`Adjustment`、`Check`、生成物、`### External` である（`plan/SKILL.md:24,37,40`、`cut.md:11,25`、`format.md:42,107,130`）。
- 01 の手順で書いた 054 のエントリー 01 は、10のパスについて47行で、7項目で書いたときの約4分の1である。
- `Direction`、`Role change`、`Adjustment` は、plan がファイルを読んで決める（エントリー 03）。

### Scope

- 変更:
  - format: in — `affected.md` の形を、パスごとの `- Path:` / `Kind:` / `Edge:` のブロックと、`### External` の `- Name:` / `Kind:` / `Used by:` にする。`Search`、`Adr`、`Direction`、`Relation`、`Role`、`Role change`、`Adjustment` を落とす。外に何もないときは `なし` と書く。
  - refactor: in — `scripts/affected.mjs` の構成と、`scripts/index.test.ts` のアサーションを上の形に変える。
  - prose: in — `references/affected.format.md` の「Shape」「The heading」「The bullets」を、上の形に書き直す。
  - naming: out — `### Code` / `### External` の見出し名は変えない（理由: 見出しは記録の場所の名前であり、項目の名前ではない）。
  - behaviour: out — plan が affected をどう使うかは、エントリー 03 が扱う。
  - dependency: out — 依存パッケージは変えない（理由: 形の変更は、スキルの文書とスクリプトの中だけで閉じる）。
  - compatibility: in — いまのサイクルのエントリー 01 の affected は新しい形に書き直す（理由: 01 の plan を 03 の新しい読み方に合わせるため）。過去のサイクルの affected は書き直さない。
- 品質:
  - errors: in — 事実が分からないときの書き方を決める（`なし` の書き方と、導けなかったものの書き方）。
  - speed: out — 速度は扱わない（理由: 記録の書き換えは、plan が一度だけ行う）。
  - security: out — 秘密情報は扱わない（理由: 記録は、リポジトリの中のパスと名前だけを持つ）。
- 運用:
  - deploy: out — 配布物ではない（理由: スキルの中の文書とスクリプトだからである）。
  - migration: out — 過去の記録は移行しない（理由: 読むのは、同じサイクルの plan だけである）。
  - logs and monitoring: out — 監視は設けない（理由: 記録は plan が読むだけで、実行しない）。

### Research & Trial

- `plan` の各行が読むものは、パス、`Direction`、`Relation`、`Role`、`Role change`、`Adjustment`、`Check`、生成物、`### External` である（`plan/SKILL.md:24,37,40`、`cut.md:11,25`、`format.md:42,107,130`）。
- 新しい形にあるのは、パス、`Kind`（役割）、`Edge`（関係）、`### External` の `Name` / `Kind` / `Used by` である。
- `Direction`、`Role change`、`Adjustment` は新しい形にないため、plan がファイルを読んで決める（エントリー 03）。
- `Check` は `Edge: checks` で表せ、生成物は `Kind: artifact` で表せる。
- `Outside:` の「そこでどうするか」は plan が書き、`Used by:` はその外のものを使うパスを挙げるだけである。
- 新しい `Kind` と `Edge` の種類に、足りないものはない。
- 054 のエントリー 01 を新しい形で書かせた結果は、10のパスについて47行で、従来の213行の約4分の1である。

### Decision

- Status: **accepted**
- Adopted:
  - A: パスごとに `- Path:` / `Kind:` / `Edge:` のブロック、`### External` の `- Name:` / `Kind:` / `Used by:` とする。
    - Add:
      - `Kind`: `module` / `test` / `doc` / `config` / `artifact` / `dir`。
      - `Edge`: `needs`（コードがそのパスを必要とする）/ `names`（設定や文書がそのパスを値や記述として持つ）/ `mentions`（文書がそのパスに言及する）/ `checks`（テストがそのパスを確かめる）/ `contains`（ディレクトリがそのパスを含む）。
      - `### External` の `Kind`: `env` / `contract` / `data` / `path` / `limit`。
      - `Used by`: その外のものを使うパスを挙げる。
      - 外のものがないときは、`### External` の下に `なし` と書く。
      - 導けなかった事実（答えられなかった問い、導けなかった名詞）は、記録に書かず、報告に書く（01 の `誤り`）。記録には、当たらなかったことを `なし` と書く。
    - Update:
      - `references/affected.format.md` の「Shape」「The heading」「The bullets」を、上の形に書き直す。
      - `scripts/affected.mjs` の構成を、上の形に変える。
      - `scripts/index.test.ts` のアサーションを、上の形に変える。
      - いまのサイクルのエントリー 01 の `affected.md` を、上の形に書き直す。
    - Drop:
      - パスごとの `Search`、`Adr`、`Direction`、`Relation`、`Role`、`Role change`、`Adjustment` の7項目を落とす。
      - `#### <パス>` の見出しを落とす。
      - 記録から、検索の範囲と効果の一覧を落とす（01 の作業表に移る）。
- Options:
  - B: `mentions` を `names` に統合する（理由: `names` と `mentions` の使い分けが曖昧で、7回目の試行では README の言及が `names` になっていたが、区別を減らすと文書の言及か設定の値かを `Kind` だけで読むことになるためである）。
  - C: `artifact` をやめて `generates` の `Edge` にする（理由: 生成物自身の行がなくなると、plan が生成物を一覧するときに辺をたどる必要があるためである）。

### Definition

- `Unit.adr-skill`(kept): オーナーが決め、エージェントが記録できるという主な機能は変わらない。変わるのは、記録の形（項目と行数）である。
- `Unit.plan-skill`(kept): plan が、1 plan 分の作業の形と順序を決めて書けるという主な機能は変わらない。変わるのは、入力の読み方（`Kind` と `Edge`）である。

## 03: plan は affected と実ファイルの読みをどう分担するか

### Context

- plan の6つの行が、02 で落とした `Direction`、`Role change`、`Adjustment` を読んでいる（`SKILL.md:24,28,37,40`、`cut.md:25`、`format.md:107`）。
- いまの plan は、affected が変更の形を決めていることを前提にしている。`Files` は affected の `Direction` を写し、`Steps` は `Role change` と `Adjustment` を写す（`SKILL.md:37,40`）。
- 02 のあと、affected は事実の地図である（パス、`Kind`、`Edge`、`### External`）。変更の形は、plan が組み立てる。
- オーナーは、plan が ADR の要望と地図にある関係をもとに実装を再構築し、4つのリファクタの問いをかならず当てると決めた。
- `SKILL.md:24` の「the affected is the walk of the relations, so the plan does not walk them again」は、意味が逆になる。plan が関係をたどり、ファイルを読む。

### Scope

- 変更:
  - behaviour: in — plan は、地図にある全パスと、それらの周辺にある関連ファイルを読んで、4つのリファクタの問いを当てる。その答えから `Files` の印と `Steps` を決める。
  - format: in — plan md に `## Design` を `## Files` の前に置く。`Inside` は `Modules` と `Dirs` を持ち、`Outside` は `Extract` と `Colocate` を持ち、各項目に答えと、その理由を書く。
  - prose: in — `plan/SKILL.md` の 2 と 4、`plan/references/cut.md` の 25、`plan/references/format.md` の 42 と 107 と 130 と 156、`plan/references/tasks.md` の review の `Goal` を書き直す。
  - naming: in — 語彙を `Kind` と `Edge` に揃える。
  - refactor: out — スクリプトは変えない（理由: plan は文書と手順だけを持つ）。
  - dependency: out — 依存パッケージは変えない（理由: 手順の書き換えだけである）。
  - compatibility: out — 過去のサイクルの plan は書き直さない（理由: 読むのは、そのサイクルの work だけである）。
- 品質:
  - errors: in — 4つの問いに答えられないとき（スコープの境界が決まらないとき）の扱いを、そのときの規則（hole）に合わせる。
  - speed: out — 速度は扱わない（理由: plan の読みは、1つの plan につき一度だけである）。
  - security: out — 秘密情報は扱わない（理由: 読むのはリポジトリの中だけである）。
- 運用:
  - deploy: out — 配布物ではない（理由: スキルの中の文書のためである）。
  - migration: out — 過去の plan は移行しない（理由: plan は work が読む一時的な文書である）。
  - logs and monitoring: out — 監視は設けない（理由: plan は読まれるだけで、実行されない）。

### Research & Trial

- `Direction`、`Role change`、`Adjustment` を読む行は、`SKILL.md:24,28,37,40`、`cut.md:25`、`format.md:107` の6つの行である。
- `Kind` と `Edge` で書き直せるのは、`Edge: checks` を `Verify` に、`Kind: artifact` を成果物にする部分である。
- 書き直せない `Direction`、`Role change`、`Adjustment` の部分は、plan がファイルを読んで決める。
- `Files` の印の旧規則は、affected の `Direction` に基づいていた（`SKILL.md:37-38`、`format.md:104-107,131`）。新しい形に `Direction` はない。
- `Why` の旧規則は、affected の `Role change` と `Adjustment` を読んでいた（`SKILL.md:28`、`cut.md:25`）。新しい形に両方ともない。
- `Verify` は `Edge: checks` で表せる。`format.md:157-163` の `Always` と `Added` は、そのまま使える。
- `Outside:` は `### External` の `Name` で項目を指す。その項目でどうするかは plan が書く（`format.md:42,130`）。
- `A boundary with no answer is a hole`（`SKILL.md:44`、`format.md:105,172`）は、plan の `research` と `Stopped`（`SKILL.md:46-52`、`format.md:198`）で扱う。新しい分担でも、その規則は残る。
- 01 と 02 の決定に反する記述は、上の6つの行である。

### Decision

- Status: **accepted**
- Adopted:
  - A: plan は、地図にある全パスと、それらの周辺にある関連ファイルを読んで、4つのリファクタの問いを当てる。その答えから設計を組み立て、`## Files` と `## Slices` に書く。答えと、その理由は `## Design` に、4つの問いの名前で書く。
    - Add:
      - `## Design` を `## Files` の前に置く。`Inside` は `Modules`（問い 1）と `Dirs`（問い 2）を持ち、`Outside` は `Extract`（問い 3）と `Colocate`（問い 4）を持つ。各項目に、答えと、なぜその形なのかの証左を書く。`なし` の場合でも4項目を書く。
      - スキル本文の手順 4 に、4つの問いを明示する。
      - plan は、地図にある全パスと、それらの周辺にある関連ファイルを読む。
      - 問い 3 と 4 の対象は、ADR の `Scope` を越えても `Files` に入れる。理由を `Design` に書く。
    - Update:
      - `SKILL.md:24` の地図の説明を、パス、`Kind`、`Edge`、`### External` に変え、「関係をたどらない」を消す。
      - `SKILL.md:28` と `cut.md:25` の `Why` を、`Kind` と `Edge` から書く形に変える。
      - `SKILL.md:37` と `format.md:107` の `Files` を、plan が読んで決める形に変える。
      - `SKILL.md:40` の対応を、`Edge: checks` は `Verify` に、`Kind: artifact` は成果物に、`### External` は `Outside:` に変える。
      - `format.md:156` の「`Scope` を越えた step は書かない」を、問い 3 と 4 の対象は越えても書く形に変える。
      - `tasks.md` の review の `Goal` を、`Design` の答えと `Scope` を読む形に変える。
    - Drop:
      - `Direction`、`Role change`、`Adjustment` を読む6つの行を落とす。
      - 「the plan does not walk the relations again」を落とす。
- Options:
  - B: 4つの答えを `Why` にまとめる（理由: `Why` は cut の前に提示するので、4つの答えは後から追記になり、読む順序が崩れるためである）。
  - C: 4つの答えを `Notes` に置く（理由: `Notes` は作業の記録なので、plan を書く前の設計がそこに混ざるためである）。

### Definition

- `Unit.plan-skill`(kept): plan が、1 plan 分の作業の形と順序を決めて書けるという主な機能は変わらない。変わるのは、読み方と設計の仕方（4つの問いと `## Design`）である。

## 04: adr は選択肢をどう提示するか

### Context

- いまの選択肢は、散文である。「何を得て、何をコストし、どこで成り立たないか」を書く（`SKILL.md:87`）。
- 散文の選択肢は、何を変えて、何を変えないかの境目を隠す。7回の実験では、散文の `Decision` が削除を括弧の中に隠し、型の `Adopted` が削除を `Drop` としてはっきり示した。
- 3つの操作（`Add` / `Update` / `Drop`）だけでは、**変えないもの**が書けない。誤読は、まさに「削除する」と「002 が扱う（触らない）」の境目で起きた。
- 選択肢の相対評価（どの選択肢が、何において高いか）を選択肢の側に置くと、比較が1か所に集まる。
- チャットで提示する形と、`adr.md` に書く形は別々である。前者の規則はスキルに、後者の規則は `adr.format.md` に置く（`plan` の `cut.md` の `## Present` と同じ役割）。

### Scope

- 変更:
  - format: in — `adr.md` の `Decision` の `Adopted` を、`<A>: <説明>` の下に `Add` / `Update` / `Drop` / `Keep` / `Cost` を持つ形にする。`Options` を `<A>: <説明> - <採用しなかった理由>` にする。
  - prose: in — `references/options.md` を新しく置き、チャットでの提示の形（`## Option <A>` と `Add` / `Update` / `Drop` / `Keep` / `Cost`）と規則を書く。`adr/SKILL.md` の 3 と 4 と 6 を、その文書を指す形に書き直す。
  - refactor: in — `scripts/adr.mjs` の骨組みと、`scripts/index.test.ts` のアサーションを新しい形に変える。
  - naming: in — 選択肢の名前を A、B、C の順に付ける規則を決める。
  - behaviour: in — チャットでの提示は、型（説明と4つの操作と `Cost`）による。
  - compatibility: out — 過去のサイクルの ADR は書き直さない（理由: 読むのは、そのサイクルの plan だけである）。
  - dependency: out — 依存パッケージは変えない（理由: 記録と手順を書き換えるだけである）。
- 品質:
  - errors: in — `Add` / `Update` / `Drop` / `Keep` に何もないときの書き方（`なし`）。
  - speed: out — 速度は扱わない（理由: 記録の書き方は、判断の速さに影響しない）。
  - security: out — 秘密情報は扱わない（理由: 判断を記録するだけである）。
- 運用:
  - deploy: out — 配布物ではない（理由: スキルの中の文書であるため）。
  - migration: out — 過去の ADR は移行しない（理由: 読むのは、そのサイクルの plan だけである）。
  - logs and monitoring: out — 監視は設けない（理由: 記録は読まれるだけで、実行されない）。

### Research & Trial

- 散文の選択肢の規則は、「何を得て、何をコストし、どこで成り立たないか」を書くことである（`SKILL.md:87`）。
- 7回の実験では、散文の `Decision` が `.github/workflows/pullfrog.yml` の削除を括弧の中に隠し、調査では「002 が扱う」と読んだ。型の `Adopted` の `Drop` に書き換えると、削除がはっきり見えた。
- 4つの操作（`Add` / `Update` / `Drop` / `Keep`）は、増える、変わる、消える、触らないを網羅する。外部との契約の変化は `Update` に、費用と危険は `Cost` に入れる。
- `adr.md` の `Decision` の骨組みは、`Adopted: <採用した形>` と `Options: <案>（採用しなかった理由）` である（`adr.mjs:29-35`）。
- チャットでの提示の形は、`plan` の `cut.md` の `## Present` が先例である。提示の形は記録の形（`adr.format.md`）とは別のファイルに置く。

### Decision

- Status: **accepted**
- Adopted:
  - A: 選択肢を説明と `Add` / `Update` / `Drop` / `Keep` / `Cost` で提示する。チャットでの提示は `references/options.md` の型で、`adr.md` は `adr.format.md` の形で書く。
    - Add:
      - `references/options.md`に、チャットでの提示の型（`## Option <A>` と `### Add` / `### Update` / `### Drop` / `### Keep` / `### Cost`）と A / B / C の順、`なし` の書き方、`Cost` の相対評価の規則を書く。
      - 4つの操作の意味を定める。`Add` は増えるもの、`Update` は変わるもの、`Drop` は消えるもの、`Keep` は触らないもの（理由をつける）。`Cost` は他の選択肢との相対評価である。
    - Update:
      - `adr.format.md` の `Decision` の `Adopted` を、`<A>: <説明>` の下に `Add` / `Update` / `Drop` / `Keep` / `Cost` を持つ形にする。
      - `adr.format.md` の `Options` を、`<A>: <説明> - <採用しなかった理由>` にする。
      - `adr/SKILL.md` の 3（Options）、4（Discussion）、6（Write）を、`references/options.md` を指す形に書き直す。
      - `scripts/adr.mjs` の骨組みと、`scripts/index.test.ts` のアサーションを新しい形に変える。
    - Drop:
      - 「何を得て、何をコストし、どこで成り立たないか」を散文で書く形をやめる。
      - `Adopted` の `- <採用した形>` と `Options` の `- <案>（理由）` という型のない骨組みをやめる。
- Options:
  - B: `Keep` を置かない（理由: `Keep` を置かないと、削除と「触らない」の境目が、また隠れるためである）。
  - C: `Cost` を選択肢の外（`Discussion`）に置く（理由: 相対評価が選択肢の側にないと、選択肢を並べても比較が読み取れず、後から別の場所との照合が必要になるためである）。

### Definition

- `Unit.adr-skill`(kept): オーナーが決め、エージェントが記録できるという主な機能は変わらない。変わるのは、選択肢の提示と記録の形である。

## 05: plan の step は、何を1つとし、1行で何を書くか

### Context

- いまのステップは「1ステップは1ファイル」で、「何をどうするかを書く1文」である（`format.md:129-132`、`SKILL.md:38`）。
- 03 の4つの問いは、ファイル内のモジュールとディレクトリを対象にする。どちらも1つのファイルではない。
- 03 の4つの問いの答えが、`## Files` と `## Slices` に現れる。だが、その結果をステップに落とす形が決まっていない。
- テストのステップは `(happy|error|empty|boundary) <given> → <result>` の形で、何がどうなるかを行から読める。コードと文書のステップは「1文を書く形」で、何がどうなるかを読めないことがある。
- サブエージェントは、plan を読み、plan だけで作業する（`SKILL.md:8`、`format.md:97`）。`base` の plan では、エージェントは自分が決めたことを知っている。`worktree` の plan では、文だけでは関数のロジック、モジュールの種類、文書の文言、フォーマットがコード作業に伝わらないことが多い。

### Scope

- 変更:
  - format: in — ステップの単位を「1つのもの」にし、1行を「何がどうなるか」にし、ADR かチャットが具体的に決めた中身をフェンスに持たせる。
  - prose: in — `format.md` の `## Slices` と `### Steps` の規則と `## Shape` の例と、`plan/SKILL.md` の 4（`Files` と `Steps` の説明）を書き直す。
  - behaviour: in — plan は、ADR かチャットが具体的に決めた中身をフェンスにそのまま書く。
  - naming: in — ステップの単位の名前（ファイル、モジュール、ディレクトリ）を決める。
  - errors: in — 中身が決まっていないときの書き方（文だけにするか、`research` と `Stopped` に回すか）を決める。
  - refactor: out — 変えるスクリプトはない（理由: plan は文書と手順だけを持つ）。
  - dependency: out — 依存パッケージは変えない（理由: 手順の書き換えだけである）。
  - compatibility: out — 過去のサイクルの plan は書き直さない（理由: 読むのは、そのサイクルの work だけである）。
- 品質:
  - speed: out — 速度は扱わない（理由: plan は一度だけ書かれる）。
  - security: out — 秘密情報は扱わない（理由: 読むのはリポジトリの中だけである）。
- 運用:
  - deploy: out — 配布物ではない（理由: スキルの中の文書だからである）。
  - migration: out — 過去の plan は移行しない（理由: plan は work が読む一時的な文書である）。
  - logs and monitoring: out — 監視は設けない（理由: plan は読まれるだけで、実行されない）。

### Research & Trial

- `format.md:129` は「One step is one file」とし、`format.md:130-132` はコードと文書を「1文」とし、テストを `(happy|error|empty|boundary) <given> → <result>` とする。
- `SKILL.md:38` は「One step is one file」と `add:` / `update:` / `drop:` の接頭辞を定める。
- `format.md:97` と `SKILL.md:8` は、サブエージェントが plan を読み、plan だけで作業すると定める。
- 03 の4つの問いは、ファイル内のモジュールとディレクトリを対象にする。
- 03 の `## Design` は、統合・分割・移動・共通化・コロケーションの答えと、その理由を持つ。

### Decision

- Status: **accepted**
- Adopted:
  - A: plan は、ステップの単位をファイル、モジュール、ディレクトリとする。1行で「何がどうなるか」を書き、ADR かチャットが具体的に決めた中身はステップの子のフェンスに書く。
    - Add:
      - 単位: ファイル、モジュール（`<path>#<module>`）、およびディレクトリ。ディレクトリは、空のディレクトリを作るときと、最後のファイルを消してディレクトリを残す場合に限る。
      - 1行の形: `<prefix>: <何がどうなるか。1文>`。モジュールのステップの接頭辞は、そのモジュールの動きを表し、ファイルの `Files` の印とは別でもかまわない。
      - フェンス: 単位にかかわらず、ステップの子に置く。ADR かチャットが中身を具体的に決めた場合にだけ書く。フェンスの言語は `ts`、`md`、`json` などとし、中身は決まったとおりにそのまま書く。中身には markdown もコードも含む。テストのステップはケースの行を残し、決まった中身があればケースの行の下にフェンスを置く。
      - `Outside:` は、ステップの子に置き、1行の後、フェンスの前という位置を変えない。
      - ステップの順序と番号は、作業の順序のままとする。
    - Update:
      - `format.md` の `## Slices` と `### Steps` の規則と、`## Shape` の例を上の形に変える。
      - `SKILL.md:38` の「One step is one file」と「1文」の規則を上の形に変える。
      - ツリー内のディレクトリの行に、空のディレクトリと残すディレクトリの印（`add` / `drop`）を付けられるようにする。
    - Drop:
      - 「1 step = 1 file」を単位の規則とすることをやめる。
      - 「1文」だけを書く形をやめる。
- Options:
  - B: フェンスをステップの後ろの独立したブロック（`#### <ファイル>`）に置く（理由: インデントは浅いが、ステップとフェンスの対応が見出しの名前だけになるためである）。
  - C: フェンスを plan の末尾の `## Contents` に置き、ステップから参照する（理由: ステップは短いが、サブエージェントはステップを読んでから末尾へ飛ぶことになり、読む順序がステップの順と一致しないためである）。
  - D: ディレクトリを常にステップの単位にする（理由: 空のディレクトリ以外は、ファイルの `drop:` や `add:` と重複するためである）。

### Definition

- `Unit.plan-skill`(kept): plan が、1 plan 分の作業の形と順序を決めて書けるという主な機能は変わらない。変わるのは、ステップの単位とフェンスで中身を渡す形である。
