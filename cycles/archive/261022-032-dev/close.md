# Close 032

## Collected

### drop-intent-router (ADR 02 / Scope なし)

1. 112 / Review Round 1 / `cycles/` 内の `intent-router` 残存は記録であり stale としない — `cycles/261022-032-dev/adr.md:66` が複製不要を決定し、Slice 3 の grep が `--exclude-dir=cycles` を明示 (`cycles/261022-032-dev/plan/drop-intent-router.md:77`)
   - Doing: 参照が残っていないことを、`cycles/` の外に限って確かめる。
   - Left: `cycles/` は過去の記録で、grep から外した。
   - Cost: なし。消えた拡張の記録は残す。

2. 113 / Review Round 1 / `logs/*.jsonl` の削除が diff に出ないのは tracked file が無いためで、ディレクトリごと削除に含まれる — ADR は設定と記録ごと削除を決定 (`cycles/261022-032-dev/adr.md:63`)、手順はディレクトリごと削除 (`cycles/261022-032-dev/plan/drop-intent-router.md:26`)
   - Doing: 拡張のディレクトリを、設定と記録ごと消す。
   - Left: `logs/*.jsonl` は未追跡で、worktree には無かった。merge の後、base に残っていた 5 日分を手で消した。
   - Cost: なし（消した）。次に同じことが起きると、merge 直後は `test ! -e` が落ちる。

### prune-card-tokens (ADR 01 / Scope なし)

3. 133 / Slice 2 (カードの文面を、前後のトークンと件数にする) / `entry/render.ts` の展開の描画（`paintExpanded`）を試験で通せない。Markdown がグローバルなテーマを要求し、試験環境では初期化できない。 / left: 文面は `cardText` で確かめており、描画は同じ helper を並べるだけ。
   - Doing: カードの展開を描く。
   - Left: Markdown がグローバルなテーマを要求し、試験で初期化できない。
   - Cost: 展開の並びは owner の `look` と `cardText` でしか押さえていない。並びを崩しても試験は緑。

4. 160 / Review Round 1 / ADR 01 の展開順（見出し→省略→秒数→空行→要約、adr.md:16）と実装の新順（見出し→要約→空行→省略→秒数）がずれているが、Notes slice 3 に Unplanned として記録済みのため所見にしない — `cycles/261022-032-dev/adr.md:16`
   - Doing: 展開の並びを決めて実装する。
   - Left: owner の `look` で並びを変えたので、記録より実装が先になった。
   - Cost: なし（ADR 01 を最終の並びに直した）。

5. 161 / Review Round 1 / render.test の `droppedTokens: 1309` は chars 1234 からの `ceil/4`（309）と一致しないが、表示試験の任意値でよく整合性検査は plan が要求しないため所見にしない — `.pi/extensions/context-prune/entry/render.test.ts:24`
   - Doing: 表示試験の値を決める。
   - Left: 表示だけに使う任意値で、記録の整合性は要求していない。
   - Cost: なし。

## Triage

- 1: dropped (ADR 02 / `Unit.intent-router`): `cycles/` の記録は残す。grep の対象外でよい。
- 2: dropped (ADR 02 / `Unit.intent-router`): merge 後に base で手で消した。
- 3: dropped (ADR 01 / `Unit.context-prune`): owner の `look` が押さえており、文面は `cardText` で検査している。
- 4: dropped (ADR 01 / `Unit.context-prune`): ADR 01 を最終の並びに直した。
- 5: dropped (ADR 01 / `Unit.context-prune`): 表示試験の任意値。
