# consult.commit

Acceptance:

- `consult_commit{worktree}` が worktree でコミットし、`committed: <hash>` / `rejected: <フックの出力>` / `no change` を返す
- 親は id だけで呼べる（tmp のパスを知らない）
- フック拒否は理由として返り、作業は worktree に残っている
- コミットメッセージは道具が型（`consult(<unit>): <何をした>`）で作る（引数の抜け道を作らない）
- merge はしない（親のブランチ側は CLI）
- `commitWorktree`（道具の内側で差分からコミットする道）が消える
- ref の契約（`run/refs.ts` / `tool/refs.ts` / `consult_refs`）が消える

Owner: at the end

## Todo

- `.pi/extensions/consult/tool/commit.ts`（新規）
  - `consult_commit` の `worktree` 検証と、worktree での `git add -A` + `git commit`
  - メッセージを `consult(<unit>): <何をした>` の型で作る
  - フックの出力を捕まえ、`rejected` として返す（作業は消さない）
  - 変更が無ければ `no change`
- `.pi/extensions/consult/run/run.ts`
  - `commitWorktree` を消す（コミットは道具が分けて行う）
  - ref を作る道（`run/refs.ts` の呼び出し）を消す
- `.pi/extensions/consult/run/refs.ts`（削除）、`.pi/extensions/consult/tool/refs.ts`（削除）
- `.pi/extensions/consult/index.ts`
  - `consult_commit` を登録し、`consult_refs` の登録を消す
- テスト: `.pi/extensions/consult/tool/commit.test.ts`（新規）、`.pi/extensions/consult/run/run.test.ts`（`commitWorktree` を外す）、`.pi/extensions/consult/run/refs.test.ts`（削除）

## Verify

### test

- `pnpm test:run consult/tool/commit consult/run/run`（10 ケース）
  - 変更のある worktree → `committed: <hash>` が返り、そのハッシュが worktree の HEAD になる（happy）— 1 行目を決める
  - 変更が無い worktree → `no change`（empty）— 1 行目を決める
  - フックが拒否する worktree（pre-commit を落とす）→ `rejected: <フックの出力>` が返り、変更が worktree に残っている（error）— 1・3 行目を決める
  - 存在しない worktree の id → エラー（error）— 2 行目を決める
  - `worktree` を省く → エラー（error）— 2 行目を決める
  - コミットメッセージ → `consult(<unit>): ` で始まる（happy）— 4 行目を決める
  - `message` を渡す → 引数として受け付けない（invalid input）— 4 行目を決める
  - 同じ worktree で 2 回呼ぶ → 2 回目は `no change`（a second call）— 1 行目を決める
  - 道具の中に `merge` の語と `run/refs` の取り込みが無い（happy）— 5・7 行目を決める
  - `commitWorktree` と `run/refs.ts` と `tool/refs.ts` が消えている（happy）— 6・7 行目を決める
  - 権限: 該当なし（理由: 親の worktree の中で完結する）
  - 同時実行: 該当なし（理由: unit 内は直列で、同じ worktree に同時に書かない）

## Notes

### Findings

- `ref-cleanup` 拡張は既に無かった（`.pi/extensions/` は consult / quality-gate / sound-notify のみ）
  - なぜ外か: 設計は「consult の ref は消える」と言い、008 で作った `ref-cleanup` が残っていれば新しい `consult/<unit>` ブランチを消しうる
  - 観測: 探索しても無い。だから衝突しない。`ls .pi/extensions/` が 3 つだけだった
- チケットが消すと言っていた `tool/refs.test.ts` は存在しなかった（消したのは 3 つ: `run/refs.ts` / `tool/refs.ts` / `run/refs.test.ts`）
  - 観測: `ls tool/refs* run/refs*` で 3 つだけ。無いファイルを `git rm` するとコマンド全体が落ちるので、分けて消した

### Unplanned

- `.pi/extensions/consult/run/run.test.ts`: `commitWorktree` の検査（3 つ）と、それだけが使っていた補助（`recorder` / `spawnSync` / `runGit` / `vi` / `afterEach` / `GitOutput` の取り込み）を外した
  - なぜ: 面が消えたため（検査の総数は 2 減ったが、道具の検査 8 つを `tool/commit.test.ts` に置いたので実質は増えている）
- `.pi/extensions/consult/tool/commit.ts`: `execute` の `details` を `{ worktree, outcome }` にした（親が id と結果を機械で読めるように）
  - なぜ: `details` は agent には渡らないが、呼び出し側とテストの読み口になるため

Commit: aa9b64b
