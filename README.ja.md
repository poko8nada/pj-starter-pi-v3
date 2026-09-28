# ハーネス付きスターター

プロジェクトと、その**エージェント用ハーネス**が最初から揃っているスターター。clone した時点で、検査・commit ゲート・エージェントの規則・サイクルの仕組みが入っている。

English: [README.md](README.md)

## 入っているもの

- **検査** — `oxlint` / `oxfmt` / `tsc` / `vitest` と、それを走らせる `pnpm` スクリプト
- **ゲート** — commit と push で検査を通す `lefthook` と、ターンごとにそのターンで変えた分だけを検査する `quality-gate`
- **エージェントの規則** — `AGENTS.md`（毎セッション読まれる）
- **サイクルの仕組み** — `.pi/skills/` の 6 つ（`definition` / `stack` / `plan` / `tickets` / `work` / `close`）
- **拡張** — `consult`（2 つの道具を持つ 1 つの拡張。`consult_new` は会話を見せずに子の `pi` を走らせ、`consult_refs` はそれが残した ref を一覧し、1 つ消す）/ `quality-gate`（ターンで変えた分を検査する）/ `sound-notify`（pi が待っているときに音と cmux 通知を出す）（`.pi/extensions/`）
- **CI** — `.github/workflows/pullfrog.yml`（dispatch で agent を走らせる）
- **サイクルの記録** — `cycles/`

## 使い始める

```bash
pnpm install
```

1. `cycles/` を消す — このスターター自身のサイクル。clone 先には持ち込まない
2. `.pi/extensions/consult/types.json` がリポジトリにある。自分のモデルに変えて使う
3. `pi` を起動する。スキルは `.pi/skills/` から見つかる

## 検査

| コマンド                            | 何をするか               |
| ----------------------------------- | ------------------------ |
| `pnpm test:run`                     | テストを 1 回走らせる    |
| `pnpm lint`                         | `oxlint`（警告も落とす） |
| `pnpm typecheck`                    | `tsc --noEmit`           |
| `pnpm format` / `pnpm format:check` | 整形する / 確かめる      |

- **commit 時** — 変えた分に format / lint / typecheck / test
- **push 時** — typecheck / test
- **エージェントのターンごと** — そのターンで変えた物があるときだけ。修正の段は `lint:fix` → `format`、検証の段は `lint` → `typecheck:staged` を、変えた物に

## サイクル

1 サイクル = 1 枚の定義 → スタック → プラン → チケット → その実行 → 反省。各段はスキルが担う。**次の段を呼ぶのはスキルの `description`** で、前の段に「次はこれ」とは書かない。

```
definition   1 枚を書く（What / What to build / What to keep / Stack / Retro）
stack        何で作るか（土台のランタイム / 出すのか / 足したもの）
plan         どの順で作るか（step / そのファイル / 何で確かめるか）
tickets      step ごとにチケットを切り、合意する
work         step を 1 つずつ片付ける（誰がやるか / 起点 / 取り込み / Verify / diff / Notes / 閉じる / 報告）
close        サイクル全体を裁く（単位をまたぐ通しの実演 / レビュー / 穴の行き先 / 反省）
```

記録は `cycles/<NNN-DATE>/` に残る。**閉じているかは `Retro` の有無で分かる** — 状態は git が持つので、チェックマークも状態欄も無い。

1 枚の大半は、合意したコミットで凍結される。書けるままなのは `Stack` / `Retro` の 2 節。
