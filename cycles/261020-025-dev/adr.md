# ADR 025

## 01: ハーネスの道具を、どこに置き、どう呼ぶか

### Context

- `scripts/` の直下にハーネスのファイルが並び、`node scripts/harness.mjs pull` とパスで呼ぶ。`product-ready` は `scripts/product-ready/` にまとまり `pnpm product:ready` で呼べるので、この差が分かりにくさの 1 つになっている（`memo-harness.md:9-10`）。
- pull と push は既に 1 つのスクリプトで、向きを位置引数で受けている（`scripts/harness.mjs:45-84`）。足りないのは呼び名の登録だけである。
- `--run` を付けた時だけ実行する形はキープする（`memo-harness.md:7`）。
- 置き場を変えると、`harness.json` の一覧、`vitest.config.ts`、`typecheck` の対象、`product-ready` の import、README、`.gitignore`、テストが一緒に動く。

### Decision

- Status: **accepted**
- Adopted:
  - ハーネスの道具を `scripts/harness/` にまとめる。本体、一覧、パスの json、テストを同じ所に置く。
  - `package.json` に `harness:pull` と `harness:push` を登録し、どちらも同じスクリプトへ `pull` / `push` を渡す。
  - `--run` が無ければ表示だけ、は変えない。
- Options:
  - フラットのまま `package.json` に登録だけ足す（置き場の不満が残る）
  - `harness` 1 つを登録し `pnpm harness pull` で向きを渡す（打つたびに向きを書く。2 つ登録すれば 1 打鍵で済む）

### Research & Trial

- pnpm はスクリプト名の後ろの引数をそのまま実行するスクリプトへ渡す（`https://pnpm.io/cli/run`）。だから `harness` 1 つを登録して `pnpm harness pull` と打つ形も、`harness:pull` / `harness:push` の 2 つでも、どちらも成立する。
- `typecheck:staged` が特別扱いするのは `scripts/checks/scopes.json` の `.pi` だけで、`scripts/` はルートの `tsconfig.json` で見る（`scripts/checks/typecheck-staged.mjs:11-28,49-55`）。だから置き場を変えても型チェックの設定は増えない。
- `copy` の一覧から外れた道は `remove` の対象にならない（`scripts/harness.mjs:236-259`）。既存のプロダクトでは、フラットな古いファイルが残る。消すのを手にするか product-ready の仕事にするかは design が決める。

### Definition Change

- なし

## 02: スターターのパスを、どう持つか

### Context

- 今日は `scripts/harness.local.json` に `{ "starter": "~/..." }` で持ち、gitignore してある（`scripts/harness.mjs:118-147`、`.gitignore:41`）。clone のたびに手で書く必要がある。
- `harness.json` は `copy` の一覧に入っていて、pull / push で丸ごと写る（`scripts/harness.json:19`）。だからパスをここに置くと、打った向きの側の値で上書きされる。
- スターターは 1 つで、このスターターは owner しか使わない。だからスターターが自分のパスを持ち、clone がそれを受け取る形で足りる。
- スターターで pull / push を打つと、相手は自分自身になる。

### Decision

- Status: **accepted**
- Adopted:
  - スターターのパスだけを持つ `scripts/harness/starter.json` を置き、commit する。
  - `harness.json` の `skip` に入れ、pull / push の対象にしない。`scripts/harness/` は copy の対象だが、このファイルだけは名前で外す。
  - スターターは自分自身のパスを持ち、`root` と同じなら `same` と出して終わる。
  - `scripts/harness.local.json` と `.gitignore` のその行を消す。
- Options:
  - `harness.json` に置く（commit され、写るので、pull と push が逆の向きで上書きし合う。値が食い違う時、どちらが正しいかを道具が聞かない）
  - `scripts/harness.local.json` を gitignore のまま（clone のたびに手で書く。clone が値を引き継げない）

### Research & Trial

- `skip` は道ではなくファイル名で照合する（`scripts/harness.mjs:170-177`）。だから分ける json の名前は、他の `local.json` を巻き込まない特定できる名前にする。
- pull は走らせる側の値で相手を読み（`scripts/harness.mjs:414-420`）、差分の後に `harness.json` を相手の値で上書きする（`scripts/harness.mjs:421-433`）。だから `harness.json` に置くと、直した側と直した順で勝ちが変わる。

### Definition Change

- なし

## 03: プロダクトでハーネスのテストを回さないことを、どう表すか

### Context

- 今日は `scripts/harness.mode.json` の `starter` / `product` を `vitest.config.ts` が読み、`product` の時だけ一覧の道を否定の glob で外す（`scripts/harness-state.mjs:30-47`、`vitest.config.ts:16`）。
- 状態を書くのは product-ready で、読むのは vitest と product-ready 自身の表示だけである（`scripts/product-ready/index.mjs:1,26-33`）。
- product-ready は「プロダクトにする」という名前の仕事で、ハーネスのテストを外すのはプロダクトだけなので、状態という別の値を挟む理由が無い（owner）。
- owner は、config を starter 用と product 用に分ける整理を出した。product-ready が starter 用の config を消すだけで済む形を望んでいる。

### Decision

- Status: **accepted**
- Adopted:
  - `vitest.config.ts`（copy の中）に `testConfig(harness: boolean)` を置き、既定は `testConfig(false)`（product）。
  - product の `exclude` は `configDefaults.exclude` に、`harness.json` の `copy` から組み立てた glob を足した物にする。`test.exclude` は既定を置き換えるため、既定を自分で足す。
  - `vitest.starter.config.ts`（copy の外、commit する）は `testConfig(true)` を返す。
  - starter の `test` / `test:run` / `test:related` に `--config vitest.starter.config.ts` を付ける。
  - product-ready はその 3 つのフラグを外してから、`vitest.starter.config.ts` を消す。
  - `scripts/harness.mode.json` と、`readMode` / `writeMode` / `includeList` を消す。
- Options:
  - 状態を消し、product-ready が `package.json` の `test*` に `--exclude` を書く（除外が product-ready を打った時点で凍る）
  - 状態を消し、product-ready がプロダクト専用の config を書いて `--config` を足す（その config は pull で更新されないので、ハーネスの道が動くと import が切れる）
  - 状態を消し、product-ready は直す所を表示するだけ（手作業になり、忘れると重いテストが黙って回る）
  - 状態を残す（product-ready が書き、vitest が読む。owner が「不要」と言った形）
  - 出荷する config が starter 用 config の有無で分岐する（消すだけは成立するが、有無を読む＝mode の戻り）
  - starter を `vitest.config.ts`、product を `vite.config.ts` にする（消すだけは成立するが、テストの設定が pull で届かなくなり、同じ設定を 2 枚に持つ）

### Research & Trial

- 入っている vitest は 4.1.11（`node_modules/vitest/package.json:4`）。
- vitest が自動で読む config は `vitest.config.*` → `vite.config.*` の順（`node_modules/vitest/dist/chunks/constants.CPYnjOGj.js:6`）。
- `--config` に無い道を渡すと起動エラーになる。試した: `vitest run --config nope.config.ts` は `Cannot resolve entry module` で exit 1。
- `test.exclude` は既定の除外（`**/node_modules/**`、`**/.git/**`）を置き換える（`node_modules/vitest/dist/chunks/coverage.DM_a_rWm.js:162-167`、`defaults.9aQKnqFk.js:5-6`）。
- CLI の `--exclude <glob>` は `run` と `related` の両方にあり、繰り返せて、既存の除外に足される（`node_modules/vitest/dist/chunks/cac.uFydS1Z4.js:1080-1084,2261-2262`、`coverage.DM_a_rWm.js:355`）。
- `related` は除外した後に staged のファイルで絞るので、除外したハーネスのテストがステージで復活しない（`node_modules/vitest/dist/chunks/cli-api.CnMVyzaz.js:11497-11514`）。
- 実際に `vitest run --exclude 'scripts/**'` を打つと、`scripts/` のテストは走らず、34 ファイル / 600 本が緑で終わった。
- `passWithNoTests: true` が既にあるので、除外の結果 0 本でも緑（`vitest.config.ts:21`、`node_modules/vitest/dist/chunks/cli-api.CnMVyzaz.js:12688`）。
- pnpm はスクリプト名の後ろの引数をそのまま渡す（`https://pnpm.io/cli/run`）。

### Definition Change

- なし
