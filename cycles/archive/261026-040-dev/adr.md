# ADR 040

## 01: パッケージ更新を、どんな形のスキルにするか

### Context

- このリポジトリに、パッケージ更新の手順を持つスキルは無い。
- 更新は今、owner の記憶と場当たりのコマンドで行われている。
- 直接依存のうち 5 本が範囲外にある（oxfmt 0.63.0→0.74.0、@types/node 25.9.9→26.6.5、lefthook 1.13.6→2.2.2、typescript 6.0.3→7.0.2、vitest 4.1.12→5.0.5）。
- owner の持っている流れは、`pnpm update`、`pnpm outdated`、範囲外のパッケージごとの並列リサーチ、レポート、owner の選択、1 本ずつの適用と検査、`pnpm audit`、そして「想定どおり」で終わる、というもの。
- 破壊的変更の置き場はパッケージごとに違う（リポジトリの `CHANGELOG.md`、GitHub の Releases、発表記事、持たない物）。
- スキルは採用先の製品でも走る必要がある（`.pi` は `harness.json` の `copy` で丸ごと写る）。
- 既存のスキルは 8 つあり、`README.md` と `README.ja.md` はその数を書いている。

### Scope

- 変更:
  - behaviour: in — スキルが 1 つ増える。製品の振る舞いは変えず、依存更新の後に既存の検査が緑であることを条件にする。CI での自動更新（renovate や dependabot のようなもの）は入れない。
  - refactor: in — 破壊的変更で赤くなった所だけ直す。ついでの整理はしない。スキルがスクリプトを持たないので、そのテストも無い。既存の 8 スキルの手順は変えない（一覧に 1 つ足すだけ）。
  - dependency: in — 範囲外の 5 本。どれを対象にするかはレポートの後に owner が決める。`pnpm-workspace.yaml` の古い行（pi 1.3.0 の `minimumReleaseAgeExclude` 7 行、`allowBuilds.esbuild`）も整理する。`pnpm audit --fix` の方式は、常用の設定として固定しない。
  - naming: in — スキル名は `upgrade`、Unit 名は `upgrade-skill`（新規のみ）。既存の改名はしない。
  - format: in — `SKILL.md` と `references/` を既存スキルの形に揃える。`DEFINITION.md` の `Users can do` に 1 行。
  - prose: in — `README.md` と `README.ja.md` のスキル一覧（8→9）、`DEFINITION.md` の 1 行、スキルの文面。
- 品質:
  - speed: out — このサイクルでは測らない（再訪: vitest 5 に上げた後にテストが目に見えて遅くなった時）。
  - security: in — `pnpm audit` を手順に入れる。目標は「線より上は fix するか理由付きで残す」。
  - compatibility: in — 破壊的変更の吸収が主題。`.pi` が写る採用先でも壊れないこと。
  - errors: out — 製品の失敗の道は変えない。`outdated` の終了コード 1 はスキルの手順が扱う。
- 運用:
  - deploy: out — `Stack` の `Deploy` は「なし」。
  - migration: out — データ移行は無い。lockfile の更新は `dependency`。
  - logs and monitoring: out — 記録の仕組みは変えない。レポートはチャットに出すだけ。

### Research & Trial

- 範囲外の判定は `latest !== wanted` で足りる（`pnpm outdated --json` は 12.15.0 で `current` / `wanted` / `latest` / `dependencyType` を返す。semver のメジャー比較は要らない。oxfmt 0.63→0.74 のような 0.x のマイナーも、範囲外として同じ扱いになる）。
- `pnpm outdated` は見つけた時に終了コード 1 を返す（公式文書には書かれていない。コミット a64b725 と 12.15.0 の実測）。
- 破壊的変更の置き場: oxfmt と lefthook はリポジトリの `CHANGELOG.md`、vitest は GitHub の Releases と移行ガイド、typescript は発表記事と `typescript-go/CHANGES.md`、@types/node は `CHANGELOG.md` を持たない（git の差分だけ）。
- 並列リサーチは `research` サブエージェントで走り、書き込まない（worktree は要らない）。
- スクリプトで判定を固定する道（B）は、判定が 1 行の規則で足りるため、いまは置かない。
- `npm-check-updates --doctor`（C）は 1 依存ずつ install→test と、失敗時の `package.json` / lockfile の復元を実装している（v23.1.1、pnpm 対応）。ただし pnpm 12.15.0 での動作は未検証で、`--doctorTest` は 1 コマンドである。

