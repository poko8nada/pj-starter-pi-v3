# Close 018

## Collected

### harness-copy (ADR 01, 03 / Scope `Unit.harness-copy`(added))

1. 276 / Review Round 1 / `--root=<dir>` の形を受け付けることが Steps に無い
   - Doing: 引数の解釈（`parseArgs`）を書いていた。Steps にあるのは `--root <dir>` で、実装は `--root=<dir>` も受けていた。
   - Left: 振る舞いが変わらず、plan の `Verify` も `--root` の 1 形で書かれていたので、finding にしないと判断した。
   - Cost: 実装の受け口が文書より 1 つ広い。読む人は Steps と `scripts/harness.mjs` の両方を見ないと、受け付ける形の全体を知れない。
2. 277 / Review Round 1 / `copy` の中身比較が plan の Types（源にある全部）と違う
   - Doing: `diffSides` で `copy` を「源にある全部」としていた。
   - Left: 実装は中身が同じファイルを写さない形になり、slice 3 の「2 回目の `--run` が空」がその振る舞いを押さえているので、finding にしないと判断した。
   - Cost: 写す量が減るので実害は無い。Types の文と実装が離れている分だけ、読む人が 2 つを突き合わせる。
3. 287 / Acceptance / 一覧の `skip` の `logs` と、コードの常時 `skipNames` の `logs` が重複
   - Doing: 一覧の `skip` と、コードの `skipNames`（`logs`、`node_modules`、`.git`）の両方で除外していた。
   - Left: close で見る、と受け入れの `Doubts` に書いて、ここへ送った。
   - Cost: 同じ規則が 2 か所にある。片方を消しても他方が効くので、検査では気づけない。

### harness-tests (ADR 02 / Scope `Unit.product-ready`)

4. 245 / Review Round 1 / CLI の入口ガードを変えた後の、口としての動作を確かめる検査が無い
   - Doing: `scripts/harness.mjs` の底の `main` 呼び出しを、直接実行のときだけ走るガードに変えていた（`scripts/harness-state.mjs` が import するため）。
   - Left: `scripts/harness.test.ts` の 31 件が子プロセスで `node scripts/harness.mjs` を回しており、口は押さえられている、と `left:` に書いた。
   - Cost: 無い。ガードの条件は、子プロセスの起動で毎回通る。
5. 250 / Review Round 1 / `test/README.md:7` の「開始時は0本」が現行とずれて読める
   - Doing: `product:ready` の切り替えを書いていた（テストは消さず、`product` では回さない）。
   - Left: plan の `Files` に `test/README.md` が無く、確度が足りないとして finding にしなかった。
   - Cost: `test/README.md` は「テストはプロダクトがゼロから書く。開始時は0本」と言い続ける。プロダクトの初期状態は「ハーネスのテストが残っていて、既定では回らない」なので、読む人はこの 1 行で迷う。
6. 251 / Review Round 1 / `scripts/harness.mjs` が `Files` では動詞なしだが diff が変えた
   - Doing: `harness.mjs` は plan の `Files` に、追随する物として載っていた。
   - Left: slice 2 の `Unplanned` に記録があり、`Unlisted` の所見にはしないと判断した。
   - Cost: 無い。記録に残っている。
7. 252 / Review Round 1 / repo の一覧の検査が `contains` だけで、状態のファイルが `copy` に無いことを見ない
   - Doing: 状態のファイルと `includeList` を書いていた。
   - Left: plan の `Verify` も `contains` で書いており、所見にしないと判断した。
   - Cost: `scripts/harness.json` の `copy` に状態のファイルが紛れても、検査は緑のままになる。配れば、プロダクトの状態がスターターの物に戻る。
8. 253 / Review Round 1 / `--only cycles` の検査が filtering の故障でも緑のまま
   - Doing: `product:ready` の label の絞り込みを書いていた。
   - Left: `--only harness` の検査が filtering を見るので、所見にしないと判断した。
   - Cost: 無い。filtering は別の検査が見ている。
9. 259 / Acceptance / 壊れた状態の JSON 不正の変種が無い
   - Doing: 状態の読み（`readMode`）の失敗の検査を書いていた。
   - Left: 同じ `catch` を通るので変種は足さない、と受け入れの `Doubts` に書いた。
   - Cost: 無い。値不正と JSON 不正は同じ 1 つの出口を通る。

## Triage

- 1: dropped (Unit.harness-copy): 受け付ける形が 1 つ広いだけで、振る舞いも検査も変わらない。直すのは Steps と実装の文を揃える仕事になり、割に合わない
- 2: dropped (Unit.harness-copy): 中身が同じ物を写さない方が軽く、検査（2 回目の `--run` が空）が押さえている。Types の文は閉じた記録の中にある
- 3: dropped (Unit.harness-copy): 2 か所は意味が違う（一覧 = ハーネスが配る規則、コード = 一覧が変わっても効く構造の側）。片方に寄せる仕事は、名前を 1 つ動かすだけになる
- 4: dropped (Unit.harness-copy): 口の検査は既にある（`scripts/harness.test.ts` が子プロセスで `node scripts/harness.mjs` を回す）
- 5: done 2de1c10 (Unit.test-run): owner の指示で ex-plan を立てず、この close の中で直した。`test/README.md:7` を「テストはプロダクトが自分の分を書く。ハーネスのテストは残っていて、`product` では既定で回らない」にした
- 6: dropped (Unit.harness-copy): 記録に残っている
- 7: dropped (Unit.harness-copy): 「一覧の `copy` に状態のファイルが紛れたら」という仮の話。`copy` は名指しの一覧で、レビューが読む所
- 8: dropped (Unit.product-ready): filtering は `--only harness` の検査が見ている
- 9: dropped (Unit.product-ready): JSON 不正と値不正は同じ出口を通る
