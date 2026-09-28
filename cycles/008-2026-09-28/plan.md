# PLAN 008

## Steps

### step 0: prepare

- Owner: at the end
- Install: なし
- Cleanup: なし

### step 1: check-suite.tmp

- Owner: at the end
- What:
  - 相対パスでリポジトリに書くテストが混ざっても、何も止めない → テストは共通の helper（`test/tmp.ts`）を通し、一時ディレクトリに書く
  - 既存のテストが本体に書ける形のまま → 既存テストが helper を通す形に書き換わっている
- Depends: なし
- Action: build
- Files: `test/tmp.ts`（add）、`vitest.config.ts`
- Verify: test, form

### step 2: work-skill.tests

- Owner: at the end
- What:
  - テストが本体にファイルを書けてしまう（決まりが無い）。子のコミット（`git add -A`）がそれを巻き込む → テストは共通の helper（`test/tmp.ts`）を通して一時ディレクトリに書き、本体には書かない
  - その行が helper を名指ししていない → 行が共通の helper（`test/tmp.ts`）を通すことを名指ししている（使わないテストは、書いてある規則の違反になる）
  - （`Then` より）レビューの観点にテストの隔離が 1 行入っている
- Depends: step 1
- Action: build
- Files: `.pi/skills/work/SKILL.md`
- Verify: read

### step 3: work-skill.owner

- Owner: at the end
- What:
  - ユニットごとの `owner` の値を見る段が無い → `work/SKILL.md` の段が値に従う（`in the loop` は step で止まって見せ、軽微な修正はそのチケットの中で繰り返す。コミットとレビューはループの後）
  - 「最後に 1 回報告する」と step 13 がそのまま → それは `at the end` のユニットの動きになる
  - チケットの `read` に止まる場所が無い → どこで止まるか・何を見せるか・何をもって終わりかが書いてある
- Depends: step 2
- Action: build
- Files: `.pi/skills/work/SKILL.md`
- Verify: read

### step 4: tickets-skill.owner

- Owner: at the end
- What:
  - チケットに `owner` の値も、どこで止まるかも書く欄が無い → `owner:` と「どこで止まるか・何を見せるか・何をもって終わりか」が入る
  - チケット名の規則が step の名前だけ → `ユニット名.機能.何するか` になる（いまの 2 段をこの 3 段に置き換える）
- Depends: step 3
- Action: build
- Files: `.pi/skills/tickets/SKILL.md`、`.pi/skills/tickets/references/format.md`
- Verify: read

### step 5: tickets-skill.stopped

- Owner: at the end
- What:
  - step が止まったことを書き込む欄が無い → 止まった step のチケットは開いたまま残り、理由（落ちた検査の出力、変えたファイル、走った回数、時刻）が書かれている
- Depends: step 4
- Action: build
- Files: `.pi/skills/tickets/SKILL.md`、`.pi/skills/tickets/references/format.md`
- Verify: read

### step 6: plan-skill.owner

- Owner: at the end
- What:
  - owner の値を決める段が無い → エージェントがユニットごとに `owner: in the loop / at the end` の提案を出して owner に明示的に聞き、owner が決める。聞くのはプランを書いたあとでよい（書く前に決まっていれば、それを使う）。既定の提案は `at the end`
  - `Owner:` の行が step ごとに有ったり無かったりする → すべての step に `Owner:` の行がある（`step 0` も含む）
  - step をどの大きさで切るかの規則が無い → `in the loop` の step は vertical slice で切られ、内部だけの step は単独にせず切片に付く
  - 「見せられる大きさ」の定義が無い → `plan/references/format.md` にある（1 つの操作が端から端まで動き、owner が見て 1 つの判断を下せる。見せる物は 1 つ）
  - 見せ方が書かれていない → step ごとに書かれている
- Depends: なし
- Action: build
- Files: `.pi/skills/plan/SKILL.md`、`.pi/skills/plan/references/format.md`
- Verify: read

### step 7: consult.tools

- Owner: at the end
- What:
  - 名前が揃っていない（`consult` は実質「新しい worktree で走らせる物」、`ref_cleanup` は consult の ref を扱う物） → `consult` は `consult_new`、`ref_cleanup` は `consult_refs` という名前になる（`consult_resume` は step 12 で足され、step 19 で 3 つ揃ったことを確かめる）
  - 説明文・prompt・README・スキルの本文が古い名前のまま → 新しい名前になっている（`consult/README.md`、`README.md`、`README.ja.md`、`stack/SKILL.md`、`work/SKILL.md`、`close/SKILL.md`）
- Depends: step 3
- Action: build
- Files: `.pi/extensions/consult/index.ts`、`.pi/extensions/consult/tool/consult.ts`、`.pi/extensions/consult/tool/refs.ts`、`.pi/extensions/consult/README.md`、`.pi/skills/stack/SKILL.md`、`.pi/skills/work/SKILL.md`、`.pi/skills/close/SKILL.md`、`README.md`、`README.ja.md`
- Verify: form

### step 8: consult.sound

- Owner: in the loop
- What:
  - 子が走っている間は無音で、始まるときと終わるときにだけ `Tink` が鳴る → 子が 1 体以上走っている間、5 秒ごとに 1 音（何体でも 1 音、タイマーも 1 本）。0 体で止まる。始まりと終わりの音は無い
  - 音を止める口が無い → `/consult-sound on|off`（既定 on、セッション限り）
  - テストで鳴る → 鳴らす所が差し替えられ、テストでは鳴らない
  - （`Then` より）`consult/README.md` が追随している
  - 見せ方: 子を 1 体走らせて、5 秒ごとに 1 音、子が終わって止まるのを owner が聞く。`/consult-sound off` で止まることも聞く
- Depends: step 7
- Action: build
- Files: `.pi/extensions/consult/tool/sound.ts`（add）、`.pi/extensions/consult/tool/consult.ts`、`.pi/extensions/consult/index.ts`（`/consult-sound` の登録）、`.pi/extensions/consult/tool/render.ts`、`.pi/extensions/consult/README.md`
- Verify: test, look, read

### step 9: consult.retry.reject

- Owner: at the end
- What:
  - フックに拒否されると `ref` が作られず、`finally` が worktree を消すので子の作業が消える → 拒否されたら同じ worktree で `--continue` の子がもう 1 回走る（フックの出力が渡る）。通れば `ref` ができる
  - 2 回目も通ったとき以外の道が無い → 通らなければ worktree が残り、親に理由（落ちた検査の出力、変えたファイル、子の最後の本文、走った回数、時刻、worktree の id）が届く
  - 2 回目にも中断の口が渡らない → 同じ `AbortController` が渡る
- Depends: step 8
- Action: build
- Files: `.pi/extensions/consult/run/run.ts`、`.pi/extensions/consult/run/stopped.ts`（add）、`.pi/extensions/consult/tool/consult.ts`、`.pi/extensions/consult/README.md`
- Verify: test, read

### step 10: consult.retry.limit

- Owner: at the end
- What:
  - 上限で打ち切られると結果が途中のまま届き、打ち切りは本文の 1 行だけで判断に使う所に来ない → 上限で止まったら同じループが 1 回走り、それでも止まれば打ち切りと回数が本文に明示される
  - 上限と使用量が 1 回ごとに数えられていない → 上限は 1 回ごと、使用量は合算して 1 回分として報告される
- Depends: step 9
- Action: build
- Files: `.pi/extensions/consult/run/run.ts`、`.pi/extensions/consult/tool/consult.ts`
- Verify: test

### step 11: consult.retry.check

- Owner: at the end
- What: この unit の `Then` を全部、1 回で確かめる（1 回目だけ落ちる pre-commit フックで、拒否 → 再走 → `ref`、2 回目も落ちれば worktree が残り理由が届く、上限の打ち切りと回数の表示、使用量の合算、2 回目にも同じ `AbortController` が渡る）
- Depends: step 10
- Action: verify
- Files: なし
- Verify: test

### step 12: consult.resume

- Owner: at the end
- What:
  - 止まった子の worktree を扱う口が無い（一覧も、続きも、片付けもできない） → `list` が残った worktree を返し、`run` がその worktree をそのまま使って子を走らせ（既定で `--continue`。セッションが無ければ新しい会話）、`remove` がそれを消す
  - （`Then` より）`run` の型は呼ぶ側が選ぶ（調べるのは `research`、直すのは `code`）
  - （`Then` より）停止の記録（理由、時刻）が worktree の外に、工具によって置かれている（子には書かせない）
  - （`Then` より）`consult/README.md` が追随している
- Depends: step 11
- Action: build
- Files: `.pi/extensions/consult/tool/resume.ts`（add）、`.pi/extensions/consult/run/resume.ts`（add）、`.pi/extensions/consult/index.ts`、`.pi/extensions/consult/run/stopped.ts`、`.pi/extensions/consult/README.md`
- Verify: test, read

### step 13: sound-notify.commit

- Owner: in the loop
- What:
  - 鳴るのは許可・質問・ターン終了の 3 つでコミットの音が無い → `bash` の `git commit` で `Pop` が鳴る
  - テストが無く、鳴らす所が差し替えられない → 差し替えられる形で、テストでは鳴らない
  - 音の一覧が 3 つのまま → `config.json` の `sounds` で 4 つ目（無ければ `Pop`）として差し替えられる
  - （`Then` より）`sound-notify/README.md` が追随している
  - 見せ方: コミットを 1 回作って、`Pop` が鳴るのを owner が聞く。`config.json` の音を変えて、変わることも聞く
- Depends: step 8
- Action: build
- Files: `.pi/extensions/sound-notify/index.ts`、`.pi/extensions/sound-notify/README.md`
- Verify: test, look, read

### step 14: work-skill.stopped

- Owner: at the end
- What:
  - 止まった step の扱いが無く、親がやり直すのが唯一の道 → 止まった step のチケットは閉じない。親は理由を読んで、(a) 指示を直してやり直す、(b) `consult_resume` に `research` を送る、(c) `code` を送る、(d) 開いたまま close に渡す、から選ぶ
  - （`Then` より）止まったことが owner に報告される
- Depends: step 7, step 12
- Action: build
- Files: `.pi/skills/work/SKILL.md`
- Verify: read

### step 15: work-skill.squash

- Owner: at the end
- What:
  - `squash.mjs` はハッシュをフルで渡すと「一覧が base..HEAD と違う」と言って止まる（007 の close の直後に、実際にこれで止まった） → 短くてもフルでも同じように通る
  - （`Then` より）どちらの形でも通るテストがある
- Depends: step 1
- Action: build
- Files: `.pi/skills/work/scripts/squash.mjs`
- Verify: test

### step 16: definition-skill.units

- Owner: at the end
- What:
  - 前のサイクルのユニット一覧を引き継ぐ段が無い → `definition/SKILL.md` が前の `What to build` と `What to keep` の一覧から始める
  - 名前の増減の規則が無い → 増えるのは `add` のときだけ、減るのは `drop` のときだけ。`update` は名前を変えず `ユニット名.機能`
  - unit の定義が無い → unit は実物（拡張・スキル・ゲート・文書）で、機能は unit にしない
  - 007 の 3 つの機能名が unit として並んでいた → `definition/references/format.md` の名前の規則がこの形に置き換わり、3 つは `Change: drop` として並ぶ
- Depends: なし
- Action: build
- Files: `.pi/skills/definition/SKILL.md`、`.pi/skills/definition/references/format.md`
- Verify: read

### step 17: close-skill.stopped

- Owner: at the end
- What:
  - 開いたチケットを close で判断する段が無く、残った worktree も放置される → close は開いているチケットを穴として扱い、調査の段で理由を確かめ、owner と「続ける / 落とす / 持ち越す」を決める。決めたとおりに、残った worktree を `consult_resume` の `remove` で消すか、残すかする
- Depends: step 7, step 12
- Action: build
- Files: `.pi/skills/close/SKILL.md`
- Verify: read

### step 18: readme.tools

- Owner: at the end
- What:
  - README が `consult` と `ref_cleanup` の 2 つとして説明し、`consult_resume` が無い → `README.md` / `README.ja.md` が 3 つの道具（`consult_new` / `consult_resume` / `consult_refs`）を説明している
- Depends: step 7, step 12
- Action: build
- Files: `README.md`、`README.ja.md`
- Verify: form

### step 19: consult.tools.check

- Owner: at the end
- What: この unit の `Then` を全部、1 回で確かめる（`consult_new` / `consult_resume` / `consult_refs` の 3 つが登録され、説明文・prompt・README・スキルの本文に古い名前（`ref_cleanup`、道具としての `consult`）が残っていない）。`Then` の「3 つ」のうち `consult_resume` の登録は step 12 が作るので、ここで待って確かめる
- Depends: step 7, step 12, step 18
- Action: verify
- Files: なし
- Verify: form

## Structure

```text
test/
  tmp.ts                   add
.pi/extensions/consult/
  index.ts                 update
  README.md                update
  run/
    run.ts                 update
    resume.ts              add
    stopped.ts             add
  tool/
    consult.ts             update
    resume.ts              add
    refs.ts                update
    render.ts              update
    sound.ts               add
.pi/extensions/sound-notify/
  index.ts                 update
  README.md                update
.pi/skills/
  work/
    SKILL.md               update
    scripts/squash.mjs     update
  tickets/
    SKILL.md               update
    references/format.md   update
  plan/
    SKILL.md               update
    references/format.md   update
  definition/
    SKILL.md               update
    references/format.md   update
  close/
    SKILL.md               update
  stack/
    SKILL.md               update
README.md                  update
README.ja.md               update
vitest.config.ts           update
```

## What to keep

- なし
