# PLAN 009

## Steps

### step 0: prepare

- Owner: at the end
- Install: なし
- Cleanup: なし

### step 1: consult.roles

- Owner: at the end
- What:
  - `environment: tree | worktree` が場所を決め、`tree` のロールは親の木でしか走れない → `readOnly` が場所を決める（true は worktree 引数が任意で省略時は親の木、false は必須で省略はエラー）
  - `code` の上限 60 は新モジュールを書く step に足りない（008 で親が 2 回やり直した）→ research 40 / review 40 / trial 60 / code 80 の 4 つになる
  - 続き（`--continue`）を使うかどうかが型に無い → `continueByDefault`（research false / review false / trial true / code true）が型にあり、`consult_run` の引数を省くとこれが使われる
  - （`Then` より）`trial` と `code` の `role` に「終わらなければ、どこまでやったかと止まった理由を報告して終える」が入る。チケット・サイクルの言葉は型に入らない
  - （依存）`environment` が消えると `child/spec.ts` の `needsIsolation`（`policy.environment` を読む）がコンパイルを通らない → `readOnly` を読む形に直す
- Depends: なし
- Action: build
- Files: `.pi/extensions/consult/types.json`, `.pi/extensions/consult/policy/types.ts`, `.pi/extensions/consult/child/spec.ts`
- Verify: test

### step 2: consult.workspace

- Owner: at the end
- What:
  - worktree を 1 回の実行ごとに作り、`finally` で必ず消す（残るのは失敗したときだけで、その道は 008 では 1 度も働かなかった）→ worktree は**明示しない限り残る**。消すのは `consult_worktree{action: remove}` だけ
  - 置き場が `os.tmpdir()`（`/private/var/folders/...`）で親から読めない → `/tmp/pi-consult/<project>-<YYYYMMDD-HHMM>/<unit-id>/`。親も子も read も bash もできる
  - `--detach` で作るので、コミットが本体に載らない → `consult/<unit-id>` ブランチで作り、base は親の HEAD（`main` を仮定しない）
  - （依存）worktree の作成と削除は `run/run.ts` の中にある → `run/worktree.ts` へ移し、`run/run.ts` は残る処理だけを持つ
  - （依存）二度目のコミットを待つ道（`run/retry.ts` の `attemptAndCommit` と retry ループ）は、worktree が残る設計では要らない → 落とす
  - （`Then` より）同じ worktree に同時に書けるのは 1 体。子が動いている worktree への `remove` は拒否する
  - （`Then` より）台帳ファイルは持たず、`git worktree list` と `consult/*` ブランチから一覧を作る
- Depends: 1
- Action: build
- Files: `.pi/extensions/consult/run/worktree.ts`, `.pi/extensions/consult/run/run.ts`, `.pi/extensions/consult/run/retry.ts`, `.pi/extensions/consult/tool/worktree.ts`, `.pi/extensions/consult/index.ts`
- Verify: test

### step 3: consult.run

- Owner: at the end
- What:
  - `consult_new{type, task, input}` が毎回新しい worktree を作り、行き先を指せない → `consult_run{role, task, worktree?, continue?}` が行き先を指して 1 体起こし、`started: <id>` をすぐ返す
  - （`Then` より）`input` を引数に持たない。読ませたいファイルは `task` にパスを書いて子に読ませる（子は `read` を持つ。008 で 3 体走ったのは「1 パスにつき 1 体」の実装が原因なので、**1 呼び出し = 必ず 1 体** を契約にする。複数の子が要るときは道具を複数回呼ぶ）
  - 子は `--no-session` で走るので続きが無い → セッションは worktree ごとに 1 つ（`--session <root>/<unit-id>/session`）。`continue` が true なら同じ会話の続き
  - `readOnly: false` の子に worktree が渡されない道がある（暗黙に作っていた）→ worktree を省くとエラー。存在しない id もエラー
  - （依存）`--no-session` を組んでいるのは `child/spec.ts` → セッションの引数を組む形に直す
- Depends: 1, 2
- Action: build
- Files: `.pi/extensions/consult/tool/run.ts`, `.pi/extensions/consult/run/child.ts`, `.pi/extensions/consult/child/spec.ts`, `.pi/extensions/consult/tool/consult.ts`, `.pi/extensions/consult/index.ts`
- Verify: test

### step 4: consult.report

- Owner: at the end
- What:
  - 親が diff を用意して子に渡している（`/tmp/*.diff`）→ 親は diff を用意しない。親が要るなら `git -C <path> diff` を自分で読む
  - 親は子の本文を読み、止まった理由を worktree から推測して `Stopped` を書く → 戻る塊は `id / role / worktree / state（done | stopped + reason）/ files / turns / spend` と、子の最後の本文。推測が要らない
  - 打ち切りは「turn limit reached」の 1 行で、子自身の状況が無い → `turn_end` で `limits.turns - 1` に達したら `custom_message` を差し込み `continue: true` を返す（`child/budget.ts`）。`stopped: turn-limit` には子自身の報告が付く
  - （`Then` より）ありえる戻り値は 6 つ（done / done でファイルなし / turn-limit / hook-rejected / error / aborted）で全部
  - （`Then` より）止まった次の手は 2 択だけ（同じ worktree に `continue: true` で送り直す / 何もしない）。道具は retry しない
- Depends: 3
- Action: build
- Files: `.pi/extensions/consult/tool/render.ts`, `.pi/extensions/consult/child/budget.ts`, `.pi/extensions/consult/run/run.ts`
- Verify: test

### step 5: consult.commit

- Owner: at the end
- What:
  - コミットが道具の内側（`commitWorktree`）で差分から作られ、フックに拒否されると「変えた物が無い」と見える（008 で 3 回、作業が宙に浮いた）→ `consult_commit{worktree}` が分けて呼ばれ、`committed: <hash>` / `rejected: <フックの出力>` / `no change` を返す。拒否されても作業は worktree に残る
  - 親は worktree のパスを知らないとコミットできない → 親は id だけで呼べる。merge はしない（親のブランチ側は CLI）
  - （依存）コミットが ref を作っていた（`run/refs.ts` と `tool/refs.ts`、`consult_refs`）→ worktree とブランチが受け渡しの道になるので、ref の契約ごと落とす
- Depends: 2, 4
- Action: build
- Files: `.pi/extensions/consult/tool/commit.ts`, `.pi/extensions/consult/run/run.ts`, `.pi/extensions/consult/run/refs.ts`, `.pi/extensions/consult/tool/refs.ts`, `.pi/extensions/consult/index.ts`
- Verify: test

### step 6: consult.children

- Owner: at the end
- What:
  - `consult_new{action: list|cancel}` が走っている子を返すが、reload をまたぐと見失う → `consult_children{action: list|cancel, id?}` が `id / role / worktree / 経過 / ターン / 費用` を返し、記録を読むので reload をまたいでも出る
  - 停止の記録を worktree の隣（`stopped.json`）に置いている → 記録は `<root>/<unit-id>/log.jsonl` に移り、pid を持つ（生存確認ができる）
  - （依存）停止した子の続きを別の道具（`consult_resume`、`run/resume.ts` と `tool/resume.ts`）で扱っていた → `consult_run{continue: true}` と `consult_worktree` に吸収し、2 つのファイルを落とす
  - （依存）記録が `run/stopped.ts` の `stopped.json` から `run/log.ts` の `log.jsonl` に移る → `run/stopped.ts` を落とす
- Depends: 3, 5
- Action: build
- Files: `.pi/extensions/consult/tool/children.ts`, `.pi/extensions/consult/run/log.ts`, `.pi/extensions/consult/run/stopped.ts`, `.pi/extensions/consult/run/resume.ts`, `.pi/extensions/consult/tool/resume.ts`, `.pi/extensions/consult/tool/consult.ts`, `.pi/extensions/consult/index.ts`
- Verify: test

### step 7: consult.reload

- Owner: in the loop
- What:
  - reload のとき、走っている子の完了通知が古い `pi` を叩いてプロセスごと落ちる（008 で 1 回、worktree が宙に浮いた）→ 完了通知はセッションごとの delivery を通り、reload で差し替わる。古い delivery は no-op になり記録に書く
  - 資源（タイマー・子の登録）がセッションに紐づいていない → `session_shutdown` で手放す。子は detach されていて殺さない
  - （`Then` より）新しいインスタンスは起動時に `log.jsonl` を読み、前のセッションで走っていた子を `consult_children` に出す
  - （`Then` より）新しいインスタンスを作ってから古い完了ハンドラを呼んでも落ちない（`Verify` の `test` がこれを確かめる）
- Show: worktree を 1 つ作り、子を 1 体走らせ、`consult_commit` を呼び、親のブランチへ merge する所までを 1 回で実演する
- Depends: 6
- Action: build
- Files: `.pi/extensions/consult/run/delivery.ts`, `.pi/extensions/consult/run/child.ts`, `.pi/extensions/consult/index.ts`, `.pi/extensions/consult/tool/sound.ts`
- Verify: test

### step 7b: consult.workspace.remove

- Owner: at the end
- What:
  - `consult_worktree{action: remove}` は worktree だけ消し、ブランチを残す（片付けが人に残り、agent は `git branch -d` を打てない）→ worktree を消したあと、**HEAD に取り込み済みのブランチも消す**
  - 未マージのブランチは残し、その理由を返す（未マージの仕事を消さない）。`force: true` のときだけ未マージでも消す（捨てる）
  - （`Then` より）「worktree は明示しない限り残る」はそのまま。消す口が `consult_worktree{action: remove}` だけであることも変わらない
- Depends: 2
- Action: build
- Files: `.pi/extensions/consult/run/worktree.ts`, `.pi/extensions/consult/tool/worktree.ts`
- Verify: test

> owner の承認（2026-09-29）で追加。step 8 の前に置く（README とスキルが「ブランチは残る物」を前提に書かれないように）。

### step 8: consult.docs

- Owner: at the end
- What:
  - `.pi/extensions/consult/README.md` が `consult_new` / `consult_resume` / `consult_refs` / ref / diff を説明している → 4 つの道具（`consult_run` / `consult_children` / `consult_worktree` / `consult_commit`）と「worktree は明示しない限り残る」設計に追随する
  - （`Then` より）直下の `consult-redesign.md`（実装が終わったら消す約束の一時ファイル）を消す
- Depends: 3, 4, 5, 6, 7
- Action: build
- Files: `.pi/extensions/consult/README.md`, `consult-redesign.md`
- Verify: form, read

### step 9: skills.align

- Owner: at the end
- What:
  - `work` / `close` / `plan` / `tickets` / `definition` / `stack` が、`consult_new`・ref・diff・`stopped.json`・`consult_resume`・`kept` を前提にしている → 4 つの道具と worktree の設計に一致する
  - （`Then` より）チケットの規約（結果をチケットに書かせる、`Stopped` を書くのは親、`Commit:` は worktree のコミットのハッシュ）は**スキル側の `task`** に置く（型と道具には無い。読ませたいファイルも `task` にパスを書く）
- Depends: 8
- Action: build
- Files: `.pi/skills/work/SKILL.md`, `.pi/skills/close/SKILL.md`, `.pi/skills/tickets/SKILL.md`, `.pi/skills/tickets/references/format.md`, `.pi/skills/plan/SKILL.md`, `.pi/skills/definition/SKILL.md`, `.pi/skills/stack/SKILL.md`
- Verify: read

### step 10: readme.consult

- Owner: at the end
- What:
  - ルートの `README.md` / `README.ja.md` が consult の道具として 3 つ（`consult_new` / `consult_resume` / `consult_refs`）を説明している → 4 つの道具と worktree の設計に追随し、消えた名前が残らない
- Depends: 9
- Action: build
- Files: `README.md`, `README.ja.md`
- Verify: form, read

## Structure

```text
.pi/extensions/consult/
  types.json              update
  index.ts                update
  README.md               update
  policy/
    types.ts              update
  child/
    spec.ts               update
    budget.ts             add
  run/
    worktree.ts           add
    log.ts                add
    delivery.ts           add
    run.ts                update
    child.ts              update
    retry.ts              drop
    stopped.ts            drop
    resume.ts             drop
    refs.ts               drop
  tool/
    run.ts                add
    commit.ts             add
    children.ts           add
    worktree.ts           add
    render.ts             update
    sound.ts              update
    consult.ts            update
    resume.ts             drop
    refs.ts               drop
consult-redesign.md       drop
.pi/skills/
  work/SKILL.md                        update
  close/SKILL.md                       update
  stack/SKILL.md                       update
  tickets/
    SKILL.md                           update
    references/format.md               update
  plan/SKILL.md                        update
  definition/SKILL.md                  update
README.md                              update
README.ja.md                           update
```

## What to keep

- なし
