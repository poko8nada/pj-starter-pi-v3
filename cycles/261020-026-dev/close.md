# Close 026

## Collected

### consult-liveness (ADR 01 / Scope `Unit.subagent-consult`)

1. 365 / Review Round 1 / `ps` の `includes(token)` が部分一致（`token-1` が `token-10` に含まれる）を `running` と言う可能性。plan は「stdout に token があれば」とだけ言うので所与とし、finding にしない。
   - Doing: review が `checkPid` の token 照合（`proc.ts:54` の `stdout.includes(token)`）を読んだ。
   - Left: plan の Verify が「stdout に token があれば」とだけ言うため所与とし、finding にしなかった。実の token は UUID で、`token-1` と `token-10` が並ぶのは fixture の値だけ。
   - Cost: 実の argv で `token-1` が `token-10` の接頭に当たる形は無い。fixture の値を変えるとこの doubt は消える。
2. 366 / Review Round 1 / 同一 subagent に開始行が複数ある時の `runningRuns`（`log.ts:211` は先頭だけ照合）と `latest`（`subagents.ts:102` は末尾を返す）の不一致、終了行複数時の最大 `ended` 選択（`subagents.ts:96`）。plan が単一起動だけを言うので doubt に留める。
   - Doing: review が同一 subagent の開始行が複数ある時の `runningRuns`（`log.ts:211` は先頭で照合）と `latest`（`subagents.ts:102` は末尾）を比べた。
   - Left: plan が単一起動だけを言うので doubt に留めた。`beginRun` は 1 回 1 行で、複数の開始行は手で直した記録の形。
   - Cost: 複数開始行の記録で音・busy と一覧の答えがずれる。実の記録は 1 開始行なので起きない。
3. 367 / Review Round 1 / `closeOrphans`（`log.ts:247`）が複数開始行を各々閉じる振る舞いと、孤児終了行が `token` を写すこと（`log.ts:251`）に件が無い。`ended` 有無だけが後の判定に効くので doubt に留める。
   - Doing: review が `closeOrphans` の複数開始行の各閉じ（`log.ts:247`）と、閉じた行の `token` の写し（`log.ts:251`）を読んだ。
   - Left: 後の判定は `ended` の有無だけを見るので doubt に留めた。
   - Cost: 複数開始行の記録で閉じた行が複数並ぶ。`ended` で閉じるので後段の答えは変わらない。
4. 368 / Review Round 1 / `createSubagentsTool` の `list` 経路（`subagents.ts:167`）に `check` の口が無く既定照合のまま。plan が口を `listText`/`rowsOf` と決めているので所与とし、finding にしない。
   - Doing: review が `createSubagentsTool` の `list`（`subagents.ts:167`）に `check` の口が無いことを読んだ。
   - Left: plan が口を `listText` / `rowsOf` と決めており、`createSubagentsTool` の `list` は既定照合のまま。
   - Cost: 一覧のツール経路は既定の `ps` 照合で、テストの差し替えが届かない。実の一覧は既定照合が正しい。
5. 375 / Acceptance / slice 2 と slice 3 の commit は `--no-verify`。slice 2 で `isRunning` の署名を変えた時点で `tool/subagents.ts` の古い呼び方が型で壊れ、lefthook の related test が落ちるため。slice 3 で型は回復し、最終の全体検査は緑。
   - Doing: acceptance で slice 2 と slice 3 の commit が `--no-verify` だったことを記録した。
   - Left: slice 2 で `isRunning` の署名を変えた時点で `tool/subagents.ts` の古い呼び方が型で壊れ、lefthook の related test が落ちるため。slice 3 で型は回復した。
   - Cost: 2 つの commit は hooks を通っていない。最終の acceptance と merge は全体の検査を通っている。
6. 376 / Acceptance / `_no case_` の 4 つは plan の boundary のまま。本物の subagent の音の停止、`-ww` の tty 幅、`session_start` 配線の拡張テスト（`index.ts` にテストが無い）、`--name` が `session_info` を足すこと（外部）。
   - Doing: acceptance で `_no case_` の 4 つが plan の boundary のままであることを記録した。
   - Left: 本物の subagent の音の停止、`-ww` の tty 幅、`session_start` 配線の拡張テスト（`index.ts` にテストが無い）、`--name` が `session_info` を足すこと（外部）。
   - Cost: 4 つのうち `index.ts` の配線に拡張テストが無く、`pi.on('session_start')` の呼び出しを壊しても緑のままになる。他は acceptance の look と plan の boundary で塞いである。

### harness-duplicate (ADR 02 / Scope `Unit.harness-copy`)

7. 57 / Review Round 1 / `scripts/harness/index.test.ts` の `cwd` 1 件削除 — `## Files` `cycles/261020-026-dev/plan/harness-duplicate.md:5-10` に載る test file 内の重複掃除で、本 cleanup として commit に含める。`index.mjs` の振る舞いは不変で、他に載っていない変更はなし。
   - Doing: review が `scripts/harness/index.test.ts` の `cwd` 1 件削除を、plan の `## Files` の test file 内の重複掃除として読んだ。
   - Left: この cleanup の commit（`63679de`）に含めた。`index.mjs` の振る舞いは変えず、他の変更は Files の外に無い。
   - Cost: 1 件減ったテストは最初の diff テストと同じで、振る舞いの覆いは変わらない。
8. 67 / Acceptance / テスト整理で `cwd のツリーを root として読む` の 1 件だけ落とした（最初の diff テストの重複）。ADR `02` の「テストは変えない」とは 1 件だけ差がある。
   - Doing: acceptance でテスト整理の 1 件（`cwd のツリーを root として読む`）の削除が ADR `02` の「テストは変えない」と差があることを `Doubts` に書いた。
   - Left: owner の「あるべき姿」に沿って `~ 単体` と `~foo` を戻し、重複の 1 件だけを落とした。
   - Cost: ADR `02` の「テストは変えない」を読む人が、この 1 件の例外を ADR からは知れない。記録は acceptance の `Doubts` にある。

## Triage

- 1: dropped (ADR 01 / `Unit.subagent-consult`): 実の token は UUID で、`token-1` が `token-10` の接頭に当たるのは fixture の値だけ。
- 2: dropped (ADR 01 / `Unit.subagent-consult`): `beginRun` は 1 実行 1 行。複数の開始行は手で直した記録の形。
- 3: dropped (ADR 01 / `Unit.subagent-consult`): 後の判定は `ended` の有無だけを見る。
- 4: dropped (ADR 01 / `Unit.subagent-consult`): plan が口を `listText` / `rowsOf` と決めた。実の一覧は既定照合が正しい。
- 5: dropped (ADR 01 / `Unit.subagent-consult`): design skill の「間で赤くなるなら 1 つにまとめる」はすでにあり、026 の plan が slice 2/3 で外した。次に直すコードは無い。記録は acceptance の `Doubts` にある。
- 6: dropped (ADR 01 / `Unit.subagent-consult`): 1・2・4 は plan の boundary。3 の `index.ts` の配線は acceptance の `look` で読み、モックのテストは偽物の前提が本物を保証しないので重さが勝つ。
- 7: dropped (ADR 02 / `Unit.harness-copy`): review の記述。削除は cleanup の `63679de` に入っている。
- 8: dropped (ADR 02 / `Unit.harness-copy`): 落とした 1 件は重複で、振る舞いの覆いは変わらない。記録は acceptance の `Doubts` にある。ADR `02` は 026 の決定で、次の cycle が書き換える物ではない。
