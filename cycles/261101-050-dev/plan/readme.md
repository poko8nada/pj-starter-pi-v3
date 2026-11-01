# PLAN `readme`

- No: 04

## Files

```text
README.ja.md              update
README.md                 update
.pi/extensions/thinking-scrub/
  README.ja.md            update
  README.md               update
```

## Slices

## 1.利用者向け文書

### Types

なし

### Steps

1. `README.ja.md`:
   - `雛形`、`置き場`、`worktree`（日本語文中）、`畳む` を対応表の語に直し、基準に合わない行だけを直す。基準に合う行は残す。見出しの名前、リンク先、コマンド名（`consult_worktree`、`consult_commit` を含む）、ファイル名、見出しの階層、表、コードブロック、リンクの構造、引用は変えない。
2. `README.md`:
   - `README.ja.md` の表現の変更に対応する英文を追随させる。日本語の変更と関係ない英文と見出しは書き換えない。
3. `.pi/extensions/thinking-scrub/README.ja.md`:
   - `畳む`（`畳み込む`、`畳み込み` を含む）と基準に合わない行だけを直す。基準に合う行は残す。見出し、リンク、設定例、出力の引用、表とコードブロックの構造は変えない。
4. `.pi/extensions/thinking-scrub/README.md`:
   - 日本語の表現が変わった場合だけ、対応する英文を追随させる。日本語が変わっていない箇所の英文は書き換えない。

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `! grep -rnE '雛形|置き場|畳(む|み込|み)' README.ja.md .pi/extensions/thinking-scrub/README.ja.md` (the command exits 0 when there is no match)
- Added: the agent reads the diff for: the `worktree` in the Japanese text is `ワークツリー` while `consult_worktree` and `consult_commit` stay; the headings, the tables, the code blocks and the links keep their structure; the English `README.md` follows the Japanese changes; the 体言止め and the long sentences are corrected where the standard says; the quotes and the command names remain

## Notes

### Slice 1: 利用者向け文書

- Findings:
- Unplanned:
- Commit:
- Stopped:

## Work Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Unproven:
- Noise:
- Doubts:

## Acceptance

- Ran:
- Findings:
- Doubts:
