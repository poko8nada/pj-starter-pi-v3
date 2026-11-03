# Affected 053

## 01: design ステージを廃止したとき、サイクルの流れと design を参照する記述をどう直すか

### Code

#### .pi/skills/design/

- Search:
  - 01: `.pi/skills/design` のパス参照（リポジトリ全体） - 91件/28ファイル: 削除済みディレクトリの中身自体と履歴の差分は見えない
  - 02: `design.md` の記録名（リポジトリ全体） - 71件/26ファイル: 閉じたサイクルの記録と現サイクルのADRの記述を含み、削除済み中身は見えない
  - 03: `design` の残存（.pi/skills/adr・work・close・yolo の SKILL.md と adr・close の references） - 0件/0ファイル: 動詞の design（upgrade の references/tasks.md:22）は見えない
- Adr: ADR の Scope の refactor in（adr.md:21）、Decision の案A（adr.md:62）、Research の参照箇所（adr.md:38）と一致する。現リポジトリに `.pi/skills/design/` はなく、find でも該当なしである。
- Direction: _Read by_
- Relation: 変更が削除する技能の保存場所であり、削除後は参照する記述の直し先が各技能と文書に分散する。
- Role: サイクルを plan に切る材料の調査と切り方・順序・実行場所の提案を担う技能の保存場所で、単独用途の技能境界である。
- Role change: **Change**
  - 技能の保存場所としての利用者（参照する記述）がなくなり、可視性がなくなる。境界は技能一覧から外れ、流れは adr から直接 plan になる。
- Adjustment: No

#### AGENTS.md

- Search:
  - 01: `plan→work→close` の流れの文（AGENTS.md） - 1件/1ファイル: 履歴の旧文（design を含む形）との差分は見えない
  - 02: `design` の残存（AGENTS.md） - 0件/0ファイル: 削除前の行番号との対応は見えない
- Adr: ADR の Research の AGENTS.md:4（adr.md:49）と Scope の prose in（adr.md:25）と一致する。現文は `then plan→work→close` で design を含まない。
- Direction: _Read by_
- Relation: 変更が書き換えるサイクルの流れの文を持ち、design を含む旧文が新文に置き換えられる。
- Role: 毎セッション読む規則のうち、サイクルの進め方を示す内部の規則である。
- Role change: **Change**
  - 流れの記述から design が外れ、可視性（技能名の並び）が変わる。規則としての利用者数と境界は変わらない。
- Adjustment: **YES**
  - 流れの文の design への参照を直す。

#### README.md

- Search:
  - 01: `affected.md` の記録名（README.md） - 1件/1ファイル: 記録一覧以外の affected の用法は見えない
  - 02: `five skills` の技能数（README.md） - 1件/1ファイル: 旧バージョンの six skills との差分は見えない
  - 03: `design` の残存（README.md） - 0件/0ファイル: 削除前の行番号との対応は見えない
- Adr: ADR の Research の README.md:14・:61・:72（adr.md:48）と Scope の format in（adr.md:24）および naming in（adr.md:23）と一致する。現文は5スキル・4ステージ・記録4点（adr.md / affected.md / plan/<plan id>.md / close.md）である。
- Direction: _Read by_
- Relation: 変更が書き換えるサイクルのセクションと記録の一覧を持ち、技能数・段階数・記録名が置き換えられる。
- Role: 製品の使い方を外向きに示す文書で、技能と記録の公開面である。
- Role change: **Change**
  - 公開面の技能数が6から5に、段階が5から4に、記録名が design.md から affected.md に変わり、可視性と境界が変わる。
- Adjustment: **YES**
  - サイクルのセクションを5スキル・4ステージにし、記録の一覧の design の名前を affected に直す。

#### README.ja.md

- Search:
  - 01: `affected.md` の記録名（README.ja.md） - 1件/1ファイル: 記録一覧以外の affected の用法は見えない
  - 02: `5つのスキル` の技能数（README.ja.md） - 1件/1ファイル: 旧バージョンの6つとの差分は見えない
  - 03: `design` の残存（README.ja.md） - 0件/0ファイル: 削除前の行番号との対応は見えない
- Adr: ADR の Research の README.ja.md:14・:65・:72（adr.md:48）と Scope の format in（adr.md:24）および naming in（adr.md:23）と一致する。現文は5つのスキル・記録4点（adr.md / affected.md / plan/<plan id>.md / close.md）である。
- Direction: _Read by_
- Relation: 変更が書き換えるサイクルのセクションと記録の一覧を持ち、技能数・記録名が置き換えられる。
- Role: 製品の使い方を日本語で外向きに示す文書で、技能と記録の公開面である。
- Role change: **Change**
  - 公開面の技能数が6つから5つに、記録名が design.md から affected.md に変わり、可視性と境界が変わる。
- Adjustment: **YES**
  - サイクルのセクションを5つのスキル・4段階にし、記録の一覧の design の名前を affected に直す。

#### DEFINITION.md

- Search:
  - 01: `design-skill` の識別子（DEFINITION.md） - 0件/0ファイル: ADR が指す旧25行目との差分は見えない
  - 02: `plan-skill` の識別子（DEFINITION.md） - 1件/1ファイル: 他技能の行の有無は見えない
  - 03: `design` の残存（DEFINITION.md） - 0件/0ファイル: 削除前の行番号との対応は見えない
- Adr: ADR の Research の DEFINITION.md:25（adr.md:50）と Definition の `Unit.design-skill`(dropped)（adr.md:69）と一致する。現 DEFINITION.md の `Users can do` に design-skill の行はない。
- Direction: _Read by_
- Relation: 変更が落とす design-skill の行の持ち主であり、行の削除先になる。
- Role: 製品の全体像を1枚で示す定義で、技能の列挙という内部の基準面である。
- Role change: **Change**
  - 列挙する技能が6つから5つに減り、design-skill の利用者（adr・plan・work・close の参照）がなくなる。
- Adjustment: **YES**
  - design-skill の行を削除する。

#### .pi/skills/adr/SKILL.md

- Search:
  - 01: `affected.md` の記録名（.pi/skills/adr/SKILL.md） - 5件/1ファイル: 他ファイルの affected の用法は見えない
  - 02: `design` の残存（.pi/skills/adr） - 0件/0ファイル: ADR が指す旧10行目・132行目との差分は見えない
- Adr: ADR の Research の adr/SKILL.md:10・:132（adr.md:40）と Scope の prose in（adr.md:25）および Definition の kept（adr.md:70）と一致する。現文に design はなく、affected の Files・手順7・Proofread の同時実行がある。
- Direction: _Read by_
- Relation: 変更が書き換える手順と Files を持ち、design を指す文が plan と affected を指す文に置き換えられる。
- Role: サイクルの決定を記録する技能の手順で、adr から plan への入口の規則である。
- Role change: **Change**
  - 入口の規則が指す次段が design から plan と affected に変わり、流れと参照先が変わる。利用者数と公開性は変わらない。
- Adjustment: **YES**
  - design を指す文を plan と affected を指す文に直す。

#### .pi/skills/work/SKILL.md

- Search:
  - 01: `affected.md` の記録名（.pi/skills/work/SKILL.md） - 1件/1ファイル: コミット文以外の affected の用法は見えない
  - 02: `Boundary Plans` の参照（.pi/skills/work/SKILL.md） - 1件/1ファイル: 旧 Where・Why との差分は見えない
  - 03: `design` の残存（.pi/skills/work） - 0件/0ファイル: ADR が指す旧8・25・30・31・96行目との差分は見えない
- Adr: ADR の Research の work/SKILL.md:8・:25・:30・:31・:96（adr.md:44）と Scope の format in（adr.md:24）および Definition の kept（adr.md:72）と一致する。現文は plan md の Place を読み、adr.md・affected.md・plan/*.md を `update: NNN's ADR, affected and plan` でコミットする。
- Direction: _Read by_
- Relation: 変更が書き換える実行場所・マージ順序・コミット対象の文を持ち、読む先が design から plan md と affected.md に置き換えられる。
- Role: plan を1つずつ片付ける技能の手順で、作業の実行という内部の流路である。
- Role change: **Change**
  - 読む先が design の Where・Why から plan md の Place・Boundary Plans に変わり、規則と流れが変わる。
- Adjustment: **YES**
  - 実行場所と順序とコミット対象の文を plan md と affected.md を指す文に直す。

#### .pi/skills/close/SKILL.md

- Search:
  - 01: `Boundary Plans` の参照（.pi/skills/close/SKILL.md） - 1件/1ファイル: 旧 Cut・Boundary.Plans との差分は見えない
  - 02: `design` の残存（.pi/skills/close） - 0件/0ファイル: ADR が指す旧28・38・84・94・122行目との差分は見えない
- Adr: ADR の Research の close/SKILL.md:28・:38・:84・:94・:122（adr.md:45）と Scope の format in（adr.md:24）および Definition の kept（adr.md:73）と一致する。現文は ADR と plan md の No と Boundary Plans を読む。
- Direction: _Read by_
- Relation: 変更が書き換える読む先の文を持ち、Cut・Boundary.Plans の読む先が ADR のエントリーと plan md の No・Boundary Plans に置き換えられる。
- Role: 終了後に回収と検証をする技能の手順で、記録の照合という内部の流路である。
- Role change: **Change**
  - 読む先が design の Cut・Boundary.Plans から ADR と plan md に変わり、規則と流れが変わる。
- Adjustment: **YES**
  - 読む先の文を ADR のエントリーと plan md の No・Boundary Plans を指す文に直す。

#### .pi/skills/close/references/format.md

- Search:
  - 01: `plan md` の No の出所（.pi/skills/close/references/format.md） - 2件/1ファイル: 旧 design の No との差分は見えない
  - 02: `design` の残存（.pi/skills/close/references/format.md） - 0件/0ファイル: ADR が指す旧50・60・73行目との差分は見えない
- Adr: ADR の Research の close/references/format.md:50・:60・:73（adr.md:45）と Scope の format in（adr.md:24）と一致する。現文は Plans を plan md の No から取る。
- Direction: _Read by_
- Relation: 変更が書き換える Collected・Verified の書式を持ち、Plans の出所が design から plan md の No に置き換えられる。
- Role: close の記録の形を定める書式で、検査と照合の基準面である。
- Role change: **Change**
  - Plans の出所の規則が design の No から plan md の No に変わる。見出しの利用者数は変わらない。
- Adjustment: **YES**
  - Plans の出所を plan md の No を指す文に直す。

#### .pi/skills/yolo/SKILL.md

- Search:
  - 01: `three stages` の段階数（.pi/skills/yolo/SKILL.md） - 1件/1ファイル: 旧 four stages との差分は見えない
  - 02: `design` の残存（.pi/skills/yolo） - 0件/0ファイル: ADR が指す旧20・22-28行目との差分は見えない
- Adr: ADR の Research の yolo/SKILL.md:20・:22-28（adr.md:46）と Decision の yolo から外す（adr.md:62）および Definition の kept（adr.md:74）と一致する。現文は plan・work・close の3段階を歩く。
- Direction: _Read by_
- Relation: 変更が外す design ステージの歩行順を持ち、歩く段階が3つに置き換えられる。
- Role: 確認を挟まずに回す技能の手順で、段階の順路という内部の流路である。
- Role change: **Change**
  - 歩く段階が4つから3つに減り、順路と流れが変わる。
- Adjustment: **YES**
  - design ステージの歩行を外し、3段階の順路に直す。

#### .pi/skills/upgrade/SKILL.md

- Search:
  - 01: `no ADR, no` の定型文（.pi/skills/upgrade/SKILL.md） - 1件/1ファイル: 旧 design の語との差分は見えない
  - 02: `design` の残存（.pi/skills/upgrade/SKILL.md） - 0件/0ファイル: 動詞の design（references/tasks.md:22）は見えない
- Adr: ADR の Research の upgrade/SKILL.md:14（adr.md:47）と Scope の prose in（adr.md:25）と一致する。現文は `no ADR, no affected and no plan` である。
- Direction: _Read by_
- Relation: 変更が書き換える対象外の宣言文を持ち、書かない記録の列挙が design から affected に置き換えられる。
- Role: サイクルの外で単独に動く技能の手順で、外部との境界を示す宣言面である。
- Role change: **Change**
  - 書かないと宣言する記録名が design から affected に変わり、可視性（記録名の列挙）が変わる。
- Adjustment: **YES**
  - 書かない記録の列挙を affected を指す文に直す。

### External

#### なし

- Search:
  - 01: `design` に対応する外部の品目（リポジトリ全体） - 0件/0ファイル: 検索は外部の不存在を証明できず、ADR の Scope の out が理由になる
  - 02: `design` の対象（.gitignore） - 0件/0ファイル: ビルド生成物と vendor（node_modules）は検索の対象外で見えない
- Adr: ADR の Scope の dependency out（adr.md:22）・security out（adr.md:28）・deploy out（adr.md:32）および Research の rules・scripts・test・vitest 設定に参照なし（adr.md:39）と一致し、外部の品目はない。
- Relation: 変更がリポジトリの外に作る・変える・読む対象はなく、外部との受け渡しは発生しない。
- Role: リポジトリの外側に置かれる品目で、ここでは該当がないことを示す位置である。
- Role change: Not change
- Adjustment: No

## 02: 影響範囲の調査を `adr` のどのタイミングで行い、`affected.md` にどう書くか

### Code

#### .pi/skills/adr/SKILL.md

- Search:
  - 01: `affected.md` の記録名（.pi/skills/adr/SKILL.md） - 5件/1ファイル: 他ファイルの affected の用法は見えない
  - 02: `adr.format` の書式参照（同） - 4件/1ファイル: 参照先の書式の中身は見えない
  - 03: `Look at the affected` の任務文（同） - 0件/1ファイル: 任務文自体は tasks.md にあり見えない
  - 04: `scaffold.mjs` の旧入り口（同） - 0件/1ファイル: 削除前の行番号との対応は見えない
- Adr: ADR の Scope の behaviour in（adr.md:101）・format in（adr.md:105）・prose in（adr.md:106）と Decision の案A（adr.md:137）および Definition の kept（adr.md:144）と一致する。現文は Files に affected の2点を持ち、手順7の調査と校正の同時実行と index.mjs の呼び出しを持つ。
- Direction: _Read by_
- Relation: 変更が足す調査の段階と Files の2点を持ち、選択肢の決定後に校正と同時に調査を走らせる文になる。
- Role: 決定を記録する技能の手順で、adr から plan への入口の規則である。
- Role change: **Change**
  - 手順に影響範囲の調査が足され、次段の読み先に affected.md が加わり、流れと参照先が変わる。利用者数と公開性は変わらない。
- Adjustment: **YES**
  - Files に affected の2点を足し、手順7と校正の同時実行と index.mjs の呼び出しを書く。

#### .pi/skills/adr/references/tasks.md

- Search:
  - 01: `Look at the affected` の見出し（同） - 1件/1ファイル: 任務文の運用結果は見えない
  - 02: `affected.format.md` の書式参照（同） - 1件/1ファイル: 参照先の書式の中身は見えない
  - 03: `affected.md` の書き先（同） - 2件/1ファイル: 書き先の記録の中身は見えない
- Adr: ADR の Scope の refactor in（adr.md:102）・prose in（adr.md:106）と Research の任務文の移し先（adr.md:123）および Decision の案A（adr.md:137）と一致する。現文は調べ方の11手順と答える9問いと affected.md の形を持つ。
- Direction: _Read by_
- Relation: 変更が移す research の任務文を持ち、調べ方と答え方と書き先がこの任務文になる。
- Role: 子エージェントに渡す文面で、調査のやり方を運ぶ内部の受け渡し面である。
- Role change: **Change**
  - 任務文に影響範囲の調査が足され、調べる手順と答える問いと書く形が加わり、規則と流れが変わる。利用者数は変わらない。
- Adjustment: **YES**
  - Look at the affected の任務文を調べ方の11手順と9問いで書く。

#### .pi/skills/adr/references/affected.format.md

- Search:
  - 01: `affected.md` の保存場所（同） - 1件/1ファイル: 保存場所の記録の中身は見えない
  - 02: `### Code` と `### External` の小見出し（同） - 4件/1ファイル: 小見出しの運用結果は見えない
  - 03: `Read by` の方向定義（同） - 1件/1ファイル: 定義の適用結果は見えない
- Adr: ADR の Context の見出しと小見出しと1行の考え（adr.md:89）と Scope の naming in（adr.md:104）・format in（adr.md:105）および Decision の案A（adr.md:137）と一致する。現文はエントリーごとの見出しと Code・External の小見出しと path ごとの見出しと6つのバレットを持つ。
- Direction: _Read by_
- Relation: 変更が作る affected.md の形を持ち、見出しと小見出しと1検索1行の Search とバレットの並びを定める。
- Role: 記録の形を定める書式で、調査の書き方という内部の基準面である。
- Role change: **Change**
  - 無かった書式が作られ、可視性が無から有に変わる。書式の利用者（adr の手順7と調査の書き手）は新しい。
- Adjustment: No

#### .pi/skills/adr/references/adr.format.md

- Search:
  - 01: `affected` の語（同） - 0件/1ファイル: 分離前の形との差分は見えない
  - 02: `## Entries` の見出し規則（同） - 1件/1ファイル: 規則の運用結果は見えない
- Adr: ADR の Scope の format in（adr.md:105）の adr の書式の分け先と Decision の案A（adr.md:137）と一致する。現文は adr.md の形だけを持ち、affected の語を持たない。
- Direction: _Read by_
- Relation: 変更が分ける adr.md の形を持ち、adr の書式だけがこのファイルに残る。
- Role: 記録の形を定める書式で、決定の書き方という内部の基準面である。
- Role change: **Change**
  - 1つの書式が2つに分かれ、このファイルの対象が adr.md だけになり、境界が変わる。利用者数と可視性は変わらない。
- Adjustment: No

#### .pi/skills/adr/scripts/index.mjs

- Search:
  - 01: `affectedSkeleton` の参照（同） - 4件/1ファイル: 参照先の骨組みの中身は見えない
  - 02: `affectedEntrySkeleton` の参照（同） - 3件/1ファイル: 追記の実行結果は見えない
  - 03: `scaffold` の旧名（同） - 0件/1ファイル: 旧入り口との差分は見えない
- Adr: ADR の Context の同時作成と追記の考え（adr.md:90）と Scope の format in（adr.md:105）および Decision の案A（adr.md:137）と一致する。現文は両方の骨組みを書き、開いたサイクルでは両方に次のエントリーを追記する。
- Direction: _Read by_
- Relation: 変更が決める両方作成の入り口であり、adr.md と affected.md の骨組みを書く。
- Role: 記録の骨組みを出す単一の入り口で、新規作成と追記を束ねる内部の流路である。
- Role change: **Change**
  - 無かった入り口が作られ、書く対象が adr.md と affected.md の両方になり、流れが変わる。利用者（adr の手順3）は新しい。
- Adjustment: No

#### .pi/skills/adr/scripts/affected.mjs

- Search:
  - 01: `affectedEntrySkeleton` の定義と利用（同） - 2件/1ファイル: 骨組みの運用結果は見えない
  - 02: `references/affected.format.md` の形合わせ（同） - 2件/1ファイル: 参照先の書式の中身は見えない
- Adr: ADR の Scope の format in（adr.md:105）の affected.md の骨組みと Decision の案A（adr.md:137）と一致する。現文は1エントリー分の骨組みと affected.md の骨組みを返し、書式の形に合わせると注記する。
- Direction: _Read by_
- Relation: 変更が作る affected 側の骨組みであり、入り口から呼ばれて骨を返す。
- Role: 骨組みを返す固有部分で、affected.md の形だけを担う内部の部品である。
- Role change: **Change**
  - 無かった部品が作られ、可視性が無から有に変わる。形の出所（affected.format.md）は新しい。
- Adjustment: No

#### .pi/skills/adr/scripts/adr.mjs

- Search:
  - 01: `entrySkeleton` の定義と利用（同） - 2件/1ファイル: 骨組みの運用結果は見えない
  - 02: `references/adr.format.md` の形合わせ（同） - 2件/1ファイル: 参照先の書式の中身は見えない
  - 03: `affected` の語（同） - 0件/1ファイル: 分離の相手側は見えない
- Adr: ADR の Scope の format in（adr.md:105）の adr.md の骨組みと Decision の案A（adr.md:137）と一致する。現文は1エントリー分の骨組みと adr.md の骨組みを返し、書式の形に合わせると注記する。
- Direction: _Read by_
- Relation: 変更が分ける adr 側の骨組みであり、入り口から呼ばれて骨を返す。
- Role: 骨組みを返す固有部分で、adr.md の形だけを担う内部の部品である。
- Role change: **Change**
  - 1つの骨組みが2つに分かれ、この部品の対象が adr.md だけになり、境界が変わる。利用者数は変わらない。
- Adjustment: No

#### .pi/skills/adr/scripts/cycle.mjs

- Search:
  - 01: `entrySkeleton` の参照（同） - 2件/1ファイル: 参照先の骨組みの中身は見えない
  - 02: `affected` の語（同） - 0件/1ファイル: affected 側の追記は index.mjs にあり見えない
- Adr: ADR の Research の追記は既存を書き換えない扱い（adr.md:128）と一致し、変更は検出と番号と追記の扱いを変えない。構造の分け方は 06 が決める（adr.md:374）。
- Direction: _Read_
- Relation: 変更が流用する共通部分であり、開いたサイクルの検出と次の番号と追記を入り口に渡す。
- Role: 検出と番号と追記を束ねる共通部分で、両方の骨組みから使われる内部の土台である。
- Role change: Not change
- Adjustment: No

#### .pi/skills/adr/scripts/index.test.ts

- Search:
  - 01: `affectedEntrySkeleton` と `affectedSkeleton` の参照（同） - 5件/1ファイル: 検査の合否自体は実行しなければ見えない
- Adr: ADR の Scope の errors out（adr.md:111）どおり02は分岐を足さず、検査の形は 06 が決める（adr.md:374）。現 test は骨組みの見出しとバレットと両方追記と両方作成を確かめる。
- Direction: _Check_
- Relation: 変更の骨組みと両方作成を確かめる検査であり、直接の骨組みと入り口の振る舞いをなぞる。
- Role: 骨組みと入り口の検査で、壊れを止める内部の確認面である。
- Role change: **Change**
  - 検査の対象に affected 側の骨組みと両方追記と両方作成が加わり、境界が広がる。検査の数は増える。
- Adjustment: **YES**
  - affected 側の骨組みと両方追記と両方作成の検査を足す。

#### lib/git-env.mjs

- Search:
  - 01: `git` の取り込み（.pi/skills/adr/scripts/index.mjs） - 1件/1ファイル: 取り込み先の実装は見えない
- Adr: ADR の Research の git の唯一の入り口の記述（adr.md:366）と一致し、変更は取り込み先を変えない。
- Direction: _Read_
- Relation: 入り口が分岐名の読みに使う git の持ち主であり、開いたサイクルの有無の判定を支える。
- Role: git を起動する唯一の口で、複数の使う側に共有される内部の土台である。
- Role change: Not change
- Adjustment: No

#### scripts/harness/harness.json

- Search:
  - 01: `.pi` の複写対象（同） - 1件/1ファイル: 複写の実行結果は見えない
- Adr: ADR の Research の copy は `.pi` を含む記述（adr.md:368）と一致し、新しい書式と骨組みは複写の対象に入る。変更は複写の規則を変えない。
- Direction: _Read_
- Relation: 変更が足す `.pi` 配下のファイルを相手側に運ぶ規則であり、書式と骨組みの配布を支える。
- Role: 成果物を運ぶ複写の規則で、内と外の境界に置かれる運び面である。
- Role change: Not change
- Adjustment: No

### External

#### なし

- Search:
  - 01: 除外規定の行（.pi/skills/adr/references/tasks.md） - 1件/1ファイル: 規定が指す外部の品目自体は見えない
  - 02: `service`・`contract`・`environment`・`data`・`limit` の外部項目（.pi/skills/adr/references 配下） - 0件/3ファイル: 旧 design 側の項目名との対応は見えない
- Adr: ADR の Scope の dependency out（adr.md:103）・security out（adr.md:109）・deploy out（adr.md:113）・migration out（adr.md:114）・logs and monitoring out（adr.md:115）と一致し、外部の品目はない。
- Relation: 変更がリポジトリの外に作る・変える・読む対象はなく、外部との受け渡しは発生しない。
- Role: リポジトリの外側に置かれる品目で、ここでは該当がないことを示す位置である。
- Role change: Not change
- Adjustment: No

## 03: consult に `affected.md` を書くロールをどう足すか

### Code

#### .pi/extensions/consult/types.json

- Search:
  - 01: `research` の役割名（`.pi/extensions/consult`配下） - 4件/4ファイル: 実行時に渡るrole引数の動的値とモデル解決の成否は見えない
  - 02: `cycles/*/affected.md` の許可値（`.pi/extensions/consult`配下） - 5件/2ファイル: globの照合意味とcwdからの解決は見えない
  - 03: `quick_edit` の書込み道具名（`.pi/extensions/consult`配下） - 17件/6ファイル: 書込み道具としての実行時許可と読出し無制限の区別は見えない
  - 04: `"review"` の役割名（`.pi/extensions/consult`配下） - 3件/3ファイル: Roles表のbash欄と上限値の対応は見えない
- Adr: ADRのResearchのresearch記述（adr.md:184-185）とDecision案B（adr.md:198）と一致する。実測でもtoolsにedit・quick_edit・target_edit・writeの4件、pathsに`cycles/*/affected.md`がある。
- Direction: _Read by_
- Relation: 変更がtoolsに4件を足しpathsを`[]`から`["cycles/*/affected.md"]`に変える相手である。
- Role: consultの役割定義の実物で、呼出しごとに読まれて子エージェントの道具と許可を決める台帳である。
- Role change: **Change**
  - 書込みの境界が「書く道具なし」から「`affected.md`に限り書ける」に変わる。使う道具と許可の値が変わり、利用者・隔離・上限・任務文は変わらない。
