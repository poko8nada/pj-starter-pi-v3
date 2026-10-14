# PLAN `harness-typecheck`

## Files

```text
scripts/
  harness-scopes.json                        add
  typecheck.mjs                              add
  typecheck.test.ts                          add
  typecheck-staged.mjs                       update
  typecheck-staged.test.ts                   update
package.json                                 update
.pi/
  tsconfig.json                              update
  extensions/intent-router/
    settings.ts                              update
README.md                                    update
README.ja.md                                 update
tsconfig.json
scripts/product-ready/
  targets.mjs
lefthook.yaml
.gitignore
.pi/extensions/quality-gate/
  checks.ts
  README.md
.pi/extensions/intent-router/
  log.ts
  settings.json
  README.md
  settings.test.ts
  log.test.ts
  hook/
    judge.ts
    route.ts
    judge.test.ts
    route.test.ts
.pi/skills/work/
  SKILL.md
```

## Slices

## 1.タイプエラーを解消する（赤を消す）

### Types

```ts
// settings.ts
/** 設定ファイルに書かれた形（3 つとも Optional）。スキーマから出る */
type WrittenThresholds = Static<typeof ThresholdsSchema>;
/** 既定に重ねた後の形（3 つとも埋まっている） */
export type Thresholds = {
  readonly routeConfidence: number;
  readonly judgeConfidence: number;
  readonly judgeScore: number;
};
```

### Steps

1. `.pi/extensions/intent-router/settings.ts`:
   - `ThresholdsSchema` は書きかけの形のまま残し、`WrittenThresholds` を足す。
   - `export type Thresholds` を解決済みの形（3 つとも required）にする。
   - `Settings.thresholds`、`defaultSettings`、`overlaid` の呼び出しは触らない
   - 編集しないが意味が変わる所: `Settings.thresholds`、`parseSettings` の `overlaid(defaults.thresholds, written.thresholds)`（`written.thresholds` は `WrittenThresholds` のまま `Partial<Thresholds>` として受かる）、`hook/judge.ts` の `decideJudge(answer, thresholds)`、`hook/route.ts` の `decideRoute(..., thresholds, ...)`、`log.ts` の `thresholds` 欄

### Verify:

- cli: `pnpm exec tsc -p .pi/tsconfig.json --noEmit`
  - (happy) 型を分けた後 → exit 0（前は 3 件赤: `hook/judge.ts:38` ×2、`hook/route.ts:57`）
  - _no case_: `WrittenThresholds` の optional の present/absent — コンパイラが決める。既存の `.pi/extensions/intent-router/settings.test.ts:24`（`{"thresholds":{"judgeScore":1.8}}` → 残り 2 つは既定のまま）は、統合 slice の `pnpm test:run` が回す

## 2.一覧とランナー

### Types

なし

### Steps

1. `scripts/harness-scopes.json`:
   - `[".pi", ".opencode"]` を置く（スターター期だけ存在する印）。
2. `scripts/typecheck.mjs`:
   - 引数なし。root は `process.cwd()`。
   - tsc は `node_modules/.bin/tsc` を `-p <その所の tsconfig.json> --noEmit` で回す（`typecheck-staged.mjs` と同じ呼び方）。
   - root の `tsconfig.json` を必ず回す。
   - 一覧の各所のうち `<dir>/tsconfig.json` がある物を回す。無い物は黙って飛ばす。
   - 一覧が無い / 空配列 → root だけ。一覧が JSON として読めない → `the list is not valid JSON` を出して exit 1。
   - 出す行は 1 行ずつ `<所>: ok` / `<所>: failed`。所は root と一覧の各所。1 つでも赤なら exit 1。
3. `scripts/typecheck.test.ts`:
   - fake root にツリーを作り、`node_modules/.bin/tsc` にスタブを置く（渡された `-p` を出して、決めた所だけ exit 1）。
   - 回した所の名前、渡された `-p` の道、exit を stdout で見る。
4. `package.json`:
   - `typecheck` を `node scripts/typecheck.mjs` にする。

### Verify:

- test: `pnpm vitest run scripts/typecheck.test.ts`
  - (happy) `tsconfig.json` と `.pi/tsconfig.json` があり一覧が `[".pi"]`、スタブは exit 0 → `root: ok` と `.pi: ok` の 2 行、exit 0。`-p` は root に `tsconfig.json`、`.pi` に `.pi/tsconfig.json`
  - (error) 同じ木でスタブが `.pi` の時だけ exit 1 → `.pi: failed`、exit 1
  - (boundary values) 一覧が `[".pi", ".opencode"]` で `.opencode` が無い → `.opencode` の行が出ない
  - (empty) 一覧が無い / `[]` → `root: ok` の 1 行だけ
  - (error) 一覧が JSON として読めない → exit 1、`the list is not valid JSON` の行
  - (happy) この repo の `scripts/harness-scopes.json` を読む → `[".pi", ".opencode"]`
  - (happy) この repo の `package.json` の `scripts.typecheck` を読む → `node scripts/typecheck.mjs`

## 3.staged も同じ一覧を読む

### Types

なし

### Steps

1. `scripts/typecheck-staged.mjs`:
   - `HARNESS_DIRS` の const をやめ、root の `scripts/harness-scopes.json` を読む。root は `process.cwd()`、読みは同期。
   - 一覧が無ければハーネスへ振り分けず、root の `tsconfig.json` に落とす。
   - 一覧が JSON として読めない → `the list is not valid JSON` を出して exit 1。
   - 一覧にあっても `<dir>/tsconfig.json` が無ければ、いままでどおり skip（`continue`）。
2. `scripts/typecheck-staged.test.ts`:
   - fake root の `node_modules/.bin/tsc` にスタブを置く（渡された `-p` を出す）。これで、どの `tsconfig` が使われたかを見る。
   - 一覧に `.pi` がある木、一覧に `.pi` が無く root に落ちる木、一覧が無く root も無い木、`.opencode` の無い一覧、壊れた一覧を書く。
3. `.pi/tsconfig.json`:
   - コメントの `HARNESS_DIRS` を `scripts/harness-scopes.json` に。

### Verify:

- test: `pnpm vitest run scripts/typecheck-staged.test.ts`
  - (happy) root の tsconfig を置かず `.pi/tsconfig.json` だけがある木で、一覧に `.pi` → `.pi/a.ts` は `.pi` の group で回る（`-p` が `.pi/tsconfig.json` を指す）
  - (happy) 一覧に `.pi` が無く root の `tsconfig.json` がある木 → `.pi/a.ts` は root の group に落ちる（`-p` が root の `tsconfig.json` を指す）
  - (happy) 一覧が無く root の `tsconfig.json` がある木 → root の group で回る（`-p` が root の `tsconfig.json` を指す）
  - (empty) 一覧が無く root の tsconfig も無い → group が空、exit 0（tsc を探しに行かない）
  - (empty) 一覧に `.opencode` があるが `.opencode/tsconfig.json` が無い → skip、exit 0
  - (error) 一覧が JSON として読めない → exit 1、`the list is not valid JSON` の行
  - (happy) 対象が 1 つも無い / 対象外の拡張子だけ → exit 0（既存）

## 4.統合: 型チェックの意味が揃う

### Types

なし

### Steps

1. `README.md`:
   - 表の `pnpm typecheck` の行を `` `node scripts/typecheck.mjs` `` にする
   - `On push` の行を `**On push** — typecheck (the root and the harness) and test` にする
2. `README.ja.md`:
   - 表の行を同じにする
   - `push 時` の行を `**push 時** — typecheck（ルートとハーネス）/ test` にする

### Verify:

- cli: `pnpm typecheck` のあと `pnpm test:run` と `pnpm lint`
  - (happy) `pnpm typecheck` → `root: ok` と `.pi: ok` の 2 行、exit 0
  - (happy) `pnpm test:run` → 緑
  - (happy) `pnpm lint` → 緑
  - (happy) `grep -n 'node scripts/typecheck.mjs' README.md README.ja.md` → 表の `pnpm typecheck` の行が出る
  - (happy) `grep -c 'tsc --noEmit' README.md README.ja.md` → 0
  - (happy) `grep -n 'the root and the harness' README.md` → `On push` の行に出る
  - (happy) `grep -n 'ルートとハーネス' README.ja.md` → `push 時` の行に出る
  - (happy) `grep -n 'harness-scopes.json' .pi/tsconfig.json` → コメントに出る

## Notes

### Slice 1: タイプエラーを解消する（赤を消す）

- Findings: なし
- Unplanned: `WrittenThresholds` を `export` した（plan の Types は非 export）。非 export のままだと `oxlint --deny-warnings` が `no-unused-vars` で赤になり commit gate を通れないため。型の意味は変わらない。
- Commit: d2dac29

### Slice 2: 一覧とランナー

- Findings: なし
- Unplanned: 一覧が JSON として読めるが配列でない時も `the list is not valid JSON` で exit 1 にした（plan は無効 JSON のみ指定。配列チェック無しだと `for..of` で落ちるため）。
- Commit: d49544c

### Slice 3: staged も同じ一覧を読む

- Findings: なし
- Unplanned: 一覧が配列でない時も `the list is not valid JSON` で exit 1、非文字列の要素は飛ばす（plan は無効 JSON のみ指定。`find`/`path.join` で落ちないため）。
- Commit: 5a922ee

### Slice 4: 統合: 型チェックの意味が揃う

- Findings: なし
- Unplanned: `README.ja.md` の検査表の列幅を `oxfmt` で直した（`node scripts/typecheck.mjs` が旧列幅に収まらず `oxfmt --check` が赤になったため。表の意味は変わらない）。
- Commit: 00c88ec

## Review

### Round 1

- Stale: なし
- Unlisted: なし
- Gaps: なし
- Unproven: なし

## Acceptance

- Ran: plan の検査 4 つ（slice 1: `tsc -p .pi/tsconfig.json --noEmit` exit 0 / slice 2: `vitest run scripts/typecheck.test.ts` 8 passed / slice 3: `vitest run scripts/typecheck-staged.test.ts` 10 passed / slice 4: `pnpm typecheck` が `root: ok` と `.pi: ok`、grep 5 つ）と、全体の `pnpm test:run`（550 passed）と `pnpm lint`（緑）。壊して赤を見た 3 つ: `typecheck.mjs` の一覧の loop を空にする → 3 failed、`typecheck-staged.mjs` の harness の割り当てを外す → 1 failed、`settings.ts` の `Thresholds` を optional に戻す → `judge.ts:38` ×2 と `route.ts:57` の 3 件（exit 2）。3 ファイルは `git checkout` で戻し、上の検査を再び緑で確認
- Findings: なし
