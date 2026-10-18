# Close 023

## Collected

### route-user-start (ADR 01 / Scope `Unit.intent-router`)

1. 159 / Review Round 1 / `pnpm-workspace.yaml:11` の `minimumReleaseAgeExclude` が `1.0.3` のままなのは気になったが、効果のない除外の残りで動作を変えず、plan も ADR も触らないと決めていない代わりに壊れてもいないので finding にしない。
   - Doing: dev の型を 1.3.0 に上げ、`minimumReleaseAgeExclude` も 1.3.0 に合わせた。
   - Left: 一覧が実際の版と合っているかを見る check は無い。
   - Cost: なし（`38aac80` で直した）。
2. 160 / Review Round 1 / `.pi/extensions/intent-router/README.md:7` と `.pi/extensions/intent-router/route/hook.ts:2-6` が `custom` 素通りに触れていないのは不完全だが、どちらも owner 発言の話として偽になっていないので stale とは見ない。
   - Doing: route の port と入口に、`custom` の走り出しを素通りさせる枝を入れた。
   - Left: README の Head の項目と `hook.ts` の頭のコメントは、`custom` を外すとは書いていない。
   - Cost: 次に route を読む者は、`custom` の走り出しで何が起きるかを README からは読めない。ADR と plan には書いてある。
3. 161 / Review Round 1 / `hook.ts:198` の `!== 'user'` と `=== 'custom'` の差は現 union（user/custom の 2 枝、ADR 決定）では等価で、区別するテストが無いのは仕様どおりなので finding にしない。
   - Doing: 入口の判定を `messageType !== 'user'` にした。
   - Left: pi が 3 つ目の `messageType` を足した時、その枝を通すかどうかは決めていない。
   - Cost: なし（route が分けるのは owner の発言だけなので、3 つ目が来ても素通りが正しい）。
4. 162 / Review Round 1 / 包みの `images: ev.images`（`index.ts:188`）の素通しを `index.test.ts` が assert していないが、route が `images` を読まないのは slice 2 の `_no case_` 決定どおりで観測差が出ないため finding にしない。
   - Doing: 包みで `user` の枝の `images` をそのまま渡した。
   - Left: `images` が渡ることを見る case は無い。
   - Cost: なし（route は `images` を読まない）。
5. 168 / Acceptance / `pnpm-workspace.yaml` の `minimumReleaseAgeExclude` は `Unplanned` で 1.3.0 に合わせたが、これを見る check が無い（`minimumReleaseAge` 自体が未設定なので、今は何もしない設定である）。`!== 'user'` と `=== 'custom'` は今は同じ意味だが、pi が 3 つ目の `messageType` を足した時にどちらが正しいかは決めていない。
   - Doing: 除外の一覧を 1.3.0 にし、そのあと `minimumReleaseAge: 1440` を明示した。
   - Left: 一覧と実際の版を突き合わせる check は無い。
   - Cost: bump の時に 1.3.0 の pin を直し忘れると、24 時間の待ちに当たって install が失敗する（黙っては通らない）。

## Triage

- 1: dropped (ADR 01 / `Unit.intent-router`): `38aac80` で 1.3.0 に合わせた。
- 2: dropped (ADR 01 / `Unit.intent-router`): どちらの文も偽ではなく、route が何をするかは ADR と plan にある。1 文足すために次の cycle の entry を立てる重さが勝つ。
- 3: dropped (ADR 01 / `Unit.intent-router`): route が分けるのは owner の発言だけなので、3 つ目の枝が来ても `!== 'user'` で素通りするのが正しい。決め直すことは無い。
- 4: dropped (ADR 01 / `Unit.intent-router`): 観測差が無い。
- 5: dropped (ADR 01 / `Unit.intent-router`): check を足す重さが勝つ。直し忘れは install の失敗として出るので、黙って腐らない。
