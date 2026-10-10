# PLAN 007

## Steps

### step 0: prepare

- Install: なし
- Cleanup: なし

### step 1: tickets-skill

- What:
  - レビューの観点が網羅的で、渡すファイルを名指ししていない → `tickets/SKILL.md` の `The review's checklist` が 2〜4 個で、渡すファイルが名指しされ、観点に「owner が見て同意したか」「直しが owner の指摘に答えているか」が入っている
  - レビューの前に owner が見て同意する順序が書かれていない → 手順が owner → レビュー → コミット の順で、レビューは 3 回までのループで収束する
  - `Commit:` が「自分の step のハッシュ」で、ユニット単位にまとめると指す先が消える → `Commit:` は同じユニットの 1 コミットを名指し、step の時点では空のまま
  - close で切ったチケットの名前の規則が無い → close で切ったチケットは `ex-<NN>-<step-name>`
  - `read` の合否基準（期待値）を書く欄が無い → `### read` に「何が返れば合格か」の欄がある
- Depends: なし
- Action: build
- Files: `.pi/skills/tickets/SKILL.md`, `.pi/skills/tickets/references/format.md`
- Verify: read

### step 2: work.commit-grouping

- What:
  - 1 step = 1 コミットで、ひとつのユニットが 4〜6 コミットに散る → ユニットの終わりに 1 コミットにまとまる
  - チケットが step のハッシュを指す → ハッシュを書くのは `squash.mjs` で、step の時点では空のまま
- Depends: step 1
- Action: build
- Files: `.pi/skills/work/SKILL.md`, `.pi/skills/work/scripts/squash.mjs`
- Verify: test, cli, read

### step 3: work.cycle-run

- What:
  - 作業の単位が曖昧（ユニット / チケット / サイクル） → 作業はサイクル単位で進み、最後に止まって報告する
  - ユニット単位のレビューが無い → ユニットの検証のあと、コミットの前にレビューが 1 回入る（観点は 2〜4 個、渡すファイルは名指し）
  - step 7 が `tickets/references/format.md` を指していない → `work/SKILL.md` step 7 が `../tickets/references/format.md` を指している
  - 報告が step ごとで、最後に止まって報告する形が無い → 報告はサイクルの最後に 1 回で、そこで止まる
- Depends: step 2
- Action: build
- Files: `.pi/skills/work/SKILL.md`
- Verify: read

### step 4: work.check

- What: 単位の `Then` を全部、1 回で確かめる
- Depends: step 3
- Action: verify
- Files: なし
- Verify: cli, read

### step 5: close-skill

- What:
  - レビューの観点が網羅的で、渡すファイルを名指ししていない → `close/SKILL.md` の `The review's checklist` が 2〜4 個で、渡すファイルが名指しされ、観点に「owner が見て同意したか」「直しが owner の指摘に答えているか」が入っている
  - レビューの前に owner が見て同意する順序が書かれていない → 手順が owner → レビュー → コミット の順で、レビューは 3 回までのループで収束する
  - close で切ったチケットの名前の規則が手順に無い → close で切ったチケットは `ex-` で名指しする
- Depends: step 1
- Action: build
- Files: `.pi/skills/close/SKILL.md`
- Verify: read

### step 6: secret-guard

- What:
  - 「シェルを真似ない」という線が決まっておらず、穴 3 つ（`cat${IFS}.env`、`cat .env;ls`、`~` の展開のずれ）がどこにも書かれていない → 線と穴 3 つが `guard.ts` の doc と `consult/README.md` の `## Trust` に書いてある
- Depends: なし
- Action: build
- Files: `.pi/extensions/consult/child/guard.ts`, `.pi/extensions/consult/README.md`
- Verify: read

### step 7: consult.prompt

- What:
  - 子への指示を argv で渡しており、`-` や `@` で始まる文書で壊れる → 子への指示は stdin で渡る
- Depends: step 6
- Action: build
- Files: `.pi/extensions/consult/child/spec.ts`, `.pi/extensions/consult/run/run.ts`, `.pi/extensions/consult/README.md`
- Verify: test, read

### step 8: consult.policy

- What:
  - `review` の出力上限が 120k で、レビューが長引く → `review` は 40 ターン / 出力 60k
  - 型の定義が読めないときの文面が、原因を問わず「コミットしてある。復元しろ」と言い切る → 文面は原因で分かれている
- Depends: なし
- Action: build
- Files: `.pi/extensions/consult/types.json`, `.pi/extensions/consult/policy/types.ts`
- Verify: test, form

### step 9: consult.background

- What:
  - `consult` の呼び出しは、子が全部終わるまで親を止める（並列でも待つ） → 子は既定でバックグラウンドで走り、親は待たずに次の作業ができる（結果はメッセージで届く）
- Depends: step 7
- Action: build
- Files: `.pi/extensions/consult/tool/consult.ts`, `.pi/extensions/consult/index.ts`, `.pi/extensions/consult/run/run.ts`, `.pi/extensions/consult/README.md`
- Verify: test, read

### step 10: consult.check

- What: 単位の `Then` を全部、1 回で確かめる
- Depends: step 9
- Action: verify
- Files: なし
- Verify: cli, look

### step 11: definition-skill

- What:
  - 手順に、Type / Who の変更を明示的に聞く段が無い → 手順の最初の段が、Type / Who の変更の有無を明示的に聞く
  - `What to build` が owner の 1 回の確認に見え、Now / Then を詰める段が無い → `What to build` の段が、ユニットごとの `Now` / `Then` を owner と詰める 2 段になっている
  - レビューの観点が網羅的で、渡すファイルを名指ししていない → `definition/SKILL.md` の `The review's checklist` が 2〜4 個で、渡すファイルが名指しされ、観点に「owner が見て同意したか」「直しが owner の指摘に答えているか」が入っている
  - レビューの前に owner が見て同意する順序が書かれていない → 手順が owner → レビュー → コミット の順
  - レビューの結果を owner に報告し、自分の意見を添えて議論する段が無い → レビューのあとに、結果の報告と自分の意見を添える段がある
  - レビューの回数が 3 回まで → レビューは 2 回まで
- Depends: なし
- Action: build
- Files: `.pi/skills/definition/SKILL.md`
- Verify: read

### step 12: stack-skill

- What:
  - レビューの観点が網羅的で、渡すファイルを名指ししていない → `stack/SKILL.md` の `The review's checklist` が 2〜4 個で、渡すファイルが名指しされ、観点に「owner が見て同意したか」「直しが owner の指摘に答えているか」が入っている
  - レビューの前に owner が見て同意する順序が書かれていない → 手順が owner → レビュー → コミット の順で、レビューは 3 回までのループで収束する
- Depends: なし
- Action: build
- Files: `.pi/skills/stack/SKILL.md`
- Verify: read

### step 13: plan-skill

- What:
  - レビューの観点が網羅的で、渡すファイルを名指ししていない → `plan/SKILL.md` の `The review's checklist` が 2〜4 個で、渡すファイルが名指しされ、観点に「owner が見て同意したか」「直しが owner の指摘に答えているか」が入っている
  - レビューの前に owner が見て同意する順序が書かれていない → 手順が owner → レビュー → コミット の順で、レビューは 3 回までのループで収束する
- Depends: なし
- Action: build
- Files: `.pi/skills/plan/SKILL.md`
- Verify: read

## Structure

```text
.pi/
  extensions/
    consult/
      README.md          update
      index.ts           update
      types.json         update
      child/
        guard.ts         update
        spec.ts          update
      policy/
        types.ts         update
      run/
        run.ts           update
      tool/
        consult.ts       update
  skills/
    close/
      SKILL.md           update
    definition/
      SKILL.md           update
    plan/
      SKILL.md           update
    stack/
      SKILL.md           update
    tickets/
      SKILL.md           update
      references/
        format.md        update
    work/
      SKILL.md           update
      scripts/
        squash.mjs       add
```

## What to keep

- なし
