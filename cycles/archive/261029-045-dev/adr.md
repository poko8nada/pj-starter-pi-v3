# ADR 045

## 01: sound-notify の設定を、他の拡張機能の `settings.json` と同じ形にどう揃えるか

### Context

- `ROADMAP.md:21` の `002` は「sound-notify の設定値 JSON 化」で、`status` は `wip` である。
- `sound-notify` の設定は今 `config.json` にあり、`index.ts:51-53` が拡張のディレクトリから読む。`config.json` というファイルはリポジトリに無い。
- `index.ts:16-22` の `SoundNotifyConfig` は `enabled`、`notifications`、`sounds` を持ち、`sounds` は `permission`、`question`、`done`、`commit`、`compact` の 5 種類である。
- `index.ts:32-36` の既定値は `enabled: true`、`notifications: true`、`sounds` は `Blow`、`Ping`、`Glass`、`Pop`、`Ping` である。
- `index.ts:39` の `NOTIFICATION_TITLE` と `index.ts:45-49` の `NOTIFICATION_COPY` は、コードに固定されている。
- `index.ts:67-84` の `parseConfig` はキーごとに既定値に戻り、壊れた理由を返さない。`index.ts:86-96` の `loadConfig` は、ファイルが無い場合、または JSON が壊れていれば既定を返す。
- `index.ts:222-224` の入口は、起動時に 1 回だけ設定を読む。
- `README.md:47-86` は `config.json` の形と既定値を書き、`README.md:50` は「コミットしない」と書いている。一方、`git check-ignore .pi/extensions/sound-notify/config.json` は無視対象にならないと示す（exit 1）。イグノアの規則はリポジトリに無い。
- `index.test.ts:294-304` は `parseConfig` のフラグだけをテストする。設定ファイルの読み込みとスキーマの検証のテストは無い。
- `thinking-scrub` は `settings.json` を追跡し（`git ls-files`）、`settings/schema.ts` と `settings/read.ts` を持つ。`settings/read.ts` が `SettingsRead` の `ok` / `broken` を返し、設定が壊れていれば既定で動く（`index.ts:117-119`）。`043` の ADR は、追跡する `settings.json`、3 グループ、README ペアを採っている（`cycles/261027-043-feat-scrub-update/adr.md:60-65`）。
- `context-precompact` も `settings.json` を追跡し、`settings/schema.ts` と `settings/read.ts` を持つ。`settings/schema.ts` が未知のキーを `broken` にし（`settings/schema.ts:42-47`）、設定が壊れていれば拡張は 1 回だけ通知し、直るまで動かない（`index.ts:113-123`、`README.md:32-40`）。
- `.pi` は `scripts/harness/harness.json:2-3` の `copy` にあり、製品にコピーされる。
- `Unit.sound-notify` の行は「owner が、pi からの通知、commit が通ったことに気づける」で、設定の出所は読み替えの経路なので、定義行は変わらない（`rules/definition.rules.md:24-27`）。
- スキーマ検証の詳細と README の表の形は、`plan` が決める。外部調査が必要な問いは無い。

### Scope

- 変更:
  - behaviour: in — `settings.json` を設定の唯一の出所にし、`enabled`、`notifications` と、`sounds` の 5 種類を読む。`NOTIFICATION_TITLE` と `NOTIFICATION_COPY` は、設定値ではなく通知の文面なので、コードに残す。
  - refactor: in — `index.ts` の `parseConfig` と `loadConfig` を `settings/schema.ts` と `settings/read.ts` に分ける。`index.ts` は設定を読み込むインターフェースだけを持つ。
  - dependency: out — パッケージを足さない。JSON の読み込みは `node:fs` で足りる。
  - naming: in — 設定ファイルの名前を `config.json` から `settings.json` に変える。`thinking-scrub` と `context-precompact` に揃える。
  - format: in — `settings.json` をリポジトリに置く（今は無い）。`README.md` の設定のセクションを、キーの表にする。
  - prose: in — `README.md` を、ファイル名、読み込むタイミング、設定が壊れたときの扱いに合わせて書き直す。`README.ja.md` は `sound-notify` に無いので、このエントリでは作らない。
  - values: out — `sounds` の既定値（`Blow`、`Ping`、`Glass`、`Pop`、`Ping`）と文面は変えない。
- 品質:
  - speed: out — 設定は拡張の起動時に 1 回読む（`index.ts:222-224`、`README.md:83`）。読み込みの回数を変えない。
  - security: out — 権限も入力も増えない。設定はローカルのファイルである。
  - compatibility: in — `.pi` は `scripts/harness/harness.json:2-3` の `copy` で製品にコピーされる。既存の `config.json` を使っている場合は移行が要る。
  - errors: in — 設定ファイルが無い、JSON が壊れている、型が違う、未知のキーがあるという 4 つの場合の扱いを決める。
- 運用:
  - deploy: out — `Stack` の `Deploy` は「なし」。
  - migration: in — `config.json` から `settings.json` への移行方法（既存の個人設定を読むか、手で移すか、読まないか）を決める。
  - logs and monitoring: out — 記録は `cycles/` と git が持つ。ログは足さない。

### Research & Trial

- `index.ts:51-53` — 設定ファイルは `config.json` で、拡張のディレクトリから読む。
- `index.ts:67-96` — `parseConfig` はキーごとに既定値に戻り、`loadConfig` はファイルが無い場合、または壊れていれば既定を返す。壊れた理由は返さない。
- `README.md:47-86` — `config.json` の形と既定値を書き、`README.md:50` は「コミットしない」と書く。
- `git check-ignore .pi/extensions/sound-notify/config.json` — 無視対象にならないと示す（exit 1）。イグノアの規則は無い。
- `git ls-files` — `thinking-scrub/settings.json` と `context-precompact/settings.json` は追跡されている。
- `thinking-scrub/settings/schema.ts:39-41`、`settings/read.ts:19-35` — `settings/read.ts` が `SettingsRead` の `ok` / `broken` を返し、ファイルが無ければ既定を返す。`index.ts:117-119` は設定が壊れていれば既定で動く。
- `context-precompact/settings/schema.ts:42-47` — `settings/schema.ts` が未知のキーを `broken` にする。`index.ts:113-123` は 1 回だけ通知し、`README.md:32-40` は直るまで動かないと書く。
- `cycles/261027-043-feat-scrub-update/adr.md:60-65` — 追跡する `settings.json`、3 グループ、README ペアを採った。
- `index.test.ts:294-304` — `parseConfig` のフラグだけをテストし、設定ファイルの読み込みとスキーマの検証は試していない。
- `scripts/harness/harness.json:2-3` — `.pi` を製品にコピーする。
- `rules/definition.rules.md:24-27` — Unit の行は主たる機能で、経路と検査は行を変えない。
- 外部調査が必要な問いは無く、試作も要らない。

### Decision

- Status: **accepted**
- Adopted:
  - 案 A: `settings.json` を追跡し、`settings/schema.ts` と `settings/read.ts` に分ける。
  - 設定は `enabled`、`notifications` と、`sounds` の 5 種類である。`NOTIFICATION_TITLE` と `NOTIFICATION_COPY` は通知の文面なので、コードに残す。
  - 壊れた設定は既定で続行し、知らせない。未知のキーは無視する（`thinking-scrub` と同じ）。
  - `config.json` は `settings.json` に改名する。既存の個人設定は手で移す。
  - `README.md` の設定のセクションを表にし、「コミットしない」の行を消す。
- Options:
  - 案 B: 壊れた設定を 1 回知らせ、既定で続行する。採らなかった理由: 知らせるには `ctx` が要り、起動時の読み込みを最初のイベントまで遅らせるか、入口のインターフェースを増やす必要がある。スコープの「起動時に 1 回読む」と合わない。
  - 案 C: 壊れた設定を 1 回知らせ、直るまで音による通知を止める。採らなかった理由: 通知を止めると、この拡張の目的である「pi が待っていることに気づける」が消える。案 B と同じ `ctx` の問題を持つ。
  - 案 D: `config.json` を互換のために読む。採らなかった理由: 移行は `config.json` を `settings.json` に改名する 1 手で足り、2 つの名前をコードと文書に残す方が重い。

### Definition

- `Unit.sound-notify`(kept): 行は「owner が、pi からの通知、commit が通ったことに気づける」で、主たる機能は変わらない。設定の出所と読みの経路が変わる。
- `Unit.usage-readme`(kept): 行は「owner が、このスターターの使い方を読むことができる」で、主たる機能は変わらない。拡張の README の設定のセクションが変わる。
- `Unit.harness-copy`(kept): 行は「owner が、スターターのハーネスをプロジェクトへ取り込み、プロジェクトのハーネスをスターターへ戻せる」で、主たる機能は変わらない。新しい `settings.json` と `settings/` は `.pi` のコピーに含まれる。

## 02: `Goal` を複数行にし、どう導出するか

### Context

- `ROADMAP.md:20` の `003` は「plan スキル、ゴールフォーマットと導出方法変更」で、`status` は `wip` である。
- `Goal` を書くのは `design` であり、`plan` はそれを読む側である。`design/SKILL.md:53` と `design/references/format.md:108-111` が `Goal` を定め、`plan/SKILL.md:55`、`plan/references/format.md:124`、`:148` が `Goal` の結果をテストケースにすると定める。
- 今の `Goal` は 1 文である。`design/references/format.md:110` は「One sentence a check can make red: with `X`, `Y` is observed」と定め、`:111` は「`Adopted` が内容、`Scope` の `in` が範囲、`Research & Trial` が観測の仕方」と定める。
- 今の `Goal` は、複数の結果を 1 文に詰め、読点でつないでいる。`cycles/261027-043-feat-scrub-update/design.md:72` は 3 グループの結果を 1 文に詰め、`cycles/261028-044-dev/design.md:65` と `:112` も同じ形である。
- `Non-goal` は箇条書きで、複数行を持つ（`design/references/format.md:113-116`）。`Goal` の雛形は 1 行の箇条書きである（`design/references/format.md:32-34`）。
- `plan` は `Goal` の結果を単数として扱う。`plan/SKILL.md:55`、`plan/references/format.md:124`、`:148` が「the `Goal`'s result」と書く。
- `design` と `plan` の review は、`Goal` をまとめて読む。`design/references/tasks.md:45` は「each plan's `Goal` carries ... and is checkable」と単数で書き、`plan/SKILL.md:80-82`、`plan/references/tasks.md:10`、`:37` は `design` の `Goal` と `Non-goal` をまとめて読む。
- `yolo/SKILL.md:34` は五つの視点の名前を並べるが、`Goal` の形には触れない。
- `DEFINITION.md:37-38` の `design-skill` と `plan-skill` の行は、主たる機能が「切る」「作業の形と順序を決める」である。
- `rules/definition.rules.md:24-27` は、Unit の行は主たる機能で、経路と検査は行を変えないと定める。
- 外部調査が必要な問いは無く、リポジトリの中で読める事実だけで足りる。試作も要らない。

