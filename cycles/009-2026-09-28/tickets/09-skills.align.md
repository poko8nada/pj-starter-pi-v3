# skills.align

Acceptance:

- `.pi/skills/` の 6 つのスキル（`work` / `close` / `plan` / `tickets` / `definition` / `stack`）の本文が、4 つの道具と worktree の設計に一致している
- チケットの規約（結果をチケットに書かせる、`Stopped` を書くのは親、`Commit:` は worktree のコミットのハッシュ）は**スキル側の `task`** に置かれている（型と道具には無い）
- 消えた物（`consult_new` / `consult_resume` / `consult_refs` / ref / diff の受け渡し / `stopped.json` / `kept`）を前提にした手順が残っていない

Owner: at the end

## Todo

- `.pi/skills/work/SKILL.md`
  - step 6（子に渡す）: `consult_run{role, task, worktree}` で渡す。`input` を使わず、読ませたいファイルは `task` にパスを書く
  - step 6: 子は自分でチケットに書く（書けるロール）。親は `Stopped` を書く
  - step 11（unit の終わり）: `consult_commit{worktree}` で刻み、`Commit:` にそのハッシュを書く
- `.pi/skills/close/SKILL.md`
  - worktree の始末: `consult_worktree{action: list}` / `remove`。台帳ではなく `git worktree list` と `consult/*` から
  - ref の始末（`consult_refs`）の段を消す（ref が無くなる）
- `.pi/skills/tickets/SKILL.md` と `.pi/skills/tickets/references/format.md`
  - `Stopped` を書くのは親（`Verify` の結果を知っているのは親だけ）
  - `Commit:` は worktree のコミットのハッシュ
- `.pi/skills/plan/SKILL.md`
  - レビューの子の渡し方: `consult_run{role: 'review', task}`（`input` を使わない）
- `.pi/skills/definition/SKILL.md`
  - 同上（レビューの子の渡し方）
- `.pi/skills/stack/SKILL.md`
  - `trial` の子の渡し方: `consult_run{role: 'trial', worktree, task}`。ref の始末（`consult_refs`）の段を消す

## Verify

### read

- `review` の子に `.pi/skills/work/SKILL.md` と `.pi/skills/close/SKILL.md` を渡す
  - 子の渡し方（`consult_run`）、`Stopped` を書くのは誰か、`Commit:` の中身、worktree の始末を報告させる
  - 合格: `input` を使う指示が無く、`consult_resume` / `consult_refs` / ref / `stopped.json` を前提にした手順が無い — 1・3 行目を決める
- `review` の子に `.pi/skills/tickets/SKILL.md` と `.pi/skills/tickets/references/format.md` を渡す
  - `Stopped` と `Commit:` の書き方を報告させる
  - 合格: `Stopped` を書くのは親と書いてあり、`Commit:` が worktree のコミットのハッシュと書いてある — 2 行目を決める
- `review` の子に `.pi/skills/plan/SKILL.md` と `.pi/skills/definition/SKILL.md` と `.pi/skills/stack/SKILL.md` を渡す
  - レビューと `trial` の子の渡し方を報告させる
  - 合格: 3 つとも `consult_run` の形で書かれ、`input` と `consult_refs` が無い — 1・3 行目を決める
- 消えた名前が残っていないか: `grep -rn "consult_new\|consult_resume\|consult_refs\|stopped\.json" .pi/skills` が 0 件
  - 合格: 0 件 — 3 行目を決める

## Notes

### Findings

- なし

### Unplanned

- なし

Commit:
