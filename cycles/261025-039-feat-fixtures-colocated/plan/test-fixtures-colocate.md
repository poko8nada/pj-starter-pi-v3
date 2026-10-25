# PLAN `test-fixtures-colocate`

- No: 01

## Files

```text
.pi/
  extensions/
    consult/
      consult.fixture.ts        add
      index.test.ts             update
      policy/
        types.test.ts           update
      run/
        delivery.test.ts        update
        log.test.ts             update
        subagent.test.ts        update
      sub/
        spec.test.ts            update
      tool/
        consult.test.ts         update
        run.test.ts             update
        subagents.test.ts       update
        worktree.test.ts        update
    context-prune/
      prune.fixture.ts          add
      apply/
        drafts.test.ts          update
      command/
        prune.test.ts           update
      entry/
        data.test.ts            update
        render.test.ts          update
      index.test.ts             update
      prune/
        collect.test.ts         update
        ports.test.ts           update
      settings/
        read.test.ts            update
        schema.test.ts          update
    thinking-scrub/
      scrub.fixture.ts          add
      command/
        scrub.test.ts           update
      index.test.ts             update
      live/
        guard.test.ts           update
      scrub/
        detect.test.ts          update
        message.test.ts         update
        units.test.ts           update
  skills/
    close/
      scripts/
        collect.fixture.ts      add
        collect.test.ts         update
scripts/
  checks/
    typecheck.test.ts           update
    typecheck-staged.test.ts    update
  harness/
    config.test.ts              update
    harness.json                update
    index.test.ts               update
  product-ready/
    cli.test.ts                 update
    index.test.ts               update
test/
  close-fixture.ts              drop
  consult-fixture.ts            drop
  pi-fixture.ts                 drop
  pi.fixture.ts                 add
  prune-fixture.ts              drop
  scripts-fixture.ts            drop
  scripts.fixture.ts            add
  scrub-fixture.ts              drop
```

## Slices

## 1.フィクスチャの配置

### Types

なし

### Steps

1. `test/consult-fixture.ts` を `.pi/extensions/consult/consult.fixture.ts` へ移す。読む 10 本の import を `./consult.fixture.ts` か `../consult.fixture.ts` に直す。
2. `test/prune-fixture.ts` を `.pi/extensions/context-prune/prune.fixture.ts` へ移す。読む 8 本の import を直す（`prune/collect.test.ts` は `prune-fixture` を読まず、`pi-fixture` だけを読む）。
3. `test/scrub-fixture.ts` を `.pi/extensions/thinking-scrub/scrub.fixture.ts` へ移す。`test/pi-fixture.ts` の `assistantMessage` もここへ移す（中身は thinking-scrub の退化した thinking なので、形はホスト、中身は機能）。`piUsage` と型は `test/pi.fixture.ts` に残し、`scrub.fixture.ts` がそこから読む。読む 6 本の import を直す。
4. `test/close-fixture.ts` を `.pi/skills/close/scripts/collect.fixture.ts` へ移す。読む 1 本の import を直す。
5. `test/pi-fixture.ts` を `test/pi.fixture.ts` に改名する。`degenerate` と `assistantMessage` を step 3 で `scrub.fixture.ts` へ渡したので、`pi.fixture.ts` は `piUsage` と `PiAssistantMessage` の型だけにする。`test/` から機能のフィクスチャへの import が残っていないことを確かめる（共有のフィクスチャが機能に依存すると、他の機能のテストがその機能のフィクスチャを読み込む）。読む 5 本の import を直す。
6. `test/scripts-fixture.ts` を `test/scripts.fixture.ts` に改名する。読む 5 本の import を直す。
7. 移した先の名前が、テストと並んで製品のコードに見えないことを確かめる（`*.fixture.ts` は `*.test.ts` の隣に並ぶ）。
8. 各フィクスチャの冒頭の注記を、新しい道と名前に合わせる。

### Verify

- Always:
  - 既定の 5 つ
- Added: なし

## 2.写す一覧と検査

### Types

なし

### Steps

1. `scripts/harness/harness.json`:
   - `copy` の `"test/temp-dir.ts"` の並びに、`"test/pi.fixture.ts"` と `"test/scripts.fixture.ts"` を足す。`.pi` の下へ移った 4 本は、`".pi"` で写るので足さない。
2. `scripts/harness/config.test.ts`:
   - `readList(root)` で一覧を読み、`test/` の直下の `*.ts` を並べ、すべてが `copy` の項目に一致することを見る。一覧はテストの中で組まない（実物の一覧を読む。この検査の目的が「実物の一覧が揃っているか」だから）。
   - 期待する一覧は、`test/` を歩いて作る。件数を直書きしない。
   - (error) `test/` のファイルが、すべて `copy` にある。

### Verify

- Always:
  - 既定の 5 つ
- Added: なし

## Notes

### Slice 1: フィクスチャの配置

- Findings:
  - なし
- Unplanned:
  - なし
- Commit: 98b0c10
- Stopped:

### Slice 2: 写す一覧と検査

- Findings:
  - なし
- Unplanned:
  - なし
- Commit: e3a70d0
- Stopped:

### Cleanup: 重複と不要な枝の掃除

- Findings:
  - なし — 触った test 群に同じ振る舞いの重複も消えた振る舞いも無くなった枝も `## Test cases` に反する物も無かった。
- Unplanned:
  - なし

## Review

### Plan review

- `test/pi-fixture.ts:9` が `./scrub-fixture.ts` を読み、`degenerate()` を既定の thinking に使っています。どの step にも、この import を直す手順がありませんでした。
  - fixed: `assistantMessage` を `scrub.fixture.ts` へ移し、`test/pi.fixture.ts` は `piUsage` と型だけにした。共有のフィクスチャが機能に依存しない形になり、import を直す手順もいらなくなった。
- `test-fixtures-colocate.md:91` の「`prune-fixture` を読む 9 本」は実物と合いませんでした（8 本）。`prune/collect.test.ts` は `pi-fixture` だけを読みます。
  - fixed: 8 本に直し、`collect.test.ts` の注記を足した。

### Round 1

- Stale:
  - なし — 旧名 (`scripts-fixture` 等) が製品コードに残っていないことと、`scripts/checks/typecheck.test.ts:7` 等の注記が新名であることを確認しました。
- Unlisted:
  - なし — `Files` の45項目が `git diff 3b92383..HEAD` の40件 (改名5件の畳み込み) と計画書自体の記録更新のみに対応することを確認しました。
- Gaps:
  - なし — `scripts/harness/config.test.ts:53` が実物の `test/` 走査で `copy` 包含を検査すること、`test/` に機能への import が無いことと `scripts/harness/harness.json:8` が `test/` の3件を全て含むことを実物で確認しました。
- Unproven:
  - なし — `scripts/harness/config.test.ts:53` の期待一覧は `readdirSync` による実物走査で組み、製品関数で期待を組む形ではないこと (`readList` の利用は計画の決定どおり) を確認しました。
- Noise:
  - なし — 新検査は件数や文言の直書きを持たず、`test/pi.fixture.ts:15` 等の工場利用は `## Test cases` の要請に沿うことを確認しました。
- Doubts:
  - なし

## Acceptance

- Ran:
  - `pnpm test:run` → 54 ファイル / 767 ケース緑
  - `pnpm typecheck` → root: ok、`.pi`: ok
  - `pnpm lint` → 緑
  - `pnpm format:check` → 緑
  - 「振る舞いを壊す」を 2 件試した。
    - `harness.json` の `copy` から `test/pi.fixture.ts` を消す → 「test/ 直下の *.ts → すべて copy の項目にある」が赤。戻して緑を確認。
    - `copy` に無い `test/extra.fixture.ts` を置く → 同じ検査が赤。ファイルを消して緑を確認。
- Findings: なし
- Doubts: なし
