# ADR 036

## 01: cycle の記録を型と validator で支えるか

### Context

- 直近のレビューで、cycle の記録の field と cross-reference に食い違いが出た。
- cycle の記録は、あるステージが書き、別のステージが読む。field と cross-reference は `collect.mjs` と `scaffold.mjs` の ad-hoc regex で一部だけ読まれ、全体の検証が無い。
- ルールは `SKILL.md`、`references/format.md`、`references/tasks.md`、`README.md`、`DEFINITION.md` に分かれている。この entry はそのルールを 1 つにしない。validator が見るのは、そのルールが作る記録だけ。散文の矛盾は reviewer の読みに残る。
- `typebox` は `package.json` の `peerDependencies` にあり、`consult` の pi 拡張が tool schema と `policy/types.ts` に使っている。ルートの `devDependencies` には無く、製品の script は使っていない。
- 記録の field と cross-reference を境界で検証する仕組みが無い。

### Scope

- 変更:
  - behaviour: out — 手順は変えず、validator を足す。再訪: schema が手順を変えるとき。
  - refactor: in — schema と validator を足す。
  - dependency: out — `typebox` は `consult` の pi 拡張の peer で、製品の script は使っていない。cycle check は plain な validator にする。再訪: typebox を cycle check で使うときは `devDependencies` に足し、in に変える。
  - naming: in — 型、schema、field の名前。Unit 名は動かさない。
  - format: in — ADR / design / plan / close の記録の形。
  - prose: in — スキルと README。
- 品質:
  - speed: out — 記録は小さく、検証の速度は問題にならない。再訪: 検証が遅くなるとき。
  - security: out — 外部の入力は無い。
  - compatibility: in — 現在の cycle の記録を読めること。再訪: archive の記録まで対象にするとき。
  - errors: in — validator の error。
- 運用:
  - deploy: out — deploy は無い。
  - migration: out — 036 以降の記録だけを対象にし、古い記録は移さない。再訪: archive を検証するとき。
  - logs and monitoring: out — validator の出力は check で見る。

### Research & Trial

- `typebox` は `package.json` の `peerDependencies` にあり、`consult` の tool schema と `policy/types.ts` で使われている。これは pi 拡張の作法で、ルートの `devDependencies` には無い。
- cycle の記録は Markdown。`collect.mjs` は `- No:`、`Commit`、`Stopped`、`Findings`、`left:` を regex で読む。`scaffold.mjs` は ADR の骨を書く。
- 現在の field の一覧は `adr/references/format.md`、`design/references/format.md`、`plan/references/format.md`、`close/references/format.md` にある。
- A の cross-reference は、記録に field として書かれた参照だけを見る: plan の `No` と ADR の entry、design の plan id と plan md、close の `Triage` の `ADR <NN>` と ADR、`Verified` の Unit と `DEFINITION.md`、`Collected` の plan id と plan md。`Summary` や `Why` の意味、`Files` と `Paths` の意味の一致は reviewer の読み。`Files` の changed paths と design の `Paths` の集合は、tree を parse すれば check できる。
- trial はしていない。`typebox` は `consult` の拡張で使われているが、製品の cycle check は typebox を使わない plain な validator にする。

### Decision

- Status: **rejected**（plan / ADR と close / ADR の cross-reference のズレは、これまでの cycle で起きていない。validator のコストを今払う理由が無い）
- Adopted:
- Options:
  - **A**: Markdown のまま、plain な `cycle check` を足す。買うもの: field と cross-reference を 1 箇所で検証でき、記録は Markdown のまま。コスト: parser は regex のまま。validator は手書きの check になる。成り立たない所: 散文の矛盾は人間か reviewer の読みに残る。（採らなかった理由: cross-reference のズレが起きていない。parser と reference rule のコストに見合わない）
  - **B**: 記録を構造化データにして、Markdown を生成する。買うもの: 1 つの source で、field も cross-reference も強く検証できる。コスト: 記録の持ち方と owner の読み方が大きく変わる。散文を JSON / YAML に収める必要がある。移行が要る。成り立たない所: `Context` や `Why` の散文と、owner が読む Markdown の自由度。（採らなかった理由: cross-reference のズレが起きていない。data と generator のコストはさらに大きい）
  - **C**: スクリプトが読む field だけを `cycle check` で見る。買うもの: 最小。`No`、`Commit`、`Stopped`、`Findings`、`left` など、既に script が読む field の食い違いを止められる。コスト: `SKILL.md` と `format.md` の間の矛盾は拾えない。成り立たない所: field 以外の不整合。今回の 23 個の多くは、そちらだった。（採らなかった理由: minimal でも、今回の実害が無い）

### Definition

- `adr-skill`(kept): 記録を決める・残す main function は同じ。record の検証は今回採らない。
- `design-skill`(kept): cut の main function は同じ。record の検証は今回採らない。
- `plan-skill`(kept): plan を書く main function は同じ。record の検証は今回採らない。
- `work-skill`(kept): plan を片付ける main function は同じ。record の検証は今回採らない。
- `close-skill`(kept): 閉じる main function は同じ。record の検証は今回採らない。
- `yolo-skill`(kept): 確認を飛ばして歩く main function は同じ。record の検証は今回採らない。

## 02: base / worktree と dropped / ex- の分岐を Place と PlanState にまとめるか

### Context

- `base` / `worktree` と `dropped` / `ex-` の分岐が `design`、`plan`、`work`、`close`、`yolo` に散っている。
- `base` の plan は 035、024、029、032 にあり、`ex-` plan は 030、031、033 にある。`dropped` plan の `Stopped:` は `cycles/` に無い。
- 直近のレビューで、`close` の開始条件、review の hash、`Stopped` の書き手、`ex-` plan の `No` に文面の食い違いが出た。過去の cycle がそれで失敗した記録は、まだ示していない。
- 035 の close は `## Verified` を持たない。これは close の記録の抜けで、`Place` / `PlanState` の分岐とは別。
- `design` の `Where`、`plan` の `No` / `Stopped`、`work` の drop、`close` の trigger、`yolo` の stop が、それぞれ別の言い方で同じ分岐を持つ。
- 4 点のうち `close` の責任分割は、この cycle では扱わない。理由は、`close` の中で小さく早く直す目的があり、フローを変えるため。再訪は、`close` の小さな fix が繰り返し負担になったとき。

### Scope

- 変更:
  - behaviour: in — `base` / `worktree` と `dropped` / `ex-` の分岐の動きが変わる。
  - refactor: in — `Place` と `PlanState` を足す。
  - dependency: out — 新しい package は無い。
  - naming: in — `Place`、`PlanState`、その field。
  - format: in — design / plan の記録。
  - prose: in — スキル。
- 品質:
  - speed: out — 記録は小さく、速度は問題にならない。
  - security: out — 外部の入力は無い。
  - compatibility: in — 現在の plan の `Where` と `Stopped` を読めること。再訪: 古い plan を移行するとき。
  - errors: in — 分岐の食い違いを validator が指摘する。
- 運用:
  - deploy: out — deploy は無い。
  - migration: out — 036 以降の記録だけを対象にし、古い記録は移さない。再訪: archive を対象にするとき。
  - logs and monitoring: out — 記録の検証で見る。

### Research & Trial

- 分岐の現在地は、`design/SKILL.md` の `Where`、`plan/references/format.md` の `No` と `Notes`、`work/SKILL.md` の place と drop、`close/SKILL.md` の trigger、`yolo/SKILL.md` の stop にある。
- `base` plan は 035、024、029、032 で使われ、`ex-` plan は 030、031、033 で使われている。`dropped` plan の `Stopped:` は `cycles/` に無い。
- 035 の close は `## Verified` を持たない。close の記録の抜けで、`Place` / `PlanState` の分岐とは別。

### Decision

- Status: **accepted**
- Adopted:
  - **D**: 新しい field を足さない。`design` の `Where` を place の source、`plan` の `Commit` / `Stopped` を state の source にする。`close` は work の done / dropped で始め、祖先確認と merge ログを外す。`base` の hash は review 用に 1 行、`base` の `Stopped` は agent が書く 1 行、`yolo` は base plan を対象外にする 1 行。`ex-` plan の `No` は `Triage` 行の `ADR <NN>` から読み、plan md に写さない。`collect.mjs` は `ex-` plan の `No` を `Triage` から読む。
- Options:
  - **A**: `plan` に `Place` / `PlanState` のセクションを置き、`design` の `Where` を `Place` の source にする。買うもの: plan md に `Place` / `PlanState` の値が 1 箇所に載る。`close` / `work` / `yolo` はその値を見る。コスト: `design` の `Where` と `plan` の `Place` が重なる。古い plan md には field が無い。plan の形が変わる。成り立たない所: `Where` と `Place` の二重管理と、古い cycle の plan。plan md を design と別に読む必要は無い。worktree の subagent は既に worktree にいて、base plan は agent がやる。`Place` は `design` の `Where` の写しになる。場合分けの手順は各スキルに残る。値が 1 箇所に載っても、`base` のときの手順は消えない。（採らなかった理由: field を足しても場合分けは残る。`Place` は `Where` の写し）
  - **B**: `Place` は `design` の `Where` のままにし、`plan` には `PlanState` だけを足す。買うもの: 重複が少ない。`Place` の source は design の 1 つ。`PlanState` だけを plan に置く。コスト: state の分岐はまだ `work` / `close` / `yolo` に散る。`Place` と `PlanState` の責務が分かれる。成り立たない所: `Place` と `PlanState` を 1 箇所で見たいという intent。分けたままになる。`PlanState` は `Commit` / `Stopped` から導ける。新しい field の意味は薄い。場合分けの手順は各スキルに残る。（採らなかった理由: `PlanState` は `Commit` / `Stopped` から導ける。場合分けは残る）
  - **C**: `base` を `worktree` に畳み、`ex-` を通常の plan にする。買うもの: 分岐が大きく減る。`base` と `ex-` の特別扱いが無くなる。コスト: owner が UI を `base` で見る利便性が失われる。`close` の小さな fix の経路が変わる。フローの変更が大きい。成り立たない所: owner の目で見る必要がある front の確認。Entry 3 を外した理由と同じ重さになる。（採らなかった理由: `base` の owner look を失う。フローの変更が大きい）

