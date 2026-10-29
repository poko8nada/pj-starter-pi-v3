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

- Findings: なし
- Unplanned: SETTINGS_FILE を `as const` で定義した。plan の注釈型だと lint の prefer-as-const に触れるため。意味は同じリテラル型。
- Commit: ae59fe2
- Stopped: なし

### Slice 2: settings-read

- Findings: なし
- Unplanned: なし
- Commit: 8dc7d1d
- Stopped: なし

### Slice 3: readme

- Findings: Verify の `config.json` の grep は移行の 1 行に触れる。Steps が既存の `config.json` の手動移行を書くよう求めるため残し、「コミットしない」と `not committed` は消した。
- Unplanned: なし
- Commit: 63c4fcb
- Stopped: なし

### Cleanup

- Dropped: `sound-notify.prompt` の「notifications が false → 音は鳴り、cmux を呼ばない」(`index.test.ts`)。`sound-notify.settings` の同名テストと設定・合図・表明が同一のため、plan が求める settings 側を残した。
- Dropped: `sound-notify.guard` の「enabled が false → commit でも compact でも鳴らない」(`index.test.ts`)。`sound-notify.settings` の「enabled: false ではハンドラが鳴らさない」が同 2 合図を含む 4 合図で確かめるため、広い側を残した。
- Dropped: `sound-notify.compact` の「圧縮が終わる → compact の音が 1 回鳴る」(`index.test.ts`)。直後の「cmux の exec は呼ばれない」が同じ鳴動に加えて exec 未呼出まで確かめるため、強い側を残した。
- Kept: `schema.test.ts` の 8 件と `read.test.ts` の 3 件は plan のケースと 1 対 1 で重複なしのため残した。5 音の結線テストと種別ごとの単体テストは結線と分離の役割が違うため残した。
- Suite: 整理後は 3 ファイル 30 テスト（`index.test.ts` 19、`schema.test.ts` 8、`read.test.ts` 3）で緑。`typecheck`・`lint`・`format:check` も緑。

## Review

### Round 1

- Stale: なし — `parseConfig`/`loadConfig`/`DEFAULT_CONFIG`/`SoundNotifyConfig`/`CONFIG_PATH`のgrepはREADMEの移行1行（`config.json`→`settings.json`への手動移行、planのSlice 3が求める文言）のみに触れ、`not committed`/`コミットしない`は消えている。READMEの設定テーブル8行は`settings.json`のキー・既定値と一致し、入口コメントとテスト冒頭の`settings.json`言及も更新済みのため、古く残った文書・コメント・テストはない。
- Unlisted: なし — diffの実装8件はFilesの8件（`settings.json`/`schema.ts`/`schema.test.ts`/`read.ts`/`read.test.ts`/`index.ts`/`index.test.ts`/`README.md`）と1対1で一致し、残りは記録としてのplan md自体のNotes追記のみのため、Filesにない変更はない。
- Gaps:
  - 入口の既定exportの結線（起動時に1回だけ読み、`broken`は既定で続行し通知しない）を確かめる検査がない。`read.test.ts`は`readSettings`単体、`index.test.ts`は`Settings`直接渡しの振る舞いのみで、既定exportを呼ばないため、読み回数・黙った継続の破損を検出できない。(.pi/extensions/sound-notify/index.ts:171)
    fixed: 既定exportに検査用のdir引数（既定はEXTENSION_DIR、piの呼び方は不変）を足し、`index.test.ts`の`sound-notify.default-export`に3件（非既定ファイルの音・破損時の既定継続と通知なし・登録後の書換でも旧音）を追加した。
- Unproven:
  - `readSettings`のhappyが`defaultSettings()`を書いて`defaultSettings()`と比べるため、実ファイルを読まず既定を返しても緑のまま。非既定値（例：`enabled: false`や別音名）を書いて比べないと読みを証明できない。(.pi/extensions/sound-notify/settings/read.test.ts:9)
    fixed: happyが非既定値（`enabled: false`・`commit: 'Basso'`）を書いて比べるようにし、読まずに既定を返す実装では赤になるようにした。
- Noise: なし — `schema.test.ts`8件と`read.test.ts`3件はplanの指定ケースと1対1で、結線テストと種別テストの分担はCleanup記録の通り重複ではない。`Basso`等の文字列は入力と期待の往復で魔数・決め打ち表明には当たらず、型やDBが保証する前提の再現もない。
- Doubts: なし

## Acceptance

- Ran:
- Findings:
- Doubts:
