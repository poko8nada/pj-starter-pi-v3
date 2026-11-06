# Close 051

## Collected

### quality-gate-sound (ADR 05)

1. 160 / Acceptance / `### Round 2` の記録が plan の md にない。`review`（consult-66）は実行を終えており、その報告には Round 2 の判断が入っている。

## Triage

- 1: dropped (ADR 05, 不要テストの整理)
  - Fact: `cycles/261102-051-feat-test-cleanup/plan/quality-gate-sound.md` の `## Work Review` に `### Round 2` を直接追記した。`Round 1` の `Gaps` の1件の `fixed:` が対象であり、`.pi/extensions/quality-gate/targets.test.ts:49-59` が `before` にあって `after` にないパスが返らない断言を持ち、実装 `.pi/extensions/quality-gate/targets.ts:92` の `after` だけを走査する構造と照合した。製品コードの変更はない。
  - Why: 記録の欠落は `Round 2` の追記で閉じる大きさであり、`ex-plan` を立てる重さに見合わない。内容にも問題がなく、残す理由がない。
  - Then: なし

## Verified

### test-run

- Plans:
  - `consult-run-tool`
  - `consult-policy-sub`
  - `context-precompact`
  - `thinking-scrub`
  - `quality-gate-sound`
  - `scripts-skills`
- Result: しない — テストの削除と統合だけであり、製品の機能は変わらないため

### subagent-consult

- Plans:
  - `consult-run-tool`
  - `consult-policy-sub`
- Result: しない — テストの削除と統合だけであり、製品の機能は変わらないため

### sound-notify

- Plans:
  - `consult-run-tool`
  - `consult-policy-sub`
  - `quality-gate-sound`
- Result: しない — テストの削除と統合だけであり、製品の機能は変わらないため

### quality-gate

- Plans:
  - `consult-run-tool`
  - `consult-policy-sub`
  - `context-precompact`
  - `thinking-scrub`
  - `quality-gate-sound`
  - `scripts-skills`
- Result: しない — テストの削除と統合だけであり、製品の機能は変わらないため

### lefthook-gate

- Plans:
  - `consult-run-tool`
  - `consult-policy-sub`
  - `context-precompact`
  - `thinking-scrub`
  - `quality-gate-sound`
  - `scripts-skills`
- Result: しない — テストの削除と統合だけであり、製品の機能は変わらないため

### context-precompact

- Plans:
  - `context-precompact`
- Result: しない — テストの削除と統合だけであり、製品の機能は変わらないため

### thinking-scrub

- Plans:
  - `thinking-scrub`
- Result: しない — テストの削除と統合だけであり、製品の機能は変わらないため

### adr-skill

- Plans:
  - `scripts-skills`
- Result: しない — テストの削除と統合だけであり、製品の機能は変わらないため

### close-skill

- Plans:
  - `scripts-skills`
- Result: しない — テストの削除と統合だけであり、製品の機能は変わらないため

### product-ready

- Plans:
  - `scripts-skills`
- Result: しない — テストの削除と統合だけであり、製品の機能は変わらないため

### harness-copy

- Plans:
  - `scripts-skills`
- Result: しない — テストの削除と統合だけであり、製品の機能は変わらないため

## 特記

件数の減少と製品コードの無変更の実測をまとめます。

### 件数の減少（`pnpm test:run` の実測、すべて緑）

| 区画                                         | 前    | 後    | 減少 |
| -------------------------------------------- | ----- | ----- | ---- |
| `consult/run` と `consult/tool`              | 223件 | 201件 | 22件 |
| `consult/policy` と `consult/sub` と `index` | 105件 | 82件  | 23件 |
| `context-precompact`                         | 106件 | 95件  | 11件 |
| `thinking-scrub`                             | 140件 | 132件 | 8件  |
| `quality-gate` と `sound-notify`             | 68件  | 47件  | 21件 |
| `scripts` と `.pi/skills`                    | 144件 | 136件 | 8件  |
| 合計                                         | 786件 | 693件 | 93件 |

本数は62本のままです。区画の合計（693件）は全体の実行（62本693件）と一致します。

### テスト以外のコード

作業の起点（`2cde517`）から現在までの差分は40本であり、内訳はテスト32本と記録文書8本（`ROADMAP.md`、`close.md`、6本の `plan` の文書）です。製品コード（テストではない `.ts`、`.mjs`、設定文書など）は1本も含まれていません。`pnpm typecheck` も緑です。
