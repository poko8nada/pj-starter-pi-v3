# DESIGN 033

## Affected

### 01: コンサルの結果の届き方と「終わった」の判定を、記録の 1 本の通り道に揃えるか

- `.pi/extensions/consult/tool/worktree.ts` — `readRuns` と `isRunning` で記録を読み、作業場の使用中判定と一覧に使う。
- `.pi/extensions/consult/tool/worktree.test.ts` — `appendRun` で記録を作り、作業場の削除可否の振る舞いを確かめる。

## External

### 01: コンサルの結果の届き方と「終わった」の判定を、記録の 1 本の通り道に揃えるか

- `pi` の拡張 API — 印の無い行の本文を `pi.sendMessage` で渡す。
- 記録の置き場 — 完了を 1 行（本文と走行の値）で書き、セッションが定期的に読み直す。旧 `notice` 行も読む。
- セッションのライフサイクル — `session_start` でタイマーを起こし、`session_shutdown` で止める。
- サブエージェントのプロセスの生死 — 一覧と音の判定の材料にする。

## `record-delivery`

### ADR & Where

- No: 01
- Why: 記録の形と、それを読む配達・一覧・音が同じ印に乗るので、分けると片方だけでは検査が通らない。待つ plan は無い。
- Where: worktree

### Summary

- 完了を記録の 1 行（本文と走行の値）にし、セッションが記録を定期的に読み直して、印の無い行を `pi.sendMessage` で渡す。渡したら、その行に印を書く。
- 一覧と音は、印の無い行の有無で「まだ / 終わった」を決める。
- `notice` の 2 行書きと、目録の 1 値による二重配達を消す。

### Paths

- `.pi/extensions/consult/run/delivery.ts`
- `.pi/extensions/consult/run/log.ts`
- `.pi/extensions/consult/tool/consult.ts`
- `.pi/extensions/consult/index.ts`
- `.pi/extensions/consult/index.test.ts`
- `.pi/extensions/consult/tool/subagents.ts`
- `.pi/extensions/consult/tool/sound.ts`
- `.pi/extensions/consult/tool/worktree.ts`
- `.pi/extensions/consult/README.md`
- `.pi/extensions/consult/run/delivery.test.ts`
- `.pi/extensions/consult/run/log.test.ts`
- `.pi/extensions/consult/tool/consult.test.ts`
- `.pi/extensions/consult/tool/subagents.test.ts`
- `.pi/extensions/consult/tool/sound.test.ts`
- `.pi/extensions/consult/tool/worktree.test.ts`

### Boundary

- Plans: なし
- External:
  - `pi` の拡張 API: 本文を `pi.sendMessage` で渡す。
    - Contract: 古い `pi` は使えない。渡すのは、いまのインスタンスの `pi`。
  - 記録の置き場: 完了を 1 行で書き、定期的に読み直す。旧 `notice` 行も読む。
    - Data: `<CONSULT_ROOT>/records/<project>/<日付>.jsonl` と `delivered.json`。読む窓は 2 日、保持は 30 日。
  - セッションのライフサイクル: `session_start` でタイマーを起こし、`session_shutdown` で止める。
    - Contract: タイマーは factory で起こさない。
  - サブエージェントのプロセスの生死: 一覧と音の判定の材料にする。
    - Env: `ps -p <pid> -o lstart=`、`process.kill(pid, 0)`。
