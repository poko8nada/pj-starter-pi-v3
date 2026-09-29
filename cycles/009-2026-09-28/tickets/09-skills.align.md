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

- `read` 検証は **5 体**の `review` の子で回した（チケットの 3 体 + `stack` の再検証 1 体 + その他）。総額 $0.02 ほど
  - `consult-3`（`work`/`close`）: 矛盾なし。`input` は禁止の 1 か所のみ、消えた 4 名は 0 件、`Stopped` は親、`Commit:` は unit の squash、worktree の始末も一致
  - `consult-4`（`tickets`/`format.md`）: 矛盾なし。ただし**沈黙 1 つ**: チケットは「unit につき 1 コミット」と言うのに、複数 worktree をどう 1 つに束ねるかが `format.md` 単体では見えない（答えは `work` の squash にある）→ 相互参照を 1 行足した
  - `consult-5`（`plan`/`definition`/`stack`）: **本物の穴 1 つ**。`plan` と `definition` には「`consult_run{role:'review', task}` で渡し、パスは `task` に書く」があるのに、**`stack` だけ無い**（`trial` の子に何を渡すかも未記載）→ 両方を足した
  - `consult-6`（`stack` の再検証）: 直ったことを確認（YES）。さらに 3 つの沈黙 — ①チェックリストがどう子に届くか（子はスキルを読めない）②`review` の子が worktree を持つのか ③レビューの結果の戻り方。①と②は本物なので、4 スキルの受け渡し行を揃えた
  - 検査の型（5 体 $0.02、最大 3 ターン）は Carry over 1（レビューが重い）の実測材料になる
- なぜ `stack` が漏れたか: チケットの `Todo` が `stack` については `trial` の子の渡し方しか名指ししていなかった（`review` の子の受け渡しは `plan`/`definition` の項目にだけあった）。検査が拾ったので実害は無い

### Unplanned

- `.pi/skills/plan/SKILL.md` / `.pi/skills/definition/SKILL.md` / `.pi/skills/tickets/SKILL.md`: レビューの子の受け渡し行を新しく書いた（ツール名・パスを `task` に・チェックリストを貼る・`review` は親の木で走る）
  - なぜ: チケットの `Todo` は「`consult_run{role:'review', task}` の形」までで、チェックリストの運び方と場所は書いていなかった
- `.pi/skills/tickets/references/format.md`: 「unit の 1 コミットは複数の worktree を squash して作る」の相互参照を 1 行足した
  - なぜ: `consult-4` が沈黙として指摘したため
- `.pi/skills/work/SKILL.md` / `.pi/skills/close/SKILL.md`: `ref` という語を使っていた手順（取り込み・始末・掃除の段）を worktree と commit の語に置き換えた
  - なぜ: チケットの `Todo` は道具名の差し替えだけを上げていたが、ref という概念ごと消えたため（work には ref を前提にした段が 7 行あった）

Commit: 32b5af2
