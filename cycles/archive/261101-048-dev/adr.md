# ADR 048

## 01: `Users can do` を、どんな形で束ねるか

### Context

- `ROADMAP.md:15` の `011` は「DEFINITIONの調整」で、`status` は `wip` である。
- `DEFINITION.md:22-44` の `Users can do` は、23 の Unit がフラットに 1 列で並ぶ。
- `rules/definition.format.md:67` と `:75` は「1 行 1 Unit」を定め、`rules/definition.rules.md:9-20` は Unit の 6 つの試験を定める。
- owner は、`Users can do` を最大 2 階層に構造化したい。軸は種類分けの具体名ではなく、別の軸にする。extension と skill は少なくとも 1 階層にする。
- 同時に `rules/definition.rules.md` に、階層化する条件と考え方を入れたい。
- `DEFINITION.md` と `rules/` はプロダクトのために存在し、このスターターはハーネスをプロダクトと見なして借りて使っている。だからハーネス固有の話はルールに持ち込まない。

### Scope

- 変更:
  - behaviour: out — 実行時の挙動を持たない。`DEFINITION.md` は文書であり、Unit の主機能も動かない。
  - refactor: out — `Users can do` の置き場所（`DEFINITION.md` の `### Users can do`）と、`rules/` のファイルの分け方を変えない。
  - dependency: out — パッケージを足さない。
  - naming: in — 階層の親を何と呼ぶか（Unit か、Unit でない見出しか）と、Unit 名を変えるかを決める。
  - format: in — `Users can do` を最大 2 階層に組み、`rules/definition.format.md` の雛形（`:33-36`）と `## Sections`（`:67`）を決めた形に合わせる。
  - prose: in — `rules/definition.rules.md` に階層化の条件と考え方を書き、`rules/definition.format.md` の説明文（`:56`、`:58`）を決めた形に合わせる。`DEFINITION.md` の各行の文言も揃える。
- 品質:
  - speed: out — 実行時の処理を変えない。
  - security: out — 権限も入力も増えない。
  - compatibility: in — `Users can do` を読む側の読み方を決めた形に揃える。読む側は `close/SKILL.md:90` と `close/references/format.md:72`（verify の対象を `Users can do` の Unit とする）、`.pi/skills/adr/references/format.md:73`（`Unit.<name>` は `Users can do` の行）、`scripts/product-ready`（`targets.mjs:66-70` は `## Product` と `### What` だけを差し替える）である。
  - errors: out — 失敗の道を変えない。
- 運用:
  - deploy: out — `Stack` の `Deploy` は「なし」である。
  - migration: out — このスターターの `DEFINITION.md` はこのエントリで書き換えるが、clone 済みのプロダクトの `DEFINITION.md` を新しい形へ移す手段は作らない。
  - logs and monitoring: out — 記録は `cycles/` と git が持つ。

### Research & Trial

- 外部の調査（`consult-1`）で、列挙を階層に組む軸の候補が 7 つ出た: 業務能力の分解、利用者活動・手順、システム構造、成果物・処理方式、対象・データ、目的・規模、提供条件。
- `consult-1` — 業務能力の分解は、L1 を安定した成果の単位にし、L2 をその下の作業にする（出所: TOGAF g189、LeanIX）。買うのは実装が変わっても残る見取り図で、払うのは層別の設計である。
- `consult-1` — 利用者活動・手順は、活動を時系列に並べ、その下に手順を積む（出所: NN/g、Jeff Patton）。買うのは活動と機能の結び付きで、払うのは活動の洗い出しと順序付けである。
- `consult-1` — 対象・データは、上位の対象を決め、同じ境界の中で細かい能力を分ける（出所: Stephe Klahr、BASE の開発ブログ）。買うのは対象ごとの抜け漏れの把握で、払うのは境界の見極めである。
- `consult-1` — 2 階層に絞る根拠を示す文書は見つからず、3 層以上を前提にする文書が多い。したがって最大 2 階層は、このプロダクトの規則として書く。
- `consult-1` — 各軸の買い／払いの定量（工数・期間・費用）は、参照した文書にない。
- `consult-1` — 「提供価値の一覧」を単独で 2 階層にした実例は、見つからなかった。
- `rules/definition.rules.md:14` — 試験 04 は、取り去ると 2 つ以上減る行を Unit にしない。したがって複数の Unit を束ねる親は Unit にならない。
- `rules/definition.rules.md:11`、`:13`、`:16` — 試験 01 は `Who` が 1 つの名詞で呼ぶものを Unit とし、能力・状態・内部の仕組みを除く。試験 03 は、使うと `Who` が見えるものが変わることを求める。試験 06 は、内部の作業を Unit にしない。
- `rules/definition.rules.md:16`、`:20` — ディレクトリは Unit ではなく、種類の語（extension、skill、gate、document、command）は例であって規則ではない。
- `rules/definition.rules.md:24` — Unit の行は `<Who> が、xxx する` と定める。`DEFINITION.md:22-44` の 23 行は、どれもこの形である。
- `rules/definition.format.md:74`、`:58` — プロダクトがいらないセクションは落とし、ハーネスの行の種類の語（skills、checks、extensions）は説明文の中で使う。
- `.pi/skills/adr/references/format.md:73` — `Unit.<name>` は「`Users can do` の下の 1 行」である。
- `.pi/skills/close/references/format.md:72`、`close/SKILL.md:90` — verify の対象は「`Users can do` に列挙された Unit」である。
- `scripts/product-ready/targets.mjs:66-70` — `DEFINITION.md` のうち差し替えるのは `## Product` と `### What` だけで、`Users can do` の本文は対象外である。
- `scripts/product-ready/index.test.ts:100`、`:178` — `### Users can do` の下の `- reader: x` が `--run` の後も残ることを固定する。行を入れ子にしても、この試験は緑のままである。
- `scripts/checks`、`test/`、`lib/`、`package.json` — `DEFINITION.md` を解析するものはない。
- 試作で、同じ 23 行を目的で束ねる案と種類で束ねる案の両方に並べ直した。行の文言は変えていない。
- 目的で束ねる案は 5 グループで、サイクルを回す 6、作った物を検査する 6、読んで知る 5、文脈を整える 3、ハーネスを保つ 3 になった。
- 種類で束ねる案は 5 グループで、拡張機能 5、スキル 7、検査 5、文書 4、スクリプト 2 になった。
- 目的で束ねる案では `sound-notify` と `upgrade-skill` の置き場が判断で動く。`quality-gate` と `lefthook-gate` は「作った物を検査する」に入れた。
- 種類で束ねる案では `quality-gate` が「拡張機能」に入り、同じ検査の仲間が「検査」に分かれる。「スクリプト」は `scripts/` というディレクトリの名前になる。
- 見出しと行の軸は、目的で束ねる案では両方 `Who` の側で揃い、種類で束ねる案では見出しが物の側、行が `Who` の側になる。

### Decision

- Status: **accepted**
- Adopted:
  - `Users can do` を、`Who` が何をするかで 5 のグループに束ねる（Option A）。
  - 親は `####` の見出しにし、Unit にしない。
  - グループは、サイクルを回す（`adr-skill`、`design-skill`、`plan-skill`、`work-skill`、`close-skill`、`yolo-skill`）、作った物を検査する（`quality-gate`、`lefthook-gate`、`format-check`、`lint-check`、`type-check`、`test-run`）、読んで知る（`definition-file`、`definition-rules`、`agent-rules`、`usage-readme`、`sound-notify`）、文脈を整える（`subagent-consult`、`thinking-scrub`、`context-precompact`）、ハーネスを保つ（`product-ready`、`harness-copy`、`upgrade-skill`）とする。
  - 23 行の文言は変えない。並びはグループごとにまとめ、グループの中は今の並びを保つ。
  - 「1 行 1 Unit」の規則（`rules/definition.format.md:67`、`:75`）は変えない。見出しは行ではないので、規則はそのままで成り立つ。
  - `rules/definition.rules.md` に階層化の条件と考え方を足す。階層は最大 2 で、親は `Who` が何をするかの単位で取り、親は Unit にしない。親の下の行は 1 行 1 Unit のままである。
  - 親の語は `Who` の側の行為で作り、種類の語（extension、skill、gate）を親の軸にしない（`rules/definition.rules.md:20` の kinds は例であって規則ではないため）。
  - `rules/definition.format.md` の雛形の `Users can do` は 2 行のままにする。2 行にグループはいらない。
  - `rules/definition.format.md` の `## Sections` に、見出しで束ねてよいことと、見出しは Unit でないことを足す。
  - `Users can do` を読む側（`.pi/skills/adr/references/format.md:73`、`.pi/skills/close/references/format.md:72`、`close/SKILL.md:90`）は、Unit を「行」で読み、見出しを Unit と読まないようにする。
  - `scripts/product-ready` は `Users can do` の本文を差し替えないので、変えない。
  - `Who` が届かない共通のパーツは、絵に残さない。規則の試験 01・03・06 がすでに Unit としないので、この件について行を足さない。
  - スコープの `prose` が許す各行の文言の揃えは、必要がなかったので行わない。
- Options:
  - Option B（`Who` で束ねる）: 採らなかった（owner 側が 5 行、エージェント側が 18 行に偏り、階層が読みやすさに効かない。`definition-file` は「owner またはエージェント」で振り分けが決まらないため）。
  - Option C（種類で束ねる）: 採らなかった（見出しが物の側、行が `Who` の側になり、見出しと行で軸が変わる。グループ名がハーネス固有の語になり、`rules/definition.rules.md:20` と owner の caution に反する。`quality-gate` が「拡張機能」に分かれ、同じ検査の仲間が「検査」に残るため）。
  - Option D（目的で束ね、親を入れ子の行にする）: 採らなかった（「1 行 1 Unit」が崩れ、`adr/references/format.md:73` と `close/references/format.md:72` の読み方も直すことになる。見出しで足りるため）。
  - `Users can do` の外に `### Parts` を足す案: 採らなかった（`Who` が届かないものは残しようがない、という owner の判断）。
  - `Users can do` の中に行の種類を 2 つ持つ案: 採らなかった（同じ理由。加えて「1 行 1 Unit」の改訂が要るため）。

### Definition

- `Unit.adr-skill`(kept): 行は「owner が決め、エージェントが記録できる」で、主たる機能は変わらない。グループ「サイクルを回す」の見出しが付くが、行は動かない。
- `Unit.design-skill`(kept): 行は「エージェントが、サイクルを plan に切る材料を調べ、切り方を決め、どこで走らせるかを提案できる（owner が決める）」で、主たる機能は変わらない。グループ「サイクルを回す」の見出しが付くが、行は動かない。
- `Unit.plan-skill`(kept): 行は「エージェントが、1 plan 分の作業の形と順序を決めて書ける」で、主たる機能は変わらない。グループ「サイクルを回す」の見出しが付くが、行は動かない。
- `Unit.work-skill`(kept): 行は「エージェントが、plan を 1 つずつ片付けられる」で、主たる機能は変わらない。グループ「サイクルを回す」の見出しが付くが、行は動かない。
- `Unit.close-skill`(kept): 行は「エージェントが、サイクル終了後に、クロージングできる」で、主たる機能は変わらない。グループ「サイクルを回す」の見出しが付くが、行は動かない。
- `Unit.yolo-skill`(kept): 行は「エージェントが、オーナーの確認を挟まずにクローズのトリアージまで進めることができる」で、主たる機能は変わらない。グループ「サイクルを回す」の見出しが付くが、行は動かない。
- `Unit.quality-gate`(kept): 行は「エージェントが、そのターンでの変更分に対し、検査結果を受け取れる」で、主たる機能は変わらない。グループ「作った物を検査する」の見出しが付くが、行は動かない。
- `Unit.lefthook-gate`(kept): 行は「エージェントが、検査を通した上で commit も push もできる」で、主たる機能は変わらない。グループ「作った物を検査する」の見出しが付くが、行は動かない。
- `Unit.format-check`(kept): 行は「エージェントが、コードの形を揃えられる」で、主たる機能は変わらない。グループ「作った物を検査する」の見出しが付くが、行は動かない。
- `Unit.lint-check`(kept): 行は「エージェントが、リンターの指摘を受け取れる」で、主たる機能は変わらない。グループ「作った物を検査する」の見出しが付くが、行は動かない。
- `Unit.type-check`(kept): 行は「エージェントが、型に対する指摘を受け取れる」で、主たる機能は変わらない。グループ「作った物を検査する」の見出しが付くが、行は動かない。
- `Unit.test-run`(kept): 行は「エージェントが、壊れた振る舞いの指摘を受け取れる」で、主たる機能は変わらない。グループ「作った物を検査する」の見出しが付くが、行は動かない。
- `Unit.definition-file`(kept): 行は「owner またはエージェントが、プロダクトの絵を 1 枚で読める」で、主たる機能は変わらない。グループ「読んで知る」の見出しが付くが、行は動かない。
- `Unit.definition-rules`(kept): 行は「エージェントが、絵の書き方の規則を読める」で、主たる機能は変わらない。グループ「読んで知る」の見出しが付くが、行は動かない。
- `Unit.agent-rules`(kept): 行は「エージェントが、毎セッション同じ規則を読むことができる」で、主たる機能は変わらない。グループ「読んで知る」の見出しが付くが、行は動かない。
- `Unit.usage-readme`(kept): 行は「owner が、このスターターの使い方を読むことができる」で、主たる機能は変わらない。グループ「読んで知る」の見出しが付くが、行は動かない。
- `Unit.sound-notify`(kept): 行は「owner が、pi からの通知、commit が通ったことに気づける」で、主たる機能は変わらない。グループ「読んで知る」の見出しが付くが、行は動かない。
- `Unit.subagent-consult`(kept): 行は「エージェントが、サブエージェントのコンサルを走らせ、その作業場と結果を扱える」で、主たる機能は変わらない。グループ「文脈を整える」の見出しが付くが、行は動かない。
- `Unit.thinking-scrub`(kept): 行は「エージェントが、ループした thinking を取り除き、次のターンに持ち越さない」で、主たる機能は変わらない。グループ「文脈を整える」の見出しが付くが、行は動かない。
- `Unit.context-precompact`(kept): 行は「エージェントが、コンパクションを待たずに、コンテキストを空けられる」で、主たる機能は変わらない。グループ「文脈を整える」の見出しが付くが、行は動かない。
- `Unit.product-ready`(kept): 行は「owner が、ハーネスのテストを外した状態に切り替え、プロダクト開発を始められる」で、主たる機能は変わらない。グループ「ハーネスを保つ」の見出しが付くが、行は動かない。
- `Unit.harness-copy`(kept): 行は「owner が、スターターのハーネスをプロジェクトへ取り込み、プロジェクトのハーネスをスターターへ戻せる」で、主たる機能は変わらない。グループ「ハーネスを保つ」の見出しが付くが、行は動かない。
- `Unit.upgrade-skill`(kept): 行は「エージェントが、依存パッケージをアップグレードし、監査まで終えられる」で、主たる機能は変わらない。グループ「ハーネスを保つ」の見出しが付くが、行は動かない。

