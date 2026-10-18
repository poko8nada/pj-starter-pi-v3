# PLAN `brief-skill`

## Files

```text
.pi/
  skills/
    brief/
      SKILL.md              add
DEFINITION.md               update
README.md                   update
README.ja.md                update
```

## Slices

## 1.スキルの本文

### Types

なし

### Steps

1. `.pi/skills/brief/SKILL.md`:
   - frontmatter に `name: brief` と description を書く。description は「owner がサイクルを始めると言った時」で発火する形にし、2 文で書く。
   - 冒頭に、ADR の前段であり、決めたことを ADR が書くという位置づけを書く。
   - 収束点を 4 つ書く。対象が 1 つに決まる、`Context` が埋まる、`Options` が埋まり採らなかった理由が一言で言える、決定が乗る事実が `Research & Trial` に書ける。
   - 収束点が選択肢の数では測れないことを書く。
   - 手順を 6 段で書く。意図を詰める、調べる内容を提案して承認を取る、調べる、選択肢を出す、議論する、必要ならトライアルをして決める。
   - 意図は、エージェントが「こう理解した」と先に書いて owner に直してもらう形で詰めると書く。
   - 宣言文だけで調べ始めると対象が見当違いになると書く。
   - 調べる型を 3 つ書く。公式情報、ソースコード、実際に使われている形である。
   - 承認された範囲だけを調べ、結果を分かったことと分からなかったことに分けて出すと書く。
   - トライアルの対象を書く。Stack か、その場で簡単にできる確認事項である。
   - ファイルを作らないことと、`memo-*` は残す義務が無いことを書く。
   - 調べた情報は ADR に持ち込まないことを書く。必要になったら調べ直す方が新しい。
   - 使う名前をハーネスが配る物に限ることを書く。この repo の中身の名前は出さない。
   - 採らなかった案と一行の理由は ADR の `Options` に残るので、ここでは残さないと書く。
   - 定義の行に落とすのは ADR の仕事であり、ここでは定義の形に縛られないと書く。

### Verify:

- read: `review` サブエージェントが `.pi/skills/brief/SKILL.md` を読み、次の各ケースを報告する
  - (happy) 冒頭を読む → ADR の前段であり、決めたことを ADR が書くと書かれている
  - (happy) 収束点の節を読む → 4 つが並んでいる
  - (happy) 収束点の節を読む → 選択肢の数では測れないと書かれている
  - (happy) 手順を読む → 6 段が番号つきで並んでいる
  - (happy) 手順 1 を読む → 「こう理解した」と先に書き、owner に直してもらうと書かれている
  - (happy) 手順 1 を読む → 宣言文だけで調べ始めないと書かれている
  - (happy) 手順 2 を読む → 型が 3 つ、公式情報とソースコードと実際に使われている形と書かれている
  - (happy) 手順 3 を読む → 承認された範囲だけを調べ、結果を 2 つに分けて出すと書かれている
  - (happy) 手順 5 を読む → トライアルの対象が Stack かその場でできる確認事項と書かれている
  - (happy) 残さない物を読む → ファイルを作らないことと `memo-*` の義務が無いことが書かれている
  - (happy) 残さない物を読む → 調べた情報を ADR に持ち込まないと書かれている
  - (happy) 残さない物を読む → 定義の行は ADR の仕事であり、ここでは縛られないと書かれている
  - (happy) 手順 6 を読む → 採らなかった案と一行の理由が ADR の `Options` に残ると書かれている
  - (happy) 名前の節を読む → ハーネスが配る名前に限ると書かれている
  - (boundary values) description を読む → 2 文である
  - (error) 本文の名前に目を通す → repo 固有の名前（スキル、拡張、検査の道具）が出てこない
  - _no case_: 文面の読みやすさ — 読む者の判断であり、機械では決まらない

## 2.統合: `brief` が ADR に渡せる状態で終わること

### Types

なし

### Steps

1. `DEFINITION.md`:
   - `Users can do` に `brief-skill` の 1 行を足す。ADR 022 の 01 の `Definition Change` の文をそのまま使う。

2. `README.md`:
   - `five skills` を `six skills` にし、一覧に `brief` の 1 行を足す。既存の行と同じ形にする。

3. `README.ja.md`:
   - `5 つ` を `6 つ` にし、一覧に `brief` の 1 行を足す。既存の行と同じ形にする。

### Verify:

- look: owner が `.pi/skills/brief/SKILL.md` と `git diff DEFINITION.md README.md README.ja.md` を読み、答える
  - (happy) owner が本文を読む → `brief` の終わりが ADR の `Context` と `Options` と `Research & Trial` に収まる、と答える
  - (empty) `git diff DEFINITION.md` を見る → 増えた行は 1 行で、削除も変更も無い
  - (boundary values) `git diff README.md README.ja.md` を見る → 数が 6 になり、足した行が隣の行と同じ字下げと同じ区切りになっている
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
