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

- Findings: なし
- Unplanned: なし
- Commit: 8c7828e consult(readme): align user READMEs with wording rules
- Stopped: なし

## Work Review

### Round 1

- Stale:
  - なし — 畳むからまとめる等の語換えは対応表どおりで見出し・リンク・コマンド・引用は残り、この差分が新たに古くした文書・コメント・テストはないことを差分で確かめた。
- Unlisted:
  - なし — 差分の4件がFilesの4件と一致することをstatで確かめた。
- Gaps:
  - なし — grepが3語をAddedの目視がworktree・見出し・表・コード・リンク・英語追随・体言止め・長文・引用・コマンド名を担い、テスト段がないためTest casesの対象もないことを確かめた。
- Unproven:
  - なし — テストの段がなく壊しても緑に残る振る舞い主張がないことを確かめた。
- Noise:
  - なし — テストの段がなく型や制約が決める断言や魔数・直書きの対象がないことを確かめた。
- Doubts:
  - 検証コマンドを自走せずCommitの記録と差分の読みに頼っている (`cycles/261101-050-dev/plan/readme.md:50`)。

## Acceptance

- Ran: `pnpm test:run` (62 files, 791 tests), `pnpm typecheck`, `pnpm lint`, `pnpm format:check`; the diff read of the 4 changed documents
- Findings: なし
- Doubts: なし
