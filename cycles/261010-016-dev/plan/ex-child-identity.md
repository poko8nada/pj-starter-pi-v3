# ex-child-identity

子の番号（`consult-1`、`consult-2`）が reload で 1 に戻るために、**走っている子が一覧から消える**穴を閉じる。

## Where

parent tree。worktree を作らない（owner の指示）。

## Files

- `.pi/extensions/consult/tool/consult.ts`（番号の決め方）
- `.pi/extensions/consult/tool/consult.test.ts`（確認）
- `cycles/261010-016-dev/adr.md`（現状の前提として引いている 2 行と、新しいエントリ）

## Scope

- consult.children: 子の番号を**その session の記録の最大 + 1** にする。拡張のメモリーで数えない（reload で消える）
- ADR: 01-2 が前提として引いている「`latest()` は child id を鍵にする」の 2 行を、直した後の姿に合わせる

## I/O

```text
入力: place と session（runtime が既に持っている）
出力: `consult-<n>` の名前 1 つ
依存: なし。worktree を作らない
```

## Slices

### Slice 1: 番号を記録から決める

- Steps:
  1. `RuntimeState` の `counter` を消す（`tool/consult.ts:262`）
  2. `beginRun`: `session` を先に読み、`id` を `nextChildId(place, session)` にする（`:356`〜`:364`）
  3. `numberOf`（`consult-12` → 12）と `nextChildId`（記録の最大 + 1。`KEEP_DAYS` 幅で読む）を足し、`KEEP_DAYS` を import に足す
  4. `createRuntime` の `counter: 0` を消す（`:432`）
  5. ADR: `:22` と `:29` の 2 行を直し、エントリ `01-5` を足す
- Verify: 下のケース
- I/O: `tool/consult.ts` と `adr.md` だけ

## Verify

- cli: 番号をメモリーで数えていない
  - (happy) `grep -c "counter" .pi/extensions/consult/tool/consult.ts` が `0`
- test: `pnpm vitest run .pi/extensions/consult/tool/consult.test.ts`
  - (happy) 記録に `consult-3` まであれば、次の子は `consult-4`
  - (empty) 記録が空なら `consult-1`
  - (error) `consult-7` と `consult-2` が混ざっていれば `consult-8`
- 全体: `pnpm test:run`・`pnpm lint`・`pnpm typecheck`
- 壊し
  - (error) `nextChildId` が記録を読まず `1` を返すようにする → 上の test が赤（確かめたら戻す）

## Notes

### Slice 1: 番号を記録から決める

- Findings: レビューの Gaps 3 件（`## Review` を見る）。全部採った
  - 1 と 3 はテストを足した
  - 2 はコードも直した。記録に書かれるのは子が起きた時なので、同じ runtime で続けて起こすと 2 体目が 1 体目の行を見ない。決めた番号を「床」として覚え、session が変われば記録から取り直す
- Unplanned: なし（2 のコード修正はレビューの指摘から出た物で、plan の Slice の外ではない）
- Commit: **未 commit**（owner の許可待ち）
- 逸脱: plan の Steps 5「ADR に 01-5 を足す」は **owner の指示で取り下げた**（ADR には書いていない）。決定はこの plan md に残す
- Verify (done here):
  - cli: `grep -c "counter" .pi/extensions/consult/tool/consult.ts` → 0
  - test: `pnpm vitest run .pi/extensions/consult/tool/consult.test.ts` → **27 tests** 緑（新規 5 本: 記録の consult-3 → 4 / 混在 → 8 / 別 session は数えない / 同じ runtime で 2 体 / 終わった子も数える）
  - 全体: `pnpm test:run` → 32 files / **532 tests** 緑、`pnpm lint` 緑、`pnpm typecheck` 緑
  - 壊し 1: `nextChildId` が記録を読まず `1` を返す → 新規 2 本が赤 → 復旧
  - 壊し 2: 「床」（同じ runtime の覚え）を外して記録だけから数える → 「同じ runtime で続けて 2 体」が赤 → 復旧

## Review

### Round 1

- Stale: なし
- Unlisted: なし
- Gaps:
  - 別セッションの記録を番号に数えないことは検査されておらず、別セッションに consult-9 があっても同セッションの次が consult-1 になる確認が consult.test.ts の2件になく、session 絞りを外しても緑のままです（consult.ts:358-359）。
    - `fixed: 別 session の consult-9 を置いても、この session の次が consult-1 になるテストを足した（絞りを外すと赤）`
  - 同じランタイムで続けて2体起こしたときに番号が被らないことは検査されておらず、2回目の beginRun が1回目の onStarted の追記より先に記録を読むと同じ id になり得ますが、その経路の確認がありません（consult.ts:382-408）。
    - `fixed: 同じ runtime で続けて 2 体起こすテストを足し、コードも直した（記録に書かれる前に 2 体目の番号を決めるので、決めた番号を覚えて続きから振る。session が変われば記録から取り直す）。床を外すと赤`
  - 終わった子（ended のある行）の番号も最大に含めることは検査されておらず、seed が走っている行だけで終わった consult-5 を混ぜた確認がなく、running だけを読んでも現状の検査は緑のままです（consult.ts:358-362、consult.test.ts:143-152）。
    - `fixed: 終わった行（ended あり）の consult-5 を置いて、次が consult-6 になるテストを足した`
- Unproven: なし

### Round 2

- Stale:
  - なし
- Unlisted:
  - なし
- Gaps:
  - なし
- Unproven:
  - なし

（子（`consult-2`）の報告から親が記録した。この子は plan md に書かなかった。`fixed:` の 3 件は現物で確認された — 別 session の絞りは `readRuns` の session 付き呼び出し、同じ runtime の連打は `state.number` の床、終わった子は `readRuns` の使い方にそれぞれ対応し、どれを外しても新規テストが赤になる。diff は `consult.ts` と `consult.test.ts` の 2 本だけで、`test/` と worktree には触れていない）

## Acceptance

- Ran:
  - plan の cli: `grep -c "counter" .pi/extensions/consult/tool/consult.ts` → `0`
  - `pnpm vitest run .pi/extensions/consult/tool/consult.test.ts` → 27 tests 緑
  - `pnpm test:run` → 32 files / 532 tests 緑
  - `pnpm lint`・`pnpm typecheck` → 緑
  - 壊し 1: 記録を読まず `1` を返す → 赤（新規 2 本）→ 復旧
  - 壊し 2: 「床」を外して記録だけから数える → 赤（同じ runtime で 2 体）→ 復旧
- Findings:
  - レビューの Gaps 3 件は全部直した（`fixed:` を `## Review` に書いた）
  - `test/` は触っていない。worktree は作っていない（owner の指示）
  - commit は owner の許可待ち
