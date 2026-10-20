# PLAN `work-steps`

## Files

```text
.pi/
  skills/
    work/
      SKILL.md                update
      references/
        tasks.md              update
```

## Slices

## 1.テストの整理のステージを足す

### Types

なし

### Steps

1. `.pi/skills/work/SKILL.md`:
   - 手順に、スライスの後のテストの整理のステージを足す。順番を、スライス、テストの整理、review、acceptance、merge と書く。
   - 走らせる者を、スライスを走らせた `code` サブエージェントの続きとする。
   - 走査の対象を、その plan の `Files` が `update` するテストファイルとする。
   - 対象にする条件を 3 つ書く。同じ振る舞いを 2 つ以上のテストが確認している、その振る舞いがもう無い、この plan の変更で作られなくなった分岐のテスト。
   - 記録の置き場を、plan md の `## Notes` のスライス以外のセクションとする。
   - テストの整理を plan のスライスにしないことと、その理由（何が古くなったかは変更の後にしか分からない）を書く。

2. `.pi/skills/work/references/tasks.md`:
   - `code` サブエージェントへ渡す文に、テストの整理の段を足す。走査の対象と 3 つの条件と、記録の置き場を書く。
   - スライスの段と同じ形にする。

### Verify:

- read: `review` サブエージェントが `.pi/skills/work/SKILL.md` と `.pi/skills/work/references/tasks.md` を読み、次の各ケースを報告する
  - (happy) `SKILL.md` の手順を読む → スライス、テストの整理、review、acceptance、merge の 5 つが、この順に並んでいる
  - (happy) `SKILL.md` を読む → 走らせる者が、スライスを走らせた `code` サブエージェントの続きと書かれている
  - (happy) `SKILL.md` を読む → 走査の対象が、その plan の `Files` が `update` するテストファイルと書かれている
  - (happy) `SKILL.md` を読む → 同じ振る舞いを 2 つ以上のテストが確認している、その振る舞いがもう無い、この plan の変更で作られなくなった分岐のテスト、の 3 つが並んでいる
  - (happy) `SKILL.md` を読む → 記録が plan md の `## Notes` のスライス以外のセクションと書かれている
  - (happy) `SKILL.md` を読む → テストの整理を plan のスライスにしないことと、その理由（何が古くなったかは変更の後にしか分からない）が書かれている
  - (happy) `tasks.md` を読む → 同じ 3 つの条件と、走査の対象をその plan の `Files` が `update` するテストファイルとし、記録の置き場を plan md の `## Notes` のスライス以外のセクションとして書いている
  - (happy) `tasks.md` の形を読む → スライスの段と同じ形（節の囲みと、その下の箇条）になっている
  - (empty) `SKILL.md` の手順を読む → スライス、review、acceptance、merge の段が消えずに残っている
  - (error) 2 つを読む → テストの整理を plan のスライスにするとも、対象を全テストとするとも書いていない
  - _no case_: 文面の読みやすさ — 読む者の判断であり、機械では決まらない

## 2.マージの後に base の依存を揃える段を足す

### Types

なし

### Steps

1. `.pi/skills/work/SKILL.md`:
   - マージの手順に、マージの後に base で依存を揃える段を足す。
   - 揃えるコマンドを lockfile で決めると書く。`pnpm-lock.yaml` があれば `pnpm install` である。
   - 依存を揃えた後に、通しの typecheck と test を走らせると書く。

### Verify:

- read: `review` サブエージェントが `.pi/skills/work/SKILL.md` を読み、次の各ケースを報告する
  - (happy) マージの手順を読む → マージの後に base で依存を揃える段がある
  - (happy) その段を読む → 揃えるコマンドを lockfile で決めると書かれている
  - (happy) その段を読む → 揃えた後に通しの typecheck と test を走らせると書かれている
  - (empty) 手順の全体を読む → スライスから merge までの段が消えずに残っている
  - _no case_: 実際に依存が揃うか — 依存が動くサイクルで分かる

## 3.統合: work が、テストの整理と依存の揃えを含む手順になっていること

### Types

なし

### Steps

1. `.pi/skills/work/SKILL.md`:
   - 手順の全体を通して読み、スライス、テストの整理、review、acceptance、merge、マージの後の依存揃えの順に並んでいることを確かめる。
   - `references/tasks.md` の名前と、節の番号を揃える。

### Verify:

- look: owner が `git diff <base hash> .pi/skills/work/` と `.pi/skills/work/SKILL.md` を読み、答える
  - (happy) owner が手順を読む → スライス、テストの整理、review、acceptance、merge、マージの後の依存揃えの 6 つが、この順に並んでいると読める
  - (empty) `git diff .pi/skills/work/` を見る → 足した段だけで、他の段が動いていない
  - (error) 手順の番号と本文からの参照を照らす → 番号が続き、参照が指す番号が実在し、`references/tasks.md` の名前が実在する
  - _no case_: 次のサイクルで使いやすいか — 次のサイクルで分かる

## Notes

### Slice 1: テストの整理のステージを足す

- Findings: なし
- Unplanned: なし
- Commit: 1994105

### Slice 2: マージの後に base の依存を揃える段を足す

- Findings: なし
- Unplanned: なし
- Commit: 6324faf

### Slice 3: 統合: work が、テストの整理と依存の揃えを含む手順になっていること

- Findings: なし
- Unplanned: テストの整理の走らせる者に、base の plan では agent がやると添えた。base の plan には `code` サブエージェントが居ないため。
- Commit: 78a8ea8

## Review

### Round 1

- Stale:
  - review の開始条件が `when slices are done` のまま残り、直前に足されたテスト整理の後を指していない — 本変更が古くした: `.pi/skills/work/SKILL.md:58`
    - fixed: 開始条件を「スライスとテストの整理が終わった時」に直した。
- Unlisted:
  - なし
- Gaps:
  - なし
- Unproven:
  - なし
- Doubts:
  - `.pi/skills/work/SKILL.md:3` の説明と `:12` の列挙にテスト整理が無いが、元から手順の全体列挙ではなく本変更が古くした物ではないため finding にしない。
  - `.pi/skills/work/SKILL.md:52` の `drops them, and keeps the suite green` と `:53` 後段 `and a slice carries a Verify of its own` は Steps の文言に無いが、Files が `update` と名指した内の詳述であり、base 括弧は `## Notes` の Unplanned に記録済みのため Unlisted/Gaps にしない。
  - Slice 3 の 6 つの順序・番号連続・参照実在は `look` の check が覆うため、指示通り Gaps/Unproven にしない。

### Round 2

- Stale: なし（Round 1 の1件は直っている。`.pi/skills/work/SKILL.md:58` が `when the slices and the test cleanup are done` になっており、手順 §4 Run the slices → §5 Clean the tests → §6 Review の順序と一致する。旧文言 `when slices are done` は同ファイルに残っていない）
- Unlisted: なし（Round 1 に fixed 行なし。確認対象なし）
- Gaps: なし（Round 1 に fixed 行なし。確認対象なし）
- Unproven: なし（Round 1 に fixed 行なし。確認対象なし）
- Doubts: なし（fixed 行の確認範囲では新しい疑いは無い）

## Acceptance

- Ran: slice 1 の `read`（10 ケース、1 回）、slice 2 の `read`（4 ケース、1 回）、slice 3 の `look`（オーナー）、review の Round 1（1 件、fixed）と Round 2（なし）、`pnpm typecheck`（root: ok、`.pi`: ok）、`pnpm test:run`（41 files、704 tests）である。壊して確かめたのは 2 つで、走査の対象を全テストに、マージの後の依存揃えの段を落とすと、どちらも赤になって戻した。
- Findings: なし。review の Round 1 の 1 件は `fixed` で、Round 2 が確かめている。
- Doubts: `SKILL.md:3` の description は手順を全部は挙げていないので、テストの整理を足しても古びていないと読んだ（review の Doubt のとおり）。
