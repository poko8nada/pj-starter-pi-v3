# PLAN `exception-shape`

- No: 01
- Place: worktree
- Boundary Plans: なし

## Files

```text
scripts/
  checks/
    ja-check.json      update
    ja-check.mjs       update
    ja-check.test.ts   update
  harness/
    harness.json
README.md              update
README.ja.md           update
lefthook.yaml
```

## Slices

## 1.設定の形と照合

### Types

```ts
/** `scripts/checks/ja-check.json` の形。例外は `error` と `warn` の両方に効く */
interface JaCheckConfig {
  readonly error: Readonly<Record<string, string>>;
  readonly warn: Readonly<Record<string, string>>;
  readonly exception: readonly string[];
}

/** 行の中で、引用符の中にも例外にも覆われていない最初の出現の位置。見つからなければ -1 */
function findUnquoted(line: string, word: string): number;

/** テストが一時ルートに書く設定。`validConfig()` の戻り値 */
type TestConfig = JaCheckConfig;
```

### Steps

1. `scripts/checks/ja-check.json`:
   - update: `warn` の後ろに `exception` の空の配列を足し、`error` と `warn` の値は「語 → 置換案」の文字列のまま残す。
2. `scripts/checks/ja-check.mjs`:
   - update: 設定の検証を、`error`、`warn`、`exception` のちょうど 3 欄を要求する形にし、`exception` が配列であり、その要素がすべて文字列であることを確かめる（余分な欄は今とおなじく拒否する）。
   - update: 走査の直後に、例外の語の長さを `L`、ヒットした語の長さを `N`、ヒットの開始位置を `at` として、`0` 以上 `L - N` 以下の各 `k` について `line.slice(at - k, at - k + L)` が例外の語と等しいかを確かめ、どれかが等しければ報告しない処理を挟む。
   - update: `findUnquoted` は、引用符の中のヒットを飛ばすのとおなじく、例外に覆われたヒットも飛ばして次のヒットを返し、1 行に複数のヒットがあるときも、覆われていないヒットを見落とさない。
   - update: 抑止したヒットを `errors` と `warns` に数えず、サマリー行、`No findings` の行、終了コードは報告したヒットだけで今とおなじく組み立てる。
3. `scripts/checks/ja-check.test.ts`:
   - update: `validConfig()` に `exception` の空の配列を足し、戻り値を `TestConfig` にする。
   - update: (empty) `exception` が空の配列で、warn 語 `骨` を含む行 → warn 行を出して exit 0 になる。
   - update: (error) `exception` のない設定 → header の 2 行を出して exit 1 になる。

### Verify

- Always:
  - `pnpm test:related scripts/checks/ja-check.mjs scripts/checks/ja-check.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `exception` を大小文字を問わず `grep` し、`scripts/checks/ja-check.json` と `scripts/checks/ja-check.mjs` の記述が食い違っていないことを確かめる。
  - 変更したすべてのファイルを通読し、矛盾、循環、重複、不足、不自然な流れがないか確かめる。
- Added: なし

## 2.振る舞いのテスト

### Types

なし

### Steps

1. `scripts/checks/ja-check.test.ts`:
   - update: 冒頭のコメントに、例外の語に一致するヒットを報告しないことを加える。
   - update: (happy) `exception` が `骨組み` で、行が `骨組み` → 報告せずに exit 0 になる。
   - update: (happy) `exception` が error 語 `ERROR_WORD` の頭に 1 文字を加えた語で、行がその語 → error 語を報告せずに exit 0 になる。
   - update: (happy) `exception` が `骨組み` で、行が `骨` → 例外に一致しないため warn 行を出して exit 0 になる。
   - update: (happy) `exception` が `入口` で、行が `入り口` → 例外に一致しないため warn 語 `口` の行を出して exit 0 になる。
   - update: (happy) `exception` が `骨組み` で、行が `骨組みと骨` → 2 つ目の `骨` を見落とさずに warn 行を 1 つ出して exit 0 になる。
   - update: (error) `exception` が配列でない設定 → header の 2 行を出して exit 1 になる。
   - update: (error) `exception` の要素が文字列でない設定 → header の 2 行を出して exit 1 になる。

### Verify

- Always:
  - `pnpm test:related scripts/checks/ja-check.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `exception` を大小文字を問わず `grep` し、テストのフィクスチャと検証の記述が食い違っていないことを確かめる。
  - 変更したすべてのファイルを通読し、矛盾、循環、重複、不足、不自然な流れがないか確かめる。
- Added: なし

## 3.文書

### Types

なし

### Steps

1. `README.md`:
   - update: 「Banned Japanese words」の文と `Contributing` の文を、`error`、`warn`、`exception` の 3 欄、`exception` が認める語の配列であること、例外が `error` と `warn` の両方に効くこと、例外の判定がヒットした語の前後だけを見ることを書く形にする。
2. `README.ja.md`:
   - update: 「日本語の禁止語」の文と `Commit` の説明を、`README.md` とおなじ 4 点を書く形にする。

### Verify

- Always:
  - `pnpm test:run`（このスライスに関連するテストはない）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `exception` を大小文字を問わず `grep` し、`README.md`、`README.ja.md`、`scripts/checks/ja-check.json`、`scripts/checks/ja-check.mjs` の記述が食い違っていないことを確かめる。
  - 変更したすべてのファイルを通読し、矛盾、循環、重複、不足、不自然な流れがないか確かめる。
- Added: なし

## Notes

### Slice 1: 設定の形と照合

- Findings: なし
- Unplanned: なし
- Commit: 899a177 consult(exception-shape): add exception config and suppression
- Stopped:
