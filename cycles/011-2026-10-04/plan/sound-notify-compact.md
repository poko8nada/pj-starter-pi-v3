# PLAN `sound-notify-compact`

## Files

```text
.pi/extensions/sound-notify/
  index.ts                     update
  index.test.ts                update
  README.md                    update
```

## Slices

1. 圧縮の終わりを種類に足し、音を鳴らす
   - I/O:
     ```ts
     type NotifyKind = 'permission' | 'question' | 'done' | 'commit' | 'compact';
     type NotificationKind = Exclude<NotifyKind, 'commit' | 'compact'>;
     interface SoundNotifyConfig {
       sounds: Record<NotifyKind, string>;
       // enabled / notifications はそのまま
     }
     export function handleSessionCompact(
       pi: PiPort,
       ctx: CtxPort,
       config: SoundNotifyConfig,
     ): void;
     ```
   - Verify:
     - test: `pnpm run test:run .pi/extensions/sound-notify/index.test.ts`
       - `handleSessionCompact` を呼ぶ → `Glass` が 1 回鳴る（happy）
       - 同じ呼び出し → cmux の exec は呼ばれない（happy。偽 `pi` の `exec` を記録して数える）
       - 続けて 2 回呼ぶ → 2 回鳴る（a second call）
       - `parseConfig({ sounds: { compact: 'Basso' } })` → `Basso` で鳴る（happy）
       - `parseConfig({ sounds: { compact: 7 } })` → 既定 `Glass` に落ちる（invalid input）
       - `hasUI` が false → 鳴らない（既存の規則のまま）（empty）
       - 権限: 当てはまらない（音を鳴らすだけ）
   - Steps:
     1. `.pi/extensions/sound-notify/index.ts`: `NotifyKind` に `'compact'` を足し、`NotificationKind` からは外す。`DEFAULT_CONFIG.sounds` に `compact: 'Glass'` を足す
     2. `.pi/extensions/sound-notify/index.ts`: `parseConfig` が `sounds.compact` を読む（既定は `Glass`）
     3. `.pi/extensions/sound-notify/index.ts`: `handleSessionCompact` を切り出し、`dispatch(pi, ctx, 'compact', config)` を呼ぶ。`dispatch` の通知の条件に `compact` を足す
     4. `.pi/extensions/sound-notify/index.ts`: 既定の export で `pi.on('session_compact', ...)` を登録する（`session_compact_failed` は登録しない）
     5. `.pi/extensions/sound-notify/index.test.ts`: 上のケースを書く（既存の `pi` / `ctx` / `defaultConfig` / `played` と `setPlayer` の形をそのまま使う）
     6. `.pi/extensions/sound-notify/README.md`: 通知の表に `Compact` の行を足し、`config.json` の例とキーの表に `sounds.compact` を足す。`session_compact` の説明（ターンごとではない、cmux 通知は送らない、失敗は鳴らさない）も足す
2. 統合: 圧縮が終わった時に、差し替えた鳴らす所へ音が届く
   - Verify:
     - test: `pnpm run test:run .pi/extensions/sound-notify/index.test.ts`
       - 拡張の入口に、`on` を記録する偽の pi を渡す → `session_compact` が登録され、`session_compact_failed` は登録されない（happy / error）
       - 音が届くことは Slice 1 の `handleSessionCompact` のテストが見る（既定 export の closure は呼ばない。実 FS の `config.json` に依存させないため）
       - 権限: 当てはまらない（偽の pi と ctx だけを使う）
   - Steps:
     1. `.pi/extensions/sound-notify/index.test.ts`: `on` を記録する偽の pi を用意し、既定の export を呼んで上のケースを書く

## Notes

### Slice 1: 圧縮の終わりを種類に足し、音を鳴らす

- Findings:
  - なし
- Unplanned:
  - なし
- Commit: b48f76f

### Slice 2: 統合: 圧縮が終わった時に、差し替えた鳴らす所へ音が届く

- Findings:
  - なし
- Unplanned:
  - 既定 export の引口を `EntryPiPort`（`on` + `exec`）に狭めた、偽の pi を unsafe な型主張なしで渡し lint を通すため
- Commit: 9b61037

## Review

### Round 1

- Stale:
  - `.pi/extensions/sound-notify/index.test.ts:2` の頭注「bash の git commit で鳴る音だけを」が stale ―― diff が `describe('sound-notify.compact')` と `describe('sound-notify.entry')` を足したため「だけ」が偽になった。頭注は `0d4af01..HEAD` で不変。
    - fixed: 頭注を commit・compact の音と入口の配線を表す文に直し、`registerSoundHandlers` への設定直渡し（実 FS 非依存）も明記した
- Unlisted:
  - なし（`git diff --name-only 0d4af01..HEAD` は Files の3件 `index.ts` / `index.test.ts` / `README.md` のみ）
- Gaps:
  - `enabled: false` の compact → 鳴らない、が Verify に無い。`dispatch`（`index.ts:141`）は `!config.enabled || !ctx.hasUI` で止めるが、Slice 1 の Verify は `hasUI: false` のみで `enabled: false` のケースが無い（compact テストは全て `enabled: true` の `defaultConfig` 使用）。
    - fixed: compact の describe に `enabled が false → 鳴らない` を足した（`{ ...defaultConfig, enabled: false }` で Glass なしを確認）
  - 既定 export の `session_compact` ハンドラ本体が発音へ届くこと、が Verify に無い。Slice 2 の Verify は「closure は呼ばない」と明記し、テスト（`index.test.ts:143-158`）は登録名の `toContain('session_compact')` / `not.toContain('session_compact_failed')` のみ見て捕捉したコールバックを実行しないため、登録→`handleSessionCompact` の配線は未検証。
    - fixed: 配線を `registerSoundHandlers(pi, config)` に切り出し（既定 export は `loadConfig()` を渡すだけ）、テストは設定を直接渡して捕捉した `session_compact` ハンドラを呼び Glass 1 回を確認。実 FS の `config.json` に依存させない

## Acceptance

- Ran:
- Findings:
