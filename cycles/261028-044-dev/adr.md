# ADR 044

## 01: ロードマップを `DEFINITION.md` の外のレイヤーとしてどう置くか

### Context

- サイクルは内側だけで回っており、`DEFINITION.md` を変えるときは ADR が決め、design が切り分け、plan が書き、close が閉じる。
- 外側が無いため、何を作り、どこを 1.0 とするかがどの記録にも無い。
- オーナーが `ROADMAP.md` をルートに置いたもので、表は 2 つあり（`ROADMAP.md:5-7` の `1.x.x`、`ROADMAP.md:13-20` の `0.x.x`）、列は 5 つ（`No` / `Ver` / `cycles` / `priority` / `title`）、下に `### <Ver> <No>` のセクションが並び、各セクションが `description` と `ideas` を持つ（`ROADMAP.md:22-49`）。
- ロードマップは `DEFINITION.md` の外のレイヤーであり（オーナーの読み）、Unit とはしない。
- `ROADMAP.md:54` は `cycles` が空を未着手と読むと書いているが、オーナーは、`cycles` が埋まっていることを完了と読まず、複数の番号を許す。進みは `status` の列で持つ。
- `rules/` には `definition.format.md` と `definition.rules.md` があるが、ロードマップには形も規則も無い。
- `ROADMAP.md:15` の綴りが `prpduct` である。
- `package.json` に `version` が無く（`package.json:2` は `name` だけ）、`git tag` の出力も空である。
- `rules/definition.format.md:3` は `DEFINITION.md` はバージョンを持たず差分は git が持つと定めており、ロードマップは `Ver` を持つため、2 つのファイルでバージョンの扱いが違う。
- ロードマップを書くのも読むのも人とエージェントだけであり、処理も待ち時間も伴わない。

### Scope

- 変更:
  - behaviour: in — `ROADMAP.md` の形と規則を `rules/` に置き、`status` の列（`todo` / `wip` / `done`）と、複数の番号を許す `cycles` の列を定める。
  - refactor: out — 既存のコードを組み替えない（触るのは文書だけ）。
  - dependency: out — パッケージを足さない。
  - naming: in — 半適用の改名の参照を揃えるもので、対象は `rules/definition.rules.md:5`、`rules/definition.format.md:71`、`.pi/skills/adr/SKILL.md:16-17` であり、`scripts/harness/harness.json:4` の `"definition"` はハーネスの担当なので本サイクルの外に置く。
  - format: in — `rules/roadmap.md` を新設し、形と規則を 1 枚に入れる。
  - prose: in — `ROADMAP.md:15` の綴りと、`rules/definition.format.md:61` の近くの 1 行を直す。
- 品質:
  - speed: out — 待ち時間を持つ処理を足さない。
  - security: out — 権限も入力も増えない。
  - compatibility: out — 製品への配り方は 05 が持つ。
  - errors: out — この entry に異常系が無い（読むのは人とエージェントだけである）。
- 運用:
  - deploy: out — `Deploy` は `なし`。
  - migration: out of this cycle — 既存プロダクトへの配布は 05 と `0.9.1 003` が持つ。
  - logs and monitoring: out — 記録は `cycles/` と git が持つ。

### Research & Trial

- 決定が乗る事実はすべて repo の中で読め、外を調べる問いが立たないので `research` は走らせていない。
- `ROADMAP.md:5-20` — 表は 2 つで列は 5 つあり、`1.x.x` の表は 1 行（`001` / `1.0.0` / `high` / ロードマップ調整）である。
- `ROADMAP.md:22-26` — `0.9.2` の 3 項目（`006` / `005` / `004`）はセクションだけがあり、`description` も `ideas` も無い。
- `ROADMAP.md:9` — `### 1.0.0 001` のセクションは空である。
- `ROADMAP.md` の `priority` は `high`、`mid`、`low` の 3 語だけである（`ROADMAP.md:7`、`15-20`）。
- `ROADMAP.md` の `cycles` の列は、6 行とも空である。
- `ROADMAP.md:5-7` と `13-20` の表は列が 5 つなので、`status` を足すと 6 つになり、見出しと 6 行を書き換えることになる。
- `package.json` に `version` が無く `git tag` が空であるため、`Ver` は repo のどの値とも紐づいていない。
- `rules/definition.format.md:3` — `DEFINITION.md` はバージョンを持たない。
- `rules/definition.rules.md:24-27` — 行は主たる機能を書き経路と検査は書かないため、手順の変更では行が動かない。

### Decision

- Status: **accepted**
- Adopted:
  - `rules/roadmap.md` を 1 枚置いて形と規則をその中に入れ、`definition.*` の 2 枚構成とは揃えない。
  - `Ver` は `git tag` にも `package.json` の `version` にも紐づけない。
  - `product:ready` の差し替え先は、`rules/roadmap.md` の中の雛形にする。
  - 表に `status` の列を足し、値は `todo`、`wip`、`done` の 3 つにする。
  - `cycles` の列は複数の番号を許し、番号が入っていることを完了と読まない。
  - `ROADMAP.md:54` の「`cycles` が空なら未着手」の読みは捨てる。
- Options:
  - 案 A: `rules/` に形と規則の 2 枚を置く案で、`definition.*` と同じ構成になり `product:ready` の差し替え先も 1 つに定まるが、規則がそこまで多くなく 1 枚で読めるので採らなかった。
  - 案 C: 規則を書かず `ROADMAP.md` 自身を例にする案で、増えるファイルが無いが、`product:ready` の差し替え先が `ROADMAP.md` 自身になって雛形と製品の実物が同じファイルで回るので採らなかった。
  - 案 D: 案 A に加えて `Ver` を `package.json` の `version` に紐づけ、バージョンを打つステージを `work` か `close` に置く案で、バージョンが repo の値として 1 つに定まるが、`package.json` に `version` が無いので新設が必要になり、tag を打つ対象もこの repo には無いので採らなかった。

### Definition

- なし（`DEFINITION.md` の外のレイヤーなので、`Unit` も `Who` も `Stack` も `What` も動かない）。

## 02: `propose` を捨て、3 つの問いをどこにも残さないと何が消えるか

### Context

- オーナーが `propose` を本サイクルで捨てると決め、3 つの問い（残り物・不足・不要）も、`research` を走らせるステージも、候補を並べるステージも、どこにも残さない。
- `close` の `proposed` は残す（オーナーの指示）。残り物の行き先は 3 つのままである。
- `propose` は `.pi/skills/propose/SKILL.md` と `.pi/skills/propose/references/tasks.md` の 2 枚である。
- `propose` は ADR の 2 つの入口の 1 つであり（`.pi/skills/propose/SKILL.md:8`）、3 つの問いを持つ（`:14-18`）。
- 残り物の出所は `close.md` の `Triage` の `proposed` と archive の ADR の `rejected` であり（`.pi/skills/propose/SKILL.md:22`）、不足の出所は `DEFINITION.md` の全行と `Who` の `Needs`（`:23`）で、不要の出所も `DEFINITION.md` の全行である（`:24`）。
- `close` の `proposed` は「次のサイクルが運ぶ」と定まっており（`.pi/skills/close/SKILL.md:48`、`.pi/skills/close/references/format.md:51`）、運び手を名指ししていない。
- `close` は残り物の行き先を 3 つ持ち（`.pi/skills/close/SKILL.md:44-49`）、`ex-plan`、`proposed`、`dropped` である。
- `propose` を指す記述は `.pi/skills/adr/SKILL.md:3`、`.pi/skills/adr/SKILL.md:21`、`DEFINITION.md:35`、`README.md:12`、`README.md:61`、`README.md:73`、`README.ja.md:12`、`README.ja.md:61`、`README.ja.md:73`、`AGENTS.md:3` の 10 箇所あり、`.pi/skills/propose/SKILL.md:24` はファイルごと消える。
- `.pi/skills/brief/SKILL.md:8` は「the front of the ADR」と単数で書いており `propose` を指しておらず、`.pi/skills/adr/SKILL.md:31` などの「the front」も `brief` だけで読める。

### Scope

- 変更:
  - behaviour: in — `propose` を消す。`close` の残り物の行き先 3 つは動かさない。
  - refactor: out — 他のスキルの手順を組み替えない（`brief` は 03、`close` は 04 が持つ）。
  - dependency: out — パッケージを足さない。
  - naming: in — `Unit.propose-skill` を落とし、README の「8 つ」を「7 つ」に直す。
  - format: out — `close.md` の形は動かない（`proposed` を残すため）。
  - prose: in — `README.md:12`、`README.md:61`、`README.md:73`、`README.ja.md:12`、`README.ja.md:61`、`README.ja.md:73`、`AGENTS.md:3`、`.pi/skills/adr/SKILL.md:3`、`.pi/skills/adr/SKILL.md:21` を直す。
- 品質:
  - speed: out — 待ち時間を持つ処理を足さない。
  - security: out — 権限も入力も増えない。
  - compatibility: out — 製品への配り方は 05 と `0.9.1 003` が持つ。
  - errors: out — 行き先が 3 つのままで、新しい場合分けが無い。
- 運用:
  - deploy: out — `Deploy` は `なし`。
  - migration: out of this cycle — 既存プロダクトから `propose` を消すのは `0.9.1 003` のハーネス同期が持つ。
  - logs and monitoring: out — 記録は `cycles/` と git が持つ。

### Research & Trial

- 決定が乗る事実はすべて repo の中で読め、外を調べる問いが立たないので `research` は走らせていない。
- `.pi/skills/propose/SKILL.md:14-18` — 3 つの問いを 1 回で聞くと定めている。
- `.pi/skills/propose/SKILL.md:28-46` — コードを読むステージ、`research` を走らせるステージ、2 から 4 の候補を並べるステージの 3 つを定めている。
- `.pi/skills/close/SKILL.md:44-49` — 残り物の行き先は `ex-plan`、`proposed`、`dropped` の 3 つである。
- `.pi/skills/close/SKILL.md:44` — 「まず、`DEFINITION.md` の一部を動かす残り物は `proposed` へ」と定めており、この行はそのまま残る。
- `.pi/skills/close/SKILL.md:50` — `ex-plan` はコードを直す物で、`DEFINITION.md` は動かさないと定めている。
- `.pi/skills/close/references/format.md:51` — `proposed` は「次のサイクルが運ぶ」と定めている。
- `DEFINITION.md:35` — `propose-skill` の行は「エージェントが、プロジェクトの状態から次の議題を提案できる」である。
- `.pi/skills/` の下で `propose` を持つディレクトリは `.pi/skills/propose/` だけである。

### Decision

- Status: **accepted**
- Adopted:
  - `.pi/skills/propose/` の 2 枚を消し、3 つの問いも `research` を走らせるステージも候補を並べるステージもどこにも移さない。
  - `close` の残り物の行き先 3 つ（`ex-plan`、`proposed`、`dropped`）は動かさない。
- Options:
  - 3 つの問いをロードマップに移し、`proposed` を `close` が `ROADMAP.md` に 1 行足す案を並べたが、オーナーが内容をどこにも残さないと決めたので採らなかった。
  - 3 つの問いをロードマップに移し、`proposed` を次のサイクルの `brief` が拾う案、`brief` の 1 ステージとして吸収する案、`propose` をそのまま残す案も並べたが、どれも同じ理由で採らなかった。
  - `close` の `proposed` も捨てて行き先を 2 つにする案を並べたが、オーナーが `proposed` を残すと決めたので採らなかった。

### Definition

- `Unit.propose-skill`(dropped):

## 03: `brief` がロードマップをどの位置で見るか

### Context

- `brief` は第 1 ステージで意図を詰め（`.pi/skills/brief/SKILL.md:28-33`）第 2 ステージで範囲を決める（`:35-43`）が、ロードマップを読む位置が無い。
- オーナーの読みは「意図を詰めた後に、ロードマップの確認」であり、意図が先でロードマップが後である。
- オーナーの `ROADMAP.md:55` の読みは「briefはまず、ロードマップを見る→どれに当てはまるかユーザーに聞く→あればそれ。ない場合は、追記が必要。オーナーに内容を提示、合意で追記。」である。
- 02 により、`brief` が ADR の唯一の入口になる。
- `.pi/skills/brief/SKILL.md:8` は既に「the front of the ADR」と単数で書いてあり、`.pi/skills/adr/SKILL.md:31` の「what the front left」も `brief` だけで読める。
- `brief` の `description`（`.pi/skills/brief/SKILL.md:3`）はロードマップに触れていない。
- `brief` は第 8 ステージで止まる（`.pi/skills/brief/SKILL.md:81-83`）ため、`ROADMAP.md` を書くステージは無い。

### Scope

- 変更:
  - behaviour: in — 第 1 ステージの後ろにロードマップの確認を置き、`status` が `todo` か `wip` の項目から当てはまる物をオーナーに聞き、選んだ項目の `status` を `wip` にする。無ければ内容を提示し、オーナーの合意で追記する。
  - refactor: out — 第 1 ステージと第 2 ステージの中身を組み替えない。
  - dependency: out — パッケージを足さない。
  - naming: out — `brief-skill` の名前は動かない。
  - format: out — `brief` は形を持たない（`references/tasks.md` はサブエージェントに渡す文だけである）。
  - prose: in — `.pi/skills/brief/SKILL.md:3` の `description` と、`:8` の前口上を直す。
- 品質:
  - speed: out — 待ち時間を持つ処理を足さない。
  - security: out — 権限も入力も増えない。
  - compatibility: out — 製品への配り方は 05 と `0.9.1 003` が持つ。
  - errors: in — `ROADMAP.md` が無い、当てはまる項目が無い、の 2 つの場合の手順を決める。`cycles` のセルが埋まっている場合は、書く側の 04 が持つ。
- 運用:
  - deploy: out — `Deploy` は `なし`。
  - migration: out of this cycle — 既存プロダクトの `brief` の入れ替えは `0.9.1 003` が持つ。
  - logs and monitoring: out — 記録は `cycles/` と git が持つ。

### Research & Trial

- 決定が乗る事実はすべて repo の中で読め、外を調べる問いが立たないので `research` は走らせていない。
- `.pi/skills/brief/SKILL.md:14-24` — 終わりの条件は 5 つでステージの数も選択肢の数も条件に入っておらず、ステージを 1 つ足しても終わりの条件は動かない。
- `.pi/skills/brief/SKILL.md:35-43` — 第 2 ステージで範囲を決め、オーナーが直し、ADR が `Scope` として書くと定めている。
- `.pi/skills/brief/SKILL.md:92` — 「Do not decide」と定めており、追記を決めるのはオーナーである。
- `ROADMAP.md:54` — 「cycleが空が未着手という解釈」と書いてある。
- `.pi/skills/adr/SKILL.md:22` — ADR の置き場は `cycles/` の連番から決まり、`ROADMAP.md` の `No` とは別である。

### Decision

- Status: **accepted**
- Adopted:
  - 第 1 ステージ（意図）を詰めた後にロードマップの確認を独立したステージとして置き、範囲を決める第 2 ステージはその次に置く。
  - 確認では、`status` が `todo` か `wip` の項目から当てはまる物をオーナーに聞く。`done` は候補にしない。無ければ `brief` が内容を提示してオーナーの合意で `ROADMAP.md` に追記するが、追記を決めるのはオーナーである。
  - 項目を選んだら、`status` を `wip` にする。追記と同じく、書くのはオーナーの合意があってからにする。
- Options:
  - 意図を詰める前にロードマップを聞く案を並べたが、項目を知ってから意図を書くとオーナーの言葉が項目に引きずられるので採らなかった。
  - 意図を詰める中で 1 行だけ聞く案を並べたが、項目の確認と意図の確認が同じステージに混ざるので採らなかった。
  - `brief` では聞かず `adr` の第 1 ステージで entry の問いとして聞く案を並べたが、`brief` が項目を知らないまま選択肢を作るので採らなかった。

### Definition

- `Unit.brief-skill`(kept): 行の主たる機能は「エージェントが、サイクルの要件を調べ、詰めて、ADR に渡せる」で変わらず、変わるのは入力と手順なので `rules/definition.rules.md:24-27` により行は動かない。

## 04: `close` のどの位置で `cycles` を書くか

### Context

- `close` の第 9 ステージは「`close.md` と `ex-` plan を 1 つの commit」と定めている（`.pi/skills/close/SKILL.md:85`）。
- オーナーの指示は `ex-` の plan はマージした時点で単独にコミットし最後に `close.md` と `ROADMAP.md` を 1 つにコミットする、という 2 つである。
- `cycles` のセルに番号が入っていても完了ではない（01）。複数の番号を許すので、埋まっていることは異常ではない。
- `cycles` を書く前にはオーナーの合意が要り、合意できるのはオーナーだけなのでこれは問いではなく前提である。
- `yolo` は triage の手前で止まり（`.pi/skills/yolo/SKILL.md:53`）、その判断より後は `yolo` の仕事ではない（`:55`）。
- `ROADMAP.md` は、ADR が決めて plan が書く、という経路を持たない最初のファイルになり、それを `close` が直接書く。
- `close.md` の形には、サイクルナンバーの欄が無い（`.pi/skills/close/references/format.md:5-33`）。
- `close` の残り物の行き先 3 つは 02 でも動かさない（`.pi/skills/close/SKILL.md:44-49`）。

### Scope

- 変更:
  - behaviour: in — `close` の第 7 ステージ（オーナーの判断）の後ろに、`cycles` に番号を追記し `status` を書くステージを置く。
  - refactor: out — `close` の他のステージの並びを組み替えない。
  - dependency: out — パッケージを足さない。
  - naming: out — `close-skill` と `yolo-skill` の名前は動かない。
  - format: out — `close.md` は `# Close <NNN>` を既に持つため、欄は足さない。
  - prose: in — `.pi/skills/close/SKILL.md:85` の commit の文をオーナーの指示（`ex-` は先、最後に `close.md` と `ROADMAP.md`）に直すもので、本件と関係ない修正である。
- 品質:
  - speed: out — 待ち時間を持つ処理を足さない。
  - security: out — 権限も入力も増えない。
  - compatibility: out — 製品への配り方は 05 と `0.9.1 003` が持つ。
  - errors: out — 埋まっているセルは異常ではない（複数の番号を許すため）。
- 運用:
  - deploy: out — `Deploy` は `なし`。
  - migration: out of this cycle — 既存プロダクトの `close` の入れ替えは `0.9.1 003` が持つ。
  - logs and monitoring: out — 記録は `cycles/` と git が持つ。

### Research & Trial

- 決定が乗る事実はすべて repo の中で読め、外を調べる問いが立たないので `research` は走らせていない。
- `.pi/skills/close/SKILL.md:83-85` — 第 9 ステージは commit で、`close.md` と `ex-` plan を 1 つに入れると読める。
- `.pi/skills/close/SKILL.md:47` と `:59` — `ex-` の plan は close の途中で work を走らせてマージし close を再開すると定めており、plan の md を誰がコミットするかは書いていない。
- `.pi/skills/work/SKILL.md:30` — サイクルのファイル（`adr.md`、`design.md`、`plan/*.md`）は work の最初にコミットすると定めており、close の途中で書いた `ex-` の plan はこの時点より後になる。
- `.pi/skills/yolo/SKILL.md:51-55` — `yolo` は triage の手前で止まり、その判断より後は yolo の仕事ではないと定めている。
- `.pi/skills/close/references/format.md:5-33` — `close.md` の形は `Collected`、`Triage`、`Verified` の 3 つで、サイクルナンバーの欄は無い。
- `ROADMAP.md:56` — オーナーの読みは「closeの手順で、最後にcyclesに、サイクルナンバーを記入（044など）、close.mdと一緒にコミット」である。
- `.pi/skills/adr/scripts/scaffold.mjs:106-113` — サイクルナンバーは `cycles/` と `cycles/archive/` の最大に 1 を足して決まり、このサイクルは `044` である。

### Decision

- Status: **accepted**
- Adopted:
  - 第 7 ステージ（オーナーの判断）の後ろに、`cycles` を書く独立したステージを置く。
  - `cycles` のセルには番号を追記し、上書きしない。既に番号が入っていても、そのまま足す。
  - `status` は、オーナーの確認で `done` にするか `wip` のままにする。
  - commit は 2 つに分け、`ex-` の plan とその仕事はマージした時点で単独にコミットし、`close.md` と `ROADMAP.md` は最後に 1 つにコミットする。
- Options:
  - 案 A: 第 9 ステージの commit の直前に書く案で、結果は採った形と同じになるが、オーナーの判断と記入の間に commit の準備が挟まるので採らなかった。
  - 案 C: `close` では書かず次のサイクルの `brief` が埋める案で、サイクルが閉じた時点の `ROADMAP.md` が一時的に嘘になるので採らなかった。
  - 案 D: `cycles` を書かず git に任せる案で、`ROADMAP.md` を読んだだけではどの項目が済んだか分からなくなり、オーナーの「close が記入する」とも合わないので採らなかった。

### Definition

- `Unit.close-skill`(kept): 行の主たる機能は「エージェントが、サイクル終了後に、クロージングできる」で変わらず、変わるのは手順と commit の切り方である。
- `Unit.yolo-skill`(kept): 行の主たる機能は「エージェントが、オーナーの確認を挟まずにクローズのトリアージまで進めることができる」で変わらず、`cycles` の記入はその後に置くので `yolo` の止まる位置も動かない。

## 05: `product:ready` の対象をどう持ち、棚卸しで何を足すか

### Context

- `ROADMAP.md` は `product:ready` の対象であり（オーナーの決定）、差し替え先は `rules/roadmap.md` の中の雛形である（01 が作る）。
- 今の対象は `cycles/` の dir を消すこと（`scripts/product-ready/targets.mjs:5`）、`test` と `test:run` と `test:related` から `--config vitest.starter.config.ts` を外すこと（`scripts/product-ready/index.mjs:6-8`）、`vitest.starter.config.ts` を消すこと（`scripts/product-ready/index.mjs:87-89`）の 3 つである。
- `scripts/product-ready/targets.mjs:22-36` の `pick` は `dirs` しか実装が無いため、ファイルを差し替えるには種類の追加が要る。
- 実行の入口は `node scripts/product-ready/index.mjs`（`package.json:9`）で、引数なしは表示だけで `--run` を付けると実行し（`scripts/product-ready/index.mjs:68-70`）、`--only <label>` で 1 種類に絞れる（`scripts/product-ready/cli.mjs:19-31`）。
- `README.ja.md:29` は `product:ready` の 3 つの動きを書いているが、`ROADMAP.md` は書かれていない。
- 製品に残って嘘になる物があるかを repo の全ファイルについて調べ、結果は `Research & Trial` に並べる。
- `ROADMAP.md:15` の `006`（`0.9.2`、`mid`、`prpduct readyの調整`）が、product ready の調整を別の項目として持っている。

### Scope

- 変更:
  - behaviour: in — `product:ready` が `ROADMAP.md` を雛形に差し替え、対象を棚卸しする。
  - refactor: in — `scripts/product-ready/targets.mjs` の表を、消す物と差し替える物に分ける。
  - dependency: out — パッケージを足さない。
  - naming: in — 対象の名前を揃え、`README.ja.md:29` の 3 つの列挙を揃える。
  - format: in — `ROADMAP.md`、`DEFINITION.md` の `Product` と `What`、`README.md`、`README.ja.md` を雛形に差し替え、README の雛形を `rules/` に新しく作る。
  - prose: in — `README.md` の Use it 節と `README.ja.md:29` を揃える。
- 品質:
  - speed: out — 待ち時間を持つ処理を足さない。
  - security: out — 権限も入力も増えない。
  - compatibility: in — 製品に残る物の棚卸しが、そのまま互換の判断になる。
  - errors: in — `ROADMAP.md` が無い、`rules/roadmap.md` が無い、の 2 つで `product:ready` がどう振る舞うかを決める。
- 運用:
  - deploy: out — `Deploy` は `なし`。
  - migration: in — 既存プロダクトで `product:ready` を再実行したときに、`ROADMAP.md` と `cycles` がどうなるかを決める。
  - logs and monitoring: out — 記録は `cycles/` と git が持つ。

### Research & Trial

- 決定が乗る事実はすべて repo の中で読め、外を調べる問いが立たないので `research` は走らせていない。
- `scripts/product-ready/targets.mjs:5` — スターターだけの物は `{ label: 'cycles', at: 'cycles', pick: 'dirs' }` の 1 行である。
- `scripts/product-ready/targets.mjs:22-36` — `pick` は `dirs` のときだけ動き、それ以外の値は何もしない。
- `scripts/product-ready/index.mjs:71-93` — 消す、`package.json` の `scripts` を直す、`vitest.starter.config.ts` を消すという 3 つを順に行う。
- `scripts/product-ready/cli.mjs:45-58` — 表示は `config` と `scripts` の 2 行を出し、`--only` は label で絞る。
- `cycles/` — `038` から `043` までの 6 つと `archive` があり、製品には持ち越す記録が無い。
- `package.json:10-12` — `test`、`test:run`、`test:related` に `--config vitest.starter.config.ts` が付き、製品は `vitest.config.ts` を使う。
- `vitest.starter.config.ts` — `vitest.config.ts` の `testConfig(true)` を呼ぶ 2 行であり、製品は `testConfig(false)` を既定で使う。
- `ROADMAP.md` — `0.9.0` から `1.0.0` までの予定が入り、製品の予定ではない。
- `DEFINITION.md:3-9` — `Product` は「ハーネス付きスターター」、`What` は「プロジェクトと、そのエージェント用ハーネスが一緒に立ち上がるスターター」であり、製品では自分の名前と説明になる。
- `README.md` と `README.ja.md` — どちらも 73 行で見出しは「入っているもの」「使い始める」「検査」「ハーネス」「サイクル」であり、スターターの使い方が書いてある。
- `.github/workflows/pullfrog.yml` — 78 行で `workflow_dispatch` の入力を 2 つ取り `pullfrog/pullfrog@v0` を走らせ、1 行目に「DO NOT EDIT EXCEPT WHERE INDICATED」と書いてあるがどの repo でも動く。
- `scripts/harness/starter.json` — `{"starter": "~/Desktop/main/_pj-starter-pi-v3"}` の 1 行であり、`scripts/harness/harness.json:20` の `skip` に入っており同期の外にある。
- `.pi/extensions/consult/types.json` — 5 つのロール（`research` / `review` / `proofreader` / `trial` / `code`）とロールごとのモデル名が入り、`README.ja.md:30` が手で変えろと書いている。
- `AGENTS.md` — 2 行でサイクルの進め方と一時ファイルの扱いを書いており、製品でも同じである。
- `scripts/product-ready/` — `cli.mjs`、`index.mjs`、`targets.mjs` と 3 つの test の 6 枚であり、一度きりの道具である。
- `scripts/harness/harness.json:4` — `copy` に `"definition"` が残っており `rules/` は同期の外にあるため、製品とスターターで `rules/` が揃わない期間がある。
- `rules/definition.format.md:61` — ハーネスの他の行（スキル、検査、`agent-rules`、`usage-readme`、拡張）は clone の物で、製品にも残ると定めている。
- `rules/definition.format.md:75` — 中身の無いセクションは省くと定めており、`Product` と `What` を空にするとこの行と `## Shape` の形が合わなくなる。
- `rules/` — `definition.format.md`、`definition.rules.md`、`roadmap.md`（01 が作る）の 3 枚であり、README の雛形は無い。
- `README.md` と `README.ja.md` — 見出しは 5 つで揃っており、雛形はその 5 つを残して中身を空にする形になる。

### Decision

- Status: **accepted**
- Adopted:
  - 表を「消す物」と「雛形に差し替える物」の 2 つに分ける。
  - 差し替えるのは 4 つである。`ROADMAP.md`、`DEFINITION.md` の `Product` と `What`、`README.md`、`README.ja.md`。
  - 雛形は 3 つに分かれる。`ROADMAP.md` は `rules/roadmap.md` の中（01 が作る）、`DEFINITION.md` は `rules/definition.format.md:9-35` の `Shape`、`README.md` と `README.ja.md` は `rules/` に新しく作る。
- Options:
  - 案 A: 表を「消す物」と「雛形に差し替える物」の 2 つに分け足すのは `ROADMAP.md` だけにし、`DEFINITION.md` の `Product` と `What`、`README.md`、`README.ja.md` は人が書く物として残す案で、作業は小さいが、製品にスターターの名前と説明と使い方が残るので採らなかった。
  - 案 B: 案 A に加えて `DEFINITION.md` の `Product` と `What` も雛形に差し替える案で、`README.md` と `README.ja.md` にスターターの使い方が残るので採らなかった。
  - 案 D: 表に `template` の道を持たせ差し替えの雛形を `rules/` のファイルから読む案で、雛形の出所が表に載るが、差し替える物が 4 つで雛形が 3 つに分かれるため行ごとに道を書き分けることになり、表の 1 行が長くなるので採らなかった。

### Definition

- `Unit.product-ready`(kept): 行の主たる機能は「owner が、ハーネスのテストを外した状態に切り替え、プロダクト開発を始められる」で変わらず、変わるのは対象の持ち方と差し替える物の種類である。
- `Unit.usage-readme`(kept): 行の主たる機能は「owner が、このスターターの使い方を読むことができる」で変わらない。`product:ready` が差し替えるのは中身であり、製品でも使い方の README を読める。
- `Product`(kept): 行は「ハーネス付きスターター」のままで、`product:ready` が差し替える相手は製品の名前である。
- `What`(kept): 行はスターターの説明のままで、`product:ready` が差し替える相手は製品の説明である。
