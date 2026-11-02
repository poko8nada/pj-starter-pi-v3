# PLAN `ja-check`

- No: 01, 02

## Files

```text
scripts/
  checks/
    ja-check.mjs             add
    ja-check.test.ts         add
    ja-check.json            add
    typecheck-staged.mjs
    typecheck-staged.test.ts
    typecheck.mjs
    typecheck.test.ts
    scopes.json
  harness/
    harness.json
    index.mjs
    list/
      index.mjs
      index.test.ts
  product-ready/
    index.mjs
    targets.mjs
    targets.test.ts
test/
  scripts.fixture.ts
  temp-dir.ts
vitest.config.ts
vitest.starter.config.ts
DEFINITION.md                update
ROADMAP.md
lefthook.yaml
package.json
.oxlintrc.json
```

## Slices

## 1.ja-check の本体と JSON

### Types

```js
/**
 * `scripts/checks/ja-check.json` の形
 * @typedef {{ readonly error: Readonly<Record<string, string>>, readonly warn: Readonly<Record<string, string>> }} JaCheckConfig
 */

/**
 * 1 件の指摘
 * @typedef {{ readonly file: string, readonly line: number, readonly word: string, readonly replacement: string, readonly level: 'error' | 'warn' }} Finding
 */

/**
 * 最後の集計行
 * @typedef {{ readonly files: number, readonly errors: number, readonly warns: number }} Summary
 */
```

### Steps

1. `scripts/checks/ja-check.mjs`:
   - 引数で受け取ったテキストファイル（コード、テスト、コメント、文書、設定）を読み、`ja-check.json` の `error`/`warn` の語を `<file>:<line>: <語> → <対応> [warn|error]` の形で出力し、`error` なら `exit 1`、`warn` だけなら `exit 0` とし、最後は `ja-check: <n> ファイル、error <n> 件、warn <n> 件` の固定行とし、`設定なし` はその前の行に出力し、`cycles/` は対象に含め、`ROADMAP.md` の `## 0.x.x` セクションと `ja-check.json` は除外し、同じ引用符（`'`、`"`、`` ` ``）の間に語だけがある場合は指摘しない。
     - Outside: `Node 24 の実行環境と標準ライブラリ` と `ステージされた 100 ファイルを 1 秒未満`。`node:fs` と `node:path` だけを使い、`process.argv.slice(2)` でファイルを受け取り、`fs.readFileSync` と `JSON.parse` で `ja-check.json` を読み、100 ファイルを 1 秒未満で処理する。
2. `scripts/checks/ja-check.json`:
   - 050 の語対応表を 1 語ずつ見て、部分一致のおそれがある語は `warn`、それ以外は `error` に分けて格納し、`道具`、`観点`、`写し`、`偽物`、`印` は入れない。
3. `scripts/checks/ja-check.test.ts`:
   - (happy) `WARN_WORD` を含む `.md` を渡す → `<file>:<line>: <語> → <対応> [warn|error]` が出力され、`warn` なら `exit 0`。
   - (happy) `ERROR_WORD` を含む `.md` を渡す → `[error]` が出力されて、`exit 1`。
   - (empty) 引数なし → `exit 0` となり、最後に固定行を出力する。
   - (empty) 読み取れないファイルを渡す → スキップされ、最後に固定行を出力する。
   - (boundary) `cycles/` のファイルの `ERROR_WORD` → 指摘される。
   - (boundary) `ROADMAP.md` の `## 0.x.x` セクションの `ERROR_WORD` → 指摘されない。
   - (boundary) `ROADMAP.md` の `## 1.x.x` セクションの `ERROR_WORD` → 指摘される。
   - (boundary) `scripts/checks/ja-check.json` 自身の `ERROR_WORD` → 指摘されない。
   - (boundary) `scripts/checks/ja-check.test.ts` の `ERROR_WORD` が引用符の中に語だけである → 指摘されない。
   - (boundary) `it('骨を...')` のように語が引用符の中でも前後に文字がある → 指摘される。
   - (boundary) コードのコメントの `` `ERROR_WORD` `` → 指摘されない。
   - (boundary) コードの文字列 `'ERROR_WORD'` → 指摘されない。
   - (empty) `ja-check.json` がない → `設定なし` が集計行の前に出力され、`exit 0`。
   - (error) 壊れた `ja-check.json` → `exit 1`。
   - (error) キーや値の型が違う `ja-check.json` → `exit 1`。
   - (boundary) `NONE_WORDS` を含むファイル → 指摘されない。
   - (boundary) `ja-check.json` のキーが `error` と `warn` だけで、`NONE_WORDS` が含まれない → 真となる。
   - (boundary) `ja-check.json` の `warn` に `WARN_WORD`、`error` に `ERROR_WORD` がある → 真となる。
4. `DEFINITION.md`:
   - `#### 作ったものを検査する` に `- japanese-check: エージェントが、日本語の語に対する指摘を受け取れる` を加える。

### Verify

- Always:
  - `pnpm test:related scripts/checks/ja-check.mjs scripts/checks/ja-check.json scripts/checks/ja-check.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -rniE 'ja-check|japanese-check' --exclude-dir=node_modules --exclude-dir=cycles .` が `scripts/checks/ja-check.mjs`、`scripts/checks/ja-check.test.ts`、`DEFINITION.md` だけを返す。
- Added:
  - `mktemp -d` で作った一時ディレクトリーに 100 個の `.md` を作り、`time node scripts/checks/ja-check.mjs <100 files>` の real が 1 秒未満であることを確かめる。
  - `node -e` で `scripts/harness/harness.json` の `copy` と `push` に `scripts/checks` が含まれることと、`scripts/checks/ja-check.mjs`、`scripts/checks/ja-check.test.ts`、`scripts/checks/ja-check.json` が存在することを確かめる。
  - エージェントが `DEFINITION.md` の `Unit.japanese-check` の行を読んで、`Steps` の 4 番目の文と一致することを確かめる。

## Notes

### Slice 1: ja-check の本体と JSON

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
