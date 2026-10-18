# PLAN `brief-skill`

## Files

```text
.pi/
  skills/
    brief/
      SKILL.md              add
      references/
        tasks.md            add
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
   - `references/tasks.md` にサブエージェントへ渡す文があると 1 行書く。
   - 収束点を 4 つ書く。吟味された選択肢が揃う、`Context` が埋まる、`Options` が埋まる、決定が乗る事実が `Research & Trial` に書ける。
   - 収束点が選択肢の数では測れないことを書く。
   - 手順を 7 段で書く。意図を詰める、調べる内容を提案する、調べる、選択肢を出す、owner と議論する、owner の合意を得てトライアルする、止まる。
   - 手順 5 を owner との議論の段にし、手順 6 を owner の合意を得てトライアルする段にし、手順 7 に止まることを書く。
   - 意図は、エージェントが「こう理解した」と先に書いて owner に直してもらう形で詰めると書く。
   - 意図が、後のすべての尺度になると書く。
   - 宣言文だけで調べ始めると対象が見当違いになると書く。
   - 調べる型を 3 つ書き、型ごとに何に答えるかを書く。公式情報とソースコードは実現可能性と用途への適切さ、実際に使われている形はそれを補強する材料である。
   - 研究の問いを 2 つ書く。発見（`compare`）と確認（`mechanism`、`triage`）である。発見はやり方が見えていない時だけと書く。
   - 調べるのは `research` サブエージェントに走らせ、型と問いの組で提案し、その答えが何を決めるかを添えると書く。
   - 承認された範囲だけを調べ、事実を出所つきで受け取ると書く。答えられなかった問いは、何を止めているかと一緒に受け取る。
   - 選択肢は、意図を満たす方法として書くと書く。可能な物の一覧にしない。
   - 事実が無い所は、トライアルか外すことで答えると書く。
   - トライアルの対象を書く。Stack か、その場で簡単にできる確認事項である。
   - トライアルは `trial` サブエージェントで走らせ、worktree で動くこと、書いた物が製品に入らないこと、共有の置き場に触る前に owner に聞くことを書く。
   - 採らなかった案と一行の理由は ADR の `Options` に残るので、ここでは残さないと書く。
   - 選択肢を定義の行にしないことを「そうしない」の節に書く。

2. `.pi/skills/brief/references/tasks.md`:
   - `research` サブエージェントへ渡す文を書く。問い、型ごとに何に答えるか、各事実の出所を残すこと、答えられなかった問いは何を止めているかを添えることを含める。
   - `trial` サブエージェントへ渡す文を書く。対象と設定、worktree で動くこと、報告する 3 つ（ぶつかる物、版、最小の形）、共有の置き場に触る前に owner に聞くこと、書いた物が製品に入らないことを含める。
   - 他のスキルの `references/tasks.md` と同じ形にする。前書きと、節ごとの囲みと、その下の箇条。

### Verify:

- read: `review` サブエージェントが `.pi/skills/brief/SKILL.md` と `.pi/skills/brief/references/tasks.md` を読み、次の各ケースを報告する
  - (happy) frontmatter を読む → `name: brief` である
  - (happy) 冒頭を読む → ADR の前段であり、決めたことを ADR が書くと書かれている
  - (happy) 本文を読む → `references/tasks.md` にサブエージェントへ渡す文があると書かれている
  - (happy) 収束点の節を読む → 吟味された選択肢が揃う、`Context` が埋まる、`Options` が埋まる、決定が乗る事実が `Research & Trial` に書けるの 4 つが並んでいる
  - (happy) 収束点の節を読む → 選択肢の数では測れないと書かれている
  - (happy) 手順を読む → 意図を詰める、調べる内容を提案する、調べる、選択肢を出す、owner と議論する、合意を得てトライアルする、止まるの 7 段が番号つきで並んでいる
  - (happy) 手順 1 を読む → 「こう理解した」と先に書き、owner に直してもらうと書かれている
  - (happy) 手順 1 を読む → 意図が、後のすべての尺度になると書かれている
  - (happy) 手順 1 を読む → 宣言文だけで調べ始めないと書かれている
  - (happy) 手順 2 を読む → 3 つの型と、型ごとに何に答えるか（実現可能性と用途への適切さ、それを補強する材料）が書かれている
  - (happy) 手順 2 を読む → 研究の問いが 2 つ、発見（`compare`）と確認（`mechanism`、`triage`）と書かれている
  - (happy) 手順 2 を読む → 発見はやり方が見えていない時だけと書かれている
  - (happy) 手順 2 を読む → 調べるのは `research` サブエージェントで走と書かれている
  - (happy) 手順 3 を読む → 承認された範囲だけを調べ、事実を出所つきで受け取ると書かれている
  - (happy) 手順 3 を読む → 答えられなかった問いは、何を止めているかと一緒に受け取ると書かれている
  - (happy) 手順 4 を読む → 選択肢は意図を満たす方法として書かれ、2〜4 個で、各案に得る物と失う物と実現性の引っかかりを添えると書かれている
  - (happy) 手順 4 を読む → 事実が無い所はトライアルか外すことで答えると書かれている
  - (happy) 手順 5 を読む → owner の前に選択肢を並べて議論する段であると書かれている
  - (happy) 手順 5 を読む → 外す案には理由の一行を添え、残る案は ADR の `Options` に載ると書かれている
  - (happy) 手順 6 を読む → トライアルはどんな場合でも owner の合意がいると書かれている
  - (happy) 手順 6 を読む → トライアルの対象が Stack かその場でできる確認事項と書かれている
  - (happy) 手順 6 を読む → トライアルは `trial` サブエージェントで worktree を走ると書かれている
  - (happy) 手順 6 を読む → 共有の置き場に触る前に owner に聞くと書かれている
  - (happy) 手順 7 を読む → 決めるのは ADR であり、ここでは決めないと書かれている
  - (happy) そうしないの節を読む → 選択肢を定義の行にしないと書かれている
  - (boundary values) description を読む → owner がサイクルを始めると言った時で発火する形で、2 文である
  - (error) 本文に目を通す → このハーネスの開発にだけある名前（`intent-router`、`quality-gate`、`consult`、`lefthook`、`oxlint`）が出てこない
  - (happy) `tasks.md` の `research` の節を読む → 型ごとに何に答えるか、出所を残すこと、答えられなかった問いは何を止めているかを添えると書かれている
  - (happy) `tasks.md` の `trial` の節を読む → worktree で走り、共有の置き場の前に owner に聞き、書いた物が製品に入らないと書かれている
  - (error) `tasks.md` に目を通す → このハーネスの開発にだけある名前が出てこない
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
  - (empty) `git diff DEFINITION.md` を見る → 増えた 1 行が ADR 022 の 01 の `Definition Change` と同じ文で、削除も変更も無い
  - (boundary values) `git diff README.md` を見る → 数が 6 になり、`brief` の 1 行が増え、既存の行と同じ形になっている
  - (boundary values) `git diff README.ja.md` を見る → 数が 6 になり、`brief` の 1 行が増え、既存の行と同じ形になっている
  - (error) 定義の行の書き方を `definition/rules.md` と照らす → `Who` の側から読め、2 語の名前になっている
  - _no case_: 実際のサイクルで使いやすいか — 次のサイクルで分かる

## Notes

### Slice 1: スキルの本文

- Findings: なし
- Unplanned: 本文と plan のケースのずれを 4 か所直した（`ADR` を repo 固有の名前に数えていた、`ソース` と `ソースコード`、手順 6 と手順 4 の取り違え、承認範囲の行が本文から落ちていた）。検査は本文を読むので、ケースが本文でなく plan を向いたままだと通らない。
- Commit: e666834

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
