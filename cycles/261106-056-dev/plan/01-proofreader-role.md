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
