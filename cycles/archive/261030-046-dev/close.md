# Close 046

## Collected

### readme-format (ADR 01, 03)

1. 62 / Review Round 1 / `git diff 12408e2..HEAD` の変更は `rules/readme.format.md` のみで、`scripts/product-ready/index.test.ts:187,189` の既存検査は ADR と design が決めた見出しのため Noise と Unproven の対象外である。
   - Doing: 2 つの雛形ブロックを 8 行にし、`scripts/product-ready/index.test.ts:187` と `:189` の見出しの検査を緑のまま残した。
   - Left: `index.test.ts` が固定するのは `## What is in it` と `## 入っているもの` の 2 行だけで、残り 6 行とバッジの行はエージェントが読み合わせで確かめた。
   - Cost: `rules/readme.format.md:9-25` と `:31-47` の残り 6 行が後で崩れても、テストは緑のままになる。
2. 63 / Review Round 1 / `rules/readme.format.md:7,29,54-56` の説明文と `## Writing` の追加 3 行は自動検査が無く差分を目視で確かめたが、文言は ADR と design が決めた値のため finding ではない。
   - Doing: ブロックの前の説明文に「`<...>` は埋める場所」と「言語ごとに書く」を残し、`## Writing` にバッジの規則と `## Getting started` の規則を 3 行加えた。
   - Left: 説明文と `## Writing` の 3 行に自動検査がなく、エージェントが差分を目視で確かめた。
   - Cost: `rules/readme.format.md:54-56` の規則が後で消えても、テストは緑のままになる。
3. 64 / Review Round 1 / `README.md:33,47,56` と `README.ja.md:33,47,56` に旧見出しが残るが、`design.md` の `starter-readme` が持ち Non-goal で変えないと定めるため、この diff が古くしたものではない。
   - Doing: `readme-format` は `rules/readme.format.md` だけを変え、スターター自身の README は変えないと決めた。
   - Left: このプランは `README.md` と `README.ja.md` を変えないので、3 つの旧見出しはそのまま残った。
   - Cost: 無い。`starter-readme` が同じ位置に `## Checks`、`## Harness`、`## Cycle` をプロダクトのセクションとして置いており、すでに解消している。

### starter-readme (ADR 02)

4. 87 / Review Round 1 / `## Cycle`／`## サイクル` の 6 行は SKILL.md:3 の description の後半だけを写し、前半の Use when … を落としているが、検査の「合う」がそれを許すのかは読み切れない（README.md:63、.pi/skills/adr/SKILL.md:3）。
   - Doing: `## Cycle` と `## サイクル` の 6 行を、`.pi/skills/*/SKILL.md:3` の `description` の後半（何をするか）に合わせた。
   - Left: `description` の前半の「Use when ...」を落とした。ADR の「合わせる」がその 1 文まで指すかは決まっていなかった。
   - Cost: README だけを読む人は、そのセクションをいつ開くかを知らない。セクションの一覧としては、何をするかが先に必要である。

### ex-format-guard (ADR 01)

5. 57 / Review Round 1 / `scripts/product-ready/readme-format.test.ts:48-71` の `blockUnder` は `scripts/product-ready/index.mjs:19-42` の写しで、将来ずれる。8 行一致が挙動を保つ。
   - Doing: 新しいテストに、雛形ブロックを取り出す `blockUnder` を、`scripts/product-ready/index.mjs:19-42` から写して用意した。
   - Left: `index.mjs` は読み込むとエントリーポイントが実行されるため、テストから読み込めないため写した。
   - Cost: `index.mjs` の `blockUnder` が変わると写しが取り残される。8 行一致の検査は緑のままなので、テストが実態と異なる結果を示す。
6. 58 / Review Round 1 / `scripts/product-ready/readme-format.test.ts:73-87` の `sectionBody` は `scripts/product-ready/index.mjs:51-64` の `sectionOf` と形が違い、将来ずれる。6 行一致が挙動を保つ。
   - Doing: `## Writing` のセクションを取り出す `sectionBody` を書いた。
   - Left: `index.mjs:51-64` の `sectionOf` と形が異なり、同じ目的の関数が 2 つになった。
   - Cost: 片方だけが直されると、テストと本体でセクションの切り方が変わる。
7. 59 / Review Round 1 / `scripts/product-ready/readme-format.test.ts:11` の `process.cwd()` は、起動位置がルートであることを仮定する。`vitest --root` ではずれる可能性がある。
   - Doing: テストは `process.cwd()` を起点に `rules/` を読む。`scripts/product-ready/index.test.ts:11` と同じ形にした。
   - Left: テストは起動位置がルートであることを前提としている。
   - Cost: `vitest --root` などで起動すると、テストが別の場所を読む。
8. 60 / Review Round 1 / `scripts/product-ready/readme-format.test.ts:154`、`:159`、`:164`、`:172` の `replace` は最初の 1 件だけを変える。将来の重複で、別の箇所を変える可能性がある。
   - Doing: 5 つの検査のうち 4 つは、実際の文字列を `replace` で 1 箇所だけ変えた写しを渡し、失敗することを確かめる。
   - Left: `replace` は最初の 1 件だけを変える。
   - Cost: 同じ文字列が将来 2 箇所に増えると、変わる箇所が意図とずれ、検査が意図と異なる結果になる。

### ex-guard-helpers (ADR 01)

9. 83 / Review Round 2 / 修正を確認いたしました — `scripts/product-ready/readme-format.test.ts:48` の `fixed:`（重複した `FENCE` と、それを用いるフェンスの検査と `## Usage` の検査を落とした）は直っております。現行 `readme-format.test.ts` に `const FENCE` はなく、`function blockUnder|sectionOf|sectionBody` の `grep` は `scripts/product-ready/blocks.mjs:4` ・ `:14` ・ `:46` の 3 行のみであります。フェンス件は `readme-format.test.ts:134-137` が `withLine` で ` ``` ` を挿入し、`readChecked:64-90` の 8 行完全一致（`sameLines:52-62` と `nonEmptyLines:48-50`）で落とす構造であります。
   - Doing: テストから、重複した `FENCE` と、それを使うフェンスの検査と `## Usage` の検査を落とした。
   - Left: 何も残っていない。
   - Cost: 無い。指摘の解消を確かめた。
10. 84 / Review Round 2 / 修正を確認いたしました — `scripts/product-ready/readme-format.test.ts:13` の `fixed:`（注釈の言い換え）は直っております。現行 `:13` は「このファイルの道からルートを出す（起動位置に依存しない）。」であります。
    - Doing: 注釈を「このファイルのパスからルートを求める（起動位置に依存しない）」に直した。
    - Left: 何も残っていない。
    - Cost: 無い。指摘の解消を確かめた。
11. 85 / Review Round 2 / `scripts/product-ready/readme-format.test.ts:14-15` の `fixed:`（作業ディレクトリを変えた証明と `Ran` 記載）は、コードは直っているが記録が確認できません。現行 `:14-15` は `import.meta.url` 化（`HERE` と `FORMAT_AT`）で `process.cwd()` の `grep` は 0 件、`withLine:97-105` は対象行がちょうど 1 つでなければ投げる構造であります。一方、現行 `## Acceptance` の `Ran` に作業ディレクトリを変えた実行（`scripts/product-ready` からの `vitest` 5 件緑）の記載がなく、「`Ran` に書いた」は確認できません。 / left: 作業ディレクトリを変えた証明の `Ran` 記載が残っておらず、証明の記録としては閉じていないため、close で残りとして読む。
    - Doing: `fixed:` に「`Ran` に書いた」と書いたが、`Ran` に書いていなかった。
    - Left: 記録の食い違いを残したまま、`Round 2` を実施した。
    - Cost: 無い。`48f38ad` で `Ran` の末尾にその実行を加え、記録を直した。

## Triage

- 1: ex-plan ex-format-guard (ADR 01, `Unit.product-ready`): done 2e22192
- 2: ex-plan ex-format-guard (ADR 01, `Unit.usage-readme`): done 2e22192
- 3: dropped (ADR 02, `Unit.usage-readme`): `starter-readme` が同じ 3 つの見出しをプロダクトのセクションとして置き、すでに解消している。
- 4: ex-plan ex-cycle-trigger (ADR 02, `Unit.usage-readme`): done 5ad86d6
- 5: ex-plan ex-guard-helpers (ADR 01, 03, `Unit.product-ready`): done 48f38ad
- 6: ex-plan ex-guard-helpers (ADR 01, 03, `Unit.product-ready`): done 48f38ad
- 7: ex-plan ex-guard-helpers (ADR 01, 03, `Unit.product-ready`): done 48f38ad
- 8: ex-plan ex-guard-helpers (ADR 01, 03, `Unit.product-ready`): done 48f38ad
- 9: dropped (ADR 01, 03, `Unit.product-ready`): `ex-guard-helpers` が直し、指摘の解消を確かめた。
- 10: dropped (ADR 01, 03, `Unit.product-ready`): `ex-guard-helpers` が直し、指摘の解消を確かめた。
- 11: dropped (ADR 01, 03, `Unit.product-ready`): `48f38ad` で `Ran` に実行を加え、記録を直した。
