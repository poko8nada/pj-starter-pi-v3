# PLAN `ex-prune-question`

## Files

```text
.pi/extensions/context-prune/
  prune/
    judge.ts              update
    judge.test.ts         update
    run.test.ts           update
  index.test.ts           update
  README.md               update
```

## Slices

## 1.質問を「後に要るか」にする

### Types

```ts
なし;
```

### Steps

1. `.pi/extensions/context-prune/prune/judge.ts`:
   - `instructions` を「後に読む・引用する・使う何かを持つか」に変え、`criteria` のキーを `keep` / `drop` にする。
   - `verdicts` が `probabilities.keep` を読み、`threshold` 以上を keep にする。
2. `.pi/extensions/context-prune/prune/judge.test.ts`:
   - 質問文と criteria のキーの試験を差し替え、`probabilities.keep` の読みの試験を足す。
3. `.pi/extensions/context-prune/README.md`:
   - Pass の説明の「要約の話題に関係あるか」を「後に要るか」に直す。

### Verify:

- test: `pnpm test:run .pi/extensions/context-prune`
  - (happy) `criteria` のキーが `keep` と `drop`
  - (happy) `instructions` に `need` が入り、日本語を含まない
  - (happy) `probabilities: { keep: 0.8 }` → keep
  - (boundary) `probabilities: { keep: 0.5 }` → keep（`threshold` は 0.5）
  - (error) `probabilities: { keep: 0.2 }` → drop
  - (empty) 答えが無い → keep（fail-open）

## Notes

### Slice 1: 質問を「後に要るか」にする

- Findings: なし（前回の `run.test.ts` 2 件・`index.test.ts` 3 件の失敗は、モックを `keep` に直して解消した）
- Unplanned: なし
- Commit: aaf38ea

## Review

### Round 1

- Stale:
  - `.pi/extensions/context-prune/README.md:34` — `threshold` 行が `a `yes` below this drops` のまま。`.pi/extensions/context-prune/prune/judge.ts:101` で criteria が `keep`/`drop` に変わり `.pi/extensions/context-prune/prune/judge.ts:150` が `probabilities['keep']` を読むため stale。`README.md:8` の Pass 行は直っているが Settings 表が残存。
    - fixed: `threshold` 行を `a `keep` below this drops` に直した。
- Unlisted:
  - なし（diff の 5 files が Files の 5 件と一致）
- Gaps:
  - なし（Verify の 6 項目：鍵 keep/drop・need 含有・日本語無し・keep:0.8→keep・keep:0.5→keep・keep:0.2→drop・空→keep が `.pi/extensions/context-prune/prune/judge.test.ts:41,52,138,146,158,165` で全て行われている）
- Unproven:
  - なし（上記 6 件の各試験は反転時に赤になる：鍵・need・0.5 境界・0.49/0.2・空を制御）
- Doubts:
  - `.pi/extensions/context-prune/prune/judge.ts:2` 頭コメ「関係ない結果だけを落とす」が旧 relevance 寄りに読めるが汎用表現のため finding にしない。
  - `.pi/extensions/context-prune/index.test.ts:188,376` の引数/型名 `yes` 残存は命名のみで動作は `keep` を返し正しいため finding にしない。
  - `.pi/extensions/context-prune/prune/ports.test.ts:41,81`・`index.test.ts:769` の yes/no 治具は汎用 passthrough 用で judge 仕様と無関係のため stale にしない。
  - criteria 値の文言の厳密一致を `expect.any(String)`/`toContain('need')` でしか見ない点は Verify が鍵と need のみ要求のため finding にしない。

### Round 2

- Stale:
  - `.pi/extensions/context-prune/README.md:34` — fixed confirmed: now `a keep below this drops the result`, matching `prune/judge.ts:102-104` criteria `keep`/`drop` and `prune/judge.ts:150` `probabilities['keep']`. No `yes` remains on this line.
- Unlisted:
  - No target (Round 1 `fixed:` is Stale-only; out of scope, not re-checked).
- Gaps:
  - No target (same reason).
- Unproven:
  - No target (same reason).
- Doubts:
  - Wording `a keep below this drops` is terse (probability vs. verdict) but accurate against `verdicts` (`probability >= threshold` keeps); not a finding.

## Acceptance

- Ran: `pnpm test:run`（64 files / 1033 tests）、`pnpm typecheck`（root / .pi とも ok）、`pnpm lint`（指摘なし）、`pnpm format:check`（差分なし）。
- Ran: 壊し試験 2 つ。`verdicts` が `probabilities.yes` を読む → 3 件 red。`criteria` のキーを `yes` / `no` に戻す → 1 件 red。どちらも復元後に再実行して緑。
- Findings: なし
- Doubts: なし