### Decision

- Status: **accepted**
- Adopted:
  - **A**: `upgrade` という散文だけのスキル（`.pi/skills/upgrade/`）。`SKILL.md`、`references/report.md`（レポートの形）、`references/tasks.md`（並列リサーチのタスク文）。スクリプトを置かない。停止点は 2 つ（レポートの後の選択、audit の残件の判断）。
- Options:
  - **B**: 判定と候補一覧のスクリプト（`candidates.mjs` + テスト）を置く。買うもの: 判定とレポートの骨が毎回同じになる。コスト: スクリプトとテストが 1 本ずつ増え、pnpm の JSON の形に依存する。落ちる理由: 判定は `latest !== wanted` の 1 行で足り、増える分だけ利得が小さい。
  - **C**: 適用ステージを `npm-check-updates --doctor` に任せる。買うもの: 1 依存ずつの install→test と復元が実装済み。コスト: 追加の依存が要る。落ちる理由: pnpm 12 での動作が未検証で、`--doctorTest` が 1 コマンドのため採用先に複合スクリプトを要求し、最初に一括で上げるので「1 本ずつ」の順序も崩れる。
  - **D**: 調査と適用を 2 つのスキルに分ける。買うもの: 片方だけ呼べる。落ちる理由: owner の意図は「1 つのスキル」。

### Definition

- `Unit.upgrade-skill`(added): エージェントが、依存パッケージをアップグレードし、監査まで終えられる。
- `Unit.lefthook-gate`(kept): commit と push の前に検査を通す main function は同じ。依存のバージョンが動くのは、gate が呼ぶ検査の中身。
- `Unit.type-check`(kept): 型の指摘を受け取る main function は同じ。tsc のバージョンが動くのはルート。
- `Unit.test-run`(kept): 壊れた振る舞いの指摘を受け取る main function は同じ。vitest のバージョンが動くのはルート。
- `Unit.format-check`(kept): コードの形を揃える main function は同じ。oxfmt のバージョンが動くのはルート。
- `Unit.lint-check`(kept): リンターの指摘を受け取る main function は同じ。oxlint は今回動かない見込みで、動いてもバージョンだけ。
- `Unit.usage-readme`(kept): 使い方を読む main function は同じ。スキルの数が 8 から 9 に変わるのは内容。
- `Unit.harness-copy`(kept): ハーネスを取り込み、戻せる main function は同じ。`.pi` 丸ごとの写しが新しいスキルも運ぶ。
- `Stack.Checks`(kept): 5 つの役割（tsc、vitest、oxlint、oxfmt、lefthook）は動かない。動くのはバージョンだけ。
- `Stack.Agent.Host`(kept): ホストは同じ。バージョンだけが動きうる。
- `Who.agent`(kept): Does と Needs は変わらない（判断は owner に来て、エージェントは 1 人で進む）。

## 02: 対象バージョンをどう選び、`minimumReleaseAgeExclude` をどう保つか

### Context

- `pnpm-workspace.yaml` に `minimumReleaseAge: 1440` があり、公開から 24 時間未満のバージョンは解決されない。
- `minimumReleaseAgeExclude` は `@earendil-works/pi-*@1.3.0` を 7 行並べるが、入っているのは 1.4.0 で、いまは何も除外していない。
- owner は公開直後のバージョンを踏みたくない。
- pnpm 12 では `--config.minimumReleaseAge=0` が黙って無視される報告があり、12.15.0 でフィルタが効くことは実測していない。
- 今の 5 本の `latest` はどれも 1440 分より古い（oxfmt 153.1 時間、@types/node 391.8 時間、lefthook 304.8 時間、typescript 2626.7 時間、vitest 252.1 時間）。

### Scope

- 変更:
  - behaviour: in — 対象バージョンの選び方と、適用後の確かめ方を手順に置く。
  - dependency: in — `minimumReleaseAgeExclude` の古い 7 行と `allowBuilds.esbuild` を落とす。
  - format: in — `pnpm-workspace.yaml` の 2 か所だけ。
  - refactor: out — コードは変えない。判定は手順の文面。
  - naming: out — 名前は動かない。
  - prose: out — 文面はスキルの中で書く。README は変えない。
- 品質:
  - compatibility: in — 若いバージョンを踏まないことが、壊れたバージョンを踏まないための最初の守り。
  - security: in — 供給網の事故を減らすのが `minimumReleaseAge` の目的。
  - speed: out — 測らない。
  - errors: out — 製品の失敗の道は変えない。
- 運用:
  - deploy: out — `Deploy` は「なし」。
  - migration: out — 移行は無い。
  - logs and monitoring: out — 記録は変えない。

### Research & Trial

- `pnpm view <pkg> time --json` はバージョンごとの公開時刻を返す（oxfmt で 78 バージョンを確認）。追加の道具は要らない。
- `minimumReleaseAge` は推移依存を含む解決に効く（公式）。`outdated` の `latest` もフィルタ後の値（PR #10030、v11.19 の修正）だが、12.15.0 では未実測。
- `minimumReleaseAgeExclude` は素名、glob、正確なバージョン（`pkg@1.0.0`、`||` で複数）を取る。範囲（`^` など）は受け付けない。
- `pnpm audit --fix=update` は、自分で修正バージョンを `minimumReleaseAgeExclude` に書き足してから解決する。
- 「常に 1 つ前」は年齢を保証しない（同じ日に 2 つ出れば、1 つ前も公開直後になる）。

### Decision

- Status: **accepted**
- Adopted:
  - **E**: 条件付き。`minimumReleaseAge` の分数は `pnpm-workspace.yaml` から読む（無ければ 1440）。対象バージョンは「公開からその分数以上経った安定バージョンのうち、最新」。適用は `pnpm update --latest <pkg>`。適用後に解決されたバージョンを読み、対象バージョンと違えば止めて報告する。`minimumReleaseAgeExclude` は、いま入っているバージョンを指す行だけ残す（バージョンの書き換えはしない）。`audit --fix=update` が書いた行は、そのバージョンが入っている間は残す。
- Options:
  - **F**: 常に最新安定バージョンの 1 つ前を取る。買うもの: 時刻を読まなくてよい。落ちる理由: 年齢を保証しない（同じ日に 2 つ出れば、1 つ前も公開直後）ので、基準が危険と対応しない。
  - **G**: pnpm の解決に任せ、適用後の検査だけを置く。買うもの: 選ぶ前の計算が要らない。落ちる理由: 対象バージョンがレポートとリサーチの前に決まらず、適用してから戻す手順になる。
  - **H**: `pnpm add <pkg>@<バージョン>` で明示的に入れる。買うもの: 入れるバージョンが確実。落ちる理由: `package.json` の caret の形を保てない。

### Definition

- `Unit.upgrade-skill`(kept): main function は同じ。対象バージョンの選び方と exclude の保ち方はルート。
- `Stack.Ground.Package manager`(kept): pnpm の役割は同じ。設定の書き方が増えるのはルート。

## 03: audit の合否をどこで引き、fix をどこまで使うか

### Context

- 手順の最後は `pnpm audit`。owner は「レベルを指定する」「fix できるなら直して、もう 1 回 audit を回す」「想定どおりなら終わる」と考えている。
- pnpm 12 の fix には 2 方式があり、既定は `override`（`pnpm-workspace.yaml` に overrides を書き、適用には別途 `pnpm install` が要る）。
- `--fix=update` は lockfile を解き直し、`package.json` の範囲も書き戻す。
- `--fix` と `--ignore` は併用できない。
- レジストリのエラーは throw し、脆弱性の終了コード 1 とは経路が違う。
- このリポジトリの `pnpm-workspace.yaml` に overrides はまだ無い。

### Scope

- 変更:
  - behaviour: in — 手順の最後のステージ（audit、fix、再 audit）。
  - dependency: in — fix が lockfile、`package.json`、`pnpm-workspace.yaml` に書く。
  - format: in — `pnpm-workspace.yaml` に `overrides` が増えうる。
  - prose: in — スキルの audit のステージの文面。
  - refactor: out — コードは変えない。
  - naming: out — 名前は動かない。
- 品質:
  - security: in — これが audit の目的。線より上は直すか、理由付きで残す。
  - compatibility: in — fix がバージョンを動かすので、fix の後にもう一度検査を通す。
  - speed: out — 測らない。
  - errors: out — 製品の失敗の道は変えない。
- 運用:
  - deploy: out — `Deploy` は「なし」。
  - migration: out — 移行は無い。
  - logs and monitoring: out — 記録は変えない。

### Research & Trial

- `--audit-level` の既定は `low`。レベル以上の advisory が ignore の除去後に残ると、終了コード 1（公式）。
- `--fix` の既定は `override` で、`pnpm-workspace.yaml` の `overrides` に `pkgs@脆弱範囲 → ^最小修正バージョン` を書く。適用には `pnpm install` が要る。
- `--fix=update` は lockfile を解き直し、`package.json` の範囲を書き戻し、先に `minimumReleaseAgeExclude` を足す。
- `--fix` と `--ignore` / `--ignore-unfixable` は `ERR_PNPM_AUDIT_FIX_WITH_IGNORE` で併用できない。
- `--ignore-registry-errors` が無い時のレジストリの失敗は例外で、脆弱性の終了コード 1 とは経路が違う。
- fix が途中で失敗した時、ファイルがどこまで進んで残るかは公式に定義が無い。

### Decision

- Status: **accepted**
- Adopted:
  - **I**: `pnpm audit --audit-level low` で走らせる（pnpm の既定と同じ。線を上げも下げもしない）。残件があれば `pnpm audit --fix=update` を 1 回だけ試し、そのあと audit をもう 1 回走らせる。`override` は owner の OK がある時だけ、最後の選択肢にする。`--ignore` と `--ignore-unfixable` は owner の OK がある時だけ使い、fix とは併用しない。fix の後は、もう一度検査を通してから終わる。終わりは、残件をレポートに出し、owner が「想定どおり」と認めた時。
- Options:
  - **J**: `--fix`（既定の override）をそのまま使う。買うもの: 1 コマンドで直る。落ちる理由: overrides が `pnpm-workspace.yaml` に溜まり、依存のバージョンを固定して将来の更新を止める。
  - **K**: 線を `high` などに上げる。買うもの: 赤が減る。落ちる理由: 線を上げても危険は減らず、「想定どおり」の基準を動かすだけ。
  - **L**: `--ignore-unfixable` を常用する。買うもの: 直せない物で止まらない。落ちる理由: 直せない脆弱性を黙って消し、記録からも消える。
  - **M**: `--interactive` で選ぶ。買うもの: 1 件ずつ判断できる。落ちる理由: 選択が対話に閉じ、チャットのレポートに残らない。

### Definition

- `Unit.upgrade-skill`(kept): 監査まで終える main function は同じ。合否の線と fix の使い方はルート。
