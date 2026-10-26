# PLAN `ex-settings-read-order`

## Files

```text
.pi/extensions/thinking-scrub/
  index.ts               update
  index.test.ts          update
```

## Slices

## 1.read-port

### Types

```ts
export interface WiringOptions {
  readonly settingsDir: string;
  readonly now: () => number;
  readonly followUp: (content: string) => void;
  readonly readSettings: () => SettingsRead;
}
```

### Steps

1. `.pi/extensions/thinking-scrub/index.ts`:
   - `WiringOptions` に `readSettings: () => SettingsRead` を足す。
   - `readEnabled` と `readShow` を、`options.readSettings()` の結果から読む形にする。
   - 既定の export で `readSettings: () => readSettings(options.settingsDir)` を渡す。
   - `settingsDir` は書き込み（`writeSettings`）のために残す。
   - `handleCommand` の設定読み込みも port に置き換える。
2. `.pi/extensions/thinking-scrub/index.test.ts`:
   - `createScrubWiring` の呼び出しすべてに `readSettings` を渡す。既存の設定ファイルを使う試験は、本物の `readSettings(dir)` を渡す。
   - (happy) `MIN_THINKING` 未満の `onMessageUpdate` → 偽の `readSettings` の呼び出しが 0 回。
   - (happy) `MIN_THINKING` 以上の `onMessageUpdate` → 1 回。
   - (happy) `enabled: false` の偽の `readSettings` → abort 無し。
   - (boundary) `onMessageEnd` は 1 回の `message_end` で 1 回読む。
   - (happy) 既存の設定・報告・コマンドの試験はそのまま通る。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/thinking-scrub/index.ts .pi/extensions/thinking-scrub/index.test.ts`; 関連が無いときは `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -n "readSettings" .pi/extensions/thinking-scrub/index.ts` でポートがある
- Added: なし

## Notes

### Slice 1: read-port

- Findings: なし
- Unplanned: なし
- Commit: a59fd8f consult(ex-settings-read-order): add readSettings port to scrub wiring
- Stopped: なし

### Cleanup: 重複と前提の整理

- Findings:
  - `.pi/extensions/thinking-scrub/index.test.ts` の `onMessageUpdate` から 3 件を削りました。`MIN_THINKING` の `abort が 1 回` は `MIN_THINKING 以上 → 偽の readSettings の呼び出しが 1 回` と同じ振る舞いのため後者を残し、`MIN_THINKING - 1` の `abort なし` は `MIN_THINKING 未満 → 呼び出しが 0 回` と同じ早戻りのため後者を残し、`enabled: false → run でも abort なし` の実ファイル版は `enabled が偽の偽設定 → abort なし` の偽物版と同じ無効枝のため後者を残しました。呼び出し回数と無効枝の確認は計画の手順が求める偽物版に集約されます。
  - `.pi/extensions/thinking-scrub/index.test.ts` の `onCommand` から `置いた settings.json を readSettings で読む` の 1 件を削りました。置かれた fixture の中身が真である前提の再現であり、`schema` が正しい JSON を `ok` にすることと `settings/read.test.ts` が読み込みを担うことは既に決まっています。配線の振る舞いは偽物と実ファイル経由の残りの試験に残ります。
  - 残した 2 件の試験から前提の断定を削りました。`onAgentEnd` の `tallyThinking()` の長さ 51 と `integration` の `The **` 反復の長さ 12 は補助の作りを確認するだけで、振る舞いの確認は `removed 2 (52 chars)` と `undefined` および通知なしの断定に残ります。
  - 消えた振る舞いの試験は見当たりませんでした。旧い引数なしの呼び出しは計画の slice ですべて移行済みで、残りは port 経由の現在の振る舞いだけを確かめています。
  - 止めた分岐の試験は見当たりませんでした。今回の変更は読み元を `settingsDir` から port に差し替えるだけで、配線の分岐（有効・表示・`broken` 時の既定）は port の結果で残ります。壊れたファイルの解釈は `settings/read` 側にあり、配線は作っていません。
  - 削除後は `pnpm test:related` 32 件、`pnpm test:run` 882 件、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`、`grep -n "readSettings"` のすべてが通過しました。
- Unplanned: なし

## Review

### Round 1

- Stale:
  - なし — `.pi/extensions/thinking-scrub/index.ts:5` の「毎回読み直す」と `settings/read.ts:4` の読み直しの注記が port 経由でも成り立つこと、`index.test.ts:566` と `index.test.ts:698` の表題の 51 や 12 が前提の断定ではなく事実の説明として残ることを確認しました。
- Unlisted:
  - なし — 差分は `.pi/extensions/thinking-scrub/index.ts` と `.pi/extensions/thinking-scrub/index.test.ts` の 2 件であり、`## Files` の 2 件と一致すること、残る差分は本計画書自体の `Notes` 追記であることを確認しました。
- Gaps:
  - なし — `.pi/extensions/thinking-scrub/index.ts:151,178,215,236,327` の 4 経路と既定 export の置き換えに対し、`.pi/extensions/thinking-scrub/index.test.ts:320,337,358,378` の呼び出し回数と無効枝の 4 件と実ファイル経由の既存試験が対応し、`## Verify` の `Added: なし` を超える振る舞いが残らないことを確認しました。
- Unproven:
  - なし — 新規 4 件はいずれも振る舞いを外すと赤になること（早戻りを外すと `.pi/extensions/thinking-scrub/index.test.ts:354` が 0 回でなくなり、判定を外すと `.pi/extensions/thinking-scrub/index.test.ts:394` が abort し、呼び出しを外すと `.pi/extensions/thinking-scrub/index.test.ts:332,374` が変わること）を読み合わせで確認しました。
- Noise:
  - なし — 新規の断定は `MIN_THINKING` 定数と `.pi/extensions/thinking-scrub/index.test.ts:16` の `okSettings()` 工場および呼び出し回数の 0/1 のみであり、魔数や固定文字列の複写はなく、残る固定文字列は計画が残すと決めた既存の振る舞いの断定であることを確認しました。
- Doubts:
  - なし

## Acceptance

- Ran:
  - `pnpm test:related .pi/extensions/thinking-scrub/index.ts .pi/extensions/thinking-scrub/index.test.ts` — 1 件・32 件が通過しました。
  - `pnpm typecheck` — root と `.pi` がともに ok でした。
  - `pnpm lint` — 通過しました。
  - `pnpm format:check` — 238 件が通過しました。
  - `grep -n "readSettings" .pi/extensions/thinking-scrub/index.ts` — port の 7 箇所（import・型・4 経路・既定 export）を確認しました。
  - `pnpm test:run` — 55 件・882 件が通過しました。
  - 破壊・復元試験 — `handleMessageUpdate` の `options.readSettings()` 呼び出しを `MIN_THINKING` の早戻りの前に移動し、`pnpm test:related` を実行しました。その後、順序を元に戻して再実行しました。
- Findings:
  - 破壊時は `onMessageUpdate` の `MIN_THINKING 未満 → 偽の readSettings の呼び出しが 0 回` の 1 件が赤くなり、`expected 1 to be +0` で早戻り前の読み出しを検出できることを確認しました。残り 31 件は緑でした。
  - 復元後は `pnpm test:related` の 32 件が再び緑になり、`git status --short` と `git diff --stat` で `.pi/extensions/thinking-scrub/index.ts` の差分が残らないことを確認しました。計画書以外の作業ツリーの変更はありません。
- Doubts:
  - なし