### Definition

- `design-skill`(kept): cut の main function は同じ。place は `Where` のまま。
- `plan-skill`(kept): plan を書く main function は同じ。`ex-` の `No` は `Triage` から読む。
- `work-skill`(kept): plan を片付ける main function は同じ。base の hash / `Stopped` は 1 行。
- `close-skill`(kept): 閉じる main function は同じ。開始条件は work の done、`ex-` の `No` は `Triage`。
- `yolo-skill`(kept): 確認を飛ばして歩く main function は同じ。base plan は対象外。

## 03: yolo が work 中に owner のブラウザ確認をパスし、base plan を使わないと書くか

### Context

- `yolo` は「owner の確認を挟まずに歩く」スキル。description も「without the owner's confirmations」と言う。
- 今の `yolo` は、`work` 中に `Added` の owner の look が要る plan で止まる。`base` plan も走らせない。
- `work` の `Added` は、front の cmux-browser を owner が見て OK を返すこと、`base` plan は owner が各 slice を見ることを求める。
- `yolo` がそこで止まると、owner の確認を挟むことになり、「without confirmations」と合わない。`yolo` はそういうスキルなので、`work` 中の owner のブラウザ確認もパスし、`base` plan も使わない、と書く必要がある。
- 今の `work` の `Added` の owner の OK と、`yolo` の pass の関係が、`work` / `yolo` で揃っていない。

### Scope

- 変更:
  - behaviour: in — `yolo` の `work` が owner の `Added` をパスし、`base` plan を使わない。
  - refactor: out — code の構造ではなく、`yolo` / `work` の手順。再訪: `Added` の pass を記録の field にするとき。
  - dependency: out — 新しい package は無い。
  - naming: out — 新しい名前は要らない。再訪: `pass` を名前付きの状態にするとき。
  - format: out — `plan` の `Verify` の形は変えない。再訪: `Added` の pass を `Acceptance` の field にするとき。
  - prose: in — `yolo` / `work` の手順。
- 品質:
  - speed: out — 速度の目標は無い。
  - security: out — 外部の入力は無い。
  - compatibility: out — 外部の interface は無い。
  - errors: out — validator の対象ではない。
- 運用:
  - deploy: out — deploy は無い。
  - migration: out — 記録の移行は無い。
  - logs and monitoring: out — 記録の検証で見る。

### Research & Trial

- `yolo` の description は「without the owner's confirmations」で、`work` では「a plan's Added check needs the owner's look」を停止条件にしている。`base` plan は走らせない。
- `work` の `Added` は、front の cmux-browser を owner が見て OK を返すこと、`base` plan は owner が各 slice を見ることを求める。
- `yolo` の `close` は `## Verified` を残さない。Unit の verification は owner のものとして、`yolo` ではやらない。
- `yolo` の pass と `work` の owner の OK の関係は、`work` / `yolo` の文面で揃っていない。
- trial はしていない。

### Decision

- Status: **accepted**
- Adopted:
  - **A**: `yolo` の `work` は、`Added` の owner の look（front の cmux-browser、`base` の slice）をパスする。`base` plan は使わず、全 plan を worktree にする。agent の check を `Acceptance` に残す。買うもの: `yolo` は owner の確認なしで close まで届く。コスト: front の owner の見た目が無くなる。agent の check の質に依存する。成り立たない所: owner の目でしか分からない front の品質。
- Options:
  - **B**: 今の `yolo` のまま。`Added` の owner の look が要る plan で止まり、`base` plan も走らせない。買うもの: owner の確認を飛ばさない。コスト: `yolo` が front の plan で止まり、close まで届かない。「without confirmations」と合わない。成り立たない所: `yolo` の目的。（採らなかった理由: `yolo` が front の plan で止まり、close まで届かない。「without confirmations」と合わない）
  - **C**: `yolo` は `Added` の owner の look をパスするが、`base` plan は agent の look で使う。買うもの: `base` の plan を yolo でも使える。コスト: `base` の目的（owner の目）を失う。owner の確認なしで `base` を使う意味が薄い。成り立たない所: `base` の意味。（採らなかった理由: `base` の目的（owner の目）を失う）

### Definition

- `yolo-skill`(kept): owner の確認を挟まずに歩く main function は同じ。変わるのは work の pass と base の扱い。
- `work-skill`(kept): plan を片付ける main function は同じ。yolo のときは `Added` の owner の look をパスする。
- `design-skill`(kept): cut の main function は同じ。yolo の plan は worktree にする。
- `plan-skill`(kept): plan を書く main function は同じ。`Added` の形は変えない。
- `close-skill`(kept): 閉じる main function は同じ。yolo の `## Verified` は残さない。
