# Close 031

## Collected

### prune-pass-rework (ADR 01, 02, 03, 04 / Scope なし)

1. 316 / Review Round 1 / `.pi/extensions/context-prune/index.ts:122` の `>=`（`at` 同値で失敗優先）は plan の「`at` が新しい方」では決まらず、同 ms は稀なので所見にせず疑義に留める。 / left: 同 ms の同時発生は稀で、どちらを選んでも冷却は効くため直さない
   - Doing: `lastPass` と `lastFailure` のうち `at` が新しい方を冷却の起点にする。
   - Left: 同 ms の同時発生は稀で、どちらを選んでも冷却は効く。
   - Cost: なし。挙動は変わらない。

2. 318 / Review Round 1 / `.pi/extensions/context-prune/index.ts:215` の background `catch`（`runPass` が投げる経路）は `ports` が投げを `failed` 化するため到達可能性が不明で、投げ試験の欠落を所見にせず疑義に留める。 / left: 到達する投げ経路が無く、再現できる試験が書けないため足さない
   - Doing: 背景パスの失敗を `lastFailure` に残す。
   - Left: `ports` が投げを `failed` に変えるので `catch` へ落ちる経路が無く、試験が書けない。
   - Cost: 投げる経路が将来できたとき、`catch` の分岐が試されないままになる。

### ex-prune-question (ADR 02 / Scope なし)

3. 67 / Review Round 1 / `.pi/extensions/context-prune/prune/judge.ts:2` 頭コメ「関係ない結果だけを落とす」が旧 relevance 寄りに読めるが汎用表現のため finding にしない。
   - Doing: 判定の目的を頭コメントに書く。
   - Left: 「関係ない結果だけを落とす」は誤りではない。
   - Cost: 読み手が relevance 判定と読む余地が残る。

4. 68 / Review Round 1 / `.pi/extensions/context-prune/index.test.ts:188,376` の引数/型名 `yes` 残存は命名のみで動作は `keep` を返し正しいため finding にしない。
   - Doing: 偽の分類器の答えの型名。
   - Left: 動作は `keep` を返しており、名前だけが古い。
   - Cost: 名前の一貫性のみ。

5. 69 / Review Round 1 / `.pi/extensions/context-prune/prune/ports.test.ts:41,81`・`index.test.ts:769` の yes/no 治具は汎用 passthrough 用で judge 仕様と無関係のため stale にしない。
   - Doing: `ports` の passthrough を試験する治具。
   - Left: judge の仕様ではなく、口の受け渡しだけを見ている。
   - Cost: なし。

6. 70 / Review Round 1 / criteria 値の文言の厳密一致を `expect.any(String)`/`toContain('need')` でしか見ない点は Verify が鍵と need のみ要求のため finding にしない。
   - Doing: criteria の値を試験する。
   - Left: Verify は鍵と `need` の有無だけを要求した。
   - Cost: criteria の文言が変わっても緑のまま。

7. 75 / Review Round 2 / `.pi/extensions/context-prune/README.md:34` — fixed confirmed: now `a keep below this drops the result`, matching `prune/judge.ts:102-104` criteria `keep`/`drop` and `prune/judge.ts:150` `probabilities['keep']`. No `yes` remains on this line.
   - Doing: README の threshold の説明。
   - Left: 直っており、残るものは無い。
   - Cost: なし。

8. 77 / Review Round 2 / No target (Round 1 `fixed:` is Stale-only; out of scope, not re-checked).
   - Doing: Round 2 で `fixed:` の行だけを見る。
   - Left: 対象が Stale だけで、他は見直していない。
   - Cost: なし。

9. 79 / Review Round 2 / No target (same reason).
   - Doing: Round 2 で `fixed:` の行だけを見る。
   - Left: 対象が Stale だけで、他は見直していない。
   - Cost: なし。

10. 81 / Review Round 2 / No target (same reason).

- Doing: Round 2 で `fixed:` の行だけを見る。
- Left: 対象が Stale だけで、他は見直していない。
- Cost: なし。

11. 83 / Review Round 2 / Wording `a keep below this drops` is terse (probability vs. verdict) but accurate against `verdicts` (`probability >= threshold` keeps); not a finding.

- Doing: README の threshold の文言。
- Left: 確率と判定の区別を省いた短い文だが、`verdicts` と一致している。
- Cost: 読み手が一瞬迷う。

### ex-prune-state (ADR 02 / Scope なし)

12. 83 / Review Round 1 / `.pi/extensions/context-prune/prune/ports.test.ts:39`・`.pi/extensions/context-prune/index.test.ts:765` の `state: { summary, candidates: [] }` 治具は汎用 passthrough 用で judge 仕様と無関係のため stale にしない（前回 Round 1 の yes/no 治具と同理由）。

- Doing: `ports` の passthrough の治具。
- Left: judge の仕様ではなく、口の受け渡しだけを見ている。
- Cost: なし。

13. 84 / Review Round 1 / `.pi/extensions/context-prune/prune/judge.test.ts:46-49` が criteria 値を `expect.any(String)` でしか見ない点は Verify が鍵のみ要求のため finding にしない（前回と同理由）。

- Doing: criteria の値を試験する。
- Left: Verify は鍵だけを要求した。
- Cost: criteria の文言が変わっても緑のまま。

14. 85 / Review Round 1 / `questionTokens` を旧 `itemTokens` 式（excerpt+args+tool）に戻しても `.pi/extensions/context-prune/prune/judge.test.ts:92,190` は単調・2 束以上で緑のままだが、Verify が単調と束数のみ要求のため finding にしない。32000・500 文字・英語化は ADR/plan の決定値のため指摘しない。

- Doing: 予算の見積もり `questionTokens` を試験する。
- Left: Verify は単調性と束数だけを要求した。
- Cost: `questionTokens` が旧式（候補の一部だけ）に戻っても緑のまま。

15. 86 / Review Round 1 / `fixed` を旧 `view+質問 JSON` に戻しても `.pi/extensions/context-prune/prune/run.test.ts:71,94` は 2 束以上で緑のままだが、Verify が束数のみ要求のため finding にしない。

- Doing: `run.ts` の `fixed` を試験する。
- Left: Verify は束数だけを要求した。
- Cost: `fixed` が旧式（`view` ＋質問 JSON）に戻っても緑のまま。

16. 87 / Review Round 1 / `.pi/extensions/context-prune/prune/judge.test.ts:35` の 2 件試験が鍵しか見ず候補依存（tool 違いで文が変わる）を証明しない点は Verify が read のみ要求のため finding にしない。

- Doing: `judgeRequest` の 2 件試験。
- Left: Verify は `tool:` などの行の有無を要求した。
- Cost: 候補ごとに文が変わることを直接は示していない。

## Triage

- 1: dropped (ADR 04 / `Unit.context-prune`): 同 ms の同値は稀で、冷却はどちらでも効く。
- 2: dropped (ADR 04 / `Unit.context-prune`): 到達しない経路で、再現できる試験が書けない。
- 3: dropped (ADR 02 / `Unit.context-prune`): コメントの表現で、動作に影響しない。
- 4: dropped (ADR 02 / `Unit.context-prune`): 命名のみで、動作は `keep` を返している。
- 5: dropped (ADR 02 / `Unit.context-prune`): passthrough の治具で judge の仕様と無関係。
- 6: dropped (ADR 02 / `Unit.context-prune`): 鍵は検査済みで、値の文言が変わっても動作は変わらない。
- 7: dropped (ADR 02 / `Unit.context-prune`): 直っており、残るものは無い。
- 8: dropped (ADR 02 / `Unit.context-prune`): Round 2 の対象なし。
- 9: dropped (ADR 02 / `Unit.context-prune`): Round 2 の対象なし。
- 10: dropped (ADR 02 / `Unit.context-prune`): Round 2 の対象なし。
- 11: dropped (ADR 02 / `Unit.context-prune`): 文言のみで、`verdicts` と一致している。
- 12: dropped (ADR 02 / `Unit.context-prune`): passthrough の治具。
- 13: dropped (ADR 02 / `Unit.context-prune`): 鍵は検査済み。
- 14: dropped (ADR 02 / `Unit.context-prune`): owner の判断で値の保証は要らない。機能の話ではない。
- 15: dropped (ADR 02 / `Unit.context-prune`): 同上。値の保証はしない。
- 16: dropped (ADR 02 / `Unit.context-prune`): 行の有無で足りる。
