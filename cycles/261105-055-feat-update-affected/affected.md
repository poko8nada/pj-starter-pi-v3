# Affected 055

## 01: affected の調査は、変更に依存するものをどうやって網羅するか

### Code

- Path: `.pi/skills/adr/references/tasks.md`
  - Kind: `doc`
  - Edge: `names` `.pi/skills/adr/references/affected.format.md`
- Path: `.pi/skills/adr/SKILL.md`
  - Kind: `doc`
  - Edge: `names` `.pi/skills/adr/references/tasks.md`, `.pi/skills/adr/references/affected.format.md`
- Path: `.pi/extensions/consult/types.json`
  - Kind: `config`
- Path: `.pi/skills/adr/references/affected.format.md`
  - Kind: `doc`
- Path: `.pi/extensions/consult/policy/types.ts`
  - Kind: `module`
  - Edge: `names` `.pi/extensions/consult/types.json`
- Path: `.pi/extensions/consult/run/subagent.ts`
  - Kind: `module`
  - Edge: `names` `.pi/extensions/consult/types.json`
- Path: `.pi/extensions/consult/tool/consult.ts`
  - Kind: `module`
  - Edge: `names` `.pi/extensions/consult/types.json`
- Path: `.pi/extensions/consult/sub/guard.ts`
  - Kind: `module`
  - Edge: `names` `.pi/extensions/consult/types.json`
- Path: `.pi/extensions/consult/README.md`
  - Kind: `doc`
  - Edge: `names` `.pi/extensions/consult/types.json`
- Path: `.pi/extensions/consult/policy/types.test.ts`
  - Kind: `test`
  - Edge: `checks` `.pi/extensions/consult/policy/types.ts`
- Path: `.pi/extensions/consult/sub/guard.test.ts`
  - Kind: `test`
  - Edge: `checks` `.pi/extensions/consult/sub/guard.ts`

### External

なし

## 02: 記録は何を残せば足りるか。落とす情報の役割はどこへ移るか

### Code

#### .pi/skills/adr/references/affected.format.md

- Search:
  - 01: `affected.format.md`（.pi配下） - 7件/4ファイル: SKILL.md:17・:19・:123の3件とaffected.mjsの2件の注記とindex.test.ts:287とtasks.md:51が当たり、書式の中身の一致や書き込みの実行結果は見えない
  - 02: `affected.format.md`（リポジトリ全体） - 40件/9ファイル: 大半はcycles/の記録であり、短縮参照の当たりや実行時の手渡しは見えない
- Adr: ADRのScopeのformat in（adr.md:114）とDecisionのAdoptedのAddのKindとEdge（adr.md:146-149）とUpdateの1件目（adr.md:152）とDropの7項目（adr.md:157）と一致する。現文はShape（7-42行目）とThe heading（51-55行目）とThe bullets（57-65行目）の旧7バレットの形を持つ。
- Direction: _Read by_
- Relation: 変更が書き直す相手であり、「Shape」「The heading」「The bullets」がパスごとの`- Path:` / `Kind:` / `Edge:`のブロックと`### External`の`- Name:` / `Kind:` / `Used by:`に置き換えられる。
- Role: 記録の形を定める書式で、調査の書き方の内部の基準面である。
- Role change: **Change**
  - 項目が7バレット（Search・Adr・Direction・Relation・Role・Role change・Adjustment）からPath/Kind/EdgeのブロックとExternalのName/Kind/Used byに変わり、`#### <パス>`の見出しと検索の範囲と効果の一覧が落ちる。利用者数と境界は変わらない。
- Adjustment: No

#### .pi/skills/adr/scripts/affected.mjs

- Search:
  - 01: `affectedEntrySkeleton・affectedSkeleton`（.pi/skills/adr配下） - 16件/3ファイル: affected.mjsの定義3件とindex.mjsの呼び出し5件とindex.test.tsの検査8件が当たり、呼び出しの実行結果は見えない
  - 02: `affected.md`（.pi/skills/adr配下） - 23件/6ファイル: 41行目の骨組みの注記が当たり、実行時の生成やcycles/の記録は見えない
- Adr: ADRのScopeのrefactor in（adr.md:115）とDecisionのAdoptedのUpdateの2件目（adr.md:153）と一致する。現文6-38行目は旧7バレットの骨組みを出し、2・41行目の注記で書式との一致を約束する。
- Direction: _Read by_
- Relation: 変更が書き直す相手であり、`affectedEntrySkeleton`と`affectedSkeleton`が出す骨組みが旧7バレットから新形に変わる。2関数の署名は変わらない。
- Role: 骨組みを出す生成器で、scaffoldの実行時に新サイクルのaffected.mdの初形を書く単用の道具である。
- Role change: **Change**
  - 出す骨組みの字面だけが変わり、2関数の署名と呼び出し元と追記と作成の流れは変わらない。
- Adjustment: No

#### .pi/skills/adr/scripts/index.test.ts

- Search:
  - 01: `affectedEntrySkeleton・affectedSkeleton`（.pi/skills/adr/scripts/index.test.ts） - 8件/1ファイル: 8行目のインポートと286行目のdescribeと288・305-308・390行目の呼び出しが当たり、検査の合否自体は実行しなければ見えない
  - 02: `affected.md`（.pi/skills/adr/scripts/index.test.ts） - 9件/1ファイル: 304・384・399・414行目の検査名と390・394・408-409・422行目の読み書きが当たり、CLIの実行結果は見えない
- Adr: ADRのScopeのrefactor in（adr.md:115）とDecisionのAdoptedのUpdateの3件目（adr.md:154）と一致する。現文287-302行目は旧見出しと旧バレットを断言し、304-309行目と384-422行目は骨組みとCLIの追記・作成を確かめる。
- Direction: _Check_
- Relation: 変更が断言を書き換える相手であり、新形の見出しとブロックをなぞる検査に変わる。骨組みとCLIの追記・作成の検査はそのまま確かめる側である。
- Role: 骨組みとCLIの検査で、変更を確かめる内部の検査である。
- Role change: **Change**
  - 断言の字面が旧見出し・旧バレットから新形に変わり、確かめる相手と検査の位置は変わらない。
- Adjustment: No

#### cycles/261105-055-feat-update-affected/affected.md

- Search:
  - 01: `affected.format.md`（リポジトリ全体） - 40件/9ファイル: このファイルの旧形の記録2件（26・52行目）が当たり、新形への書き換えの要否は検索では見えない
  - 02: このファイルの直読（cycles/261105-055-feat-update-affected/affected.md:3-158） - 11パス: 旧7バレットの記録そのものであり、実行時の照合は見えない
- Adr: ADRのScopeのcompatibility in（adr.md:120）とDecisionのAdoptedのUpdateの4件目（adr.md:155）と一致する。現文の`## 01:`は旧7バレットの11パスを持つ。
- Direction: _Read by_
- Relation: 変更が書き直す相手であり、`## 01:`の11パスが旧7バレットから新形に書き直される。属するサイクルと`## 01:`の区切りは変わらない。
- Role: このサイクルのエントリー01の記録で、01の調査結果を載せる内部の台帳である。
- Role change: **Change**
  - 載せる項目だけが新形に変わり、属するサイクルとエントリーの区切りと`### Code` / `### External`の見出しは変わらない。
- Adjustment: No

#### .pi/skills/adr/scripts/index.mjs

- Search:
  - 01: `affectedEntrySkeleton・affectedSkeleton`（.pi/skills/adr配下） - 16件/3ファイル: このファイルの5件（11行目のインポートと28・34・59・84行目の呼び出し）が当たり、実行時の追記・作成結果は見えない
  - 02: `affected.md`（.pi/skills/adr配下） - 23件/6ファイル: このファイルの3件（28・54・84行目）が当たり、開いたサイクル判定の動的挙動は見えない
- Adr: ADRはindex.mjsを挙げない。現文は2関数の署名だけを使い、署名は変わらないため、変更の対象外と一致する。
- Direction: _Read by_
- Relation: 変更後の骨組みを呼ぶ側であり、署名が変わらないため追記と作成の流れはそのまま動く。
- Role: adrとaffectedの入口で、骨組みを追記・作成する実行の経路である。
- Role change: Not change
- Adjustment: No

#### .pi/skills/adr/SKILL.md

- Search:
  - 01: `affected.format.md`（.pi配下） - 7件/4ファイル: このファイルの3件（17・19・123行目）が当たり、書式の中身の一致は見えない
  - 02: `affected.md`（.pi/skills/adr配下） - 23件/6ファイル: このファイルの7件（17・19-20・23・54・123・125行目）が当たり、実行時の手渡しは見えない
- Adr: ADRのScopeのnaming out（adr.md:117）とContextのplanが読むものの列挙（adr.md:107）と一致する。現文17・19・123行目は書式への汎用参照であり、124行目の`### Code` / `### External`は維持されるため、書き換えは要らない。
- Direction: _Read by_
- Relation: 変更後の書式を指す側であり、汎用の参照のまま agents に書式を読ませる。
- Role: サイクルの決定を記録する技能の手順で、書式への参照を束ねる入口の文書である。
- Role change: Not change
- Adjustment: No

#### .pi/skills/adr/references/tasks.md

- Search:
  - 01: `seven bullets`（.pi配下） - 1件/1ファイル: 51行目だけが当たり、新形の語彙や実行時の手渡しは見えない
  - 02: `affected.format.md`（.pi配下） - 7件/4ファイル: このファイルの1件（51行目）が当たり、7バレットという数の正しさは見えない
  - 03: `affected.md`（.pi/skills/adr配下） - 23件/6ファイル: このファイルの2件（51・55行目）が当たり、書き込みの実行結果は見えない
- Adr: ADRはtasks.mdを変えない（エントリー01の所管であり、エントリー02のScopeのprose inはadr.md:116のaffected.format.mdだけである）。現文51行目のseven bulletsはAdoptedのDrop（adr.md:157-159）と食い違う。
- Direction: _Read by_
- Relation: 変更後の形とずれる手渡し文であり、51行目が7バレットを指示したまま残る。
- Role: research役へ渡す手渡し文で、調査の手順と記録の形を指す内部の文書である。
- Role change: Not change
- Adjustment: **YES**
  - 51行目のseven bulletsを新形の語彙（Path/Kind/Edgeのブロック）に直す。tasks.mdはエントリー01の所管であり、直し方はplanが決める。

#### .pi/skills/plan/SKILL.md

- Search:
  - 01: `Role change|role change|Adjustment|adjustment`（.pi/skills/plan配下） - 4件/2ファイル: このファイルの3件（24・28・40行目）が当たり、新形での読み替えや実行時のplan作成は見えない
  - 02: `direction|Direction|### External|### Code`（.pi/skills/plan配下） - 6件/3ファイル: このファイルの2件（24・37行目）が当たり、`### Code`見出しの維持や実行時の読みは見えない
- Adr: ADRのContextのplanが読むものの列挙（adr.md:107のplan/SKILL.md:24,37,40）とScopeのbehaviour out（adr.md:118、エントリー03の所管）とDefinitionのUnit.plan-skillのkept（adr.md:167、入力の読み方はKindとEdgeに変わる）と一致する。現文24・28・37・40行目は旧項目名（direction・role change・adjustment・Check・Generate）を読むため、新形とずれる。
- Direction: _Read by_
- Relation: 変更後の記録を読む側であり、旧項目名の読みが新形に届かなくなる。書き換えはエントリー03の仕事である。
- Role: planを切って書く技能の手順で、affectedを材料に読む入口の文書である。
- Role change: Not change
- Adjustment: **YES**
  - 旧項目名の読みをKind/Edge読みに書き換える。エントリー03の仕事であり、書き方はplanが決める。

#### .pi/skills/plan/references/cut.md

- Search:
  - 01: `Role change|role change|Adjustment|adjustment`（.pi/skills/plan配下） - 4件/2ファイル: このファイルの1件（25行目）が当たり、新形での読み替えは見えない
  - 02: `direction|Direction|### External|### Code`（.pi/skills/plan配下） - 6件/3ファイル: このファイルの1件（11行目の`### Code`）が当たり、切り分けの実行は見えない
- Adr: ADRのContextのplanが読むものの列挙（adr.md:107のcut.md:11,25）とScopeのbehaviour out（adr.md:118、エントリー03の所管）と一致する。現文11・25行目は旧項目名（`### Code`は維持されるが、`Role change`と`Adjustment`の読みは新形にない）を読むため、新形とずれる。
- Direction: _Read by_
- Relation: 変更後の記録を読む側であり、25行目の旧項目名の読みが新形に届かなくなる。書き換えはエントリー03の仕事である。
- Role: planの切り分けの規則で、affectedの`### Code`と旧項目を読む内部の基準面である。
- Role change: Not change
- Adjustment: **YES**
  - 旧項目名の読みをKind/Edge読みに書き換える。エントリー03の仕事であり、書き方はplanが決める。

#### .pi/skills/plan/references/format.md

- Search:
  - 01: `direction|Direction|### External|### Code`（.pi/skills/plan配下） - 6件/3ファイル: このファイルの3件（42・107・130行目）が当たり、新形のEdge/Kindでの読み替えは見えない
- Adr: ADRのContextのplanが読むものの列挙（adr.md:107のformat.md:42,107,130）とScopeのbehaviour out（adr.md:118、エントリー03の所管）と一致する。現文42・107・130行目は旧項目名（directions・`### External`の項目）を読むため、新形とずれる。
- Direction: _Read by_
- Relation: 変更後の記録を読む側であり、旧項目名の読みが新形に届かなくなる。書き換えはエントリー03の仕事である。
- Role: plan mdの形を定める書式で、affectedのCodeとExternalを読む内部の基準面である。
- Role change: Not change
- Adjustment: **YES**
  - 旧項目名の読みをKind/Edge読みに書き換える。エントリー03の仕事であり、書き方はplanが決める。

### External

#### なし

- Search:
  - 01: `https?://`の外部参照（.pi/skills/adr配下） - 0件/0ファイル: 動的な取得や名前が指す外部提供者は見えない
- Adr: ADRのScopeのdependency out（adr.md:119）と運用3種のout（adr.md:126-128）と一致し、外部の品目はない。変更が落とす・足すのは記録の項目であり、生成物（build成果物）は生まない。
- Relation: 変更がリポジトリの外に作る・変える・読む対象はなく、外部との受け渡しは発生しない。
- Role: リポジトリの外側に置かれる品目で、ここでは該当がないことを示す位置である。
- Role change: Not change
- Adjustment: No

## 03: plan は affected と実ファイルの読みをどう分担するか

### Code

#### .pi/skills/plan/SKILL.md

- Search:
  - 01: `Role change|role change|Adjustment|adjustment`（.pi/skills/plan配下） - 4件/2ファイル: 新形Kind/Edgeでの読み替えや実行時のplan作成は見えない
  - 02: `walk of the relations|does not walk|Do not walk the relations`（リポジトリ全体） - 5件/3ファイル: 実行時の関係の歩行の有無やcycles/記録の言及の動的挙動は見えない
  - 03: `.pi/skills/plan/references/format.md`（.pi配下） - 3件/3ファイル: 形の中身の一致や書き込みの実行結果は見えない
  - 04: `plan/SKILL|plan/references|## Design`（*.test.ts全体） - 0件/0ファイル: 検査の合否自体は実行しなければ見えない
- Adr: ADRのContextの6か所の列挙（adr.md:174）とScopeのbehaviour in（adr.md:183）・prose in（adr.md:185）・naming in（adr.md:186）とDecisionのAdoptedのAddの4つの問いと全パス読み（adr.md:216-220）とUpdateの4件（adr.md:222-225）とDropの2件（adr.md:228-230）とDefinitionのUnit.plan-skillのkept（adr.md:237）と一致する。現文22-40行目は旧項目名（direction・relation・role・role change・adjustment・Check・Generate）で読み、関係を歩かないと定める。
- Direction: _Read by_
- Relation: 変更が書き直す相手であり、22-40行目の地図の説明とWhyとFilesと材料対応がKindとEdge読みと全パス読みと4つの問いに置き換えられる。
- Role: planを切って書く技能の手順で、affectedを材料に読む入口の文書である。
- Role change: **Change**
  - 読みの規則と流れが変わる。地図を歩かない受け身から全パスと周辺を歩く読みに変わり、Filesの印とStepsをplanが決め、Whyと材料対応がKindとEdgeになる。利用者数と可視性と境界は変わらない。
- Adjustment: No

#### .pi/skills/plan/references/cut.md

- Search:
  - 01: `Role change|role change|Adjustment|adjustment`（.pi/skills/plan配下） - 4件/2ファイル: 新形Kind/Edgeでの読み替えや実行時の切り分けは見えない
  - 02: `plan/SKILL|plan/references|## Design`（*.test.ts全体） - 0件/0ファイル: 検査の合否自体は実行しなければ見えない
- Adr: ADRのContextの6か所のうちcut.md:25（adr.md:174）とScopeのprose in（adr.md:185）とDecisionのAdoptedのUpdateのWhy（adr.md:223）とDropの旧項目読み（adr.md:229）と一致する。現文25行目はRole changeとAdjustmentを読むWhyのままである。
- Direction: _Read by_
- Relation: 変更が書き直す相手であり、25行目のWhyがKindとEdgeから書く形に置き換えられる。
- Role: planの切り分けの規則で、affectedのCodeと旧項目を読む内部の基準面である。
- Role change: **Change**
  - Whyの規則だけが変わり、切り分けと提示とOrderの流れは変わらない。利用者数と可視性と境界は変わらない。
- Adjustment: No

#### .pi/skills/plan/references/format.md

- Search:
  - 01: `walk of the relations|does not walk|Do not walk the relations`（リポジトリ全体） - 5件/3ファイル: 実行時の関係の歩行の有無やcycles/記録の言及の動的挙動は見えない
  - 02: `goes past`（.pi/skills/plan配下） - 2件/2ファイル: 問い3・4の越境の可否の実行時の扱いは見えない
  - 03: `.pi/skills/plan/references/format.md`（.pi配下） - 3件/3ファイル: 形の中身の一致や書き込みの実行結果は見えない
  - 04: `plan/SKILL|plan/references|## Design`（*.test.ts全体） - 0件/0ファイル: 検査の合否自体は実行しなければ見えない
- Adr: ADRのContextの6か所のうちformat.md:107（adr.md:174）とScopeのformat in（adr.md:184）・prose in（adr.md:185）・naming in（adr.md:186）とDecisionのAdoptedのAddのDesign（adr.md:217）とUpdateのFilesと材料対応とScope越え（adr.md:224-226）とDropの旧項目読み（adr.md:229）と一致する。現文はShape（9-92行目）にDesignがなく、Files（104-107行目）とSlices（130行目）とVerify（156行目）が旧項目とScope内に留まる規則である。
- Direction: _Read by_
- Relation: 変更が書き直す相手であり、ShapeにDesignが足され、FilesとOutsideとVerifyの規則がplanが読んで決める形と問い3・4の越境可に置き換えられる。
- Role: plan mdの形を定める書式で、affectedのCodeとExternalを読む内部の基準面である。
- Role change: **Change**
  - 形と規則が変わる。Filesの前にDesignが足され、Filesの印の決め方とScope越えの可否が変わる。利用者数と可視性と境界は変わらない。
- Adjustment: No

#### .pi/skills/plan/references/tasks.md

- Search:
  - 01: `goes past`（.pi/skills/plan配下） - 2件/2ファイル: 問い3・4の越境の可否の実行時の扱いは見えない
  - 02: `.pi/skills/plan/references/format.md`（.pi配下） - 3件/3ファイル: 形の中身の一致や手渡し文の実行結果は見えない
  - 03: `plan/SKILL|plan/references|## Design`（*.test.ts全体） - 0件/0ファイル: 検査の合否自体は実行しなければ見えない
- Adr: ADRのScopeのprose in（adr.md:185）とDecisionのAdoptedのUpdateのreviewのGoal（adr.md:227）と一致する。現文10行目のGoalはAdoptedの各行とScopeを運ばないものとScopeを越えたstepを読む形である。
- Direction: _Read by_
- Relation: 変更が書き直す相手であり、10行目のGoalがDesignの答えとScopeを読む形に置き換えられる。
- Role: research役とreview役へ渡す手渡し文で、plan mdとADRの読み方を指す内部の文書である。
- Role change: **Change**
  - Goalの規則だけが変わり、渡す相手とround数と手渡しの流れは変わらない。利用者数と可視性と境界は変わらない。
- Adjustment: No

### External

#### なし

- Search:
  - 01: `https?://`の外部参照（.pi/skills/plan配下） - 0件/0ファイル: 動的な取得や名前が指す外部提供者は見えない
- Adr: ADRのScopeのdependency out（adr.md:188）と運用3種のout（adr.md:194-196）および品質のsecurity out（adr.md:193）と一致し、外部の品目はない。変更が足す・落とすのはplan mdのセクションと読みの規則であり、生成物は生まない。
- Relation: 変更がリポジトリの外に作る・変える・読む対象はなく、外部との受け渡しは発生しない。
- Role: リポジトリの外側に置かれる品目で、ここでは該当がないことを示す位置である。
- Role change: Not change
- Adjustment: No

## 04: adr は選択肢をどう提示するか

### Code

#### .pi/skills/adr/references/options.md

- Search:
  - 01: `references/options.md`（リポジトリ全体） - 4件/1ファイル: adr.md:253,280,282,287のみ当たり、.pi/skills/adr配下の参照や実行時の提示は見えない
  - 02: `## Option`（.pi/skills配下） - 0件/0ファイル: 型の見出しがなく、チャットの提示の実行結果は見えない
- Adr: ADRのScopeのprose in（adr.md:253）とDecisionのAdoptedのAddの1件目（adr.md:282）とContextの前者と後者の分離（adr.md:247）およびResearchの先例（adr.md:274のplanのcut.mdの## Present）と一致する。新設のため現文はない。
- Direction: _Read by_
- Relation: 変更が新しく作る相手であり、チャットのプレゼンの型（## Option <A>と### Add / ### Update / ### Drop / ### Keep / ### Cost）とA / B / Cの順と`なし`の書き方とCostの相対評価の規則を持つ。
- Role: チャットの提示の型を定める書式で、SKILL.mdから指される単用の内部の基準面である。
- Role change: **Change**
  - なしからありに変わる。利用者（SKILL.md経由で提示を読む者）、可視性（技能内の参照）、対象（選択肢の提示）、規則（4つの操作とCostと順序）が増える。境界（リポジトリ内）と流れ（記録せず提示に使う）は新設によるもので、既存の移動はない。
- Adjustment: No

#### .pi/skills/adr/references/adr.format.md

- Search:
  - 01: `adr.format.md`（.pi/skills/adr配下） - 7件/3ファイル: SKILL.md:16,18,134,137とadr.mjs:2,45とindex.test.ts:180が当たり、書式の中身の一致や書き込みの実行結果は見えない
  - 02: `Adopted`（.pi/skills/adr配下） - 6件/3ファイル: SKILL.md:106,107とadr.mjs:32とadr.format.md:37,56,58が当たり、散文と型の使い分けの実行は見えない
  - 03: `Options`（.pi/skills/adr配下） - 7件/3ファイル: SKILL.md:85,101,106とadr.mjs:34とadr.format.md:39,56,59が当たり、採用・不採用の扱いの実行は見えない
- Adr: ADRのScopeのformat in（adr.md:252）とDecisionのAdoptedのUpdateの1件目と2件目（adr.md:285-286）およびDropの2件目（adr.md:291）と一致する。現文34-40行目はStatusとAdoptedとOptionsの型のない骨組みを持つ。
- Direction: _Read by_
- Relation: 変更が書き直す相手であり、DecisionのAdoptedを<A>: <説明>の下のAdd / Update / Drop / Keep / Costに、Optionsを<A>: <説明> - <採用しなかった理由>に変える。
- Role: adr.mdの記録の形を定める書式で、SKILL.mdと骨組みと検査から指される内部の基準面である。
- Role change: **Change**
  - Decision のセクションの項目と規則だけが変わり、見出しの並びと利用者数と境界と可視性と流れは変わらない。
- Adjustment: No

#### .pi/skills/adr/SKILL.md

- Search:
  - 01: `adr.format.md`（.pi/skills/adr配下） - 7件/3ファイル: SKILL.md:16,18,134,137とadr.mjs:2,45とindex.test.ts:180が当たり、書式の中身の一致や書き込みの実行結果は見えない
  - 02: `Adopted`（.pi/skills/adr配下） - 6件/3ファイル: SKILL.md:106,107とadr.mjs:32とadr.format.md:37,56,58が当たり、散文と型の使い分けの実行は見えない
  - 03: `Options`（.pi/skills/adr配下） - 7件/3ファイル: SKILL.md:85,101,106とadr.mjs:34とadr.format.md:39,56,59が当たり、採用・不採用の扱いの実行は見えない
  - 04: `### 3. Options|### 4. Discussion|### 6. Write`（.pi/skills/adr配下） - 3件/1ファイル: SKILL.md:85,96,109のみ当たり、提示の型や実行時の手渡しは見えない
- Adr: ADRのScopeのprose in（adr.md:253）とDecisionのAdoptedのUpdateの3件目（adr.md:287）とResearchの散文の規則（adr.md:270のSKILL.md:87）と一致する。現文85-94行目は得るものとコストと成り立たない所を散文で書く規則を持ち、96-107行目は提示と採用の移動を散文で扱う。
- Direction: _Read by_
- Relation: 変更が書き直す相手であり、3（Options）と4（Discussion）と6（Write）をreferences/options.mdを指す形に変える。散文の形は落とす。
- Role: サイクルの決定を記録する技能の手順で、入口から記録と提示へ渡す内部の文書である。
- Role change: **Change**
  - 3と4と6の指し先と規則だけが変わり、利用者数と可視性と境界と段階の流れは変わらない。
- Adjustment: No

#### .pi/skills/adr/scripts/adr.mjs

- Search:
  - 01: `adr.format.md`（.pi/skills/adr配下） - 7件/3ファイル: SKILL.md:16,18,134,137とadr.mjs:2,45とindex.test.ts:180が当たり、書式の中身の一致や書き込みの実行結果は見えない
  - 02: `Adopted`（.pi/skills/adr配下） - 6件/3ファイル: SKILL.md:106,107とadr.mjs:32とadr.format.md:37,56,58が当たり、散文と型の使い分けの実行は見えない
  - 03: `Options`（.pi/skills/adr配下） - 7件/3ファイル: SKILL.md:85,101,106とadr.mjs:34とadr.format.md:39,56,59が当たり、採用・不採用の扱いの実行は見えない
  - 04: `entrySkeleton|adrSkeleton`（.pi/skills/adr配下） - 27件/4ファイル: adr.mjs:6,49,52とcycle.mjs:3,39,45とindex.mjs:10,83とindex.test.ts:7,22,29,173,175,181,198,199,218,219,247,268,280,320,336,352,376,389,419が当たり、骨組みの実行結果やCLIの実行結果は見えない
- Adr: ADRのScopeのrefactor in（adr.md:254）とDecisionのAdoptedのUpdateの4件目（adr.md:288）とResearchの骨組み（adr.md:273のadr.mjs:29-35）と一致する。現文6-41行目は散文のAdoptedとOptionsの骨組みを出す。
- Direction: _Read by_
- Relation: 変更が書き直す相手であり、entrySkeletonとadrSkeletonが出すDecisionの骨組みをAdd / Update / Drop / Keep / Costの型に変える。2関数の署名は変わらない。
- Role: 骨組みを出す生成器で、scaffoldの実行時に新サイクルのadr.mdの初形を書く単用の道具である。
- Role change: **Change**
  - 出す骨組みの字面だけが変わり、2関数の署名と呼び出し元と追記と作成の流れは変わらない。
- Adjustment: No

#### .pi/skills/adr/scripts/index.test.ts

- Search:
  - 01: `adr.format.md`（.pi/skills/adr配下） - 7件/3ファイル: SKILL.md:16,18,134,137とadr.mjs:2,45とindex.test.ts:180が当たり、書式の中身の一致や書き込みの実行結果は見えない
  - 02: `entrySkeleton|adrSkeleton`（.pi/skills/adr配下） - 27件/4ファイル: adr.mjs:6,49,52とcycle.mjs:3,39,45とindex.mjs:10,83とindex.test.ts:7,22,29,173,175,181,198,199,218,219,247,268,280,320,336,352,376,389,419が当たり、骨組みの実行結果やCLIの実行結果は見えない
  - 03: `adr.mjs`（.pi/skills/adr/scripts配下） - 3件/3ファイル: index.mjs:10とindex.test.ts:7とcycle.mjs:3の取り込みが当たり、骨組みの実行結果は見えない
- Adr: ADRのScopeのrefactor in（adr.md:254）とDecisionのAdoptedのUpdateの4件目（adr.md:288）と一致する。現文22-32行目は番号の0埋めを確かめ、173-193行目は採用した形と理由の字面と見出しの一致を確かめる。
- Direction: _Check_
- Relation: 変更が断言を書き換える相手であり、新形の見出しとAdd / Update / Drop / Keep / Costのブロックをなぞる検査に変わる。骨組みとCLIの追記・作成の検査はそのまま確かめる側である。
- Role: 骨組みとCLIの検査で、変更を確かめる内部の検査である。
- Role change: **Change**
  - 断言の字面が散文の骨組みから型の骨組みに変わり、確かめる相手と検査の位置は変わらない。
- Adjustment: No

### External

#### なし

- Search:
  - 01: `https?://`の外部参照（.pi/skills/adr配下） - 0件/0ファイル: 動的な取得や名前が指す外部提供者は見えない
- Adr: ADRのScopeのdependency out（adr.md:258）と運用3種のout（adr.md:263-265）および品質のsecurity out（adr.md:262）と一致し、外部の品目はない。変更が落とす・足すのは記録と手順と骨組みであり、生成物は生まない。
- Relation: 変更がリポジトリの外に作る・変える・読む対象はなく、外部との受け渡しは発生しない。
- Role: リポジトリの外側に置かれる品目で、ここでは該当がないことを示す位置である。
- Role change: Not change
- Adjustment: No

## 05: plan の step は、何を1つとし、1行で何を書くか

### Code

#### .pi/skills/plan/references/format.md

- Search:
  - 01: `references/format.md`（.pi/skills/plan配下） - 7件/3ファイル: 書式の中身の一致や書き込みの実行結果は見えない
  - 02: `One step is one file`（.pi/skills/plan配下） - 2件/2ファイル: 作業順序や実行時の手渡しは見えない
  - 03: `### Steps`（.pi/skills/plan配下） - 2件/2ファイル: フェンスの中身や実行時の作業は見えない
  - 04: `Outside:`（.pi配下） - 3件/1ファイル: 外部項目の動的な受け渡しは見えない
- Adr: ADRのContext（adr.md:304-308）、Scopeのformat in・prose in・behaviour in・naming in・errors in（adr.md:313-317）、Research（adr.md:331-335）、DecisionのAdoptedのAddの単位・1行・フェンス・Outside・順序（adr.md:343-347）とUpdateのSlicesとStepsとShapeとツリーのdir行（adr.md:349-351）とDropの2件（adr.md:353-354）と一致する。現文は## Shape（7-92行目）、## Slices（124-136行目）のOne step is one fileと1文の規則を持つ。
- Direction: _Read by_
- Relation: 変更が書き直す相手であり、## Slicesと### Stepsの規則と## Shapeの例がファイル・モジュール・ディレクトリの単位と何がどうなるかの1行とフェンスの形に置き換えられる。
- Role: plan mdの形を定める書式で、Stepsの単位と行とフェンスを決める内部の基準面である。
- Role change: **Change**
  - Stepsの単位と行とフェンスの規則が変わる。利用者数と可視性と境界は変わらない。
- Adjustment: No

#### .pi/skills/plan/SKILL.md

- Search:
  - 01: `references/format.md`（.pi/skills/plan配下） - 7件/3ファイル: 書式の中身の一致や書き込みの実行結果は見えない
  - 02: `One step is one file`（.pi/skills/plan配下） - 2件/2ファイル: 作業順序や実行時の手渡しは見えない
  - 03: `## Test cases`（.pi配下） - 9件/5ファイル: 検査の合否や実行時のplan作成は見えない
- Adr: ADRのScopeのprose in（adr.md:314）とDecisionのAdoptedのUpdateのSKILL.md:38（adr.md:350）と一致する。現文38行目はOne step is one fileとadd: / update: / drop:の接頭辞とテスト行の形を定める。
- Direction: _Read by_
- Relation: 変更が書き直す相手であり、38行目のOne step is one fileと1文の規則がファイル・モジュール・ディレクトリの単位と何がどうなるかの1行の形に置き換えられる。
- Role: planを切って書く技能の手順で、FilesとStepsの単位と行の形を渡す入口の文書である。
- Role change: **Change**
  - 手順4の単位と行の規則だけが変わり、利用者数と可視性と境界と段階の流れは変わらない。
- Adjustment: No

#### .pi/skills/plan/references/tasks.md

- Search:
  - 01: `references/format.md`（.pi/skills/plan配下） - 7件/3ファイル: 書式の中身の一致や書き込みの実行結果は見えない
  - 02: `### Steps`（.pi/skills/plan配下） - 2件/2ファイル: フェンスの中身や実行時の作業は見えない
  - 03: `## Test cases`（.pi配下） - 9件/5ファイル: 検査の合否や実行時のplan作成は見えない
  - 04: `plan.*format|format.*plan|One step is one file|### Steps`（*.test.*全体） - 0件/0ファイル: 検査の合否自体は実行しなければ見えない
- Adr: ADRはtasks.mdを挙げない。現文8行目は各スライスの### Verifyと### Stepsと名前を挙げた全ファイルを読む形であり、フェンスが増えても読む対象は変わらないため、変更の対象外と一致する。
- Direction: _Read by_
- Relation: 変更後のStepsを読む側であり、フェンス付きのStepsとVerifyを読んでplanを審査する。書き換えは要らない。
- Role: review役へ渡す手渡し文で、plan mdとADRの読み方を指す内部の文書である。
- Role change: Not change
- Adjustment: No

#### .pi/skills/work/references/tasks.md

- Search:
  - 01: `### Steps`（.pi配下） - 3件/3ファイル: フェンスの中身や実行時の作業は見えない
  - 02: `## Slices`（.pi配下） - 3件/2ファイル: スライスの切り方や作業順序の文脈は見えない
  - 03: `## Test cases`（.pi配下） - 9件/5ファイル: 検査の合否や実行時の作業は見えない
  - 04: `plan.*format|format.*plan|One step is one file|### Steps`（*.test.*全体） - 0件/0ファイル: 検査の合否自体は実行しなければ見えない
- Adr: ADRはworkのtasks.mdを挙げない。現文8-10行目はStepsからVerifyの順に作業する形、35行目はFilesとStepsとVerifyとNotesを読む形、43行目はTest casesをplanのformat.mdに求める形であり、単位とフェンスが増えても読む順序と参照先は変わらないため、変更の対象外と一致する。
- Direction: _Read by_
- Relation: 変更後のStepsを読む側であり、モジュールとディレクトリのStepsと子のフェンスを順序どおりに作業する。書き換えは要らない。
- Role: code役とreview役へ渡す手渡し文で、plan mdのStepsとVerifyの使い方を指す内部の文書である。
- Role change: Not change
- Adjustment: No

### External

#### なし

- Search:
  - 01: `https?://`の外部参照（.pi/skills/plan配下） - 0件/0ファイル: 動的な取得や名前が指す外部提供者は見えない
- Adr: ADRのScopeのdependency out（adr.md:319）と運用3種のout（adr.md:325-327）および品質のsecurity out（adr.md:323）と一致し、外部の品目はない。変更が足す・落とすのはStepsの単位と行とフェンスの規則であり、生成物は生まない。
- Relation: 変更がリポジトリの外に作る・変える・読む対象はなく、外部との受け渡しは発生しない。
- Role: リポジトリの外側に置かれる品目で、ここでは該当がないことを示す位置である。
- Role change: Not change
- Adjustment: No

## 06: `Context` の項目が、選択肢と `Adopted` に、もれなく届くことをどう担保するか

### Code

- Path: `.pi/skills/adr/references/adr.format.md`
  - Kind: `doc`
- Path: `.pi/skills/adr/SKILL.md`
  - Kind: `doc`
  - Edge: `names` `.pi/skills/adr/references/adr.format.md`, `.pi/skills/adr/references/options.md`, `.pi/skills/adr/scripts/index.mjs`
- Path: `.pi/skills/adr/references/options.md`
  - Kind: `doc`
  - Edge: `mentions` `.pi/skills/adr/references/adr.format.md`
- Path: `.pi/skills/adr/scripts/adr.mjs`
  - Kind: `module`
- Path: `.pi/skills/adr/scripts/index.mjs`
  - Kind: `module`
  - Edge: `needs` `.pi/skills/adr/scripts/adr.mjs`
- Path: `.pi/skills/adr/scripts/cycle.mjs`
  - Kind: `module`
  - Edge: `needs` `.pi/skills/adr/scripts/adr.mjs`
- Path: `.pi/skills/adr/scripts/index.test.ts`
  - Kind: `test`
  - Edge: `checks` `.pi/skills/adr/scripts/adr.mjs`, `.pi/skills/adr/scripts/index.mjs`

### External

なし
