# PLAN `retry-args`

- ADR-No: 01, 03
- Place: worktree
- Boundary Plans: なし。`guard` と同じ番号で並行して走らせる。ADR 01 の「6 件を消す」は 3 つの plan に分かれる（`ports` が 4 件、`guard` が 1 件、この plan が 1 件）。ADR 03 の 2 件は、この plan だけが担う。

## Goal

`consult` の再試行の表示が、6 つと 5 つの引数ではなく、まとめた値を受ける。

## Refactor

- Inside:
  - Modules: `RetryNotice` は `render.ts` に置く。`retryStartLine` と `retryEndLine` が同じ型を共有し、どちらも `render.ts` にある。新しいファイルは作らない。
  - Dirs: なし。
- Outside:
  - Extract: なし。`RetryNotice` を使うのは `consult.ts` の 2 か所と `render.test.ts` の 3 か所だけで、他の Unit と共有しない。
  - Colocate: なし。

## Files

```text
.pi/
  extensions/
    consult/
      tool/
        render.ts             update
        render.test.ts        update
        consult.ts            update
        consult.test.ts       update
```

## Slices

## 1.再試行の表示の引数をまとめる

`RetryNotice` を置き、`retryStartLine` と `retryEndLine` を 1 つの値で受け、呼び出し側とテストを合わせる。

### Types

```ts
/** 再試行の表示に渡す値。始まりと終わりで同じものを使う */
export interface RetryNotice {
  readonly label: string;
  readonly model: string;
  readonly attempt: number;
  readonly maxAttempts: number;
}

export function retryStartLine(retry: RetryNotice, error: string, delayMs: number): string;
export function retryEndLine(retry: RetryNotice, success: boolean): string;
```

### Steps

1. `.pi/extensions/consult/tool/render.ts`
   1. add: `retryStartLine` の直前に `RetryNotice` を置く。`label`・`model`・`attempt`・`maxAttempts` を持つ（F1, F3）。
   2. update: `retryStartLine(retry: RetryNotice, error: string, delayMs: number): string` にし、本文の参照を `retry.label` などに変える。出す文字列は変えない（C2）。
   3. update: `retryEndLine(retry: RetryNotice, success: boolean): string` にし、本文の参照を `retry.label` などに変える。出す文字列は変えない（C2）。
   4. drop: 59 行目の抑制コメントを消す（C1）。
   5. drop: 72 行目の抑制コメントを消す（C1）。

2. `.pi/extensions/consult/tool/consult.ts`
   1. add: `./render.ts` の import に `type RetryNotice` を足す。
   2. update: `retryStartLine` の呼び出しを、値をまとめた 1 つのオブジェクトと `event.error`・`event.delayMs` にする（C2）。

      ```ts
      notify(
        retryStartLine(
          { label, model, attempt: event.attempt, maxAttempts: event.maxAttempts },
          event.error,
          event.delayMs,
        ),
      );
      ```

   3. update: `retryEndLine` の呼び出しを、1 つのオブジェクトと `event.success` にする。オブジェクトの `maxAttempts` は外側の `let maxAttempts`（`retry-start` で覚えた値）を使う（C2, F1）。

      ```ts
      notify(retryEndLine({ label, model, attempt: event.attempt, maxAttempts }, event.success));
      ```

3. `.pi/extensions/consult/tool/render.test.ts`
   1. update: `retryStartLine` のテストを、値をまとめた 1 つのオブジェクトと `error`・`delayMs` を渡す形にする。既存の `const` はそのまま使う（C2）。

      ```ts
      const line = retryStartLine({ label, model, attempt, maxAttempts }, error, delayMs);
      ```

   2. update: `retryEndLine` の成功のテストを、同じ形にする（C2）。

      ```ts
      expect(
        retryEndLine({ label: 'consult-1', model: 'p/m', attempt, maxAttempts }, success),
      ).toContain(`retry ${attempt}/${maxAttempts} ok`);
      ```

   3. update: `retryEndLine` の失敗のテストを、同じ形にする。期待の文字列は変えない（C2）。

### Policy

- Allowed:
  - 2 つの関数が同じ `RetryNotice` を共有する（C2, F1）
  - 型の名前は先例（`SubagentInput`・`RuntimeInput`・`RunOptions`）に倣い、値を渡す型として名付ける（F3）
- Forbidden:
  - 1 つの型に `error` と `success` を含めない - どちらかの関数が使わない値を持つことになる（C2）
  - 出す文字列を変えない - 振る舞いを変えないため（C2）
  - 題名に `happy:` などの接頭辞を付けない - このファイルの題名の形を変えず、ADR の `values & expression` は引数のまとめだけを述べる

### Verify

- Always:
  - `pnpm test:related .pi/extensions/consult/tool/render.ts .pi/extensions/consult/tool/render.test.ts .pi/extensions/consult/tool/consult.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `render.ts`・`consult.ts`・`render.test.ts` の全体を読み、引数の並びと出す文字列が変わっていないことを確かめる
- Added:
  - `pnpm suppression-check --report` を作業前に 1 度、作業後に 1 度実行する。件数の行（`N files, V violations, A allowed.`）を比べ、違反が 2 件減る（`render.ts:59`、`render.ts:72`）

## 2.使われていない抑制を消す

`consult.test.ts` で何も抑えていない抑制コメントを消す。

### Types

なし

### Steps

1. `.pi/extensions/consult/tool/consult.test.ts`
   1. drop: 320 行目の抑制コメントを消す。ADR の `C2` はこの行を「不要」とし、oxlint も未使用指令を報告する（C2）。

### Policy

- Allowed:
  - 行を消すだけで、テストの本体は変えない（C2）
- Forbidden:
  - テストの期待を変えない - 抑制は何も抑えていないため（C2）

### Verify

- Always:
  - `pnpm test:related .pi/extensions/consult/tool/consult.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `consult.test.ts:315-325` を読み、消したのが抑制コメントの 1 行だけで、テストが変わっていないことを確かめる
- Added:
  - `pnpm suppression-check --report` を作業前に 1 度、作業後に 1 度実行する。件数の行（`N files, V violations, A allowed.`）を比べ、違反が 1 件減る（`consult.test.ts:320`）

## Notes

### Slice 1: 再試行の表示の引数をまとめる

- Findings: なし
- Unplanned: `consult.ts` の2か所の呼び出しに `satisfies RetryNotice` を付けた。計画どおりの素のオブジェクトでは `type RetryNotice` の import が未使用となり `pnpm lint` が落ちるため。実行時の振る舞いは変わらない。
- Commit: 06e407f3
- Stopped:

### Slice 2: 使われていない抑制を消す

- Findings: なし
- Unplanned: なし
- Commit: ea85f484
- Stopped:

### Cleanup: retryEndLine の不変の前提を共有化した

- Findings: なし
- Unplanned: `render.test.ts` の `retryEndLine` の2件（成功→ok・失敗→failed）が各自作っていた不変の前提（`attempt`・`maxAttempts` と `notice` オブジェクト）を `describe` 直下に寄せた。変わる値（`success` の真偽）は各テストに残し、素の真偽値で渡す。落としたテストはなし（成功・失敗は別の結果であり、開始・終了・配線の各テストも別の振る舞いのため残した）。`consult.test.ts` は変えていない。

## Work Review

### Round 1

- Stale: なし — 旧来の引数構成に触れるコメント・文書は残っていない。`.pi/extensions/consult/tool/render.ts:58-73` は抑制コメントなしで新シグネチャのみを持ち、`.pi/extensions/consult/tool/consult.test.ts:317-320` の除去跡に古い参照はない。
- Unlisted: なし — コード差分は `Files` の4件（`render.ts`・`consult.ts`・`render.test.ts`・`consult.test.ts`）に収まる。`.pi/extensions/consult/tool/consult.ts:154,166` の `satisfies` と `.pi/extensions/consult/tool/render.test.ts:140-143` の前提寄せは同一ファイル内の手順範囲であり、`cycles/261120-079-dev/plan/02-retry-args.md:156-171` の差分は `Notes` の記入という手順の定める記録である。
- Gaps: なし — `Goal` の「まとめた値で受ける」は `.pi/extensions/consult/tool/consult.ts:148-169` の2か所の配線で達成され、`.pi/extensions/consult/tool/render.test.ts:121-152`（開始の表示要素・終了 ok/failed）と `.pi/extensions/consult/tool/consult.test.ts:364-407`（開始1回・終了が覚えた maxAttempts を分母に使う・未開始の終了は無出力）の既存経路テストが回帰を抑える。`Added` の抑制 2+1 件減も除去3行（旧 `render.ts` 59・72行、`consult.test.ts:320`）と一致する。
- Policy: なし — `.pi/extensions/consult/tool/render.ts:59-64,67,72` は共有 `RetryNotice` のみで `error`・`success` を型に入れず、出す文字列は `.pi/extensions/consult/tool/render.ts:68,73` が旧文言を維持し、題名に `happy:` 等の接頭辞はない（`.pi/extensions/consult/tool/render.test.ts:122,145,149`）。`.pi/extensions/consult/tool/consult.test.ts:317-320` は1行除去のみで期待不変。
- Unproven: なし — `.pi/extensions/consult/tool/render.test.ts:146,150` は `notice` 共有でも `true`→ok・`false`→failed を別断定し、分岐破壊で落ちる。`.pi/extensions/consult/tool/consult.test.ts:387-406` は終了の分母が記憶値であることを断定し、誤配線で落ちる。関数は純粋な文字列生成で共有 `notice`（`.pi/extensions/consult/tool/render.test.ts:143`）を書き換えない。
- Noise: なし — `true`・`false` の直渡し（`.pi/extensions/consult/tool/render.test.ts:146,150`）は真偽2値の分岐入力で命名の利益がなく、`'consult-1'`・`'p/m'`（`.pi/extensions/consult/tool/render.test.ts:143`）と `retry ... ok/failed` の期待文字列は手順の指定どおり・出力仕様そのもので型では決まらない。新規の抑制コメントはなく、既存の断定を重複させる追加もない。
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

- Goal: `consult` の再試行の表示が、6 つと 5 つの引数ではなく、まとめた値を受ける。実装は達成している（`render.ts` の `RetryNotice` と、`retryStartLine`・`retryEndLine` の 3 引数・2 引数化、`consult.ts` の 2 か所）。
- Ran: `pnpm typecheck`、`pnpm lint`、`pnpm format:check`、`pnpm test:run`（69 ファイル、902 件）、`pnpm suppression-check`（15 件から 12 件に減ることを確かめた）。
- Findings: なし
- Doubts: なし
