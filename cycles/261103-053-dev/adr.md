# ADR 053

## 01: design ステージを廃止したとき、サイクルの流れと design を参照する記述をどう直すか

### Context

- オーナーは、design ステージをサイクルから完全に廃止し、adr から直接 plan に行く流れにしたい（`ROADMAP.md` の 015）。
- design は、サイクルを plan に切る材料を調べ、切り方と順序を決め、各 plan をどこで走らせるかを提案し、`design.md` に書くステージである（`.pi/skills/design/SKILL.md:8`）。
- ここ数件で、adr の決定が design のステージで十分に反映されず、plan にそれが反映されないことが数度あった（`ROADMAP.md` の 015 の ideas）。
- サイクルは現在6つのスキル（`adr` / `design` / `plan` / `work` / `close` / `yolo`）で回り、記録は `adr.md` / `design.md` / `plan/<plan id>.md` / `close.md` である（`README.md:14`、`README.md:72`）。
- design の仕事のうち、影響範囲の調査は adr へ、plan の分割・実行順・実行場所は plan へ移し、調査の書き手である consult のロールを 03 が、スクリプトを 06 が扱う。
- このエントリーでは、design の記述のうち、移さないものは捨てる。
- このエントリーは、サイクルの流れと design を参照する記述の直し方を決め、design の仕事の行き先そのものはエントリー 02 から 06 が決める。
- オーナーは、adr の決定が plan に直接届くことを求めている。
- エージェントは、design という二重の記録を持たずに、adr の決定から plan を書けることを求めている。

### Scope

- 変更:
  - behaviour: in — サイクルのステージを adr → plan → work → close にし、design ステージを廃止する。
  - refactor: in — `.pi/skills/design/` を削除し、design の記述のうちエントリー 02 から 06 が引き取らないものを捨てる。
  - dependency: out — パッケージを足さない、減らさない（design はスキルであり、依存ではない）。
  - naming: in — 記録の一覧から `design` の名前を外し、`affected` の名前を足す（`affected.md` の書式は 02 が決める）。
  - format: in — `README.md` と `README.ja.md` のサイクルのセクションを5スキル・4ステージにし、記録の一覧を `adr.md` / `affected.md` / `plan/<plan id>.md` / `close.md` にし、`close` の `Plans` の出所を plan md の `No` にし、`work` のコミット対象を `affected.md`、メッセージを `update: NNN's ADR, affected and plan` にする。
  - prose: in — `AGENTS.md`、`README.md`、`README.ja.md`、`adr`、`work`、`close`、`yolo`、`upgrade` の design に触れる文を直す（plan スキル内の文は 04 が直す）。
- 品質:
  - speed: out — 製品の実行時間を測る対象がない（design ステージの削除はサイクルの手数であり、実行時間ではない）。
  - security: out — 秘密、権限、外部接続を扱わない（consult のロールは 03 が扱う）。
  - compatibility: out — 閉じたサイクルの `design.md` はそのまま残すため、古いサイクルの記録との互換性は変わらない。
  - errors: out — 新しいエラーの分岐を作らない（スクリプトのエラーは 06 が扱う）。
- 運用:
  - deploy: out — 配布物がない。
  - migration: out — 移すデータがない（記録はファイルであり、古い `design.md` を書き換えない）。
  - logs and monitoring: out — 常時記録するログや監視の仕組みがない。

### Research & Trial

- design を参照する箇所は、`.pi/skills/` の `adr`、`plan`、`work`、`close`、`yolo`、`upgrade` と、`AGENTS.md`、`README.md`、`README.ja.md`、`DEFINITION.md`、`.pi/extensions/consult/sub/guard.test.ts` にある（実測）。
- `rules/`、`scripts/`、`test/`、`vitest.config.ts`、`vitest.starter.config.ts` に design への参照はない（実測）。
- `adr` は「The design, the plan and the work are written from DEFINITION.md」と「the design cuts it, the plan writes it」と書く（`adr/SKILL.md:10`、`:132`）。
- `plan` は、`description`、典拠、design の plan セクションの欄、`No` の転記、スライスの場所、review の `Goal` と `Non-goal`、`Boundary.Plans`、`What is not here` で design を参照する（`plan/SKILL.md:3`、`:8`、`:20`、`:22`、`:43`、`:74`、`:76`、`:90`、`:107`、`:114-115`、`:121`）。
- `plan/references/format.md` は、`base` の分岐、`No` の転記、複写の禁止で design を参照する（`plan/references/format.md:93`、`:94`、`:98`、`:218`）。
- `plan/references/tasks.md` は、review と research の手渡し文で design の `Goal` と `Non-goal` を指す（`plan/references/tasks.md:8`、`:10`、`:37`）。
- `work` は、実行場所の `Where`、マージ順序の `Why`、コミット対象とメッセージで design を参照する（`work/SKILL.md:8`、`:25`、`:30`、`:31`、`:96`）。
- `close` は、サイクルの資料としての design、`未特定` の補完、`ex-` plan の「design なし」、`Plans` の出所、`## Collected` の並び順で design を参照する（`close/SKILL.md:28`、`:38`、`:84`、`:94`、`:122`、`close/references/format.md:50`、`:60`、`:73`）。
- `yolo` は、design ステージを4ステージの1つとしてたどる（`yolo/SKILL.md:20`、`:22-28`）。
- `upgrade` は「no ADR, no design and no plan」と書く（`upgrade/SKILL.md:14`）。
- `README.md` と `README.ja.md` は6スキル、5ステージ（ADR → design → plan → plan execution → close）、記録の一覧（`adr.md` / `design.md` / `plan/<plan id>.md` / `close.md`）を持つ（`README.md:14`、`:61`、`:72`、`README.ja.md:14`、`:65`、`:72`）。
- `AGENTS.md` は「1 cycle starts with the `adr`, then design→plan→work→close」と書く（`AGENTS.md:4`）。
- `DEFINITION.md` の `design-skill` は「エージェントが、サイクルを plan に切る材料を調べ、切り方を決め、どこで走らせるかを提案できる（オーナーが決める）」である（`DEFINITION.md:25`）。
- design から値を読む参照のうち、plan md に同じ値がないものは、`work` の `Where` と `Why`、`close` の `Cut` と `Boundary.Plans`、`plan` の `No`、`Why`、`Where`、`Summary` である（実測）。
- plan md が持つ design 由来の値は `No` だけであり、`close` の `Plans` は plan md の `No` から読める（実測: `close/scripts/collect.mjs:249-257`、`close/scripts/collect.test.ts:29-38`）。
- design の記述のうち、`## Affected` と `## External` は 02 が、`## Cut`、`## Where`、`## Goal`、`## Non-goal`、`## Summary`、`## Paths`、`## Boundary`、`## Review the design` は 04 が引き取る（エントリーの分割）。
- design の `## Proofread`、`## What is not here`、`## How not to write this` は引き取り手がない（実測）。
- `.pi/extensions/consult/sub/guard.test.ts:142` の `design.md` は権限判定のフィクスチャの値であり、権限の規則は変わらない（実測）。
- `rules/readme.format.md` のスケルトンはサイクルのセクションを持たないため、`product:ready` のテンプレートは変わらない（実測）。

### Decision

- Status: **accepted**
- Adopted:
  - 案A — `.pi/skills/design/` を削除し、design を参照する記述を design なしに直し、参照のうち plan md に値がないものは plan md の欄を指し、その欄の形は 04 が決め、`yolo` から design ステージを外し、design の記述のうち 02 から 06 が引き取らないものは捨てる。
- Options:
  - 案B（`description` を外して design を残す）は、スキルの一覧に design が残り、README の5スキルと食い違い、`harness` の `copy` と `push` が design を相手側にも運ぶため、採用しなかった。
  - 案C（`Cut` の規則を plan に移してから削除する）は、04 が `Cut` の規則の行き先を決めるため、このエントリーでは先取りしないと決めた。

### Definition

- `Unit.design-skill`(dropped):
- `Unit.adr-skill`(kept): 主機能（オーナーが決め、エージェントが記録できる）は変わらず、design を指す文を plan に直すのは経路である。
- `Unit.plan-skill`(kept): 主機能（エージェントが、1 plan 分の作業の形と順序を決めて書ける）は変わらず、design を指す文と分割の手順を直すのは経路である（分割の手順は 04 が決める）。
- `Unit.work-skill`(kept): 主機能（エージェントが、plan を 1 つずつ片付けられる）は変わらず、plan md の `Where` と `Why` を読むのは経路である。
- `Unit.close-skill`(kept): 主機能（エージェントが、サイクル終了後に、クロージングできる）は変わらず、`affected.md` と plan md の `No` を読むのは経路である。
- `Unit.yolo-skill`(kept): 主機能（エージェントが、オーナーの確認を挟まずにクローズのトリアージまで進めることができる）は変わらず、design ステージを外すのは経路である。
- `Unit.agent-rules`(kept): 主機能（エージェントが、毎セッション同じ規則を読むことができる）は変わらず、`AGENTS.md` のサイクルの文を直すのは経路である。
- `Unit.usage-readme`(kept): 主機能（オーナーが、このスターターの使い方を読むことができる）は変わらず、サイクルのセクションを5スキル・4ステージに直すのは経路である。

## 02: 影響範囲の調査を `adr` のどのタイミングで行い、`affected.md` にどう書くか

### Context

- オーナーは、影響範囲の調査を `adr` に移し、`affected.md` に書くことを考えている（`ROADMAP.md` の 015 の ideas）。
- 現在の `design` では、エージェントは、`accepted` のエントリーごとにリサーチサブエージェントを1体起動し、`## Affected`（読むもの、検査するもの、生成されるもの）と `## External`（リポジトリの外のもの）を `design.md` の上部に書く（`design/SKILL.md:27-38`、`design/references/tasks.md:5-27`）。
- `design` の `## Affected` は、エントリーごとに、変更の結果を読むもの、検査するもの、変更から生成されるものの3群から成り、各パスに短い理由が付く（`design/references/tasks.md:9-13`、`design/references/format.md:59`）。
- `design` の `## Affected` の書式の行は `- <path>` で、理由は群の下に置かれる（`design/references/format.md:16`）。
- 実際の `cycles/261102-051-feat-test-cleanup/design.md:80-103` では、3群を小見出しにし、各行に `<path> — <何をするか>` を書いている。
- `design` の `## External` は、エントリーごとに、リポジトリの外のものと、その外のもので何をするかを書く欄である（`design/references/format.md:65-71`、`design/SKILL.md:32`）。
- `plan` の `Paths` はエントリーの `subject` と追随者から取り、`Boundary.External` は `design` の `## External` から取ることになっている（`design/SKILL.md:56-57`、`design/references/format.md:69`）。
- オーナーは、`affected.md` の見出しをエントリーごとにし、`Code` と `External` を小見出しにし、行をファイルごとの端的な1行にすることを考えている（`ROADMAP.md` の 015 の ideas）。
- オーナーは、`affected.md` を `adr` のスキャフォールドで `adr.md` と同時に作り、すでにファイルがある場合は次のエントリーの書式を追記することを考えている（`ROADMAP.md` の 015 の ideas）。
- オーナーは、調査のタイミングを、エントリーの選択肢が決まった後、校正と同時とすることを考えている（`ROADMAP.md` の 015 の ideas）。
- オーナーは、このリポジトリの方針どおり、見出しと接頭辞を英語にし、説明を日本語にする。
- このエントリーは、`affected.md` の書式と、調査のタイミングと、`adr` スキルの手順を決める。
- 調査を書くロールは 03 が決め、スクリプトは 06 が決める。
- オーナーは、`plan` を書くときに `design.md` を読まずに、エントリーごとの影響範囲を `affected.md` で読めることを求めている。
- エージェントは、エントリーの決定と同時に影響範囲が記録され、`plan` の `Paths` と `Boundary.External` を `affected.md` から書けることを求めている。

### Scope

- 変更:
  - behaviour: in — エントリーの選択肢が決まった後、校正と同時に、リサーチサブエージェントが影響範囲を調査して `affected.md` に書く（`adr` スキルの手順にこの段階を足す）。
  - refactor: in — `design` の `## Affected` と `## External` の調査内容と、`research` の任務文を、`adr` の `references/` に移す。
  - dependency: out — パッケージを足さず、減らさない。
  - naming: in — `affected.md` の名前と、見出しの名前（エントリー、`Code`、`External`）を決める。
  - format: in — `affected.md` の形を、見出しはエントリーごと、その下の `### Code` と `### External` の小見出し、ファイルごとの端的な1行とし、書式は `adr` の `references/` の `affected.format.md` に書き、adr の書式は `adr/references/adr.format.md` に分け、`adr` のスキャフォールドで作り、すでにファイルがある場合は次のエントリーの書式を追記する。
  - prose: in — `adr/SKILL.md`、`adr/references/adr.format.md`、`adr/references/affected.format.md`、`adr/references/tasks.md` に、調査の段階と書式を書く。
- 品質:
  - speed: out — 調査の時間は測る対象にしない。
  - security: out — 秘密、権限を扱わない（書き込みの権限は 03 が扱う）。
  - compatibility: out — 閉じたサイクルの `design.md` はそのまま残る。
  - errors: out — 新しいエラーの分岐を作らない（スクリプトは 06 が扱う）。
- 運用:
  - deploy: out — 配布物がない。
  - migration: out — 移すデータがない。
  - logs and monitoring: out — 常時記録するログや監視の仕組みがない。

### Research & Trial

- `design` の `## Affected` の3群は、変更の結果を読むもの、検査するもの、生成されるものと定義されている（`design/SKILL.md:31`、`design/references/tasks.md:9-13`、`design/references/format.md:59`）。
- `design` の `## Affected` の書式の行は `- <path>` で、理由は群の下に置かれる（`design/references/format.md:16`）。
- `cycles/261102-051-feat-test-cleanup/design.md:80-103` の `## Affected` では、3群を小見出しにし、各行に `<path> — <何をするか>` を書いている（実測）。
- `design` の `## External` の項目は `service`、`contract`、`environment`、`data`、`limit` で、行は `<外のもの> — <何をするか>` である（`design/SKILL.md:32`、`design/references/tasks.md:18`、`design/references/format.md:22`）。
- `design` の `research` の任務文では、エージェントは、`subject` を報告せず、生成物、`vendor`、ビルド成果物、`.gitignore` 対象、`cycles/` 配下を報告せず、依存を1段階だけ追い、繰り返しを落とさず、事実だけを報告することになっている（`design/references/tasks.md:14-20`）。
- `design` の `## External` から `plan` の `Boundary.External` を取ることになっており、子要素は `Env`、`Contract`、`Data`、`Path`、`Limit` である（`design/references/format.md:69`、`:133-135`）。
- `plan` の `Paths` はエントリーの `subject` と追随者から来る（`design/SKILL.md:56`、`design/references/format.md:125`）。
- `design` の `review` では、`## Affected` で変わる追随者がいずれかの `plan` の `Paths` に入り、`## External` の各外部の項目が `plan` の `Boundary.External` に入ることを確かめることになっている（`design/SKILL.md:74`、`design/references/tasks.md:37-38`）。
- `adr` では、校正をエントリーの書き込み後に走らせ、次のエントリーの段階は校正の実行中に進み、次のエントリーは報告の読み取り後に `adr.md` に書かれる（`adr/SKILL.md:121`、`:128`）。
- `adr` のスキャフォールドでは、開いたサイクルで次のエントリーの骨組みを追記し、既存のエントリーは書き換えないことになっている（`adr/scripts/scaffold.mjs:91-97`、`:276`）。
- `close` と `work` は `design` の `## Affected` と `## External` を読まない（`close/SKILL.md:28`、`work/SKILL.md:25`）。
- `close` は `design` の切分けと `Boundary.Plans` を、`work` は `design` の `Where` を読む（`close/SKILL.md:28`、`work/SKILL.md:25`）。
- 参考の `cycles/261101-050-dev/design.md` の `## Affected` では、エントリー 03 で14行、エントリー 05 で9行のパスを列挙し、`## External` はすべて `なし` である（実測: `cycles/261101-050-dev/design.md:15-28`、`:36-44`、`:48-66`）。

### Decision

