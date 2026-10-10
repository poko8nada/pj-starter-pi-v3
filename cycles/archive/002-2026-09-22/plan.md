# PLAN 002

## Steps

### step 0: prepare

- Install: なし
- Cleanup: なし
- Refactor: なし

### step 1: consult.types

- What: type は `research`、`review`、`trial`、`code`
  - 設定は配列
  - 各 type は次の項目を持つ
    - モデル（候補の配列）
    - ツール
    - 環境
    - 上限
    - 役割
  - 呼び出し側が渡すのは type と task と入力だけ
  - 設定は呼び出しごとに読む
  - setup の誤りは投げる
  - 上限は暫定
    - `research` 40/40k
    - `review` 20/20k
    - `trial` 50/50k
    - `code` 60/60k
- Depends: なし
- Action: build
- Files: `.pi/extensions/consult/types.ts`、`types.test.ts`、`types.example.json`、`spec.ts`、`index.ts`、`.gitignore`
- Tests: `types.test.ts`
  - 未知の type は投げる
  - 上書きの口が無い
  - 検証: model・tools・environment・limits・role
  - 数字は形で見る

### step 2: consult.models

- What: モデル候補を順に試す
  - 子が 1 つも assistant を返さずに死んだら次の候補へ
  - 尽きたら `--model` を渡さず親と同じ設定で走る
- Depends: `consult.types`
- Action: build
- Files: `.pi/extensions/consult/spec.ts`、`run.ts`、`run.test.ts`
- Tests: `run.test.ts`
  - 1 番目で走れば 1 回で終わる
  - 使えなければ次へ
  - 尽きたら `--model` なし
  - タスク失敗では乗り換えない

### step 3: consult.inputs

- What: 入力ごとに 1 体走らせる
  - 実行中の失敗は子ごとの状態として返す
- Depends: `consult.models`
- Action: build
- Files: `.pi/extensions/consult/run.ts`、`index.ts`、`run.test.ts`
- Tests: `run.test.ts`
  - 入力 1 つで 1 体
  - 入力ごとの成否が並ぶ
  - setup の誤りだけ投げる

### step 4: consult.code

- What: 書き込む子は worktree で走る
  - コミットして ref を返す
  - worktree は消える
  - ref は残る
- Depends: `consult.inputs`
- Action: build
- Files: `.pi/extensions/consult/run.ts`、`index.ts`、`run.test.ts`
- Tests: `run.test.ts`
  - ref が返る
  - worktree が消える
  - 親は取り込まずに終われる

### step 5: consult.readme

- What: type の書き方と ref の受け取り方を README に書く
  - type の書き方（候補の順・役割・上限）
  - ref の受け取り方
- Depends: `consult.code`
- Action: build
- Files: `.pi/extensions/consult/README.md`
- Tests: なし（書いた手順を 1 回走らせて確かめる）

### step 6: consult.check

- 単位を step に割った締め
- What: 単位の `Then` を全部、1 回の実演で確かめる
- Depends: step 1〜5
- Action: verify
- Files: なし
- Tests: なし（実演が確かめ）

### step 7: definition-skill

- What: サイクルの始まりと終わりをスキルにする
  - 1 枚を書く
  - 前を閉じる
  - 承認を待つ
  - 型はスキルが持つ
- Depends: `consult.check`
- Action: build
- Files: `.pi/skills/definition/SKILL.md`
- Tests: 実演
  - 子に `definition` だけを読ませる
  - 002 の 1 枚を再現させる
  - 7 節が出るか
  - 印が出るか

### step 8: stack-skill

- What: `Stack` の決め方と、足す前に試す手順をスキルにする
  - `Stack` の決め方
    - ハーネスが土台
    - 足した分だけを理由付きで書く
  - 足す前に試す手順
- Depends: `consult.check`
- Action: build
- Files: `.pi/skills/stack/SKILL.md`
- Tests: 実演
  - 子に 1 つライブラリを `trial` で試させる
  - 成否が本文で返るか

### step 9: plan-skill

- What: 定義からプランを作る手順をスキルにする
  - `step 0`
  - `Steps`
  - `Structure`
  - 承認を待つ
- Depends: `consult.check`
- Action: build
- Files: `.pi/skills/plan/SKILL.md`
- Tests: 実演
  - 子に 002 の定義からプランを書かせる
  - step の欄が全部埋まるか

### step 10: tickets-skill

- What: チケットの切り方と閉じ方をスキルにする
  - `Todo` と `Verify` の承認
  - 作業
  - 実演
  - `Commit`
- Depends: `consult.check`
- Action: build
- Files: `.pi/skills/tickets/SKILL.md`
- Tests: 実演
  - 子に 1 枚切らせる
  - `Verify` が書いた時点で走れる形か

### step 11: readme

- What: README に書く
  - 何が入っているか
  - 最初に何をするか
- Depends: step 7〜10
- Action: build
- Files: `README.md`
- Tests: なし（書いたコマンドを実際に走らせる）

### step 12: cleanup

- What: `CYCLE-DESIGN.md` を消す
  - スキルに吸収済み
  - 理由は git 履歴に残る
- Depends: step 7〜10
- Action: build
- Files: `CYCLE-DESIGN.md`
- Tests: なし（消した後 `pnpm check` が緑）

## Structure

```
.pi/extensions/consult/
  index.ts            update
  run.ts              update
  spec.ts             update
  types.ts            add
  types.example.json  add
  types.json          add（git 管理外）
  README.md           update
.pi/skills/
  definition/SKILL.md add
  stack/SKILL.md      add
  plan/SKILL.md       add
  tickets/SKILL.md    add
.gitignore            update
README.md             add
CYCLE-DESIGN.md       drop
```

## What to keep

- `AGENTS.md`（`agent-rules` が keep なので触らない）
- 足すものがない
  - `lefthook.yaml`
  - `package.json`
  - `tsconfig.json`
  - `vitest.config.ts`
- `.pi/extensions/quality-gate/`
- `.pi/extensions/sound-notify/`
- `cycles/`（成果物そのもの）
