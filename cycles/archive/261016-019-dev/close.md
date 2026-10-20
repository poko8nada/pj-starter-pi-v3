# Close 019

## Collected

### consult-vocabulary (ADR 01, 02, 03, 04, 05 / Scope `Unit.subagent-consult`)

1. 242 / Slice 2 (呼び方を揃える) / 道の親子（`run/worktree.test.ts:204,508` の `親ディレクトリ`）はエージェントを指していないので `親` が残る / left: 道の親子は呼び方の対象外のため（エージェント/サブエージェント・ベース/worktree のいずれでもない）
   - Doing: エージェントを指す `子` / `親` の語を `サブエージェント` / `メインエージェント` に揃え、`grep -rn "親" .pi/extensions/consult` が 0 件になることを見ていた
   - Left: `親ディレクトリ` はパスの親子で、エージェントを指していない。この 2 行だけを残す形に Verify を直して閉じた
   - Cost: ほとんど無い。`親` の語が `.pi/extensions/consult/run/worktree.test.ts` のコメント 2 行に残る
2. 262 / Slice 5 (統合: 呼び方が 1 つになっている) / 旧形破棄のテスト（`run/log.test.ts:207,208`）は旧欄名 `child` を字面に含むので `child` の grep に 2 行残る / left: 旧形を受けないことを示すには旧欄名を書くしかないため（書く側・読む側は `subagent` で揃っている）
   - Doing: 残る呼び方を数え、`.pi/extensions/consult` に `node:child_process` と spawn の locals だけが残ることを見ていた
   - Left: 旧形の行が読めないことを示すには、旧欄名を字面に書くしかない
   - Cost: ほとんど無い。増える `child` は `run/log.test.ts` の 1 つの case の字面だけ
3. 293 / Review Round 1 / `cycles/261016-019-dev/plan/consult-vocabulary.md:135`（slice 1 と同じ本数 + 1 が緑）は本数自体を自動で押さえない。旧形破棄の 1 本 `.pi/extensions/consult/run/log.test.ts:207,208` を消しても残りは緑のまま。 / left: 本数を vitest で自動化する仕組みが無いため。旧形破棄の case 自体はあり、削除は差分で見るしかないので close に残す
   - Doing: slice 2 の Verify は「slice 1 と同じ本数 + 1」が緑であることを見ていた
   - Left: テストの本数を自動で固定する仕組みが無い。旧形破棄の case を消しても他のテストは緑のまま
   - Cost: 小さい。case を消す変更は diff に出る
4. 298 / Review Round 1 / 旧記録（`child` 欄）の破棄が走行中の引継ぎに何を起こすか、前提が疑わしい。`.pi/extensions/consult/run/log.ts:103-108` と `cycles/261016-019-dev/plan/consult-vocabulary.md:121,142`（古い `child` は受けない、ADR 05 の決定）では、上げ前後にまたがる走行中サブエージェントが一覧から消える扱いになるが、移行も両受けもしない理由の検討が見えない。finding ではなく設計への疑い。
   - Doing: `parseRun` の必須の欄を `subagent` にし、ADR 05 の決定どおり古い `child` を受けない形にした
   - Left: 上げる瞬間に走っているサブエージェントが居ないことを確かめて捨てる形にした（移行も両受けもしない）
   - Cost: 上げる瞬間に走っている子が居た場合、その子は一覧に出ず止められない。ADR 05 の確かめはその場の事実に乗っている
5. 299 / Review Round 1 / 改名の外側への波及の受口が疑わしい。`.pi/extensions/consult/index.ts:172` の登録名変更に対し `cycles/261016-019-dev/plan/consult-vocabulary.md:159` は実行中セッションは旧名のまま・次回起動で新名として何もしないが、外側の自動化や手順書が旧名を呼ぶ場合の壊れをどこで受けるかの前提が見えない。finding ではなく前提への疑い。
   - Doing: 登録名を `consult_subagents` にし、外への受口は「実行中のセッションは `/reload` まで古い名前、次回の起動は新しい名前」とした
   - Left: ADR 05 の洗い出しで、この repo のスキルと `intent-router` は `consult_run` / `consult_worktree` しか呼ばないと確かめた
   - Cost: 古い名前を呼ぶ外側（この repo の外のメモや手順）は、その名前を呼んだ時に「そんなツールは無い」で気づく
6. 300 / Review Round 1 / spawn locals の `child` 残しの線引きが疑わしい。`.pi/extensions/consult/run/run.ts:191` の `killChild` 等を残すことは `cycles/261016-019-dev/plan/consult-vocabulary.md:114,140` で決めているが、将来の読み手が Node の `child_process` の子とサブエージェントの子のどちらの `child` か誤読する余地が残る。finding ではなく言葉の設計への疑い。
   - Doing: `run/run.ts` の spawn が返す物の locals（`killChild`、`child.stdout` など）は `node:child_process` と同じ語として残した
   - Left: ADR 01 の「残す呼び方」に入れ、エージェントを指していないことを記録した
   - Cost: 将来の読み手が、Node の子プロセスとサブエージェントの子を取り違える余地が少し残る
7. 327 / Acceptance / `memo/` の case（slice 5 の `git diff --name-only -- memo/consult-vocabulary.md`）は untracked のため、どこでも赤にならない。`memo/` は worktree からも触れないので、この行はそもそも振る舞いを持たない
   - Doing: `memo/consult-vocabulary.md` を触らないことを `git diff --name-only` で見る case を足した
   - Left: `memo/` は untracked で worktree にも無いので、この case は振る舞いを持たない
   - Cost: 無い。memo はこの close で消える
8. 328 / Acceptance / 旧記録（`child` 欄）を捨てる前提は「上げる瞬間に走っているサブエージェントが居ない」ことに乗っている。ADR 05 で確かめたが、次に同じ形の改名をするときも同じ確認が要る
   - Doing: 同上（旧記録を捨てる決定の前提）
   - Left: ADR 05 で確かめた（今日と昨日の記録に、終わっていない行も `notice` の行も無い）
   - Cost: 次に記録の欄の名前を変えるときも、同じ確かめが要る

## Triage

- 1: dropped (ADR 01 / `Unit.subagent-consult`): 道の親子はエージェントではないので、`親ディレクトリ` は変えない物として残す。直す所が無い
- 2: dropped (ADR 05 / `Unit.subagent-consult`): 旧形の case の字面は、旧欄名を受けないことを示すために要る
- 3: dropped (ADR 01 / `Unit.subagent-consult`): 本数の自動化は仕組みが無い。case の削除は diff に出る
- 4: dropped (ADR 05 / `Unit.subagent-consult`): ADR 05 で「走っている子も届け待ちの知らせも無い」ことを確かめて決めた。前提はその場の事実で、いま直す所が無い
- 5: dropped (ADR 05 / `Unit.subagent-consult`): 洗い出しで、この repo で古い名前を呼ぶ所は無いと確かめた。外は使う時に気づく
- 6: dropped (ADR 01 / `Unit.subagent-consult`): Node の `child_process` の語で、`killChild(child: ReturnType<typeof spawn>)` の型が何の handle かをすでに書いている。取り違えは仮定の話で、そのために次のサイクルを使うのは重い
- 7: dropped (ADR 05 / `Unit.subagent-consult`): memo はこの close で消える。case は振る舞いを持たない
- 8: dropped (ADR 05 / `Unit.subagent-consult`): 4 と同じ前提で、ADR 05 で確かめ済み
