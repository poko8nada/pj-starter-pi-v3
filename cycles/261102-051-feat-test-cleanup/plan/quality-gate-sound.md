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
```

## Slices

## 1.quality-gate の統合

### Types

なし

### Steps

1. `.pi/extensions/quality-gate/report.test.ts`:
   - `it('失敗したチェックの label と試行回数が 1 行目に出る')`、`it('失敗が複数あれば 1 行目にその label が全部並ぶ')`、`it('成功したチェックの label は 1 行目に出ない')` を1本に統合する。統合したテストは、失敗した `label` だけが1行目に並ぶことを確かめる。
   - `it('成功したチェックは空でない output を渡してもその節に output は出ない')` と `it('失敗したチェックの節にその output が出る')` を1本に統合する。統合したテストは、失敗したチェックの節にだけ `output` が出ることを確かめる。
   - `it('変更したファイルがなければ「(none)」と出す')` と `it('変更したファイルがあれば `(none)` は出さない')` を1本に統合する。統合したテストは、変更したファイルの有無で `(none)` を出すか決めることを確かめる。
   - `it('上限を超える出力は切り詰めて除外した行数を告げる')` と `it('上限以内の出力はそのまま出す（切り詰めの記号を付けない）')` を1本に統合する。統合したテストは、上限を超えるときだけ切り詰めて除外した行数を告げることを確かめる。
2. `.pi/extensions/quality-gate/checks.test.ts`:
   - `it('cwd からの相対を返すことを確かめる')` と `it('空になる場合（path が cwd 自身）は元のパスを返す')` を1本に統合する。統合したテストは、`cwd` からの相対を返し、空なら元のパスを返すことを確かめる。
   - `it('.gitignore 対象はチェックに含めず skipped に入れる')` と `it('git check-ignore が 0 以外でも無視されたパスの出力があれば除外しない')` を1本に統合する。統合したテストは、`.gitignore` の対象だけを `skipped` に入れ、`git check-ignore` が 0 以外でも出力があれば除外しないことを確かめる。
3. `.pi/extensions/quality-gate/targets.test.ts`:
   - `it('新しく現れたパスを返すことを確かめる')`、`it('すでに変更済みのファイルの再編集を検出する（状態を示す文字では分からない）')`、`it('変わらなければ空配列になる')` を1本に統合する。統合したテストは、新しく現れたパスと再編集されたパスだけを返し、変わらなければ空になることを確かめる。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/quality-gate/report.test.ts .pi/extensions/quality-gate/checks.test.ts .pi/extensions/quality-gate/targets.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -c '失敗したチェックの label と試行回数\|失敗が複数あれば\|成功したチェックの label は 1 行目に出ない' .pi/extensions/quality-gate/report.test.ts` が 0 である
  - `grep -c '失敗したチェックの label だけが 1 行目に並び' .pi/extensions/quality-gate/report.test.ts` が 1 である
  - `grep -c '新しく現れたパスを返すことを確かめる\|すでに変更済みのファイルの再編集を検出する\|変わらなければ空配列になる' .pi/extensions/quality-gate/targets.test.ts` が 0 である
  - `grep -c '新しく現れたパスと、再編集されたパスだけを返し' .pi/extensions/quality-gate/targets.test.ts` が 1 である
- Added: なし

## 2.sound-notify の削除と統合

### Types

なし

### Steps

1. `.pi/extensions/sound-notify/index.test.ts`:
   - `it('defaultSettings() の 5 つの sounds をハンドラが鳴らすことを確かめる')` を削除する。合図ごとのテストが同じ分岐を確かめている。
   - `it('hasUI が false なら commit でも compact でも鳴らない')` を削除する。端末のない環境では、壊れても誰も気づかない。
   - `it('非既定の設定ファイルならその音で鳴る（起動時に読む）')` を削除する。`settings/read.test.ts` の `it('正常な設定ファイルがあれば ok を返す')` が同じ分岐を確かめている。
   - `it('壊れた設定ファイルなら既定で動き余計な通知をしない')` を削除する。`settings/read.test.ts` の `it('壊れた設定ファイルの JSON なら broken を返す')` が同じ分岐を確かめている。
2. `.pi/extensions/sound-notify/settings/schema.test.ts`:
   - `it('../settings.json の既定値は defaultSettings() と一致する')` を削除する。実ファイルとコードの既定値の一致は、テストではなく、`settings.json` を読む起動時の経路で保つ。
   - `it('broken なら defaultSettings() を返す')` と `it('ok ならその設定をそのまま返す')` を1本に統合する。統合したテストは、`broken` なら `defaultSettings()` を返し、`ok` ならその設定をそのまま返すことを確かめる。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/sound-notify/index.test.ts .pi/extensions/sound-notify/settings/schema.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `! grep -n '5 つの sounds をハンドラが鳴らす\|hasUI が false なら\|非既定の設定ファイルなら\|壊れた設定ファイルなら既定で動き\|../settings.json の既定値' .pi/extensions/sound-notify/index.test.ts .pi/extensions/sound-notify/settings/schema.test.ts`
  - `grep -c 'broken なら defaultSettings() を返し、ok ならその設定をそのまま返す' .pi/extensions/sound-notify/settings/schema.test.ts` が 1 である
- Added: other — 使い捨てのテストを `test/tmp-settings-consistency.test.ts` に置き、`.pi/extensions/sound-notify/settings.json` を `readSettings` で読み、`defaultSettings()` と一致することを確かめてから削除する（`pnpm exec vitest run --config vitest.starter.config.ts test/tmp-settings-consistency.test.ts`）。CI では見張らない。

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
