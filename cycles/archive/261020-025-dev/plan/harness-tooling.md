# PLAN `harness-tooling`

## Files

```text
scripts/
  harness/
    index.mjs                add
    list.mjs                 add
    harness.json             add
    starter.json             add
    index.test.ts            add
    list.test.ts             add
    config.test.ts           add
  harness.mjs                drop
  harness-state.mjs          drop
  harness.json               drop
  harness.mode.json          drop
  harness.test.ts            drop
  harness-state.test.ts      drop
  product-ready/
    index.mjs                update
    cli.mjs                  update
    index.test.ts            update
    cli.test.ts              update
  checks/
    typecheck.mjs
    typecheck-staged.mjs
    scopes.json
vitest.config.ts             update
vitest.starter.config.ts     add
package.json                 update
.gitignore                   update
lefthook.yaml
tsconfig.json
test/
  setup.ts
  tmp.ts
  env.test.ts
  README.md                  update
README.md                    update
README.ja.md                 update
DEFINITION.md
```

## 1.置き場と登録

### Types

```ts
type HarnessList = {
  readonly copy: readonly string[];
  readonly skip: readonly string[];
  readonly legacy: readonly string[];
};
type Applied = {
  readonly copied: readonly string[];
  readonly removed: readonly string[];
  readonly legacy: readonly string[];
};
readList(root: string): HarnessList
applyTo(fromRoot: string, toRoot: string, list: HarnessList, diff: Diff): Applied
```

### Steps

1. `scripts/harness/list.mjs`:
   - `scripts/harness.mjs` の `readList` を移す。読む道は `scripts/harness/harness.json` にする。
   - `legacy` を読む。無ければ `[]`。配列でなければ投げる。
   - `HarnessList` の型をここに置く。

2. `scripts/harness/harness.json`:
   - `scripts/harness.mjs`、`scripts/harness.json`、`scripts/harness.test.ts`、`scripts/harness-state.mjs`、`scripts/harness-state.test.ts` の 5 行を `scripts/harness` 1 行にする。
   - `legacy` に `scripts/harness.mjs`、`scripts/harness-state.mjs`、`scripts/harness.json`、`scripts/harness.mode.json`、`scripts/harness.test.ts`、`scripts/harness-state.test.ts` を置く。
   - `skip` はこの時点で `logs`、`harness.local.json`、`harness.mode.json` のままにする。

3. `scripts/harness/index.mjs`:
   - `scripts/harness.mjs` の本体を移す。`readList` は `./list.mjs` から読む。
   - `main` は `toRoot` に実在する `legacy` の道だけを集め、`formatLines` と `applyTo` に渡す。
   - `applyTo` は `diff` を当てた後に `legacy` を `rmSync(recursive: true, force: true)` で消す。

4. `scripts/harness/index.test.ts`:
   - `scripts/harness.test.ts` を移す。`SCRIPT` を `scripts/harness/index.mjs` にし、`writeList` の道を `scripts/harness/harness.json` にする。
   - `test/tmp.ts` の import を `../test/tmp.ts` から `../../test/tmp.ts` にする。
   - `legacy` のケースを足す（下の Verify）。

5. `scripts/harness-state.mjs`:
   - `readList` の再公開を `./harness/list.mjs` にする。

6. `scripts/harness-state.test.ts`:
   - fixture の `scripts/harness.json` を `scripts/harness/harness.json` にする。
   - この repo の一覧の assertion を新しい一覧に合わせる。

7. `vitest.config.ts`:
   - `readList` の import を `./scripts/harness/list.mjs` にする。

8. `package.json`:
   - `harness:pull` を `node scripts/harness/index.mjs pull`、`harness:push` を `node scripts/harness/index.mjs push` にする。

9. `scripts/harness.mjs`、`scripts/harness.json`、`scripts/harness.test.ts` を消す。

### Verify:

- test: `scripts/harness/index.test.ts`、`pnpm vitest run scripts/harness/index.test.ts scripts/harness-state.test.ts`
  - (happy) 一覧が `scripts/harness/harness.json` にある 2 つのツリー → pull が copy を表示し、`--run` なしでは両方が変わらない
  - (happy) 古い `scripts/harness.json` だけがあるツリー → 1 行で exit 1（新しい道を読んでいる証拠）
  - (happy) 先にだけ `scripts/harness.mjs` があり、一覧の `legacy` にそれが入っている → `legacy (1):` に出て、`--run` で消える。元の側は変わらない
  - (happy) 同じツリーで `--run` なし → `legacy (1):` は出るが、`scripts/harness.mjs` は消えない
  - (empty) `legacy` が無い一覧 → `no legacy to remove`
  - (empty) `legacy` にある道が先に無い → `no legacy to remove`、exit 0
  - (boundary) この repo の一覧 → `copy` に `scripts/harness` があり、旧 5 つの道が無い
  - (error) 一覧の道が無い → 1 行、exit 1
  - (error) 一覧の `copy` が配列でない → 1 行、exit 1
  - (error) 一覧の `legacy` が配列でない → 1 行、exit 1
  - _no case_: `harness:pull` / `harness:push` の登録 — `package.json` の文字列で、実行は統合の slice が見る

## 2.相手の道を `starter.json` に分ける

### Types

```ts
type Starter =
  | { readonly kind: 'self'; readonly path: string }
  | { readonly kind: 'other'; readonly path: string };
readStarter(root: string): Starter
```

### Steps

1. `scripts/harness/starter.json`:
   - `{ "starter": "~/Desktop/main/_pj-starter-pi-v3" }` を置く。

2. `scripts/harness/index.mjs`:
   - `readStarter` は `scripts/harness/starter.json` を読み、`~` を HOME に開き、相対は `root` から解決する。
   - 解決した道が `root` と同じなら `{ kind: 'self' }`、違えば `{ kind: 'other' }` を返す。
   - `main` は `readStarter` を `readList` より先に呼び、`self` なら `same: <path>` を 1 行出して 0 で終わる。
   - `starter.json` が無い時のエラーに、古い `scripts/harness.local.json` の道を添える。

3. `scripts/harness/index.test.ts`:
   - `writeLocal` を `writeStarter` にし、道を `scripts/harness/starter.json` にする。
   - `same`、相対、skip、`starter.json` の異常のケースを足す。

4. `scripts/harness/harness.json`:
   - `skip` を `["logs", "starter.json"]` にする。

5. `.gitignore`:
   - `scripts/harness.local.json` の行を消す。

### Verify:

- test: `scripts/harness/index.test.ts`、`pnpm vitest run scripts/harness/index.test.ts`
  - (happy) `starter.json` が別のツリーを指す → pull がそのツリーから copy する
  - (happy) `scripts/harness` を copy に入れ、両側の `starter.json` が違い、skip に `starter.json` がある → copy/remove に `starter.json` が出ず、local の中身が変わらない
  - (happy) `starter.json` が `root` と同じで、一覧も無い → `same: <root>` の 1 行、exit 0、両方のツリーが変わらない
  - (happy) `~/starter` と `HOME` の fake → その下から copy する
  - (boundary) `../starter`（相対）→ `root` から解決して copy する
  - (error) `starter.json` が無い → 1 行、exit 1、エラーに `scripts/harness/starter.json` と古い道が入る
  - (error) `starter.json` が JSON でない → 1 行、exit 1
  - (error) `{}` → 1 行、exit 1
  - (empty) `{ "starter": "" }` → 1 行、exit 1
  - (error) 指す道が無い → 1 行、exit 1
  - _no case_: この repo の `starter.json` の値がこのマシンで正しいこと — 統合の `same` が確かめる

## 3.テストのスイッチを config に移す

### Types

```ts
function harnessExcludes(list: HarnessList): readonly string[]
function testConfig(harness: boolean): UserConfig
type SwitchPlan = { readonly config: boolean; readonly scripts: readonly string[] };
switchLines(plan: SwitchPlan): readonly string[]
```

### Steps

1. `scripts/harness/list.mjs`:
   - `harnessExcludes` を足す。`copy` の各道から `<道>` と `<道>/**` を作る。末の `/` は落とす。空と `.` は飛ばす。

2. `scripts/harness/list.test.ts`:
   - `scripts/harness-state.test.ts` の `readList` と `includeList` のケースを移し、`includeList` を `harnessExcludes` に置き換える。
   - `test/tmp.ts` の import を `../test/tmp.ts` から `../../test/tmp.ts` にする。

3. `scripts/harness/config.test.ts`:
   - `../../vitest.config.ts` の `testConfig` と、`../../vitest.starter.config.ts` の既定を読み、下のケースを試す。

4. `vitest.config.ts`:
   - `testConfig(harness)` を export する。本体は `setupFiles`、`reporters`、`passWithNoTests` で、`false` の時だけ `exclude: [...configDefaults.exclude, ...harnessExcludes(readList(root))]` を足す。
   - 既定は `defineConfig(testConfig(false))`。

5. `vitest.starter.config.ts`:
   - `defineConfig(testConfig(true))` を返す 3 行。

6. `package.json`:
   - `test`、`test:run`、`test:related` に `--config vitest.starter.config.ts` を足す。

7. `scripts/product-ready/index.mjs`:
   - `readMode` / `writeMode` を読まない。
   - `package.json` を先に読み、JSON でなければ 1 行で exit 1（cycles を消す前）。
   - 3 つのスクリプトから ` --config vitest.starter.config.ts` を外す。無いスクリプトは飛ばす。
   - `vitest.starter.config.ts` を消す。
   - 表示は `switchLines` の 2 行と `planLines`。`--run` の時だけ cycles を消し、`package.json` を書き、config を消す。

8. `scripts/product-ready/cli.mjs`:
   - `modeLine` を消し、`switchLines` を足す。
   - `parseArgs` と `planLines` はそのまま。

9. `scripts/product-ready/index.test.ts` と `scripts/product-ready/cli.test.ts`:
   - mode の代わりに `package.json` と `vitest.starter.config.ts` を用意する。
   - `modeLine` のケースを `switchLines` に置き換える。

10. `scripts/harness/harness.json`:
    - `skip` から `harness.local.json` と `harness.mode.json` を外す（`starter.json` だけ残す）。

11. `scripts/harness-state.mjs`、`scripts/harness-state.test.ts`、`scripts/harness.mode.json` を消す。

### Verify:

- test: `scripts/harness/list.test.ts`、`scripts/harness/config.test.ts`、`scripts/product-ready/cli.test.ts`、`scripts/product-ready/index.test.ts`、`pnpm vitest run scripts/harness/list.test.ts scripts/harness/config.test.ts scripts/product-ready/cli.test.ts scripts/product-ready/index.test.ts`
  - (happy) `harnessExcludes({ copy: ['.pi'], skip: [], legacy: [] })` → `['.pi', '.pi/**']`
  - (happy) `copy` が 2 つ → 4 つの glob が一覧の順に並ぶ
  - (boundary) `'.pi/'` → `'.pi'` と `'.pi/**'`
  - (empty) `copy: []` → `[]`
  - (empty) `copy: ['', '.']` → `[]`
  - (happy) `testConfig(false)` → `exclude` が `configDefaults.exclude` で始まり、`.pi` と `.pi/**` を含む
  - (happy) `testConfig(true)` → `test.exclude` が無い
  - (happy) `testConfig(false)` と `testConfig(true)` → どちらも `setupFiles: ['./test/setup.ts']`、`passWithNoTests: true`、空でない `reporters` を持つ
  - (happy) `vitest.starter.config.ts` の既定 → `test.exclude` が無い
  - (happy) `switchLines({ config: true, scripts: ['test', 'test:run'] })` → `config: vitest.starter.config.ts` と `scripts: test, test:run` の 2 行
  - (empty) `switchLines({ config: false, scripts: [] })` → `no config to remove` と `no scripts to change`
  - (happy) product-ready `--run` → cycles が消え、3 つのスクリプトから flag が消え、`vitest.starter.config.ts` が消える
  - (happy) `--run` なし → `switchLines` の 2 行と cycles の見出しが出て、cycles は残り、`package.json` と config は変わらない
  - (happy) もう一度 `--run` → `no scripts to change` と `no config to remove`、exit 0
  - (boundary) flag の無いスクリプトが混ざる → その 1 つは残り、他は変わる
  - (error) `package.json` が無い → 1 行、exit 1、cycles は残る
  - (error) `package.json` が JSON でない → 1 行、exit 1、何も変わらない
  - _no case_: flag が実際の vitest を starter の config に向けること — 統合の `pnpm test:run` が見る

## 4.`product` の説明を書き換える

### Types

なし

### Steps

1. `README.md`:
   - Getting started の `product:ready` の行を、cycles を消し、`test*` の flag を外し、`vitest.starter.config.ts` を消すと書き換える。
   - 検査のハーネスのテストの行を、starter config で回り、product config では外れると書き換える。
   - ハーネスの節を、`pnpm harness:pull` / `pnpm harness:push`、`scripts/harness/harness.json`、`scripts/harness/starter.json`、このサイクルより前のプロダクトの一度きりの移行に合わせる。

2. `README.ja.md`:
   - 同じ 3 か所を同じ意味で書き換える。

3. `test/README.md`:
   - `mode` の話を消し、ハーネスのテストは starter config で回り、product config の `exclude` で外れると書く。

### Verify:

- read: `review` サブエージェントが `README.md`、`README.ja.md`、`test/README.md` を読み、次の各ケースを報告する
  - (happy) `README.md` の Getting started の `product:ready` の行を読む → mode の話が無く、`test*` の flag を外し、`vitest.starter.config.ts` を消すと読める
  - (happy) `README.md` の Checks のハーネスのテストの行を読む → starter config で回り、product config で外れると読める
  - (happy) `README.md` の Harness の節を読む → `pnpm harness:pull` / `pnpm harness:push`、`scripts/harness/harness.json`、`scripts/harness/starter.json`、前に作ったプロダクトの移行が書かれている
  - (happy) `README.ja.md` を読む → 同じ 3 か所が同じ意味で書かれている
  - (happy) `test/README.md` を読む → mode の話が無く、starter config と product config の `exclude` で説明している
  - (empty) 3 つを `harness.mode.json`、`harness.local.json`、`scripts/harness.mjs` で探す → 旧い形として説明している所が無い（移行の 1 行だけが旧い道を名指す）
  - _no case_: 文面の読みやすさ — 読む者の判断で、機械では決まらない

## 5.統合: ハーネスの形

### Types

なし

### Steps

1. `vitest.starter.config.ts`:
   - 中身を読み、`testConfig(true)` を返していることを確かめる。変えない。

2. `package.json`:
   - `harness:pull` / `harness:push` の登録と、3 つの `--config` を読む。変えない。

### Verify:

- cli: 作業ツリーで次のコマンドを打ち、出力と exit code を読む
  - (happy) `scripts/harness/starter.json` が自分自身を指す一時ディレクトリを作り、`pnpm harness:pull -- --root <そのディレクトリ>` → `same: <そのディレクトリ>`、exit 0
  - (happy) 同じディレクトリに `pnpm harness:push -- --root <そのディレクトリ>` → `same: <そのディレクトリ>`、exit 0
  - (happy) `pnpm test:run` → exit 0、出力に `.pi/` と `scripts/harness/` のテストファイルが出る
  - (happy) `pnpm exec vitest run` → exit 0、0 files（既定の config がハーネスの道を外す）
  - (happy) `pnpm typecheck` → root: ok、`.pi`: ok、exit 0
  - (happy) `pnpm lint` → exit 0
  - (happy) `pnpm format:check` → exit 0
  - (boundary) `pnpm product:ready`（`--run` なし）→ 切り替えの 2 行と cycles の見出しが出る（何も変わらないことは slice 3 のケースが見る）
  - _no case_: 3 つの doc の文面 — slice 4 の `read` が見る

