# PLAN `harness-tests`

## Files

```text
scripts/
  harness.json                   update
  harness.mjs
  harness.mode.json              add
  harness-state.mjs              add
  harness-state.test.ts          add
  product-ready/
    targets.mjs                  update
    targets.test.ts              update
    cli.mjs                      update
    cli.test.ts                  update
    index.mjs                    update
    index.test.ts                update
vitest.config.ts                 update
README.md                        update
README.ja.md                     update
DEFINITION.md                    update
lefthook.yaml
tsconfig.json
.pi/extensions/quality-gate/checks.ts
test/
  setup.ts
  tmp.ts
```

## Slices

## 1.状態のファイルと読み書き

### Types

```ts
// scripts/harness-state.mjs（JSDoc の typedef と export として書く）
/** ハーネスの状態 */
export type Mode = 'starter' | 'product';
/** 状態の道（root から） */
export const MODE_AT = 'scripts/harness.mode.json';
/** 状態を読む。無い / JSON として読めない / starter でも product でもない → 道を入れた 1 つのエラーで投げる */
export function readMode(root: string): Mode;
/** 状態を書く */
export function writeMode(root: string, mode: Mode): void;
```

一覧の形（`HarnessList`）とその読み（`readList`）は 01 の `scripts/harness.mjs` から借りる。

### Steps

1. `scripts/harness.mode.json`:
   - `{ "mode": "starter" }` を置く。スターターの状態は `starter`。
2. `scripts/harness-state.mjs`:
   - `MODE_AT` と `readMode` / `writeMode`。一覧の形と読みは `./harness.mjs` の `readList` を借りる（同じ物を 2 つ作らない）。
   - 読みは同期。壊れているときのエラーは、どの道がどうおかしいかを 1 文に入れる。
   - 書きは `JSON.stringify({ mode }, null, 2)` と末の改行（`oxfmt` の形）。
3. `scripts/harness-state.test.ts`:
   - fake root を `tmpDir()` で作り、道を作ってから読む / 書く。
4. `scripts/harness.json`:
   - `copy` に `scripts/harness-state.mjs` と `scripts/harness-state.test.ts` を足す。
   - `skip` に `harness.mode.json` を足す（配ると、プロダクトがスターターの状態に戻る）。
   - Outside: design の `Boundary.Plans`: `harness-copy` が作った一覧に、新しい 2 つと、配らない状態のファイルを足す。

### Verify:

- test: `pnpm vitest run scripts/harness-state.test.ts`
  - (happy) `{ "mode": "starter" }` を置いた木 → `readMode` が `starter`
  - (happy) `writeMode(root, 'product')` → その道の中身が `{"mode":"product"}` の形（鍵 1 つ、末に改行）で、`readMode` が `product`
  - (happy) `{ "copy": [".pi", "scripts/harness.mjs"], "skip": ["logs"] }` を置いた木 → `readList` が同じ物を返す
  - (empty) 状態の道が無い → 投げる。エラーに `scripts/harness.mode.json` が入る
  - (empty) 一覧の道が無い → 投げる。エラーに `scripts/harness.json` が入る
  - (error) 状態が JSON として読めない → 投げる
  - (error) 状態が `{"mode":"half"}` → 投げる
  - (error) 状態が `{"mode":"starter","extra":1}` → `starter`（鍵の増減は見ない）
  - (error) 一覧が `{"copy":"x"}` → 投げる
  - (happy) この repo の `scripts/harness.mode.json` → `readMode` が `starter`
  - (happy) この repo の `scripts/harness.json` → `skip` に `harness.mode.json`、`copy` に `scripts/harness-state.mjs` と `scripts/harness-state.test.ts` が入っている
  - (happy) `grep -n "from './harness.mjs'" scripts/harness-state.mjs` → 一覧の読みを借りている行が出る

## 2.テストの対象を組む

### Types

```ts
// scripts/harness-state.mjs（JSDoc の typedef と export として書く）
/** テストの既定の対象（vitest の既定と同じ字） */
export const TEST_GLOB = '**/*.{test,spec}.?(c|m)[jt]s?(x)';
/** テストの対象を組む（純）。product のときだけ、一覧の各道を否定で足す。`HarnessList` は `./harness.mjs` の typedef */
export function includeList(list: HarnessList, mode: Mode): readonly string[];
```

### Steps

1. `scripts/harness-state.mjs`:
   - `TEST_GLOB` と `includeList`。`starter` は `[TEST_GLOB]`、`product` は `[TEST_GLOB, ...一覧の各道の否定]`。1 つの道から `!<道>` と `!<道>/**` の 2 つを作る（ファイルと dir の両方に効かせる）。並びは一覧の順のまま。
2. `scripts/harness-state.test.ts`:
   - `includeList` の cases を足す。
3. `vitest.config.ts`:
   - `./scripts/harness.mjs` の `readList` と、`./scripts/harness-state.mjs` の `readMode` / `includeList` を読み、`include: includeList(readList(root), readMode(root))` にする。root は `import.meta.url` から出す（`vitest --root` でも同じ所を読む）。
   - `setupFiles` / `reporters` / `passWithNoTests` はそのまま。`exclude` は触らない（既定を置き換えてしまうため）。
   - 状態の切り替えは `scripts/harness.mode.json` を手で書く。戻しは `git checkout -- scripts/harness.mode.json`（`product:ready --run` は `cycles/` を消すのでこの repo では使わない）。

### Verify:

- cli: `pnpm vitest run scripts/harness-state.test.ts` と、状態を変えての `pnpm test:run`
  - (happy) `includeList({ copy: [".pi", "scripts/harness.json"], skip: ["logs"] }, 'starter')` → `[TEST_GLOB]` だけ
  - (happy) `includeList({ copy: [".pi", "scripts/harness.json"], skip: [] }, 'product')` → `[TEST_GLOB, "!.pi", "!.pi/**", "!scripts/harness.json", "!scripts/harness.json/**"]`
  - (boundary values) `product` で `copy: []` → `[TEST_GLOB]`
  - (boundary values) `".pi/"` → `"!.pi"`（末の `/` は落とす）
  - (boundary values) `skip: ["logs"]` は `includeList` に出ない
  - (happy) `pnpm vitest run scripts/harness-state.test.ts` → 緑
  - (happy) 状態 `starter` で `pnpm test:run` → 緑（全本）
  - (happy) 状態を `product` にして `pnpm test:run` → 0 本、exit 0（`vitest.config.ts` が状態を読んでいる）
  - (happy) `git checkout -- scripts/harness.mode.json` で戻して `pnpm test:run` → 緑（全本）
  - _no case_: `vitest --root <別の木>` — この repo は root で回す。config は自分の道から root を出す（step の決めごと）

## 3.product:ready を切り替えにする

### Types

```ts
// scripts/product-ready/targets.mjs
/** スターターだけの物の 1 行 */
interface Row {
  readonly label: string;
  readonly at: string;
  readonly pick: 'dirs';
}
/** 消す物の 1 行 */
interface Entry {
  readonly label: string;
  readonly at: string;
  readonly path: string;
}
```

### Steps

1. `scripts/product-ready/targets.mjs`:
   - `STARTER_ONLY` を `cycles` の 1 行だけにする。
   - `pick: 'tests'` と `pick: 'file'` の枝と `isTestFile` を落とす。`plan` / `remove` / `labels` の形はそのまま。
2. `scripts/product-ready/cli.mjs`:
   - `modeLine(from, to)` を足す（`mode: starter → product` の 1 行）。
3. `scripts/product-ready/index.mjs`:
   - 一覧の表示の先頭に `modeLine(readMode(root), 'product')` を出す。
   - `--run` のとき、消した後に `writeMode(root, 'product')` を打つ。消す物が無くても打つ。
   - root が無いときは今までどおり `no such directory: <root>` を 1 行出して exit 1（状態は読まない）。
4. `scripts/product-ready/targets.test.ts` と `index.test.ts` と `cli.test.ts`:
   - 落とした label（`harness` / `tests`）の cases を消し、状態の書き換えの cases を足す。

### Verify:

- test: `pnpm vitest run scripts/product-ready`
  - (happy) `--root <木>`（`--run` なし）→ `mode: starter → product` と `cycles (N):` が出て、木と状態は変わらない
  - (happy) 表示に `harness (` と `tests (` が出ない（label が減っている）
  - (happy) `--run` → `cycles/` の下の dir が消え、状態が `product` になる
  - (happy) 状態を `starter` に戻し、`cycles/` の無い木で `--run` → `no cycles to remove` と `mode: starter → product`、状態が `product` になる（消す物が無くても打つ）
  - (happy) `--run` をもう一度 → `no cycles to remove` と `mode: product → product`、exit 0
  - (boundary values) `--run` で、`.pi/a.test.ts`、`test/env.test.ts`、`scripts/product-ready/tool.test.ts`、`scripts/checks/scopes.json` は残る（旧 label が消えている）
  - (boundary values) `--only cycles --run` → cycles だけ消え、状態は `product` になる
  - (error) `--only` に値が無い → exit 1、状態は `starter` のまま
  - (error) 無い root → `no such directory: <root>` の 1 行で exit 1（木を作らない）
  - (happy) `--only harness`（知らない label）→ `mode: …` と `no harness to remove` の 2 行、exit 0

## 4.統合: ハーネスのテストが既定で回らない

### Steps

1. `README.md`:
   - 手順 1 を直す: `product:ready` は `cycles/` を消して状態を `product` にする。テストは消えない。`product` ではハーネスのテストが既定で回らない（状態は `scripts/harness.mode.json`）。
   - 検査の節に 1 行足す: ハーネスのテストを回したいときは状態を `starter` に戻す。
2. `README.ja.md`: 同じ 2 か所。
3. `DEFINITION.md`:
   - `Unit.product-ready` の行を ADR 02 の `Definition Change` の文にする。
4. 状態の切り替え方（この repo で走らせるとき）:
   - `scripts/harness.mode.json` を手で書く。戻しは `git checkout -- scripts/harness.mode.json`。
   - `product:ready --run` は `cycles/` を消すので、この repo では使わない。

### Verify:

- cli: `pnpm test:run` / `pnpm test:related` / `pnpm typecheck` を、状態を変えて回す
  - (happy) 状態 `starter` で `pnpm test:run` → 緑（全本）
  - (happy) 状態 `product` で `pnpm test:run` → 0 本、exit 0
  - (happy) 状態 `product` で `logs/probe.test.ts` を置いて `pnpm test:run` → その 1 本だけが回る（全部を外しているのではない）
  - (happy) 状態 `product` で `pnpm test:related .pi/extensions/consult/tool/commit.ts` → 0 本、exit 0
  - (happy) 状態 `product` で `pnpm typecheck` → `root: ok` と `.pi: ok`（ハーネスの型は product でも見る）
  - (happy) `git checkout -- scripts/harness.mode.json` で戻して `pnpm test:run` → 緑（全本）、中身が `starter` に戻っている。`logs/probe.test.ts` を消す
  - (happy) `grep -n 'ハーネスのテストを外した状態に切り替え' DEFINITION.md` → `product-ready` の行に出る
  - (happy) `grep -c 'ハーネス自身のテスト、型チェック、サイクル記録を削除' DEFINITION.md` → `0`（0 件なので exit 1 になる。件数で読む）
  - (happy) `grep -n 'harness.mode.json' README.md README.ja.md` → 手順 1 と検査の節に出る
  - (happy) `grep -c 'start from zero tests' README.md` → `0`（古い文が消えている。件数で読む）

## Notes

### Slice 1: 状態のファイルと読み書き

- Findings:
  - なし
- Unplanned:
  - なし
- Commit: 0ce5303 consult(harness-tests): add harness mode file and read/write

### Slice 2: テストの対象を組む

- Findings:
  - なし
- Unplanned:
  - scripts/harness.mjs の CLI 入口を直接実行時のみにした。config とテストが readList を import すると main がホストの argv で走り、エラーを出して exit 1 になっていた（緑でも）。
- Commit: c9c0f7d consult(harness-tests): build test include list from mode

### Slice 3: product:ready を切り替えにする

- Findings:
  - なし
- Unplanned:
  - なし
- Commit: e9991d3 consult(harness-tests): switch product-ready to mode flip

### Slice 4: 統合: ハーネスのテストが既定で回らない

- Findings:
  - なし
- Unplanned:
  - なし
- Commit: consult(harness-tests): document the mode flip

## Review

### Round 1

- Stale:
  - `vitest.config.ts:21` の「product:ready が名指しを消すと0本になる」は旧機序のまま残る — 現行は `include` 否定で0にするため stale
    - fixed: コメントを「product は include の否定で0本になる」に直した
  - `scripts/product-ready/index.mjs:6` の「3種を順に回す」が残る — 現行 `STARTER_ONLY` は `cycles` の1行のみのため stale
    - fixed: JSDoc を「cycles を消して状態を `product` にする入口」に直した
- Unlisted:
  - なし
- Gaps:
  - `scripts/product-ready/index.mjs:28` の状態ファイルが無い/壊れているときの `readMode` 失敗経路（exit 1）に Verify の bullet も `index.test.ts` の case も無い — 全 tree が mode を書くため未行使
    - fixed: `index.test.ts` に無い場合と壊れている場合の 2 case を足した（exit 1・木は残る）
  - `scripts/harness.mjs:441` の CLI 入口ガード変更後も `node scripts/harness.mjs pull/push` が口として動くことを確かめる Verify/test が無い
    - left: `scripts/harness.test.ts` の 31 件が子プロセスで `node scripts/harness.mjs` を回しており、ガードの直接実行経路は既に押さえられているため足さない
- Unproven:
  - なし
- Doubts:
  - `test/README.md:7` の「ゼロから書く/開始時は0本」は run が0の意味では真にも読めるし、ファイルが残る現行とずれて読めもする。Files に無く確度が足りないので所見にしない
  - `scripts/harness.mjs` は Files では bare だが diff が変えた。Files に名があり Notes Slice 2 Unplanned に記録があるため Unlisted にしない
  - `scripts/harness-state.test.ts:93` の repo `harness.json` 検査は contains のみで `harness.mode.json` が `copy` に入っていないことまでは見ない。ただし Verify も contains で書くため所見にしない
  - `scripts/product-ready/index.test.ts:73` の `--only cycles` 検査はその tree では全件==cycles のため filtering 故障でも緑だが、`--only harness` の検査が filtering を見るため所見にしない

## Acceptance

- Ran:
- Findings:
- Doubts:
