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

- （親がやり直した。子が 2 回止まった後の 3 回目）
  - `run/resume.ts`: `parseWorktreeList`（`git worktree list --porcelain`）/ `stoppedWorktrees`（`consult-XXXX/wt` の形を記録と一緒に拾う）/ `removeStopped`（worktree を外し、親ごと消す）
  - `tool/resume.ts`: `list`（id・居場所・理由・変えたファイル）/ `run`（その worktree で `attemptAndCommit` を走らせ、既定で `--continue`。型は呼ぶ側）/ `remove`。id 無し・知らない id・型無し・知らない action は理由付きで断る
  - `index.ts` に `consult_resume` を登録（説明と 3 つの guideline）
  - 検査: `run/resume.test.ts`（実物の git と worktree で 6 件、macOS の symlink は実パスで比較）と `tool/resume.test.ts`（口の 6 件）。**`run` の道は本物の `pi` が要るので検査していない**（周辺は `retry.test.ts` と `spec.test.ts` が覆う）
  - 未対応: `list` は「いま走っている子」を除外しない（`consult.ts` の `state.children` は worktree のパスを持たない）。走っている物は `consult_new` の `action: "list"` で見える
  - （検証 `consult-2` の指摘と、親の修正）
    - blocking（直した）: `--continue` が再走のときしか付いていなかった（受入 1 行目・README・道具の説明は「既定」と言う）→ `resumeArgs` が常に付ける。`runPi` に `signal` を渡していなかったのも直した（中断で走っている子が殺されない）
    - 修正: `README.md:130` と `index.ts:57` の「セッションが再開される」という書き方をやめ、「常に `--continue` を渡す。子は `--no-session` なので引き継ぐのは worktree とその変更」に直した
    - （直した）`tool/resume.test.ts` に `resumeArgs` の検査（`--continue` と `--no-session` を渡す）を足し、テストの頭の説明が実態と違っていたので直した
    - 未対応（blocking として残す）: `run` を本物の `pi` で走らせる検査が無い（`runPi` を起こす所）。argv は `resumeArgs` で覆ったが、走らせて `ref` ができる所は未検査
    - 未対応: `list` はいま走っている子の worktree を除外しない（チケットの `Todo` が名指し）。`execute` が runtime を受け取らず、`state.children` も worktree のパスを持たないので、いまの形では口が無い
    - （影響読み `consult-3` の指摘と、親の修正）
      - blocking（直した）: `README.md:9` が「two tools」のままで、道具の表にも `consult_resume` が無かった → 「three tools」と表の 1 行を足した
      - 直した: Tests 節に `run/resume.test.ts` と `tool/resume.test.ts` を足した。`README.md:133` の「記録から始まる」を実態（task があればそれ、無ければ止まった理由）に直した。`run/resume.ts` の頭のコメントが持っていない `run` を語っていたので直した
      - 未対応（blocking として残す）: `list` が走っている子の worktree を除外しない。`remove` は生きた worktree も `--force` で消せるので、走っている子の作業を失い得る
      - 未対応: `run` は `runWithFallback` を通さずモデル候補の 1 番目しか使わない（`consult_new` と形が違う）。打ち切りの回数を本文に出していない。ref 名の番号が常に 0 なので、同じ秒に 2 つ走らせると `git branch` が衝突して worktree が残る

### Unplanned

- `run/resume.ts` と `tool/resume.ts` を新しく作った（チケットの `Todo` どおり）。`tool/consult.ts` / `tool/render.ts` の共通化はしていない（`compose` と `refLabel` を借りただけ）
  - なぜ: 1 回目・2 回目の子が結果組み立ての共通化で行数に当たって失敗している。008 では借りる形にした（重複は残る）

### Stopped

- 落ちた検査の出力: lefthook の pre-commit。typecheck 3 件（`tool/resume.test.ts:21` に無い export `ResumeRunner`、`:72` の `job` が暗黙 any、`:148` の params に `action` が無い）と lint 3 件（`tool/resume.test.ts:141` / `:152` の関数を外へ、`tool/render.ts:91` の `result` が外の名前を隠す）
- 変えたファイル: `.pi/extensions/consult/index.ts`、`run/resume.ts`、`run/resume.test.ts`、`run/stopped.ts`、`tool/consult.ts`、`tool/render.ts`、`tool/resume.ts`、`tool/resume.test.ts`（コミットが拒否されたので作業ごと失われた）
- 子の最後の本文: 「Now I have a clear picture. Let me implement. Starting with the shared result block and the stop-record readout.」
- 走った回数: 2（1 回目がターン上限 60 で打ち切り、続きの 2 回目もコミットがフックに拒否された）
- 時刻: 2026-09-28 15:14
- worktree の id: なし（保持されず消えた。`git worktree list` に残っているのは crash 時の `consult-ZH2ntR/wt` だけ）
  - 未対応（次のサイクルで見る）: 拒否で 2 回目も通らなかったのに worktree が残っていない。step 10 の「残す」道（`attemptAndCommit` の `kept`）が効いていない可能性がある

Commit: 50b80d2 + f63ae9d + 9884188 + f573a1f（親の 3 回目。50b80d2 = `consult_resume` の実装、f63ae9d = 検査と README、9884188 = 検証の blocking（`--continue` が常に付く・`signal` が子に届く）、f573a1f = 影響読みの blocking（道具の表）と記録）
