# ハーネス付きスターター

プロジェクトと、その**エージェント用ハーネス**が最初から揃っているスターター。clone した時点で、検査・commit ゲート・エージェントの規則・サイクルの仕組みが入っている。

English: [README.md](README.md)

## 入っているもの

- **検査** — `oxlint` / `oxfmt` / `tsc` / `vitest` と、それを走らせる `pnpm` スクリプト
- **ゲート** — commit と push で検査を通す `lefthook` と、ターンごとにそのターンで変えた分だけを検査する `quality-gate`
- **エージェントの規則** — `AGENTS.md`（毎セッション読まれる）
- **サイクルの仕組み** — `.pi/skills/` の 5 つ（`definition` / `stack` / `plan` / `tickets` / `work`）
- **consult** — 会話を見せずに子の `pi` を走らせる道具（`.pi/extensions/consult/`）
- **サイクルの記録** — `cycles/`

## 使い始める

```bash
pnpm install
```

1. `cycles/` を消す — このスターター自身のサイクル。clone 先には持ち込まない
2. `.pi/extensions/consult/types.example.json` を `types.json` にコピーして、自分のモデルを入れる（`types.json` は git 管理外）
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
- **エージェントのターンごと** — `lint` と `typecheck` を、そのターンで変えたものに（整形はその前に修正として走る）

## サイクル

1 サイクル = 1 枚の定義 → スタック → プラン → チケット → その実行 → 反省。各段はスキルが担う。**次の段を呼ぶのはスキルの `description`** で、前の段に「次はこれ」とは書かない。

```
definition   1 枚を書く（What / Goal / Non-goal / What to build / What to keep / Stack / Remarks / Retro）
stack        何で作るか（ハーネスが土台。足した分だけ）
plan         どの順で作るか（step / ファイル / テスト）
tickets      step ごとにチケットを切り、合意する
work         step を 1 つずつ片付ける（誰がやるか / 取り込み / 実演 / 閉じる / ref の片付け）
```

記録は `cycles/<NNN-DATE>/` に残る。**閉じているかは `Retro` の有無で分かる** — 状態は git が持つので、チェックマークも状態欄も無い。

1 枚の大半は、合意したコミットで凍結される。書けるままなのは `Stack` / `Remarks` / `Retro` の 3 節。`Remarks` はサイクル中にオーナーの指摘が着地する場所で、1 行ずつ `<指摘> → <着地先>` と書く。
