# PLAN `ja-check-exclude`

- No: 01
- Place: worktree
- Boundary Plans: なし

## Files

```text
scripts/
  checks/
    ja-check.json         update
    ja-check.mjs          update
    ja-check.test.ts      update
README.md                 update
README.ja.md              update
lefthook.yaml
ROADMAP.md
cycles/
  261105-055-dev/
    affected.md
```

## Slices

## 1.除外の一覧を設定から読み、読み込みの前にスルーする

### Types

```ts
/** `scripts/checks/ja-check.json` の形。`exclude` はリポジトリのルートからの相対パスで、`**` を含められる */
interface JaCheckConfig {
  readonly error: Readonly<Record<string, string>>;
  readonly warn: Readonly<Record<string, string>>;
  readonly exception: readonly string[];
  readonly exclude: readonly string[];
}

/**
 * 引数はスクリプトが受け取ったパス（相対でも絶対でもよい）。
 * リポジトリのルートからの相対パスに直し、区切りを `/` にそろえてから、
 * `exclude` の各パターンと設定ファイル自身に照合し、一致すれば true
 */
function isExcluded(file: string): boolean;
```

### Steps

1. `scripts/checks/ja-check.json`:
   - update: `exception` の後ろに `exclude` の欄を置き、`"ROADMAP.md"` と `"**/affected.md"` をこの順で入れる。
2. `scripts/checks/ja-check.mjs`:
   - update: 設定の検証を `error`、`warn`、`exception`、`exclude` のちょうど 4 欄に組み直し、`exclude` が配列でその要素がすべて文字列であることを確かめる（余分な欄は今と同じく拒否する）。
   - update: 走査の前に `isExcluded` を置き、一致したファイルは読み込まずに飛ばし、設定ファイル自身の除外も同じ関数の中で判定して除外の判定を 1 か所にまとめる。
   - update: 走査の中の見出し判定（`isRoadmap`、`isZeroHeading`、`isHeading`、`inZero`）はこのスライスではそのまま残すが、`ROADMAP.md` は読み込みの前に飛ばされるため走査の中の判定に進まず、この重複した除外はスライス 2 で消す。
   - update: 冒頭のコメントに、`exclude` に一致するパスを読み込まずに飛ばすことを 1 行足す。
3. `scripts/checks/ja-check.test.ts`:
   - update: 冒頭のコメントに、`exclude` に一致するパスを読み込まずに飛ばすことを 1 行足す。
   - update: `validConfig()` に `exclude` の空の配列を足す。
   - update: (happy) `exclude` が `ROADMAP.md` で、`## 1.x.x` の下に error 語を持つ `ROADMAP.md` → 報告せず exit 0（旧の見出し判定では報告される位置）
   - update: (happy) `exclude` が `**/affected.md` で、error 語を持つ `cycles/999-test/affected.md` → 報告せず exit 0
   - update: (happy) `exclude` が `ROADMAP.md` で、error 語を持つ `src/ROADMAP.md` → 報告して exit 1
   - update: (happy) `exclude` が `ROADMAP.md` で、引数がそのファイルの絶対パス → 報告せず exit 0
   - update: (happy) `exclude` が `ROADMAP.md` で、引数が `./ROADMAP.md` → 報告せず exit 0
   - update: (error) `exclude` が配列でない設定 → header 2 行を出して exit 1
   - update: (error) `exclude` の要素が文字列でない設定 → header 2 行を出して exit 1
   - update: (error) `exclude` のない設定 → header 2 行を出して exit 1
   - update: `ROADMAPの0.x.xセクション内のerror語 → 報告しない` と `ROADMAPの1.x.xセクション内のerror語 → 報告する` の 2 本を消す（除外はパスの一致で決まり、見出しの範囲によらないため）。

### Verify

- Always:
  - `pnpm test:related scripts/checks/ja-check.mjs scripts/checks/ja-check.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `exclude` を大小文字を問わず `grep` し、`scripts/checks/ja-check.json`、`scripts/checks/ja-check.mjs`、`scripts/checks/ja-check.test.ts` の記述が一致していることを確かめる。
  - 変更したすべてのファイルを通読し、矛盾、循環、重複、不足、不自然な流れがないか確かめる。
- Added:
  - other — `mkdir -p cycles/999-probe` で一時ディレクトリを作り、その `affected.md` に error 語 `雛形` を書いて `node scripts/checks/ja-check.mjs cycles/999-probe/affected.md` を実行し、`ja-check: No findings.` と `1 files, error 0, warn 0.`、終了コード 0 を確かめ、ディレクトリを消す（実際の設定で `**/affected.md` が効くこと）。

## 2.コードに固定した範囲判定を削除する

### Types

なし

### Steps

1. `scripts/checks/ja-check.mjs`:
   - update: `isZeroHeading`、`isHeading`、`isRoadmap`、`inZero` を消し、走査の前に `isExcluded` だけを置く形に組み直す（走査の中で見出しを見る分岐を残さない）。

### Verify

- Always:
  - `pnpm test:related scripts/checks/ja-check.mjs scripts/checks/ja-check.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `isZeroHeading`、`isHeading`、`isRoadmap`、`inZero` を大小文字を問わず `grep` し、リポジトリに 1 件も残っていないことを確かめる。
  - 変更したすべてのファイルを通読し、矛盾、循環、重複、不足、不自然な流れがないか確かめる。
- Added:
  - other — `mkdir -p probe` で一時ディレクトリを作り、`## 0.x.x` と error 語 `雛形` を含む `probe/ROADMAP.md` を置いて `node scripts/checks/ja-check.mjs probe/ROADMAP.md` を実行し、error 1 件で終了コード 1 になることを確かめ、ディレクトリを消す（ファイル名ではなく、ルートからのパスの一致で除外するようになったこと）。

## 3.説明を合わせる

### Types

なし

### Steps

1. `README.md`:
   - update: japanese-check の 1 行を、`exclude` に書いたパスを検査しないことに触れる文に書き換える（行は増やさない）。
2. `README.ja.md`:
   - update: japanese-check の 1 行を、`exclude` に書いたパスは検査しないことに触れる文に書き換える（行は増やさない）。

### Verify

- Always:
  - `pnpm test:run`（このスライスに関連するテストはない）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep` ツールで `skips the paths listed` を `README.md` から、`に書いたパスは検査しない` を `README.ja.md` から検索し、それぞれ 1 件であることを確かめる。
  - 変更したすべてのファイルを通読し、矛盾、循環、重複、不足、不自然な流れがないか確かめる。
- Added:
  - other — `node scripts/checks/ja-check.mjs README.ja.md README.md` が `ja-check: No findings.` と `2 files, error 0, warn 0.` で終わる（足した日本語によって新しい指摘が出ていないこと）。

## Notes

### Slice 1: 除外の一覧を設定から読み、読み込みの前にスルーする

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 2: コードに固定した範囲判定を削除する

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 3: 説明を合わせる

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
