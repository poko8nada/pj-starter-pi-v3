# Close 039

## Collected

### plan-format-colocation (ADR 01)

1. 66 / Plan review / 足した行が `## Files` の他の行と合っているかを、既定の 5 つが確かめません。 / left: 文が英語か 1 文かは、`grep` では見ない。レビューの `Noise` と owner の目で見る。
   - Doing: `format.md` の `## Files` に、置き場所・名前・写し方の 7 行を足した。
   - Left: 文の存在は `Added` の `grep` が見るが、英語か、1 文か、他の行と同じ調子かは見ない。`format:check` は md を整形するだけで、散文は読まない。
   - Cost: 2 文になった行や、調子の違う行が入っても、緑のまま通る。
2. 106 / Review Round 2 / 修正を確認いたしました — `### Round 1` の `Noise` の `fixed:`（4 行目の 1 文化）は直っております。
   - Doing: 4 行目を `Name a fixture ...` と `A helper that is not a double ...` の 2 行に分けた。
   - Left: Round 2 が、その修正を現物で確かめた。
   - Cost: 無し。
3. 108 / Review Round 2 / 修正を確認いたしました — `Doubts` 1 件目の `fixed:`（最終行の主語）は直っております。
   - Doing: 最終行を `Say how a double or a fixture behaves ...` に戻した。
   - Left: Round 2 が、その修正を現物で確かめた。
   - Cost: 無し。
4. 109 / Review Round 2 / 修正を確認いたしました — `Doubts` 2 件目の `fixed:`（`Added` の `grep` の網羅）は直っております。
   - Doing: `Added` の `grep` を、7 文すべての特徴的な句を見る形に広げた。
   - Left: Round 2 が、7 文との 1 対 1 の対応を確かめた。
   - Cost: 無し。

## Triage

- 1: dropped (ADR 01, Unit.test-run): 散文が英語で 1 文かを見る手が無い。レビューの `Noise` と owner の目で見る形で足りており、検査を足す重みが利得を超える。
- 2: dropped (ADR 01, Unit.test-run): Round 2 の確認で、直す所は無い。
- 3: dropped (ADR 01, Unit.test-run): 同上。
- 4: dropped (ADR 01, Unit.test-run): 同上。
