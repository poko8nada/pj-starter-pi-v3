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
- Unplanned:
- Commit:

### Slice 2: 統合: 圧縮が終わった時に、差し替えた鳴らす所へ音が届く

- Findings:
- Unplanned:
- Commit:

## Review

### Round 1

- Stale:
- Unlisted:
- Gaps:

## Acceptance

- Ran:
- Findings:
