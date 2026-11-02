# ADR 039

## 01: テストのダブルとフィクスチャを、どこに置くか

### Context

- 038 で `format.md` の `## Test cases` に従い、6 本のダブルとフィクスチャを `test/` に平らに置いた。
- `format.md:101` は「`test/` is where the doubles live」とだけ書き、機能ごとの置き場所を定めていない。
- 先例は `test/temp-dir.ts` の 1 本だけで、`scripts/harness/harness.json` の `copy` が名指しで写していた。
- owner は `test/` の平らな並びを見て、それぞれのフィクスチャは自分の機能の隣にあるべきだと考えた。
- `copy` は `.pi` を丸ごと写し、`test/temp-dir.ts` だけを名指しで写す。`test/` のフィクスチャは写らない。
- `.pi` のテストは `test/*-fixture.ts` を import する。だから採用先では、写ったテストが写らなかったフィクスチャを読もうとして型検査が赤くなる。
- この穴は、いまのリポジトリに空いている。038 の close は 38 行を集めたが、この行は出していない。

### Scope

- 変更:
  - behaviour: in — フィクスチャの置き場所と名前が変わる。テストのケースは変えない。
  - refactor: in — 6 本を移し、33 本の import を直す。
  - dependency: out — 新しい依存は無い。
  - naming: in — `*.fixture.ts` に揃える。
  - format: in — `format.md` の `## Test cases` に、置き場所と写し方の規則を足す。
  - prose: out — 規則の文面以外は変えない。
- 品質:
  - compatibility: in — 製品の振る舞いは変えない。変わるのは `harness.json` の `copy` の 2 行だけ。
  - speed: out — テストの実行時間は変えない。
  - security: out — 新しい入力面が無い。
  - errors: out — 失敗の道は変えない。
- 運用:
  - deploy: out — deploy は無い。
  - migration: out — 移行は無い。
  - logs and monitoring: out — 記録は変えない。

### Research & Trial

- フィクスチャは 6 本で、33 本のテストが読む。
- `test/pi-fixture.ts` は 2 つの機能が読み（thinking-scrub 2 本、context-prune 3 本）、`test/scripts-fixture.ts` は 3 つの Unit が読む（type-check、harness-copy、product-ready）。残る 4 本は 1 つの機能だけが読む。
- import の深さは 3 か 4 で、`../../../../test/...` になる。
- `scripts/harness/index.mjs` の `copy` は、差を取るために歩く道の一覧で、`skip` は歩く時に無視する名前、`legacy` は古い道。
- `scripts/harness/list.mjs:26` の `harnessExcludes` は、`copy` の各項目から `<道>` と `<道>/**` の 2 つを作る。`"test"` を `copy` に入れると、採用先の `test/` も除外され、`pull --run` で starter に無いファイルが消える。
- 移した後、`test/` に残るのは 3 本（`temp-dir.ts`、`pi.fixture.ts`、`scripts.fixture.ts`）。
- `vitest` が集めるのは `*.test.*` と `*.spec.*` だけなので、`*.fixture.ts` はテストとして数えられない。
- `.oxlintrc.json:90` の緩和は `*.test.*` にだけ当たる。`*.fixture.ts` は当たらず、1 ファイル 480 行と 1 関数 80 行の制限をそのまま受ける。

### Decision

- Status: **accepted**
- Adopted:
  - **C**: フィクスチャは、その形を持つ機能の隣に置く。機能が持たない形（ホスト、OS、複数の Unit が共有する書式）は `test/` に置く。名前は場所によらず `*.fixture.ts` に揃える（`temp-dir.ts` は偽物ではなく補助なので例外）。`test/` に残る 2 本は `copy` に名指しで足す。`test/` のファイルが `copy` にあることを見る検査を 1 つ置く。
- Options:
  - **A**: 6 本を `test/` に平らに置いたままにする。買うもの: 偽物が 1 か所に集まる。コスト: 機能から遠く、import が 4 階層になる。採用先でフィクスチャが写らない穴も残る。成り立たない所: owner が平らな並びを誤りとした。
  - **B**: `copy` に `"test"` を丸ごと入れる。買うもの: 1 行で穴が閉じ、将来も忘れない。コスト: `test/` がハーネスの持ち物になり、採用先の `test/` のテストが走らず、`pull --run` で消える。成り立たない所: `test/` は共有の場所であるべき、という owner の判断。

### Definition

- `Unit.test-run`(kept): 壊れた振る舞いの指摘を受け取る main function は同じ。フィクスチャの置き場所と、写る物の規則が変わるのは check。
- `Unit.harness-copy`(kept): ハーネスを取り込み、戻せる main function は同じ。`copy` に 2 行が増えるのは、何を写すかの範囲。
- `Unit.subagent-consult`(kept): コンサルを走らせる main function は同じ。consult のフィクスチャが隣へ移るのは、テストの置き場所。
- `Unit.context-prune`(kept): 古いツール結果を文脈から外す main function は同じ。prune のフィクスチャが隣へ移るのは、テストの置き場所。
- `Unit.thinking-scrub`(kept): ループした thinking を持ち越さない main function は同じ。scrub のフィクスチャが隣へ移るのは、テストの置き場所。
- `Unit.close-skill`(kept): サイクルを閉じる main function は同じ。collect のフィクスチャが隣へ移るのは、テストの置き場所。
