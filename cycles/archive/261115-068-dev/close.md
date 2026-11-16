# Close 068

## Collected

### 01 arg-cleanup (ADR 01)

1. 125 / Work Review Round 1 / `.pi/extensions/thinking-scrub/command/scrub.test.ts:91` の題名「3 グループの SettingsRead と status...」の「3 グループ」が何を指すか。本文が `fakePort()` の既定値（`ok`＋既定の status）に簡略化された後も題名が正しいかどうか、所有者の判断がいる（直さずに閉じるか、題名を実態に合わせるか）。

### 02 thinking-scrub-tests (ADR 02)

2. 311 / Work Review Round 2 / `units.test.ts:149` は `some(opaque)` であり、テストは表行と diff 行のどちらが不透明化に寄与したかを個別には断言していない。両行とも `isOpaqueLine` を通るため、作業では Gaps をふさぐには足りると判断したものの、片方の分岐だけが壊れた場合に検出できるかどうかをコードを読むだけでは確かめていない。
3. 318 / Acceptance / 計画の 128 件に対し 126 件である。作業では `onAgentSettled` の no-send 2 件と integration 1 件を整理の View に沿う判断で削除した。 / left: 件数は計画段階の見積もりであり、削除は整理の View に沿うため、作業では戻さないと判断した。

### 03 context-precompact-tests (ADR 03)

4. 292 / Acceptance / `index.test.ts:219` の引数なし `sessionWithTurns()` は既定値の経路を実行するが、テストは `branch` が 3 ターン分であることを断言しておらず、既定値 `3` を厳密には保証できていない。

## Triage

- 2: _ex-change_ (ADR 02, Unit.thinking-scrub): done 45d5be4
  - Fact: `units.test.ts:149` の表行と diff 行の復元テストは `some(opaque)` であり、テストは表行と diff 行のどちらが不透明化に寄与したかを分けて断言していない。
  - Why: 表行と diff 行はどちらも `isOpaqueLine` を通るが、テストは片方の分岐だけが壊れた場合を検出できない。1 つのテストの断言を分けるだけでふさげる。
  - Then: 表行と diff 行がそれぞれ `opaque` であることを断言する。
- 3: _ex-change_ (ADR 02, Unit.thinking-scrub): done 6dc0e21
  - Fact: 計画の 128 件に対し、テストは 126 件である。作業では `onAgentSettled` の no-send 2 件と integration 1 件を整理の View に沿う判断で削除した。2 件の `sent` はテスト内のローカル配列で、配線の `followUp` につながっておらず、`expect(sent).toHaveLength(0)` は常に真だった。
  - Why: 2 件は空振りだったので削除は正しい。一方、`handleAgentSettled` の `!aborted` と `taken === undefined` の 2 分岐は残っており、直接の検査がない。`followUp` を本物にした 2 件を戻せば 128 件になり、分岐の検査も戻る。
  - Then: `scrubWiring` に `followUp` の option を加え、`followUp: (content) => sent.push(content)` を渡す `onAgentSettled` の no-send 2 件を戻す。
- 4: _ex-change_ (ADR 03, Unit.context-precompact): done 48f07a0
  - Fact: `index.test.ts:219` のテストの主題は、`flush` が実行中のパスを待ち、`prepared` ができ、status が `ready` になることである。引数なしの `sessionWithTurns()` はその前提を作る setup であり、既定値 `3` はテスト側の便宜である。既定値 `3` を変えてもこのテストが失敗しないのは、既定値が主題ではないからである。ただし、引数なしの呼び出しは、既定値 `3` が何を意味するかを読み手に説明しない。
  - Why: テストの主題は製品の振る舞いであり、既定値のテストは要らない。一方、引数なしの呼び出しの `3` は、名前か注記がないと勘違いを生む。`DEFAULT_TURNS = 3` のような名前付きの定数か、呼び出しの注記で説明するのが筋である。
  - Then: `test/session-entries.ts` に `DEFAULT_TURNS = 3` を置いて `sessionWithTurns` の既定値に使う。
- 1: dropped (ADR 01, Unit.thinking-scrub)
  - Fact: `command/scrub.test.ts:91` の題名の「3 グループ」は、既定値の `SettingsRead` の live と sentence と char の 3 つを指す。`fakePort()` の既定値はその 3 グループを返す。
  - Why: 題名は実態と合っているため、直す必要がない。
  - Then: なし

## Verified

### Unit.thinking-scrub

- Plans: 01-arg-cleanup, 02-thinking-scrub-tests
- Result: ok
- Change: ok

### Unit.context-precompact

- Plans: 03-context-precompact-tests
- Result: ok
- Change: ok
