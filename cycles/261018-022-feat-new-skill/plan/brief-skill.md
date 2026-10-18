# PLAN `brief-skill`

## Files

```text
.pi/
  skills/
    brief/
      SKILL.md              add
DEFINITION.md               update
```

## Slices

## 1.スキルの本文

### Types

なし

### Steps

1. `.pi/skills/brief/SKILL.md`:
   - frontmatter に `name: brief` と description を書く。description は「owner がサイクルを始めると言った時」で発火する形にする。
   - 収束点を 4 つ書く。対象が 1 つに決まる、`Context` が埋まる、`Options` が埋まり採らなかった理由が一言で言える、決定が乗る事実が `Research & Trial` に書ける。
   - 収束点が選択肢の数では測れないことを書く。
   - 手順を 6 段で書く。意図を詰める、調べる内容を提案して承認を取る、調べる、選択肢を出す、議論する、必要ならトライアルをして決める。
   - 意図は、エージェントが「こう理解した」と先に書いて owner に直してもらう形で詰めると書く。
   - 調べる型を 3 つ書く。公式情報、ソースコード、実際に使われている形である。
   - 調べるのは意図が固まってからにすると書く。宣言文だけで調べ始めると対象が見当違いになる。
   - トライアルの対象を書く。Stack か、その場で簡単にできる確認事項である。
   - ファイルを作らないことと、`memo-*` は残す義務が無いことを書く。
   - 調べた情報は ADR に持ち込まないことを書く。必要になったら調べ直す方が新しい。
   - 使う名前をハーネスが配る物に限ることを書く。この repo の中身の名前は出さない。
   - 採らなかった案と一行の理由は ADR の `Options` に残るので、ここでは残さないと書く。
   - 定義の行に落とすのは ADR の仕事であり、ここでは定義の形に縛られないと書く。

### Verify:

- read: `review` サブエージェントが `.pi/skills/brief/SKILL.md` を読み、収束点の 4 つ、手順の 6 段、調べる型の 3 つ、書かないこと（ファイル、調べた情報、名前、採らなかった案、定義の形）を報告する
  - (happy) 本文を読む → 4 つの収束点と 6 段の手順と 3 つの型が、決めた語のまま見つかる
  - (boundary values) description を読む → サイクル開始の宣言で発火する形になっている
  - (error) 書かれている名前に目を通す → repo 固有の名前（スキル、拡張、検査の道具）が出てこない
  - _no case_: 文面の読みやすさ — 読む者の判断であり、機械では決まらない

## 2.統合: `brief` が ADR に渡せる状態で終わること

### Types

なし

### Steps

1. `DEFINITION.md`:
   - `Users can do` に `brief-skill` の 1 行を足す。ADR 022 の 01 の `Definition Change` の文をそのまま使う。

### Verify:

- look: owner が `.pi/skills/brief/SKILL.md` と `DEFINITION.md` の増えた 1 行を読み、2 つを答える
  - (happy) owner が本文を読む → `brief` の終わりが ADR の `Context` と `Options` と `Research & Trial` に収まる、と答える
  - (empty) `DEFINITION.md` を読む → `Users can do` に `brief-skill` の 1 行が増え、他の行は動いていない
  - (error) 定義の行の書き方を `definition/rules.md` と照らす → `Who` の側から読め、2 語の名前になっている
  - _no case_: 実際のサイクルで使いやすいか — 次のサイクルで分かる

## Notes

### Slice 1: スキルの本文

- Findings:
- Unplanned:
- Commit:

### Slice 2: 統合: `brief` が ADR に渡せる状態で終わること

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
