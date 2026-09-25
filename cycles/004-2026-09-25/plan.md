# PLAN 004

## Steps

### step 0: prepare

- Install: なし
- Cleanup: なし
- Refactor: なし
  - `consult` の組み替えは unit として step 3〜5 が持つ

### step 1: work-skill

- What: unit の実装を閉じる前に `review` の子へ当てる段を足す
  - 3 周で止める
  - 残りは owner に渡す
- Depends: なし
- Action: build
- Files: `.pi/skills/work/SKILL.md`
- Tests: 実演
  - 子に `tickets` と `work` だけを読ませ、1 枚を閉じさせる
  - unit の diff をレビューに当てた記録が `Notes` に残る
  - 3 周で止まる
  - `Notes` に `Findings` と `Unplanned` がある
  - 実演の後に残ったのは自分で消せるものだけ
  - 子のコミットは ref で返る
    - 親が取り込むかを言う
  - チケットの `Commit:` にハッシュが入る
  - レビューの findings に、直したか理由をつけて答えていないかが書いてある

### step 2: plan-skill

- What: 足すことが既定にならないようにする
  - 形を計画に書かせる
  - 層と向きを計画に書かせる
  - 差し替え点を計画に書かせる
- Depends: なし
- Action: build
- Files: `.pi/skills/plan/SKILL.md`、`.pi/skills/plan/references/format.md`
- Tests: 実演
  - 子に `plan` だけを読ませ、1 枚のプランを書かせる
  - `step 0` を含む `Steps` と `Structure` が出る
  - 全 step にファイル名とテスト名が入っている
  - 単位に無い step は `step 0` の `Cleanup` にある
  - 足した後の形の判断がある
  - 層と向きがある
  - 差し替え点がある
  - 構造の step が形で検証される
  - 次のスキルを名指ししていない
  - 承認までに触ったのはプランのファイルだけ（`git status` で見る）

### step 3: consult.split

- What: `index.ts` から整形と音を出す
  - 道具の面を分ける
  - 進行を分ける
  - 入口を分ける
  - 進行（道具の実行そのもの）は `tool/consult.ts`
  - 中身は書き換えない
- Depends: なし
- Action: build
- Files: `.pi/extensions/consult/index.ts`、`.pi/extensions/consult/tool/consult.ts`、`.pi/extensions/consult/tool/render.ts`
- Tests:
  - `spec.test.ts`
  - `run.test.ts`
  - `types.test.ts`
  - `child-guard.test.ts`
  - 実演: `index.ts` に登録以外が残っていない（`grep` で見る）

### step 4: consult.folders

- What: 残りを役割ごとのフォルダに移す
  - フォルダは `policy/` `child/` `run/`
  - 旧 4 ファイルは降ろす
  - 外から借りている 1 行（`ref-cleanup` の `gitEnv`）も貼り替える
- Depends: step 3
- Action: build
- Files:
  - `policy/types.ts`
  - `child/spec.ts`
  - `child/guard.ts`
  - `run/run.ts`
  - `tool/consult.ts`
  - `.pi/extensions/consult/README.md`
  - `.pi/extensions/ref-cleanup/index.ts`
  - 降ろす 4 つ
    - `types.ts`
    - `spec.ts`
    - `child-guard.ts`
    - `run.ts`
- Tests:
  - `policy/types.test.ts`
  - `child/spec.test.ts`
  - `child/guard.test.ts`
  - `run/run.test.ts`
  - 実演
    - `tool` は `run` を知っている
    - `run` は `child` を知っている
    - `child` は `policy` を知っている
    - 逆向きの辺が無い
    - `README` の `-e` とテストの場所が新しいパスを指している

### step 5: consult.check

- What: 単位の `Then` を全部、1 回の実演で確かめる
  - 新しい形で動く
  - 既存の検査を走らせる
  - 実際に起動する子 1 体
    - `review` の子に 003 の 1 枚を当て、上限に当たらないこと
  - `README` の表と `types.json` が一致する
- Depends: step 4
- Action: verify
- Files: なし
- Tests: なし（実演が検証）

### step 6: definition-skill

- What: 前の `Carry over` の各行を、この 1 枚のどこで受けたかが読めるようにする
- Depends: なし
- Action: build
- Files: `.pi/skills/definition/SKILL.md`、`.pi/skills/definition/references/format.md`
- Tests: 実演
  - 子に `definition` だけを読ませ、次の 1 枚を書かせる
  - 各行の受けた場所が読める
  - 8 節が出る
  - 次のスキルを名指ししていない
  - 承認までに触ったのは 1 枚だけ（`git status` で見る）

### step 7: close-skill

- What: サイクルを閉じる skill を作る
  - 全体を統合する
  - 完成形を `review` の子に当てる
  - findings を振り分ける
  - `Retro` を書く
- Depends: なし
- Action: build
- Files: `.pi/skills/close/SKILL.md`
- Tests: 実演
  - 子に `close` だけを読ませ、閉じを 1 本走らせる
  - 1 本の中で走る
    - 完成形が `review` の子に当たる
    - findings が振り分けられている
  - `Goal` を壊す穴はそのサイクルで直すと書いてある
  - `Retro` の形が出る
  - owner が閉じてよいと言う段がある

### step 8: agent-rules

- What: `AGENTS.md` をゼロベースで作り直す
  - 規則の一覧はチケットで合意する
- Depends: step 1, 2, 6, 7
- Action: build
- Files: `AGENTS.md`
- Tests: 実演
  - clone 直後のつもりで読み、サイクルの流れと規則が読める
  - どの規則も skill と重複していない

### step 9: readme

- What: README を実物に合わせる
  - 拡張の一覧を実物に合わせる
  - `close` の行を足す
  - 節の数を実物に合わせる
  - 各スキルの役割を実物に合わせる
  - 検査の数を実物に合わせる
- Depends: step 1, 2, 6, 7
- Action: build
- Files: `README.md`、`README.ja.md`
- Tests: 実演
  - clone 直後のつもりで読み、入っているものと最初の手順が言える
  - `grep` で数えて確かめる
    - 拡張の一覧が実物と一致する
    - 各スキルの役割が実物と一致する
    - 節の数が実物と一致する
    - 検査の数が実物と一致する

## Structure

```
.pi/extensions/consult/
  index.ts            update
  README.md           update
  policy/
    types.ts          add
  child/
    spec.ts           add
    guard.ts          add
  run/
    run.ts            add
  tool/
    consult.ts        add
    render.ts         add
  types.ts            drop
  spec.ts             drop
  child-guard.ts      drop
  run.ts              drop
.pi/extensions/ref-cleanup/
  index.ts                            update
.pi/skills/
  work/SKILL.md                       update
  plan/SKILL.md                       update
  plan/references/format.md           update
  definition/SKILL.md                 update
  definition/references/format.md     update
  close/SKILL.md                      add
AGENTS.md                             update
README.md                             update
README.ja.md                          update
```

## What to keep

- `AGENTS.md` は step 8 で作り直すので、ここには書かない（`agent-rules` が update）
- `consult` の直下に残すもの
  - `.pi/extensions/consult/types.json`
  - `.pi/extensions/consult/types.example.json`
- keep の単位
  - `.pi/extensions/ref-cleanup/`
  - `.pi/extensions/quality-gate/`
  - `.pi/extensions/sound-notify/`
  - `.pi/skills/stack/SKILL.md`
  - `.pi/skills/tickets/SKILL.md`
- 足すものがないもの
  - `lefthook.yaml`
  - `package.json`
  - `pnpm-lock.yaml`
  - `tsconfig.json`
  - `vitest.config.ts`
  - `.pi/tsconfig.json`
- `cycles/`（成果物そのもの）
