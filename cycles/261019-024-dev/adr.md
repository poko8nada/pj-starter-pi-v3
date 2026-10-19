# ADR 024

## 01: plan を切る材料を、どこで集めるか

### Context

- オーナーの指摘: design はサイクル全体を見られる唯一のステージなのに、読むのは `DEFINITION.md` と ADR だけである（`.pi/skills/design/SKILL.md:20-23`）。
- 依存の辺が分からないと、切る規則（同じ入力を読む物は 1 つ、他の plan に依存する物は後ろ）を当てられない。
- `design/references/format.md:48` は「The files are not known here; the plan stage finds them」と書き、ファイルの話を plan のステージへ送っている。
- その穴を plan のステージから埋める道があり、`## Refactor` と step 8 がそれを担う（`.pi/skills/plan/SKILL.md:57-63`）。design への書き戻しである。
- この道は一度も使われていない。`## Refactor` は 8 サイクルの design.md のどれにも無い。
- オーナーの前提: design から plan へは戻らない。書いた後に切り直さない。

### Decision

- Status: **accepted**
- Adopted:
  - design に調査のステージを足す。ADR の accepted の entry ごとに並行で `research` を走らせる。
  - リサーチの問いは、その entry が触る Unit について、Unit を跨いで関連する path を挙げることである。(a) この変更が読む物、(b) この変更の結果を読む物、(c) これを検査する物、(d) 生成物、(e) 文書。今存在する path だけを、path と理由の組で返させる。
  - 結果は design.md の冒頭の `## Possibly related files` に、entry ごとの path の一覧として書く。重複は消さない。同じ path が複数の entry に出ることが、切る材料である。
  - 切る時は、同じ path を持つ entry は同じ plan の候補にし、他の plan の path を読む entry を後に、多くの entry から読まれる path を持つ plan を先にする。
  - plan の `## Refactor` と step 8 を消す。
- Options:
  - plan のステージで依存を見る（1 つの plan しか見えない。design は全体を見られる唯一のステージである）
  - 何も調べない（切る規則が「同じ入力を読む物」を判定できず、切る理由が推測になる）
  - design がディレクトリの形や file の存在を決める（何を書くかが先に決まらないと file は決まらない。plan との乖離が必ず生まれる）

### Research & Trial

- `design/SKILL.md` の手順は 6 つで、リサーチのステージも、対象と依存を洗うステージも無い（`:18-51`）。
- `README.md:62` も design の役割を「cut the cycle into plans, and say where each runs」と書き、リサーチを持たせていない。
- `plan/SKILL.md:59-63` は、plan のステージで見つけた共有物について design に `## Refactor` を足し、他の plan の `Files` を書き換えさせる。
- `close/scripts/collect.mjs:226` は「`## Refactor` などは plan ではない」と扱う。このセクションは plan の形を持たないので、`Where` も決まらない。
- 出典の形は `brief/references/tasks.md:5-18` に既にある。`research` サブエージェントへ渡す文面である。
- このサイクルで 6 本走らせた。`README.md` と `README.ja.md` が 6 つの entry 全部の一覧に出て、`close/scripts/collect.mjs` が 4 つに出た。`propose/SKILL.md:22` が `close.md` の `Triage` を読むことは、どの entry も名指していない。

### Definition Change

- `Unit.design-skill`(updated): エージェントが、サイクルを plan に切る材料を調べ、切り方と、どこで走らせるかを決められる

## 02: plan の「the project's rules」の規則をどうするか

### Context

- `plan/SKILL.md:27` と `plan/references/format.md:80` は「the project's rules に合わないファイルは、その plan で直す」と書く。
- その「the project's rules」を持つファイルが repo に無い。`AGENTS.md` はサイクルの話で、`definition/rules.md` は `DEFINITION.md` の名前の話である。
- 01 の決定で、design がディレクトリの形も file の存在も決めることは無くなった。この規則の持ち主はどこにも居ない。

### Decision

- Status: **accepted**
- Adopted:
  - `plan/SKILL.md:27` と `plan/references/format.md:80` の規則を消す。規則ファイルは作らない。
  - file の形は、その plan の step が理由を書いて直す。規則ではなく、その場の判断である。
- Options:
  - 規則ファイルを作って明文化する（作る仕事が別 Unit として要る。規則が無いより重い）
  - 規則を残す（出典が無いまま、plan が構造を決める）

### Research & Trial

- `plan/SKILL.md:27` は「A file whose structure does not follow the project's rules, and that the plan touches anyway, is fixed in this plan — the step says why.」と書く。`plan/references/format.md:80` も同じ規則を持つ。
- その rules を書いたファイルは無い。`AGENTS.md` はサイクルの進め方だけを書き、`definition/rules.md` は `DEFINITION.md` の書き方だけを書く。

### Definition Change

- なし

## 03: テストの整理を、どのステージに置くか

### Context

- オーナーの指摘: テストファイルを更新する plan では、古いテスト、同じことを確認しているテストが残りがちである。
- 何が古くなったかは、変更の後にしか分からない。plan は変更の前に書く。
- plan のスライスには `Verify` が要る（`plan/references/format.md:106-109`）。整理のスライスが言えるのは「緑のまま」と「本数が減った」くらいである。
- work は既にその瞬間を持つ。review の `Stale` は「この変更が古くした物」で test を名指しし（`plan/references/format.md:171`）、acceptance は「消すと緑のままのテスト」を見つける（`work/SKILL.md:60`）。

### Decision

- Status: **accepted**
- Adopted:
  - 持ち場は work のマージ前。plan のスライスにはしない。
  - 順番は、スライス → テストの整理 → review → acceptance → merge である。
  - 走らせる者は、スライスを走らせた `code` サブエージェントの続きとする。
  - 走査の対象は、その plan のツリーが `update` するテストファイルである。オーナーの「テストファイルを更新する場合にのみ」と同じ。
  - 整理の対象の条件は 3 つ。同じ振る舞いを 2 つ以上のテストが確認している。その振る舞いがもう無い。この plan の変更で作られなくなった分岐のテスト。
  - 記録は plan md の `## Notes` に、スライスではないセクションを 1 つ置く。
- Options:
  - plan のスライスにする（対象を plan の時点で書けず、`Verify` が整理を証明しない。オーナーの元の案）
  - review の `Stale` に任せる（今の形。走査の条件と順番が無く、見つけた分だけになる）

### Research & Trial

- `plan/references/format.md:171` の `Stale` は「what this change made stale — a doc, a comment, a test」である。
- `work/SKILL.md:60` は、2〜3 の振る舞いでコードを壊し、check が赤くなることを確かめさせている。緑のままなら finding である。
- `plan/references/format.md:136` は `Types: なし` のスライス（script、文書、データ）を認めている。テスト整理はこの形で書けないことはないが、証明が弱い。
- `plan/references/format.md:164` は、`Notes` を `### Slice N` の集まりと定める。スライス以外のセクションは今ここに無い。

### Definition Change

- なし

## 04: スタックが動いた plan をマージした後、base の依存をどう揃えるか

### Context

- worktree は `node_modules` を持たない。サブエージェントの初手で、lockfile を見て依存が入る（`.pi/extensions/consult/run/run.ts:91-98`、`run/subagent.ts:103`）。
- マージでは worktree の `node_modules` が base に移らない。スタックを動かした plan をマージした後、base の依存は古いままである。
- 023 では、この手順が plan md の `## Merge` セクションに ad hoc に書かれた（`cycles/261018-023-feat-new-skill/plan/route-user-start.md:170-173`）。plan のフォーマットに `## Merge` は無い。
- 書き忘れると、base の型は古い版のままで、`pnpm typecheck` が落ちる。023 は 1.0.3 から 1.3.0 の bump で、この落ち方を記録している。

### Decision

- Status: **accepted**
- Adopted:
  - work のマージの手順に書く。マージの後、base で依存を揃えてから、通しの typecheck と test を走らせる。
  - 揃えるコマンドは lockfile で決める。`pnpm-lock.yaml` があれば `pnpm install` である。
- Options:
  - 何も書かない（今は plan md に ad hoc に書かれていて、毎回書かれる保証が無い）
  - plan md のセクションにする（plan のフォーマットに `## Merge` は無く、plan の仕事でもない）

### Research & Trial

- `consult/run/run.ts:91-98` は、worktree で `pnpm-lock.yaml` を見て `pnpm install --frozen-lockfile` を、`package-lock.json` を見て `npm ci` を初手に選ぶ。
- `consult/run/subagent.ts:103-107` は、その失敗でサブエージェントを走らせずに止める。
- 023 の plan md:170-173 が、順番と、忘れた時に何が落ちるかを書いている。

### Definition Change

- なし

## 05: close の `ex-` の判定をどう書くか

### Context

- オーナーの指摘: close の `ex-` が、Unit 定義に関わることだけに見える。
- close は `ex-plan` を「it breaks the criteria」と定義する（`close/SKILL.md:43`、`close/references/format.md:41`）。
- `criteria` は close の 3 箇所にしか出てこない（`close/SKILL.md:29`、`:43`、`close/references/format.md:41`）。何を指すかはどこにも書いていない。
- leftover が close に来た時点で、それが criteria かどうかを判定する必要はない。4 つに当てはまるかを見るだけでよい。
- 既存の規則はそのまま使う。`DEFINITION.md` の 1 行を動かす leftover は `ex-` にできず `proposed` に行き、`dropped` は稀で、直す方が重い時である。

### Decision

- Status: **accepted**
- Adopted:
  - `criteria` という語を消す。代わりに、4 つに当てはまる leftover は `ex-` を検討する、と書く。
  - 4 つは、矛盾、穴、壊れている、古いままである。
  - 書き換える箇所は 3 つ。`close/SKILL.md:29`、`close/SKILL.md:43`、`close/references/format.md:41`。
- Options:
  - `criteria` を 1 文で定義する（leftover を持って来た時点で要らない判定になる）

### Research & Trial

- `criteria` の出現は `close/SKILL.md:29`、`close/SKILL.md:43`、`close/references/format.md:41` の 3 箇所で、定義も出典も無い。
- `close/SKILL.md:30` は既に「entry が決めたのにどの plan の `Files` も `Scope` も運んでいない変更は穴である」と書いている。4 つの「穴」と同じ物を指す。
- `close/references/format.md:40` は、triage の各行に `<定義の部分>`（その leftover が乗っている `DEFINITION.md` の行）を求める。これは行が動くかどうかとは別である。`ex-` が定義の話だけに見える原因はここにある。

### Definition Change

- なし

## 06: オーナーの確認を飛ばしてサイクルを走り切るスキル（yolo）を足すか

### Context

- オーナーの提案: ADR の entry が全て accepted になった後に、任意のタイミングで起動し、close のトリアージが終わるまで（オーナーの判断の前まで）、オーナーの確認の部分を飛ばしてエージェントが走り切るスキルを足す。
- オーナーの確認の部分は、今は各スキルに散っている。design の step 5（置き場の提案と答え）と step 6、plan の step 10、work の step 4（前提の食い違いのトリアージ、base plan のオーナーの OK）と step 8、close の step 6。
- オーナーは発動のタイミングを自分で調整する。ADR の内容次第では design の後にもなり得る。
- オーナーの言うとおり、yolo は確認を飛ばす物である。omit する確認の一覧を ADR が持つ必要は無い。

### Decision

- Status: **accepted**
- Adopted:
  - `yolo` を新しいスキルとして足す。
  - 起動はオーナーの明示コマンドだけとする。frontmatter の `disable-model-invocation: true` で、エージェントの自動選択から外す。
  - 発動のタイミングはオーナーが決める。ADR はタイミングを固定しない。ADR の entry が全て accepted になる前に起動された場合は、実行せず無効とする。
  - 起動したら、close のトリアージが終わるまで、オーナーの確認の部分を全部飛ばしてエージェントが走り切る。
  - 不測の事態が起きた時は、止まってオーナーに報告し、指示を仰ぐ。何を不測の事態とするかは yolo の文面が決める。
  - yolo は独立である。他のスキルは yolo を参照しない。1 サイクルのスキルの流れは yolo 自身が持つ。
- Options:
  - 各スキルに「yolo の時は確認しない」を書き込む（5 つのスキルが yolo を知ることになる。オーナーが却下）
  - 発動のタイミングを ADR の後に固定する（オーナーが調整する余地が消える）

### Research & Trial

- pi のスキルは frontmatter の `disable-model-invocation: true` で、明示コマンドからのみ起動できる（pi の `docs/skills.md:53`、`:79` の表）。自動選択からは外れる。手で打つ `/skill:yolo` は通る。
- 今のスキルは 7 つで、`.pi/skills/` に置かれる（`README.md:12`）。
- オーナーの確認は各スキルの手順に散っている。design の step 5・6（`design/SKILL.md:39-51`）、plan の step 10（`plan/SKILL.md:69-71`）、work の step 4・8（`work/SKILL.md:42-46`、`:74-76`）、close の step 4・6（`close/SKILL.md:40-47`、`:54-57`）。
- `README.md:56` は「the next stage is called by that skill's description. No stage names the one after it.」と書く。yolo が流れを持つなら、この規則とどう付き合うかは yolo の文面が決める。

### Definition Change

- `Unit.yolo-skill`(added): エージェントが、オーナーの確認を挟まずにクローズのトリアージまで進めることができる。
