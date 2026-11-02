# PLAN `quality-gate-sound`

- No: 05

## Files

```text
.pi/extensions/
  quality-gate/
    checks.test.ts     update
    report.test.ts     update
    targets.test.ts    update
  sound-notify/
    index.test.ts      update
    settings/
      schema.test.ts   update
      read.test.ts
```

## Slices

## 1.quality-gate の統合

### Types

なし

### Steps

1. `.pi/extensions/quality-gate/report.test.ts`:
   - (happy) 失敗したチェックの `label` と試行回数（`attempt/maxAttempts`）が1行目に出る。
   - (happy) 失敗が複数あれば、その `label` が全部1行目に並ぶ。
   - (error) 成功したチェックの `label` は1行目に出ない。
   - 上の3本を、`it('失敗したチェックの label と試行回数だけが 1 行目に出る')` の1本に統合する。
   - (happy) 失敗したチェックの節に `output` が出る。
   - (empty) 成功したチェックの節には `output` が出ない。
   - 上の2本を、`it('失敗したチェックの節にだけ output が出る')` の1本に統合する。
   - (empty) 変更したファイルがなければ `(none)` と出す。
   - (happy) 変更したファイルがあれば `(none)` は出さない。
   - 上の2本を、`it('変更したファイルの有無で (none) を出すか決める')` の1本に統合する。
   - (boundary) 上限を超える出力は切り詰めて、除外した行数を告げる。
   - (boundary) 上限以内の出力はそのまま出す。
   - 上の2本を、`it('上限を超えるときだけ切り詰めて、除外した行数を告げる')` の1本に統合する。
   - ダミーは `report()` のファクトリから取り、リテラルの直書きを減らす。
2. `.pi/extensions/quality-gate/checks.test.ts`:
   - (happy) `cwd` からの相対を返す。
   - (empty) 空になる場合（`path` が `cwd` 自身）は元のパスを返す。
   - 上の2本を、`it('cwd からの相対を返し、空なら元のパスを返す')` の1本に統合する。
   - (boundary) `.gitignore` 対象は `skipped` に入れる。
   - (boundary) `git check-ignore` が 0 以外でも、出力があれば除外しない。
   - 上の2本を、`it('.gitignore の対象だけを skipped に入れ、check-ignore が 0 以外でも出力があれば除外しない')` の1本に統合する。
3. `.pi/extensions/quality-gate/targets.test.ts`:
   - (happy) 新しく現れたパスを返す。
   - (boundary) すでに変更済みのファイルの再編集を検出する。
   - (empty) 変わらなければ空配列になる。
   - 上の3本を、`it('新しく現れたパスと、再編集されたパスだけを返し、変わらなければ空になる')` の1本に統合する。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/quality-gate/report.test.ts .pi/extensions/quality-gate/checks.test.ts .pi/extensions/quality-gate/targets.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `! grep -E '失敗したチェックの label と試行回数が 1 行目に出る|失敗が複数あれば 1 行目にその label が全部並ぶ|成功したチェックの label は 1 行目に出ない' .pi/extensions/quality-gate/report.test.ts`
  - `test "$(grep -c '失敗したチェックの label と試行回数だけが 1 行目に出る' .pi/extensions/quality-gate/report.test.ts)" = 1`
  - `! grep -E '成功したチェックは空でない output|失敗したチェックの節にその output が出る' .pi/extensions/quality-gate/report.test.ts`
  - `test "$(grep -c '失敗したチェックの節にだけ output が出る' .pi/extensions/quality-gate/report.test.ts)" = 1`
  - `! grep -E '変更したファイルがなければ「\(none\)」と出す|変更したファイルがあれば `\(none\)` は出さない' .pi/extensions/quality-gate/report.test.ts`
  - `test "$(grep -c '変更したファイルの有無で (none) を出すか決める' .pi/extensions/quality-gate/report.test.ts)" = 1`
  - `! grep -E '上限を超える出力は切り詰めて除外した行数を告げる|上限以内の出力はそのまま出す' .pi/extensions/quality-gate/report.test.ts`
  - `test "$(grep -c '上限を超えるときだけ切り詰めて、除外した行数を告げる' .pi/extensions/quality-gate/report.test.ts)" = 1`
  - `! grep -E 'cwd からの相対を返すことを確かめる|空になる場合（path が cwd 自身）は元のパスを返す' .pi/extensions/quality-gate/checks.test.ts`
  - `test "$(grep -c 'cwd からの相対を返し、空なら元のパスを返す' .pi/extensions/quality-gate/checks.test.ts)" = 1`
  - `! grep -E '.gitignore 対象はチェックに含めず|git check-ignore が 0 以外でも' .pi/extensions/quality-gate/checks.test.ts`
  - `test "$(grep -c '.gitignore の対象だけを skipped に入れ' .pi/extensions/quality-gate/checks.test.ts)" = 1`
  - `! grep -E '新しく現れたパスを返すことを確かめる|すでに変更済みのファイルの再編集を検出する|変わらなければ空配列になる' .pi/extensions/quality-gate/targets.test.ts`
  - `test "$(grep -c '新しく現れたパスと、再編集されたパスだけを返し、変わらなければ空になる' .pi/extensions/quality-gate/targets.test.ts)" = 1`
- Added: なし

## 2.sound-notify の削除と統合

### Types

なし

### Steps

1. `.pi/extensions/sound-notify/index.test.ts`:
   - `it('defaultSettings() の 5 つの sounds をハンドラが鳴らすことを確かめる')` を削除する。合図ごとのテストが同じ分岐を確かめている。
   - `it('hasUI が false なら commit でも compact でも鳴らない')` は残す。`index.ts:88` の `!ctx.hasUI` を確かめる唯一のテストである。
   - `it('非既定の設定ファイルならその音で鳴る（起動時に読む）')` を削除する。統合先は `settings/read.test.ts` の `it('正常な設定ファイルがあれば ok を返す')` である。
   - `it('壊れた設定ファイルなら既定で動き余計な通知をしない')` を削除する。統合先は `settings/read.test.ts` の `it('壊れた設定ファイルの JSON なら broken を返す')` である。
2. `.pi/extensions/sound-notify/settings/schema.test.ts`:
   - `it('../settings.json の既定値は defaultSettings() と一致する')` を削除する。実ファイルとコードの既定値の一致は、テストではなく、`settings.json` を読む起動時の経路で保つ。
   - (error) `broken` なら `defaultSettings()` を返す。
   - (happy) `ok` ならその設定をそのまま返す。
   - 上の2本を、`it('broken なら defaultSettings() を返し、ok ならその設定をそのまま返す')` の1本に統合する。
3. `.pi/extensions/sound-notify/settings/read.test.ts` は変えない。統合先としてそのまま残す。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/sound-notify/index.test.ts .pi/extensions/sound-notify/settings/schema.test.ts .pi/extensions/sound-notify/settings/read.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `! grep -E '5 つの sounds をハンドラが鳴らす|非既定の設定ファイルなら|壊れた設定ファイルなら既定で動き|../settings.json の既定値' .pi/extensions/sound-notify/index.test.ts .pi/extensions/sound-notify/settings/schema.test.ts`
  - `test "$(grep -c 'hasUI が false なら' .pi/extensions/sound-notify/index.test.ts)" = 1`
  - `! grep -E 'broken なら defaultSettings\(\) を返す|ok ならその設定をそのまま返す' .pi/extensions/sound-notify/settings/schema.test.ts`
  - `test "$(grep -c 'broken なら defaultSettings() を返し、ok ならその設定をそのまま返す' .pi/extensions/sound-notify/settings/schema.test.ts)" = 1`
  - `test "$(grep -c '正常な設定ファイルがあれば ok を返す' .pi/extensions/sound-notify/settings/read.test.ts)" = 1`
  - `test "$(grep -c '壊れた設定ファイルの JSON なら broken を返す' .pi/extensions/sound-notify/settings/read.test.ts)" = 1`
- Added: other — 使い捨てのテスト `test/tmp-settings-consistency.test.ts` を次の内容で作り、`pnpm exec vitest run --config vitest.starter.config.ts test/tmp-settings-consistency.test.ts` で走らせ、`rm` で削除する。内容は `readSettings` で `.pi/extensions/sound-notify/settings.json` を読み、`defaultSettings()` と一致することを確かめるものである。CI では見張らない。
- Added: other — `pnpm test:run .pi/extensions/quality-gate .pi/extensions/sound-notify` で件数を数え、68 から減った件数を ## Notes に書く

## Notes

### Slice 1: quality-gate の統合

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 2: sound-notify の削除と統合

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Cleanup: <what it cleaned>

- Findings:
- Unplanned:

## Work Review

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
