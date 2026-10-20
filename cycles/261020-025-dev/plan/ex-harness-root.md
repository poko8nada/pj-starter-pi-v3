# PLAN `ex-harness-root`

## Files

```text
scripts/
  harness/
    index.mjs                update
    index.test.ts            update
  product-ready/
    cli.mjs                  update
    cli.test.ts              update
    index.mjs                update
    index.test.ts            update
```

## 1.`--root` を消し、ルートは cwd だけにする

### Types

```ts
type Args = { readonly direction: 'pull' | 'push'; readonly run: boolean };
type ProductArgs = { readonly run: boolean; readonly only: string | undefined };
```

### Steps

1. `scripts/harness/index.mjs`:
   - `--root` と `--root=` の読みを消す。`Args` から `root` を落とす。
   - `main` は `process.cwd()` をルートにする。
   - 頂きの使い方から `--root` を消す。
   - `readStarter` の `oldFile` と `(was ...)` を消し、エラーは新しい道だけを名指す。

2. `scripts/harness/index.test.ts`:
   - `run(args, cwd)` で fake のルートを渡す。`--root` の引数を全部落とす。
   - `--root` の値が無いケースを消す。
   - `starter.json` が無い時の期待から古い道を落とす。

3. `scripts/product-ready/cli.mjs`:
   - `--root` と `--root=` の読みを消す。`Args` から `root` を落とす。

4. `scripts/product-ready/index.mjs`:
   - `main` は `process.cwd()` をルートにする。
   - 頂きと表示から `--root` を消す。

5. `scripts/product-ready/cli.test.ts`:
   - `--root` のケースを消す。

6. `scripts/product-ready/index.test.ts`:
   - `run` に cwd を渡す。`--root` を全部落とす。
   - 無い root のケースを消す。

### Verify:

- test: `scripts/harness/index.test.ts`、`scripts/product-ready/index.test.ts`、`scripts/product-ready/cli.test.ts`、`pnpm vitest run --config vitest.starter.config.ts scripts/harness/index.test.ts scripts/product-ready/index.test.ts scripts/product-ready/cli.test.ts`
  - (happy) fake の cwd から pull → copy が出て、`--run` なしでは変わらない
  - (happy) fake の cwd から push → 向きが逆で同じ結果
  - (happy) product-ready `--run` を tree の cwd で → cycles が消え、3 つの flag が消え、config が消える
  - (happy) `--only cycles` を tree の cwd で → cycles だけ消える
  - (error) 未知の引数 `--bogus` → 1 行、exit 1
  - (error) cwd に一覧が無い → 1 行、exit 1
  - (error) `starter.json` が無い → 1 行、exit 1、エラーは `scripts/harness/starter.json` だけを名指す
  - _no case_: 消えた `--root` — もう引数として存在しない

## 2.統合: 2 つのスクリプトが引数なしで動く

### Types

なし

### Steps

1. `package.json`:
   - `harness:pull`、`harness:push`、`product:ready` の登録を読み、引数なしの形であることを確かめる。変えない。

2. `README.md`:
   - `--root` の記述が無いことを確かめる。変えない。

### Verify:

- cli: 作業ツリーで次のコマンドを打ち、出力と exit code を読む
  - (happy) `pnpm harness:pull` → `pull:` の行、exit 0（`--run` なしで表示だけ）
  - (happy) `pnpm product:ready` → 切り替えの 2 行と cycles の見出し、exit 0
  - (happy) `pnpm test:run` → 全テスト緑
  - (error) `pnpm harness:pull --bogus` → `unknown argument: --bogus`、exit 1
  - _no case_: `--root` — もう無い

## Notes

### Slice 1: `--root` を消し、ルートは cwd だけにする

- Findings: なし
- Unplanned: なし
- Commit: baf7120

### Slice 2: 統合: 2 つのスクリプトが引数なしで動く

- Findings: なし
- Unplanned: なし
- Commit: 63e803b

## Review

### Round 1

- Stale: なし（scripts/ ・ README.md ・ package.json に `--root` の残りなし。残存ヒットは vitest 自体の `--root` ・別スクリプト scaffold ・過去 plan の記録のみ）
- Unlisted: なし（diff は Files の 6 件のみ。`scripts/harness/index.mjs` ・ `scripts/harness/index.test.ts` ・ `scripts/product-ready/cli.mjs` ・ `scripts/product-ready/cli.test.ts` ・ `scripts/product-ready/index.mjs` ・ `scripts/product-ready/index.test.ts`）
- Gaps:
  - plan が test に求める `(happy) \`--only cycles\`` が index レベルで一切行われていない（`cycles/261020-025-dev/plan/ex-harness-root.md:59`）。`scripts/product-ready/index.test.ts:163`は`--only` の値無し異常系のみで、`--only` 付き happy（cycles だけ消える）は無い（`scripts/product-ready/cli.test.ts:72` は parseArgs の読みのみ）
    - fixed: `scripts/product-ready/index.test.ts` に `--only cycles` 付き `--run` の happy を追加し、tree の cwd で cycles が消えることを確かめた
- Unproven:
  - `scripts/harness/index.test.ts:296` は新道の存在だけ確かめ、旧道の不在を確かめない。plan は「新しい道だけを名指す」（`cycles/261020-025-dev/plan/ex-harness-root.md:32,62`）を求めるので、`(was ...)` が残っても緑のまま
    - fixed: 期待を完全一致に変え、新しい道だけを名指すことを確かめた
- Doubts:
  - `scripts/harness/index.mjs:98` の三項は両枝同一の残骸に見えるが、コードの冗長であり Stale（文書・コメント・テスト）の定義外なので finding にしない
  - `cycles/261020-025-dev/plan/harness-tooling.md:286` の `--root` 付き例は今は通らないが、過去 cycle の記録であり現行文書ではないので finding にしない
  - push の表示テスト（`scripts/harness/index.test.ts:218`）は同内容で label のみ見るが、向き違いの実写は --run テスト（`scripts/harness/index.test.ts:368`）が賄うので finding にしない

## Acceptance

- Ran: 3 つのテストファイル 65 tests、`pnpm test:run` 42 files / 708 tests、`pnpm typecheck` root ok / .pi ok、`pnpm lint` exit 0、`pnpm format:check` 緑。統合: `pnpm harness:pull` は `pull:` の行で exit 0、`pnpm product:ready` は切り替えの 2 行と cycles の見出しで exit 0、`pnpm harness:pull --bogus` は `unknown argument: --bogus` で exit 1。壊し確認は 3 つ: `scripts/harness/index.mjs` のルートを `cwd/x` にすると `scripts/harness/index.test.ts` が 31 件赤、`scripts/product-ready/index.mjs` のルートを `cwd/x` にすると `scripts/product-ready/index.test.ts` が 7 件赤、エラー文に `(old)` を戻すと完全一致の 1 件が赤。いずれも戻して、全体が緑に戻ることを確かめた。
- Findings: なし。review Round 1 の 2 件は fixed し、Round 2 で確認した。壊し確認の 3 つはすべて赤になった。
- Doubts: なし
