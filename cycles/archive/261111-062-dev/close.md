# Close 062

## Collected

### 01 test-exclude-and-rename (ADR 01, 02)

1. 338 / Slice 2 (ハーネス同期を harness-sync の名前へ揃える) / `scripts/product-ready/index.test.ts:24` の試料値 `'scripts/harness'` / left: Slice 2 の Policy が `scripts/product-ready` の変更（`test-exclude.json` を除く）を禁じたため。振る舞いには影響しない。
2. 338 / Slice 2 (ハーネス同期を harness-sync の名前へ揃える) / `ROADMAP.md:272` の当時の記述 `harness.json` / left: 当時の記述であり、直すと履歴を改ざんすることになる。振る舞いには影響しない。
3. 372 / Work Review Round 1 / `reporters` テスト（`vitest.config.test.ts:31`）は実行時 env の片方の分岐しか確かめない。もう一方の `TEST_VERBOSE` 分岐が壊れても、通常実行ではテストが緑のままになる。 / left: `Steps` 9 は今の値との一致だけを要求し、両方の分岐の実行を要求しないため、現状維持とする（`Acceptance` の `Doubts` も同じ）。

## Triage

- 1: _ex-change_ (ADR 02, `Unit.harness-sync`): done db8982d
  - Fact: `scripts/product-ready/index.test.ts:24` に旧名 `scripts/harness` の試料値が残る。実際の `test-exclude.json` は `scripts/harness-sync` を指す。
  - Why: 名前は揃っているのに、テストの試料だけが旧名で残っている。Slice 2 の Policy が `scripts/product-ready` の変更を禁じたため、ここで直す。
  - Then: 試料値を `scripts/harness-sync` にする。
- 2: dropped (ADR 02, `Unit.harness-sync`)
  - Fact: `ROADMAP.md:272` に旧名 `harness.json` の記述が残る。
  - Why: 019 当時の記述であり、直すと履歴を改ざんすることになる。振る舞いには影響しない。
  - Then: なし
- 3: _ex-change_ (ADR 01, `Unit.test-run`): done 52958f8
  - Fact: `vitest.config.test.ts:31` の `reporters` テストは、実行時 env の片方の分岐だけを確かめる。もう一方の `TEST_VERBOSE` 分岐が壊れても、通常実行ではテストが緑のままになる。
  - Why: プランの `Steps` 9 は「今の値のまま」との一致だけを求めたが、テストとしては両方の分岐を確かめた方がよい。
  - Then: `TEST_VERBOSE` を設定した場合と未設定の場合の両方を確かめる。

## Verified

### Unit.product-ready

- Plans:
  - `01-test-exclude-and-rename`
- Result: OK
- Fixed: なし

### Unit.test-run

- Plans:
  - `01-test-exclude-and-rename`
- Result: OK
- Fixed: なし

### Unit.usage-readme

- Plans:
  - `01-test-exclude-and-rename`
- Result: OK
- Fixed: なし

### Unit.harness-sync

- Plans:
  - `01-test-exclude-and-rename`
- Result: OK
- Fixed: なし

### Unit.plan-skill

- Plans:
  - `01-test-exclude-and-rename`
- Result: OK
- Fixed: なし
