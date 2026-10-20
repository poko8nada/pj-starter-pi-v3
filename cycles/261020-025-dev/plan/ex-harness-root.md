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

- Findings:
- Unplanned:
- Commit:

### Slice 2: 統合: 2 つのスクリプトが引数なしで動く

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
