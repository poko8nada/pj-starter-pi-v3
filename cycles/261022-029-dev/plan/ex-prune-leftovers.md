# PLAN `ex-prune-leftovers`

## Files

```text
.pi/
  extensions/
    context-prune/
      format/
        count.ts                      add
        count.test.ts                 add
      apply/
        drafts.ts                     update
        drafts.test.ts                update
      command/
        prune.ts                      update
        prune.test.ts                 update
      entry/
        render.ts                     update
        render.test.ts                update
      index.ts                        update
      index.test.ts                   update
      prune/
        summarize.ts                  update
        summarize.test.ts             update
        collect.ts                    update
        collect.test.ts               update
        judge.ts                      update
        judge.test.ts                 update
        ports.ts                      update
        ports.test.ts                 add
      doc.test.ts
package.json
test/
  tmp.ts
  setup.ts
```

## Slices

## 1.数字の区切りを 1 つにする

### Types

```ts
export function formatCount(value: number): string;
```

### Steps

1. `.pi/extensions/context-prune/format/count.ts`:
   - `formatCount(value)`: `value.toLocaleString('ja-JP')` を返す。数字の区切りはこの 1 か所だけにする。
2. `.pi/extensions/context-prune/format/count.test.ts`:
   - 数値だけを渡す。
3. `.pi/extensions/context-prune/apply/drafts.ts`:
   - `markerText` の `toLocaleString` を `formatCount` に替える。
4. `.pi/extensions/context-prune/command/prune.ts`:
   - `statusLines` の `droppedChars.toLocaleString()` を `formatCount` に替える。
5. `.pi/extensions/context-prune/entry/render.ts`:
   - `tokensLine` と、展開の `droppedChars.toLocaleString()` を `formatCount` に替える。
6. `.pi/extensions/context-prune/apply/drafts.test.ts`、`command/prune.test.ts`、`entry/render.test.ts`:
   - 同じ数字が 3 か所で同じ文字列になることを試す。

### Verify:

- test: `pnpm test:run .pi/extensions/context-prune/format .pi/extensions/context-prune/apply .pi/extensions/context-prune/command .pi/extensions/context-prune/entry`
  - (happy) `formatCount(1234)` → `'1,234'`
  - (boundary values) `0` → `'0'`、`999` → `'999'`、`1000` → `'1,000'`、`1234567` → `'1,234,567'`
  - (happy) `markerText(1234, '{chars} 文字')` → 印に `1,234`
  - (happy) `statusLines` の `dropped` の行に `1,234 文字`、`cardText` の `Compacted from` に `12,345 tokens`
  - _no case_: 負の数 — `chars` は結果の文字数で、負にならない

## 2.壊れた `settings.json` を上書きしない

### Types

```ts
export type EnableOutcome =
  { readonly kind: 'ok' } | { readonly kind: 'failed'; readonly reason: string };

export function writeEnabled(dir: string, enabled: boolean): EnableOutcome;
```

### Steps

1. `.pi/extensions/context-prune/command/prune.ts`:
   - `writeEnabled` は、ファイルが無ければ `{enabled}` を書いて `ok`。読めて object なら `enabled` だけ差し替えて `ok`。読めない、JSON でない、object でないときは**書かずに** `failed` と理由を返す。
2. `.pi/extensions/context-prune/index.ts`:
   - `onCommand` の `on` / `off` は、`failed` のとき `ctx.ui.notify` に理由を出し、設定は変えない。
3. `.pi/extensions/context-prune/command/prune.test.ts`、`index.test.ts`:
   - 壊れた設定のまま `on` を打ち、中身が変わらないことを読む。

### Verify:

- test: `pnpm test:run .pi/extensions/context-prune/command .pi/extensions/context-prune/index`
  - (happy) ファイルが無い + `on` → `{ "enabled": true }` ができ、`ok`
  - (happy) `{ "ratio": 0.6 }` + `off` → `ratio` が残り `enabled` が偽、`ok`
  - (error) `'{'` + `on` → `failed`、ファイルの文字列が `'{'` のまま
  - (error) `'[]'` + `on` → `failed`、ファイルの文字列が `'[]'` のまま
  - (error) 壊れた設定で `/prune on` → 通知に理由が出て、ファイルが変わらない
  - (empty) 既に `enabled: true` で `on` → `ok` で同じ内容

## 3.口の役目を分け、エラー経路を試す

### Types

```ts
export function messageText(message: EntryMessage): string;

export function batches(
  candidates: readonly Candidate[],
  maxQuestions: number,
): readonly (readonly Candidate[])[];

export interface ModelCell {
  registry?: ExtensionContext['modelRegistry'];
  model?: ExtensionContext['model'];
}
```

### Steps

1. `.pi/extensions/context-prune/prune/summarize.ts`:
   - `assistantText` を `messageText` に改名する。役目をコメントに書く（1 つのメッセージの text を読む。窓全体の直列化は `runPass` が `serializeConversation` で行う）。
2. `.pi/extensions/context-prune/prune/collect.ts`、`prune/summarize.test.ts`、`prune/collect.test.ts`:
   - `messageText` に合わせる。
3. `.pi/extensions/context-prune/prune/judge.ts`:
   - `batches` は `maxQuestions` を 1 以上に丸める（`Math.max(1, Math.floor(maxQuestions))`）。
4. `.pi/extensions/context-prune/prune/judge.test.ts`:
   - `maxQuestions` 0 と -3 で 1 束、2.7 で 2 件ずつの束を試す。
5. `.pi/extensions/context-prune/prune/ports.ts`:
   - `createPorts` の口を、偽の registry を差せる形のままにする（変更は型の整理だけ。`ModelCell` を公開する）。
6. `.pi/extensions/context-prune/prune/ports.test.ts`:
   - 偽の `modelRegistry` を渡し、要約と判定のエラー経路を試す。

### Verify:

- test: `pnpm test:run .pi/extensions/context-prune/prune`
  - (happy) `messageText` が text 2 つを連結し、toolCall だけなら空文字
  - (happy) `batches` が `maxQuestions` 0 / -3 で 1 束、2.7 で 2 件ずつの束
  - (error) `summarize` が設定破損で `failed`、registry かモデルが無くて `failed`、`complete` が投げて `failed`、要約が空で `failed`
  - (happy) `summarize` が `ok` のとき `usage` が `{ input, output, cost }` に写る
  - (error) `classify` が registry 無し・`getAvailableOfType` の例外・設定のモデルが 1 つも無い、で `failed`
  - (error) `classify` が `stopReason: error` で次の候補へ進み、`aborted` で止まり、答えの形が違えば次の候補へ進む
  - (empty) `allowPaid: false` で有料しか無い → `failed`（`cost.input > 0` を外す）

## Notes

### Slice 1: 数字の区切りを 1 つにする

- Findings:
  - なし
- Unplanned:
  - なし
- Commit: fe57eb4 consult(ex-prune-leftovers): format counts in one place

### Slice 2: 壊れた `settings.json` を上書きしない

- Findings:
  - なし
- Unplanned:
  - なし
- Commit: 76322e9 consult(ex-prune-leftovers): keep broken settings untouched

### Slice 3: 口の役目を分け、エラー経路を試す

- Findings:
  - なし
- Unplanned:
  - なし
- Commit: 1da8926 consult(ex-prune-leftovers): give each port one job

## Review

## Acceptance