## Notes

### Slice 1: 置き場と登録

- Findings: なし
- Unplanned: なし
- Commit: aa7ed32

### Slice 2: 相手の道を `starter.json` に分ける

- Findings: なし
- Unplanned: なし
- Commit: c1b5789

### Slice 3: テストのスイッチを config に移す

- Findings: なし
- Unplanned: なし
- Commit: 23a4b8d

### Slice 4: `product` の説明を書き換える

- Findings: なし
- Unplanned: なし
- Commit: 67388af

### Slice 5: 統合: ハーネスの形

- Findings:
  - `pnpm harness:pull -- --root <dir>`（`push` も同じ）が `unknown argument: --` で exit 1 になる
    - left: `parseArgs` が素の `--` を終端子として無視せず、Slice 5 の Steps が変えない指定のため直さなかった。`--` 無しの `pnpm harness:pull --root <dir>` では `same: <dir>`・exit 0 を確認済み
- Unplanned: なし
- Commit: なし（読み直しだけで、ファイルは動いていない）

### Test cleanup

- `scripts/harness/index.test.ts` から 4 件を削除（いずれも同じ枝の二重検査）：`starter.json が別のツリーを指す` は先頭の pull copy と同じため残さず、`指す道が無い` は `--run` 付きの相手側なし検査に統合、`一覧が JSON として読めない` は `--run` 付きの同名検査に統合、`この repo の一覧` の raw JSON 版は `list.test.ts` の `readList` 版に統合。消えた振る舞いの検査・死んだ分岐の検査は残っていなかった。
- 緑を維持：`vitest --config vitest.starter.config.ts` で 5 files 77 passed、`pnpm typecheck` root ok / .pi ok、`pnpm lint` exit 0、`pnpm format:check` 緑。

## Review

### Round 1

- Stale:
  - 頂きの仕組み書きが copy/remove のまま残り、legacy 消しを述べていない — `scripts/harness/index.mjs:4` は「元にある物は写し、先にだけある物は消す」と書くが、この diff は `applyTo` で `legacy` を `rmSync(recursive:true, force:true)` で消し (`scripts/harness/index.mjs:297-300`)、`formatLines` で `legacy` 節を出す (`scripts/harness/index.mjs:267-275`)。頂きだけが古い。
    - fixed: `scripts/harness/index.mjs:4` の仕組み書きに `legacy` 消しを追記した。
- Unlisted:
  - なし
- Gaps:
  - `無いスクリプトは飛ばす` を試す検査が無い — `scripts/product-ready/index.mjs:54-56` は `TARGET_SCRIPTS` を舐めて `undefined` を飛ばすが、`scripts/product-ready/index.test.ts:98-111` の boundary は 3 鍵そろい (1 つが flag 無し) で、鍵自体が無い `package.json` (例: `scripts` 無し・1 鍵欠け) の検査が無い。Steps 7 の枝が Verify のどこにも出ない。
    - fixed: `scripts/product-ready/index.test.ts` に `scripts` 無しと 1 鍵欠けの 2 件を追加した。
  - 素の `~` / `~foo` (`/` 無し) を試す検査が無い — `scripts/harness/index.mjs:108-112` は `~` 単体と `~/` と `~...` を分けるが、検査は `~/starter` (`scripts/harness/index.test.ts:237-249`) と `../starter` (`scripts/harness/index.test.ts:636-652`) だけで、素の `~` と `~foo` の解決の検査が無い。Steps 2 の「`~` を HOME に開く」の枝が Verify のどこにも出ない。
    - fixed: `scripts/harness/index.test.ts` に `~` 単体（HOME そのもの）と `~foo`（HOME/foo）の 2 件を追加した。
- Unproven:
  - `reporters` の値が壊れても緑のまま — `vitest.config.ts:27` は `verbose ? ['verbose'] : ['default']` に変わった (前は `[['default', { summary: false }]]`) のに、`scripts/harness/config.test.ts:25` は `not.toHaveLength(0)` だけ見る。`['WRONG']` でも `[]` でなく緑であり、Verify の「空でない `reporters` を持つ」(`cycles/261020-025-dev/plan/harness-tooling.md:227`) を満たすまま値の正しさを証明しない。
    - fixed: `vitest.config.ts` の `reporters` を `verbose ? ['verbose'] : [['default', { summary: false }]]` に戻し、`config.test.ts` で完全一致を検証するようにした。
- Doubts:
  - Slice 5 の `pnpm harness:pull -- --root <dir>` が `unknown argument: --` で exit 1 になる件 (`cycles/261020-025-dev/plan/harness-tooling.md:286` 対 `scripts/harness/index.mjs:63-64`)。Notes の通り `--` 無しでは `same:`・exit 0 を確認済みで、Steps が変えない指定のため直さなかった。Verify の `--` が pnpm の渡し方の書き誤りか、素の `--` を終端子として無視すべき仕様かのどちらかが plan だけでは決まらない。finding ではなく doubt とする。
    - left: `--` 対応は CLI 契約の変更で plan の Types/Steps 外のため、Round 1 では直さず Slice 5 の finding として残す。

### Round 2

- Stale: なし — 1件は直っている。`scripts/harness/index.mjs:4` が「古い道は `legacy` として消す」になり、`applyTo:297-300` の `rmSync` と `formatLines:267-275` の `legacy` 節と一致する
- Unlisted: なし（Round 1 に fixed 行なし。確認対象なし）
- Gaps: なし — 2件は直っている。`scripts/product-ready/index.test.ts:113` の `scripts` 無しと `:126` の 1鍵欠けが `index.mjs:54-56` の `undefined` 飛ばしを叩き、`scripts/harness/index.test.ts:656` の `~` と `:669` の `~foo` が `index.mjs:108-112` の分岐を叩く
- Unproven: なし — 1件は直っている。`vitest.config.ts:29` が `[['default', { summary: false }]]` に戻り、`scripts/harness/config.test.ts:20-28` が `toEqual(expected)` の完全一致で `['WRONG']` を緑にしない
- Doubts: なし（fixed 行の確認範囲では新しい疑いは無い）

## Acceptance

- Ran: `pnpm test:run` 42 files / 711 tests、`pnpm exec vitest run` 0 files / exit 0、`pnpm typecheck` root ok / .pi ok、`pnpm lint` exit 0、`pnpm format:check` 緑。`pnpm harness:pull --root <self>` と `pnpm harness:push --root <self>` はどちらも `same: <self>` / exit 0。`pnpm product:ready`（`--run` なし）は `config: vitest.starter.config.ts`、`scripts: test, test:run, test:related`、cycles の見出しを出した。壊し確認は 3 つ: `scripts/harness/index.mjs:120` の self 分岐を `if (false)` にすると `scripts/harness/index.test.ts` の `same` が赤（1 failed）、`scripts/harness/list.mjs:26` の `${rel}/**` を落とすと `scripts/harness/list.test.ts` の 3 件と `scripts/harness/config.test.ts` の 1 件が赤（4 failed）、`scripts/product-ready/index.mjs:80` の `replaceAll` を外すと `scripts/product-ready/index.test.ts` の 4 件が赤。いずれも戻して、全体が緑に戻ることを確かめた。
- Findings: なし。review Round 1 の 4 件は fixed し、Round 2 で確認した。壊し確認の 3 つはすべて赤になった。
- Doubts:
  - plan の Slice 5 の Verify は `pnpm harness:pull -- --root <dir>` と書くが、素の `--` で exit 1 になる。`--root` だけなら `same:` で通る。Notes の Slice 5 に `left:` として残した。
  - このサイクルより前のプロダクトは、`scripts/harness.local.json` の値を `scripts/harness/starter.json` へ手で移す必要がある。`starter.json` は `skip` なので pull では作られない。README の移行の行に書いた。
