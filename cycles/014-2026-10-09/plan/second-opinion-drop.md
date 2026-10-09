# PLAN `second-opinion-drop`

## Files

```text
.pi/
  extensions/
    second-opinion/
      index.ts                 drop
      index.test.ts            drop
      types.json               drop
      README.md                drop
      child/
        budget.ts              drop
        budget.test.ts         drop
        guard.ts               drop
        guard.test.ts          drop
        spec.ts                drop
        spec.test.ts           drop
      policy/
        types.ts               drop
        types.test.ts          drop
      run/
        git-env.ts             drop
        log.ts                 drop
        log.test.ts            drop
        root.ts                drop
        root.test.ts           drop
        run.ts                 drop
      tool/
        answer.ts              drop
        answer.test.ts         drop
        conversation.ts        drop
        conversation.test.ts   drop
    consult/
      index.ts                 （触らない。`promptGuidelines` の "a second opinion" は consult_run の用途の説明で、この拡張を指していない）
  skills/
    adr/
      SKILL.md                 update
```

```text
README.md                      update
README.ja.md                   update
```

`.pi/extensions/second-opinion/run/git-env.ts` と consult 側の同名ファイルは中身が同じ（どちらも `gitEnvFor` / `runGit` を持ち、自分の `run.ts` の `gitEnv` を読む）。消えるのは second-opinion 側だけで、consult 側はこの plan では触らない（plan 2 が `gitEnv` を `lib/git-env.mjs` へ出す）。

README 2枚は plan 2 も触る（29行目）。plan 1 はその前に走る。

## Slices

1. second-opinion の拡張を消す
   - I/O: なし（消すだけ。型は動かない）
   - Verify:
     - form: worktree で `test ! -e .pi/extensions/second-opinion` が真（消えた後は `find` が非0で終わるので使わない）。`grep -rn "second_opinion\|second-opinion" .pi/` の残りが `.pi/skills/adr/SKILL.md:53` の1行だけ（slice 2 で消す）。`.pi/extensions/consult/index.ts:76` の "a second opinion" はこのパターンに一致しない＝触らない物
   - Steps:
     1. `.pi/extensions/second-opinion/`: ディレクトリごと消す（22ファイル）
2. `adr` スキルの手順6を、consult の `review` の子に差し替える
   - I/O: なし（文書）
   - Verify:
     - read: 子が `.pi/skills/adr/SKILL.md` の手順6を読み、(1) どのロールの子（`review`）を走らせるか、(2) 何を渡すか（`cycles/<NNN>/adr.md` の提案）、(3) 考慮もれ・調査もれ・実験もれの3観点で1回か、(4) 穴と自分の答えを添えて owner に見せ、意見を経てから決めるか、(5) 到着が後続メッセージでよいと書いてあるか、を報告する
   - Steps:
     1. `.pi/skills/adr/SKILL.md`: 手順6を書き換える。`second_opinion` と `focus` を消し、「この ADR を `review` の子に渡し、考慮もれ・調査もれ・実験もれの3観点で1回受け取る。穴と自分の答えを添えて owner に見せ、意見を経てから `Highlight` に載せる」にする。到着は後続のメッセージでよいと書く
3. README 2枚から second-opinion を外す
   - I/O: なし（文書）
   - Verify:
     - form: `grep -n "second_opinion\|second-opinion" README.md README.ja.md` が何も返さない。13行目の拡張一覧は4つの名前（`consult` / `quality-gate` / `sound-notify` / `intent-router`）を含んだまま（消し過ぎていない）
   - Steps:
     1. `README.md`: 13行目の拡張一覧から `second-opinion` を外し、18行目の `second_opinion` の行を消す
     2. `README.ja.md`: 13行目の拡張一覧と18行目の `second_opinion` の行を同じように直す
4. 統合: second-opinion の痕跡が消え、残るテストが緑のまま
   - I/O: なし
   - Verify:
     - test: worktree で `pnpm test:run` が緑（happy。second-opinion の9本が消え、本数もその分だけ減る。実測はこのスライスで記録する）
     - form: `grep -rn "second_opinion\|second-opinion" --exclude-dir=node_modules --exclude-dir=.git .` の残りが `cycles/` の文書だけ（011〜014 の記録）。陽性対照として `grep -n "a second opinion" .pi/extensions/consult/index.ts` が1件（触っていない物が残っている）
   - Steps:
     1. 上の2つを走らせ、減ったファイル数と本数を記録する

## Notes

### Slice 1: second-opinion の拡張を消す

- Findings: なし
- Unplanned: なし
- Commit: fe35f98

### Slice 2: `adr` スキルの手順6を、consult の `review` の子に差し替える

- Findings:
  - child read of step 6 not run; checked the 5 points by direct read instead (review role, `cycles/<NNN>/adr.md` proposal, 3 views once, holes plus own answers to owner before `Highlight`, later arrival)
    - `left: this worktree has no child runner (consult_run), so a review-role read could not be executed here`
- Unplanned: なし
- Commit: a296f55

### Slice 3: README 2枚から second-opinion を外す

- Findings:
- Unplanned:
- Commit:

### Slice 4: 統合: second-opinion の痕跡が消え、残るテストが緑のまま

- Findings:
- Unplanned:
- Commit:

## Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Unproven:

## Acceptance

- Ran:
- Findings:
