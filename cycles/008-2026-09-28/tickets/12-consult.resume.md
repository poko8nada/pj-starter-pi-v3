# consult.resume

Acceptance:

- 止まった子の worktree を扱う口が無い（一覧も、続きも、片付けもできない）、が解ける: `list` が残った worktree を返し、`run` がその worktree をそのまま使って子を走らせ（既定で `--continue`。セッションが無ければ新しい会話）、`remove` がそれを消す
- `run` の型は呼ぶ側が選ぶ（調べるのは `research`、直すのは `code`）
- 停止の記録（理由、時刻）が worktree の外に、工具によって置かれている（子には書かせない）
- `consult/README.md` が追随している

Owner: at the end

## Todo

- `.pi/extensions/consult/tool/resume.ts`（add）
  - `PARAMETERS` — `action`（`list` / `run` / `remove`）、`id`、`type`、`task`
  - `list` — `run/stopped.ts` の記録を読み、`git worktree list` を `consult-` で絞り、いま走っている物（`state.children`）を除いて返す
  - `run` — 既存の worktree を `cwd` にして子を走らせる（`createWorktree` は呼ばない。`installDependencies` は既にあるので飛ばす）。既定で `--continue`。セッションが無ければ新しい会話に落ちる。結果は `consult_new` と同じ形（本文と、`ref` か、また止まったかの事実）
  - `remove` — その worktree を消す（親は外のパスを直接消せないため）
- `.pi/extensions/consult/run/resume.ts`（add）
  - 既存の worktree を渡して子を 1 回走らせる道（`runPi` の `cwd` と `--continue` の組み立て、上限、中断）
- `.pi/extensions/consult/index.ts`
  - `pi.registerTool` で `consult_resume` を足す（説明と prompt の guidelines も）
- `.pi/extensions/consult/run/stopped.ts`
  - `list` から使う読み出し（`consult.retry.reject` で作った物）
- `.pi/extensions/consult/README.md`
  - `consult_resume` の節（`list` / `run` / `remove`、`--continue` の既定、型の選び方）
- `.pi/extensions/consult/tool/resume.test.ts`（add）と `.pi/extensions/consult/run/resume.test.ts`（add）
  - `list` / `run` / `remove` の各道と、記録の置き場所を確かめる

## Verify

### test

- `pnpm test consult`（6 ケース）
  - 止まった worktree を作る → `list` がそれを返す（happy）
  - `run` で `research` を走らせる → 子が同じ場所で走り、報告が返る（happy）
  - `run` で `code` を走らせる → 直して `ref` ができる（happy）
  - 同じ worktree で 2 回目 → 会話が続いている（`--continue`）（happy）
  - セッションが無い状態で `run` → 新しい会話で走る（error からの回復）
  - 記録を書いたあと → worktree の直下に記録のファイルが無く、親ディレクトリ（worktree の外）にあり、`list` がそれを読める（happy）
  - `remove` → `git worktree list` から消える（happy）

### read

- `review` の子に `.pi/extensions/consult/README.md` を渡す
- 合格: `list` / `run` / `remove` と、`--continue` の既定、型を選べることが書いてある（1・2・4 行）

## Notes

### Findings

- なし

### Unplanned

- なし

### Stopped

- 落ちた検査の出力: lefthook の pre-commit。typecheck 3 件（`tool/resume.test.ts:21` に無い export `ResumeRunner`、`:72` の `job` が暗黙 any、`:148` の params に `action` が無い）と lint 3 件（`tool/resume.test.ts:141` / `:152` の関数を外へ、`tool/render.ts:91` の `result` が外の名前を隠す）
- 変えたファイル: `.pi/extensions/consult/index.ts`、`run/resume.ts`、`run/resume.test.ts`、`run/stopped.ts`、`tool/consult.ts`、`tool/render.ts`、`tool/resume.ts`、`tool/resume.test.ts`（コミットが拒否されたので作業ごと失われた）
- 子の最後の本文: 「Now I have a clear picture. Let me implement. Starting with the shared result block and the stop-record readout.」
- 走った回数: 2（1 回目がターン上限 60 で打ち切り、続きの 2 回目もコミットがフックに拒否された）
- 時刻: 2026-09-28 15:14
- worktree の id: なし（保持されず消えた。`git worktree list` に残っているのは crash 時の `consult-ZH2ntR/wt` だけ）
  - 未対応（次のサイクルで見る）: 拒否で 2 回目も通らなかったのに worktree が残っていない。step 10 の「残す」道（`attemptAndCommit` の `kept`）が効いていない可能性がある

Commit: なし（ターン上限で止まり、コミットがフックに拒否された）
