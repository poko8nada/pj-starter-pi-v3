# Close 054

## Collected

### 01 readme (ADR 01, 02)

1. 190 / Work Review Round 1 / scripts/product-ready/index.mjs:220とscripts/product-ready/index.mjs:281に同形の省略判定が重複しており、将来の変更でずれるおそれがあるが、この差分では挙動は一致する。 / left: 挙動は一致しているため、プランでは共通化をこの差分の責務を超えるとして見送る。
2. 192 / Work Review Round 1 / cycles/261104-054-dev/adr.md:118周辺の旧見出しの記述は変更前の実測で、当時の記録であるため、staleとして扱わない。 / left: 記録は当時の事実であるため、プランでは書き換えない。

### 02 cycle-rules (ADR 03, 05, 06)

3. 141 / Work Review Round 1 / `.pi/skills/work/SKILL.md:78` の `base` plan の look の行は、`ex-` の例外の記載がなく、新設の第4手順（`.pi/skills/work/SKILL.md:46`）とは見かけ上ずれて見えるが、lookの対象がない場合は適用外と読めるため、プランでは対象外として残す。
4. 142 / Work Review Round 1 / `.pi/skills/close/SKILL.md:102` の file と `.pi/skills/adr/SKILL.md:45` の table という語の違いは、status と cycles の語の一致を崩さないため、プランで変えないと決めた範囲として残す。
5. 143 / Work Review Round 1 / `rules/roadmap.md:12` の when more than one is present と More than one is allowed は重複に見えるが、新文の文体自体についての指摘であり、五視点のいずれにも属さないため、プランでは残す。
6. 144 / Work Review Round 1 / `ROADMAP.md:238` の 044などの記述と直近ログの旧形メッセージはサフィックス規則以前の履歴であり、過去を書き換えないと決めたため、プランでは残す。

### 03 close-names (ADR 04, 07)

7. 187 / Work Review Round 1 / 旧 `### <plan id>` 見出しの close.md を新しいスクリプトで再実行すると、`readContexts`（`.pi/skills/close/scripts/collect.mjs:330`）が `### <NN> <plan id>` だけを読むため、番号のない旧見出しの下の文脈が落ちる。理由: 計画は移行を扱わず、閉じたサイクルの再実行は通常ないため finding にしない。
8. 188 / Work Review Round 1 / `plan/` に `NN-` なしの `.md` が1件でもあると `collectCycle` 全体がエラーを投げる（`.pi/skills/close/scripts/collect.mjs:373`）。理由: `planName` がエラーを投げること自体は仕様であるが、全体が失敗することへの言及は計画になく、運用では `plan/` にplanのmdしか置かないため finding にしない。
9. 189 / Work Review Round 1 / `.pi/skills/close/scripts/collect.test.ts:83` の題名は「Triage 行がない close.md」であるが、実際は他のplanの行を持つ `closeWithTriage` で当該行の欠落を確かめている。理由: 計画の Step と同じ文であり、空の `## Triage` も同一経路（空のmap）を通るため finding にしない。
10. `.pi/skills/close/SKILL.md:85` / 通読 / close の手順 9（`ex-` のあとのトリアージ）は、手順 3 から 5 をもう一度走らせるとだけ書き、手順 8 のオーナーの判断が入っていない。

### ex-close-skill (ADR 03)

11. 163 / Work Review Round 1 / `01-ex-fix.md` のような `NN-` 付きの `ex-` の名前をどう扱うか。修正またはオーナーの判断が必要。理由: 現状 `planName` は `{ nn:'01', id:'ex-fix' }` を返し、`planRank` は ex- 欄に置き、`render` は `### 01 ex-fix` と `NN` 付きの見出しを ex- 欄に出すが、計画の Types の `Ex` は `NN` なしを定義し、Then は「見出しは `NN` のあるプランだけ `### <NN> <plan id>`」とする。`NN-` 付きの `ex-` にエラーを投げて止めるか、`NN` なしに直させるか決めておらず、プランでは解決できないため残す。 / left: 実装では `NN-` の付いた `ex-` の名前も受け付け、見出しにはその `NN` が付く。このサイクルの `ex-` のプランはどれも `NN-` を持たず、受け付けをやめるかは ADR の判断になる。

## Triage

- 1: _ex-plan_ ex-product-ready-once (ADR 02, Unit.product-ready): done ef0f2fa
  - Fact: `scripts/product-ready/index.mjs` では、「何が変わるか」を 2 か所で計算している。表示のためと書き込みのためである。両方に「すでに組み立て済みなら省く」判定があり、範囲が違う。
  - Why: プランが表示と書き込みを別々の手順として書いたため、実装が 2 か所で計算した。判定そのものもいらなかった。2 回目は `### Product` の段落がなく、ADR が決めた 3 つ目のエラー（段落が空）で止まる。
  - Then: プランでは判定を 2 か所とも消し、書き換える内容を 1 回だけ組み立て、表示と書き込みで共用する。2 回目のエラーを見る事例に変える。
- 2: dropped (ADR 01, Unit.usage-readme)
  - Fact: `adr.md:118` の旧見出しの記述は、変更前の実測である。
  - Why: 記録は当時の事実であるため、プランでは書き換えない。プランの `left:` も同じ判断をしている。
  - Then: なし
- 3: _ex-plan_ ex-close-skill (ADR 05, Unit.work-skill): done ff188cb
  - Fact: `work` のスキルの第 4 手順と、`close` のスキルの第 9・第 10 手順に、「`ex-` の `base` プランはオーナーの OK を待たない」という例外がある。`work` の第 7 手順（受け入れ）は 1 スライスごとにオーナーに見せるままで、同じファイルの 2 か所で違うことを言っている。
  - Why: 016 のメモの「`base` のプランならエージェントが自走する」は、worktree を作らずに `base` で走らせる意味であり、オーナーの OK の話ではない。
  - Then: プランでは 3 か所から例外を消し、`base` のプランは 1 スライスごとにオーナーに見せる形に戻す。
- 4: _ex-plan_ ex-close-skill (ADR 03, Unit.close-skill): done ff188cb
  - Fact: `adr` のスキルは `rules/roadmap.md` を「the table」、`close` のスキルは「the file」と呼んでいる。
  - Why: このサイクルの `cycle-rules` のプランが `adr` の側だけを「table」に変えたが、`close` の同じ文には及ばなかった。
  - Then: プランでは `close` のスキルの文を「The shape and the rules of the table are in `rules/roadmap.md`」にそろえる。
- 5: _ex-plan_ ex-roadmap-cycles-wording (ADR 03, Unit.close-skill): done fceaa8c
  - Fact: `rules/roadmap.md` の `cycles` の行が、同じことを 2 度書いている。「when more than one is present」と、元からある「More than one is allowed.」である。
  - Why: ADR 03 は最終形だけを決め、どのステージも今の行が何を言っているかを引用していない。
  - Then: 重複を 1 つにまとめ、`NNN-m`・`NNN-d`・`NNN-f` というサフィックスの頭文字と、`close` が番号を足す仕様を保つ。
- 6: dropped (ADR 06, Unit.work-skill)
  - Fact: `ROADMAP.md:238` の 044 の記述と直近のログの `update: NNN's` は、サフィックスの規則より前の履歴である。
  - Why: 履歴は書き換えないというこのサイクルの決定による。
  - Then: なし
- 7: dropped (ADR 07, Unit.close-skill)
  - Fact: 旧 `### <plan id>` 見出しの close.md を新しい `collect.mjs` で再実行すると、`readContexts` が `### <NN> <plan id>` だけを読むため、番号のない旧見出しの下の文脈が落ちる。
  - Why: 計画は移行を扱わないため、閉じたサイクルの再実行は通常ない。
  - Then: なし
- 8: dropped (ADR 07, Unit.close-skill)
  - Fact: `plan/` に `NN-` のない `.md` が 1 件でもあると、`collectCycle` 全体がエラーを投げる。
  - Why: `planName` がエラーを投げるのは仕様であり、運用では `plan/` にplanのmdだけを置くためである。
  - Then: なし
- 9: _ex-plan_ ex-close-skill (ADR 04, Unit.close-skill): done ff188cb
  - Fact: `collect.test.ts` の事例の題名は「Triage 行がない close.md」である。前提は `ex-fix` の行を持つ `closeWithTriage` で、欠けているのは `ex-missing` の行だけである。
  - Why: ADR 04 は主語を行に置いた。プランの事例文は主語をファイルに置き換えており、空の `## Triage` と「その plan の行がない」が同じ語にまとまってしまった。
  - Then: プランでは空の `## Triage` の前提に変え、`ADR 未特定` という断言を残す。
- 10: _ex-plan_ ex-close-rewrite (ADR 03, Unit.close-skill): done aa3e802
  - Fact: `close` のスキルは、手順に継ぎ足しが重なっている。手順 9 は「手順 3 から 5 をもう一度走らせ、残りの宛先を提案する」とだけ書き、4 の消すことと 8 の判断を名指ししていないため、同じ 1 か所で 2 回、ステージを落とした。
  - Why: 1 つの文が複数のステージをまとめて数字で指し、再実行のときにその中身が抜ける。まとめた文と、数字の先のステージが離れているからである。
  - Then: `close/SKILL.md` の全体と `close/references/format.md` のセクションを、次の 4 つで書き直す。(1) 残りの状態の表を先に置く。(2) 手順は状態の移り変わりとし、入る状態・何をするか・出る状態・誰が決めるかの 4 つを持つ。(3) 数字で他の手順を指さない。(4) `close.md` のセクションを、ステージと同じにする。
- 11: dropped (ADR 07, Unit.close-skill)
  - Fact: `planName` は `NN-` の規則を先に見るため、`01-ex-fix.md` のような番号付きの `ex-` も受け付け、見出しに `NN` が付く。明示的に許す行は無く、規則が禁じていないだけである。
  - Why: 動作は壊れず、番号付きの `ex-` が `plan/` に無ければ見えない。明示の規則を足すより、いまの 2 つの規則のままで足りる。
  - Then: なし

## Verified

### Unit.usage-readme

- Plans: 01 readme, ex-readme-item-shape, ex-review-and-cases
- Result: しない — 既に確認済み（オーナー）

### Unit.product-ready

- Plans: 01 readme, ex-product-ready-once
- Result: OK

### Unit.adr-skill

- Plans: 02 cycle-rules, ex-close-skill
- Result: しない — 既に確認済み（オーナー）

### Unit.close-skill

- Plans: 02 cycle-rules, 03 close-names, ex-close-skill, ex-review-and-cases, ex-plan-cut, ex-close-rewrite
- Result: OK — この close を手順どおりに最後まで走らせた

### Unit.work-skill

- Plans: 02 cycle-rules, ex-close-skill, ex-review-and-cases, ex-plan-cut
- Result: しない — 既に確認済み（オーナー）

### Unit.plan-skill

- Plans: 03 close-names, ex-close-skill, ex-plan-cut
- Result: しない — 既に確認済み（オーナー）