- Status: **accepted**
- Adopted:
  - 案A — `affected.md` の見出しはエントリーごとにし、その下に `### Code` と `### External` を置き、`### Code` の行は `Read:`、`Check:`、`Generate:` の接頭辞を持つ `<path> — <何をするか>` の1行にし、`### External` の行は `<外のもの> — <何をするか>` の1行にし、調査はエントリーの選択肢が決まった後、校正と同時に走らせ、`adr` のスキャフォールドで `affected.md` を作り、すでにファイルがある場合は `affected.md` に次のエントリーの書式を追記し、書式は `adr/references/affected.format.md` に書き、adr の書式は `adr/references/adr.format.md` に分ける。
- Options:
  - 案B（接頭辞を落とし、`<path> — <何をするか>` だけにする）は、そのパスが読む対象か、検査する対象か、生成されるものかが分からず、`plan` の `Paths` の追随者を選ぶときに誤るおそれがあるため、採用しなかった。
  - 案C（3群を `####` の小見出しにする）は、見出しが `###` より1つ深くなり、`ROADMAP.md` の「コードと外部をそれぞれ小見出しに持つ」を超えるため、採用しなかった。

### Definition

- `Unit.adr-skill`(kept): 主機能（オーナーが決め、エージェントが記録できる）は変わらず、影響範囲の調査を `affected.md` に記録するのは経路である。

## 03: consult に `affected.md` を書くロールをどう足すか

### Context

- オーナーは、影響範囲の調査を `review` と同じ形式で走らせ、書き込みの権限を `affected.md` だけに与えることを考えている（`ROADMAP.md` の 015 の ideas）。
- consult は、ロールごとに `models`、`tools`、`isolated`、`paths`、`bash`、`continueByDefault`、`limits`、`role` を持つ（`policy/types.ts:57-82`）。
- `research` は `isolated: false` で、`tools` に `read`、`ls`、`find`、`grep`、`web_search`、`fetch_content` を持ち、`paths` は `[]` である（`types.json:4-15`）。
- `paths` は、書き込み用のツール（`edit`、`quick_edit`、`target_edit`、`write`）の `path` を、`cwd` からの相対パスで制限する（`sub/guard.ts:194-207`、`:219`）。
- `affected.md` の書式と調査のタイミングはエントリー 02 が決める。
- このエントリーは、`research` ロールに書き込み用のツールと `paths` を足すかどうかと、`README.md` の表の直し方と `guard.test.ts` のテストの足し方を決める。
- オーナーは、調査を走らせる子エージェントが `affected.md` だけを書き、ほかのファイルを変えないことを求めている。
- エージェントは、影響範囲の調査を既存の `research` ロールで走らせ、その書き込みを `affected.md` に制限できることを求めている。

### Scope

- 変更:
  - behaviour: in — `research` ロールに書き込み用のツールと `paths` を足し、`affected.md` だけを書けるようにする。
  - refactor: out — 新しいロールを足さない（既存の `research` ロールを使う）。
  - dependency: out — パッケージを足さない、減らさない。
  - naming: out — 新しい名前を決めない（`research` の名前をそのまま使う）。
  - format: in — `types.json` の `research` ロールの `tools` と `paths` の値を決める。
  - prose: in — `.pi/extensions/consult/README.md` の `Roles` の表の `research` の `tools` に書き込み用のツールを足し、同じ表の既存の不一致（`review` の `bash`、`proofreader` と `trial` の上限）を `types.json` に合わせる。
- 品質:
  - speed: out — 調査の時間は測る対象にしない。
  - security: in — 書き込みの権限を `cycles/*/affected.md` に限り、ほかのファイルへの書き込みと `bash` を許さない。
  - compatibility: out — ほかのロールの振る舞いを変えない（`research` の読みと事実のみを報告する役割は変わらず、書き込み用のツールが増えるだけであるため）。
  - errors: out — 新しいエラーの分岐を作らない（壊れた設定は既存の `parseTypes` が投げるため）。
- 運用:
  - deploy: out — 配布物がない。
  - migration: out — 移すデータがない。
  - logs and monitoring: out — 常時記録するログや監視の仕組みがない。

### Research & Trial

- `types.json` のロールは `name`、`models`、`tools`、`isolated`、`paths`、`bash`、`continueByDefault`、`limits`、`role` を持つ（`policy/types.ts:57-82`）。
- `paths` は、書き込み用のツール（`edit`、`quick_edit`、`target_edit`、`write`）の `path` を、`cwd` からの相対パスで `matchesGlob` に当てて制限し、`paths` が `[]` のときは無制限である（`sub/guard.ts:194-207`、`:219`、`:195-197`）。
- `cycles/*/plan/*.md` は `cycles/010-2026-09-29/plan/x.md` に当たる（`sub/guard.test.ts:134`）。
- `isolated: false` のロールは、エージェントが `worktree` を渡さなければ `base` で走る（`run/subagent.ts:57-72`、`README.md:30`）。
- `research` は `isolated: false` で、`tools` に `read`、`ls`、`find`、`grep`、`web_search`、`fetch_content` を持ち、`paths` は `[]` である（`types.json:4-15`）。
- `research` の `role` の文は、調査結果を事実のみとし、意見や提案を加えないことを定める（`types.json:15`）。
- `review` は `isolated: false` で、`paths` は `["cycles/*/plan/*.md"]`、`bash` は `["git diff", "git status", "git log"]` である（`types.json:18-29`）。
- `README.md` の `Roles` の表は、`review` の `bash` を載せず、`proofreader` を 80 turns / 120,000 output、`trial` を 60 turns と書くが、`types.json` は `proofreader` を 60 / 100,000、`trial` を 80 とする（`README.md:22-28`、`types.json:32-58`）。
- `guard.test.ts:142` の `design.md` は、`**/*.md` の許可のテストのフィクスチャである（`sub/guard.test.ts:137-147`）。
- `policy/types.test.ts` は `aTypePolicy` のフィクスチャでスキーマを確かめ、`types.json` の実物は読まない（`policy/types.test.ts:15-58`）。
- `consult_run` は `resolveType(loadTypes(EXTENSION_DIR), request.role)` でロールを解決し、`CONSULT_POLICY` に `paths` と `bash` を、`CONSULT_TURNS` にターン数を載せる（`tool/consult.ts:382`、`run/subagent.ts:84-88`）。
- `models` の候補は先頭から順に試され、最後はエージェントの設定で走る（`run/run.ts:59-61`、`:70-88`）。
- `limits` の `turns` と `output` を超えると、子エージェントが止まる（`sub/spec.ts:206-225`）。

### Decision

- Status: **accepted**
- Adopted:
  - 案B — `research` ロールの `tools` に `edit`、`quick_edit`、`target_edit`、`write` を足して `paths` を `["cycles/*/affected.md"]` にし、`README.md` の `Roles` の表の `research` の `tools` に書き込み用のツールを足して同じ表の `review` の `bash`、`proofreader` の上限、`trial` の上限を `types.json` に合わせ、`sub/guard.test.ts` に `cycles/*/affected.md` の許可のテストを足して `design.md` のフィクスチャを `affected.md` に置き換える。
- Options:
  - 案A（`affected` ロールを足す）は、ロールと、`README.md` の表の行と、`guard.test.ts` のテストが増えるため、採用しなかった。
  - 案C（`review` の `paths` に `cycles/*/affected.md` を足す）は、`review` が `affected.md` を書けるようになり、レビューと調査の役割が混ざるため、採用しなかった。

### Definition

- `Unit.subagent-consult`(kept): 主機能（エージェントが、サブエージェントのコンサルを走らせ、そのワークツリーと結果を扱える）は変わらず、`research` ロールに書き込み用のツールと `paths` を足すのは経路である。

## 04: design の分割・実行順・実行場所を plan に移すとき、何を提示し、どこで合意するか

### Context

- オーナーは、design の分割を plan に移し、エージェントが plan の段階で最初に分割を考え、チャットに提示し、合意後に plan md を書くことを考えている（`ROADMAP.md` の 015 の ideas）。
- オーナーは、design の plan セクションの欄を plan md に足さず、plan md は adr のエントリーを指すだけでよいと考えている（オーナーの指示）。
- オーナーは、plan md に `Boundary Plans` を1つだけ足すことを決めた（`Boundary` の下に `Plans` が1つしかないため、ドットでつながず `Boundary Plans` と書く）。
- design の plan セクションの欄は、adr の `Adopted` と `Scope`、`affected.md`、plan md の `Files` と `Steps`、提示の写しである（`design/references/format.md:91-136`、`plan/SKILL.md:20-21`）。
- design の `## Cut` は、同じ入力の作業を1つの plan にまとめ、切り方を4問で確かめる（`design/references/format.md:79-89`）。
- design の `## Where` は、既定を `worktree`、オーナーの目が必要な plan を `base` とする欄である（`design/references/format.md:100-106`）。
- plan md は `No`、`Place`、`Files`、`Slices`、`Notes`、`Work Review`、`Acceptance` を持ち、052 の plan md のうち、`consult-collapse.md` は `- Place: base` を持ち、`ex-wiring-check.md` は `- Place: worktree` を持つ（`cycles/261103-052-dev/plan/consult-collapse.md:3-4`、`ex-wiring-check.md:1-3`）。
- `work` は design の `Where` と `Why` を読み（`work/SKILL.md:25`、`:96`）、`close` は design の `Cut` と `Boundary.Plans` を読む（`close/SKILL.md:28`）。
- plan のレビューでは design の `Goal` と `Non-goal` を読む（`plan/references/tasks.md:8`）。
- このエントリーは、分割の提示の形、plan md の欄、design の plan セクションの欄の廃止、plan のレビューの `Goal` の出所、`work` と `close` の読み先を決める。
- オーナーは、adr の決定が plan に直接届き、plan md の欄が増えないことを求めている。
- エージェントは、分割を plan の段階で決め、plan md の `No`、`Place`、`Boundary Plans` で足りること、`work` と `close` が plan md と adr のエントリーから読めることを求めている。

### Scope

- 変更:
  - behaviour: in — plan が最初に分割を考え、チャットに提示し、オーナーの合意後に plan md を書く（提示は、plan 名、参照する adr のエントリー、`worktree` か `base` か、まとめ方の理由、実行順）。
  - refactor: in — design の `## Cut` と `## Where` を plan の `references/` に移し、design の plan セクションの `Goal`、`Non-goal`、`Summary`、`Paths`、`Boundary.External`、`Why`、`Where` は、adr のエントリー、`affected.md`、plan md の `Files` と `Steps`、提示と重複するため、廃止する。
  - dependency: out — パッケージを足さない、減らさない。
  - naming: in — plan md の `Boundary Plans` を format に足し、ほかの欄は足さない。
  - format: in — plan md の形を今の `No`、`Place`、`Files`、`Slices`、`Notes`、`Work Review`、`Acceptance` に `Boundary Plans` を足したものにし、分割の提示の形を決める。
  - prose: in — `plan/SKILL.md`、`plan/references/format.md`、`plan/references/tasks.md` の design への参照を直し、分割の提示の手順を書き、plan のレビューの `Goal` の観点を、adr のエントリーの `Adopted` と `Scope` を読むようにする。
