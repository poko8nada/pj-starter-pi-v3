# PLAN `ex-review-diff`

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

## 1.レビューに、diff を自分で読ませる

### Types

なし

### Steps

1. `.pi/skills/work/references/tasks.md`:
   - `## Review (a `review` subagent)` の囲みの 1 行目（plan md を読む行）の次に、diff を自分で読む行を足す。範囲は `<base hash>..HEAD` で、`git diff`、`git status`、`git log` はこの役に許されていると書く。
   - 「can this diff close the plan?」の `this diff` が、その 1 行を受けるようにする。

2. `.pi/skills/work/SKILL.md`:
   - 手順 6 の 1 つ目を、plan md と `<base hash>` を渡し、レビューが自分で `git diff <base hash>..HEAD` を打つ、と直す。
   - diff の中身をタスクに貼るとは書かない（貼る必要が無い）。

### Verify:

- read: `review` サブエージェントが `.pi/skills/work/references/tasks.md` と `.pi/skills/work/SKILL.md` を読み、次の各ケースを報告する
  - (happy) `tasks.md` のレビューの囲みを読む → `git diff <base hash>..HEAD` を自分で打てと書かれている
  - (happy) `tasks.md` のレビューの囲みを読む → `git diff`、`git status`、`git log` はこの役に許されていると書かれている
  - (happy) `SKILL.md` の手順 6 を読む → レビューが自分で `git diff <base hash>..HEAD` を打つと書かれている
  - (error) 両方を読む → diff の中身をタスクに貼るとは書かれていない
  - _no case_: 実際のレビューが diff を読むか — 次のサイクルのレビューで分かる

## 2.統合: レビューの依頼と手順が、同じ diff の読み方を指すこと

### Types

なし

### Steps

1. 2 つのファイルを読む:
   - レビューの囲みと手順 6 の範囲が、同じ `<base hash>..HEAD` であることを確かめる。
   - `## Files`、`Verify`、`## Notes`、`## Review`、`### Round 1` の名前が、2 つの間で揃っていることを確かめる。
   - 直す所があれば直す。

### Verify:

- read: `review` サブエージェントが 2 つのファイルを読み、次の各ケースを報告する
  - (happy) レビューの囲みと手順 6 を照らす → 同じ範囲 `<base hash>..HEAD` で、同じ「レビューが自分で打つ」向きである
  - (empty) `SKILL.md` の手順 6 を読む → 手順の番号が 6 のままで、`references/tasks.md` の名前が変わっていない
  - (error) レビューの囲みを読む → `## Review`、`### Round 1`、`- Doubts:` の名前が、手順 6 と揃っている
  - _no case_: 次のサイクルのレビューが diff を読むか — 次のサイクルで分かる

## Notes

### Slice 1: レビューに、diff を自分で読ませる

- Findings: なし
- Unplanned: なし
- Commit: 6f9440d

### Slice 2: 統合: レビューの依頼と手順が、同じ diff の読み方を指すこと

- Findings: なし
- Unplanned: なし
- Commit: なし（読み直しだけで、ファイルは動いていない）

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
