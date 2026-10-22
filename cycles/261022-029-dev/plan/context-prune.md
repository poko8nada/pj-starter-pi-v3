# PLAN `context-prune`

## Files

```text
.pi/
  extensions/
    context-prune/
      index.ts                          add
      index.test.ts                     add
      settings.json                     add
      doc.test.ts                       add
      settings/
        schema.ts                       add
        schema.test.ts                  add
        read.ts                         add
        read.test.ts                    add
      prune/
        collect.ts                      add
        collect.test.ts                 add
        summarize.ts                    add
        summarize.test.ts               add
        judge.ts                        add
        judge.test.ts                   add
        plan.ts                         add
        plan.test.ts                    add
        run.ts                          add
        run.test.ts                     add
      entry/
        data.ts                         add
        data.test.ts                    add
        render.ts                       add
        render.test.ts                  add
      apply/
        drafts.ts                       add
        drafts.test.ts                  add
      command/
        prune.ts                        add
        prune.test.ts                   add
      README.md                         add
package.json                            update
pnpm-lock.yaml                          update
DEFINITION.md                           update
README.md                               update
README.ja.md                            update
test/
  tmp.ts
  setup.ts
.pi/
  tsconfig.json
tsconfig.json
.oxlintrc.json
.oxfmtrc.json
vitest.config.ts
vitest.starter.config.ts
scripts/
  checks/
    scopes.json
    typecheck.mjs
    typecheck-staged.mjs
lefthook.yaml
```

## Slices

## 1.設定

### Types

```ts
export interface ClassifierCandidate {
  readonly provider: string;
  readonly model: string;
}

export interface Settings {
  readonly enabled: boolean;
  readonly ratio: number;
  readonly recentTokens: number;
  readonly summaryTokens: number;
  readonly threshold: number;
  readonly maxQuestions: number;
  readonly rearmRatio: number;
  readonly marker: string;
  readonly classifier: {
    readonly models: readonly ClassifierCandidate[];
    readonly allowPaid: boolean;
  };
}

export type SettingsRead =
  | { readonly kind: 'ok'; readonly settings: Settings }
  | { readonly kind: 'broken'; readonly reason: string };

export function defaultSettings(): Settings;

export function parseSettings(text: string): SettingsRead;
```

### Steps

1. `.pi/extensions/context-prune/settings/schema.ts`:
   - 既定値（`enabled: true`、`ratio: 0.5`、`recentTokens: 50000`、`summaryTokens: 2000`、`threshold: 0.5`、`maxQuestions: 40`、`rearmRatio: 0.1`、`marker: '古いツール結果（{chars} 文字）を省略'`、`classifier.models` は `opencode/jev-1.13-free` と `openrouter/~typesafe/jev-latest`、`classifier.allowPaid: true`）と、部分上書きの `parseSettings` を置く。
   - `ratio` は 0.2〜0.8、`rearmRatio` は 0 より大きく 1 未満、`recentTokens` と `summaryTokens` と `maxQuestions` は 1 以上の整数、`threshold` は 0〜1、`marker` は空でない文字列、`classifier.models` は 1 件以上の `{provider, model}` 文字列、`classifier.allowPaid` は真偽。それ以外は `broken` で返す。
   - 未知のキーは `broken`。`enabled` を書かないときは既定の真。
2. `.pi/extensions/context-prune/settings/schema.test.ts`:
   - `test/tmp.ts` は使わない。文字列だけを渡す。
3. `.pi/extensions/context-prune/settings/read.ts`:
   - `<dir>/settings.json` を読む。無ければ既定、読めない・壊れていれば `broken`。呼ぶたびに読む。
4. `.pi/extensions/context-prune/settings/read.test.ts`:
   - `test/tmp.ts` の `tmpDir()` にファイルを置いて読み、書き換えて読み直す。
5. `.pi/extensions/context-prune/settings.json`:
   - 部分上書きの実物を置く（`ratio`、`recentTokens`、`summaryTokens`、`maxQuestions`、`marker`、`classifier`）。`enabled`、`threshold`、`rearmRatio` は書かない。

### Verify:

- test: `pnpm test:run .pi/extensions/context-prune/settings`
  - (happy) `{}` → `toEqual({ kind: 'ok', settings: defaultSettings() })`（`classifier` の 2 件と `allowPaid`、`threshold`、`maxQuestions`、`rearmRatio`、`marker`、`enabled` を含む）
  - (boundary values) `ratio: 0.2` と `ratio: 0.8`、`threshold: 0` と `threshold: 1`、`rearmRatio: 0.001` と `0.999`、`recentTokens: 1`、`maxQuestions: 1` → `ok`
  - (error) `ratio: 0.19`、`ratio: 0.81`、`threshold: 1.1`、`recentTokens: 0`、`recentTokens: 1.5`、`summaryTokens: 0`、`maxQuestions: -1`、`rearmRatio: 0`、`rearmRatio: 1`、`rearmRatio: -0.1` → `broken`
  - (error) `{ "enabled": "yes" }`、`{ "classifier": { "allowPaid": 1 } }`、`{ "classifier": { "models": [] } }`、`{ "classifier": { "models": [{ "provider": 1 }] } }`、`{ "marker": "" }` → `broken`
  - (error) `{ "unknown": 1 }` → `broken`、理由に `unknown` を含む
  - (error) `'{'` → `broken`、理由に `not JSON` を含む
  - (empty) ディレクトリに `settings.json` が無い → `ok` で既定
  - (error) `settings.json` が `'{'` → `readSettings` が `broken`
  - (happy) `settings.json` に `{ "enabled": false }` を書いて `readSettings` → `ok` で `enabled` が偽。続けて `{ "enabled": true }` に書き換えて読み直す → 真
  - (happy) 拡張の `settings.json` を `readSettings` で読む → `ok`、`ratio` 0.5、`classifier.models` が 2 件
  - _no case_: `Settings` の各フィールドの `readonly` — コンパイラが見る

## 2.候補と要約

### Types

```ts
export type EntryMessage = Extract<SessionEntry, { readonly type: 'message' }>['message'];

export interface Candidate {
  readonly id: string;
  readonly toolName: string;
  readonly args: string;
  readonly chars: number;
}

export interface CollectInput {
  readonly entries: readonly SessionEntry[];
  readonly recentTokens: number;
  readonly done: ReadonlySet<string>;
}

export interface Collected {
  readonly recent: readonly EntryMessage[];
  readonly candidates: readonly Candidate[];
  readonly tokens: number;
}

export function collect(input: CollectInput): Collected;

export function summaryPrompt(maxTokens: number): string;

export function assistantText(message: EntryMessage): string;
```

### Steps

1. `.pi/extensions/context-prune/prune/collect.ts`:
   - `entries` を末尾から `estimateTokens(entry.message)` で足す。合計が `recentTokens` を超える手前までを「直近」とし、それより古い `type: 'message'` エントリを「古い」とする。
   - 古い toolResult メッセージ（`role === 'toolResult'`）のうち、`done` に無いものを候補にする。`toolName` は結果の `toolName`、`args` は同じ `toolCallId` を持つ assistant の toolCall から `name(引数)` を 200 文字で切って作る。`chars` は結果の本文（text ブロックの合計）の文字数。
   - `recent` は直近のメッセージ列（古い順）、`tokens` は全エントリの推定の合計。
2. `.pi/extensions/context-prune/prune/collect.test.ts`:
   - 偽の `SessionEntry`（`type: 'message'`）を組む。
3. `.pi/extensions/context-prune/prune/summarize.ts`:
   - `summaryPrompt(maxTokens)`: 見出し（Goal / Progress / Decisions / Next steps）を求め、`maxTokens` に収めるよう指示する 1 つの文字列。
   - `assistantText(message)`: `type === 'text'` のブロックだけを連結する。
4. `.pi/extensions/context-prune/prune/summarize.test.ts`:
   - 文字列と偽の assistant メッセージを渡す。

### Verify:

- test: `pnpm test:run .pi/extensions/context-prune/prune/collect`
  - (happy) 古い toolResult 1 件と直近の toolResult 1 件 → 候補は古い 1 件、`toolName` と `chars` が入る
  - (boundary values) 直近の合計がちょうど `recentTokens` → 境界のエントリは直近に残り、候補はさらに古いものだけ
  - (happy) `recent` が直近 2 件を古い順に持ち、`tokens` が全件の合計
  - (empty) エントリが空 → 候補 0、`tokens` 0
  - (empty) 古いエントリが user と assistant だけ → 候補 0
  - (happy) `done` に候補の id が入っている → 候補から落ちる。`done` に未知の id が入っていても他は変わらない
  - (error) 結果に対応する toolCall が無い → `args` は空文字で、候補には残る
  - (boundary values) 引数の文字列が 199 / 200 / 201 文字 → 199 と 200 はそのまま、201 は 200 文字に切れる
  - (empty) 結果が空の text ブロック → `chars` 0 で候補に残る
- test: `pnpm test:run .pi/extensions/context-prune/prune/summarize`
  - (happy) `summaryPrompt(2000)` → `2000`、`Goal`、`Progress`、`Decisions`、`Next steps` を含む 1 つの文字列
  - (happy) text 2 つと toolCall が混ざる → text だけを連結した文字列
  - (empty) text ブロックが無い → 空文字

## 3.判定と発動

### Types

```ts
export interface ClassifierQuestion {
  readonly type: 'choice';
  readonly instructions: string;
  readonly criteria: Readonly<Record<string, string>>;
}

export interface JudgeRequest {
  readonly state: Record<string, unknown>;
  readonly questions: Readonly<Record<string, ClassifierQuestion>>;
}

export interface Verdict {
  readonly id: string;
  readonly keep: boolean;
  readonly keepProbability: number;
}

export function judgeRequest(summary: string, candidates: readonly Candidate[]): JudgeRequest;

export function batches(
  candidates: readonly Candidate[],
  maxQuestions: number,
): readonly (readonly Candidate[])[];

export function verdicts(
  candidates: readonly Candidate[],
  answers: Readonly<
    Record<
      string,
      { readonly type: string; readonly probabilities: Readonly<Record<string, number>> }
    >
  >,
  threshold: number,
): readonly Verdict[];

export type Gate =
  | { readonly kind: 'run' }
  | {
      readonly kind: 'idle';
      readonly reason: 'disabled' | 'below-ratio' | 'cooling' | 'running' | 'unknown' | 'empty';
    };

export function gate(input: {
  readonly enabled: boolean;
  readonly tokens: number | null;
  readonly contextWindow: number;
  readonly ratio: number;
  readonly rearmRatio: number;
  readonly lastTokens: number | undefined;
  readonly running: boolean;
  readonly candidates: number;
}): Gate;
```

### Steps

1. `.pi/extensions/context-prune/prune/judge.ts`:
   - `judgeRequest`: `state` は `{ summary, candidates: [{ key, toolName, args, chars }] }`。`questions` は候補ごとに `keep_<id>` の 1 問で、`instructions` は「このツール結果は要約の話題にまだ関係あるか」、`criteria` は `yes` と `no`。
   - `batches`: 候補を `maxQuestions` ずつに切る。
   - `verdicts`: 答えの `probabilities.yes` を確率にし、`threshold` 未満を落とす側（`keep: false`）。答えが無い候補は `keep: true`（fail-open）。
2. `.pi/extensions/context-prune/prune/judge.test.ts`:
   - 偽の `Candidate` と、`probabilities` だけの答えを渡す。
3. `.pi/extensions/context-prune/prune/plan.ts`:
   - `gate`: 無効なら `disabled`、`tokens` が `null` なら `unknown`、走っていれば `running`、候補 0 なら `empty`、`lastTokens` が無ければ `run`、`tokens / contextWindow` が `ratio` 未満なら `below-ratio`、前回の `lastTokens` から `contextWindow * rearmRatio` 増えていなければ `cooling`、それ以外は `run`。
4. `.pi/extensions/context-prune/prune/plan.test.ts`:
   - 数値だけを渡す。

### Verify:

- test: `pnpm test:run .pi/extensions/context-prune/prune/judge`
  - (happy) 候補 2 件 → `questions` のキーが `keep_a` と `keep_b`、`state.candidates` が 2 件、`state.summary` が渡した要約
  - (happy) `keep_a` の `criteria` が `{ yes, no }` を持ち、`instructions` が空でない
  - (happy) `probabilities.yes` が 0.7 と 0.2、`threshold` 0.5 → `keep` が真と偽、`keepProbability` が 0.7 と 0.2
  - (boundary values) `probabilities.yes` がちょうど 0.5 → `keep: true`（未満だけ落とす）、0.49 → `keep: false`
  - (empty) 答えが無い候補 → `keep: true`、`keepProbability` は 0
  - (happy) 候補 90 件・`maxQuestions` 40 → 3 つの束（40、40、10）、`maxQuestions` 1 → 90 の束
- test: `pnpm test:run .pi/extensions/context-prune/prune/plan`
  - (happy) 有効・`tokens` 1000・`contextWindow` 2000・`ratio` 0.5・候補 1 → `run`
  - (empty) 無効 → `disabled`、候補 0 → `empty`
  - (boundary values) `tokens / contextWindow` がちょうど `ratio` → `run`、`ratio` 未満 → `below-ratio`
  - (happy) `lastTokens: undefined` → `run`（初回）
  - (happy) `lastTokens` 1000・`contextWindow` 2000・`rearmRatio` 0.1・`tokens` 1100 → `cooling`、`tokens` 1200 → `run`
  - (empty) `tokens` が `null` → `unknown`、走っている → `running`、無効と走行中が同時 → `disabled`

## 4.記録と差し込み

### Types

```ts
export interface Usage {
  readonly input: number;
  readonly output: number;
  readonly cost: number;
}

export const CUSTOM_TYPE = 'context-prune';

export interface Drop {
  readonly id: string;
  readonly chars: number;
}

export interface PrunePass {
  readonly at: number;
  readonly tokensBefore: number;
  readonly summary: string;
  readonly dropped: readonly Drop[];
  readonly droppedChars: number;
  readonly kept: number;
  readonly latencyMs: number;
  readonly usage: Usage | undefined;
}

export function isPrunePass(value: unknown): value is PrunePass;

export function passesOf(entries: readonly SessionEntry[]): readonly PrunePass[];

export function markerText(chars: number, template: string): string;

export function draftsFor(
  passes: readonly PrunePass[],
  edited: ReadonlySet<string>,
  template: string,
): readonly ContextEditEntryDraft[];
```

### Steps

1. `.pi/extensions/context-prune/entry/data.ts`:
   - `CUSTOM_TYPE`、`isPrunePass`（形の検査。`at`・`tokensBefore`・`summary`・`dropped`・`droppedChars`・`kept`・`latencyMs` が正しい型で、`dropped` の各件が非負の `chars` を持つ）、`passesOf`（`type === 'custom'` かつ `customType === CUSTOM_TYPE` の `data` を、エントリの順に集める）を置く。
2. `.pi/extensions/context-prune/entry/data.test.ts`:
   - 偽の `CustomEntry` を組む。
3. `.pi/extensions/context-prune/apply/drafts.ts`:
   - `markerText`: `{chars}` を `toLocaleString('ja-JP')` の数字に置き換える。`{chars}` が無ければそのまま。
   - `draftsFor`: すべてのパスの `dropped` を id で束ね、`edited` に無いものだけを `{ type: 'context_edit', targetId, replacement: { content: [{ type: 'text', text }] } }` にする。同じ id は最初のパスの文面で 1 つ。
4. `.pi/extensions/context-prune/apply/drafts.test.ts`:
   - `edited` は `Set<string>` で渡す。

### Verify:

- test: `pnpm test:run .pi/extensions/context-prune/entry/data`
  - (happy) 正しい形の `custom` エントリ 2 件 → `passesOf` が 2 件、順はエントリの順
  - (empty) `customType` が違う、`type` が `message` → 0 件
  - (error) `data` が欠けている、`tokensBefore` が文字列、`dropped` が配列でない、`chars` が負 → `passesOf` が 0 件
  - (happy) 正しいパスと壊れたパスが混ざる → 正しいものだけ
- test: `pnpm test:run .pi/extensions/context-prune/apply/drafts`
  - (happy) 3 件の drop、`edited` 空 → 3 つの draft、`toStrictEqual` で `{ type: 'context_edit', targetId, replacement: { content: [{ type: 'text', text }] } }`（文字列の `content` ではない）
  - (happy) 印が `{chars}` を `1,234` に置き換える。`{chars}` が 2 つなら両方、無ければそのまま。`0` → `0`、`1234567` → `1,234,567`
  - (empty) 2 つのパスが同じ id を持つ → draft は 1 つで、最初のパスの `chars` を使う
  - (empty) `edited` に全部入っている → draft 0
  - (empty) パスが無い → draft 0

## 5.カード

### Types

```ts
export function cardText(pass: PrunePass, expanded: boolean, expandKey: string): readonly string[];

export function createCard(pass: PrunePass, theme: Theme, outputPad?: number): Component;
```

### Steps

1. `.pi/extensions/context-prune/entry/render.ts`:
   - `cardText`: 折りたたみは `[prune]`、空行、`Compacted from <N> tokens (<expandKey> to expand)`。展開は `[prune]`、空行、`**Compacted from <N> tokens**`、空行、要約、空行、`省略: <件数> 件 / <文字数> 文字`、空行、`要約と判定: <秒> 秒`。
   - `createCard`: `@earendil-works/pi-tui` の `Box`・`Container`・`Text`・`Markdown`・`MouseRegion`・`Spacer` と、`@earendil-works/pi-coding-agent` の `Theme`・`getMarkdownTheme`・`keyText` で、`CompactionSummaryMessageComponent` と同じ組み立て（背景 `customMessageBg`、ラベル `customMessageLabel`、本文 `customMessageText`、クリックで展開）にする。
2. `.pi/extensions/context-prune/entry/render.test.ts`:
   - `cardText` と、偽の `Theme`（`fg` と `bg` が文字列をそのまま返す）を渡した `createCard(...).render(80)` の折りたたみの行を試す。展開は `Markdown` を通るので `cardText` で見る。
3. `package.json`:
   - `peerDependencies` に `"@earendil-works/pi-tui": "*"`、`devDependencies` に `"@earendil-works/pi-tui": "^1.3.0"` を足す。
   - `pnpm install` で `pnpm-lock.yaml` を更新する。
4. `.pi/extensions/context-prune/entry/render.test.ts`（続き）:
   - `package.json` を読み、`peerDependencies` が `*`、`devDependencies` が `^1.3.0` であることを試す。

### Verify:

- test: `pnpm test:run .pi/extensions/context-prune/entry/render`
  - (happy) 折りたたみ・`tokensBefore` 12345 → 3 行目が `Compacted from 12,345 tokens (${keyText('app.tools.expand')} to expand)`
  - (happy) 展開 → 要約と `省略: 3 件 / 1,234 文字` と `要約と判定: 1.2 秒` を含む
  - (empty) 展開・`dropped` 0 件 → `省略: 0 件 / 0 文字`
  - (happy) 偽の `Theme` で `createCard(...).render(80)` → 行のどれかに `[prune]` と `Compacted from 12,345 tokens`（クリックの切り替えは `MouseRegion` が持ち、機械では見ない）
  - (happy) `package.json` の `peerDependencies['@earendil-works/pi-tui']` が `*`、`devDependencies['@earendil-works/pi-tui']` が `^1.3.0`

## 6.コマンドと配線

### Types

```ts
export type PassOutcome =
  | { readonly kind: 'done'; readonly pass: PrunePass }
  | { readonly kind: 'failed'; readonly reason: string }
  | { readonly kind: 'skipped'; readonly reason: string };

export interface PassPorts {
  readonly summarize: (
    text: string,
  ) => Promise<
    | { readonly kind: 'ok'; readonly summary: string; readonly usage: Usage | undefined }
    | { readonly kind: 'failed'; readonly reason: string }
  >;
  readonly classify: (request: JudgeRequest) => Promise<
    | {
        readonly kind: 'ok';
        readonly answers: Readonly<
          Record<
            string,
            { readonly type: string; readonly probabilities: Readonly<Record<string, number>> }
          >
        >;
      }
    | { readonly kind: 'failed'; readonly reason: string }
  >;
}

export function runPass(
  input: {
    readonly settings: Settings;
    readonly tokens: number;
    readonly candidates: readonly Candidate[];
    readonly recent: readonly EntryMessage[];
    readonly now: number;
  },
  ports: PassPorts,
): Promise<PassOutcome>;

export type Command =
  | { readonly kind: 'status' }
  | { readonly kind: 'on' }
  | { readonly kind: 'off' }
  | { readonly kind: 'now' }
  | { readonly kind: 'usage' };

export function parseCommand(args: string): Command;

export interface Status {
  readonly running: boolean;
  readonly failures: number;
  readonly lastPass: PrunePass | undefined;
}

export function statusLines(status: Status, settings: Settings, now: number): readonly string[];

export function writeEnabled(dir: string, enabled: boolean): void;

export interface PruneCtx {
  readonly sessionManager: ExtensionContext['sessionManager'];
  readonly getContextUsage: () => ContextUsage | undefined;
  readonly ui: { readonly notify: (message: string) => void };
}

export interface PruneWiring {
  readonly onTurnEnd: (ctx: PruneCtx) => Promise<BoundaryResult | undefined>;
  readonly onBeforeSettle: (ctx: PruneCtx) => Promise<BoundaryResult | undefined>;
  readonly onCommand: (args: string, ctx: PruneCtx) => Promise<void>;
  readonly getStatus: () => Status;
  readonly flush: () => Promise<void>;
}
```

### Steps

1. `.pi/extensions/context-prune/prune/run.ts`:
   - `runPass`: 直近のメッセージを `serializeConversation(convertToLlm(recent))` で文字列にし、`ports.summarize` に渡す。要約が空なら `failed`。候補を `batches` で分け、各束を `ports.classify` に渡し、`verdicts` を集める。1 つの束でも失敗したら `failed`。落とす側の drop を作り、`PrunePass` を返す。
2. `.pi/extensions/context-prune/prune/run.test.ts`:
   - `ports` は偽物。`now` を渡す。
3. `.pi/extensions/context-prune/command/prune.ts`:
   - `parseCommand`: `args.trim()` が空なら `status`、`on`、`off`、`now`。それ以外は `usage`（大文字小文字は見ない、前後の空白は落とす）。
   - `statusLines`: `prune: on|off`、`ratio: <値>`、`last: <N> 秒前 | なし`、`dropped: <件数> 件 (<文字数> 文字)`（直近のパスが無ければ `dropped: なし`）、`failures: <数>`。
   - `writeEnabled`: `settings.json` を読み、`enabled` だけを書き換えて書き戻す（他のキーは残す）。
4. `.pi/extensions/context-prune/command/prune.test.ts`:
   - `tmpDir()` に書いて読む。
5. `.pi/extensions/context-prune/index.ts`:
   - `PiPort` は `on`・`registerCommand`・`registerEntryRenderer`・`appendEntry` だけ。
   - `createWiring`: `tokens = ctx.getContextUsage()?.tokens ?? null`。設定を毎回読み、壊れていれば 1 度だけ通知して `undefined`。境界では、まず `draftsFor(passesOf(branch), edited, marker)` を返す（`edited` は `branch` の `context_edit` の `targetId`）。`turn_end` では、さらに `gate` が `run` なら裏で `runPass` を始め、終わったら `appendEntry(CUSTOM_TYPE, pass)` する。走っている間の `now` は断る。`flush` は走っている裏の仕事を待つ。
   - `registerPrune`: `turn_end`、`agent_before_settle`、`registerCommand('prune')`、`registerEntryRenderer(CUSTOM_TYPE, ...)` を配線する。
6. `.pi/extensions/context-prune/index.test.ts`:
   - 偽の `PiPort`、偽の `PruneCtx`、偽の `PassPorts` を渡す。

### Verify:

- test: `pnpm test:run .pi/extensions/context-prune/prune/run`
  - (happy) 要約が返り、候補 2 件の答えが 0.8 と 0.1 → `done`、`dropped` 1 件、`kept` 1 件、`droppedChars` が落とした結果の文字数
  - (happy) 候補 3 件・`maxQuestions` 2 → `classify` が 2 回
  - (error) 2 束目の `classify` が `failed` → `failed`、`dropped` は空
  - (error) `summarize` が `failed`、要約が空文字 → `failed`（後者は理由に `summary`）
  - (empty) 候補 0 件 → `done`、`dropped` 0、`kept` 0
  - (empty) 1 件の答えが欠けている → その候補は `keep`（fail-open）で `done`
- test: `pnpm test:run .pi/extensions/context-prune/command/prune`
  - (happy) `''` → `status`、`'on'`、`'off'`、`'now'`、`' on '` → `on`、`'ON'` と `'on now'` と `'stop'` → `usage`
  - (happy) `off` → `settings.json` の `enabled` が偽。`on` → 真
  - (happy) `writeEnabled` の前に `ratio` を書いておく → 書き換え後も `ratio` が残る
  - (happy) `statusLines` → `prune: on`、`ratio: 0.5`、`last: 5 秒前`（パスが `now - 5000`）、`dropped: 2 件 (1,234 文字)`、`failures: 1` の 5 行
  - (empty) 直近のパスが無い → `last: なし`、`dropped: なし`
- test: `pnpm test:run .pi/extensions/context-prune/index`
  - (happy) `registerPrune` → `turn_end`、`agent_before_settle`、`prune` コマンド、1 つの renderer
  - (empty) `gate` が `below-ratio`（枝にパスが無い）→ `turn_end` が `undefined`
  - (happy) `turn_end` が裏のパスを始め、`flush` のあと `appendEntry` が 1 回
  - (empty) 走っている間の `now` → 通知に `running`、`appendEntry` は増えない
  - (error) 設定が壊れている → 2 回の `turn_end` で通知が 1 回だけ
  - (empty) `getContextUsage()` が `undefined` → 何も始まらない
  - (happy) パスが積まれた枝 → `onBeforeSettle` が `context_edit` を返す。同じ境界の 2 回目は `undefined`

## 7.文書と定義

### Types

```ts
なし;
```

### Steps

1. `DEFINITION.md`:
   - `Users can do` の末尾に `- context-prune: エージェントが、古いツール結果のうち要らないものを送る文脈から外し、コンテキストを空けられる` を足す。

     - Outside: design の `Scope`。`Unit.context-prune` の 1 行を、ADR 01 の文言のまま置く。
2. `README.md`:
   - 拡張の一覧に `context-prune` の説明（割合で裏で要約し、古いツール結果を送る文脈から外す。`/prune`、`/prune now`、`/prune on|off`）を足す。
3. `README.ja.md`:
   - 同じ内容を日本語で足す。
4. `.pi/extensions/context-prune/README.md`:
   - intent-router の README の形で、`How it moves`、`Commands`、`Settings`、`The code` を書く。設定の表は `settings/schema.ts` の既定値と合わせる。
5. `.pi/extensions/context-prune/doc.test.ts`:
   - `DEFINITION.md`、`README.md`、`README.ja.md`、この README を読み、下の `Verify` の行を試す。表の `ratio` の既定は `defaultSettings()` と突き合わせる。

### Verify:

- test: `pnpm test:run .pi/extensions/context-prune/doc`
  - (happy) `DEFINITION.md` に `context-prune: エージェントが、古いツール結果のうち要らないものを送る文脈から外し、コンテキストを空けられる` が 1 行
  - (happy) `README.md` に `context-prune`、`/prune now`、`/prune on|off` が各 1 件以上
  - (happy) `README.ja.md` に `context-prune`、`/prune now`、`on` / `off` の各 1 件以上
  - (happy) 拡張の `README.md` に `## How it moves`、`## Commands`、`## Settings`、`## The code` が各 1 件
  - (error) `Settings` の表の `ratio` の既定が `defaultSettings().ratio` と違う → 不一致として落ちる
  - (error) `Settings` の表の `recentTokens` と `summaryTokens` の既定が `defaultSettings()` と違う → 不一致
  - _no case_: 文言の読みやすさ — 機械では見ない

## 8.統合: 1 パスを通して、次の境界で文脈から外れる

### Types

```ts
なし;
```

### Steps

1. `.pi/extensions/context-prune/index.test.ts`:
   - 偽の `sessionManager` に、古い toolResult と直近のメッセージを持つ枝を渡す。`getContextUsage` は割合を超える値を返す。偽の `summarize` は固定の要約、偽の `classify` は 1 件だけ `no` を返す。
   - `turn_end` → `flush` → `appendEntry` が 1 回、`PrunePass` が入る。
   - 次の `turn_end` → `entries` に `context_edit` が 1 件、`targetId` が落とした結果の id、`replacement.content` に印の文面。
   - 同じ境界をもう一度 → `entries` が空（冪等）。
   - `agent_before_settle` でも同じ `entries` が返る。
2. この 1 ファイルに加えて、全体の `pnpm test:run`、`pnpm typecheck`、`pnpm lint` を通す。

### Verify:

- test: `pnpm test:run .pi/extensions/context-prune/index`、`pnpm test:run`、`pnpm typecheck`、`pnpm lint`
  - (happy) 1 パス後に `appendEntry` が 1 回、`customType` が `context-prune`
  - (happy) 次の境界で `context_edit` が 1 件、`targetId` が落とした結果の id
  - (happy) 印の文面が `古いツール結果（<N> 文字）を省略`
  - (empty) 同じ境界の 2 回目 → `entries` が空
  - (happy) `agent_before_settle` → 同じ `context_edit`
  - (error) `classify` が失敗する → `appendEntry` されず、`failures` が 1
  - (happy) `pnpm test:run` が緑、`pnpm typecheck` が緑、`pnpm lint` が緑
  - _no case_: `context_edit` を pi がどう投影するか — ライブラリの契約（ADR 01 の `session-manager.js:235-254`）

## Notes

### Slice 1: 設定

- Findings: なし
- Unplanned: なし
- Commit: d41c0e4 consult(context-prune): add settings schema and read

### Slice 2: 候補と要約

- Findings: なし
- Unplanned: 空ブロックの toolResult を古い側に置くようテストの並びを直した（collect の境界は変えず）。
- Commit: 93f3e90 consult(context-prune): add candidate collection and summary prompt

### Slice 3: 判定と発動

- Findings:
- Unplanned:
- Commit:

### Slice 4: 記録と差し込み

- Findings:
- Unplanned:
- Commit:

### Slice 5: カード

- Findings:
- Unplanned:
- Commit:

### Slice 6: コマンドと配線

- Findings:
- Unplanned:
- Commit:

### Slice 7: 文書と定義

- Findings:
- Unplanned:
- Commit:

### Slice 8: 統合: 1 パスを通して、次の境界で文脈から外れる

- Findings:
- Unplanned:
- Commit:

## Review

## Acceptance
