# ADR 029

## 01: スコープの内外を、どこで確定し、どこに残すか

### Context

- 変更の目的はゴールとして議論しやすいが、何が今回の範囲の内で何が外かは、観点が無いと決まらない。
- `brief` と `propose` はオプションを並べるが、内外を並べて合意する工程を持たない。
- ADR の見出しは `Context` / `Decision` / `Research & Trial` / `Definition Change` の 4 つで、内外の節が無い。
- `design` の `Scope` は、プランが変える定義の名前の一覧である。ADR に同名の節を足すと衝突する。
- owner の求めは、序盤に内外を並べて明示的に合意し、決めたことを ADR に残すことである。

### Decision

- Status: **accepted**
- Adopted:
  - ADR にエントリーごとの `### Scope` を置き、内と外を並べる。ADR は 1 エントリー 1 問いなので、内外も問いごとに違う。
  - `brief` の手順 1 の直後に、内外の一覧を確定する工程を置く。
  - `propose` から入る場合は、候補ごとに同じ一覧を持つ。
  - 軸は変更 / 品質 / 運用の 3 分類。
  - 外の行は理由を持つ。再訪条件は要る行にだけ添える。
  - 深さの 3 段階（`Out of MVP` / `Out for foreseeable future` / `Out forever`）は、エントリーごとに使うか選ぶ。
  - `design` の `Scope` は、定義の名前の一覧をやめる。新しい意味と名前は 05 が決める。
- Options:
  - `Context` に「内」「外」の行群として書く（節が増えず ADR の型から外れないが、外の行が文章に埋もれ、サイクルの後半で探しにくい）。
  - サイクルの外に台帳を置き、サイクルをまたいで書き足す（書き直しは減るが、サイクルごとの判断が残らず、範囲が毎回違う場合に効かない）。

### Research & Trial

- 設計文書は冒頭でスコープを定義し、`Context and scope` → `Goals and non-goals` の順に置く（`developers.google.com/tech-writing/one/documents`、`industrialempathy.com/posts/design-docs-at-google`）。
- non-goal はゴールの否定ではなく、ゴールになり得たが選ばなかったものである。`ACID 準拠` のような行が例になる（`industrialempathy.com/posts/design-docs-at-google`）。
- 外の行は決定・理由・再訪条件の 3 点で書く。理由の無い「スコープ外」は何も伝えない（`nirmitmeher.com/blog/non-goals-prd`）。
- 外の深さを `Out of MVP` / `Out for foreseeable future` / `Out forever` の 3 段階に分ける PRD テンプレートがある（`github.com/incubyte/ai-plugins`）。
- MADR と YADR のテンプレートにスコープの専用節は無く、`Context` / `Decision` / `Consequences` で書く（`adr.github.io/madr`、`github.com/adr/yadr`）。
- 要求の分類は BABOK の 4 分類（Business / Stakeholder / Solution / Transition）、品質は ISO/IEC 25010 の 8 特性（2023 年版は 9）。どちらも作業の種類を分ける軸ではない（`techcanvass.com`、`tmap.net`）。
- スコープの内外と完了の条件は別物として扱われる（PMBOK の scope statement に deliverables と exclusions と acceptance criteria が並ぶ、`pmstudycircle.com`）。
- 公式の承認の無い膨張を scope creep、承認と変更管理を伴うものを scope change と呼び分ける（`asana.com`）。

### Definition

- `Unit.brief-skill`(kept): 内外の一覧を確定する工程が増えるが、主たる機能「要件を調べ、詰めて、ADR に渡す」は変わらない。
- `Unit.propose-skill`(kept): 候補に内外が付くが、主たる機能「次の議題を提案する」は変わらない。
- `Unit.adr-skill`(kept): `Scope` の節が増えるが、主たる機能「決めるべきことを決めて記録する」は変わらない。
- `Unit.design-skill`(kept): 欄の名前と呼び方が変わるが、主たる機能「サイクルを plan に切る材料を調べ、切り方を決める」は変わらない。
- `Unit.plan-skill`(kept): design の欄を読む側の名前が変わるだけ。
- `Unit.close-skill`(kept): design の欄を読む側の名前が変わるだけ。

## 02: `Boundary` に何を書くか

### Context

- `design` の `Boundary` は「プランの縁」で、`Plans`（他のプランとの接点）と `External`（外の世界との接点）を持つ。design スキルを足した `c2b432d` から変わっていない。
- 当時のカットの規則は `the same boundary` を材料に数えていたが、いまの `## Cut` からその一文が消えている。
- 設計のリサーチはリポジトリーの中のパスしか挙げないので、外の接点は調べられていない。何を書くかは推測になり、実物では行が 2 つしか出ない。
- owner の見立ては、git、ランタイム、デプロイ先とその設定、使うパッケージとライブラリーが、プロダクトがその上に立っている土台だというものである。
- 土台は変えられるが、変えるのはデザインの話ではない。
- `DEFINITION.md` の `Stack` は、Ground / Checks / Agent の group と role で土台を既に並べている。

### Decision

- Status: **accepted**
- Adopted:
  - `External` は、この変更が話す、リポジトリーの外のものを書く。相手の名前と、そこで何をするか、その前提。
  - 中身は設計のリサーチが返したものだけを書く。推測で埋めない。
  - 子は `Env` / `Contract` / `Data` / `Path` / `Limit`。`Version` は落とす。
  - 版は設計に書かない。読むのは `package.json`。
  - `DEFINITION.md` の `Stack` に版の列は足さない。
  - 外の接点を共有するエントリーは、1 つのプランに入れる。カットの材料に戻す。
- Options:
  - `External` を土台の 4 行（git、ランタイム、デプロイ先と設定、パッケージとライブラリー）に固定する（外部サービスを足す変更が入らず、呼称を裏付ける一次資料も無い）。
  - 今の形を残す（何を書くかの判断が毎回残り、書いていないことに誰も気づけない）。

### Research & Trial

- 外部依存は「サービスの制御外にありながら動作に必要で、侵害や停止が影響するもの。開発者の制御外で、配備者の制御内か第三者運用」と定義される（`docs.openstack.org/security-guide/security-review/architecture-page-guidance.html`）。
- C4 のコンテキスト図は人と外部のソフトウェアシステムを描き、技術とプロトコルは描かない。所有と責任のあるものは内側のコンテナに入る（`c4model.com/diagrams/system-context`）。
- arc42 は業務の文脈と技術の文脈を分け、配備を別の節に置き、外部依存とインターフェースをアーキテクチャ上重要な決定として記録する（`docs.arc42.org/section-3`、`docs.arc42.org/section-9`）。
- 12-factor はリポジトリー・依存・バックアップサービス・設定を別の要素として扱い、依存は宣言の manifest に完全かつ正確に書く（`12factor.net/dependencies`）。
- 版は宣言元に置く。コンテナはダイジェスト、Terraform は `required_version`、Node は lockfile と `npm ci`（`cheatsheetseries.owasp.org/cheatsheets/NodeJS_Docker_Cheat_Sheet.html`、`developer.hashicorp.com/terraform/language/block/terraform`）。
- アーキテクチャレビューのチェックリストは、技術の選択が名前と版まで具体であること、依存が状態付きで追跡されていること、すべての外部連携が文書化されていること、版が固定されていること、ライセンスが確認されていることを見る（`archstandard.org/v1/guidance/review-checklist/`、`digital-land.github.io/.../architecture-checklist/`）。
- 依存を 1 つの台帳に持つ形は SBOM で、名前・版・識別子・ハッシュ・ライセンス・関係を持つ（`docs.npmjs.com/cli/v12/commands/npm-sbom/`、`pnpm.io/cli/sbom`）。
- 変更ごとの欄と台帳を同一の尺度で比べた一次資料は見つかっていない。

### Definition

- `Unit.design-skill`(kept): `Boundary` の書き方が変わるが、主たる機能「サイクルを plan に切る材料を調べ、切り方を決める」は変わらない。
- `Unit.plan-skill`(kept): `Outside` の行が指す項目の形が変わるだけ。

## 03: 設計のレビューをどう組むか

### Context

- `plan` のレビューは、`review` サブエージェント 1 体が各スライスの `Verify` だけを読み、「その検査でそのスライスを閉じられるか」を 4 つの型で判定する。
- `design` にはレビューの工程が無く、切った結果はオーナーが初めて読む。
- 設計レビューはコードや検査のレビューとは別の技能を要する、という実験報告がある。

### Decision

- Status: **accepted**
- Adopted:
  - `design.md` を書き終え、オーナーに見せる前に、`review` サブエージェント 1 体を走らせる。
  - 観点は 7 つ。要求との対応、代替案、境界と依存、配備、検査可能性、利害関係者、覆い。
  - 覆いは、`## Possibly related files` の追随のパスが `Paths` にあり、`Paths` に主体でも追随でもないパスが無いことを見る。
  - 各観点に「指摘なし」か「指摘」を書かせる。
  - 1 往復で終える。指摘の扱いはオーナーへの報告に書く。
- Options:
  - 判定型（プランと同じ 4 つの型で判定する。型に落ちない指摘が落ち、設計そのものの妥当性を見ない）。
  - 段階型（変更の大きさで 3 段階に分ける。段階の線引きが恣意的になる）。

### Research & Trial

- ATAM は 3〜4 日と訓練された評価チームを要し、出力はリスクと非リスクとリスクの主題である（`sei.cmu.edu/library/architecture-tradeoff-analysis-method-collection/`）。
- 査察は査読者を「先行文書の著者、この成果物の上に次の仕事をする人、同僚、この成果物が接する部分の責任者」から選び、会議は 2 時間までで、60〜90% の欠陥を除く（`swehb.nasa.gov`）。
- arc42 は品質目標・シナリオ・解決の型・リスクの表で設計を評価する（`docs.arc42.org/tips/10-8`）。
- Google の設計文書は往復を前提にし、大きな変更が要らないと確信できるまでレビューを続ける（`industrialempathy.com/posts/design-docs-at-google/`）。
- Gerrit は結論を出す変更を 10 日開き、有意な変更で承認票をリセットする（`gerrit-review.googlesource.com/Documentation/dev-design-docs.html`）。
- Chromium は 1 人月を設計文書の要否の目安にし、技術リードの承認を必須にする（`github.com/react/react-native-devtools-frontend/docs/contributing/design.md`）。
- 低リスクの仕事まで審査すると摩擦が生まれ、チームが関わらなくなる。段階を 3 つに分ける実例がある（`phenomsec.com`）。
- 設計レビューとコードレビューでは要する技能が違う（`doi.org/10.1145/1414004.1414079`）。

### Definition

- `Unit.design-skill`(kept): レビューの工程が増えるが、主たる機能「サイクルを plan に切る材料を調べ、切り方を決める」は変わらない。

## 04: 設計のリサーチに何を挙げさせるか

### Context

- `design` の手順 2 は、accepted のエントリーごとに `research` サブエージェントを 1 体走らせ、変更が触るパスを挙げさせる。
- このリサーチの意図はカットである。どのエントリーが同じパスを触るかを見て、1 つのプランに入れるか、順序を付けるかを決める。だから要るのは、影響される側（一緒に変えないといけないもの）で、この変更が読むものではない。
- 依頼は 5 分類（読む / 読まれる / 検査する / 生成される / 文書）で、1 エントリーあたり 50 件を超える。
- カットに効く情報は「2 つのエントリーが同じパスを触っていること」で、件数が増えるほど薄まる。
- owner は、関係ファイルを全部列挙すること自体は良いと見ている。
- このサイクルのリサーチで、過去の `design.md` 11 本が「生成されるもの」として返ってきた。履歴で、変える対象ではない。

### Decision

- Status: **accepted**
- Adopted:
  - 4 分類にする。この変更を読むもの（逆依存）、検査するもの、生成されるもの、話す外のもの（相手、契約、環境、データ、上限）。
  - 「この変更が読むもの」は落とす。変える必要が無いので、カットの判断に効かない。プランは `Files` を書くときに自分で関係を洗う。
  - 生成物・ベンダー・ビルド成果物・`.gitignore` の対象を除く。
  - `cycles/` の下を除く。
  - 推移は 1 段まで。
- Options:
  - 分類を残し、除外と深さだけ足す（分類の広さが残り、「読まれる」と「文書」が同じ重さで並ぶ）。
  - 2 分類に削る（文書の追随が見えなくなり、文書を主に変えるサイクルに効かない）。
  - 機械で出す（このリポジトリーに依存グラフの道具が無く、共変更は新しいファイルを作る変更を説明しない）。

### Research & Trial

- 影響分析は逆依存をたどり、深さの既定は 1 である。深くするほど網羅は上がるが、確信度が下がりノイズが増える（`vantagecraft.dev/docs/code-graph/guide`、`glama.ai/mcp/servers/.../analyze_change_impact`）。
- 影響分析は精度と再現率のトレードオフとして論じられる。偽陰性は損失に直結し、偽陽性と偽陰性の両方が多い手法は実務で使いにくい（`dsc.ufcg.edu.br/~jarthur/upload/publications/On_the_precision_and_accuracy_of_impact_analysis_techniques.pdf`、`dl.acm.org/doi/10.1109/CSMR.2010.48`）。
- 共変更は `git log --name-only` でファイルの組を数え、最低回数と最低割合で足切りする（`github.com/eev25/analyzing-logical-coupling`、`repowise.dev/blog/guides/hidden-coupling-co-change-detection`）。
- 生成物・ベンダー・ビルド成果物の除外は定番である。意味のある対象ではないものが数字を歪める（`candid.tools/docs/reference/file-exclusions`、`adopilot.dev/docs/configuring/file-exclusions`）。
- 分割の規範は「独立にビルド・試験・マージできるか」「トランクに統合され全試験が通り配備できるか」「INVEST の独立性」に分散している（`devobs.io/articles/small-pull-request-dependency-stacks/`、`beyond.minimumcd.org/docs/foundations/work-decomposition/`、`agilealliance.org/glossary/invest/`）。
- 設計の段階でファイル一覧を出すことの効能と害を切り分けた測定は見つかっていない。

### Definition

- `Unit.design-skill`(kept): リサーチの依頼と除外の規則が変わるが、主たる機能は変わらない。

## 05: 作業の軸を、定義の行から何に変えるか

### Context

- いまの流れは、エントリーが動かす定義の行を、作業の同一性にしている。`design` は「動く行」を読み、リサーチには「変えるユニット」を渡し、プランの `Scope` は「変える定義の名前」で、`close` はその名前を手がかりに穴を探す。
- 定義の行が動かない変更は、行き場を失う。このサイクルの 4 エントリーがその例で、6 つのユニットの手順と検査を変えるのに、行は 1 つも動かない。
- `definition/rules.md` は、ユニットを「`Who` が名指しして使うもの」と定めるが、行が何を指すか（主たる機能か、経路か、検査か）を書いていない。
- 私はこのサイクルで、行に経路と検査の変更を書き込もうとし、owner に全て却下された。規則に書かれていない以上、行が何を指すかは、その場の判断になっていた。

### Decision

- Status: **accepted**
- Adopted:
  - ユニットの行は、主たる機能の説明とする。
  - 機能を得るための経路（手順、コマンド、設定、ファイルの並び）と、機能を担保する検査（lint、型、テスト、hook）は、行に入らない。それらが変わっても行は動かない。
  - ADR のエントリーは、`DEFINITION.md` から関連する定義の部分を選び、それぞれが「変わる」か「そのまま」かを理由付きで書く。軸は定義の部分である。
  - ADR の `Definition Change` の節を `Definition` に改める。
  - 操作に `(kept)` を足す。値は、行が動かない理由とする。
  - `なし` と、値の無い `(updated)` を消す。関係する部分は必ずあり、行が動かない場合は `(kept)` で書く。
  - エントリーは、関係する定義の部分（`Unit` / `Who` / `Stack` / `What`）を挙げ、それぞれが変わるかそのままかを理由付きで書く。どれも関わらない、という書き方はしない。
  - `adr/SKILL.md` の手順 5 を、「動く行を決める」から「関係する部分を挙げ、変わるかそのままかを決める」に書き直す。`adr/references/format.md` も同じ形にする。
  - デザインのプランの欄は、ADR をまとめたり分けたりした後の「何をするか」のダイジェストとする。名前を `Summary` に改める。
- Options:
  - いまのまま（定義の行が作業の同一性になる。行が動かない変更は行き場が無く、空の欄に意味を持たせることになる）。
  - ユニットの行に経路と検査を書き足す（行が実装の説明になり、`Who` の側の言葉でなくなる）。

### Research & Trial

- `definition/rules.md` は、ユニットの行を「`<Who>` が、xxx する」と定めるが、経路と検査についての記述を持たない。
- `design/SKILL.md` の手順 2 は、リサーチの依頼に「そのエントリーが変えるユニット」を渡す。
- `design/references/format.md` は、プランの `Scope` を「そのプランが変える定義の名前」と定める。
- `close/SKILL.md:30` は、どのプランの `Files` も `Scope` も運んでいない変更を穴とする。
- `close/scripts/collect.mjs` は、`design.md` の `### Scope` を読み、`ADR <NN> / Scope <名前>` の見出しを作る。
- `adr/scripts/scaffold.mjs` は、エントリーの骨として `Definition Change` の節を出す。
- このサイクルは、6 つのユニットの手順と検査を変え、行を 1 つも動かさない。

### Definition

- `Unit.definition-rules`(kept): ユニットの行が何を指すかの規則が増えるが、主たる機能「絵の書き方の規則を読める」は変わらない。
- `Unit.adr-skill`(kept): 節の名前と軸が変わるが、主たる機能「決めるべきことを決めて記録する」は変わらない。
- `Unit.design-skill`(kept): プランの欄の意味と名前が変わるが、主たる機能「サイクルを plan に切る材料を調べ、切り方を決める」は変わらない。
- `Unit.plan-skill`(kept): design の欄を読む側が変わるだけ。
- `Unit.close-skill`(kept): 穴の探し方と見出しが変わるが、主たる機能「サイクル終了後に、クロージングできる」は変わらない。
