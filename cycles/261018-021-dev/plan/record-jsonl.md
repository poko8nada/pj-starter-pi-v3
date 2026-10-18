# PLAN `record-jsonl`

## Files

```text
.pi/extensions/intent-router/
  record/
    recent.ts                update
    recent.test.ts
  state/
    payload.ts               update
    payload.test.ts
  route/
    hook.ts                  update
    hook.test.ts
  judge/
    hook.ts                  update
    hook.test.ts
  README.md                  update
```

## Slices

## 1.記録を JSONL にする

### Types

```ts
なし;
```

### Steps

1. `.pi/extensions/intent-router/record/recent.ts`:
   - `readAll` を 1 行 1 件として読む形にする（空行と読めない行は落とす）。`writeAll` を 1 行 1 件で書く形にする。ファイルの名は `logs/recent.json` のまま（読む側の `tail` / `add` の署名もそのまま）
2. `.pi/extensions/intent-router/record/recent.test.ts`:
   - ファイルの行の規則のケースを足す（既存のやり方に合わせる）
3. `.pi/extensions/intent-router/README.md`:
   - `Record` の節を JSONL に合わせる

### Verify:

- `test`: `.pi/extensions/intent-router/record/recent.test.ts`、`pnpm vitest run .pi/extensions/intent-router/record`
  - (happy) 3 件 add → ファイルが 3 行になり、各行が単体で JSON として読める
  - (boundary values) `limit` 3 で 4 件 add → 3 行になり、先頭の 1 件が落ちて最後の 3 件が残る
  - (empty) ファイルが無い → `tail(1)` は空
  - (empty) 空のファイル → `tail(1)` は空
  - (error) 途中に読めない行がある → その行だけ落ちて、他の行は読める
  - (empty) 旧形式（1 行に配列）のファイル → 読める行が無いので `tail(1)` は空（記録は直近だけなので、古い 23 件は消える）

## 2.渡した state の字数と、切ったかどうかを記録に足す

### Types

```ts
/** record/recent.ts — 2 欄を足す。他の 11 欄はそのまま */
export interface IntentRecord {
  readonly at: string;
  readonly hook: 'route' | 'judge';
  readonly owner_now: string;
  readonly agent_prev: string | null;
  readonly choice: Choice | null;
  readonly confidence: number | null;
  readonly threshold: number | null;
  readonly guide: string | null;
  readonly verdicts: { readonly useful: Verdict; readonly new: Verdict } | null;
  readonly streak: number | null;
  readonly nudge: string | null;
  readonly fired: boolean;
  /** 渡した state を JSON にしたときの字数（切った後） */
  readonly state_chars: number;
  /** 渡す前に切ったかどうか */
  readonly truncated: boolean;
}

/** state/payload.ts — route も「切ったかどうか」を返す（judge の judgePayload と同じ形） */
export function routePayload(
  prompt: string,
  agentPrev: string,
  settings: Settings,
): { readonly payload: RoutePayload; readonly truncated: boolean };
```

### Steps

1. `.pi/extensions/intent-router/record/recent.ts`:
   - `IntentRecord` に `state_chars` と `truncated` を足す
2. `.pi/extensions/intent-router/state/payload.ts`:
   - `routePayload` が `{ payload, truncated }` を返す。`owner_now` か `agent_prev` の**どちらかが** `state.textChars` で切られたら `truncated` は true（片方だけ長い場合も含む）
3. `.pi/extensions/intent-router/route/hook.ts`:
   - 記録に `state_chars`（**切った後の** state の JSON の字数）と `truncated` を入れる。ask が失敗した往復と、`other` / 閾値未満で見送った往復の記録にも同じ 2 欄を入れる
4. `.pi/extensions/intent-router/judge/hook.ts`:
   - 同じ 2 欄を入れる（`judgePayload` が返す **切った後の** payload と `truncated` を使う）。ask が失敗した往復の記録にも入れる
5. `.pi/extensions/intent-router/route/hook.test.ts` と `.pi/extensions/intent-router/judge/hook.test.ts`:
   - 2 欄のケースを足す
6. `.pi/extensions/intent-router/state/payload.test.ts`:
   - `routePayload` の `truncated` のケースを足す（片方だけ長い場合も）
7. `.pi/extensions/intent-router/README.md`:
   - 記録の 1 件の説明に 2 欄を足す

### Verify:

- `test`: `.pi/extensions/intent-router/route/hook.test.ts` と `.pi/extensions/intent-router/judge/hook.test.ts`、`pnpm vitest run .pi/extensions/intent-router/route .pi/extensions/intent-router/judge .pi/extensions/intent-router/state`
  - (happy) 短い往復 → `route` の記録の `state_chars` が、渡した state の JSON の字数と同じ
  - (boundary values) `state.textChars` より長い owner の発言 → `route` の `state_chars` が**切った後の**字数になり、`truncated` が true（生の発言の字数ではない）
  - (boundary values) owner は短く `agent_prev` だけが長い → `truncated` が true
  - (boundary values) どちらも短い → `truncated` が false
  - (happy) 小さい往復 → `judge` の `state_chars` が、渡した payload の JSON の字数と同じ
  - (boundary values) `state.maxStateChars` を超える往復 → `judge` の `state_chars` が**削った後**の payload の字数になり（`maxStateChars` 以下）、`truncated` が true
  - (error) ask が失敗した往復 → 記録に `state_chars` と `truncated` が入る（欄が欠けない）
  - (error) `other` で見送った往復 → route の記録に同じ 2 欄が入る
  - _no case_: 欄の名 — plan が決めた値なので、ケースにならない

## Notes

### Slice 1: 記録を JSONL にする

- Findings:
- Unplanned:
- Commit:

### Slice 2: 渡した state の字数と、切ったかどうかを記録に足す

- Findings:
- Unplanned:
- Commit:

## Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Unproven:
- Doubts:

## Acceptance

- Ran:
- Findings:
- Doubts:
