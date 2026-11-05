# Close 055

## Collected

なし

## Triage

- 1: _ex-plan_ ex-readme-exclude-wording (ADR 01, Unit.usage-readme): done ba76678
  - Fact: `README.md:50` は `exclude` が設定ファイルのものだと書いておらず、`README.ja.md:50` の「設定の `exclude`」と食い違っている。どちらも `scripts/checks/ja-check.json` を挙げていない。
  - Why: このサイクルで書き換えた README の 1 行であり、英語だけを読む人は、どのファイルの `exclude` なのかを推測することになる。1 つのプランで直せる。
  - Then: 両方の記述を「`scripts/checks/ja-check.json` の `exclude` に書いたパスは検査しない」にそろえる。
- 2: dropped (ADR 01, Unit.japanese-check)
  - Fact: `scripts/checks/ja-check.json:71` の `exclude` だけが 1 行にまとめられており、`exception` は 1 語ごとに 1 行に分けて書かれている。
  - Why: `oxfmt` はどちらの形も許容し、読む人が受ける影響は見た目だけである。直す手間のほうが、残すことで受ける不利益より大きい。
  - Then: なし
- 3: _ex-plan_ ex-exclude-test-cases (ADR 01, Unit.japanese-check): done 3262ec2
  - Fact: `exclude` の happy 4 件は `describe('ja-check exclude')` に、error 3 件は既存の `describe('ja-check')` に入っている。分けたのは lint の行数の制約による。
  - Why: `exclude` という語では 1 つの機能でありながら、事例を探すのに 2 か所を見る必要がある。
  - Then: `exclude` の error 3 件を `describe('ja-check exclude')` に移し、2 つ目の `describe('ja-check')` から `exclude` の語を消す。移した後は 8 件で、240 行には当たらない。
- 4: _ex-plan_ ex-exclude-test-cases (ADR 01, Unit.japanese-check): done 3262ec2
  - Fact: `./` を付けたパスの事例がテストにない。この事例はプランの `Steps` にあるが、テストの整理で省いた。ADR のリサーチは、Lefthook が `./` を付けるかどうかを確認していない。
  - Why: 除外の判定は Lefthook が渡すパスの形に依存する。`./` 付きの事例が 1 本あれば、その形が変わったときに気づける。
  - Then: `(happy) excludeがROADMAP.mdで引数が./ROADMAP.md → 報告せずexit 0` を追加する。

## Verified

### japanese-check

- Plans: 01 ja-check-exclude, ex-readme-exclude-wording, ex-exclude-test-cases
- Result: OK

### lefthook-gate

- Plans: 01 ja-check-exclude
- Result: しない — `japanese-check` の検証で `ja-check` が動くことを確認済みであるため。
