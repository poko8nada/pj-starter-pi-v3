# PLAN `adr-front`

## Files

```text
.pi/
  skills/
    adr/
      SKILL.md              update
README.md                   update
README.ja.md                update
```

## Slices

## 1.`adr` の文面

### Types

なし

### Steps

1. `.pi/skills/adr/SKILL.md`:
   - description を狭める。`brief` か `propose` を経た問いを受ける形にし、サイクル開始の宣言は受けないと書く。
   - `## Cycle` の 1 つ目の項目を、前段が問いを決めていることを受ける形に書き換える。宣言はここに来ない。
   - entry 2 を「前段の記録を `Context` に落とす」に書き換える。talk をここで繰り返さない。
   - entry 4 の `Research & Trial` を「決定の根拠だけを書く」に狭める。前段で調べたことは書かない。
   - 採らなかった案と一行の理由は `Options` に残すという規則を、そのまま残す。
   - entry 3 の「選ぶのはここではない」という規則を、そのまま残す。
   - `references/format.md` は触らない。

### Verify:

- read: `review` サブエージェントが `.pi/skills/adr/SKILL.md` を読み、次の各ケースを報告する
  - (happy) description を読む → `brief` か `propose` を経た問いを受け、サイクル開始の宣言は受けないと書かれている
  - (happy) `## Cycle` の 1 つ目の項目を読む → 前段が問いを決めていることを受ける形になっている
  - (happy) entry 2 を読む → 前段の記録を `Context` に落とすと書かれている
  - (happy) entry 4 を読む → 決定の根拠だけを書くと書かれている
  - (happy) entry 3 を読む → 採らなかった案と一行の理由を `Options` に残す規則が残っている
  - (happy) entry 3 を読む → 選ぶのはここではないという規則が残っている
  - (error) entry 2 を読む → talk をやり直す記述が残っていない
  - _no case_: `references/format.md` — 触らないと決めたので、確かめない

## 2.統合: 3 つのスキルの入口が重ならないこと

### Types

なし

### Steps

1. `README.md`:
   - `adr` の 1 行から、調べることと試すことを外す。前段が担うようになったためである。

2. `README.ja.md`:
   - `adr` の 1 行から、調べることと試すことを外す。前段が担うようになったためである。

### Verify:

- read: `review` サブエージェントが 3 つのスキルの description と 2 つの README の `adr` の行を読み、次の各ケースを報告する
  - (happy) 3 つの description を読む → 宣言は `brief`、次に何をするかの問いは `propose`、決まった問いは `adr` に分かれている
  - (boundary values) `brief` の宣言だけを渡す → `adr` の発火条件に合わない
  - (error) 前段を通らない問いを渡す → `adr` が受けないと読める
  - (boundary values) 2 つの README の `adr` の行を読む → どちらも調べることと試すことが外れ、残りは同じである
  - _no case_: 実際の発火 — スキルの選択は実行時に決まり、ここでは文面だけを読む

## Notes

### Slice 1: `adr` の文面

- Findings:
- Unplanned:
- Commit:

### Slice 2: 統合: 3 つのスキルの入口が重ならないこと

- Findings:
- Unplanned:
- Commit:

## Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Unproven:
- Doubts:

## Acceptance

- Ran:
- Findings:
- Doubts:
