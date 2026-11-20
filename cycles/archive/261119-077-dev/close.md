# Close 077

## Collected

### 01 consult-runtime (ADR 未特定)

1. 508 / Work Review Round 1 / `.pi/extensions/consult/index.ts:276` の `registerRunTool` 実行時の `new Date()` は `Notes` で「道具の実行時（入口の一種）」とされているが、`Policy` の「関数の内部で `new Date()` を読むこと」という禁止に当たるかどうかの所有者判断が要る。入口とみなすなら許容され、そうでないなら clock 注入への修正が要る。
2. 509 / Work Review Round 1 / `.pi/extensions/consult/sub/guard.ts:89` と `.pi/extensions/consult/sub/budget.ts:82` の `process.env` 読みは diff に含まれておらず、plan の `Files` の外だが、Goal の「入口で 1 回読む」に照らして別入口（子 pi プロセス）とみなすかどうかの所有者判断が要る。
3. 528 / Work Review Round 2 / 入口の「1 回だけ読む」の回数自体は検査で数えていない（`index.test.ts:452` は値の配線を見て、呼び出し回数は見ない）。値が渡る点は塞がったため finding とはしないが、回数の厳密さが必要かどうかの所有者判断が要る。

## Triage

- 1: dropped (ADR 03, `Unit.subagent-consult`)
  - Fact: `.pi/extensions/consult/index.ts:276` の `registerRunTool` 実行時の `new Date()` は、入口で `now: () => new Date()` として `createWorktreeTool` に渡されている。
  - Why: 入口で作られた時計を道具の実行時に読む形にしているため、実行環境の読みは入口に閉じている。この形は ADR の `Policy` の目的を満たす。
  - Then: なし
- 2: dropped (ADR 03, `Unit.subagent-consult`)
  - Fact: `.pi/extensions/consult/sub/guard.ts:89` と `.pi/extensions/consult/sub/budget.ts:82` は、`export default`（入口）で `process.env` を読む。
  - Why: どちらも子 pi プロセスの入口であり、実行環境の読みは入口に閉じている。
  - Then: なし
- 3: dropped (ADR 03, `Unit.subagent-consult`)
  - Fact: `index.test.ts` は入口の `place` の値を見て、`process.env` の呼び出し回数は見ない。
  - Why: 値が正しく渡ることを検査で確認すれば、「1 回だけ読む」の回数の厳密さは不要。
  - Then: なし
- 4: _ex-change_ (ADR 03, `Unit.subagent-consult`): done e5fd97f5
  - Fact: このサイクルで `max-params` 5 箇所と `no-shadow` 3 箇所の抑制コメントを追加した。
  - Why: スターターとして模倣してよい例にするため、linter 抑制コメントを残さない。
  - Then: `showRunningOnce`・`announceRunningSubagents`・`controlSubagent`・`beginRun`・テストの偽物をオブジェクト引数にし、`buildDeps`・`buildLaunch` の import を alias 化する。
- 5: _ex-change_ (ADR 03, `Unit.subagent-consult`): done ce2d42da
  - Fact: このサイクルで既定値の回帰を検出するために `@ts-expect-error` を 6 箇所追加した。
  - Why: 型が保証する前提をテストで再現しており、`design.md` の「A premise the types ... already guarantees is not reproduced in a test.」と、テストは実装の詳細に触れないという原則に反する。型定義そのものが既定値の回帰を防ぐ。
  - Then: `@ts-expect-error` を置いたテストを削除する。

## Verified

### subagent-consult

- Plans:
  - `consult-runtime`
- Result: OK
- Change: OK
- Fixed: 抑制コメントを解消した。`max-params` 5 箇所と `no-shadow` 3 箇所をなくすため、引数をオブジェクト化し、`controlSubagent` を `tool/control.ts` に移した（e5fd97f5）。型が保証する前提をテストで再現していた `@ts-expect-error` 6 箇所のテストを削除した（ce2d42da）。