- 品質:
  - speed: out — 測る対象にしない（plan の分割と欄は実行時間を持たない）。
  - security: out — 秘密、権限を扱わない（consult のロールは 03 が扱う）。
  - compatibility: out — 閉じたサイクルの `design.md` はそのまま残す。
  - errors: out — 新しいエラーの分岐を作らない（スクリプトは 06 が扱う）。
- 運用:
  - deploy: out — 配布物がない。
  - migration: out — 移すデータがない。
  - logs and monitoring: out — 常時記録するログや監視の仕組みがない。

### Research & Trial

- design の plan セクションの `No` は adr のエントリーの番号、`Goal` は `Adopted` と `Scope.in`、`Non-goal` は `Scope.out` と、誤解しやすい `Options` の写し、`Summary` は adr のエントリーの要約、`Paths` は エントリーの `subject` と追随者、`Boundary.External` は research の外部、`Boundary.Plans` は plan md の `Files` と `Steps` が名指す共有片、`Why` は切分けの理由、`Where` は plan md の `Place` の写しである（`design/references/format.md:91-136`、`plan/SKILL.md:20-21`）。
- `work` は design の `Where` と `Why` を読み、`Why` はマージ順序の1つの制約だけに使う（`work/SKILL.md:25`、`:93-96`）。
- `close` は design の `Cut` と `Boundary.Plans` を読み、`Verified.Plans` を design の `No` から取る（`close/SKILL.md:28`、`close/references/format.md:73`）。
- plan のレビューは design の `Goal` と `Non-goal` を読み（`plan/SKILL.md:72-76`、`plan/references/tasks.md:7-14`）、その `Goal` と `Non-goal` の出所は adr の `Adopted`、`Scope`、`Options` である（`design/references/format.md:108-117`）。
- plan md の `No` は design の plan セクションの `No` であり、`ex-` plan の `No` の出所は Triage 行のみである（`plan/references/format.md:96-99`）。
- 052 の plan md のうち、`consult-collapse.md` は `- No: 01, 02` と `- Place: base` を持ち、`ex-wiring-check.md` は `- Place: worktree` のみを持つ（`cycles/261103-052-dev/plan/consult-collapse.md:3-4`、`ex-wiring-check.md:1-3`）。
- plan md の `Files` は `add`、`update`、`drop` のマーカーを持つツリーで、`Steps` は1ステップに1ファイル である（`plan/references/format.md:101-132`）。
- plan の `## 10` は、全 plan md の `Types`、`Files`、slice 名を読み、同じものを別名で作る対を探し、対があれば design の `Boundary.Plans` を更新する（`plan/SKILL.md:86-90`。plan md の `Files` と `Steps` が共有片を名指すため）。
- design の `Boundary.Plans` はほかの plan との接面（ほかの plan が決めることと、この plan がそれをどう使うか）で、順序の理由は `Why` である（`design/references/format.md:128-136`）。
- design の `Summary` は adr のエントリーの要約で、提示は plan の一覧（`summary`、`Goal`、`Non-goal`、`paths`、`boundary`）である（`design/references/format.md:119-121`、`design/SKILL.md:87-89`）。
- design の `## Cut` は切り方を4問（`lint`・`typecheck`・`test` を壊すか、単独で使えるか、同じパスに触るか、複数の plan に依存するか）で確かめる（`design/references/format.md:79-89`）。
- `affected.md` はまだ存在せず、`Affected` は `design.md` 冒頭のセクションである（`design/references/format.md:12`、`:56-63`）。

### Decision

- Status: **accepted**
- Adopted:
  - 案B — エージェントが plan の段階で最初に分割を考え、チャットに提示し（提示は、plan 名、`ADR`、`Place`、`Summary`（その plan が何をするか）、`Why`、実行順を、英語のラベルで書く）、オーナーの合意後に plan md を書き、plan md は今の `No`、`Place`、`Files`、`Slices`、`Notes`、`Work Review`、`Acceptance` に `Boundary Plans` を足したものにし、design の plan セクションの欄のうち、`Boundary.Plans` だけを `Boundary Plans` として移して `Goal`、`Non-goal`、`Summary`、`Paths`、`Boundary.External`、`Why`、`Where` は adr のエントリー、`affected.md`、plan md の `Files` と `Steps`、提示と重複するため廃止し（design の `Summary` は plan md に移さず、提示の `Summary` に書く）、design の `## Cut` と `## Where` を plan の `references/` に移し、plan のレビューの `Goal` の観点は adr の `Adopted` と `Scope` を読み、`work` は plan md の `Place` と `Boundary Plans` を読み、マージの順序を `Boundary Plans` から読み、`close` は adr のエントリーと plan md の `No` と `Boundary Plans` を読む。
- Options:
  - 案A（plan md の欄を増やさない）は、`work` のマージの順序と、`close` が読む `Boundary Plans` が plan md に残らず、提示だけになるため、採用しなかった。
  - 案C（plan md に design の `Goal` と `Non-goal` を足す）は、`Goal` と `Non-goal` が adr の `Adopted` と `Scope` の写しであり、plan md の欄を増やすため、採用しなかった。

### Definition

- `Unit.plan-skill`(updated): エージェントが、サイクルを plan に切り、1 plan 分の作業の形と順序を決めて書ける。
- `Unit.work-skill`(kept): 主機能（エージェントが、plan を 1 つずつ片付けられる）は変わらず、plan md の `Place` と `Boundary Plans` を読むのは経路である。
- `Unit.close-skill`(kept): 主機能（エージェントが、サイクル終了後に、クロージングできる）は変わらず、adr のエントリーと plan md の `No` と `Boundary Plans` を読むのは経路である。

## 05: plan md のステップをどう書くか

### Context

- オーナーは、plan md のステップの説明行の先頭に `add:`、`update:`、`drop:` を必ず付けることを考えている（`ROADMAP.md` の 015 の ideas）。
- 現在の plan のステップは、`1. <file>:` の下に `- <何をするか>` を書く形であり、テストの行は `- (happy)`、`- (error)`、`- (empty)`、`- (boundary)` で始まる（`plan/references/format.md:36-45`、`:121-132`）。
- オーナーは、既存ファイルの不要な部分は削除、新しいものは追加、既存への変更は更新と明示して書くことを求めている（`ROADMAP.md` の 015 の ideas）。
- オーナーは、plan に関わるファイルを、plan md を書く前に改めて読むことを求めている（`ROADMAP.md` の 015 の ideas）。
- 現在の `Files` のツリーは、変更するファイルの行末に `add`、`update`、`drop` が付く形である（`plan/references/format.md:16-24`、`:103`）。
- このエントリーは、ステップの説明行の接頭辞と、ファイルを読み直す手順を決める。
- オーナーは、コードを読む側が、追加、更新、削除のどれかをステップから読めることを求めている。
- エージェントは、ステップの説明行の接頭辞で、既存ファイルの削除と追加を明示できることを求めている。

### Scope

- 変更:
  - behaviour: in — plan md のステップの説明行の先頭に `add:`、`update:`、`drop:` のどれかを必ず付ける（コード、テスト、文書のすべてが対象）。
  - refactor: in — `plan/references/format.md` の `## Slices` と `## Steps` の形を接頭辞に合わせ、`plan/SKILL.md` の手順6にステップの書き方と、plan に関わるファイルを改めて読むことを書く。
  - dependency: out — パッケージを足さない、減らさない。
  - naming: in — `add:`、`update:`、`drop:` の接頭辞の綴りを決める。
  - format: in — ステップの説明行の形を `- <prefix>: <何をするか>` にし、`Files` のツリーのマーカーとの関係を決める。
  - prose: in — `plan/SKILL.md`、`plan/references/format.md`、`plan/references/tasks.md` に、ステップの接頭辞と、ファイルを読み直す手順を書く。
- 品質:
  - speed: out — 測る対象にしない（plan md の書き方であり、実行時間を持たない）。
  - security: out — 秘密、権限を扱わない（consult のロールは 03 が扱う）。
  - compatibility: out — 閉じたサイクルの plan md はそのまま残す。
  - errors: out — 新しいエラーの分岐を作らない（スクリプトは 06 が扱う）。
- 運用:
  - deploy: out — 配布物がない。
  - migration: out — 移すデータがない。
  - logs and monitoring: out — 常時記録するログや監視の仕組みがない。

### Research & Trial

- plan の `Steps` は `1. <file>:` の下に `- <何をするか>` を書く形であり、テストの行は `- (happy)`、`- (error)`、`- (empty)`、`- (boundary)` で始まる（`plan/references/format.md:36-45`、`:121-132`）。
- 052 と 051 の8つの plan md の `Steps` に、`add:`、`update:`、`drop:` で始まる説明行はない（実測）。
- `Files` のツリーのマーカーは行末の `add`、`update`、`drop` で、関連するだけのファイルにはマーカーがない（`plan/references/format.md:16-24`、`:103`）。
- `Files` の `add` と `update` のファイルは、`Steps` では同じ `1. <file>:` の形で現れる（`cycles/261103-052-dev/plan/consult-collapse.md:62-73`）。
- `Files` のマーカーのないファイルは、`Steps` に「変えない」「そのまま残す」と書かれる（`cycles/261102-051-feat-test-cleanup/plan/context-precompact.md:41`、`:96`、`:120`）。
- 052 と 051 の `Files` のツリーに `drop` の行はなく、`drop` は `consult-run-tool.md:129` のコミットメッセージにだけ現れる（実測）。
- plan のレビューの `Cases` は、テストのステップのケースを `## Test cases` で読む（`plan/references/tasks.md:13`）。
- `work` のテストの整理では、plan の `Files` が更新するテストファイルを読み、4分類を落とし、`## Notes` に `### Cleanup` として書く（`work/SKILL.md:48-55`）。
- `plan/SKILL.md` の手順6と `plan/references/format.md` の `## Slices` と `## Steps` に、接頭辞の定めはない（実測）。

### Decision

- Status: **accepted**
- Adopted:
  - 案A — ステップの説明行の先頭に `add:`、`update:`、`drop:` のどれかを付け、コード、テスト、文書のすべてを対象にし、テストの行は `- update: (happy) <given> → <result>` の形にし、`Files` のツリーのマーカーは今のまま残し、`plan/SKILL.md` の手順6に、plan に関わるファイルを書く前に改めて読むことを足す。
- Options:
  - 案B（`Files` のマーカーだけを残す）は、ステップの各行が追加か更新か削除か分からず、オーナーの「ステップの先頭に明示する」に反するため、採用しなかった。
  - 案C（ステップの接頭辞を付け、`Files` のマーカーを落とす）は、`Files` のツリーから、変えるファイルと関連するだけのファイルの区別が消えるため、採用しなかった。

### Definition

- `Unit.plan-skill`(kept): 主機能（エージェントが、サイクルを plan に切り、1 plan 分の作業の形と順序を決めて書ける）は変わらず、ステップの接頭辞とファイルを読み直す手順を足すのは経路である。

