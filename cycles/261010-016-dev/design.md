# DESIGN 016

## `record-and-delivery`

記録の置き場と、それを読む側（一覧・完了の配達・音）は同じ入力（ADR 01-2 の場所の決め方と記録の形）を読むので、1 つの worktree にする。`scaffold-heading` とは触るファイルが重ならないので同時に走れる。ADR 01-1、01-2、01-3 はどれもこの置き場の上に載るので、分けると片方がもう片方を待つ形になる。

- ADR: 01-1, 01-2, 01-3
- Where: worktree
- Scope:
  - consult: 置き場を runtime の入力にして必須にし、テストが本物の記録に書けない形にする
  - consult.children: 置き場をリポジトリから決まる固定の場所にし、読む幅・表示の規則・`lost`・掃除を定める
  - consult.reload: reload をまたいだ配達を目録で行い、音のタイマーを記録から導き、前のセッションの子を pid で止められるようにする
  - consult.report: まだ渡していない完了の報告を、起動の時に owner へ渡す
  - consult.worktree: 置き場を 1 回だけ決め、読む経路では作らない。片付けても記録を消さない
- Boundary:
  - Plans: なし
  - External:
    - `git`: リポジトリの頂点を得るのに使う
      - Env: フックの `GIT_*` を落としてから打つ。既存の仕事と同じ道にする
    - `tsc`: 置き場を必須にする仕組みは、`.pi/` を見る唯一の型の関門に乗る
      - Contract: ルートの tsconfig は `.pi/` を除外している。見るのは `.pi/tsconfig.json` を使う関門だけ

## `scaffold-heading`

見出しの番号は definition-skill だけの入力（ADR 02-1 の rule と `scaffold.mjs`）を読むので、1 つの worktree にする。他と触るファイルが重ならないので同時に走れる。

- ADR: 02-1
- Where: worktree
- Scope:
  - definition-skill.scaffold: 見出しの番号を走査した値から書き、位置引数の数字で上書きできるようにする。引き継ぎ元のファイルを指す位置引数を落とし、永続の回帰テストを隣に置く
- Boundary:
  - Plans: なし
  - External:
    - `node`: 素の ESM として走らせる
      - Contract: `.mjs` だけ。型注釈や変換に依存しない

## `consult-readme`

README は `record-and-delivery` が作る振る舞いを書くので、その merge を待つ。書く物が先に merge されてはならない（`references/format.md` の cut の規則）。

- ADR: 01-1, 01-2
- Where: worktree
- Scope:
  - consult.docs: 記録の場所と形、状態の一覧（`lost`）、止め方、音の止まり方を、実装に合わせて直す
- Boundary:
  - Plans: `record-and-delivery` が作った振る舞いを書く（先に merge されていること）
  - External: なし