### Scope

- 変更:
  - behaviour: in — `design.md` の `Goal` を 1 行以上の箇条書きにし、各行を「検査を落とせる結果」にする。導出は、`Adopted` の行と `Scope` の `in` の項目ごとに 1 行とし、`Research & Trial` がその観測の仕方を示す。`plan` は各行の結果をテストケースにし、`design` と `plan` の review は各行を読む。
  - refactor: out — コードを変えない。`design` と `plan` の手順の順序も変えない。
  - dependency: out — パッケージを足さない。
  - naming: out — `Goal` と `Non-goal` の欄の名前は変えない。
  - format: in — `design/references/format.md` の `## Goal` と雛形、`plan/references/format.md` のテストの `step` と `Verify`、`design/references/tasks.md` と `plan/references/tasks.md` の review の `Goal` 視点を、複数行の `Goal` に合わせる。`Goal` と `Non-goal` の形を揃える。
  - prose: in — `design/SKILL.md:53`、`plan/SKILL.md:55`、`plan/SKILL.md:80-88` の `Goal` の指示を、複数行の `Goal` と、行ごとの導出に合わせる。`yolo/SKILL.md:34` は五つの視点の名前が変わらないので、変えない。
  - values: out — 値は無い。
- 品質:
  - speed: out — 実行時の処理を変えない。
  - security: out — 権限も入力も増えない。
  - compatibility: in — 新しい形は新しいサイクルから使い、既存の `cycles/` の `design.md` と `plan.md` は書き換えない。古い記録はそのまま読める。
  - errors: in — 検査を落とせない `Goal` の行と、`plan` がテストケースに含めない `Goal` の行を、review の `Goal` 視点の finding にする。
- 運用:
  - deploy: out — `Stack` の `Deploy` は「なし」。
  - migration: out — 既存の記録を新しい形に移さない。
  - logs and monitoring: out — 記録は `cycles/` と git が持つ。

### Research & Trial

- `design/references/format.md:108-111` — `Goal` は「One sentence a check can make red」で、`Adopted`、`Scope.in`、`Research & Trial` から 1 文を作る。
- `design/references/format.md:113-116` — `Non-goal` は箇条書きで、複数行を持つ。
- `design/references/format.md:32-34` — 雛形の `### Goal` は 1 行の箇条書きである。
- `design/SKILL.md:53` — `Goal` は「one sentence a check can make red」で、`Adopted` が内容、`Scope.in` が範囲、`Research & Trial` が観測の仕方である。
- `plan/SKILL.md:55` — 「The plan writes the `Goal`'s result as a test case」と単数で書く。
- `plan/references/format.md:124`、`:148` — 「the `Goal`'s result is one of those cases」「The `Goal`'s result is one of the related tests」と単数で書く。
- `plan/SKILL.md:80-82`、`plan/references/tasks.md:10`、`:37` — review の `Goal` 視点は、`design` の `Goal` と `Non-goal` をまとめて読む。
- `design/references/tasks.md:45` — `design` の review は「each plan's `Goal` carries ... and is checkable」と単数で読む。
- `yolo/SKILL.md:34` — 五つの視点の名前は `Goal`、`Files`、`Types`、`Cases`、`Checks` で、`Goal` の形には触れない。
- `cycles/261027-043-feat-scrub-update/design.md:72` — 今の `Goal` は 1 文に 3 グループの結果を詰め、読点でつないでいる。`cycles/261028-044-dev/design.md:65`、`:112` も同じ形である。
- `DEFINITION.md:37-38` — `design-skill` と `plan-skill` の行は、主たる機能が「切る」「作業の形と順序を決める」である。
- `rules/definition.rules.md:24-27` — Unit の行は主たる機能で、経路と検査は行を変えない。
- 外部調査が必要な問いは無く、試作も要らない。

### Decision

- Status: **accepted**
- Adopted:
  - 案 A: `Goal` を 1 行以上の箇条書きにし、各行を「検査を落とせる結果」にする。
  - 導出は、`Adopted` の行と `Scope` の `in` の項目ごとに 1 行とし、`Research & Trial` がその観測の仕方を示す。
  - `plan` は各行の結果をテストケースにし、`design` と `plan` の review は各行を読む。
  - `Goal` と `Non-goal` の形を揃える。
  - 既存の `cycles/` の `design.md` と `plan.md` は書き換えない。
- Options:
  - 案 B: `Goal` を「結果 / 検査」の 2 列の表にする。採らなかった理由: `Non-goal` と形が違い、表は長い文で崩れやすい（`design/references/format.md:140`）。
  - 案 C: 1 文の `Goal` を残し、`plan` のテストケースから転記する。採らなかった理由: `design` と `plan` の順序が逆になり、`plan` は `design` の `Goal` からテストケースを書くので循環する。スコープの `refactor: out` と合わない。
  - 案 D: `Goal` を捨てる。採らなかった理由: `plan` の達成を 1 か所で読めなくなり、review の `Goal` 視点が消える。

### Definition

- `Unit.design-skill`(kept): 行は「エージェントが、サイクルを plan に切る材料を調べ、切り方を決め、どこで走らせるかを提案できる（owner が決める）」で、主たる機能は変わらない。`Goal` の形と導出は、切る材料の書き方である。
- `Unit.plan-skill`(kept): 行は「エージェントが、1 plan 分の作業の形と順序を決めて書ける」で、主たる機能は変わらない。`Goal` の各行をテストケースにすることは、検査の書き方である。
- `Unit.yolo-skill`(kept): 行は「エージェントが、オーナーの確認を挟まずにクローズのトリアージまで進めることができる」で、主たる機能は変わらない。五つの視点の名前と止まる位置は変わらない。

## 03: `brief` を ADR に統合し、ADR をゼロベースで再構築するか

### Context

- `ROADMAP.md:19` の `004` は「brief のエントリ分解、work コミットメッセ修正」で、`status` は `wip` である。`004` は 2 つの問いを持つ。このエントリは `brief` の統合と ADR の再構築を持ち、`work` のコミットメッセージは 04 が持つ。
- 今の `brief` は、意図、ロードマップ、スコープ、調査、選択肢、議論、試作、停止の 9 ステージを持つ（`brief/SKILL.md:26-91`）。`adr` は、cycle の問いを entry にし、`Context`、`Scope`、`Options`、`Research & Trial`、`Decision`、`Definition` を書く（`adr/SKILL.md:19-72`）。
- `brief` は `adr` の front として、意図を詰め、事実を集め、選択肢を並べる（`brief/SKILL.md:8`）。`adr` はその記録を `Context` と `Options` に写す（`adr/SKILL.md:21`、`:31`、`:38`、`:45`、`:53`）。同じ事実と選択肢を 2 回書くので、写すときに意味が落ちる。
- `adr/SKILL.md` には「the front」が 8 箇所（`:21`、`:31`、`:34`、`:36`、`:38`、`:40`、`:45`、`:53`、`:54`）、`adr/references/format.md` に 3 箇所（`:53`、`:63`、`:64`）ある。`brief` を消すと、これらの参照が古くなる。
- `brief` を指す参照は、`README.md:12`、`:61`、`:72`、`README.ja.md:12`、`:61`、`:72`、`AGENTS.md:3`、`rules/roadmap.md:19`、`DEFINITION.md:35` にある。`work/SKILL.md:69` の「the front」は cmux-browser の front であり、`brief` ではない。
- `README.md:12` と `README.ja.md:12` はスキルを 7 つと書く。`README.md:61` と `README.ja.md:61` は `brief` の行を持ち、`:72` は「A cycle starts with `brief`」と書く。
- `AGENTS.md:3` は「1 cycle starts brief first, then ADR→design→plan→work→close」と書く。`rules/roadmap.md:19` は「`brief` picks the item the cycle fits」と書く。
- `DEFINITION.md:35` は `Unit.brief-skill`（「エージェントが、サイクルの要件を調べ、詰めて、ADR に渡せる」）、`:36` は `Unit.adr-skill`（「owner が決め、エージェントが記録できる」）である。
- `brief/references/tasks.md` は、調査と試作のタスク文を持つ。`adr` は `references/tasks.md` を持たない。
- `adr/scripts/scaffold.mjs` は、`nextNNN` で `cycles/` と `cycles/archive/` の最大に 1 を足し、`cycleDirName` で新しい dir を作り、`adrSkeleton(nnn)` で `# ADR NNN` と `## 01` の骨を書く（`:106-124`、`:190-216`）。既存の `adr.md` に追記する道は無い。`createLeafDir` は既存のディレクトリでは例外を投げる（`:132-136`）。
- `scaffold.test.ts` は、`adrSkeleton`、`slugBranch`、`toYYMMDD`、`nextNNN`、`cycleDirName`、`createLeafDir`、`dirNames`、`parseArgs` を試す（`:16-176`）。追記のテストと、次のエントリ番号のテストは無い。
- `yolo/SKILL.md:13` は「after every entry of the ADR is accepted」と定める。`design`、`plan`、`close` は `brief` を参照しない。`yolo` は `brief` を参照しない。
- `Unit.adr-skill` の主たる機能は「owner が決め、エージェントが記録できる」である。`Unit.brief-skill` の「調べ、詰めて、渡す」は、統合後は ADR の経路になる（`rules/definition.rules.md:24-27`）。
- 外部調査が必要な問いは無く、リポジトリの中で読める事実だけで足りる。試作も要らない。

### Scope

- 変更:
  - behaviour: in — `brief` を廃止し、`adr` に統合する。`adr` は、意図、ロードマップ、エントリの分割、エントリごとのスコープ、調査、選択肢、決定、proofread を 1 つの手順で行う。エントリは 1 つずつ進め、決定を `adr.md` に書いた後に proofreader を走らせ、その間に次のエントリの議論を進める。
  - refactor: in — `brief/SKILL.md` と `brief/references/tasks.md` を消し、`adr/SKILL.md` をゼロベースで書き直す。`adr/references/format.md` の「the front」をなくす。`brief/references/tasks.md` の調査と試作のタスクを `adr/references/tasks.md` に移す。
  - dependency: out — パッケージを足さない。
  - naming: in — `brief` のスキル名と `Unit.brief-skill` を落とす。`adr` と `Unit.adr-skill` の名前は残す。`README` のスキルの数を 7 から 6 にし、`AGENTS.md` のサイクルの入口を `adr` にする。
  - format: in — `adr/references/format.md` の `Scope` の「the front」を直し、`adr` の `## Cycle` と `## One entry` の形を、意図、ロードマップ、分割、エントリごとのループに合わせる。`adr` の `## Proofread` を、エントリごとのバックグラウンドの proofread にする。
  - prose: in — `adr/SKILL.md` の全文、`adr/references/format.md`、`README.md`、`README.ja.md`、`AGENTS.md:3`、`rules/roadmap.md:19`、`DEFINITION.md:35-36`。
  - code: in — `adr/scripts/scaffold.mjs` は、最新の開いているサイクルの `adr.md` を走査で見つけ、ファイルが無ければ今の挙動で作り、ファイルがあれば次のエントリの骨を `md` の下部に追記する。パスの引数は足さない。`scaffold.test.ts` に、ファイルが無い場合、`01` がある場合、`02` がある場合、見出しが壊れている場合のテストを足す。
- 品質:
  - speed: out — 実行時の処理を変えない。`scaffold` は 1 回だけ走る。
  - security: out — 権限も入力も増えない。
  - compatibility: in — 新しい `adr` の手順は新しいサイクルから使う。既存の `cycles/` の ADR は記録であり、書き換えない。`design`、`plan`、`work`、`close`、`yolo` は `brief` を参照しないので、そのまま動く。`yolo` の「every entry of the ADR is accepted」は、統合後の ADR でも同じである。
  - errors: in — オーナーがエントリの分割を拒否したら、`adr` は分割を書き直して再度提示する。調査や選択肢の途中で新しいエントリが必要になったら、オーナーに提示してから加える。proofreader の報告が決定の意味を変えたら、決め直す。proofreader が走っている間に次のエントリを `adr.md` に書かない。`scaffold` の最新の `adr.md` が無い、または見出しが壊れている場合は、今の挙動にするか、理由を付けて止める。最新のサイクルが `close.md` を持つ場合は、閉じたサイクルなので、今の挙動で次のサイクルを作る。
- 運用:
  - deploy: out — `Stack` の `Deploy` は「なし」。
  - migration: out — 既存の `cycles/` の ADR を新しい手順に移さない。`brief` を消すのは `.pi` のコピーで製品にも運ばれるが、製品の既存の記録は書き換えない。
  - logs and monitoring: out — 記録は `cycles/` と git が持つ。

### Research & Trial

- `brief/SKILL.md:26-91` — 9 ステージ。`brief/SKILL.md:14-24` — 終わりの条件 5 つ。`brief/SKILL.md:45`、`:51` — スコープは 1 つのエントリを前提にする。`brief/SKILL.md:68-79` — 選択肢は意図に対して 2 から 4 個。
- `adr/SKILL.md:19-72` — `## Cycle`、`## One entry`、`## Proofread`、`## What comes after an entry`。`adr/SKILL.md:21`、`:31`、`:38`、`:45`、`:53` — `brief` を front として参照する。
- `adr/references/format.md:53`、`:63`、`:64` — `Scope` の「the front's list」。
- `README.md:12`、`:61`、`:72`、`README.ja.md:12`、`:61`、`:72` — スキル 7 つの一覧と「サイクルは `brief` から始まる」。`AGENTS.md:3` — `brief` が最初。`rules/roadmap.md:19` — `brief` が項目を選ぶ。
- `DEFINITION.md:35-36` — `Unit.brief-skill` と `Unit.adr-skill`。`rules/definition.rules.md:24-27` — Unit の行は主たる機能で、経路と検査は行を変えない。
- `brief/references/tasks.md` — 調査と試作の 2 つのタスク。`adr` の `references/` は `format.md` と `scripts/` だけである。
- `scaffold.mjs:106-124` — `nextNNN`。`:132-136` — `createLeafDir` は既存のディレクトリでは例外を投げる。`:190-216` — `# ADR NNN` と `## 01` を書く CLI。`scaffold.test.ts:16-176` — 追記のテストは無い。
- `cycles/` — `044` は `close.md` を持ち、`045` は持たない。`045` は開いている最新のサイクルである。
- `yolo/SKILL.md:13` — ADR の全 entry が accepted の後に走る。`design`、`plan`、`close` は `brief` を参照しない。
- 外部調査が必要な問いは無く、試作も要らない。

### Decision

- Status: **accepted**
- Adopted:
  - 案 A: `brief` を廃止し、`adr` に統合する。`adr` の手順は、1. 意図、2. ロードマップ、3. エントリの分割と各エントリの意図、4. エントリごとのスコープ、5. 必要なら調査か試作の提案、6. 選択肢の提示と議論、7. オーナーの合意、8. `adr.md` への記述、9. proofreader を走らせて次のエントリへ、の 2 ステージ構成にする。
  - `brief` の「Do not decide」は残す。ADR はオーナーの決定を記録する文書であり、エージェントが決める文書ではない。
  - proofreader はエントリごとに走らせる。その間に次のエントリの議論を進める。次のエントリを `adr.md` に書くのは、proofreader の報告を読み、意味が変わった所を直した後にする。proofreader のタスクには、今のエントリの行だけを直し、全体を書き直さないと書く。
  - `scaffold.mjs` は、最新の開いているサイクルの `adr.md` を走査で見つける。パスの引数は足さない。ファイルが無ければ今の挙動で作り、ファイルがあれば次のエントリの骨を追記する。エントリ番号は `## NN:` の見出しから純粋関数で求める。`# ADR NNN` は繰り返さない。最新のサイクルが `close.md` を持つ場合は、閉じたサイクルなので、今の挙動で次のサイクルを作る。
  - `brief` を消す参照と `DEFINITION.md` を 1 つの計画で直す。`brief` を消したコミットで `adr` の参照が残らないようにする。
  - `005` の proofreader の指示は、このエントリの proofread のステージと重なる。`design` が `005` との順序を決める。
