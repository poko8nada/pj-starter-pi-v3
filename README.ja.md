# ハーネス付きスターター

プロジェクトと、その**エージェント用ハーネス**が最初から揃っているスターター。clone した時点で、検査・commit ゲート・エージェントの規則・サイクルの仕組みが入っている。

English: [README.md](README.md)

## 入っているもの

- **検査** — `oxlint` / `oxfmt` / `tsc` / `vitest` と、それを走らせる `pnpm` スクリプト
- **ゲート** — commit と push で検査を通す `lefthook` と、ターンごとにそのターンで変えた分だけを検査する `quality-gate`
- **エージェントの規則** — `AGENTS.md`（毎セッション読まれる）
- **サイクルの仕組み** — `.pi/skills/` の 8 つ（`propose` / `brief` / `adr` / `design` / `plan` / `work` / `close` / `yolo`）
- **拡張** — `consult`（4 つの道具を持つ 1 つの拡張）、`quality-gate`（ターンで変えた分を検査する）、`sound-notify`（pi が待っているときに音と cmux 通知を出す）、`intent-router`（owner の発言を返信・承認・その他に分け、調べ物が関係あるか・答えられるかを問い、ask のたびに日ごとの JSONL へ 1 行足す）（`.pi/extensions/`）
  - `consult_run` — ロールと行き先を指して、サブエージェントの `pi` を 1 体だけ走らせる。この会話は見せない
  - `consult_subagents` — このセッションのサブエージェントを一覧し、1 体止める。記録を読むので reload をまたいでもこのセッションのサブエージェントは出る
  - `consult_worktree` — unit の worktree を作り、一覧し、消す。明示しない限り残り、`remove` は取り込み済みのブランチも一緒に消す（未マージは残す）
  - `consult_commit` — サブエージェントが worktree に残した仕事をコミットする。メインエージェントのブランチへの取り込みは `git merge --no-ff consult/<unit-id>` を自分で打つ
  - 置き場: `/tmp/pi-consult/<project>-<stamp>/<unit-id>/wt`、ブランチ `consult/<unit-id>`、base の既定は `HEAD`
- **CI** — `.github/workflows/pullfrog.yml`（dispatch で agent を走らせる）
- **サイクルの記録** — `cycles/`

## 使い始める

```bash
pnpm install
```

1. `pnpm product:ready` で clone を自分の物にする（一度きり） — `cycles/` を消して状態を `product` にする。テストは消えない。`product` ではハーネスのテストが既定で回らない（状態は `scripts/harness.mode.json`）。消すのは `--run` を足したときだけ。1種だけなら `--only <label>` を足す
2. `.pi/extensions/consult/types.json` がリポジトリにある。自分のモデルに変えて使う
3. `pi` を起動する。スキルは `.pi/skills/` から見つかる

## 検査

| コマンド                            | 何をするか                          |
| ----------------------------------- | ----------------------------------- |
| `pnpm test:run`                     | テストを 1 回走らせる               |
| `pnpm lint`                         | `oxlint`（警告も落とす）            |
| `pnpm typecheck`                    | `node scripts/checks/typecheck.mjs` |
| `pnpm format` / `pnpm format:check` | 整形する / 確かめる                 |

- **commit 時** — 変えた分に format / lint / `typecheck:staged` / `test:related`
- **push 時** — typecheck（ルートとハーネス）/ test
- **エージェントのターンごと** — そのターンで変えた物があるときだけ。修正の段は `lint:fix` → `format`、検証の段は `lint` → `typecheck:staged` を、変えた物に
- **ハーネスのテスト** — `product` では既定で回らない。回したいときは状態を `starter` に戻す（`scripts/harness.mode.json`）

## ハーネス

エージェント用ハーネスは `scripts/harness.mjs` で運ぶ:

- `node scripts/harness.mjs pull` でスターターのハーネスを取り込み、`node scripts/harness.mjs push` で戻す。`--run` が無ければ表示だけ（`copy` / `remove`）。
- 一覧は `scripts/harness.json`。相手の道は `scripts/harness.local.json` に `{ "starter": "~/..." }` と書く（自分の物で commit しない）。
- `package.json` は一覧の外にあるので、pull の後に `scripts` と `devDependencies` を手で見る。

## サイクル

1 サイクル = ADR → 設計 → プラン → その実行 → 閉じる。各段はスキルが担う。**次の段を呼ぶのはスキルの `description`** で、前の段に「次はこれ」とは書かない。

```
propose      状態を読み、次の候補を並べる（3 つの問い / コード / リサーチ）
brief        意図を詰め、選択肢を並べる（調査 / 試作 / 議論）
adr          決めるべきことを決める（選択肢 / 決定）
design       entry ごとに何に触れるかを調べ、サイクルをプランに切り、どこで走らせるかを決める
plan         1 プラン = 1 枚を書く（ファイル / 型 / 手順 / 検査）
work         1 プランを片付ける（スライス / テストの整理 / レビュー / 受け入れ / マージと、その後の base の依存揃え）
close        サイクルを裁く（残り物は 4 つのどれか。`ex-` の plan / `proposed` / `dropped`）
yolo         オーナーの確認を挟まずに 1 サイクルを歩く
```

記録は `cycles/<YYMMDD-NNN-<slug>>/` に残る: `adr.md` / `design.md` / `plan/<plan id>.md` / `close.md`。状態は git が持つので、チェックマークも状態欄も無い。

製品を持つのは `DEFINITION.md`。その裏の議論を持つのは ADR で、ADR はどの段からでも書ける。定義に合意した後の変更は新しい ADR の entry にし、plan が書く。
