# DESIGN 045

## Affected

### 01: sound-notify の設定を、ほかの拡張機能の `settings.json` と同じ形にどう揃えるか

- `scripts/harness/harness.json` — `.pi` のコピーが変更されたファイルを運ぶ
- `.pi/tsconfig.json` — `**/*.ts` で `.pi` 配下を型検査する
- `scripts/checks/scopes.json` — `.pi` を型検査の対象にする
- `.oxlintrc.json` — `.pi/**/*` を lint の対象にする
- `.oxfmtrc.json` — 整形の設定を持つ
- `lefthook.yaml` — pre-commit で `md` と `mjs` を整形する
- `package.json` — `format` と `lint` と `typecheck` のエントリーポイントを持つ
- `.pi/extensions/quality-gate/targets.ts` — 整形対象の拡張子に `.md` を持つ
- `.pi/extensions/quality-gate/checks.ts` — 変更されたファイルを整形に渡す
- `scripts/checks/typecheck.mjs` — `scopes.json` の各スコープを順に処理する

### 02: `Goal` を複数行にし、どう導出するか

- `.pi/skills/work/references/tasks.md` — `## Test cases` を読む
- `.pi/skills/work/SKILL.md` — `## Test cases` を読む
- `.pi/skills/design/references/tasks.md` — 各 `plan` の `Goal` を読む
- `.pi/skills/plan/references/tasks.md` — `design` の `Goal` と `Non-goal` を読む
- `.pi/skills/plan/SKILL.md` — `Goal` の結果をテストケース化し、レビューで確認する

### 03: `brief` を ADR に統合し、ADR をゼロベースで再構築するか

- `scripts/harness/index.mjs` — `.pi` 配下をウォークして集める
- `lefthook.yaml` — pre-commit で `md` と `mjs` を処理対象にする
- `.oxfmtrc.json` — 整形の設定を持つ
- `.oxlintrc.json` — `mjs` の lint 設定を持つ
- `scripts/checks/scopes.json` — `.pi` を型検査の対象にする
- `scripts/checks/typecheck-staged.mjs` — ステージ済みの `mjs` を型検査する
- `package.json` — `format` と `lint` と `typecheck` のエントリーポイントを持つ
- `.pi/skills/design/SKILL.md` — `accepted` の `Scope` と `Definition` を読む
- `.pi/skills/close/SKILL.md` — `accepted` と `Definition` を読む
- `.pi/skills/yolo/SKILL.md` — すべてのエントリーが `accepted` の後に実行される

### 04: `work` の `base` plan のコミットメッセージを、`consult(...)` から何に変えるか

- なし

### 05: `proofreader` の指示を、`types.json` の役割に合わせてどう直すか

- `.pi/skills/yolo/SKILL.md` — design・plan・close の proofread をスキップする
- `README.md` — adr・design・plan・close の proofread の説明を持つ
- `README.ja.md` — 同じ説明を日本語で記載する
- `scripts/harness/harness.json` — `.pi` をコピーする
- `scripts/harness/index.mjs` — `.pi` 配下をウォークして集める
- `lefthook.yaml` — pre-commit の整形が `md` を処理対象にする
- `package.json` — `format` と `format:check` のエントリーポイントを持つ
- `.pi/extensions/quality-gate/targets.ts` — 整形対象の拡張子に `.md` を持つ
- `.pi/extensions/quality-gate/checks.ts` — 変更されたファイルを整形に渡す
- `.pi/extensions/consult/types.json` — `proofreader` の役割を定める

## External

### 01: sound-notify の設定を、ほかの拡張機能の `settings.json` と同じ形にどう揃えるか

- なし

### 02: `Goal` を複数行にし、どう導出するか

- なし

### 03: `brief` を ADR に統合し、ADR をゼロベースで再構築するか

- なし

### 04: `work` の `base` plan のコミットメッセージを、`consult(...)` から何に変えるか

- なし

### 05: `proofreader` の指示を、`types.json` の役割に合わせてどう直すか

- なし

## `sound-notify-settings`

### ADR & Where

- No: 01
- Why: 入力が sound-notify のコード、テスト、README であり、ほかの plan とファイルを共有しない。何も待たない。
- Where: worktree — コードとテスト

### Goal

- `settings.json` が追跡対象になり、`settings/schema.ts` と `settings/read.ts` が `enabled`、`notifications`、`sounds` の 5種類を読み込み、設定が壊れていても既定値で動作を続行する。
- `config.json` を `settings.json` に改名し、既存の個人設定を手動で移行する。
- 設定ファイルがない、JSON が壊れている、型が異なる、未知のキーがあるの 4条件では、未知のキーを無視し、既定値で動作を続行し、通知しない。
- `README.md` の設定のセクションが `settings.json` のキーの表になり、`config.json` の「コミットしない」の行が削除される。
- `settings.json` の既定値と `README.md` の表が一致する。

### Non-goal

- `NOTIFICATION_TITLE` と `NOTIFICATION_COPY` はコードに残す（01 の案 A で採用した）。
- `README.ja.md` は作成しない（sound-notify にないため）。
- 設定の読み込みは起動時の 1回のままにする（案 B/C は `ctx` を必要とするため採用しなかった）。
- `config.json` の互換読み込みはしない（案 D は名前を 2 つ残すため採用しなかった）。
- 自動移行はしない。
- ほかの拡張機能の設定は変えない。

### Summary

- sound-notify の設定を追跡対象の `settings.json` に移行し、設定の読み込みを `settings/schema.ts` と `settings/read.ts` に分割し、README を表形式にし、テストを追加する。

### Paths

- `.pi/extensions/sound-notify/index.ts`
- `.pi/extensions/sound-notify/index.test.ts`
- `.pi/extensions/sound-notify/README.md`
- `.pi/extensions/sound-notify/settings.json`
- `.pi/extensions/sound-notify/settings/schema.ts`
- `.pi/extensions/sound-notify/settings/schema.test.ts`
- `.pi/extensions/sound-notify/settings/read.ts`
- `.pi/extensions/sound-notify/settings/read.test.ts`

### Boundary

- Plans: なし
- External: なし

## `adr-merge`

### ADR & Where

- No: 03, 05
- Why: 入力が `brief` と `adr` のスキル、参照ファイル、`DEFINITION.md`、05 の `adr` の proofread の一文であり、`brief` と `adr` のスキルを 1 つにまとめる。`adr-scaffold` にエントリーのスケルトンを渡し、`goal-format` と `close-proofread` と 05 の一文を共有するため、`adr-scaffold` に先行する。base の条件: オーナーが文面を確認する。
- Where: base（owner が見る: スキル、README、AGENTS、rules、DEFINITION の文面）

### Goal

- `brief/` がなくなり、`adr/SKILL.md` が意図、ロードマップ、エントリーの分割、エントリーごとのループ、proofread を記載する。
- `adr/SKILL.md` の「Do not decide」を残す。
- `README.md` と `README.ja.md` のスキル数が 6 つになり、`AGENTS.md` と `rules/roadmap.md` のサイクルのエントリーポイントが `adr` になる。
- `DEFINITION.md` から `Unit.brief-skill` が削除され、`grep brief` の結果が `cycles/` の外に残らない。
- `adr/references/tasks.md` に調査と試作のタスクが移り、`adr` の proofread のステージが 05 の一文とパスを含む。

### Non-goal

- 既存の `cycles/` の ADR を新しい手順に書き換えない（03 の `compatibility`）。
- `adr/scripts/scaffold.mjs` は変えない（`adr-scaffold` が担当するため）。
- `goal-format`、`base-commit`、`close-proofread` のファイルは変えない（それぞれの plan が担当するため）。
- `adr/references/tasks.md` に proofread のタスクを記載しない（05 の案 B で採用しなかったため）。
- `types.json` は変えない（05 の `Adopted`）。
- `README` の proofread の説明は変えない（05 の一文はステップの中に記載するため）。
- `yolo` の 3つのスキップ設定は変えない。

### Summary

- `brief` を削除して `adr` に統合し、`adr` を意図から決定までの 2ステージの手順に書き直し、参照ファイルと `DEFINITION.md` を揃える。

### Paths

- `.pi/skills/brief/SKILL.md`
- `.pi/skills/brief/references/tasks.md`
- `.pi/skills/adr/SKILL.md`
- `.pi/skills/adr/references/format.md`
- `.pi/skills/adr/references/tasks.md`
- `README.md`
- `README.ja.md`
- `AGENTS.md`
- `rules/roadmap.md`
- `DEFINITION.md`
- `ROADMAP.md`

### Boundary

- Plans: `adr-scaffold` が `adr/references/format.md` のエントリーのスケルトンを使うため、`adr-merge` が先行する。`goal-format` と `close-proofread` と 05 の一文を共有する（それぞれのファイルに同じ一文を記載する）。05 と 03 の順序は、`adr-merge` が `adr` の proofread を担当し、`goal-format`/`close-proofread` が残りを担当する。3つは並行して実行できる。
- External: なし

## `adr-scaffold`

### ADR & Where

- No: 03
- Why: 入力が `adr/scripts/scaffold.mjs` とそのテストであり、`adr-merge` が決定するエントリーのスケルトンを読むため、`adr-merge` の後に実行される。
- Where: worktree — コードとテスト

### Goal

- 進行中のサイクルの `adr.md` を特定し、次のエントリーのスケルトンを追記する。
- `# ADR NNN` を重複させず、エントリー番号は既存の `## NN:` の次になる。
- 閉じたサイクル（`close.md` がある）では現行の挙動どおりに次のサイクルを作成する。
- `scaffold.test.ts` が、ファイルがない、`01` がある、`02` がある、見出しが破損しているの 4条件を検証する。

### Non-goal

- `adr/SKILL.md`、`adr/references/format.md`、`adr/references/tasks.md` は変えない（`adr-merge` が担当するため）。
- 追記先パスの指定用引数は追加しない（03 の案 A の前提のため）。
- 既存の `cycles/` の `adr.md` を書き換えない。
- 閉じたサイクルに追記しない（現行の挙動どおりに次のサイクルを作成するため）。
- エントリーのスケルトンの形は `adr/references/format.md` に合わせる（`adr-merge` が決定するため）。

### Summary

- `scaffold.mjs` が進行中のサイクルの `adr.md` に次のエントリーのスケルトンを追記し、テストで 4つの場合を固定する。

### Paths

- `.pi/skills/adr/scripts/scaffold.mjs`
- `.pi/skills/adr/scripts/scaffold.test.ts`

### Boundary

- Plans: `adr-merge` が先行する（エントリーのスケルトンの形のため）。
- External: なし

## `goal-format`

### ADR & Where

- No: 02, 05
- Why: 入力が `design` と `plan` のスキル、その `format.md` と `tasks.md`、`work/references/tasks.md` であり、02 の `Goal` と 05 の `design`/`plan` の proofread が同じファイルに記載される。05 の一文を `adr-merge` と `close-proofread` と共有するため、base の条件はオーナーが文面を確認することである。ファイルの完了は待たないが、05 の一文の文面は同じにする。
- Where: base（owner が見る: スキルの文面）

### Goal

- `design.md` の `Goal` が 1行以上の箇条書きになり、各行が検査で失敗として検出できる結果になる。
- `Goal` の導出は `Adopted` の行と `Scope` の `in` の項目ごとに 1行である。
- `plan.md` は各行の結果をテストケース化し、`design` と `plan` のレビューで各行を確認する。
- `Goal` と `Non-goal` の形が揃い、`design`/`plan` の proofread のステージが 05 の一文とパスを含む。
- `plan/references/format.md` の `Added` で追加される plan の proofread の一文が 05 の一文を用いる。

### Non-goal

- 既存の `cycles/` の `design.md` と `plan.md` を書き換えない（02 の `compatibility`）。
- `adr` と `close` の proofread のステージは変えない（`adr-merge` と `close-proofread` が担当するため）。
- `yolo/SKILL.md` は変えない（02 の `Scope` で対象外のため）。
- `design` と `plan` の `tasks.md` に proofread のタスクを記載しない（05 の案 B で採用しなかったため）。
- `types.json` は変えない（05 の `Adopted`）。
- 02 の案 B（表）と案 C（順序の逆転）と案 D（Goal を捨てる）は採用しない。

### Summary

- `Goal` を `Non-goal` と同じ複数行にし、`Adopted` と `Scope.in` の行ごとに導出し、`plan` のテストケースとレビューを各行に対応させ、`design`/`plan` の proofread を一文とパスで構成する。

### Paths

- `.pi/skills/design/SKILL.md`
- `.pi/skills/design/references/format.md`
- `.pi/skills/design/references/tasks.md`
- `.pi/skills/plan/SKILL.md`
- `.pi/skills/plan/references/format.md`
- `.pi/skills/plan/references/tasks.md`
- `.pi/skills/work/references/tasks.md`
- `.pi/skills/work/SKILL.md`

### Boundary

- Plans: 05 の一文を `adr-merge` と `close-proofread` と共有する（それぞれのファイルに同じ一文を記載する）。03 と 05 の順序は、`adr-merge` が `adr` の proofread を担当し、`goal-format`/`close-proofread` が残りを担当する。3つは並行して実行できる。`base-commit` が `work/SKILL.md:46`、`:62`、`:75` を変え、この plan は `:52` を変える。行が違う。`base-commit` は worktree なので、base のこの plan と混ざらない。
- External: なし

## `base-commit`

### ADR & Where

- No: 04
- Why: 入力が `work/SKILL.md` であり、`goal-format` と同じファイルの別の行を変える。行が違うので merge は clean である。worktree なので base の変更と混ざらない。
- Where: worktree — コミットメッセージの文面

### Goal

- `base` plan の slice、fixes、acceptance のコミットメッセージが `base(<plan id>): ...` になる。
- worktree plan の `consult(...)` は変わらない。
- `work/SKILL.md` の 3つのステージが `base` のメッセージを明示する。

### Non-goal

- worktree plan の `consult(...)` は変えない（04 の `Adopted`）。
- `work/references/tasks.md` は変えない（04 の `Scope` の `format: out`）。
- 04 の案 B（`update:`）と案 C（`<plan id>:`）と案 D（`consult(...)` のまま）は採用しない。
- 既存のコミットを書き換えない（04 の `migration: out`）。
- `yolo` の worktree plan のメッセージは変えない。

### Summary

- `work` の `base` plan の slice、fixes、acceptance のコミットメッセージを `base(<plan id>): ...` にし、worktree の `consult(...)` を残す。

### Paths

- `.pi/skills/work/SKILL.md`

### Boundary

- Plans: `goal-format` が `work/SKILL.md:52` を変える。この plan は `:46`、`:62`、`:75` を変える。行が違うので、どちらが先でも merge できる。
- External: なし

## `close-proofread`

### ADR & Where

- No: 05
- Why: 入力が `close/SKILL.md` であり、05 の `close` の proofread のステージを含む。05 の一文を `adr-merge` と `goal-format` と共有するため、base の条件はオーナーが文面を確認することである。ファイルの完了は待たないが、05 の一文の文面は同じにする。
- Where: base（owner が見る: スキルの文面）

### Goal

- `close/SKILL.md` の proofread のステージが、一文とパス（`close.md` と `references/format.md`）で `proofreader` を実行させる。
- 対象ファイルだけを編集し、1ラウンドで終了する。

### Non-goal

- `adr` と `design` と `plan` の proofread のステージは変えない（`adr-merge` と `goal-format` が担当するため）。
- `yolo` の `close` の proofread のスキップは変えない（05 の `Scope` で対象外のため）。
- `README` の proofread の説明は変えない（05 の一文はステップの中に記載するため）。
- `close` の `tasks.md` に proofread のタスクを記載しない（05 の案 B で採用しなかったため）。
- `types.json` は変えない（05 の `Adopted`）。
- 05 の案 A（`tasks.md`）と案 C（役割だけ）と案 D（何も変えない）は採用しない。
- 既存の `cycles/` の `close.md` を書き換えない。

### Summary

- `close/SKILL.md` の proofread のステージを、対象ファイルのみの編集と `references/format.md` の一文とパスによる構成にし、1ラウンドの規則を残す。

### Paths

- `.pi/skills/close/SKILL.md`

### Boundary

- Plans: 05 の一文を `adr-merge` と `goal-format` と共有する（それぞれのファイルに同じ一文を記載する）。03 と 05 の順序は、`adr-merge` が `adr` の proofread を担当し、`goal-format`/`close-proofread` が残りを担当する。3つは並行して実行できる。
- External: なし