## 02: design のリサーチを、1 エントリ 1 サブエージェントにまとめるか

### Context

- `ROADMAP.md:16` の `010` は「スキルの更新」で、`status` は `wip` である。
- ROADMAP の idea の 1 つ目は、design のリサーチで 1 エントリに 2 サブエージェントを走らせるのを 1 つにまとめること、観点は同じままにし、1 人あたりのタスクを増やすことである。
- `.pi/skills/design/SKILL.md:29` は「`accepted` エントリごとに 2 つの `research` サブエージェントを同時に走らせる」と定める。
- `design/references/tasks.md:5-23` と `:25-37` が 2 つのタスクで、どちらも「1 エントリと、その subject のファイル」を受け取る（`:22`、`:35`）。
- `design.md` の `## Affected`（`format.md:58-62`）と `## External`（`:65-71`）が、エントリごとに 1 つの `### <NN>` を持つ。
- レビューの観点 3（outside）・4（followers）と coverage の規則（`SKILL.md:74`、`tasks.md:45-48`）が、この 2 つの欄を読む。

### Scope

- 変更:
  - behaviour: in — design の step 2 を、1 エントリ 1 サブエージェントにする。観点（変更が触れるパス / リポジトリの外で話すもの）は変えず、1 人あたりのタスクを増やす。
  - refactor: out — design のほかの手順（cut、name、section、review、proofread、show）を変えない。
  - dependency: out — パッケージを足さない。
  - naming: out — 観点の名（paths、outside、`## Affected`、`## External`）を変えない。
  - format: out — `design.md` の欄と `### <NN>: <entry の問い>` の形を変えない。1 人のサブエージェントが 2 つの欄に答える。
  - prose: in — `design/SKILL.md:29` を 1 サブエージェントに直し、`design/references/tasks.md` の 2 つのタスクを 1 つにまとめ、`:37` の「パスの walk の隣で走る」を直す。
- 品質:
  - speed: in — 1 エントリあたりのサブエージェントが 2 から 1 に減る。1 人あたりのターン数は増える。
  - security: out — 権限も入力も増えない。
  - compatibility: out — `design.md` の形も、レビューの観点も、読む欄も変えない。閉じたサイクルの `design.md` はそのまま読める。
  - errors: in — サブエージェントが 1 つになるので、失敗すると `## Affected` と `## External` の両方が同時に欠ける。そのときの扱い（再実行する / `なし` と書く / エントリを止める）を決める。
- 運用:
  - deploy: out — `Stack` の `Deploy` は「なし」である。
  - migration: out — 閉じたサイクルの `design.md` を書き換えない。
  - logs and monitoring: out — 記録は `cycles/` と git が持つ。

### Research & Trial

- `.pi/extensions/consult/types.json:14` — `research` の limits は 40 ターンと 60000 出力で、tools（`read`、`ls`、`find`、`grep`、`web_search`、`fetch_content`）は 2 つのタスクの両方を賄える。
- `.pi/extensions/consult/policy/types.ts:47` — `output` は出力トークンの上限である。
- `.pi/extensions/consult/sub/spec.ts:211-217` — 上限は 1 つのプロセスの中で積み上げ、assistant の `message.usage.output` を足す。
- `.pi/extensions/consult/sub/spec.ts:218-223` — `turns > 40` か `output > 60000` で止まり、理由は `turn limit reached (40)` と `output token limit reached (60000)` の 2 つである。
- `.pi/extensions/consult/run/run.ts:40-42` — 上限はサブエージェントのプロセス 1 回ごとに数え直し、打ち切りのあとの再走はその回数だけ上限を使える。
- `.pi/extensions/consult/run/run.ts:453`、`:467-470` — 終わり方は `done`、`turn-limit`、`error`、`aborted` の 4 つで、ターン上限も出力上限も `turn-limit` になる。
- `.pi/extensions/consult/sub/budget.ts:40-59` — ターン上限の 2 つ手前で 1 度だけ「次が最後のターンです。ここまでに分かったこと・やったことと、終わっていないことを報告して終えてください」と促す。
- `.pi/extensions/consult/sub/budget.ts:81-83` — 促しの上限は `CONSULT_TURNS` からだけ来るので、出力上限には促しが無い。
- `consult-1` — 7 軸の外部調査 1 タスクで、4 ターン、6197 出力だった。60000 出力には遠い。
- `cycles/261101-047-dev/design.md:3-32`（2 エントリ）、`cycles/261030-046-dev/design.md:3-40`（3 エントリ）、`cycles/261029-045-dev/design.md:3-77`（6 エントリ） — `## Affected` と `## External` の合計は 30 行、38 行、75 行で、1 エントリあたり 13 から 15 行である。
- `design/references/tasks.md:5-37` — 2 つのタスクは、どちらも「1 エントリと subject のファイル」を入力にし、出力の形だけが違う。
- 過去の design のリサーチが使ったターン数は、記録が作業ディレクトリの外にあり、読めなかった。

### Decision

- Status: **accepted**
- Adopted:
  - design の step 2 を、1 エントリ 1 サブエージェントにする（Option A）。
  - 観点は変えない（変更が触れるパス / リポジトリの外で話すもの）。
  - `design/references/tasks.md` の 2 つのタスクを 1 つのタスクにまとめ、`:37` の「パスの walk の隣で走る、エントリごとに 1 人」を直す。
  - 限界に達したときの扱い（`errors: in`）は、`budget.ts:33` の促しと、記録に残る `turn-limit` に任せ、タスクの文面に新しい行を足さない。
  - `design.md` の `## Affected` と `## External`、`### <NN>: <entry の問い>` の形は変えない。
  - レビューの 6 つの観点と coverage の規則は変えない。
  - `yolo` の design セクションはサブエージェントの数を書いていないので、変えない。
- Options:
  - Option B（まとめず、2 つのままにする）: 採らなかった（ROADMAP 010 の 1 つ目の案を採らないことになり、同じエントリと subject を 2 回読むため）。
  - Option C（まとめ、打ち切りの報告の形をタスクの文面に書く）: 採らなかった（`budget.ts:33` の促しと役割が重なり、サブエージェントに 2 つの指示が同時に届くため）。

### Definition

- `Unit.design-skill`(kept): 行は「エージェントが、サイクルを plan に切る材料を調べ、切り方を決め、どこで走らせるかを提案できる（owner が決める）」で、主たる機能は変わらない。リサーチを走らせる人数と、タスクの文面が変わる。
- `Unit.yolo-skill`(kept): 行は「エージェントが、オーナーの確認を挟まずにクローズのトリアージまで進めることができる」で、主たる機能は変わらない。yolo の design セクションはサブエージェントの数を書いておらず、本文も行も動かない。

## 03: `Always` を「5 つ」と呼ばずに、どう書くか

### Context

- `ROADMAP.md:16` の `010` は「スキルの更新」で、`status` は `wip` である。
- idea の 2 つ目は、plan の「規定の 5 つ」という書き方を廃止し、つねにちゃんと書くことである。
- `plan/references/format.md:50` の雛形は、`Always` の内容を「既定の 5 つで足りるなら `既定の 5 つ`」と書いてよいとしている。
- `plan/references/format.md:149-154` が `Always` の 5 本を挙げ、`:149` が「these five, and nothing else」と定める。
- `plan/SKILL.md:63` と `:122` が、その 5 本を「the five」と呼ぶ。
- 「the five」はレビューの 5 つの観点にも使われており（`work/SKILL.md:60`、`yolo/SKILL.md:34`）、別の 5 を指す。
- `package.json:5-20` に、5 本をまとめて走らせる script はない。
- `close` は `Always` を読まない。
- `cycles/` の plan md は `既定の 5 つ` と書いており、閉じたサイクルのものは書き換えない。
- `plan/SKILL.md:8` と `plan/references/format.md:90` は、サブエージェントが plan md だけを読んで作業すると定める。
- `work/references/tasks.md:8-12` の `code` サブエージェントのタスクは、plan md の `Steps` と `Verify` を走れと定めるが、5 本の中身を渡していない。

### Scope

- 変更:
  - behaviour: out — 実行時の挙動を持たず、`package.json` の script も足さない。
  - refactor: out — plan の手順と、`Verify` の 2 つの欄（`Always`、`Added`）の並びを変えない。
  - dependency: out — パッケージを足さない。
  - naming: out — 欄の名（`Always`、`Added`）を変えない。
  - format: in — `plan/references/format.md:50` の雛形から `既定の 5 つ` の略記を消し、`Always` に書く形を定める。`:149` と `:161` の「these five」「the five above」を書き直す。
  - prose: in — `plan/SKILL.md:63` と `:122` の「the five」を書き直す。
- 品質:
  - speed: out — 実行時の処理を変えない。
  - security: out — 権限も入力も増えない。
  - compatibility: out — `Verify` を機械で読むものがなく、閉じたサイクルの plan md は書き換えない。
  - errors: out — 失敗の道を変えない。
- 運用:
  - deploy: out — `Stack` の `Deploy` は「なし」である。
  - migration: out — 閉じたサイクルの plan md を `既定の 5 つ` から書き換えない。
  - logs and monitoring: out — 記録は `cycles/` と git が持つ。

### Research & Trial

- `plan/references/format.md:149-154` — `Always` の 5 本は、関連テスト（`pnpm test:related <changed files>`、関連がなければ `pnpm test:run`）、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`、このスライスが変えた名前と説明を大小文字を問わず grep するものである。
- `plan/references/format.md:147` — `Always` はどのスライスでも同じで、`Added` がその変更の分を決める。
- `plan/references/format.md:150`、`:154` — 5 本のうち 2 本（`test:related <changed files>` と grep）は、スライスごとの値を持つ。
- `plan/references/format.md:161` — `Added` の `other` は「the five above」が扱わない検査を指す。
- `plan/SKILL.md:8`、`plan/references/format.md:90` — plan md は、サブエージェントが「plan だけを読んで」作業するための文書である。
- `work/references/tasks.md:8-12` — `code` サブエージェントのタスクは「plan md を読み、スライスごとに `Steps`、`Verify` の順に走れ」とだけ定め、5 本の中身を渡していない。
- `work/references/tasks.md:43` — レビューのタスクだけが、`plan/references/format.md` の `## Test cases` を読めと指す。`## Verify` は指していない。
- `plan/SKILL.md:74-80` — plan のレビューは `Checks` の観点で `Verify` を読む。`work/SKILL.md:61` — work のレビューは「スライスを閉じるもの」として `Verify` を読む。
- `close/` — `Always` を読む箇所はない。
- 直近の 2 サイクル — 047 は 2 plan で 2 スライス、045 は 6 plan で 12 スライス（1 plan あたり最大 3）である。
- `Always:` は 1 スライスに 1 つで、045 の 12 件と 047 の 2 件は、すべて `既定の 5 つ` と書いている。
- `package.json:5-20` — 4 つのコマンドは個別にあり、5 本をまとめる script はない。
- `plan/SKILL.md:63`、`:122`、`format.md:50`、`:149`、`:161` — 「the five」「既定の 5 つ」は 5 か所にある。
- `work/SKILL.md:60`、`yolo/SKILL.md:34` — 「the five viewpoints」はレビューの 5 つの観点を指し、`Always` とは別の 5 である。

### Decision

- Status: **accepted**
- Adopted:
  - `Always` に 5 本を毎回書き下す（Option A）。
  - 5 本は、`plan/references/format.md:150-154` の 5 本を、コマンドと、スライスごとの値（`test:related` の対象と、grep する名前と説明）を入れて書く。
  - `plan/references/format.md:50` の雛形から `既定の 5 つ` を消し、5 本の雛形を置く。
  - `plan/references/format.md:149` の「these five」と `:161` の「the five above」を書き直す。
  - `plan/SKILL.md:63` は 5 本を列挙したまま「the five」を消し、`:122` を書き直す。
  - 「five viewpoints」（`work/SKILL.md:60`、`yolo/SKILL.md:34`）は別の 5 なので、変えない。
  - `package.json` と `work/references/tasks.md` は変えない（plan md が自己完結すれば、worker のタスクはそのままで走れる）。
  - 閉じたサイクルの plan md は書き換えない。
- Options:
  - Option B（5 本の名だけを書き、コマンドは `format.md` に残す）: 採らなかった（worker は名だけでは走れず、`work/references/tasks.md:10` は `format.md` を読めと言わないため）。
  - Option C（plan md は略記のまま、worker のタスク文面に 5 本を渡す）: 採らなかった（`ROADMAP.md` の `010` の idea を採らないことになり、`Always` が plan の記録と worker の走らせるものの 2 つの意味を持つため）。

### Definition

- `Unit.plan-skill`(kept): 行は「エージェントが、1 plan 分の作業の形と順序を決めて書ける」で、主たる機能は変わらない。`Verify` の `Always` に 5 本を書き下す形になる。
