# Close 034

## Collected

### single-git-spawn (ADR 01)

1. 285 / Slice 1 (起動口を 1 つにする) / plan の grep `spawn(` は `run.ts` の `spawn('pi', ...)`（サブエージェント起動）にも当たるため、字面どおりの「3 ファイル 0 行」にはならない。git 起動に限った grep では lib の 1 行だけ・3 ファイル 0 行を確認した。 / left: `run.ts` は pi 起動に `spawn` が要る。plan の字面どおりには閉じられないので、git 限定で読んだ。
   - Doing: `lib/git-env.mjs` に `git()` を足し、`worktree.ts`、`run.ts`、`scaffold.mjs` の 3 か所をそこへ通していた。
   - Left: `run.ts` はサブエージェントの pi 起動に `spawn` を使い続けるので、`spawn(` の grep は git 以外にも当たる。git に限定した grep で「口が 1 つ」を読んだ。
   - Cost: `Verify` の字面は worktree で修正済みなので、コードの穴ではない。読む人が `left:` を辿る手間だけが残る。

2. test/setup.ts:28 / Close（cycle の外） / `test/setup.ts` が作っていた `pi-test-home-*` が OS の一時領域に 17,744 個残っている。
   - Doing: `test/setup.ts` が `mkdtempSync(join(tmpdir(), 'pi-test-home-'))` で `HOME` 用のディレクトリを作り、消していなかった。
   - Left: `test/setup.ts` はこの cycle で削除したが、既に作られた物はリポジトリの外にあり、plan の `Files` にも入らない。
   - Cost: ディスクを食う。作るコードは消えたので、これ以上は増えない。

## Triage

- 1: dropped (Unit.test-run): コードの穴ではない。plan の `Verify` は worktree で修正済みで、残るのは `left:` の説明だけ。
- 2: dropped (Unit.test-run): リポジトリの外の一時ファイルで、コードの変更を伴わない。1 回の削除で閉じる。
