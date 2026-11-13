# Close 067

## Collected

### 01 vitest-config (ADR 03)

4. 147 / Acceptance / このプランは `passWithNoTests` の値を product-ready が生成する設定でのみ確かめており、リポジトリの `vitest.config.ts` の値は守られていない。ADR 03 の `Forbidden` にある「代わり」の主張は、このプランで事実に合わせて修正された。

## Triage

- 4: _ex-change_ (ADR 03, `Unit.test-run`): done 2bd8dba
  - Fact: `vitest.config.test.ts` から `passWithNoTests` の断言が削除された。ADR 03 では product-ready のテストを代わりにしたが、そのテストは product-ready が生成する設定だけを確かめるため、リポジトリの `vitest.config.ts` の値を守らない。
  - Why: リポジトリの `vitest.config.ts` の `passWithNoTests: true` が false に変わっても、関連するテストは成功したままになる。product-ready が生成する設定で全テストを除外したときは、`pnpm test:run` が失敗する可能性がある。
  - Then: `vitest.config.test.ts` に `passWithNoTests` の値を確かめる断言を 1つ戻すか、`vitest.config.ts` の値を守る別の断言を足す。

## Verified

### quality-gate

- Plans:
  - `quality-gate-sound`
- Result: OK
- Change: OK
- Fixed: なし

### test-run

- Plans:
  - `quality-gate-sound`
  - `vitest-config`
- Result: OK
- Change: OK
- Fixed: `vitest.config.test.ts` に `passWithNoTests` を守るテストを足した (2bd8dba)

### sound-notify

- Plans:
  - `quality-gate-sound`
- Result: OK
- Change: OK
- Fixed: なし

### product-ready

- Plans:
  - `vitest-config`
- Result: OK
- Change: OK
- Fixed: なし
