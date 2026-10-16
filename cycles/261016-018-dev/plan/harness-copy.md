# PLAN `harness-copy`

## Files

```text
scripts/
  checks/
    scopes.json                            add
    typecheck.mjs                          add
    typecheck.test.ts                      add
    typecheck-staged.mjs                   add
    typecheck-staged.test.ts               add
  harness.json                             add
  harness.mjs                              add
  harness.test.ts                          add
  harness-scopes.json                      drop
  typecheck.mjs                            drop
  typecheck.test.ts                        drop
  typecheck-staged.mjs                     drop
  typecheck-staged.test.ts                 drop
  product-ready/
    targets.mjs                            update
    targets.test.ts                        update
    index.test.ts                          update
  harness.local.json
package.json                               update
.gitignore                                 update
.pi/tsconfig.json                          update
README.md                                  update
README.ja.md                               update
DEFINITION.md                              update
lefthook.yaml
tsconfig.json
test/
  setup.ts
  tmp.ts
.pi/extensions/quality-gate/checks.ts
.pi/extensions/quality-gate/README.md
```

## Slices

## 1.検査の一覧を `scripts/checks/` へ移す

### Types

なし

### Steps

1. `scripts/checks/scopes.json`:
   - `scripts/harness-scopes.json` の中身を移し、`.opencode` を落として `[".pi"]` にする。
2. `scripts/checks/typecheck.mjs`:
   - `scripts/typecheck.mjs` を移し、一覧の道を `scripts/checks/scopes.json` にする。ヘッダの使い方の行も合わせる。
3. `scripts/checks/typecheck.test.ts`:
   - 移し、fake root に一覧を書く道を `scripts/checks/scopes.json` にする。
   - 前提のテストを新しい道と新しい中身（`[".pi"]`）にし、`typecheck:staged` の道も見る。`package.json` の `typecheck` の期待値も新しい道にする。
4. `scripts/checks/typecheck-staged.mjs`:
   - `scripts/typecheck-staged.mjs` を移し、一覧の道を `scripts/checks/scopes.json` にする。ヘッダの使い方の行も合わせる。
5. `scripts/checks/typecheck-staged.test.ts`:
   - 移し、fake root に一覧を書く道を `scripts/checks/scopes.json` にする。
6. `scripts/product-ready/targets.mjs`:
   - `harness` の行の `at` を `scripts/checks/scopes.json` にする。この行は 02 が落とすが、ここで道だけ合わせる（置いたままにすると、消えた道を指す行が残る）。
7. `scripts/product-ready/targets.test.ts` と `scripts/product-ready/index.test.ts`:
   - fake のツリーに書く一覧の道を新しい物にする。
8. `package.json`:
   - `typecheck` を `node scripts/checks/typecheck.mjs`、`typecheck:staged` を `node scripts/checks/typecheck-staged.mjs` にする。名前は変えない。
9. `.pi/tsconfig.json`:
   - コメントの一覧の道を `scripts/checks/scopes.json` にする。
10. `README.md` と `README.ja.md`:
    - 検査の表の `pnpm typecheck` の行を `node scripts/checks/typecheck.mjs` にする。

### Verify:

- test: `pnpm vitest run scripts/checks scripts/product-ready` と `pnpm typecheck`
  - (happy) `pnpm typecheck` → `root: ok` と `.pi: ok`、exit 0（一覧が `[".pi"]`）
  - (happy) 移した 2 つのテスト → 緑（fake root に `scripts/checks/scopes.json` を書く）
  - (happy) `pnpm vitest run scripts/product-ready` → 緑（fake のツリーの道を合わせた後）
  - (happy) `pnpm typecheck:staged scripts/checks/typecheck.mjs` → exit 0
  - (happy) `scripts/checks/typecheck.test.ts` の前提のテスト → この repo の一覧が `[".pi"]`（`.opencode` が残っていない）
  - (boundary values) 一覧に `.opencode` があるが `.opencode/tsconfig.json` が無い → `.opencode` の行が出ない（既存の case）
  - (happy) `pnpm product:ready --only harness`（`--run` なし）→ `harness (1): scripts/checks/scopes.json`
  - (happy) `grep -n 'scripts/checks/typecheck-staged.mjs' package.json` → `typecheck:staged` の行に出る
  - (happy) `grep -n 'scripts/checks/typecheck.mjs' README.md README.ja.md package.json` → 出る
  - _no case_: `.pi/tsconfig.json` のコメントの道 — どのコードも読まない（読むのは JSON 本体）。直すのは古い道を残さないため
  - _no case_: ファイルの移動そのもの — 機械的で、上の検査が新しい道で緑になることが証拠になる

## 2.一覧と差分を組む

### Types

```ts
// scripts/harness.mjs（JSDoc の typedef と export として書く）
/** どちらへ運ぶか */
type Direction = 'pull' | 'push';

/** 引数（純） */
interface Args {
  readonly direction: Direction;
  readonly root: string;
  readonly run: boolean;
}

/** `scripts/harness.json` の形 */
interface HarnessList {
  readonly copy: readonly string[];
  readonly skip: readonly string[];
}

/** 一方の側にある、一覧の内側のファイル。root からの相対で `/` 区切り、辞書順 */
type Side = readonly string[];

/** 両側の差分 */
interface Diff {
  readonly copy: Side;
  readonly remove: Side;
}

/** 一覧を読む。無い / JSON として読めない / `copy` が配列でない → 道を入れた 1 つのエラーで投げる。02 もこれを読む */
export function readList(root: string): HarnessList;
```

### Steps

1. `scripts/harness.json`:
   - `copy` に置く: `.pi`、`definition`、`lib`、`.github/workflows`、`test/setup.ts`、`test/tmp.ts`、`test/env.test.ts`、`AGENTS.md`、`lefthook.yaml`、`tsconfig.json`、`vitest.config.ts`、`.oxlintrc.json`、`.oxfmtrc.json`、`scripts/checks`、`scripts/product-ready`、`scripts/harness.mjs`、`scripts/harness.json`、`scripts/harness.test.ts`
   - `skip` に置く: `logs`、`harness.local.json`
   - `package.json`、`README.md`、`README.ja.md`、`.gitignore`、`cycles`、`memo` は入れない（ADR 01 の `Research & Trial`）
2. `scripts/harness.mjs`:
   - 引数: 向き（`pull` / `push`）と `--root <dir>`（既定は cwd）と `--run`。読めない引数・向きが無い・知らない向きは、1 行を出して exit 1。
   - 一覧: `readList(root)` を出す。`<root>/scripts/harness.json` を同期で読む。無い / JSON として読めない / `copy` が配列でない → 1 行を出して exit 1。
   - 相手側: `scripts/harness.local.json`（`{ "starter": "<道>" }`）を読み、`~` で始まる道は `os.homedir()` で開く。無い / 道が無い / 道に物が無い → 1 行を出して exit 1（何も書く前に見る）。
   - `Side`: 一覧の `copy` の各道を、ファイルなら 1 つ、dir なら下を全部集める。`skip` の名を持つ区画には降りない。`logs`、`node_modules`、`.git` は常に降りない。
   - `Diff`: `copy` = 元にある全部、`remove` = 先にだけある物。
   - 表示: `pull: <相手> → <root>`（push は逆向き）の 1 行、`copy (N):` と `remove (N):`。0 なら `no files to copy` / `no files to remove`。
   - `--run` が無ければ表示だけで exit 0。
   - Outside: design の `External`: ローカルのスターター。道は `scripts/harness.local.json` から読み、`~` は `os.homedir()` で開く。
3. `scripts/harness.test.ts`:
   - fake の 2 つのツリー（元と先）を `tmpDir()` で作り、`node scripts/harness.mjs` を子プロセスで呼ぶ（`product-ready/index.test.ts` と同じ道）。
   - 向き、`--root`、表示の行、exit を見る。

### Verify:

- test: `pnpm vitest run scripts/harness.test.ts`
  - (happy) 元と先に同じ 1 ファイル → `copy (1):` に 1 行、`no files to remove`
  - (happy) 元にだけあるファイル → `copy:` に出る
  - (happy) 先にだけあるファイル → `remove:` に出て、`copy` は 0
  - (empty) 両側とも空 → `no files to copy` と `no files to remove`、exit 0
  - (boundary values) `logs/` の中のファイルが両側にある → どちらの塊にも出ない
  - (boundary values) 一覧の外（`memo/a.md`、`scripts/harness.local.json`、`src/x.ts`）→ どちらの塊にも出ない
  - (boundary values) 元の dir を丸ごと持たない先 → その下のファイルが全部 `copy:` に出る
  - (happy) `push` の表示 → `push: <root> → <相手>` の行が出る（向きが逆）
  - (happy) `--root` を省く → cwd のツリーを root として読む
  - (happy) `~/...` の道 → `HOME` を fake に向けて、その下を読む
  - (happy) `--run` なし → 2 つのツリーが 1 つも変わらない
  - (error) `scripts/harness.json` が無い → 1 行、exit 1
  - (error) 一覧が JSON として読めない → 1 行、exit 1
  - (error) 一覧の `copy` が配列でない（`{"copy":"x"}`）→ 1 行、exit 1
  - (error) `scripts/harness.local.json` が無い → 1 行、exit 1
  - (error) `harness.local.json` の道が無い → 1 行、exit 1
  - (error) 向きが無い / 知らない向き / 未知の引数 / `--root` に値が無い → 1 行、exit 1
  - _no case_: 元の空の dir は作らない — `--run` が要る。slice 3 で見る
  - _no case_: 辞書順の並び — 決めごとで、壊れても気づかない

## 3.合わせる

### Types

```ts
/** 実行した結果 */
interface Applied {
  readonly copied: Side;
  readonly removed: Side;
}
```

### Steps

1. `scripts/harness.mjs`:
   - `--run` の道を足す。一覧・相手側・両側の走査が全部すんでから動く。
   - 先の `remove` のファイルを消し、一覧の内側で空になった dir を消す（下から）。
   - 元の `copy` のファイルを、dir を作りながら写す。
2. `scripts/harness.test.ts`:
   - `--run` の cases を足す。

### Verify:

- test: `pnpm vitest run scripts/harness.test.ts`
  - (happy) `pull --run` → 先の同じ道のファイルが元の中身になり、元にだけある物が足され、先にだけある物が消える
  - (boundary values) `push --run` → 向きが逆で同じ結果（元が先）
  - (boundary values) 先にだけ `old/` がある → その中のファイルが消え、空になった `old/` も消える
  - (boundary values) 元に空の dir だけがある → `--run` の後、先にその dir は作られない（ファイルが無いから）
  - (boundary values) `logs/` の中と一覧の外のファイル → 両方向で残る
  - (second call) 2 回目の `--run` → `no files to copy` と `no files to remove`、exit 0、ツリーは同じ
  - (error) 相手側の道が無いツリーでの `--run` → 何も書かず exit 1
  - (error) 一覧が JSON として読めないツリーでの `--run` → 何も書かず exit 1
  - (happy) 混ざったツリー（`copy` に 5、`remove` に 2）→ `copy (5):` と `remove (2):` の行が出て、`--run` の後に先のツリーが元の 5 つと同じ中身になり、消えた 2 つは無い

## 4.統合: ハーネスを運べる

### Types

なし

### Steps

1. `README.md`:
   - セクションを足す（`Harness`）: `node scripts/harness.mjs pull` / `push`、`--run` が無ければ表示だけ、一覧は `scripts/harness.json`、相手の道は `scripts/harness.local.json` に `~/...` で書く。
   - `package.json` は一覧の外にあるので、pull の後に `scripts` と `devDependencies` を手で見る、と 1 行書く。
2. `README.ja.md`: 同じ節と行。
3. `.gitignore`: `scripts/harness.local.json` を足す。
4. `scripts/harness.local.json`:
   - ここでは作らない（owner の道）。`.gitignore` が入ることを見る。
5. `DEFINITION.md`:
   - `Users can do` に `Unit.harness-copy` の行を足す（ADR 01 の `Definition Change` の文）。並びは `product-ready` の隣にする。

### Verify:

- cli: 2 つの一時のツリーで `node scripts/harness.mjs` を回し、この repo で `pnpm typecheck` / `pnpm test:run`
  - 前提: 「先」のツリーを `--root` にする。そこに `scripts/harness.json`（`copy: [".pi"]`、`skip: ["logs", "harness.local.json"]`）と `scripts/harness.local.json`（`{"starter":"<元のツリー>"}`）、`.pi/a.ts`（中身 A）と `.pi/old.ts` を置く。「元」のツリーに `.pi/a.ts`（中身 B）を置く
  - (happy) `node scripts/harness.mjs pull --root <先>` → `pull: <元> → <先>` の行と `copy (1):` / `remove (1):`、ツリーは変わらない
  - (happy) `node scripts/harness.mjs pull --root <先> --run` → 先の `.pi/a.ts` が中身 B になり、`.pi/old.ts` が消える
  - (happy) 先に `.pi/new.ts` を足して `node scripts/harness.mjs push --root <先> --run` → 元の `.pi/a.ts` が中身 A になり、`.pi/new.ts` が元に足される
  - (happy) この repo の `scripts/harness.json` → `copy` に `scripts/checks` と `scripts/harness.json` があり、`skip` に `logs` と `harness.local.json` がある
  - (happy) `pnpm typecheck` → `root: ok` と `.pi: ok`、exit 0
  - (happy) `pnpm test:run` → 緑（ハーネスのテストはまだ外していない。外すのは 02）
  - (happy) `grep -n 'harness.mjs' README.md README.ja.md` → 新しい節に出る
  - (happy) `grep -n 'devDependencies' README.md README.ja.md` → pull の後の手順の行に出る
  - (happy) `grep -n 'scripts/harness.local.json' .gitignore` → 出る
  - (happy) `grep -n 'harness-copy' DEFINITION.md` → `Users can do` の行に出る

## Notes

### Slice 1: 検査の一覧を `scripts/checks/` へ移す

- Findings: なし
- Unplanned: README.md / README.ja.md の検査表の列幅を `oxfmt` で直した（新しい道が旧列幅に収まらず `pnpm format:check` が赤になったため。表の意味は変わらない）。
- Commit: 665b288

### Slice 2: 一覧と差分を組む

- Findings:
- Unplanned:
- Commit:

### Slice 3: 合わせる

- Findings:
- Unplanned:
- Commit:

### Slice 4: 統合: ハーネスを運べる

- Findings:
- Unplanned:
- Commit:

## Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Unproven:
- Doubts:

## Acceptance

- Ran:
- Findings:
- Doubts:
