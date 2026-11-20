# PLAN `reasons`

- ADR-No: 04
- Place: worktree
- Boundary Plans: `ports`（order 1）、`guard` と `retry-args`（order 2）、`each`（order 3）。他の 4 つが消す抑制を数え、同じファイルに `Reason` 行を足すため、4 つの後に置く。

## Goal

残す 6 件の抑制が、理由と狭い許可で通る。

## Refactor

- Inside:
  - Modules: なし。既存の 6 ファイルにコメントを足し、`suppression-check.json` の項目を入れ替える。ファイルは増やさない。
  - Dirs: なし。
- Outside:
  - Extract: なし。許可の一覧は検査のためのデータである。コードとして共有する相手がない。
  - Colocate: なし。

## Files

```text
scripts/
  checks/
    suppression-check.json                      update
.pi/
  extensions/
    quality-gate/
      gate/
        checks.ts                               update
    thinking-scrub/
      index.test.ts                             update
    context-precompact/
      test/
        prepared.fixture.ts                     update
      index.test.ts                             update
    consult/
      index.test.ts                             update
```

## Slices

## 1.許可を狭め、6 件に理由を置く

`consistent-type-assertions` は全体の定義として残す。`no-unsafe-type-assertion` を 3 つのディレクトリに狭める。`no-await-in-loop` を `quality-gate` に足し、6 件に `Reason` を置く。ここまでを 1 つのスライスにするのは、許可と理由のどちらかだけでは、検査の違反が 0 にならないためである。

### Types

なし

### Steps

1. `scripts/checks/suppression-check.json`
   1. update: 3 つの広い項目（`**/*.{ts,tsx}`、`**/.*/**/*.{ts,tsx}`、`.*.{ts,tsx}`）の `rules` を、`@typescript-eslint/consistent-type-assertions` と `typescript/consistent-type-assertions` の 2 つだけにする。`no-unsafe-type-assertion` の 2 つの綴りを外す（C3, F3）。
   2. add: 3 つの広い項目の後に、次の `rules` で 4 つの項目をこの順に足す（C3, F3, F5）。

      ```json
      [
        {
          "path": ".pi/extensions/consult/**/*.{ts,tsx}",
          "rules": ["typescript/no-unsafe-type-assertion"]
        },
        {
          "path": ".pi/extensions/thinking-scrub/**/*.{ts,tsx}",
          "rules": ["typescript/no-unsafe-type-assertion"]
        },
        {
          "path": ".pi/extensions/context-precompact/**/*.{ts,tsx}",
          "rules": ["typescript/no-unsafe-type-assertion"]
        },
        { "path": ".pi/extensions/quality-gate/**/*.{ts,tsx}", "rules": ["no-await-in-loop"] }
      ]
      ```

2. `.pi/extensions/quality-gate/gate/checks.ts`
   1. update: 139 行目の抑制コメントを、次の 2 行に置き換える（C1, C2, C5, F1）。

      ```ts
      // Reason: 修正してから検証する順序が仕様であり、並列にすると検証が修正前の状態を見る
      // oxlint-disable-next-line no-await-in-loop
      ```

3. `.pi/extensions/thinking-scrub/index.test.ts`
   1. update: 70 行目の抑制コメントを、次の 2 行に置き換える（C1, C2, C5, F1）。

      ```ts
      // Reason: ExtensionAPI['on'] は overload 群で記録用の偽物を満たせないため、使う窓口だけを持つ偽物を渡す
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      ```

   2. update: 648 行目の抑制コメントを、次の 2 行に置き換える（C1, C2, C5, F1）。

      ```ts
      // Reason: role の取得で例外を投げる値を意図的に作り、境界の例外処理を確かめる
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      ```

4. `.pi/extensions/context-precompact/index.test.ts`
   1. update: 165 行目の抑制コメントを、次の 2 行に置き換える（C1, C2, C5, F1）。

      ```ts
      // Reason: ExtensionAPI['on'] は overload 群で記録用の偽物を満たせないため、使う窓口だけを持つ偽物を渡す
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      ```

5. `.pi/extensions/consult/index.test.ts`
   1. update: 405 行目の説明コメントを、次の 1 行に置き換える。406 行目の抑制コメントはすでに目的の形（`// oxlint-disable-next-line typescript/no-unsafe-type-assertion`）であるため、変えない（C1, C2, C5, F1）。

      ```ts
      // Reason: 入口全体を呼ぶ 5 つの検証のために ExtensionAPI が必要で、30 以上のメンバーを偽物で用意しない
      ```

6. `.pi/extensions/context-precompact/test/prepared.fixture.ts`
   1. update: 43 行目の抑制コメントを、次の 2 行に置き換える（C1, C2, C5, F1）。

      ```ts
      // Reason: compact が本物の Model を要求するためポートを狭められず、テストは使う欄だけを持つ偽物を渡す
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      ```

### Policy

- Allowed:
  - `consistent-type-assertions` は全体の定義として、3 つの広い項目に残す（C3, F3）
  - 規則名は `typescript/no-unsafe-type-assertion` に揃える（F3）
  - 指示の綴りは `oxlint-disable-next-line` に揃える。検査は `oxlint-` と `eslint-` の両方を読むが、読む道具の名前を示す綴りにする。ただし、ADR は綴りを決めていないため、これはこの plan の選択である（F1, F3）
  - パスはディレクトリまでにし、ファイル名を書かない（F5）
  - 許可の条件はパス、規則名、`Reason` の 3 つに限る（C2, F2）
  - `Reason` の文面は、コードで表現できない理由を書く（C1）
- Forbidden:
  - 検出の構文と判定の 3 分類を変えない - 078 が決めた（C4）
  - 理由のない許可を足さない - 検査にもれが生じる（C2）

### Verify

- Always:
  - `pnpm test:related .pi/extensions/quality-gate/gate/checks.ts .pi/extensions/thinking-scrub/index.test.ts .pi/extensions/context-precompact/index.test.ts .pi/extensions/consult/index.test.ts .pi/extensions/context-precompact/test/prepared.fixture.ts`
  - `pnpm test:run scripts/checks/suppression-check.test.ts`。`suppression-check.json` を変えても `pnpm test:related` は JSON からテストを導けないため、テストを直接実行する
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えた 6 ファイルを読み、`Reason` 行が抑制コメントの直前にあり、行末の理由が消え、規則名が揃っていることを確かめる
  - `scripts/checks/suppression-check.json` と `scripts/checks/suppression-check.mjs` の `judge` を読み、7 つの項目のパスと `rules` が、`path.matchesGlob` と `includes` で意図どおりに当たるか確かめる
- Added:
  - `pnpm suppression-check --report` を、作業の前に 1 度、後に 1 度実行する。作業前は 6 件の違反である。作業後は `0 violations, 6 allowed` になり、6 件が `allowed` と表示されることを確かめる

## Notes

### Slice 1: 許可を狭め、6 件に理由を置く

- Findings: なし
- Unplanned: なし
- Commit: 1dd6f34a8d20b7ec9ea2b41d5cec2469f0bf1fb3
- Stopped: なし

### Cleanup: なし

- Findings: なし
- Unplanned: なし

## Work Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Policy:
- Unproven:
- Noise:
- Doubts:

### Round 2

- Stale:
- Unlisted:
- Gaps:
- Policy:
- Unproven:
- Noise:
- Doubts:

## Acceptance

- Goal:
- Ran:
- Findings:
- Doubts:
