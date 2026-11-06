# PLAN `proofreader-role`

- No: 01
- Place: worktree
- Boundary Plans: なし

## Design

- Inside:
  - Modules: `types.json` の `proofreader` に `bash` を足し、許可を `node scripts/checks/ja-check.mjs` という接頭辞に絞る。ガードは接頭辞の一致だけで判定する。`run/subagent.ts` の `subagentEnv` が `bash` を `CONSULT_POLICY` に載せて渡す経路は変えない。`README.md` の行は設定の写しであり、作業であわせてそろえる。全体では設定と説明が同じ内容になり、pre-commit の ja-check と proofread での ja-check は同じ検査を指す。ファイルの統合も分割もしない。
  - Dirs: なし。ディレクトリの統合・分割・移動はない。
- Outside:
  - Extract: なし。共通化するモジュールは生まれない。
  - Colocate: なし。共通化をやめるモジュールはない。

## Files

```text
.pi/
  extensions/
    consult/
      types.json              update
      README.md               update
      policy/
        types.ts
      run/
        subagent.ts
      sub/
        guard.ts
scripts/
  checks/
    ja-check.mjs
    ja-check.json
lefthook.yaml
```

## Slices

## 1.proofreaderにja-checkを義務づける

### Types

```ts
なし;
```

### Steps

1. `.pi/extensions/consult/types.json`:
   - update: `proofreader` の `tools` の末尾に `bash` を加え、`bash` の許可を `node scripts/checks/ja-check.mjs` という接頭辞に絞り、`role` を ADR が決めた文面にする。改行は `\n` と書く。
     ```json
     "tools": ["read", "ls", "find", "grep", "edit", "quick_edit", "target_edit", "write", "bash"],
     "bash": ["node scripts/checks/ja-check.mjs"]
     ```
     ```json
     "role": "あなたは日本語の校正者です。対象について日本語として自然に読めるよう、積極的に校正してください。文書の形が `format.md` で定められている場合は、それを読んで形を保ちます。\n\n校正は、ja-check と下の観点を組み合わせて行います。ja-check は日本語として不自然な単語を機械検査し報告します。bashで`node scripts/checks/ja-check.mjs <対象ファイル>`として使います。\n\n1. 対象の文書に ja-check を実行します。\n2. 指摘を直します。`scripts/checks/ja-check.json` の `exception` と `exclude` は編集できません。\n3. 指摘に当たらない箇所を、次の観点で校正します。\n   - 主語の欠落\n   - 係り受けの破綻\n   - 指示語の参照先の不明\n   - 語彙の不統一\n   - 冗長・曖昧・重複\n   - 接続詞・副詞・形容動詞・補助動詞などの漢字は”ひらく”\n4. ja-check を再度実行し、warn と error が共にゼロになったことを確かめます。\n\nja-check が指摘を出さずに終了コード 1 で終わった場合は、検査が実行できなかったことを報告してください。\n\n内容の妥当性はあなたの管轄外ですが、文脈が足りない場合のみ補うことは許可します。引用文も校正の対象です。ja-check は引用符の中に語だけがある場合を報告しませんが、不自然であれば報告しつつ校正してください。\n\n書き直しはファイルを編集して行います。`quick_edit`、`target_edit`、`write` を使ってください。\n\n報告は、次の形で返します。\n- fixed: `<file>:<line>` — 何を直したか\n- kept: `<file>:<line>` — 観点に当たるが、意味を変えずに直せなかった箇所\n\n終わらなければ、どこまでやったかと止まった理由を報告してから終了してください"
     ```
2. `.pi/extensions/consult/README.md`:
   - update: `proofreader` の行の Tools に `bash` を加える。
     ```text
     | `proofreader` | read, ls, find, grep, edit, quick_edit, target_edit, write, bash | the base | 60 | 100,000 | no |
     ```

### Verify

- Always:
  - `pnpm test:related .pi/extensions/consult/types.json .pi/extensions/consult/README.md`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えた2つのファイルと、関連するファイル（`policy/types.ts`、`run/subagent.ts`、`sub/guard.ts`、`scripts/checks/ja-check.mjs`、`scripts/checks/ja-check.json`、`lefthook.yaml`）を読み、使う順に手順をたどり、番号、パス、名前、形を確かめ、不整合を直す
- Added:
  - other: `.pi/extensions/consult/types.json` に `node scripts/checks/ja-check.mjs` と `ゼロ` と `終了コード 1` があることを `grep` で確かめる。なければ赤とする

## Notes

### Slice 1: proofreaderにja-checkを義務づける

- Findings:
  - なし
- Unplanned:
  - なし
- Commit: cfca414
- Stopped: なし

### Test cleanup

- 対象: `Files` の update（`types.json`、`README.md`）に関わるテスト（`policy/types.test.ts`、`run/subagent.test.ts`、`sub/guard.test.ts`、`sub/spec.test.ts`、`scripts/checks/ja-check.test.ts`）を精査した。
- 重複: なし。`guard.test.ts` の proofreader ブロックは `**/*.md` 系の否定側（`src/a.ts` を止める）だけを担い、肯定側を担う `役割の許可` ブロックと相補のため残す。`ja-check.test.ts` の引用符3種・excludeの相対／絶対／`./`・設定異常系は各々別の分岐（引用符種別、正規化、検証項目）を確認するため残す。
- 消えた仕様のテスト: なし。旧 role 文面（直訳語のカタカナ化など）を断言するテストは存在しない。
- 消えた分岐のテスト: なし。`bash: []`＝全面許可の分岐は `trial`／`code` が今も使うため残す。`guard.test.ts` の proofreader 固定値 `bash: []` は path 阻止だけに使い bash 断言を含まないため、動作の断言ではなく残す（削ると `**/*.md` 系の否定カバレッジが失われる）。
- 書かないはずのテスト: なし。計画に `## Test cases` はなく、型・スキーマが定める前提だけを確かめる Adopted 行もない。
- 削除: なし。スイートは緑（`.pi/extensions/consult` 300件、`ja-check.test.ts` 33件が通過）。

## Work Review

### Round 1

- Stale:
  - なし — 旧role文面や旧toolsを断言する文書・コメント・テストはなく、`.pi/extensions/consult/sub/guard.test.ts:185` の `bash: []` は合成値の否定側fixtureでbash断言を含まないため陳腐化しないことを確かめた。
- Unlisted:
  - なし — 差分は `Files` のupdateである `.pi/extensions/consult/types.json:50` と `.pi/extensions/consult/README.md:26` の2件のみで、名指しのない変更はないことを確かめた。
- Gaps:
  - なし — 新動作（toolsへのbash追加、接頭辞 `node scripts/checks/ja-check.mjs`、role文面）は `Added` のgrep 3語と `Always` の読合せで exercised され、経路不変の `CONSULT_POLICY` 渡しは既存の `commandAllowed`・`subagentEnv` の守備範囲のため穴はないことを確かめた（`cycles/261106-056-dev/plan/01-proofreader-role.md:66`）。
- Unproven:
  - なし — 差分はテストを加えず、既存テストは新動作（bash接頭辞・role文面）を名指ししないため、壊しても緑のままのテストはないことを `.pi/extensions/consult/sub/guard.test.ts:184` ほかで確かめた。
- Noise:
  - なし — 計画に `## Test cases` はなく追加・変更テストもないため、型・スキーマが定める前提の再掲や幻数・固定文字列の事例はないことを `cycles/261106-056-dev/plan/01-proofreader-role.md:87` で確かめた。
- Doubts:
  - なし

## Acceptance

- Ran: 型検査と試験をワークツリーで走らせた（`pnpm typecheck` は合格、`.pi/extensions/consult` の300試験が合格）。設定の変更のため、差分を読み、2件が計画どおりであることを確かめた。接頭辞と `ゼロ` と `終了コード 1` があることも確かめた。
- Findings: なし
- Doubts: なし