- Adjustment: No

#### .pi/extensions/consult/README.md

- Search:
  - 01: `research` の役割名（`.pi/extensions/consult`配下） - 4件/4ファイル: 実行時に渡るrole引数の動的値とモデル解決の成否は見えない
  - 02: `types.json` の設定名（`.pi/extensions/consult`配下） - 17件/9ファイル: 呼出しごとの読込みと上書き不可の運用は見えない
  - 03: `quick_edit` の書込み道具名（`.pi/extensions/consult`配下） - 17件/6ファイル: 書込み道具としての実行時許可と読出し無制限の区別は見えない
  - 04: `"review"` の役割名（`.pi/extensions/consult`配下） - 3件/3ファイル: Roles表のbash欄と上限値の対応は見えない
- Adr: ADRのDecision案Bの表修正（adr.md:198）と一致する。実測でresearch行に書込み4件、review行にbash、proofreaderが60 turns・100,000 output、trialが80 turns・120,000 outputで`types.json`と同じである。
- Direction: _Read by_
- Relation: 変更がRoles表のresearch行に書込み4件を足し、reviewのbashとproofreader・trialの上限の既存不一致を`types.json`に合わせる相手である。
- Role: 役割の方針の写しで、`types.json`を変えたら次から効くことを伝える案内である。
- Role change: **Change**
  - research行の道具欄が読出し6件から書込み4件入りに変わり、review・proofreader・trialの欄が実物に合う。表の役割自体は変わらない。
- Adjustment: No

#### .pi/extensions/consult/sub/guard.test.ts

- Search:
  - 01: `cycles/*/affected.md` の許可値（`.pi/extensions/consult`配下） - 5件/2ファイル: globの照合意味とcwdからの解決は見えない
  - 02: `judgeToolCall` と `pathAllowed` と `commandAllowed` の判定名（`.pi/extensions/consult`配下） - 65件/2ファイル: 解決後絶対パスでの判定と環境展開の動的挙動は見えない
  - 03: `quick_edit` の書込み道具名（`.pi/extensions/consult`配下） - 17件/6ファイル: 書込み道具としての実行時許可と読出し無制限の区別は見えない
  - 04: `design.md` の旧名（`.pi/extensions/consult`配下） - 0件/0ファイル: 削除済み履歴と置換前の対応は見えない
- Adr: ADRのDecision案Bのテスト追加・置換（adr.md:198）と一致する。実測で`affected.md`の許可テスト（`pathAllowed`と`judgeToolCall`）と置換先`cycles/261026-042-dev/affected.md`があり、consult配下に`design.md`は0件である。
- Direction: _Read by_
- Relation: 変更が`cycles/*/affected.md`の許可テストを足し、`design.md`のフィクスチャを`affected.md`に置き換える相手である。
- Role: 秘密の番と役割の許可を実ファイルで確かめる検査で、直書きのlimitsで確かめるものである。
- Role change: **Change**
  - 確かめる許可に`affected.md`の2件が足り、フィクスチャが`design.md`から`affected.md`に置き換わる。検査の対象と手法は変わらない。
- Adjustment: No

#### .pi/extensions/consult/sub/guard.ts

- Search:
  - 01: `judgeToolCall` と `pathAllowed` と `commandAllowed` の判定名（`.pi/extensions/consult`配下） - 65件/2ファイル: 解決後絶対パスでの判定と環境展開の動的挙動は見えない
  - 02: `CONSULT_POLICY` の許可名（`.pi/extensions/consult`配下） - 5件/3ファイル: env経由の実行時受渡しと壊れた値の動的経路は見えない
  - 03: `quick_edit` の書込み道具名（`.pi/extensions/consult`配下） - 17件/6ファイル: 書込み道具としての実行時許可と読出し無制限の区別は見えない
- Adr: ADRのResearchの許可記述（adr.md:181）と一致し、書込み道具の4件と`paths`が`[]`で無制限の仕組みのままであることと合う。
- Direction: _Read_
- Relation: 変更が頼る判定で、`WRITE_TOOLS`の4道具と`pathAllowed`のglob照合で書込みを許可するものである。
- Role: 子エージェント側の番で、`CONSULT_POLICY`を規則にして読出しを縛らず書込みとbashだけを止める境界である。
- Role change: Not change（判定の道具・照合・env経由の受渡しを比べ、値だけが変わり仕組みは変わらない）
- Adjustment: No

#### .pi/extensions/consult/policy/types.ts

- Search:
  - 01: `types.json` の設定名（`.pi/extensions/consult`配下） - 17件/9ファイル: 呼出しごとの読込みと上書き不可の運用は見えない
  - 02: `resolveType` の解決名（`.pi/extensions/consult`配下） - 7件/3ファイル: 実行時のrole引数と未知名の例外経路は見えない
  - 03: `quick_edit` の書込み道具名（`.pi/extensions/consult`配下） - 17件/6ファイル: 書込み道具としての実行時許可と読出し無制限の区別は見えない
- Adr: ADRのResearchの型記述（adr.md:180）と一致し、スキーマを変えないことと合う。
- Direction: _Read_
- Relation: 変更が値を入れる器で、スキーマと検証と解決を変えずにresearchのtoolsとpathsを受け止めるものである。
- Role: 役割の形を定める検査器で、壊れた設定を`parseTypes`が投げることで保つ関所である。
- Role change: Not change（スキーマ・検証・解決の形を比べ、値だけが変わり形は変わらない）
- Adjustment: No

#### .pi/extensions/consult/run/subagent.ts

- Search:
  - 01: `types.json` の設定名（`.pi/extensions/consult`配下） - 17件/9ファイル: 呼出しごとの読込みと上書き不可の運用は見えない
  - 02: `CONSULT_POLICY` の許可名（`.pi/extensions/consult`配下） - 5件/3ファイル: env経由の実行時受渡しと壊れた値の動的経路は見えない
- Adr: ADRのResearchの受渡し記述（adr.md:191）と一致し、researchが`isolated:false`でbase走行のままであることと合う。
- Direction: _Read by_
- Relation: 変更が流すpathsを受けて`CONSULT_POLICY`に載せ、researchの子エージェントに渡す側である。
- Role: 実行の配管で、上限と許可をenvに載せて子に渡し、`types.json`を子に読ませない運び手である。
- Role change: Not change（受渡し・隔離判定・上限の扱いを比べ、流れる値だけが変わり配管は変わらない）
- Adjustment: No

#### .pi/extensions/consult/tool/consult.ts

- Search:
  - 01: `types.json` の設定名（`.pi/extensions/consult`配下） - 17件/9ファイル: 呼出しごとの読込みと上書き不可の運用は見えない
  - 02: `resolveType` の解決名（`.pi/extensions/consult`配下） - 7件/3ファイル: 実行時のrole引数と未知名の例外経路は見えない
- Adr: ADRのResearchの解決記述（adr.md:190）と一致し、呼出しごとに解決することと合う。
- Direction: _Read by_
- Relation: 変更後のresearchを呼出しごとに`resolveType`で引き、`CONSULT_POLICY`に載せる側である。
- Role: 表口の1回呼出しで、役割を解決して行き先を決め、呼出しごとの読込みで次から効かせる口である。
- Role change: Not change（解決・上書き不可・行き先決定を比べ、引く値だけが変わり手順は変わらない）
- Adjustment: No

#### .pi/extensions/consult/policy/types.test.ts

- Search:
  - 01: `types.json` の設定名（`.pi/extensions/consult`配下） - 17件/9ファイル: 呼出しごとの読込みと上書き不可の運用は見えない
  - 02: `resolveType` の解決名（`.pi/extensions/consult`配下） - 7件/3ファイル: 実行時のrole引数と未知名の例外経路は見えない
  - 03: `quick_edit` の書込み道具名（`.pi/extensions/consult`配下） - 17件/6ファイル: 書込み道具としての実行時許可と読出し無制限の区別は見えない
- Adr: ADRのResearchの記述（adr.md:189）と一致し、フィクスチャで確かめ実物を読まないため実物のresearchの値は確かめないことと合う。
- Direction: _Check_
- Relation: 変更の器の形をフィクスチャで確かめる側で、実物のresearchの値は確かめないものである。
- Role: 型の番で、実物を読まずに読込みと引当てを確かめる留め具である。
- Role change: Not change（確かめる手法と対象を比べ、フィクスチャのまま変わらない）
- Adjustment: No

#### .pi/extensions/consult/run/subagent.test.ts

- Search:
  - 01: `types.json` の設定名（`.pi/extensions/consult`配下） - 17件/9ファイル: 呼出しごとの読込みと上書き不可の運用は見えない
  - 02: `CONSULT_POLICY` の許可名（`.pi/extensions/consult`配下） - 5件/3ファイル: env経由の実行時受渡しと壊れた値の動的経路は見えない
- Adr: ADRに直接の記述はないが、上限と許可だけを載せる確かめと矛盾せず、実物の値に依存しないことと合う。
- Direction: _Check_
- Relation: 変更が流す許可の受渡しを、上限と許可だけを載せることで確かめる側である。
- Role: 配管の番で、子が`types.json`を読まないことをenvの値で確かめる留め具である。
- Role change: Not change（確かめる値の載せ方を比べ、値の中身によらず変わらない）
- Adjustment: No

#### .pi/skills/adr/references/tasks.md

- Search:
  - 01: `affected.md` の記録名（`.pi/skills/adr`配下） - 18件/6ファイル: 実行時の書込み先と骨組み追記の動的経路は見えない
  - 02: `research` の役割名（`.pi/skills/adr`配下） - 9件/3ファイル: 実行時の子エージェントの成否と報告の受取りは見えない
- Adr: ADRのエントリー02が定めるLook at the affectedの任務文と一致し、`affected.md`に書くことがresearchの仕事であることと合う。
- Direction: _Read by_
- Relation: 変更で書けるようになる相手で、エントリーごとに`affected.md`へ書く手順をresearchに渡す文である。
- Role: 子への手渡し文で、手順だけを載せてADRに持ち込まず`affected.md`に書かせる口である。
- Role change: Not change（手順・書式・書く先を比べ、文は変わらず実行できるようになるだけである）
- Adjustment: No

### External

#### なし

- Search:
  - 01: `https?://` の外部参照（`.pi/extensions/consult`配下） - 0件/0ファイル: モデル名が指す外部提供者はURLに出ないため見えない
- Adr: ADRのScopeのsecurity（adr.md:170）・deploy（adr.md:174）・migration（adr.md:175）と一致し、外部との取決めはない。
- Relation: 変更が外部と結ぶものはなく、許可はリポジトリ配下のglobに限られる。
- Role: リポジトリの外側に置かれる品目で、ここでは該当がないことを示す位置である。
- Role change: Not change
- Adjustment: No

## 04: design の分割・実行順・実行場所を plan に移すとき、何を提示し、どこで合意するか

### Code

#### .pi/skills/plan/SKILL.md

- Search:
  - 01: `design's section for this plan`（.pi/skills/plan/SKILL.md） - 1件/1ファイル: チャット提示の新文言との差分は見えない
  - 02: `design's Goal`（.pi/skills/plan/SKILL.md） - 2件/1ファイル: ADR の Adopted・Scope との対応は見えない
  - 03: `design's Boundary.Plans`（.pi/skills/plan/SKILL.md） - 2件/1ファイル: plan md の Boundary Plans との差分は見えない
  - 04: `cut into plans`（.pi/skills/plan/SKILL.md） - 1件/1ファイル: 分割の提示と合意の新手順は見えない
- Adr: ADR の Research の plan の design 参照（adr.md:41）、plan セクションの欄と出所（adr.md:214・:245）、レビューの Goal・Non-goal の出所（adr.md:248）、手順10と Changes after this の Boundary.Plans（adr.md:252）、Scope の format in・prose in（adr.md:231・:232）、Decision の案B（adr.md:262）と一致する。現文は design の欄・Goal・Boundary.Plans を指す。
- Direction: _Read by_
- Relation: 変更が書き換える分割の提示の手順と design 参照の文を持ち、提示と合意の後に plan md を書く形とレビューの読む先が置き換えられる。
- Role: plan を書く手順の台本で、分割と順序と実行場所を決める内部の流路である。
- Role change: **Change**
  - 読む先が design の欄・Goal・Non-goal から ADR のエントリーと提示に変わり、手順10と Changes after this の更新先が design から plan md の Boundary Plans に変わる。規則と流れが変わる。
- Adjustment: **YES**
  - 分割の提示の手順を足し、design を指す文を ADR・提示・plan md の Boundary Plans を指す文に直す。

#### .pi/skills/plan/references/format.md

- Search:
  - 01: `design` の参照（.pi/skills/plan/references/format.md） - 4件/1ファイル: チャット提示の新文言との差分は見えない
  - 02: `Boundary.External`（.pi/skills/plan/references/format.md） - 2件/1ファイル: 廃止後の Outside 行の形は見えない
  - 03: `No is the design's`（.pi/skills/plan/references/format.md） - 1件/1ファイル: ADR のエントリー番号との差分は見えない
  - 04: `Boundary Plans`（.pi/skills/plan/references/format.md） - 0件/0ファイル: 新設欄の形は見えない
- Adr: ADR の Research の No・Place・Files・Slices の所持（adr.md:217・:250）、plan セクションの欄の出所（adr.md:245）、Scope の naming in・format in（adr.md:230・:231）、Decision の案B（adr.md:262）と一致する。現文は No の出所を design とし、Boundary Plans の欄を持たない。
- Direction: _Read by_
- Relation: 変更が Boundary Plans の欄を足し、No の出所を直し、design の Cut・Where の移し先になり、Goal・Non-goal・Summary・Paths・Boundary・Why・Where の参照を消す。
- Role: plan md の形を定める辞書で、SKILL.md と tasks.md と work が読みに来る共有の基準である。
- Role change: **Change**
  - 欄の規則が変わる。Boundary Plans が増え、No の出所が design から ADR のエントリーに変わり、Cut・Where の規則が移る。利用者数と境界は変わらない。
- Adjustment: **YES**
  - No を ADR のエントリーの番号に直し、Boundary Plans を足し、Cut・Where を移し、design にある欄への参照を消す。

#### .pi/skills/plan/references/tasks.md

- Search:
  - 01: `design's Goal`（.pi/skills/plan/references/tasks.md） - 3件/1ファイル: ADR の Adopted・Scope との対応は見えない
  - 02: `Adopted`（.pi/skills/plan） - 0件/0ファイル: 新しい読む先の文言は見えない
- Adr: ADR の Research の review と research の手渡し文（adr.md:219）、Goal・Non-goal の出所（adr.md:248）、Scope の prose in（adr.md:232）、Decision の案B（adr.md:262）と一致する。現文は design の Goal・Non-goal を読む。
- Direction: _Read by_
- Relation: 変更が書き換えるレビューとリサーチの手渡し文を持ち、Goal の観点の読む先が ADR の Adopted と Scope に置き換えられる。
- Role: サブエージェントへの手渡し文で、レビューに読む先と観点を渡す境界である。
- Role change: **Change**
  - 読む先の規則が design の Goal・Non-goal から ADR の Adopted と Scope に変わる。利用者数と可視性は変わらない。
- Adjustment: **YES**
  - レビューとリサーチの Goal・Non-goal を ADR の Adopted と Scope を読む文に直す。

#### .pi/skills/work/SKILL.md

- Search:
  - 01: `Place` の参照（.pi/skills/work/SKILL.md） - 2件/1ファイル: 提示の Place との対応は見えない
  - 02: `Boundary Plans` の参照（.pi/skills/work/SKILL.md） - 1件/1ファイル: 提示の実行順との対応は見えない
  - 03: `design` の残存（.pi/skills/work/SKILL.md） - 0件/0ファイル: 01で直した旧文との差分は見えない
- Adr: ADR の Research の work の Where・Why（adr.md:218・:246）と Definition の kept（adr.md:270）、Scope の behaviour in（adr.md:227）と一致する。現文は plan md の Place と Boundary Plans を読み、design はない。
- Direction: _Read by_
- Relation: 変更が足す Boundary Plans の欄を読む。実行場所を Place で決め、マージ順序を Boundary Plans の1制約で決める。
- Role: plan を1つずつ片付ける技能の手順で、作業の実行という内部の流路である。
- Role change: Not change
- Adjustment: No

#### .pi/skills/close/SKILL.md

- Search:
  - 01: `Boundary Plans` の参照（.pi/skills/close/SKILL.md） - 1件/1ファイル: 提示の実行順との対応は見えない
  - 02: `plan md's No` の参照（.pi/skills/close/SKILL.md） - 1件/1ファイル: Triage 行の ADR 番号との対応は見えない
  - 03: `design` の残存（.pi/skills/close/SKILL.md） - 0件/0ファイル: 01で直した旧文との差分は見えない
- Adr: ADR の Research の close の Cut・Boundary.Plans（adr.md:218・:247）と Definition の kept（adr.md:271）、Scope の behaviour in（adr.md:227）と一致する。現文は ADR のエントリーと plan md の No と Boundary Plans を読む。
- Direction: _Read by_
- Relation: 変更が足す Boundary Plans の欄と No を読む。切分けの穴の判定に ADR のエントリーと plan md を使う。
- Role: 終了後に回収と検証をする技能の手順で、記録の照合という内部の流路である。
- Role change: Not change
- Adjustment: No

#### .pi/skills/close/references/format.md

- Search:
  - 01: `` `No` `` の出所（.pi/skills/close/references/format.md） - 4件/1ファイル: 旧 design の No との差分は見えない
  - 02: `design` の残存（.pi/skills/close/references/format.md） - 0件/0ファイル: 01で直した旧文との差分は見えない
- Adr: ADR の Research の Verified.Plans の出所（adr.md:247）と Scope の format in（adr.md:24）と一致する。現文は Plans を plan md の No から取る。
- Direction: _Read by_
- Relation: 変更が前提にする Plans の出所の文を持ち、Verified の Plans を plan md の No から取る形で読む。
- Role: close の記録の形を定める書式で、検査と照合の基準面である。
- Role change: Not change
- Adjustment: No

#### .pi/skills/close/scripts/collect.mjs

- Search:
  - 01: `noOf` の定義と利用（.pi/skills/close/scripts/collect.mjs） - 2件/1ファイル: Triage 行の正規表現の中身は見えない
  - 02: `design` の残存（.pi/skills/close/scripts/collect.mjs） - 0件/0ファイル: コメントの旧文との差分は見えない
- Adr: ADR の Research の plan md の No だけが design 由来の値であることと close の Plans が No から読めること（adr.md:52・:247）と一致する。現実装は通常 plan の No を plan md から読む。
- Direction: _Read_
- Relation: 変更が前提にする No の読みを担い、close が plan md の No を読めることを支える。
- Role: 残りを集める収集器で、Collected の見出しと Verified の Plans の材料を作る内部の仕組みである。
- Role change: Not change
- Adjustment: No

#### .pi/skills/close/scripts/collect.test.ts

- Search:
  - 01: `noOf` の参照（.pi/skills/close/scripts/collect.test.ts） - 5件/1ファイル: 実行順の検証は見えない
  - 02: `design` の残存（.pi/skills/close/scripts/collect.test.ts） - 0件/0ファイル: 旧 No の出所の断言との差分は見えない
- Adr: ADR の Research の collect.mjs:249-257 と collect.test.ts:29-38（adr.md:52）と一致する。現テストは通常 plan の No を plan md から読むことを確かめる。
- Direction: _Check_
- Relation: 変更が前提にする No の読みを直接確かめ、通常 plan と ex- plan の No の出所を検査する。
- Role: 収集器の振る舞いを留める検査で、間接の確認面である。
- Role change: Not change
- Adjustment: No

### External

#### なし

- Search:
  - 01: `GitHub|npmjs|registry` の外部役務（.pi/skills/plan） - 0件/0ファイル: 検索は外部の不存在を証明できず、ADR の Scope の out が理由になる
  - 02: `service|vendor|build` の外部品目（.pi/skills/plan） - 0件/0ファイル: ビルド生成物と vendor は検索の対象外で見えない
- Adr: ADR の Scope の dependency out・security out・deploy out（adr.md:229・:234・:240）および compatibility out（adr.md:236）と一致し、外部の品目はない。
- Relation: 変更がリポジトリの外に作る・変える・読む対象はなく、外部との受け渡しは発生しない。
- Role: リポジトリの外側に置かれる品目で、ここでは該当がないことを示す位置である。
- Role change: Not change
- Adjustment: No

## 05: plan md のステップをどう書くか

### Code

#### .pi/skills/plan/references/format.md

- Search:
  - 01: `### Steps`（範囲: .pi/skills） - 3件/3ファイル: cycles配下のplan mdのSteps見出しは見えない
  - 02: `## Test cases`（範囲: .pi/skills） - 10件/5ファイル: cycles配下のテスト行の接頭辞の有無は見えない
  - 03: `(happy)`（範囲: .pi/skills/plan） - 2件/1ファイル: cycles配下のplan mdのテスト行は見えない
  - 04: `One step is one file`（範囲: .pi/skills） - 2件/2ファイル: スライスの切り方や作業順序の文脈は見えない
  - 05: `Walk the relations`（範囲: .pi/skills/plan） - 2件/2ファイル: 新設の「書く前に改めて読む」の文言はまだなく見えない
  - 06: `Steps|Test cases`（範囲: 全リポジトリの*.test.ts） - 0件/0ファイル: テスト以外の検証（proofreaderの目視）は見えない
- Adr: 検索はADRの事実と一致する。Stepsは`1. <file>:`の下に`- <何をするか>`、テスト行は`- (happy)`等で始まり、接頭辞の定めはなく、Filesツリーの行末マーカーと対応する。差異はない
- Direction: _Read by_
- Relation: 変更がこのファイルの`## Slices`と`## Steps`の形を接頭辞付きに変える。テスト行は`- update: (happy) <given> → <result>`の形になる
- Role: plan mdの形を定める辞書。SKILL.mdとtasks.mdとworkが読みに来る共有の基準である
- Role change: **Change**
  - 規則が変わる。Stepsの各行に`add:`・`update:`・`drop:`のいずれかを必須とする規則が増える
- Adjustment: **YES**
  - SlicesとStepsの形とテスト行の例を接頭辞付きに直す。Filesツリーのマーカーは残す。planが決める

#### .pi/skills/plan/SKILL.md

- Search:
  - 01: `## Test cases`（範囲: .pi/skills） - 10件/5ファイル: cycles配下のテスト行の接頭辞の有無は見えない
  - 02: `One step is one file`（範囲: .pi/skills） - 2件/2ファイル: スライスの切り方や作業順序の文脈は見えない
  - 03: `Walk the relations`（範囲: .pi/skills/plan） - 2件/2ファイル: 新設の「書く前に改めて読む」の文言はまだなく見えない
  - 04: `Write the Steps`（範囲: .pi/skills） - 1件/1ファイル: 手順6以外のSteps言及は見えない
  - 05: `Steps|Test cases`（範囲: 全リポジトリの*.test.ts） - 0件/0ファイル: テスト以外の検証（proofreaderの目視）は見えない
- Adr: 検索はADRの事実と一致する。手順6はStepsの書き方を持ち、接頭辞の定めはなく、Filesを書く前に改めて読む手順はない。差異はない
- Direction: _Read by_
- Relation: 変更がこのファイルの手順6にステップの接頭辞の書き方とplanに関わるファイルを書く前に改めて読む手順を足す
- Role: planを書く手順の台本。手順6でStepsの書き方を指示し、形の詳細をformat.mdに委ねる
- Role change: **Change**
  - 規則と流れが変わる。Steps行の接頭辞の規則が増え、書く前の読み直しが手順に増える
- Adjustment: **YES**
  - 手順6に接頭辞の綴りと対象（コード・テスト・文書）と読み直しの時点を書く。planが決める

#### .pi/skills/plan/references/tasks.md

- Search:
  - 01: `### Steps`（範囲: .pi/skills） - 3件/3ファイル: cycles配下のplan mdのSteps見出しは見えない
  - 02: `## Test cases`（範囲: .pi/skills） - 10件/5ファイル: cycles配下のテスト行の接頭辞の有無は見えない
  - 03: `Steps|Test cases`（範囲: 全リポジトリの*.test.ts） - 0件/0ファイル: テスト以外の検証（proofreaderの目視）は見えない
- Adr: 検索はADRの事実と一致する。reviewの手渡し文は各スライスの`### Verify`と`### Steps`を読み、Casesを`## Test cases`で読む。接頭辞の読み方はまだない。差異はない
- Direction: _Read by_
- Relation: 変更がこのファイルのreviewの手渡し文に接頭辞付きのStepsの読み方とファイルを読み直す手順を足す
- Role: サブエージェントへの手渡し文。reviewにStepsとVerifyの読み先とCasesの判定基準を渡す
- Role change: **Change**
  - 規則が変わる。Casesの判定が接頭辞付きのテスト行を読む規則になる
- Adjustment: **YES**
  - review文面のCasesの読み方を接頭辞付きに合わせ、読み直しの対象を書く。planが決める

#### .pi/skills/work/SKILL.md

- Search:
  - 01: `## Test cases`（範囲: .pi/skills） - 10件/5ファイル: cycles配下のテスト行の接頭辞の有無は見えない
  - 02: `Steps|Test cases`（範囲: 全リポジトリの*.test.ts） - 0件/0ファイル: テスト以外の検証（proofreaderの目視）は見えない
- Adr: 検索はADRの事実と一致する。workはテストの整理でplanのFilesが更新するテストファイルを読み、4分類を落とし、テスト steps の cases をplanの`## Test cases`で読む。差異はない
- Direction: _Read by_
- Relation: 変更されたStepsの形を読む。テスト steps の cases の判定基準をplanの`## Test cases`に求める
- Role: plan mdから作業する実行者の手順書。StepsとVerifyを作業順に使い、Test casesを整理の物差しにする
- Role change: Not change
- Adjustment: No

#### .pi/skills/work/references/tasks.md

- Search:
  - 01: `### Steps`（範囲: .pi/skills） - 3件/3ファイル: cycles配下のplan mdのSteps見出しは見えない
  - 02: `## Test cases`（範囲: .pi/skills） - 10件/5ファイル: cycles配下のテスト行の接頭辞の有無は見えない
  - 03: `Steps|Test cases`（範囲: 全リポジトリの*.test.ts） - 0件/0ファイル: テスト以外の検証（proofreaderの目視）は見えない
- Adr: 検索はADRの事実と一致する。codeの手渡し文は各スライスのStepsの次にVerifyを走らせ、reviewの手渡し文は`### Steps`を読み、テスト steps の cases をplanの`## Test cases`で読む。差異はない
- Direction: _Read by_
- Relation: 変更されたStepsの形を読む。codeはStepsの次にVerifyを走らせ、reviewはStepsとTest casesを読む
- Role: サブエージェントへの手渡し文。codeに作業順と確認順を渡し、reviewに読む先を渡す
- Role change: Not change
- Adjustment: No

### External

#### なし

- Search:
  - 01: `Outside:|Boundary.External`（範囲: .pi/skills/plan） - 3件/1ファイル: リポジトリ外の文書や役務自体は検索範囲外である
- Adr: ADRのScopeと一致する。dependencyはoutであり、外部接続や秘密や権限を扱わない。差異はない
- Relation: この変更とリポジトリの外との関係はない。接頭辞と読み直しはリポジトリ内の記述規則である
- Role: 外側で何かは存在しない
- Role change: Not change
- Adjustment: No

## 06: adr と affected のスクリプトをどう構造化し、入り口をどこに置くか

### Code

#### .pi/skills/adr/scripts/index.mjs

- Search:
  - 01: `scripts/index.mjs` in `.pi/skills/adr` - 1件/1ファイル（SKILL.md:51）: cycles 記録と plan md の Files を見ない
  - 02: `./adr.mjs・./affected.mjs・./cycle.mjs` in `scripts/index.mjs` - 3件/1ファイル（10-11行、12-23行）: 動的 import を見ない
  - 03: `git(` in `scripts/index.mjs` - 2件/1ファイル（9行の取り込み、65行の呼び出し）: テストの mock 差し替えを見ない
- Adr: ADR の案A（index.mjs を入り口にし両方の骨組みを書く、開いた cycle では両方に追記）と一致する
- Direction: _Read by_
- Relation: 開いた cycle では adr.md と affected.md に次の entry を追記し、なければ両 md を作る
- Role: 両 md の書き込みを束ねる唯一の入り口で、共通と固有をつなぐ合流点
- Role change: **Change**
  - なかった入り口ができ、scaffold.mjs の役を継ぐ
- Adjustment: No

#### .pi/skills/adr/scripts/cycle.mjs

- Search:
  - 01: `./cycle.mjs` in `.pi/skills/adr/scripts` - 2件/2ファイル（index.mjs:12-23行、index.test.ts:9-20行）: 動的 import を見ない
  - 02: `openCycleDir・nextNNN・lastEntryNumber・parseArgs` in `scripts/cycle.mjs` - 4件以上/1ファイル（10、90、127、178行付近の定義）: cycles 記録の中身を見ない
  - 03: `scaffold\.mjs` in `.pi` - 0件/0ファイル: git 履歴と cycles 記録を見ない
- Adr: ADR の案A（共通部分を開いた cycle の検出・次の番号・追記・フォルダ作成にまとめる）と一致する
- Direction: _Read by_
- Relation: index.mjs から呼ばれ、開いた cycle の検出・番号・追記・作成を受け持つ
- Role: cycle 操作だけを集めた共有部品で、adr と affected の土台
- Role change: **Change**
  - scaffold.mjs の同居から分かれ、単独の共有部品になる
- Adjustment: No

#### .pi/skills/adr/scripts/adr.mjs

- Search:
  - 01: `./adr.mjs` in `.pi/skills/adr/scripts` - 3件/3ファイル（index.mjs:10行、cycle.mjs:3行、index.test.ts:7行）: 動的 import を見ない
  - 02: `entrySkeleton・adrSkeleton` in `scripts/adr.mjs` - 2件/1ファイル（6行、49行の定義）: 呼び出し側の cycles 記録を見ない
  - 03: `adr.format.md` in `scripts/adr.mjs` - 2件/1ファイル（2行、45行の注記）: 書式の字面の一致までは見ない
- Adr: ADR の案A（adr.md の骨組みを adr.mjs に置く）と一致する
- Direction: _Read by_
- Relation: index.mjs と cycle.mjs から呼ばれ、adr.md の entry と全体の骨組みを返す
- Role: adr 側の固有部品で、adr の形だけを知る単能部品
- Role change: **Change**
  - scaffold.mjs の同居から分かれ、adr の骨組みだけを受け持つ
- Adjustment: No

#### .pi/skills/adr/scripts/affected.mjs

- Search:
  - 01: `./affected.mjs` in `.pi/skills/adr/scripts` - 2件/2ファイル（index.mjs:11行、index.test.ts:8行）: 動的 import を見ない
  - 02: `affectedEntrySkeleton・affectedSkeleton` in `scripts/affected.mjs` - 2件/1ファイル（6行、45行の定義）: 呼び出し側の cycles 記録を見ない
  - 03: `affected.format.md` in `scripts/affected.mjs` - 2件/1ファイル（2行、41行の注記）: 書式の字面の一致までは見ない
- Adr: ADR の案A（affected.md の骨組みを affected.mjs に置く）と一致する
- Direction: _Read by_
- Relation: index.mjs から呼ばれ、affected.md の entry と全体の骨組みを返す
- Role: affected 側の固有部品で、affected の形だけを知る単能部品
- Role change: **Change**
  - 新たに分かれ、affected の骨組みだけを受け持つ
- Adjustment: No

#### .pi/skills/adr/scripts/scaffold.mjs

- Search:
  - 01: `scaffold\.mjs` in `.pi` - 0件/0ファイル: git 履歴と cycles 記録を見ない
  - 02: `scaffold` in `.pi/skills/adr/SKILL.md` - 3件/1ファイル（51、58、122行の一般名詞）: path としての参照は含まない
  - 03: `scaffold.mjs` in `cycles/261103-053-dev/adr.md` - 4件/1ファイル（335、345、362、364行付近の過去の姿）: 現行コードの参照を見ない
- Adr: ADR の案A（既存の scaffold.mjs は消す）と一致し、現行 .pi に対象 path がない
- Direction: _Read by_
- Relation: 消される前の単一入り口で、index・cycle・adr・affected に分割される
- Role: adr 骨組みと cycle 操作を同居させていた旧来の一本口
- Role change: **Change**
  - 使う側が 1→0 になり、SKILL の呼び出しは index.mjs に移る
- Adjustment: No

#### .pi/skills/adr/scripts/index.test.ts

- Search:
  - 01: `./index.mjs` in `scripts/index.test.ts` - 1件/1ファイル（310行の子プロセス呼び出し）: 実 git の起動を見ない
  - 02: `affectedEntrySkeleton・affectedSkeleton` in `scripts/index.test.ts` - 4件以上/1ファイル（8、288-306行付近）: cycles 記録の中身を見ない
  - 03: `entrySkeleton・adrSkeleton・appendEntry` in `scripts/index.test.ts` - 10件以上/1ファイル（7、22-32、173-239行付近）: plan md の Files を読まない
- Adr: ADR の案A（scaffold.test.ts を index.test.ts にし、cycle・adr・affected のテストを分ける）と一致する
- Direction: _Check_
- Relation: 両骨組みの見出しと両 md への追記・作成を確かめる
- Role: 分割後の振る舞いを留める検査で、骨組みと CLI のガード
- Role change: **Change**
  - なかった検査ができ、両 md の同時作成・同時追記を固定する
- Adjustment: No

#### .pi/skills/adr/scripts/scaffold.test.ts

- Search:
  - 01: `scaffold\.test\.ts` in `.pi` - 0件/0ファイル: git 履歴と cycles 記録を見ない
  - 02: `scaffold.test.ts` in `cycles/261103-053-dev/adr.md` - 2件/1ファイル（363、374行の過去の姿）: 現行コードの参照を見ない
  - 03: `index.test.ts` in `.pi/skills/adr/scripts` - 1件/1ファイル（310行の自己参照を除く test 本体）: 旧名での参照を見ない
- Adr: ADR の案A（scaffold.test.ts を index.test.ts にする）と一致し、現行 .pi に旧名がない
- Direction: _Check_
- Relation: 消される前の検査で、index.test.ts が引き継ぐ
- Role: 旧一本口の振る舞いを留めていた検査
- Role change: **Change**
  - 使う側と確かめる対象がなくなり、後継が index.test.ts になる
- Adjustment: No

#### .pi/skills/adr/SKILL.md

- Search:
  - 01: `node .pi/skills/adr/scripts/index.mjs` in `.pi/skills/adr/SKILL.md` - 1件/1ファイル（51行）: cycles 記録と plan md の Files を見ない
  - 02: `affected.md・affected.format.md` in `SKILL.md` - 4件/1ファイル（17、19、120行付近）: 書式の字面の一致までは見ない
  - 03: `scaffold.mjs` in `.pi/skills/adr/SKILL.md` - 0件/0ファイル: 一般名詞の scaffold と cycles 記録を見ない
- Adr: ADR の案A（SKILL の呼び出しを index.mjs にする）と一致し、旧呼び出しは残らない
- Direction: _Read by_
- Relation: 変更される手順書で、入り口の呼び出し先を指し替える
- Role: adr の手順を定める文書で、入り口の案内板
- Role change: Not change
- Adjustment: No

#### lib/git-env.mjs

- Search:
  - 01: `git-env.mjs` in `.pi/skills/adr/scripts` - 1件/1ファイル（index.mjs:9行の取り込み）: mock 差し替えと cycles 記録を見ない
  - 02: `git(` in `scripts/index.mjs` - 2件/1ファイル（9行の取り込み、65行の呼び出し）: 実 git の起動結果を見ない
  - 03: `spawnSync('git'` in `lib・.pi・scripts` - 1件/1ファイル（lib/git-env.mjs:28行）: 子プロセスの出力を見ない
- Adr: ADR の事実（git が唯一の git の入り口で scaffold が取り込む、04-06も同趣旨）と一致する
- Direction: _Read_
- Relation: index.mjs が branch 名の取得で使い、継承した GIT_* を落とす働きを受ける
- Role: git 起動の一本口で、環境の混入を断つ関所
- Role change: Not change
- Adjustment: No

#### .pi/skills/adr/references/adr.format.md

- Search:
  - 01: `adr.format.md` in `.pi/skills/adr` - 5件以上/3ファイル（SKILL.md:16、18、131行、adr.mjs:2、45行、index.test.ts:180行）: 字面の一致の量までは見ない
  - 02: `entrySkeleton` in `scripts/adr.mjs` - 2件/1ファイル（6、52行付近）: cycles 記録の中身を見ない
  - 03: `references/format.md` in `.pi/skills/adr` - 0件/0ファイル: git 履歴と cycles 記録を見ない
- Adr: ADR の 02 と 06 の事実（adr の書式を adr.format.md に分け、骨組みはその形に合わせる）と一致する
- Direction: _Read_
- Relation: adr.mjs の骨組みと index.test.ts の見出し検査が形を受ける
- Role: adr の形を定める物差しで、骨組みと検査の基準
- Role change: Not change
- Adjustment: No

#### .pi/skills/adr/references/affected.format.md

- Search:
  - 01: `affected.format.md` in `.pi/skills/adr` - 6件以上/4ファイル（SKILL.md:17、19、120行、affected.mjs:2、41行、index.test.ts:287行、tasks.md:51行）: 字面の一致の量までは見ない
  - 02: `affectedEntrySkeleton` in `scripts/affected.mjs` - 2件/1ファイル（6、48行付近）: cycles 記録の中身を見ない
  - 03: `harness.json` の `copy` in `scripts/harness/harness.json` - 1件/1ファイル（3-23行の .pi 含む一覧）: 写し先の中身を見ない
- Adr: ADR の 02 と 06 の事実（affected の書式を affected.format.md に書き、骨組みはその形に合わせ、.pi ごと copy される）と一致する
- Direction: _Read_
- Relation: affected.mjs の骨組みと index.test.ts の見出し検査が形を受ける
- Role: affected の形を定める物差しで、骨組みと検査の基準
- Role change: Not change
- Adjustment: No

### External

#### なし

- Search:
  - 01: `dependency:` in `cycles/261103-053-dev/adr.md` の 06 セクション - 1件/1ファイル（343-353行の out 宣言）: 外部 registry の有無を見ない
  - 02: `deploy:` と `migration:` in 同セクション - 2件/1ファイル（355-357行の out 宣言）: 配布物と移す data の実物を見ない
- Adr: ADR の Scope（dependency・deploy・migration が out、秘密・権限・外部接続を扱わない）と一致する
- Relation: 変更と外側のやり取りはない
- Role: 外側の相手はない
- Role change: Not change
- Adjustment: No