## 06: adr と affected のスクリプトをどう構造化し、入り口をどこに置くか

### Context

- オーナーは、adr と affected のスクリプトを共通部分とそれぞれの固有部分に分け、フォルダ構成と1つの入り口のまとめ方を考えている（`ROADMAP.md` の 015 の ideas）。
- 現在の `adr/scripts/scaffold.mjs` は、サイクルのフォルダと `adr.md` の骨組みを作り、開いたサイクルでは次のエントリーの骨組みを追記する（`adr/scripts/scaffold.mjs:263-301`）。
- `affected.md` の書式と調査のタイミングはエントリー 02 が決め、`adr.md` と同じくスキャフォールドで作られ、次のエントリーの書式が追記される。
- このエントリーは、スクリプトのフォルダ構成、共通部分と固有部分の分け方、入り口を決める。
- オーナーは、エージェントが1つの入り口で `adr.md` と `affected.md` の両方を作れることを求めている。
- エージェントは、共通部分（サイクルの検出、次の番号、追記）を1つにまとめ、`adr.md` と `affected.md` の骨組みを別々に持てることを求めている。

### Scope

- 変更:
  - behaviour: in — adr と affected のスクリプトを共通部分とそれぞれの固有部分に分け、1つの入り口で `adr.md` と `affected.md` の骨組みを作り、開いたサイクルでは次のエントリーの書式を両方に追記する。
  - refactor: in — `adr/scripts/scaffold.mjs` を共通部分（サイクルの検出、番号、追記）と `adr.md` の骨組み、`affected.md` の骨組みに分け、フォルダ構成を決める。
  - dependency: out — パッケージを足さない、減らさない。
  - naming: in — 入り口の名前と、共通部分のファイルの名前を決める。
  - format: in — スクリプトのフォルダ構成と、入り口の引数を決める。
  - prose: in — `adr/SKILL.md` の `## Files` と手順3のスクリプトの呼び出しを、新しい入り口に合わせる。
- 品質:
  - speed: out — 測る対象にしない（スクリプトの構造であり、実行時間を持たない）。
  - security: out — 秘密、権限を扱わない。
  - compatibility: in — 既存の `scaffold.mjs` の呼び出しを新しい入り口に合わせ、古い入り口を残すか消すかを決める。
  - errors: in — 開いたサイクルがない、すでにファイルがある、壊れた見出しの扱いを今の `scaffold.mjs` と同じにする。
- 運用:
  - deploy: out — 配布物がない。
  - migration: out — 移すデータがない。
  - logs and monitoring: out — 常時記録するログや監視の仕組みがない。

### Research & Trial

- `scaffold.mjs` は12の関数と、`node scaffold.mjs [--root <dir>] [<nnn>]` の CLI を持ち、開いたサイクルでは次のエントリーの骨組みを `adr.md` に追記し、開いたサイクルがなければフォルダと `adr.md` を作る（`adr/scripts/scaffold.mjs:16-301`）。
- `scaffold.test.ts` は12の関数と CLI を確かめ、`affected.md` のテストはない（`adr/scripts/scaffold.test.ts:7-357`）。
- `adr/SKILL.md` の `## Files` に `affected.md` と `affected.format.md` はなく、手順3の呼び出しは `node .pi/skills/adr/scripts/scaffold.mjs` である（`adr/SKILL.md:14-22`、`:48`）。
- `close/scripts/collect.mjs` は、型、定数、関数、CLI、テスト、フィクスチャを1ファイルに持つスクリプトである（`close/scripts/collect.mjs:1-417`）。
- `lib/git-env.mjs` の `git` が唯一の git の入り口で、`scaffold.mjs` はそれを取り込む（`adr/scripts/scaffold.mjs:9`、`lib/git-env.mjs:27-35`）。
- `vitest.starter.config.ts` はすべてのテストを対象にし、製品の設定（`vitest.config.ts`）はハーネスのパスを除外する（`vitest.config.ts:30-38`、`vitest.starter.config.ts:1-3`）。
- `harness.json` の `copy` は `.pi` を含むため、adr のスクリプトと新しい `affected.format.md` はコピーされる（`scripts/harness/harness.json:3-23`）。

### Decision

- Status: **accepted**
- Adopted:
  - 案A — `adr/scripts/index.mjs` を入り口にし、`cycle.mjs` に共通部分（開いたサイクルの検出、次の番号、追記、フォルダの作成）、`adr.mjs` に `adr.md` の骨組み、`affected.mjs` に `affected.md` の骨組みを置き、`index.mjs` は両方の骨組みを書き、開いたサイクルでは両方に次のエントリーを追記し、既存の `scaffold.mjs` は消し、`adr/SKILL.md` の呼び出しを `index.mjs` にし、`scaffold.test.ts` は `index.test.ts` にして、`cycle.mjs`、`adr.mjs`、`affected.mjs` のテストを分ける。
- Options:
  - 案B（`scaffold.mjs` を残し、`affected.md` の処理を足す）は、`scaffold.mjs` が `adr.md` と `affected.md` の両方を持ち、共通部分と固有部分が分かれないため、採用しなかった。
  - 案C（`adr/scripts/scaffold.mjs` と `adr/scripts/affected.mjs` の2つの入り口にする）は、共通部分（開いたサイクルの検出、次の番号）が2つに分かれ、入り口が2つになるため、採用しなかった。

### Definition

- `Unit.adr-skill`(kept): 主機能（オーナーが決め、エージェントが記録できる）は変わらず、スクリプトを共通部分と固有部分に分け、入り口を1つにするのは経路である。
