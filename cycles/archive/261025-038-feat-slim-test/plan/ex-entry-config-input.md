# PLAN `ex-entry-config-input`

## Files

```text
.pi/
  extensions/
    sound-notify/
      index.test.ts        update
```

## Slices

## 1.入口の設定

### Types

なし

### Steps

1. `.pi/extensions/sound-notify/index.test.ts`:
   - 入口のケースで `extensionDefault` を呼ぶのをやめ、`registerSoundHandlers` に `defaultConfig` を渡す。実物の `config.json` を読まない。
   - (happy) 登録した `session_compact` のハンドラを呼ぶ → `sounds.compact` の音が 1 回。

### Verify

- Always:
  - 既定の 5 つ
- Added: なし

## Notes

### Slice 1: 入口の設定

- Findings: なし
- Unplanned: なし
- Commit: fdf2ed9
- Stopped:

## Review

### Round 1

- Stale: なし — `.pi/extensions/sound-notify/index.test.ts:1-8` の注記は既に `registerSoundHandlers` への直接受け渡しと実 `config.json` 非依存を述べており、今回の差分と一致します。`extensionDefault` への言及はコード内に残っておりません。
- Unlisted: なし — `git diff 2488a9d..HEAD --stat` は `.pi/extensions/sound-notify/index.test.ts` の 1 件のみであり、`cycles/261025-038-feat-slim-test/plan/ex-entry-config-input.md:5-10` の `Files` の記載と一致します。
- Gaps: なし — `cycles/261025-038-feat-slim-test/plan/ex-entry-config-input.md:22-24` の手順の振る舞い（登録済み `session_compact` 呼び出し → `sounds.compact` が 1 回）は `.pi/extensions/sound-notify/index.test.ts:285-291` で実行されております。`Added: なし` は DB・front・auth・base・other のいずれにも該当しないため妥当です。
- Unproven: なし — `.pi/extensions/sound-notify/index.test.ts:285-291` は `session_compact` 未登録では `toBeDefined` が失敗し、誤った音名では `toEqual([defaultConfig.sounds.compact])` が失敗します。観測可能な振る舞いは壊せば赤になります。
- Noise: なし — 当該断言は `defaultConfig.sounds.compact` を用いており、魔数やハードコード文字列を含みません。存在確認は型では保証されず、利用者に気付かれない振る舞いでもありません。
- Doubts:
  - `.pi/extensions/sound-notify/index.ts:32-36` では既定の `compact` と `question` が共に `Ping` のため、既定値のままでは種類の取り違えを音名だけでは区別できません。ただし既定で同音であれば利用者は気付けないため、`format.md` の `## Test cases` に照らして追加の事例は求めておりません。
  - 本リポジトリには `config.json` がなく、`.pi/extensions/sound-notify/index.ts:86-96` の `loadConfig` は欠落時に既定値を返すため、仮に旧来の `extensionDefault` に戻しても清浄な環境では当該試験は緑のままです。不読み替えの保証は試験結果ではなく `.pi/extensions/sound-notify/index.test.ts:55-76` の `createEntry` が `registerSoundHandlers` のみを呼ぶ構成によります。
  - `cycles/261025-038-feat-slim-test/plan/slim-sound-notify.md:106-107,123` の疑念は旧来の実 `config.json` 依存を述べたものであり、本差分により過去の記録となります。当該 `plan` の `Files` 外のため、本 `Review` では所見とせず疑念として残します。

## Acceptance

- Ran:
  - `pnpm test:run` → 54 ファイル / 766 ケース緑
  - `pnpm typecheck` → root: ok、`.pi`: ok
  - `pnpm lint` → 緑
  - `pnpm format:check` → 緑
  - 「振る舞いを壊す」を 1 件試した。
    - `index.ts` から `pi.on('session_compact', ...)` を外す → 「session_compact を登録し、そのハンドラを呼ぶ → compact が 1 回鳴る」が赤。戻して緑を確認。
- Findings: なし
- Doubts: なし
