# Close 049

## Collected

### harness-transport (ADR 01, 02, 03)

1. 223 / Work Review Round 1 / `~foo` (斜線なし) は `scripts/harness/index.mjs:83` で `HOME/foo` に開き `scripts/harness/index.test.ts:568` がそれを確かめる。シェル的な `~user` と同じかは不明だが、計画は `~`→`HOME` だけを決めるので所見に留める。
2. 89 / 3.一覧と運搬の書き換え / `resolveStarter` (`scripts/harness/index.mjs:80-96`) が、純粋な解決 (81-88、92-95) と `fs.existsSync` (89) を同じ関数に置く。`diffSides` (`scripts/harness/index.mjs:207-229`) は、「(純)」と書いたコメント (200) のまま `fs.readFileSync` (218-219) で読む。AGENTS.md の「純粋な計算と副作用を同じ関数に混ぜない」に反する。
3. 91 / 3.一覧と運搬の書き換え / `collect` (`scripts/harness/index.mjs:124-197`) が、ファイルの枝 (161-165) とディレクトリの枝 (166-191) で、`globSync`、`isExcluded`、`statSync`、`files.push` を二度書いている。
4. - / ADR / ROADMAP 007 の ideas の「dir整理が必要」(`ROADMAP.md:78`) が、ADR、design、plan のどこにもない。スプリットでは 3 番目のエントリだったが、`道`から`パス`へのエントリに番号を譲って消えた。

### ex-harness-structure (ADR 01)

2. 231 / Acceptance / `Added` の `.git/b.js` の側は、この環境の権限が `**/.git/**` への書き込みを拒むため、私は書捨てのツリーに作れなかった。サブエージェントは作って確かめており、単体テスト (`collect` の `node_modules` と `.git`) も両方を被っている

## Triage

- 1: dropped (ADR 03, `starter` のパスの解決)
  - Fact: `resolveStarter` は `~` で始まる値を `HOME` と残りに開く。`~foo` (斜線なし) も `HOME/foo` になり、`scripts/harness/path/index.test.ts` がそれを確かめる。一覧の `starter` は `~/...` の形で書く。
  - Why: `~user` を支えるには、存在しない user をどう扱うかを決めることになり、直す重みが利点を上回る。書く形は `~/...` に限られている。
  - Then: なし
- 2: dropped (ADR 01, ハーネスの運搬)
  - Fact: `Added` の `.git` 側は、私の環境の権限が `**/.git/**` への書き込みを拒むため、書捨てのツリーで作れなかった。サブエージェントは作って確かめており、`scripts/harness/collect/index.test.ts` が `node_modules` と `.git` の両方を被っている。
  - Why: 製品の穴ではなく、確かめた場所の制約である。振る舞いは単体テストと 1 度の実地で被っている。
  - Then: なし
- 3: ex-plan ex-harness-structure (ADR 01, `Scope` の `refactor: in`): done 0a4994c
  - Fact: `resolvePath` (純) と `resolveStarter` (境界)、`diffPaths` (純) と `sameFile` (境界) に分かれ、`diffSides` と「(純)」と書いたコメントは消えた。
  - Why: `refactor: in` が求めた「純粋な計算と副作用を同じ関数に混ぜない」形になった。
  - Then: なし (マージ済み)
- 4: ex-plan ex-harness-structure (ADR 01, `Scope` の `refactor: in`): done 0a4994c
  - Fact: `collect` は項目ごとに `fs.globSync` を 1 回だけ呼び、絞り込み、相対パスへの変換、重複の除去は `toPaths` に寄せた。
  - Why: ファイルの枝とディレクトリの枝の二度書きが消えた。
  - Then: なし (マージ済み)
- 5: ex-plan ex-harness-structure (ADR 01, `Scope` の `refactor: in`): done 0a4994c
  - Fact: `scripts/harness` は `index.mjs`、`index.test.ts`、`harness.json`、`config.test.ts` と、`list/`、`path/`、`collect/`、`diff/`、`display/` の 5 つのディレクトリになった。
  - Why: ROADMAP 007 の ideas の「dir整理が必要」を満たした。
  - Then: なし (マージ済み)

## Verified

### harness-copy

- Plans:
  - `harness-transport`
  - `path-wording`
  - `ex-harness-structure`
- Result: しない — オーナーが dry run で一度確認済みのため

### usage-readme

- Plans:
  - `harness-transport`
  - `path-wording`
- Result: しない — オーナーが dry run で一度確認済みのため

### plan-skill

- Plans:
  - `harness-transport`
- Result: しない — オーナーが dry run で一度確認済みのため

### test-run

- Plans:
  - `harness-transport`
  - `path-wording`
  - `ex-harness-structure`
- Result: しない — オーナーが dry run で一度確認済みのため

### subagent-consult

- Plans:
  - `path-wording`
- Result: しない — オーナーが dry run で一度確認済みのため

### product-ready

- Plans:
  - `path-wording`
- Result: しない — オーナーが dry run で一度確認済みのため

### type-check

- Plans:
  - `path-wording`
- Result: しない — オーナーが dry run で一度確認済みのため
