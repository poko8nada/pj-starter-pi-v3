# PLAN `ex-ja-output`

## Files

```text
scripts/
  checks/
    ja-check.mjs             update
    ja-check.test.ts         update
```

## Slices

## 1.報告の出力

### Types

```ts
なし;
```

### Steps

1. `scripts/checks/ja-check.mjs`:
   - このスクリプトは実行するたびに英語の冒頭 2 行を出し、1 行目を `ja-check: Report to the owner. warn needs judgement (commit continues); error must be fixed (commit stops).` とし、2 行目を `ja-check: Replacements are ideas; judge by context and content.` とし、該当 1 件ごとに行を出して `<file>:<line>: <語> → <対応> [warn|error]` のあとに該当箇所の前後 10 文字を `…` で挟んで丸括弧に入れて付け、前後がない側は欠けたまま崩さずに出し、該当が 0 件で設定がある場合は `ja-check: No findings.` の行を出し、設定がない場合は `ja-check: No config.` の行を出してどちらかだけを出し、集計行を `ja-check: <n> files, error <n>, warn <n>.` として 0 件のときも必ず出し、終了コードを（`warn` と引数なしとファイルが読めない場合は `exit 0`、`error` と壊れた設定の場合は `exit 1`）に保ち、100 ファイルを 1 秒未満で処理できるように保ち、1 行目から 4 行目の注釈を新しい出力に合わせて直し、`設定なし` の表記を `ja-check: No config.` にそろえる。
2. `scripts/checks/ja-check.test.ts`:
   - テストの期待値 15 件を新しい出力に合わせて直し、終了コードと振る舞いは変えず、行頭と行末の欠けは既存の単独行の入力で確かめる。
   - (happy) `WARN_WORD` を含む `.md` を渡す → 冒頭 2 行と該当箇所の前後 10 文字と集計行が出て、`exit 0` で終わる。
   - (happy) `ERROR_WORD` を含む `.md` を渡す → `[error]` と該当箇所の前後 10 文字が出て、`exit 1` で終わる。
   - (empty) 該当なしの `.md` を渡す → `ja-check: No findings.` が出て、集計行が出る。
   - (empty) `ja-check.json` がない状態で実行する → `ja-check: No config.` の行が集計行より前に出て、`ja-check: No findings.` は出ない。
   - (boundary) 壊れた `ja-check.json` を渡して実行する → 冒頭 2 行が出て、`exit 1` で終わる。

### Verify

- Always:
  - `pnpm test:related scripts/checks/ja-check.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -n 'and a summary line' scripts/checks/ja-check.mjs` が何も返さないことを確かめる。
- Added:
  - `pnpm test:related scripts/checks/ja-check.test.ts` が 16 件すべて通過する。
  - `mktemp -d` で作った一時ルートに `scripts/checks/ja-check.json`（`WARN_WORD` は `warn`、`ERROR_WORD` は `error`）と 3 個の `.md`（`WARN_WORD` を含む行、該当なしの行、空行）を置き、3 個の `.md` を引数に `node scripts/checks/ja-check.mjs` を実行する → 冒頭 2 行と該当箇所の前後 10 文字と集計行が出て、`exit 0` で終わる。
  - 同じ一時ルートで該当なしの `.md` 1 個だけを引数にして実行する → `ja-check: No findings.` が出て、`exit 0` で終わる。
  - `ja-check.json` を置かずにコマンドを実行する → `ja-check: No config.` が集計行より前に出て、`ja-check: No findings.` は出ず、`exit 0` で終わる。
  - `mktemp -d` で作った一時ルートに 100 個の `.md` を作り、`time node scripts/checks/ja-check.mjs <100 files>` の real が 1 秒未満であることを確かめる。

## Notes

### Slice 1: 報告の出力

- Findings:
- Unplanned:
- Commit:
- Stopped:

## Work Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Unproven:
- Noise:
- Doubts:

## Acceptance

- Ran:
- Findings:
- Doubts:
