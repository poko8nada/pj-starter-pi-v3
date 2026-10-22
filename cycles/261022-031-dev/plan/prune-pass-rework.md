# PLAN `prune-pass-rework`

## Files

```text
.pi/extensions/context-prune/
  settings/
    schema.ts             update
    schema.test.ts        update
    read.ts
    read.test.ts
  prune/
    collect.ts            update
    collect.test.ts       update
    judge.ts              update
    judge.test.ts         update
    ports.ts              update
    ports.test.ts         update
    run.ts                update
    run.test.ts           update
    plan.ts
    plan.test.ts
  command/
    prune.ts              update
    prune.test.ts         update
  index.ts                update
  index.test.ts           update
  doc.test.ts             update
  settings.json           update
  README.md               update
```

## Slices

## 1.要約の枠を外す

### Types

```ts
// .pi/extensions/context-prune/settings/schema.ts
export interface Settings {
  readonly enabled: boolean;
  readonly ratio: number;
  readonly recentTokens: number;
  readonly threshold: number;
  readonly maxQuestions: number;
  readonly rearmRatio: number;
  readonly marker: string;
  readonly classifier: {
    readonly models: readonly ClassifierCandidate[];
    readonly allowPaid: boolean;
  };
}

// .pi/extensions/context-prune/prune/ports.ts
/** モデルの出力上限から reserveTokens を逆算する。上限が 0 または負なら文脈長で頭打ちにする */
export function summarizationReserve(maxTokens: number, contextWindow: number): number;
```

### Steps

1. `.pi/extensions/context-prune/settings/schema.ts`:
   - `Settings` から `summaryTokens` を外し、既定・未知キー検査・検証からも外す。
2. `.pi/extensions/context-prune/settings.json`:
   - `summaryTokens` の行を消す。
3. `.pi/extensions/context-prune/prune/ports.ts`:
   - `summarizationReserve` を置き、`summarizeViaCell` が `summarizationReserve(cell.model.maxTokens, cell.model.contextWindow)` を渡すようにする。
     - Outside: design の `@earendil-works/pi-coding-agent`。`generateSummaryWithUsage` は `min(0.8 × reserveTokens, model.maxTokens)` で上限を決めるので、モデルの出力上限から逆算した値を渡す。
4. `.pi/extensions/context-prune/settings/schema.test.ts`:
   - `summaryTokens` の試験を消し、`{ "summaryTokens": 2000 }` が `broken` になる試験と、既定に `summaryTokens` が無い試験を足す。
5. `.pi/extensions/context-prune/prune/ports.test.ts`:
   - 偽の `model` に `maxTokens` と `contextWindow` を足し、`args[2]` が 2500 である検査を `summarizationReserve` と配線の検査に置き換える。
6. `.pi/extensions/context-prune/index.test.ts`:
   - 偽の `model` に `maxTokens` と `contextWindow` を足し、654 行付近の 2500 の検査を新しい reserve の値に合わせる。
7. `.pi/extensions/context-prune/doc.test.ts`:
   - README 表の `summaryTokens` の一致検査を消す。
8. `.pi/extensions/context-prune/README.md`:
   - Settings の表から `summaryTokens` を外し、Pass の文から `(up to summaryTokens)` を消す。

### Verify:

- test: `pnpm test:run .pi/extensions/context-prune`
  - (happy) `summarizationReserve(101, 1000)` → 127
  - (boundary) `summarizationReserve(0, 1001)` → 1252
  - (boundary) `summarizationReserve(-1, 1001)` → 1252
  - (happy) 偽のモデル（`maxTokens: 8000`）で `summarizeViaCell` を呼ぶ → `args[2]` が 10000
  - (error) `settings.json` に `summaryTokens` が残る → `broken`（未知キー）
  - (empty) 設定に `summaryTokens` が無い → `ok` で、既定のキーにも `summaryTokens` が無い

## 2.state を用途に合わせる

### Types

```ts
// .pi/extensions/context-prune/prune/collect.ts
export interface Candidate {
  readonly id: string;
  readonly toolName: string;
  readonly args: string;
  readonly chars: number;
  readonly excerpt: string;
}
/** 抜粋の間に置く注記 */
export const OMITTED_MARK: string; // `…（N chars omitted）…`
/** 先頭 head 文字と末尾 tail 文字を残し、間を OMITTED_MARK にする */
export function excerptOf(text: string, head: number, tail: number): string;

// .pi/extensions/context-prune/prune/judge.ts
/** 要約から Goal / Progress / Next Steps の節だけを残す。見出しが無ければそのまま返す */
export function topicView(summary: string): string;
/** 分類器のトークン数を文字数から見積もる。実測 2.5 文字/トークンで割る（保守側） */
export function classifierTokens(text: string): number;
export interface BatchBudget {
  /** Jev の per-question 上限 */
  readonly total: number;
  /** 要約の view と質問 1 つの分 */
  readonly fixed: number;
}
export function batches(
  candidates: readonly Candidate[],
  budget: BatchBudget,
): readonly (readonly Candidate[])[];
```

### Steps

1. `.pi/extensions/context-prune/prune/collect.ts`:
   - `Candidate` に `excerpt` を足し、`excerptOf(messageText(message), 500, 500)` を入れる。
2. `.pi/extensions/context-prune/prune/collect.test.ts`:
   - 抜粋の試験を足す。
3. `.pi/extensions/context-prune/prune/judge.ts`:
   - `OMITTED_MARK`、`topicView`、`classifierTokens` を置き、`judgeRequest` は `topicView(summary)` を state に入れる。
   - `batches` を、`maxQuestions` ではなく予算で割る形に変える。
   - 質問文と基準を英語にする。
4. `.pi/extensions/context-prune/prune/judge.test.ts`:
   - `topicView`、`classifierTokens`、`batches`、英語の質問の試験を足す。
5. `.pi/extensions/context-prune/prune/run.ts`:
   - `batches` に `{ total: 32000, fixed }` を渡し、`fixed` は `classifierTokens(topicView(summary))` と質問 1 つの見積もりから作る。
     - Outside: design の `Jev（TypeSafe System One）`。per-question 32,000 トークンに収めるため、`classifierTokens` の見積もりで予算から引く。
6. `.pi/extensions/context-prune/prune/run.test.ts`:
   - 予算による分割の試験を足す。
7. `.pi/extensions/context-prune/prune/ports.ts`:
   - `generateSummaryWithUsage` の 7 番目の引数に、英語で書く指示を渡す。
     - Outside: design の `@earendil-works/pi-coding-agent`。要約の促しは `customInstructions`（7 番目）で足す。
8. `.pi/extensions/context-prune/prune/ports.test.ts`:
   - `args[6]` に英文が入ることを検査する。
9. `.pi/extensions/context-prune/settings/schema.ts`、`.pi/extensions/context-prune/settings.json`、`.pi/extensions/context-prune/settings/schema.test.ts`、`.pi/extensions/context-prune/doc.test.ts`、`.pi/extensions/context-prune/README.md`:
   - `maxQuestions` を設定から外す（件数は予算が決める）。
10. `.pi/extensions/context-prune/README.md`:
    - Pass の説明を「節へ加工し、結果の先頭と末尾を抜粋に足し、予算でバッチに割る」に直す。
11. `.pi/extensions/context-prune/index.test.ts`:
    - 予算経由の `batches` の呼び出しに合わせる。

### Verify:

- test: `pnpm test:run .pi/extensions/context-prune`
  - (happy) 3,000 文字の結果 → 抜粋は先頭 500 ＋ `OMITTED_MARK` ＋ 末尾 500
  - (boundary) 1,000 文字ちょうど → 注記なしで全文
  - (empty) 空の結果 → 抜粋は空
  - (happy) 6 節の要約 → view は Goal / Progress / Next Steps の 3 節
  - (empty) 見出しの無い要約 → 全文
  - (happy) `classifierTokens('a'.repeat(25))` → 10
  - (empty) `classifierTokens('')` → 0
  - (happy) 1,000 文字の抜粋 100 件 → 32,000 の予算で 2 束以上に割れる
  - (boundary) 予算が 1 件分より小さい → 1 件だけの束になる
  - (happy) 質問の `instructions` と `criteria` の値に日本語が含まれない
  - (happy) `ports` の `args[6]` が英文
  - (error) 設定に `maxQuestions` が残る → `broken`（未知キー）

## 3.失敗を冷やす

### Types

```ts
// .pi/extensions/context-prune/command/prune.ts
export interface Failure {
  readonly at: number;
  readonly tokens: number;
  readonly reason: string;
}
export interface Status {
  readonly running: boolean;
  readonly failures: number;
  readonly lastPass: PrunePass | undefined;
  readonly lastFailure: Failure | undefined;
}
export function statusLines(status: Status, settings: Settings, now: number): readonly string[];
```

### Steps

1. `.pi/extensions/context-prune/command/prune.ts`:
   - `Failure` を足し、`Status` に `lastFailure` を足し、`statusLines` に「最後の失敗」の行を足す。
2. `.pi/extensions/context-prune/index.ts`:
   - 失敗時に `lastFailure` を `{ at, tokens, reason }` で入れる。
   - `gate` に渡す `lastTokens` を、`lastPass` と `lastFailure` のうち `at` が新しい方の `tokensBefore` / `tokens` にする。
3. `.pi/extensions/context-prune/command/prune.test.ts`:
   - `statusOf` に `lastFailure` を足し、失敗の行の試験を足す。
4. `.pi/extensions/context-prune/index.test.ts`:
   - 失敗の記録と、失敗直後の冷却の試験を足す。
5. `.pi/extensions/context-prune/README.md`:
   - `/prune` の状態表示に失敗の行があることを書く。

### Verify:

- test: `pnpm test:run .pi/extensions/context-prune`
  - (happy) 失敗 → `lastFailure` に `at` / `tokens` / `reason` が入る
  - (happy) `lastFailure` ありの `statusLines` → 「最後の失敗」の行に経過秒と理由が出る
  - (empty) `lastFailure` なしの `statusLines` → 失敗の行が出ない
  - (happy) `index.ts` の配線: 1 回失敗させ、次の `turn_end` で tokens が変わらない → 要約を呼ばない（冷却）
  - (boundary) 失敗のあと `contextWindow × rearmRatio` 以上増えた → 要約を呼ぶ
  - (happy) 成功のあと失敗 → 失敗の `tokens` から冷える
  - (happy) 失敗のあと成功 → 成功の `tokensBefore` から冷える

## 4.ドキュメントを揃える

### Types

```ts
なし;
```

### Steps

1. `.pi/extensions/context-prune/README.md`:
   - 全体を読み直し、Pass・Settings・`/prune` の 3 節が 1〜3 の振る舞いと一致するように直す。

### Verify:

- read: `review` サブエージェントが `.pi/extensions/context-prune/README.md` を読み、Pass・Settings・`/prune` の記述が、枠なし・英語・抜粋・予算バッチ・失敗の冷却と一致しているかを報告する
  - (happy) 矛盾なし
  - (error) `summaryTokens` や `maxQuestions` の記述が残っている → 矛盾として報告される

## 5.統合: prune のパスが、枠なし・英語・抜粋つきで回り、失敗は冷える

### Types

```ts
なし;
```

### Steps

1. `.pi/extensions/context-prune/README.md`:
   - 4 の read で返った矛盾を直す。

### Verify:

- cli: `pnpm test:run`、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`
  - (happy) `pnpm test:run` が exit 0
  - (happy) `pnpm typecheck` が exit 0
  - (error) `pnpm lint` が指摘なしで exit 0
  - (error) `pnpm format:check` が差分なしで exit 0

## Notes

### Slice 1: 要約の枠を外す

- Findings: なし
- Unplanned: なし
- Commit: fbca2b9

### Slice 2: state を用途に合わせる

- Findings: なし
- Unplanned: なし
- Commit: 5731d94

### Slice 3: 失敗を冷やす

- Findings: なし
- Unplanned: なし
- Commit: 3c2fc49

### Slice 4: ドキュメントを揃える

- Findings:
- Unplanned:
- Commit:

### Slice 5: 統合: prune のパスが、枠なし・英語・抜粋つきで回り、失敗は冷える

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
