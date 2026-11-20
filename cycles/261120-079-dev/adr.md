# ADR 079

## 01: 型の当てはめで外す抑制

Type: _Full_

### Context

- C1: 抑制コメントは 19 件あり、`pnpm suppression-check --report` は 162 ファイル、19 件の違反、許可 0 件を報告する。抑制は、コードを変えて消すか、直前の `// Reason:` 行とホワイトリストで通すかのどちらかである。
- C2: この entry が扱うのは 8 件である。`.pi/extensions/consult/tool/consult.test.ts:320`（不要）、`.pi/extensions/consult/index.test.ts:406`、`.pi/extensions/thinking-scrub/scrub.fixture.ts:81`、`.pi/extensions/context-precompact/run/ports.test.ts:29`、`.pi/extensions/context-precompact/index.test.ts:111`、`.pi/extensions/context-precompact/index.test.ts:208`、`.pi/extensions/context-precompact/test/prepared.fixture.ts:43`、`.pi/extensions/context-precompact/test/prepared.fixture.ts:57`。
- C3: 全体規約は `as any` と `as unknown as T` を禁じ、型ガード・ジェネリクス・オーバーロードを先に検討させる。アサーションは、境界の実行時検証の後、DOM、第三者の型の不備、テストの部分モックに限り、理由を添えて許す。
- C4: オーナーは、設定による緩和をこのサイクルで扱わないと決めた。
- C5: オーナーは、狭め方に複数の案があることを認め、どれを取るかの判断をこの entry に委ねた。`Pick` と注釈で決まる部分は確認すべき事項であり、論点ではない。
- C6: 対象は `.pi/extensions` 配下だけであり、ルートの `tsconfig.json` からは `exclude` され、`.pi/tsconfig.json` で型チェックされる。

### Research & Trial

- F1: `Pick<ExtensionContext['sessionManager'], 'getSessionId'>` の型には、`{ getSessionId: () => string }` の偽物と、本物の `ExtensionContext['sessionManager']` の両方が代入できる。出所: 一時ファイル `probe-suppression.ts` を `tsc -p tsconfig.json --noEmit` で検査した結果（`memo-suppression.md` の 3.3）
- F2: `Pick<NonNullable<ExtensionContext['model']>, 'provider' | 'id' | 'maxTokens' | 'contextWindow'>` と `Pick<ExtensionContext['modelRegistry'], 'getApiKeyAndHeaders'>` も、偽物と本物の両方が代入できる。`ExtensionContext['model']` をそのまま `Pick` するとキーが `never` になり、型チェックが落ちる。出所: 同上
- F3: `const event: SessionBeforeCompactEvent = { ... }` と注釈すれば、リテラルの広がりを止められ、キャスト無しで通る。出所: 同上
- F4: 完全な既定値に `Partial` を重ねるとき、`Object.assign({}, base, overrides)` は通るが、合併型（`AgentMessage`）へのスプレッドは落ちる。出所: 同上
- F5: 記録用の偽物を `ExtensionAPI['on']` に代入することはできない。使うイベントだけを並べた狭い `on` を定義しても、本物の `ExtensionAPI` が入らない。出所: 同上（`probe-port.ts` の検査結果）
- F6: `PrecompactCtx` の `sessionManager` から読むのは `getBranch`・`getSessionId`・`buildSessionProjection` であり、`SummaryCtx` の `sessionManager` から読むのは `getSessionId` だけである。`SummaryCtx` の `modelRegistry` から読むのは `getApiKeyAndHeaders` だけである。出所: `.pi/extensions/context-precompact/index.ts:205,206,231,236,399,400`、`.pi/extensions/context-precompact/run/ports.ts:57,78`
- F7: `SummaryCtx` の `model` は、`compact(preparation, model: Model<any>, ...)` の第 2 引数にそのまま渡す。`Pick` で狭めると、本物の `Model<any>` を要求する呼び出しに合わなくなる。出所: `.pi/extensions/context-precompact/run/ports.ts:66-79`、`node_modules/@earendil-works/pi-coding-agent/dist/core/compaction/compaction.d.ts:144`
- F8: `assistantMessage` の上書きのうち、`Partial<PiAssistantMessage>` で表せないのは 2 件である。`role: 'user'` を渡すもの（`scrub/message.test.ts:107`）と、`content` に `Set` を渡すもの（`:116`）である。他の呼び出しはすべて表せる。出所: `.pi/extensions/thinking-scrub/scrub/message.test.ts:107,116`
- F9: `ExtensionAPI` の `on` は 43 件程度の overload 群であり、`registerCommand`・`registerTool`・`registerMessageRenderer` は単一の署名である。`unknown` を受ける記録用の偽物は、`on` の overload と本物の `ExtensionHandler`（`(event: E, ctx: ExtensionContext) => ...`）に合わない。出所: `node_modules/@earendil-works/pi-coding-agent/dist/core/extensions/types.d.ts:1182,1187-1227,1229,1231,1250`
- F10: 本物の `ExtensionContext` は、`pi.on` と `pi.registerCommand` の `ctx` として `PrecompactCtx` を要求する関数へそのまま渡されている。出所: `.pi/extensions/context-precompact/index.ts:519-531`
- F11: `@earendil-works/pi-coding-agent` は `ThinkingContent` と `UserMessage` を公開していない。`import type { ThinkingContent, UserMessage } from '@earendil-works/pi-coding-agent'` は `tsc` で `has no exported member` になる。出所: 一時ファイル `probe-exports.ts` を `tsc -p tsconfig.json --noEmit` で検査した結果（削除済み）
- F12: `SessionPort` の偽物は、そのままでは `buildSessionProjection` で合わない。`SessionProjection.entries[].messages` は書き換え可能な配列であり、`ProjectedEntry.messages` は読み取り専用である。`messages` を新しい配列にすれば合う。出所: 一時ファイル `probe-types.ts` を `tsc -p tsconfig.json --noEmit` で検査した結果（削除済み）

### Scope

- In:
  - failure: キャストが飛ばしていた型の検査を実際に行うようになる。合わない箇所は `pnpm typecheck` で落ちる（F1, F2, F3, F4）。
  - structure: ポートの型が変わる。`PrecompactCtx` と `SummaryCtx` の `sessionManager` と `modelRegistry`、`assistantMessage` の引数の型である。ファイルの分割は変えない（F6, F7, F8）。
  - downstream: 本物の `ExtensionContext` を渡す `index.ts` の `pi.on` 群と `createSummaryPorts`、偽物を作るテストが影響を受ける（F10）。
  - values & expression: 狭いポートの型の名前と、`assistantMessage` の引数の書き方が増える（F6, F8）。
  - logic: ガードを `unknown` を受ける型述語へ移す。条件そのものは変えず、置き場所と入力の型を変える（F8）。
- Out:
  - safety: 秘密、権限、公開、個人データに触れない。型の注釈とテストの偽物だけを変える。
  - upstream: 新しいパッケージも契約も足さない。`Pick` と `NonNullable` は TypeScript の組み込みである。
  - result: 返す値と副作用の種類は変わらない。
  - existing data: 保存されたデータ、記録、配布物は動かさない。
  - cost: 時間、資源、費用は変わらない。
  - verification: 検査のコマンドは変えない。`pnpm typecheck`、`pnpm lint`、`pnpm test:run`、`pnpm suppression-check` をそのまま使う。
  - observability: 記録と信号は変えない。
  - release: 配布、適用、戻し方は変えない。
  - other: 上のどれにも当たらない関心は無い。

### Decision

- Status: **accepted**
- Main: 8 件のうち、型の当てはめを変えて 6 件を消す。残る 2 件（`.pi/extensions/consult/index.test.ts:406`、`.pi/extensions/context-precompact/test/prepared.fixture.ts:43`）は、第三者の型との境目にある部分モックのためであり、理由を添えて残し、entry 04 が扱う（C1, C2, C3, C5）。
  - Add:
    - 外部の型から読むメンバーだけを抜き出したポートの型。`SessionPort`（`getBranch`・`getSessionId`・`buildSessionProjection`）、`RegistryPort`（`getApiKeyAndHeaders`）、`SummaryCtx` 用の `Pick<SessionPort, 'getSessionId'>` である（C2, F1, F2, F6）
    - `isAssistantMessage(input: unknown): input is AssistantMessage` を `.pi/extensions/thinking-scrub/scrub/message.ts` に置く（C2, C3, F8）
  - Update:
    - `context-precompact` の偽物 4 か所を、キャストではなく狭いポートのリテラルにする（C2, F1, F2, F6, F12）
    - `context-precompact` のイベント 1 か所を、キャストではなく注釈つきのリテラルにする（C2, F3）
    - `assistantMessage` の引数を `Partial<PiAssistantMessage>` にし、既定値に `Object.assign` で重ねる（C2, F4, F8）
    - `scrubMessage` の role と content のガードを、`isAssistantMessage` の呼び出しに置き換える（C2, F8）
    - `index.test.ts:36-40` のブロックを `ThinkingBlock` として型付けする。`ThinkingContent` はパッケージが公開していない（C2, F8, F11）
    - `role: 'user'` のテストを、本物の user メッセージ（`Extract<AgentMessage, { role: 'user' }>`）に変え、`content` が配列でないテストは `isAssistantMessage` に直接渡す形にする（C2, F8, F11）
  - Drop:
    - 抑制コメント 6 件。`consult/tool/consult.test.ts:320`（不要）、`context-precompact/run/ports.test.ts:29`、`context-precompact/index.test.ts:111`、`context-precompact/index.test.ts:208`、`context-precompact/test/prepared.fixture.ts:57`、`thinking-scrub/scrub.fixture.ts:81` である（C2, F1, F2, F3, F6, F8）
- Secondary: なし
- Policy:
  - Allowed:
    - 狭いポートは `Pick<本物の型, 読むメンバー>` で作る（C3, F1, F2, F6）
    - リテラルは型注釈で受けて、文字列と真偽値の広がりを止める（C3, F3）
    - 検証する関数の入力は `unknown` にし、型述語で確かめられた型を返す（C3, F8）
    - 確認は既存のコマンドで行う（C4, C6）
    - `prepared.fixture.ts` のモデルの偽物は、理由を添えて部分モックとして残す - `model` は `compact` の要求で狭められない（C3, F7）
    - 本物の `ExtensionContext` は狭いポートを満たすため、`index.ts` の受け渡しは変えない（F1, F2, F10）
    - `consult` の入口の偽物は残す - `on` は overload 群であり、入口全体を呼ぶ検証が記録用の偽物を必要とする（F5, F9）
  - Forbidden:
    - `as unknown as T` を新しく足さない - 全体規約が禁じている（C3）
    - `SummaryCtx` の `model` を `Pick` で狭めない - `compact` が本物の `Model<any>` を要求する（F7）
    - 設定を変えない - オーナーがこのサイクルで扱わないと決めた（C4）

#### Details

- assistant のメッセージかを確かめる型述語
  ```ts
  export function isAssistantMessage(input: unknown): input is AssistantMessage {
    if (typeof input !== 'object' || input === null) {
      return false;
    }
    if (!('role' in input) || input.role !== 'assistant') {
      return false;
    }
    if (!('content' in input) || !Array.isArray(input.content)) {
      return false;
    }
    return true;
  }
  ```
- `assistantMessage` の契約
  ```ts
  export function assistantMessage(
    overrides: Partial<PiAssistantMessage> = {},
  ): PiAssistantMessage {
    const base: PiAssistantMessage = {/* 既定値 */};
    return Object.assign({}, base, overrides);
  }
  ```

### Definition

- `Unit.suppression-check`(kept): 抑制を指摘する機能は変わらない。指摘される抑制が 6 件減るだけで、指摘を受け取れるという行の意味は変わらない。
- `Unit.context-precompact`(kept): コンパクションの準備を始める機能は変わらない。読むメンバーだけの狭いポートに変わるのは、機能までの経路である。
- `Unit.thinking-scrub`(kept): ループした thinking を取り除く機能は変わらない。assistant かを確かめる手順が `unknown` を受ける型述語へ移るのは、機能までの経路である。

## 02: テストの繰り返しの書き換え

Type: _Full_

### Context

- C1: `no-await-in-loop` の抑制は 6 件あり、そのうち 5 件はテストの繰り返しの中の `await` である。`.pi/extensions/context-precompact/index.test.ts:456`、`:458`、`:826`、`:828`、`:923` である。
- C2: 検査の `pnpm lint` は `--deny-warnings` で回るため、警告も失敗になる。
- C3: 変えてよいのは繰り返しの書き方だけで、何を確かめるかは変えない。テストの名前と件数は変わりうる。
- C4: この entry が扱うのは 5 件であり、`.pi/extensions/quality-gate/gate/checks.ts:139` は entry 04 が扱う。

### Research & Trial

- F1: `it.each` は配列の表を受け取り、行がすべて配列なら行の要素を引数に展開し、行がオブジェクトなら行そのものを 1 引数で渡す。題名の `%s` は行の値を順に、`$name` は行の属性を展開する。出所: `node_modules/vitest/dist/chunks/config.d.QBNYCgFU.d.ts:2624-2629`、`node_modules/vitest/dist/chunks/run.BPv-BBRv.js:2879-2889`
- F2: `it.each` の本体は `(...args: T) => Awaitable<void>` を受け取るため、`async` の本体を渡せる。出所: `node_modules/vitest/dist/chunks/config.d.QBNYCgFU.d.ts:2620-2623`
- F3: `as const` を付けたタプルは `ExtractEachCallbackArgs` により、要素のリテラル型がそのまま本体の引数の型になる。出所: `node_modules/vitest/dist/chunks/config.d.QBNYCgFU.d.ts:2607-2626`
- F4: このリポジトリのテストで `it.each`・`test.each`・`describe.each` を使っている箇所は無い。出所: リポジトリ全体の `\.each\(` の検索（一致は `memo-suppression.md:187` の例示だけ）
- F5: 対象の 3 つの繰り返しは、文字列（`'projection'`・`'branch'`・`'usage'` と `'on'`・`'off'`）を回すものと、設定の違いを持つ 2 つの配線を回すものであり、各回の期待は同一である。出所: `.pi/extensions/context-precompact/index.test.ts:442-465`、`:813-831`、`:913-926`

### Scope

- In:
  - failure: 現在出ている `no-await-in-loop` の警告が消える。テストが落ちたときの表示は、事例ごとの名前に変わる（C1, C2, F1）。
  - structure: 1 つの `it` の中の繰り返しが、`it.each` による複数の `it` に変わる。ファイルの分割は変えない（F1, F5）。
  - values & expression: テストの題名の文言が増え、回している値が題名に入る（F1, F3, F5）。
- Out:
  - safety: 秘密、権限、公開、個人データに触れない。テストの中の書き方だけを変える。
  - upstream: 新しいパッケージも契約も足さない。`it.each` は `vitest` の API である。
  - result: テストが確かめる結果は変わらない（C3）。
  - logic: 各回で作る値と期待は変えず、繰り返しの書き方だけを変える（C3）。
  - existing data: 保存されたデータ、記録、配布物は動かさない。
  - downstream: `vitest.config.ts` はパスで絞るだけで、テストの名前を持たない（`vitest.config.ts:9-13`）。
  - cost: テストの件数が 3 から 8 に増えるが、実行時間の増え方はごくわずかである。
  - verification: 検査のコマンドは変えない。`pnpm test:run` をそのまま使う。
  - observability: 記録と信号は変えない。
  - release: 配布、適用、戻し方は変えない。
  - other: 上のどれにも当たらない関心は無い。

### Decision

- Status: **accepted**
- Main: 5 件の `no-await-in-loop` を、テストの繰り返しを `it.each` の事例に変えて消す（C1, C3, F1, F2, F5）。
  - Add:
    - 事例の表 3 つ（`as const` のタプル）と、事例名を持つ `it.each` のテスト（F1, F3）
  - Update:
    - `index.test.ts:440-466` の 2 つの配線の繰り返しを、事例 2 つに分ける（F5）
    - `index.test.ts:812-832` の 3 つの例外の繰り返しを、事例 3 つに分ける（F5）
    - `index.test.ts:911-927` の 2 つの命令の繰り返しを、事例 2 つに分ける（F5）
  - Drop:
    - 抑制コメント 5 件（C1, C2, C4）
- Secondary: なし
- Policy:
  - Allowed:
    - 事例の値は `as const` のタプルで渡し、リテラル型を題名と引数に使う（F3）
    - 各事例は自分の配線と準備を自分で作る（F5）
    - 前例が無いため、3 つの表を同じ書き方に揃える（F4）
  - Forbidden:
    - 事例を `Promise.all` でまとめない - 事例が 1 つのテストのままになり、落ちた事例が名前に出ない（C3）
    - 何を確かめるかを変えない - テストの意味を変えないため（C3）

#### Details

- 文字列の事例の表
  ```ts
  it.each(['projection', 'branch', 'usage'] as const)(
    'buildSessionProjection と getBranch と getContextUsage の %s の例外は failed になる',
    async (thrown) => {
      // 各事例が自分の配線と準備を作る
    },
  );
  ```
- 配線の事例の表（題名に説明を入れる）
  ```ts
  it.each([
    { name: '設定が off', make: () => createPrecompactWiring(/* enabled: false の設定 */) },
    { name: 'pi が off', make: () => createPrecompactWiring(/* 既定の設定 */) },
  ])('now で $name なら preparing と off になりパスを作らない', async ({ make }) => {
    // 各事例が自分の配線を作る
  });
  ```

### Definition

- `Unit.suppression-check`(kept): 抑制を指摘する機能は変わらない。指摘される抑制が 5 件減るだけである。
- `Unit.context-precompact`(kept): コンパクションの準備を始める機能は変わらない。テストの書き方が変わるのは、機能を確かめる手段である。

## 03: 再試行の表示の引数

Type: _Simple_

### Context

- C1: `.pi/extensions/consult/tool/render.ts:60` の `retryStartLine` は 6 引数、`:73` の `retryEndLine` は 5 引数であり、`max-params` の上限 4 を超える。
- C2: 出す文字列は変えない。呼び出し側は `.pi/extensions/consult/tool/consult.ts` の 2 か所、テストは `.pi/extensions/consult/tool/render.test.ts` の 3 か所である。
- C3: オーナーは、抑制を残さず、引数をまとめて外すことを認めた。

### Research & Trial

- F1: `retryStartLine` の 6 つの引数は、呼び出し側では `label`（`job.id`）、`model`（`event.model ?? '(model unknown)'`）、`attempt`・`maxAttempts`・`error`・`delayMs`（`event` の同名の値）から来ている。`retryEndLine` の 5 つの引数は、`label`・`model`・`attempt`・`success` が同じ由来で、`maxAttempts` だけは直前の `retry-start` から記憶した局所変数である。出所: `.pi/extensions/consult/tool/consult.ts:132-161`
- F2: 7 つの値を 1 つにまとめて持つ既存の型は無い。`ModelEvent` は `label` を持たず、`model` が `string | undefined` であり、`retry-start` と `retry-end` で持つ値が違う。出所: `.pi/extensions/consult/sub/spec.ts:202-216`
- F3: 複数の値を 1 つのオブジェクト引数にまとめた先例は `SubagentInput`・`RuntimeInput`・`RunOptions` である。出所: `.pi/extensions/consult/run/subagent.ts:59-65`、`.pi/extensions/consult/tool/consult.ts:215-225`、`.pi/extensions/consult/run/run.ts:37-63`

### Scope

_omission_

### Decision

- Status: **accepted**
- Main: `retryStartLine` と `retryEndLine` の引数を 1 つの型 `RetryNotice` にまとめ、`max-params` の抑制 2 件を消す（C1, C3, F1, F2）。
  - Add:
    - `RetryNotice` 型。`label`・`model`・`attempt`・`maxAttempts` を持つ（C1, F1）
  - Update:
    - `retryStartLine(retry: RetryNotice, error: string, delayMs: number)` にする（C2, F1）
    - `retryEndLine(retry: RetryNotice, success: boolean)` にする（C2, F1）
    - 呼び出し側 2 か所（`consult.ts`）とテスト 3 か所（`render.test.ts`）を、新しい引数に合わせる（C2）
  - Drop:
    - 抑制コメント 2 件（C1）
- Secondary: なし
- Policy:
  - Allowed:
    - 型の名前は先例（`SubagentInput`・`RuntimeInput`・`RunOptions`）に倣い、値を渡す型として名付ける（F3）
    - 2 つの関数が同じ型を共有する（C2, F1）
  - Forbidden:
    - 1 つの型に `error` と `success` を含めない - どちらかの関数が使わない値を持つことになる（C2）
    - 出す文字列を変えない - 振る舞いを変えないため（C2）

#### Details

_omission_

### Definition

- `Unit.subagent-consult`(kept): サブエージェントのコンサルを走らせる機能は変わらない。再試行の表示に渡す値のまとめ方が変わるのは、機能までの経路である。
- `Unit.suppression-check`(kept): 抑制を指摘する機能は変わらない。指摘される抑制が 2 件減るだけである。

## 04: 残す抑制の理由

Type: _Full_

### Context

- C1: コードでは表現できない抑制が 4 件ある。`.pi/extensions/quality-gate/gate/checks.ts:139`（修正してから検証する順序）、`.pi/extensions/thinking-scrub/index.test.ts:70` と `.pi/extensions/context-precompact/index.test.ts:165`（`on` を含むポートの偽物）、`.pi/extensions/thinking-scrub/index.test.ts:648`（`role` の取得で例外を投げる偽物）である。
- C2: 通すには、抑制コメントの直前の `// Reason: ` 行と、`scripts/checks/suppression-check.json` の該当項目の両方が要る。片方だけでは通らない。
- C3: ホワイトリストは現在、`**/*.{ts,tsx}` などで `@typescript-eslint/consistent-type-assertions`・`@typescript-eslint/no-unsafe-type-assertion`・`typescript/no-unsafe-type-assertion` を許可している。`no-await-in-loop` の項目は無い。
- C4: オーナーは、078 が決めた検出の仕組みと判定の 3 分類を変えないと決めた。
- C5: entry 01 が残すと決めた 2 件（`.pi/extensions/consult/index.test.ts:406`、`.pi/extensions/context-precompact/test/prepared.fixture.ts:43`）を加えると、この entry の対象は 6 件になる。

### Research & Trial

- F1: `hasReason` は、直前の行の先頭の空白を除いた文字列が `// Reason: ` で始まり、その後ろに空白以外の文字が 1 つ以上あるときだけ真を返す。出所: `scripts/checks/suppression-check.mjs:322-329`
- F2: `judge` は、`path.matchesGlob(record.file, entry.path)` が真で、指令の規則名（規則名を省いた指令は指令名そのもの）がすべて `entry.rules` に含まれる項目だけを候補にし、`Reason` があれば `allowed`、無ければ `no-reason`、候補が無ければ `not-listed` を返す。出所: `scripts/checks/suppression-check.mjs:331-346`
- F3: ホワイトリストは 3 つの `path`（`**/*.{ts,tsx}`、`**/.*/**/*.{ts,tsx}`、`.*.{ts,tsx}`）で `consistent-type-assertions` と `no-unsafe-type-assertion` の 2 つの綴りを許可しており、`no-await-in-loop` の項目は無い。出所: `scripts/checks/suppression-check.json:1-27`
- F4: 現在の実行は 19 件すべてを違反として報告する。`no-unsafe-type-assertion` の 10 件は `no Reason line`、`no-await-in-loop` の 6 件と `max-params` の 2 件と `unicorn/consistent-function-scoping` の 1 件は `not allowed` である。出所: `pnpm suppression-check --report` の実行結果
- F5: `.pi/extensions/<name>/**/*.{ts,tsx}` の形は、そのディレクトリ直下のファイルにも当たり、配下のほかのファイル（例: `.pi/extensions/consult/tool/render.ts`）にも当たる。許可の項目が規則名を限っているため、`no-await-in-loop` は `no-unsafe-type-assertion` の項目に当たらない。出所: `path.matchesGlob` を一時スクリプトで確かめた結果（削除済み）

### Scope

- In:
  - failure: 6 件が `allowed` になり、検査の違反が 0 になる。許可の条件（パス、規則名、`Reason`）が崩れると違反に戻る（C2, C3, F1, F2）。
  - downstream: ホワイトリストを読む検査と、今後書く抑制に影響する。項目を狭めると、許可されない抑制が出る（C3, F3）。
  - values & expression: `Reason` 行の文面と、ホワイトリストの項目の値（パスと規則名）が増える（C1, C2）。
- Out:
  - safety: 秘密、権限、公開、個人データに触れない。コメントと JSON 1 つを変える。
  - upstream: 新しいパッケージも契約も足さない。
  - result: 出力の種類（1 件ごとの行、件数の行）は変わらない。変わるのは判定の値だけである。
  - structure: ファイルもディレクトリも増えない。JSON の形（`path` と `rules`）も変わらない。
  - logic: 判定の手順（`path.matchesGlob`、規則名の照合、`Reason` の判定）は変えない（C4）。
  - existing data: 保存されたデータ、導入済みのバージョン、配布物、過去の記録は動かさない。
  - cost: 読むファイルと設定項目が少し増えるだけで、時間と資源は変わらない。
  - verification: 検査のコマンドは変えない。`pnpm suppression-check` をそのまま使う。
  - observability: 記録と信号は変えない。
  - release: 配布、適用、戻し方は変えない。
  - other: 上のどれにも当たらない関心は無い。

### Decision

- Status: **accepted**
- Main: 残す 6 件に `// Reason:` を置き、ホワイトリストのパスをディレクトリ単位に狭め、`no-await-in-loop` の項目を足して、検査の違反を 0 件にする（C1, C2, C3, C5, F1, F2）。
  - Add:
    - `allow` に 4 つの項目。3 つのディレクトリの `typescript/no-unsafe-type-assertion` と、`quality-gate` の `no-await-in-loop` である（C1, C3, F3, F5）
    - 6 件の抑制コメントの直前の `// Reason: ` 行（C1, C5, F1）
  - Update:
    - 3 つの広い項目から、`no-unsafe-type-assertion` の 2 つの綴りを外す（C3, F3）
    - 6 件の行末の `-- 日本語` を、`Reason` 行の文面に移す（C2, F1）
  - Drop:
    - 残る違反 6 件（C2, F4）
- Secondary: なし
- Policy:
  - Allowed:
    - 許可の条件はパス、規則名、`Reason` の 3 つに限る（C2, F2）
    - `Reason` の文面は、コードで表現できない理由を書く（C1）
    - 規則名は `typescript/no-unsafe-type-assertion` に揃える（F3）
    - `consistent-type-assertions` は全体の定義として、3 つの広い項目に残す（C3, F3）
    - パスはディレクトリまでにし、ファイル名を書かない（F5）
  - Forbidden:
    - 検出の構文と判定の 3 分類を変えない - 078 が決めた（C4）
    - 理由のない許可を足さない - 検査にもれが生じる（C2）

#### Details

- ホワイトリストの形
  ```json
  {
    "allow": [
      {
        "path": "**/*.{ts,tsx}",
        "rules": [
          "@typescript-eslint/consistent-type-assertions",
          "typescript/consistent-type-assertions"
        ]
      },
      {
        "path": "**/.*/**/*.{ts,tsx}",
        "rules": [
          "@typescript-eslint/consistent-type-assertions",
          "typescript/consistent-type-assertions"
        ]
      },
      {
        "path": ".*.{ts,tsx}",
        "rules": [
          "@typescript-eslint/consistent-type-assertions",
          "typescript/consistent-type-assertions"
        ]
      },
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
  }
  ```

### Definition

- `Unit.suppression-check`(kept): 許可の一覧がディレクトリ単位に狭まり、`Reason` で通る抑制だけになる。指摘を受け取る機能は変わらない。
- `Unit.subagent-consult`(kept): `.pi/extensions/consult/index.test.ts` に `Reason` 行が増えるだけで、コンサルを走らせる機能は変わらない。
- `Unit.thinking-scrub`(kept): テスト 2 か所に `Reason` 行が増えるだけで、ループした thinking を取り除く機能は変わらない。
- `Unit.context-precompact`(kept): テストとフィクスチャの 2 か所に `Reason` 行が増えるだけで、コンパクションの準備を始める機能は変わらない。
- `Unit.quality-gate`(kept): 逐次実行の理由が `Reason` 行に移るだけで、検査結果を受け取る機能は変わらない。
