# agent-rules

Acceptance: `AGENTS.md` の規則に従う。コードに触る前に 1 枚を書き、承認を待つ。検査を弱めない。サイクルの流れと、いつでも当てはまる規則だけがある。どの規則も skill と重複していない（同じことを 2 箇所に書かない）

## Todo

- `AGENTS.md`
  - **ゼロベースで作り直す**（いま 6 条）。材料は 001〜003 の `Retro` の `Good` / `Bad`（このサイクルのチケットにも、レビューで出た教訓がある）
  - 方針（合意済み）:
    - **短く。** 毎セッション読まれるので、長さは毎回の context の税
    - **いつでも当てはまることだけ。** 「そのときの手順」は skill に置く（`Verify` の運行 / 実演の題材 / 誰が実装するか / `Notes` の持ち主）
    - **同じことを 2 箇所に書かない**（どちらかが古くなる）
    - **サイクルのことは最初の 1、2 行**（根幹なので）
  - 案（合意で削る / 足す。言語は英語のまま）。**skill に同じことが書いてある規則は落とした**（4 条「消せるものだけ作る」と ref の手順は `work` / `definition` に、決定をリポジトリに置く話は `definition` にある）:

```md
# AGENTS.md

## The cycle

1. Work happens in cycles. One cycle is one sheet (`definition`), then stack, plan, tickets, work and close:
   each stage is a skill in `.pi/skills/`, and that skill says how to run it.
2. The sheet is agreed with the owner before any code is touched, and that commit freezes it. Only `Stack`,
   `Remarks` and `Retro` are written into it afterwards.

## Rules

3. A stage's procedure belongs to that stage's skill. This file holds what is true all the time, and no rule is
   written in two places.
4. The owner decides what only the owner can decide: the sheet, the criteria, and anything that needs a
   permission.
5. Write what you saw. A claim you did not check is not an observation, and a number you did not read is not a
   number.
6. Keep prose and code in agreement, in the same turn.
7. Never commit personal settings or credentials.
8. One commit is one meaning. Split it if it is mixed.
9. Never report done while a check is red, and never weaken a check: no loosened rules, no deleted tests, no
   `--no-verify`.
10. A check sets up what it depends on — environment, paths, config, clock, network — instead of inheriting it,
    and it writes nothing outside what it made. Where it could reach outside, it proves it does not, before it
    writes. It holds wherever the repository runs it: the commit hook, a linked worktree, every turn.

The checks are wired: `quality-gate` runs them every turn on what that turn changed, and `lefthook` runs them
every commit.
```

- 各条の出どころ（合意の材料）: 1〜2 = サイクルそのもの / 3 = 002「消える文書に規則を書き足した」/ 4 = 1 枚の `Non-goal`「owner の判断を代わりにやらない」（毎サイクルの話ではないのでここに置く）/ 5 = `.env` の一件（子の主張を事実として書いた）/ 6 = 002 の frontmatter・003 の README とコードのズレ / 7〜9 = いまの 4・3・2+6
- 10 = **004 の事故**（owner の指摘で合意）: `run.test.ts` の fixture がフックの中で実リポジトリの config を書き換え、フックが落ちて子の作業が 1 本失われた。検査は環境を継承し、分離を外の状態（cwd 探索）に任せ、封じ込めを確かめていなかった — この 3 つを 1 条にまとめる
- **落とした条**（skill と同じ）: 「消せるものだけ作る」と ref の手順 → `work` / `definition`、「決定はリポジトリに置く」→ `definition`、「自分で判定しない」の実装側 → `work` / `tickets`
- **長さは合意で決める** — いまは 6 条、案は 10 条（+ サイクルの 2 行）
- 観点のうち、正常系（happy）→ `Verify` の実演が担う（clone 直後のつもりで読む）
- 観点（null / 空 / 境界 / 不正 / 権限 / 2 回目 / 並行）→ この step は文書で、作るものが無い — ケース無し
- 失敗の入力（skill と重複した規則を書く）→ `Verify` の観察項目が拾う。期待する値: 読みで確かめて、skill 本文と**同じことを言っている条が無い**（文が違っても同じ意味なら重複。`grep` は補助）(error)
- 失敗の入力（長すぎる）→ 合意した条数より多い (error)
- 失敗の入力（サイクルへの言及が無い）→ `## The cycle` が無い (error)
- 失敗の入力（実物と食い違う）→ 名指しした仕組み（`quality-gate` / `lefthook` / `.pi/skills/`）が実在しない (error)

## Verify

- 実演: clone 直後のつもりで `AGENTS.md` だけを読み、サイクルの流れと規則が言える / どの規則も skill と重複していない（読みで確かめる。`grep` で同じ文が無いことも見る）/ 名指しした仕組みが実在する

## Notes

### Findings

なし

### Unplanned

なし

Commit:
