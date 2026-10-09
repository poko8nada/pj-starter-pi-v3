# PLAN `test-scaffold-and-product-ready`

## Files

```text
.pi/
  extensions/
    consult/
      README.md                （触らない。`gitEnv()` の名前は変わらない）
      run/
        run.ts                 update
        child.ts               update
        worktree.ts            update
        git-env.ts             update
        worktree.test.ts       update
        log.test.ts            update
        delivery.test.ts       update
      child/
        guard.test.ts          update
      policy/
        types.test.ts          update
      tool/
        children.test.ts       update
        worktree.test.ts       update
    quality-gate/
      targets.test.ts          update
    intent-router/
      index.test.ts            update
      command.test.ts          update
      log.test.ts              update
      settings.test.ts         update
      hook/
        route.test.ts          update
        judge.test.ts          update
  test/                        （`.pi/test/`。この木は `.pi/` の下）
    setup.ts                   drop
    tmp.ts                     drop
    env.test.ts                drop
    README.md                  drop
  skills/
    plan/
      SKILL.md                 update
      references/
        format.md              update
    close/
      SKILL.md                 update
      references/
        format.md              update
```

```text
lib/git-env.mjs                add
scripts/product-ready/
  index.mjs                    add
  prune-tests.mjs              add
  prune-cycles.mjs             add
  targets.mjs                  add
  cli.mjs                      add
  index.test.ts                add
  targets.test.ts              add
  cli.test.ts                  add
test/setup.ts                  add
test/tmp.ts                    add
test/env.test.ts               add
test/README.md                 add
vitest.config.ts               update
package.json                   update
README.md                      update
README.ja.md                   update
```

`.pi/test/` の3ファイルは `test/` へ移す（中身は変えない。`env.test.ts` の `gitEnv` の import だけ slice 1 で差し替える）。`tmp.ts` の importer は second-opinion が消えた後の14本。`guard.test.ts:18` と `types.test.ts:10` のコメントも `.pi/test/` と言っているので直す。

`gitEnv` の利用は consult の5ファイル（`run.ts` が定義、`child.ts` / `worktree.ts` / `git-env.ts` / `worktree.test.ts` が読む）。`consult/README.md` は `gitEnv()` と `run/git-env.ts` を名指しする。動くのは `run.ts` の `gitEnv` の定義だけで、README が名指す `run/git-env.ts`（`gitEnvFor` / `runGit`）は動かないので触らない。

README 2枚は plan 1 も触る（13行目と18行目）。plan 1 の merge 後に走るので、この plan は29行目だけを触る。

## Slices

1. `gitEnv` を `lib/git-env.mjs` へ出し、consult をその import に変える
   - I/O:
     ```js
     // lib/git-env.mjs — 型は JSDoc
     /** @param {NodeJS.ProcessEnv} [env] @returns {NodeJS.ProcessEnv} `GIT_*` を落としたコピー */
     export function gitEnv(env = process.env) {}
     ```
   - Verify:
     - test: `pnpm run test:run .pi/test/env.test.ts .pi/extensions/consult/run/worktree.test.ts`
       - 番人の `gitEnv` の1件: `GIT_*` を載せた env → `GIT_*` が消え、`PATH` は残る（happy。`lib/git-env.mjs` を読む）
       - 番人の `gitEnv` の1件: 引数なし → `process.env` から `GIT_*` を落とした物（happy。実際の呼び方。この plan で足す）
       - 番人の `HOME` の1件が緑のまま（happy。`HOME` が `pi-test-home-` を含む＝`setup` が効いている）
       - `worktree.test.ts` の既存ケースが緑のまま（happy。refactor なので挙動は変えない）
       - 権限: 当てはまらない
   - Steps:
     1. `lib/git-env.mjs`: `run.ts:20` の `gitEnv` を、doc コメントごと移す（`GIT_*` を落とす10行）
     2. `.pi/extensions/consult/run/run.ts`: 定義を消し、`../../../../lib/git-env.mjs` から import する（:35 と :234 の使い方はそのまま）
     3. `.pi/extensions/consult/run/child.ts`: import 元を `../../../../lib/git-env.mjs` に変える
     4. `.pi/extensions/consult/run/worktree.ts`: 同上
     5. `.pi/extensions/consult/run/git-env.ts`: 同上
     6. `.pi/extensions/consult/run/worktree.test.ts`: 同上
     7. `.pi/test/env.test.ts`: `gitEnv` の import 元を `../../lib/git-env.mjs` に変え、引数なしで呼ぶケース（既定が `process.env` で `GIT_*` が消える）を足す
2. テストの足場を `test/` へ移し、`vitest` の参照先と14本の import を変える
   - I/O: なし（パスだけが動く。型は動かない）
   - Verify:
     - test: `pnpm run test:run`
       - 全スイートが緑（happy。ファイル数と本数は plan 1 の merge 後の数と同じ）
       - 番人が `test/env.test.ts` として走り、4件緑（happy。`setupFiles` の参照先が効いている。slice 1 で足した1件を含む）
       - 権限: 当てはまらない
     - cli: `pnpm typecheck` と `pnpm lint`
       - ルート `tsconfig.json` は `.pi` を除外するので、`test/` へ移った3ファイルはここで初めて型検査の視野に入る（happy。移す前は見えていなかった）
       - `pnpm lint` が警告込みで緑（happy）
   - Steps:
     1. `test/setup.ts`: `.pi/test/setup.ts` を移す（中身は変えない）
     2. `test/tmp.ts`: `.pi/test/tmp.ts` を移す
     3. `test/env.test.ts`: `.pi/test/env.test.ts` を移し、`gitEnv` の import を `../lib/git-env.mjs` に直す（`test/` から見た深さ。slice 1 では `.pi/test/` から `../../lib/` だった）
     4. `test/README.md`: `.pi/test/README.md` を消し、`test/` のファイル群が何のためにあるかで書き直す（`setup.ts` は保険、`tmp.ts` は規約の土台、`env.test.ts` は番人。ハーネス／プロダクトの区別では書かない）
     5. `vitest.config.ts`: `setupFiles` を `./test/setup.ts` に変え、7行目のコメントを直す（「理由はファイルにを確認」の誤りもここで直す）
     6. `.pi/test/`: 空になったディレクトリを消す
     7. `.pi/extensions/consult/run/log.test.ts` / `run/worktree.test.ts` / `run/delivery.test.ts` / `child/guard.test.ts` / `policy/types.test.ts` / `tool/children.test.ts` / `tool/worktree.test.ts`: `test/tmp.ts` の import を1つ深くする（`../../../` → `../../../../`）。`guard.test.ts` と `types.test.ts` のコメントも `test/tmp.ts` に直す
     8. `.pi/extensions/quality-gate/targets.test.ts` / `.pi/extensions/intent-router/index.test.ts` / `command.test.ts` / `log.test.ts` / `settings.test.ts` / `hook/route.test.ts` / `hook/judge.test.ts`: import を1つ深くする（`../../` → `../../../`、`hook/` の2本は `../../../` → `../../../../`）
3. スキルの `.pi/test/` を `test/` に直し、plan スキルの `read` に実行主体を書く
   - I/O: なし（文書）
   - Verify:
     - read: 子が4ファイルを読み、(1) `plan/references/format.md` の doubles の置き場が `test/` か、(2) `close/SKILL.md` と `close/references/format.md` の置き場が `test/` か、(3) `plan/references/format.md` の `read` の定義と `plan/SKILL.md` の Verify 手順に「子が自分で読み、consult の子が要るチェックは親が走らせ、親は acceptance で念のため読む」が書いてあるかを報告する
   - Steps:
     1. `.pi/skills/plan/references/format.md`: 69行目の `.pi/test/` を `test/` に変え、112行目の `read` の定義に実行主体の1行を足す
     2. `.pi/skills/plan/SKILL.md`: Verify 手順に同じ1行を足す
     3. `.pi/skills/close/SKILL.md`: 37行目の `.pi/test/` を `test/` に変える
     4. `.pi/skills/close/references/format.md`: 34行目の `.pi/test/` を `test/` に変える
4. `prune` の芯（`targets` と `cli`）を書き、消える物の数え方と消し方をテストで固定する
   - I/O:
     ```js
     // scripts/product-ready/targets.mjs — 型は JSDoc。`node` が素で読むので、型注釈の構文は書かない
     /** @returns {readonly string[]} `.pi/` の下の `*.test.ts`（純） */
     export function findTests(root) {}
     /** @returns {readonly string[]} `cycles/` の下の全フォルダ（今のサイクルも含む。純） */
     export function findCycles(root) {}
     /** @returns {readonly string[]} 消した物。無い物は飛ばす（副作用） */
     export function removeTests(root, files) {}
     /** @returns {readonly string[]} 消した物。無い物は飛ばす（副作用） */
     export function removeCycles(root, dirs) {}

     // scripts/product-ready/cli.mjs
     /** @typedef {{ readonly root: string, readonly run: boolean }} PruneArgs */
     /** @returns {PruneArgs} */
     export function parseArgs(argv) {}
     /** @returns {readonly string[]} 表示の行（純） */
     export function planLines(label, targets) {}
     ```
   - Verify:
     - test: `pnpm run test:run scripts/product-ready/targets.test.ts scripts/product-ready/cli.test.ts`
       - `.pi/` の下に `x.test.ts` と `dir/y.test.ts`、`test/` に `z.test.ts` を置いた root → `findTests` は `.pi/` の2本だけを返す（happy。ハーネスのテストだけが対象）
       - `cycles/001-a` と `cycles/002-b` と `cycles/README.md` を置いた root → `findCycles` は2フォルダだけを返す（happy）
       - `.pi/` も `cycles/` も無い root → `[]` と `[]`（empty。投げない）
       - `findTests` に無い root を渡す → 投げる（error。黙って成功しない）
       - `removeTests` を2回呼ぶ → 2回目は `[]`（boundary values。2回目）
       - `removeCycles` を2回呼ぶ → 2回目は `[]`（boundary values。2回目）
       - `planLines('tests', [])` → 1行（消える物が無い旨）、`planLines('tests', ['a', 'b'])` → 3行（見出しと2件）（happy。表示の文字列）
       - `parseArgs([])` → `{ root: process.cwd(), run: false }`、`parseArgs(['--run', '--root', '/x'])` → `{ root: '/x', run: true }`、`parseArgs(['--root'])` → 投げる（invalid input。引数の欠け）
       - 権限: 当てはまらない（一時ディレクトリだけ）
   - Steps:
     1. `scripts/product-ready/targets.mjs`: `findTests` / `findCycles`（純）と `removeTests` / `removeCycles`（副作用）を書く。`remove*` は無い物を黙って飛ばし、消した物を返す
     2. `scripts/product-ready/cli.mjs`: `parseArgs` と `planLines` を書く（どちらも純）
     3. `scripts/product-ready/targets.test.ts`: 列挙と削除のケースを書く。`tmpDir()` に偽の木を作る（`../../test/tmp.ts` から読む）
     4. `scripts/product-ready/cli.test.ts`: `parseArgs` と `planLines` のケースを書く
5. 3つの入口を書き、package に `product:ready` を登録する
   - I/O:
     ```js
     // scripts/product-ready/index.mjs / prune-tests.mjs / prune-cycles.mjs
     // どれも同じ形。引数なしは表示だけ、--run で実行
     /** @param {readonly string[]} argv @returns {number} 終了コード（0 か 1） */
     export function main(argv) {}

     // 底の1行（どの入口も）: process.exitCode = main(process.argv.slice(2))
     ```
   - Verify:
     - test: `pnpm run test:run scripts/product-ready/index.test.ts`
       - `tmpDir()` の偽の木で `node scripts/product-ready/index.mjs --root <tmpDir>`（引数なし）→ 消える物が出力に出て、木は変わらない（happy。既定は表示だけ）
       - 同じ木で `node scripts/product-ready/index.mjs --root <tmpDir> --run` → ハーネスのテストと `cycles/` が消え、`test/` のテストは残る（happy）
       - `node scripts/product-ready/prune-tests.mjs --root <tmpDir>`（引数なし）→ 表示だけ。`--run` を足す → `.pi/` のテストだけが消える（happy。個別に回せる）
       - `node scripts/product-ready/prune-cycles.mjs --root <tmpDir>`（引数なし）→ 表示だけで木は変わらない。`--run` を2回 → 2回目も exit 0（boundary values。既定の表示と2回目）
       - `node scripts/product-ready/prune-tests.mjs --root <無いパス> --run` → exit 1（error。`main` が 1 を返し、`process.exitCode` に渡る）
       - 権限: 当てはまらない
   - Steps:
     1. `scripts/product-ready/prune-tests.mjs`: `cli.mjs` の `parseArgs` / `planLines` と `targets.mjs` の `findTests` / `removeTests` で書く。底で `process.exitCode = main(process.argv.slice(2))` を置く
     2. `scripts/product-ready/prune-cycles.mjs`: 同じ形で `findCycles` / `removeCycles`
     3. `scripts/product-ready/index.mjs`: 両方を順に回す。表示は両方の一覧、`--run` は両方を実行
     4. `package.json`: `"product:ready": "node scripts/product-ready/index.mjs"` を足す
     5. `scripts/product-ready/index.test.ts`: 上のケースを書く。子プロセスは `node` で直に呼ぶ
6. README 2枚の「Getting started」を、手で消す手順から `pnpm product:ready` に変える
   - I/O: なし（文書）
   - Verify:
     - read: 子が `README.md` と `README.ja.md` の Getting started を読み、(1) `cycles/` を手で消す指示が消えているか、(2) `pnpm product:ready` と、引数なし＝表示・`--run`＝実行が書いてあるかを報告する
   - Steps:
     1. `README.md`: 29行目の「Delete `cycles/`」を、`pnpm product:ready` の説明（消える物を先に見られる）に差し替える
     2. `README.ja.md`: 同じ箇所を同じように直す
7. 統合: 足場が `test/` にあり、`product:ready` が表示だけをして、スイートが緑
   - I/O: なし
   - Verify:
     - test: `pnpm run test:run` — 全スイートが緑（happy。移した足場と新しいテストを含む）
     - cli: worktree で `node scripts/product-ready/index.mjs`（引数なし）を走らせ、出力を読む。(1) 消える物（`.pi/` の下の `*.test.ts` と `cycles/` のフォルダ。この時点で 001〜014）が並ぶか、(2) その後に `git status --short` が何も言わないか（何も消えていない）
       - `form`: `grep -rn "\.pi/test" .pi/ test/ vitest.config.ts README.md README.ja.md` が何も返さない（`cycles/` は記録なので除く）
   - Steps:
     1. 上の3つを走らせ、結果を記録する

## Notes

### Slice 1: `gitEnv` を `lib/git-env.mjs` へ出し、consult をその import に変える

- Findings:
  - なし
- Unplanned:
  - なし
- Commit: 1dcdc60

### Slice 2: テストの足場を `test/` へ移し、`vitest` の参照先と14本の import を変える

- Findings:
  - なし
- Unplanned:
  - `test/env.test.ts:5` のコメントを `.pi/test/setup.ts` から `test/setup.ts` に直した、移した後の指し示しを保つため
- Commit: b98c927

### Slice 3: スキルの `.pi/test/` を `test/` に直し、plan スキルの `read` に実行主体を書く

- Findings:
  - なし
- Unplanned:
  - なし
- Commit: 21e41a2

### Slice 4: `prune` の芯を書き、消える物の数え方と消し方をテストで固定する

- Findings:
  - なし
- Unplanned:
  - なし
- Commit: 3222c6c

### Slice 5: 3つの入口を書き、package に `product:ready` を登録する

- Findings:
- Unplanned:
- Commit:

### Slice 6: README 2枚の「Getting started」を、手で消す手順から `pnpm product:ready` に変える

- Findings:
- Unplanned:
- Commit:

### Slice 7: 統合: 足場が `test/` にあり、`product:ready` が表示だけをして、スイートが緑

- Findings:
- Unplanned:
- Commit:

## Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Unproven:

## Acceptance

- Ran:
- Findings:
