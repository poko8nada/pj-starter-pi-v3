# PLAN `interrupt-message`

- No: 01
- Place: worktree
- Boundary Plans: なし

## Goal

割り込みメッセージが、止めた理由と次の一歩を短く伝え、モデルにループの続きを書かせない。

## Refactor

- Inside:
  - Modules: なし。`sampleOf` を削除し、`followUpText` を `FOLLOWUP_TEXT` の定数にして、`takeFollowUp` の戻り値を変えるだけで、モジュールの統合・分割はしない。
  - Dirs: なし。
- Outside:
  - Extract: なし。共通化する新しいモジュールはない。
  - Colocate: なし。

## Files

```text
.pi/
  extensions/
    thinking-scrub/
      live/
        guard.test.ts          update
        guard.ts               update
      scrub/
        units.test.ts          update
        units.ts               update
      settings/
        schema.test.ts         update
        schema.ts              update
      index.test.ts            update
      index.ts                 update
      README.ja.md             update
      README.md                update
      scrub.fixture.ts         update
      settings.json            update
```

## Slices

## 1. 割り込みメッセージを固定文言にする

割り込みメッセージを止めた理由と次の一歩を伝える固定文言にし、見本を渡すための状態と関数を外す。

### Types

```ts
export interface Guard {
  readonly aborts: number;
  readonly scanned: number;
  readonly pending: boolean;
}

export type GuardStep =
  | { readonly kind: 'idle'; readonly guard: Guard }
  | { readonly kind: 'stop'; readonly guard: Guard };

export function takeFollowUp(guard: Guard): Guard | undefined;
export const FOLLOWUP_TEXT: string;
```

### Steps

1. `.pi/extensions/thinking-scrub/live/guard.ts`
   1. update: `followUpText` の関数を `FOLLOWUP_TEXT` の定数にする。
      ```ts
      export const FOLLOWUP_TEXT =
        'Your thinking was repeating the same sentences, so this turn was stopped. Do not continue that repetition.\n\nNext: name the next concrete step in one sentence, then do it. If you are blocked, say what is blocking you in one sentence.';
      ```
   2. update: `Guard` の `pending` を `string | null` から `boolean` にする。
   3. update: `emptyGuard` の `pending: null` を `pending: false` にする。
   4. update: `GuardStep` の `stop` から `sample` を外す。
   5. update: `takeFollowUp` を、フォローアップを取り出した後の `Guard` を返す関数にする。
      ```ts
      export function takeFollowUp(guard: Guard): Guard | undefined {
        if (!guard.pending) {
          return undefined;
        }
        return { ...guard, pending: false };
      }
      ```
   6. update: `observe` の stop から `sample` を外し、`pending` を `true` にする。
      ```ts
      return {
        kind: 'stop',
        guard: { aborts: guard.aborts + 1, scanned: thinking.length, pending: true },
      };
      ```
   7. drop: `sampleOf` の import と、`sample` を作る行を削除する。
   8. update: 冒頭の doc コメントの「`takeFollowUp` は止めた見本を 1 回だけ渡す」を「`takeFollowUp` は止めた後のフォローアップを 1 回だけ取り出す」に変える。
   9. update: `takeFollowUp` の doc コメント「止めた見本を 1 回だけ取り出す」を「止めた後のフォローアップを 1 回だけ取り出す」に変える。
2. `.pi/extensions/thinking-scrub/index.ts`
   1. update: import を `followUpText` から `FOLLOWUP_TEXT` に変え、呼び出しを `FOLLOWUP_TEXT` の参照に変える。
   2. update: `takeFollowUp` の戻り値を `state.guard` に入れてから `FOLLOWUP_TEXT` を送る。
      ```ts
      const taken = takeFollowUp(state.guard);
      if (taken === undefined) {
        return;
      }
      state.guard = taken;
      options.followUp(FOLLOWUP_TEXT);
      ```
3. `.pi/extensions/thinking-scrub/scrub/units.ts`
   1. drop: `sampleOf` の関数と、その doc コメントを削除する。
4. `.pi/extensions/thinking-scrub/scrub/units.test.ts`
   1. drop: `sampleOf` と `type UnitRun` の import を削除する。
   2. drop: `describe('sampleOf')` を削除する。
5. `.pi/extensions/thinking-scrub/live/guard.test.ts`
   1. drop: `FOLLOWUP_CONTINUE`、`FOLLOWUP_DO_NOT`、`FOLLOWUP_REPEATING`、`loopSentence` の import を削除する。
   2. drop: `followUpText` の import と `describe('followUpText')` を削除する。
   3. update: `observe` の stop のテスト名を `stop で見本つきになる` から `stop になる` に変え、`expect(step.sample.length).toBeGreaterThan(0)` と `expect(step.sample.length).toBeLessThanOrEqual(tuning.live.sampleChars)` の 2 行を削除する。
   4. update: `takeFollowUp` のテストを `Guard | undefined` に合わせ、`sample` の比較を削除する。
      ```ts
      it('2 回止めれば 1 回だけ取れる', () => {
        const first = observeIn(thinkingWithRun(tuning.live.minThinking), tuning);
        if (first.kind !== 'stop') {
          throw new Error('first must stop');
        }
        const second = observe(
          first.guard,
          thinkingWithRun(tuning.live.minThinking + tuning.live.scanEvery),
          tuning,
          () => true,
        );
        if (second.kind !== 'stop') {
          throw new Error('second must stop');
        }
        const taken = takeFollowUp(second.guard);
        if (taken === undefined) {
          throw new Error('must take');
        }
        expect(taken.pending).toBe(false);
        expect(takeFollowUp(taken)).toBeUndefined();
      });
      ```
   5. drop: `thinkingWithOtherRun` を削除し、2 回目の thinking を `thinkingWithRun(tuning.live.minThinking + tuning.live.scanEvery)` にする。
6. `.pi/extensions/thinking-scrub/index.test.ts`
   1. drop: `FOLLOWUP_REPEATING` の import を削除する。
   2. update: `onAgentSettled` の `toMatchObject` から `content: expect.stringContaining(FOLLOWUP_REPEATING)` の行を削除し、`customType`、`display`、`triggerTurn` と `toHaveLength(1)` は残す。
   3. update: 最初の送信テストで `settled(agentSettled(true), {})` をもう 1 回呼び、`fake.sent` が 1 件のままであることを確かめる。
7. `.pi/extensions/thinking-scrub/scrub.fixture.ts`
   1. drop: `FOLLOWUP_REPEATING`、`FOLLOWUP_DO_NOT`、`FOLLOWUP_CONTINUE` を削除する。

### Policy

- Allowed:
  - 繰り返しの事実を 1 文で述べ、見本の代わりにする。
  - 文面を短く保つ。
  - 止めた後は、ソフトな指示で次の一歩を求める。
- Forbidden:
  - 「Do not repeat」だけを置かない - 否定形は単独では禁止したい振る舞いを誘発しやすい。
  - ループした文をそのまま見本として載せない - ループの続きを書かせる危険があり、効果の直接の証拠がない。
  - モデルに回答領域で思考の続きを書かせない - reasoning leakage を招く。
  - 検出の条件と `maxAborts` を変えない - 文言だけを変えるため。
  - 検知を名乗るヘッダーを置かない - 効果の直接の証拠がなく、検知への反論を招くおそれがある。
  - 使わない設定と関数を残さない - 見本を外すと `sampleChars` と `sampleOf` は使われない。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/thinking-scrub/live/guard.ts .pi/extensions/thinking-scrub/index.ts .pi/extensions/thinking-scrub/scrub/units.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えた 7 ファイル全体と、それらが名指すファイルを読み、`FOLLOWUP_TEXT` の文面、`Guard` の `pending`、`takeFollowUp` の戻り値、`observe` の stop の形がそろっていることと、`sampleOf` と `FOLLOWUP_*` が残っていないことを当て、不整合を直す。
- Added: なし

## 2. 見本の設定と README を外す

見本がなくなったので、`sampleChars` 設定と README の記述を外す。

### Types

```ts
export interface LiveTuning {
  readonly minThinking: number;
  readonly scanEvery: number;
  readonly tail: number;
  readonly maxAborts: number;
}
```

### Steps

1. `.pi/extensions/thinking-scrub/settings/schema.ts`
   1. update: `LiveTuning` から `readonly sampleChars: number;` を削除する。
   2. update: `defaultSettings` の `live` から `sampleChars: 200` を削除する。
   3. update: `parseLive` の `let sampleChars = defaults.sampleChars;` を削除する。
   4. update: `parseLive` の `fields` から `sampleChars` の行を削除する。
   5. update: `parseLive` の `parsed['sampleChars']` の代入を削除する。
   6. update: `parseLive` の戻り値から `sampleChars` を削除する。
2. `.pi/extensions/thinking-scrub/settings.json`
   1. drop: `live.sampleChars` の行を削除し、`live.maxAborts` の行末のカンマを外す。
3. `.pi/extensions/thinking-scrub/settings/schema.test.ts`
   1. update: 入力の `live` から `sampleChars: 100` を削除する。
   2. update: 期待値の `live` から `sampleChars: 100` を削除する。
   3. update: `parseSettings: (happy) 古い sampleChars だけ → ok で sampleChars を持たない` のケースを足す。
4. `.pi/extensions/thinking-scrub/README.md`
   1. drop: JSON 例の `"sampleChars": 200` を削除し、`"maxAborts": 2` の行末のカンマを外す。
   2. drop: `live` の表の `sampleChars` の行を削除する。
   3. update: フォローアップのセクションを固定文言の説明に変える。
      ```md
      At `agent_settled`, a fixed custom message is sent, then the next run starts.
      ```
5. `.pi/extensions/thinking-scrub/README.ja.md`
   1. drop: JSON 例の `"sampleChars": 200` を削除し、`"maxAborts": 2` の行末のカンマを外す。
   2. drop: `live` の表の `sampleChars` の行を削除する。
   3. update: フォローアップのセクションを固定文言の説明に変える。
      ```md
      `agent_settled` では、固定文言のカスタムメッセージが送られ、次の実行が開始される。
      ```

### Policy

- Allowed:
  - 繰り返しの事実を 1 文で述べ、見本の代わりにする。
  - 文面を短く保つ。
- Forbidden:
  - ループした文をそのまま見本として載せない - ループの続きを書かせる危険があり、効果の直接の証拠がない。
  - 使わない設定と関数を残さない - 見本を外すと `sampleChars` と `sampleOf` は使われない。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/thinking-scrub/settings/schema.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えた 5 ファイル全体を読み、`sampleChars` が設定、スキーマ、テスト、英語と日本語の README に残っていないこと、README のフォローアップが固定文言を説明していることを当て、不整合を直す。
- Added:
  - proofread: `node scripts/checks/ja-check.mjs .pi/extensions/thinking-scrub/README.ja.md` を通し、warn と error をゼロにする。
  - other: 古い `sampleChars` だけの設定が `ok` になり、結果の `live` に `sampleChars` を持たないことを確かめる。

## Notes

### Slice 1: 割り込みメッセージを固定文言にする

- Findings: なし
- Unplanned: なし
- Commit: 31abc4a7
- Stopped: なし

### Slice 2: 見本の設定と README を外す

- Findings: なし
- Unplanned: README.ja.md の既存の ja-check warn 3 件を「直接編集」に言い換えて解消した
- Commit: 2525ffa7
- Stopped: なし

### Cleanup: 重複と無振る舞いのテスト整理

- Findings: guard.test.ts の describe('signature') を落とした。引数なしの型だけを見て振る舞いがなく、型が保証し壊れても誰も気づかない。schema.test.ts の関係式の重複を落とした。char.minPeriod だけ 200 と char.maxPeriod だけ 2 は、5 と 4 の直接指定が同じ minPeriod<=maxPeriod の分岐を当て、既定値の合流は live の 3000 の happy が担う。live.tail だけ 1000 は、scanEvery だけ 30000 と同じ scanEvery<=tail の分岐を当てる。
- Unplanned: scrub/units.ts:67 の doc の既存の言い回しを「行に分割し」に直し、pre-commit の ja-check の error を消した。フックを止めていた。

## Work Review

### Round 1

- Stale: なし — `sampleOf`/`sampleChars`/`FOLLOWUP_*`/`followUpText`への参照残りがなく、`見本`の言及もない。`scrub.fixture.ts:49`の`loopSentence`は`thinkingWithRun`経由で現役のため陳腐化ではない。
- Unlisted: なし — 差分の`.pi`配下12件は`Files`の12件と一致する。`scrub/units.ts:67`の文言直しと`README.ja.md`の「直接編集」言い換えは`Files`命名済みファイル内の更新であり、plan md自体の記録更新は対象外。
- Gaps:
  - `.pi/extensions/thinking-scrub/live/guard.ts:39` — `FOLLOWUP_TEXT`の文言（止めた理由を1文で述べ、次の一歩を求め、見本を含まず、回答領域で思考の続きを書かせない短さ）を確かめる検査がない。`index.test.ts`は種別・表示のみで内容を見ないため、Goalの核心が無検査のまま残る。
    - left: 固定文言はADRの`Details`そのものであり、定数の内容検査はトートロジーになるためテストしない。`Always`の読み合わせで`FOLLOWUP_TEXT`とADRの`Details`を当てて確認する。
  - `.pi/extensions/thinking-scrub/live/guard.test.ts:35` — `observe`のstopが`pending:true`を立てることを確かめていない（`aborts`/`scanned`のみ）。`pending`が`false`のままなら`takeFollowUp`が常に`undefined`でフォローアップが送られずGoalを外すが、現行検査は緑のまま。
    - left: `takeFollowUp`のテストが間接的に保証する。`observe`が`pending:false`のままなら`takeFollowUp(second.guard)`が`undefined`を返してテストが落ちる。boolの直接表明は同じ振る舞いの繰り返しになる。
- Policy: なし — 固定文言は事実1文＋次の具体的一歩で短く、見本の補間・検知名乗りヘッダー・思考継続の誘いがなく、検出条件と`maxAborts`も不変で、未使用の`sampleChars`/`sampleOf`/`FOLLOWUP_*`は除去済み。
- Unproven:
  - `.pi/extensions/thinking-scrub/index.test.ts:497` — `toMatchObject`が`content`を見ないため、誤った文言（空文字・旧見本付き・思考継続の誘い）を送っても緑のまま。2回目`settled`で1件止まりは見るが、内容の正しさは証明しない。
    - left: 内容の表明は定数とADRの`Details`の写経になりトートロジーのためテストしない。2回目`settled`の1件止まりと読み合わせで担保する。
- Noise: なし — 残る数値・文字列はplan決定値（例：`sampleChars:100`の互換確認）か仕様分岐（`scanEvery<=tail`等）の振る舞いを見るもので、`pending:false`や`toHaveLength(1)`は一回限りの論理を持つ。素朴な型・有無だけの検査はない。
- Doubts: なし

### Round 2

- Stale:
- Unlisted:
- Gaps:
- Policy:
- Unproven:
- Noise:
- Doubts:

## Acceptance

- Goal:
- Ran:
- Findings:
- Doubts:
