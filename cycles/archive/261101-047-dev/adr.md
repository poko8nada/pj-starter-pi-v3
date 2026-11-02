# ADR 047

## 01: close の手順等の全面改訂

### Context

- owner は close スキルの手順や考え方を全面改訂したい (roadmap No.008)。
- 現行の close スキルは、owner と共にトリアージを進め、`DEFINITION.md` を動かす leftover を `proposed` とし、4種 (contradiction / hole / broken / stale) かつ `DEFINITION.md` を動かさない leftover を `ex-` とする。
- roadmap No.008 の ideas は、コレクト → トリアージ提案 → close.md 作成 → 校正までをエージェントが行い、解決済みの leftover を文面から除外し、新判断軸 (全文は `Decision` の `Adopted` に置く) を採用する内容である。

### Scope

- 変更:
  - behaviour: in — close の手順を改訂する (コレクト → 解決済み除外 → `Fact` / `Why` / `Then` 付きのトリアージ提案を close.md に書く → close.md 完成 → 校正 → owner が読んで判断する、新判断軸)
  - refactor: out — collect.mjs の構造は維持する (理由: 解決済み除外の判断はエージェントの文面判断で行い、スクリプトに判定を持ち込まない)
  - dependency: out — 依存追加なし
  - naming: out — Unit 名 (close-skill) は変わらない
  - format: in — close.md の形を変える (Collected の Doing / Left / Cost をやめ、Triage の各バレット配下に Fact / Why / Then を構造的に持たせる)
  - prose: in — close/SKILL.md および yolo/SKILL.md (close セクション) の本文を改訂する
- 品質:
  - speed: out
  - security: out
  - compatibility: out — close.md の形は変えるが、既存の close.md と読み取り互換を保つ (番号行と Triage 行は維持)
  - errors: out
- 運用:
  - deploy: out
  - migration: out
  - logs and monitoring: out

### Research & Trial

- 現行 close 手順と roadmap No.008 ideas の差分は、owner 関与の時点 (現行は `## Collected` 完成時に owner に見せ、トリアージは owner と共に1行ずつ決定)、解決済み除外 (現行は `fixed:` 付穴のみ)、トリアージ判断軸 (現行は `DEFINITION.md` を動かすか否かが第一分岐)、proofread の位置 (現行は owner が読む前 1 回) である。
- collect.mjs の解決済み除外は、`fixed:` 付穴 (`isLeftover`) と `なし` (`isNone`) のみである。
- 文面判断による除外の処理は、SKILL.md step 3、format.md `## Collected`、collect.mjs のいずれにも存在しない。
- スクリプトは番号行生成と bullets 保持のみを行い、bullets の文面判断は行わない。
- yolo close セクションでは、トリアージを `DEFINITION.md` を動かすか・4種・breaks nothing で分ける。
- yolo では `dropped` を自律実行せず、fix が重い場合は停止して owner に聞く。
- yolo close セクションでは `## Verified` を省く。
- proofread は yolo 停止後かつ owner のトリアージ判断の前に実行する。
- 新判断軸の「現サイクルの関心ごと」の語は、ROADMAP.md No.008、close/SKILL.md step 2・step 5、format.md、collect.mjs、yolo/SKILL.md close セクション、rules/definition.rules.md のいずれにも存在しない。
- この語は、close step 2 が読む情報 (ADR の `accepted` entries と `Definition`、design の cut と `Boundary.Plans`、各 plan md の `## Acceptance` / `## Work Review` / `## Notes`) から特定する。
- `## Verified` (Unit ごとの owner 確認) は ideas に言及がない。
- close/SKILL.md step 5 と format.md `## Verified` には、Unit は `accepted` entries の `Definition` が名指すものと記載されている。
- rules/definition.rules.md では、Unit は `Users can do` のもの (Who が名指しで使う1つのもの) である。
- `DEFINITION.md` の Unit は `Users can do` にのみ列挙される。
- `Product` は名前、`What` は説明、`Who` は役割、`Stack` は土台であり、いずれも Unit ではない。
- Collected の Doing / Left / Cost は、内容を補完する意図だったが有用でない。
- 代わりに Triage の各バレット配下に Fact (何が起きて現状どうなっているか) / Why (このトリアージ案を推奨した理由) / Then (ex- の場合はどういう方針のプランを立てるか、proposed の場合は次に論点にすべき点、drop の場合はなし) を構造的に持たせる。

### Decision

- Status: **accepted**
- Adopted:
  - close スキルを全面改訂する (Option A)。
  - 手順を「コレクト → 解決済み leftover の文面判断による除外 → トリアージ提案 (新判断軸) → close.md 完成 → 校正 → owner が読んで判断する → `ex-` の実行とマージ → verify」に揃える。
  - close.md が完成した時点で `## Verified` は空であり、それが正常な状態である。
  - トリアージ提案は close.md に書き、校正終了後に owner が読んで判断する。
  - owner がトリアージを判断した後、`ex-` とされた leftover の plan を実行してマージし、`## Triage` の各行が `done <commit>` になるまで進める。
  - トリアージに `ex-` が残らなくなった時点で、Unit ごとに verify して `## Verified` を書く。
  - verify で動かない Unit があれば `ex-` plan を作り、マージした後にその Unit を verify し直す。
  - 新判断軸: 現サイクルの関心ごと → `ex-`、現サイクルの関心ごとに関わらないが明らかなバグ / 脆弱性 / 古い実装や記述 → `ex-`、上記の中で影響範囲や変更が大きく `ex-` 1つに収まらない、または追加の外部・内部調査が必要 → `proposed`、それ以外 → `drop`。
  - `DEFINITION.md` を動かすか否かのゲートは撤廃する。
  - `## Collected` は目録だけを持ち (`<line> / <place> / <穴>`)、`Doing` / `Left` / `Cost` はやめる。
  - 論証は `## Triage` が持ち、各バレット配下に `Fact` / `Why` / `Then` を構造的に置く。
  - 解決済み除外はエージェントの文面判断で行い、collect.mjs 再実行時は再フィルタする。
  - `## Verified` は残し、対象 Unit を `DEFINITION.md` の `Users can do` に列挙された Unit に限定する。
  - `Product` / `What` / `Who` / `Stack` は Unit ではないので、検証対象にしない。
  - yolo スキルの close セクションを新判断軸に揃え、yolo は close.md の完成までを担ってトリアージへの owner の判断の前で止まる形にする。
  - 校正がその前に終わるので、yolo が止まった時点の close.md は owner が読める形で完成している。
  - `drop` について特別な停止規則は設けない (`drop` も提案の一つであり、提案の全体が owner の判断を待ち、yolo はその判断を省略しない)。
  - `## Verified` は yolo では書かない (yolo は close.md の完成で止まるため)。
  - close.md の完成からトリアージの判断、verify までの順序は、yolo とそうでない場合で同一である。
  - collect.mjs の解決済み除外に関する処理は変えない (改名は Entry 02 が担う)。
- Options:
  - Option B (全面改訂 + `DEFINITION.md` ゲート維持): 採らなかった (ideas の軸に `DEFINITION.md` の文言がなく、ゲート維持は ideas の単純化を曲げ、複雑化するため)。
  - Option C (最小改訂: 判断軸のみ更新、owner と共にトリアージを維持): 採らなかった (ideas line 39 (トリアージ提案までエージェントが行う) を満たさず、roadmap No.008 の description (全面改訂) に反するため)。

### Definition

- `Unit.close-skill`(kept): 主機能 (サイクル終了後にクロージングできる) は変わらない (手順・判断軸・検証対象の範囲の改訂は route であり、主機能は動かないため)。
- `Unit.yolo-skill`(kept): 主機能 (owner の確認を挟まずにクローズのトリアージまで進められる) は変わらない (close の判断軸に揃える改訂は route であり、主機能は動かないため)。

## 02: plan の作成手順改訂

### Context

- owner は plan スキルの作成手順を改訂したい (roadmap No.009)。
- 現行の plan スキルは、design 合意後、plan を全て書いてからレビュー・校正する。
- roadmap No.009 の ideas は、1ファイルずつ作成してレビューに出し、レビュー中に次のファイルを作り、全レビュー終了後に並列で校正する手順とする。
- また `## Review` という名称は work ステージの実装レビュー (Round 1 / Round 2) を指すが、plan ステージのレビュー (step 10) と混同されるため、`## Work Review` に改名する。

### Scope

- 変更:
  - behaviour: in — plan 作成手順を改訂する (1ファイルずつ作成 → レビュー、レビュー中に次ファイルを作成、全レビュー終了後並列校正)
  - refactor: out — plan md のセクション構成は維持する (理由: セクションを増やさず、`## Review` の改名は format で扱う)
  - dependency: out — 依存追加なし
  - naming: out — Unit 名 (plan-skill) は変わらない
  - format: in — `## Review` → `## Work Review` の改名 (plan/SKILL.md、plan/references/format.md、work/SKILL.md、work/references/tasks.md、close/SKILL.md、collect.mjs、close/references/format.md)
  - prose: in — plan/SKILL.md 本文の改訂
- 品質:
  - speed: out
  - security: out
  - compatibility: out — 改名で plan md のセクション名は変わるが、閉じたサイクルのファイルは以後読まれず、開いているサイクルはこのサイクルだけであるため
  - errors: out
- 運用:
  - deploy: out
  - migration: out
  - logs and monitoring: out

### Research & Trial

- 現行の plan 手順 (steps 1-12) は、step 9 (Cycle's plans, together) の条件が「全 plan 完成後」であり、step 9 → 10 (Review) → 11 (Proofread) → 12 (Show the owner) の順で全 plan を一括処理する。
- step 10 には「One subagent per plan, one round; the plans do not wait for each other」と記載がある。
- roadmap No.009 の ideas の1行目 (1ファイル作成 → レビュー、レビュー中に次を作る) と2行目 (全レビュー終了後、並列校正) は、現行の順序・条件と差分がある。
- レビューサブエージェントは tasks.md で 1 round (`This is the only round`) と記載されるが、format.md の `## Review` は Round 1 / Round 2 の2ラウンド構成を記載する。
- tasks.md は plan ステージではセクションを確保するのみで、内容は work に属すると記載する。
- proofread (step 11) の現行タイミングは「owner が読む前」「per file」「one round」であり、roadmap No.009 の ideas の「全レビュー終了後」「並列」の文言はない。
- step 9 の重複検出 (全 plan の `Types` / `Files` / slice 名を一緒に読み、共有 piece を owner が決定) は、全 plan 完成を条件とする。
- design スキルには plan を呼ぶ手順番号の記載はなく、`What is not here` 表で plan が files / types / steps / checks を担うと記載する。
- plan スキルの description は「design is agreed」を前提とする。
- `## Review` → `## Work Review` の改名影響: plan/SKILL.md (section の予約)、plan/references/format.md (shape)、work/SKILL.md (書き込み先)、work/references/tasks.md (subagent への指示)、close/SKILL.md (読み取り対象)、close/scripts/collect.mjs (`section.name === 'Review'` と `Review Round N` ラベル)、close/references/format.md (例示 `Review Round 1`)。
- plan 段階のレビュー (step 10) の指摘は plan md に記録されず、owner への報告にのみ残る。
- adr の proofread も design のレビューも同じ形で、専用のセクションを持たない。

### Decision

- Status: **accepted**
- Adopted:
  - plan スキルを改訂する (Option A)。
  - 手順をパイプライン化する: 1ファイル作成 → レビューに出す、レビュー中に次ファイルを作成、全レビュー終了後に全ファイルを並列で校正。
  - 重複検出 (step 9) は全 plan 完成後に実行する。
  - `## Review` → `## Work Review` に改名する (plan/SKILL.md、plan/references/format.md、work/SKILL.md、work/references/tasks.md、close/SKILL.md、collect.mjs、close/references/format.md)。
  - proofread は、全レビュー終了後に全ファイルを並列で proofreader に渡す。
  - plan md にセクションを増やさない (plan 段階のレビューは記録のためのセクションを持たず、adr と design と同じ形をとる)。
- Options:
  - Option B (重複検出をレビュー前に維持): 採らなかった (roadmap No.009 の ideas の1行目 (レビュー中に次を作る) を満たさず、作成とレビューが直列になるため)。
  - Option C (最小改訂: 手順順序維持、ideas を注記追加のみ): 採らなかった (roadmap No.009 の ideas のパイプラインを実現せず、roadmap No.009 の description (手順変更) を満たさないため)。

### Definition

- `Unit.plan-skill`(kept): 主機能 (1 plan 分の作業の形と順序を決めて書ける) は変わらない (作成手順のパイプライン化と改名は route であり、主機能は動かないため)。
- `Unit.close-skill`(kept): 主機能 (サイクル終了後にクロージングできる) は変わらない (読み取り対象の改名は route であり、主機能は動かないため)。
- `Unit.work-skill`(kept): 主機能 (plan を 1 つずつ片付けられる) は変わらない (書き込み先の改名は route であり、主機能は動かないため)。
