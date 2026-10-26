# PLAN `upgrade-run`

- No: 01, 02, 03

## Files

```text
package.json                       update
pnpm-lock.yaml                     update
pnpm-workspace.yaml                update
vitest.config.ts                   update
tsconfig.json                      update
**/*.md                            update
**/*.mjs                           update
```

## Slices

## 1.範囲内の更新と設定の整理

### Types

なし

### Steps

1. `pnpm-lock.yaml`: `pnpm update` を走らせ、範囲内の更新を当てる。レポートの時点で走らせており、直接依存も lockfile も動かなかったので、差分は出ない見込み。
2. `pnpm-workspace.yaml`: `minimumReleaseAgeExclude` から `@earendil-works/pi-*@1.3.0` の 7 行を落とし、`allowBuilds` から `esbuild: false` を落とす。除外の 7 行は、入っている 1.4.0 のどれにも当たっていない。`esbuild` は lockfile に peer の範囲として出るだけで、ツリーには入っていない。

### Verify

- Always:
  - 既定の 5 つ
- Added:
  - other: `pnpm-workspace.yaml` に `@earendil-works/pi-` と `esbuild` が 0 件であることを `grep -c` で見る。`git diff --stat pnpm-lock.yaml` が空であることも見る。
  - base: owner が `pnpm-workspace.yaml` の差分を読み、7 行と `esbuild` が消え、ほかの設定が残っていることを認める。

## 2.@types/node

### Types

なし

### Steps

1. `package.json`: `pnpm update --latest @types/node` で、`@types/node` の範囲を `^26.6.5` にする。
2. `pnpm-lock.yaml`: 解決されたバージョンを読み、26.6.5 でなければ止めて報告する。当たる破壊的変更は 0 件なので、ここで直す `.ts` は無い見込み。

### Verify

- Always:
  - 既定の 5 つ
- Added:
  - other: `pnpm ls @types/node` で、直依存が 26.6.5 であることを見る。推移の 25.9.9（vitest の Vite 経由）が並ぶのは、そのままでよい。
  - base: owner が `package.json` と lockfile の差分を読む。

## 3.lefthook

### Types

なし

### Steps

1. `package.json`: `pnpm update --latest lefthook` で、`lefthook` の範囲を `^2.2.2` にする。`prepare` が走り、`.git/hooks` が入れ直される。
2. `pnpm-lock.yaml`: 解決されたバージョンを読み、2.2.2 でなければ止めて報告する。`lefthook.yaml` は 2.x の書式のままで通るので、設定は変えない見込み。

### Verify

- Always:
  - 既定の 5 つ
- Added:
  - other: `pnpm exec lefthook dump --format json` が設定を読めること（`lefthook.yaml` が 2.x で通る証拠）。
  - other: このスライスの commit が lefthook の pre-commit を通ること（`.git/hooks` が入れ直された証拠）。
  - base: owner が `package.json` と lockfile の差分を読む。

## 4.oxfmt

### Types

なし

### Steps

1. `package.json`: `pnpm update --latest oxfmt` で、`oxfmt` の範囲を `^0.74.0` にする。
2. `pnpm-lock.yaml`: 解決されたバージョンを読み、0.74.0 でなければ止めて報告する。
3. `**/*.md`: `pnpm format` を走らせ、Markdown のネイティブ整形の差分を受ける。差分が `cycles/` に及ぶ時は、commit の前に owner に見せ、記録として読めるかを確かめてから受ける。

### Verify

- Always:
  - 既定の 5 つ（`close` の `collect` のテストが、記録の番号付きの行と入れ子の箇条を読めることを見る）
- Added:
  - other: `pnpm ls oxfmt` が 0.74.0。`.oxfmtrc.json` の差分が空（11 個の設定を残した証拠）。
  - base: owner が md の差分を読み、`cycles/` の記録が読める形のままであることを認める。

## 5.vitest

### Types

なし

### Steps

1. `package.json`: `pnpm update --latest vitest` で、`vitest` の範囲を `^5.0.5` にする。Vite は peer として自動で解決される。
2. `pnpm-lock.yaml`: 解決されたバージョンを読み、5.0.5 でなければ止めて報告する。
3. `vitest.config.ts`: `TestConf` の型が v5 に合わなければ直す。`clearMocks: false` は足さない（`toHaveBeenCalled*` のアサーションが 0 件で、v4 と同じ保証を要するテストが無い）。

### Verify

- Always:
  - 既定の 5 つ（`scripts/harness/config.test.ts` が `testConfig(false)` の除外の振る舞いを見る）
- Added:
  - other: `pnpm ls vitest` が 5.0.5。`pnpm why vite` が 6.4.0 以上（vite は top-level に出ず、`@vitest/mocker` が引く）。`node -v` が 22.12.0 以上。
  - base: owner が `package.json` と `vitest.config.ts` の差分を読む。

## 6.typescript

### Types

なし

### Steps

1. `package.json`: `pnpm update --latest typescript` で、`typescript` の範囲を `^7.0.2` にする。
2. `pnpm-lock.yaml`: 解決されたバージョンを読み、7.0.2 でなければ止めて報告する。
3. `tsconfig.json`: `tsc` が設定の変更を求めるエラーを出した時だけ直す。
4. `scripts/**/*.mjs`、`lib/**/*.mjs`: `tsc` が指した古い JSDoc、expando、CommonJS の書き方を、`typescript-go/CHANGES.md` の `Substitute` の形に直す。`.pi` の `.mjs` は `tsc` の対象外なので、ここでは触らない。

### Verify

- Always:
  - 既定の 5 つ
- Added:
  - other: `pnpm ls typescript` が 7.0.2。
  - base: owner が `tsconfig.json` と `.mjs` の差分を読む。

## 7.監査

### Types

なし

### Steps

1. `package.json`: `pnpm audit --audit-level low` を走らせ、出力と終了コードを読む。
2. `pnpm-lock.yaml`: 残件があれば `pnpm audit --fix=update` を 1 回だけ走らせる。`override` は使わない（owner の OK がある時だけ）。
3. `pnpm-workspace.yaml`: `audit --fix=update` が `minimumReleaseAgeExclude` に書き足した行を読む。入れたバージョンを指す間は残す。
4. `**/*.md`: `fix` が版を動かしたら、既定の 5 つをもう一度通す。

### Verify

- Always:
  - 既定の 5 つ
- Added:
  - other: `pnpm audit --audit-level low` の結果。脆弱性で落ちた時は終了コード 1、レジストリの失敗は例外で、その 2 つを区別して報告する。
  - other: `minimumReleaseAgeExclude` の各行が、いま入っているバージョンを指していること。
  - base: owner が監査のレポートを読み、残件の理由を読んで「想定どおり」と認める。

## Notes

### Slice 1: 範囲内の更新と設定の整理

- Findings:
  - なし
- Unplanned:
  - `.pi/extensions/**/*.test.ts` の lint の警告 6 件を、この slice で直した。plan を書く前に `pnpm lint` が赤で、全 slice の `Always` がその緑を前提にしているため、ここで吸収した。関数 3 つをモジュールの外へ出し、`as unknown as` の 3 件を型で置き換えた。
- Commit: 086ba09
- Stopped:

### Slice 2: @types/node

- Findings:
  - なし
- Unplanned:
  - 計画では推移の 25.9.9（Vite 経由）が並ぶと見ていたが、実際は 26.6.5 の 1 本にまとまった。直すコードは無かった。
- Commit: b002a2d
- Stopped:

### Slice 3: lefthook

- Findings:
  - なし
- Unplanned:
  - なし
- Commit: 24c2f9b
- Stopped:

### Slice 4: oxfmt

- Findings:
  - なし
- Unplanned:
  - なし
- Commit: db0af94
- Stopped:

### Slice 5: vitest

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 6: typescript

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 7: 監査

- Findings:
- Unplanned:
- Commit:
- Stopped:

## Review

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
