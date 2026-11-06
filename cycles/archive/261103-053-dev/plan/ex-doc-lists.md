# PLAN `ex-doc-lists`

- Place: worktree
- Boundary Plans: なし（サイクルの plan はすべて終わっている）

## Files

```text
.pi/skills/
  adr/
    SKILL.md              update
  close/
    SKILL.md              update
  work/
    SKILL.md              update
    references/
      tasks.md            update
  yolo/
    SKILL.md              update
README.md                 update
README.ja.md              update
```

## Slices

## 1. 改名と観点を文書に届ける

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/close/SKILL.md`:
   - update: 31行目の「no plan's `Files` or `Paths` carries」を「no plan's `Files` carries」に直す。
2. `.pi/skills/adr/SKILL.md`:
   - update: 12行目のエントリー段階の一覧に「the discussion」を足す。
3. `.pi/skills/work/SKILL.md`:
   - update: 52行目の「a `Goal` line」を「an `Adopted` line」に直す。
4. `.pi/skills/work/references/tasks.md`:
   - update: 25行目の「a `Goal` line」を「an `Adopted` line」に直す。
5. `.pi/skills/yolo/SKILL.md`:
   - update: 26行目の plan のレビューの観点を、`Goal`、`Integration`、`Files`、`Types`、`Cases`、`Checks`、`Flow` の7つに直す。
6. `README.md`:
   - update: 61行目の plan の説明を、`plan` の `description`（ADR が定まり、カットを提示して合意した後）に合わせる。
7. `README.ja.md`:
   - update: 61行目の plan の説明を、`plan` の `description` に合わせる。

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `! grep -n 'Paths' .pi/skills/close/SKILL.md`
  - `! grep -n 'Goal' .pi/skills/work/SKILL.md .pi/skills/work/references/tasks.md`
  - `grep -n 'Integration' .pi/skills/yolo/SKILL.md`
  - `! grep -n 'after the split is settled' README.md`
  - 変更した全ファイルを通読し、矛盾、循環、重複、不足、不自然な流れがないか確かめる。ダメなら直し、`Unplanned` に書く。
- Added: なし

## Notes

### Slice 1: 改名と観点を文書に届ける

- Findings: なし
- Unplanned: `README.ja.md` の二重「後」を単一「後」に直した1件
- Commit: ee0bd7f
- Stopped: なし

## Work Review

### Round 1

- Stale: なし — 差分7件は`close.md`のTriage 11,12,14,15,16,17の指示どおりで他を古くしないことを確かめた（生きた`Paths`欄は`.pi/skills/close/SKILL.md:31`以外になく、`.pi/skills/plan/SKILL.md:60-66`と`.pi/skills/plan/references/tasks.md:10-16`は既に7観点で一致し、`.pi/skills/adr/SKILL.md:97-121`の7手順と`.pi/skills/adr/references/adr.format.md:84`の「やり取りは残さない」とも矛盾しない）。
- Unlisted: なし — `git diff eb53bf9..ee0bd7f --stat`の7件は`cycles/261103-053-dev/plan/ex-doc-lists.md:8-22`の`Files`の7件（すべて`update`）と一致し、plan md自体の`Notes`更新は記録で対象外である。
- Gaps: なし — 文書置換のみで振る舞い追加はなく、差分に7件の意図どおりの文言（`the discussion`、`Files`、`Adopted`2件、7観点、英日README2件）が揃うことを通読で確かめた（`git show ee0bd7f --stat`の7件はいずれも1行置換）。
- Unproven: なし — 差分にテスト変更はなく、壊して赤を確認すべき振る舞いがない（`.pi/skills/adr/SKILL.md:12`など文書7件のみの変更である）。
- Noise: なし — テスト追加はなく、7件はいずれも`close.md`のTriageが決めた文言で冠詞`a`→`an`の整え（`.pi/skills/work/SKILL.md:52`）を含む余分な言い換えはない。
- Doubts:
  - `cycles/261103-053-dev/plan/ex-doc-lists.md:58-61` — `Verify`の`grep`は`Integration`の存在と旧文言の不在だけを見て、`the discussion`（`.pi/skills/adr/SKILL.md:12`）・`Adopted`の存在（`.pi/skills/work/SKILL.md:52`）・`Flow`（`.pi/skills/yolo/SKILL.md:26`）・`README.ja.md`の旧文言を確かめないため、今回は差分通読で閉じるが将来の回帰はすり抜ける。
  - `README.md:65`・`README.ja.md:65` — planの`Steps`（`cycles/261103-053-dev/plan/ex-doc-lists.md:46-49`）と`close.md:32,101`は61行目と書くが実ファイルのplan行は65行目であり、作業は正しい行に届いたため所見に留める。

## Acceptance

- Ran: `pnpm test:run`（731テスト）、`pnpm typecheck`（root と .pi）、`pnpm lint`、`pnpm format:check`、`! grep -n 'Paths' .pi/skills/close/SKILL.md`、`! grep -n 'Goal' .pi/skills/work/SKILL.md .pi/skills/work/references/tasks.md`、`grep -n 'Integration' .pi/skills/yolo/SKILL.md`、`! grep -n 'after the split is settled' README.md`、変更した7ファイルの通読。マージは `2d35643` の後、`ex-doc-lists` は `git merge --no-ff consult/ex-doc-lists` で入れた。
- Findings: なし
- Doubts: なし
