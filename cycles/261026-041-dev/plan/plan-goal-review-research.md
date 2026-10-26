# PLAN `plan-goal-review-research`

- No: 02, 03, 04

## Files

```text
.pi/
  skills/
    plan/
      SKILL.md                update
      references/
        format.md             update
        tasks.md              update
    yolo/
      SKILL.md                update
    work/
      SKILL.md
      references/
        tasks.md
README.md                     update
README.ja.md                  update
```

## Slices

## 1.goal-read

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/plan/SKILL.md`:
   - 手順 1 でデザインの `Goal` と `Non-goal` を読み、`Goal` が観測すると定めた結果をテストケースとして `Steps` に書き、`Verify` を落とせるようにし、`Non-goal` に踏み込む手順を書かず、レビューがそれらを確かめるようにします。
2. `.pi/skills/plan/references/format.md`:
   - `Steps` と `Verify` の説明に、`Goal` が観測すると定めた結果のテストケースと、`Non-goal` に踏み込む手順を書かない規則を足します。
3. `.pi/skills/plan/references/tasks.md`:
   - レビューの入力にデザインの `Goal` と `Non-goal` を足し、`Verify` が `Goal` の結果で落ちることと、`Non-goal` に踏み込む手順が無いことを確かめるようにします。

### Verify

- Always:
  - `pnpm test:related <changed files>`（関連が無ければ `pnpm test:run`）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えた名前と説明の `grep`（古い文言が無いこと）
- Added: base — オーナーが、`Goal` が観測すると定めた結果のテストケースと `Verify` が落ちること、`Non-goal` に踏み込む手順の不在を読みます。

## 2.review-viewpoints

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/plan/SKILL.md`:
   - 手順 10 のレビューの観点を `Goal`、`Files`、`Types`、`Cases`、`Checks` に並べ直し、`Goal` は手順と検査の抜けと `Non-goal` の踏み込み、`Files` は `Files` のツリーの抜けと古くなる文書、`Types` は宣言の抜けと型規則の違反、`Cases` は `plan/references/format.md` の `## Test cases` の 6 規則、`Checks` は `Verify` が書いたとおりに走ることと、振る舞いを外したときに `Verify` が落ちることを見るようにします。
2. `.pi/skills/plan/references/tasks.md`:
   - レビューのタスクの観点を 5 つに並べ直し、各観点の確認内容（`Goal` の 2 点、`Files` の 2 点、`Types` の 2 点、`Cases` は `plan/references/format.md` の `## Test cases` の 6 規則、`Checks` の 2 点）を書きます。
3. `.pi/skills/yolo/SKILL.md`:
   - plan のステージのレビューの文面を、`Goal`、`Files`、`Types`、`Cases`、`Checks` の 5 観点に追随させます。

### Verify

- Always:
  - `pnpm test:related <changed files>`（関連が無ければ `pnpm test:run`）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えた名前と説明の `grep`（古い文言が無いこと）
- Added: base — オーナーが、`Goal`、`Files`、`Types`、`Cases`、`Checks` の 5 観点が `plan/references/format.md` の `## Test cases` の 6 規則と型規則を拾うことを読みます。

## 3.research-step

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/plan/SKILL.md`:
   - 書けない行ごとに、4 種類（コードの現状、呼ぶ相手の契約、ライブラリの作法、テストのダブルの形）のどれかでリサーチを回し、事実を `Files`・`Types`・`Steps` に書き、4 種類のどれにも当たらない不足は `Stopped` に理由を書いてオーナーに返し、レビューがその記載と理由を確かめ、問いの閾値を定める手順を足します。
2. `.pi/skills/plan/references/tasks.md`:
   - リサーチのタスク文に、コードの現状、呼ぶ相手の契約、ライブラリの作法、テストのダブルの形のどれかへの絞り、事実の `Files`・`Types`・`Steps` への置き場、その 4 つのどれにも当たらない不足の `Stopped` を書きます。
3. `.pi/skills/plan/references/format.md`:
   - `Stopped` の欄に、不足の理由を書く欄を足します。
4. `.pi/skills/yolo/SKILL.md`:
   - plan のステージのリサーチの文面を追随させます。
5. `README.md`:
   - plan の行に、リサーチの手順を足します。
6. `README.ja.md`:
   - plan の行に、リサーチの手順を足します。

### Verify

- Always:
  - `pnpm test:related <changed files>`（関連が無ければ `pnpm test:run`）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えた名前と説明の `grep`（古い文言が無いこと）
- Added: base — オーナーが、コードの現状、呼ぶ相手の契約、ライブラリの作法、テストのダブルの形のどれかへの絞り、事実の置き場、`Stopped` の理由、閾値を読みます。

## Notes

### Slice 1: goal-read

- Findings: なし
- Unplanned: なし
- Commit: 617537d
- Stopped: なし

### Slice 2: review-viewpoints

- Findings: なし
- Unplanned: 計画の `Steps` が観点の名前だけだったので、`plan/SKILL.md` の手順 10 を 5 観点の箇条書きにしました。
- Commit: 1fae8d0
- Stopped: なし

### Slice 3: research-step

- Findings:
- Unplanned:
- Commit:
- Stopped:

## Review

## Acceptance
