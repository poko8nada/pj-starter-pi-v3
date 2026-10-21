# Close 028

## Collected

### thinking-scrub (ADR 01, 02, 03, 04 / Scope `Unit.thinking-scrub`)

1. 421 / Review Round 1 / `onCommand` の set で 2 回書き込む (`index.ts` の直接 + `runCommand` 経由) は最終状態が同じで plan Verify が書き込み回数を数えないため finding にしない — `.pi/extensions/thinking-scrub/index.ts:93` と `.pi/extensions/thinking-scrub/index.ts:100` / left: 最終状態が同じで書き込み回数は Verify の対象外のため拾わない
   - Doing: Slice 5 で `onCommand` を組み、`runCommand` に `writeEnabled` を渡しながら、その外でも同じ値を書いていた。
   - Left: 最終状態が同じで、書き込み回数を plan の Verify が数えていないため。
   - Cost: 1 コマンドで `settings.json` を 2 回書く。中身は同じで、読む人には重複に見える。
2. 423 / Review Round 1 / 既定 export の `dirname(fileURLToPath(import.meta.url))` + `Date.now` に専用 check が無いのは配線の定型で Verify の bullet が無いため finding にしない — `.pi/extensions/thinking-scrub/index.ts:128` / left: 配線の定型で Verify の bullet が無いため拾わない
   - Doing: Slice 5 で既定 export に、自分のディレクトリと `Date.now` を渡した。
   - Left: 配線の定型で、Verify の bullet が無いため。
   - Cost: `import.meta.url` から設定の場所を取る部分が壊れると、設定の無い場所を読み続け、常に既定（有効）で動く。画面からは気づけない。
3. 425 / Review Round 1 / 純粋 block (`"the *"` x12 単体) が `""` か `" "` かは plan Steps が端の空白を定めず Verify が `not.toContain` のみのため finding にしない — `.pi/extensions/thinking-scrub/scrub/detect.test.ts:26` / left: plan が端の空白を定めず Verify が `not.toContain` のみのため拾わない
   - Doing: Slice 1 で区間を消し、跡に何も足さないと決めた。
   - Left: 本文が 1 つの区間だけだったときの端の扱いを、plan が決めていなかった。
   - Cost: `reasoning_content` が `""` になる。空を受け付けるかは未確認で、400 になる可能性がある。
4. 427 / Review Round 1 / `周期 4` の fixture (`'abcd'` x15) が周期 8 でも当たる高調波の点は `MIN_PERIOD` が decided value で small-guard (`1〜3` 文字除外) は周期 3 の test で覆うため finding にしない — `.pi/extensions/thinking-scrub/scrub/detect.ts:19` / left: `MIN_PERIOD` は decided value で small-guard は周期 3 の test が覆うため拾わない
   - Doing: Slice 1 で、周期 4 文字以上の区間を対象にした。
   - Left: `MIN_PERIOD` は ADR が決めた値で、周期 4 の並びは周期 8 としても当たるが、同じ区間になるため。
   - Cost: 無い。区間の切り方は変わらない。
5. 429 / Review Round 1 / `settings.json` の他キー保持 (`{...readDoc, enabled}`) に保持確認の test が無い点は Verify が `enabled` の値のみを bullet にするため finding にしない — `.pi/extensions/thinking-scrub/index.ts:54` / left: Verify が `enabled` の値のみを bullet にするため拾わない
   - Doing: Slice 5 の `writeEnabled` は `{...readDoc, enabled}` で、他のキーを保つ形にした。
   - Left: plan の Verify が `enabled` の値だけを見ているため。
   - Cost: 将来 `settings.json` に別のキーが増えたとき、保つ実装が壊れても検査は緑のままになる。
6. 455 / Acceptance / `onCommand` は `enabled` を 2 回書き込む（直接と `runCommand` 経由）。最終状態は同じで、書き込み回数は検査していない。
   - Doing: 1 と同じ箇所を、acceptance でもう一度記録した。
   - Left: 1 と同じ理由。
   - Cost: 1 と同じ。
7. 456 / Acceptance / 既定 export の `dirname(fileURLToPath(import.meta.url))` と `Date.now` は検査していない。
   - Doing: 2 と同じ箇所を、acceptance でもう一度記録した。
   - Left: 2 と同じ理由。
   - Cost: 2 と同じ。
8. 457 / Acceptance / `settings.json` の他のキーを保つことは検査していない（`enabled` の値だけを見ている）。
   - Doing: 5 と同じ箇所を、acceptance でもう一度記録した。
   - Left: 5 と同じ理由。
   - Cost: 5 と同じ。
9. 458 / Acceptance / 純粋な繰り返しだけの本文は `""` か `" "` になる。plan の Steps は端の空白を定めていない。
   - Doing: 3 と同じ箇所を、acceptance でもう一度記録した。
   - Left: 3 と同じ理由。
   - Cost: 3 と同じ。

10. — / Acceptance（見張り） / 本物のループで一度も動いていない。検査は合成のメッセージだけ
    - Doing: ADR の Research が「自然なループを狙って起こせない」と記録し、plan は合成のメッセージで検査を組んだ。
    - Left: ループは狙って起こせず、効いたかを測る手段が無いため。
    - Cost: この拡張の値打ち（次のターンの thinking を引き継がないこと）が、実地で一度も確かまっていない。

## Triage

- 1: ex-plan ex-scrub-cleanup (ADR 04 / `Unit.thinking-scrub`): done 1970d4f — `onCommand` の書き込みを `runCommand` の 1 経路にした
- 2: dropped (ADR 04 / `Unit.thinking-scrub`): 配線の定型で、壊れたら `/thinking-scrub off` が効かない形で現れる
- 3: ex-plan ex-scrub-cleanup (ADR 02 / `Unit.thinking-scrub`): done 1970d4f — 全文が区間なら差し替えず、`""` の `reasoning_content` を作らない
- 4: dropped (ADR 01 / `Unit.thinking-scrub`): ADR が決めた `MIN_PERIOD` の帰結で、区間の切り方は変わらない
- 5: dropped (ADR 04 / `Unit.thinking-scrub`): 実装は他のキーを保つ形で、キーが増えたときに検査を足す
- 6: ex-plan ex-scrub-cleanup (1 と同じ穴 / ADR 04): done 1970d4f
- 7: dropped (2 と同じ穴 / ADR 04): 2 と同じ理由
- 8: dropped (5 と同じ穴 / ADR 04): 5 と同じ理由
- 9: ex-plan ex-scrub-cleanup (3 と同じ穴 / ADR 02): done 1970d4f
- 10: dropped (ADR 01–04 / `Unit.thinking-scrub`): 本物のループで動いたかを確かめる手段が無い
