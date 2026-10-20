# PLAN `record-jsonl`

## Files

```text
.pi/extensions/intent-router/
  command/
    intent.test.ts
  record/
    recent.ts                update
    recent.test.ts
  state/
    payload.ts               update
    payload.test.ts
  route/
    decide.ts
    hook.ts                  update
    hook.test.ts
  judge/
    hook.ts                  update
    hook.test.ts
  index.test.ts
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
   - `Record` のセクションを JSONL に合わせる

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

- Findings: なし
- Unplanned:
  - route / judge / index の test 内の `readRecords` が配列形式のまま残っていたので JSONL 読みに直した（直さないと記録 1 件のテストが 0 件読みになる）
- Commit: 12bc22d

### Slice 2: 渡した state の字数と、切ったかどうかを記録に足す

- Findings: なし
- Unplanned:
  - `command/intent.test.ts` の手書き IntentRecord 2 件に新必須欄を足した（足さないと typecheck が赤い。plan の Files 外）
  - lint 上限に当たったため `settleRoute` は入力1個・`settleAnswered` は `hold()` 共有・judge の新 tests は別 describe にした
  - schema の既定 `route.thresholds.approve` と `judge.threshold` を 0.8 にした（plan の Files 外だが base が赤かったため。0.9 境界の tests も下げた） — 38a086d
  - 閾値の既定を 0.8 に合わせたのに伴い `route/decide.ts:21` のコメントも直した
- Commit: dfdef13

## Review

### Round 1

- Stale:
  - `.pi/extensions/intent-router/README.md:7`、`README.md:36`、`README.md:43` が閾値 `0.9` のまま古くなった — `.pi/extensions/intent-router/settings/schema.ts:221`（`approve: 0.8`）・`:237`（`judge.threshold 0.8`）と `.pi/extensions/intent-router/settings.json:19,30`（いずれも `0.8`）が ADR `02` 決定値「すべて `0.8`」に揃ったのに、本文の `How it moves` と設定表だけ `reply 0.8 / approve 0.9`、`judge.threshold 0.9` のまま。plan の README 更新は Record セクションのみで閾値に触れていない。
    - fixed: README の `How it moves` と設定表の `0.9` 3 箇所を `0.8` に直した（`:19` の `set` 例は既定値の記述ではないため触らない）
- Unlisted:
  - `.pi/extensions/intent-router/command/intent.test.ts:166`（同 `:193`）手書き `IntentRecord` 2 件への新必須欄追加 — plan の Files に無いファイルの変更。Notes Slice 2 に記録はあるが Files 外であることに変わりはなく、閾値（既知扱い）ではなく型追加のため finding とする。
    - fixed: `## Files` に `command/intent.test.ts` を追従ファイルとして足した（印なし）
  - `.pi/extensions/intent-router/index.test.ts:143`（`readRecords` の JSONL 化、`:149-162`）— plan の Files に無い。Notes Slice 1 に記録はあるが Files 外。なお同ファイルの境界値書換え（`:329` の `0.75`、`:346` の `0.7`）は ADR 決定値＋記録済みのため除く。
    - fixed: `## Files` に `index.test.ts` を追従ファイルとして足した（印なし）
  - `.pi/extensions/intent-router/route/decide.ts:21` コメントの `approve 0.9` → `0.8` 書換え — plan の Files に無く Notes にも記録が無い。閾値 `0.8` 自体は ADR 決定値なので値は問わないが、ファイル自体が Files 外で変わっているため finding とする。
    - fixed: `## Files` に `route/decide.ts`（印なし）を足し、`### Slice 2` の `Unplanned` にコメント修正を記録した
- Gaps:
  - `.pi/extensions/intent-router/judge/hook.ts:169` `logNudge`（nudge 時の記録）経路の 2 欄が検証されていない — 新 tests `.pi/extensions/intent-router/judge/hook.test.ts:467`（`registerJudge/state chars`）は小さい往復（hold 相当）、`maxStateChars` 超え（hold 相当）、classify 失敗のみで、2 回続いた後の nudge（`logNudge` → `streak`/`nudge` あり）の `state_chars`/`truncated` を assert していない。Steps は judge の全記録に同じ 2 欄を求めている。
    - fixed: `judge/hook.test.ts` の `registerJudge/state chars` に促し往復の 2 欄ケースを足した（2 回 `noNo` → nudge 記録の `state_chars` が送信 payload 長と一致、`truncated` は false）
  - `.pi/extensions/intent-router/route/hook.test.ts:171`（`approve 0.75 → idle`＝閾値未満見送り）が `fired` のみ見て `state_chars`/`truncated` を assert していない — Steps は `other`／閾値未満の見送りにも同じ 2 欄を求めており、`other` の同 2 欄（`:330`）はあるが閾値未満の同 2 欄が無い。
    - fixed: 同テストの assert に 2 欄（送信 state 長との一致、`truncated` false）を足した
- Unproven:
  - `.pi/extensions/intent-router/route/hook.test.ts:302`（`owner は短く agent_prev だけが長い → truncated が true`）は `state_chars == 送信 state 長` と `truncated == true` のみで、兄弟の owner-long（`:289`）にある `toBeLessThan(生の字数)` が無い — `routePayload`（`.pi/extensions/intent-router/state/payload.ts:170`）が `agent_prev` を切らずに返しても送信と記録が同じ未切断で一致するため緑のまま。切った後の字数であることが証明できていない。
    - fixed: 切る前の生 state（`{ owner_now, agent_prev }` 全体）の字数より短いことの assert を足した（兄弟 `:289` と同じ形）
- Doubts:
  - `.pi/extensions/intent-router/judge/hook.ts:211` の `void turnIndex; void truncated; void stateChars;` は `logNudge` に渡しているのに void しており意図が読めない。動作に影響しないため finding にしない。
  - `.pi/extensions/intent-router/record/recent.ts:12` の `isRecord` が `at` の有無しか見ず `state_chars`/`truncated` を要求しない。旧 JSONL の 1 行（新欄なし）が混ざると欠けたまま読めるが、plan Verify は旧形式＝配列 1 行のみを空と決めており単行旧欄の扱いは決めていないため finding にしない。
  - `.pi/extensions/intent-router/README.md:19` の例 `route.thresholds.approve 0.9` は `set` の使用例であり既定値の記述ではないため stale に数えていない。

### Round 2

- Stale: なし — 1 件は直っている。README の 3 か所が 0.8 になり、既定と一致する
- Unlisted: なし — 3 件は直っている。`## Files` に 3 つが足され、`route/decide.ts` のコメントの記録も入っている
- Gaps: なし — 2 件は直っている。促しの記録と、閾値未満の見送りの記録にも 2 欄が入る検査がある
- Unproven: なし — 1 件は直っている。切る前の生の state より短いことを見る assert が入っている
- Doubts: なし

## Acceptance

- Ran:
  - plan の検査: slice 1 の `pnpm vitest run .pi/extensions/intent-router/record` と slice 2 の `.../route` `.../judge` `.../state`（合わせて 12 ファイル / 171 件が緑）
  - `pnpm test:run` → 41 ファイル / 669 件が緑
  - `pnpm typecheck` → ルートと `.pi` とも ok
  - `pnpm lint` → 緑
  - 壊して赤を確かめた 3 件（同時に入れた）:
    - `record/recent.ts` の書き込みを 1 行の配列に戻す → 30 件が赤（`record` の 6 件と、記録を読む `command` / `judge` / `index` を含む）
    - `state/payload.ts` の `truncated` を常に false に → `truncated` のケースが赤（`payload` と `route` と `judge`）
    - `route/hook.ts` の `state_chars` を切る前の字数に → 切った後の字数を見るケースが赤
    - いずれも戻して緑に復帰
- Findings:
  - なし
- Doubts:
  - なし
