# ハーネス付きスターター

[![Pullfrog](https://github.com/poko8nada/pj-starter-pi-v3/actions/workflows/pullfrog.yml/badge.svg)](https://github.com/poko8nada/pj-starter-pi-v3/actions/workflows/pullfrog.yml) [![TypeScript](https://img.shields.io/badge/TypeScript-7.0.2-3178C6)](https://www.typescriptlang.org/)

プロジェクトと、その**エージェント用ハーネス**が最初から揃っているスターターである。このスターターには、cloneした時点で、検査・commitゲート・エージェントの規則・サイクルの仕組みが入っている。

English: [README.md](README.md)

## 入っているもの

- **検査** — `oxlint` / `oxfmt` / `tsc` / `vitest` と、それらを実行する `pnpm` スクリプト
- **ゲート** — commit時とpush時に検査する `lefthook` と、各ターンで変更した分だけを検査する `quality-gate`
- **エージェントの規則** — `AGENTS.md`（毎セッションで読み込まれる）
- **サイクルの仕組み** — `.pi/skills/` にある6つのスキル（`adr` / `design` / `plan` / `work` / `close` / `yolo`）
- **パッケージ** — `.pi/skills/` の `upgrade`。サイクルとは別に単独で動作する
- **拡張** — `consult`（4つのツールを持つ1つの拡張）、`quality-gate`（各ターンでの変更分を検査する）、`sound-notify`（piがユーザー待ちのときに音とcmux通知で知らせる）、[`thinking-scrub`](.pi/extensions/thinking-scrub/README.ja.md)（ループするthinkingを生成中に止めて取り除き、次のターンに持ち越さないようにする）、`context-precompact`（標準コンパクションを待たず、閾値に達する前に裏で準備し、境界で適用する。`/precompact`、`/precompact now`、`/precompact on|off`、status line、設定）（場所: `.pi/extensions/`）
  - `consult_run` — ロールと行き先を指定して、サブエージェントの `pi` を1体だけ起動する。サブエージェントにはこの会話を見せない
  - `consult_subagents` — このセッションのサブエージェントを一覧表示し、1体を停止する。記録を読み込むため、reloadをまたいでもこのセッションのサブエージェントが表示される
  - `consult_worktree` — unitのワークツリーを作成・一覧表示・削除する。明示的に削除しない限り残る。`remove` はマージ済みのブランチも一緒に削除する（未マージのブランチは残す）
  - `consult_commit` — サブエージェントがワークツリーに残した仕事をコミットする。メインエージェントのブランチに取り込むには `git merge --no-ff consult/<unit-id>` を自分で実行する
  - 保存場所: `/tmp/pi-consult/<project>-<stamp>/<unit-id>/wt`、ブランチ `consult/<unit-id>`、baseの既定値は `HEAD`
- **CI** — `.github/workflows/pullfrog.yml`（dispatchでエージェントを実行する）
- **サイクルの記録** — `cycles/`

## 使い始める

```bash
pnpm install
```

1. `pnpm product:ready` で cloneを自分のものにする（一度きり） — `cycles/` を削除し、`ROADMAP.md`、`DEFINITION.md` の `Product` と `What`、2つのREADMEをテンプレートに差し替える。`test`・`test:run`・`test:related` から ` --config vitest.starter.config.ts` を外し、`vitest.starter.config.ts` を削除する。プロダクトの `test` は `vitest.config.ts` を使い、ハーネスのパスを `exclude` で除外する。スターターの `test` は `vitest.starter.config.ts` を使うため、すべてのテストが対象になる。`--run` がなければ変更内容の表示だけになる。1種類だけを対象にするなら `--only <label>` を追加する
2. `.pi/extensions/consult/types.json` がリポジトリにあるため、自分のモデルに変更して使う
3. `pi` を起動する。スキルは `.pi/skills/` で見つかる

## 検査

| コマンド                            | 内容                                |
| ----------------------------------- | ----------------------------------- |
| `pnpm test:run`                     | テストを1回実行する                 |
| `pnpm lint`                         | `oxlint`（警告があれば失敗する）    |
| `pnpm typecheck`                    | `node scripts/checks/typecheck.mjs` |
| `pnpm format` / `pnpm format:check` | 整形する / 確認する                 |

- **commit時** — 変更分に format / lint / `typecheck:staged` / `test:related` / `ja-check` を実行する
- **日本語の禁止語** — `ja-check` の禁止語は `scripts/checks/ja-check.json` の `error` と `warn` で変更する
- **push時** — typecheck（ルートとハーネス）/ test を実行する
- **エージェントのターンごと** — 変更があった場合だけである。修正ステージでは `lint:fix` → `format` を、検証ステージでは `lint` → `typecheck:staged` を、変更分に適用する。
- **ハーネスのテスト** — starter configでは実行され（`pnpm test:run` は `vitest.starter.config.ts` を使う）、product config（`vitest.config.ts` がハーネスのパスを除外する）では除外される

## ハーネス

エージェント用ハーネスは `scripts/harness/` で受け渡す:

- `pnpm harness:pull` で `copy` にあげたものをスターターから取り込み、`pnpm harness:push` で `push` にあげたものを戻す。`--run` がなければ変更内容の表示だけになる。ファイルを削除することはない。
- 一覧は `scripts/harness/harness.json` にあり、同ファイルは `starter`、`copy`、`push` の3キーを持つ。`starter` は相手方（スターター）のパス（例 `"~/..."`）、`copy` はpull用の一覧、`push` はpush用の一覧である。項目にはパスとglobを記述できる（例 `scripts/harness/*.mjs`）。
- `package.json` は一覧の外にあるので、pull後に `scripts` と `devDependencies` を目視で確認する。
- コピー元にない項目は `missing (<件数>):` として1件1行で出力し、`--run` の有無にかかわらず終了コードは1になる。`--run` ではコピーできるものはコピーする。

## サイクル

1サイクル = ADR → 設計 → プラン → プランの実行 → 閉じる。各ステージはスキルが担当する。**次のステージを呼ぶのはスキルの `description`** であり、前のステージが次のステージを呼ぶことはない。次のステージは `description` から探す。

```
adr          オーナーがサイクルを始めるときや定義・サイクルへの指摘を上げたとき、意図・ロードマップの項目・エントリーを詰め、`cycles/<YYMMDD>-<NNN>-<slug>/adr.md` を書き、サイクルが `DEFINITION.md` に何をするかのオーナーの決定を残す
design       サイクルのエントリーが決まり作業の切り分けが必要なとき、各エントリーが触るものを調べ、切り方と順序を決め、各プランをどこで走らせるか提案し、`cycles/<YYMMDD>-<NNN>-<slug>/design.md` を書く。オーナーが答える
plan         設計が合意されそのプランの1つを作業にするとき — 切り分けが定まりプランをサブエージェントに渡せる状態になった後、`cycles/<YYMMDD>-<NNN>-<slug>/plan/<plan id>.md` を書く。ファイル・スライス・型・手順・検証を持つ
work         プランが合意されその作業を実行するとき — プランの md が書かれオーナーが読んだ後、スライス・レビュー・受け入れ・マージを走らせ、記録をプランの md に残す
close        サイクルのすべてのプランが終わったとき（完了またはオーナーが落とした）、プランが残したものを集め、オーナーとトリアージし、Unit ごとに関数を確認するかをオーナーに聞く
yolo         オーナーが確認なしでサイクルを通すよう指示したとき、ADR のすべてのエントリーが受け入れられた後いつでも、立っている場所からサイクルのステージをオーナーの確認なしに歩き、close のトリアージで止まり、`Added` のオーナー確認を通過させる
```

記録は `cycles/<YYMMDD-NNN-<slug>>/` に残る: `adr.md` / `design.md` / `plan/<plan id>.md` / `close.md`。サイクルの状態は git が持つ。ADRの `Status` は決定の状態であり、planの `Commit` / `Stopped` は作業の記録であって、サイクルの状態を表すものではない。

製品の定義を持つのは `DEFINITION.md` である。その背景にある議論を担うのはADRであり、ADRはどのステージからでも開くことができる。サイクルは `adr` から始まり、オーナーが論点を挙げたときはどのステージからでもADRのentryを追加できる。変更時はどのサイクルでもADRのentryを開き、そのentryが `DEFINITION.md` のどの部分に関わるかと、各部分が変更されるかそのまま残るかを書く。

## コントリビュート

commit時とpush時は `lefthook` が検査する。commit時は変更分に format・lint・`typecheck:staged`・`test:related`・`ja-check` を実行し、push時は typecheck（ルートとハーネス）と test を実行する。`ja-check` の禁止語は `scripts/checks/ja-check.json` の `error` と `warn` で変更する。

commitの前に、次のコマンドを実行しておく:

```bash
pnpm lint
pnpm typecheck
pnpm test:run
```

## ライセンス

UNLICENSED
