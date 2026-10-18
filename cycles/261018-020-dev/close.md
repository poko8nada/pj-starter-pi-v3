# Close 020

## Collected

### intent-questions (ADR 01, 02, 03, 04, 05, 06, 07, 08 / Scope `Unit.intent-router`)

1. 463 / Slice 6 (統合: 意図通りに動ける) / `ls .pi/extensions/intent-router/logs` は、repo にこのディレクトリが無い（gitignore された実行時のファイル）ので、そのままでは走らせられなかった。代わりに `git ls-files` で日付の jsonl が 0 件であることを確かめた。実行時にできるのは `logs/recent.json` だけ。`JUDGE_QUESTIONS`（複数形・新形）は plan の通りなので残す（単数形の旧名は 0 件）。plan の `read` 検査は subagent の口が無いため自分で行った：設定の表は `settings.json` と一致、コマンドは 5 つと一致、説明は 3 択と促しの形。
   - Doing: slice 6 の統合検査で、記録を置くディレクトリに日付のファイルが残っていないことと、ファイルが `logs/recent.json` の 1 つだけになることを確かめようとしていた。
   - Left: 作業場のツリーに `logs/` が無かったので、`ls` の代わりに `git ls-files` を使い、日付の jsonl が 0 件であることだけを見た。`recent.json` は、拡張が動いたセッションの後でないとできない。
   - Cost: 「ファイルが 1 つだけになる」ことは、最初にセッションで動かすまで確かめられない。記録のパスは `index.test.ts:14` が `logs/recent.json` として検査しており、repo に古い日付のファイルは無い。
2. 487 / Review Round 1 / Notes で記録済みとして、logs の扱い、`Record` から `IntentRecord` への改名、旧設定形の除去、`includeTools` を残したことの 4 つを、指摘として数えなかった。
   - Doing: レビューの Round 1 で、Notes の `Findings` と `Unplanned` に書いてある穴を、もう一度指摘として数えるかどうかを見ていた。
   - Left: どれも記録済みなので、指摘にしなかった。4 つのうち害になるのは `includeTools` の中身だけで、あとの 3 つは名前と文書の話だった。
   - Cost: 一覧の中身がこの環境と合っていなかった。このセッションで使える道具は `read` `bash` `write` `quick_edit` `target_edit` `grep` `web_search` `source_check` `fetch_content` `get_search_content` `codemode` `consult_run` `consult_subagents` などで、一覧にあった `edit` `find` `ls` は出ていない。逆に、調べる道具（`codemode`、`fetch_content`、`source_check`、`get_search_content`、`consult_subagents`）と編集の道具（`quick_edit`、`target_edit`）が載っていなかった。載っていない道具の結果は `latest` / `earlier` に入らない（`state/run.ts:101`）ので、それで調べた往復は、Jev からは「何も調べていない」ように見えていた。この行は `ex-include-tools` が閉じた。

### ex-include-tools (ADR 02, 03 / Scope `Unit.intent-router`)

3. 124 / Review Round 1 / `codemode` の空判定は既定の空と同じ値のため、分岐の有無を検査が区別しない。
   - Doing: slice 1 で `codemode` の target を空に決め（1 回の束ねた呼び出しを 1 件として数える）、その値を検査で確かめていた。
   - Left: 空は `default` が返す値と同じなので、枝があっても無くても検査は緑になる。観測値が変わらないので指摘にしなかった。
   - Cost: 枝を消しても気づけない。枝を消しても動きは変わらないので害は無い。
4. 125 / Review Round 1 / `find` の枝が `targetOf` に残った（`edit` `ls` の枝は消えた）。
   - Doing: slice 1 で `edit` と `ls` の枝を消し、既定の一覧から `edit` `find` `ls` を落としていた。落とす理由は「このセッションの道具一覧に出ていない」だった。
   - Left: `find` の枝は、独自の設定で `find` を戻した人が正しく動くように残した。
   - Cost: pi 本体には `edit` `find` `ls` の道具がある（`dist/core/tools/index.js` の `allToolNames`）。このセッションで使える道具は pi の全部ではなく、プロファイルが選んだ範囲。一覧を固定で持つと、選ばれる道具が変わったときに、載せたい物が漏れる（`ex-include-tools` が直したのと同じ形の穴）。
5. 126 / Review Round 1 / 一覧の中身を固定しない検査（`run.test` の循環）。
   - Doing: slice 1 で「既定の一覧の道具は通り、落ちた `edit` は通らない」検査を足していた。
   - Left: 一覧の中身は plan が決めた値なので、検査は `defaultSettings().state.includeTools` をそのまま回し、13 個を名前で書かない。
   - Cost: 一覧から道具が 1 つ抜けても、この検査は緑のまま。抜けを止めるのは judge の代表 3 件（`fetch_content` / `codemode` / `quick_edit`）の検査だけ。
6. 127 / Review Round 1 / README の表の空白揃えが変わった（整形のみ）。
   - Doing: slice 1 で README の表の `state.includeTools` の行を書き換えていた。
   - Left: 行を書き換えたので表全体の空白が揃い直した。意味は変わらないので指摘にしなかった。
   - Cost: 無し。

## Triage

- 1: dropped (ADR 05 / `Unit.intent-router`): 記録を置く場所は `settings.record.recent` と `index.ts` の配線で決まっており、そのパスは `index.test.ts` が検査している。実際の `ls` は、最初に拡張が動いたセッションで自然に確かめられる。直す必要が無い。
- 2: ex-plan ex-include-tools (ADR 02, 03 / `Unit.intent-router`): 記録に載せる道具の一覧をこのセッションの 13 個に合わせ、`targetOf` に訳を足した。done ff41540
- 3: dropped (ADR 03 / `Unit.intent-router`): `codemode` の空は `default` の空と同じ値で、枝を消しても動きが変わらない。検査が分岐を区別できないが、害が無い。
- 4: dropped (ADR 02, 03 / `Unit.intent-router`): 一覧を固定で持つ弱点は残るが、いま使える道具は記録に載っており、漏れは起きていない。道具の選択が変わったときに見直せばよい。
- 5: dropped (ADR 02 / `Unit.intent-router`): 一覧の中身は plan が決めた値なので、検査で名前を固定しない。代表 3 つの検査が絞りを裏付けている。直す必要が無い。
- 6: dropped (ADR 04 / `Unit.intent-router`): 表の空白揃えだけで、意味は変わらない。直す必要が無い。