- Options:
  - 案 B: `brief` を残し、エントリの分割のステージを足す。採らなかった理由: スキルが 2 つのままで、`brief` と `adr` の二重の記述が残る。ADR の `Context` が `brief` のコピーのままになる。
  - 案 C: `brief` を残し、エントリの分割を ADR に任せる。採らなかった理由: `brief` が調査と選択肢を出した後に ADR が分割するので、分割が遅すぎる。今の「場当たり的な対応」が残る。
  - 案 D: ロードマップの 1 項目を 1 エントリにする。採らなかった理由: `004` のように 2 つの問いを持つ項目が、1 つのエントリに 2 つの問いを持つ。`adr/SKILL.md:23` の「one entry is one question」と逆になる。

### Definition

- `Unit.brief-skill`(dropped):
- `Unit.adr-skill`(kept): 行は「owner が決め、エージェントが記録できる」で、主たる機能は変わらない。意図、ロードマップ、エントリの分割、調査、選択肢は、決定の記録を作る経路である。
- `Unit.usage-readme`(kept): 行は「owner が、このスターターの使い方を読むことができる」で、主たる機能は変わらない。README のスキルの数とサイクルの入口が変わる。
- `Unit.agent-rules`(kept): 行は「エージェントが、毎セッション同じ規則を読むことができる」で、主たる機能は変わらない。`AGENTS.md` のサイクルの入口が `adr` になる。
- `Unit.harness-copy`(kept): 行は「owner が、スターターのハーネスをプロジェクトへ取り込み、プロジェクトのハーネスをスターターへ戻せる」で、主たる機能は変わらない。`.pi` のコピーは `adr` の新しいファイルを運び、`brief` を運ばなくなる。
- `Who.owner`(kept): `Needs` の「判断は自分のところに来ること」は、ADR が選択肢を並べ、決定を記録することで満たされる。
- `Who.agent`(kept): `Needs` の「規則、検査、基準、記録が最初から揃っていること」は、1 つの ADR の手順で満たされる。

## 04: `work` の `base` plan のコミットメッセージを、`consult(...)` から何に変えるか

### Context

- `ROADMAP.md:19` の `004` の後半は「work コミットメッセ修正」で、`ROADMAP.md:49` は「work が base 時に、consult なんとか、みたいなコミットメッセージになってしまうのをスキル本文で、明示的に指示して変更」と書く。`status` は `wip` である。
- `work/SKILL.md:75` は、acceptance を `consult(<plan id>): acceptance` でコミットし、「A `base` plan commits it in the base with the same message; there is no worktree」と書く。
- `work/SKILL.md:40` と `work/references/tasks.md:10` は、worktree の `code` subagent が slice ごとに `consult(<plan id>): <short English subject>` でコミットすると定める。
- `work/references/tasks.md:64` は、review の fixes を `consult(<plan id>): round <N> fixes` でコミットすると定める。
- `work/SKILL.md:46` は、`base` plan ではエージェントが slice を行い、オーナーの OK を待ってコミットすると定めるが、メッセージは書いていない。
- `work/SKILL.md:31` は、サイクルの文書のコミットを `update: NNN's ADR, design and plan` と定める。
- `git log` — `044` のベースのコミットは `update: 044's ADR, design and plan`、`update: 044's replace-and-docs`、`update: 044's product-ready-replace cleanup and acceptance`、`update: 044's close` である。worktree のコミットは `consult(<plan id>): ...` である。ベースは `update: NNN's <plan id> ...` の形をすでに使っている。
- `yolo/SKILL.md:42` — `yolo` は `base` plan を使わない。全 plan が worktree であり、`consult(...)` のままである。
- `DEFINITION.md:39` — `Unit.work-skill` の行は「エージェントが、plan を 1 つずつ片付けられる」である。
- 外部調査が必要な問いは無く、リポジトリの中で読める事実だけで足りる。試作も要らない。

### Scope

- 変更:
  - behaviour: in — `work` の `base` plan のコミットメッセージを、`consult(...)` から `base(<plan id>): <subject>` にする。対象は、slice、fixes、acceptance の 3 つである。worktree plan の `consult(...)` は変えない。
  - refactor: out — `work` のステージの順序と中身を変えない。変えるのはコミットメッセージだけである。
  - dependency: out — パッケージを足さない。
  - naming: out — メッセージは prose の中で決める。Unit の名前は変えない。
  - format: out — `work` は `format.md` を持たない。`references/tasks.md` は worktree の `code` subagent に渡す文であり、変えない。
  - prose: in — `work/SKILL.md:46` の `base` plan の slice、`:64` の fixes、`:75` の acceptance のコミットメッセージを直す。
- 品質:
  - speed: out — 実行時の処理を変えない。
  - security: out — 権限も入力も増えない。
  - compatibility: out — 既存のコミットは記録であり、書き換えない。新しいメッセージは新しい作業から使う。
  - errors: out — メッセージは文字列であり、失敗の道を変えない。commit が lefthook に拒否される経路はそのままである。
- 運用:
  - deploy: out — `Stack` の `Deploy` は「なし」。
  - migration: out — 既存のコミットを書き換えない。
  - logs and monitoring: out — 記録は `cycles/` と git が持つ。

### Research & Trial

- `work/SKILL.md:31` — 文書のコミットは `update: NNN's ADR, design and plan`。`work/SKILL.md:40`、`work/references/tasks.md:10` — worktree の `code` subagent は `consult(<plan id>): <short English subject>`。
- `work/SKILL.md:46` — `base` plan はエージェントが slice を行い、オーナーの OK を待ってコミットする。メッセージは無い。
- `work/references/tasks.md:64` — fixes は `consult(<plan id>): round <N> fixes`。`work/SKILL.md:75` — acceptance は `consult(<plan id>): acceptance` で、`base` plan も同じメッセージを使う。
- `git log` — `044` のベースのコミットは `update: 044's ...` であり、worktree のコミットは `consult(...)` である。ベースは `update: NNN's <plan id> ...` の実績を持つ。
- `yolo/SKILL.md:42` — `yolo` は `base` plan を使わない。
- `DEFINITION.md:39` — `Unit.work-skill` の行。
- 外部調査が必要な問いは無く、試作も要らない。

### Decision

- Status: **accepted**
- Adopted:
  - 案 A: `base` plan のコミットメッセージを `base(<plan id>): <subject>` にする。
  - slice は `base(<plan id>): <subject>`、fixes は `base(<plan id>): round <N> fixes`、acceptance は `base(<plan id>): acceptance` にする。
  - worktree plan の `consult(<plan id>): ...` は変えない。
  - `work/SKILL.md:46`、`:64`、`:75` に、ベースのメッセージを明示する。`work/references/tasks.md` は変えない。
  - `yolo` は `base` plan を使わないので、変えない。
- Options:
  - 案 B: `update: NNN's <plan id> <subject>`。採らなかった理由: `work/SKILL.md:31` と `044` のベースのコミットに合うが、オーナーは `base` の接頭辞を選んだ。
  - 案 C: `<plan id>: <subject>`。採らなかった理由: サイクル番号が無く、同じ plan id が別のサイクルで使われると区別できない。
  - 案 D: `consult(...)` のまま。採らなかった理由: `base` plan には worktree が無いのに `consult` の接頭辞が付き、ログが worktree のコミットに見える。

### Definition

- `Unit.work-skill`(kept): 行は「エージェントが、plan を 1 つずつ片付けられる」で、主たる機能は変わらない。コミットメッセージは経路である。

## 05: `proofreader` の指示を、`types.json` の役割に合わせてどう直すか

### Context

- `ROADMAP.md:18`、`:41-44` の `005` は「proofreader のスキル内での指示文書が、`types.json` の基準に追いついてないので更新」で、アイデアは「意味を書き換えないではなく、補足はして良いと書いてる部分。要参照」である。`status` は `wip` である。
- `.pi/extensions/consult/types.json:43` の `proofreader` の役割は「文書の形が `format.md` で定められている場合は、それを読んで形を保ちます」「内容の妥当性はあなたの管轄外ですが、文脈が足りない場合補うことは許容します」「書き直しはファイルを編集して行います。提案は不要です。`quick_edit`、`target_edit`、`write` を使ってください」「報告は `fixed:` と `kept:` の形」と定める。
- `proofreader` を呼ぶスキルの手順は 4 つである。`adr/SKILL.md:82-89` は `adr.md`、`design/SKILL.md:80-87` は `design.md`、`plan/SKILL.md:92-99` は `plan/<plan id>.md` を 1 本ずつ、`close/SKILL.md:64-71` は `close.md` を対象にする。
- 4 つの手順は、対象のファイルを名指し、`proofreader` を 1 回走らせ、報告と `git diff` を読み、意味が変わったら `format.md` の形に戻し、1 ラウンドで終える。`format.md` の場所、補足を許す方針、名指したファイルだけを編集する規則は書いていない。
- `adr` は 03 の後、エントリごとに走る。`plan` は `plan` の数だけ走る。`design` と `close` は 1 回ずつである。
- `yolo/SKILL.md:26`、`:35`、`:51` は、`design`、`plan`、`close` の proofread を飛ばすと書く。`proofreader` を呼ばない。
- `tasks.md` に proofread のタスクは 0 件である。`design/references/tasks.md`、`plan/references/tasks.md`、`close/references/tasks.md` は調査とレビューのタスクを持ち、`adr` は 03 が `references/tasks.md` を作る。
- `plan` の `Added` として、`cycles/261026-042-dev/plan/proofreader-role.md:102` が 041 の ADR のコピーに、`cycles/261027-043-feat-scrub-update/plan/tuning-settings.md:282`、`:299` が `README.ja.md` に `proofreader` を当てた。これはスキルの手順ではなく、`plan` が書いた検査である。
- 4 つの手順は `cycles/261026-042-dev/plan/cycle-proofread-step.md` が足し、`proofreader` の役割は `cycles/261026-042-dev/plan/proofreader-role.md` が足した。
- `cycles/261029-045-dev/adr.md` の 03 の `Decision` は、03 の ADR の proofread のステージが 05 のタスク文を使うと定め、`design` が 03 と 05 の順序を決める。
- `DEFINITION.md:36-40` は `Unit.adr-skill`、`Unit.design-skill`、`Unit.plan-skill`、`Unit.close-skill` の行を持つ。
- 外部調査が必要な問いは無く、リポジトリの中で読める事実だけで足りる。試作も要らない。

### Scope

- 変更:
  - behaviour: in — 4 つの proofread のステージが、proofreader に一文とパスを渡す。一文は、対象のファイル、そのスキルの `references/format.md`、「the role's policy applies」、「名指したファイルだけを編集する」である。`adr` は「今のエントリの行だけ」にする。
  - prose: in — `adr/SKILL.md:82-89`、`design/SKILL.md:80-87`、`plan/SKILL.md:92-99`、`close/SKILL.md:64-71` を一文とパスに直す。`yolo` は飛ばすので変えない。03 の ADR の proofread のステージは、この一文を使う。`design` が 03 と 05 の順序を決める。
  - format: out — `tasks.md` は作らない。`adr` の `references/tasks.md` は 03 が作るが、そこに proofread のタスクは置かない。
  - refactor: out — proofread の位置、1 ラウンドの規則、オーナーが読む前の順序を変えない。
  - dependency: out — パッケージを足さない。
  - naming: out — 役割とスキルの名前を変えない。
- 品質:
  - speed: out — proofreader は subagent であり、実行時の処理を変えない。
  - security: out — 権限も入力も増えない。
  - compatibility: in — 既存の `cycles/` の記録は書き換えない。新しい一文は新しい proofread から使う。スキルは `.pi` のコピーで製品にも運ばれる。
  - errors: in — 一文が対象のファイルを名指し、proofreader はそのファイルだけを編集する。`adr` は今のエントリの行だけである。報告が決定の意味を変えたら、スキルが直す。1 ラウンドの規則はそのままである。`write` で全体を書き直す危険は、一文の「名指したファイルだけ」で防ぐ。
- 運用:
  - deploy: out — `Stack` の `Deploy` は「なし」。
  - migration: out — 既存の記録を新しい一文に移さない。
  - logs and monitoring: out — 記録は `cycles/` と git が持つ。

### Research & Trial

- `adr/SKILL.md:82-89`、`design/SKILL.md:80-87`、`plan/SKILL.md:92-99`、`close/SKILL.md:64-71` — 4 つの手順。対象のファイル、1 回の実行、報告と `git diff`、修理、1 ラウンド。`format.md` の場所と、補足を許す方針と、名指したファイルだけを編集する規則は無い。
- `yolo/SKILL.md:26`、`:35`、`:51` — 3 箇所で proofread を飛ばす。呼ばない。
- `cycles/261026-042-dev/plan/proofreader-role.md:102` — 041 の ADR のコピーに 1 回。`cycles/261027-043-feat-scrub-update/plan/tuning-settings.md:282`、`:299` — `README.ja.md` に 1 回。どちらも `plan` の `Added` である。
- `tasks.md` — proofread のタスクは 0 件。`design`、`plan`、`close` の tasks.md は調査とレビューを持つ。`adr` の tasks.md は 03 が作る。
- `.pi/extensions/consult/types.json:43` — `format.md`、補足を許す方針、`quick_edit` / `target_edit` / `write`、`fixed:` / `kept:`。
- `adr` は 03 の後、エントリごと。`plan` は `plan` ごと。`design` と `close` は 1 回ずつ。
- `DEFINITION.md:36-40` — 4 つの Unit。`rules/definition.rules.md:24-27` — 行は主たる機能で、経路は行を変えない。
- 外部調査が必要な問いは無く、試作も要らない。

### Decision

- Status: **accepted**
- Adopted:
  - 案 B: 4 つのスキルの本文に、一文とパスを書く。一文は、対象のファイル、そのスキルの `references/format.md`、「the role's policy applies」、「名指したファイルだけを編集する」である。`adr` は「今のエントリの行だけ」にする。
  - `types.json` の役割は基準であり、変えない。`tasks.md` は作らない。`adr` の tasks.md は 03 が作るが、そこに proofread のタスクは置かない。
  - `plan` の `Added`（042 の 041 ADR のコピー、043 の `README.ja.md`）は、同じ一文とパスを使う。
  - `yolo` の 3 つのスキップは変えない。
  - 03 と 05 の順序は `design` が決める。
- Options:
  - 案 A: `tasks.md` に proofread のタスク文を足す。採らなかった理由: `types.json` の役割と重複し、`proofreader` の特定の用途に対して重い。`plan` の `Added` はスキルの `tasks.md` を読まない。
  - 案 C: `types.json` の役割に方針を集め、スキルはファイルだけを名指す。採らなかった理由: 役割はスキルごとの `format.md` を知らない。`format.md` を名指さないと、proofreader は形を保てない。
  - 案 D: 何も変えない。採らなかった理由: 役割の `format.md` と「補足を許す」方針がスキルのステップに届かず、`005` の問題が残る。

### Definition

- `Unit.adr-skill`(kept): 行は「owner が決め、エージェントが記録できる」で、主たる機能は変わらない。proofread のステージの一文が変わる。
- `Unit.design-skill`(kept): 行は「エージェントが、サイクルを plan に切る材料を調べ、切り方を決め、どこで走らせるかを提案できる（owner が決める）」で、主たる機能は変わらない。proofread のステージの一文が変わる。
- `Unit.plan-skill`(kept): 行は「エージェントが、1 plan 分の作業の形と順序を決めて書ける」で、主たる機能は変わらない。proofread のステージの一文が変わる。
- `Unit.close-skill`(kept): 行は「エージェントが、サイクル終了後に、クロージングできる」で、主たる機能は変わらない。proofread のステージの一文が変わる。
