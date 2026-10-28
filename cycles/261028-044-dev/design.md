# DESIGN 044

## Affected

### 01: ロードマップを `DEFINITION.md` の外のレイヤーとしてどう置くか

- なし

### 02: `propose` を捨て、3 つの問いをどこにも残さないと何が消えるか

- `scripts/harness/index.mjs` — この script が `.pi` の下を歩いて集めるため、消えた dir が収集の対象から外れる（`consult-5` は 40 ターンで 3 群への振り分けまで終わらなかったため、報告の事実に筆者の `grep` を足して書く）
- `lefthook.yaml` — pre-commit の format が `md` を対象にするため、消える `md` が検査の対象から外れ、直る `md` が対象になる

### 03: `brief` がロードマップをどの位置で見るか

- `lefthook.yaml` — pre-commit で `md` に format を実行するため
- `.oxfmtrc.json` — `oxfmt` の設定を持つため
- `package.json` — `format` と `format:check` の入口を持つため

### 04: `close` のどの位置で `cycles` を書くか

- なし

### 05: `product:ready` の対象をどう持ち、棚卸しで何を足すか

- `scripts/harness/harness.json` — `copy` に `scripts/product-ready` と `vitest.config.ts` を挙げているため
- `.pi/skills/adr/scripts/scaffold.mjs` — `cycles/` の dir 名を読んで番号を決めるため
- `scripts/product-ready/cli.test.ts` — `cli.mjs` の関数を読んで試すため
- `scripts/harness/config.test.ts` — `vitest.config.ts` の `testConfig` を読んで試すため
- `package.json` — `scripts/product-ready/index.mjs:73-85` が製品の clone で `scripts` を書き換えるため（この repo では変わらない）
- `vitest.starter.config.ts` — `scripts/product-ready/index.mjs:87-89` が製品の clone で消すため（この repo では変わらない）

## External

### 01: ロードマップを `DEFINITION.md` の外のレイヤーとしてどう置くか

- なし

### 02: `propose` を捨て、3 つの問いをどこにも残さないと何が消えるか

- なし

### 03: `brief` がロードマップをどの位置で見るか

- なし

### 04: `close` のどの位置で `cycles` を書くか

- なし

### 05: `product:ready` の対象をどう持ち、棚卸しで何を足すか

- なし

## `roadmap-docs`

### ADR & Where

- No: 01, 02, 03, 04
- Why: 4 つの entry が同じ入力（`ROADMAP.md` と `rules/` と `.pi/skills/` の文書）を読んで同じ出力（規則と手順の文書）を書くため、1 つの plan にまとまり、何も待たずに走る。
- Where: base（オーナーが見る物: 文面と実装）

### Goal

- `rules/roadmap.md` を読むと形と規則（`status` は `todo` / `wip` / `done`、`cycles` は複数の番号を許す）が載り、`ROADMAP.md` の表が 6 列になり、`grep` で `propose` を探しても `cycles/` の外には残らず、`brief` と `close` が新しいステージを持つ。

### Non-goal

- `scripts/product-ready/` のコードは触れない（05 の plan が持つため）。
- `close` の残り物の行き先 3 つは変えない（02 で動かさないと決めており、行き先を書き間違えやすいため）。
- `brief` の第 1 と第 2 ステージの中身を組み替えない（03 で現状維持と決めたため）。
- 形と規則を 2 枚に分けず、`brief` の第 1 ステージの前に置かず、`close` の第 9 ステージの直前には置かない（01 の案 A、03 の案 A、04 の案 A で採らなかったため）。
- `scripts/harness/harness.json` は触れない（ハーネス側の担当であり、本サイクルの対象外のため）。
- `package.json` に `version` を足さない（01 で紐づけないと決めたため）。
- `git tag` は打たない（同じ理由で）。

### Summary

- ロードマップの規則を 1 枚に書き、`ROADMAP.md` を 6 列に直して「`cycles` が空なら未着手」の読みを捨て、`propose` を消して 10 箇所の参照を直し、半適用の改名の参照を揃え、`rules/roadmap.md` の中に `product:ready` の差し替え先の雛形を置き、`brief` と `close` の手順を決まった形に書く。

### Paths

- `rules/roadmap.md`
- `ROADMAP.md`
- `rules/definition.rules.md`
- `rules/definition.format.md`
- `.pi/skills/adr/SKILL.md`
- `.pi/skills/brief/SKILL.md`
- `.pi/skills/close/SKILL.md`
- `.pi/skills/propose/SKILL.md`
- `.pi/skills/propose/references/tasks.md`
- `DEFINITION.md`
- `README.md`
- `README.ja.md`
- `AGENTS.md`

### Boundary

- Plans: `product-ready-replace` が `rules/roadmap.md` の中の雛形を使い、`README.md` と `README.ja.md` の `product:ready` の節を書くため、この plan の後に走る。
- External: なし

## `product-ready-replace`

### ADR & Where

- No: 05
- Why: 入力がコード（`scripts/product-ready/` と test）と雛形の出所（`rules/`）であり文書の plan と異なるため、`rules/roadmap.md` の雛形と `README.md` の節を読むため、`roadmap-docs` の後に走る別の plan に置く。
- Where: base（オーナーが見る物: 文面と実装）

### Goal

- 引数なしでは表示だけを行い、`--run` を付けると `cycles/` の dir が消え、`ROADMAP.md`、`DEFINITION.md` の `Product` と `What`、2 枚の README が雛形に置き換わり、`test` 系の 3 つの script から starter の設定が外れる。

### Non-goal

- `.pi/skills/` の手順は触れない（`roadmap-docs` の plan が持つため）。
- `scripts/harness/` は触れない（ハーネス側の担当であり、本サイクルの対象外のため）。
- `.github/workflows/pullfrog.yml` は消さない（05 の `Research & Trial` で確かめたとおり、どの repo でも動くため）。
- `scripts/harness/starter.json` は消さない（同期の外にあり、製品側で必要なため）。
- `.pi/extensions/consult/types.json` は雛形にしない（手で変える物として README に書くため）。
- 表に雛形の道の列は足さない（05 の案 D で採らなかったため）。

### Summary

- `product:ready` の表を消す物と雛形に差し替える物に分け、README の雛形を `rules/` に置き、4 つの差し替えを `--run` で実行する。

### Paths

- `scripts/product-ready/targets.mjs`
- `scripts/product-ready/index.mjs`
- `scripts/product-ready/cli.mjs`
- `scripts/product-ready/targets.test.ts`
- `scripts/product-ready/index.test.ts`
- `scripts/product-ready/cli.test.ts`
- `rules/readme.format.md`
- `README.md`
- `README.ja.md`

### Boundary

- Plans: `roadmap-docs` が作る `rules/roadmap.md` の中の雛形を使い、`README.md` と `README.ja.md` では `roadmap-docs` と違う節を書くため、その後に走る。両方 base なので、ファイルを分けたまま順序で競合を避ける。
- External: なし
