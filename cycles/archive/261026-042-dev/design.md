# DESIGN 042

## Affected

### 01: サイクルで出す md を、オーナーの最終確認の前に日本語の校正へ通す手順を、どう入れるか

- `README.md` — サイクルの各ステージの説明を載せており、校正を足すと古くなる（`:61-68`）。
- `README.ja.md` — 同じ説明を日本語で載せており、校正を足すと古くなる（`:61-68`）。
- `lefthook.yaml` — commit の整形の対象に md を含める（`:8`）。
- `package.json` — `format` と `format:check` の入口を持つ（`:15-16`）。
- `.pi/extensions/quality-gate/targets.ts` — 整形の対象の拡張子に `.md` を持つ（`:17`）。
- `.pi/extensions/quality-gate/checks.ts` — ターンで変えた md を、整形に渡す（`:109`）。

### 02: 校正に使う consult の役割を、どう設定するか

- `.pi/extensions/consult/policy/types.ts` — `loadTypes` が `types.json` を毎回読み（`:169`）、`resolveType` が名前で役割を引く（`:187`）。
- `.pi/extensions/consult/tool/consult.ts` — 呼び出しごとに役割を引く（`:382`）。
- `.pi/extensions/consult/sub/spec.ts` — `isolated` で隔離の要否を決め（`:31`）、方針を起動引数に組み立て（`:67`）、`models` の 1 番目を `-m` に（`:76`）、`role` を追記に（`:80`）、`tools` を `--tools` に載せる（`:84`）。
- `.pi/extensions/consult/run/subagent.ts` — 隔離の要否でベースかワークツリーかを決め（`:57`）、`paths` と `bash` と上限を環境に載せる（`:84`）。
- `.pi/extensions/consult/sub/guard.ts` — `paths` を当てて書ける所を決め（`:194`）、接頭辞で打てるコマンドを決める（`:210`）。
- `.pi/extensions/consult/run/run.ts` — 上限を超えたら子プロセスを止める（`:263-287`）。
- `.pi/extensions/consult/sub/budget.ts` — 最後のターンの 2 つ前に、報告を促す（`:15-20`）。
- `.pi/extensions/consult/index.ts` — `promptSnippet` が役割の名前を並べる（`:227`）。
- `.pi/extensions/consult/tool/run.ts` — `role` の説明が役割の名前を並べる（`:14`）。
- `.pi/extensions/consult/policy/types.test.ts` — 方針の検証と読み直しを確かめる（`:15`、`:85`）。
- `.pi/extensions/consult/consult.fixture.ts` — 最小の役割と `types.json` の本文を作る（`:18`、`:33`）。
- `.pi/extensions/consult/sub/spec.test.ts` — 起動引数の組み立てと隔離の要否を確かめる（`:68`、`:120`）。
- `.pi/extensions/consult/run/subagent.test.ts` — ベースかワークツリーかと、上限と許可の受け渡しを確かめる（`:29`、`:56`）。
- `.pi/extensions/consult/tool/run.test.ts` — `role` 引数の検証を確かめる（`:7`）。
- `.pi/extensions/consult/sub/guard.test.ts` — glob の境界と、書き込みの判定を確かめる（`:164`、`:191-207`）。

## External

### 01: サイクルで出す md を、オーナーの最終確認の前に日本語の校正へ通す手順を、どう入れるか

- `pi 本体のスキルの読み込み` — 起動時に名前と説明とパスを載せ、`description` でいつ読み込むかを決め、壊れた `SKILL.md` は読み込まない。校正のステップを足しても `description` は変わらないので、この契約は通る。

### 02: 校正に使う consult の役割を、どう設定するか

- `pi 本体の起動引数` — `-m`、`--append-system-prompt`、`--tools`、`--extension`、`--session` を受け取る。役割の設定は、この面に写る（`sub/spec.ts:76-86`）。
- `モデルの提供元` — `models` の候補に問い合わせる。候補は順に試し、どれも使えなければメインの設定で走る（`run/run.ts:59-68`）。
- `node の glob の意味` — `path.matchesGlob` が、`**/*.md` と `**/.*/**/*.md` の当たり方を決める。`**/*.md` だけでは、点で始まるディレクトリの md に当たらない（`sub/guard.ts:205`）。

## `proofreader-role`

### ADR & Where

- No: 02
- Why: 役割の設定と、それを読む検査という同じ入力を持ち、他に待つ相手が無い。もう 1 つのプランが役割の名を指すので、先にマージする。
- Where: worktree

### Goal

- 日本語の異常を含む md を渡すと、その異常だけが直り、決定の文と、セクション名・欄名・パス・数値は同じ意味で残る。

### Non-goal

- 既存の 4 つの役割の設定は変えません（`Scope` の `refactor` と `compatibility` が `out`）。
- ワークツリーに隔離しません（`Options` の B を採らず、オーナーが読むファイルをその場で直すため）。
- `guard` の判定の規則そのものは変えません。書き込める範囲は、役割の `paths` で限ります（`Scope` の `security`）。
- 手順のステップは書きません（`cycle-proofread-step` の仕事です）。

### Summary

- consult の役割に `proofreader` を足し、ベースのツリーで md を書き換えられるようにします。
- 道具は読みの 4 つと書きの 4 つで、`bash` を持たせません。書ける所は `["**/*.md", "**/.*/**/*.md"]` です。モデルの候補は `review` と同じ 2 つ、上限はターン 80、出力 120000、`continue` の既定は false です。
- 役割の文面に、観点 10 種類、内容と決定の妥当性を見ないこと、`format.md` の形を保つこと、書き直すこと、報告の形、上限に達したときの振る舞いを書きます。
- 役割の名前を並べている 3 つの文面を追随させ、md だけを通す境界を検査に足します。

### Paths

- `.pi/extensions/consult/types.json`
- `.pi/extensions/consult/README.md`
- `.pi/extensions/consult/index.ts`
- `.pi/extensions/consult/tool/run.ts`
- `.pi/extensions/consult/sub/guard.test.ts`

### Boundary

- Plans: なし
- External:
  - `pi 本体の起動引数`: 役割の設定を起動引数に写す。
    - Contract: `-m`、`--append-system-prompt`、`--tools`、`--extension`、`--session` を受け取る。
  - `モデルの提供元`: `models` の候補に問い合わせる。
    - Contract: 候補は順に試し、どれも使えなければメインの設定で走る。
  - `node の glob の意味`: `**/*.md` と `**/.*/**/*.md` の当たり方を決める。
    - Contract: `**/*.md` だけでは、点で始まるディレクトリの md に当たらない。

## `cycle-proofread-step`

### ADR & Where

- No: 01
- Why: 5 つの `SKILL.md` という同じ入力を読み、`proofreader` の役割が在ることを待つ。
- Where: base（owner が文面を見る）

### Goal

- 4 つのフローのどれかで md を書き終えると、オーナーに渡す前に `proofreader` が 1 回走り、オーナーが読む md は書き換え後で、決定の文は同じ意味のままである。

### Non-goal

- `references/format.md` のセクション名と欄名は変えません（`Scope` の `compatibility` は `in` で、動くのは行の番号だけです）。
- 校正の観点をスキルに写しません。観点は役割の文面 1 か所に置きます（`Scope` の `format`）。
- 校正を 1 ラウンドで終えます。メインが直した後に、もう一度校正へ回しません（`Options` の B を採らない）。
- クローズの最後にまとめて 1 回、という形にしません（`Options` の C を採らない）。

### Summary

- 4 つの手順に、オーナーが文書を読む直前のステップとして校正を足します。ADR は `Entries, together` の後、デザインは手順 7 の後、プランは手順 10 の後、クローズは手順 5 の後です。
- ステップは、校正のサブエージェントに md を書き換えさせ、メインが報告と `git diff` を読んで、意図が変わった所を `references/format.md` どおりに直します。直した所は、オーナーへの報告に 1 行ずつ書きます。
- `yolo` の `skips` に校正を飛ばす理由を書き、オーナーが実際に読むステップで走らせます。`README.md` と `README.ja.md` のステージの説明も追随させます。

### Paths

- `.pi/skills/adr/SKILL.md`
- `.pi/skills/design/SKILL.md`
- `.pi/skills/plan/SKILL.md`
- `.pi/skills/close/SKILL.md`
- `.pi/skills/yolo/SKILL.md`
- `README.md`
- `README.ja.md`

### Boundary

- Plans:
  - `proofreader-role`: `proofreader` の名と、書ける所の許可を決める。本プランのステップが、その名を指す（先に終わる）。
- External:
  - `pi 本体のスキルの読み込み`: ステップを足した `SKILL.md` を読む。
    - Contract: `name` と `description` を持ち、壊れた `SKILL.md` は読み込まない。
