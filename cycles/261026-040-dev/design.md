# DESIGN 040

## Affected

### 01: パッケージ更新を、どんな形のスキルにするか

- `scripts/harness/harness.json` — `copy` に `.pi` が入っているので、新しいスキルも採用先へ写る。
- `scripts/harness/index.mjs` — `copy` 一覧の内側を集めて写すので、`upgrade` のディレクトリも歩く。
- `.pi/skills/design/SKILL.md` — `DEFINITION.md` を製品の絵として読む。
- `.pi/skills/propose/SKILL.md` — `DEFINITION.md` の各行を、不足と余剰の判定に読む。
- `.pi/skills/adr/SKILL.md` — `DEFINITION.md` の関係箇所を entry に書く。
- `.pi/skills/close/SKILL.md` — `DEFINITION.md` を動かす残余を仕分け、Unit を検証する。
- `.pi/skills/yolo/SKILL.md` — 定義と ADR を読む流れを持つ。
- `lefthook.yaml` — 変更分に format を走らせ、`md` も対象に含む。
- `.pi/extensions/quality-gate/targets.ts` — `.md` を整形の対象に含める。
- `.pi/extensions/quality-gate/checks.ts` — 変更分に修正と検証を走らせる。
- `definition/rules.md` — Unit の可否と命名を定める。
- `definition/format.md` — `Users can do` の書式を定める。

### 02: 対象バージョンをどう選び、`minimumReleaseAgeExclude` をどう保つか

- `.pi/extensions/consult/run/run.ts` — lockfile があれば `pnpm install --frozen-lockfile` を返し、worktree の準備で走らせる。
- `.pi/extensions/consult/run/subagent.ts` — worktree を決めた後に、その install を呼ぶ。
- `.pi/skills/work/SKILL.md` — マージの後、base で lockfile に従って `pnpm install` を走らせる。
- `.pi/extensions/consult/README.md` — 新しい worktree で `pnpm install --frozen-lockfile` が走ると書く。
- `README.md` — 導入の手順に `pnpm install` がある。
- `README.ja.md` — 導入の手順に `pnpm install` がある。

### 03: audit の合否をどこで引き、fix をどこまで使うか

- なし

## External

### 01: パッケージ更新を、どんな形のスキルにするか

- ホストのスキル発見の契約 — frontmatter の `name:` と `description:` を読み、`.pi/skills/<名>/SKILL.md` を探す。この変更は、その形でスキルを 1 つ足す。
- 採用先のホスト — 同じ契約でスキルを見つける。この変更は、`.pi` の写しで新しいスキルを採用先に届ける。

### 02: 対象バージョンをどう選び、`minimumReleaseAgeExclude` をどう保つか

- npm レジストリ — `GET https://registry.npmjs.org/<pkg>` の `time` を公開時刻として持つ。この変更は、`pnpm view <pkg> time --json` でそれを読む。
- pnpm の設定契約 — `minimumReleaseAge` は分の数値、`minimumReleaseAgeExclude` は文字列配列（素名、glob、正確なバージョン。範囲は不可）。この変更は、分数をそこから読み、exclude の行を保つ。
- pnpm 12.15.0 の CLI 契約 — `outdated --json` は `current` / `wanted` / `latest` を返し、見つけた時は終了コード 1。`update --latest` は範囲を書き換え、解決されたバージョンを読める。`audit --fix=update` は exclude を書き足す。この変更は、その 3 つに載る。

### 03: audit の合否をどこで引き、fix をどこまで使うか

- npm の security advisories の bulk endpoint — `pnpm audit` が `/-/npm/v1/security/advisories/bulk` に、パッケージ名とバージョンの対応表を POST する。この変更は、その答えをレポートの材料にする。
- advisory の形 — `id`、`url`、`severity`、`vulnerable_versions`、`patched_versions`（`null` は修正なし）。この変更は、GHSA の識別子と、修正があるかを読む。
- pnpm audit の終了コードと例外 — `--audit-level` の既定は `low`、残件があれば終了コード 1、レジストリの失敗は例外。この変更は、その 2 つを区別して報告する。

## `upgrade-run`

### ADR & Where

- No: 01, 02, 03
- Why: 入力は `package.json`、`pnpm-lock.yaml`、`pnpm-workspace.yaml` で、もう 1 つの plan と共有しない。owner がレポートを見て選び、監査の残件を見て終わりを決めるので、base に置く。待つ相手は無い。
- Where: base

### Summary

- `pnpm update` と `pnpm outdated` で更新を拾い、範囲外はパッケージごとに並列で調べてレポートを出す（停止点 1）。
- owner が選んだパッケージを 1 つずつ当て、その都度検査を通し、解決されたバージョンが対象と違えば止める。
- `minimumReleaseAgeExclude` は、いま入っているバージョンを指す行だけ残し、古い 2 項目を落とす。
- 終わりに audit と `--fix=update` と再 audit を回し、fix の後は検査をもう一度通す。`override` と `--ignore` は owner の OK がある時だけ使い、owner が「想定どおり」と認めて終わる（停止点 2）。

### Paths

- `package.json`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`

### Boundary

- Plans: なし
- External:
  - npm レジストリ: 公開時刻を読み、対象バージョンを決める。
    - Contract: `time` はバージョン名から ISO 時刻への対応。
  - pnpm の設定契約: 分数を読み、exclude の行を保つ。
    - Contract: `minimumReleaseAge` は分の数値、`minimumReleaseAgeExclude` は正確なバージョンまで取る。
  - pnpm 12.15.0 の CLI 契約: 更新を拾い、適用し、解決版を読む。
    - Contract: `outdated --json` は `current` / `wanted` / `latest` を返し、見つけた時は終了コード 1。
  - npm の security advisories の bulk endpoint: audit が照会する。
    - Contract: 脆弱性は終了コード 1、レジストリの失敗は例外。
  - advisory の形: 残件を読む。
    - Contract: `patched_versions` が `null` なら修正なし。
  - pnpm audit の終了コードと例外: 2 つを区別して報告する。
    - Contract: `--audit-level` の既定は `low`。

## `upgrade-skill`

### ADR & Where

- No: 01, 02, 03
- Why: 入力は `upgrade-run` が通した記録なので、それが終わるまで待つ。触るファイルは `upgrade-run` と重ならず、owner が文面を読むので base に置く。
- Where: base（owner が文面を読む）

### Summary

- `.pi/skills/upgrade/` に、散文だけのスキルを置く（`SKILL.md` と 2 つの references）。
- レポートの形と、並列リサーチに渡すタスク文を、run で通した形に合わせて書く。
- `README.md` と `README.ja.md` の一覧に 1 つ足し、`DEFINITION.md` に `Unit.upgrade-skill` の 1 行を足す。

### Paths

- `.pi/skills/upgrade/SKILL.md`
- `.pi/skills/upgrade/references/report.md`
- `.pi/skills/upgrade/references/tasks.md`
- `README.md`
- `README.ja.md`
- `DEFINITION.md`

### Boundary

- Plans:
  - `upgrade-run`: 通して確かめた手順を、この plan が文面にする（先に終わる）。
- External:
  - ホストのスキル発見の契約: 新しいスキルが読み込まれる。
    - Contract: frontmatter の `name:` と `description:`、置き場は `.pi/skills/<名>/SKILL.md`。
  - 採用先のホスト: 採用先でも同じスキルが見つかる。
    - Contract: `.pi` が `copy` で丸ごと写る。
