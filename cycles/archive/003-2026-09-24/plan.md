# PLAN 003

## Steps

### step 0: prepare

- Install: なし
- Cleanup: なし
- Refactor: なし

### step 1: ref-cleanup.refs

- What: `consult` の ref を扱う純関数を作る
  - ref を一覧する
  - 消してよいかを判定する
  - git を触らずに判断だけ試せる形にする
- Depends: なし
- Action: build
- Files: `.pi/extensions/ref-cleanup/refs.ts`、`refs.test.ts`
- Tests: `refs.test.ts`
  - `consult/` で始まる ref だけが対象
  - それ以外は理由つきで拒む
  - 一覧は git の出力から作る

### step 2: ref-cleanup.tool

- What: pi の道具として登録する
  - 消す前に一覧を見せる
  - `consult` 以外の ref は拒む
- Depends: `ref-cleanup.refs`
- Action: build
- Files: `.pi/extensions/ref-cleanup/index.ts`、`refs.ts`
- Tests: `refs.test.ts`
  - 引数の組み立て
  - 拒否の理由が返る

### step 3: ref-cleanup.check

- 単位を step に割った締め
- What: 単位の `Then` を全部、1 回の実演で確かめる
  - ref を作る
  - 一覧が出る
  - 消える
  - `git branch` から消える
- Depends: step 1〜2
- Action: verify
- Files: なし
- Tests: なし（実演が確かめ）

### step 4: secret-guard.rules

- What: 秘密の規則を作る
  - 秘密とみなす名前を一覧する
  - 子に渡す拒否の規則を作る
  - git が無視する全部ではなく、名前で決める
- Depends: なし
- Action: build
- Files: `.pi/extensions/consult/guard.ts`、`guard.test.ts`
- Tests: `guard.test.ts`
  - `.env` が入る
  - `.envrc` が入る
  - `*.pem` が入る
  - `*.key` が入る
  - `node_modules` のような広いものは入らない
  - 規則が pi の設定の形に合う

### step 5: secret-guard.consult

- What: 子の起動にその規則を渡す（親の設定は変えない）
- Depends: `secret-guard.rules`
- Action: build
- Files: `.pi/extensions/consult/run.ts`、`run.test.ts`
- Tests: `run.test.ts`
  - 子の起動に規則が入る
  - 親の起動には入らない
  - 子の `read` が拒まれて「読めない」と報告する

### step 6: secret-guard.check

- 単位を step に割った締め
- What: 単位の `Then` を全部、1 回の実演で確かめる
  - 子に `.env` を読ませる
  - 拒否される
  - 親の `.env` が変わらない
- Depends: step 4〜5
- Action: verify
- Files: なし
- Tests: なし（実演が確かめ）

### step 7: consult.limits

- What: `review` の上限を上げる（定義 1 枚のレビューが入る大きさに）
- Depends: なし
- Action: build
- Files: `.pi/extensions/consult/types.example.json`、`types.json`
- Tests: 実演
  - 定義 1 枚のレビューが上限に当たらずに終わる
  - clone が受け取るのは `types.example.json` だけなので、そちらが実物と同じ値になっている

### step 8: consult.doc

- What: `input` の全文が子のプロンプトの先頭に payload として入るようにする
  - いまの経路を `run.ts` と `spec.ts` で読み、違えば直す
  - README の表を実物（`types.json` の上限）に合わせる
- Depends: `consult.limits`
- Action: build
- Files: `.pi/extensions/consult/run.ts`、`spec.ts`、`README.md`、`index.ts`
- Tests:
  - `spec.test.ts`
    - payload がプロンプトの先頭に入る
  - 実演
    - 子の返答が payload を引用する
    - README の表が実物と一致する

### step 9: consult.check

- 単位を step に割った締め
- What: 単位の `Then` を全部、1 回の実演で確かめる
  - type ごとの policy
  - agent が選べるのは type だけ
  - 入力ごとの 1 体
  - ref が返る
  - `input` の入り方
  - README の表
  - レビューが上限に当たらない
- Depends: step 7〜8
- Action: verify
- Files: なし
- Tests: なし（実演が確かめ）

### step 10: input-guard

- What: 空の入力を、子を走らせる前に拒む（理由つきで返す）
- Depends: `secret-guard.consult`（同じファイルを触る）
- Action: build
- Files: `.pi/extensions/consult/spec.ts`、`run.ts`、`spec.test.ts`、`run.test.ts`
- Tests: `spec.test.ts`、`run.test.ts`
  - 空のファイルは走らない
  - 理由が返る
  - 空の文字列も同じ
  - 入力なしは今までどおり 1 体

### step 11: work-skill

- What: チケットの合意後の進め方をスキルにする
  - 誰が作業するか決める
  - 子のコミットを ref で受け取る
  - 親が取り込むか決める
  - 実演で確かめる
  - 穴をどのフェーズに置くか決める
- Depends: step 1〜10
- Action: build
- Files: `.pi/skills/work/SKILL.md`
- Tests: 実演
  - 子に `tickets` と `work` だけを読ませ、1 枚を閉じさせる
    - ハッシュが `Commit:` に入る
    - `Notes` に `Findings` と `Unplanned` が入る
    - 子に任せたコミットが ref で返る
    - 実演のあと消せるものだけが残る

### step 12: definition-skill

- What: 本文の名指しと題材の規則を直す
  - 本文から次のスキルの名指しを消す
  - 子に見せる題材の規則を足す
- Depends: なし
- Action: build
- Files: `.pi/skills/definition/SKILL.md`
- Tests: 実演
  - 子に `definition` だけを読ませ、003 の 1 枚を書かせる
    - 7 節が出る
    - `Carry over` の全行がどこかに対応する
    - 承認まで `cycles/` 以外に変更が無い
    - 名指しが無い
    - 題材の規則が書いてある

### step 13: stack-skill

- What: `description` から、次を名指しする句を消す
- Depends: なし
- Action: build
- Files: `.pi/skills/stack/SKILL.md`
- Tests: 実演
  - 子に `stack` だけを読ませ、1 枚の `Stack` を書かせる
    - `Stack` が埋まる
    - 足した理由が差分で読める
    - `description` に次のスキルの名前が無い

### step 14: plan-skill

- What: `description` と `Cleanup` の書き方を直す
  - `description` の句を消す
  - 単位に無い step は `step 0` の `Cleanup` に置くと書く
- Depends: なし
- Action: build
- Files: `.pi/skills/plan/SKILL.md`
- Tests: 実演
  - 子に `plan` だけを読ませ、1 枚のプランを書かせる
    - `step 0` が出る
    - 全 step にファイルとテストが入る
    - 単位に無い step が `Cleanup` に行く
    - 承認までプラン以外に変更が無い
    - 名指しが無い

### step 15: tickets-skill

- What: `description` と本文を直す
  - `description` の句を消す
  - 合意したところで終わることを本文どおりにする
- Depends: なし
- Action: build
- Files: `.pi/skills/tickets/SKILL.md`
- Tests: 実演
  - 子に `tickets` だけを読ませ、1 枚切らせる
    - チケットが出て `Todo` と `Verify` の承認を取り、コミットされる
    - ハッシュを書くのは作業した側
    - 名指しが無い

### step 16: readme

- What: README の記述を直す
  - 節は 7 つ
  - tickets の行を分ける
  - 名指しをやめる
  - 検査の数を実物に合わせる
- Depends: step 1〜15
- Action: build
- Files: `README.md`、`README.ja.md`
- Tests: 実演
  - 書いたコマンドを全部走らせる
  - clone 直後のつもりで README だけを読み、何が入っているかと最初の手順が言えるか
  - 節の数が実物と一致する
  - tickets の行が実物と一致する
  - 検査の数が実物と一致する
  - 各スキルの役割が実物と一致する

## Structure

```
.pi/extensions/consult/
  guard.ts            add
  index.ts            update
  README.md           update
  run.ts              update
  spec.ts             update
  types.example.json  update
  types.json          update（git 管理外。上限の実物）
.pi/extensions/ref-cleanup/
  index.ts            add
  refs.ts             add
.pi/skills/
  definition/SKILL.md update
  stack/SKILL.md      update
  plan/SKILL.md       update
  tickets/SKILL.md    update
  work/SKILL.md       add
README.md             update
README.ja.md          update
```

## What to keep

- `AGENTS.md`（`agent-rules` が keep なので触らない）
- 足すものがないもの
  - `lefthook.yaml`
  - `package.json`
  - `pnpm-lock.yaml`
  - `tsconfig.json`
  - `vitest.config.ts`
  - `.pi/tsconfig.json`
- keep の単位
  - `.pi/extensions/quality-gate/`
  - `.pi/extensions/sound-notify/`
- `cycles/`（成果物そのもの）
