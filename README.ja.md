# ハーネス付きスターター

[![Pullfrog](https://github.com/poko8nada/pj-starter-pi-v3/actions/workflows/pullfrog.yml/badge.svg)](https://github.com/poko8nada/pj-starter-pi-v3/actions/workflows/pullfrog.yml) [![TypeScript](https://img.shields.io/badge/TypeScript-7.0.2-3178C6)](https://www.typescriptlang.org/)

プロジェクトと、その**エージェント用ハーネス**が最初から揃っているスターターである。clone した時点で、検査・commit ゲート・エージェントの規則・サイクルの仕組みが入っている。

English: [README.md](README.md)

## 入っているもの

- **検査** — `oxlint` / `oxfmt` / `tsc` / `vitest` と、それを走らせる `pnpm` スクリプト
- **ゲート** — commit と push で検査を通す `lefthook` と、ターンごとにそのターンで変えた分だけを検査する `quality-gate`
- **エージェントの規則** — `AGENTS.md`（毎セッション読まれる）
- **サイクルの仕組み** — `.pi/skills/` の 6 つ（`adr` / `design` / `plan` / `work` / `close` / `yolo`）
- **パッケージ** — `.pi/skills/` の `upgrade`。サイクルに乗せず、単独で走る
- **拡張** — `consult`（4 つの道具を持つ 1 つの拡張）、`quality-gate`（ターンで変えた分を検査する）、`sound-notify`（pi が待っているときに音と cmux 通知を出す）、[`thinking-scrub`](.pi/extensions/thinking-scrub/README.ja.md)（ループした thinking を生成中に止めて取り除き、次のターンに持ち越さない）、`context-precompact`（標準コンパクションを待たず、閾値の手前で裏に準備して境界で差し込む。`/precompact`、`/precompact now`、`/precompact on|off`、status line、設定）（`.pi/extensions/`）
  - `consult_run` — ロールと行き先を指して、サブエージェントの `pi` を 1 体だけ走らせる。この会話は見せない
  - `consult_subagents` — このセッションのサブエージェントを一覧し、1 体止める。記録を読むので reload をまたいでもこのセッションのサブエージェントは出る
  - `consult_worktree` — unit の ワークツリーを作り、一覧し、消す。明示しない限り残る。`remove` は取り込み済みのブランチも一緒に消す（未マージは残す）
  - `consult_commit` — サブエージェントが ワークツリーに残した仕事をコミットする。メインエージェントのブランチへ取り込むには `git merge --no-ff consult/<unit-id>` を自分で打つ
  - 保存場所: `/tmp/pi-consult/<project>-<stamp>/<unit-id>/wt`、ブランチ `consult/<unit-id>`、base の既定は `HEAD`
- **CI** — `.github/workflows/pullfrog.yml`（dispatch で agent を走らせる）
- **サイクルの記録** — `cycles/`

## 使い始める

```bash
pnpm install
```

1. `pnpm product:ready` で clone を自分のものにする（一度きり） — `cycles/` を消し、`ROADMAP.md`、`DEFINITION.md` の `Product` と `What`、2 枚の README をテンプレートに差し替える。`test`・`test:run`・`test:related` から ` --config vitest.starter.config.ts` を外し、`vitest.starter.config.ts` を消す。プロダクトの `test` は `vitest.config.ts` を使い、ハーネスのパスを `exclude` で外す。スターターの `test` は `vitest.starter.config.ts` を使い、すべてのテストが対象になる。`--run` がなければ表示だけである。1種だけなら `--only <label>` を足す
2. `.pi/extensions/consult/types.json` がリポジトリにある。自分のモデルに変えて使う
3. `pi` を起動する。スキルは `.pi/skills/` から見つかる

## 検査

| コマンド                            | 何をするか                          |
| ----------------------------------- | ----------------------------------- |
| `pnpm test:run`                     | テストを 1 回走らせる               |
| `pnpm lint`                         | `oxlint`（警告も落とす）            |
| `pnpm typecheck`                    | `node scripts/checks/typecheck.mjs` |
| `pnpm format` / `pnpm format:check` | 整形する / 確かめる                 |

- **commit 時** — 変えた分に format / lint / `typecheck:staged` / `test:related` / `ja-check`
- **日本語の禁止語** — `ja-check` の禁止語は `scripts/checks/ja-check.json` の `error` と `warn` で変える
- **push 時** — typecheck（ルートとハーネス）/ test
- **エージェントのターンごと** — そのターンで変えたものがあるときだけである。修正のステージは `lint:fix` → `format`、検証のステージは `lint` → `typecheck:staged` を、変えたものに適用する。
- **ハーネスのテスト** — starter config で回り（`pnpm test:run` は `vitest.starter.config.ts` を使う）、product config（`vitest.config.ts` がハーネスのパスを外す）では外れる

## ハーネス

エージェント用ハーネスは `scripts/harness/` で運ぶ:

- `pnpm harness:pull` で `copy` のものをスターターから取り込み、`pnpm harness:push` で `push` のものを戻す。`--run` がなければ表示だけである。消すことはない。
- 一覧は `scripts/harness/harness.json` で、`starter`、`copy`、`push` の 3 キーを持つ。`starter` は相手のパス（例 `"~/..."`）、`copy` は pull 用、`push` は push 用。項目にはパスと glob を書ける（例 `scripts/harness/*.mjs`）。
- `package.json` は一覧の外にあるので、pull の後に `scripts` と `devDependencies` を手で見る。
- コピー元にない項目は `missing (<件数>):` に 1 件 1 行で出し、`--run` の有無にかかわらず終了コード 1 になる。`--run` では写せるものは写す。

## サイクル

1 サイクル = ADR → 設計 → プラン → その実行 → 閉じる。各ステージはスキルが担う。**次のステージを呼ぶのはスキルの `description`** で、前のステージが次のステージを呼ぶことはない。次のステージは `description` で見つかる。

```
adr          オーナーがサイクルを始めるときや定義・サイクルへの指摘を上げたとき、意図・ロードマップの項目・エントリーを詰め、`cycles/<YYMMDD>-<NNN>-<slug>/adr.md` を書き、サイクルが `DEFINITION.md` に何をするかのオーナーの決定を残す
design       サイクルのエントリーが決まり作業の切り分けが必要なとき、各エントリーが触るものを調べ、切り方と順序を決め、各プランをどこで走らせるか提案し、`cycles/<YYMMDD>-<NNN>-<slug>/design.md` を書く。オーナーが答える
plan         設計が合意されそのプランの1つを作業にするとき — 切り分けが定まりプランをサブエージェントに渡せる状態になった後、`cycles/<YYMMDD>-<NNN>-<slug>/plan/<plan id>.md` を書く。ファイル・スライス・型・手順・検証を持つ
work         プランが合意されその作業を実行するとき — プランの md が書かれオーナーが読んだ後、スライス・レビュー・受け入れ・マージを走らせ、記録をプランの md に残す
close        サイクルのすべてのプランが終わったとき（完了またはオーナーが落とした）、プランが残したものを集め、オーナーとトリアージし、Unit ごとに関数を確認するかをオーナーに聞く
yolo         オーナーが確認なしでサイクルを通すよう指示したとき、ADR のすべてのエントリーが受け入れられた後いつでも、立っている場所からサイクルのステージをオーナーの確認なしに歩き、close のトリアージで止まり、`Added` のオーナー確認を通過させる
```

記録は `cycles/<YYMMDD-NNN-<slug>>/` に残る: `adr.md` / `design.md` / `plan/<plan id>.md` / `close.md`。状態は git が持つ。ADR の `Status` は決定の状態で、plan の `Commit` / `Stopped` は作業の記録であり、サイクルの状態欄ではない。

製品を持つのは `DEFINITION.md` である。その裏の議論を持つのは ADR で、ADR はどのステージからでも開ける。サイクルは `adr` から始まり、owner が点を上げたときはどのステージからでも ADR の entry を追加できる。変更はどのサイクルでも ADR の entry を開き、その entry が `DEFINITION.md` のどの部分に関わるかと、それぞれが変わるかそのままかを書く。

## コントリビュート

commit と push は `lefthook` が検査する。commit 時は変えた分に format・lint・`typecheck:staged`・`test:related`・`ja-check`、push 時は typecheck（ルートとハーネス）と test が走る。`ja-check` の禁止語は `scripts/checks/ja-check.json` の `error` と `warn` で変える。

commit の前に、次を通しておく:

```bash
pnpm lint
pnpm typecheck
pnpm test:run
```

## ライセンス

UNLICENSED
