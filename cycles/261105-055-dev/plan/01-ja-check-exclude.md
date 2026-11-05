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
  - なし
- Unplanned:
  - 自前の `globToRegExp` を、ADR の `Adopted` に従って `node:path` の `matchesGlob` に戻した（`Options` の B は採用しなかった）。
  - 新しい `exclude` の happy の事例を `describe('ja-check exclude')` に分けた（`max-lines-per-function` の 240 行を超えないため）。
- Commit:
  - fbe1696 consult(ja-check-exclude): read exclude list and skip before reading
- Stopped:
  - なし

### Slice 2: コードに固定した範囲判定を削除する

- Findings:
  - なし
- Unplanned:
  - なし
- Commit:
  - 3aa6dd7 consult(ja-check-exclude): drop hardcoded heading check
- Stopped:
  - なし

### Slice 3: 説明を合わせる

- Findings:
  - なし
- Unplanned:
  - なし
- Commit:
  - 10221bf consult(ja-check-exclude): mention exclude in readmes
- Stopped:
  - なし

### Cleanup: 引用符の単独スキップと相対パスの重複

- Dropped:
  - `./ROADMAP.md` を引数にする事例（素の相対パスと同じ join と相対化の分岐であり、素の相対パスと絶対パスで分岐の両側を覆っているため）。
- Kept:
  - 単一引用、バッククォート、二重引用の単独スキップ、引用の外に文字を伴う報告、前後の切り詰め、例外の 5 件、error と warn の基本、引数なし、読めないファイルの読み飛ばし、`cycles/a.md` の報告、入れ子の `affected.md` の除外、`src/ROADMAP.md` の報告、素の相対と絶対の `ROADMAP.md` の除外、設定ファイル自身の除外、該当なし、設定なし、壊れた JSON、キーと値の型、例外と除外の検証の各 3 件、余分な欄、頂点が非レコードの設定。
- Findings:
  - なし
- Unplanned:
  - なし

## Work Review

### Round 1

- Stale:
  - なし — scripts/checks/ja-check.mjs:5 と scripts/checks/ja-check.test.ts:6 の除外コメントや README.md:50 と README.ja.md:50 の説明文は新しい振る舞いと一致し、isZeroHeading などの旧名の grep も残存ゼロのため陳腐化はない。
- Unlisted:
  - なし — 差分の 6 件は Files の 5 件と計画 md 自体の記録更新のみで、lefthook.yaml・ROADMAP.md・affected.md への未記載の変更はない。
- Gaps:
  - scripts/checks/ja-check.test.ts:219 — バッククォート単独とダブルクォート単独のスキップ検査が消えて single-quote だけが残り、scripts/checks/ja-check.mjs:151 の 3 種の引用符リテラルの typo を検出できず、Cleanup の「同じ分岐」との説明は引用符文字の違いを見落としているため該当振る舞いを検査が運動していない。
    fixed: バッククォート単独とダブルクォート単独のテストを戻した。引用符のリテラルはそれぞれ別の分岐である。
- Unproven:
  - scripts/checks/ja-check.test.ts:207 — ja-check.json 自体の検査は、設定内容の禁則語が引用符付きでしか現れず findUnquoted に必ず跳ばされるため、scripts/checks/ja-check.mjs:105 の configRelPosix の一致判定を削っても green のままで自己除外を証明していない。
    fixed: 設定ファイル自身のテストを、`error` の値が error 語を `x` と `y` で挟む形に変えた。語が引用符の間の単独ではなくなり、同じ内容の probe ファイルは除外なしで error 1 を報告する。
- Noise:
  - なし — 新設の exclude の happy/error 計 7 件は実行時 JSON の境界検証とパス一致の表裏を担い、型や決定値で片付くものや魔数・直書き文字列による断言はない。
- Doubts:
  - なし

### Round 2

- Stale:
  - なし — fixed:行がないため今回の確認対象外。
- Unlisted:
  - なし — fixed:行がないため今回の確認対象外。
- Gaps:
  - なし — 直っている。scripts/checks/ja-check.test.ts:265（バッククォート単独）と:277（ダブルクォート単独）が:222（単一引用）と並存し、scripts/checks/ja-check.mjs:151 の 3 種リテラルのいずれに typo があっても対応する検査が落ちるため、Round 1 の「引用符文字の違いを見落とし」が解消している。なお c3d829d..HEAD の差分に引用検査の増減が出ないのは、削除と復活が相殺されたためで、現行ファイルの 3 件並存で確認した。
- Unproven:
  - なし — 直っている。scripts/checks/ja-check.test.ts:207-211 が `error` の値を `x${ERROR_WORD}y` に変えたため、設定 JSON 内の値側の出現は前後が引用符でなく scripts/checks/ja-check.mjs:142 の quoted-alone 判定を素通りし、scripts/checks/ja-check.mjs:105 の configRelPosix 一致を削れば error 報告で当該検査が落ちる。よって自己除外なしでは green にならず、証明力が成立している。「同じ内容の probe ファイルは除外なしで error 1」は新規テストの主張ではなく対照の説明であり、不足ではない。
- Noise:
  - なし — fixed:行の 2 件は既存検査の復活と値の 1 行変更のみで、新規の型や決定値の追加はないため。
- Doubts:
  - なし

## Acceptance

- Ran:
  - スライス 1 の `Added` — `cycles/999-probe/affected.md` に error 語 `雛形` を置いて実行し、`No findings` と `1 files, error 0, warn 0.` で exit 0 を確かめ、一時ディレクトリを消した。
  - スライス 2 の `Added` — `probe/ROADMAP.md` に `## 0.x.x` と error 語を置いて実行し、error 1 件で exit 1 を確かめ、一時ディレクトリを消した。
  - スライス 3 の `Added` — `node scripts/checks/ja-check.mjs README.ja.md README.md` が `No findings` と `2 files, error 0, warn 0.` で終わることを確かめた。
  - `pnpm test:related scripts/checks/ja-check.mjs scripts/checks/ja-check.test.ts` — 32 件が通過。
  - `pnpm test:run` — 63 ファイル、761 件が通過。
  - `pnpm typecheck` — `root: ok`、`.pi: ok`。
  - `pnpm lint` と `pnpm format:check` — 通過。
  - `isZeroHeading`、`isHeading`、`isRoadmap`、`inZero` を `scripts` で grep し、0 件を確かめた。
  - 振る舞いを壊して赤になるかの確認（いずれも戻して緑にした）:
    - `isExcluded` の先頭で `return false` にする → `exclude` の 3 件と設定ファイル自身の 1 件、計 4 件が赤になった。
    - 設定ファイル自身の除外の分岐を消す → 設定ファイル自身の 1 件が赤になった。
    - `path.matchesGlob` を完全一致に置き換える → 入れ子の `affected.md` の 1 件が赤になった。
  - 壊したファイルは元の内容に戻し、`git status` に残るのが記録と README の 2 件だけであることを確かめた。
- Findings:
  - `README.ja.md:50` と `README.md:50` — `exclude` がバッククォートに囲まれておらず、`README.ja.md` は英字の前後に空白がなく、同じファイルの他の行の表記と揃っていない。
    - fixed: 両方を `exclude` のバッククォート囲みにし、`README.ja.md` は「設定の `exclude` に書いたパスは検査しない。」に直した。
- Doubts:
  - なし
