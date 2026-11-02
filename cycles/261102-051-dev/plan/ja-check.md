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

- Findings: なし
- Unplanned: なし
- Commit: 0f1cff9 consult(ja-check): add Japanese word checker with config and tests
- Stopped:

### Cleanup: 重複・自明・実データのテスト整理

対象の `scripts/checks/ja-check.test.ts` 全件（18件）を読み、`scripts/checks/ja-check.mjs` の現行分岐と突き合わせた。`Files` 記載の既存テスト（`typecheck.test.ts`、`typecheck-staged.test.ts`、`harness/list/index.test.ts`、`product-ready/targets.test.ts`）は本計画の追加で振る舞いも分岐も変わらないため、手を付けない。近い組は段違い・欄違いのため残した。正常系（warn/error、0.x.x抑制/1.x.x報告、cycles含む/自己除外）の表裏はいずれも抑制範囲の境界が違う。投げ系（壊れJSONと鍵・値型違い）は検証層（構文と鍵集合・値型）が違うため1件化しない。落としたのは4件で、残り14件が緑である。

- 重複（1件）: `code string with single quotes alone is not reported` は `quoted alone error word is not reported` と同一振る舞い（`'` 単独囲みのスキップ、`hasUnquoted` は直前後の1文字だけを見て拡張子・文脈を見ない）のため落とした。`quoted alone`（`'`、`a.md`）と `code comment with backtick alone`（`` ` ``、`a.ts` コメント）は引用符リテラルが違い、片方の対応漏れ（typo）を検出できるため残した。
- 消えた振る舞い（0件）: 本計画は追加のみで既存振る舞いを消さない。`mjs` の分岐（設定なし・壊れ・鍵違い・自己除外・読めないスキップ・`ROADMAP.md` の `## 0.x.x` 抑制・引用単独スキップ）と突き合わせて、消えた検査は残っていない。
- 計画変更が消す分岐（0件）: `ja-check` 追加は他スクリプトの分岐を消さない。`typecheck` 系・`harness` 系・`targets` 系の分岐は従来通りであり、該当なし。
- `Test cases` が書かないもの（3件）: `file with none words is not reported` は `fake` 設定に含まれない語が報告されない自明な確認であり、実除外（「そのまま」語が実設定に無いこと）の証拠にならない。どの未知語でも同じであり、誰も気づかないため落とした。`real config has only error and warn keys without none words` と `real config has warn word in warn and error word in error` は実ファイル内容（DB）の断言である。鍵集合は本番検証が不正時に `exit 1` で落とすこと（`config with wrong key or value types` が担保）で settled し、語の配置は `warn`/`error` 動作（`warn/error word in md` が `fake` で担保）と独立したデータである。他のテストが `fake root` のみで実ファイルを断言しないこと、`050` の `stored types.json` 内容テスト削除の前例にも倣い、2件とも落とした。`Goal` 行に対応がないもの（100件1秒未満・標準ライブラリのみ・`DEFINITION` 行・`harness` 配布）は元々自動検査がなく、計画が `Verify` 手動に回しているため新設しない。

- Findings: なし
- Unplanned: 未使用になった `readFileSync` / `REAL_CONFIG` / `NONE_WORDS` / `isUnknownRecord` / `isStringRecord` / `isJaConfig` の除去と冒頭注の修正（`pnpm lint` と `pnpm format:check` を緑にするため。振る舞いは変えないため、全体整合の修正として行った）。
- Ran: `pnpm test:related scripts/checks/ja-check.mjs scripts/checks/ja-check.json scripts/checks/ja-check.test.ts`（14 passed）、`pnpm typecheck`、`pnpm lint`、`pnpm format:check` が緑。

## Work Review

### Round 1

- Stale:
  - `scripts/checks/ja-check.mjs:3` のコメントは `->` と書くが実装 (`scripts/checks/ja-check.mjs:118`) と Steps の定めは `→` であり、コメントが古い。
  - fixed: `scripts/checks/ja-check.mjs:4` の `->` を `→` に直し、実装と Steps の表記にそろえた。
- Unlisted: なし — 差分の4ファイルは `Files` の `add`/`update` と一致する。
- Gaps:
  - 集計行の `error <n> 件、warn <n> 件` を断言する検査がない (`scripts/checks/ja-check.mjs:131` に対し `scripts/checks/ja-check.test.ts:53` らは `ja-check: 1` のみを見る)。件数が壊れても検出できない。
  - fixed: warn・error・引数なし・読めないの集計行断言を `ja-check: <n> ファイル、error <n> 件、warn <n> 件` の完全形に強めた（warn は `error 0 件、warn 1 件`、error は `error 1 件、warn 0 件`、引数なし・読めないは `error 0 件、warn 0 件`）。
  - `"` 単独囲みのスキップを試す検査がない (`scripts/checks/ja-check.mjs:68` は `'`, `"`, `` ` `` の3種を扱うが検査は `scripts/checks/ja-check.test.ts:128` の `'` と `scripts/checks/ja-check.test.ts:148` の `` ` `` のみ)。`"` の対応漏れを検出できない。
  - fixed: `double-quoted alone error word is not reported` を追加し、`'`・`"`・`` ` `` の3種を検査した。
- Unproven:
  - warn/error の出力検査 (`scripts/checks/ja-check.test.ts:53`, `scripts/checks/ja-check.test.ts:64`) は接頭辞と `[warn|error]` のみを見て `→ 対応` を見ないため、矢印や対応付けが壊れても緑のままになる。
  - fixed: warn・error の2件に `→ replacement-warn`・`→ replacement-error` の断言を追加し、矢印と対応付けの破壊を検出できるようにした。
- Noise: なし — 残る14件は Steps の分岐に対応し、落とした4件は `Test cases` の自明・DB断言に当たるため。
- Doubts:
  - Steps (`cycles/261102-051-dev/plan/ja-check.md:82,86-88`) は落とした4件をまだ列挙する。`Cleanup` の理由付けが正しければ Steps 側を直すかは close の判断に残る。
  - left: Steps は slice 実行時の仕様記録であり、Cleanup で削除理由を残しているため直さない。履歴を書き換えると slice と Cleanup の対応が追えなくなるため、close の判断に残す。
  - `Verify` の `Added` の手動確認 (100件1秒・harness配布・`DEFINITION` 行) は本レビューの許可範囲では実行しておらず、close 側で `Ran` を確認する必要がある。
  - fixed: `Added` の3件を実行した。100件は 31ms（1秒未満）、`harness.json` の `copy`・`push` に `scripts/checks` あり・3ファイル存在、`DEFINITION.md` の `japanese-check` 行一致を確認した。

## Acceptance

- Ran:
  - `pnpm test:run` — 63 ファイル、801 件、すべて通過。
  - `pnpm typecheck` — root ok、.pi ok。
  - `pnpm lint` — oxlint --deny-warnings、通過。
  - `pnpm format:check` — oxfmt --check、332 ファイル、通過。
  - `grep -rniE 'ja-check' --exclude-dir=node_modules --exclude-dir=cycles .` → `scripts/checks/ja-check.mjs`、`scripts/checks/ja-check.test.ts`、`scripts/checks/ja-check.json` の 3 ファイルのみ。
  - `mktemp -d` で 100 個の `.md` を作り `time node scripts/checks/ja-check.mjs <100 files>` → real 0m0.032s（1 秒未満）。
  - `node -e` で `scripts/harness/harness.json` の `copy` と `push` に `scripts/checks` があり、`ja-check.mjs`、`ja-check.test.ts`、`ja-check.json` の 3 ファイルが存在することを確認。
  - `DEFINITION.md` の `Unit.japanese-check` の行が `Steps` の 4 番目の文と一致することを確認。
- Findings: なし
- Doubts: なし
