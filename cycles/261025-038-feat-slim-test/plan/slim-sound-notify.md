# PLAN `slim-sound-notify`

- No: 01

## Files

```text
.pi/
  extensions/
    sound-notify/
      index.test.ts        update
      README.md            update
```

## Slices

## 1.音の仕様

### Types

なし

### Steps

1. `.pi/extensions/sound-notify/index.test.ts`:
   - 期待値は `parseConfig({})` の `sounds.*` から取る。音の名前を断言に書かない。
   - cmux のコマンド名と旗（`cmux`、`notify`、`--title`、`--subtitle`、`--body`）は、ファイルの先頭で 1 度だけ定数に置き、断言はそこから取る。
   - `isCommitResult` の入力は `commitEvent` の工場から作る。
   - (happy) bash の結果にコミットの形（7 桁の hex）→ `sounds.commit` の音が 1 回。6 桁では鳴らない。
   - (error) bash の結果が普通の出力 → 鳴らない。
   - (error) `toolName` が bash 以外 → 鳴らない。
   - (error) `isError` が真 → 鳴らない。
   - (happy) `sounds.commit` を別名にする → その名前で 1 回。
   - (happy) 圧縮が終わる → `sounds.compact` の音が 1 回。
   - (happy) 圧縮が終わる → cmux を呼ばない。
   - (happy) `sounds.compact` を別名にする → その名前で 1 回。
   - (error) `sounds.compact` が文字列でない → 既定の音に落ちる。
   - (error) `hasUI` が false → commit でも compact でも鳴らない。
   - (error) `enabled` が false → commit でも compact でも鳴らない。
   - (happy) `ui_prompt_start` の title が permission → `sounds.permission` の音。
   - (happy) 普通の質問 → `sounds.question` の音。
   - (happy) `agent_settled` → `sounds.done` の音と cmux の通知。
   - (error) `notifications` が false → 音は鳴り、cmux を呼ばない。
   - (happy) permission の合図と普通の質問 → 通知の文面が違う。
   - (happy) 入口が `session_compact` を登録する → そのハンドラを呼ぶと `sounds.compact` が 1 回。
   - (happy) `parseConfig` は `enabled` の true と false、`notifications` の false を読む。
   - (error) `enabled` が真偽値でない → 既定に落ちる。
   - (error) `isCommitResult` に record でない値を渡す → false で落ちない。
   - 落とす: 「続けて 2 回圧縮 → 2 回鳴る」（2 回目が鳴らなくても誰も気づかず、単発のケースが押さえる）。
   - 落とす: 「session_compact を登録し、session_compact_failed は登録しない」の否定側（`_failed` を登録しなくても、誰も気づかない）。肯定側は入口のケースが押さえる。
   - 落とす: 「text 以外のパートは無視する」（`type === 'text'` の判定を外しても `part.text` が undefined になり、結果が変わらない）。
   - 落とす: 「7 桁未満の hex」の独立したケース（コミットのケースに畳む）。
2. `.pi/extensions/sound-notify/README.md`:
   - Compact の既定を `Glass` から `Ping` に直す。表の行、`config.json` の例、`sounds.compact` の既定の 3 か所。

### Verify

- Always:
  - 既定の 5 つ
- Added: なし

## Notes

### Slice 1: 音の仕様

- Findings: なし
- Unplanned: なし
- Commit: 86f93f3
- Stopped:

### Cleanup: 重複・消えた振る舞いの確認

- Findings: なし — 同じ振る舞いの重複・消えた振る舞い・消えた分岐・型が決める前提・気づかれない振る舞いはいずれもなく、落とす物はなかった。
- Unplanned: なし

## Review

### Plan review

- `:31` の 7 桁と 6 桁は、独立した境目のケースになっていました。
  - fixed: コミットのケースに畳み、6 桁では鳴らないことを同じケースで見るようにした。
- `:34` の「続けて 2 回圧縮 → 2 回鳴る」は、起きにくく、2 回目が鳴らなくても気づかれません。
  - fixed: 落とすことにした。
- `.pi/extensions/sound-notify/index.test.ts:227` `:244` の `--title` と `--body` が直書きで、cmux の口も `External` にありませんでした。
  - fixed: コマンド名と旗はテストファイルの先頭で 1 度だけ定数に置き、断言はそこから取ると書いた。
  - left: `cmux` を `External` には入れません。このテストは cmux を起こさず、製品が自分の口（`pi.exec`）に渡す argv を読むだけです。外と話すのは製品で、テストは話しません。
- `.pi/extensions/sound-notify/index.test.ts:273` の `isCommitResult` の 3 ケースが、リテラルを各所に書いていました。
  - fixed: `commitEvent` の工場から作ると書き、文字列と content の 2 ケースを工場から導くようにした。
- `.pi/extensions/sound-notify/index.ts:34` の permission・question・done の音が、どの step にもありませんでした。
  - fixed: `ui_prompt_start` の 2 種と `agent_settled` の 3 ケースを足した。
- `.pi/extensions/sound-notify/index.ts:147` の `notifications: false` の分岐が、確かめられていませんでした。
  - fixed: 「音は鳴り、cmux を呼ばない」を足した。
- `.pi/extensions/sound-notify/index.ts:141` の guard が compact でしか見られていませんでした。
  - fixed: `hasUI` と `enabled` の 2 ケースを、commit と compact の両方に当てる形にした。
- `.pi/extensions/sound-notify/README.md:29` の compact の既定が `Glass` で、製品は `Ping` でした。plan に文書がありませんでした。
  - fixed: `README.md` を `Files` と `Steps` に足し、3 か所を直すと書いた。

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
