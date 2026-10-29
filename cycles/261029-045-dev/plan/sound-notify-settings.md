# PLAN `sound-notify-settings`

- No: 01

## Files

```text
.pi/
  extensions/
    sound-notify/
      settings.json            add
      settings/
        schema.ts              add
        schema.test.ts         add
        read.ts                add
        read.test.ts           add
      index.ts                 update
      index.test.ts            update
      README.md                update
```

## Slices

## 1.settings-shape

### Types

```ts
export interface Settings {
  readonly enabled: boolean;
  readonly notifications: boolean;
  readonly sounds: {
    readonly permission: string;
    readonly question: string;
    readonly done: string;
    readonly commit: string;
    readonly compact: string;
  };
}

export type SettingsRead =
  | { readonly kind: 'ok'; readonly settings: Settings }
  | { readonly kind: 'broken'; readonly reason: string };

export const SETTINGS_FILE: 'settings.json';

export function defaultSettings(): Settings;

export function parseSettings(text: string): SettingsRead;

export function settingsOrDefault(read: SettingsRead): Settings;
```

### Steps

1. `.pi/extensions/sound-notify/settings/schema.ts`:
   - `Settings`、`SettingsRead`、`SETTINGS_FILE`、`defaultSettings`、`parseSettings`、`settingsOrDefault` を追加し、未知のキーは無視して型が異なるフィールドは `broken` にします。
2. `.pi/extensions/sound-notify/settings/schema.test.ts`:
   - (happy) 5 種類の `sounds` とフラグを持つ JSON → `ok` で、入力値がそのまま返る。
   - (empty) `{}` → `ok` で、`parseSettings` が `defaultSettings()` を返す。
   - (happy) `../settings.json` の既定値が `defaultSettings()` と一致する。
   - (error) `enabled` が文字列 → `broken` を返す。
   - (error) `sounds.permission` が数値 → `broken` を返す。
   - (happy) 未知のキーを持つ JSON → `ok` で、未知のキーを無視して既定値と入力値を返す。
   - (error) `settingsOrDefault` に `broken` → `defaultSettings()` を返す。
   - (happy) `settingsOrDefault` に `ok` → その設定をそのまま返す。
3. `.pi/extensions/sound-notify/settings.json`:
   - `defaultSettings()` と同じ既定値を書きます。

### Verify

- Always:
  - 関係するテスト（`pnpm test:related` が返す、変更したファイルに関係するテスト）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変更したファイル内を大文字・小文字を区別せずに `grep` し、古い名前が残っていないことを確かめる（このスライスでは対象なし）。
- Added: なし

## 2.settings-read

### Types

```ts
export function readSettings(dir: string): SettingsRead;
```

### Steps

1. `.pi/extensions/sound-notify/settings/read.ts`:
   - `readSettings` が `<dir>/settings.json` を読み、ファイルがなければ既定値を返し、壊れていれば `broken` を返します。
2. `.pi/extensions/sound-notify/settings/read.test.ts`:
   - (happy) 正常な設定ファイルがある → `ok` を返す。
   - (empty) ファイルがない → `ok` で、`readSettings` が既定値を返す。
   - (error) 壊れた設定ファイルの JSON → `broken` を返す。
3. `.pi/extensions/sound-notify/index.ts`:
   - `parseConfig`、`loadConfig`、`DEFAULT_CONFIG`、`SoundNotifyConfig`、`CONFIG_PATH` を削除し、`readSettings` をエントリーポイントで1回呼び、`settingsOrDefault` で `broken` を既定値にフォールバックして通知せず、設定の型を `Settings` にします。
4. `.pi/extensions/sound-notify/index.test.ts`:
   - (happy) `defaultSettings()` の5つの `sounds` をハンドラが鳴らす。
   - (empty) `enabled: false` ではハンドラが鳴らさない。
   - (empty) `notifications: false` ではハンドラが鳴らさない。
   - `defaultConfig` を `defaultSettings()` に置き換え、`parseConfig` のテストを `schema.test.ts` に移します。

### Verify

- Always:
  - 関係するテスト（`pnpm test:related .pi/extensions/sound-notify/index.ts .pi/extensions/sound-notify/settings/read.ts` が返すテスト）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `parseConfig`、`loadConfig`、`DEFAULT_CONFIG`、`config.json`、`SoundNotifyConfig`、`CONFIG_PATH` を変更したファイル内で大文字・小文字を区別せずに検索し、残っていないことを確かめる。
- Added: なし

## 3.readme

### Types

```ts
なし;
```

### Steps

1. `.pi/extensions/sound-notify/README.md`:
   - 設定のセクションを `settings.json` のキーのテーブルにし、`config.json` の「コミットしない」の行を削除し、読み込みは起動時に1回だけ行い、壊れた設定は既定値で続行して通知しないと書き、既存の `config.json` は利用者が `settings.json` にリネームして手動で移行すると書き、`Install` セクションの `cp` に `settings/` と `settings.json` を追加します。

### Verify

- Always:
  - 関係するテスト（`pnpm test:related` が返す変更したファイルに関係するテストで、README だけなら対象なし）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `config.json` と「コミットしない」を変更したファイル内で大文字・小文字を区別せずに検索し、残っていないことを確かめる。
- Added:
  - other — `node -e` で `settings.json` のキーを出力し、README のテーブルの行と `diff` で比較して、欠落と既定値の不一致がないことを確かめる。

## Notes

### Slice 1: settings-shape

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 2: settings-read

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 3: readme

- Findings:
- Unplanned:
- Commit:
- Stopped:

## Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Unproven:
- Noise:
- Doubts:

## Acceptance

- Ran:
- Findings:
- Doubts:
