# Close 013

## Integration

なし

## Collected

### intent-router (ADR 01-1, 01-2, 01-3, 01-4, 01-5, 02-1 / Scope intent-router, intent-router.route, intent-router.guide, intent-router.judge, intent-router.onoff, intent-router.log, Stack.Classifier)

1. Slice 7 (`/intent` でセッション中だけ切り、README を置く) / review の子の読み（README の3点照合）を子で実行できず、既定値・記載・形状を直接照合した
2. Slice 7 (`/intent` でセッション中だけ切り、README を置く) / `left: この worktree には子を走らせる口（consult_run 等）が無く、review ロールでの読みを実行できない`
3. Slice 8 (統合: 配線が1本につながり、実セッションのログに残るまで) / look 実行 (`pi -e .pi/extensions/intent-router/index.ts --no-session -p "cycles/013-2026-10-09/design.md は何を決めた?"`) の `logs/2026-10-09.jsonl`: (1) `hook: "route"` が1件あり `label: "question"` (`confidence: 1`) / (2) `hook: "judge"` の行は無し（短い応答で `minTurns: 2` に届かず判定が出なかった）/ (3) 差し込みは出ていない（`shadow: true` で `guide: "would"`）。合否にはしない
4. Slice 8 (統合: 配線が1本につながり、実セッションのログに残るまで) / `left: judge 行の有無は応答の往復数と閾値で揺れるため、ここでは確認だけした`
5. Review Round 1 / `README.md:13` / `README.ja.md:13` の拡張一覧が `consult` / `quality-gate` / `sound-notify` / `second-opinion` のままで、この差分が足した `.pi/extensions/intent-router/` を含まない
6. Review Round 1 / `fixed: 両 README の拡張一覧に intent-router を足し、この2ファイルを ## Files に update で追記した`
7. Review Round 1 / `.pi/extensions/intent-router/README.md:30` の「The file is read on every prompt」が `index.ts:96` と矛盾する。設定は `register` 時に1回だけ `readSettings` し、handler は閉じ込めた `settings` を使う。プロンプト毎に読み直さない
8. Review Round 1 / `fixed: README の文を「register 時に1回だけ読み、変えたら reload」に直した`
9. Review Round 1 / `guide.enabled: false`（`hook/route.ts:181`）/ `stop.enabled: false`（`hook/judge.ts:263`）の分岐を叩く検査が無い。Slices 5・6 の Verify は shadow のみで、無効化で `guide` / `stop` が `none` になる経路を見ない
10. Review Round 1 / `fixed: route.test と judge.test に無効化の検査を足し、guide / stop が none・text null になることを見た`
11. Review Round 1 / `judge.enabled: false`（`hook/judge.ts:380`）を叩く検査が無い。対照的に `route.enabled: false` は `hook/route.test.ts:249` で叩く
12. Review Round 1 / `fixed: judge.test に judge.enabled: false の検査を足し、ask もログも増えないことを見た`
13. Review Round 1 / `decideRoute` の score回答→skip（`hook/route.ts:49`）と未知ラベル文字列→skip（`hook/route.ts:52-54`）の単位検査が無く、handler の skip 経路（actOn / idleOn のどちらにも無い）のログ検査も無い
14. Review Round 1 / `fixed: 単位検査2件と handler の skip ログ検査2件（設定の穴は label 付き・未知文字列は label null）を足した。設定の穴の skip が label null で数を数えられない穴も見つけ、既知ラベルを残す直しと一緒に検査した`
15. Review Round 1 / `isSecretTarget` の `.env` 以外（`state.ts:187-196` の `~/.pi/`・`id_rsa` / `id_ed25519`・`.pem` / `.key`）を叩く検査が無い。`state.test.ts:101` は `.env` のみ
16. Review Round 1 / `fixed: state.test に秘密の的5種と非秘密の検査を足し、秘密混じりの記録が落ちることも見た`
17. Review Round 1 / `due` が wait の時に行を作らないことの検査が空道具以外に無い（`hook/judge.ts:323`）。`hook/judge.test.ts:305` は道具0件のみで、助走・間隔・連続・上限・撃ち済み・idle の wait でログ件数を見ない。2回目テスト（`judge.test.ts:291`）も `requests` のみでログ件数を見ない
18. Review Round 1 / `fixed: idle・助走・撃ち済み後の2回目・hold 直後の連続でログ件数を見ない検査を足し、2回目テストにもログ1件の検査を足した`
19. Review Round 1 / `has_images`（`hook/route.ts:278`）・`truncated`（`hook/route.ts:148` と judge の `state['truncated']`）・`display`（`hook/route.ts:219` と `hook/judge.ts:312`）の伝搬を見る検査が無い。route.test は `cwd_basename` のみ、judge.test は `customType` / `content` のみを見る
20. Review Round 1 / `fixed: route.test に画像・truncated・display の検査を、judge.test に display と maxStateChars を絞った truncated の検査を足した`
21. Review Round 1 / `state.test.ts:72` の溢れ検査は件数と `truncated` のみで、どれを捨てたかを見ない。`state.ts:117` の `slice(1)` を `slice(0, -1)`（新しい方を捨てる）に変えても緑のまま
22. Review Round 1 / `fixed: 溢れ検査に古い方（f0.ts）が落ち・新しい方（overflow.ts）が残ることを足した`
23. Review Round 1 / `state.test.ts:90` の重複検査は同じ `result: 'ok'` を2回入れて `attempts` のみ見る。`state.ts:110` の `result` 上書きを消しても緑のまま
24. Review Round 1 / `fixed: 重複検査を first / second の別文にし、attempts と最新文の両方を見るようにした`
25. Review Round 1 / `hook/judge.test.ts:287` は `entries.content` を `stopMessage(...)` の戻り値と比べる自己一致で、`settings.ts:251` の `stop.text` に `{label}` が無いため置換を消しても緑のまま。対照的に route.test は文面を一字一句の literal で比べる
26. Review Round 1 / `fixed: entries.content を一字一句の literal と比べ、stopMessage には {label} の置換検査を別に足した`
27. Review Round 1 / `index.test.ts:190` の配線検査は `findOfType` が常に同モデルを返す偽物のため、`hook/judge.ts:327` の `only: run.candidate` を消して選び直しても2行・`owner_prompt` 一致のまま緑
28. Review Round 1 / `fixed: findOfType が別モデルを返す偽物にし、route と judge の classify 先が可用と使い回しで分かれることを見る検査を足した`
29. Review Round 1 / `command.test.ts:87-114` は前後空白無しの `off` / `on` / `''` / `maybe` のみで、`command.ts:35` の `trim()` を消しても緑のまま
30. Review Round 1 / `fixed: 前後空白つきの on / off の検査を足した`
31. Review Round 1 / `settings.test.ts:118` は `JUDGE_QUESTION.criteria` の件数と閾値の位置のみで中身の `0:` / `1:` / `2:` を見ない。`questions.ts:51-55` を `['a', 'b', 'c']` に変えても緑のまま
32. Review Round 1 / `fixed: criteria の先頭の 0: / 1: / 2: を見る検査を足した`

## Triage

owner 確認済み。

- 1, 2: proposed (definition `plan-skill`): plan の `read` は子が自分で読んで照合してよい（consult の子を要求しない）。Slice 7 の Verify が `review` の子を指名したため worktree の子が実行できず、子は直接照合した。plan-skill に一行足す
- 3, 4: dropped (definition `intent-router.log`): acceptance で親が2ファイル読ませる発言で再走行し、judge が turn 1（score 1.04 / confidence 0.82）と turn 2（1.18 / 0.69）の2行を残すことを確認した。行の有無が往復数と閾値で揺れるのは `look` を合否にしない設計どおりで、残る穴はない
